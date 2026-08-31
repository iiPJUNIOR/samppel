// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function MachineCrudModal(props: any) {
  const {
    editingMachineState,
    handleDeleteMachineForm,
    handleSaveMachineForm,
    machineFormName,
    machineFormSector,
    machineFormStatus,
    productionMachines,
    productionSectors,
    savingMachine,
    setEditingMachineState,
    setIsMachineCrudModalOpen,
    setMachineFormName,
    setMachineFormSector,
    setMachineFormStatus
  } = props;

  return (
    <>
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsMachineCrudModalOpen(false); }}
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
            maxWidth: '560px',
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
                Gerenciar Máquinas de Produção Vinculadas
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMachineCrudModalOpen(false);
                  setEditingMachineState(null);
                  setMachineFormName('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Form */}
              <form onSubmit={handleSaveMachineForm} style={{
                backgroundColor: 'rgba(var(--primary-rgb), 0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {editingMachineState ? 'Editar Máquina' : 'Adicionar Nova Máquina'}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Nome da Máquina</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Flexografia 4 Cores, Guilhotina Hidráulica..."
                    value={machineFormName}
                    onChange={(e) => setMachineFormName(e.target.value)}
                    required
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Setor de Produção Física</label>
                  <select
                    className="form-select"
                    value={machineFormSector}
                    onChange={(e) => setMachineFormSector(e.target.value)}
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  >
                    {productionSectors
                      .filter(s => s.status === 'ATIVO')
                      .map((sec) => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Status</label>
                  <select
                    className="form-select"
                    value={machineFormStatus}
                    onChange={(e) => setMachineFormStatus(e.target.value as any)}
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  >
                    <option value="ATIVO">Ativa (Disponível)</option>
                    <option value="INATIVO">Inativa (Oculta)</option>
                    <option value="MANUTENCAO">Em Manutenção</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {editingMachineState && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMachineState(null);
                        setMachineFormName('');
                        setMachineFormStatus('ATIVO');
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
                    disabled={savingMachine}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {savingMachine ? 'Salvando...' : editingMachineState ? 'Salvar Alterações' : 'Adicionar Máquina'}
                  </button>
                </div>
              </form>

              {/* Lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Máquinas Cadastradas ({productionMachines.length})
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
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Setor</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionMachines.map((mach) => {
                        let statusColor = '#ef4444';
                        let statusBg = 'rgba(239,68,68,0.1)';
                        let statusLabel = 'Inativa';

                        if (mach.status === 'ATIVO') {
                          statusColor = '#10b981';
                          statusBg = 'rgba(16,185,129,0.1)';
                          statusLabel = 'Ativa';
                        } else if (mach.status === 'MANUTENCAO') {
                          statusColor = '#f97316';
                          statusBg = 'rgba(249,115,22,0.1)';
                          statusLabel = 'Manutenção';
                        }

                        return (
                          <tr key={mach.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{mach.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{mach.sector}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: statusColor,
                                backgroundColor: statusBg
                              }}>
                                {statusLabel}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMachineState(mach);
                                    setMachineFormName(mach.name);
                                    setMachineFormSector(mach.sector || 'Impressão');
                                    setMachineFormStatus(mach.status);
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.72rem' }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMachineForm(mach.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: '0.72rem' }}
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
