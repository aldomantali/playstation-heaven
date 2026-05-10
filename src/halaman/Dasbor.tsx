import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaksi, StatusRental } from '../types';
import { formatRupiah, cn } from '../lib/utils';
import { 
  TrendingUp, 
  Activity, 
  CreditCard, 
  Monitor, 
  Clock, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { startOfDay, endOfDay } from 'date-fns';

export default function Dasbor() {
  const [latestTransactions, setLatestTransactions] = useState<Transaksi[]>([]);
  const [rentals, setRentals] = useState<StatusRental[]>([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    totalRevenue: 0,
    todayCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Latest transactions
    const qLatest = query(collection(db, 'transactions'), orderBy('tanggal', 'desc'), limit(5));
    const unsubTrans = onSnapshot(qLatest, (snapshot) => {
      setLatestTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaksi)));
    });

    // Stats calculations
    const fetchStats = async () => {
      const today = startOfDay(new Date());
      const qToday = query(collection(db, 'transactions'), where('tanggal', '>=', today));
      const qAll = query(collection(db, 'transactions'));

      // Actually mapping is better in real-time if possible, but let's just listen to all transactions for a small app
      setLoading(false);
    };

    // TV Stats
    const unsubRentals = onSnapshot(collection(db, 'rentals'), (snapshot) => {
      setRentals(snapshot.docs.map(doc => doc.data() as StatusRental));
    });

    // Real-time stats listener (simplified)
    const unsubStats = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const allTrans = snapshot.docs.map(doc => doc.data() as Transaksi);
      const today = startOfDay(new Date());
      
      const todayTrans = allTrans.filter(t => t.tanggal.toDate() >= today);
      
      setStats({
        todayRevenue: todayTrans.reduce((sum, t) => sum + t.total, 0),
        totalRevenue: allTrans.reduce((sum, t) => sum + t.total, 0),
        todayCount: todayTrans.length
      });
      setLoading(false);
    });

    return () => {
      unsubTrans();
      unsubRentals();
      unsubStats();
    };
  }, []);

  const activeTVs = rentals.filter(r => r.status === 'aktif').length;

  const statCards = [
    { label: 'Pendapatan Hari Ini', value: formatRupiah(stats.todayRevenue), icon: TrendingUp, color: 'text-ps-neon', bg: 'bg-ps-neon/10' },
    { label: 'Pendapatan Total', value: formatRupiah(stats.totalRevenue), icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Transaksi Hari Ini', value: stats.todayCount, icon: Activity, color: 'text-ps-blue', bg: 'bg-ps-blue/10' },
    { label: 'TV Sedang Aktif', value: `${activeTVs} / ${rentals.length}`, icon: Monitor, color: 'text-green-400', bg: 'bg-green-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan">DASHBOARD</h2>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-1">Real-time Operations Overview</p>
        </div>
        <div className="bg-ps-card px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
          <Clock className="w-4 h-4 text-ps-neon" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-300">
            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-ps-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-ps-neon/30 transition-all"
          >
            <div className={cn("inline-flex p-3 rounded-xl mb-6 bg-ps-dark border border-white/5", card.color)}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">{card.label}</p>
            <h3 className="text-xl font-bold font-orbitron text-white leading-none">{card.value}</h3>
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-ps-blue/5 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:bg-ps-blue/10 transition-all"></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest Transactions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black font-orbitron tracking-widest text-ps-neon">RECENT TRANSACTIONS</h3>
            <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
              View History <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="bg-ps-card border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-ps-dark/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Method</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {latestTransactions.map((tr) => (
                  <tr key={tr.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-500">
                        {tr.tanggal?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-300 truncate max-w-[240px] uppercase tracking-tight">{tr.deskripsi}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                        tr.metodePembayaran === 'Cash' ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      )}>
                        {tr.metodePembayaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold font-orbitron text-white group-hover:text-ps-neon transition-colors">{formatRupiah(tr.total)}</p>
                    </td>
                  </tr>
                ))}
                {latestTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-600 text-xs font-bold uppercase tracking-widest italic">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Info / Tips */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-black font-orbitron tracking-widest text-ps-neon px-2">REMOTE TERMINAL STATUS</h3>
          <div className="space-y-4">
            {rentals.map((r) => (
              <div key={r.tvId} className="bg-ps-card border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-ps-neon/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all border border-white/5",
                    r.status === 'aktif' ? "bg-ps-dark text-neon-green border-neon-green/20 scale-110 glow-green" : "bg-ps-dark text-slate-700"
                  )}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{r.tvName}</p>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">{r.tipe}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                    r.status === 'aktif' ? "bg-neon-green/80 text-ps-dark border-neon-green" : "bg-ps-dark text-slate-600 border-white/5"
                  )}>
                    {r.status === 'aktif' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                  {r.status === 'aktif' && <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_#39ff14]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
