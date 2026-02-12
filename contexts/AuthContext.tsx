
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../pages/types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, address: string) => Promise<{ error: any }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: any }>;
  resendOTP: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingProfile = useRef(false);
  const lastFetchedId = useRef<string | null>(null);

  const fetchOrCreateProfile = async (supabaseUser: any) => {
    // Предотвращаем множественные одновременные запросы для одного и того же пользователя
    if (isFetchingProfile.current || (lastFetchedId.current === supabaseUser.id && user)) {
      setIsLoading(false);
      return;
    }

    isFetchingProfile.current = true;
    lastFetchedId.current = supabaseUser.id;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();
      
      if (!error && data) {
        setUser(data as UserProfile);
      } else {
        // Создаем профиль, если его нет (для входа через Google)
        const newProfile = {
          id: supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Гость',
          phone: supabaseUser.user_metadata?.phone || '',
          address: '',
          role: 'user'
        };
        
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .maybeSingle();
        
        if (!createError && created) {
          setUser(created as UserProfile);
        } else {
          setUser(newProfile as UserProfile);
        }
      }
    } catch (err) {
      console.error('Критическая ошибка при загрузке профиля:', err);
    } finally {
      isFetchingProfile.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user) {
            await fetchOrCreateProfile(session.user);
          } else {
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error("Ошибка инициализации Auth:", e);
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        if (session?.user) {
          await fetchOrCreateProfile(session.user);
        } else {
          setUser(null);
          lastFetchedId.current = null;
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (identifier: string, password: string) => {
    setIsLoading(true); // Показываем лоадер при ручном входе
    return await supabase.auth.signInWithPassword({ email: identifier, password });
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string) => {
    try {
      const { data, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName, phone } }
      });

      if (authError) return { error: authError };

      if (data.user) {
        await supabase.from('profiles').upsert({ 
          id: data.user.id, 
          full_name: fullName, 
          phone, 
          address, 
          role: 'user' 
        });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const verifyOTP = async (email: string, token: string) => {
    return await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  };

  const resendOTP = async (email: string) => {
    return await supabase.auth.resend({ type: 'signup', email });
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    lastFetchedId.current = null;
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAdmin: user?.role === 'admin', 
      signIn, 
      signInWithGoogle, 
      signUp, 
      verifyOTP, 
      resendOTP, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
