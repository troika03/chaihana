
import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, AlertTriangle, Loader2, Database } from 'lucide-react';
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
      console.error("Supabase Connection Error:", e);
      let message = "Не удалось загрузить меню.";
      
      if (e.message?.includes('relation "dishes" does not exist')) {
        message = "Таблица 'dishes' не найдена. Пожалуйста, выполните SQL-скрипт в панели Supabase SQL Editor.";
      } else if (e.code === 'PGRST301') {
        message = "Проект Supabase приостановлен (Paused). Зайдите в Dashboard и нажмите 'Restore'.";
      } else if (e.name === 'AbortError') {
        message = "Сервер не ответил вовремя. Возможно, база данных просыпается после долгого перерыва.";
      }
      
      setError(message);
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

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="text-center py-6">
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 mb-3 font-serif italic tracking-tighter">Чайхана Жулебино</h1>
        <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full mb-4 shadow-sm"></div>
        <p className="text-amber-800/60 font-black uppercase tracking-[0.3em] text-[10px]">Вкус Востока в каждом кусочке</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 bg-[#f9f3e9]/90 backdrop-blur-xl p-4 z-30 rounded-[2rem] shadow-xl shadow-amber-900/5 border border-white/50">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all duration-300 ${
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
            className="w-full pl-12 pr-6 py-3.5 rounded-2xl border-none focus:ring-2 focus:ring-amber-900 outline-none bg-white shadow-inner text-sm font-bold placeholder:text-amber-900/20"
          />
          <Search className="absolute left-4 top-3.5 text-amber-900/20" size={20} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <Loader2 className="animate-spin text-amber-900" size={48} />
          <p className="text-amber-900 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">Соединение с Чайханой...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-red-100 max-w-lg mx-auto p-8">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Требуется настройка базы</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={fetchDishes}
              className="bg-amber-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-800 transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={14} /> Обновить данные
            </button>
            <a 
              href="https://supabase.com/dashboard/project/lxxamuyljbchxbjavjiv/sql/new" 
              target="_blank" 
              rel="noreferrer"
              className="text-amber-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 justify-center hover:text-orange-600"
            >
              <Database size={14} /> Открыть SQL Editor
            </a>
          </div>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="text-center py-40">
          <p className="text-2xl font-black text-amber-950/20 uppercase">Меню пока пусто</p>
          <p className="text-sm text-gray-400 mt-2">Добавьте блюда через панель администратора.</p>
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
                <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-4 h-8">{dish.description}</p>
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
            <div className="relative h-80 rounded-[2.5rem] overflow-hidden">
              <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-full object-cover" />
            </div>
            <div className="px-2">
              <p className="text-gray-500 text-lg leading-relaxed mb-8">{selectedDish.description}</p>
              <button 
                onClick={handleAddToCart}
                disabled={!selectedDish.available}
                className="w-full bg-amber-950 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-amber-800 transition shadow-xl"
              >
                {selectedDish.available ? `Добавить за ${selectedDish.price * quantity} ₽` : 'Нет в наличии'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
