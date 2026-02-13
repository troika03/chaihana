
import { supabase } from './supabaseClient';
import { Dish, Order, UserProfile } from './pages/types';

const INITIAL_DISHES: Dish[] = [
  { id: 1, name: 'Плов Чайханский', category: 'main', price: 450, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', description: 'Классический ферганский плов с нежной бараниной, желтой морковью и специями.', available: true },
  { id: 2, name: 'Лагман Уйгурский', category: 'soups', price: 380, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800', description: 'Традиционный суп с тянутой вручную лапшой, говядиной и овощами.', available: true },
  { id: 3, name: 'Манты с говядиной', category: 'main', price: 420, image: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db76?w=800', description: 'Сочные манты на пару, приготовленные по старинному рецепту.', available: true },
  { id: 4, name: 'Салат Ачу-Чучук', category: 'salads', price: 290, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', description: 'Острый салат из тонко нарезанных томатов, лука и чили.', available: true },
  { id: 5, name: 'Шурпа', category: 'soups', price: 350, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', description: 'Наваристый мясной бульон с крупными кусками мяса и овощей.', available: true },
  { id: 6, name: 'Пахлава Медовая', category: 'desserts', price: 250, image: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800', description: 'Традиционная сладость с грецким орехом и натуральным медом.', available: true },
  { id: 7, name: 'Шашлык из баранины', category: 'main', price: 550, image: 'https://images.unsplash.com/photo-1529692236671-f1f6e994a52c?w=800', description: 'Нежная корейка ягненка, маринованная в восточных специях.', available: true },
  { id: 8, name: 'Зеленый чай с лотосом', category: 'drinks', price: 150, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800', description: 'Освежающий чай в пиалах.', available: true },
];

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
};

const isConfigured = () => {
  try {
    const url = (supabase as any).supabaseUrl;
    return url && !url.includes('YOUR_PROJECT_ID');
  } catch {
    return false;
  }
};

export const api = {
  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (!isConfigured()) return INITIAL_DISHES;
      try {
        const fetchPromise = (async () => {
          const { data, error } = await supabase.from('dishes').select('*').order('id', { ascending: true });
          if (error || !data || data.length === 0) return INITIAL_DISHES;
          return data as Dish[];
        })();
        return await withTimeout(fetchPromise, 3000, INITIAL_DISHES);
      } catch {
        return INITIAL_DISHES;
      }
    }
  },

  auth: {
    signUp: async (email: string, pass: string, name: string, address: string = ''): Promise<UserProfile> => {
      if (!isConfigured()) return { id: 'mock-1', full_name: name, address, role: 'user' };
      
      const signUpPromise = (async () => {
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
          email,
          password: pass,
          email_confirm: true,
          user_metadata: { full_name: name }
        });

        if (adminError) {
          if (adminError.message.includes('already registered')) return api.auth.signIn(email, pass);
          throw adminError;
        }

        const userId = adminData.user.id;
        const userRole = (email === 'himikovhoma@gmail.com' ? 'admin' : 'user') as 'admin' | 'user';
        const profile: UserProfile = { id: userId, full_name: name, address: address || '', role: userRole };

        await supabase.from('profiles').upsert([profile]);
        await supabase.auth.signInWithPassword({ email, password: pass });
        return profile;
      })();

      return await withTimeout(signUpPromise, 5000, { id: 'error', full_name: 'Ошибка регистрации', address: '', role: 'user' });
    },

    signIn: async (email: string, pass: string): Promise<UserProfile> => {
      if (!isConfigured()) return { id: 'mock-1', full_name: 'Тестовый Пользователь', address: '', role: email === 'himikovhoma@gmail.com' ? 'admin' : 'user' };
      
      const signInPromise = (async () => {
        let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pass });
        
        if (authError && authError.message.toLowerCase().includes('email not confirmed')) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const userToConfirm = users?.users.find(u => u.email === email);
          if (userToConfirm) {
            await supabase.auth.admin.updateUserById(userToConfirm.id, { email_confirm: true });
            const retry = await supabase.auth.signInWithPassword({ email, password: pass });
            authData = retry.data;
            authError = retry.error;
          }
        }

        if (authError) throw authError;
        if (!authData.user) throw new Error("Ошибка авторизации");

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
        const userRole = (email === 'himikovhoma@gmail.com' ? 'admin' : 'user') as 'admin' | 'user';

        if (!profile) {
          const newProfile: UserProfile = { id: authData.user.id, full_name: authData.user.user_metadata?.full_name || 'Гость', address: '', role: userRole };
          await supabase.from('profiles').upsert([newProfile]);
          return newProfile;
        }
        return profile as UserProfile;
      })();

      return await withTimeout(signInPromise, 5000, { id: 'error', full_name: 'Таймаут входа', address: '', role: 'user' });
    },

    signOut: async () => {
      if (isConfigured()) await supabase.auth.signOut();
      localStorage.removeItem('zhulebino_cart');
    },

    getSession: async (): Promise<UserProfile | null> => {
      if (!isConfigured()) return null;
      try {
        const sessionPromise = (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return null;

          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          const userRole = (session.user.email === 'himikovhoma@gmail.com' ? 'admin' : 'user') as 'admin' | 'user';

          if (!profile) return { id: session.user.id, full_name: session.user.user_metadata?.full_name || 'Гость', address: '', role: userRole } as UserProfile;
          return profile as UserProfile;
        })();

        return await withTimeout(sessionPromise, 4000, null);
      } catch {
        return null;
      }
    }
  },

  orders: {
    create: async (orderData: Partial<Order>) => {
      if (!isConfigured()) return { ...orderData, id: Date.now() };
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      return data;
    },
    getByUser: async (userId: string) => {
      const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data || [];
    },
    getAll: async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    updateStatus: async (id: number, status: Order['status']) => {
      await supabase.from('orders').update({ status }).eq('id', id);
    }
  }
};
