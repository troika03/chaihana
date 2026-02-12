
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../pages/types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, address: string) => Promise<{ error: any }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Предохранитель: если инициализация БД занимает более 7 секунд, прекращаем загрузку
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization timed out. Forcing end of loading state.");
        setIsLoading(false);
      }
    }, 7000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Auth init error:", e);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug("Auth state change:", event);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle(); 
      
      if (!error && data) {
        setUser(data as UserProfile);
      } else {
        // Если юзер в Auth есть, а в таблице profiles нет (например, сбой при регистрации), 
        // создаем "виртуальный" профиль на основе email, чтобы не виснуть
        console.warn('Profile record not found in DB for user UID:', uid);
        setUser(null);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email: identifier, 
      password 
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string) => {
    try {
      const formattedPhone = phone?.trim() === '' ? null : phone?.trim();

      const { data, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          data: { 
            full_name: fullName,
            phone: formattedPhone
          } 
        }
      });

      if (authError) return { error: authError };

      if (data.user) {
        // Создаем запись профиля
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: data.user.id, 
            full_name: fullName, 
            phone: formattedPhone, 
            address: address, 
            role: 'user' 
          });
        
        if (profileError) console.error('Error creating profile during signup:', profileError.message);
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || "Ошибка системы" } };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signIn, signUp, verifyOTP, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
