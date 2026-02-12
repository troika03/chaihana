
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
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      }
      if (activeTab === 'menu' || activeTab === 'stats') {
        const { data, error } = await supabase.from('dishes').select('*').order('name', { ascending: true });
        if (error) throw error;
        setDishes(data || []);
      }
    } catch (err: any) {
      console.error("Ошибка при синхронизации с БД:", err.message);
      // Если таблиц нет, можно было бы вывести уведомление, но мы просто логируем
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert('Не удалось обновить статус: ' + err.message);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    setIsLoading(true);
    
    // Формируем чистый объект данных. 
    // Это ВАЖНО: исключаем id при вставке и гарантируем наличие всех Not-Null колонок.
    const dishData: any = {
      name: editingDish.name?.trim() || 'Без названия',
      price: Number(editingDish.price) || 0,
      category: editingDish.category || 'main', // Защита от нарушения Not-Null констрейнта
      description: editingDish.description || '',
      image: editingDish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      available: editingDish.available ?? true
    };

    try {
      let result;
      if (editingDish.id) {
        // Редактирование
        result = await supabase.from('dishes').update(dishData).eq('id', editingDish.id);
      } else {
        // Создание нового (ID генерируется базой)
        result = await supabase.from('dishes').insert([dishData]);
      }

      if (result.error) throw result.error;

      setIsDishModalOpen(false);
      setEditingDish(null);
      await loadData();
    } catch (err: any) {
      console.error('Ошибка сохранения блюда:', err);
      alert('Ошибка базы данных: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDish = async (id: number) => {
    if (!confirm('Удалить это блюдо навсегда?')) return;
    try {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  const toggleDishAvailability = async (dish: Dish) => {
    try {
      const { error } = await supabase.from('dishes').update({ available: !dish.available }).eq('id', dish.id);
      if (error) throw error;
      setDishes(dishes.map(d => d.id === dish.id ? { ...d, available: !dish.available } : d));
    } catch (err: any) {
      alert('Ошибка обновления статуса: ' + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle size={64} className="text-red-200 mb-4" />
        <h2 className="text-2xl font-black text-amber-950">Доступ только для админов</h2>
        <p className="text-gray-500 mt-2">Пожалуйста, войдите под учетной записью администратора.</p>
      </div>
    );
  }

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-amber-950">Админ-панель</h1>
          <p className="text-amber-800/60 font-medium">Управление заведением «Чайхана Жулебино»</p>
        </div>
        <button 
          onClick={loadData} 
          disabled={isLoading}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-amber-100 hover:bg-amber-50 transition font-bold text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Синхронизировать
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
          <StatCard title="Выручка" value={`${stats.totalRevenue.toLocaleString()} ₽`} icon={<TrendingUp className="text-green-600" />} />
          <StatCard title="Заказов" value={stats.totalOrders} icon={<Package className="text-blue-600" />} />
          <StatCard title="Ожидают" value={stats.pendingOrders} icon={<Clock className="text-orange-600" />} />
          <StatCard title="Выполнено" value={stats.completedOrders} icon={<CheckCircle2 className="text-emerald-600" />} />
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl shadow-sm border border-amber-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.delivery_address}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-600 max-w-xs">
                        {Array.isArray(order.items) ? (
                          order.items.map((it: any, idx: number) => (
                            <span key={idx}>
                              {it.dish?.name || 'Блюдо'} x{it.quantity}
                              {idx < order.items.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : 'Состав недоступен'}
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
          </div>
          {orders.length === 0 && <div className="p-12 text-center text-gray-400 font-bold">Активных заказов в базе не найдено</div>}
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-amber-950">Блюда ({dishes.length})</h3>
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
              Новое блюдо
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dishes.map(dish => (
              <div key={dish.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-amber-100 flex flex-col gap-3 transition-all ${!dish.available ? 'opacity-60' : 'hover:shadow-md'}`}>
                <div className="relative h-40 rounded-2xl overflow-hidden">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg font-black text-xs text-amber-900">
                    {dish.price} ₽
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-amber-950 truncate">{dish.name}</h4>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{dish.category}</p>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition"
                      title="Редактировать"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteDish(dish.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                      title="Удалить"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => toggleDishAvailability(dish)}
                      className={`ml-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition ${
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
        title={editingDish?.id ? "Редактирование" : "Новое блюдо"}
      >
        <form onSubmit={handleSaveDish} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Название</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
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
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
                value={editingDish?.price || ''}
                onChange={e => setEditingDish({...editingDish, price: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Категория</label>
              <select 
                required
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
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
            <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Ссылка на фото</label>
            <input 
              type="url" 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none"
              value={editingDish?.image || ''}
              onChange={e => setEditingDish({...editingDish, image: e.target.value})}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-amber-800 tracking-wider">Описание</label>
            <textarea 
              rows={3}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              value={editingDish?.description || ''}
              onChange={e => setEditingDish({...editingDish, description: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-900 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-amber-800 transition shadow-xl shadow-amber-900/10 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={22} /> : <Save size={22} />}
            {editingDish?.id ? 'Сохранить изменения' : 'Создать в БД'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-50 flex items-center gap-4 transition-transform hover:scale-[1.02]">
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
