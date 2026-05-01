import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Award, Settings as SettingsIcon, LogOut, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export const UserProfile: React.FC = () => {
  const { user, role, userData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || user?.displayName || '',
    branch: userData?.branch || 'Recurve',
    club: userData?.club || 'AimTrack Archery Club'
  });

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: formData.name });
      
      // Update Firestore user doc
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        branch: formData.branch,
        club: formData.club
      });

      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-100 overflow-hidden border-4 border-white shadow-xl">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="avatar" />
          </div>
          <div>
            {!editing ? (
              <h2 className="text-3xl font-bold tracking-tight">{formData.name || 'Sporcu'}</h2>
            ) : (
              <input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-3xl font-bold tracking-tight bg-zinc-50 border-none rounded-lg px-2 py-1 outline-none focus:ring-2 ring-zinc-100 w-full"
                placeholder="İsim giriniz"
              />
            )}
            <div className="flex items-center gap-2 text-zinc-500 mt-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
              Güncellendi
            </div>
          )}
          {!editing ? (
            <button 
              onClick={() => setEditing(true)}
              className="bg-black text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-black/10 hover:scale-105 transition-all"
            >
              Profili Düzenle
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setEditing(false)}
                className="bg-zinc-100 text-zinc-500 px-6 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-black text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-black/10 hover:scale-105 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Hesap Bilgileri
          </h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Branş</span>
                {editing ? (
                  <input 
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="text-sm font-bold bg-zinc-50 rounded-lg px-2 py-1 outline-none text-right"
                  />
                ) : (
                  <span className="text-sm font-bold">{formData.branch}</span>
                )}
             </div>
             <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Kulüp</span>
                {editing ? (
                  <input 
                    value={formData.club}
                    onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    className="text-sm font-bold bg-zinc-50 rounded-lg px-2 py-1 outline-none text-right"
                  />
                ) : (
                  <span className="text-sm font-bold">{formData.club}</span>
                )}
             </div>
             <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Profil Türü</span>
                <span className="text-sm font-bold capitalize bg-zinc-100 px-3 py-1 rounded-full">{role === 'coach' ? 'Antrenör' : 'Sporcu'}</span>
             </div>
             <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-500">Kayıt Tarihi</span>
                <span className="text-sm font-bold">{new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('tr-TR')}</span>
             </div>
          </div>
        </div>

        <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Başarılar & Özet
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-2xl font-bold">12</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Antrenman</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-2xl font-bold">284</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Ort. Puan</p>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Ayarlar</h3>
         <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors border-b border-zinc-100">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                     <SettingsIcon className="w-5 h-5 text-zinc-500" />
                  </div>
                  <span className="font-bold text-sm">Hesap Ayarları</span>
               </div>
               <Calendar className="w-4 h-4 text-zinc-300" />
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                     <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm">Oturumu Kapat</span>
               </div>
            </button>
         </div>
      </div>
    </div>
  );
};
