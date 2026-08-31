// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function PackagingModal(props: any) {
  const {
    handleAddPackagingVolume,
    handlePackagingVolumeChange,
    handleRemovePackagingVolume,
    handleSavePackaging,
    packagingMaterialTypes,
    packagingModalItem,
    packagingModalSiblings,
    packagingModalTargetStageId,
    packagingVolumes,
    resetAllBypasses,
    savingPackaging,
    setIsPackagingModalOpen
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '720px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Registro de Embalagem
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {packagingModalItem.friendly_id} — {packagingModalItem.name}
                  {packagingModalTargetStageId && (
                    <span style={{ marginLeft: '0.5rem', color: 'hsl(38, 92.7%, 45%)', fontWeight: 600 }}>
                      Preenchimento obrigatório para avançar para Expedição
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => { setIsPackagingModalOpen(false); resetAllBypasses(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Resumo do item */}
            <div className="grid-responsive-3" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Qtd. Total:</span><br /><strong>{packagingModalItem.print_run?.toLocaleString('pt-BR')} un</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Caixas/Pct:</span><br /><strong>{packagingModalItem.boxes_count}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Tipo Emb.:</span><br /><strong>{packagingModalItem.packaging_type}</strong></div>
            </div>

            <form onSubmit={handleSavePackaging}>
              {/* Lista de volumes */}
              {packagingVolumes.map((vol, idx) => (
                <div key={idx} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  padding: '1rem', marginBottom: '1rem',
                  background: 'var(--surface-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Volume {idx + 1}
                    </h4>
                    {packagingVolumes.length > 1 && (
                      <button type="button" onClick={() => handleRemovePackagingVolume(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid-responsive-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Unidades por Caixa/Pacote *</label>
                      <input type="number" className="form-input" required min={0} value={vol.units_per_box}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'units_per_box', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número de Caixas/Pacotes *</label>
                      <input type="number" className="form-input" required min={1} value={vol.box_count}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'box_count', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Peso por Caixa (kg)</label>
                      <input type="number" step="0.001" className="form-input" placeholder="Ex: 2.500" value={vol.weight_kg}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'weight_kg', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Dimensões por Caixa (cm) — Comprimento × Largura × Altura</label>
                      <div className="grid-responsive-3" style={{ gap: '0.5rem' }}>
                        <input type="number" step="0.01" className="form-input" placeholder="Comp." value={vol.length_cm}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'length_cm', e.target.value)} />
                        <input type="number" step="0.01" className="form-input" placeholder="Larg." value={vol.width_cm}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'width_cm', e.target.value)} />
                        <input type="number" step="0.01" className="form-input" placeholder="Alt." value={vol.height_cm}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'height_cm', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de Material de Embalagem</label>
                      <select className="form-select" value={vol.packaging_material_type_id}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'packaging_material_type_id', e.target.value)}>
                        <option value="">— Nenhum —</option>
                        {packagingMaterialTypes.filter(t => t.status === 'ATIVO').map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.name}{t.code ? ` (${t.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {packagingModalSiblings.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">Vincular a item do PV (embalagem)</label>
                        <select className="form-select" value={vol.associated_order_item_id}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'associated_order_item_id', e.target.value)}>
                          <option value="">— Nenhum —</option>
                          {packagingModalSiblings.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.friendly_id} — {s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Observações deste volume</label>
                      <input type="text" className="form-input" placeholder="Ex: caixas lacradas com fita, frágil..." value={vol.notes}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'notes', e.target.value)} />
                    </div>
                  </div>

                  {/* Cubo dimensional calculado */}
                  {vol.length_cm && vol.width_cm && vol.height_cm && (
                    <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'hsla(221.2, 83.2%, 53.3%, 0.08)', border: '1px solid hsla(221.2, 83.2%, 53.3%, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'hsl(221.2, 83.2%, 53.3%)' }}>
                      Volume unitário: <strong>{(Number(vol.length_cm) * Number(vol.width_cm) * Number(vol.height_cm) / 1000000).toFixed(4)} m³</strong>
                      {vol.weight_kg && (<span style={{ marginLeft: '1rem' }}>Peso total: <strong>{(Number(vol.weight_kg) * Number(vol.box_count)).toFixed(3)} kg</strong></span>)}
                    </div>
                  )}
                </div>
              ))}

              {/* Botão adicionar volume */}
              <button type="button" onClick={handleAddPackagingVolume}
                style={{ width: '100%', padding: '0.5rem', border: '1px dashed var(--border)', background: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                Adicionar Volume
              </button>

              {/* Rodapé do modal */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsPackagingModalOpen(false); resetAllBypasses(); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPackaging}>
                  {savingPackaging ? 'Salvando...' : packagingModalTargetStageId ? 'Salvar e Avançar para Expedição' : 'Salvar Embalagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </>
  );
}
