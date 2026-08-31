// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function SuggestionModal(props: any) {
  const {
    handleSuggestionSubmit,
    loading,
    resetAllBypasses,
    setIsSuggestionModalOpen,
    setSuggestionAction,
    setSuggestionQuantityToConsume,
    suggestionAction,
    suggestionCredit,
    suggestionItem,
    suggestionQuantityToConsume,
    suggestionStock
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
          zIndex: 1002,
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
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Alerta: Crédito ou Estoque de Personalizados
              </h3>
              <button
                onClick={() => { setIsSuggestionModalOpen(false); resetAllBypasses(); }}
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <p>O cliente <strong>{suggestionItem.order?.customer?.name}</strong> possui pendências ou estoques ativos na fábrica para o produto <strong>{suggestionItem.name}</strong>.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                {suggestionCredit && (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsla(346.8, 77.2%, 49.8%, 0.1)', border: '1px solid hsla(346.8, 77.2%, 49.8%, 0.2)', color: 'hsl(346.8, 77.2%, 49.8%)' }}>
                    <strong>Falta/Crédito Pendente:</strong> {suggestionCredit.remaining_quantity?.toLocaleString('pt-BR')} unidades (origem PV {suggestionCredit.source_order?.pv_number || 'original'})
                  </div>
                )}
                {suggestionStock && (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsla(142.1, 76.2%, 36.3%, 0.1)', border: '1px solid hsla(142.1, 76.2%, 36.3%, 0.2)', color: 'hsl(142.1, 76.2%, 36.3%)' }}>
                    <strong>Estoque de Personalizados na Fábrica:</strong> {suggestionStock.quantity?.toLocaleString('pt-BR')} unidades prontas
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Decisão do Usuário</label>
                <select
                  className="form-select"
                  value={suggestionAction}
                  onChange={(e) => {
                    const action = e.target.value;
                    setSuggestionAction(action);
                    if (action === 'CONSUMIR_CREDITO' && suggestionCredit) {
                      setSuggestionQuantityToConsume(Math.min(suggestionItem.print_run || 0, suggestionCredit.remaining_quantity));
                    } else if (action === 'CONSUMIR_ESTOQUE' && suggestionStock) {
                      setSuggestionQuantityToConsume(Math.min(suggestionItem.print_run || 0, suggestionStock.quantity));
                    } else {
                      setSuggestionQuantityToConsume(0);
                    }
                  }}
                >
                  <option value="MANTER_INTEGRO">Manter Crédito/Estoque intacto (Produzir lote completo: {suggestionItem.print_run?.toLocaleString('pt-BR')} un)</option>
                  {suggestionCredit && (
                    <option value="CONSUMIR_CREDITO">Abater quantidade do Crédito de Falta</option>
                  )}
                  {suggestionStock && (
                    <option value="CONSUMIR_ESTOQUE">Consumir quantidade do Estoque na Fábrica</option>
                  )}
                </select>
              </div>

              {suggestionAction !== 'MANTER_INTEGRO' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Quantidade a Consumir</label>
                  <input
                    type="number"
                    min="1"
                    max={
                      suggestionAction === 'CONSUMIR_CREDITO'
                        ? suggestionCredit?.remaining_quantity
                        : suggestionStock?.quantity
                    }
                    className="form-input"
                    value={suggestionQuantityToConsume}
                    onChange={(e) => setSuggestionQuantityToConsume(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Disponível: {
                      suggestionAction === 'CONSUMIR_CREDITO'
                        ? suggestionCredit?.remaining_quantity?.toLocaleString('pt-BR')
                        : suggestionStock?.quantity?.toLocaleString('pt-BR')
                    } unidades
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsSuggestionModalOpen(false); resetAllBypasses(); }}
                  className="btn btn-secondary"
                >
                  Cancelar Movimentação
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Confirmar e Iniciar Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </>
  );
}
