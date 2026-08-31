// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function MoveStageModal(props: any) {
  const {
    ArrowRightLeft,
    itemToMoveStage,
    moveOrderItemToStage,
    setIsMoveStageModalOpen,
    setItemToMoveStage,
    stages
  } = props;

  return (
    <>
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsMoveStageModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200000, padding: '0.75rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Cabecalho */}
            <div style={{
              padding: '0.85rem 1.15rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(var(--primary-rgb), 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  Mover Pedido de Etapa
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoveStageModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Dados do Item / Pedido */}
            <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                {itemToMoveStage.friendly_id || itemToMoveStage.order?.pv_number || '---'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {itemToMoveStage.order?.customer?.name || 'Cliente'} · {itemToMoveStage.name || 'Item'}
              </div>
            </div>

            {/* Opções de Etapa */}
            <div style={{ padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '350px', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Selecione a nova etapa:
              </span>

              {stages.map((stg) => {
                const isCurrent = itemToMoveStage.stage_id === stg.id || (!itemToMoveStage.stage_id && stg.id === stages[0]?.id);
                return (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={async () => {
                      const targetItem = itemToMoveStage;
                      setIsMoveStageModalOpen(false);
                      setItemToMoveStage(null);
                      if (!isCurrent) {
                        await moveOrderItemToStage(targetItem, stg.id);
                      }
                    }}
                    disabled={isCurrent}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isCurrent ? `2px solid ${stg.color}` : '1px solid var(--border)',
                      backgroundColor: isCurrent ? `${stg.color}15` : 'var(--surface)',
                      cursor: isCurrent ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stg.color, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 700 : 500, color: 'var(--text)' }}>
                        {stg.name}
                      </span>
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: stg.color, backgroundColor: `${stg.color}25`, padding: '2px 8px', borderRadius: '99px' }}>
                        Etapa Atual
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rodapé */}
            <div style={{ padding: '0.75rem 1.15rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--background)' }}>
              <button
                type="button"
                onClick={() => setIsMoveStageModalOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
