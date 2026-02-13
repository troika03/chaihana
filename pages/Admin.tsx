
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Order, Dish } from './types';
import { 
  Plus, Edit2, Trash2, RefreshCw, 
  Package, Utensils, TrendingUp, 
  CheckCircle2, Clock, Truck, 
  XCircle, Filter, Search, Save, Calendar, Archive, Eye, ToggleLeft, ToggleRight,
  Volume2, VolumeX, BellRing, CreditCard, AlertCircle, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';

type TimeRange = 'day' | 'week' | 'month' | 'all' | 'custom';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const Admin: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'menu'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      
      const channel = supabase
        .channel('admin-orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newOrder = payload.new as Order;
                setOrders(prev => [newOrder, ...prev]);
                if (isSoundEnabled) audioRef.current?.play().catch(() => {});
            } else if (payload.eventType === 'UPDATE') {
                const updated = payload.new as Order;
                setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
            }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isAdmin, isSoundEnabled]);

  const loadData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const [ordersRes, dishesRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('dishes').select('*').order('name', { ascending: true })
      ]);
      
      if (ordersRes.error) throw ordersRes.error;
      if (dishesRes.error) throw dishesRes.error;

      if (ordersRes.data) setOrders(ordersRes.data);
      if (dishesRes.data) setDishes(dishesRes.data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('recursion')) {
        setDbError("Ошибка рекурсии политик RLS. Пожалуйста, примените SQL Fix на главной странице.");
      } else {
        setDbError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (showArchive) {
      return orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    }
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders, showArchive]);

  const stats = useMemo(() => {
    const now = new Date();
    let filtered = orders.filter(o => o.payment_status === 'succeeded' && o.status !== 'cancelled');

    if (timeRange !== 'all') {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.created_at);
        if (timeRange === 'day') return orderDate.toDateString() === now.toDateString();
        if (timeRange === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return orderDate >= weekAgo;
        }
        if (timeRange === 'month') {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        if (timeRange === 'custom') {
          return orderDate.toDateString() === new Date(customDate).toDateString();
        }
        return true;
      });
    }

    return {
      revenue: filtered.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      count: filtered.length,
      avgCheck: filtered.length ? Math.round(filtered.reduce((sum, o) => sum + (o.total_amount || 0), 0) / filtered.length) : 0
    };
  }, [orders, timeRange, customDate]);

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const updatePaymentStatus = async (orderId: number, newStatus: Order['payment_status']) => {
      try {
        const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId);
        if (error) throw error;
        setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
      } catch (err: any) {
        alert('Ошибка: ' + err.message);
      }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    try {
      setIsLoading(true);
      const isNew = !editingDish.id;
      const { data, error } = isNew 
        ? await supabase.from('dishes').insert([editingDish]).select().single()
        : await supabase.from('dishes').update(editingDish).eq('id', editingDish.id).select().single();
      if (error) throw error;
      if (isNew) setDishes([...dishes, data]);
      else setDishes(dishes.map(d => d.id === data.id ? data : d));
      setIsDishModalOpen(false);
      setEditingDish(null);
    } catch (err: any) {
      alert('Ошибка сохранения: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6 text-center px-4">
        <ShieldAlert size={64} className="text-amber-900/10" />
        <div>
          <h2 className="text-3xl font-black text-amber-950 italic tracking-tighter uppercase">Доступ ограничен</h2>
          <p className="text-amber-900/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Вы не являетесь администратором</p>
        </div>
        <button onClick={() => window.location.href = '#/'} className="mt-4 bg-amber-950 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-800 transition">Вернуться в меню</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-amber-950 uppercase italic tracking-tighter">Чайхана Жулебино: Админ</h1>
          <p className="text-amber-800/60 font-bold text-xs uppercase tracking-widest">Управление заказами и аналитика</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsSoundEnabled(!isSoundEnabled);
              if (!isSoundEnabled) audioRef.current?.play().catch(() => {});
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-sm border font-black text-[10px] uppercase tracking-widest transition-all ${
              isSoundEnabled 
                ? 'bg-amber-950 text-white border-amber-950 animate-in' 
                : 'bg-white text-amber-900 border-amber-100'
            }`}
          >
            {isSoundEnabled ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
            Звук: {isSoundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
          </button>

          <button onClick={loadData} className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-amber-100 font-black text-[10px] uppercase tracking-widest text-amber-900 transition hover:bg-amber-50">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Синхронизация
          </button>
        </div>
      </div>

      {dbError && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4">
          <AlertCircle size={24} />
          <p className="text-xs font-black uppercase tracking-widest">{dbError}</p>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-50 flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-black uppercase text-amber-900/40 mr-4 tracking-widest">Фильтр периода:</span>
            {['day', 'week', 'month', 'all'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r as TimeRange)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === r ? 'bg-amber-900 text-white shadow-lg' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                {r === 'day' ? 'Сегодня' : r === 'week' ? 'Неделя' : r === 'month' ? 'Месяц' : 'Все время'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StatCard title="Выручка (Оплачено)" value={`${stats.revenue.toLocaleString()} ₽`} icon={<TrendingUp className="text-green-600" />} />
            <StatCard title="Оплаченных заказов" value={stats.count} icon={<CheckCircle2 className="text-blue-600" />} />
            <StatCard title="Средний чек" value={`${stats.avgCheck} ₽`} icon={<Filter className="text-orange-600" />} />
          </div>
        </div>
      )}

      <div className="flex gap-2 p-1.5 bg-amber-100/30 rounded-2xl w-fit border border-amber-100">
        {['stats', 'orders', 'menu'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-amber-950 text-white shadow-xl scale-105' : 'text-amber-900/40 hover:bg-white hover:text-amber-900'
            }`}
          >
            {tab === 'stats' ? <TrendingUp size={14} /> : tab === 'orders' ? <Package size={14} /> : <Utensils size={14} />}
            {tab === 'stats' ? 'Статистика' : tab === 'orders' ? 'Заказы' : 'Меню'}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xl font-black text-amber-950 uppercase tracking-tighter italic flex items-center gap-3">
              {showArchive ? 'Архив заказов' : 'Актуальные заказы'}
            </h3>
            <button 
              onClick={() => setShowArchive(!showArchive)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                showArchive ? 'bg-amber-950 text-white shadow-xl' : 'bg-white border-2 border-amber-100 text-amber-950 hover:bg-amber-50'
              }`}
            >
              {showArchive ? <Eye size={14} /> : <Archive size={14} />}
              {showArchive ? 'К активным' : 'Архив'}
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-amber-50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-amber-50/50">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Заказ</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Оплата (ЮKassa)</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Статус заказа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center font-black text-amber-950/20 uppercase tracking-widest text-xs">
                      Заказов не обнаружено
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-amber-50/10 transition">
                      <td className="p-6">
                        <div className="font-black text-amber-950 text-sm flex items-center gap-2">
                          #{order.id.toString().slice(-4)}
                          {order.status === 'pending' && <BellRing size={12} className="text-orange-500 animate-bounce" />}
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            order.payment_status === 'succeeded' ? 'bg-green-50 text-green-700 border-green-200' :
                            order.payment_status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            <CreditCard size={10} />
                            {order.payment_status === 'succeeded' ? 'Оплачено' : 
                             order.payment_status === 'failed' ? 'Ошибка' : 'Ожидание'}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 font-black text-amber-950 text-base">{order.total_amount} ₽</td>
                      <td className="p-6">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                          className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl outline-none border-2 transition-all cursor-pointer ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Новый</option>
                          <option value="confirmed">Принят</option>
                          <option value="cooking">Готовится</option>
                          <option value="delivering">В пути</option>
                          <option value="delivered">Завершен</option>
                          <option value="cancelled">Отмена</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dishes.map(dish => (
               <div key={dish.id} className="bg-white rounded-[2.5rem] border border-amber-50 p-4">
                   <div className="h-40 rounded-2xl overflow-hidden mb-4"><img src={dish.image} className="w-full h-full object-cover" /></div>
                   <h4 className="font-black text-amber-950 uppercase text-xs mb-2 truncate">{dish.name}</h4>
                   <div className="flex justify-between items-center">
                       <span className="font-black text-amber-900">{dish.price} ₽</span>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }} className="p-2 bg-amber-50 rounded-xl text-amber-900"><Edit2 size={14}/></button>
                       </div>
                   </div>
               </div>
            ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-50 flex items-center gap-6 transition-all hover:shadow-xl group">
    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition duration-500">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">{title}</p>
      <h4 className="text-3xl font-black text-amber-950 tracking-tighter">{value}</h4>
    </div>
  </div>
);

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200';
    case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
    default: return 'bg-blue-50 text-blue-600 border-blue-200';
  }
};

export default Admin;
