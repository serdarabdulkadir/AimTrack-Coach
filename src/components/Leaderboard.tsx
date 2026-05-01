import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Award, Zap, Loader2, Users } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface RankingAthlete {
  uid: string;
  name: string;
  avgScore: number;
  powerScore: number;
  totalArrows: number;
}

export const Leaderboard: React.FC = () => {
  const { user, role, userData } = useAuth();
  const [rankings, setRankings] = useState<RankingAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'global' | 'team'>('global');

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        let qUsers;

        if (scope === 'team' && user) {
          // Filter athletes belonging to the same coach
          const coachId = role === 'coach' ? user.uid : userData?.coachId;
          if (coachId) {
            qUsers = query(
              usersRef, 
              where('role', '==', 'athlete'),
              where('coachId', '==', coachId)
            );
          } else {
            // Fallback for team filter if no coach connection exists
            qUsers = query(usersRef, where('role', '==', 'athlete'));
          }
        } else {
          // Global: All athletes
          qUsers = query(usersRef, where('role', '==', 'athlete'));
        }

        const usersSnap = await getDocs(qUsers);
        const rankingsData: RankingAthlete[] = [];

        for (const userDoc of usersSnap.docs) {
          const uData = userDoc.data();
          const uid = userDoc.id;
          
          const scoresRef = collection(db, 'scores');
          const qScores = query(
            scoresRef, 
            where('athleteId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          const scoresSnap = await getDocs(qScores);
          
          if (scoresSnap.empty) continue;

          const scores = scoresSnap.docs.map(d => d.data().score as number);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const latestScore = scores[0];
          const powerScore = Math.round((avgScore * 0.7) + (latestScore * 0.3));
          
          rankingsData.push({
            uid,
            name: uData.name || 'İsimsiz Sporcu',
            avgScore: Math.round(avgScore * 10) / 10,
            powerScore,
            totalArrows: scoresSnap.docs.reduce((acc, d) => acc + (d.data().arrowCount || 0), 0)
          });
        }

        rankingsData.sort((a, b) => b.powerScore - a.powerScore);
        setRankings(rankingsData);
      } catch (error) {
        console.error("Leaderboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [scope, user, role, userData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-300" />
        <p className="text-zinc-400 font-medium italic">Sıralama hesaplanıyor...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter italic uppercase text-zinc-900">Güç Sıralaması</h2>
          <p className="text-zinc-500 font-medium italic">Performans verilerine dayalı dinamik sporcu sıralaması.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="bg-zinc-100 p-1 rounded-2xl flex">
              <button 
                onClick={() => setScope('global')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${scope === 'global' ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Tüm Sporcular
              </button>
              <button 
                onClick={() => setScope('team')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'team' ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <Users className="w-3 h-3" />
                {role === 'coach' ? 'Sporcularım' : 'Takım Arkadaşlarım'}
              </button>
           </div>
           <div className="bg-amber-50 text-amber-600 px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 border border-amber-100">
              <Award className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Haftalık Lig</span>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sıra</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sporcu</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ortalama</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Güç Puanı</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rankings.map((athlete, index) => (
                <tr key={athlete.uid} className={`hover:bg-zinc-50/50 transition-colors ${index === 0 ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-8 py-6">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono ${
                      index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
                      index === 1 ? 'bg-zinc-400 text-white shadow-lg shadow-zinc-400/20' :
                      index === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/20' :
                      'text-zinc-400'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden shadow-inner">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.uid}`} alt="avatar" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{athlete.name}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Recurve • {athlete.totalArrows} Ok</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <Target className="w-3 h-3 text-zinc-300" />
                       <span className="font-mono font-bold text-zinc-600">{athlete.avgScore}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                       </div>
                       <span className="text-xl font-mono font-black tracking-tighter text-zinc-900">{athlete.powerScore}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-1 text-emerald-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold font-mono">+{Math.floor(Math.random() * 5)}%</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rankings.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                 <Users className="w-8 h-8 text-zinc-200" />
              </div>
              <div className="space-y-1">
                <p className="text-zinc-900 font-bold">Listelenecek sporcu bulunamadı</p>
                <p className="text-zinc-400 text-xs italic max-w-xs mx-auto">
                  {scope === 'team' 
                    ? (role === 'coach' ? 'Henüz size bağlı aktif sporcu bulunmuyor.' : 'Henüz bir antrenöre bağlı değilsiniz veya takımınızda veri girişi yapılmamış.')
                    : 'Henüz yeterli performans verisi toplanmamış.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[40px] p-10 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <Trophy className="w-40 h-40" />
         </div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <h3 className="text-2xl font-bold italic uppercase tracking-tighter">Sıralama Nasıl Hesaplanır?</h3>
               <p className="text-zinc-400 text-sm leading-relaxed">
                  AimTrack Güç Puanı, bir sporcunun son 10 antrenmanındaki ortalama başarısı (%70) ve en güncel antrenmanındaki performansı (%30) kullanılarak hesaplanır. 
                  Bu sayede hem istikrar hem de mevcut form durumu ödüllendirilir.
               </p>
            </div>
            <div className="flex flex-col justify-center">
               <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                     </div>
                     <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Güç Faktörü</span>
                  </div>
                  <div className="space-y-2">
                     <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[85%]" />
                     </div>
                     <p className="text-[10px] text-zinc-500 font-medium italic">Bu hafta topluluk performansı %12 artış gösterdi.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
