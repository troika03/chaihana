
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

  const fetchProfile = async (uid: string) => {
    if (isFetchingProfile.current) return;
    isFetchingProfile.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      
      if (!error && data) {
        setUser(data as UserProfile);
      } else if (error) {
        console.error('Profile fetch error:', error.message);
      } else {
        // Если данных нет, возможно триггер еще не отработал. 
        // Создаем временный объект, чтобы не блокировать UI
        setUser({ id: uid, full_name: 'Загрузка...', phone: '', address: '', role: 'user' });
      }
    } catch (err) {
      console.error('Critical error in fetchProfile:', err);
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
            await fetchProfile(session.user.id);
          } else {
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error("Auth init error", e);
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
            await fetchProfile(session.user.id);
          }
        } else {
          setUser(null);
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
    setIsLoading(true);
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
