
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../apiClient';
import { Order, Dish } from './types';
import { 
  Package, 
  RefreshCw, 
  ShieldAlert, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Volume2, 
  VolumeX,
  BellRing,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  DollarSign,
  BarChart3,
  TrendingUp,
  History,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import Modal from '../components/ui/Modal';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'menu'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allOrders, allDishes] = await Promise.all([
        api.orders.getAll(),
        api.dishes.getAll()
      ]);
      setOrders(allOrders);
      setDishes(allDishes);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();

      const ordersChannel = supabase
        .channel('admin_orders_sync')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => [payload.new as Order, ...prev]);
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        })
        .subscribe();

      const dishesChannel = supabase
        .channel('admin_dishes_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setDishes(prev => [...prev, payload.new as Dish]);
          } else if (payload.eventType === 'UPDATE') {
            setDishes(prev => prev.map(d => d.id === payload.new.id ? payload.new as Dish : d));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            if (deletedId) {
              setDishes(prev => prev.filter(d => d.id !== deletedId));
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(dishesChannel);
      };
    }
  }, [isAdmin, soundEnabled]);

  // Расчет статистики
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const succeeded = todayOrders.filter(o => o.status === 'delivered' || (o as any).payment_status === 'succeeded');
    const totalRevenue = succeeded.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    return {
      revenue: totalRevenue,
      count: todayOrders.length,
      avg: todayOrders.length ? Math.round(totalRevenue / todayOrders.length) : 0,
      pending: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
      todayOrders: todayOrders
    };
  }, [orders]);

  // Фильтруем только АКТИВНЫЕ заказы для вкладки "Лента заказов"
  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    setIsLoading(true);
    try {
      if (editingDish.id) {
        await api.dishes.update(editingDish.id, editingDish);
      } else {
        await api.dishes.create(editingDish);
      }
      setIsDishModalOpen(false);
      setEditingDish(null);
    } catch (err) {
      alert("Ошибка сохранения");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteDish = async () => {
    if (!dishToDelete) return;
    setIsLoading(true);
    try {
      await api.dishes.delete(dishToDelete.id);
      setDishes(prev => prev.filter(d => d.id !== dishToDelete.id));
      setDishToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении блюда.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    try {
      await api.dishes.update(dish.id, { available: !dish.available });
    } catch (err) {
      alert("Ошибка обновления статуса");
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-40 gap-8 text-center">
      <ShieldAlert size={80} className="text-amber-900/10" />
      <h2 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter">Доступ ограничен</h2>
      <button onClick={() => window.location.href = '#/'} className="bg-amber-950 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">В меню</button>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter flex items-center gap-3">
            Чайхана Управление <BellRing className={stats.pending > 0 ? "text-orange-500 animate-bounce" : "text-amber-200"} />
          </h1>
          <p className="text-amber-800/40 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Контроль кухни и заказов в реальном времени</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition shadow-sm ${soundEnabled ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-400 border-gray-100'}`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Звук: {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
          
          <button onClick={loadData} disabled={isLoading} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-100 font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition shadow-sm disabled:opacity-50">
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Обновить
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Выручка сегодня', val: `${stats.revenue.toLocaleString()} ₽`, icon: <DollarSign size={20} />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Заказов сегодня', val: stats.count, icon: <Package size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Средний чек', val: `${stats.avg.toLocaleString()} ₽`, icon: <BarChart3 size={20} />, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Активных сейчас', val: stats.pending, icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-amber-50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 ${s.bg} rounded-bl-[5rem] -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.label}</p>
                <div className={`p-4 ${s.bg} ${s.color} rounded-2xl shadow-inner`}>{s.icon}</div>
              </div>
              <h4 className="text-4xl font-black text-amber-950 tracking-tighter mb-2">{s.val}</h4>
              <div className="flex items-center gap-2 text-[9px] font-bold text-green-500 uppercase tracking-tighter">
                <TrendingUp size={12} /> Авто-обновление
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 p-2 bg-amber-100/30 rounded-[2rem] w-fit">
        {['stats', 'orders', 'menu'].map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t as any)} 
            className={`px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === t ? 'bg-amber-950 text-white shadow-xl scale-105' : 'text-amber-900/40 hover:bg-white'}`}
          >
            {t === 'stats' ? 'Дашборд' : t === 'orders' ? `Активные (${activeOrders.length})` : 'Меню блюд'}
          </button>
        ))}
      </div>

      {/* Dashboard Section */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[4.5rem] border border-amber-50 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-amber-950 italic tracking-tighter flex items-center gap-3">
                   <History size={24} className="text-amber-900" /> История за сегодня
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-full">Все статусы</span>
             </div>
             <div className="space-y-6 flex-1 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
                {stats.todayOrders.length === 0 ? (
                  <div className="text-center py-20">
                     <Package size={48} className="mx-auto text-amber-100 mb-4" />
                     <p className="text-amber-900/20 font-black uppercase text-xs tracking-widest">Сегодня заказов еще не было</p>
                  </div>
                ) : (
                  stats.todayOrders.map(o => (
                    <div key={o.id} className="flex gap-6 items-center group cursor-pointer border-b border-amber-50 pb-6 last:border-0 hover:bg-amber-50/30 rounded-3xl p-4 transition-all">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all group-hover:rotate-12 ${
                        o.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        o.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-orange-600'
                      }`}>
                        {o.status === 'delivered' ? <CheckCircle2 size={24} /> : o.status === 'cancelled' ? <XCircle size={24} /> : <Clock size={24} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                           <p className="text-sm font-black text-amber-950">Заказ #{o.id.toString().slice(-4)}</p>
                           <p className="text-sm font-black text-amber-950">{o.total_amount} ₽</p>
                        </div>
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(o.created_at).toLocaleTimeString()}</p>
                           <p className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${
                              o.status === 'delivered' ? 'text-green-600 bg-green-50' : 
                              o.status === 'cancelled' ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'
                           }`}>{o.status}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
             <button onClick={() => setActiveTab('orders')} className="mt-12 w-full py-6 bg-amber-50 text-amber-950 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all">Смотреть только активные</button>
          </div>

          <div className="space-y-10">
             <div className="bg-amber-950 p-12 rounded-[4.5rem] text-white flex flex-col justify-center space-y-8 shadow-2xl relative overflow-hidden h-full">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
                <div className="relative z-10">
                   <h3 className="text-3xl font-black italic tracking-tighter mb-4">Архивация заказов</h3>
                   <p className="text-white/60 font-medium mb-12">Заказы со статусом «Завершен» или «Отменен» автоматически скрываются из рабочего списка и переносятся в историю дня.</p>
                   
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center gap-3">
                         <CheckCircle2 className="text-green-400" size={24} />
                         <span className="text-[10px] font-black uppercase text-white/40">Завершено</span>
                         <span className="text-2xl font-black">{stats.todayOrders.filter(o => o.status === 'delivered').length}</span>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center gap-3">
                         <XCircle className="text-red-400" size={24} />
                         <span className="text-[10px] font-black uppercase text-white/40">Отменено</span>
                         <span className="text-2xl font-black">{stats.todayOrders.filter(o => o.status === 'cancelled').length}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Orders View (ONLY ACTIVE) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-[4rem] shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-10 border-b border-amber-50 flex justify-between items-center">
            <div>
              <h3 className="font-black text-2xl italic tracking-tight text-amber-950">Очередь приготовления</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Здесь только те заказы, которые нужно доставить</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase text-green-500 px-4 py-2 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Живой поток
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-amber-50/30">
                <tr>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">ID / Время</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Клиент / Адрес</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Состав заказа</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Управление</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {activeOrders.length === 0 ? (
                  <tr><td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-200">
                        <Package size={48} />
                      </div>
                      <p className="font-black uppercase text-xs tracking-[0.3em] text-amber-900/20">Все заказы приготовлены!</p>
                    </div>
                  </td></tr>
                ) : (
                  activeOrders.map(order => (
                    <tr key={order.id} className={`hover:bg-amber-50/10 transition-colors group ${order.status === 'pending' ? 'bg-orange-50/40' : ''}`}>
                      <td className="p-8">
                        <div className="font-black text-amber-950 text-sm">#{order.id.toString().slice(-4)}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1">
                          <Clock size={10} /> {new Date(order.created_at).toLocaleTimeString('ru-RU')}
                        </div>
                      </td>
                      <td className="p-8 max-w-xs">
                        <div className="font-bold text-amber-900 text-xs truncate mb-1">{order.delivery_address}</div>
                        <div className="text-[10px] font-black text-amber-950 mb-1">{order.contact_phone}</div>
                        {order.comment && <div className="text-[9px] text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-lg inline-block italic">"{order.comment}"</div>}
                      </td>
                      <td className="p-8">
                        <div className="text-[10px] font-bold text-gray-600 space-y-1">
                          {order.items?.map((item: any, idx) => (
                            <div key={idx} className="flex justify-between gap-4">
                              <span>{item.dish.name}</span>
                              <span className="text-amber-950/40">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-8 font-black text-amber-950 text-lg">{order.total_amount} ₽</td>
                      <td className="p-8">
                        <select 
                          value={order.status} 
                          onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any)} 
                          className={`text-[10px] font-black uppercase border-none rounded-2xl p-4 outline-none cursor-pointer transition-all shadow-sm group-hover:shadow-md ${
                            order.status === 'pending' ? 'bg-orange-500 text-white' : 
                            order.status === 'delivered' ? 'bg-green-500 text-white' : 
                            order.status === 'cancelled' ? 'bg-red-500 text-white' : 'bg-amber-50 text-amber-900'
                          }`}
                        >
                          <option value="pending">Новый</option>
                          <option value="confirmed">Принят</option>
                          <option value="cooking">Готовится</option>
                          <option value="delivering">В пути</option>
                          <option value="delivered">Завершен ✅</option>
                          <option value="cancelled">Отменен ❌</option>
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

      {/* Menu View */}
      {activeTab === 'menu' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-amber-50">
            <div>
              <h3 className="font-black text-2xl italic tracking-tight text-amber-950">Картотека блюд</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Всего позиций: {dishes.length}</p>
            </div>
            <button 
              onClick={() => { setEditingDish({ available: true, category: 'main' }); setIsDishModalOpen(true); }}
              className="flex items-center gap-3 bg-amber-950 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl scale-100 hover:scale-105 active:scale-95"
            >
              <Plus size={18} /> Добавить позицию
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dishes.map(dish => (
              <div key={dish.id} className={`bg-white p-8 rounded-[3.5rem] border border-amber-50 shadow-sm hover:shadow-2xl transition-all flex items-center gap-8 group relative overflow-hidden ${!dish.available ? 'opacity-70 bg-gray-50' : ''}`}>
                <div className="relative">
                  <img src={dish.image} alt={dish.name} className={`w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl transition duration-500 ${!dish.available ? 'grayscale group-hover:grayscale-0' : 'group-hover:scale-110'}`} />
                  {!dish.available && (
                    <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center">
                      <EyeOff size={24} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-black text-amber-950 text-xl truncate">{dish.name}</h4>
                  </div>
                  <p className="text-orange-500 font-black text-lg mb-6">{dish.price} ₽</p>
                  
                  <div className="flex gap-2">
                    <button 
                      title={dish.available ? "В стоп-лист" : "В меню"}
                      onClick={() => toggleAvailability(dish)}
                      className={`p-4 rounded-2xl transition-all ${dish.available ? 'bg-amber-50 text-amber-900 hover:bg-orange-500 hover:text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                      {dish.available ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                      onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }}
                      className="p-4 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-950 hover:text-white transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => setDishToDelete(dish)}
                      disabled={isLoading}
                      className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dish Edit Modal */}
      <Modal 
        isOpen={isDishModalOpen} 
        onClose={() => setIsDishModalOpen(false)} 
        title={editingDish?.id ? "Редактирование блюда" : "Добавление в меню"}
      >
        <form onSubmit={handleSaveDish} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Наименование</label>
            <input 
              required
              type="text" 
              className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100 transition-all"
              value={editingDish?.name || ''}
              onChange={e => setEditingDish(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Цена (₽)</label>
              <input required type="number" className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100 transition-all" value={editingDish?.price || 0} onChange={e => setEditingDish(prev => ({ ...prev, price: parseInt(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Категория</label>
              <select className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100 transition-all appearance-none" value={editingDish?.category || 'main'} onChange={e => setEditingDish(prev => ({ ...prev, category: e.target.value as any }))}>
                <option value="main">Основные</option><option value="soups">Супы</option><option value="salads">Салаты</option><option value="desserts">Десерты</option><option value="drinks">Напитки</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">URL Изображения</label>
            <input required type="text" className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100 transition-all" value={editingDish?.image || ''} onChange={e => setEditingDish(prev => ({ ...prev, image: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Описание вкуса</label>
            <textarea required rows={3} className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100 transition-all resize-none" value={editingDish?.description || ''} onChange={e => setEditingDish(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <button disabled={isLoading} className="w-full bg-amber-950 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : editingDish?.id ? "Сохранить изменения" : "Опубликовать в меню"}
          </button>
        </form>
      </Modal>

      {/* Confirmation Modal for Deletion */}
      <Modal 
        isOpen={!!dishToDelete} 
        onClose={() => setDishToDelete(null)} 
        title="Удаление из базы"
      >
        <div className="text-center space-y-8 py-4">
          <div className="flex justify-center">
            <div className="p-6 bg-red-50 rounded-full text-red-500 animate-pulse">
              <AlertTriangle size={48} />
            </div>
          </div>
          <div>
            <p className="text-amber-950 font-black text-xl mb-2">Удалить «{dishToDelete?.name}»?</p>
            <p className="text-gray-400 text-sm font-medium">Это действие безвозвратно удалит блюдо из меню.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setDishToDelete(null)} className="flex-1 py-5 bg-amber-50 text-amber-950 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all">Отмена</button>
            <button onClick={confirmDeleteDish} disabled={isLoading} className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl disabled:opacity-50">
              {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
