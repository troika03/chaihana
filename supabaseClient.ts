
import { createClient } from '@supabase/supabase-js';

// URL вашего проекта из строки подключения: lxxamuyljbchxbjavjiv
const supabaseUrl = 'https://lxxamuyljbchxbjavjiv.supabase.co';
// Ваш публичный анон-ключ
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eGFtdXlsamJjaHhiamF2aml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Njc0MjksImV4cCI6MjA4NjQ0MzQyOX0.O2wim-OgWZSm1dikf0JL-RwpEUl6_W4Ff-Q8nZYCJy8'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    // Настройка fetch с таймаутом, чтобы предотвратить бесконечные ожидания
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 секунд
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});
