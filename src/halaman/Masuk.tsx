import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Gamepad2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Masuk() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mapping username to pseudo-email for Firebase Auth
    const email = `${username.toLowerCase()}@psheaven.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // If user doesn't exist, check if they are the default ones to seed
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        if ((username === 'admin' && password === 'admin123') || 
            (username === 'kasir1' && password === 'kasir123')) {
          try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const role = username === 'admin' ? 'admin' : 'kasir';
            const nama = username === 'admin' ? 'Administrator' : 'Kasir Utama';
            
            await setDoc(doc(db, 'users', userCred.user.uid), {
              uid: userCred.user.uid,
              nama: nama,
              username: username,
              role: role,
              alamat: 'Kantor Pusat'
            });
            // Auto login happens after creation
          } catch (createErr: any) {
            setError('Gagal menginisialisasi akun default.');
          }
        } else {
          setError('Username atau password salah.');
        }
      } else {
        setError('Terjadi kesalahan saat masuk.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ps-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-ps-blue/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-ps-neon/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-ps-card border border-white/5 rounded-3xl p-10 shadow-2xl relative">
          <div className="flex flex-col items-center mb-12">
            <div className="p-4 bg-ps-dark border border-ps-neon/20 rounded-2xl mb-6 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
              <Gamepad2 className="w-10 h-10 text-ps-neon glow-cyan" />
            </div>
            <h1 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan">
              PS HEAVEN
            </h1>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.4em] mt-2">Authentication Gateway</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Terminal Identity</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-ps-neon/50 transition-all text-sm font-bold placeholder:text-slate-700 tracking-wider"
                placeholder="USERNAME"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-ps-neon/50 transition-all text-sm font-bold placeholder:text-slate-700 tracking-widest pr-14"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-ps-neon transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ps-neon text-ps-dark hover:bg-ps-neon/80 active:scale-[0.98] transition-all py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,212,255,0.2)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Access'}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest leading-loose">
              Operational Hint:<br/>
              Admin: admin / admin123<br/>
              Kasir: kasir1 / kasir123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
