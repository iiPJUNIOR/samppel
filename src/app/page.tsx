'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import Image from 'next/image';
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

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
        if (!fullName.trim() || !email.trim() || !password) throw new Error('Todos os campos são obrigatórios.');
        const { data, error: err } = await signUp(email, password, fullName, role);
        if (err) throw err;
        if (data && !data.session) {
          alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        } else {
          alert('Cadastro realizado! Você já pode fazer login.');
        }
        setIsSignUpMode(false);
        setPassword('');
      } else {
        if (!email.trim() || !password) throw new Error('E-mail e senha são obrigatórios.');
        const { data, error: err } = await signIn(email, password);
        if (err) throw err;
        if (data?.profile && data.profile.role === 'Administrador') {
          setTempProfile(data.profile);
          setShowRoleSelector(true);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .lp-root {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          font-family: 'Inter', var(--font-sans), sans-serif;
          background: #0A0D14;
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           LEFT PANEL — Branding escuro premium
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        .lp-left {
          flex: 0 0 48%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3.5rem;
          background: #0A0D14;
          position: relative;
          overflow: hidden;
        }

        /* Grade de fundo sutil */
        .lp-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Brilho sutil no canto superior esquerdo */
        .lp-left::after {
          content: '';
          position: absolute;
          top: -120px;
          left: -120px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .lp-left-top {
          position: relative;
          z-index: 1;
        }

        .lp-logo {
          display: block;
          width: 210px;
          height: auto;
        }

        .lp-left-center {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 0;
        }

        .lp-tagline-label {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #3B82F6;
          margin-bottom: 1.25rem;
          padding: 0.3rem 0.75rem;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 2rem;
          background: rgba(59, 130, 246, 0.08);
        }

        .lp-headline {
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.1;
          color: #F8FAFC;
          letter-spacing: -0.02em;
          margin-bottom: 1.25rem;
        }

        .lp-headline span {
          color: #3B82F6;
        }

        .lp-subtitle {
          font-size: 0.9375rem;
          line-height: 1.65;
          color: #64748B;
          max-width: 380px;
        }

        /* Métricas decorativas */
        .lp-metrics {
          display: flex;
          gap: 2rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .lp-metric {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .lp-metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #F1F5F9;
          letter-spacing: -0.02em;
        }

        .lp-metric-label {
          font-size: 0.75rem;
          color: #475569;
        }

        .lp-left-bottom {
          position: relative;
          z-index: 1;
          font-size: 0.75rem;
          color: #334155;
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RIGHT PANEL — Formulário
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        .lp-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
          padding: 3rem 2rem;
        }

        .lp-form-box {
          width: 100%;
          max-width: 400px;
          animation: lp-fadein 0.45s ease;
        }

        @keyframes lp-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lp-form-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 0.375rem;
          letter-spacing: -0.01em;
        }

        .lp-form-sub {
          font-size: 0.875rem;
          color: #64748B;
          margin-bottom: 2rem;
        }

        /* ── Error ── */
        .lp-error {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.75rem 1rem;
          background: #FEF2F2;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.8125rem;
          color: #DC2626;
          line-height: 1.4;
        }

        .lp-error svg { flex-shrink: 0; margin-top: 1px; }

        /* ── Fields ── */
        .lp-field {
          margin-bottom: 1.125rem;
        }

        .lp-field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.4rem;
        }

        .lp-input-wrap {
          position: relative;
        }

        .lp-input {
          width: 100%;
          padding: 0.71875rem 0.9375rem;
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 0.9375rem;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          -webkit-appearance: none;
        }

        .lp-input::placeholder { color: #9CA3AF; }

        .lp-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .lp-input-with-icon {
          padding-right: 2.75rem;
        }

        .lp-eye {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          transition: color 0.15s;
          padding: 0;
        }

        .lp-eye:hover { color: #374151; }

        .lp-select {
          width: 100%;
          padding: 0.71875rem 0.9375rem;
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 0.9375rem;
          color: #0F172A;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          -webkit-appearance: none;
        }

        .lp-select:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        /* ── Primary CTA ── */
        .lp-btn {
          width: 100%;
          padding: 0.8125rem 1.5rem;
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          letter-spacing: 0.01em;
        }

        .lp-btn:hover:not(:disabled) {
          background: #1D4ED8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          transform: translateY(-1px);
        }

        .lp-btn:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
          box-shadow: none;
        }

        .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Footer links ── */
        .lp-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.375rem;
        }

        .lp-link {
          font-size: 0.8125rem;
          color: #64748B;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          transition: color 0.15s;
          text-decoration: none;
        }

        .lp-link:hover { color: #2563EB; }

        /* ── Divider ── */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.375rem 0;
          font-size: 0.75rem;
          color: #9CA3AF;
        }

        .lp-divider::before,
        .lp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E5E7EB;
        }

        /* ── Conta Azul ── */
        .lp-ca-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.6875rem 1rem;
          background: transparent;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #6B7280;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }

        .lp-ca-link:hover {
          border-color: #2563EB;
          color: #2563EB;
          background: rgba(37, 99, 235, 0.04);
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           ROLE SELECTOR
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        .lp-roles {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-bottom: 1.5rem;
        }

        .lp-role-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9375rem 1.125rem;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .lp-role-btn:hover {
          border-color: #2563EB;
          background: rgba(37, 99, 235, 0.03);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .lp-role-name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #0F172A;
        }

        .lp-role-desc {
          font-size: 0.75rem;
          color: #6B7280;
          margin-top: 0.125rem;
        }

        .lp-role-icon {
          color: #D1D5DB;
          transition: color 0.15s, transform 0.15s;
        }

        .lp-role-btn:hover .lp-role-icon {
          color: #2563EB;
          transform: translateX(3px);
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RESPONSIVE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        @media (max-width: 900px) {
          .lp-left {
            flex: 0 0 40%;
            padding: 2.5rem;
          }
          .lp-headline { font-size: 2rem; }
          .lp-metrics { display: none; }
        }

        @media (max-width: 680px) {
          .lp-root { flex-direction: column; }
          .lp-left {
            flex: none;
            padding: 2rem;
            min-height: auto;
          }
          .lp-left-center { padding: 1.5rem 0; }
          .lp-headline { font-size: 1.75rem; }
          .lp-subtitle { display: none; }
          .lp-left-bottom { display: none; }
          .lp-right { padding: 2rem 1.5rem; }
        }
      `}</style>

      <div className="lp-root">
        {/* ── Left Panel ───────────────────────────────────── */}
        <div className="lp-left">
          <div className="lp-left-top">
            <Image
              src="/logo.png"
              alt="Samppel Embalagens"
              width={210}
              height={80}
              className="lp-logo"
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </div>

          <div className="lp-left-center">
            <span className="lp-tagline-label">Portal de Gestão</span>
            <h1 className="lp-headline">
              Controle total<br />
              do seu <span>negócio.</span>
            </h1>
            <p className="lp-subtitle">
              Gerencie pedidos, clientes, produção e financeiro em um único sistema integrado ao Conta Azul.
            </p>

            <div className="lp-metrics">
              <div className="lp-metric">
                <span className="lp-metric-value">100%</span>
                <span className="lp-metric-label">Integrado ao ERP</span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-value">4</span>
                <span className="lp-metric-label">Módulos ativos</span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-value">RT</span>
                <span className="lp-metric-label">Dados em tempo real</span>
              </div>
            </div>
          </div>

          <div className="lp-left-bottom">
            © {new Date().getFullYear()} Samppel Embalagens — Todos os direitos reservados.
          </div>
        </div>

        {/* ── Right Panel ──────────────────────────────────── */}
        <div className="lp-right">
          <div className="lp-form-box">
            {showRoleSelector ? (
              /* ── Role Selector ────────────────────────── */
              <>
                <p className="lp-form-title">Olá, {tempProfile?.full_name?.split(' ')[0]} 👋</p>
                <p className="lp-form-sub">Escolha o perfil para acessar o sistema.</p>

                <div className="lp-roles">
                  {([
                    { role: 'Administrador' as UserRole, desc: 'Acesso total ao sistema' },
                    { role: 'Comercial' as UserRole, desc: 'Pedidos, clientes e vendas' },
                    { role: 'Produção' as UserRole, desc: 'Kanban e etapas de fabricação' },
                    { role: 'Financeiro' as UserRole, desc: 'Contas a receber e relatórios' },
                  ]).map(({ role: r, desc }) => (
                    <button
                      key={r}
                      type="button"
                      className="lp-role-btn"
                      onClick={() => handleSelectRole(r)}
                    >
                      <div>
                        <div className="lp-role-name">{r}</div>
                        <div className="lp-role-desc">{desc}</div>
                      </div>
                      <ChevronRight size={18} className="lp-role-icon" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="lp-link"
                  style={{ display: 'block', textAlign: 'center', width: '100%' }}
                  onClick={() => { setShowRoleSelector(false); setTempProfile(null); }}
                >
                  ← Voltar para o login
                </button>
              </>
            ) : (
              /* ── Login / Cadastro ─────────────────────── */
              <>
                <p className="lp-form-title">
                  {isSignUpMode ? 'Criar conta' : 'Bem-vindo de volta'}
                </p>
                <p className="lp-form-sub">
                  {isSignUpMode
                    ? 'Preencha os dados para solicitar acesso.'
                    : 'Informe suas credenciais para entrar.'}
                </p>

                {error && (
                  <div className="lp-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form autoComplete="off" onSubmit={handleSubmit}>
                  {isSignUpMode && (
                    <div className="lp-field">
                      <label htmlFor="fullName">Nome completo</label>
                      <input
                        id="fullName"
                        className="lp-input"
                        type="text"
                        placeholder="Paulo Junior"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="lp-field">
                    <label htmlFor="email">E-mail</label>
                    <input
                      id="email"
                      className="lp-input"
                      type="email"
                      placeholder="voce@samppel.com.br"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="lp-field">
                    <label htmlFor="password">Senha</label>
                    <div className="lp-input-wrap">
                      <input
                        id="password"
                        className="lp-input lp-input-with-icon"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="lp-eye"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {isSignUpMode && (
                    <div className="lp-field">
                      <label htmlFor="role">Cargo</label>
                      <select
                        id="role"
                        className="lp-select"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Produção">Produção</option>
                        <option value="Financeiro">Financeiro</option>
                      </select>
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="lp-btn">
                    {loading ? (
                      <><Loader2 size={18} className="spinner" /> Processando...</>
                    ) : (
                      isSignUpMode ? 'Criar conta' : 'Entrar'
                    )}
                  </button>
                </form>

                <div className="lp-footer">
                  <a
                    href="#"
                    className="lp-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Entre em contato com o administrador do sistema para redefinir sua senha.');
                    }}
                  >
                    Esqueceu a senha?
                  </a>
                  <button
                    type="button"
                    className="lp-link"
                    onClick={() => { setIsSignUpMode(!isSignUpMode); setError(null); }}
                  >
                    {isSignUpMode ? 'Já tenho conta' : 'Criar conta'}
                  </button>
                </div>

                <div className="lp-divider">ou continue com</div>

                <a
                  href="https://login.contaazul.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-ca-link"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="4" fill="#0073CF"/>
                    <path d="M12 6C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 9.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" fill="white"/>
                  </svg>
                  Acessar Conta Azul
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
