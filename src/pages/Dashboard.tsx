import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Calendar, ArrowRight, User as UserIcon, Settings, LogOut, Camera, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { TrainingPlan } from '../components/TrainingPlan';
import { EquipmentProfile } from '../components/EquipmentProfile';
import { DelayedMonitor } from '../components/DelayedMonitor';
import { UserProfile } from '../components/UserProfile';
import { CoachTools, AthleteRequests } from '../components/CoachAthleteConnection';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { generateAITrainingPlan, TrainingPlan as AITrainingPlan } from '../services/geminiService';
import { Sparkles, Brain, Send, CheckCircle2 } from 'lucide-react';

const data = [
  { name: 'Pzt', score: 285 },
  { name: 'Sal', score: 288 },
  { name: 'Çar', score: 282 },
  { name: 'Per', score: 291 },
  { name: 'Cum', score: 295 },
  { name: 'Cmt', score: 289 },
  { name: 'Paz', score: 298 },
];

export const Dashboard: React.FC = () => {
  const { user, role, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor' | 'plan' | 'equipment' | 'coach' | 'profile'>(role === 'coach' ? 'coach' : 'overview');
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [aiPlan, setAiPlan] = useState<AITrainingPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [allAnalyses, setAllAnalyses] = useState<any[]>([]);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [athleteScores, setAthleteScores] = useState<any[]>([]);
  const [newScore, setNewScore] = useState({ value: '', label: 'Antrenman' });

  useEffect(() => {
    if (!user || role !== 'athlete') return;
    const q = query(
      collection(db, 'scores'), 
      where('athleteId', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setScores(docs.slice(-7)); 
    });
  }, [user, role]);

  useEffect(() => {
    if (!selectedAthlete || role !== 'coach' || !user) return;
    const q = query(
      collection(db, 'scores'), 
      where('athleteId', '==', selectedAthlete.uid),
      where('coachId', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setAthleteScores(docs.slice(-7));
    }, (error) => {
      console.error("Coach athlete scores listener error:", error);
    });
  }, [selectedAthlete, role, user]);

  useEffect(() => {
    if (role !== 'athlete' || !user) return;
    const q = query(
      collection(db, 'analyses'), 
      where('athleteId', '==', user.uid),
    );
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort manually if index is not ready
        docs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setLatestAnalysis(docs[0]);
        setAllAnalyses(docs);
      }
    });
  }, [role, user]);

  const handleGenerateAIPlan = async () => {
    if (!selectedAthlete) return;
    setIsGenerating(true);
    try {
      const athleteInfo = `İsim: ${selectedAthlete.name}, Email: ${selectedAthlete.email}, Son Puanlar: 285, 288, 282, 291. Hedef: Elit seviyede tutarlılık.`;
      const plan = await generateAITrainingPlan(athleteInfo);
      setAiPlan(plan);
    } catch (error) {
      console.error("AI Plan generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedback || !selectedAthlete) return;
    try {
      await addDoc(collection(db, 'analyses'), {
        athleteId: selectedAthlete.uid,
        coachId: user?.uid,
        coachName: user?.displayName || 'Baş Antrenör',
        content: feedback,
        createdAt: serverTimestamp()
      });
      setSuccessMsg('Geri bildirim başarıyla kaydedildi!');
      setFeedback('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Feedback save error:", error);
    }
  };

  const handleLogScore = async () => {
    if (!newScore.value || !user) return;
    try {
      await addDoc(collection(db, 'scores'), {
        athleteId: user.uid,
        coachId: userData?.coachId || null,
        score: parseInt(newScore.value),
        label: newScore.label,
        name: new Date().toLocaleDateString('tr-TR', { weekday: 'short' }),
        createdAt: serverTimestamp()
      });
      setNewScore({ ...newScore, value: '' });
      setSuccessMsg('Puan kaydedildi!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (error) {
      console.error("Score logging error:", error);
    }
  };

  const handleSendPlan = async () => {
    if (!aiPlan || !selectedAthlete) return;
    try {
      await addDoc(collection(db, 'plans'), {
        athleteId: selectedAthlete.uid,
        coachId: user?.uid,
        name: aiPlan.name,
        focus: aiPlan.focus,
        tasks: aiPlan.tasks,
        createdAt: serverTimestamp()
      });
      setSuccessMsg('Plan başarıyla sporcuya iletildi!');
      setTimeout(() => {
        setSuccessMsg('');
        setAiPlan(null);
      }, 3000);
    } catch (error) {
      console.error("Plan send error:", error);
    }
  };

  useEffect(() => {
    if (role === 'coach') {
      setActiveTab('coach');
    } else {
      setActiveTab('overview');
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'coach' || !user) return;
    const athletePath = 'users'; // Base path for the query
    const q = query(collection(db, 'users'), where('coachId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setAthletes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Dashboard athletes listener error:", error);
    });
  }, [role, user]);

  return (
    <div className="relative flex h-screen bg-[#fcfcfc] overflow-hidden font-sans">
      <AthleteRequests />
      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-200 flex flex-col bg-white">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
              <Target className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AimTrack.</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-1">
          {role === 'athlete' && (
            <>
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Genel Bakış</span>
              </button>
              <button 
                onClick={() => setActiveTab('monitor')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitor' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <Camera className="w-5 h-5" />
                <span>Gecikmeli İzleme</span>
              </button>
              <button 
                onClick={() => setActiveTab('plan')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'plan' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <Calendar className="w-5 h-5" />
                <span>Antrenman Planı</span>
              </button>
              <button 
                onClick={() => setActiveTab('equipment')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'equipment' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <Settings className="w-5 h-5" />
                <span>Yay Verileri</span>
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Profilim</span>
              </button>
            </>
          )}
          
          {role === 'coach' && (
            <>
              <button 
                onClick={() => setActiveTab('coach')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'coach' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Sporcularım</span>
              </button>
              <button 
                onClick={() => setActiveTab('monitor')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitor' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <Camera className="w-5 h-5" />
                <span>Gecikmeli İzleme</span>
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-zinc-100 text-black shadow-sm font-medium' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
              >
                <UserIcon className="w-5 h-5" />
                <span>Profilim</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'athlete'}`} alt="avatar" />
                </div>
                <div>
                   <p className="text-sm font-bold truncate w-32">{user?.displayName || (user?.email === 'sporcu@archelite.com' ? 'Elit Sporcu' : 'Baş Antrenör')}</p>
                   <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{role === 'coach' ? 'Antrenör' : 'Sporcu'}</p>
                </div>
             </div>
             <button 
              onClick={() => auth.signOut()}
              className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 hover:text-red-500 text-sm font-medium transition-colors"
             >
                <LogOut className="w-4 h-4" />
                Çıkış Yap
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && role === 'athlete' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-10 space-y-10"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-bold tracking-tighter text-zinc-900 mb-2 italic uppercase">Performans Takibi</h2>
                  <p className="text-zinc-500 font-medium italic serif">"Odaklandığın an, hedefine ulaştığın andır."</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Ortalama Puan</p>
                    <p className="text-3xl font-mono font-medium">
                      {scores.length > 0 
                        ? (scores.reduce((acc, s) => acc + s.score, 0) / scores.length).toFixed(1) 
                        : '0.0'}
                    </p>
                  </div>
                  <div className="w-[1px] h-10 bg-zinc-200 mt-2" />
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">En İyi (PB)</p>
                    <p className="text-3xl font-mono font-medium">
                      {scores.length > 0 
                        ? Math.max(...scores.map(s => s.score)) 
                        : '0'}
                    </p>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold">Antrenman İstikrarı</h3>
                      <select className="bg-zinc-100 border-none rounded-lg px-3 py-1 text-xs font-bold text-zinc-600 focus:ring-0">
                         <option>Son 7 Gün</option>
                         <option>Son 30 Gün</option>
                      </select>
                   </div>
                   <div className="h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scores.length > 0 ? scores : data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#aaa' }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#aaa' }}
                            domain={[270, 305]}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#000" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Yeni Puan Kaydı</h3>
                    <div className="flex flex-col gap-4">
                       <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={newScore.value}
                            onChange={(e) => setNewScore({ ...newScore, value: e.target.value })}
                            placeholder="Puan"
                            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl p-4 outline-none focus:ring-2 ring-black/5"
                          />
                          <select 
                            value={newScore.label}
                            onChange={(e) => setNewScore({ ...newScore, label: e.target.value })}
                            className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 outline-none font-bold text-zinc-600 text-xs"
                          >
                             <option>Antrenman</option>
                             <option>Yarışma</option>
                          </select>
                       </div>
                       <button 
                         onClick={handleLogScore}
                         className="bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg text-sm"
                       >
                         Puanı Kaydet
                       </button>
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded-3xl p-8 text-white">
                    <div className="flex items-center gap-2 mb-6">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-bold uppercase italic tracking-tighter">Elite Durumu</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold uppercase text-zinc-500 mb-2">
                           <span>Pro Seviyesine İlerleme</span>
                           <span>92%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                           <div className="w-[92%] h-full bg-white" />
                        </div>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">
                        Ulusal elemelerde şu an 4. sıradasınız. Elit tier analizini açmak için 290+ ortalamayı koruyun.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-bold">Antrenör Geri Bildirimi</h3>
                       {allAnalyses.length > 1 && (
                         <button 
                           onClick={() => setShowAnalysisHistory(true)}
                           className="text-[10px] font-bold uppercase text-zinc-400 hover:text-black transition-colors underline underline-offset-4"
                         >
                           Geçmiş
                         </button>
                       )}
                    </div>
                    {latestAnalysis ? (
                      <div className="flex items-start gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                            <Target className="w-6 h-6 text-zinc-400" />
                         </div>
                         <div>
                            <p className="text-sm font-medium italic serif text-zinc-800">"{latestAnalysis.content}"</p>
                            <p className="text-[10px] mt-2 font-bold text-zinc-400 uppercase tracking-widest">Antrenör {latestAnalysis.coachName} • {latestAnalysis.createdAt?.toDate().toLocaleDateString()}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                         <p className="text-zinc-400 text-xs italic">Henüz bir analiz bulunmuyor.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-950 text-emerald-50 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-24 h-24 rotate-12" />
                     </div>
                     <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4">Kulüp Haberleri</h3>
                     <div className="space-y-4 relative z-10">
                        <div className="border-l-2 border-emerald-500 pl-4 py-1">
                           <p className="text-xs font-bold font-mono">05.05.2024</p>
                           <p className="text-sm font-medium">Bahar Kupası elemeleri haftaya başlıyor. Ekipman kontrollerini unutmayın.</p>
                        </div>
                        <div className="border-l-2 border-emerald-800 pl-4 py-1">
                           <p className="text-xs font-bold font-mono text-emerald-700">01.05.2024</p>
                           <p className="text-sm font-medium opacity-60">Yeni AimTrack sistemi aktif edildi. Tekniğinizi videodan izlemeye başlayın.</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Analysis History Modal */}
              <AnimatePresence>
                {showAnalysisHistory && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                      <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                         <div>
                            <h3 className="text-2xl font-bold tracking-tight">Analiz Geçmişi</h3>
                            <p className="text-xs text-zinc-500 font-medium">Antrenörünüzün tüm değerlendirmeleri</p>
                         </div>
                         <button 
                           onClick={() => setShowAnalysisHistory(false)}
                           className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors"
                         >
                            <LogOut className="w-4 h-4 rotate-180" />
                         </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 space-y-6">
                         {allAnalyses.map((analysis, idx) => (
                           <div key={analysis.id} className="flex gap-6 items-start">
                              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400 text-xs font-bold">
                                 {allAnalyses.length - idx}
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm leading-relaxed text-zinc-700 italic">"{analysis.content}"</p>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{analysis.coachName}</span>
                                   <span className="text-[10px] text-zinc-300">•</span>
                                   <span className="text-[10px] text-zinc-400">{analysis.createdAt?.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                              </div>
                           </div>
                         ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'monitor' && (
            <motion.div 
              key="monitor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <DelayedMonitor />
            </motion.div>
          )}

          {activeTab === 'plan' && role === 'athlete' && (
            <motion.div 
              key="plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TrainingPlan />
            </motion.div>
          )}

          {activeTab === 'equipment' && role === 'athlete' && (
            <motion.div 
              key="equipment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <EquipmentProfile />
            </motion.div>
          )}
          
          {activeTab === 'coach' && role === 'coach' && (
            <motion.div 
              key="coach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 space-y-10"
            >
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-bold tracking-tighter">
                      {selectedAthlete ? (
                        <button onClick={() => setSelectedAthlete(null)} className="flex items-center gap-2 hover:text-zinc-500 transition-colors">
                           <ChevronRight className="w-6 h-6 rotate-180" />
                           {selectedAthlete.name || selectedAthlete.email}
                        </button>
                      ) : 'Sporcularım'}
                    </h2>
                    <p className="text-zinc-500 font-medium font-mono font-bold uppercase tracking-widest text-[10px]">
                      {selectedAthlete ? 'Sporcu Detayları ve Analiz' : `Aktif Liste (${athletes.length})`}
                    </p>
                 </div>
              </div>

              {selectedAthlete ? (
                <div className="grid grid-cols-3 gap-6">
                   <div className="col-span-2 space-y-6">
                      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold">Haftalık Performans</h3>
                            <div className="flex gap-2">
                               <button 
                                 onClick={handleGenerateAIPlan}
                                 disabled={isGenerating}
                                 className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50"
                               >
                                 <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                 {isGenerating ? 'Zekai Analiz Ediyor...' : 'Zekai Planı Oluştur'}
                               </button>
                            </div>
                         </div>
                         <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={athleteScores.length > 0 ? athleteScores : data}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                 <Tooltip />
                                 <Line type="monotone" dataKey="score" stroke="#000" strokeWidth={2} dot={false} />
                               </LineChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      {aiPlan && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-zinc-50 border-2 border-dashed border-zinc-200 p-8 rounded-[32px] space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                                  <Brain className="text-white w-5 h-5" />
                               </div>
                               <div>
                                  <h4 className="font-bold text-xl">{aiPlan.name}</h4>
                                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{aiPlan.focus}</p>
                               </div>
                            </div>
                            <button 
                              onClick={handleSendPlan}
                              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm hover:translate-y-[-2px] transition-all shadow-lg active:scale-95"
                            >
                               <Send className="w-4 h-4" />
                               Sporcuya Gönder
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {aiPlan.tasks.map((task, idx) => (
                              <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-100 space-y-3">
                                <input 
                                  className="w-full font-bold text-sm bg-zinc-50 px-2 py-1 rounded border-none outline-none focus:ring-1 ring-black/10"
                                  value={task.title}
                                  onChange={(e) => {
                                    const newTasks = [...aiPlan.tasks];
                                    newTasks[idx].title = e.target.value;
                                    setAiPlan({ ...aiPlan, tasks: newTasks });
                                  }}
                                />
                                <div className="flex justify-between items-center">
                                  <select 
                                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border-none outline-none ${
                                      task.intensity === 'high' ? 'bg-red-50 text-red-600' : 
                                      task.intensity === 'medium' ? 'bg-orange-50 text-orange-600' : 
                                      'bg-emerald-50 text-emerald-600'
                                    }`}
                                    value={task.intensity}
                                    onChange={(e) => {
                                       const newTasks = [...aiPlan.tasks];
                                       newTasks[idx].intensity = e.target.value as any;
                                       setAiPlan({ ...aiPlan, tasks: newTasks });
                                    }}
                                  >
                                    <option value="high">Yoğun</option>
                                    <option value="medium">Orta</option>
                                    <option value="low">Düşük</option>
                                  </select>
                                  <input 
                                    className="text-[10px] font-bold text-zinc-400 font-mono italic bg-transparent border-none text-right w-20 outline-none"
                                    value={task.duration}
                                    onChange={(e) => {
                                       const newTasks = [...aiPlan.tasks];
                                       newTasks[idx].duration = e.target.value;
                                       setAiPlan({ ...aiPlan, tasks: newTasks });
                                    }}
                                  />
                                </div>
                                <textarea 
                                  className="w-full text-xs text-zinc-500 line-clamp-2 md:line-clamp-none bg-zinc-50 px-2 py-1 rounded border-none outline-none focus:ring-1 ring-black/10 min-h-[60px]"
                                  value={task.description}
                                  onChange={(e) => {
                                     const newTasks = [...aiPlan.tasks];
                                     newTasks[idx].description = e.target.value;
                                     setAiPlan({ ...aiPlan, tasks: newTasks });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {successMsg && (
                        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                           <CheckCircle2 className="w-5 h-5" />
                           <span className="text-sm font-bold">{successMsg}</span>
                        </div>
                      )}

                      <div className="bg-white p-8 rounded-3xl border border-zinc-200">
                         <h3 className="text-lg font-bold mb-4">Geri Bildirim ve Analiz</h3>
                         <textarea 
                           value={feedback}
                           onChange={(e) => setFeedback(e.target.value)}
                           className="w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-100 min-h-[120px] outline-none focus:ring-2 ring-black/5 text-sm"
                           placeholder="Sporcu için performans değerlendirmesi yazın..."
                         />
                         <div className="flex items-center justify-between mt-4">
                            <p className="text-[10px] text-zinc-400 font-medium">Bu yorum sporcunun 'Genel Bakış' sayfasında görünecektir.</p>
                            <button 
                              onClick={handleSaveFeedback}
                              className="bg-black text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                            >
                              Kaydet ve Paylaş
                            </button>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="bg-zinc-900 text-white p-8 rounded-3xl">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Sporcu Bilgisi</p>
                         <p className="text-sm font-bold mb-1">{selectedAthlete.email}</p>
                         <p className="text-xs text-zinc-400">Üyelik: {selectedAthlete.createdAt ? new Date(selectedAthlete.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                   <div className="col-span-2 space-y-8">
                      <div className="grid grid-cols-3 gap-4">
                         <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Toplam Sporcu</p>
                            <p className="text-3xl font-bold">{athletes.length}</p>
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Team Avg</p>
                            <p className="text-3xl font-bold">288.4</p>
                         </div>
                         <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-lg">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Aktif Planlar</p>
                            <p className="text-3xl font-bold">12</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Sporcu Listesi</h3>
                         <div className="grid grid-cols-1 gap-4">
                            {athletes.map(athlete => (
                              <div 
                                key={athlete.id} 
                                onClick={() => setSelectedAthlete(athlete)}
                                className="bg-white border border-zinc-200 p-6 rounded-3xl flex items-center justify-between hover:border-zinc-400 hover:shadow-lg transition-all cursor-pointer group"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden">
                                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.uid}`} alt="athlete" />
                                    </div>
                                    <div>
                                       <p className="font-bold group-hover:text-black">{athlete.name || athlete.email}</p>
                                       <p className="text-xs text-zinc-400">Recurve • Elit Sporcu</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <div className="text-right">
                                       <p className="text-xs font-bold font-mono">284.2</p>
                                       <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Son Puan</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors" />
                                 </div>
                              </div>
                            ))}
                            {athletes.length === 0 && (
                              <div className="p-10 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                                 <p className="text-zinc-400 text-sm">Henüz kadronuzda sporcu bulunmuyor.</p>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <CoachTools />
                      
                      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                         <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Analiz İpuçları</h3>
                         <div className="space-y-4">
                            <div className="flex gap-4">
                               <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                               </div>
                               <p className="text-xs text-zinc-600 leading-relaxed">
                                  Haftalık ortalaması %2'den fazla düşen sporcular için <strong>Teknik Analiz</strong> planı önerilir.
                               </p>
                            </div>
                            <div className="flex gap-4">
                               <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                  <Brain className="w-4 h-4 text-zinc-400" />
                               </div>
                               <p className="text-xs text-zinc-600 leading-relaxed">
                                  Zekai'yi kullanarak sporcularınızın zayıf yönlerine odaklanan antrenmanlar oluşturun.
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UserProfile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
