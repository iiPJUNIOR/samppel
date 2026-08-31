// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ShortageModal(props: any) {
  const {
    currentOperator,
    fetchShortagesForItem,
    saveOrderItemShortage,
    savingShortage,
    setIsShortageModalOpen,
    setSavingShortage,
    setShortageNotes,
    setShortageQty,
    setShortageReason,
    shortageItem,
    shortageNotes,
    shortageQty,
    shortageReason,
    showToast
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 300000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            width: '100%', maxWidth: '520px', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(0, 84.2%, 45%)', fontWeight: 800, fontSize: '1rem' }}>
                <AlertTriangle size={20} />
                <span>Registrar Falta / Avaria de Produto</span>
              </div>
              <button
                type="button"
                onClick={() => setIsShortageModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--background)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <div>Produto: <strong>{shortageItem.name}</strong></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Pedido: <strong>{shortageItem.friendly_id || shortageItem.order?.pv_number || 'PED'}</strong> | Tiragem Total: <strong>{Number(shortageItem.print_run || shortageItem.quantity || 0).toLocaleString('pt-BR')} un</strong>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Quantidade em Falta / Perda (un) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={shortageQty}
                  onChange={(e) => setShortageQty(Math.max(1, Number(e.target.value)))}
                  style={{ fontWeight: 800, fontSize: '1rem', color: 'hsl(0, 84.2%, 45%)' }}
                  min={1}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Motivo / Causa da Falta *</label>
                <select
                  className="form-select"
                  value={shortageReason}
                  onChange={(e) => setShortageReason(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="MANUSEIO_AVARIA">⚠️ Avaria no Manuseio (Rasgo, Cola, Sujeira)</option>
                  <option value="PRODUCAO_DEFECT">⚙️ Falta na Produção / Impressão / Corte</option>
                  <option value="EXTRAVIO">🚚 Perda Física / Extravio em Transporte</option>
                  <option value="DEFEITO_MATERIAL">📦 Defeito do Material / Matéria-Prima</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Observações / Detalhes da Ocorrência</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={shortageNotes}
                  onChange={(e) => setShortageNotes(e.target.value)}
                  placeholder="Descreva o que ocorreu com estas peças para orientação da Expedição..."
                />
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                ℹ️ Esta ocorrência ficará gravada no histórico e <strong>exigirá liquidação na Expedição</strong> (Crédito do Cliente, Reposição ou Aceite).
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: 'var(--surface)' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsShortageModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingShortage || shortageQty <= 0}
                style={{ backgroundColor: 'hsl(0, 84.2%, 50%)', borderColor: 'hsl(0, 84.2%, 50%)', fontWeight: 800 }}
                onClick={async () => {
                  setSavingShortage(true);
                  try {
                    const res = await saveOrderItemShortage({
                      order_id: shortageItem.order_id,
                      order_item_id: shortageItem.id,
                      customer_id: shortageItem.order?.customer_id || shortageItem.customer_id,
                      shortage_quantity: shortageQty,
                      reason: shortageReason,
                      notes: shortageNotes,
                      reported_by_name: currentOperator.current?.name || 'Operador'
                    });

                    if (res.data) {
                      showToast(`Falta de ${shortageQty.toLocaleString('pt-BR')} un registrada! Aguardando conferência na Expedição.`);
                      await fetchShortagesForItem(shortageItem.id);
                      setIsShortageModalOpen(false);
                    }
                  } catch (err) {
                    showToast('Erro ao registrar falta.');
                  } finally {
                    setSavingShortage(false);
                  }
                }}
              >
                {savingShortage ? 'Gravando...' : 'Salvar Registro de Falta'}
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
