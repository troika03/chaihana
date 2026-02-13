
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

  useEffect(() => {
    isMounted.current = true;
    
    // Предохранитель: в любом случае отключаем лоадер через 5 секунд
    const safetyTimer = setTimeout(() => {
      if (isMounted.current) setIsLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const profile = await api.auth.getSession();
        if (isMounted.current) {
          setUser(profile);
          setIsLoading(false);
          clearTimeout(safetyTimer);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (isMounted.current) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted.current) {
          setUser(null);
          setIsLoading(false);
        }
      } else if (session) {
        try {
          const profile = await api.auth.getSession();
          if (isMounted.current) {
            setUser(profile);
            setIsLoading(false);
          }
        } catch {
          if (isMounted.current) setIsLoading(false);
        }
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
      if (isMounted.current) {
        if (profile && profile.id === 'error') throw new Error(profile.full_name);
        setUser(profile);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, address: string) => {
    setIsLoading(true);
    try {
      const profile = await api.auth.signUp(email, pass, name, address);
      if (isMounted.current) {
        if (profile && profile.id === 'error') throw new Error(profile.full_name);
        setUser(profile);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await api.auth.signOut();
      if (isMounted.current) setUser(null);
    } catch (e) {
      console.warn("SignOut failed:", e);
    }
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
