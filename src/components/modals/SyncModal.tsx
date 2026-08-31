// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function SyncModal(props: any) {
  const {
    RefreshCw,
    handleCancelSync,
    importEndDate,
    importStartDate,
    importing,
    isSyncingSingle,
    selectedOrder,
    setIsSyncModalOpen,
    setSyncingOrderNumber,
    syncProgress,
    syncResult,
    syncStep,
    syncingOrderNumber
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 300000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '2rem', maxWidth: '420px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}>
              <RefreshCw size={20} className={importing ? 'spinner' : ''} style={{ color: 'var(--primary)', animation: importing ? 'spin 1s linear infinite' : 'none' }} />
              Sincronização Conta Azul
            </h2>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 500 }}>
              {isSyncingSingle ? (
                `Pedido: ${syncingOrderNumber ? `PV-${syncingOrderNumber}` : (selectedOrder?.pv_number || 'Sem número')}`
              ) : (
                `Período: ${importStartDate ? new Date(importStartDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} a ${importEndDate ? new Date(importEndDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Fim'}`
              )}
            </div>

            {/* Progresso */}
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${syncProgress}%`,
                  backgroundColor: syncResult && !syncResult.success ? 'var(--danger)' : 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease-out'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'left', flex: 1, paddingRight: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={syncStep}>
                  {syncStep}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 700 }}>
                  {syncProgress}%
                </span>
              </div>
            </div>

            {/* Resultados / Erros */}
            {syncResult && (
              <div style={{
                backgroundColor: syncResult.success ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                border: `1px solid ${syncResult.success ? '#2ed573' : 'var(--danger)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                {syncResult.success ? (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ed573', fontSize: '0.9rem', fontWeight: 700 }}>
                      Sincronizado com Sucesso
                    </h4>
                    {isSyncingSingle ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        O pedido foi sincronizado e suas parcelas e status financeiro foram atualizados.
                      </p>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <li>Pedidos importados: <strong>{syncResult.imported}</strong></li>
                        <li>Pedidos atualizados: <strong>{syncResult.updated}</strong></li>
                      </ul>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>
                      Falha na Importação
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {syncResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              {importing ? (
                <>
                  <button
                    onClick={handleCancelSync}
                    className="btn btn-danger"
                    style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                  >
                    Cancelar Sincronização
                  </button>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3, textAlign: 'left', width: '100%', display: 'block' }}>
                    * A escuta local será interrompida e o modal será fechado. As chamadas em andamento no servidor não podem ser desfeitas via API.
                  </span>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    setSyncingOrderNumber('');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
    </>
  );
}
