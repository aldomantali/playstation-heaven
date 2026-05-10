import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Produk, TransaksiItem } from '../types';
import { useCart } from '../konteks/CartContext';
import { formatRupiah, cn } from '../lib/utils';
import { Search, ShoppingBasket, Plus, Filter, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const KATEGORI = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Lainnya'];

export default function Warung() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produk));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchKategori = selectedKategori === 'Semua' || p.kategori === selectedKategori;
    const matchSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchKategori && matchSearch;
  });

  const handleAddToCart = (product: Produk) => {
    const item: TransaksiItem = {
      id: product.id,
      nama: product.nama,
      harga: product.harga,
      qty: 1,
      tipe: 'produk'
    };
    addToCart(item);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-ps-neon tracking-tighter glow-cyan">WARUNG POS</h2>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-1">Inventory & Store Management</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-ps-neon transition-colors" />
            <input 
              type="text"
              placeholder="Searching items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-ps-dark border border-white/5 rounded-full focus:outline-none focus:border-ps-neon/50 text-xs w-full md:w-64 transition-all placeholder:text-slate-600 font-bold uppercase tracking-widest"
            />
          </div>
        </div>
      </div>

      {/* Kategori Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {KATEGORI.map((kat) => (
          <button
            key={kat}
            onClick={() => setSelectedKategori(kat)}
            className={cn(
              "px-8 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all whitespace-nowrap border",
              selectedKategori === kat
                ? "bg-ps-neon text-ps-dark border-ps-neon shadow-[0_0_15px_rgba(0,212,255,0.4)]"
                : "bg-ps-card border-white/5 text-slate-500 hover:text-white"
            )}
          >
            {kat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <RefreshCcw className="w-8 h-8 text-ps-neon animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product.id}
                className="bg-ps-card border border-white/5 rounded-2xl p-5 hover:border-ps-neon/30 transition-all group relative"
              >
                <div className="aspect-square mb-4 flex items-center justify-center bg-ps-dark/50 rounded-xl relative overflow-hidden">
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-500 relative z-10">{product.emoji || '📦'}</span>
                  <div className="absolute inset-0 bg-ps-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[9px] text-ps-neon font-black uppercase tracking-widest bg-ps-neon/10 px-2 py-0.5 rounded">{product.kategori}</p>
                    {product.stok <= 5 && (
                      <span className="text-[8px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded tracking-tighter uppercase animate-pulse">Low Stock</span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm truncate uppercase tracking-tight">{product.nama}</h4>
                  <p className="text-white font-orbitron font-bold text-sm">{formatRupiah(product.harga)}</p>
                </div>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-6 w-full bg-ps-dark hover:bg-ps-blue text-ps-neon hover:text-white border border-ps-blue/20 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Add to POS</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-500 italic">
          <ShoppingBasket className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Produk tidak ditemukan</p>
        </div>
      )}
    </div>
  );
}
