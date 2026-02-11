
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { LogOut, User as UserIcon, MapPin, Phone, Mail, Package, Lock, Loader2, Smartphone } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [formData, setFormData] = useState({ 
    identifier: '', // Может быть email или телефон
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
        ? await signIn(formData.identifier, formData.password)
        : await signUp(formData.email, formData.password, formData.name, formData.phone, formData.address);
      
      if (error) {
        let msg = error.message;
        if (msg === 'Invalid login credentials') msg = 'Неверные данные для входа';
        alert('Ошибка: ' + msg);
      } else if (!isLoginMode) {
        alert('Успех! Теперь вы можете войти в систему.');
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
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-amber-50 mt-10 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-900 shadow-inner">
                <Smartphone size={30} />
            </div>
            <h2 className="text-2xl font-black text-amber-900">
            {isLoginMode ? 'Вход в систему' : 'Новый гость'}
            </h2>
            <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-bold">Чайхана Жулебино</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isLoginMode ? (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Email или Телефон" 
                  className="w-full p-4 pl-12 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
                  value={formData.identifier} 
                  onChange={e => setFormData({...formData, identifier: e.target.value})} 
                  required 
                />
                <UserIcon className="absolute left-4 top-4 text-gray-400" size={20} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Ваше имя" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
              <input 
                type="tel" 
                placeholder="Номер телефона" 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
          )}
          
          <div className="relative">
            <input 
              type="password" 
              placeholder="Пароль" 
              className="w-full p-4 pl-12 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
            <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
          </div>

          {!isLoginMode && (
            <textarea 
              placeholder="Адрес доставки (для быстрых заказов)" 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none h-24" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
            />
          )}

          <button 
            type="submit" 
            disabled={isAuthProcessing}
            className="w-full bg-amber-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-800 transition shadow-lg transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isAuthProcessing && <Loader2 className="animate-spin" size={20} />}
            {isLoginMode ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
        
        <button 
          onClick={() => setIsLoginMode(!isLoginMode)} 
          disabled={isAuthProcessing}
          className="w-full text-center mt-6 text-amber-800 text-sm font-black hover:underline uppercase tracking-tighter"
        >
          {isLoginMode ? 'Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
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
          <h2 className="text-3xl font-black text-amber-950">{user.full_name}</h2>
          <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
            <span className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-1.5 rounded-full text-xs font-black">
              <Phone size={14} /> {user.phone}
            </span>
            <span className="flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-1.5 rounded-full text-xs font-black">
              <MapPin size={14} /> {user.address || 'Адрес не указан'}
            </span>
          </div>
        </div>
        <button 
          onClick={signOut} 
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-black text-sm uppercase rounded-2xl hover:bg-red-100 transition"
        >
          <LogOut size={20} /> Выход
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-900 p-2 rounded-xl text-white">
            <Package size={24} />
          </div>
          <h3 className="text-2xl font-black text-amber-950">История заказов</h3>
        </div>
        
        {isLoadingOrders ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-900" size={32} /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-amber-100">
            <p className="text-gray-400 font-bold">У вас пока нет активных заказов</p>
            <a href="/" className="inline-block mt-4 text-amber-800 font-black uppercase text-xs tracking-widest hover:underline">К выбору блюд</a>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-amber-50 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-black text-amber-950">Заказ #{order.id}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-900">{order.total_amount} ₽</div>
                    <div className={`inline-block mt-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'pending' ? 'Ожидание' : 
                       order.status === 'cooking' ? 'Готовится' :
                       order.status === 'delivering' ? 'В пути' :
                       order.status === 'delivered' ? 'Выполнен' : order.status}
                    </div>
                  </div>
                </div>
                <div className="border-t border-amber-50 pt-4 mt-4">
                   <div className="flex flex-wrap gap-2">
                     {order.items.map((item: any, idx: number) => (
                       <div key={idx} className="bg-gray-50 px-3 py-1.5 rounded-xl text-[11px] font-bold text-gray-600 border border-gray-100">
                         {item.dish.name} <span className="text-amber-700 font-black ml-1">×{item.quantity}</span>
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
