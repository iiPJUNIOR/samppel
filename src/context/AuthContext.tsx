'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Administrador' | 'Comercial' | 'Produção' | 'Financeiro';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  changeRole: (role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const mockProfiles: Record<UserRole, UserProfile> = {
  Administrador: {
    id: 'e00184c8-3e4b-4b14-87cf-45ef42d17c01',
    full_name: 'Ana Silva (Admin)',
    role: 'Administrador',
    email: 'admin@samppel.com.br'
  },
  Comercial: {
    id: 'e00284c8-3e4b-4b14-87cf-45ef42d17c02',
    full_name: 'Mariana Souza (Vendas)',
    role: 'Comercial',
    email: 'comercial@samppel.com.br'
  },
  Produção: {
    id: 'e00384c8-3e4b-4b14-87cf-45ef42d17c03',
    full_name: 'Carlos Mendes (Fábrica)',
    role: 'Produção',
    email: 'producao@samppel.com.br'
  },
  Financeiro: {
    id: 'e00484c8-3e4b-4b14-87cf-45ef42d17c04',
    full_name: 'Beatriz Lima (Financeiro)',
    role: 'Financeiro',
    email: 'financeiro@samppel.com.br'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted user or default to Admin
    const stored = localStorage.getItem('samppel_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        setUser(mockProfiles.Administrador);
      }
    } else {
      setUser(mockProfiles.Administrador);
    }
    setIsLoading(false);
  }, []);

  const changeRole = (role: UserRole) => {
    const newProfile = mockProfiles[role];
    setUser(newProfile);
    localStorage.setItem('samppel_user', JSON.stringify(newProfile));
    
    // Quick notification on profile switch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('samppel_role_changed', { detail: role }));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('samppel_user');
  };

  return (
    <AuthContext.Provider value={{ user, changeRole, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
