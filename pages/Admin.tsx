
import React, { useState, useEffect } from 'react';
import { supabase, MOCK_DISHES } from '../supabaseClient';
import { Order, Courier, Dish } from './types';
import { Package, Users, Truck, UtensilsCrossed, CheckCircle, Clock, Plus, Edit2, Trash2, X, Save, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';

const Admin: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'couriers' | 'menu'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Menu Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<Dish>>({});
  
  useEffect(() => {
    if (isAdmin) {
        loadAllData();
    }
  }, [isAdmin]);

  const loadAllData = async () => {
    setIsSyncing(true);
    
    // 1. Загрузка заказов из БД
    const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
    if (dbOrders) setOrders(dbOrders as any);

    // 2. Загрузка блюд (СТОП-ЛИСТ СИНХРОНИЗИРОВАН ТУТ)
    const { data: dbDishes, error } = await supabase
      .from('dishes')
      .select('*')
      .order('id', { ascending: true });

    if (!error && dbDishes && dbDishes.length > 0) {
      setDishes(dbDishes);
    } else {
      setDishes(MOCK_DISHES);
    }

    // 3. Курьеры
    const { data: dbCouriers } = await supabase.from('couriers').select('*');
    if (dbCouriers) setCouriers(dbCouriers as any);

    setIsSyncing(false);
  };

  const toggleDishAvailability = async (id: number, currentStatus: boolean) => {
      setIsSyncing(true);
      const { error } = await supabase
        .from('dishes')
        .update({ available: !currentStatus })
        .eq('id', id);
      
      if (error) {
        alert("Ошибка обновления базы: " + error.message);
      } else {
        // Локальное обновление для скорости интерфейса
        setDishes(dishes.map(d => d.id === id ? { ...d, available: !currentStatus } : d));
      }
      setIsSyncing(false);
  };

  const saveDish = async () => {
      setIsSyncing(true);
      const dishData = {
          name: editingDish.name,
          category: editingDish.category,
          price: editingDish.price,
          image: editingDish.image,
          description: editingDish.description,
          available: editingDish.id ? editingDish.available : true
      };

      if (editingDish.id) {
          const { error } = await supabase
            .from('dishes')
            .update(dishData)
            .eq('id', editingDish.id);
          if (error) alert(error.message);
      } else {
          const { error } = await supabase
            .from('dishes')
            .insert([dishData]);
          if (error) alert(error.message);
      }
      
      await loadAllData();
      setIsDishModalOpen(false);
  };

  const deleteDish = async (id: number) => {
      if(window.confirm('Удалить блюдо безвозвратно?')) {
        await supabase.from('dishes').delete().eq('id', id);
        await loadAllData();
      }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl m-4 shadow-xl">
        <h2 className="text-3xl font-black text-red-600">403</h2>
        <p className="text-gray-500 mt-2">Доступ только для администраторов</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-amber-900 text-white px-8 py-3 rounded-2xl font-bold">На главную</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-amber-950 flex items-center gap-3">
            Админ-центр
            {isSyncing && <RefreshCw className="animate-spin text-amber-600" size={24} />}
        </h1>
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-amber-50 flex">
            {['stats', 'orders', 'menu'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === tab ? 'bg-amber-900 text-white shadow-lg' : 'text-gray-400 hover:text-amber-900'}`}
                >
                    {tab === 'stats' ? 'Дашборд' : tab === 'orders' ? 'Заказы' : 'Меню'}
                </button>
            ))}
        </div>
      </div>

      {activeTab === 'menu' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-amber-50 shadow-sm">
                  <p className="text-gray-500 text-sm font-medium italic">Управляйте доступностью блюд в реальном времени</p>
                  <button onClick={() => { setEditingDish({category: 'main'}); setIsDishModalOpen(true); }} className="bg-amber-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-800 transition">
                      <Plus size={20} /> Добавить
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dishes.map(dish => (
                      <div key={dish.id} className={`bg-white p-4 rounded-2xl border border-amber-50 shadow-sm flex flex-col justify-between transition ${!dish.available ? 'bg-gray-50/80 grayscale' : ''}`}>
                          <div className="flex gap-4">
                              <img src={dish.image} className="w-20 h-20 object-cover rounded-xl bg-gray-100" />
                              <div className="flex-1">
                                  <h3 className="font-black text-amber-950">{dish.name}</h3>
                                  <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">{dish.category}</p>
                                  <p className="text-lg font-black text-gray-900 mt-1">{dish.price} ₽</p>
                              </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 pt-4 border-t border-amber-50">
                              <button 
                                onClick={() => toggleDishAvailability(dish.id, dish.available)}
                                disabled={isSyncing}
                                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition ${dish.available ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-600 text-white shadow-lg shadow-red-200'}`}
                              >
                                  {dish.available ? 'В меню' : 'В СТОП-ЛИСТЕ'}
                              </button>
                              <button onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition"><Edit2 size={18} /></button>
                              <button onClick={() => deleteDish(dish.id)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition"><Trash2 size={18} /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border border-amber-50 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-amber-50/50 text-amber-900 text-xs font-black uppercase tracking-widest">
                      <tr>
                          <th className="p-5">Заказ</th>
                          <th className="p-5">Клиент</th>
                          <th className="p-5">Сумма</th>
                          <th className="p-5">Статус</th>
                          <th className="p-5">Действие</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                      {orders.map(order => (
                          <tr key={order.id} className="hover:bg-amber-50/20 transition">
                              <td className="p-5 font-black text-amber-950">#{order.id}</td>
                              <td className="p-5">
                                  <div className="font-bold text-gray-800">{order.contact_phone}</div>
                                  <div className="text-xs text-gray-400 truncate max-w-[200px]">{order.delivery_address}</div>
                              </td>
                              <td className="p-5 font-black text-amber-800">{order.total_amount} ₽</td>
                              <td className="p-5">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {order.status}
                                  </span>
                              </td>
                              <td className="p-5">
                                  <select 
                                      className="bg-white border-2 border-amber-100 rounded-xl text-xs font-bold p-1 outline-none"
                                      value={order.status}
                                      onChange={async (e) => {
                                          await supabase.from('orders').update({status: e.target.value}).eq('id', order.id);
                                          loadAllData();
                                      }}
                                  >
                                      <option value="pending">Ожидание</option>
                                      <option value="cooking">Готовится</option>
                                      <option value="delivering">Доставка</option>
                                      <option value="delivered">Готово</option>
                                  </select>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      <Modal isOpen={isDishModalOpen} onClose={() => setIsDishModalOpen(false)} title={editingDish.id ? 'Изменить блюдо' : 'Новое блюдо'}>
          <div className="space-y-4">
              <input placeholder="Название" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-amber-500" value={editingDish.name || ''} onChange={e => setEditingDish({...editingDish, name: e.target.value})} />
              <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-amber-500" value={editingDish.category} onChange={e => setEditingDish({...editingDish, category: e.target.value as any})}>
                  <option value="main">Основные</option>
                  <option value="soups">Супы</option>
                  <option value="salads">Салаты</option>
                  <option value="drinks">Напитки</option>
                  <option value="desserts">Десерты</option>
              </select>
              <input type="number" placeholder="Цена" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-amber-500" value={editingDish.price || ''} onChange={e => setEditingDish({...editingDish, price: Number(e.target.value)})} />
              <input placeholder="URL изображения" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-amber-500" value={editingDish.image || ''} onChange={e => setEditingDish({...editingDish, image: e.target.value})} />
              <textarea placeholder="Описание" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-amber-500 h-24" value={editingDish.description || ''} onChange={e => setEditingDish({...editingDish, description: e.target.value})} />
              <button onClick={saveDish} className="w-full bg-amber-900 text-white py-4 rounded-2xl font-bold shadow-lg">Сохранить</button>
          </div>
      </Modal>
    </div>
  );
};

export default Admin;
