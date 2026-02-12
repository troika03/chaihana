
import { createClient } from '@supabase/supabase-js';

// ПРЕДУПРЕЖДЕНИЕ: Использование service_role ключа в браузере небезопасно и может блокироваться хостингом.
// Рекомендуется заменить этот ключ на anon (public) key из настроек API в Supabase Dashboard.
const supabaseUrl = 'https://lxxamuyljbchxbjavjiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eGFtdXlsamJjaHhiamF2aml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg2NzQyOSwiZXhwIjoyMDg2NDQzNDI5fQ.Jwm24G53C9X4hmy1Hj71-js8XkUjiJxqBQFqS_ozuCY'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'zhulebino-chaihana-web' }
  },
  db: {
    schema: 'public'
  }
});
