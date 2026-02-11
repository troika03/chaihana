
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { LogOut, User as UserIcon, MapPin, Phone, Package } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ phone: '', password: '', name: '', address: '' });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setOrders(data);
    }
    setIsLoadingOrders(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isLoginMode 
      ? await signIn(formData.phone, formData.password)
      : await signUp(formData.phone, formData.password, formData.name, formData.address);
    
    if (error) alert('Ошибка: ' + error.message);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border mt-10">
        <h2 className="text-2xl font-bold text-center text-amber-900 mb-6">{isLoginMode ? 'Вход' : 'Регистрация'}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLoginMode && <input type="text" placeholder="Имя" className="w-full p-3 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />}
          <input type="text" placeholder="Телефон" className="w-full p-3 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input type="password" placeholder="Пароль" className="w-full p-3 border rounded-lg" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          {!isLoginMode && <textarea placeholder="Адрес доставки" className="w-full p-3 border rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />}
          <button type="submit" className="w-full bg-amber-900 text-white py-3 rounded-lg font-bold">{isLoginMode ? 'Войти' : 'Зарегистрироваться'}</button>
        </form>
        <button onClick={() => setIsLoginMode(!isLoginMode)} className="w-full text-center mt-4 text-amber-700 text-sm underline">{isLoginMode ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-800"><UserIcon size={40} /></div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">{user.full_name}</h2>
          <div className="flex gap-4 mt-2 text-gray-500 text-sm justify-center md:justify-start">
            <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {user.address}</span>
          </div>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg"><LogOut size={16} /> Выйти</button>
      </div>

      <div>
        <h3 className="text-xl font-bold text-amber-900 mb-4">Мои заказы</h3>
        {isLoadingOrders ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed">У вас пока нет заказов</div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold">Заказ #{order.id}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-700">{order.total_amount} ₽</div>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{order.status}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                   {order.items.map((item: any, idx: number) => (
                     <span key={idx} className="mr-3">{item.dish.name} x{item.quantity}</span>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
