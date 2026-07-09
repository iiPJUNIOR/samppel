'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type UserRole = 'Administrador' | 'Comercial' | 'Produção' | 'Financeiro' | 'Estoque' | 'Expedição';

export interface UserProfile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  actual_role?: UserRole;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
  changeActiveRole: (role: UserRole) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ID fixo da empresa tenant para o escopo do Portal Samppel
const DEFAULT_TENANT_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitora o estado de autenticacao real do Supabase
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Busca sessao ativa inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Registra listener para mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Busca as informacoes complementares do perfil no banco de dados
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const profile = {
          ...data,
          actual_role: data.role
        } as UserProfile;
        // Se for admin, verifica se ha um papel temporario salvo na sessao
        if (data.role === 'Administrador' && typeof window !== 'undefined') {
          const savedRole = sessionStorage.getItem('active_role') as UserRole;
          if (savedRole) {
            profile.role = savedRole;
          }
        }
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do usuario:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Realiza login no Supabase Auth
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: new Error('Cliente Supabase nao inicializado.') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };

    if (data?.user) {
      // Busca o perfil diretamente do banco antes de definir o state do usuario logado
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) return { data: null, error: profileError };
      
      if (profile) {
        const userProfile = {
          ...profile,
          actual_role: profile.role
        } as UserProfile;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('active_role');
        }
        setUser(userProfile);
        return { data: { user: data.user, profile: userProfile }, error: null };
      }
    }
    return { data, error: null };
  };

  // Realiza cadastro no Supabase Auth (o perfil complementar eh criado via trigger no banco)
  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    if (!supabase) {
      return { data: null, error: new Error('Cliente Supabase nao inicializado.') };
    }
    // 1. Cadastra o usuario no auth passando os metadados do perfil
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) return { data: null, error };
    return { data, error: null };
  };

  // Permite mudar o perfil de acesso ativo temporariamente na sessao
  const changeActiveRole = (role: UserRole) => {
    if (user) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('active_role', role);
      }
      setUser(prev => prev ? { ...prev, role } : null);
    }
  };

  // Realiza logout do Supabase
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('active_role');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout, changeActiveRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
