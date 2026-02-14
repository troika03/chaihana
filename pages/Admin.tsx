
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
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient';
import Modal from '../components/ui/Modal.tsx';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'history' | 'menu'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const testBotConnection = async () => {
    const result = await api.orders.testBot();
    if (result.ok) {
      alert("Сообщение успешно отправлено! Проверьте Telegram.");
    } else {
      alert("Ошибка: " + (result.description || "Запрос заблокирован браузером (CORS) или неверный ID/Токен. Проверьте консоль F12."));
      console.error("Test Bot Result:", result);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
      
      const channel = supabase
        .channel('admin_realtime_sync')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => [payload.new as Order, ...prev]);
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play blocked', e));
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthOrders = orders.filter(o => new Date(o.created_at) >= monthAgo);

    const filteredByDateOrders = orders.filter(o => o.created_at.startsWith(selectedDate));

    return {
      today: getStatsForPeriod(todayOrders),
      month: getStatsForPeriod(monthOrders),
      selected: getStatsForPeriod(filteredByDateOrders),
      selectedOrders: filteredByDateOrders,
      pendingCount: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
    };
  }, [orders, selectedDate]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  }, [orders]);

  const historicalOrders = useMemo(() => {
    return orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const imageUrl = await api.storage.uploadDishImage(file);
      setEditingDish(prev => ({ ...prev, image: imageUrl }));
    } catch (err: any) {
      alert("Ошибка при загрузке фото: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            Чайхана Управление <BellRing className={activeOrders.some(o => o.status === 'pending') ? "text-orange-500 animate-bounce" : "text-amber-200"} />
          </h1>
          <p className="text-amber-800/40 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Панель ресторатора Чайхана Жулебино</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={testBotConnection} 
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition shadow-sm"
          >
            <Send size={16} /> Проверить бота
          </button>
          
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

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap gap-3 p-2 bg-amber-100/30 rounded-[2rem] w-fit">
        {[
          { id: 'orders', label: `В работе (${activeOrders.length})` },
          { id: 'history', label: `Архив / История` },
          { id: 'stats', label: 'Аналитика' },
          { id: 'menu', label: 'Меню' }
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

      {/* Tab: Orders Queue (Active) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-[4rem] shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-10 border-b border-amber-50 bg-gradient-to-r from-amber-50/50 to-white">
            <h3 className="font-black text-2xl italic tracking-tight text-amber-950">Очередь кухни и доставки</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Только активные заказы. Завершенные переходят в историю автоматически.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-amber-50/30">
                <tr>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Заказ</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Клиент / Адрес</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Блюда</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Управление статусом</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {activeOrders.length === 0 ? (
                  <tr><td colSpan={5} className="p-32 text-center text-amber-900/20 font-black uppercase text-xs tracking-widest">Активных заказов в работе нет</td></tr>
                ) : (
                  activeOrders.map(order => (
                    <tr key={order.id} className="hover:bg-amber-50/10 transition-colors group">
                      <td className="p-8">
                        <div className="font-black text-amber-950 text-sm">#{order.id.toString().slice(-4)}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1"><Clock size={10}/> {new Date(order.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-8">
                        <div className="text-xs font-bold text-amber-900 truncate max-w-[200px] mb-1">{order.delivery_address}</div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-950">
                          <Phone size={12} className="text-orange-500"/> {order.contact_phone}
                        </div>
                      </td>
                      <td className="p-8">
                         <div className="text-[10px] font-bold text-gray-500 space-y-1">
                            {order.items?.map((item: any, i) => (
                              <div key={i} className="flex justify-between gap-4 border-b border-amber-50/50 pb-1 last:border-0">
                                <span>{item.dish.name}</span>
                                <span className="text-orange-600 font-black">x{item.quantity}</span>
                              </div>
                            ))}
                         </div>
                      </td>
                      <td className="p-8 font-black text-amber-950">{order.total_amount} ₽</td>
                      <td className="p-8">
                        <select 
                          value={order.status} 
                          onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any)} 
                          className={`text-[10px] font-black uppercase border-none rounded-2xl p-4 transition-all outline-none cursor-pointer shadow-sm ${
                            order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            order.status === 'confirmed' ? 'bg-orange-500 text-white shadow-orange-200 shadow-lg' : 
                            order.status === 'delivering' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">🆕 Новый (Ожидание)</option>
                          <option value="confirmed">✅ Принят (Отправить курьеру)</option>
                          <option value="cooking">👨‍🍳 Готовится</option>
                          <option value="delivering">🚚 В пути / Курьер</option>
                          <option value="delivered">🏁 Доставлен (В историю)</option>
                          <option value="cancelled">❌ Отменен (В историю)</option>
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

      {/* Tab: History (Historical Orders) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-[4rem] shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
           <div className="p-10 border-b border-amber-50 bg-gray-50/50">
            <h3 className="font-black text-2xl italic tracking-tight text-amber-950 flex items-center gap-4">
              <History size={28} className="text-gray-400" /> Архив завершенных заказов
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Здесь отображаются все выполненные или отмененные заказы за все время.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-amber-50/30">
                <tr>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">ID / Дата</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Адрес</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {historicalOrders.length === 0 ? (
                  <tr><td colSpan={4} className="p-32 text-center text-amber-900/20 font-black uppercase text-xs tracking-widest">История пока пуста</td></tr>
                ) : (
                  historicalOrders.map(order => (
                    <tr key={order.id} className="hover:bg-amber-50/10 transition-colors opacity-80 hover:opacity-100">
                      <td className="p-8">
                        <div className="font-black text-amber-950 text-sm">#{order.id.toString().slice(-4)}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-8 text-[11px] font-bold text-amber-900">{order.delivery_address}</td>
                      <td className="p-8 font-black text-amber-950">{order.total_amount} ₽</td>
                      <td className="p-8">
                         <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                           order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                         }`}>
                           {order.status === 'delivered' ? 'Завершен ✅' : 'Отменен ❌'}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ... Остальной код Admin.tsx остается прежним ... */}
      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in zoom-in duration-500">
           <div className="lg:col-span-1 bg-white p-10 rounded-[4rem] border border-amber-50 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-amber-950 italic tracking-tight flex items-center gap-3">
                <CalendarIcon size={20} className="text-orange-500" /> Фильтр за дату
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">{stats.selected.successfulCount} доставлено</p>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-amber-50 shadow-sm">
              <h3 className="text-xl font-black text-amber-950 italic tracking-tight mb-8">Детализация за выбранный день</h3>
              <div className="space-y-4">
                {stats.selectedOrders.length === 0 ? (
                  <div className="py-20 text-center opacity-20"><History size={48} className="mx-auto mb-4"/> <p className="font-black uppercase text-xs tracking-widest">Нет записей</p></div>
                ) : (
                  stats.selectedOrders.map(o => (
                    <div key={o.id} className="p-6 bg-amber-50/30 rounded-[2.5rem] border border-amber-100 flex justify-between items-center">
                       <div>
                          <p className="font-black text-amber-950">#{o.id.toString().slice(-4)} — {o.total_amount} ₽</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{o.delivery_address}</p>
                       </div>
                       <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${o.status === 'delivered' ? 'text-green-600' : 'text-orange-500'}`}>{o.status}</span>
                    </div>
                  ))
                )}
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dishes.map(dish => (
              <div key={dish.id} className={`bg-white p-6 rounded-[3rem] border border-amber-50 shadow-sm hover:shadow-2xl transition-all relative group ${!dish.available ? 'opacity-60 grayscale' : ''}`}>
                <div className="h-40 rounded-[2rem] overflow-hidden mb-6">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                </div>
                <h4 className="font-black text-amber-950 text-sm truncate mb-1">{dish.name}</h4>
                <div className="flex gap-2">
                   <button onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }} className="flex-1 py-3 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-950 hover:text-white transition-all flex items-center justify-center"><Edit3 size={16} /></button>
                   <button onClick={() => setDishToDelete(dish)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isDishModalOpen} onClose={() => setIsDishModalOpen(false)} title={editingDish?.id ? "Изменить блюдо" : "Новое блюдо"}>
        <form onSubmit={handleSaveDish} className="space-y-6">
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
                 <option value="main">Основные</option>
                 <option value="soups">Супы</option>
                 <option value="salads">Салаты</option>
                 <option value="desserts">Десерты</option>
                 <option value="drinks">Напитки</option>
               </select>
             </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 block">Фото</label>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-4 border-dashed border-amber-100 rounded-[2rem] flex flex-col items-center justify-center text-amber-900/40 hover:bg-amber-50 transition gap-2">
              <Upload size={24} /> <span className="text-[10px] font-black uppercase tracking-widest">Загрузить фото</span>
            </button>
          </div>
          <button disabled={isLoading || isUploading} className="w-full bg-amber-950 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all">
            {isLoading ? <Loader2 size={24} className="animate-spin mx-auto" /> : "Сохранить"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!dishToDelete} onClose={() => setDishToDelete(null)} title="Удалить?">
        <div className="text-center space-y-8 py-4">
          <div className="flex justify-center"><div className="p-6 bg-red-50 rounded-full text-red-500"><AlertTriangle size={48} /></div></div>
          <p className="text-amber-950 font-black">Удалить «{dishToDelete?.name}»?</p>
          <div className="flex gap-4">
            <button onClick={() => setDishToDelete(null)} className="flex-1 py-5 bg-amber-50 text-amber-950 rounded-2xl font-black text-[10px] uppercase">Отмена</button>
            <button onClick={confirmDeleteDish} className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase">Удалить</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
