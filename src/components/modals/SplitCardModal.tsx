'use client';

import React, { useState, useMemo } from 'react';
import { X, Split, ArrowRight, Layers, AlertCircle, CheckCircle2, Loader2, Package } from 'lucide-react';
import { splitOrderItem } from '@/services/supabase';

interface SplitCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  stages: any[];
  user?: any;
  onSuccess: (result: { card1: any; card2: any }) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SplitCardModal({
  isOpen,
  onClose,
  item,
  stages = [],
  user,
  onSuccess,
  showToast
}: SplitCardModalProps) {
  if (!isOpen || !item) return null;

  const originalPrintRun = Number(item.print_run || 0);
  const totalBoxes = Number(item.boxes_count || 1);

  // Etapa atual do item
  const currentStage = stages.find(s => s.id === item.stage_id) || { name: item.status || 'Etapa Atual', color: '#94a3b8' };

  // Sugestão de etapa destino (busca 'Manuseio' prioritariamente, ou a próxima etapa lógica)
  const defaultTargetStageId = useMemo(() => {
    const manuseioStage = stages.find(s => s.name.toLowerCase() === 'manuseio');
    if (manuseioStage && manuseioStage.id !== item.stage_id) {
      return manuseioStage.id;
    }
    const currentIdx = stages.findIndex(s => s.id === item.stage_id);
    if (currentIdx >= 0 && currentIdx + 1 < stages.length) {
      return stages[currentIdx + 1].id;
    }
    return stages[0]?.id || '';
  }, [stages, item.stage_id]);

  const [advanceQuantity, setAdvanceQuantity] = useState<number>(() => {
    // Sugere metade da tiragem arredondada
    return Math.floor(originalPrintRun / 2);
  });

  const [targetStageId, setTargetStageId] = useState<string>(defaultTargetStageId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Identificador base
  const baseId = (
    item.friendly_id ||
    item.order?.pv_number ||
    item.order?.op_number ||
    'CARD'
  ).trim();

  const part1FriendlyId = `${baseId}.1`;
  const part2FriendlyId = `${baseId}.2`;

  const remainingQuantity = Math.max(0, originalPrintRun - advanceQuantity);

  const part1Boxes = Math.max(1, Math.round(totalBoxes * (advanceQuantity / Math.max(1, originalPrintRun))));
  const part2Boxes = Math.max(1, totalBoxes - part1Boxes);

  const isValidQuantity = advanceQuantity > 0 && advanceQuantity < originalPrintRun;

  const targetStage = stages.find(s => s.id === targetStageId) || { name: 'Etapa Selecionada', color: 'var(--primary)' };

  const handleQuickPercent = (pct: number) => {
    const qty = Math.round((originalPrintRun * pct) / 100);
    if (qty > 0 && qty < originalPrintRun) {
      setAdvanceQuantity(qty);
      setErrorMessage('');
    }
  };

  const handleConfirmSplit = async () => {
    if (!isValidQuantity) {
      setErrorMessage(`A quantidade a avançar deve ser entre 1 e ${(originalPrintRun - 1).toLocaleString('pt-BR')} unidades.`);
      return;
    }

    if (!targetStageId) {
      setErrorMessage('Selecione a etapa de destino para o novo card.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await splitOrderItem({
        originalItem: item,
        advanceQuantity,
        targetStageId,
        targetBoxesCount: part1Boxes,
        remainingBoxesCount: part2Boxes,
        userId: user?.id,
        tenantId: user?.tenant_id || item.tenant_id
      });

      if (res.error) {
        throw res.error;
      }

      if (res.data) {
        if (showToast) {
          showToast(`Card dividido com sucesso em ${part1FriendlyId} e ${part2FriendlyId}!`, 'success');
        }
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao dividir card:', err);
      setErrorMessage(err.message || 'Falha ao processar a divisão do card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(var(--primary-rgb, 59, 130, 246), 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Split size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                Dividir Card (Desmembramento)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Separe a produção realizada para avançar de etapa e mantenha o saldo restante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Dados do Card Original */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    backgroundColor: 'rgba(var(--primary-rgb, 59, 130, 246), 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {baseId}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: currentStage.color ? `${currentStage.color}22` : 'rgba(148, 163, 184, 0.15)',
                    color: currentStage.color || 'var(--text-muted)'
                  }}
                >
                  {currentStage.name}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                {item.name || 'Arte / Produto'}
              </div>
              {item.order?.customer?.name && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Cliente: {item.order.customer.name}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Tiragem Total Atual
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                {originalPrintRun.toLocaleString('pt-BR')} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {totalBoxes} caixas/pacotes
              </div>
            </div>
          </div>

          {/* Controle de Quantidade a Avançar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                Quantidade da 1ª Parte (que vai avançar):
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 6px', height: '22px' }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min={1}
                max={originalPrintRun - 1}
                value={advanceQuantity || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setAdvanceQuantity(isNaN(val) ? 0 : val);
                  setErrorMessage('');
                }}
                className="form-input"
                style={{ fontSize: '1rem', fontWeight: 700, padding: '0.5rem 0.75rem' }}
                placeholder="Ex: 60000"
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                unidades
              </span>
            </div>
          </div>

          {/* Seletor de Etapa de Destino para a 1ª Parte */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
              Etapa de destino para a 1ª Parte:
            </label>
            <select
              value={targetStageId}
              onChange={(e) => setTargetStageId(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            >
              {stages.map((stg) => (
                <option key={stg.id} value={stg.id}>
                  {stg.name} {stg.id === item.stage_id ? '(Manter na mesma etapa)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Prévia Lado a Lado dos Novos Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Resultado do Desmembramento:
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {/* Card 1 - Avança */}
              <div
                style={{
                  border: '1px solid var(--primary)',
                  backgroundColor: 'rgba(var(--primary-rgb, 59, 130, 246), 0.04)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      backgroundColor: 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {part1FriendlyId}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Avança
                  </span>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                  {advanceQuantity.toLocaleString('pt-BR')} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowRight size={13} style={{ color: 'var(--primary)' }} />
                  <span>Destino: <strong>{targetStage.name}</strong></span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Package size={12} />
                  <span>~{part1Boxes} caixas/pacotes</span>
                </div>
              </div>

              {/* Card 2 - Permanece */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      backgroundColor: 'rgba(148, 163, 184, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {part2FriendlyId}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Saldo Restante
                  </span>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                  {remainingQuantity.toLocaleString('pt-BR')} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Permanece em: <strong>{currentStage.name}</strong></span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Package size={12} />
                  <span>~{part2Boxes} caixas/pacotes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro se houver */}
          {errorMessage && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Rodapé de Ações */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.6rem',
            backgroundColor: 'var(--background)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmSplit}
            disabled={!isValidQuantity || isSubmitting}
            className="btn btn-primary"
            style={{
              fontSize: '0.82rem',
              padding: '0.45rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Dividindo...</span>
              </>
            ) : (
              <>
                <Split size={14} />
                <span>Confirmar Divisão</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
