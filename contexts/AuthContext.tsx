
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Страховочный таймаут: если за 10 секунд не удалось инициализироваться, 
    // убираем лоадер, чтобы пользователь мог хотя бы видеть интерфейс.
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization timed out.");
        setIsLoading(false);
      }
    }, 10000);

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn("Auth check failed:", sessionError.message);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          await fetchOrCreateProfile(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Critical Auth error:", e);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchOrCreateProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrCreateProfile = async (supabaseUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle(); 
      
      if (error) {
        console.error("Profile fetching failed:", error.message);
        return;
      }

      if (data) {
        setUser(data as UserProfile);
      } else {
        const newProfile = {
          id: supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Новый гость',
          phone: supabaseUser.user_metadata?.phone || '',
          address: '',
          role: 'user'
        };
        const { data: created } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .maybeSingle();
        
        if (created) {
          setUser(created as UserProfile);
        }
      }
    } catch (err) {
      console.error('Profile Logic Exception:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email: identifier, password });
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
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
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div style={{ display: 'contents' }}>
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
    </div>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
