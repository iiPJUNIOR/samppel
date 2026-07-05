'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import Image from 'next/image';
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, changeActiveRole } = useAuth();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Administrador');

  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [tempProfile, setTempProfile] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if user is already logged in
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
          throw new Error('Todos os campos são obrigatórios para o cadastro.');
        }
        const { data, error: signUpErr } = await signUp(email, password, fullName, role);
        if (signUpErr) throw signUpErr;

        if (data && !data.session) {
          alert('Cadastro realizado com sucesso! Um e-mail de confirmação foi enviado. Por favor, acesse sua caixa de entrada e confirme sua conta clicando no link do e-mail antes de fazer login.');
        } else {
          alert('Cadastro realizado com sucesso! Você já pode fazer login.');
        }
        setIsSignUpMode(false);
        setPassword('');
      } else {
        if (!email.trim() || !password) {
          throw new Error('E-mail e senha são obrigatórios.');
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
      setError(err.message || 'Falha na autenticação.');
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
    <div className="login-page">
      <style>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background: var(--background);
          font-family: var(--font-sans);
        }

        /* ── Left Panel — Branding ──────────────────────────── */
        .login-brand {
          flex: 0 0 45%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          background: linear-gradient(135deg, #1E40AF 0%, #2563EB 40%, #3B82F6 100%);
          color: #FFFFFF;
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }

        /* Subtle decorative pattern */
        .login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%);
          pointer-events: none;
        }

        .brand-logo-container {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.15);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          position: relative;
          z-index: 1;
        }

        .brand-text {
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .brand-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #FFFFFF;
          margin-bottom: 0.5rem;
        }

        .brand-text p {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.5;
          max-width: 280px;
        }

        /* ── Right Panel — Form ─────────────────────────────── */
        .login-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: var(--surface);
        }

        .login-form-container {
          width: 100%;
          max-width: 400px;
          animation: fadeIn 0.4s ease;
        }

        .login-form-header {
          margin-bottom: 2rem;
        }

        .login-form-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.375rem;
        }

        .login-form-header p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        /* ── Error Alert ────────────────────────────────────── */
        .login-error {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.75rem 1rem;
          background: var(--danger-bg);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          font-size: 0.8125rem;
          color: var(--danger);
          line-height: 1.4;
        }

        .login-error svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── Form Fields ────────────────────────────────────── */
        .field {
          margin-bottom: 1.25rem;
        }

        .field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 0.375rem;
        }

        .field-input-wrap {
          position: relative;
        }

        .field input,
        .field select {
          width: 100%;
          padding: 0.6875rem 0.875rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--text);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .field input:focus,
        .field select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12);
        }

        .field input::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .field select option {
          background: var(--surface);
          color: var(--text);
        }

        .eye-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .eye-toggle:hover {
          color: var(--text);
        }

        /* ── Submit Button ──────────────────────────────────── */
        .login-submit {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.15s ease, transform 0.1s ease;
          margin-top: 0.5rem;
        }

        .login-submit:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .login-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Footer Links ───────────────────────────────────── */
        .login-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          font-size: 0.8125rem;
        }

        .login-footer a,
        .login-footer button {
          color: var(--text-muted);
          transition: color 0.15s ease;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.8125rem;
          font-family: var(--font-sans);
          padding: 0;
        }

        .login-footer a:hover,
        .login-footer button:hover {
          color: var(--primary);
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .conta-azul-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem 1rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
          text-decoration: none;
        }

        .conta-azul-link:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.04);
        }

        /* ── Role Selector ──────────────────────────────────── */
        .role-grid {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-bottom: 1.5rem;
        }

        .role-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text);
        }

        .role-option:hover {
          border-color: var(--primary);
          background: rgba(var(--primary-rgb), 0.04);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
        }

        .role-option .arrow-icon {
          color: var(--text-muted);
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .role-option:hover .arrow-icon {
          transform: translateX(3px);
          color: var(--primary);
        }

        .back-link {
          display: block;
          text-align: center;
          font-size: 0.8125rem;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-sans);
          transition: color 0.15s ease;
          padding: 0;
          width: 100%;
        }

        .back-link:hover {
          color: var(--primary);
        }

        /* ── Responsive ─────────────────────────────────────── */
        @media (max-width: 768px) {
          .login-page {
            flex-direction: column;
          }

          .login-brand {
            flex: none;
            padding: 2rem 1.5rem;
            min-height: auto;
          }

          .brand-text h1 {
            font-size: 1.375rem;
          }

          .brand-text p {
            font-size: 0.8125rem;
          }

          .login-form-panel {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>

      {/* ── Left Panel — Branding ────────────────────────── */}
      <div className="login-brand">
        <div className="brand-logo-container">
          <Image
            src="/logo.png"
            alt="Samppel"
            width={52}
            height={52}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="brand-text">
          <h1>Portal Samppel</h1>
          <p>Sistema de gestão comercial e produção para embalagens personalizadas</p>
        </div>
      </div>

      {/* ── Right Panel — Form / Role Selector ──────────── */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {showRoleSelector ? (
            /* ── Role Selector View ──────────────────────── */
            <>
              <div className="login-form-header">
                <h2>Olá, {tempProfile?.full_name?.split(' ')[0]}</h2>
                <p>Selecione o perfil de acesso para esta sessão.</p>
              </div>

              <div className="role-grid">
                {(['Administrador', 'Comercial', 'Produção', 'Financeiro'] as UserRole[]).map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    className="role-option"
                    onClick={() => handleSelectRole(roleOption)}
                  >
                    <span>{roleOption}</span>
                    <ArrowRight size={16} className="arrow-icon" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="back-link"
                onClick={() => {
                  setShowRoleSelector(false);
                  setTempProfile(null);
                }}
              >
                ← Voltar para o login
              </button>
            </>
          ) : (
            /* ── Login / Sign Up Form ────────────────────── */
            <>
              <div className="login-form-header">
                <h2>{isSignUpMode ? 'Criar conta' : 'Entrar no sistema'}</h2>
                <p>{isSignUpMode
                  ? 'Preencha os dados para solicitar acesso ao portal.'
                  : 'Informe suas credenciais para acessar o painel.'
                }</p>
              </div>

              {error && (
                <div className="login-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form autoComplete="off" onSubmit={handleSubmit}>
                {isSignUpMode && (
                  <div className="field">
                    <label htmlFor="fullName">Nome completo</label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Ex: Paulo Junior"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="field">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seuemail@samppel.com.br"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Senha</label>
                  <div className="field-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {isSignUpMode && (
                  <div className="field">
                    <label htmlFor="role">Cargo / Função</label>
                    <select
                      id="role"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Produção">Produção (Fábrica)</option>
                      <option value="Financeiro">Financeiro</option>
                    </select>
                  </div>
                )}

                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      Processando...
                    </>
                  ) : (
                    isSignUpMode ? 'Criar conta' : 'Entrar'
                  )}
                </button>
              </form>

              <div className="login-footer">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Entre em contato com o administrador do sistema para redefinir sua senha.');
                  }}
                >
                  Esqueceu a senha?
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(!isSignUpMode);
                    setError(null);
                  }}
                >
                  {isSignUpMode ? 'Já tenho conta' : 'Criar conta'}
                </button>
              </div>

              <div className="login-divider">ou</div>

              <a
                href="https://login.contaazul.com"
                target="_blank"
                rel="noopener noreferrer"
                className="conta-azul-link"
              >
                <Building2 size={16} />
                Acessar o Conta Azul
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
