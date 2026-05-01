import React, { useState, useEffect } from 'react';
import { Target, Weight, Ruler, Layers, ChevronRight, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const EquipmentProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [data, setData] = useState({
    riser: 'Hoyt Formula Xi',
    limbs: 'Velos Carbon 42lbs',
    drawWeight: '41.5',
    drawLength: '28.5',
    arrowModel: 'Easton X10 410',
    arrowWeight: '382',
    foc: '14.2',
    stabilizer: 'Win&Win HMC+ Tam Set'
  });

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const docRef = doc(db, 'equipment', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Equipment load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'equipment', user.uid), data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Equipment save error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-10 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-6 md:space-y-10">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter italic uppercase">Yay Verileri</h2>
        <p className="text-zinc-500 font-medium italic serif text-xs md:text-base">Tutarlı performans için hassas ekipman özellikleri.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Ana Kurulum</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500">Gövde (Riser)</label>
              <input 
                type="text" 
                value={data.riser} 
                onChange={(e) => setData({ ...data, riser: e.target.value })}
                className="bg-zinc-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-zinc-100 transition-all outline-none" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-zinc-500">Kanatlar (Limbs)</label>
              <input 
                type="text" 
                value={data.limbs} 
                onChange={(e) => setData({ ...data, limbs: e.target.value })}
                className="bg-zinc-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-zinc-100 transition-all outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-bold uppercase text-zinc-500">Çekiş Ağırlığı</label>
                 <div className="relative">
                   <input 
                     type="text" 
                     value={data.drawWeight} 
                     onChange={(e) => setData({ ...data, drawWeight: e.target.value })}
                     className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-zinc-100 outline-none" 
                   />
                   <span className="absolute right-4 top-3.5 text-xs font-bold text-zinc-400 uppercase">lbs</span>
                 </div>
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-bold uppercase text-zinc-500">Çekiş Mesafesi</label>
                 <div className="relative">
                   <input 
                     type="text" 
                     value={data.drawLength} 
                     onChange={(e) => setData({ ...data, drawLength: e.target.value })}
                     className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 font-medium focus:ring-2 ring-zinc-100 outline-none" 
                   />
                   <span className="absolute right-4 top-3.5 text-xs font-bold text-zinc-400 uppercase">in</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Ok Konfigürasyonu</h3>
            <div className="space-y-4">
               <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Ok Modeli</label>
                  <input 
                    type="text" 
                    value={data.arrowModel} 
                    onChange={(e) => setData({ ...data, arrowModel: e.target.value })}
                    className="bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-zinc-700" 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">Toplam Ağırlık (gn)</label>
                    <input 
                      type="text" 
                      value={data.arrowWeight} 
                      onChange={(e) => setData({ ...data, arrowWeight: e.target.value })}
                      className="bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-zinc-700" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-500">FOC %</label>
                    <input 
                      type="text" 
                      value={data.foc} 
                      onChange={(e) => setData({ ...data, foc: e.target.value })}
                      className="bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-zinc-700" 
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                   <Layers className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1">
                   <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Stabilizatör Seti</label>
                   <input 
                    type="text" 
                    value={data.stabilizer} 
                    onChange={(e) => setData({ ...data, stabilizer: e.target.value })}
                    className="w-full font-bold text-sm bg-transparent border-none outline-none focus:ring-1 ring-zinc-100 rounded p-1" 
                   />
                </div>
             </div>
             <p className="text-[10px] text-zinc-400 italic">Antrenman sırasında kullanılan ağırlık konfigürasyonu.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4 pt-4">
        {saveSuccess && (
          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold">Kaydedildi</span>
          </div>
        )}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-3xl font-bold shadow-xl shadow-black/10 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Yapılandırmayı Kaydet
        </button>
      </div>
    </div>
  );
};

