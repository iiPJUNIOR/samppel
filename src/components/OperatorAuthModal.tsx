'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Key, AlertCircle } from 'lucide-react';

interface OperatorAuthModalProps {
  isOpen: boolean;
  tenantId: string;
  onSuccess: (operatorId: string, operatorName: string) => void;
  onClose: () => void;
  actionDescription?: string;
  targetStageId?: string;
  currentStageId?: string;
}

export default function OperatorAuthModal({ 
  isOpen, 
  tenantId, 
  onSuccess, 
  onClose,
  actionDescription = 'Movimentação física de estoque',
  targetStageId,
  currentStageId
}: OperatorAuthModalProps) {
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOp, setSelectedOp] = useState('');
  const [authMethod, setAuthMethod] = useState<'PIN' | 'PASSWORD'>('PIN');
  const [credential, setCredential] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOps, setLoadingOps] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setCredential('');
      setSelectedOp('');
      setLoadingOps(true);
      
      // Carrega operadores ativos do tenant correspondente
      fetch(`/api/operators?tenantId=${tenantId}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.data) {
            // Filtra apenas operadores ativos
            setOperators(resData.data.filter((op: any) => op.status === 'ATIVO'));
          } else if (resData.error) {
            setError(resData.error);
          }
        })
        .catch(err => {
          console.error('Erro ao buscar operadores:', err);
          setError('Erro ao carregar lista de operadores.');
        })
        .finally(() => setLoadingOps(false));
    }
  }, [isOpen, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOp) {
      setError('Por favor, selecione seu nome.');
      return;
    }
    if (!credential) {
      setError('Por favor, insira suas credenciais.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/operators/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: selectedOp,
          authMethod,
          credential,
          targetStageId,
          currentStageId,
          tenantId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha na autorização do operador.');
      }

      // Sucesso na liberação secundária
      const matchedOp = operators.find(o => o.id === selectedOp);
      onSuccess(selectedOp, matchedOp ? matchedOp.name : 'Operador');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="modal-content card" style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Validação na Fábrica</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.125rem 0 0 0' }}>
              Ação: <strong style={{ color: 'var(--text)' }}>{actionDescription}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* SELEÇÃO DO OPERADOR */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontWeight: 600 }}>
              <Users size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Nome do Operador *</span>
            </label>
            {loadingOps ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>Carregando lista de operadores...</div>
            ) : (
              <select 
                className="form-select" 
                value={selectedOp} 
                onChange={e => setSelectedOp(e.target.value)} 
                required
                style={{ width: '100%' }}
              >
                <option value="">Selecione seu nome da lista...</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>
            )}
            {operators.length === 0 && !loadingOps && (
              <span style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>
                ⚠️ Nenhum operador de produção ativo cadastrado para esta unidade.
              </span>
            )}
          </div>

          {/* MÉTODOS DE CREDENCIAL */}
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="authMethod" 
                checked={authMethod === 'PIN'} 
                onChange={() => { setAuthMethod('PIN'); setCredential(''); setError(''); }}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>PIN de Acesso</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="authMethod" 
                checked={authMethod === 'PASSWORD'} 
                onChange={() => { setAuthMethod('PASSWORD'); setCredential(''); setError(''); }}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Senha de Login</span>
            </label>
          </div>

          {/* CREDENCIAL */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontWeight: 600 }}>
              <Key size={15} style={{ color: 'var(--text-muted)' }} />
              <span>{authMethod === 'PIN' ? 'PIN Numérico (4 a 6 dígitos) *' : 'Senha de Produção *'}</span>
            </label>
            <input 
              type={authMethod === 'PIN' ? 'password' : 'password'} 
              pattern={authMethod === 'PIN' ? '\\d*' : undefined}
              inputMode={authMethod === 'PIN' ? 'numeric' : undefined}
              className="form-input"
              value={credential}
              onChange={e => setCredential(e.target.value)}
              required
              placeholder={authMethod === 'PIN' ? 'Digite seu PIN de fábrica...' : 'Digite sua senha...' }
              style={{ width: '100%' }}
            />
          </div>

          {/* EXIBIÇÃO DE ERRO */}
          {error && (
            <div style={{ 
              display: 'flex', 
              flexDirection: error === 'FORCE_PASSWORD_CHANGE' ? 'column' : 'row',
              gap: '0.75rem', 
              backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)', 
              color: 'var(--danger)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.85rem',
              alignItems: error === 'FORCE_PASSWORD_CHANGE' ? 'flex-start' : 'center',
              border: '1px solid hsla(0, 84.2%, 60.2%, 0.3)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 700 }}>
                  {error === 'FORCE_PASSWORD_CHANGE' ? 'Troca de Senha Obrigatória!' : 'Erro na Autenticação'}
                </span>
              </div>
              {error === 'FORCE_PASSWORD_CHANGE' ? (
                <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--text)' }}>
                  Seu administrador solicitou uma troca de senha obrigatória.
                  <br /><br />
                  Por favor, acesse o sistema com seu e-mail individual em outro dispositivo ou aba e redefina sua senha e PIN.
                  <br /><br />
                  Caso não se lembre da sua senha, acesse <a href="https://portalsamppel.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}>portalsamppel.vercel.app</a> e clique em <strong>"Esqueci minha senha"</strong> para receber as instruções de recuperação por e-mail.
                </div>
              ) : (
                <span>{error}</span>
              )}
            </div>
          )}

          {/* BOTÕES */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1, display: 'flex', justifySelf: 'center', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
              disabled={loading || operators.length === 0}
            >
              <span>{loading ? 'Validando...' : 'Liberar Operação'}</span>
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
