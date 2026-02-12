
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Order, Dish } from './types';
import { 
  Plus, Edit2, Trash2, RefreshCw, 
  Package, Utensils, TrendingUp, 
  CheckCircle2, Clock, Truck, 
  XCircle, Filter, Search, Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';

const Admin: React.FC = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'menu'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояния для модалки блюда
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'orders' || activeTab === 'stats') {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        setOrders(data || []);
      }
      if (activeTab === 'menu' || activeTab === 'stats') {
        const { data } = await supabase.from('dishes').select('*').order('name', { ascending: true });
        setDishes(data || []);
      }
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    setIsLoading(true);
    // Гарантируем наличие всех обязательных полей
    const dishData = {
      name: editingDish.name || 'Без названия',
      price: Number(editingDish.price) || 0,
      category: editingDish.category || 'main', // Защита от null
      description: editingDish.description || '',
      image: editingDish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      available: editingDish.available ?? true
    };

    let error;
    if (editingDish.id) {
      const { error: err } = await supabase.from('dishes').update(dishData).eq('id', editingDish.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('dishes').insert([dishData]);
      error = err;
    }

    if (!error) {
      setIsDishModalOpen(false);
      setEditingDish(null);
      loadData();
    } else {
      console.error('Ошибка Supabase:', error);
      alert('Ошибка при сохранении: ' + error.message);
    }
    setIsLoading(false);
  };

  const deleteDish = async (id: number) => {
    if (!confirm('Удалить это блюдо из меню?')) return;
    const { error } = await supabase.from('dishes').delete().eq('id', id);
    if (!error) loadData();
    else alert('Ошибка при удалении: ' + error.message);
  };

  const toggleDishAvailability = async (dish: Dish) => {
    const { error } = await supabase.from('dishes').update({ available: !dish.available }).eq('id', dish.id);
    if (!error) {
      setDishes(dishes.map(d => d.id === dish.id ? { ...d, available: !dish.available } : d));
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Package size={64} className="text-amber-200 mb-4" />
        <h2 className="text-2xl font-black text-amber-950">Доступ ограничен</h2>
        <p className="text-gray-500 mt-2">У вас нет прав администратора для просмотра этой страницы.</p>
      </div>
    );
  }

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-amber-950">Панель управления</h1>
          <p className="text-amber-800/60 font-medium">Администратор: {currentUser?.full_name}</p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100 hover:bg-amber-50 transition font-bold text-sm"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Обновить данные
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-amber-100/50 rounded-2xl w-fit">
        {[
          { id: 'stats', label: 'Статистика', icon: <TrendingUp size={18} /> },
          { id: 'orders', label: 'Заказы', icon: <Package size={18} /> },
          { id: 'menu', label: 'Меню', icon: <Utensils size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-amber-900 text-white shadow-md' 
                : 'text-amber-900/60 hover:text-amber-900 hover:bg-amber-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Общая выручка" value={`${stats.totalRevenue.toLocaleString()} ₽`} icon={<TrendingUp className="text-green-600" />} />
          <StatCard title="Всего заказов" value={stats.totalOrders} icon={<Package className="text-blue-600" />} />
          <StatCard title="Новые заказы" value={stats.pendingOrders} icon={<Clock className="text-orange-600" />} />
          <StatCard title="Доставлено" value={stats.completedOrders} icon={<CheckCircle2 className="text-emerald-600" />} />
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-sm border border-amber-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/50 border-b border-amber-100">
                  <th className="p-4 font-black text-amber-950 text-xs uppercase tracking-wider">ID / Дата</th>
                  <th className="p-4 font-black text-amber-950 text-xs uppercase tracking-wider">Клиент / Адрес</th>
                  <th className="p-4 font-black text-amber-950 text-xs uppercase tracking-wider">Состав заказа</th>
                  <th className="p-4 font-black text-amber-950 text-xs uppercase tracking-wider">Сумма</th>
                  <th className="p-4 font-black text-amber-950 text-xs uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-amber-50/20 transition">
                    <td className="p-4">
                      <div className="font-bold text-amber-950">#{order.id}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-amber-900">{order.contact_phone}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{order.delivery_address}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-600 max-w-xs">
                        {Array.isArray(order.items) ? (
                          order.items.map((it: any) => `${it.dish?.name} x${it.quantity}`).join(', ')
                        ) : 'Нет данных'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-amber-950">{order.total_amount} ₽</div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">{order.payment_method === 'card' ? 'Карта' : 'Нал'}</div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                        className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg outline-none border-2 transition ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Новый</option>
                        <option value="confirmed">Подтвержден</option>
                        <option value="cooking">Готовится</option>
                        <option value="delivering">Доставка</option>
                        <option value="delivered">Завершен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <div className="p-12 text-center text-gray-400 font-bold">Заказов пока нет</div>}
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-amber-950">Блюда в меню ({dishes.length})</h3>
            <button 
              onClick={() => { 
                setEditingDish({ 
                  available: true, 
                  category: 'main', 
                  name: '', 
                  price: 0, 
                  description: '', 
                  image: '' 
                }); 
                setIsDishModalOpen(true); 
              }}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-2xl font-black shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition"
            >
              <Plus size={20} />
              Добавить блюдо
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map(dish => (
              <div key={dish.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-amber-100 flex gap-4 ${!dish.available ? 'opacity-60' : ''}`}>
                <img src={dish.image} alt={dish.name} className="w-20 h-20 object-cover rounded-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-amber-950 truncate pr-2">{dish.name}</h4>
                    <span className="font-black text-amber-900 text-sm whitespace-nowrap">{dish.price} ₽</span>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{dish.category}</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <button 
                      onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteDish(dish.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => toggleDishAvailability(dish)}
                      className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase transition ${
                        dish.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {dish.available ? 'В меню' : 'Скрыто'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal 
        isOpen={isDishModalOpen} 
        onClose={() => setIsDishModalOpen(false)} 
        title={editingDish?.id ? "Редактировать блюдо" : "Новое блюдо"}
      >
        <form onSubmit={handleSaveDish} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Название</label>
            <input 
              type="text" 
              required
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              value={editingDish?.name || ''}
              onChange={e => setEditingDish({...editingDish, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Цена (₽)</label>
              <input 
                type="number" 
                required
                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                value={editingDish?.price || ''}
                onChange={e => setEditingDish({...editingDish, price: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Категория</label>
              <select 
                required
                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                value={editingDish?.category || 'main'}
                onChange={e => setEditingDish({...editingDish, category: e.target.value as any})}
              >
                <option value="main">Основные</option>
                <option value="soups">Супы</option>
                <option value="salads">Салаты</option>
                <option value="drinks">Напитки</option>
                <option value="desserts">Десерты</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-800 tracking-wider">URL Изображения</label>
            <input 
              type="text" 
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              value={editingDish?.image || ''}
              onChange={e => setEditingDish({...editingDish, image: e.target.value})}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Описание</label>
            <textarea 
              rows={3}
              className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              value={editingDish?.description || ''}
              onChange={e => setEditingDish({...editingDish, description: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-800 transition shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            {editingDish?.id ? 'Сохранить изменения' : 'Создать блюдо'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-50 flex items-center gap-4">
    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-amber-950">{value}</h4>
    </div>
  </div>
);

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'cooking': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'delivering': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
    case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
    default: return 'bg-gray-50 text-gray-600 border-gray-100';
  }
};

export default Admin;
