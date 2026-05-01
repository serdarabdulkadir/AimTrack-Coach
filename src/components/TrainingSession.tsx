import React, { useState } from 'react';
import { Target, X, CheckCircle2, ChevronRight, History, Play, Save, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TrainingSessionProps {
  athleteId: string;
  coachId?: string | null;
  athleteName?: string;
  onClose: () => void;
}

type TargetType = '18m-3-spot' | '70m-single';

export const TrainingSession: React.FC<TrainingSessionProps> = ({ athleteId, coachId, athleteName, onClose }) => {
  const [step, setStep] = useState<'setup' | 'active' | 'summary'>('setup');
  const [targetType, setTargetType] = useState<TargetType>('18m-3-spot');
  const [currentArrows, setCurrentArrows] = useState<string[]>([]);
  const [allEnds, setAllEnds] = useState<string[][]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const targetConfig = {
    '18m-3-spot': {
      name: '18m Salon (3 Spot)',
      buttons: ['X', '10', '9', '8', '7', '6', 'M'],
      arrowsPerEnd: 3,
      totalEnds: 10 // Typically 30 arrows (10 ends of 3)
    },
    '70m-single': {
      name: '70m Açık Hava (Tek Spot)',
      buttons: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'],
      arrowsPerEnd: 6,
      totalEnds: 6 // Typically 36 arrows (6 ends of 6) or 72
    }
  };

  const currentConfig = targetConfig[targetType];

  const handleAddArrow = (value: string) => {
    if (currentArrows.length < currentConfig.arrowsPerEnd) {
      setCurrentArrows([...currentArrows, value]);
    }
  };

  const handleRemoveLast = () => {
    setCurrentArrows(currentArrows.slice(0, -1));
  };

  const handleCompleteEnd = () => {
    if (currentArrows.length === currentConfig.arrowsPerEnd) {
      setAllEnds([...allEnds, currentArrows]);
      setCurrentArrows([]);
      
      if (allEnds.length + 1 === currentConfig.totalEnds) {
        setStep('summary');
      }
    }
  };

  const calculateTotal = (ends: string[][]) => {
    return ends.flat().reduce((sum, val) => {
      if (val === 'X') return sum + 10;
      if (val === 'M') return sum;
      return sum + parseInt(val);
    }, 0);
  };

  const handleFinishAndSave = async () => {
    setIsSaving(true);
    try {
      const totalScore = calculateTotal([...allEnds, currentArrows.length > 0 ? currentArrows : []]);
      await addDoc(collection(db, 'scores'), {
        athleteId,
        coachId: coachId || null,
        score: totalScore,
        label: `${currentConfig.name} Antrenman`,
        targetType,
        details: allEnds.map(end => end.join(',')),
        arrowCount: allEnds.flat().length,
        createdAt: serverTimestamp(),
        name: new Date().toLocaleDateString('tr-TR', { weekday: 'short' })
      });
      onClose();
    } catch (error) {
      console.error("Session save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotal = calculateTotal([...allEnds, currentArrows]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Target className="text-white w-6 h-6" />
           </div>
           <div>
              <h2 className="text-xl font-bold tracking-tight">Yeni Antrenman Seansı</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                {athleteName || 'Kendi Antrenmanım'}
              </p>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-zinc-50/50">
        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-6 md:space-y-10 py-4"
            >
              <div className="text-center px-4">
                 <h3 className="text-2xl md:text-3xl font-bold tracking-tighter italic uppercase mb-2">Hedef Türünü Seçin</h3>
                 <p className="text-zinc-500 text-sm md:text-base">Antrenmanın disiplinini ve puanlama sistemini belirleyin.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(targetConfig) as TargetType[]).map(key => (
                  <button 
                    key={key}
                    onClick={() => setTargetType(key)}
                    className={`p-8 rounded-[40px] border-2 text-left transition-all ${
                      targetType === key 
                        ? 'border-black bg-black text-white shadow-2xl shadow-black/20 translate-y-[-4px]' 
                        : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${targetType === key ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                       <Target className={`w-6 h-6 ${targetType === key ? 'text-white' : 'text-zinc-400'}`} />
                    </div>
                    <h4 className="text-xl font-bold mb-2">{targetConfig[key].name}</h4>
                    <p className={`text-xs font-medium italic ${targetType === key ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {targetConfig[key].arrowsPerEnd} ok x {targetConfig[key].totalEnds} seri
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-10">
                 <button 
                   onClick={() => setStep('active')}
                   className="flex items-center gap-3 bg-black text-white px-10 py-5 rounded-[32px] font-bold text-lg shadow-2xl shadow-black/20 hover:scale-105 transition-transform active:scale-95"
                 >
                   <Play className="w-5 h-5 fill-current" />
                   Antrenmanı Başlat
                 </button>
              </div>
            </motion.div>
          )}

          {step === 'active' && (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-10"
            >
              <div className="lg:col-span-2 space-y-4 md:space-y-8">
                {/* Scoring Display */}
                <div className="bg-zinc-900 rounded-3xl md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
                      <Target className="w-40 h-40" />
                   </div>
                   <div className="relative z-10 space-y-6 md:space-y-10">
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Seri {allEnds.length + 1}</p>
                            <h3 className="text-xl md:text-2xl font-bold">Puan Girdisi</h3>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Toplam Puan</p>
                            <p className="text-3xl md:text-4xl font-mono font-bold tracking-tighter">{currentTotal}</p>
                         </div>
                      </div>
 
                      <div className="flex gap-2 md:gap-4 min-h-[60px] md:min-h-[100px] items-center">
                        {Array.from({ length: currentConfig.arrowsPerEnd }).map((_, i) => (
                          <div 
                            key={i}
                            className={`flex-1 aspect-square rounded-2xl md:rounded-3xl flex items-center justify-center text-xl md:text-3xl font-bold transition-all border-2 ${
                              currentArrows[i] 
                                ? 'bg-white text-black border-white shadow-xl scale-105 md:scale-110' 
                                : 'bg-white/5 border-white/10 text-white/20'
                            }`}
                          >
                            {currentArrows[i] || '-'}
                          </div>
                        ))}
                      </div>
 
                      <div className="flex justify-between items-center bg-white/5 p-3 md:p-4 rounded-2xl">
                         <div className="flex gap-2">
                           <button 
                             onClick={handleRemoveLast}
                             disabled={currentArrows.length === 0}
                             className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-0"
                           >
                             <Trash2 className="w-5 h-5" />
                           </button>
                         </div>
                         <button 
                           onClick={handleCompleteEnd}
                           disabled={currentArrows.length !== currentConfig.arrowsPerEnd}
                           className="bg-white text-black px-6 md:px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform active:scale-95 disabled:opacity-20 flex items-center gap-2"
                         >
                           Seriyi Bitir
                           <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
 
                {/* Number Pad */}
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                  {currentConfig.buttons.map(btn => (
                    <button 
                      key={btn}
                      onClick={() => handleAddArrow(btn)}
                      disabled={currentArrows.length === currentConfig.arrowsPerEnd}
                      className={`h-20 md:h-24 rounded-2xl md:rounded-[32px] text-xl md:text-2xl font-bold shadow-sm transition-all active:scale-90 disabled:opacity-50 ${
                        btn === 'X' || btn === '10' || btn === '9' ? 'bg-yellow-400 text-black shadow-yellow-400/20' :
                        btn === '8' || btn === '7' ? 'bg-red-500 text-white shadow-red-500/20' :
                        btn === '6' || btn === '5' ? 'bg-sky-500 text-white shadow-sky-500/20' :
                        btn === '4' || btn === '3' ? 'bg-zinc-900 text-white shadow-black/20' :
                        btn === '2' || btn === '1' ? 'bg-white text-black border border-zinc-200' :
                        btn === 'M' ? 'bg-zinc-200 text-zinc-500' : 'bg-white text-black'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
 
              {/* History Sidebar */}
              <div className="space-y-6">
                 <div className="bg-white border border-zinc-100 p-6 md:p-8 rounded-3xl md:rounded-[40px] shadow-sm flex flex-col h-full max-h-[400px] md:max-h-[600px]">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                       <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-zinc-400" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Seri Geçmişi</h4>
                       </div>
                       <p className="text-[10px] font-bold text-zinc-300">{allEnds.length} / {currentConfig.totalEnds}</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 md:pr-2">
                       {allEnds.map((end, i) => (
                         <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-zinc-50 rounded-xl md:rounded-2xl">
                           <span className="text-[10px] font-bold text-zinc-400">#{i+1}</span>
                           <div className="flex gap-1.5 md:gap-2">
                              {end.map((arrow, j) => (
                                <span key={j} className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm">{arrow}</span>
                              ))}
                           </div>
                           <span className="text-[11px] md:text-xs font-bold font-mono">
                             {end.reduce((s, a) => s + (a === 'X' ? 10 : a === 'M' ? 0 : parseInt(a)), 0)}
                           </span>
                         </div>
                       ))}
                       {allEnds.length === 0 && (
                         <p className="text-center py-6 md:py-10 text-xs text-zinc-400 italic">Henüz seri yok.</p>
                       )}
                    </div>
 
                    <div className="mt-6 md:mt-8 border-t border-zinc-100 pt-4 md:pt-6">
                       <button 
                         onClick={() => setStep('summary')}
                         className="w-full bg-zinc-100 text-zinc-500 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm hover:bg-black hover:text-white transition-all active:scale-95"
                       >
                         Antrenmanı Sonlandır
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 'summary' && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto space-y-10 py-10"
            >
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                 </div>
                 <h3 className="text-4xl font-bold tracking-tighter italic uppercase">Antrenman Özeti</h3>
                 <p className="text-zinc-500 font-medium">Harika iş çıkardın. İşte performans verilerin.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                 <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-zinc-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Toplam Puan</p>
                    <p className="text-4xl md:text-5xl font-mono font-bold tracking-tighter">{currentTotal}</p>
                 </div>
                 <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-zinc-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Ok Adedi</p>
                    <p className="text-4xl md:text-5xl font-mono font-bold tracking-tighter">{allEnds.flat().length + currentArrows.length}</p>
                 </div>
              </div>

              <div className="bg-zinc-900 rounded-3xl md:rounded-[40px] p-6 md:p-8 text-white">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 italic">İstatistik Analizi</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Disiplin</span>
                           <span className="font-bold text-sm">{currentConfig.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">X Sayısı</span>
                           <span className="font-bold text-sm">{[...allEnds, currentArrows].flat().filter(x => x === 'X').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Ortalama / Ok</span>
                           <span className="font-mono font-bold text-emerald-400 text-lg">{((allEnds.flat().length + currentArrows.length) > 0 ? currentTotal / (allEnds.flat().length + currentArrows.length) : 0).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="h-[220px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(
                                [...allEnds, currentArrows].flat().reduce((acc: Record<string, number>, val) => {
                                  acc[val] = (acc[val] || 0) + 1;
                                  return acc;
                                }, {})
                              )
                              .map(([name, value]) => ({ name: String(name), value }))
                              .sort((a, b) => {
                                const order: Record<string, number> = { 'X': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, 'M': 0 };
                                return (order[b.name] || 0) - (order[a.name] || 0);
                              })}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {Object.entries(
                                [...allEnds, currentArrows].flat().reduce((acc: Record<string, number>, val) => {
                                  acc[val] = (acc[val] || 0) + 1;
                                  return acc;
                                }, {})
                              )
                              .map(([name, value]) => ({ name: String(name), value }))
                              .sort((a, b) => {
                                const order: Record<string, number> = { 'X': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, 'M': 0 };
                                return (order[b.name] || 0) - (order[a.name] || 0);
                              })
                              .map((entry, index) => {
                                let color = '#E4E4E7';
                                if (['X', '10', '9'].includes(entry.name)) color = '#FACC15';
                                else if (['8', '7'].includes(entry.name)) color = '#EF4444';
                                else if (['6', '5'].includes(entry.name)) color = '#0EA5E9';
                                else if (['4', '3'].includes(entry.name)) color = '#18181B';
                                return <Cell key={`cell-${index}`} fill={color} stroke={entry.name === '4' || entry.name === '3' ? '#333' : 'none'} />;
                              })}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ background: '#18181b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                            />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                  onClick={handleFinishAndSave}
                  disabled={isSaving}
                  className="w-full bg-black text-white py-5 rounded-3xl font-bold text-lg shadow-2xl shadow-black/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-6 h-6" />}
                   Verileri Profile Kaydet
                 </button>
                 <button 
                   onClick={onClose}
                   className="w-full py-4 text-zinc-400 font-bold hover:text-black transition-colors text-sm"
                 >
                   Kaydetmeden Kapat
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
