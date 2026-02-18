
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, MapPin, Clock, Info, Slash } from 'lucide-react';
import { api } from '../apiClient.ts';
import { supabase } from '../supabaseClient.ts';
import { Dish } from './types.ts';
import { useCart } from '../contexts/CartContext.tsx';
import Modal from '../components/ui/Modal.tsx';
import Logo from '../components/Logo.tsx';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'main', label: 'Горячее' },
  { id: 'soups', label: 'Супы' },
  { id: 'bakery', label: 'Выпечка' },
  { id: 'salads', label: 'Салаты' },
  { id: 'drinks', label: 'Напитки' },
];

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Горячее',
  soups: 'Супы',
  bakery: 'Выпечка',
  salads: 'Салаты',
  drinks: 'Напитки',
  desserts: 'Десерты',
};

const Home: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const loadDishes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.dishes.getAll();
      setDishes(data);
    } catch (err) {
      console.error("Home: Failed to load dishes", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();

    const channel = supabase
      .channel('public:dishes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedDish = payload.new as Dish;
            setDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
          } else if (payload.eventType === 'INSERT') {
            setDishes(prev => [...prev, payload.new as Dish]);
          } else if (payload.eventType === 'DELETE') {
            setDishes(prev => prev.filter(d => d.id !== payload.old.id));
          }
      })
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
    <div className="flex flex-col items-center justify-center py-32 md:py-48 gap-6 text-amber-950/20">
      <Loader2 className="animate-spin w-12 h-12" />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Затапливаем тандыр...</p>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Hero Section */}
      <div className="relative rounded-[2rem] md:rounded-[4rem] overflow-hidden bg-amber-950 text-white p-6 md:p-20 shadow-2xl flex flex-col items-center text-center">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
        <div className="relative z-10 w-full max-w-3xl space-y-4 md:space-y-8 flex flex-col items-center">
          {/* Маленький силуэт чайника вместо большого логотипа */}
          <div className="bg-white p-3 rounded-full mb-4 shadow-2xl">
            <Logo size={64} color="#1e1b4b" hideText={true} className="md:w-[80px] md:h-[80px]" />
          </div>
          <h1 className="text-3xl md:text-7xl font-black italic tracking-tighter leading-[0.9] md:leading-tight">
            Чайхана <br/><span className="text-orange-500 uppercase">Жулебино</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 backdrop-blur-md">
              <Clock size={14} className="text-orange-400" />
              <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest">45 мин</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 backdrop-blur-md">
              <MapPin size={14} className="text-orange-400" />
              <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest">Жулебинский б-р, 26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sticky top-16 md:top-24 z-30 bg-[#f9f3e9]/95 backdrop-blur-xl p-2 md:p-4 rounded-2xl md:rounded-[3rem] border border-white/50 shadow-xl flex flex-col md:flex-row gap-2 md:gap-4 items-center">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 flex-nowrap w-full md:flex-1">
          {CATEGORIES.map(c => (
            <button 
              key={c.id} 
              onClick={() => setActiveCategory(c.id)} 
              className={`whitespace-nowrap px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === c.id ? 'bg-amber-950 text-white shadow-lg' : 'bg-white text-amber-950/40 hover:bg-white hover:text-amber-950 shadow-sm border border-transparent hover:border-amber-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80 group">
          <input 
            type="text" 
            placeholder="Поиск..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-10 md:pl-14 pr-4 md:pr-8 py-2.5 md:py-4 rounded-xl md:rounded-[2rem] bg-white text-xs md:text-sm font-bold border-none outline-none shadow-sm focus:ring-2 focus:ring-orange-500/20 transition-all" 
          />
          <Search className="absolute left-3.5 md:left-5 top-1/2 -translate-y-1/2 text-amber-950/20 group-focus-within:text-orange-500 transition-colors" size={16} />
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10 px-1">
        {filtered.map(dish => (
          <div 
            key={dish.id} 
            onClick={() => dish.available && setSelectedDish(dish)} 
            className={`bg-white rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-sm transition-all duration-500 border border-amber-50/50 ${dish.available ? 'hover:shadow-3xl md:hover:-translate-y-2 cursor-pointer group' : 'opacity-60 grayscale-[0.5]'}`}
          >
            <div className="h-48 md:h-72 overflow-hidden relative">
              <img src={dish.image} alt={dish.name} className={`w-full h-full object-cover transition duration-700 ${dish.available ? 'group-hover:scale-110' : ''}`} />
              {!dish.available && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white font-black uppercase text-[10px] tracking-widest"><Slash size={14} className="mr-2" /> СТОП</div>}
            </div>
            <div className="p-5 md:p-10">
              <h3 className="font-black text-lg md:text-2xl mb-1 md:mb-3 text-amber-950 truncate">{dish.name}</h3>
              <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-widest line-clamp-2 h-7 md:h-8 mb-2 md:mb-4">{dish.description}</p>
              
              <div className="font-black text-xl md:text-3xl text-orange-500 mb-4 md:mb-8 italic tracking-tighter">
                {dish.price} ₽
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[8px] md:text-[9px] font-black uppercase px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-orange-500 bg-orange-50">{CATEGORY_LABELS[dish.category] || dish.category}</span>
                {dish.available && <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-950 text-white rounded-lg md:rounded-2xl flex items-center justify-center md:group-hover:bg-orange-500 transition-all duration-500"><Plus size={16} className="md:w-6 md:h-6" /></div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dish Details Modal */}
      <Modal isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title={selectedDish?.name}>
        {selectedDish && (
          <div className="flex flex-col gap-6">
            <div className="relative">
               <img src={selectedDish.image} alt={selectedDish.name} className="w-full aspect-[4/3] object-cover rounded-[1.5rem] md:rounded-[3rem] shadow-2xl" />
               <div className="absolute bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-2xl font-black text-lg shadow-2xl">
                 {selectedDish.price * quantity} ₽
               </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-500 text-sm md:text-lg leading-relaxed font-medium">{selectedDish.description}</p>
              
              {selectedDish.ingredients && (
                <div className="bg-amber-50 p-4 md:p-6 rounded-2xl border border-amber-100/50">
                  <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-[9px] tracking-widest mb-2">
                    <Info size={12} /> Состав
                  </div>
                  <p className="text-amber-950/70 text-xs md:text-sm font-bold leading-relaxed">{selectedDish.ingredients}</p>
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4">
                <div className="flex items-center bg-amber-50 rounded-2xl p-1.5 justify-between shadow-inner">
                   <button 
                    onClick={() => setQuantity(q => Math.max(1, q-1))} 
                    className="w-12 h-12 flex items-center justify-center text-xl font-black text-amber-900 hover:bg-white rounded-xl transition-all"
                   >
                     −
                   </button>
                   <span className="font-black text-amber-950 text-xl">{quantity}</span>
                   <button 
                    onClick={() => setQuantity(q => q+1)} 
                    className="w-12 h-12 flex items-center justify-center text-xl font-black text-amber-900 hover:bg-white rounded-xl transition-all"
                   >
                     +
                   </button>
                </div>
                
                <button 
                  onClick={() => { addToCart(selectedDish, quantity); setSelectedDish(null); setQuantity(1); }} 
                  className="w-full bg-amber-950 text-white py-4.5 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <Plus size={16} /> Добавить в корзину
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Home;
