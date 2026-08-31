import React from 'react';
import { AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  orderToDelete: {
    pvNumber: string;
    customerName: string;
    artName: string;
    printRun?: string | number;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  orderToDelete,
  onClose,
  onConfirm,
  isDeleting
}: DeleteConfirmModalProps) {
  if (!isOpen || !orderToDelete) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          width: '90%',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '2px solid var(--danger)',
          overflow: 'hidden'
        }}
      >
        {/* Header com Alerta */}
        <div style={{
          backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.12)',
          borderBottom: '1px solid hsla(0, 84.2%, 60.2%, 0.25)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--danger)',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)' }}>
              Confirmar Exclusão de Pedido Manual
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ação restrita exclusivamente a Administradores
            </span>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Box de Alerta Destacado */}
          <div style={{
            backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.08)',
            border: '1.5px dashed hsla(0, 84.2%, 60.2%, 0.4)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.85rem 1rem',
            color: 'var(--text)'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={16} />
              ATENÇÃO: ESTA AÇÃO É DEFINITIVA E NÃO PODERÁ SER DESFEITA!
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-muted)' }}>
              Esta operação excluirá permanentemente o pedido manual, seus itens vinculados e todo o histórico associado do banco de dados. <strong>Não haverá como recuperar esses dados após a confirmação.</strong>
            </p>
          </div>

          {/* Detalhes do Pedido Selecionado */}
          <div style={{
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.85rem 1rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Identificador / PV:</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{orderToDelete.pvNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{orderToDelete.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Produto / Arte:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{orderToDelete.artName}</span>
            </div>
            {orderToDelete.printRun ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiragem:</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{Number(orderToDelete.printRun).toLocaleString('pt-BR')} un</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--background)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isDeleting}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={isDeleting}
            onClick={onConfirm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Trash2 size={15} />
            <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir Definitivamente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
