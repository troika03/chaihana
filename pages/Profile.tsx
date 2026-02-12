
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient.ts';
import { LogOut, User as UserIcon, Phone, Mail, Package, Lock, Loader2, Smartphone, AlertCircle, ShieldCheck, ArrowLeft, Clock, MapPin } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, signIn, signUp, verifyOTP, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    identifier: '', 
    email: '', 
    password: '', 
    name: '', 
    phone: '', 
    address: '',
    otpCode: ''
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
    setAuthError(null);
    try {
      if (isOtpMode) {
        const emailToVerify = isLoginMode ? formData.identifier : formData.email;
        const { error } = await verifyOTP(emailToVerify, formData.otpCode);
        if (error) {
          setAuthError('Неверный код подтверждения. Проверьте еще раз.');
        } else {
          setIsOtpMode(false);
        }
      } else if (isLoginMode) {
        const { error } = await signIn(formData.identifier, formData.password);
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setAuthError('Email не подтвержден. Введите код из письма ниже.');
            setIsOtpMode(true);
          } else {
            setAuthError('Неверный email или пароль');
          }
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone, formData.address);
        if (error) {
          setAuthError(error.message);
        } else {
          setIsOtpMode(true);
          setAuthError('Мы отправили код подтверждения на ваш Email.');
        }
      }
    } catch (err: any) {
      setAuthError('Системная ошибка: ' + err.message);
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
                {isOtpMode ? <ShieldCheck size={30} /> : <Smartphone size={30} />}
            </div>
            <h2 className="text-2xl font-black text-amber-900">
            {isOtpMode ? 'Введите код' : (isLoginMode ? 'Вход в систему' : 'Новый гость')}
            </h2>
            <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-bold">Чайхана Жулебино</p>
        </div>

        {authError && (
          <div className={`mb-6 p-4 rounded-2xl flex gap-3 text-xs font-bold animate-shake ${isOtpMode && !authError.includes('Неверный') ? 'bg-amber-50 border border-amber-100 text-amber-800' : 'bg-red-50 border border-red-100 text-red-600'}`}>
            <AlertCircle size={18} className="shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isOtpMode ? (
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="6-значный код" 
                  maxLength={6}
                  className="w-full p-5 bg-gray-50 border-2 border-amber-100 rounded-2xl focus:border-amber-500 outline-none text-center text-2xl font-black tracking-[0.5em] transition" 
                  value={formData.otpCode} 
                  onChange={e => setFormData({...formData, otpCode: e.target.value.replace(/\D/g, '')})} 
                  required 
                />
                <p className="text-center text-xs text-amber-800/60 mt-4 font-bold">Код отправлен на вашу почту</p>
              </div>
            </div>
          ) : (
            <>
              {isLoginMode ? (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Email" 
                    className="w-full p-4 pl-12 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition" 
                    value={formData.identifier} 
                    onChange={e => setFormData({...formData, identifier: e.target.value})} 
                    required 
                  />
                  <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
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
            </>
          )}

          <button 
            type="submit" 
            disabled={isAuthProcessing}
            className="w-full bg-amber-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-800 transition shadow-lg transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isAuthProcessing && <Loader2 className="animate-spin" size={20} />}
            {isOtpMode ? 'Подтвердить' : (isLoginMode ? 'Войти' : 'Создать аккаунт')}
          </button>
        </form>
        
        <div className="mt-6 flex flex-col gap-3">
          {isOtpMode ? (
            <button 
              onClick={() => { setIsOtpMode(false); setAuthError(null); }} 
              className="w-full text-center text-gray-400 text-xs font-black hover:text-amber-900 uppercase tracking-tighter flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Назад
            </button>
          ) : (
            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(null); }} 
              disabled={isAuthProcessing}
              className="w-full text-center text-amber-800 text-sm font-black hover:underline uppercase tracking-tighter"
            >
              {isLoginMode ? 'Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          )}
        </div>
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
            <span className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-1.5 rounded-full text-xs font-black">
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
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-amber-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-amber-950">Заказ #{order.id}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                      <Clock size={12} />
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <span className="font-black text-xl text-amber-900">{order.total_amount} ₽</span>
                </div>
                <div className="text-xs text-gray-500 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                  <p className="font-medium line-clamp-2">
                    {Array.isArray(order.items) ? order.items.map((it: any) => `${it.dish?.name} x${it.quantity}`).join(', ') : 'Информация о блюдах'}
                  </p>
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
