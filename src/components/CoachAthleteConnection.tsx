import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Loader2, Search, Bell } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export const CoachTools: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = 'requests';
    const q = query(collection(db, 'requests'), where('fromId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Coach requests listener error:", error);
    });
  }, []);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsLoading(true);
    setMessage(null);

    try {
      // Check if athlete exists
      const athletesQuery = query(collection(db, 'users'), where('email', '==', email), where('role', '==', 'athlete'));
      const athleteSnapshot = await getDocs(athletesQuery);

      if (athleteSnapshot.empty) {
        setMessage({ type: 'error', text: 'Bu e-posta adresine sahip bir sporcu bulunamadı.' });
        setIsLoading(false);
        return;
      }

      await addDoc(collection(db, 'requests'), {
        fromId: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Baş Antrenör',
        toEmail: email,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setMessage({ type: 'success', text: 'İstek başarıyla gönderildi.' });
      setEmail('');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'İstek gönderilirken bir hata oluştu.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4">Yeni Sporcu Davet Et</h3>
        <form onSubmit={sendRequest} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-zinc-400" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sporcu@email.com"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-2.5 pl-12 pr-4 outline-none focus:ring-2 ring-black/5"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-black text-white px-6 py-2 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Davet Gönder
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-xs font-bold uppercase tracking-wider ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Gönderilen İstekler</h3>
        <div className="grid grid-cols-1 gap-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div>
                <p className="font-bold">{req.toEmail}</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">{req.status}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-400 animate-pulse' : req.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          ))}
          {requests.length === 0 && <p className="text-zinc-400 italic text-sm">Henüz bir istek gönderilmedi.</p>}
        </div>
      </div>
    </div>
  );
};

export const AthleteRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser?.email) return;
    const path = 'requests';
    const q = query(collection(db, 'requests'), where('toEmail', '==', auth.currentUser.email), where('status', '==', 'pending'));
    return onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Athlete requests listener error:", error);
    });
  }, []);

  const handleResponse = async (requestId: string, fromId: string, status: 'accepted' | 'rejected') => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'requests', requestId), { status });
      if (status === 'accepted') {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { coachId: fromId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {requests.map(req => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="bg-zinc-900 text-white p-6 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Yeni Antrenör İsteği</p>
              <p className="text-xs text-zinc-400">{req.fromName} sizi kadrosuna eklemek istiyor.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleResponse(req.id, req.fromId, 'accepted')}
                className="p-2 bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleResponse(req.id, req.fromId, 'rejected')}
                className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
