'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Boxes, ArrowRight, ShieldCheck, Database, Zap, Cpu } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  // If user is already loaded, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleEnter = () => {
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, hsl(222, 47%, 6%) 0%, hsl(222, 47%, 14%) 100%)',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-premium)',
        padding: '2.5rem',
        animation: 'fadeIn 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        
        {/* Brand Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: '1.5rem'
        }}>
          <Boxes size={36} />
        </div>

        {/* Brand Name */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Portal Samppel
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Sistema Comercial & Gestão de Produção de Embalagens Personalizadas
        </p>

        {/* Info list */}
        <div style={{
          width: '100%',
          textAlign: 'left',
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <ShieldCheck size={18} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Controle de Acesso</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perfis customizados para Administrador, Comercial, Produção e Financeiro.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Cpu size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Integração ERP Conta Azul</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sincronização automática em segundo plano via OAuth 2.0 seguro.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Database size={18} style={{ color: 'var(--info)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Supabase & Banco Relacional</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modelagem com integridade entre clientes, produtos, pedidos e financeiro.</p>
            </div>
          </div>
        </div>

        {/* Enter Button */}
        <button 
          onClick={handleEnter}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.875rem', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 600 }}
        >
          Acessar o Painel
          <ArrowRight size={18} />
        </button>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Samppel Embalagens Ltda &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
