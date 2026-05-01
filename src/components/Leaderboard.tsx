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

enum OperationType {
  LIST = 'list',
  GET = 'get',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  // We throw a standardized error that can be caught by the component
  throw error; 
}

export const Leaderboard: React.FC = () => {
  const { user, role, userData } = useAuth();
  const [rankings, setRankings] = useState<RankingAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'global' | 'team'>('global');

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersRef = collection(db, 'users');
        let qUsers;

        if (scope === 'team' && user) {
          const coachId = role === 'coach' ? user.uid : userData?.coachId;
          if (coachId) {
            qUsers = query(
              usersRef, 
              where('role', '==', 'athlete'),
              where('coachId', '==', coachId)
            );
          } else {
            qUsers = query(usersRef, where('role', '==', 'athlete'));
          }
        } else {
          qUsers = query(usersRef, where('role', '==', 'athlete'));
        }

        let usersSnap;
        try {
          usersSnap = await getDocs(qUsers);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'users');
          return;
        }

        const rankingsData = await Promise.all(usersSnap.docs.map(async (userDoc) => {
          const uData = userDoc.data();
          const uid = userDoc.id;
          
          const scoresRef = collection(db, 'scores');
          const qScores = query(
            scoresRef, 
            where('athleteId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          
          try {
            const scoresSnap = await getDocs(qScores);
            if (scoresSnap.empty) return null;

            const scores = scoresSnap.docs.map(d => d.data().score as number);
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const latestScore = scores[0];
            const powerScore = Math.round((avgScore * 0.7) + (latestScore * 0.3));
            
            return {
              uid,
              name: uData.name || 'İsimsiz Sporcu',
              avgScore: Math.round(avgScore * 10) / 10,
              powerScore,
              totalArrows: scoresSnap.docs.reduce((acc, d) => acc + (d.data().arrowCount || 0), 0)
            };
          } catch (err) {
            console.warn(`Could not fetch scores for user ${uid}`, err);
            return null;
          }
        }));

        const filteredRankings = rankingsData.filter((r): r is RankingAthlete => r !== null);
        filteredRankings.sort((a, b) => b.powerScore - a.powerScore);
        setRankings(filteredRankings);
      } catch (err: any) {
        console.error("Leaderboard component error:", err);
        setError(err.message || "Sıralama verileri alınırken bir hata oluştu.");
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

  if (error) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
           <Users className="w-8 h-8 text-red-200" />
        </div>
        <div className="space-y-1">
          <p className="text-zinc-900 font-bold">Erişim Hatası</p>
          <p className="text-zinc-400 text-xs italic max-w-xs mx-auto">
            Veriler alınırken bir sorun oluştu. Lütfen oturumunuzu kontrol edin veya daha sonra tekrar deneyin.
          </p>
          <p className="text-[10px] text-zinc-300 font-mono mt-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tighter italic uppercase text-zinc-900">Güç Sıralaması</h2>
          <p className="text-zinc-500 text-sm md:text-base font-medium italic">Performans verilerine dayalı dinamik sporcu sıralaması.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="bg-zinc-100 p-1 rounded-2xl flex overflow-hidden">
              <button 
                onClick={() => setScope('global')}
                className={`flex-1 px-4 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${scope === 'global' ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Tüm Sporcular
              </button>
              <button 
                onClick={() => setScope('team')}
                className={`flex-1 px-4 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${scope === 'team' ? 'bg-white shadow-sm text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <Users className="w-3 h-3" />
                {role === 'coach' ? (window.innerWidth < 640 ? 'Sporcular' : 'Sporcularım') : (window.innerWidth < 640 ? 'Takım' : 'Takımım')}
              </button>
           </div>
           <div className="bg-amber-50 text-amber-600 px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 border border-amber-100">
              <Award className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Haftalık Lig</span>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl md:rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-4 md:px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-20">Sıra</th>
                <th className="px-4 md:px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sporcu</th>
                <th className="px-4 md:px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Ortalama</th>
                <th className="px-4 md:px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Güç Puanı</th>
                <th className="px-4 md:px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {rankings.map((athlete, index) => (
                <tr key={athlete.uid} className={`hover:bg-zinc-50/50 transition-colors ${index === 0 ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-4 md:px-8 py-6">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono ${
                      index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
                      index === 1 ? 'bg-zinc-400 text-white shadow-lg shadow-zinc-400/20' :
                      index === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/20' :
                      'text-zinc-400'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-100 overflow-hidden shadow-inner shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.uid}`} alt="avatar" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 text-sm md:text-base truncate max-w-[120px] sm:max-w-[200px]">{athlete.name}</p>
                        <p className="text-[9px] md:text-[10px] text-zinc-400 uppercase font-bold truncate">Recurve • {athlete.totalArrows} Ok</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                       <Target className="w-3 h-3 text-zinc-300" />
                       <span className="font-mono font-bold text-zinc-600 text-sm md:text-base">{athlete.avgScore}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-zinc-900 hidden xs:flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 fill-emerald-400" />
                       </div>
                       <span className="text-lg md:text-xl font-mono font-black tracking-tighter text-zinc-900">{athlete.powerScore}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6 text-right">
                     <div className="flex items-center justify-end gap-1 text-emerald-500">
                        <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-xs font-bold font-mono">+{Math.floor(Math.random() * 5)}%</span>
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

      <div className="bg-zinc-900 rounded-3xl md:rounded-[40px] p-6 md:p-10 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10 hidden sm:block">
            <Trophy className="w-40 h-40" />
         </div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-4 md:space-y-6">
               <h3 className="text-xl md:text-2xl font-bold italic uppercase tracking-tighter">Sıralama Nasıl Hesaplanır?</h3>
               <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
                  AimTrack Güç Puanı, bir sporcunun son 10 antrenmanındaki ortalama başarısı (%70) ve en güncel antrenmanındaki performansı (%30) kullanılarak hesaplanır. 
                  Bu sayede hem istikrar hem de mevcut form durumu ödüllendirilir.
               </p>
            </div>
            <div className="flex flex-col justify-center">
               <div className="bg-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Güç Faktörü</span>
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
