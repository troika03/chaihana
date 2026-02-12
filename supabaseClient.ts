
import { createClient } from '@supabase/supabase-js';
import { Dish } from './pages/types';

// Данные вашего нового проекта Supabase
const supabaseUrl = 'https://lxxamuyljbchxbjavjiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eGFtdXlsamJjaHhiamF2aml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg2NzQyOSwiZXhwIjoyMDg2NDQzNDI5fQ.Jwm24G53C9X4hmy1Hj71-js8XkUjiJxqBQFqS_ozuCY'; 

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
