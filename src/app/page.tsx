'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

interface InputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

const AppInput = (props: InputProps) => {
  const { label, placeholder, icon, type = 'text', ...rest } = props;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="w-full min-w-[200px] relative text-left">
      {label && (
        <label className="block mb-2 text-sm text-[var(--color-text-primary)] font-medium">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          type={type}
          className="peer relative z-10 border-0 h-12 w-full rounded-md bg-[rgba(22,26,29,0.55)] backdrop-blur-md px-4 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[rgba(16,18,20,0.75)] placeholder:font-medium text-[var(--color-text-primary)] text-sm"
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[1.5px] z-20 rounded-t-md overflow-hidden"
              style={{
                background: `radial-gradient(35px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[1.5px] z-20 rounded-b-md overflow-hidden"
              style={{
                background: `radial-gradient(35px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

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

  // Glow cursor states
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

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
    <div className="min-h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden flex flex-row h-[600px] relative z-10">
        {/* Left Section (Form Container) */}
        <div
          className="w-full lg:w-1/2 px-8 lg:px-12 flex flex-col justify-center h-full relative overflow-hidden bg-[var(--color-surface)]"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Animated glow */}
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl transition-opacity duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />

          {showRoleSelector ? (
            <div className="w-full text-left z-10 py-4 flex flex-col justify-center h-full">
              <h2 className="text-xl font-bold mb-2 text-[var(--color-heading)]">
                Olá, {tempProfile?.full_name}!
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                Você possui acesso administrativo. Escolha com qual perfil deseja navegar no sistema nesta sessão:
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {(['Administrador', 'Comercial', 'Produção', 'Financeiro'] as UserRole[]).map((roleOption) => (
                  <button
                    key={roleOption}
                    onClick={() => handleSelectRole(roleOption)}
                    className="flex justify-between items-center w-full p-3.5 text-left font-semibold text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-muted-surface)] text-[var(--color-text-primary)] cursor-pointer transition-all duration-200"
                  >
                    <span>Acessar como {roleOption}</span>
                    <ArrowRight size={14} className="text-[var(--color-text-secondary)]" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRoleSelector(false);
                  setTempProfile(null);
                }}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs underline text-center w-full cursor-pointer"
              >
                Voltar para a tela de login
              </button>
            </div>
          ) : (
            <div className="form-container h-full z-10 flex flex-col justify-center">
              <form className="text-center py-6 grid gap-4 w-full" onSubmit={handleSubmit}>
                <div className="grid gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#FF4757]">
                    {isSignUpMode ? 'Criar Conta' : 'Entrar no Painel'}
                  </h1>
                  
                  {/* Conta Azul Login Shortcut */}
                  <div className="social-container my-1">
                    <a
                      href="https://login.contaazul.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-white/5 text-xs text-[var(--color-text-primary)] rounded-md transition-all duration-200 cursor-pointer font-medium w-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00A4E4]">
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                      <span>Ir para o Login do Conta Azul</span>
                    </a>
                  </div>
                  <span className="text-[var(--color-text-secondary)] text-xs font-light">ou acesse o portal da fábrica</span>
                </div>

                {error && (
                  <div className="w-full p-2.5 border border-red-500/30 bg-red-500/10 text-red-400 text-xs rounded-md text-left">
                    {error}
                  </div>
                )}

                <div className="grid gap-3 items-center">
                  {isSignUpMode && (
                    <AppInput 
                      label="Nome Completo *" 
                      placeholder="Ex: Paulo Junior" 
                      type="text"
                      value={fullName}
                      onChange={(e: any) => setFullName(e.target.value)}
                      required
                    />
                  )}

                  <AppInput 
                    label="E-mail *" 
                    placeholder="Ex: seuemail@samppel.com.br" 
                    type="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    required
                  />
                  
                  <AppInput 
                    label="Senha *" 
                    placeholder="Sua senha" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                    icon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {isSignUpMode && (
                    <div className="w-full min-w-[200px] text-left">
                      <label className="block mb-2 text-sm text-[var(--color-text-primary)] font-medium">
                        Cargo / Função *
                      </label>
                      <select 
                        className="peer relative z-10 border-2 border-[var(--color-border)] h-12 w-full rounded-md bg-[rgba(22,26,29,0.55)] backdrop-blur-md px-4 font-thin outline-none drop-shadow-sm transition-all focus:bg-[rgba(16,18,20,0.75)] text-[var(--color-text-primary)] text-sm cursor-pointer"
                        required 
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                      >
                        <option value="Administrador" className="bg-[var(--color-surface)]">Administrador</option>
                        <option value="Comercial" className="bg-[var(--color-surface)]">Comercial</option>
                        <option value="Produção" className="bg-[var(--color-surface)]">Produção (Fábrica)</option>
                        <option value="Financeiro" className="bg-[var(--color-surface)]">Financeiro</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-6 bg-transparent hover:text-[#ff5b6b] text-[#FF4757] font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <span>{loading ? 'Carregando...' : isSignUpMode ? 'Cadastrar' : 'Entrar'}</span>
                  </button>
                  <a href="#" className="font-light text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-center mt-1">
                    Esqueceu sua senha?
                  </a>
                </div>

                {/* Toggle Mode */}
                <div className="mt-4 text-xs text-[var(--color-text-secondary)] text-center">
                  <span>{isSignUpMode ? 'Já possui uma conta?' : 'Ainda não tem acesso?'}</span>{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(!isSignUpMode);
                      setError(null);
                    }}
                    className="text-[var(--color-text-primary)] hover:underline font-semibold cursor-pointer"
                  >
                    {isSignUpMode ? 'Entrar no painel' : 'Cadastre-se aqui'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Section (Brand Logo Banner) */}
        <div className="hidden lg:flex w-1/2 right h-full bg-[#2C333A] items-center justify-center border-l border-[var(--color-border)] p-12">
          <Image
            src="/logo.png"
            width={350}
            height={200}
            alt="Samppel Embalagens Logo"
            className="max-w-[80%] object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
