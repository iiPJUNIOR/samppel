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

  // Monitora o estado de autenticacao real do Supabase
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      isLoadingRef.current = false;
      return;
    }

    // Timeout de segurança: se ficar em loading por mais de 8s, desbloqueia
    const safetyTimer = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('[Auth] Timeout de segurança atingido — forçando saída do loading.');
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }, 8000);

    // Busca sessao ativa inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    });

    // Registra listener para mudancas de autenticacao
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

  // Page Visibility API: reconecta quando a aba volta ao foco (sleep do PC, celular desbloqueado)
  useEffect(() => {
    if (!supabase) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Se o app ainda estava em loading quando a aba voltou → recarregar
      if (isLoadingRef.current) {
        console.warn('[Auth] Aba voltou ao foco durante loading — recarregando.');
        window.location.reload();
        return;
      }

      // App já estava carregado: reverificar sessão silenciosamente
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (!session) {
          // Sessão expirou enquanto estava em background → desloga
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
        if (profile.force_password_change && typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/redefinir-senha' && currentPath !== '/operador-perfil') {
            window.location.href = '/redefinir-senha?invite=true';
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do usuario:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
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
