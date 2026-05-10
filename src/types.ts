export type Peran = 'admin' | 'kasir';

export interface User {
  uid: string;
  nama: string;
  username: string;
  alamat?: string;
  role: Peran;
  avatar?: string;
}

export interface Produk {
  id: string;
  nama: string;
  harga: number;
  kategori: 'Makanan' | 'Minuman' | 'Snack' | 'Lainnya';
  emoji: string;
  stok: number;
}

export interface TransaksiItem {
  id: string;
  nama: string;
  harga: number;
  qty: number;
  tipe: 'produk' | 'rental';
}

export interface Transaksi {
  id: string;
  deskripsi: string;
  total: number;
  metodePembayaran: 'Cash' | 'Transfer';
  tanggal: any; // Firestore Timestamp
  kasirId: string;
  items: TransaksiItem[];
}

export interface Keuangan {
  id: string;
  tipe: 'pemasukan' | 'pengeluaran';
  keterangan: string;
  nominal: number;
  tanggal: any; // Firestore Timestamp
}

export interface StatusRental {
  tvId: string;
  tvName: string;
  tipe: 'PS4' | 'PS5';
  status: 'tersedia' | 'aktif';
  startTime?: any; // Firestore Timestamp
  pricePerHour: number;
}
