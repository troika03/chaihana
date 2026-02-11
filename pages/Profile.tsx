
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { LogOut, User as UserIcon, MapPin, Phone, Mail, Package, Lock, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    phone: '', 
    address: '' 
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthProcessing) return;

    setIsAuthProcessing(true);
    try {
      const { error } = isLoginMode 
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password, formData.name, formData.phone, formData.address);
      
      if (error) {
        let msg = error.message;
        if (msg === 'Invalid login credentials') msg = 'Неверный email или пароль';
        if (msg.includes('confirm')) msg = 'Пожалуйста, подтвердите email (проверьте почту)';
        alert('Ошибка: ' + msg);
      } else if (!isLoginMode) {
        alert('Регистрация прошла успешно! Теперь вы можете войти.');
        setIsLoginMode(true);
      }
    } catch (err: any) {
      alert('Системная ошибка: ' + err.message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-amber-900 mb-4" size={40} />
        <p className="text-amber-800 font-medium">Загрузка профиля...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-amber-50 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-900 shadow-inner">
                <Lock size={30} />
            </div>
            <h2 className="text-2xl font-bold text-amber-900">
            {isLoginMode ? 'С возвращением!' : 'Стать гостем'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">Чайхана Жулебино: вкус Востока у вас дома</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLoginMode && (
            <input 
              type="text" 
              placeholder="Ваше имя" 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          {!isLoginMode && (
            <input 
              type="tel" 
              placeholder="+7 (___) ___-__-__" 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              required 
            />
          )}
          <input 
            type="password" 
            placeholder="Пароль" 
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
          />
          {!isLoginMode && (
            <textarea 
              placeholder="Адрес доставки (по умолчанию)" 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition h-24" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
            />
          )}
          <button 
            type="submit" 
            disabled={isAuthProcessing}
            className="w-full bg-amber-900 text-white py-4 rounded-2xl font-bold hover:bg-amber-800 transition shadow-lg transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAuthProcessing && <Loader2 className="animate-spin" size={20} />}
            {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <button 
          onClick={() => setIsLoginMode(!isLoginMode)} 
          disabled={isAuthProcessing}
          className="w-full text-center mt-6 text-amber-800 text-sm font-semibold hover:underline disabled:opacity-50"
        >
          {isLoginMode ? 'Еще нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-amber-50 flex flex-col md:flex-row items-center gap-8">
        <div className="w-28 h-28 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-amber-900 shadow-inner">
          <UserIcon size={48} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900">{user.full_name}</h2>
          <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
            <span className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium">
              <Phone size={14} /> {user.phone}
            </span>
            <span className="flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-1.5 rounded-full text-sm font-medium">
              <MapPin size={14} /> {user.address || 'Адрес не указан'}
            </span>
          </div>
        </div>
        <button 
          onClick={signOut} 
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition"
        >
          <LogOut size={20} /> Выйти
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-900 p-2 rounded-lg text-white">
            <Package size={24} />
          </div>
          <h3 className="text-2xl font-bold text-amber-950">Мои заказы</h3>
        </div>
        
        {isLoadingOrders ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-900" size={32} /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-amber-100">
            <p className="text-gray-400 text-lg">Вы еще ничего не заказывали</p>
            <a href="/" className="inline-block mt-4 text-amber-800 font-bold hover:underline">Перейти в меню</a>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-2xl border border-amber-50 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Заказ</span>
                    <h4 className="text-xl font-black text-amber-950">#{order.id}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-800">{order.total_amount} ₽</div>
                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'pending' ? 'В обработке' : 
                       order.status === 'cooking' ? 'Готовится' :
                       order.status === 'delivering' ? 'В пути' :
                       order.status === 'delivered' ? 'Доставлен' : order.status}
                    </div>
                  </div>
                </div>
                <div className="border-t border-amber-50 pt-4 mt-4">
                   <p className="text-sm font-bold text-gray-600 mb-2">Состав заказа:</p>
                   <div className="flex flex-wrap gap-2">
                     {order.items.map((item: any, idx: number) => (
                       <div key={idx} className="bg-gray-50 px-3 py-1.5 rounded-xl text-xs text-gray-700 border border-gray-100">
                         {item.dish.name} <span className="text-amber-700 font-black">×{item.quantity}</span>
                       </div>
                     ))}
                   </div>
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
