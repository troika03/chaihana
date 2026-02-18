
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../apiClient.ts';
import { supabase } from '../supabaseClient.ts';
import { 
  User as UserIcon, 
  Package, 
  Loader2, 
  Clock, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import Modal from '../components/ui/Modal.tsx';
import { Order } from './types.ts';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Новый',
  confirmed: 'Принят',
  cooking: 'Готовится',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

const Profile: React.FC = () => {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '',
    street: '',
    house: '',
    entrance: '',
    floor: '',
    apartment: '',
    doorCode: ''
  });

  const loadOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const data = await api.orders.getByUser(user.id);
      setOrders(data);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadOrders();

    const channel = supabase
      .channel(`user_orders_realtime_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    
    if (!formData.email.includes('@')) {
      setAuthError("Введите корректный адрес почты.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isLoginMode) {
        await signIn(formData.email.trim().toLowerCase(), formData.password);
      } else {
        const fullAddress = `ул. ${formData.street}, д. ${formData.house}${formData.entrance ? `, под. ${formData.entrance}` : ''}${formData.floor ? `, эт. ${formData.floor}` : ''}${formData.apartment ? `, кв. ${formData.apartment}` : ''}${formData.doorCode ? `, код: ${formData.doorCode}` : ''}`;
        await signUp(formData.email.trim().toLowerCase(), formData.password, formData.name.trim(), fullAddress);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) {
        msg = isLoginMode ? 'Неверная почта или пароль.' : 'Пользователь уже существует.';
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await api.orders.updateStatus(orderToCancel.id, 'cancelled');
      setOrders(prev => prev.map(o => o.id === orderToCancel.id ? { ...o, status: 'cancelled' } : o));
      setOrderToCancel(null);
    } catch (err) {
      alert("Не удалось отменить заказ.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4 text-amber-900/40">
      <Loader2 className="animate-spin" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest">Загрузка...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-amber-50 mt-10 animate-in fade-in zoom-in duration-500">
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
            onChange={e => setFormData({...formData, email: e.target.value.replace(/\s/g, '').toLowerCase()})} 
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
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Улица" 
                  className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all col-span-2" 
                  value={formData.street} 
                  onChange={e => setFormData({...formData, street: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Дом" 
                  className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all" 
                  value={formData.house} 
                  onChange={e => setFormData({...formData, house: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Квартира" 
                  className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950 border border-transparent focus:border-amber-200 transition-all" 
                  value={formData.apartment} 
                  onChange={e => setFormData({...formData, apartment: e.target.value.replace(/\D/g, '')})} 
                />
              </div>
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
            className="w-full bg-amber-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <button 
          onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(null); }} 
          className="w-full mt-8 text-amber-800 text-[10px] font-black uppercase tracking-widest text-center opacity-60 hover:opacity-100 transition-opacity border-t border-amber-50 pt-6"
        >
          {isLoginMode ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-1">
      <div className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-sm border flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-amber-100 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-amber-900 border-4 border-amber-50">
          <UserIcon size={48} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black text-amber-950 italic tracking-tighter">{user.full_name}</h2>
          <div className="flex items-center gap-2 justify-center md:justify-start mt-2">
            <span className="text-orange-600 font-black uppercase text-[10px] tracking-widest">
              {user.role === 'admin' ? 'Администратор' : 'Постоянный гость'}
            </span>
          </div>
        </div>
        <button onClick={signOut} className="w-full md:w-auto bg-red-50 text-red-600 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100">Выйти</button>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-amber-950 flex items-center gap-4 italic tracking-tighter px-4">
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
              <div key={order.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-amber-50 flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-lg transition-shadow overflow-hidden animate-in slide-in-from-left-4">
                <div className="text-center sm:text-left">
                  <h4 className="font-black text-amber-950 text-xl tracking-tight">Заказ #{order.id.toString().slice(-4)} на {order.total_amount} ₽</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1 justify-center sm:justify-start">
                    <Clock size={10} /> {new Date(order.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => setOrderToCancel(order)}
                      className="p-3 text-red-300 hover:text-red-600 transition-colors bg-red-50 rounded-2xl"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                  <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!orderToCancel} onClose={() => setOrderToCancel(null)} title="Отмена заказа">
        <div className="text-center space-y-8 py-4">
          <div className="flex justify-center"><div className="p-6 bg-red-50 rounded-full text-red-500 animate-pulse"><AlertTriangle size={48} /></div></div>
          <div>
            <p className="text-amber-950 font-black text-xl mb-2">Отменить заказ?</p>
            <p className="text-gray-400 text-sm">Это действие нельзя отменить.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setOrderToCancel(null)} className="flex-1 py-5 bg-amber-50 text-amber-950 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">Назад</button>
            <button onClick={confirmCancelOrder} disabled={isCancelling} className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl">
              {isCancelling ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Отменить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
