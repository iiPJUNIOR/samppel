// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function SiblingMoveModal(props: any) {
  const {
    Layers,
    handleCancelSiblingMove,
    handleConfirmSiblingMoveAll,
    orders,
    setSiblingMoveSelectedIds,
    siblingMoveItem,
    siblingMoveList,
    siblingMoveSelectedIds,
    siblingMoveTargetStageId,
    stages
  } = props;

        const targetStg = stages.find(s => s.id === siblingMoveTargetStageId);
        const targetStageName = targetStg?.name || 'etapa selecionada';
        const parentOrd = orders.find(o => o.id === siblingMoveItem.order_id) || siblingMoveItem.order;

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200000,
            backdropFilter: 'blur(4px)', padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
              maxWidth: '560px', width: '100%', overflow: 'hidden',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease', color: 'var(--text)'
            }}>
              {/* Header */}
              <div style={{
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    Mover Outros Itens deste Pedido?
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                    Este pedido possui múltiplos cards vinculados ({siblingMoveList.length + 1} no total).
                  </p>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

                {/* Resumo do Pedido */}
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)' }}>
                      PV: {parentOrd?.pv_number || 'Pedido'}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Etapa Destino: <strong style={{ color: 'var(--text)' }}>{targetStageName}</strong>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Cliente: <strong>{parentOrd?.customer?.name || 'Cliente não informado'}</strong>
                  </div>
                </div>

                {/* Pergunta Explicativa */}
                <div style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  Você está movendo o item <strong>{siblingMoveItem.name || siblingMoveItem.art_name}</strong>. Marque os outros itens deste pedido que também devem ser movidos para a etapa <strong>{targetStageName}</strong>:
                </div>

                {/* Lista dos Itens do Pedido com Checkboxes */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  maxHeight: '220px', overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem'
                }}>
                  {/* Item Atual (Fixo e Checado) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.45rem 0.65rem', borderRadius: '6px',
                    backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
                    border: '1px solid rgba(var(--primary-rgb), 0.2)'
                  }}>
                    <input type="checkbox" checked disabled style={{ accentColor: 'var(--primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {siblingMoveItem.name || siblingMoveItem.art_name} (Item Principal)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Sendo movido agora para {targetStageName}
                      </span>
                    </div>
                  </div>

                  {/* Outros Itens Irmãos */}
                  {siblingMoveList.map((sib: any) => {
                    const currentStg = stages.find(s => s.id === sib.stage_id);
                    const isChecked = siblingMoveSelectedIds.includes(sib.id);

                    return (
                      <label
                        key={sib.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.45rem 0.65rem', borderRadius: '6px',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isChecked ? 'var(--surface)' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSiblingMoveSelectedIds([...siblingMoveSelectedIds, sib.id]);
                            } else {
                              setSiblingMoveSelectedIds(siblingMoveSelectedIds.filter(id => id !== sib.id));
                            }
                          }}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                            {sib.name || sib.art_name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Fase atual: {currentStg?.name || 'Desconhecida'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Botões de Ação */}
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelSiblingMove}
                    style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleConfirmSiblingMoveAll(false)}
                    style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Mover Apenas Este Item
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleConfirmSiblingMoveAll(true)}
                    disabled={siblingMoveSelectedIds.length === 0}
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Mover Selecionados ({siblingMoveSelectedIds.length + 1})
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
}
