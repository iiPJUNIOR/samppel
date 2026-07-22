'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('invite') === 'true' || searchParams.get('type') === 'invite') {
        setIsInvite(true);
      }
    }

    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setError(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Requisitos para Senha Forte
  const reqMinLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);
  const reqSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordStrong = reqMinLength && reqUpper && reqLower && reqNumber && reqSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError('Cliente de autenticação não inicializado.');
      return;
    }

    if (!password) {
      setError('A nova senha é obrigatória.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Sua senha precisa preencher todos os 5 requisitos de segurança forte abaixo.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      // Remover a exigência de troca de senha no perfil
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ force_password_change: false })
          .eq('id', session.user.id);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao definir a senha. O link de convite pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f6f8',
      padding: '2rem 1rem',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{ backgroundColor: '#0f172a', padding: '2rem', textAlign: 'center' }}>
          <Image
            src="/logo.png"
            alt="Samppel Embalagens"
            width={180}
            height={60}
            style={{ width: 'auto', height: 'auto', objectFit: 'contain', margin: '0 auto' }}
            priority
          />
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto'
            }}>
              <ShieldCheck size={26} style={{ color: '#2563eb' }} />
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
              {isInvite ? 'Criar Sua Senha de Acesso' : 'Redefinir Sua Senha'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              {isInvite
                ? 'Bem-vindo ao Portal Samppel! Para ativar seu convite, crie uma senha forte e segura abaixo.'
                : 'Crie uma nova senha forte para atualizar as credenciais do seu usuário.'}
            </p>
          </div>

          {success ? (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '10px',
              padding: '1.25rem',
              textAlign: 'center',
              color: '#166534'
            }}>
              <CheckCircle2 size={36} style={{ color: '#22c55e', margin: '0 auto 0.75rem auto', display: 'block' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem 0' }}>
                Senha criada com sucesso!
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0, color: '#15803d' }}>
                Sua conta foi ativada. Você será redirecionado para a página inicial em instantes...
              </p>
              <Link href="/" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
                Ir para o Portal agora →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
                  {isInvite ? 'Nova Senha Forte *' : 'Nova Senha *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 0.875rem',
                      borderRadius: '8px',
                      border: isPasswordStrong ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                      fontSize: '0.925rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Checklist Visual de Senha Forte */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.78rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                  Requisitos de Segurança da Senha:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: reqMinLength ? '#166534' : '#64748b', fontWeight: reqMinLength ? 600 : 400 }}>
                  <CheckCircle2 size={13} style={{ color: reqMinLength ? '#22c55e' : '#cbd5e1' }} />
                  <span>Mínimo de 8 caracteres</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: reqUpper ? '#166534' : '#64748b', fontWeight: reqUpper ? 600 : 400 }}>
                  <CheckCircle2 size={13} style={{ color: reqUpper ? '#22c55e' : '#cbd5e1' }} />
                  <span>Pelo menos 1 letra maiúscula (A-Z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: reqLower ? '#166534' : '#64748b', fontWeight: reqLower ? 600 : 400 }}>
                  <CheckCircle2 size={13} style={{ color: reqLower ? '#22c55e' : '#cbd5e1' }} />
                  <span>Pelo menos 1 letra minúscula (a-z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: reqNumber ? '#166534' : '#64748b', fontWeight: reqNumber ? 600 : 400 }}>
                  <CheckCircle2 size={13} style={{ color: reqNumber ? '#22c55e' : '#cbd5e1' }} />
                  <span>Pelo menos 1 número (0-9)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: reqSpecial ? '#166534' : '#64748b', fontWeight: reqSpecial ? 600 : 400 }}>
                  <CheckCircle2 size={13} style={{ color: reqSpecial ? '#22c55e' : '#cbd5e1' }} />
                  <span>Pelo menos 1 caractere especial (!@#$%...)</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
                  Confirmar Nova Senha *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '8px',
                    border: confirmPassword && confirmPassword === password ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                    fontSize: '0.925rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordStrong}
                style={{
                  width: '100%',
                  backgroundColor: isPasswordStrong ? '#2563eb' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.875rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  cursor: (loading || !isPasswordStrong) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Ativando conta...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>{isInvite ? 'Criar Senha e Entrar' : 'Atualizar Senha'}</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Link href="/" style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}>
                  ← Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
