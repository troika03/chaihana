
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient.ts';
import { LogOut, User as UserIcon, Phone, Mail, Package, Lock, Loader2, Smartphone, AlertCircle, ShieldCheck, ArrowLeft, Clock, MapPin, CheckCircle, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  
  const otpInputRef = useRef<HTMLInputElement>(null);
  
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
        if (error) setAuthError('Неверный код');
        else setIsOtpMode(false);
      } else if (isLoginMode) {
        const { error } = await signIn(formData.identifier, formData.password);
        if (error) setAuthError(error.message);
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone, formData.address);
        if (error) setAuthError(error.message);
        else { setIsOtpMode(true); setResendTimer(60); }
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  if (isLoading) return <div className="flex flex-col items-center py-32"><Loader2 className="animate-spin text-amber-900" size={40} /></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-amber-50 mt-10 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-amber-900">
            {isOtpMode ? 'Подтверждение' : (isLoginMode ? 'Вход в систему' : 'Новый гость')}
            </h2>
            <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-[0.3em] font-black">Чайхана Жулебино</p>
        </div>

        {authError && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{authError}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isOtpMode && (
            <>
              {isLoginMode ? (
                <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} required />
              ) : (
                <>
                  <input type="text" placeholder="Ваше имя" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </>
              )}
              <input type="password" placeholder="Пароль" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              
              {!isLoginMode && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={agreedToPolicy} onChange={e => setAgreedToPolicy(e.target.checked)} />
                  <span className="text-[11px] text-gray-500">Я согласен с <Link to="/privacy" className="text-amber-900 underline font-bold">Политикой конфиденциальности</Link></span>
                </label>
              )}
            </>
          )}

          {isOtpMode && (
            <input type="text" placeholder="6-значный код" className="w-full p-4 bg-amber-50 rounded-2xl outline-none text-center text-2xl font-black" value={formData.otpCode} onChange={e => setFormData({...formData, otpCode: e.target.value})} maxLength={6} required />
          )}

          <button type="submit" disabled={isAuthProcessing} className="w-full bg-amber-900 text-white py-4 rounded-2xl font-black hover:bg-amber-800 transition">
            {isAuthProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isOtpMode ? 'Подтвердить' : (isLoginMode ? 'Войти' : 'Создать аккаунт'))}
          </button>
        </form>

        {!isOtpMode && isLoginMode && (
          <div className="mt-4">
            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t w-full border-gray-100"></div>
              <span className="absolute px-3 bg-white text-[10px] text-gray-400 font-bold uppercase">или</span>
            </div>
            <button 
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3 rounded-2xl hover:bg-gray-50 transition"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              <span className="text-sm font-bold text-gray-700">Войти через Google</span>
            </button>
          </div>
        )}
        
        <button onClick={() => setIsLoginMode(!isLoginMode)} className="w-full mt-6 text-center text-amber-800 text-xs font-black uppercase tracking-widest">
          {isLoginMode ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-50 flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-900 shadow-inner">
          <UserIcon size={40} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-black text-amber-950">{user.full_name}</h2>
          <p className="text-amber-800/60 font-bold text-xs uppercase mt-1">{user.role === 'admin' ? 'Администратор' : 'Гость'}</p>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-black text-[10px] uppercase rounded-2xl hover:bg-red-100 transition">
          <LogOut size={20} /> Выйти
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-amber-950 flex items-center gap-3"><Package className="text-amber-900"/> История заказов</h3>
        {orders.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-amber-100 text-gray-400 font-bold">Заказов пока нет</div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-amber-50 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-amber-950">Заказ #{order.id}</h4>
                    <span className="text-[10px] text-gray-400 uppercase font-black">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {order.status}
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
