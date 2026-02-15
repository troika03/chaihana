
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
  EyeOff,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { supabase } from '../supabaseClient';
import Modal from '../components/ui/Modal.tsx';

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'menu' | 'stoplist'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
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

  const handleSeedDishes = async () => {
    setIsLoading(true);
    try {
      await api.dishes.seed();
      await loadData();
    } catch (err) {
      alert("Ошибка при восстановлении меню");
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setDishes(prev => prev.map(d => d.id === payload.new.id ? payload.new as Dish : d));
          } else if (payload.eventType === 'INSERT') {
            setDishes(prev => [...prev, payload.new as Dish]);
          } else if (payload.eventType === 'DELETE') {
            setDishes(prev => prev.filter(d => d.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(dishesChannel);
      };
    }
  }, [isAdmin, soundEnabled]);

  const activeOrders = useMemo(() => orders.filter(o => !['delivered', 'cancelled'].includes(o.status)), [orders]);
  const pastOrders = useMemo(() => orders.filter(o => ['delivered', 'cancelled'].includes(o.status)), [orders]);
  const stopListDishes = useMemo(() => dishes.filter(d => !d.available), [dishes]);

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

  const toggleAvailability = async (dish: Dish) => {
    try {
      await api.dishes.update(dish.id, { available: !dish.available });
    } catch (err) {
      alert("Ошибка обновления статуса");
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
      alert("Ошибка при загрузке фото");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center py-40 gap-8 text-center px-4">
      <ShieldAlert size={80} className="text-amber-900/10" />
      <h2 className="text-2xl font-black text-amber-950 uppercase italic tracking-tighter">Доступ ограничен</h2>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-amber-950 uppercase italic tracking-tighter flex items-center gap-2">
            Админ <BellRing className={activeOrders.some(o => o.status === 'pending') ? "text-orange-500 animate-bounce" : "text-amber-200"} size={20} />
          </h1>
          <p className="text-amber-800/40 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Панель управления заказами</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition ${soundEnabled ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-gray-400 border-gray-100'}`}>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button onClick={loadData} disabled={isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-100 font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 shadow-sm">
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Обновить
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar p-1 bg-amber-100/30 rounded-2xl w-full sm:w-fit">
        {[
          { id: 'orders', label: `Заказы (${activeOrders.length})` },
          { id: 'history', label: 'История' },
          { id: 'stoplist', label: `Стоп (${stopListDishes.length})` },
          { id: 'menu', label: 'Меню' },
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)} 
            className={`whitespace-nowrap px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-amber-950 text-white shadow-lg' : 'text-amber-900/40 hover:bg-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-amber-50 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-amber-950 text-base">#{order.id.toString().slice(-4)}</span>
                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{order.total_amount} ₽</span>
                  </div>
                  <p className="text-[11px] text-amber-900/60 font-bold leading-tight">{order.delivery_address}</p>
                  <p className="text-[9px] text-gray-400 font-medium">{order.contact_phone}</p>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <select 
                    value={order.status} 
                    onChange={(e) => api.orders.updateStatus(order.id, e.target.value as any)} 
                    className="flex-1 sm:flex-none bg-amber-50 p-3 rounded-xl font-black text-[10px] uppercase border-none outline-none shadow-sm focus:ring-2 focus:ring-orange-500/20"
                   >
                     <option value="pending">🔔 Новый</option>
                     <option value="confirmed">👍 Принят</option>
                     <option value="cooking">👨‍🍳 Кухня</option>
                     <option value="delivering">🚚 Путь</option>
                     <option value="delivered">✅ ОК</option>
                     <option value="cancelled">❌ Отмена</option>
                   </select>
                   <button onClick={() => setViewingOrder(order)} className="p-3 bg-amber-950 text-white rounded-xl hover:bg-orange-500 transition shadow-sm">
                     <Eye size={18} />
                   </button>
                </div>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <div className="py-20 text-center text-amber-900/20 font-black uppercase text-xs tracking-widest">Активных заказов нет</div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            {dishes.length === 0 && !isLoading && (
              <div className="bg-amber-50 p-10 rounded-[3rem] text-center border-4 border-dashed border-amber-100 flex flex-col items-center gap-4">
                <Sparkles size={48} className="text-amber-200" />
                <p className="font-black text-amber-950 uppercase text-[10px] tracking-widest">База данных меню пуста</p>
                <button onClick={handleSeedDishes} className="bg-amber-950 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Восстановить меню</button>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              <button 
                onClick={() => { setEditingDish({ available: true, category: 'main', name: '', description: '', price: 0, ingredients: '' }); setIsDishModalOpen(true); }}
                className="bg-amber-950 p-6 rounded-[2rem] flex flex-col justify-center items-center text-center text-white hover:bg-orange-600 transition-all shadow-xl"
              >
                <Plus size={32} className="mb-2" />
                <span className="font-black text-[9px] uppercase tracking-widest">Добавить</span>
              </button>
              {dishes.map(dish => (
                <div key={dish.id} className={`bg-white p-3 rounded-[2rem] border shadow-sm relative group flex flex-col transition-all ${dish.available ? 'border-amber-50' : 'border-red-100 opacity-75'}`}>
                  <div className="relative">
                    <img src={dish.image} className={`w-full h-24 sm:h-32 object-cover rounded-2xl mb-3 ${!dish.available && 'grayscale'}`} alt={dish.name} />
                    {!dish.available && (
                      <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center rounded-2xl">
                        <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg">СТОП</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-black text-amber-950 text-[10px] sm:text-xs truncate px-1">{dish.name}</h4>
                  <div className="flex items-center justify-between mt-auto pt-2">
                     <span className="text-[10px] font-bold text-orange-500">{dish.price} ₽</span>
                     <div className="flex gap-1">
                       <button 
                        onClick={() => toggleAvailability(dish)} 
                        className={`p-2 rounded-lg transition-colors ${dish.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                        title={dish.available ? "Убрать из меню" : "Вернуть в меню"}
                       >
                         {dish.available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                       </button>
                       <button onClick={() => { setEditingDish(dish); setIsDishModalOpen(true); }} className="p-2 bg-amber-50 text-amber-900 rounded-lg"><Edit3 size={14} /></button>
                       <button onClick={() => setDishToDelete(dish)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stoplist' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {stopListDishes.map(dish => (
              <div key={dish.id} className="bg-white p-4 rounded-[2rem] border border-red-100 shadow-sm flex flex-col items-center text-center">
                <img src={dish.image} className="w-20 h-20 object-cover rounded-2xl mb-3 grayscale" alt={dish.name} />
                <h4 className="font-black text-amber-950 text-[10px] uppercase tracking-tight mb-4">{dish.name}</h4>
                <button 
                  onClick={() => toggleAvailability(dish)}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={12} /> В меню
                </button>
              </div>
            ))}
            {stopListDishes.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center gap-4 text-amber-900/20">
                <CheckCircle2 size={48} />
                <p className="font-black uppercase text-xs tracking-widest">Все блюда в наличии</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
           <div className="space-y-3">
             {pastOrders.map(order => (
               <div key={order.id} className="bg-white/60 p-5 rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 grayscale-[0.5] opacity-80">
                 <div className="flex-1 space-y-1">
                   <div className="flex items-center gap-3">
                     <span className="font-black text-gray-500 text-base">#{order.id.toString().slice(-4)}</span>
                     <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{order.total_amount} ₽</span>
                   </div>
                   <p className="text-[11px] text-gray-400 font-bold leading-tight">{order.delivery_address}</p>
                   <p className="text-[9px] text-gray-300 font-medium">{new Date(order.created_at).toLocaleString()}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {order.status === 'delivered' ? 'Выполнен' : 'Отменен'}
                    </span>
                    <button onClick={() => setViewingOrder(order)} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition">
                      <FileText size={18} />
                    </button>
                 </div>
               </div>
             ))}
             {pastOrders.length === 0 && (
               <div className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Архив пуст</div>
             )}
           </div>
        )}
      </div>

      {/* View Order Modal */}
      <Modal isOpen={!!viewingOrder} onClose={() => setViewingOrder(null)} title={`Заказ #${viewingOrder?.id.toString().slice(-4)}`}>
        {viewingOrder && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Адрес доставки</span>
                <p className="font-bold text-amber-950 text-sm">{viewingOrder.delivery_address}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Телефон клиента</span>
                <p className="font-bold text-amber-950 text-sm">{viewingOrder.contact_phone}</p>
              </div>
              {viewingOrder.comment && (
                <div className="flex flex-col gap-1 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <span className="text-[9px] font-black uppercase text-amber-900/40 tracking-widest">Комментарий</span>
                  <p className="text-amber-950 text-xs italic">"{viewingOrder.comment}"</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <span className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest">Состав</span>
              {viewingOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-50">
                  <span className="font-bold text-amber-950 text-xs">{item.dish.name} <span className="text-orange-500">x{item.quantity}</span></span>
                  <span className="font-black text-amber-950 text-xs">{item.dish.price * item.quantity} ₽</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t">
              <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Итого</span>
              <span className="text-2xl font-black text-orange-600">{viewingOrder.total_amount} ₽</span>
            </div>
            
            <button onClick={() => setViewingOrder(null)} className="w-full bg-amber-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Закрыть</button>
          </div>
        )}
      </Modal>

      {/* Dish Modal */}
      <Modal isOpen={isDishModalOpen} onClose={() => setIsDishModalOpen(false)} title="Блюдо">
        <form onSubmit={handleSaveDish} className="space-y-4">
          <input required placeholder="Название" className="w-full p-4 bg-amber-50 rounded-2xl font-bold outline-none text-sm border-none shadow-inner" value={editingDish?.name || ''} onChange={e => setEditingDish(prev => ({ ...prev, name: e.target.value }))} />
          <textarea placeholder="Описание" className="w-full p-4 bg-amber-50 rounded-2xl font-bold outline-none h-24 resize-none text-xs border-none shadow-inner" value={editingDish?.description || ''} onChange={e => setEditingDish(prev => ({ ...prev, description: e.target.value }))} />
          
          {/* New Ingredients Field */}
          <textarea 
            placeholder="Состав (ингредиенты)" 
            className="w-full p-4 bg-amber-50 rounded-2xl font-bold outline-none h-20 resize-none text-xs border-none shadow-inner" 
            value={editingDish?.ingredients || ''} 
            onChange={e => setEditingDish(prev => ({ ...prev, ingredients: e.target.value }))} 
          />
          
          <div className="grid grid-cols-2 gap-3">
             <input required type="number" placeholder="Цена" className="w-full p-4 bg-amber-50 rounded-2xl font-bold text-sm border-none shadow-inner" value={editingDish?.price || 0} onChange={e => setEditingDish(prev => ({ ...prev, price: parseInt(e.target.value) }))} />
             <select className="w-full p-4 bg-amber-50 rounded-2xl font-bold text-[10px] uppercase border-none shadow-inner" value={editingDish?.category || 'main'} onChange={e => setEditingDish(prev => ({ ...prev, category: e.target.value as any }))}>
               <option value="main">Основные</option>
               <option value="soups">Супы</option>
               <option value="bakery">Выпечка</option>
               <option value="salads">Салаты</option>
               <option value="drinks">Напитки</option>
             </select>
          </div>
          <div className="space-y-4">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-4 border-dashed border-amber-100 rounded-[2.5rem] flex flex-col items-center justify-center text-amber-950/20 hover:bg-amber-50 transition gap-2 group">
              {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
              <span className="text-[9px] font-black uppercase tracking-widest">{editingDish?.image ? 'Изменить фото' : 'Выбрать фото'}</span>
            </button>
          </div>
          <button disabled={isLoading || isUploading} className="w-full bg-amber-950 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50">{isLoading ? <Loader2 size={20} className="animate-spin mx-auto"/> : "Сохранить"}</button>
        </form>
      </Modal>

      <Modal isOpen={!!dishToDelete} onClose={() => setDishToDelete(null)} title="Удалить?">
        <div className="text-center space-y-6 py-4">
          <AlertTriangle size={40} className="mx-auto text-red-500" />
          <p className="text-amber-950 font-black text-sm">Удалить «{dishToDelete?.name}»?</p>
          <div className="flex gap-3">
            <button onClick={() => setDishToDelete(null)} className="flex-1 py-4 bg-amber-50 text-amber-950 rounded-xl font-black text-[10px] uppercase tracking-widest">Отмена</button>
            <button onClick={async () => { if (dishToDelete) { await api.dishes.delete(dishToDelete.id); setDishToDelete(null); } }} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Удалить</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
