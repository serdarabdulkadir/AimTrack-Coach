import React, { useState } from 'react';
import { Target, ArrowRight, ShieldCheck, Mail, Lock, Loader2, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If user not found and it's a demo account, create it
        const isDemo = email === 'sporcu@aimtrack.com' || email === 'antrenor@aimtrack.com';
        
        if (isDemo && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const isCoach = email === 'antrenor@aimtrack.com';
          
          const name = isCoach ? 'Baş Antrenör (Demo)' : 'Mete Gazoz (Demo)';
          const role = isCoach ? 'coach' : 'athlete';

          await updateProfile(userCredential.user, { displayName: name });
          
          // Connect demo athlete to demo coach
          const userData: any = {
            uid: userCredential.user.uid,
            email,
            role,
            name,
            branch: 'Recurve',
            club: 'AimTrack Akademi',
            createdAt: new Date().toISOString()
          };

          if (email === 'sporcu@aimtrack.com') {
            userData.coachId = 'demo-coach-id'; // This is a placeholder, in real scenario we'd use actual UID
          }
          if (email === 'antrenor@aimtrack.com') {
            userData.uid = 'demo-coach-id'; // Force hardcoded ID for demo link
          }

          await setDoc(doc(db, 'users', userData.uid), userData);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Hata: Firebase panelinden Email/Password giriş yöntemini etkinleştirmeniz gerekmektedir.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Giriş başarısız. E-posta veya şifre hatalı.');
      } else {
        setError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex items-center justify-center p-0 md:p-6 lg:p-12">
      <div className="flex w-full max-w-7xl mx-auto bg-white shadow-2xl md:rounded-[40px] overflow-hidden min-h-screen md:min-h-0">
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-auto space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                <Target className="text-white w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">AimTrack.</h1>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 uppercase italic leading-tight">Puanını İyileştir.</h2>
              <p className="text-zinc-500 font-medium italic text-sm md:text-base">Profesyonel okçuluk takip ve analiz platformuna hoş geldiniz.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">E-Posta Adresi</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ornek@aimtrack.com"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 ring-black/5 outline-none transition-all font-medium"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Şifre</label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 ring-black/5 outline-none transition-all font-medium"
                    />
                 </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic">
                   {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {isLoading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
              </button>

              <div className="flex flex-col gap-4 mt-6">
                 <Link to="/register" className="w-full py-4 border border-zinc-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all">
                    <UserPlus className="w-5 h-5" />
                    Yeni Hesap Oluştur
                 </Link>
              </div>

              <div className="mt-8 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-3">Demo Giriş Bilgileri</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <p className="text-[10px] font-bold text-zinc-600">SPORCU</p>
                       <p className="text-[11px] font-mono select-all">sporcu@aimtrack.com</p>
                       <p className="text-[11px] font-mono text-zinc-400">sporcu123456</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-zinc-600">ANTRENÖR</p>
                       <p className="text-[11px] font-mono select-all">antrenor@aimtrack.com</p>
                       <p className="text-[11px] font-mono text-zinc-400">antrenor123456</p>
                    </div>
                 </div>
                 <p className="text-[9px] text-zinc-400 mt-3 font-medium italic">* Demo hesapları sistemde yoksa önce "Kayıt Ol" kısmından bu bilgilerle oluşturabilirsiniz.</p>
              </div>
            </form>

            <div className="pt-8 border-t border-zinc-100 flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
               </div>
               <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest leading-relaxed">
                  Verileriniz askeri düzeyde şifreleme ile korunmaktadır. Elit sporcular için özel altyapı.
               </p>
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:block relative flex-1 bg-black">
           <img 
              src="https://images.unsplash.com/photo-1511324591814-c1729586180b?q=80&w=2670&auto=format&fit=crop" 
              alt="Archery Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-24">
              <h3 className="text-white text-5xl font-bold tracking-tighter max-w-lg mb-4 italic">Tekniğini Kusursuzlaştır.</h3>
              <p className="text-zinc-400 text-xl font-medium serif italic">"Mükemmellik bir eylem değil, bir alışkanlıktır."</p>
           </div>
        </div>
      </div>
    </div>
  );
};
