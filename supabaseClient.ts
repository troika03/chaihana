
import { createClient } from '@supabase/supabase-js';
import { Dish } from './pages/types';

// Данные вашего проекта Supabase
const supabaseUrl = 'https://mrdxugjmkeqwbakakvny.supabase.co';
// Используем новый предоставленный секретный ключ
const supabaseKey = 'sb_secret_bWMferCMNyZxInoGMR-PTg_j66qGdcv'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Данные по умолчанию, если таблица dishes пуста
export const MOCK_DISHES: Dish[] = [
  {
    id: 1,
    name: "Плов Чайханский",
    category: "main",
    price: 450,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
    description: "Традиционный узбекский плов с бараниной, желтой морковью и нутом.",
    available: true
  },
  {
    id: 2,
    name: "Лагман Уйгурский",
    category: "main",
    price: 380,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
    description: "Тянутая лапша с говядиной и овощами в насыщенном соусе.",
    available: true
  },
  {
    id: 3,
    name: "Шашлык из баранины",
    category: "main",
    price: 550,
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500",
    description: "Сочный шашлык из мякоти баранины.",
    available: true
  }
];
