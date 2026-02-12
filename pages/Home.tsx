
import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient.ts';
import { Dish } from './types.ts';
import { useCart } from '../contexts/CartContext.tsx';
import Modal from '../components/ui/Modal.tsx';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'main', label: 'Основные' },
  { id: 'soups', label: 'Супы' },
  { id: 'salads', label: 'Салаты' },
  { id: 'drinks', label: 'Напитки' },
  { id: 'desserts', label: 'Десерты' },
];

const Home: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('dishes')
        .select('*')
        .order('name', { ascending: true });

      if (dbError) throw dbError;
      setDishes(data || []);
    } catch (e: any) {
      console.error("Fetch error:", e);
      setError("Не удалось загрузить меню. Попробуйте обновить страницу.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = activeCategory === 'all' || dish.category === activeCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenDish = (dish: Dish) => {
    setSelectedDish(dish);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (selectedDish) {
      addToCart(selectedDish, quantity);
      setSelectedDish(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-amber-900" size={48} />
        <p className="text-amber-900 font-bold uppercase tracking-widest text-xs">Загрузка меню...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center py-6">
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 mb-3 font-serif italic tracking-tighter">Чайхана Жулебино</h1>
        <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full mb-4"></div>
        <p className="text-amber-800/60 font-black uppercase tracking-[0.3em] text-[10px]">Вкус Востока в каждом кусочке</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 bg-[#f9f3e9]/90 backdrop-blur-xl p-4 z-30 rounded-[2rem] border border-white/50 shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-900 text-white shadow-lg'
                  : 'bg-white text-amber-900/40 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 rounded-2xl border-none bg-white shadow-inner text-sm font-bold placeholder:text-amber-900/20"
          />
          <Search className="absolute left-4 top-3 text-amber-900/20" size={18} />
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-red-100 p-8 max-w-md mx-auto">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button onClick={fetchDishes} className="flex items-center gap-2 mx-auto bg-amber-900 text-white px-6 py-3 rounded-xl font-bold">
            <RefreshCw size={18} /> Повторить
          </button>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="text-center py-40">
          <UtensilsCrossed size={48} className="mx-auto text-amber-900/10 mb-4" />
          <p className="text-xl font-black text-amber-950/20 uppercase tracking-widest">Ничего не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredDishes.map(dish => (
            <div 
              key={dish.id}
              onClick={() => handleOpenDish(dish)}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-amber-50"
            >
              <div className="h-56 overflow-hidden relative">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition group-hover:scale-105" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl font-black text-amber-900 shadow-sm">
                  {dish.price} ₽
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-black text-lg text-amber-950 mb-1 leading-tight">{dish.name}</h3>
                <p className="text-[11px] text-gray-400 font-medium line-clamp-2 mb-4 h-8">{dish.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-900/30">{dish.category}</span>
                  <div className="w-8 h-8 bg-amber-900 text-white rounded-xl flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title={selectedDish?.name}>
        {selectedDish && (
          <div className="space-y-6">
            <div className="h-64 rounded-2xl overflow-hidden shadow-inner">
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{selectedDish.description}</p>
            <div className="flex items-center justify-between gap-4 pt-4">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                 <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-10 h-10 flex items-center justify-center font-bold text-lg">-</button>
                 <span className="w-10 text-center font-black">{quantity}</span>
                 <button onClick={() => setQuantity(q => q+1)} className="w-10 h-10 flex items-center justify-center font-bold text-lg">+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-amber-900 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-800 transition"
              >
                В корзину: {selectedDish.price * quantity} ₽
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
