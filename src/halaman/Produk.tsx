import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Produk } from '../types';
import { formatRupiah, cn } from '../lib/utils';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Package, 
  Tags,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const KATEGORI = ['Makanan', 'Minuman', 'Snack', 'Lainnya'];
const INITIAL_EMOJIS = ['🍔', '🍕', '🥤', '🍦', '🍩', '🍫', '🍟', '🍜', '☕', '🍗'];

export default function ProdukPage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produk | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    harga: 0,
    kategori: 'Snack' as Produk['kategori'],
    emoji: '🍱',
    stok: 0
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produk));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ nama: '', harga: 0, kategori: 'Snack', emoji: '🍱', stok: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (product: Produk) => {
    setEditingProduct(product);
    setFormData({
      nama: product.nama,
      harga: product.harga,
      kategori: product.kategori,
      emoji: product.emoji,
      stok: product.stok
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), formData);
      } else {
        await addDoc(collection(db, 'products'), formData);
      }
      setShowModal(false);
    } catch (err) {
      alert('Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const filtered = products.filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  // Seed Data function for demo
  const seedDemo = async () => {
    const demos = [
      { nama: 'Kopi Kapal Api', harga: 5000, kategori: 'Minuman' as const, emoji: '☕', stok: 50 },
      { nama: 'Indomie Goreng', harga: 8000, kategori: 'Makanan' as const, emoji: '🍜', stok: 30 },
      { nama: 'Chiki Twist', harga: 3000, kategori: 'Snack' as const, emoji: '🍟', stok: 100 },
      { nama: 'Coca Cola', harga: 7000, kategori: 'Minuman' as const, emoji: '🥤', stok: 24 },
    ];
    for (const d of demos) {
      await addDoc(collection(db, 'products'), d);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan uppercase">Management Produk</h2>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-1">Inventory & SKU Control</p>
        </div>
        
        <div className="flex gap-3">
          {products.length === 0 && !loading && (
            <button 
              onClick={seedDemo}
              className="px-6 py-3 bg-ps-dark border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-ps-neon hover:bg-ps-blue/10 transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-3 h-3" /> SEED DEMO
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="px-8 py-3 bg-ps-neon text-ps-dark font-black rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(0,212,255,0.2)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" /> TAMBAH PRODUK
          </button>
        </div>
      </div>

      <div className="bg-ps-card p-8 rounded-3xl border border-white/5">
        <div className="relative mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-ps-neon transition-colors" />
          <input
            type="text"
            placeholder="Searching inventory by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-ps-dark border border-white/5 rounded-2xl focus:outline-none focus:border-ps-neon/50 text-xs font-bold uppercase tracking-widest placeholder:text-slate-700 text-white transition-all shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <motion.div
              layout
              key={product.id}
              className="bg-ps-dark border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-ps-neon/30 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="text-4xl w-16 h-16 flex items-center justify-center bg-ps-card rounded-xl border border-white/10 group-hover:bg-ps-blue/10 transition-all group-hover:scale-110 duration-500">
                  {product.emoji}
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-tight text-white mb-1">{product.nama}</h4>
                  <p className="text-ps-neon font-black text-sm font-orbitron">{formatRupiah(product.harga)}</p>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">
                    {product.kategori} • STOK: <span className={cn(product.stok <= 5 ? "text-red-500" : "text-slate-400")}>{product.stok}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="p-2.5 bg-ps-blue/10 border border-ps-blue/20 text-ps-neon rounded-xl hover:bg-ps-blue hover:text-white transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal Form */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-ps-card border border-white/5 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-orbitron font-bold text-ps-neon tracking-tighter uppercase">
                    {editingProduct ? 'Update SKU' : 'New Inventory'}
                  </h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">Product Configuration Module</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 bg-ps-dark text-slate-500 hover:text-white rounded-xl border border-white/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Product Name</label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/50 outline-none text-sm font-bold uppercase tracking-tight transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Unit Price (IDR)</label>
                    <input
                      type="number"
                      value={formData.harga}
                      onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) })}
                      className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/50 outline-none text-sm font-bold transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Current Stock</label>
                    <input
                      type="number"
                      value={formData.stok}
                      onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) })}
                      className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/50 outline-none text-sm font-bold transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Category</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                      className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/50 outline-none appearance-none text-[10px] font-black uppercase tracking-widest text-slate-300"
                    >
                      {KATEGORI.map(k => <option key={k} value={k} className="bg-ps-card text-white py-2">{k}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Visual Asset (Emoji)</label>
                    <select
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      className="w-full bg-ps-dark border border-white/5 rounded-2xl px-5 py-4 focus:border-ps-neon/50 outline-none appearance-none text-lg"
                    >
                      {INITIAL_EMOJIS.map(e => <option key={e} value={e} className="bg-ps-card">{e}</option>)}
                      <option value="🍱" className="bg-ps-card">🍱 Box</option>
                      <option value="🎲" className="bg-ps-card">🎲 Game</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-ps-neon text-ps-dark font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,212,255,0.2)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest mt-4"
                >
                  <Save className="w-5 h-5" />
                  Commit Changes to DB
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
