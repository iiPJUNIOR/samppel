// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function LinkedItemsWarningModal(props: any) {
  const {
    handleConfirmExpeditionMove,
    handleConfirmExpeditionMoveAll,
    linkedItemsWarningData,
    setIsLinkedItemsWarningOpen,
    setLinkedItemsWarningData,
    stages
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
            padding: '1.5rem', maxWidth: '500px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle size={24} style={{ color: '#eab308' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Pedido Conjunto / Múltiplos Itens
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              O item <strong>{linkedItemsWarningData.item.friendly_id}</strong> faz parte do pedido <strong>{linkedItemsWarningData.item.order?.pv_number}</strong>, que contém mais de um item.
            </p>

            <div style={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                Outros itens vinculados a este pedido:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {linkedItemsWarningData.siblings.map((sib: any) => {
                  const sibStage = stages.find(s => s.id === sib.stage_id);
                  return (
                    <div key={sib.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                        {sib.friendly_id || '—'} · {sib.name}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: (sibStage?.color || '#888') + '22',
                        color: sibStage?.color || 'var(--text-muted)',
                        border: `1px solid ${(sibStage?.color || '#888')}55`,
                        whiteSpace: 'nowrap'
                      }}>
                        {sibStage?.name || 'A produzir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 1.25rem 0', fontWeight: 600 }}>
              Deseja prosseguir com o envio de <strong>{linkedItemsWarningData.item.friendly_id}</strong> para a Expedição?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handleConfirmExpeditionMoveAll}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', width: '100%', padding: '0.6rem 1rem' }}
              >
                Movimentar todos
              </button>
              <button
                type="button"
                onClick={handleConfirmExpeditionMove}
                className="btn btn-outline"
                style={{
                  fontSize: '0.85rem',
                  width: '100%',
                  padding: '0.6rem 1rem',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  backgroundColor: 'transparent'
                }}
              >
                Movimentar somente este
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLinkedItemsWarningOpen(false);
                  setLinkedItemsWarningData(null);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', width: '100%', padding: '0.6rem 1rem' }}
              >
                Cancelar movimentação
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
