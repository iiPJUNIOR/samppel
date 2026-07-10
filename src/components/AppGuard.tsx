'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AppGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (pathname !== '/') {
          router.push('/');
        }
      } else {
        // Usuário autenticado
        if (user.is_factory_account) {
          if (pathname !== '/pedidos') {
            router.push('/pedidos');
          }
        } else if (user.role === 'Produção') {
          if (pathname !== '/operador-perfil') {
            router.push('/operador-perfil');
          }
        } else if (user.role === 'Fábrica') {
          if (pathname !== '/pedidos') {
            router.push('/pedidos');
          }
        } else if (user.role === 'Vendedor') {
          if (!['/pedidos', '/clientes', '/produtos'].includes(pathname) && !pathname.startsWith('/pedidos/') && !pathname.startsWith('/clientes/') && !pathname.startsWith('/produtos/')) {
            router.push('/pedidos');
          }
        } else {
          if (pathname === '/') {
            router.push('/dashboard');
          }
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  // Exibe tela de carregamento premium enquanto valida a sessao real
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, hsl(222, 47%, 6%) 0%, hsl(222, 47%, 14%) 100%)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        fontSize: '1rem',
        fontWeight: 500
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(var(--primary-rgb), 0.1)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Verificando autenticação...</span>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
