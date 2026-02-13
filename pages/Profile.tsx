
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient.ts';
import { LogOut, User as UserIcon, Package, Loader2, Smartphone, ShieldCheck, ArrowLeft, Clock, MapPin, CheckCircle, Smartphone as OtpIcon, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, signIn, signInWithGoogle, signUp, verifyOTP, resendOTP, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  
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
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthProcessing) return;
    
    if (!isLoginMode && !isOtpMode && !agreedToPolicy) {
      setAuthError('Необходимо согласиться с политикой конфиденциальности');
      return;
    }

    setIsAuthProcessing(true);
    setAuthError(null);
    try {
      if (isOtpMode) {
        const email = isLoginMode ? formData.identifier : formData.email;
        const { error } = await verifyOTP(email, formData.otpCode);
        if (error) setAuthError('Неверный код или срок его действия истек');
        else setIsOtpMode(false);
      } else if (isLoginMode) {
        const { error } = await signIn(formData.identifier, formData.password);
        if (error) setAuthError('Неверный email или пароль');
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone, formData.address);
        if (error) {
          setAuthError(error.message);
        } else {
          setIsOtpMode(true);
          setResendTimer(60);
          setAuthError(null);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Произошла ошибка при авторизации');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-amber-900" size={40} />
      <p className="text-amber-900 font-bold uppercase tracking-widest text-[10px]">Загружаем профиль...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-amber-50 mt-10 animate-in fade-in slide-in-from-bottom-8">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter">
            {isOtpMode ? 'Почти готово!' : (isLoginMode ? 'С возвращением!' : 'Стать гостем')}
            </h2>
            <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full mt-3 mb-2"></div>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-black">Чайхана Жулебино</p>
        </div>

        {authError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100 animate-shake">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isOtpMode && (
            <>
              {isLoginMode ? (
                <input type="email" placeholder="Email" className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} required />
              ) : (
                <>
                  <input type="text" placeholder="Ваше имя" className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input type="email" placeholder="Email" className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  <input type="tel" placeholder="Телефон" className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </>
              )}
              <input type="password" placeholder="Пароль" className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-950 focus:ring-2 ring-amber-900/10 transition" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              
              {!isLoginMode && (
                <label className="flex items-start gap-3 cursor-pointer p-2">
                  <input type="checkbox" className="mt-1 accent-amber-900" checked={agreedToPolicy} onChange={e => setAgreedToPolicy(e.target.checked)} />
                  <span className="text-[11px] text-gray-500 font-medium">Я согласен с <Link to="/privacy" className="text-amber-900 underline font-black">Политикой конфиденциальности</Link></span>
                </label>
              )}
            </>
          )}

          {isOtpMode && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-amber-100/50 p-6 rounded-full animate-pulse">
                  <Mail size={40} className="text-amber-900" />
                </div>
              </div>
              <p className="text-[11px] text-center text-amber-900 font-bold leading-relaxed px-4">
                Мы отправили секретный код на вашу почту. Пожалуйста, введите его ниже для активации профиля.
              </p>
              <input type="text" placeholder="000000" className="w-full p-5 bg-amber-50 rounded-[2rem] border-2 border-amber-100 outline-none text-center text-4xl font-black tracking-[0.5em] text-amber-950 focus:border-orange-500 transition-colors" value={formData.otpCode} onChange={e => setFormData({...formData, otpCode: e.target.value})} maxLength={6} required />
              
              {resendTimer > 0 ? (
                <p className="text-[9px] text-center text-gray-400 font-black uppercase tracking-widest">Отправить повторно через {resendTimer} сек</p>
              ) : (
                <button type="button" onClick={() => { resendOTP(isLoginMode ? formData.identifier : formData.email); setResendTimer(60); }} className="w-full text-[9px] text-center text-amber-900 font-black uppercase tracking-widest hover:text-orange-600 transition">Отправить код еще раз</button>
              )}
            </div>
          )}

          <button type="submit" disabled={isAuthProcessing} className="w-full bg-amber-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-amber-800 transition disabled:opacity-50">
            {isAuthProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isOtpMode ? 'Подтвердить' : (isLoginMode ? 'Войти в аккаунт' : 'Создать профиль'))}
          </button>
        </form>

        {!isOtpMode && isLoginMode && (
          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t w-full border-amber-100"></div>
              <span className="absolute px-4 bg-white text-[10px] text-gray-300 font-black uppercase tracking-widest">или</span>
            </div>
            <button 
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-amber-50 py-4 rounded-[2rem] hover:bg-amber-50 transition-all duration-300"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              <span className="text-xs font-black text-amber-950 uppercase tracking-widest">Google Войти</span>
            </button>
          </div>
        )}
        
        <button onClick={() => { setIsLoginMode(!isLoginMode); setIsOtpMode(false); setAuthError(null); }} className="w-full mt-8 text-center text-amber-800 text-[10px] font-black uppercase tracking-[0.2em] hover:text-orange-600 transition">
          {isLoginMode ? 'Впервые у нас? Регистрация' : 'Уже есть аккаунт? Вход'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-amber-50 flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 bg-amber-100 rounded-[2.5rem] flex items-center justify-center text-amber-900 shadow-inner relative group overflow-hidden">
          <UserIcon size={56} className="group-hover:scale-110 transition duration-500" />
          <div className="absolute inset-0 bg-amber-900/5 opacity-0 group-hover:opacity-100 transition"></div>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-4xl font-black text-amber-950 italic tracking-tighter">{user.full_name}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-4 py-1.5 bg-amber-50 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
              {user.role === 'admin' ? 'Администратор' : 'Постоянный гость'}
            </span>
            <span className="px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
              {user.phone || 'Телефон не указан'}
            </span>
          </div>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 px-8 py-4 bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-[2rem] hover:bg-red-100 transition shadow-sm border border-red-100">
          <LogOut size={18} /> Выйти
        </button>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-6">
          <h3 className="text-2xl font-black text-amber-950 flex items-center gap-4 italic tracking-tighter">
            <Package className="text-amber-900" size={28}/> История заказов
          </h3>
          <span className="text-[10px] font-black uppercase text-amber-900/30 tracking-widest">{orders.length} заказов</span>
        </div>

        {isLoadingOrders ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-900/20" size={48} /></div>
        ) : orders.length === 0 ? (
          <div className="p-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-amber-100/50 flex flex-col items-center gap-4 group">
            <Clock size={48} className="text-amber-900/5 group-hover:scale-110 transition duration-500" />
            <p className="text-amber-900/20 font-black uppercase tracking-[0.3em] text-sm">История пуста</p>
            <button onClick={() => navigate('/')} className="mt-4 bg-amber-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-800">Перейти в меню</button>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-amber-50 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-900 font-black text-lg group-hover:bg-amber-950 group-hover:text-white transition-colors">
                        #{order.id.toString().slice(-3)}
                      </div>
                      <div>
                        <h4 className="font-black text-amber-950 text-xl tracking-tight">Заказ на {order.total_amount} ₽</h4>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-2">
                           <Clock size={10} /> {new Date(order.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs font-medium bg-gray-50 p-3 rounded-2xl">
                      <MapPin size={14} className="text-amber-900/30" />
                      <span className="truncate max-w-[300px]">{order.delivery_address}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between">
                    <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' : 
                      order.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {getStatusLabel(order.status)}
                    </div>
                    {order.status === 'delivered' && (
                       <button className="text-[9px] font-black uppercase text-amber-900/40 hover:text-amber-900 transition flex items-center gap-2 tracking-widest mt-4">
                         Повторить заказ <CheckCircle size={12} />
                       </button>
                    )}
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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pending': 'Ожидает',
    'confirmed': 'Принят',
    'cooking': 'Готовится',
    'delivering': 'В пути',
    'delivered': 'Доставлен',
    'cancelled': 'Отменен'
  };
  return labels[status] || status;
};

export default Profile;
