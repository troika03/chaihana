
import { supabase } from './supabaseClient';
import { Dish, Order, UserProfile } from './pages/types';

/** 
 * НАСТРОЙКИ TELEGRAM 
 */
const TELEGRAM_CONFIG = {
  token: '7983984002:AAEkEqFjw8EC_xiIuyRbc2K_DHwqXml16k0',
  chatId: '1846484566' 
};

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
];

const sendTelegramNotification = async (order: Order, type: 'NEW' | 'STATUS' = 'NEW', oldMessageId?: number | null): Promise<number | null> => {
  const { token, chatId } = TELEGRAM_CONFIG;
  if (!token || !chatId) return null;

  try {
    const messageToDelete = oldMessageId || order.telegram_message_id;
    if (messageToDelete) {
      await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageToDelete }),
      }).catch(() => {});
    }

    const itemsList = order.items.map(item => `• <b>${item.dish.name}</b> x${item.quantity}`).join('\n');
    const { label, emoji } = STATUS_MAP[order.status] || { label: order.status.toUpperCase(), emoji: 'ℹ️' };
    
    const title = type === 'NEW' ? '🔔 НОВЫЙ ЗАКАЗ' : `${emoji} ИЗМЕНЕНИЕ СТАТУСА`;
    
    const messageText = `<b>${title} #${order.id.toString().slice(-4)}</b>\n` +
      `──────────────────\n` +
      `✅ <b>Статус:</b> ${label} ${emoji}\n` +
      `💰 <b>Сумма:</b> ${order.total_amount} ₽\n` +
      `📍 <b>Адрес:</b> ${order.delivery_address}\n` +
      `📞 <b>Телефон:</b> <code>${order.contact_phone || 'Не указан'}</code>\n` +
      (order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : '') +
      `──────────────────\n` +
      `📝 <b>Состав:</b>\n${itemsList}\n` +
      `──────────────────\n` +
      `🕒 <i>${new Date().toLocaleString('ru-RU')}</i>`;

    const adminUrl = `${window.location.origin}/#/admin`;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: messageText, 
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: "📦 Управление в админ-панели", url: adminUrl }]]
        }
      }),
    });

    const result = await response.json();
    return result.ok ? result.result.message_id : null;
  } catch (err) { 
    console.error('Telegram API Error:', err); 
    return null;
  }
};

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

      // Получаем профиль. Если его нет, создаем на лету
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (fetchError || !profile) {
        console.warn("Profile missing for user, creating default...");
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
           // Если сессия есть, а профиля нет - создаем
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
      
      const order = data as Order;
      const msgId = await sendTelegramNotification(order, 'NEW');
      
      if (msgId) {
        await supabase.from('orders').update({ telegram_message_id: msgId }).eq('id', order.id);
      }
      
      return order;
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
      const { data: oldOrder } = await supabase.from('orders').select('*').eq('id', id).single();
      const { data: updatedOrder, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
      if (error) throw error;

      const msgId = await sendTelegramNotification(updatedOrder as Order, 'STATUS', oldOrder?.telegram_message_id);
      if (msgId) {
        await supabase.from('orders').update({ telegram_message_id: msgId }).eq('id', id);
      }
      
      return updatedOrder as Order;
    }
  }
};
