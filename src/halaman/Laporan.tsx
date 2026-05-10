import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaksi } from '../types';
import { formatRupiah, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Download, 
  Filter, 
  Calendar, 
  Search, 
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Laporan() {
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('tanggal', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaksi));
      setTransactions(data);
      
      // Calculate chart data for last 7 days
      const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
      const dailyData = days.map(day => {
        const dayTotal = data
          .filter(t => isSameDay(t.tanggal.toDate(), day))
          .reduce((sum, t) => sum + t.total, 0);
        
        return {
          name: format(day, 'EEE', { locale: id }),
          total: dayTotal,
          fullDate: format(day, 'dd MMM')
        };
      });
      setChartData(dailyData);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const exportToCSV = () => {
    const headers = ['ID', 'Tanggal', 'Deskripsi', 'Metode', 'Total'];
    const rows = transactions.map(t => [
      t.id,
      t.tanggal.toDate().toLocaleString('id-ID'),
      t.deskripsi.replace(/,/g, ';'),
      t.metodePembayaran,
      t.total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_ps_heaven_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = transactions.filter(t => 
    t.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan uppercase">Laporan Penjualan</h2>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-1">Audit & Revenue Analysis</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-8 py-3 bg-neon-green text-ps-dark font-black rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(57,255,20,0.2)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
        >
          <FileSpreadsheet className="w-5 h-5" /> EXPORT CSV
        </button>
      </div>

      {/* Chart Section */}
      <div className="bg-ps-card border border-white/5 rounded-3xl p-10">
        <div className="flex flex-col mb-10">
          <h3 className="text-sm font-black font-orbitron tracking-widest text-ps-neon uppercase">REVENUE FLOW</h3>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">LAST 7 OPERATIONAL DAYS</p>
        </div>
        
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                dy={15}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-ps-dark border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md bg-opacity-90">
                        <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-2">{payload[0].payload.fullDate}</p>
                        <p className="text-sm font-orbitron font-bold text-ps-neon">{formatRupiah(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="total" 
                radius={[6, 6, 0, 0]}
                animationDuration={2000}
                barSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === chartData.length - 1 ? '#00d4ff' : '#006FCD'} 
                    fillOpacity={index === chartData.length - 1 ? 1 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-ps-card border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-ps-dark/40">
          <h3 className="text-sm font-black font-orbitron tracking-widest text-white uppercase">Transaction Ledger</h3>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-ps-neon transition-colors" />
            <input
              type="text"
              placeholder="Searching ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-ps-dark border border-white/5 rounded-full focus:outline-none focus:border-ps-neon/50 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-700 text-white transition-all w-full md:w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] border-b border-white/5 bg-ps-dark/20">
                <th className="px-8 py-5">TXN ID</th>
                <th className="px-8 py-5">TIMESTAMP</th>
                <th className="px-8 py-5">ORDER DETAILS</th>
                <th className="px-8 py-5">CHANNEL</th>
                <th className="px-8 py-5 text-right">TOTAL AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-[10px] font-bold font-mono text-slate-700 group-hover:text-ps-neon transition-colors tracking-tight">#{t.id.slice(0, 12).toUpperCase()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-bold text-slate-300">
                        {t.tanggal?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        {t.tanggal?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-400 truncate max-w-[280px] uppercase tracking-tight">{t.deskripsi}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                        "w-2 h-2 rounded-full",
                        t.metodePembayaran === 'Cash' ? "bg-neon-green glow-green" : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      )}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.metodePembayaran}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="text-sm font-black font-orbitron text-white group-hover:text-ps-neon transition-colors lowercase">{formatRupiah(t.total)}</p>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-slate-700 text-xs font-black uppercase tracking-widest italic">Inventory Records Depleted</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
