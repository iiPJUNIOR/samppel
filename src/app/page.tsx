'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Boxes, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, changeActiveRole } = useAuth();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Administrador');
  
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [tempProfile, setTempProfile] = useState<any>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redireciona para o dashboard se o usuario ja estiver logado e nao estiver no seletor
  useEffect(() => {
    if (user && !showRoleSelector) {
      router.push('/dashboard');
    }
  }, [user, router, showRoleSelector]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUpMode) {
        if (!fullName.trim() || !email.trim() || !password) {
          throw new Error('Todos os campos sao obrigatorios para o cadastro.');
        }
        const { data, error: signUpErr } = await signUp(email, password, fullName, role);
        if (signUpErr) throw signUpErr;
        
        // Se a sessao for nula, significa que a confirmacao por e-mail esta ativa no Supabase
        if (data && !data.session) {
          alert('Cadastro realizado com sucesso! Um e-mail de confirmação foi enviado. Por favor, acesse sua caixa de entrada e confirme sua conta clicando no link do e-mail antes de fazer login.');
        } else {
          alert('Cadastro realizado com sucesso! Você já pode fazer login.');
        }
        setIsSignUpMode(false);
        setPassword('');
      } else {
        if (!email.trim() || !password) {
          throw new Error('E-mail e senha sao obrigatorios.');
        }
        const { data, error: signInErr } = await signIn(email, password);
        if (signInErr) throw signInErr;
        
        if (data?.profile && data.profile.role === 'Administrador') {
          setTempProfile(data.profile);
          setShowRoleSelector(true);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na autenticacao.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    changeActiveRole(selectedRole);
    setShowRoleSelector(false);
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
        
        {/* Logo da Marca */}
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

        {/* Nome da Marca */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Portal Samppel
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Sistema Comercial & Gestao de Producao de Embalagens Personalizadas
        </p>

        {showRoleSelector ? (
          <div style={{ width: '100%', textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Olá, {tempProfile?.full_name}!
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Você possui acesso administrativo. Escolha com qual perfil deseja navegar no sistema nesta sessão:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(['Administrador', 'Comercial', 'Produção', 'Financeiro'] as UserRole[]).map((roleOption) => (
                <button
                  key={roleOption}
                  onClick={() => handleSelectRole(roleOption)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: roleOption === 'Administrador' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)',
                    color: roleOption === 'Administrador' ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Acessar como {roleOption}</span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowRoleSelector(false);
                setTempProfile(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                width: '100%',
                textAlign: 'center'
              }}
            >
              Voltar para a tela de login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '0.8rem',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            {/* Formulario de Autenticacao */}
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              
              {isSignUpMode && (
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignUpMode && (
                <div className="form-group">
                  <label className="form-label">Cargo / Funcao *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Produção">Producao (Fabrica)</option>
                    <option value="Financeiro">Financeiro</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '0.875rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '1rem', 
                  fontWeight: 600,
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{loading ? 'Processando...' : isSignUpMode ? 'Criar Minha Conta' : 'Acessar o Painel'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Link para alternar modo */}
            <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isSignUpMode ? 'Ja possui uma conta?' : 'Ainda nao tem acesso?'}
              </span>{' '}
              <button 
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setError(null);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {isSignUpMode ? 'Entrar no painel' : 'Cadastre-se aqui'}
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Samppel Embalagens Ltda &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
