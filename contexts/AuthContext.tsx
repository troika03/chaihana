
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
        console.error('Error fetching profile from DB:', error.message);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("Sign in error:", error.message);
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string) => {
    try {
      const { data, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { full_name: fullName } // Сохраняем имя также в метаданные auth
        }
      });

      if (authError) {
        console.error("Supabase Auth Error:", authError.message);
        return { error: authError };
      }

      if (data.user) {
        // Создаем запись в таблице profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            full_name: fullName, 
            phone, 
            address, 
            role: 'user' 
          }]);
        
        if (profileError) {
          console.error("Database Profile Error:", profileError.message);
          // Если ошибка в таблице, возвращаем более понятный текст
          if (profileError.message.includes("relation \"profiles\" does not exist")) {
            return { error: { message: "Ошибка: Таблица 'profiles' не создана в Supabase. Выполните SQL-скрипт из types.ts" } };
          }
          return { error: profileError };
        }
      }
      
      return { error: null };
    } catch (err: any) {
      console.error("System SignUp Error:", err);
      return { error: { message: err.message || "Неизвестная ошибка при регистрации" } };
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
