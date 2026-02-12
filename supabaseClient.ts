
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxxamuyljbchxbjavjiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eGFtdXlsamJjaHhiamF2aml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4Njc0MjksImV4cCI6MjA4NjQ0MzQyOX0.O2wim-OgWZSm1dikf0JL-RwpEUl6_W4Ff-Q8nZYCJy8'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'zhulebino-chaikhana' },
    // Включаем таймаут для всех запросов
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Стандартный таймаут fetch не поддерживает, но мы контролируем это в компонентах через AbortController
      });
    }
  }
});
