'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';

export type UserRole = 'Administrador' | 'Comercial' | 'Produção' | 'Financeiro' | 'Estoque' | 'Expedição' | 'Fábrica' | 'Vendedor';

export interface UserProfile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  actual_role?: UserRole;
  email: string;
  force_password_change?: boolean;
  pin?: string;
  is_factory_account?: boolean;
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

  const isLoadingRef = useRef(true);
  const isFetchingProfileRef = useRef(false);

  // Monitora o estado de autenticacao real do Supabase
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      isLoadingRef.current = false;
      return;
    }

    // Timeout de segurança rápido (3.5s): se ficar travado por latência de rede, força o desbloqueio
    const safetyTimer = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('[Auth] Timeout de segurança atingido (3.5s) — liberando carregamento da interface.');
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }, 3500);

    // Registra listener para mudanças de autenticação (dispara INITIAL_SESSION automaticamente)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Page Visibility API: reconecta quando a aba volta ao foco sem forçar reloads infinitos
  useEffect(() => {
    if (!supabase) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // App já carregado: reverificar sessão silenciosamente no background
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (!session && user) {
          setUser(null);
        }
      } catch {
        // Erro silencioso — não bloqueia a UI
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Busca as informacoes complementares do perfil no banco de dados com proteção de concorrência e timeout
  const fetchProfile = async (userId: string) => {
    if (isFetchingProfileRef.current) return;
    isFetchingProfileRef.current = true;

    try {
      // Query do perfil com timeout de corrida de 3 segundos
      const profilePromise = supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout profile fetch') }), 3000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.warn('Alerta/Timeout ao buscar perfil no Supabase:', error.message);
      }
      
      if (data) {
        const profile = {
          ...data,
          actual_role: data.role
        } as UserProfile;

        // Se for admin, verifica se há um papel temporário salvo na sessão
        if (data.role === 'Administrador' && typeof window !== 'undefined') {
          const savedRole = sessionStorage.getItem('active_role') as UserRole;
          if (savedRole) {
            profile.role = savedRole;
          }
        }
        setUser(profile);

        if (profile.force_password_change && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/redefinir-senha' && currentPath !== '/operador-perfil') {
            window.location.href = '/redefinir-senha?invite=true';
          }
        }
      } else {
        // Se a busca falhou ou o perfil não existe, cria um objeto mínimo baseado na sessão para evitar travamentos
        const { data: sessionData } = await supabase!.auth.getSession();
        const currentSessionUser = sessionData?.session?.user;
        if (currentSessionUser) {
          setUser({
            id: currentSessionUser.id,
            tenant_id: DEFAULT_TENANT_ID,
            full_name: currentSessionUser.user_metadata?.full_name || currentSessionUser.email?.split('@')[0] || 'Usuário',
            role: (currentSessionUser.user_metadata?.role as UserRole) || 'Produção',
            actual_role: (currentSessionUser.user_metadata?.role as UserRole) || 'Produção',
            email: currentSessionUser.email || ''
          });
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do usuário:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      isFetchingProfileRef.current = false;
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
