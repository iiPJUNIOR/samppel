// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function HandlingTeamModal(props: any) {
  const {
    executeSaveHandlingTeam,
    handleSwitchHandlingModalItem,
    handlingTeamAllocations,
    handlingTeamModalItem,
    handlingTeamModalTargetStageId,
    handlingTeams,
    itemHandlingTeamsMap,
    orderItems,
    orders,
    resetAllBypasses,
    savingHandlingTeam,
    setHandlingTeamAllocations,
    setHandlingTeamModalItem,
    setHandlingTeamModalTargetStageId,
    setIsHandlingReworkModalOpen,
    setIsHandlingTeamModalOpen,
    setIsShortageModalOpen,
    setPendingHandlingPayload,
    setShortageItem,
    setShortageNotes,
    setShortageQty,
    setShortageReason,
    stages
  } = props;

        const parentOrder = orders.find(o => o.id === handlingTeamModalItem.order_id) || handlingTeamModalItem.order;
        const allSiblingItems = orderItems.filter(i => i.order_id === handlingTeamModalItem.order_id);
        const totalItemQty = Number(handlingTeamModalItem.print_run || handlingTeamModalItem.quantity || 0);
        const totalAllocated = handlingTeamAllocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
        const isTargetManuseio = handlingTeamModalTargetStageId && stages.find(s => s.id === handlingTeamModalTargetStageId)?.name === 'Manuseio';
        const isCurrentManuseio = stages.find(s => s.id === handlingTeamModalItem.stage_id)?.name === 'Manuseio';
        const showConferenceChecks = isCurrentManuseio || isTargetManuseio;

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 500000, padding: '1rem', backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
              padding: '1.5rem', maxWidth: '640px', width: '100%',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'hsl(271, 91.2%, 55%)'
                  }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                      Vincular Equipe de Manuseio
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {parentOrder?.pv_number ? `Pedido / PV: ${parentOrder.pv_number}` : `Pedido #${parentOrder?.order_number || 'S/N'}`} · Cliente: <strong>{parentOrder?.customer?.name || handlingTeamModalItem.customer_name || 'Não informado'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Seletor de Itens Irmãos do Pedido (quando houver múltiplos) */}
                {allSiblingItems.length > 1 && (
                  <div style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Itens deste Pedido ({allSiblingItems.length} itens no lote):
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Clique para alternar o item
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
                      {allSiblingItems.map((itm) => {
                        const isSelected = itm.id === handlingTeamModalItem.id;
                        const itmAllocations = itemHandlingTeamsMap.get(itm.id) || [];
                        const isDone = itmAllocations.length > 0 && itmAllocations.every(a => a.is_completed);
                        const itmStage = stages.find(s => s.id === itm.stage_id);

                        return (
                          <button
                            key={itm.id}
                            type="button"
                            onClick={() => handleSwitchHandlingModalItem(itm)}
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.76rem',
                              fontWeight: isSelected ? 700 : 500,
                              backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                              color: isSelected ? '#ffffff' : 'var(--text)',
                              border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ opacity: isSelected ? 1 : 0.8 }}>{itm.friendly_id || `/${itm.item_index}`}</span>
                            <span>·</span>
                            <span>{itm.name?.slice(0, 16)}{itm.name?.length > 16 ? '...' : ''}</span>
                            <span style={{ opacity: 0.85 }}>({Number(itm.print_run || 0).toLocaleString('pt-BR')} un)</span>
                            {isDone && <Check size={12} style={{ color: isSelected ? '#fff' : 'var(--success)' }} />}
                            {itmStage && !isSelected && (
                              <span style={{ fontSize: '0.65rem', opacity: 0.7, padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--background)' }}>
                                {itmStage.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Card com Detalhes Completos do Item Ativo */}
                <div style={{
                  backgroundColor: 'hsla(var(--primary-rgb), 0.04)',
                  border: '1px solid hsla(var(--primary-rgb), 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        {handlingTeamModalItem.friendly_id || `Item #${handlingTeamModalItem.item_index || 1}`}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                        {handlingTeamModalItem.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <div style={{
                        padding: '3px 10px',
                        borderRadius: '99px',
                        backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)',
                        color: 'hsl(271, 91.2%, 50%)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)'
                      }}>
                        Tiragem: {totalItemQty.toLocaleString('pt-BR')} un
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Cód. Manuseio: <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                          {handlingTeamAllocations.map(a => (a.handling_code || '').replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS')).filter(Boolean).join(', ') || `MS${(handlingTeamModalItem.friendly_id || '262/1').replace(/^PV-?/i, '')}/1`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>Medida: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.measure || 'Padrão'}</strong></span>
                    {handlingTeamModalItem.production_sector && (
                      <span>Setor Atual: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.production_sector}</strong></span>
                    )}
                    {handlingTeamModalItem.boxes_count && (
                      <span>Volumes: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.boxes_count} cx</strong></span>
                    )}
                  </div>
                </div>

                {/* BANNER DE ALERTA PARA QUANTIDADE NÃO ALOCADA / FALTA DE PRODUÇÃO */}
                {totalAllocated < totalItemQty && (
                  <div style={{
                    backgroundColor: 'hsla(45, 93%, 47%, 0.12)',
                    border: '1.5px solid hsla(45, 93%, 47%, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 0.9rem',
                    color: 'hsl(45, 93%, 30%)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} style={{ color: 'hsl(45, 93%, 40%)' }} />
                      <div>
                        <div>⚠️ HÁ {(totalItemQty - totalAllocated).toLocaleString('pt-BR')} UN DA TIRAGEM NÃO ALOCADAS A NENHUMA EQUIPE</div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 500, opacity: 0.9 }}>
                          Se houver refugo, rasgo ou perda no manuseio/produção, registre a falta para acerto de crédito/débito na Expedição.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-warning"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.35rem 0.75rem',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'hsl(45, 93%, 42%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setShortageItem(handlingTeamModalItem);
                        setShortageQty(totalItemQty - totalAllocated);
                        setShortageReason('MANUSEIO_AVARIA');
                        setShortageNotes('');
                        setIsShortageModalOpen(true);
                      }}
                    >
                      ⚠️ Registrar Falta / Avaria
                    </button>
                  </div>
                )}

                {/* ALERTA PROEMINENTE DE EXCESSO DE QUANTIDADE ALOCADA */}
                {totalAllocated > totalItemQty && (
                  <div style={{
                    backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.12)',
                    border: '1.5px solid hsla(0, 84.2%, 60.2%, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 0.9rem',
                    color: 'hsl(0, 84.2%, 45%)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    boxShadow: 'var(--shadow-xs)'
                  }}>
                    <AlertTriangle size={20} style={{ minWidth: '20px', color: 'hsl(0, 84.2%, 50%)' }} />
                    <div>
                      <div>⚠️ ATENÇÃO: QUANTIDADE ALOCADA MAIOR QUE O PEDIDO</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.95, marginTop: '2px' }}>
                        A quantidade total alocada (<strong>{totalAllocated.toLocaleString('pt-BR')} un</strong>) é maior do que o solicitado no pedido (<strong>{totalItemQty.toLocaleString('pt-BR')} un</strong>). Excesso de <strong>+{(totalAllocated - totalItemQty).toLocaleString('pt-BR')} un</strong>.
                      </div>
                    </div>
                  </div>
                )}

                {/* Distribuição de Equipes de Manuseio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>
                        Distribuição de Equipes de Manuseio *
                      </label>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '99px',
                        backgroundColor: totalAllocated === totalItemQty
                          ? 'hsla(142, 71%, 45%, 0.12)'
                          : totalAllocated < totalItemQty
                            ? 'hsla(45, 93%, 47%, 0.15)'
                            : 'hsla(0, 84%, 60%, 0.2)',
                        color: totalAllocated === totalItemQty
                          ? 'hsl(142, 71%, 35%)'
                          : totalAllocated < totalItemQty
                            ? 'hsl(45, 93%, 35%)'
                            : 'hsl(0, 84%, 40%)',
                        border: `1.5px solid ${totalAllocated === totalItemQty ? 'hsla(142, 71%, 45%, 0.3)' : totalAllocated < totalItemQty ? 'hsla(45, 93%, 47%, 0.3)' : 'hsla(0, 84%, 60%, 0.5)'}`
                      }}>
                        {totalAllocated === totalItemQty
                          ? `Total: ${totalAllocated.toLocaleString('pt-BR')} un (100% Distribuído)`
                          : totalAllocated < totalItemQty
                            ? `Alocado: ${totalAllocated.toLocaleString('pt-BR')} / ${totalItemQty.toLocaleString('pt-BR')} un (Faltam ${(totalItemQty - totalAllocated).toLocaleString('pt-BR')})`
                            : `⚠️ Excesso: ${totalAllocated.toLocaleString('pt-BR')} / ${totalItemQty.toLocaleString('pt-BR')} un (+${(totalAllocated - totalItemQty).toLocaleString('pt-BR')} un a mais)`}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        gap: '0.4rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md, 6px)',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => {
                        const remaining = Math.max(0, totalItemQty - totalAllocated);
                        const itemPv = (handlingTeamModalItem?.friendly_id || handlingTeamModalItem?.order?.pv_number || '262/1').replace(/^PV-?/i, '');
                        setHandlingTeamAllocations(prev => [
                          ...prev,
                          {
                            id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                            handling_team_id: '',
                            quantity: remaining,
                            departure_date: new Date().toISOString().slice(0, 10),
                            return_quantity: remaining,
                            return_date: '',
                            handling_code: `MS${itemPv}/${prev.length + 1}`,
                            is_completed: false,
                            completed_at: ''
                          }
                        ]);
                      }}
                      title="Clique para adicionar uma nova equipe ou divisão de manuseio"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Adicionar Equipe de Manuseio</span>
                    </button>
                  </div>

                  {handlingTeamAllocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        backgroundColor: 'var(--background)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>
                            Equipe {idx + 1} — Equipe de Manuseio <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: '0.4rem' }}>({(alloc.handling_code || `MS${(handlingTeamModalItem?.friendly_id || '262/1').replace(/^PV-?/i, '')}/${idx + 1}`).replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS')})</span> *
                          </label>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', marginTop: '2px' }}
                            value={alloc.handling_team_id}
                            onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, handling_team_id: e.target.value } : a))}
                          >
                            <option value="">— Selecione a Equipe —</option>
                            {handlingTeams.filter(t => t.status === 'ATIVO').map((team) => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHandlingTeamAllocations(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '4px',
                            marginLeft: '0.5rem'
                          }}
                          title="Excluir esta equipe vinculada"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.1fr 1fr 1.1fr 1fr 0.8fr',
                        gap: '0.5rem',
                        alignItems: 'flex-end',
                        backgroundColor: 'var(--surface)',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border)'
                      }}>
                        {/* SAÍDA */}
                        <div>
                          <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Data Saída
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                            value={alloc.departure_date || ''}
                            onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, departure_date: e.target.value } : a))}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Qtd Saída (un)
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                            value={alloc.quantity || ''}
                            placeholder="Qtd."
                            onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, quantity: Number(e.target.value) } : a))}
                          />
                        </div>

                        {/* RETORNO */}
                        <div>
                          <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Data Retorno
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                            value={alloc.return_date || alloc.completed_at || ''}
                            onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? {
                              ...a,
                              return_date: e.target.value,
                              completed_at: e.target.value
                            } : a))}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Qtd Retorno (un)
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                            value={alloc.return_quantity || ''}
                            placeholder="Qtd."
                            onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, return_quantity: Number(e.target.value) } : a))}
                          />
                        </div>

                        {/* CONFERÊNCIA */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>Conferido</label>
                          <input
                            type="checkbox"
                            style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: '4px' }}
                            checked={alloc.is_completed || false}
                            onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? {
                              ...a,
                              is_completed: e.target.checked,
                              completed_at: e.target.checked ? (a.completed_at || a.return_date || new Date().toISOString().slice(0, 10)) : a.completed_at,
                              return_date: e.target.checked ? (a.return_date || a.completed_at || new Date().toISOString().slice(0, 10)) : a.return_date
                            } : a))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé e Ações */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsHandlingTeamModalOpen(false);
                    setHandlingTeamModalItem(null);
                    setHandlingTeamModalTargetStageId('');
                    resetAllBypasses();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={savingHandlingTeam}
                  onClick={() => {
                    const validAllocations = handlingTeamAllocations.filter(a => a.handling_team_id && a.quantity > 0);
                    if (validAllocations.length === 0) {
                      alert('Por favor, selecione ao menos uma equipe de manuseio com quantidade maior que zero.');
                      return;
                    }

                    const hasIncompleteRow = handlingTeamAllocations.some(a => (a.quantity > 0 && !a.handling_team_id) || (a.handling_team_id && !a.quantity));
                    if (hasIncompleteRow) {
                      alert('Existem equipes preenchidas incorretamente. Verifique se todas possuem equipe e quantidade.');
                      return;
                    }

                    const fullExistingList = itemHandlingTeamsMap.get(handlingTeamModalItem.id) || [];
                    const editingIds = new Set(handlingTeamAllocations.map(a => a.id).filter(Boolean));
                    const uneditedAllocations = fullExistingList.filter((a: any) => !editingIds.has(a.id));

                    const mergedPayload = [
                      ...uneditedAllocations,
                      ...handlingTeamAllocations
                    ];

                    const teamCounts = new Map<string, number>();
                    for (const alloc of mergedPayload) {
                      if (alloc.handling_team_id) {
                        teamCounts.set(alloc.handling_team_id, (teamCounts.get(alloc.handling_team_id) || 0) + 1);
                      }
                    }
                    const hasRework = Array.from(teamCounts.values()).some(count => count > 1);

                    if (hasRework) {
                      setPendingHandlingPayload(mergedPayload);
                      setIsHandlingReworkModalOpen(true);
                      return;
                    }

                    executeSaveHandlingTeam(mergedPayload);
                  }}
                >
                  {savingHandlingTeam ? 'Gravando...' : (handlingTeamModalTargetStageId && handlingTeamModalTargetStageId !== handlingTeamModalItem.stage_id ? 'Salvar e Mover para Manuseio' : 'Salvar Distribuição')}
                </button>
              </div>
            </div>
          </div>
        );
}
