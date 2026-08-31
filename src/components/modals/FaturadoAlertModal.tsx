// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function FaturadoAlertModal(props: any) {
  const {
    faturadoAlertItem,
    handleCancelFaturadoAlertMove,
    handleConfirmFaturadoAlertMove
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
            maxWidth: '500px', width: '90%', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            <div style={{
              backgroundColor: '#3b82f6',
              padding: '1.25rem 1.5rem',
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <AlertCircle size={28} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Atenção: Pedido Faturado</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                  Verifique os procedimentos de faturamento antes de prosseguir.
                </p>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                O pedido <strong>{faturadoAlertItem.order?.pv_number || faturadoAlertItem.order_id}</strong> possui a forma de pagamento definida como <strong>FATURADO</strong>.
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                Certifique-se de que a nota fiscal e as condições de pagamento estão corretas antes de prosseguir com a Expedição. Deseja continuar a movimentação?
              </p>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-body)', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={handleCancelFaturadoAlertMove}
                style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={handleConfirmFaturadoAlertMove}
                style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', backgroundColor: '#3b82f6', border: 'none' }}
              >
                Ciente, Prosseguir
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
