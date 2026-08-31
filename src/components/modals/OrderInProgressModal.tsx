// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function OrderInProgressModal(props: any) {
  const {
    RefreshCw,
    handleCancelInProgressOrder,
    handleForceStartInProgressOrder,
    handleSyncInProgressOrder,
    inProgressItem,
    inProgressSyncing
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.75rem', maxWidth: '520px', width: '90%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={26} style={{ color: 'var(--warning)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Pedido Não Aprovado no Conta Azul
              </h2>
            </div>

            <div style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0' }}>
                O pedido <strong>PV-{inProgressItem.order?.pv_number || inProgressItem.order_id}</strong> ainda consta com o status <strong>"Em andamento"</strong> (Aguardando Aprovação/Faturamento) no Conta Azul.
              </p>

              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}>
                ℹ️ <strong>Importante:</strong> Iniciar a produção ou separação de estoque de pedidos ainda não aprovados comercialmente/financeiramente pode gerar retrabalho ou desperdício de matéria-prima.
              </div>

              <p style={{ margin: '0' }}>
                Caso o status do pedido tenha sido atualizado recentemente no Conta Azul, clique em <strong>Sincronizar Pedido Agora</strong> para buscar a aprovação em tempo real. Caso contrário, se tiver autorização, você pode optar por <strong>Iniciar Mesmo Assim</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleSyncInProgressOrder}
                disabled={inProgressSyncing}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', height: '42px', fontWeight: 600 }}
              >
                <RefreshCw size={16} className={inProgressSyncing ? 'spinner' : ''} />
                <span>{inProgressSyncing ? 'Buscando dados no Conta Azul...' : 'Sincronizar Pedido Agora'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleForceStartInProgressOrder}
                  disabled={inProgressSyncing}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}
                >
                  Iniciar Mesmo Assim
                </button>
                <button
                  onClick={handleCancelInProgressOrder}
                  disabled={inProgressSyncing}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
