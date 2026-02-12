
import { createClient } from '@supabase/supabase-js';

// ПРЕДУПРЕЖДЕНИЕ: Проверьте в Supabase Dashboard, что проект не на ПАУЗЕ (Paused).
const supabaseUrl = 'https://lxxamuyljbchxbjavjiv.supabase.co';
// Используем ваш новый публичный анон-ключ
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eGFtdXlsamJjaHhiamF2aml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Njc0MjksImV4cCI6MjA4NjQ0MzQyOX0.O2wim-OgWZSm1dikf0JL-RwpEUl6_W4Ff-Q8nZYCJy8'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    // Устанавливаем жесткий таймаут на все запросы к API (12 секунд), 
    // чтобы предотвратить бесконечное ожидание на плохом соединении или "спящем" проекте.
    fetch: (...args) => {
      const [url, config] = args;
      return fetch(url, {
        ...config,
        signal: AbortSignal.timeout(12000) 
      });
    }
  }
});
