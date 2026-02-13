
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../apiClient.ts';
import { User as UserIcon, Package, Loader2, Clock, ShieldCheck, LogIn, UserPlus } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    address: ''
  });

  useEffect(() => {
    if (user) {
      setIsLoadingOrders(true);
      api.orders.getByUser(user.id).then(setOrders).finally(() => setIsLoadingOrders(false));
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.name, formData.address);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (msg.includes('rate limit')) msg = 'Система временно перегружена. Пожалуйста, подождите 1 минуту.';
      if (msg.includes('Invalid login')) msg = 'Неверная почта или пароль.';
      if (msg.includes('Password should be')) msg = 'Пароль должен быть не менее 6 символов.';
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4 text-amber-900/40">
      <Loader2 className="animate-spin" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest">Загрузка профиля...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-amber-50 mt-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-50 rounded-full text-amber-900">
                {isLoginMode ? <LogIn size={32} /> : <UserPlus size={32} />}
            </div>
        </div>
        <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter text-center mb-8">
          {isLoginMode ? 'С возвращением!' : 'Стать гостем'}
        </h2>
        
        {authError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-red-100">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Почта" 
            className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          {!isLoginMode && (
            <>
              <input 
                type="text" 
                placeholder="Ваше Имя" 
                className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <input 
                type="text" 
                placeholder="Адрес для доставки" 
                className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </>
          )}
          <input 
            type="password" 
            placeholder="Пароль" 
            className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
          />
          <button 
            disabled={isSubmitting}
            className="w-full bg-amber-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isLoginMode ? 'Войти в Чайхану' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <button 
          onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(null); }} 
          className="w-full mt-8 text-amber-800 text-[10px] font-black uppercase tracking-widest text-center opacity-40 hover:opacity-100 transition-opacity"
        >
          {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white p-10 rounded-[4rem] shadow-sm border flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 bg-amber-100 rounded-[2.5rem] flex items-center justify-center text-amber-900 border-4 border-amber-50">
          <UserIcon size={56} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-4xl font-black text-amber-950 italic tracking-tighter">{user.full_name}</h2>
          <div className="flex items-center gap-2 justify-center md:justify-start mt-2">
            <span className="text-orange-600 font-black uppercase text-[10px] tracking-widest">
              {user.role === 'admin' ? 'Администратор' : 'Постоянный гость'}
            </span>
            {user.role === 'admin' && <ShieldCheck size={14} className="text-orange-600" />}
          </div>
        </div>
        <button onClick={signOut} className="bg-red-50 text-red-600 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-colors">Выйти</button>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-amber-950 flex items-center gap-4 italic tracking-tighter">
          <Package size={28}/> История заказов
        </h3>
        {isLoadingOrders ? (
          <Loader2 className="animate-spin mx-auto text-amber-900 mt-10" />
        ) : orders.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border border-amber-50">
            <p className="text-amber-900/20 font-black uppercase text-xs tracking-widest">Здесь будут ваши заказы</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-amber-50 flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-lg transition-shadow">
                <div className="text-center sm:text-left">
                  <h4 className="font-black text-amber-950 text-xl tracking-tight">Заказ на {order.total_amount} ₽</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1 justify-center sm:justify-start">
                    <Clock size={10} /> {new Date(order.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.status === 'pending' ? 'Новый' : 
                   order.status === 'cooking' ? 'Готовится' : 
                   order.status === 'delivering' ? 'В пути' : 
                   order.status === 'delivered' ? 'Доставлен' : order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
