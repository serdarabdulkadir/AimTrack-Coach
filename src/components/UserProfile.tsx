import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Award, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const UserProfile: React.FC = () => {
  const { user, role } = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-zinc-100 overflow-hidden border-4 border-white shadow-xl">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="avatar" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{user.displayName || 'Sporcu'}</h2>
          <div className="flex items-center gap-2 text-zinc-500 mt-1">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Hesap Bilgileri
          </h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Profil Türü</span>
                <span className="text-sm font-bold capitalize bg-zinc-100 px-3 py-1 rounded-full">{role === 'coach' ? 'Antrenör' : 'Sporcu'}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-sm text-zinc-500">Kayıt Tarihi</span>
                <span className="text-sm font-bold">{new Date(user.metadata.creationTime || Date.now()).toLocaleDateString('tr-TR')}</span>
             </div>
             <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-500">Durum</span>
                <span className="text-sm font-bold text-emerald-600">Aktif Profil</span>
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
