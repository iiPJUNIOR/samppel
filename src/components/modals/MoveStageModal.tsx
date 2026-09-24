// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, ArrowLeft, Check, AlertCircle, 
  Key, Lock, Loader2, Users 
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/apiFetch';

export function MoveStageModal(props: any) {
  const {
    itemToMoveStage,
    moveOrderItemToStage,
    setIsMoveStageModalOpen,
    setItemToMoveStage,
    stages,
    tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    user
  } = props;

  // Define se o usuario atual pertence a conta compartilhada da Fabrica/Producao
  const isFactoryUser = Boolean(user?.role === 'Fábrica' || user?.role === 'Produção' || user?.is_factory_account);

  const [step, setStep] = useState<'STAGE' | 'PIN'>('STAGE');
  const [selectedTargetStage, setSelectedTargetStage] = useState<any>(null);

  // Estados de movimentacao direta (para usuario com login proprio)
  const [isMovingDirect, setIsMovingDirect] = useState(false);
  const [movingStageId, setMovingStageId] = useState<string | null>(null);

  // Estados de autenticacao do operador por PIN (exclusivo para perfil Fabrica)
  const [operators, setOperators] = useState<any[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Carrega operadores ativos do tenant apenas se for conta de Fabrica
  useEffect(() => {
    if (!isFactoryUser) return;

    let isMounted = true;
    setLoadingOperators(true);
    authenticatedFetch(`/api/operators?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(resData => {
        if (!isMounted) return;
        if (resData.data) {
          const activeOps = resData.data.filter((op: any) => op.status === 'ATIVO');
          setOperators(activeOps);
          // Se o usuario logado corresponder a um operador na lista, ja pre-seleciona
          if (user?.id) {
            const matched = activeOps.find((op: any) => op.id === user.id);
            if (matched) {
              setSelectedOperatorId(matched.id);
            } else if (activeOps.length > 0) {
              setSelectedOperatorId(activeOps[0].id);
            }
          } else if (activeOps.length > 0) {
            setSelectedOperatorId(activeOps[0].id);
          }
        }
      })
      .catch(err => {
        console.error('Erro ao buscar operadores:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingOperators(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantId, user?.id, isFactoryUser]);

  if (!itemToMoveStage) return null;

  const handleClose = () => {
    setIsMoveStageModalOpen(false);
    setItemToMoveStage(null);
  };

  const handleSelectStage = async (stg: any) => {
    if (isFactoryUser) {
      // Conta de Fabrica/Tablet: exige selecao de operador e PIN
      setSelectedTargetStage(stg);
      setErrorMsg('');
      setPin('');
      setStep('PIN');
    } else {
      // Usuario autenticado individual (Admin, Supervisao, Comercial, Vendedor, etc.):
      // Move direto sem pedir PIN, utilizando o proprio login ativo
      try {
        setIsMovingDirect(true);
        setMovingStageId(stg.id);
        const targetItem = itemToMoveStage;
        const targetStageId = stg.id;
        handleClose();
        await moveOrderItemToStage(
          targetItem, 
          targetStageId, 
          user?.id || null, 
          user?.full_name || user?.email || 'Usuario'
        );
      } catch (err) {
        console.error('Erro ao mover pedido diretamente:', err);
      } finally {
        setIsMovingDirect(false);
        setMovingStageId(null);
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACKSPACE') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 8) {
      setPin(prev => prev + val);
    }
  };

  const handleConfirmMoveWithPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTargetStage) return;

    if (!selectedOperatorId) {
      setErrorMsg('Por favor, selecione o operador responsavel.');
      return;
    }

    if (!pin || pin.trim().length === 0) {
      setErrorMsg('Por favor, digite o PIN numerico.');
      return;
    }

    setErrorMsg('');
    setIsAuthorizing(true);

    try {
      const res = await authenticatedFetch('/api/operators/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: selectedOperatorId,
          authMethod: 'PIN',
          credential: pin.trim(),
          targetStageId: selectedTargetStage.id,
          currentStageId: itemToMoveStage.stage_id,
          tenantId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN incorreto ou nao autorizado.');
      }

      // Sucesso na validacao de credenciais do operador
      const op = operators.find(o => o.id === selectedOperatorId);
      const opName = op ? op.name : (user?.full_name || 'Operador');

      const targetItem = itemToMoveStage;
      const targetStageId = selectedTargetStage.id;

      handleClose();
      await moveOrderItemToStage(targetItem, targetStageId, selectedOperatorId, opName);
    } catch (err: any) {
      console.error('Erro na autenticacao por PIN:', err);
      setErrorMsg(err.message || 'Falha ao validar PIN.');
      setPin('');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const currentStage = stages.find(s => s.id === itemToMoveStage.stage_id) || stages[0];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !isAuthorizing && !isMovingDirect) handleClose(); }}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200000, padding: '0.75rem',
        backdropFilter: 'blur(5px)'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-premium)',
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease'
      }}>
        {/* Cabecalho */}
        <div style={{
          padding: '0.85rem 1.15rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(var(--primary-rgb), 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {step === 'PIN' ? (
              <button
                type="button"
                onClick={() => { setStep('STAGE'); setErrorMsg(''); setPin(''); }}
                disabled={isAuthorizing}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', display: 'flex', alignItems: 'center',
                  padding: '2px', marginRight: '4px'
                }}
                title="Voltar para selecao de etapa"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <ArrowRightLeft size={17} style={{ color: 'var(--primary)' }} />
            )}
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
              {step === 'STAGE' ? 'Mover Pedido de Etapa' : 'Confirmacao de Operador (PIN)'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isAuthorizing || isMovingDirect}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* Resumo do Pedido / Item */}
        <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                {itemToMoveStage.friendly_id || itemToMoveStage.order?.pv_number || '---'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {itemToMoveStage.order?.customer?.name || 'Cliente'} · {itemToMoveStage.name || 'Item'}
              </div>
            </div>
            {currentStage && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: currentStage.color || 'var(--text)',
                backgroundColor: `${currentStage.color || '#3b82f6'}18`,
                border: `1px solid ${currentStage.color || '#3b82f6'}40`,
                padding: '2px 8px',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}>
                Etapa Atual: {currentStage.name}
              </span>
            )}
          </div>

          {step === 'PIN' && selectedTargetStage && (
            <div style={{
              marginTop: '0.65rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: `${selectedTargetStage.color}15`,
              border: `1px solid ${selectedTargetStage.color}40`,
              borderRadius: 'var(--radius-sm, 6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Movendo para:
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedTargetStage.color }}>
                {selectedTargetStage.name}
              </span>
            </div>
          )}
        </div>

        {/* PASSO 1: SELECAO DA ETAPA DE DESTINO */}
        {step === 'STAGE' && (
          <div style={{ padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isFactoryUser 
                ? 'Selecione a etapa de destino (sera solicitado o PIN):' 
                : 'Selecione a etapa para mover o pedido:'}
            </span>

            {stages.map((stg: any) => {
              const isCurrent = itemToMoveStage.stage_id === stg.id || (!itemToMoveStage.stage_id && stg.id === stages[0]?.id);
              const isTargetMoving = movingStageId === stg.id;

              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => handleSelectStage(stg)}
                  disabled={isCurrent || isMovingDirect}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.95rem',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: isCurrent ? `2px solid ${stg.color}` : '1px solid var(--border)',
                    backgroundColor: isCurrent ? `${stg.color}15` : 'var(--surface)',
                    cursor: isCurrent || isMovingDirect ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    minHeight: '44px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: stg.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: isCurrent ? 800 : 600, color: 'var(--text)' }}>
                      {stg.name}
                    </span>
                  </div>
                  {isCurrent ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: stg.color, backgroundColor: `${stg.color}25`, padding: '2px 8px', borderRadius: '99px' }}>
                      Etapa Atual
                    </span>
                  ) : isTargetMoving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Loader2 size={13} className="spin" />
                      <span>Movendo...</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {isFactoryUser ? 'Escolher >' : 'Mover para ca'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* PASSO 2: AUTENTICACAO OBRIGATORIA POR PIN (APENAS PARA PERFIL FABRICA) */}
        {step === 'PIN' && isFactoryUser && (
          <form onSubmit={handleConfirmMoveWithPin} style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 0.85rem', backgroundColor: 'var(--danger-bg, #fee2e2)',
                color: 'var(--danger, #dc2626)', border: '1px solid var(--danger, #dc2626)',
                borderRadius: 'var(--radius-sm, 6px)', fontSize: '0.8rem', fontWeight: 600
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selecao do Operador */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={14} />
                <span>Operador Responsavel</span>
              </label>
              <select
                className="form-select"
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                disabled={isAuthorizing || loadingOperators}
                style={{ height: '40px', fontSize: '0.85rem' }}
                required
              >
                {loadingOperators && <option value="">Carregando operadores...</option>}
                {!loadingOperators && operators.length === 0 && <option value="">Nenhum operador encontrado</option>}
                {operators.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.name} {op.role ? `(${op.role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo de PIN */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Key size={14} />
                <span>PIN de Seguranca (4 a 6 digitos)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  className="form-input"
                  placeholder="Digite seu PIN"
                  value={pin}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setPin(cleaned);
                  }}
                  autoFocus
                  disabled={isAuthorizing}
                  style={{
                    height: '42px',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '0.35em',
                    fontWeight: 700
                  }}
                  required
                />
              </div>
            </div>

            {/* Teclado Numerico Virtual para Tablets / Telas Touch */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.45rem',
              marginTop: '0.25rem'
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Limpar', '0', 'Apagar'].map((key) => {
                const isClear = key === 'Limpar';
                const isBackspace = key === 'Apagar';
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isAuthorizing}
                    onClick={() => {
                      if (isClear) handleKeypadPress('CLEAR');
                      else if (isBackspace) handleKeypadPress('BACKSPACE');
                      else handleKeypadPress(key);
                    }}
                    style={{
                      height: '42px',
                      fontSize: isClear || isBackspace ? '0.78rem' : '1.1rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm, 6px)',
                      border: '1px solid var(--border)',
                      backgroundColor: isClear || isBackspace ? 'rgba(var(--primary-rgb), 0.06)' : 'var(--surface)',
                      color: isClear ? 'var(--danger)' : 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none'
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </form>
        )}

        {/* Rodape com Acoes */}
        <div style={{
          padding: '0.75rem 1.15rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--background)'
        }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isAuthorizing || isMovingDirect}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
          >
            Cancelar
          </button>

          {step === 'PIN' && isFactoryUser && (
            <button
              type="button"
              onClick={handleConfirmMoveWithPin}
              disabled={isAuthorizing || !pin || !selectedOperatorId}
              className="btn btn-primary"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700
              }}
            >
              {isAuthorizing ? (
                <>
                  <Loader2 size={15} className="spin" />
                  <span>Validando PIN...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Confirmar e Mover</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
