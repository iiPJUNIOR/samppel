// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ExpeditionModal(props: any) {
  const {
    Scale,
    currentOperator,
    expeditionResolutionNotes,
    expeditionResolutionType,
    expeditionTargetItem,
    expeditionTargetShortage,
    fetchShortagesForItem,
    resolveOrderItemShortage,
    savingExpeditionResolution,
    setExpeditionResolutionNotes,
    setExpeditionResolutionType,
    setIsExpeditionModalOpen,
    setSavingExpeditionResolution,
    showToast
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 300000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            width: '100%', maxWidth: '580px', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'hsla(217, 91.2%, 59.8%, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1rem' }}>
                <Scale size={20} />
                <span>Conferência & Liquidação de Falta (Expedição)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpeditionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid hsla(0, 84.2%, 60.2%, 0.3)' }}>
                <div style={{ fontWeight: 800, color: 'hsl(0, 84.2%, 45%)', fontSize: '0.9rem' }}>
                  ⚠️ Ocorrência Registrada: {expeditionTargetShortage.shortage_quantity.toLocaleString('pt-BR')} un em Falta
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', marginTop: '4px' }}>
                  Motivo: <strong>{expeditionTargetShortage.reason === 'MANUSEIO_AVARIA' ? 'Avaria no Manuseio' : expeditionTargetShortage.reason === 'PRODUCAO_DEFECT' ? 'Falta na Produção' : expeditionTargetShortage.reason}</strong>
                </div>
                {expeditionTargetShortage.notes && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                    "{expeditionTargetShortage.notes}"
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Registrado por: <strong>{expeditionTargetShortage.reported_by_name || 'Operador'}</strong> em {new Date(expeditionTargetShortage.reported_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 800, fontSize: '0.85rem' }}>Escolha a Forma de Acerto / Liquidação com o Cliente *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>

                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem',
                    borderRadius: '8px', border: `1.5px solid ${expeditionResolutionType === 'DESCONTO_FATURA' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: expeditionResolutionType === 'DESCONTO_FATURA' ? 'hsla(var(--primary-rgb), 0.05)' : 'var(--background)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="resolutionType"
                      checked={expeditionResolutionType === 'DESCONTO_FATURA'}
                      onChange={() => setExpeditionResolutionType('DESCONTO_FATURA')}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text)' }}>🟢 Lançar Débito / Desconto na Fatura do Cliente</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Abate o valor proporcional das {expeditionTargetShortage.shortage_quantity.toLocaleString('pt-BR')} un no faturamento ou gera saldo credor na conta do cliente.</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem',
                    borderRadius: '8px', border: `1.5px solid ${expeditionResolutionType === 'REPOSICAO' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: expeditionResolutionType === 'REPOSICAO' ? 'hsla(var(--primary-rgb), 0.05)' : 'var(--background)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="resolutionType"
                      checked={expeditionResolutionType === 'REPOSICAO'}
                      onChange={() => setExpeditionResolutionType('REPOSICAO')}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text)' }}>🔵 Gerar Ordem de Reposição / Re-Impressão ({expeditionTargetShortage.shortage_quantity.toLocaleString('pt-BR')} un)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cria uma nova ordem de produção suplementar para produzir as unidades restantes.</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem',
                    borderRadius: '8px', border: `1.5px solid ${expeditionResolutionType === 'ACEITE_PARCIAL' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: expeditionResolutionType === 'ACEITE_PARCIAL' ? 'hsla(var(--primary-rgb), 0.05)' : 'var(--background)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="resolutionType"
                      checked={expeditionResolutionType === 'ACEITE_PARCIAL'}
                      onChange={() => setExpeditionResolutionType('ACEITE_PARCIAL')}
                      style={{ marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text)' }}>🟡 Baixa com Aceite de Entrega Parcial</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registra a concordância formal do cliente para receber a entrega com quantidade menor sem saldo pendente.</div>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Observações do Acerto / Protocolo de Liquidação</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={expeditionResolutionNotes}
                  onChange={(e) => setExpeditionResolutionNotes(e.target.value)}
                  placeholder="Informe detalhes da negociação, número de protocolo ou autorização do cliente..."
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: 'var(--surface)' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsExpeditionModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingExpeditionResolution}
                style={{ fontWeight: 800 }}
                onClick={async () => {
                  setSavingExpeditionResolution(true);
                  try {
                    const res = await resolveOrderItemShortage(expeditionTargetShortage.id, {
                      resolution_type: expeditionResolutionType,
                      resolution_notes: expeditionResolutionNotes,
                      resolved_by_name: currentOperator.current?.name || 'Expedição'
                    });

                    if (res.data) {
                      showToast('Acerto de falta liquidado com sucesso!');
                      if (expeditionTargetItem) {
                        await fetchShortagesForItem(expeditionTargetItem.id);
                      }
                      setIsExpeditionModalOpen(false);
                    }
                  } catch (err) {
                    showToast('Erro ao liquidar falta.');
                  } finally {
                    setSavingExpeditionResolution(false);
                  }
                }}
              >
                {savingExpeditionResolution ? 'Gravando...' : 'Confirmar e Liquidar Falta'}
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
