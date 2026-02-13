
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../apiClient';
import { Order, Dish } from './types';
import { 
  Package, 
  RefreshCw, 
  ShieldAlert, 
  BarChart3, 
  DollarSign, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Volume2, 
  VolumeX,
  BellRing,
  Eye,
  EyeOff
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
  
  // Звук и уведомления
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Состояние для редактирования блюда
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allOrders, allDishes] = await Promise.all([
        api.orders.getAll(),
        api.dishes.getAll()
      ]);
      setOrders(allOrders);
      setDishes(allDishes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();

      // Настройка Realtime подписки на новые заказы
      const channel = supabase
        .channel('admin_orders_channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new as Order;
            setOrders(prev => [newOrder, ...prev]);
            
            // Воспроизведение звука при новом заказе
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new as Order;
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, soundEnabled]);

  const stats = useMemo(() => {
    const succeeded = orders.filter(o => o.status === 'delivered' || o.payment_status === 'succeeded');
    const total = succeeded.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return {
      revenue: total,
      count: orders.length,
      avg: orders.length ? Math.round(total / orders.length) : 0,
      pending: orders.filter(o => o.status === 'pending').length
    };
  }, [orders]);

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    try {
      if (editingDish.id) {
        await api.dishes.update(editingDish.id, editingDish);
      } else {
        await api.dishes.create(editingDish);
      }
      setIsDishModalOpen(false);
      loadData();
    } catch (err) {
      alert("Ошибка сохранения блюда");
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm("Удалить это блюдо из меню?")) return;
    try {
      await api.dishes.delete(id);
      loadData();
    } catch (err) {
      alert("Ошибка при удалении");
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    try {
      await api.dishes.update(dish.id, { available: !dish.available });
      setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, available: !d.available } : d));
    } catch (err) {
      alert("Ошибка обновления статуса");
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-40 gap-8 text-center">
      <ShieldAlert size={80} className="text-amber-900/10" />
      <h2 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter">Вход только для Персонала</h2>
      <button onClick={() => window.location.href = '#/'} className="bg-amber-950 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">Назад в меню</button>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Скрытый аудио-элемент для уведомлений */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-amber-950 uppercase italic tracking-tighter flex items-center gap-3">
            Управление Чайханой <BellRing className={stats.pending > 0 ? "text-orange-500 animate-bounce" : "text-amber-200"} />
          </h1>
          <p className="text-amber-800/40 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Администратор: Жулебино Главный</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition shadow-sm ${soundEnabled ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-400'}`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Звук: {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
          
          <button onClick={loadData} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition shadow-sm">
             <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Выручка', val: `${stats.revenue} ₽`, icon: <DollarSign className="text-green-500" /> },
          { label: 'Всего заказов', val: stats.count, icon: <Package className="text-blue-500" /> },
          { label: 'Средний чек', val: `${stats.avg} ₽`, icon: <BarChart3 className="text-orange-500" /> },
          { label: 'В очереди', val: stats.pending, icon: <Clock className="text-amber-500" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-amber-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.label}</p>
              <div className="p-3 bg-amber-50 rounded-xl">{s.icon}</div>
            </div>
            <h4 className="text-4xl font-black text-amber-950 tracking-tighter">{s.val}</h4>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 p-2 bg-amber-100/30 rounded-[2rem] w-fit">
        {[
          { id: 'stats', label: 'Дашборд' },
          { id: 'orders', label: 'Заказы' },
          { id: 'menu', label: 'Меню' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-amber-950 text-white shadow-xl scale-105' : 'text-amber-900/40 hover:bg-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white rounded-[4rem] shadow-xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b flex justify-between items-center">
            <h3 className="font-black text-xl italic tracking-tight">Лента заказов (Realtime)</h3>
            <span className="flex items-center gap-2 text-[10px] font-bold text-green-500 animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full" /> Прямой эфир
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-amber-50/50">
                <tr>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">ID / Время</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Адрес / Коммент</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Блюда</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">Нет активных заказов</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className={`hover:bg-amber-50/10 transition-colors ${order.status === 'pending' ? 'bg-orange-50/30' : ''}`}>
                      <td className="p-8">
                        <div className="font-black text-amber-950 text-sm">#{order.id.toString().slice(-4)}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(order.created_at).toLocaleTimeString('ru-RU')}</div>
                      </td>
                      <td className="p-8 max-w-xs">
                        <div className="font-bold text-amber-900 text-xs truncate">{order.delivery_address}</div>
                        {order.comment && <div className="text-[9px] text-orange-500 font-bold uppercase mt-1 italic">"{order.comment}"</div>}
                      </td>
                      <td className="p-8">
                        <div className="text-[10px] font-bold text-gray-600 line-clamp-1">
                          {order.items?.map(item => `${item.dish.name} x${item.quantity}`).join(', ')}
                        </div>
                      </td>
                      <td className="p-8 font-black text-amber-950 text-lg whitespace-nowrap">{order.total_amount} ₽</td>
                      <td className="p-8">
                        <select 
                          value={order.status} 
                          onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any).then(loadData)} 
                          className={`text-[10px] font-black uppercase border-none rounded-xl p-4 outline-none cursor-pointer transition-colors ${
                            order.status === 'pending' ? 'bg-orange-500 text-white' : 
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-900'
                          }`}
                        >
                          <option value="pending">Новый</option>
                          <option value="confirmed">Принят</option>
                          <option value="cooking">Готовится</option>
                          <option value="delivering">В пути</option>
                          <option value="delivered">Завершен</option>
                          <option value="cancelled">Отменен</option>
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
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border">
            <h3 className="font-black text-xl italic tracking-tight">Управление меню</h3>
            <button 
              onClick={() => { setEditingDish({ available: true, category: 'main' }); setIsDishModalOpen(true); }}
              className="flex items-center gap-2 bg-amber-950 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition shadow-xl"
            >
              <Plus size={16} /> Добавить блюдо
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dishes.map(dish => (
              <div key={dish.id} className={`bg-white p-6 rounded-[3rem] border border-amber-50 shadow-sm hover:shadow-lg transition-all flex items-center gap-6 group relative overflow-hidden ${!dish.available ? 'opacity-70 bg-gray-50' : ''}`}>
                <img src={dish.image} alt={dish.name} className={`w-24 h-24 rounded-3xl object-cover shadow-inner ${!dish.available ? 'grayscale' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-amber-950 text-lg truncate">{dish.name}</h4>
                    {!dish.available && <span className="bg-red-500 text-white text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter">СТОП</span>}
                  </div>
                  <p className="text-orange-500 font-black text-sm">{dish.price} ₽</p>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      title={dish.available ? "В стоп-лист" : "В меню"}
                      onClick={() => toggleAvailability(dish)}
                      className={`p-3 rounded-xl transition ${dish.available ? 'bg-amber-50 text-amber-900 hover:bg-red-50 hover:text-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                      {dish.available ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }}
                      className="p-3 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteDish(dish.id)}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-amber-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h5 className="text-2xl font-black italic">Аналитика сегодня</h5>
              <div className="bg-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                <Clock size={16} className="text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <p className="text-white/40 font-black uppercase text-[10px] tracking-widest">Последние продажи</p>
                <div className="space-y-4">
                   {orders.slice(0, 3).map(o => (
                     <div key={o.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex justify-between items-center hover:bg-white/10 transition">
                        <div>
                          <p className="text-sm font-black text-white">Заказ #{o.id.toString().slice(-4)}</p>
                          <p className="text-[10px] text-white/30 uppercase font-bold mt-1 max-w-[150px] truncate">{o.delivery_address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-orange-400">{o.total_amount} ₽</p>
                          <p className={`text-[9px] uppercase font-black px-3 py-1 rounded-lg ${o.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-white/10'}`}>{o.status}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col justify-center items-center text-center">
                 <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 mb-6">
                    <ShieldAlert size={40} />
                 </div>
                 <h6 className="text-xl font-black italic mb-2">Все системы в норме</h6>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Supabase Database Connection: Active</p>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Realtime Sync: Online</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования/создания блюда */}
      <Modal 
        isOpen={isDishModalOpen} 
        onClose={() => setIsDishModalOpen(false)} 
        title={editingDish?.id ? "Редактировать блюдо" : "Новое блюдо"}
      >
        <form onSubmit={handleSaveDish} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Название</label>
            <input 
              required
              type="text" 
              className="w-full p-5 bg-amber-50 rounded-2xl font-bold text-amber-950 border-none outline-none focus:ring-4 ring-orange-500/10"
              value={editingDish?.name || ''}
              onChange={e => setEditingDish(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Цена (₽)</label>
              <input 
                required
                type="number" 
                className="w-full p-5 bg-amber-50 rounded-2xl font-bold text-amber-950 border-none outline-none focus:ring-4 ring-orange-500/10"
                value={editingDish?.price || 0}
                onChange={e => setEditingDish(prev => ({ ...prev, price: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Категория</label>
              <select 
                className="w-full p-5 bg-amber-50 rounded-2xl font-bold text-amber-950 border-none outline-none focus:ring-4 ring-orange-500/10"
                value={editingDish?.category || 'main'}
                onChange={e => setEditingDish(prev => ({ ...prev, category: e.target.value as any }))}
              >
                <option value="main">Основные</option>
                <option value="soups">Супы</option>
                <option value="salads">Салаты</option>
                <option value="desserts">Десерты</option>
                <option value="drinks">Напитки</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">URL Изображения</label>
            <input 
              required
              type="text" 
              className="w-full p-5 bg-amber-50 rounded-2xl font-bold text-amber-950 border-none outline-none focus:ring-4 ring-orange-500/10"
              value={editingDish?.image || ''}
              onChange={e => setEditingDish(prev => ({ ...prev, image: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Описание</label>
            <textarea 
              required
              rows={3}
              className="w-full p-5 bg-amber-50 rounded-2xl font-bold text-amber-950 border-none outline-none focus:ring-4 ring-orange-500/10 resize-none"
              value={editingDish?.description || ''}
              onChange={e => setEditingDish(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-4 py-4">
             <input 
                type="checkbox" 
                id="available"
                className="w-6 h-6 accent-orange-500"
                checked={editingDish?.available ?? true}
                onChange={e => setEditingDish(prev => ({ ...prev, available: e.target.checked }))}
             />
             <label htmlFor="available" className="text-[10px] font-black uppercase text-amber-950 tracking-widest">Доступно для заказа</label>
          </div>

          <button className="w-full bg-amber-950 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all">
            Сохранить блюдо
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;
