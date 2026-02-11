import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: any }>;
  signUp: (phone: string, password: string, fullName: string, address: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- MOCK AUTH FOR DEMO ---
  // In a real app, use supabase.auth.getSession() and onAuthStateChange
  useEffect(() => {
    const storedUser = localStorage.getItem('zhulebino_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (phone: string, password: string) => {
    // REAL: await supabase.auth.signInWithPassword({ email: phone + "@placeholder.com", password });
    
    // MOCK:
    if (phone === '+79998161830' && password === 'trOika69') {
      const adminUser: UserProfile = { id: 'admin-1', full_name: 'Администратор', phone, address: 'Жулебино', role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('zhulebino_user', JSON.stringify(adminUser));
      return { error: null };
    }
    
    // Mock regular user
    const mockUser: UserProfile = { id: 'user-' + Date.now(), full_name: 'Гость ' + phone, phone, address: 'Москва', role: 'user' };
    setUser(mockUser);
    localStorage.setItem('zhulebino_user', JSON.stringify(mockUser));
    return { error: null };
  };

  const signUp = async (phone: string, password: string, fullName: string, address: string) => {
     // REAL: await supabase.auth.signUp(...) then insert into profiles
     const mockUser: UserProfile = { id: 'user-' + Date.now(), full_name: fullName, phone, address, role: 'user' };
     setUser(mockUser);
     localStorage.setItem('zhulebino_user', JSON.stringify(mockUser));
     return { error: null };
  };

  const signOut = async () => {
    // REAL: await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('zhulebino_user');
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