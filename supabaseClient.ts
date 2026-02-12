
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
    fetch: (url, options) => {
      const controller = new AbortController();
      // Увеличиваем до 30 секунд, так как спящий проект Supabase просыпается до 25 секунд
      const timeoutId = setTimeout(() => controller.abort(), 30000); 
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});
