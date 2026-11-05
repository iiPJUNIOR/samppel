// @ts-nocheck

import React from 'react';
import { X } from 'lucide-react';

export function AdjustmentModal(props: any) {
  const {
    adjustmentAction,
    adjustmentItem,
    adjustmentNotes,
    handleAdjustmentSubmit,
    loading,
    producedQuantity,
    resetAllBypasses,
    setAdjustmentAction,
    setAdjustmentNotes,
    setIsAdjustmentModalOpen,
    setProducedQuantity
  } = props;

  const isCliche = `${adjustmentItem?.name || ''} ${adjustmentItem?.product?.name || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('cliche');

  const orderedQty = adjustmentItem?.print_run || 0;
  const diffQty = isCliche ? 0 : producedQuantity - orderedQty;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: '1rem',
      backdropFilter: 'blur(3px)'
    }}>
      <div className="modal-scroll" style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
            Conferência de Sobras & Faltas
          </h3>
          <button
            type="button"
            onClick={() => { setIsAdjustmentModalOpen(false); resetAllBypasses(); }}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p><strong>Item:</strong> {adjustmentItem.friendly_id} - {adjustmentItem.name}</p>
          <p><strong>Cliente:</strong> {adjustmentItem.order?.customer?.name || 'Cliente'}</p>
          <p><strong>Tiragem do Pedido:</strong> {orderedQty.toLocaleString('pt-BR')} unidades</p>
        </div>

        <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isCliche ? (
            <div style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--background)',
              border: '1px dashed var(--border)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              Item técnico (Clichê) — isento de geração de saldo de sobra ou falta.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Quantidade Produzida Final *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  value={producedQuantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProducedQuantity(val);
                    const diff = val - orderedQty;
                    if (diff > 0) {
                      setAdjustmentAction('CREDITO_PROXIMO_PEDIDO');
                    } else if (diff < 0) {
                      setAdjustmentAction('PENDENCIA_ENTREGA');
                    } else {
                      setAdjustmentAction('OUTRO');
                    }
                  }}
                />
              </div>

              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem'
              }}>
                <strong>Saldo Calculado:</strong>{' '}
                {diffQty === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>0 (Sem sobras ou faltas)</span>
                ) : diffQty > 0 ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    +{diffQty.toLocaleString('pt-BR')} unidades (Sobra / Excedente)
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    {diffQty.toLocaleString('pt-BR')} unidades (Falta)
                  </span>
                )}
              </div>

              {diffQty !== 0 && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tratamento do Saldo</label>
                  <select
                    className="form-select"
                    value={adjustmentAction}
                    onChange={(e) => setAdjustmentAction(e.target.value)}
                  >
                    {diffQty > 0 ? (
                      <>
                        <option value="CREDITO_PROXIMO_PEDIDO">Sobra Enviada — Abater no Próximo Pedido</option>
                        <option value="GUARDAR_ESTOQUE_CLIENTE">Guardar no Estoque de Personalizados (Fábrica)</option>
                        <option value="COBRADO_ADICIONAL">Cobrar Valor Adicional do Cliente</option>
                        <option value="OUTRO">Cortesia Gratuita (Brinde — Não Abater no Próximo Pedido)</option>
                      </>
                    ) : (
                      <>
                        <option value="PENDENCIA_ENTREGA">Falta a Entregar — Somar/Produzir no Próximo Pedido</option>
                        <option value="REPRODUCAO_PENDENTE">Programar Reprodução Pendente (Lote Corretivo)</option>
                        <option value="CANCELADO_DESCONTO">Gerar Desconto Proporcional no Faturamento</option>
                        <option value="OUTRO">Outro / Tratar Manualmente (Sem Gerar Saldo)</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Observações e Histórico Livre</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Descreva detalhes do saldo..."
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setIsAdjustmentModalOpen(false); resetAllBypasses(); }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Confirmar e Enviar para Expedição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
