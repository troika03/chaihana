import { createClient } from '@supabase/supabase-js';

// NOTE: In a real app, these come from import.meta.env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mrdxugjmkeqwbakakvny.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wedvk7i162VwtrAXahtnOw_0Vpo2xeh';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- MOCK DATA FOR DEMONSTRATION (If DB is not connected) ---
import { Dish } from '../types';

export const MOCK_DISHES: Dish[] = [
  {
    id: 1,
    name: "Плов Чайханский",
    category: "main",
    price: 450,
    image: "https://picsum.photos/400/300?random=1",
    description: "Традиционный узбекский плов с бараниной, желтой морковью и нутом.",
    available: true
  },
  {
    id: 2,
    name: "Лагман Уйгурский",
    category: "main",
    price: 380,
    image: "https://picsum.photos/400/300?random=2",
    description: "Тянутая лапша с обжаренной говядиной и овощами в насыщенном соусе.",
    available: true
  },
  {
    id: 3,
    name: "Шашлык из баранины",
    category: "main",
    price: 550,
    image: "https://picsum.photos/400/300?random=3",
    description: "Сочный шашлык из мякоти баранины, маринованный в восточных специях.",
    available: true
  },
  {
    id: 4,
    name: "Шурпа",
    category: "soups",
    price: 350,
    image: "https://picsum.photos/400/300?random=4",
    description: "Наваристый суп из баранины с крупно нарезанными овощами.",
    available: true
  },
  {
    id: 5,
    name: "Ачик-Чучук",
    category: "salads",
    price: 250,
    image: "https://picsum.photos/400/300?random=5",
    description: "Традиционный салат из помидоров, лука и стручкового перца.",
    available: true
  },
  {
    id: 6,
    name: "Пахлава",
    category: "desserts",
    price: 200,
    image: "https://picsum.photos/400/300?random=6",
    description: "Восточная сладость из слоеного теста с орехами и медом.",
    available: true
  },
   {
    id: 7,
    name: "Зеленый чай с лимоном",
    category: "drinks",
    price: 150,
    image: "https://picsum.photos/400/300?random=7",
    description: "Ароматный чай №95.",
    available: true
  }
];
