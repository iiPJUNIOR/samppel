'use client';

import React, { useState, useEffect } from 'react';
import { X, Undo2, ArrowRight, GitMerge, AlertCircle, CheckCircle2, Loader2, Package } from 'lucide-react';
import { getCardSplitInfo, revertSplitOrderItem, SplitInfoResult } from '@/services/supabase';

interface RevertSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  stages: any[];
  user?: any;
  onSuccess: (result: { reunifiedCard: any; deletedCardId: string }) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function RevertSplitModal({
  isOpen,
  onClose,
  item,
  stages = [],
  user,
  onSuccess,
  showToast
}: RevertSplitModalProps) {
  const [loading, setLoading] = useState(true);
  const [splitInfo, setSplitInfo] = useState<SplitInfoResult | null>(null);
  const [targetStageId, setTargetStageId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !item?.id) return;

    let isMounted = true;
    setLoading(true);
    setErrorMessage('');

    async function loadInfo() {
      try {
        const res = await getCardSplitInfo(item.id, user?.tenant_id || item.tenant_id);
        if (!isMounted) return;

        if (res.error) {
          setErrorMessage(res.error.message || 'Erro ao carregar dados do desmembramento.');
          setSplitInfo(null);
        } else if (res.data) {
          setSplitInfo(res.data);
          // Sugere a etapa do card pai como padrão
          const parentStage = res.data.parentItem?.stage_id || item.stage_id;
          setTargetStageId(parentStage);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Falha ao buscar relacionamento do card.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInfo();

    return () => {
      isMounted = false;
    };
  }, [isOpen, item?.id, user?.tenant_id, item?.tenant_id]);

  if (!isOpen || !item) return null;

  const parent = splitInfo?.parentItem;
  const child = splitInfo?.partnerItem;

  const parentStage = stages.find(s => s.id === parent?.stage_id) || { name: parent?.status || 'Etapa Atual', color: '#94a3b8' };
  const childStage = stages.find(s => s.id === child?.stage_id) || { name: child?.status || 'Etapa Atual', color: '#3b82f6' };
  const selectedStage = stages.find(s => s.id === targetStageId) || parentStage;

  const parentQty = Number(parent?.print_run || 0);
  const childQty = Number(child?.print_run || 0);
  const totalQty = splitInfo?.totalPrintRun ?? (parentQty + childQty);

  const parentBoxes = Number(parent?.boxes_count || 1);
  const childBoxes = Number(child?.boxes_count || 0);
  const totalBoxes = splitInfo?.totalBoxes ?? (parentBoxes + childBoxes);

  const restoredFriendlyId = splitInfo?.suggestedFriendlyId || (parent?.friendly_id || '').replace(/\.2$/, '') || item.friendly_id;

  const handleConfirmRevert = async () => {
    if (!splitInfo?.canRevert) {
      setErrorMessage(splitInfo?.reasonCannotRevert || 'Este card não pode ser reunificado no momento.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await revertSplitOrderItem({
        currentItemId: item.id,
        partnerItemId: child?.id,
        targetStageId,
        userId: user?.id,
        tenantId: user?.tenant_id || item.tenant_id
      });

      if (res.error) {
        throw res.error;
      }

      if (res.data) {
        if (showToast) {
          showToast(`Desmembramento revertido com sucesso! Card reunificado em ${restoredFriendlyId} com ${totalQty.toLocaleString('pt-BR')} un.`, 'success');
        }
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao reverter desmembramento:', err);
      setErrorMessage(err.message || 'Falha ao processar a reversão da divisão.');
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
                backgroundColor: 'rgba(245, 158, 11, 0.14)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Undo2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                Reverter Desmembramento (Reunificar Card)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Reunifique as partes divididas de volta em um único card de produção com a tiragem integral.
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
          
          {loading ? (
            <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Localizando partes divididas deste card...</span>
            </div>
          ) : !splitInfo?.isSplit ? (
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <AlertCircle size={24} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                Nenhuma divisão ativa encontrada para este card
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
                Este card não possui registro de fracionamento ou o card correspondente já foi finalizado.
              </p>
            </div>
          ) : (
            <>
              {/* Comparativo Lado a Lado das duas metades */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cards Atuais da Divisão:
                </span>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  {/* Card Pai */}
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
                          backgroundColor: 'rgba(148, 163, 184, 0.18)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {parent?.friendly_id || 'Card Original'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Parte Remanescente (.2)
                      </span>
                    </div>

                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                      {parentQty.toLocaleString('pt-BR')} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Etapa:</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: parentStage.color ? `${parentStage.color}22` : 'rgba(148, 163, 184, 0.15)',
                          color: parentStage.color || 'var(--text-muted)'
                        }}
                      >
                        {parentStage.name}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={12} />
                      <span>{parentBoxes} caixas/pacotes</span>
                    </div>
                  </div>

                  {/* Card Filho */}
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
                        {child?.friendly_id || 'Card Desmembrado'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                        Parte Desmembrada (.1)
                      </span>
                    </div>

                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                      {childQty.toLocaleString('pt-BR')} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Etapa:</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: childStage.color ? `${childStage.color}22` : 'rgba(148, 163, 184, 0.15)',
                          color: childStage.color || 'var(--text-muted)'
                        }}
                      >
                        {childStage.name}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={12} />
                      <span>{childBoxes} caixas/pacotes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prévia do Card Reunificado Consolidado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Resultado Após a Reunificação:
                </span>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 'var(--radius-md, 8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          backgroundColor: '#f59e0b',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <GitMerge size={14} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                          {restoredFriendlyId}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Identificador original recomposto (sufixo de divisão removido)
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                        {totalQty.toLocaleString('pt-BR')} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Total somado: {totalBoxes} caixas/pacotes
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Etapa onde o card consolidado ficará */}
                  <div style={{ borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '0.65rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '0.35rem' }}>
                      Etapa final para o card reunificado:
                    </label>
                    <select
                      value={targetStageId}
                      onChange={(e) => setTargetStageId(e.target.value)}
                      className="form-select"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem', width: '100%' }}
                    >
                      {stages.map((stg) => (
                        <option key={stg.id} value={stg.id}>
                          {stg.name} {stg.id === parent?.stage_id ? '(Etapa atual do Card Pai - Recomendado)' : (stg.id === child?.stage_id ? '(Etapa atual do Card Filho)' : '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Explicação Didática do Procedimento */}
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.45'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                  Como funciona esta operação:
                </div>
                O card <strong>{child?.friendly_id}</strong> será cancelado e excluído do sistema. As <strong>{childQty.toLocaleString('pt-BR')} un</strong> que estavam nele serão somadas de volta ao card <strong>{restoredFriendlyId}</strong>, recompondo a tiragem original de <strong>{totalQty.toLocaleString('pt-BR')} un</strong> na etapa <strong>{selectedStage?.name}</strong>.
              </div>

              {/* Alerta de bloqueio ou erro se houver */}
              {!splitInfo.canRevert && splitInfo.reasonCannotRevert && (
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
                  <span>{splitInfo.reasonCannotRevert}</span>
                </div>
              )}

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
            </>
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
            onClick={handleConfirmRevert}
            disabled={loading || !splitInfo?.isSplit || !splitInfo?.canRevert || isSubmitting}
            className="btn btn-primary"
            style={{
              fontSize: '0.82rem',
              padding: '0.45rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              backgroundColor: '#d97706',
              borderColor: '#d97706'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Reunificando...</span>
              </>
            ) : (
              <>
                <GitMerge size={14} />
                <span>Confirmar Reunificação</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
