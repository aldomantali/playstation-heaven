import React, { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  setDoc,
  deleteDoc,
  query,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useCart } from '../konteks/CartContext';
import { StatusRental, TransaksiItem } from '../types';
import { formatRupiah, cn } from '../lib/utils';
import { Monitor, Play, Square, Timer, RefreshCcw, ShoppingCart, Trash2, CreditCard, Banknote, Plus, Minus, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInSeconds } from 'date-fns';

const INITIAL_TV_DATA: StatusRental[] = [
  { tvId: 'tv1', tvName: 'TV 01', tipe: 'PS4', status: 'tersedia', pricePerHour: 8000 },
  { tvId: 'tv2', tvName: 'TV 02', tipe: 'PS4', status: 'tersedia', pricePerHour: 8000 },
  { tvId: 'tv3', tvName: 'TV 03', tipe: 'PS5', status: 'tersedia', pricePerHour: 12000 },
  { tvId: 'tv4', tvName: 'TV 04', tipe: 'PS5', status: 'tersedia', pricePerHour: 12000 },
];

export default function Rental() {
  const [rentals, setRentals] = useState<StatusRental[]>([]);
  const { cart, addToCart, removeFromCart, clearCart, updateQty } = useCart();
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // IoT Mock Function
  const nyalakanIoT = async (tvName: string, action: 'ON' | 'OFF') => {
    console.log(`[IoT Service] Hardware Sinyal: ${action} - ${tvName}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rentals'), (snapshot) => {
      if (snapshot.empty) {
        // Initialize if empty
        INITIAL_TV_DATA.forEach(async (tv) => {
          await setDoc(doc(db, 'rentals', tv.tvId), tv);
        });
      } else {
        const data = snapshot.docs.map(doc => doc.data() as StatusRental);
        setRentals(data.sort((a, b) => a.tvId.localeCompare(b.tvId)));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStart = async (tv: StatusRental) => {
    await nyalakanIoT(tv.tvName, 'ON');
    await updateDoc(doc(db, 'rentals', tv.tvId), {
      status: 'aktif',
      startTime: serverTimestamp()
    });
  };

  const handleStop = async (tv: StatusRental) => {
    if (!tv.startTime) return;

    const start = tv.startTime.toDate();
    const end = new Date();
    const seconds = differenceInSeconds(end, start);
    const hours = Math.max(seconds / 3600, 0.1); // min 0.1 hr
    const totalHarga = Math.ceil(hours * tv.pricePerHour);

    await nyalakanIoT(tv.tvName, 'OFF');

    // Add to shared cart
    const newItem: TransaksiItem = {
      id: `${tv.tvId}-${Date.now()}`,
      nama: `Rental ${tv.tvName} (${tv.tipe})`,
      harga: totalHarga,
      qty: 1,
      tipe: 'rental'
    };
    addToCart(newItem);

    // Reset TV
    await updateDoc(doc(db, 'rentals', tv.tvId), {
      status: 'tersedia',
      startTime: null
    });
  };

  const processPayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
      await addDoc(collection(db, 'transactions'), {
        deskripsi: cart.map(i => `${i.nama} x${i.qty}`).join(', '),
        total,
        metodePembayaran: paymentMethod,
        tanggal: serverTimestamp(),
        kasirId: auth.currentUser?.uid,
        items: cart
      });

      // Clear cart
      clearCart();
      alert('Pembayaran Berhasil!');
    } catch (err) {
      console.error(err);
      alert('Gagal memproses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-ps-neon">RENTAL PS</h2>
          <p className="text-gray-400">Kelola status TV dan waktu bermain</p>
        </div>
        <div className="bg-ps-card px-5 py-2.5 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest flex gap-6 shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-neon-green rounded-full glow-green animate-pulse"></div>
            <span className="text-white">Active session</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2.5 h-2.5 bg-slate-700 rounded-full border border-white/5"></div>
            <span>Standby</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {rentals.map((tv) => (
            <TVCard key={tv.tvId} tv={tv} onStart={handleStart} onStop={handleStop} />
          ))}
        </div>

        {/* Keranjang Transaksi (POS Panel) */}
        <div className="lg:col-span-4 bg-ps-card border border-white/5 p-8 h-fit sticky top-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] transform translate-x-4 -translate-y-4">
            <ShoppingCart className="w-40 h-40" />
          </div>
          <div className="flex items-center gap-4 mb-10 relative">
            <div className="p-3 bg-ps-dark rounded-xl border border-white/5 text-ps-neon">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black font-orbitron text-white tracking-widest uppercase mb-1">Terminal POS</h3>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Active Transaction Stream</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-auto mb-6 pr-2 custom-scrollbar">
            <AnimatePresence>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8 italic text-sm">Belum ada transaksi</p>
              ) : (
                cart.map((item) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id}
                    className="flex justify-between items-center bg-ps-dark/50 p-3 rounded-xl border border-ps-blue/5"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold truncate max-w-[120px]">{item.nama}</p>
                      <p className="text-xs text-ps-neon">{formatRupiah(item.harga * item.qty)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mr-3">
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-ps-blue/10 flex items-center justify-center hover:bg-ps-blue transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-ps-blue/10 flex items-center justify-center hover:bg-ps-blue transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {cart.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-ps-blue/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Pembayaran</span>
                <span className="text-2xl font-bold text-ps-neon">
                  {formatRupiah(cart.reduce((sum, i) => sum + i.harga, 0))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('Cash')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    paymentMethod === 'Cash' 
                      ? "bg-ps-blue border-ps-neon shadow-lg" 
                      : "bg-ps-dark border-ps-blue/10 text-gray-400"
                  )}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase">Tunai</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('Transfer')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    paymentMethod === 'Transfer' 
                      ? "bg-ps-blue border-ps-neon shadow-lg" 
                      : "bg-ps-dark border-ps-blue/10 text-gray-400"
                  )}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase">Transfer</span>
                </button>
              </div>

              <button
                disabled={isProcessing}
                onClick={processPayment}
                className="w-full bg-ps-neon hover:bg-ps-neon/80 text-ps-dark font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,212,255,0.3)] transition-all active:scale-[0.98]"
              >
                {isProcessing ? <RefreshCcw className="w-6 h-6 animate-spin" /> : 'BAYAR SEKARANG'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TVCardProps {
  tv: StatusRental;
  onStart: (tv: StatusRental) => void | Promise<void>;
  onStop: (tv: StatusRental) => void | Promise<void>;
  key?: string;
}

function TVCard({ tv, onStart, onStop }: TVCardProps) {
  const [timer, setTimer] = useState('00:00:00');
  const isActive = tv.status === 'aktif';

  useEffect(() => {
    if (!isActive || !tv.startTime) {
      setTimer('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor(differenceInSeconds(now, tv.startTime.toDate()));
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diff % 60).toString().padStart(2, '0');
      setTimer(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, tv.startTime]);

  return (
    <div className={cn(
      "bg-ps-card border border-white/5 rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group",
      isActive && "border-neon-green/30 glow-green"
    )}>
      {/* Decorative Gradient Background */}
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 blur-3xl -mr-16 -mt-16 group-hover:bg-neon-green/10 transition-all pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-sm font-black text-text-muted uppercase tracking-widest">{tv.tvName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight",
              tv.tipe === 'PS5' ? "bg-ps-blue/20 text-ps-neon" : "bg-slate-800 text-slate-400"
            )}>
              {tv.tipe}
            </span>
            <div className="flex items-center gap-1.5 min-w-[60px]">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isActive ? "bg-neon-green animate-pulse shadow-[0_0_8px_#39ff14]" : "bg-slate-700"
              )} />
              <span className={cn(
                "text-[10px] font-bold uppercase",
                isActive ? "text-neon-green" : "text-slate-500"
              )}>
                {isActive ? 'Aktif' : 'Standby'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <Gamepad2 className={cn("w-6 h-6", isActive ? "text-ps-neon" : "text-slate-600")} />
        </div>
      </div>

      <div className="bg-ps-dark/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/5 flex flex-col items-center justify-center">
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mb-1">Elapsed Time</span>
        <div className="text-3xl font-orbitron font-bold text-white tracking-widest select-none">
          {timer}
        </div>
      </div>

      <div className="flex gap-3">
        {!isActive ? (
          <button
            onClick={() => onStart(tv)}
            className="flex-1 bg-ps-blue hover:bg-ps-blue/80 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-ps-blue/20"
          >
            <Play size={18} fill="currentColor" />
            <span>MULAI RENTAL</span>
          </button>
        ) : (
          <button
            onClick={() => onStop(tv)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Square size={18} fill="currentColor" />
            <span>SELESAI</span>
          </button>
        )}
      </div>
    </div>
  );
}
