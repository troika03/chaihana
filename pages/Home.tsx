
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, Sparkles, MapPin, Clock, RefreshCw, Slash } from 'lucide-react';
import { api } from '../apiClient.ts';
import { Dish } from './types.ts';
import { useCart } from '../contexts/CartContext.tsx';
import Modal from '../components/ui/Modal.tsx';

const CATEGORIES = [
  { id: 'all', label: 'Все блюда' },
  { id: 'main', label: 'Основные' },
  { id: 'soups', label: 'Супы' },
  { id: 'salads', label: 'Салаты' },
  { id: 'drinks', label: 'Напитки' },
  { id: 'desserts', label: 'Десерты' },
];

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
    try {
      const data = await api.dishes.getAll();
      setDishes(data);
    } catch (err) {
      console.error("Home: Failed to load dishes", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  const filtered = dishes.filter(d => 
    (activeCategory === 'all' || d.category === activeCategory) &&
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="relative">
        <Loader2 className="animate-spin text-amber-950" size={64} />
        <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-orange-500 animate-pulse" size={24} />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-amber-950 font-black italic tracking-tighter text-2xl">Затапливаем тандыр...</p>
        <p className="text-amber-900/40 text-[10px] font-black uppercase tracking-[0.3em]">Пожалуйста, подождите</p>
      </div>
    </div>
  );

  if (error && dishes.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
      <h2 className="text-2xl font-black text-amber-950 italic">Не удалось загрузить меню</h2>
      <button 
        onClick={loadDishes}
        className="flex items-center gap-3 bg-amber-950 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all"
      >
        <RefreshCw size={18} /> Попробовать снова
      </button>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="relative rounded-[4rem] overflow-hidden bg-amber-950 text-white p-12 md:p-20 shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-none">Чайхана <br/><span className="text-orange-500">Жулебино</span></h1>
          <p className="text-amber-100/60 text-lg md:text-xl font-medium mb-10">Традиции гостеприимства и аутентичные рецепты Востока в самом сердце вашего района.</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3"><Clock size={18} className="text-orange-400"/><span className="text-[10px] font-black uppercase">45 мин доставка</span></div>
            <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3"><MapPin size={18} className="text-orange-400"/><span className="text-[10px] font-black uppercase">Жулебино • Люберцы</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 justify-between items-center sticky top-24 bg-[#f9f3e9]/80 backdrop-blur-2xl p-6 z-30 rounded-[3rem] border border-white shadow-xl">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === c.id ? 'bg-amber-950 text-white shadow-lg scale-105' : 'bg-white text-amber-900/40 hover:bg-amber-50'}`}>{c.label}</button>
          ))}
        </div>
        <div className="relative w-full md:w-80 group">
          <input type="text" placeholder="Поиск блюд..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-4 rounded-[2rem] bg-white text-sm font-bold border-none outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"/>
          <Search className="absolute left-5 top-4 text-amber-900/20 group-focus-within:text-orange-500 transition-colors" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {filtered.map(dish => (
          <div 
            key={dish.id} 
            onClick={() => dish.available && setSelectedDish(dish)} 
            className={`bg-white rounded-[3.5rem] overflow-hidden shadow-sm transition-all duration-700 transform border border-amber-50/50 ${dish.available ? 'hover:shadow-3xl hover:-translate-y-4 cursor-pointer group' : 'opacity-60 cursor-not-allowed grayscale-[0.5]'}`}
          >
            <div className="h-72 overflow-hidden relative">
              <img src={dish.image} alt={dish.name} className={`w-full h-full object-cover transition duration-1000 ${dish.available ? 'group-hover:scale-110' : ''}`} />
              {dish.available ? (
                <div className="absolute top-6 right-6 bg-white/95 px-5 py-2 rounded-2xl font-black text-amber-950 shadow-xl">{dish.price} ₽</div>
              ) : (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                   <div className="bg-white/95 text-amber-950 font-black text-[10px] uppercase tracking-[0.3em] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
                     <Slash size={14} className="text-red-500" /> Нет в наличии
                   </div>
                </div>
              )}
            </div>
            <div className="p-10">
              <h3 className={`font-black text-2xl mb-3 transition-colors ${dish.available ? 'text-amber-950 group-hover:text-orange-600' : 'text-amber-900/40'}`}>{dish.name}</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest line-clamp-2 h-8 mb-8">{dish.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl ${dish.available ? 'text-orange-500 bg-orange-50' : 'text-gray-400 bg-gray-100'}`}>{dish.category}</span>
                {dish.available && (
                  <div className="w-12 h-12 bg-amber-950 text-white rounded-[1.2rem] flex items-center justify-center group-hover:bg-orange-500 transition-all duration-500 group-hover:rotate-90"><Plus size={24} /></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title={selectedDish?.name}>
        {selectedDish && (
          <div className="space-y-10">
            <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-80 object-cover rounded-[3rem] shadow-2xl" />
            <div className="px-4">
              <p className="text-gray-500 text-xl leading-relaxed mb-12 font-medium">{selectedDish.description}</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
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
