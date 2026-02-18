
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../apiClient';
import { Order, Dish } from './types';
import { 
  RefreshCw, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  Volume2, 
  VolumeX,
  BellRing,
  Loader2,
  AlertTriangle,
  Upload,
  Eye,
  Settings,
  CreditCard,
  UserCheck,
  Info,
  Terminal,
  Copy,
  ExternalLink,
  ChevronRight,
  FolderTree,
  Ship,
  ChefHat,
  Package,
  CheckCircle2,
  Ban,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient';
import Modal from '../components/ui/Modal.tsx';

const CATEGORIES = [
  { id: 'main', label: 'Горячее' },
  { id: 'soups', label: 'Супы' },
  { id: 'bakery', label: 'Выпечка' },
  { id: 'salads', label: 'Салаты' },
  { id: 'drinks', label: 'Напитки' },
];

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  
  // States for Menu Editing
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isSavingDish, setIsSavingDish] = useState(false);

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
            audioRef.current.play().catch(e => console.log('Audio play blocked', e));
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        })
        .subscribe();
      
      const dishesChannel = supabase
        .channel('admin_dishes_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
          loadData();
        })
        .subscribe();

      return () => { 
        supabase.removeChannel(ordersChannel); 
        supabase.removeChannel(dishesChannel);
      };
    }
  }, [isAdmin, soundEnabled]);

  const activeOrders = useMemo(() => orders.filter(o => !['delivered', 'cancelled'].includes(o.status)), [orders]);

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    setIsSavingDish(true);
    try {
      if (editingDish.id) {
        await api.dishes.update(editingDish.id, editingDish);
      } else {
        await api.dishes.create(editingDish);
      }
      setEditingDish(null);
      loadData();
    } catch (err) {
      alert("Ошибка сохранения блюда");
    } finally {
      setIsSavingDish(false);
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    try {
      await api.dishes.update(dish.id, { available: !dish.available });
    } catch (err) {
      alert("Ошибка обновления статуса блюда");
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-40 gap-8 text-center px-4">
      <ShieldAlert size={80} className="text-amber-950/10" />
      <h2 className="text-2xl font-black text-amber-950 uppercase italic tracking-tighter">Доступ ограничен</h2>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-amber-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-amber-950 p-3 rounded-2xl text-white"><ChefHat size={28} /></div>
          <h1 className="text-2xl md:text-3xl font-black text-amber-950 uppercase italic tracking-tighter">
            Панель управления
          </h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl border transition ${soundEnabled ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-400 border-gray-100'}`}>
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={loadData} disabled={isLoading} className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-amber-950 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Обновить
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar p-1 bg-amber-100/30 rounded-2xl w-full">
        <button onClick={() => setActiveTab('orders')} className={`flex-1 px-5 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-amber-950 text-white shadow-lg' : 'text-amber-900/40'}`}>
          Заказы ({activeOrders.length})
        </button>
        <button onClick={() => setActiveTab('menu')} className={`flex-1 px-5 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-amber-950 text-white shadow-lg' : 'text-amber-900/40'}`}>
          Меню ({dishes.length})
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 px-5 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-amber-950 text-white shadow-lg' : 'text-amber-900/40'}`}>
          Настройки
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="grid gap-4">
            {activeOrders.length === 0 ? (
              <div className="py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">Активных заказов нет</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-amber-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1 space-y-1 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-amber-950 text-lg">#{order.id.toString().slice(-4)}</span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.payment_status === 'succeeded' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {order.total_amount} ₽ • {order.payment_status === 'succeeded' ? 'Оплачен' : 'Ожидание'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/60 font-bold">{order.delivery_address}</p>
                    <p className="text-xs text-orange-600 font-black">{order.contact_phone}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select value={order.status} onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any)} className="flex-1 md:flex-none bg-amber-50 p-4 rounded-xl font-black text-[10px] uppercase border-none outline-none shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                      <option value="pending">🔔 Новый</option>
                      <option value="confirmed">👍 Принят</option>
                      <option value="cooking">👨‍🍳 Кухня</option>
                      <option value="delivering">🚚 Путь</option>
                      <option value="delivered">✅ ОК</option>
                      <option value="cancelled">❌ Отмена</option>
                    </select>
                    <button onClick={() => setViewingOrder(order)} className="p-4 bg-amber-950 text-white rounded-xl hover:bg-orange-500 transition shadow-sm">
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <button 
              onClick={() => setEditingDish({ name: '', price: 0, category: 'main', available: true, image: '', description: '' })}
              className="w-full py-6 bg-orange-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition flex items-center justify-center gap-3"
            >
              <Plus size={20} /> Добавить блюдо
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.map(dish => (
                <div key={dish.id} className={`bg-white rounded-[3rem] overflow-hidden border border-amber-50 shadow-sm flex flex-col ${!dish.available ? 'opacity-50 grayscale' : ''}`}>
                  <div className="h-40 relative">
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    <button onClick={() => setEditingDish(dish)} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl text-amber-950 shadow-lg hover:bg-white">
                      <Edit3 size={18} />
                    </button>
                    {!dish.available && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">СТОП-ЛИСТ</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h4 className="font-black text-amber-950 uppercase text-sm tracking-tight line-clamp-1">{dish.name}</h4>
                      <p className="text-orange-500 font-black text-lg">{dish.price} ₽</p>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button 
                        onClick={() => toggleAvailability(dish)}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${dish.available ? 'bg-amber-50 text-amber-950' : 'bg-green-50 text-green-600'}`}
                      >
                        {dish.available ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                        {dish.available ? 'В стоп' : 'Вернуть'}
                      </button>
                      <button 
                        onClick={async () => { if(confirm('Удалить блюдо?')) await api.dishes.delete(dish.id); loadData(); }}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"
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

        {/* SETTINGS TAB (Compact) */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-amber-50 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <Settings className="text-orange-500" size={28} />
                <h3 className="text-xl font-black text-amber-950 uppercase italic tracking-tighter">Настройки системы</h3>
              </div>
              <p className="text-sm text-gray-500">Если вы добавили новые переменные в Supabase, нажмите кнопку ниже для синхронизации.</p>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl">
                  <Terminal size={18} className="text-amber-900/30" />
                  <code className="text-[11px] font-mono text-amber-900">npx supabase secrets list</code>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-950 text-white p-10 rounded-[3rem] shadow-2xl space-y-4">
               <h4 className="font-black text-xs uppercase tracking-widest text-orange-500">Юридические данные</h4>
               <p className="text-sm opacity-60">ИП Садыкова Махфуза Маъруфовна<br/>ИНН 7707083893 | ОГРНИП 325508100324129</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dish Modal */}
      <Modal isOpen={!!editingDish} onClose={() => setEditingDish(null)} title={editingDish?.id ? "Правка блюда" : "Новое блюдо"}>
        {editingDish && (
          <form onSubmit={handleSaveDish} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Название</label>
              <input 
                type="text" 
                value={editingDish.name} 
                onChange={e => setEditingDish({...editingDish, name: e.target.value})} 
                className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Цена (₽)</label>
                <input 
                  type="number" 
                  value={editingDish.price} 
                  onChange={e => setEditingDish({...editingDish, price: parseInt(e.target.value)})} 
                  className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Категория</label>
                <select 
                  value={editingDish.category} 
                  onChange={e => setEditingDish({...editingDish, category: e.target.value as any})}
                  className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-black text-[10px] uppercase"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ссылка на фото (URL)</label>
              <input 
                type="text" 
                value={editingDish.image} 
                onChange={e => setEditingDish({...editingDish, image: e.target.value})} 
                className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-amber-950"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Описание</label>
              <textarea 
                value={editingDish.description} 
                onChange={e => setEditingDish({...editingDish, description: e.target.value})} 
                className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-medium text-amber-950 h-24 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditingDish(null)} className="flex-1 py-5 bg-amber-50 text-amber-950 rounded-2xl font-black text-[10px] uppercase tracking-widest">Отмена</button>
              <button type="submit" disabled={isSavingDish} className="flex-1 py-5 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                {isSavingDish ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Order Modal */}
      <Modal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} title={`Заказ #${viewingOrder?.id.toString().slice(-4)}`}>
        {viewingOrder && (
          <div className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-3xl space-y-3">
              <div className="flex items-start gap-3">
                <Package className="text-orange-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">Адрес доставки</p>
                  <p className="font-bold text-amber-950 leading-tight">{viewingOrder.delivery_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck className="text-orange-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">Контакт</p>
                  <p className="font-bold text-amber-950">{viewingOrder.contact_phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest border-b border-amber-50 pb-2">Состав заказа</p>
              {viewingOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-amber-950">{item.dish.name} <span className="text-orange-500 font-black">x{item.quantity}</span></span>
                  <span className="font-black text-amber-900">{item.dish.price * item.quantity} ₽</span>
                </div>
              ))}
              <div className="pt-4 flex justify-between items-center border-t border-amber-50">
                <span className="text-xs font-black uppercase opacity-40">Итого к оплате</span>
                <span className="text-2xl font-black italic text-orange-500">{viewingOrder.total_amount} ₽</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setViewingOrder(null)} className="w-full py-4 bg-amber-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Закрыть</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;
