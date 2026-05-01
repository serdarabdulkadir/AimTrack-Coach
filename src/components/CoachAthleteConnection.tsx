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

  const cancelRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'requests', requestId), { status: 'cancelled' });
      // If was accepted, we might want to remove the coachId from athlete, 
      // but usually an 'accepted' request is just a log. 
      // For now, just change status.
    } catch (err) {
      console.error("Cancel request error:", err);
    }
  };

  const removeRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'requests', requestId), { status: 'removed' });
    } catch (err) {
      console.error("Remove request error:", err);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold mb-4">Yeni Sporcu Davet Et</h3>
        <form onSubmit={sendRequest} className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-zinc-400" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sporcu@email.com"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 ring-black/5 text-sm"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 whitespace-nowrap active:scale-95 shadow-lg shadow-black/5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Davet Gönder
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-[10px] md:text-xs font-bold uppercase tracking-wider ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Gönderilen İstekler</h3>
        <div className="grid grid-cols-1 gap-3">
          {requests.filter(r => r.status !== 'removed' && r.status !== 'cancelled' && r.status !== 'rejected').map(req => (
            <div key={req.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between group">
              <div>
                <p className="font-bold">{req.toEmail}</p>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">{req.status}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                <button 
                  onClick={() => req.status === 'pending' ? cancelRequest(req.id) : removeRequest(req.id)}
                  className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="İptal Et/Kaldır"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {requests.filter(r => r.status !== 'removed' && r.status !== 'cancelled' && r.status !== 'rejected').length === 0 && <p className="text-zinc-400 italic text-sm">Bekleyen aktif istek bulunmuyor.</p>}
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
    <div className="fixed inset-x-4 bottom-4 sm:bottom-8 sm:right-8 sm:left-auto z-50 pointer-events-none">
      <AnimatePresence>
        {requests.map(req => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="bg-zinc-900 text-white p-4 md:p-6 rounded-[24px] md:rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pointer-events-auto w-full max-w-sm sm:max-w-none ml-auto"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Yeni Antrenör İsteği</p>
                <p className="text-[11px] md:text-xs text-zinc-400 truncate">{req.fromName} sizi davet etti.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button 
                onClick={() => handleResponse(req.id, req.fromId, 'accepted')}
                className="flex-1 sm:flex-none p-2.5 sm:p-2 bg-green-600 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Check className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleResponse(req.id, req.fromId, 'rejected')}
                className="flex-1 sm:flex-none p-2.5 sm:p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center"
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
