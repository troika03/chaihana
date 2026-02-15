
import { supabase } from './supabaseClient';
import { Dish, Order, UserProfile } from './pages/types';

/** 
 * НАСТРОЙКИ TELEGRAM 
 * Бот: @ChayhanaZhulebinoBot
 * Чат/Группа: -5131291608
 */
const TELEGRAM_CONFIG = {
  token: '7983984002:AAEkEqFjw8EC_xiIuyRbc2K_DHwqXml16k0',
  chatId: '-5131291608' 
};

const INITIAL_DISHES: Dish[] = [
  { id: 1, name: 'Плов Чайханский', category: 'main', price: 450, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', description: 'Классический ферганский плов with нежной бараниной, желтой морковью и специями.', available: true },
  { id: 2, name: 'Лагман Уйгурский', category: 'soups', price: 380, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800', description: 'Традиционный суп with тянутой вручную лапшой, говядиной и овощами.', available: true },
  { id: 3, name: 'Манты with говядиной', category: 'main', price: 420, image: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db76?w=800', description: 'Сочные манты на пару, приготовленные по старинному рецепту.', available: true },
  { id: 4, name: 'Салат Ачу-Чучук', category: 'salads', price: 290, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', description: 'Острый салат из тонко нарезанных томатов, лука и чили.', available: true },
  { id: 5, name: 'Шурпа', category: 'soups', price: 350, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', description: 'Наваристый мясной бульон with крупными кусками мяса и овощей.', available: true },
  { id: 6, name: 'Пахлава Медовая', category: 'desserts', price: 250, image: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800', description: 'Традиционная сладость with грецким орехом и натуральным медом.', available: true },
  { id: 7, name: 'Шашлык из баранины', category: 'main', price: 550, image: 'https://images.unsplash.com/photo-1529692236671-f1f6e994a52c?w=800', description: 'Нежная корейка ягненка, маринованная в восточных специях.', available: true },
  { id: 8, name: 'Зеленый чай with лотосом', category: 'drinks', price: 150, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800', description: 'Освежающий чай в пиалах.', available: true },
];

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
};

const isConfigured = (): boolean => {
  try {
    const url = (supabase as any).supabaseUrl;
    return !!url && !url.includes('YOUR_PROJECT_ID');
  } catch {
    return false;
  }
};

const sendTelegramNotification = async (order: Order) => {
  const { token, chatId } = TELEGRAM_CONFIG;
  if (!token || !chatId) return;

  try {
    const itemsList = order.items
      .map(item => `• <b>${item.dish.name}</b> x${item.quantity}`)
      .join('\n');

    // Создаем ссылку на Яндекс Карты на основе адреса
    const encodedAddress = encodeURIComponent(order.delivery_address || '');
    const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodedAddress}`;

    const message = `
<b>🚚 ЗАКАЗ ПЕРЕДАН КУРЬЕРУ</b>
──────────────────
🆔 <b>Заказ:</b> #${order.id.toString().slice(-4)}
💰 <b>Сумма:</b> ${order.total_amount} ₽
📞 <b>Телефон:</b> <a href="tel:${order.contact_phone}">${order.contact_phone || 'Не указан'}</a>
📍 <b>Адрес:</b> ${order.delivery_address || 'Самовывоз'}
🔗 <a href="${yandexMapsUrl}">📍 Посмотреть на карте (Яндекс)</a>
💬 <b>Коммент:</b> ${order.comment || 'Нет'}
──────────────────
📝 <b>Состав:</b>
${itemsList}
──────────────────
✅ <b>Статус:</b> Принят в работу
    `;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', errorData);
    }
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
};

export const api = {
  storage: {
    uploadDishImage: async (file: File): Promise<string> => {
      if (!isConfigured()) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
      const filePath = `dish_images/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('dishes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('dishes')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } catch (err: any) {
        console.error("Storage upload error:", err);
        throw err;
      }
    }
  },

  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (!isConfigured()) return INITIAL_DISHES;
      try {
        const fetchPromise = (async () => {
          const { data, error } = await supabase.from('dishes').select('*').order('id', { ascending: true });
          if (error) throw error;
          if (!data || data.length === 0) return INITIAL_DISHES;
          return data as Dish[];
        })();
        return await withTimeout(fetchPromise, 5000, INITIAL_DISHES);
      } catch (err) {
        console.error("API Error:", err);
        return INITIAL_DISHES;
      }
    },
    create: async (dish: Partial<Dish>) => {
      const { data, error } = await supabase.from('dishes').insert([dish]).select().single();
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

        const userId = adminData?.user?.id;
        if (!userId) throw new Error("Не удалось создать пользователя.");

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
        if (!authData?.user) throw new Error("Ошибка авторизации");

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
        const userRole = (email === 'himikovhoma@gmail.com' ? 'admin' : 'user') as 'admin' | 'user';

        if (!profile) {
          const newProfile: UserProfile = { id: authData.user.id, full_name: authData.user.user_metadata?.full_name || 'Гость', address: '', role: userRole };
          await supabase.from('profiles').upsert([newProfile]);
          return newProfile;
        }
        return profile as UserProfile;
      })();

      return await withTimeout(signInPromise, 5000, { id: 'error', full_name: 'Ошибка входа', address: '', role: 'user' });
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
    testBot: async () => {
      const { token, chatId } = TELEGRAM_CONFIG;
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '🔔 <b>Тестовое сообщение:</b> Связь с Чайханой Жулебино установлена!',
            parse_mode: 'HTML',
          }),
        });
        return await res.json();
      } catch (err: any) {
        return { ok: false, description: err.message };
      }
    },
    create: async (orderData: Partial<Order>) => {
      if (!isConfigured()) return { ...orderData, id: Date.now() } as Order;
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      return data as Order;
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
      const { data: updatedOrder, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
      if (error) throw error;

      // Уведомление в Telegram курьеру отправляется ТОЛЬКО когда статус меняется на "Принят" (confirmed)
      if (status === 'confirmed' && updatedOrder) {
        await sendTelegramNotification(updatedOrder as Order);
      }
    }
  }
};
