
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../pages/types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, address: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Auth init error", e);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (!error && data) {
        setUser(data as UserProfile);
      } else if (error) {
        console.error('Profile fetch error:', error.message);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string) => {
    try {
      // 1. Пытаемся создать пользователя в Auth
      const { data, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          data: { 
            full_name: fullName,
            phone: phone
          } 
        }
      });

      if (authError) {
        console.error("SignUp Auth Error (500 likely):", authError);
        // Если ошибка 500, значит в БД что-то не так с триггерами или таблицами
        return { 
          error: { 
            message: "Ошибка сервера (500). Скорее всего, в Supabase не создана таблица 'profiles'. Зайдите в Админ-панель и выполните SQL-скрипт." 
          } 
        };
      }

      if (data.user) {
        // 2. Создаем/обновляем профиль вручную (на случай если триггер не настроен)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: data.user.id, 
            full_name: fullName, 
            phone: phone, 
            address: address, 
            role: 'user' 
          });
        
        if (profileError) {
          console.error("Profile DB Error:", profileError);
          // Если пользователь создался, но профиль нет - это не критично для Auth, но плохо для приложения
        }
      }
      
      return { error: null };
    } catch (err: any) {
      console.error("Auth exception:", err);
      return { error: { message: err.message || "Ошибка системы" } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
