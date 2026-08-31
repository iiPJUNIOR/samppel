// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function InsufficientStockModal(props: any) {
  const {
    handleCancelInsufficientStockMove,
    handleConfirmInsufficientStockMove,
    insufficientStockData,
    selectedInsufficientItemIds,
    setSelectedInsufficientItemIds
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            width: '100%', maxWidth: '550px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.5rem', borderBottom: '1px solid var(--border)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                  Atenção: Estoque Insuficiente
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Alguns produtos não possuem saldo suficiente para este avanço.
                </p>
              </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Os itens abaixo não possuem estoque suficiente. <strong>Selecione os que você deseja forçar o avanço</strong> (o estoque ficará negativo). Os que não forem selecionados <strong>permanecerão em Pedidos</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insufficientStockData.insufficientItems.map((stk: any) => {
                  const isSelected = selectedInsufficientItemIds.includes(stk.item.id);
                  return (
                    <label key={stk.item.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-body)',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInsufficientItemIds(prev => [...prev, stk.item.id]);
                          } else {
                            setSelectedInsufficientItemIds(prev => prev.filter(id => id !== stk.item.id));
                          }
                        }}
                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                          {stk.productName}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Necessário: <strong style={{ color: '#ef4444' }}>{stk.qtyRequired}</strong>
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Em Estoque: <strong>{stk.currentStock}</strong>
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Ficará: <strong style={{ color: '#ef4444' }}>{stk.currentStock - stk.qtyRequired}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-body)' }}>
              <button
                onClick={() => {
                  const selectedItems = insufficientStockData.insufficientItems
                    .filter((stk: any) => selectedInsufficientItemIds.includes(stk.item.id))
                    .map((stk: any) => stk.item);
                  handleConfirmInsufficientStockMove(selectedItems);
                }}
                className="btn btn-primary"
                style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', backgroundColor: 'var(--primary)', border: 'none' }}
              >
                Confirmar Avanço
              </button>
              <button
                onClick={handleCancelInsufficientStockMove}
                className="btn btn-secondary"
                style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
              >
                Cancelar Movimentação
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
