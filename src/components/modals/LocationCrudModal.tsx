// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function LocationCrudModal(props: any) {
  const {
    Edit3,
    Loader2,
    editingLocation,
    factoryLocations,
    handleDeleteLocationClick,
    handleEditLocationClick,
    handleSaveLocation,
    locationName,
    locationStatus,
    setEditingLocation,
    setIsLocationCrudModalOpen,
    setLocationName,
    setLocationStatus,
    submittingLocation
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
            maxWidth: '560px', width: '92%', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            {/* Cabeçalho */}
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'var(--surface-subtle, #f8fafc)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={22} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Gerenciar Localizações Físicas na Fábrica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationCrudModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Form de Criação/Edição */}
            <form onSubmit={handleSaveLocation} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                {editingLocation ? `Editar Localização: "${editingLocation.name}"` : '➕ Nova Localização Física'}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                  <label className="form-label">Nome do Local / Setor / Prateleira *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Prateleira B2, Setor de Tintas, Salão..."
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={locationStatus}
                    onChange={(e) => setLocationStatus(e.target.value as any)}
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {editingLocation && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setEditingLocation(null); setLocationName(''); setLocationStatus('ATIVO'); }}
                  >
                    Cancelar Edição
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingLocation}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submittingLocation ? <Loader2 size={16} className="spinner" /> : (editingLocation ? <Edit3 size={16} /> : <Plus size={16} />)}
                  <span>{editingLocation ? 'Salvar Alteração' : 'Adicionar Local'}</span>
                </button>
              </div>
            </form>

            {/* Lista / Tabela de Locais Existentes */}
            <div style={{ padding: '1.25rem 1.5rem', maxHeight: '260px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Locais Cadastrados ({factoryLocations.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {factoryLocations.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem', borderRadius: '8px',
                      backgroundColor: 'var(--surface-subtle, #f8fafc)', border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: loc.status === 'ATIVO' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{loc.name}</span>
                      <span className={`badge ${loc.status === 'ATIVO' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {loc.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleEditLocationClick(loc)}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        title="Editar localização"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDeleteLocationClick(loc.id, loc.name)}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        title="Excluir localização"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {factoryLocations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhuma localização física cadastrada ainda.
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface-subtle)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsLocationCrudModalOpen(false)}
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
