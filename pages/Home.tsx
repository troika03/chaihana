
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, UtensilsCrossed, RefreshCw, Coffee, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient.ts';
import { Dish } from './types.ts';
import { useCart } from '../contexts/CartContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
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
  const { user } = useAuth();

  const fetchDishes = useCallback(async () => {
    // Если мы уже загрузили блюда и нет ошибки, не грузим заново
    if (dishes.length > 0 && !error) return;

    setIsLoading(true);
    setError(null);
    
    // Создаем контроллер для отмены запроса по таймауту (15 сек)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const { data, error: dbError } = await supabase
        .from('dishes')
        .select('*')
        .order('name', { ascending: true });

      if (dbError) throw dbError;
      setDishes(data || []);
    } catch (e: any) {
      console.error("Fetch error:", e);
      if (e.name === 'AbortError') {
        setError("Сервер отвечает слишком долго. Возможно, база данных просыпается. Пожалуйста, обновите страницу через минуту.");
      } else {
        setError("Не удалось загрузить меню. Проверьте соединение с интернетом или обновите страницу.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [dishes.length, error]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  // Если пользователь вошел в систему, а меню было с ошибкой — пробуем еще раз
  useEffect(() => {
    if (user && error) {
      fetchDishes();
    }
  }, [user, error, fetchDishes]);

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
      <div className="flex flex-col items-center justify-center py-40 gap-6 animate-pulse">
        <div className="relative">
          <Loader2 className="animate-spin text-amber-900" size={64} />
          <Coffee className="absolute inset-0 m-auto text-amber-900/30" size={24} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-amber-950 font-black uppercase tracking-[0.3em] text-[10px]">Затапливаем тандыр...</p>
          <p className="text-amber-900/20 text-[8px] font-bold uppercase tracking-widest">Первая загрузка может занять до 30 сек.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="text-center py-6">
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 mb-3 font-serif italic tracking-tighter">Чайхана Жулебино</h1>
        <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full mb-4 shadow-sm"></div>
        <p className="text-amber-800/60 font-black uppercase tracking-[0.3em] text-[10px]">Вкус Востока в каждом кусочке</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 bg-[#f9f3e9]/90 backdrop-blur-xl p-4 z-30 rounded-[2rem] border border-white/50 shadow-xl shadow-amber-900/5">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-amber-900 text-white shadow-lg shadow-amber-900/30 scale-105'
                  : 'bg-white text-amber-900/40 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 group">
          <input
            type="text"
            placeholder="Поиск по меню..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 rounded-2xl border-none bg-white shadow-inner text-sm font-bold placeholder:text-amber-900/20 outline-none focus:ring-2 focus:ring-amber-900/10 transition"
          />
          <Search className="absolute left-4 top-3.5 text-amber-900/20" size={20} />
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-red-100 p-8 max-w-md mx-auto shadow-sm">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
          <p className="text-red-500 font-bold mb-6 text-sm leading-relaxed">{error}</p>
          <button onClick={() => fetchDishes()} className="flex items-center gap-2 mx-auto bg-amber-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-800 transition">
            <RefreshCw size={16} /> Попробовать снова
          </button>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="text-center py-40">
          <UtensilsCrossed size={64} className="mx-auto text-amber-900/5 mb-6" />
          <p className="text-2xl font-black text-amber-950/20 uppercase tracking-[0.2em]">Ничего не нашли</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredDishes.map(dish => (
            <div 
              key={dish.id}
              onClick={() => handleOpenDish(dish)}
              className={`bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer group border border-amber-50/50 ${!dish.available ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="h-64 overflow-hidden relative">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl font-black text-amber-900 shadow-xl">
                  {dish.price} ₽
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-black text-xl text-amber-950 mb-2 leading-tight group-hover:text-orange-600 transition-colors">{dish.name}</h3>
                <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-6 h-8">{dish.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/30 bg-amber-50 px-3 py-1 rounded-lg">{dish.category}</span>
                  <div className="w-10 h-10 bg-amber-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <Plus size={20} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title={selectedDish?.name}>
        {selectedDish && (
          <div className="space-y-8">
            <div className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
              {!selectedDish.available && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white font-black uppercase tracking-[0.2em] text-sm">Нет в наличии</span>
                </div>
              )}
            </div>
            <div className="px-2">
              <p className="text-gray-500 text-lg leading-relaxed mb-10">{selectedDish.description}</p>
              <div className="flex items-center justify-between gap-6 pt-2">
                <div className="flex items-center bg-amber-50 rounded-2xl p-2 shadow-inner">
                   <button onClick={(e) => { e.stopPropagation(); setQuantity(q => Math.max(1, q-1)) }} className="w-12 h-12 flex items-center justify-center font-bold text-xl text-amber-900 hover:bg-white rounded-xl transition">-</button>
                   <span className="w-12 text-center font-black text-amber-950 text-xl">{quantity}</span>
                   <button onClick={(e) => { e.stopPropagation(); setQuantity(q => q+1) }} className="w-12 h-12 flex items-center justify-center font-bold text-xl text-amber-900 hover:bg-white rounded-xl transition">+</button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={!selectedDish.available}
                  className="flex-1 bg-amber-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-800 transition shadow-xl shadow-amber-950/20 disabled:opacity-50 disabled:shadow-none"
                >
                  {selectedDish.available ? `Добавить: ${selectedDish.price * quantity} ₽` : 'Недоступно'}
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
