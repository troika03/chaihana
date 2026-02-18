
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Phone, UtensilsCrossed, Settings, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import Logo from './Logo.tsx';

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
    { path: '/delivery', label: 'Доставка', icon: <Truck size={20} /> },
    { path: '/contacts', label: 'Контакты', icon: <Phone size={20} /> },
  ];

  if (user) {
    navItems.push({ path: '/profile', label: 'Мои заказы', icon: <User size={20} /> });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f3e9] text-amber-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-md">
        <div className="container mx-auto px-2 md:px-4 py-2 md:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full transition">
              <Menu size={24} className="md:w-7 md:h-7" />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-white p-1 rounded-full group-hover:scale-110 transition hidden sm:block">
                <Logo size={36} color="#451a03" hideText={true} />
              </div>
              <h1 className="text-lg md:text-2xl font-bold tracking-tight md:tracking-wide">
                Чайхана Жулебино
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            {isAdmin && (
              <Link to="/admin" className="hidden lg:flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium transition text-white">
                <Settings size={14} />
                <span>Админ</span>
              </Link>
            )}
            
            <Link to="/checkout" className="relative p-2 hover:bg-white/10 rounded-full transition">
              <ShoppingCart size={24} className="md:w-[26px] md:h-[26px]" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-amber-900 animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>
            
            <Link to="/profile" className="p-2 hover:bg-white/10 rounded-full transition">
              <User size={24} className="md:w-[26px] md:h-[26px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-amber-900 to-amber-800 text-white z-50 transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-5 border-b border-white/20">
            <div className="flex items-center gap-3">
              <Logo size={40} color="white" hideText={true} />
              <h2 className="text-xl font-bold">Меню</h2>
            </div>
            <button onClick={toggleSidebar} className="hover:text-orange-300 transition"><X size={28} /></button>
          </div>
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} onClick={toggleSidebar} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === item.path ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}>
                    {item.icon} {item.label}
                  </Link>
                </li>
              ))}
              
              {isAdmin && (
                <li className="pt-4 mt-4 border-t border-white/10">
                  <Link to="/admin" onClick={toggleSidebar} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-orange-400 font-black uppercase text-[10px] tracking-widest ${location.pathname === '/admin' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                    <Settings size={20} /> Панель управления
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <div className="p-6 text-center">
             <Logo size={80} color="rgba(255,255,255,0.1)" className="mx-auto mb-2" />
             <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Чайхана Жулебино</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-6xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-amber-950 text-white py-10 md:py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Logo size={60} color="#f97316" hideText={true} />
            <h2 className="text-lg md:text-xl font-bold">Чайхана Жулебино</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 text-xs md:text-sm text-gray-400">
            <Link to="/delivery" className="hover:text-white transition">Доставка</Link>
            <Link to="/contacts" className="hover:text-white transition">Контакты</Link>
            <Link to="/privacy" className="hover:text-white transition">Приватность</Link>
          </div>
          
          <div className="space-y-1 mb-6">
            <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">© 2025 Чайхана Жулебино. Все права защищены.</p>
            <p className="text-[8px] md:text-[9px] text-gray-500/60 font-medium tracking-wider">
              ИНН 7707083893 | ОГРНИП 325508100324129
            </p>
          </div>
          <p className="text-[9px] md:text-[10px] text-gray-600 uppercase tracking-widest">Работаем с душой. Готовим с любовью.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
