import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, MapPin, Phone } from 'lucide-react';
import Modal from '../components/ui/Modal';

const Profile: React.FC = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ phone: '', password: '', name: '', address: '' });

  // Load orders history (Mock)
  const orders = user ? JSON.parse(localStorage.getItem('zhulebino_orders') || '[]') : [];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      await signIn(formData.phone, formData.password);
    } else {
      await signUp(formData.phone, formData.password, formData.name, formData.address);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-amber-50 mt-10">
        <h2 className="text-2xl font-bold text-center text-amber-900 mb-6">
          {isLoginMode ? 'Вход в профиль' : 'Регистрация'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLoginMode && (
            <input 
              type="text" 
              placeholder="Имя"
              className="w-full p-3 border rounded-lg focus:border-amber-600 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          <input 
            type="text" 
            placeholder="Телефон"
            className="w-full p-3 border rounded-lg focus:border-amber-600 outline-none"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            required
          />
           <input 
            type="password" 
            placeholder="Пароль"
            className="w-full p-3 border rounded-lg focus:border-amber-600 outline-none"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />
           {!isLoginMode && (
            <textarea 
              placeholder="Адрес доставки (по умолчанию)"
              className="w-full p-3 border rounded-lg focus:border-amber-600 outline-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          )}
          
          <button type="submit" className="w-full bg-amber-900 text-white py-3 rounded-lg font-bold hover:bg-amber-800 transition">
             {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="text-center mt-4 mb-6">
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-amber-700 text-sm hover:underline"
          >
            {isLoginMode ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-800">
          <UserIcon size={40} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">{user.full_name}</h2>
          <div className="flex flex-col md:flex-row gap-4 mt-2 text-gray-500 text-sm justify-center md:justify-start">
            <div className="flex items-center gap-1">
              <Phone size={14} /> {user.phone}
            </div>
             <div className="flex items-center gap-1">
              <MapPin size={14} /> {user.address || 'Адрес не указан'}
            </div>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          <LogOut size={16} /> Выйти
        </button>
      </div>

      {/* Orders History */}
      <div>
        <h3 className="text-xl font-bold text-amber-900 mb-4">История заказов</h3>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed">
              Заказов пока нет
            </div>
          ) : (
            orders.slice().reverse().map((order: any) => (
              <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-gray-800">Заказ #{order.id}</div>
                    <div className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-700">{order.total} ₽</div>
                    <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 inline-block mt-1">
                      {order.status}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 border-t border-gray-50 pt-2">
                   {order.items.map((item: any) => (
                     <span key={item.dish.id} className="mr-3 block sm:inline">
                       {item.dish.name} <span className="text-gray-400">x{item.quantity}</span>
                     </span>
                   ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;