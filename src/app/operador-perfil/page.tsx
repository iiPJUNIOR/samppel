'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Users, ShieldAlert, CheckCircle2, RefreshCw, Mail, Lock } from 'lucide-react';

export default function OperadorPerfilPage() {
  const { user } = useAuth();
  
  // States para os campos editáveis
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Validação atual obrigatória para salvar
  const [currentPassword, setCurrentPassword] = useState('');
  
  // States comuns
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Inicializa o nome quando o usuário carrega
  useEffect(() => {
    if (user) {
      setNewName(user.full_name || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Por favor, insira sua senha atual para autorizar as alterações.');
      return;
    }

    if (user.force_password_change) {
      if (!newPassword || !newPin) {
        setError('Como solicitado pelo seu administrador, você deve obrigatoriamente definir uma Nova Senha e um Novo PIN.');
        return;
      }
    }

    if (newPin && !/^\d{4,6}$/.test(newPin)) {
      setError('O novo PIN deve conter entre 4 e 6 dígitos numéricos.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/operators/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: user.id,
          currentCredential: currentPassword,
          authMethod: 'PASSWORD', // Autenticação via senha padrão do usuário
          name: newName,
          newPin: newPin || undefined,
          newPassword: newPassword || undefined,
          tenantId: user.tenant_id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar os dados cadastrais.');
      }

      setSuccess('Seus dados foram atualizados com sucesso!');
      setCurrentPassword('');
      setNewPin('');
      setNewPassword('');
      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dados de Perfil do Operador</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Mantenha seus dados e credenciais individuais de fábrica sempre atualizados.
        </p>
      </header>

      {user.force_password_change && !success && (
        <div style={{
          backgroundColor: 'hsla(38, 92.1%, 50%, 0.1)',
          color: 'var(--warning)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          fontSize: '0.875rem',
          border: '1px solid hsla(38, 92.1%, 50%, 0.25)'
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0, color: 'var(--warning)', marginTop: '0.125rem' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>Troca de Credenciais Obrigatória!</strong>
            Para restabelecer sua conta e voltar a movimentar na fábrica, você deve obrigatoriamente preencher os campos <strong>"Novo PIN de Fábrica"</strong> e <strong>"Nova Senha"</strong> abaixo.
          </div>
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          fontSize: '0.875rem',
          fontWeight: 600,
          border: '1px solid var(--success)'
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
          color: 'var(--danger)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          fontSize: '0.875rem',
          border: '1px solid hsla(0, 84.2%, 60.2%, 0.2)'
        }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Users size={18} style={{ color: 'var(--primary)' }} />
          Configurações de Cadastro
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* E-MAIL (DESABILITADO) */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <Mail size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Endereço de E-mail (Não alterável)</span>
            </label>
            <input 
              type="email"
              className="form-input"
              disabled
              value={user.email || ''}
              style={{ width: '100%', backgroundColor: 'var(--surface-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          {/* NOME COMPLETO */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <Users size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Nome Completo *</span>
            </label>
            <input 
              type="text"
              className="form-input"
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: João da Silva"
              style={{ width: '100%' }}
            />
          </div>

          {/* NOVO PIN */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <KeyRound size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Novo PIN de Fábrica (Vazio para não alterar)</span>
            </label>
            <input 
              type="password"
              pattern="\d*"
              inputMode="numeric"
              className="form-input"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              placeholder="Novo PIN numérico de 4 a 6 dígitos..."
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Utilizado para liberar transações rápidas no terminal da fábrica.
            </span>
          </div>

          {/* NOVA SENHA */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <Lock size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Nova Senha (Vazio para não alterar)</span>
            </label>
            <input 
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres..."
              style={{ width: '100%' }}
            />
          </div>

          {/* AVISO DE RESPONSABILIDADE E SEGURANÇA */}
          <div style={{
            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.05)',
            border: '1px solid hsla(0, 84.2%, 60.2%, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            marginTop: '0.5rem'
          }}>
            <ShieldAlert size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '0.125rem' }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: '1.4' }}>
              <strong style={{ display: 'block', color: 'var(--danger)', marginBottom: '0.25rem' }}>Aviso de Segurança Importante:</strong>
              Não compartilhe sua senha ou PIN com ninguém! Todas as movimentações registradas sob seu usuário na fábrica são de sua inteira responsabilidade para fins de auditoria.
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.5rem 0' }} />

          {/* SENHA ATUAL PARA CONFIRMAR */}
          <div className="form-group" style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <label className="form-label" style={{ fontWeight: 700, display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <Lock size={15} style={{ color: 'var(--primary)' }} />
              <span>Confirmar com Senha Atual *</span>
            </label>
            <input 
              type="password"
              className="form-input"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual para salvar..."
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              width: '100%', 
              marginTop: '0.5rem',
              backgroundColor: success ? 'var(--success)' : loading ? 'var(--border)' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }} 
            disabled={loading}
          >
            {loading ? (
              <RefreshCw size={16} className="spinner" />
            ) : success ? (
              <CheckCircle2 size={16} />
            ) : null}
            <span>{success ? 'Atualizado' : loading ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
