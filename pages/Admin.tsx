import React, { useState, useEffect } from 'react';
import { supabase, MOCK_DISHES } from '../services/supabaseClient';
import { Order, Courier, Dish } from '../types';
import { Package, Users, Truck, UtensilsCrossed, CheckCircle, Clock, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';

// --- MOCK COURIERS DATA ---
const MOCK_COURIERS: Courier[] = [
    { id: 1, name: "Алишер", phone: "+79001112233", vehicle: "Велосипед", status: "available" },
    { id: 2, name: "Борис", phone: "+79004445566", vehicle: "Авто", status: "busy" },
    { id: 3, name: "Фарход", phone: "+79007778899", vehicle: "Скутер", status: "offline" }
];

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'couriers' | 'menu'>('stats');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);

  // Menu Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<Dish>>({});

  // Courier Modal State
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Partial<Courier>>({});
  
  // Checking admin and loading data
  useEffect(() => {
    // In a real app, strict redirect here.
    
    // 1. Load Orders
    const savedOrders = localStorage.getItem('zhulebino_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    // 2. Load Dishes (with fallback to MOCK)
    const savedDishes = localStorage.getItem('zhulebino_dishes');
    if (savedDishes) {
        setDishes(JSON.parse(savedDishes));
    } else {
        setDishes(MOCK_DISHES);
        localStorage.setItem('zhulebino_dishes', JSON.stringify(MOCK_DISHES));
    }

    // 3. Load Couriers (with fallback to MOCK)
    const savedCouriers = localStorage.getItem('zhulebino_couriers');
    if (savedCouriers) {
        setCouriers(JSON.parse(savedCouriers));
    } else {
        setCouriers(MOCK_COURIERS);
        localStorage.setItem('zhulebino_couriers', JSON.stringify(MOCK_COURIERS));
    }
  }, [isAdmin]);

  // --- ORDER HANDLERS ---
  const updateOrderStatus = (id: number, status: string) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o) as Order[];
    setOrders(updated);
    localStorage.setItem('zhulebino_orders', JSON.stringify(updated));
  };

  // --- DISH HANDLERS ---
  const saveDish = () => {
      let updatedDishes = [...dishes];
      if (editingDish.id) {
          // Edit existing
          updatedDishes = updatedDishes.map(d => d.id === editingDish.id ? { ...d, ...editingDish } as Dish : d);
      } else {
          // Add new
          const newDish = { 
              ...editingDish, 
              id: Date.now(), 
              available: true 
          } as Dish;
          updatedDishes.push(newDish);
      }
      setDishes(updatedDishes);
      localStorage.setItem('zhulebino_dishes', JSON.stringify(updatedDishes));
      setIsDishModalOpen(false);
  };

  const deleteDish = (id: number) => {
      if(window.confirm('Вы уверены, что хотите удалить это блюдо?')) {
        const updatedDishes = dishes.filter(d => d.id !== id);
        setDishes(updatedDishes);
        localStorage.setItem('zhulebino_dishes', JSON.stringify(updatedDishes));
      }
  };

  const toggleDishAvailability = (id: number) => {
      const updatedDishes = dishes.map(d => d.id === id ? { ...d, available: !d.available } : d);
      setDishes(updatedDishes);
      localStorage.setItem('zhulebino_dishes', JSON.stringify(updatedDishes));
  };

  const openDishModal = (dish?: Dish) => {
      setEditingDish(dish || { category: 'main', image: 'https://picsum.photos/400/300' });
      setIsDishModalOpen(true);
  };

  // --- COURIER HANDLERS ---
   const saveCourier = () => {
      let updatedCouriers = [...couriers];
      if (editingCourier.id) {
          updatedCouriers = updatedCouriers.map(c => c.id === editingCourier.id ? { ...c, ...editingCourier } as Courier : c);
      } else {
          const newCourier = { ...editingCourier, id: Date.now(), status: 'available' } as Courier;
          updatedCouriers.push(newCourier);
      }
      setCouriers(updatedCouriers);
      localStorage.setItem('zhulebino_couriers', JSON.stringify(updatedCouriers));
      setIsCourierModalOpen(false);
  };

  const deleteCourier = (id: number) => {
      if(window.confirm('Удалить курьера?')) {
          const updated = couriers.filter(c => c.id !== id);
          setCouriers(updated);
          localStorage.setItem('zhulebino_couriers', JSON.stringify(updated));
      }
  };

  const openCourierModal = (courier?: Courier) => {
      setEditingCourier(courier || { status: 'available' });
      setIsCourierModalOpen(true);
  };


  const stats = {
    total: orders.reduce((sum, o) => sum + (o.total || o.total_amount || 0), 0),
    count: orders.length,
    active: orders.filter(o => ['pending', 'cooking', 'delivering'].includes(o.status || 'pending')).length
  };

  // --- RENDER SECTIONS ---

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
      <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
             <p className="text-amber-200 text-sm font-medium mb-1">Выручка</p>
             <h3 className="text-3xl font-bold">{stats.total.toLocaleString()} ₽</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg"><Package size={24} /></div>
        </div>
      </div>
       <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
             <p className="text-gray-400 text-sm font-medium mb-1">Всего заказов</p>
             <h3 className="text-3xl font-bold text-gray-800">{stats.count}</h3>
          </div>
          <div className="bg-amber-100 text-amber-800 p-2 rounded-lg"><Users size={24} /></div>
        </div>
      </div>
       <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
             <p className="text-gray-400 text-sm font-medium mb-1">Активные заказы</p>
             <h3 className="text-3xl font-bold text-orange-600">{stats.active}</h3>
          </div>
          <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Clock size={24} /></div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Клиент</th>
              <th className="p-4 font-semibold">Сумма</th>
              <th className="p-4 font-semibold">Статус</th>
              <th className="p-4 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-gray-500">Нет заказов</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-mono text-sm">#{order.id.toString().slice(-6)}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-800">{order.contact_phone || order.phone}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.delivery_address || order.address}</div>
                </td>
                <td className="p-4 font-bold text-gray-700">{order.total || order.total_amount} ₽</td>
                <td className="p-4">
                   <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                     (order.status || 'pending') === 'delivered' ? 'bg-green-100 text-green-700' :
                     (order.status || 'pending') === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                     'bg-blue-100 text-blue-700'
                   }`}>
                     {order.status || 'pending'}
                   </span>
                </td>
                <td className="p-4">
                  <select 
                    value={order.status || 'pending'}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="text-sm border rounded p-1"
                  >
                    <option value="pending">Ожидание</option>
                    <option value="cooking">Готовится</option>
                    <option value="delivering">В пути</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отмена</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMenu = () => (
      <div className="space-y-4">
          <div className="flex justify-end">
              <button 
                onClick={() => openDishModal()} 
                className="bg-amber-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-800 transition shadow"
              >
                  <Plus size={20} /> Добавить блюдо
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dishes.map(dish => (
                  <div key={dish.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 ${!dish.available ? 'opacity-70' : ''}`}>
                      <img src={dish.image} alt={dish.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                      <div className="flex-1">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-gray-800">{dish.name}</h3>
                                  <p className="text-sm text-gray-500">{dish.category}</p>
                              </div>
                              <span className="font-bold text-amber-700">{dish.price} ₽</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{dish.description}</p>
                          <div className="flex gap-2 mt-3 justify-end">
                              <button 
                                onClick={() => toggleDishAvailability(dish.id)}
                                className={`text-xs px-2 py-1 rounded border ${dish.available ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500 bg-gray-100'}`}
                              >
                                  {dish.available ? 'В меню' : 'Скрыто'}
                              </button>
                              <button onClick={() => openDishModal(dish)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                  <Edit2 size={16} />
                              </button>
                              <button onClick={() => deleteDish(dish.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderCouriers = () => (
     <div className="space-y-4">
         <div className="flex justify-end">
              <button 
                onClick={() => openCourierModal()} 
                className="bg-amber-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-800 transition shadow"
              >
                  <Plus size={20} /> Добавить курьера
              </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left">
                 <thead className="bg-gray-50 text-gray-500 text-sm">
                     <tr>
                         <th className="p-4">Имя</th>
                         <th className="p-4">Телефон</th>
                         <th className="p-4">Транспорт</th>
                         <th className="p-4">Статус</th>
                         <th className="p-4 text-right">Действия</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {couriers.map(courier => (
                         <tr key={courier.id}>
                             <td className="p-4 font-medium">{courier.name}</td>
                             <td className="p-4 text-gray-600">{courier.phone}</td>
                             <td className="p-4">{courier.vehicle}</td>
                             <td className="p-4">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                     courier.status === 'available' ? 'bg-green-100 text-green-700' :
                                     courier.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                                 }`}>
                                     {courier.status === 'available' ? 'Свободен' : courier.status === 'busy' ? 'Занят' : 'Оффлайн'}
                                 </span>
                             </td>
                             <td className="p-4 text-right space-x-2">
                                 <button onClick={() => openCourierModal(courier)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                                 <button onClick={() => deleteCourier(courier.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
     </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-amber-900">Админ-панель</h1>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-amber-100">
           {[
             { id: 'stats', label: 'Обзор', icon: Package },
             { id: 'orders', label: 'Заказы', icon: CheckCircle },
             { id: 'couriers', label: 'Курьеры', icon: Truck },
             { id: 'menu', label: 'Меню', icon: UtensilsCrossed },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                 activeTab === tab.id ? 'bg-amber-100 text-amber-900' : 'text-gray-500 hover:text-amber-800'
               }`}
             >
               <tab.icon size={16} />
               <span className="hidden sm:inline">{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'stats' && renderStats()}
      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'couriers' && renderCouriers()}
      {activeTab === 'menu' && renderMenu()}

      {/* DISH EDIT MODAL */}
      <Modal 
        isOpen={isDishModalOpen} 
        onClose={() => setIsDishModalOpen(false)}
        title={editingDish.id ? "Редактировать блюдо" : "Новое блюдо"}
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">Название</label>
                  <input 
                    className="w-full p-2 border rounded mt-1" 
                    value={editingDish.name || ''} 
                    onChange={e => setEditingDish({...editingDish, name: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Категория</label>
                  <select 
                    className="w-full p-2 border rounded mt-1"
                    value={editingDish.category || 'main'}
                    onChange={e => setEditingDish({...editingDish, category: e.target.value as any})}
                  >
                      <option value="main">Основные</option>
                      <option value="soups">Супы</option>
                      <option value="salads">Салаты</option>
                      <option value="drinks">Напитки</option>
                      <option value="desserts">Десерты</option>
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Цена (₽)</label>
                    <input 
                        type="number"
                        className="w-full p-2 border rounded mt-1" 
                        value={editingDish.price || ''} 
                        onChange={e => setEditingDish({...editingDish, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ссылка на фото</label>
                    <input 
                        className="w-full p-2 border rounded mt-1" 
                        value={editingDish.image || ''} 
                        onChange={e => setEditingDish({...editingDish, image: e.target.value})}
                    />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Описание</label>
                  <textarea 
                    className="w-full p-2 border rounded mt-1" 
                    rows={3}
                    value={editingDish.description || ''} 
                    onChange={e => setEditingDish({...editingDish, description: e.target.value})}
                  />
              </div>
              <button 
                onClick={saveDish}
                className="w-full bg-amber-900 text-white py-3 rounded-lg font-bold hover:bg-amber-800 transition flex items-center justify-center gap-2"
              >
                  <Save size={18} /> Сохранить
              </button>
          </div>
      </Modal>

      {/* COURIER EDIT MODAL */}
       <Modal 
        isOpen={isCourierModalOpen} 
        onClose={() => setIsCourierModalOpen(false)}
        title={editingCourier.id ? "Редактировать курьера" : "Новый курьер"}
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">Имя</label>
                  <input 
                    className="w-full p-2 border rounded mt-1" 
                    value={editingCourier.name || ''} 
                    onChange={e => setEditingCourier({...editingCourier, name: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Телефон</label>
                  <input 
                    className="w-full p-2 border rounded mt-1" 
                    value={editingCourier.phone || ''} 
                    onChange={e => setEditingCourier({...editingCourier, phone: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Транспорт</label>
                  <input 
                    className="w-full p-2 border rounded mt-1" 
                    value={editingCourier.vehicle || ''} 
                    onChange={e => setEditingCourier({...editingCourier, vehicle: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Статус</label>
                   <select 
                    className="w-full p-2 border rounded mt-1"
                    value={editingCourier.status || 'available'}
                    onChange={e => setEditingCourier({...editingCourier, status: e.target.value as any})}
                  >
                      <option value="available">Свободен</option>
                      <option value="busy">Занят</option>
                      <option value="offline">Не работает</option>
                  </select>
              </div>
               <button 
                onClick={saveCourier}
                className="w-full bg-amber-900 text-white py-3 rounded-lg font-bold hover:bg-amber-800 transition flex items-center justify-center gap-2"
              >
                  <Save size={18} /> Сохранить
              </button>
          </div>
      </Modal>

    </div>
  );
};

export default Admin;