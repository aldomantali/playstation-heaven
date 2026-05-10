import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Keuangan } from '../types';
import { formatRupiah, cn } from '../lib/utils';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function KeuanganPage() {
  const [records, setRecords] = useState<Keuangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tipe: 'pengeluaran' as Keuangan['tipe'],
    keterangan: '',
    nominal: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'finance'), orderBy('tanggal', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Keuangan));
      setRecords(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nominal <= 0 || !formData.keterangan) return;
    
    try {
      await addDoc(collection(db, 'finance'), {
        ...formData,
        tanggal: serverTimestamp()
      });
      setFormData({ tipe: 'pengeluaran', keterangan: '', nominal: 0 });
    } catch (err) {
      alert('Gagal menambah catatan.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      await deleteDoc(doc(db, 'finance', id));
    }
  };

  const totalMasuk = records.filter(r => r.tipe === 'pemasukan').reduce((s, r) => s + r.nominal, 0);
  const totalKeluar = records.filter(r => r.tipe === 'pengeluaran').reduce((s, r) => s + r.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan uppercase">Keuangan</h2>
        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-1">Financial Ledger & Cashflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Cards */}
          <div className="bg-ps-card border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Cash Balance</p>
              <h3 className={cn(
                "text-3xl font-bold font-orbitron",
                saldo >= 0 ? "text-ps-neon" : "text-red-500"
              )}>{formatRupiah(saldo)}</h3>
            </div>
            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] rotate-12">
              <Wallet className="w-32 h-32" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-ps-card border border-white/5 rounded-2xl p-5 group hover:border-neon-green/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-neon-green/10 text-neon-green rounded-xl border border-neon-green/10 glow-green">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[8px] font-black text-neon-green uppercase tracking-widest">Inflow</span>
              </div>
              <p className="text-sm font-bold font-orbitron text-white">{formatRupiah(totalMasuk)}</p>
            </div>
            <div className="bg-ps-card border border-white/5 rounded-2xl p-5 group hover:border-red-500/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Outflow</span>
              </div>
              <p className="text-sm font-bold font-orbitron text-white">{formatRupiah(totalKeluar)}</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-ps-card border border-white/5 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xs font-black font-orbitron text-ps-neon tracking-widest mb-8 flex items-center gap-3">
              <Plus className="w-4 h-4" />
              NEW TRANSACTION
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex p-1 bg-ps-dark rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipe: 'pemasukan' })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase",
                    formData.tipe === 'pemasukan' ? "bg-neon-green text-ps-dark glow-green" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipe: 'pengeluaran' })}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase",
                    formData.tipe === 'pengeluaran' ? "bg-red-500 text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  Pengeluaran
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Memo / Description</label>
                <input
                  type="text"
                  placeholder="PURCHASE DETAILS..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/40 outline-none text-xs font-bold uppercase tracking-tight transition-all placeholder:text-slate-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (IDR)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/40 outline-none text-sm font-bold transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-ps-neon text-ps-dark font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,212,255,0.2)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest mt-2"
              >
                Log Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Records Table */}
        <div className="lg:col-span-8">
          <div className="bg-ps-card border border-white/5 rounded-3xl overflow-hidden h-full shadow-2xl flex flex-col">
            <div className="p-8 border-b border-white/5 bg-ps-dark/40">
              <h3 className="text-sm font-black font-orbitron tracking-widest text-white">REVENUE & EXPENSE LOG</h3>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-text-muted font-black uppercase tracking-[0.2em] bg-ps-dark/20">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Memo</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {r.tanggal?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-tight">{r.keterangan}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                          r.tipe === 'pemasukan' ? "bg-neon-green/10 text-neon-green border-neon-green/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {r.tipe}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className={cn("text-xs font-bold font-orbitron", r.tipe === 'pemasukan' ? "text-neon-green" : "text-red-500")}>
                          {r.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(r.nominal)}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center text-slate-700 text-xs font-black uppercase tracking-widest italic tracking-[0.2em]">Transaction Stream Empited</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
