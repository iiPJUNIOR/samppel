// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

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

  return (
    <>
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
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '500px',
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
                onClick={() => { setIsAdjustmentModalOpen(false); resetAllBypasses(); }}
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p><strong>Item:</strong> {adjustmentItem.friendly_id} - {adjustmentItem.name}</p>
              <p><strong>Cliente:</strong> {adjustmentItem.order?.customer?.name || 'Cliente'}</p>
              <p><strong>Tiragem do Pedido:</strong> {adjustmentItem.print_run?.toLocaleString('pt-BR')} unidades</p>
            </div>

            <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    const diff = val - (adjustmentItem.print_run || 0);
                    if (diff > 0) {
                      setAdjustmentAction('CREDITO_PROXIMO_PEDIDO');
                    } else if (diff < 0) {
                      setAdjustmentAction('REPRODUCAO_PENDENTE');
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
                {producedQuantity - (adjustmentItem.print_run || 0) === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>0 (Sem sobras ou faltas)</span>
                ) : producedQuantity - (adjustmentItem.print_run || 0) > 0 ? (
                  <span style={{ color: 'hsl(142.1, 76.2%, 36.3%)', fontWeight: 600 }}>
                    +{producedQuantity - (adjustmentItem.print_run || 0)} unidades (Sobra / Excedente)
                  </span>
                ) : (
                  <span style={{ color: 'hsl(346.8, 77.2%, 49.8%)', fontWeight: 600 }}>
                    {producedQuantity - (adjustmentItem.print_run || 0)} unidades (Falta)
                  </span>
                )}
              </div>

              {producedQuantity - (adjustmentItem.print_run || 0) !== 0 && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tratamento do Saldo</label>
                  <select
                    className="form-select"
                    value={adjustmentAction}
                    onChange={(e) => setAdjustmentAction(e.target.value)}
                  >
                    {producedQuantity - (adjustmentItem.print_run || 0) > 0 ? (
                      <>
                        <option value="CREDITO_PROXIMO_PEDIDO">Cortesia / Crédito para o Próximo Pedido</option>
                        <option value="GUARDAR_ESTOQUE_CLIENTE">Guardar no Estoque de Personalizados (Fábrica)</option>
                        <option value="COBRADO_ADICIONAL">Cobrar Valor Adicional do Cliente</option>
                        <option value="OUTRO">Outro / Tratar Manualmente</option>
                      </>
                    ) : (
                      <>
                        <option value="REPRODUCAO_PENDENTE">Programar Reprodução Pendente (Lote Corretivo)</option>
                        <option value="CREDITO_PROXIMO_PEDIDO">Abater/Crédito no Próximo Pedido (Compensação)</option>
                        <option value="CANCELADO_DESCONTO">Gerar Desconto Proporcional no Faturamento</option>
                        <option value="OUTRO">Outro / Tratar Manualmente</option>
                      </>
                    )}
                  </select>
                </div>
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
    </>
  );
}
