
import { supabase } from './supabaseClient';
import { Dish, Order, UserProfile } from './pages/types';

const STATUS_MAP: Record<string, { label: string; emoji: string }> = {
  pending: { label: 'НОВЫЙ', emoji: '🔔' },
  confirmed: { label: 'ПРИНЯТ', emoji: '👍' },
  cooking: { label: 'ГОТОВИТСЯ', emoji: '👨‍🍳' },
  delivering: { label: 'В ПУТИ', emoji: '🚚' },
  delivered: { label: 'ДОСТАВЛЕН', emoji: '✅' },
  cancelled: { label: 'ОТМЕНЕН', emoji: '❌' },
};

export const INITIAL_DISHES: Partial<Dish>[] = [
  { name: 'Плов Чайханский', category: 'main', price: 450, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', description: 'Классический ферганский плов с нежной бараниной.', ingredients: 'Рис лазер, баранина, желтая морковь, нут, специи', available: true },
  { name: 'Лагман Уйгурский', category: 'soups', price: 380, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800', description: 'Традиционный суп с тянутой вручную лапшой.', ingredients: 'Лапша ручная, говядина, болгарский перец, редька, сельдерей', available: true },
  { name: 'Манты с говядиной', category: 'main', price: 420, image: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db76?w=800', description: 'Сочные манты на пару.', ingredients: 'Тесто, рубленая говядина, лук, специи', available: true },
  { name: 'Самса тандырная', category: 'bakery', price: 75, image: 'https://images.unsplash.com/photo-1601303584126-269c824d4e5e?w=800', description: 'Хрустящая выпечка из тандыра.', ingredients: 'Тесто слоеное, говядина, курдюк, лук', available: true },
  { name: 'Салат Ачи-Чучук', category: 'salads', price: 250, image: 'https://images.unsplash.com/photo-1546793665-c74683c3f38d?w=800', description: 'Тонко нарезанные помидоры с луком и острым перцем.', ingredients: 'Помидоры, красный лук, острый перец, базилик', available: true },
  { name: 'Чай с чабрецом', category: 'drinks', price: 300, image: 'https://images.unsplash.com/photo-1576091160550-2173bdd9962a?w=800', description: 'Ароматный черный чай в чайнике.', ingredients: 'Черный чай, чабрец свежий', available: true },
  
  // Напитки из фотографий холодильника
  { name: 'Натахтари Дюшес', category: 'drinks', price: 180, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800', description: 'Грузинский лимонад со вкусом спелой груши.', ingredients: 'Вода горная, сахар, сироп Дюшес, стекло 0.5л', available: true },
  { name: 'Натахтари Тархун', category: 'drinks', price: 180, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800', description: 'Классический лимонад с экстрактом эстрагона.', ingredients: 'Вода горная, сахар, экстракт тархуна, стекло 0.5л', available: true },
  { name: 'Натахтари Саперави', category: 'drinks', price: 180, image: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?w=800', description: 'Насыщенный лимонад со вкусом красного винограда.', ingredients: 'Вода горная, сахар, экстракт винограда Саперави, стекло 0.5л', available: true },
  { name: 'Flavis Гранат (0.5л)', category: 'drinks', price: 160, image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800', description: 'Освежающий гранатовый напиток в большом объеме.', ingredients: 'Гранатовый сок восстановленный, вода, сахар, 0.5л', available: true },
  { name: 'Flavis Гранат (0.25л)', category: 'drinks', price: 95, image: 'https://images.unsplash.com/photo-1621506289937-4c40aa2cc95c?w=800', description: 'Порционный гранатовый напиток.', ingredients: 'Гранатовый сок, вода, сахар, 0.25л', available: true },
  { name: 'RC Cola', category: 'drinks', price: 130, image: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?w=800', description: 'Оригинальная американская кола.', ingredients: 'Очищенная вода, сахар, натуральный краситель карамель, кофеин', available: true },
  { name: 'RC Refresher Апельсин', category: 'drinks', price: 130, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800', description: 'Газированный напиток с ярким вкусом апельсина.', ingredients: 'Вода, сахар, апельсиновый сок, лимонная кислота', available: true },
  { name: 'RC Refresher Яблоко', category: 'drinks', price: 130, image: 'https://images.unsplash.com/photo-1594950195709-a14f66c242d7?w=800', description: 'Легкий напиток со вкусом зеленого яблока.', ingredients: 'Вода, сахар, яблочный сок, ароматизатор яблоко', available: true },
  { name: 'RC Refresher Лимон-Лайм', category: 'drinks', price: 130, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800', description: 'Цитрусовый микс лимона и лайма.', ingredients: 'Вода, сахар, натуральные экстракты лимона и лайма', available: true },
  { name: 'Adrenaline Rush', category: 'drinks', price: 230, image: 'https://images.unsplash.com/photo-1622543925917-763c34d1538c?w=800', description: 'Энергетический напиток для активной жизни.', ingredients: 'L-карнитин, таурин, кофеин, витамины группы B, 0.449л', available: true },
];

export const api = {
  storage: {
    uploadDishImage: async (file: File): Promise<string> => {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('dishes').upload(`dish_images/${fileName}`, file);
        if (error) throw error;
        const { data } = supabase.storage.from('dishes').getPublicUrl(`dish_images/${fileName}`);
        return data.publicUrl;
      } catch (e) {
        console.error("Storage upload failed:", e);
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
      }
    }
  },
  dishes: {
    getAll: async (): Promise<Dish[]> => {
      try {
        const { data, error } = await supabase.from('dishes').select('*').order('id', { ascending: true });
        if (error) throw error;
        return data && data.length > 0 ? data : (INITIAL_DISHES as Dish[]);
      } catch (err) {
        console.error("API Error getAll dishes, falling back to INITIAL:", err);
        return INITIAL_DISHES as Dish[];
      }
    },
    create: async (dish: Partial<Dish>) => {
      const { data, error } = await supabase.from('dishes').insert([dish]).select().single();
      if (error) throw error;
      return data;
    },
    seed: async () => {
      const { data, error } = await supabase.from('dishes').insert(INITIAL_DISHES).select();
      if (error) throw error;
      return data;
    },
    update: async (id: number, dish: Partial<Dish>) => {
      const { data, error } = await supabase.from('dishes').update(dish).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: number) => {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
    }
  },
  auth: {
    signUp: async (email: string, pass: string, name: string, address: string = ''): Promise<UserProfile> => {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password: pass, 
        options: { data: { full_name: name } } 
      });
      if (error) throw error;
      
      const userId = data.user!.id;
      const profile: UserProfile = { 
        id: userId, 
        full_name: name, 
        address, 
        role: email.toLowerCase() === 'himikovhoma@gmail.com' ? 'admin' : 'user' 
      };
      
      const { error: profileError } = await supabase.from('profiles').upsert([profile]);
      if (profileError) console.warn("Profile upsert failed during signup:", profileError);
      
      return profile;
    },
    signIn: async (email: string, pass: string): Promise<UserProfile> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (fetchError || !profile) {
        const newProfile: UserProfile = {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || 'Гость',
          address: '',
          role: email.toLowerCase() === 'himikovhoma@gmail.com' ? 'admin' : 'user'
        };
        await supabase.from('profiles').upsert([newProfile]);
        return newProfile;
      }

      return profile as UserProfile;
    },
    signOut: async () => { 
      try { await supabase.auth.signOut(); } finally { localStorage.removeItem('zhulebino_cart'); }
    },
    getSession: async (): Promise<UserProfile | null> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (error || !data) {
           const newProfile: UserProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'Гость',
            address: '',
            role: session.user.email?.toLowerCase() === 'himikovhoma@gmail.com' ? 'admin' : 'user'
          };
          await supabase.from('profiles').upsert([newProfile]);
          return newProfile;
        }
        return data as UserProfile;
      } catch (e) {
        console.error("Session fetch failed:", e);
        return null;
      }
    }
  },
  orders: {
    create: async (orderData: Partial<Order>) => {
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      return data as Order;
    },
    getAll: async () => { 
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); 
      return data || []; 
    },
    getByUser: async (uId: string) => { 
      const { data } = await supabase.from('orders').select('*').eq('user_id', uId).order('created_at', { ascending: false }); 
      return data || []; 
    },
    updateStatus: async (id: number, status: Order['status']) => {
      const { data: updatedOrder, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return updatedOrder as Order;
    }
  }
};
