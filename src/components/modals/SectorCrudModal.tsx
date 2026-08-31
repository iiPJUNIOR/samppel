// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function SectorCrudModal(props: any) {
  const {
    editingSector,
    handleDeleteSector,
    handleSaveSector,
    productionSectors,
    savingSector,
    sectorFormName,
    sectorFormStatus,
    setEditingSector,
    setIsSectorCrudModalOpen,
    setSectorFormName,
    setSectorFormStatus
  } = props;

  return (
    <>
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsSectorCrudModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200, padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--background)'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                Gerenciar Setores de Produção Física
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSectorCrudModalOpen(false);
                  setEditingSector(null);
                  setSectorFormName('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Form */}
              <form onSubmit={handleSaveSector} style={{
                backgroundColor: 'rgba(var(--primary-rgb), 0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {editingSector ? 'Editar Setor' : 'Adicionar Novo Setor'}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Nome do Setor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Impressão, Guilhotina, Embalagem..."
                    value={sectorFormName}
                    onChange={(e) => setSectorFormName(e.target.value)}
                    required
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Status</label>
                  <select
                    className="form-select"
                    value={sectorFormStatus}
                    onChange={(e) => setSectorFormStatus(e.target.value as any)}
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  >
                    <option value="ATIVO">Ativo (visível nos selects)</option>
                    <option value="INATIVO">Inativo (oculto nos selects)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {editingSector && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSector(null);
                        setSectorFormName('');
                        setSectorFormStatus('ATIVO');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingSector}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {savingSector ? 'Salvando...' : editingSector ? 'Salvar Alterações' : 'Adicionar Setor'}
                  </button>
                </div>
              </form>

              {/* Lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Setores Cadastrados ({productionSectors.length})
                </div>

                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Nome</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionSectors.map((sec) => (
                        <tr key={sec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{sec.name}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: sec.status === 'ATIVO' ? '#10b981' : '#64748b',
                              backgroundColor: sec.status === 'ATIVO' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)'
                            }}>
                              {sec.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSector(sec);
                                  setSectorFormName(sec.name);
                                  setSectorFormStatus(sec.status);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.72rem' }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSector(sec.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: '0.72rem' }}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
    </>
  );
}
