import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gamepad2, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Wallet, 
  Users, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function TataLetak() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate('/masuk');
  };

  const navItems = [
    { label: 'Dasbor', path: '/', icon: LayoutDashboard, roles: ['admin', 'kasir'] },
    { label: 'Rental PS', path: '/rental', icon: Gamepad2, roles: ['admin', 'kasir'] },
    { label: 'Warung', path: '/warung', icon: ShoppingCart, roles: ['admin', 'kasir'] },
    { label: 'Produk', path: '/produk', icon: Package, roles: ['admin'] },
    { label: 'Laporan', path: '/laporan', icon: BarChart3, roles: ['admin'] },
    { label: 'Keuangan', path: '/keuangan', icon: Wallet, roles: ['admin'] },
    { label: 'Kelola Kasir', path: '/kasir', icon: Users, roles: ['admin'] },
  ];

  return (
    <div className="flex min-h-screen bg-ps-dark text-white">
      {/* Sidebar */}
      <aside className="w-[220px] border-r border-ps-neon/10 bg-[#0d1326] flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-2xl font-orbitron font-bold text-ps-neon tracking-tighter leading-tight glow-cyan">
            PS<br/>HEAVEN
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            if (!item.roles.includes(user?.role || '')) return null;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all duration-300 group",
                  isActive 
                    ? "bg-ps-blue/20 text-ps-neon border-r-4 border-ps-neon rounded-l-lg" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-ps-neon" : "group-hover:text-ps-neon")} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-ps-neon/80 flex items-center justify-center font-bold text-sm text-ps-dark">
              {user?.nama?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold">{user?.nama}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-red-400/60 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
