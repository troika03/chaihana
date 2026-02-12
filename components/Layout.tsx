
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Phone, UtensilsCrossed, Settings } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navItems = [
    { path: '/', label: 'Меню', icon: <UtensilsCrossed size={20} /> },
    { path: '/delivery', label: 'Доставка', icon: <ShoppingCart size={20} /> },
    { path: '/about', label: 'О нас', icon: <User size={20} /> },
    { path: '/contacts', label: 'Контакты', icon: <Phone size={20} /> },
  ];

  if (user) {
    navItems.push({ path: '/profile', label: 'Мои заказы', icon: <User size={20} /> });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f3e9] text-amber-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="p-1 hover:bg-white/10 rounded-full transition">
              <Menu size={28} />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition">
                <UtensilsCrossed size={24} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide text-shadow">
                Чайхана Жулебино
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="hidden md:flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium transition">
                <Settings size={16} />
                <span>Админ</span>
              </Link>
            )}
            
            <Link to="/checkout" className="relative p-2 hover:bg-white/10 rounded-full transition">
              <ShoppingCart size={26} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-amber-900 animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <Link to="/profile" className="p-2 hover:bg-white/10 rounded-full transition">
              <User size={26} />
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-amber-900 to-amber-800 text-white z-50 transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-5 border-b border-white/20">
          <h2 className="text-xl font-bold">Меню</h2>
          <button onClick={toggleSidebar} className="hover:text-orange-300 transition">
            <X size={28} />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === item.path ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
            {isAdmin && (
               <li>
                <Link 
                  to="/admin" 
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/admin' ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}
                >
                  <Settings size={20} />
                  Админ-панель
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-6 text-center text-sm text-white/60">
          <p>© 2024 Чайхана Жулебино</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-amber-950 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <UtensilsCrossed size={24} className="text-orange-400" />
            <h2 className="text-xl font-bold">Чайхана Жулебино</h2>
          </div>
          <div className="flex justify-center gap-6 mb-6 text-sm text-gray-300">
            <Link to="/about" className="hover:text-white transition">О нас</Link>
            <Link to="/delivery" className="hover:text-white transition">Доставка</Link>
            <Link to="/contacts" className="hover:text-white transition">Контакты</Link>
          </div>
          <p className="text-xs text-gray-500">Работаем с душой. Готовим с любовью.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
