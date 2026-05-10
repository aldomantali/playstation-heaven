import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User } from './types';
import Masuk from './halaman/Masuk';
import Dasbor from './halaman/Dasbor';
import Rental from './halaman/Rental';
import Warung from './halaman/Warung';
import ProdukPage from './halaman/Produk';
import Laporan from './halaman/Laporan';
import KeuanganPage from './halaman/Keuangan';
import KasirPage from './halaman/Kasir';
import TataLetak from './komponen/TataLetak';
import { CartProvider } from './konteks/CartContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // If profile doc doesn't exist yet (first login)
          setUser({
            uid: firebaseUser.uid,
            nama: firebaseUser.displayName || 'Kasir',
            username: firebaseUser.email?.split('@')[0] || 'kasir',
            role: 'kasir',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ps-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ps-neon"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <CartProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/masuk" element={!user ? <Masuk /> : <Navigate to="/" />} />
          
          <Route element={user ? <TataLetak /> : <Navigate to="/masuk" />}>
            <Route path="/" element={<Dasbor />} />
            <Route path="/rental" element={<Rental />} />
            <Route path="/warung" element={<Warung />} />
            
            {/* Admin Only Routes */}
            <Route path="/produk" element={user?.role === 'admin' ? <ProdukPage /> : <Navigate to="/" />} />
            <Route path="/laporan" element={user?.role === 'admin' ? <Laporan /> : <Navigate to="/" />} />
            <Route path="/keuangan" element={user?.role === 'admin' ? <KeuanganPage /> : <Navigate to="/" />} />
            <Route path="/kasir" element={user?.role === 'admin' ? <KasirPage /> : <Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthContext.Provider>
  );
}
