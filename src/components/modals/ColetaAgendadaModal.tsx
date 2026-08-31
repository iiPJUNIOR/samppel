// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ColetaAgendadaModal(props: any) {
  const {
    coletaAgendadaItem,
    coletaAgendadaMoveBypass,
    coletaAgendadaTargetStageId,
    coletaFreightQuotation,
    coletaInvoiceNumber,
    coletaPickupNumber,
    coletaSelectedSiblings,
    coletaSiblings,
    loading,
    moveOrderItemToStage,
    orderItems,
    resetAllBypasses,
    setColetaAgendadaItem,
    setColetaFreightQuotation,
    setColetaInvoiceNumber,
    setColetaPickupNumber,
    setColetaSelectedSiblings,
    setIsColetaAgendadaModalOpen,
    setLoading,
    stages,
    updateOrder
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
            padding: '1.5rem', maxWidth: '650px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                <Clock size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  Dados da Coleta Agendada
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Pedido #{coletaAgendadaItem.order?.pv_number || coletaAgendadaItem.friendly_id} · {coletaAgendadaItem.order?.customer?.name || 'Cliente'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Preencha os dados do despacho de <strong>{coletaAgendadaItem.friendly_id}</strong> para agendar a coleta:
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                // 1. Atualizar informações de Coleta no Pedido Principal
                await updateOrder(coletaAgendadaItem.order_id, {
                  invoice_number: coletaInvoiceNumber || null,
                  pickup_number: coletaPickupNumber || null,
                  freight_quotation: coletaFreightQuotation || null
                });

                // 2. Mover Item Principal para Coleta Agendada
                coletaAgendadaMoveBypass.current = true;
                setIsColetaAgendadaModalOpen(false);
                await moveOrderItemToStage(coletaAgendadaItem, coletaAgendadaTargetStageId);

                // 3. Mover Itens Irmãos Selecionados
                if (coletaSelectedSiblings.length > 0) {
                  for (const sibId of coletaSelectedSiblings) {
                    const sibItem = orderItems.find(i => i.id === sibId);
                    if (sibItem) {
                      coletaAgendadaMoveBypass.current = true;
                      await moveOrderItemToStage(sibItem, coletaAgendadaTargetStageId);
                    }
                  }
                }

                setColetaAgendadaItem(null);
              } catch (err) {
                console.error('Erro ao salvar dados da coleta agendada:', err);
                alert('Ocorreu um erro ao salvar os dados da coleta.');
              } finally {
                setLoading(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Número da Nota (NF-e) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={coletaInvoiceNumber}
                    onChange={(e) => setColetaInvoiceNumber(e.target.value)}
                    placeholder="Ex: 12345"
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Número da Coleta *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={coletaPickupNumber}
                    onChange={(e) => setColetaPickupNumber(e.target.value)}
                    placeholder="Ex: COL-98765"
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Cotação de Frete *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={coletaFreightQuotation}
                    onChange={(e) => setColetaFreightQuotation(e.target.value)}
                    placeholder="Ex: COT-44521 ou R$ 150"
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* CHECKLIST DE ITENS IRMÃOS PARA COLETA AGENDADA */}
              {coletaSiblings.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                    📦 Mover outros itens deste pedido para Coleta Agendada juntos ({coletaSiblings.length})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {coletaSiblings.map((sib: any) => {
                      const sibStage = stages.find(s => s.id === sib.stage_id);
                      const isChecked = coletaSelectedSiblings.includes(sib.id);
                      return (
                        <label key={sib.id} style={{
                          display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', cursor: 'pointer',
                          padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: isChecked ? 'var(--surface)' : 'transparent',
                          border: `1px solid ${isChecked ? 'var(--border)' : 'transparent'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setColetaSelectedSiblings([...coletaSelectedSiblings, sib.id]);
                                } else {
                                  setColetaSelectedSiblings(coletaSelectedSiblings.filter(id => id !== sib.id));
                                }
                              }}
                              style={{ accentColor: '#10b981' }}
                            />
                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                              {sib.friendly_id || '—'} · {sib.name}
                            </span>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: (sibStage?.color || '#888') + '22',
                            color: sibStage?.color || 'var(--text-muted)',
                            border: `1px solid ${(sibStage?.color || '#888')}55`,
                            whiteSpace: 'nowrap'
                          }}>
                            {sibStage?.name || 'Expedição'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsColetaAgendadaModalOpen(false);
                    setColetaAgendadaItem(null);
                    resetAllBypasses();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Agendando...' : 'Confirmar e Agendar Coleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </>
  );
}
