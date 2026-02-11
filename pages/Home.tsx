
import React, { useState, useEffect } from 'react';
import { Search, Plus, Info } from 'lucide-react';
import { supabase, MOCK_DISHES } from '../supabaseClient';
import { Dish } from './types';
import { useCart } from '../contexts/CartContext';
import Modal from '../components/ui/Modal';

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
  const [isDemo, setIsDemo] = useState(false);
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
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        setDishes(MOCK_DISHES);
        setIsDemo(true);
        if (error) console.warn("Using mock data due to DB error:", error.message);
      } else {
        setDishes(data);
        setIsDemo(false);
      }
    } catch (e: any) {
      setDishes(MOCK_DISHES);
      setIsDemo(true);
    }
    setIsLoading(false);
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

  return (
    <div className="space-y-8 pb-12">
      {isDemo && !isLoading && (
        <div className="bg-amber-100/50 border border-amber-200 p-3 rounded-2xl flex items-center justify-center gap-3 text-amber-900 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <Info size={16} />
          Работаем в демонстрационном режиме. База данных не настроена.
        </div>
      )}

      <div className="text-center py-6">
        <h1 className="text-4xl md:text-5xl font-black text-amber-950 mb-3 font-serif italic tracking-tight">Чайхана Жулебино</h1>
        <div className="w-24 h-1 bg-orange-400 mx-auto rounded-full mb-3 shadow-sm"></div>
        <p className="text-amber-800/60 font-medium uppercase tracking-widest text-[10px]">Аутентичная кухня & восточное гостеприимство</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-16 bg-[#f9f3e9]/95 backdrop-blur-md p-4 z-30 rounded-3xl shadow-sm border border-amber-100">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-black transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-amber-900 text-white shadow-lg shadow-amber-900/20 transform scale-105'
                  : 'bg-white text-amber-900/60 hover:bg-amber-50 hover:text-amber-950'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 group">
          <input
            type="text"
            placeholder="Что закажем?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-transparent focus:border-amber-800 focus:outline-none bg-white shadow-sm group-hover:shadow transition-all text-sm font-medium"
          />
          <Search className="absolute left-3 top-3 text-amber-800/40" size={18} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-100 border-t-amber-900"></div>
          <p className="text-amber-900 font-black uppercase text-[10px] tracking-widest animate-pulse">Готовим меню...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredDishes.map(dish => (
            <div 
              key={dish.id}
              onClick={() => handleOpenDish(dish)}
              className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group border border-amber-50 ${!dish.available ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="h-56 overflow-hidden relative">
                <img 
                  src={dish.image} 
                  alt={dish.name} 
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {!dish.available && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <span className="bg-white text-amber-950 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">Нет в наличии</span>
                   </div>
                )}
                {dish.available && (
                  <div className="absolute bottom-4 right-4 bg-white text-amber-900 p-3 rounded-2xl shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <Plus size={20} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-xl text-amber-950 leading-tight group-hover:text-amber-800 transition-colors">{dish.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-black text-lg text-amber-900 bg-amber-50 px-3 py-1 rounded-xl">
                    {dish.price} ₽
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800/30">{dish.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredDishes.length === 0 && (
        <div className="text-center py-32 space-y-4">
          <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
             <Search size={32} className="text-amber-200" />
          </div>
          <p className="text-xl font-black text-amber-950/40">Блюда не найдены</p>
          <button onClick={() => {setSearchQuery(''); setActiveCategory('all');}} className="text-amber-800 font-bold hover:underline">Сбросить фильтры</button>
        </div>
      )}

      <Modal 
        isOpen={!!selectedDish} 
        onClose={() => setSelectedDish(null)}
        title={selectedDish?.name}
      >
        {selectedDish && (
          <div className="space-y-6">
            <img 
              src={selectedDish.image} 
              alt={selectedDish.name} 
              className="w-full h-72 object-cover rounded-[2rem] shadow-xl"
            />
            <div className="px-2">
              <p className="text-gray-600 leading-relaxed mb-6 font-medium">{selectedDish.description}</p>
              <div className="flex items-center justify-between bg-amber-50 p-6 rounded-[2rem] mb-6">
                <span className="text-3xl font-black text-amber-950">{selectedDish.price * quantity} ₽</span>
                {selectedDish.available ? (
                    <div className="flex items-center gap-5 bg-white px-4 py-2 rounded-2xl shadow-sm border border-amber-100">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-amber-900 hover:bg-amber-50 rounded-lg font-black transition">-</button>
                      <span className="font-black text-lg w-6 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-amber-900 hover:bg-amber-50 rounded-lg font-black transition">+</button>
                    </div>
                ) : (
                    <span className="text-red-600 font-black uppercase text-xs tracking-widest">Временно отсутствует</span>
                )}
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={!selectedDish.available}
                className="w-full bg-amber-900 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-amber-800 transition shadow-xl shadow-amber-900/20 active:scale-95 disabled:opacity-50"
              >
                {selectedDish.available ? `Добавить в заказ` : 'Пока нет в наличии'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
