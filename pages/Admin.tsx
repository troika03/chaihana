
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Order, Dish } from './types';
import { 
  Plus, Edit2, Trash2, RefreshCw, 
  Package, Utensils, TrendingUp, 
  CheckCircle2, Clock, Truck, 
  XCircle, Filter, Search, Save, Calendar, Archive, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';

type TimeRange = 'day' | 'week' | 'month' | 'all' | 'custom';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'menu'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, dishesRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('dishes').select('*').order('name', { ascending: true })
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (dishesRes.data) setDishes(dishesRes.data);
    } catch (err: any) {
      console.error(err);
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
    let filtered = orders.filter(o => o.status === 'delivered'); // Считаем только завершенные заказы для статистики выручки

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

      if (isNew) {
        setDishes([...dishes, data]);
      } else {
        setDishes(dishes.map(d => d.id === data.id ? data : d));
      }
      setIsDishModalOpen(false);
      setEditingDish(null);
    } catch (err: any) {
      alert('Ошибка сохранения: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!window.confirm('Удалить это блюдо?')) return;
    try {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
      setDishes(dishes.filter(d => d.id !== id));
    } catch (err: any) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const toggleDishAvailability = async (dish: Dish) => {
    try {
      const { error } = await supabase.from('dishes').update({ available: !dish.available }).eq('id', dish.id);
      if (error) throw error;
      setDishes(dishes.map(d => d.id === dish.id ? { ...d, available: !d.available } : d));
    } catch (err: any) {
      console.error(err);
    }
  };

  if (!isAdmin) return <div className="text-center py-20 font-black text-amber-950 uppercase tracking-widest">Доступ запрещен</div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-amber-950 uppercase italic tracking-tighter">Чайхана Жулебино: Админ</h1>
          <p className="text-amber-800/60 font-bold text-xs uppercase tracking-widest">Панель управления заведением</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-amber-100 font-black text-[10px] uppercase tracking-widest text-amber-900 transition hover:bg-amber-50">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Синхронизация данных
        </button>
      </div>

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

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-50 flex flex-wrap gap-3 items-center">
            <span className="text-[10px] font-black uppercase text-amber-900/40 mr-4 tracking-widest">Фильтр периода:</span>
            {[
              { id: 'day', label: 'Сегодня' },
              { id: 'week', label: 'Неделя' },
              { id: 'month', label: 'Месяц' },
              { id: 'all', label: 'Все время' },
              { id: 'custom', label: 'По дате' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setTimeRange(r.id as TimeRange)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === r.id ? 'bg-amber-900 text-white shadow-lg' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                {r.label}
              </button>
            ))}
            {timeRange === 'custom' && (
              <input 
                type="date" 
                value={customDate} 
                onChange={(e) => setCustomDate(e.target.value)}
                className="ml-2 p-2.5 rounded-xl border-none bg-amber-50 text-amber-900 font-black text-[10px] outline-none"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StatCard title="Выручка (Доставлено)" value={`${stats.revenue.toLocaleString()} ₽`} icon={<TrendingUp className="text-green-600" />} />
            <StatCard title="Завершено заказов" value={stats.count} icon={<CheckCircle2 className="text-blue-600" />} />
            <StatCard title="Средний чек" value={`${stats.avgCheck} ₽`} icon={<Filter className="text-orange-600" />} />
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xl font-black text-amber-950 uppercase tracking-tighter italic">
              {showArchive ? 'Архив (Завершенные)' : 'Оперативные заказы'}
            </h3>
            <button 
              onClick={() => setShowArchive(!showArchive)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                showArchive ? 'bg-amber-950 text-white shadow-xl' : 'bg-white border-2 border-amber-100 text-amber-950 hover:bg-amber-50'
              }`}
            >
              {showArchive ? <Eye size={14} /> : <Archive size={14} />}
              {showArchive ? 'К активным' : 'Открыть архив'}
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-amber-50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-amber-50/50">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Заказ</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Клиент / Адрес</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Сумма</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-amber-900/40">Управление статусом</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-amber-50/10 transition">
                    <td className="p-6 font-black text-amber-950 text-sm">#{order.id}</td>
                    <td className="p-6">
                      <div className="text-sm font-black text-amber-900">{order.contact_phone}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{order.delivery_address}</div>
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
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && <div className="p-20 text-center text-amber-900/20 font-black uppercase tracking-[0.3em]">Список пуст</div>}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xl font-black text-amber-950 uppercase italic tracking-tighter">Управление меню</h3>
            <button 
              onClick={() => { setEditingDish({ available: true, category: 'main' }); setIsDishModalOpen(true); }}
              className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-orange-500/20 text-[10px] uppercase tracking-widest hover:scale-105 transition"
            >
              <Plus size={16} /> Добавить позицию
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {dishes.map(dish => (
               <div key={dish.id} className={`bg-white rounded-[2.5rem] border border-amber-50 overflow-hidden group hover:shadow-2xl transition-all duration-500 ${!dish.available ? 'opacity-60' : ''}`}>
                 <div className="h-40 relative">
                   <img src={dish.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
                   <div className="absolute top-3 left-3 flex gap-2">
                     <button 
                        onClick={() => toggleDishAvailability(dish)}
                        className={`p-2 rounded-xl backdrop-blur-md shadow-lg transition-colors ${dish.available ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}
                      >
                        {dish.available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                   </div>
                 </div>
                 <div className="p-6">
                   <h4 className="font-black text-amber-950 truncate text-sm mb-1 uppercase tracking-tight">{dish.name}</h4>
                   <p className="text-[10px] text-gray-400 font-bold mb-4 uppercase tracking-widest">{dish.category}</p>
                   <div className="flex justify-between items-center">
                     <span className="font-black text-amber-900 text-lg">{dish.price} ₽</span>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }} className="p-2.5 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-950 hover:text-white transition"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteDish(dish.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={14}/></button>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Модальное окно блюда */}
      <Modal isOpen={isDishModalOpen} onClose={() => setIsDishModalOpen(false)} title={editingDish?.id ? 'Редактировать блюдо' : 'Новое блюдо'}>
        <form onSubmit={handleSaveDish} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest ml-1">Название</label>
            <input 
              type="text" required 
              className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-900 focus:ring-2 ring-amber-900/20 transition"
              value={editingDish?.name || ''} 
              onChange={e => setEditingDish({...editingDish, name: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest ml-1">Категория</label>
              <select 
                className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-900"
                value={editingDish?.category || 'main'} 
                onChange={e => setEditingDish({...editingDish, category: e.target.value as any})}
              >
                <option value="soups">Супы</option>
                <option value="main">Основные</option>
                <option value="salads">Салаты</option>
                <option value="drinks">Напитки</option>
                <option value="desserts">Десерты</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest ml-1">Цена (₽)</label>
              <input 
                type="number" required 
                className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-900"
                value={editingDish?.price || ''} 
                onChange={e => setEditingDish({...editingDish, price: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest ml-1">URL Изображения</label>
            <input 
              type="url" required 
              className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-900 text-xs"
              value={editingDish?.image || ''} 
              onChange={e => setEditingDish({...editingDish, image: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest ml-1">Описание</label>
            <textarea 
              rows={3}
              className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold text-amber-900 text-sm"
              value={editingDish?.description || ''} 
              onChange={e => setEditingDish({...editingDish, description: e.target.value})} 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-amber-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-800 transition disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить блюдо'}
          </button>
        </form>
      </Modal>
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
    case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100';
    case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100';
    case 'cooking': return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    case 'delivering': return 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100';
    case 'delivered': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    case 'cancelled': return 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100';
    default: return 'bg-amber-50 text-amber-900 border-amber-200';
  }
};

export default Admin;
