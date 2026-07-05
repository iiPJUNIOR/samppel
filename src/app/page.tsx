'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

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

  // Generate static random values once per mount to prevent hydration errors
  const blobsData = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      size: Math.random() * 200 + 150,
      left: Math.random() * 80 + 10,
      top: Math.random() * 80 + 10,
      animationDelay: Math.random() * -20,
      animationDuration: Math.random() * 15 + 15,
    }));
  }, []);

  // Keep track of the blob DOM elements for high-performance updates
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      // Apply subtle parallax effect to each blob
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20;
          blob.style.marginLeft = `${x * speed}px`;
          blob.style.marginTop = `${y * speed}px`;
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="mercury-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;800&family=Space+Mono&display=swap');

        :root {
          --bg: #050505;
          --mercury: #e0e0e0;
          --mercury-dark: #666666;
          --accent: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);
          --filter-goo: url('#gooey');
        }

        .mercury-wrapper {
          background-color: var(--bg);
          color: var(--accent);
          font-family: 'Inter', sans-serif;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .mercury-wrapper * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        /* Background Liquid Physics Simulation */
        .stage {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          filter: var(--filter-goo);
          opacity: 0.6;
        }

        .blob {
          position: absolute;
          background: linear-gradient(135deg, var(--mercury), #888);
          border-radius: 50%;
          filter: blur(20px);
          animation: float 20s infinite alternate ease-in-out;
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.5), 
                      10px 10px 30px rgba(255,255,255,0.2);
          transition: margin 0.1s ease-out; /* Smooths the JS mousemove */
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10vw, 20vh) scale(1.2); }
          66% { transform: translate(-5vw, 10vh) scale(0.8); }
          100% { transform: translate(5vw, -10vh) scale(1.1); }
        }

        /* Interface Container */
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 40px;
        }

        .header {
          margin-bottom: 40px;
          text-align: left;
        }

        .brand-id {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          display: block;
        }

        .header h1 {
          font-weight: 800;
          font-size: 3rem;
          line-height: 0.9;
          letter-spacing: -2px;
          margin-left: -4px;
          margin-top: 0;
        }

        /* Form Elements */
        .form-group {
          position: relative;
          margin-bottom: 25px;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .form-group:focus-within {
          transform: translateX(10px);
        }

        .form-group label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .form-group input, .form-group select {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--accent);
          padding: 12px 0;
          font-size: 18px;
          outline: none;
          transition: border-color 0.4s;
        }

        .input-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: var(--mercury);
          transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
          box-shadow: 0 0 15px var(--mercury);
        }

        .form-group input:focus + .input-glow, .form-group select:focus + .input-glow {
          width: 100%;
        }

        /* The Mercury Button */
        .submit-wrap {
          margin-top: 40px;
          position: relative;
          filter: var(--filter-goo);
        }

        .btn-base {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 20px 40px;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          width: 100%;
          position: relative;
          z-index: 2;
          transition: letter-spacing 0.3s;
        }

        .btn-base:hover {
          letter-spacing: 4px;
        }

        .mercury-drop {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: var(--mercury);
          transform: translate(-50%, -50%);
          z-index: 1;
          border-radius: 50px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .submit-wrap:hover .mercury-drop {
          transform: translate(-50%, -50%) scale(1.05, 1.2);
          filter: brightness(1.2);
        }

        /* Utility */
        .footer-nav {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
        }

        .footer-nav a, .footer-nav button {
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-nav a:hover, .footer-nav button:hover {
          color: var(--accent);
        }

        /* SVG Filter Definition Hidden Element */
        .svg-filter-hidden {
          position: absolute;
          width: 0;
          height: 0;
        }
      `}</style>

      <svg className="svg-filter-hidden">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>

      <div className="stage" id="stage">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(el) => { blobRefs.current[index] = el; }}
            className="blob"
            style={{
              width: `${data.size}px`,
              height: `${data.size}px`,
              left: `${data.left}%`,
              top: `${data.top}%`,
              animationDelay: `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>

      <main className="auth-container">
        {showRoleSelector ? (
          <div className="text-left" style={{ animation: 'fadeIn 0.3s ease' }}>
            <span className="brand-id">Acesso Administrativo</span>
            <h1 style={{ fontWeight: 800, fontSize: '2.5rem', lineHeight: 0.9, letterSpacing: '-2px', marginBottom: '20px' }}>
              OLÁ,<br/>{tempProfile?.full_name?.toUpperCase()}
            </h1>
            <p className="text-xs text-[var(--text-dim)] mb-6 leading-relaxed">
              Escolha com qual perfil deseja navegar no sistema nesta sessão:
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {(['Administrador', 'Comercial', 'Produção', 'Financeiro'] as UserRole[]).map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  onClick={() => handleSelectRole(roleOption)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', padding: '16px', textAlign: 'left', fontWeight: 'bold',
                    fontSize: '11px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer',
                    transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <span>Acessar como {roleOption}</span>
                  <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowRoleSelector(false);
                setTempProfile(null);
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-dim)',
                fontSize: '11px', cursor: 'pointer', textDecoration: 'underline',
                width: '100%', textAlign: 'center', fontFamily: "'Space Mono', monospace"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
            >
              Voltar para a tela de login
            </button>
          </div>
        ) : (
          <>
            <header className="header">
              <span className="brand-id">Sistema de Gestão & Produção</span>
              <h1>PORTAL<br/>SAMPPEL</h1>
            </header>

            {error && (
              <div style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '4px',
                color: '#ff6b6b',
                fontSize: '12px',
                textAlign: 'left',
                marginBottom: '20px',
                fontFamily: "'Space Mono', monospace"
              }}>
                {error.toUpperCase()}
              </div>
            )}

            <form autoComplete="off" onSubmit={handleSubmit}>
              {isSignUpMode && (
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input 
                    type="text" 
                    placeholder="EX: PAULO JUNIOR" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <div className="input-glow"></div>
                </div>
              )}

              <div className="form-group">
                <label>Identidade do Usuário (E-mail)</label>
                <input 
                  type="email" 
                  placeholder="EX: SEUEMAIL@SAMPPEL.COM.BR" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="input-glow"></div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Chave de Acesso (Senha)</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0', bottom: '12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-dim)', padding: '4px', zIndex: 12
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <div className="input-glow"></div>
              </div>

              {isSignUpMode && (
                <div className="form-group">
                  <label>Cargo / Função</label>
                  <select 
                    required 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-transparent border-0 border-b border-[rgba(255,255,255,0.1)] text-[var(--accent)] py-3 text-lg outline-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="Administrador" className="bg-[#050505]">Administrador</option>
                    <option value="Comercial" className="bg-[#050505]">Comercial</option>
                    <option value="Produção" className="bg-[#050505]">Produção (Fábrica)</option>
                    <option value="Financeiro" className="bg-[#050505]">Financeiro</option>
                  </select>
                  <div className="input-glow"></div>
                </div>
              )}

              <div className="submit-wrap">
                <div className="mercury-drop"></div>
                <button type="submit" disabled={loading} className="btn-base">
                  {loading ? 'PROCESSANDO...' : isSignUpMode ? 'CRIAR CONTA' : 'ACESSAR O PAINEL'}
                </button>
              </div>
            </form>

            <footer className="footer-nav">
              <a href="#encrypted" onClick={(e) => { e.preventDefault(); alert("Entre em contato com o administrador do sistema para redefinir sua senha."); }}>
                ESQUECEU A SENHA?
              </a>
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setError(null);
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: "'Space Mono', monospace", fontSize: '10px',
                  color: 'var(--text-dim)', transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
              >
                {isSignUpMode ? 'ENTRAR NO PAINEL' : 'CADASTRAR CONTA'}
              </button>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
