
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="text-center py-20">
    <h2 className="text-3xl font-bold text-amber-900 mb-4">{title}</h2>
    <p className="text-gray-500">Страница в разработке.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/delivery" element={<PlaceholderPage title="Доставка" />} />
              <Route path="/about" element={<PlaceholderPage title="О нас" />} />
              <Route path="/contacts" element={<PlaceholderPage title="Контакты" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
