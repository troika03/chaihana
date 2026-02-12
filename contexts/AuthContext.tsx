
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
        .maybeSingle(); 
      
      if (!error && data) {
        setUser(data as UserProfile);
      } else if (!data) {
        // Если профиля нет, создаем его на лету
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
           const newProfile = {
             id: sbUser.id,
             full_name: sbUser.user_metadata?.full_name || 'Гость',
             phone: sbUser.user_metadata?.phone || '',
             address: '',
             role: 'user'
           };
           await supabase.from('profiles').upsert(newProfile);
           setUser(newProfile as UserProfile);
        }
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
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
      options: { redirectTo: window.location.origin }
    });
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: fullName, phone } }
    });
    if (data.user && !error) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, phone, address, role: 'user' });
    }
    return { error };
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
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.role === 'admin', signIn, signInWithGoogle, signUp, verifyOTP, resendOTP, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
