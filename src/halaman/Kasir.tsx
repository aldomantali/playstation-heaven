import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { cn } from '../lib/utils';
import { 
  Users, 
  UserPlus, 
  Pencil, 
  Trash2, 
  MapPin, 
  Shield, 
  X,
  Save,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function KasirPage() {
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    alamat: '',
    role: 'kasir' as User['role']
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as User));
      setCashiers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.uid), formData);
      } else {
        // In a real app, you'd call a cloud function to create the auth user
        // For this demo, we'll just alert that auth user creation is needed
        alert('Fitur tambah kasir memerlukan integrasi Cloud Functions untuk membuat akun Auth. Silakan gunakan kredensial default untuk demo ini.');
      }
      setShowModal(false);
    } catch (err) {
      alert('Gagal menyimpan data kasir.');
    }
  };

  const handleDelete = async (uid: string) => {
    if (confirm('Hapus data kasir ini?')) {
      await deleteDoc(doc(db, 'users', uid));
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      username: user.username,
      alamat: user.alamat || '',
      role: user.role
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan uppercase">Kelola Kasir</h2>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-1">Staff Access & Permissions</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setFormData({ nama: '', username: '', alamat: '', role: 'kasir' }); setShowModal(true); }}
          className="px-8 py-3 bg-ps-neon text-ps-dark font-black rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(0,212,255,0.2)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
        >
          <UserPlus className="w-5 h-5" /> REGISTER NEW STAFF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cashiers.map((cashier) => (
          <motion.div
            layout
            key={cashier.uid}
            className="bg-ps-card border border-white/5 rounded-3xl p-8 relative group overflow-hidden shadow-xl hover:border-ps-neon/30 transition-all"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
              <Users className="w-40 h-40" />
            </div>

            <div className="flex items-center gap-5 mb-8 relative">
              <div className="w-16 h-16 rounded-2xl bg-ps-dark flex items-center justify-center font-black text-2xl border border-white/5 text-ps-neon shadow-inner group-hover:glow-cyan transition-all duration-500">
                {cashier.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-black font-orbitron uppercase tracking-tight text-white mb-1">{cashier.nama}</h4>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] flex items-center gap-1.5 border",
                    cashier.role === 'admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-ps-neon/10 text-ps-neon border-ps-neon/20"
                  )}>
                    {cashier.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    {cashier.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative mb-8">
              <div className="flex items-center gap-4 group/item">
                <div className="p-2 bg-ps-dark rounded-lg border border-white/5 group-hover/item:border-ps-blue/30 transition-colors">
                  <UserIcon className="w-3.5 h-3.5 text-ps-blue" />
                </div>
                <span className="text-[10px] font-bold font-mono text-slate-500 lowercase tracking-tighter">@{cashier.username}</span>
              </div>
              <div className="flex items-center gap-4 group/item">
                <div className="p-2 bg-ps-dark rounded-lg border border-white/5 group-hover/item:border-ps-blue/30 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-ps-blue" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[200px]">{cashier.alamat || 'UNASSIGNED LOCATION'}</span>
              </div>
            </div>

            <div className="flex gap-3 relative">
              <button
                onClick={() => handleOpenEdit(cashier)}
                className="flex-1 bg-ps-dark border border-white/5 hover:border-ps-blue text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-inner"
              >
                <Pencil className="w-4 h-4" /> Edit Profile
              </button>
              {cashier.role !== 'admin' && (
                <button
                  onClick={() => handleDelete(cashier.uid)}
                  className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-ps-dark/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-ps-card border border-white/5 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-orbitron font-bold text-ps-neon uppercase tracking-tighter">
                    {editingUser ? 'Profile Config' : 'Staff Onboarding'}
                  </h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">Identity Access Management</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 bg-ps-dark text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/40 outline-none text-xs font-bold uppercase tracking-tight transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unique Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/40 outline-none text-xs font-bold lowercase transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Address</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/40 outline-none text-xs font-bold uppercase transition-all h-24 resize-none"
                    placeholder="Enter permanent address..."
                  />
                </div>
                {!editingUser && (
                  <div className="p-4 bg-ps-blue/5 border border-ps-blue/10 rounded-2xl">
                    <p className="text-[9px] text-slate-500 text-center leading-relaxed font-bold uppercase tracking-widest">
                      SYSTEM NOTE: New credentials fallback to: <span className="text-ps-neon">@psheaven123</span>
                    </p>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-ps-neon text-ps-dark font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,212,255,0.2)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest mt-4"
                >
                  <Save className="w-5 h-5" /> Commit Selection
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
