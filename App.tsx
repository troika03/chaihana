
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Home from './pages/Home.tsx';
import Checkout from './pages/Checkout.tsx';
import Admin from './pages/Admin.tsx';
import Profile from './pages/Profile.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import UserAgreement from './pages/UserAgreement.tsx';
import Delivery from './pages/Delivery.tsx';
import Contacts from './pages/Contacts.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

const App: React.FC = () => {
  // Принудительный редирект на главную при обновлении страницы
  useEffect(() => {
    if (window.location.hash !== '#/') {
      window.location.hash = '#/';
    }
  }, []);

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
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<UserAgreement />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
