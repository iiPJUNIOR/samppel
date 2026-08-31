// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ConferencyModal(props: any) {
  const {
    conferencyBypass,
    conferencyChecked,
    conferencyData,
    conferencyItem,
    conferencyPhysicalQuantity,
    conferencyTargetStageId,
    loading,
    moveOrderItemToStage,
    resetAllBypasses,
    setConferencyChecked,
    setConferencyData,
    setConferencyItem,
    setConferencyPhysicalQuantity,
    setIsConferencyModalOpen,
    setLoading,
    updateCustomerStockCredit,
    updateOrderItem,
    user
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '550px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Conferência de Saldo de Carga
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Este pedido compensou um saldo acumulado do pedido anterior deste cliente para o mesmo produto (<strong>{conferencyItem.name}</strong>).
            </p>

            <div style={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                <div><strong style={{ color: 'var(--text-muted)' }}>Saldo Anterior Compensado:</strong> {conferencyData.credit_type === 'PENDENCIA_ENTREGA' ? `Falta de ${conferencyData.original_quantity} unidades (Acrescentada) do pedido original ${conferencyData.source_order?.pv_number || 'PV'}` : `Cortesia de ${conferencyData.original_quantity} unidades (Descontada) do pedido original ${conferencyData.source_order?.pv_number || 'PV'}`}</div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Matemática de Tiragem:</strong> <code>{conferencyItem.adjusted_quantity_math}</code></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Tiragem Líquida Esperada:</strong> {conferencyItem.adjusted_production_quantity?.toLocaleString('pt-BR')} unidades</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Quantos itens estão sendo enviados fisicamente no lote deste pedido? *</label>
              <input
                type="number"
                className="form-input"
                min="0"
                required
                value={conferencyPhysicalQuantity || ''}
                onChange={(e) => setConferencyPhysicalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
              />
            </div>

            <div style={{
              border: '1px solid rgba(var(--primary-rgb), 0.3)',
              backgroundColor: 'rgba(var(--primary-rgb), 0.04)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={conferencyChecked}
                  onChange={(e) => setConferencyChecked(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', marginTop: '0.15rem' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  Confirmo que verifiquei fisicamente a carga e o saldo acumulado foi devidamente considerado no carregamento.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setIsConferencyModalOpen(false);
                  setConferencyData(null);
                  setConferencyItem(null);
                  setConferencyChecked(false);
                  resetAllBypasses();
                }}
              >
                Voltar / Cancelar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={loading || !conferencyChecked}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

                    // 1. Atualiza o status do saldo acumulado original para UTILIZADO (zerado para sempre)
                    const { error: creditError } = await updateCustomerStockCredit(conferencyData.id, {
                      status: 'UTILIZADO',
                      remaining_quantity: 0
                    });

                    if (creditError) {
                      console.error('Erro ao zerar saldo acumulado:', creditError.message);
                    }

                    // 2. Atualiza a quantidade produzida final/expedida no item de pedido e marca como resolvido
                    await updateOrderItem(conferencyItem.id, {
                      over_short_quantity: conferencyPhysicalQuantity - (conferencyItem.print_run || 0),
                      adjustment_resolved: true
                    });

                    // 3. Move o card para a etapa de Expedição
                    conferencyBypass.current = true;
                    setIsConferencyModalOpen(false);
                    await moveOrderItemToStage(conferencyItem, conferencyTargetStageId);

                    setConferencyData(null);
                    setConferencyItem(null);
                    setConferencyChecked(false);
                  } catch (err) {
                    console.error('Erro ao processar conferência final:', err);
                    alert('Ocorreu um erro no processamento da conferência.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processando...' : 'Confirmar e Liberar'}
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
