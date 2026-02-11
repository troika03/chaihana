
import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
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

      if (error) {
        console.error('Supabase Dishes Fetch Error:', error.message);
        console.warn('Using mock data due to database error');
        setDishes(MOCK_DISHES);
      } else if (data && data.length > 0) {
        setDishes(data);
      } else {
        console.warn('Database table "dishes" is empty, using mock data');
        setDishes(MOCK_DISHES);
      }
    } catch (e: any) {
      console.error('System Fetch Error:', e.message);
      setDishes(MOCK_DISHES);
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
    <div className="space-y-8">
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold text-amber-900 mb-2 font-serif">Чайхана Жулебино</h1>
        <p className="text-amber-700/80">Аутентичная восточная кухня с доставкой</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-16 bg-[#f9f3e9]/95 backdrop-blur-sm p-4 z-30 rounded-xl shadow-sm border border-amber-100">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-800 text-white shadow-md transform scale-105'
                  : 'bg-white text-amber-900 hover:bg-amber-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Поиск блюд..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-amber-800/20 focus:border-amber-800 focus:outline-none bg-white"
          />
          <Search className="absolute left-3 top-2.5 text-amber-800/40" size={18} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDishes.map(dish => (
            <div 
              key={dish.id}
              onClick={() => handleOpenDish(dish)}
              className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group border border-amber-50 ${!dish.available ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={dish.image} 
                  alt={dish.name} 
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                />
                {!dish.available && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">Нет в наличии</span>
                   </div>
                )}
                {dish.available && (
                  <button className="absolute bottom-3 right-3 bg-white text-amber-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition">
                    <Plus size={20} />
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800 leading-tight">{dish.name}</h3>
                  <span className="font-bold text-amber-700 whitespace-nowrap bg-amber-50 px-2 py-1 rounded-lg text-sm">
                    {dish.price} ₽
                  </span>
                </div>
                <p className="text-gray-500 text-sm line-clamp-2">{dish.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredDishes.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl">Блюда не найдены</p>
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
              className="w-full h-64 object-cover rounded-xl shadow-md"
            />
            <div>
              <p className="text-gray-600 leading-relaxed mb-4">{selectedDish.description}</p>
              <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl">
                <span className="text-2xl font-bold text-amber-900">{selectedDish.price} ₽</span>
                {selectedDish.available ? (
                    <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-lg shadow-sm border border-amber-100">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-amber-900 hover:bg-amber-50 rounded font-bold">-</button>
                    <span className="font-bold w-4 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-amber-900 hover:bg-amber-50 rounded font-bold">+</button>
                    </div>
                ) : (
                    <span className="text-red-600 font-bold">Временно отсутствует</span>
                )}
              </div>
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={!selectedDish.available}
              className="w-full bg-amber-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-amber-800 transition disabled:opacity-50"
            >
              {selectedDish.available ? `Добавить в корзину (${selectedDish.price * quantity} ₽)` : 'Нет в наличии'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
