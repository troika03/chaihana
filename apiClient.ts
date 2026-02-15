
import { supabase } from './supabaseClient';
import { Dish, Order, UserProfile } from './pages/types';

/** 
 * НАСТРОЙКИ TELEGRAM 
 * Бот: @ChayhanaZhulebinoBot
 */
const TELEGRAM_CONFIG = {
  token: '7983984002:AAEkEqFjw8EC_xiIuyRbc2K_DHwqXml16k0',
  chatId: '-5131291608' 
};

const INITIAL_DISHES: Dish[] = [
  { id: 1, name: 'Плов Чайханский', category: 'main', price: 450, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', description: 'Классический ферганский плов с нежной бараниной.', ingredients: 'Рис лазер, баранина, желтая морковь, нут, специи', available: true },
  { id: 2, name: 'Лагман Уйгурский', category: 'soups', price: 380, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800', description: 'Традиционный суп с тянутой вручную лапшой.', ingredients: 'Лапша ручная, говядина, болгарский перец, редька, сельдерей', available: true },
  { id: 3, name: 'Манты с говядиной', category: 'main', price: 420, image: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db76?w=800', description: 'Сочные манты на пару.', ingredients: 'Тесто, рубленая говядина, лук, специи', available: true },
  { id: 4, name: 'Самса тандырная', category: 'bakery', price: 75, image: 'https://images.unsplash.com/photo-1601303584126-269c824d4e5e?w=800', description: 'Хрустящая выпечка из тандыра.', ingredients: 'Тесто слоеное, говядина, курдюк, лук', available: true },
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
    const itemsList = order.items.map(item => `• <b>${item.dish.name}</b> x${item.quantity}`).join('\n');
    const encodedAddress = encodeURIComponent(order.delivery_address || '');
    const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodedAddress}`;

    const message = `<b>🚚 ЗАКАЗ ПЕРЕДАН КУРЬЕРУ</b>\n──────────────────\n🆔 <b>Заказ:</b> #${order.id.toString().slice(-4)}\n💰 <b>Сумма:</b> ${order.total_amount} ₽\n📞 <b>Телефон:</b> <a href="tel:${order.contact_phone}">${order.contact_phone || 'Не указан'}</a>\n📍 <b>Адрес:</b> ${order.delivery_address}\n🔗 <a href="${yandexMapsUrl}">📍 Карта (Яндекс)</a>\n💬 <b>Коммент:</b> ${order.comment || 'Нет'}\n──────────────────\n📝 <b>Состав:</b>\n${itemsList}\n──────────────────\n✅ <b>Статус:</b> Принят в работу`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch (err) { console.error('Telegram Error:', err); }
};

export const api = {
  storage: {
    uploadDishImage: async (file: File): Promise<string> => {
      if (!isConfigured()) return new Promise(res => { const reader = new FileReader(); reader.onloadend = () => res(reader.result as string); reader.readAsDataURL(file); });
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${file.name.split('.').pop()}`;
      try {
        const { error } = await supabase.storage.from('dishes').upload(`dish_images/${fileName}`, file);
        if (error) throw error;
        const { data } = supabase.storage.from('dishes').getPublicUrl(`dish_images/${fileName}`);
        return data.publicUrl;
      } catch (err) { throw err; }
    }
  },
  dishes: {
    getAll: async (): Promise<Dish[]> => {
      if (!isConfigured()) return INITIAL_DISHES;
      try {
        const fetchPromise = (async () => {
          const { data, error } = await supabase.from('dishes').select('*').order('id', { ascending: true });
          if (error) throw error;
          return data.length > 0 ? data : INITIAL_DISHES;
        })();
        return await withTimeout(fetchPromise, 5000, INITIAL_DISHES);
      } catch { return INITIAL_DISHES; }
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
      if (!isConfigured()) return { id: 'mock', full_name: name, address, role: 'user' };
      const { data, error } = await supabase.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: { full_name: name } });
      if (error) throw error;
      const profile: UserProfile = { id: data.user.id, full_name: name, address, role: email === 'himikovhoma@gmail.com' ? 'admin' : 'user' };
      await supabase.from('profiles').upsert([profile]);
      return profile;
    },
    signIn: async (email: string, pass: string): Promise<UserProfile> => {
      if (!isConfigured()) return { id: 'mock', full_name: 'Гость', address: '', role: email === 'himikovhoma@gmail.com' ? 'admin' : 'user' };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      return profile as UserProfile;
    },
    signOut: async () => { if (isConfigured()) await supabase.auth.signOut(); localStorage.removeItem('zhulebino_cart'); },
    getSession: async (): Promise<UserProfile | null> => {
      if (!isConfigured()) return null;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      return data as UserProfile;
    }
  },
  orders: {
    testBot: async () => {
      const { token, chatId } = TELEGRAM_CONFIG;
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '🔔 <b>Тест:</b> Связь с Чайханой установлена!', parse_mode: 'HTML' }),
      });
      return await res.json();
    },
    create: async (orderData: Partial<Order>) => {
      if (!isConfigured()) return { ...orderData, id: Date.now() } as Order;
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      return data as Order;
    },
    getAll: async () => { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); return data || []; },
    getByUser: async (uId: string) => { const { data } = await supabase.from('orders').select('*').eq('user_id', uId).order('created_at', { ascending: false }); return data || []; },
    updateStatus: async (id: number, status: Order['status']) => {
      const { data: updatedOrder, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      if (status === 'confirmed') await sendTelegramNotification(updatedOrder as Order);
      return updatedOrder;
    }
  }
};
