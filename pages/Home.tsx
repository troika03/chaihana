
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, Sparkles, MapPin, Clock, RefreshCw, Slash, Info } from 'lucide-react';
import { api } from '../apiClient.ts';
import { supabase } from '../supabaseClient.ts';
import { Dish } from './types.ts';
import { useCart } from '../contexts/CartContext.tsx';
import Modal from '../components/ui/Modal.tsx';

const CATEGORIES = [
  { id: 'all', label: 'Все блюда' },
  { id: 'main', label: 'Основные' },
  { id: 'soups', label: 'Супы' },
  { id: 'bakery', label: 'Выпечка' },
  { id: 'salads', label: 'Салаты' },
  { id: 'drinks', label: 'Напитки' },
  { id: 'desserts', label: 'Десерты' },
];

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Основные',
  soups: 'Супы',
  bakery: 'Выпечка',
  salads: 'Салаты',
  drinks: 'Напитки',
  desserts: 'Десерты',
};

const Home: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const loadDishes = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    
    const safetyTimeout = setTimeout(() => setIsLoading(false), 5000);

    try {
      const data = await api.dishes.getAll();
      setDishes(data);
    } catch (err) {
      console.error("Home: Failed to load dishes", err);
      setError(true);
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();

    const channel = supabase
      .channel('public:dishes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dishes' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedDish = payload.new as Dish;
            setDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
          } else if (payload.eventType === 'INSERT') {
            setDishes(prev => [...prev, payload.new as Dish]);
          } else if (payload.eventType === 'DELETE') {
            setDishes(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDishes]);

  const filtered = dishes.filter(d => 
    (activeCategory === 'all' || d.category === activeCategory) &&
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <Loader2 className="animate-spin text-amber-950" size={64} />
      <p className="text-amber-950 font-black italic tracking-tighter text-2xl">Затапливаем тандыр...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="relative rounded-[4rem] overflow-hidden bg-amber-950 text-white p-12 md:p-20 shadow-2xl flex flex-col items-center text-center">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
        <div className="relative z-10 w-full max-w-3xl">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-10 leading-none">
            Чайхана <br/><span className="text-orange-500">Жулебино</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
              <Clock size={20} className="text-orange-400"/>
              <span className="text-[11px] font-black uppercase tracking-widest">45 мин доставка</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
              <MapPin size={20} className="text-orange-400"/>
              <span className="text-[11px] font-black uppercase tracking-widest">Жулебинский б-р 26</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-24 z-30 bg-[#f9f3e9]/90 backdrop-blur-xl p-4 md:p-6 rounded-[3rem] border border-white shadow-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-4 flex-nowrap flex-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === c.id ? 'bg-amber-950 text-white shadow-lg' : 'bg-white text-amber-900/40 hover:bg-amber-50 shadow-sm'}`}>{c.label}</button>
          ))}
        </div>
        <div className="relative w-full md:w-72 group">
          <input type="text" placeholder="Поиск блюд..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-4 rounded-[2rem] bg-white text-sm font-bold border-none outline-none shadow-sm" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-900/20 group-focus-within:text-orange-500 transition-colors" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {filtered.map(dish => (
          <div key={dish.id} onClick={() => dish.available && setSelectedDish(dish)} className={`bg-white rounded-[3.5rem] overflow-hidden shadow-sm transition-all duration-700 border border-amber-50/50 ${dish.available ? 'hover:shadow-3xl hover:-translate-y-4 cursor-pointer group' : 'opacity-60 grayscale-[0.5]'}`}>
            <div className="h-72 overflow-hidden relative">
              <img src={dish.image} alt={dish.name} className={`w-full h-full object-cover transition duration-1000 ${dish.available ? 'group-hover:scale-110' : ''}`} />
              <div className="absolute top-6 right-6 bg-white/95 px-5 py-2 rounded-2xl font-black text-amber-950 shadow-xl">{dish.price} ₽</div>
              {!dish.available && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white font-black uppercase text-[10px] tracking-widest"><Slash size={14} className="mr-2" /> Нет в наличии</div>}
            </div>
            <div className="p-10">
              <h3 className="font-black text-2xl mb-3 text-amber-950 truncate">{dish.name}</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest line-clamp-2 h-8 mb-8">{dish.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase px-4 py-2 rounded-xl text-orange-500 bg-orange-50">{CATEGORY_LABELS[dish.category] || dish.category}</span>
                {dish.available && <div className="w-12 h-12 bg-amber-950 text-white rounded-[1.2rem] flex items-center justify-center group-hover:bg-orange-500 transition-all duration-500"><Plus size={24} /></div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title={selectedDish?.name}>
        {selectedDish && (
          <div className="space-y-8">
            <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-80 object-cover rounded-[3rem] shadow-2xl" />
            <div className="space-y-6">
              <p className="text-gray-500 text-lg leading-relaxed font-medium">{selectedDish.description}</p>
              {selectedDish.ingredients && (
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-[10px] tracking-widest mb-3">
                    <Info size={14} /> Состав блюда
                  </div>
                  <p className="text-amber-950/70 text-sm font-bold leading-relaxed">{selectedDish.ingredients}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                <div className="flex items-center bg-amber-50 rounded-[2rem] p-3 shadow-inner w-full sm:w-auto justify-between">
                   <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-14 h-14 font-black text-2xl text-amber-900 hover:bg-white rounded-2xl transition-all">-</button>
                   <span className="w-16 text-center font-black text-amber-950 text-2xl">{quantity}</span>
                   <button onClick={() => setQuantity(q => q+1)} className="w-14 h-14 font-black text-2xl text-amber-900 hover:bg-white rounded-2xl transition-all">+</button>
                </div>
                <button onClick={() => { addToCart(selectedDish, quantity); setSelectedDish(null); setQuantity(1); }} className="flex-1 w-full bg-amber-950 text-white py-6 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-2xl">Добавить за {selectedDish.price * quantity} ₽</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Home;
