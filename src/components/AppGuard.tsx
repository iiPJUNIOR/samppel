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
        // Se não estiver autenticado, permite ficar na página de login ('/') ou de redefinir senha ('/redefinir-senha')
        if (pathname !== '/' && pathname !== '/redefinir-senha') {
          router.push('/');
        }
      } else {
        // Usuário autenticado
        
        // 1. Se a conta exigir troca de senha obrigatória (convite inicial ou redefinição forçada)
        if (user.force_password_change) {
          if (pathname !== '/redefinir-senha') {
            router.push('/redefinir-senha?invite=true');
          }
          return;
        }

        // 2. Se o usuário estiver na tela de redefinir senha, permite continuar nela
        if (pathname === '/redefinir-senha') {
          return;
        }

        // 3. Se o usuário estiver na tela de Perfil do Operador, permite acesso a TODOS os usuários!
        if (pathname === '/operador-perfil') {
          return;
        }

        // 4. Regras de navegação padrão por papel
        if (user.is_factory_account) {
          if (pathname !== '/pedidos') {
            router.push('/pedidos');
          }
        } else if (user.role === 'Produção') {
          if (pathname !== '/pedidos' && pathname !== '/operador-perfil') {
            router.push('/pedidos');
          }
        } else if (user.role === 'Fábrica') {
          if (pathname !== '/pedidos') {
            router.push('/pedidos');
          }
        } else if (user.role === 'Vendedor') {
          if (!['/pedidos', '/clientes', '/produtos', '/operador-perfil'].includes(pathname) && !pathname.startsWith('/pedidos/') && !pathname.startsWith('/clientes/') && !pathname.startsWith('/produtos/')) {
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

  // Exibe tela de carregamento premium com animação de zoom no logo da Samppel
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0A0D14 0%, #111827 100%)',
        color: '#E5E7EB',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grade de fundo sutil */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />

        {/* Brilho radial de fundo */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }} />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.75rem',
          zIndex: 1,
          textAlign: 'center'
        }}>
          {/* Logo animado com efeito de zoom pulsante */}
          <div style={{
            animation: 'pulseZoom 2s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 20px rgba(37, 99, 235, 0.15))'
          }}>
            <img 
              src="/logo.png" 
              alt="Logo Samppel" 
              style={{
                width: '280px',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>

          {/* Container do Loader de Progresso */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            {/* Linha de progresso indeterminada moderna */}
            <div style={{
              width: '180px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                height: '100%',
                width: '40%',
                background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                borderRadius: '2px',
                animation: 'indeterminateProgress 1.4s ease-in-out infinite'
              }} />
            </div>
            
            <span style={{ 
              fontSize: '0.78rem', 
              color: '#9CA3AF', 
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Carregando portal...
            </span>
          </div>
        </div>

        {/* CSS KEYFRAMES */}
        <style jsx global>{`
          @keyframes pulseZoom {
            0% {
              transform: scale(0.96);
              opacity: 0.9;
            }
            50% {
              transform: scale(1.03);
              opacity: 1;
            }
            100% {
              transform: scale(0.96);
              opacity: 0.9;
            }
          }
          @keyframes indeterminateProgress {
            0% {
              left: -40%;
            }
            50% {
              left: 100%;
              width: 50%;
            }
            100% {
              left: 100%;
              width: 30%;
            }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
