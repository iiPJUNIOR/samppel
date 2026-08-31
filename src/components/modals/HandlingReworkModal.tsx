import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface HandlingReworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function HandlingReworkModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: HandlingReworkModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 500000, padding: '1rem', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        padding: '1.5rem', maxWidth: '480px', width: '100%',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
        animation: 'fadeIn 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            backgroundColor: 'rgba(234, 179, 8, 0.12)', // Yellow/Amber tint
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#eab308'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Aviso de Retrabalho
            </h2>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 0.25rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Você está vinculando este item a uma <strong>Equipe de Manuseio que já recebeu este mesmo item anteriormente.</strong>
          </p>
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(234, 179, 8, 0.05)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0, fontWeight: 500 }}>
              Isso será registrado como um <strong>Retrabalho</strong> no sistema. Deseja prosseguir com a vinculação?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: '#eab308',
              color: '#000',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? 'Gravando...' : 'Confirmar Retrabalho'}
          </button>
        </div>
      </div>
    </div>
  );
}
