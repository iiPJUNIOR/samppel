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
  const [pin, setPin] = useState('');
  const [isProducaoRole, setIsProducaoRole] = useState(false);
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
      if (searchParams.get('role') === 'Produção') {
        setIsProducaoRole(true);
      }

      // Tenta recuperar sessão pelo hash da URL (#access_token=...&refresh_token=...)
      const hash = window.location.hash || '';
      if (hash.includes('access_token=') && supabase) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          try {
            const base64Url = accessToken.split('.')[1];
            if (base64Url) {
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              if (payload?.user_metadata?.role === 'Produção' || payload?.role === 'Produção') {
                setIsProducaoRole(true);
              }
            }
          } catch (e) {}
        }

        if (accessToken && refreshToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).catch(err => console.error('Erro ao definir sessão via hash token:', err));
        }
      }
    }

    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
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

    if (isProducaoRole && (!pin || !/^\d{4,6}$/.test(pin))) {
      setError('Operadores de Produção precisam cadastrar um PIN de 4 a 6 dígitos numéricos.');
      return;
    }

    setLoading(true);

    try {
      // 1. Tentar obter a sessão atual ou decodificar JWT do hash caso o client do Supabase ainda não tenha salvo
      const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      let currentSession = sessionRes.data.session;
      let targetUserId = currentSession?.user?.id;
      let targetEmail = currentSession?.user?.email;
      let currentAccessToken = currentSession?.access_token || '';

      if (typeof window !== 'undefined') {
        const hash = window.location.hash || '';
        if (hash.includes('access_token=')) {
          const hashParams = new URLSearchParams(hash.replace('#', '?'));
          const hashToken = hashParams.get('access_token');
          if (hashToken) {
            currentAccessToken = hashToken;
            try {
              const base64Url = hashToken.split('.')[1];
              if (base64Url) {
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                if (payload) {
                  if (!targetUserId && payload.sub) targetUserId = payload.sub;
                  if (!targetEmail && payload.email) targetEmail = payload.email;
                  if (payload.user_metadata?.role === 'Produção' || payload.role === 'Produção') {
                    setIsProducaoRole(true);
                  }
                }
              }
            } catch (e) {
              console.error('Erro ao decodificar JWT token do hash:', e);
            }
          }
        }
      }

      let updateSuccess = false;

      // 2. Primeiro tenta a atualização pelo cliente Supabase do navegador se houver sessão ativa
      if (currentSession) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });

        if (!updateError) {
          updateSuccess = true;
        }
      }

      // 3. Se a atualização client-side falhou ou não havia sessão salva (evita "Auth session missing!"), usa a API Admin no servidor
      if (!updateSuccess) {
        const res = await fetch('/api/auth/set-invited-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: targetUserId,
            email: targetEmail,
            accessToken: currentAccessToken,
            password: password,
            pin: pin || undefined
          })
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Não foi possível autenticar o convite. O link pode ter expirado.');
        }
        updateSuccess = true;

        // Fazer login local no navegador
        if (targetEmail) {
          await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password
          }).catch(err => console.warn('Aviso ao efetuar login local:', err));
        }
      }

      if (!updateSuccess) {
        throw new Error('Não foi possível autenticar o convite. O link pode ter expirado.');
      }

      // 4. Remover exigência de troca de senha no banco Postgres
      const activeUser = targetUserId || (await supabase.auth.getUser()).data.user?.id;
      if (activeUser) {
        await fetch('/api/auth/clear-force-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeUser })
        }).catch(err => console.error('Erro ao chamar clear-force-password:', err));
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao submeter nova senha:', err);
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

              {/* PIN de Fábrica para Operadores de Produção */}
              {(isInvite || isProducaoRole) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
                    PIN de Fábrica (4 a 6 dígitos numéricos) {isProducaoRole ? '*' : '(opcional)'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required={isProducaoRole}
                    placeholder="Ex: 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.875rem',
                      borderRadius: '8px',
                      border: pin && /^\d{4,6}$/.test(pin) ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                      fontSize: '0.925rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    O PIN é utilizado para autenticação e movimentação de cartões nos terminais de fábrica.
                  </span>
                </div>
              )}

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
