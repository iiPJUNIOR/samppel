// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function BlockedPaymentModal(props: any) {
  const {
    RefreshCw,
    blockedPaymentItem,
    blockedPaymentTargetStageId,
    blockedSyncFeedback,
    checkIsDelayed,
    handleCancelBlockedPaymentMove,
    handleConfirmBlockedPaymentMove,
    handleSyncSingleOrder,
    hasOverdueInstallments,
    importing,
    stages
  } = props;

        const targetStg = stages.find(s => s.id === blockedPaymentTargetStageId);
        const targetStageName = targetStg?.name || 'etapa selecionada';
        const isParentPaid = !!blockedPaymentItem.order?.first_payment_date;
        const isOverdue = hasOverdueInstallments(blockedPaymentItem.order_id) || checkIsDelayed(blockedPaymentItem, stages);

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200000,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
              maxWidth: '560px', width: '90%', overflow: 'hidden',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease', color: 'var(--text)'
            }}>
              {/* Cabeçalho de Alerta Destacado */}
              <div style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={24} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    Confirmação Necessária: Pedido Bloqueado
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                    {!isParentPaid && isOverdue
                      ? 'Aguardando Pagamento / Sinal Financeiro E Possui Pendência de Atraso'
                      : !isParentPaid
                        ? 'Atenção: Este pedido está Bloqueado (Aguardando Pagamento/Sinal)'
                        : 'Pedido com Parcelas ou Prazo em Atraso Financeiro'
                    }
                  </p>
                </div>
              </div>

              {/* Conteúdo Explicativo Didático */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

                {/* Informações Resumidas do Card */}
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
                      PV / OP: {blockedPaymentItem.friendly_id || blockedPaymentItem.order?.pv_number || 'Pedido'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {blockedPaymentItem.name || blockedPaymentItem.art_name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Cliente: <strong>{blockedPaymentItem.order?.customer?.name || 'Cliente não informado'}</strong>
                  </div>
                </div>

                {/* Explicação Didática sobre Riscos */}
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '8px',
                  padding: '0.95rem 1.15rem',
                  fontSize: '0.86rem',
                  color: 'var(--text)',
                  lineHeight: '1.55'
                }}>
                  <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    Motivo do Alerta de Confirmação:
                  </strong>
                  {!isParentPaid && isOverdue
                    ? 'Este pedido consta como BLOQUEADO (Aguardando Pagamento/Sinal) E também possui parcelas em atraso no Conta Azul ou prazo de fabricação estourado.'
                    : !isParentPaid
                      ? 'Este pedido está registrado como BLOQUEADO (Aguardando Pagamento/Sinal). A confirmação do primeiro pagamento ou sinal financeiro ainda NÃO foi lançada no Conta Azul. Movimentar este pedido sem a devida liberação do financeiro pode acarretar custos operacionais e de matéria-prima sem garantia de pagamento.'
                      : 'Este pedido possui parcelas em atraso financeiro no Conta Azul ou ultrapassou o prazo limite estimado para produção.'
                  }
                </div>

                {/* Botão de Re-sincronização no Conta Azul para Checagem Rápida */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(var(--primary-rgb), 0.05)',
                  border: '1px solid rgba(var(--primary-rgb), 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text)', flex: 1 }}>
                    <strong>Deseja re-verificar no Conta Azul?</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Caso o sinal já tenha sido pago recentemente no ERP, sincronize para checar a liberação.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={importing}
                    onClick={() => handleSyncSingleOrder(blockedPaymentItem.order_id || blockedPaymentItem.order?.id)}
                    style={{
                      height: '32px',
                      padding: '0.3rem 0.8rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '6px'
                    }}
                  >
                    <RefreshCw size={14} className={importing ? 'spinner' : ''} />
                    <span>{importing ? 'Sincronizando...' : 'Sincronizar Pedido'}</span>
                  </button>
                </div>

                {/* Alerta de resultado da sincronização quando o status permanece mantido */}
                {blockedSyncFeedback && (
                  <div style={{
                    backgroundColor: blockedSyncFeedback.type === 'warning' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                    border: `1px solid ${blockedSyncFeedback.type === 'warning' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                    color: blockedSyncFeedback.type === 'warning' ? '#b45309' : '#15803d',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    lineHeight: '1.45',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.2s ease-in-out'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{blockedSyncFeedback.message}</span>
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  padding: '0.2rem 0',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--text)'
                }}>
                  Deseja confirmar a movimentação deste pedido para <u>{targetStageName}</u> mesmo assim?
                </div>

                {/* Botões Didáticos de Ação */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelBlockedPaymentMove}
                    style={{ padding: '0.65rem 1.15rem', fontSize: '0.85rem', fontWeight: 600, flex: 1 }}
                  >
                    Manter Bloqueado
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleConfirmBlockedPaymentMove}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1.15rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-md, 8px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      flex: 1
                    }}
                  >
                    <span>Confirmar e Mover Pedido</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
}
