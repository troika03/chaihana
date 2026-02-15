
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { api } from '../apiClient';
import { UserProfile } from '../pages/types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, address: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const initAuth = async () => {
    try {
      const profile = await api.auth.getSession();
      if (isMounted.current) setUser(profile);
    } catch (err) {
      console.error("Auth init error:", err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    // ПРЕДОХРАНИТЕЛЬ: Если сессия не загрузилась за 2 секунды, 
    // считаем, что связи с БД нет и снимаем экран загрузки
    const safetyTimer = setTimeout(() => {
      if (isMounted.current && isLoading) {
        console.warn("Auth safety timer triggered - forcing loading false");
        setIsLoading(false);
      }
    }, 2000);

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted.current) {
          setUser(null);
          setIsLoading(false);
        }
      } else if (session) {
        initAuth();
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const profile = await api.auth.signIn(email, pass);
      if (isMounted.current) setUser(profile);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, address: string) => {
    setIsLoading(true);
    try {
      const profile = await api.auth.signUp(email, pass, name, address);
      if (isMounted.current) setUser(profile);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const signOut = async () => {
    await api.auth.signOut();
    if (isMounted.current) setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAdmin: user?.role === 'admin',
      signIn, 
      signUp, 
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
