import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { generateAITrainingPlan } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  intensity: 'low' | 'medium' | 'high';
  duration: string;
  completed: boolean;
}

export const TrainingPlan: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [planTitle, setPlanTitle] = useState('Antrenman Planı');
  const [planFocus, setPlanFocus] = useState('Günlük elit egzersizler ve teknik odak noktaları.');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'plans'),
      where('athleteId', '==', user.uid),
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // En son planı al (manuel sıralama)
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const latestPlan: any = docs[0];
        
        setPlanTitle(latestPlan.name || 'Antrenman Planı');
        setPlanFocus(latestPlan.focus || 'Size özel hazırlanmış antrenman.');
        setTasks(latestPlan.tasks.map((t: any, i: number) => ({
          ...t,
          id: `task-${i}`,
          completed: false
        })));
      }
    });
  }, [user]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleGenerateAI = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const athleteInfo = `Email: ${user.email}, Hedef: Genel gelişim.`;
      const plan = await generateAITrainingPlan(athleteInfo);
      
      // Save locally to display immediately, or save to DB
      await addDoc(collection(db, 'plans'), {
        athleteId: user.uid,
        name: plan.name,
        focus: plan.focus,
        tasks: plan.tasks,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter">{planTitle}</h2>
          <p className="text-zinc-500 font-medium text-sm max-w-md">{planFocus}</p>
        </div>
        <button 
          onClick={handleGenerateAI}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Plan Oluştur
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => toggleTask(task.id)}
              className={`group flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${task.completed ? 'bg-zinc-50 border-zinc-100 opacity-60' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-400'}`}
            >
              <div className={`shrink-0 ${task.completed ? 'text-green-500' : 'text-zinc-300 group-hover:text-zinc-900'}`}>
                {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <p className={`font-bold tracking-tight ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-zinc-500 line-clamp-1">{task.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                    task.intensity === 'high' ? 'bg-red-100 text-red-600' : 
                    task.intensity === 'medium' ? 'bg-amber-100 text-amber-600' : 
                    'bg-zinc-100 text-zinc-500'
                  }`}>
                    {task.intensity === 'high' ? 'Yoğun' : task.intensity === 'medium' ? 'Orta' : 'Düşük'} • {task.duration}
                  </span>
                </div>
              </div>
              <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="bg-zinc-100/50 rounded-3xl p-8 border border-zinc-100 flex flex-col items-center gap-4 text-center">
         <div className="w-12 h-12 rounded-2xl bg-zinc-200 flex items-center justify-center">
            <Plus className="w-6 h-6 text-zinc-500" />
         </div>
         <div>
            <p className="font-bold">Özel egzersiz ekle</p>
            <p className="text-sm text-zinc-400">Antrenörün istediği iyileştirmeler burada otomatik görünür.</p>
         </div>
      </div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
