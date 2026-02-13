
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../apiClient';
import { Order, Dish, SupportMessage } from './types';
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
  BarChart3,
  TrendingUp,
  History,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
  Phone,
  MapPin,
  MessageSquare,
  ChevronRight,
  Search,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient';
import Modal from '../components/ui/Modal.tsx';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'history' | 'menu' | 'support'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allOrders, allDishes, allMessages] = await Promise.all([
        api.orders.getAll(),
        api.dishes.getAll(),
        api.support.getAll()
      ]);
      setOrders(allOrders);
      setDishes(allDishes);
      setSupportMessages(allMessages);
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
        .channel('admin_realtime_sync')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => [payload.new as Order, ...prev]);
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
          setSupportMessages(prev => [payload.new as SupportMessage, ...prev]);
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_messages' }, (payload) => {
          setSupportMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as SupportMessage : m));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAdmin, soundEnabled]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const getStatsForPeriod = (periodOrders: Order[]) => {
      const successful = periodOrders.filter(o => o.status === 'delivered');
      const revenue = successful.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const avgCheck = successful.length > 0 ? Math.round(revenue / successful.length) : 0;
      return { revenue, count: periodOrders.length, avgCheck, successfulCount: successful.length };
    };

    const todayOrders = orders.filter(o => o.created_at.startsWith(todayStr));
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthOrders = orders.filter(o => new Date(o.created_at) >= monthAgo);

    const filteredByDateOrders = orders.filter(o => o.created_at.startsWith(selectedDate));

    return {
      today: getStatsForPeriod(todayOrders),
      week: getStatsForPeriod(weekOrders),
      month: getStatsForPeriod(monthOrders),
      selected: getStatsForPeriod(filteredByDateOrders),
      selectedOrders: filteredByDateOrders,
      pendingCount: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
      newMessages: supportMessages.filter(m => m.status === 'new').length
    };
  }, [orders, selectedDate, supportMessages]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
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
      loadData();
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
      alert("Ошибка при удалении блюда.");
    } finally {
      setIsLoading(false);
    }
  };

  const markMessageAsRead = async (id: number) => {
    try {
      await api.support.updateStatus(id, 'read');
      setSupportMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-40 gap-8 text-center">
      <ShieldAlert size={80} className="text-amber-900/10" />
      <h2 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter">Доступ ограничен</h2>
      <button onClick={() => window.location.hash = '#/'} className="bg-amber-950 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">В меню</button>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter flex items-center gap-3">
            Чайхана Управление <BellRing className={(stats.pendingCount > 0 || stats.newMessages > 0) ? "text-orange-500 animate-bounce" : "text-amber-200"} />
          </h1>
          <p className="text-amber-800/40 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Панель ресторатора Чайхана Жулебино</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition shadow-sm ${soundEnabled ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-400 border-gray-100'}`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Звук: {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
          
          <button onClick={loadData} disabled={isLoading} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-gray-100 font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition shadow-sm">
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Обновить
          </button>
        </div>
      </div>

      {/* Statistics Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Выручка за сегодня', val: `${stats.today.revenue.toLocaleString()} ₽`, sub: `Ср. чек: ${stats.today.avgCheck} ₽`, icon: <TrendingUp size={20}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Выручка за месяц', val: `${stats.month.revenue.toLocaleString()} ₽`, sub: `Всего: ${stats.month.count} зак.`, icon: <BarChart3 size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Заказов сегодня', val: stats.today.count, sub: `${stats.today.successfulCount} доставлено`, icon: <Package size={20}/>, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'В работе', val: stats.pendingCount, sub: `${stats.newMessages} сообщ. поддержки`, icon: <MessageCircle size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-amber-50 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.label}</p>
                  <div className={`p-3 ${s.bg} ${s.color} rounded-xl`}>{s.icon}</div>
                </div>
                <h4 className="text-3xl font-black text-amber-950 tracking-tighter mb-1">{s.val}</h4>
                <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">{s.sub}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap gap-3 p-2 bg-amber-100/30 rounded-[2rem] w-fit">
        {[
          { id: 'stats', label: 'Статистика дня' },
          { id: 'orders', label: `Очередь (${activeOrders.length})` },
          { id: 'history', label: 'Все заказы' },
          { id: 'menu', label: 'Меню блюд' },
          { id: 'support', label: `Поддержка ${stats.newMessages > 0 ? `(${stats.newMessages})` : ''}` }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)} 
            className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-amber-950 text-white shadow-xl scale-105' : 'text-amber-900/40 hover:bg-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in zoom-in duration-500">
           {/* Date Picker & Summary */}
           <div className="lg:col-span-1 bg-white p-10 rounded-[4rem] border border-amber-50 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-amber-950 italic tracking-tight flex items-center gap-3">
                <CalendarIcon size={20} className="text-orange-500" /> Выбрать дату
              </h3>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-6 bg-amber-50 rounded-[2rem] font-black text-amber-950 border-none outline-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
              />
              <div className="p-8 bg-amber-950 text-white rounded-[3rem] space-y-4 shadow-xl">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Итоги за {new Date(selectedDate).toLocaleDateString()}</p>
                 <div className="space-y-1">
                    <p className="text-4xl font-black italic">{stats.selected.revenue} ₽</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">{stats.selected.count} заказов выполнено</p>
                 </div>
                 <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase opacity-60">Средний чек</span>
                    <span className="font-black">{stats.selected.avgCheck} ₽</span>
                 </div>
              </div>
           </div>

           {/* Detailed Orders for Period List */}
           <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-amber-50 shadow-sm flex flex-col">
              <h3 className="text-xl font-black text-amber-950 italic tracking-tight mb-8">Детализированные заказы ({stats.selectedOrders.length})</h3>
              <div className="space-y-6 flex-1 overflow-y-auto max-h-[700px] pr-4 no-scrollbar">
                {stats.selectedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20">
                    <History size={48} />
                    <p className="font-black uppercase text-xs tracking-widest">Нет заказов за этот день</p>
                  </div>
                ) : (
                  stats.selectedOrders.map(o => (
                    <div key={o.id} className="p-8 bg-amber-50/30 rounded-[2.5rem] border border-transparent hover:border-amber-200 transition-all group shadow-sm">
                       <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-inner ${o.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-white text-orange-600'}`}>
                               #{o.id.toString().slice(-4)}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-amber-950 text-lg">{o.total_amount} ₽</p>
                                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${o.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                    {o.status}
                                  </span>
                                </div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                  <Clock size={10} /> {new Date(o.created_at).toLocaleTimeString()}
                                </p>
                             </div>
                          </div>
                          <div className="flex gap-4">
                             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[10px] font-bold text-amber-950 shadow-sm">
                               <Phone size={12} className="text-orange-500" /> {o.contact_phone || 'Нет тел.'}
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
                          <div className="space-y-3">
                             <p className="font-black uppercase tracking-widest text-amber-900/40 text-[9px] flex items-center gap-2"><Package size={12}/> Состав заказа:</p>
                             <div className="space-y-1 pl-4 border-l-2 border-orange-500/20">
                                {o.items?.map((item: any, i) => (
                                  <div key={i} className="flex justify-between font-bold text-amber-950/80">
                                    <span>{item.dish.name}</span>
                                    <span className="text-orange-500">x{item.quantity}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-3">
                             <p className="font-black uppercase tracking-widest text-amber-900/40 text-[9px] flex items-center gap-2"><MapPin size={12}/> Адрес & Комментарий:</p>
                             <div className="space-y-2">
                                <p className="font-bold text-amber-950 leading-tight">{o.delivery_address || 'Самовывоз'}</p>
                                {o.comment && (
                                  <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-xl italic text-orange-700/80 text-[10px]">
                                    <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                    <span>{o.comment}</span>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}

      {/* Tab: Orders Queue */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-[4rem] shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-10 border-b border-amber-50">
            <h3 className="font-black text-2xl italic tracking-tight text-amber-950">Очередь кухни</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Текущие заказы в работе</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-amber-50/30">
                <tr>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">ID / Время</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Клиент / Адрес</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Состав</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {activeOrders.length === 0 ? (
                  <tr><td colSpan={5} className="p-32 text-center text-amber-900/20 font-black uppercase text-xs tracking-widest">Активных заказов нет</td></tr>
                ) : (
                  activeOrders.map(order => (
                    <tr key={order.id} className="hover:bg-amber-50/10 transition-colors">
                      <td className="p-8">
                        <div className="font-black text-amber-950 text-sm">#{order.id.toString().slice(-4)}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(order.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-8">
                        <div className="text-xs font-bold text-amber-900 truncate max-w-[200px]">{order.delivery_address}</div>
                        <div className="text-[10px] font-black text-amber-950">{order.contact_phone}</div>
                      </td>
                      <td className="p-8">
                         <div className="text-[10px] font-bold text-gray-500">
                            {order.items?.map((item: any, i) => (
                              <div key={i}>{item.dish.name} x{item.quantity}</div>
                            ))}
                         </div>
                      </td>
                      <td className="p-8 font-black text-amber-950">{order.total_amount} ₽</td>
                      <td className="p-8">
                        <select 
                          value={order.status} 
                          onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any)} 
                          className="text-[10px] font-black uppercase border-none rounded-2xl p-4 bg-orange-500 text-white outline-none cursor-pointer"
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

      {/* Tab: Support Messages */}
      {activeTab === 'support' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-10 rounded-[3rem] border border-amber-50 shadow-sm flex justify-between items-center">
              <h3 className="font-black text-2xl italic tracking-tight text-amber-950 flex items-center gap-3">
                 <MessageCircle size={24} className="text-orange-500" /> Сообщения поддержки
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {stats.newMessages} новых сообщений
              </p>
           </div>
           
           <div className="grid gap-6">
              {supportMessages.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center text-amber-900/20 font-black uppercase text-xs tracking-widest">
                   Сообщений пока нет
                </div>
              ) : (
                supportMessages.map(msg => (
                  <div key={msg.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm transition-all hover:shadow-md ${msg.status === 'new' ? 'border-orange-500/30 bg-orange-50/10' : 'border-amber-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${msg.status === 'new' ? 'bg-orange-500 text-white' : 'bg-amber-100 text-amber-900'}`}>
                             {msg.user_name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-black text-amber-950">{msg.user_name}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(msg.created_at).toLocaleString()}</p>
                          </div>
                       </div>
                       {msg.status === 'new' && (
                          <button 
                            onClick={() => markMessageAsRead(msg.id)}
                            className="text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-4 py-2 rounded-xl hover:bg-orange-200 transition-colors"
                          >
                            Отметить как прочитано
                          </button>
                       )}
                    </div>
                    <div className="bg-amber-50/50 p-6 rounded-[2rem] text-sm text-amber-950 font-medium italic">
                      "{msg.message}"
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Tab: Menu Management */}
      {activeTab === 'menu' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-amber-50">
            <div>
              <h3 className="font-black text-2xl italic tracking-tight text-amber-950">Картотека меню</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Всего позиций: {dishes.length}</p>
            </div>
            <button 
              onClick={() => { setEditingDish({ available: true, category: 'main' }); setIsDishModalOpen(true); }}
              className="flex items-center gap-3 bg-amber-950 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl"
            >
              <Plus size={18} /> Добавить блюдо
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dishes.map(dish => (
              <div key={dish.id} className={`bg-white p-6 rounded-[3rem] border border-amber-50 shadow-sm hover:shadow-2xl transition-all relative group ${!dish.available ? 'opacity-60 grayscale' : ''}`}>
                <div className="h-48 rounded-[2rem] overflow-hidden mb-6">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                </div>
                <h4 className="font-black text-amber-950 text-lg truncate mb-1">{dish.name}</h4>
                <p className="text-orange-500 font-black text-md mb-6">{dish.price} ₽</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      await api.dishes.update(dish.id, { available: !dish.available });
                      loadData();
                    }}
                    className={`flex-1 py-4 rounded-2xl transition-all flex items-center justify-center ${dish.available ? 'bg-amber-50 text-amber-950 hover:bg-orange-500 hover:text-white' : 'bg-green-500 text-white'}`}
                  >
                    {dish.available ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }} className="flex-1 py-4 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-950 hover:text-white transition-all flex items-center justify-center">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => setDishToDelete(dish)} className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dish Add/Edit Modal */}
      <Modal 
        isOpen={isDishModalOpen} 
        onClose={() => setIsDishModalOpen(false)} 
        title={editingDish?.id ? "Изменить позицию" : "Новое блюдо"}
      >
        <form onSubmit={handleSaveDish} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Название</label>
              <input required type="text" className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100" value={editingDish?.name || ''} onChange={e => setEditingDish(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Цена (₽)</label>
                <input required type="number" className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none focus:ring-4 focus:ring-amber-100" value={editingDish?.price || 0} onChange={e => setEditingDish(prev => ({ ...prev, price: parseInt(e.target.value) }))} />
               </div>
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Категория</label>
                <select className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none appearance-none" value={editingDish?.category || 'main'} onChange={e => setEditingDish(prev => ({ ...prev, category: e.target.value as any }))}>
                  <option value="main">Основные</option><option value="soups">Супы</option><option value="salads">Салаты</option><option value="desserts">Десерты</option><option value="drinks">Напитки</option>
                </select>
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Ссылка на фото</label>
              <input required type="text" className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none" value={editingDish?.image || ''} onChange={e => setEditingDish(prev => ({ ...prev, image: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Описание</label>
              <textarea required rows={3} className="w-full p-6 bg-amber-50 rounded-[2rem] font-bold text-amber-950 border-none outline-none resize-none" value={editingDish?.description || ''} onChange={e => setEditingDish(prev => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
          <button disabled={isLoading} className="w-full bg-amber-950 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-4">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : "Сохранить"}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!dishToDelete} onClose={() => setDishToDelete(null)} title="Удалить блюдо?">
        <div className="text-center space-y-8 py-4">
          <div className="flex justify-center"><div className="p-6 bg-red-50 rounded-full text-red-500 animate-pulse"><AlertTriangle size={48} /></div></div>
          <div><p className="text-amber-950 font-black text-xl mb-2">Удалить «{dishToDelete?.name}»?</p><p className="text-gray-400 text-sm font-medium">Это действие безвозвратно удалит позицию из меню.</p></div>
          <div className="flex gap-4">
            <button onClick={() => setDishToDelete(null)} className="flex-1 py-5 bg-amber-50 text-amber-950 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all">Отмена</button>
            <button onClick={confirmDeleteDish} disabled={isLoading} className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl">
              {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Удалить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
