
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnrvpbfdofktkmcirwqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducnZwYmZkb2ZrdGttY2lyd3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDk2MjYsImV4cCI6MjA4NjUyNTYyNn0.jKWiY2xVPZDx83LKT6FHelwiix2BVF3K5VN4Ef1kUaM'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'zhulebino-chaikhana' }
  }
});
