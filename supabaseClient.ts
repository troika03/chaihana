
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxxamuyljbchxbjavjiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eGFtdXlsamJjaHhiamF2aml2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg2NzQyOSwiZXhwIjoyMDg2NDQzNDI5fQ.Jwm24G53C9X4hmy1Hj71-js8XkUjiJxqBQFqS_ozuCY'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
