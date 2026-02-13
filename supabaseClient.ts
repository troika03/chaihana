
import { createClient } from '@supabase/supabase-js';

// Подключение к предоставленной пользователем базе данных
const supabaseUrl = 'https://cnfhqdovshjnflfycfti.supabase.co';
// Используем Service Role Key для обхода RLS и обеспечения стабильной работы при отладке
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZmhxZG92c2hqbmZsZnljZnRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4MDY2MiwiZXhwIjoyMDg2NTU2NjYyfQ.ZfeMqi4bcD8OGFbuiBZVGAbkGbVy2GiqXjJRx2tAYKc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
