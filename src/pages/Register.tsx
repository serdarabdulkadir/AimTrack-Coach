import React, { useState } from 'react';
import { Target, ArrowRight, Mail, Lock, User, Shield, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, { displayName: name });
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        role,
        name,
        branch: 'Recurve', // Default
        club: 'Genel',
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre en az 6 karakter olmalıdır.');
      } else {
        setError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex items-center justify-center p-0 md:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-7xl mx-auto bg-white shadow-2xl md:rounded-[40px] overflow-hidden min-h-screen md:min-h-0 flex flex-col md:flex-row"
      >
        <div className="flex-1 p-6 md:p-12 lg:p-24 space-y-8 flex flex-col justify-center overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                <Target className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tighter">AimTrack.</h1>
            </div>
            <Link to="/login" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 uppercase italic">Aramıza Katıl.</h2>
            <p className="text-zinc-500 font-medium italic text-sm">Gelişiminizi takip etmek için yeni bir hesap oluşturun.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
               <button 
                type="button"
                onClick={() => setRole('athlete')}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group ${role === 'athlete' ? 'border-black bg-zinc-50' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
               >
                 <Shield className={`w-6 h-6 ${role === 'athlete' ? 'text-black' : 'text-zinc-300'}`} />
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${role === 'athlete' ? 'text-black' : 'text-zinc-400'}`}>Sporcu</span>
               </button>
               <button 
                type="button"
                onClick={() => setRole('coach')}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group ${role === 'coach' ? 'border-black bg-zinc-50' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
               >
                 <Briefcase className={`w-6 h-6 ${role === 'coach' ? 'text-black' : 'text-zinc-300'}`} />
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${role === 'coach' ? 'text-black' : 'text-zinc-400'}`}>Antrenör</span>
               </button>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Tam Ad Soyad</label>
               <div className="relative">
                  <User className="absolute left-4 top-3 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ad Soyad"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 ring-black/5 outline-none transition-all font-medium text-sm"
                  />
               </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">E-Posta Adresi</label>
               <div className="relative">
                  <Mail className="absolute left-4 top-3 w-5 h-5 text-zinc-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@aimtrack.com"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 ring-black/5 outline-none transition-all font-medium text-sm"
                  />
               </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Şifre</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-3 w-5 h-5 text-zinc-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 ring-black/5 outline-none transition-all font-medium text-sm"
                  />
               </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 italic">
                  {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {isLoading ? 'Hesap Oluşturuluyor...' : 'Hemen Kayıt Ol'}
            </button>

            <p className="text-center text-xs text-zinc-400 font-medium italic">
              Zaten hesabınız var mı? <Link to="/login" className="text-black font-bold not-italic">Giriş Yap</Link>
            </p>
          </form>
        </div>

        <div className="hidden lg:block relative flex-1 bg-black">
           <img 
              src="https://images.unsplash.com/photo-1541533260371-b8f6730f5ca5?q=80&w=2574&auto=format&fit=crop" 
              alt="Archery Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-24 text-right">
              <h3 className="text-white text-5xl font-bold tracking-tighter max-w-lg mb-4 italic ml-auto uppercase">Yeni Bir Başlangıç.</h3>
              <p className="text-zinc-400 text-xl font-medium serif italic ml-auto">"Hedefe giden her yol, bir niyetle başlar."</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
