// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ExpeditionTransitionModal(props: any) {
  const {
    createCustomerStockCredit,
    createOrderBalanceAdjustment,
    expeditionFreightHeight,
    expeditionFreightLength,
    expeditionFreightNotes,
    expeditionFreightPackagingTypeId,
    expeditionFreightVolumes,
    expeditionFreightWeight,
    expeditionFreightWidth,
    expeditionItemConferencyMap,
    expeditionSelectedSiblings,
    expeditionSiblings,
    expeditionTransitionItem,
    expeditionTransitionMoveBypass,
    expeditionTransitionNotes,
    expeditionTransitionTargetStageId,
    loading,
    moveOrderItemToStage,
    resetAllBypasses,
    saveOrderShippingVolumes,
    selectedShippingType,
    setExpeditionFreightHeight,
    setExpeditionFreightLength,
    setExpeditionFreightVolumes,
    setExpeditionFreightWeight,
    setExpeditionFreightWidth,
    setExpeditionSelectedSiblings,
    setExpeditionTransitionItem,
    setExpeditionTransitionNotes,
    setIsExpeditionTransitionModalOpen,
    setLoading,
    setSelectedShippingType,
    shippingTypes,
    stages,
    updateExpeditionItemConferency,
    updateOrder,
    updateOrderItem,
    user
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '780px', width: '100%',
            maxHeight: '88vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <Truck size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    Consolidação de Expedição e Frete
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pedido #{expeditionTransitionItem.order?.pv_number || expeditionTransitionItem.friendly_id} · {expeditionTransitionItem.order?.customer?.name || 'Cliente'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: expeditionSiblings.length > 0 ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

              {/* COLUNA 1: CHECKLIST DE AGRUPAMENTO DE ITENS NA MESMA CAIXA/FRETE */}
              {expeditionSiblings.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        📦 Agrupar Itens na Mesma Caixa / Frete
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                    Este pedido foi desmembrado para produção. <strong>Marque abaixo os outros itens que você deseja colocar nesta mesma caixa/envio</strong> para irem juntos à Expedição:
                  </p>

                  {/* BOTOES DE AÇÃO RAPIDA MARCAR/DESMARCAR */}
                  <div style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0' }}>
                    <button
                      type="button"
                      onClick={() => setExpeditionSelectedSiblings(expeditionSiblings.map(s => s.id))}
                      style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                    >
                      ✓ Marcar Todos (Juntar Pedido Inteiro)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpeditionSelectedSiblings([])}
                      style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      Desmarcar Todos (Enviar Só Este)
                    </button>
                  </div>

                  {/* LISTA DE ITENS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Item Principal (Sempre selecionado) */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center',
                      padding: '0.5rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked disabled style={{ accentColor: 'var(--primary)' }} />
                        <div>
                          <strong style={{ color: 'var(--text)', display: 'block', fontSize: '0.8rem' }}>
                            {expeditionTransitionItem.friendly_id} · {expeditionTransitionItem.name}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Item atual sendo movido</span>
                        </div>
                      </div>
                    </div>

                    {/* Itens Irmãos */}
                    {expeditionSiblings.map((sib: any) => {
                      const sibStage = stages.find(s => s.id === sib.stage_id);
                      const isChecked = expeditionSelectedSiblings.includes(sib.id);
                      return (
                        <label key={sib.id} style={{
                          display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', cursor: 'pointer',
                          padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: isChecked ? 'var(--surface)' : 'transparent',
                          border: `1px solid ${isChecked ? 'var(--border)' : 'transparent'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExpeditionSelectedSiblings([...expeditionSelectedSiblings, sib.id]);
                                } else {
                                  setExpeditionSelectedSiblings(expeditionSelectedSiblings.filter(id => id !== sib.id));
                                }
                              }}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            <div>
                              <span style={{ color: 'var(--text)', fontWeight: 600, display: 'block' }}>
                                {sib.friendly_id || '—'} · {sib.name}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: isChecked ? 'var(--success)' : 'var(--text-muted)' }}>
                                {isChecked ? '↳ Será enviado junto nesta caixa' : '↳ Continuará na etapa atual'}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: (sibStage?.color || '#888') + '22',
                            color: sibStage?.color || 'var(--text-muted)',
                            border: `1px solid ${(sibStage?.color || '#888')}55`,
                            whiteSpace: 'nowrap'
                          }}>
                            {sibStage?.name || 'A produzir'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COLUNA 2: DADOS TÉCNICOS DE FRETE E EMBALAGEM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--surface-subtle)' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Truck size={16} /> Dados Técnicos de Frete Consolidados
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Tipo de Frete *</label>
                      <select
                        className="form-input"
                        required
                        value={selectedShippingType}
                        onChange={(e) => setSelectedShippingType(e.target.value)}
                        style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                      >
                        <option value="">Selecione...</option>
                        {shippingTypes.filter(s => s.status === 'ATIVO').map((type) => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Volumes/Caixas *</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        required
                        value={expeditionFreightVolumes || ''}
                        onChange={(e) => setExpeditionFreightVolumes(parseInt(e.target.value) || 1)}
                        style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                        placeholder="Ex: 1"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Peso (kg)</label>
                      <input type="number" step="0.01" className="form-input" value={expeditionFreightWeight} onChange={e => setExpeditionFreightWeight(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0.00" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Alt (cm)</label>
                      <input type="number" step="0.1" className="form-input" value={expeditionFreightHeight} onChange={e => setExpeditionFreightHeight(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Larg (cm)</label>
                      <input type="number" step="0.1" className="form-input" value={expeditionFreightWidth} onChange={e => setExpeditionFreightWidth(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Comp (cm)</label>
                      <input type="number" step="0.1" className="form-input" value={expeditionFreightLength} onChange={e => setExpeditionFreightLength(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* OCORRÊNCIAS DE EMBALAGEM / SOBRAS & FALTAS INDIVIDUAIS POR ITEM */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', backgroundColor: 'var(--surface)' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Conferência de Sobras & Faltas (Por Item)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Itens Selecionados: <strong>{[expeditionTransitionItem, ...expeditionSiblings.filter(s => expeditionSelectedSiblings.includes(s.id))].length}</strong>
                    </span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {[expeditionTransitionItem, ...expeditionSiblings.filter(s => expeditionSelectedSiblings.includes(s.id))].map((itm: any) => {
                      const itemData = expeditionItemConferencyMap[itm.id] || { producedQuantity: itm.print_run || 0, adjustmentAction: 'CREDITO_PROXIMO_PEDIDO' };
                      const orderedQty = itm.print_run || 0;
                      const diffQty = itemData.producedQuantity - orderedQty;

                      return (
                        <div key={itm.id} style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          padding: '0.65rem 0.75rem',
                          backgroundColor: 'var(--background)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                              {itm.friendly_id || 'Item'} · {itm.name}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Contratado: <strong>{orderedQty.toLocaleString('pt-BR')} un</strong>
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', alignItems: 'center' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.72rem' }}>Qtd Produzida Final *</label>
                              <input
                                type="number"
                                min="0"
                                required
                                className="form-input"
                                value={itemData.producedQuantity}
                                onChange={(e) => updateExpeditionItemConferency(itm.id, 'producedQuantity', Number(e.target.value))}
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              />
                            </div>

                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Saldo Calculado:</span>
                              {diffQty === 0 ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>0 (Sem sobras/faltas)</span>
                              ) : diffQty > 0 ? (
                                <span style={{ fontSize: '0.75rem', color: 'hsl(142.1, 76.2%, 36.3%)', fontWeight: 700 }}>+{diffQty.toLocaleString('pt-BR')} un (Sobra)</span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'hsl(346.8, 77.2%, 49.8%)', fontWeight: 700 }}>{diffQty.toLocaleString('pt-BR')} un (Falta)</span>
                              )}
                            </div>
                          </div>

                          {diffQty !== 0 && (
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.72rem' }}>Tratamento do Saldo (Cliente) *</label>
                              <select
                                className="form-select"
                                value={itemData.adjustmentAction}
                                onChange={(e) => updateExpeditionItemConferency(itm.id, 'adjustmentAction', e.target.value)}
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                {diffQty > 0 ? (
                                  <>
                                    <option value="CREDITO_PROXIMO_PEDIDO">Cortesia / Crédito para o Próximo Pedido</option>
                                    <option value="GUARDAR_ESTOQUE_CLIENTE">Guardar no Estoque de Personalizados (Fábrica)</option>
                                    <option value="COBRADO_ADICIONAL">Cobrar Valor Adicional do Cliente</option>
                                    <option value="OUTRO">Outro / Tratar Manualmente</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="PENDENCIA_ENTREGA">Registrar Pendência de Entrega (Gerar Crédito)</option>
                                    <option value="REPRODUCAO_PENDENTE">Programar Reprodução Pendente (Lote Corretivo)</option>
                                    <option value="CANCELADO_DESCONTO">Gerar Desconto Proporcional no Faturamento</option>
                                    <option value="OUTRO">Outro / Tratar Manualmente</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OBSERVAÇÕES */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Observações da Expedição</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={expeditionTransitionNotes}
                    onChange={(e) => setExpeditionTransitionNotes(e.target.value)}
                    placeholder="Instruções de envio, notas de embalagem ou sobra/falta..."
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', marginTop: '0.2rem', resize: 'vertical' }}
                  />
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsExpeditionTransitionModalOpen(false);
                  setExpeditionTransitionItem(null);
                  resetAllBypasses();
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  if (!selectedShippingType) {
                    alert('Por favor, informe o Tipo de Frete consolidado.');
                    return;
                  }

                  const activeItemsToMove = [
                    expeditionTransitionItem,
                    ...expeditionSiblings.filter(s => expeditionSelectedSiblings.includes(s.id))
                  ];

                  setLoading(true);
                  try {
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

                    // 1. Processar Ocorrências e Crédito/Débito Individual para Cada Item Selecionado
                    for (const itm of activeItemsToMove) {
                      const itemData = expeditionItemConferencyMap[itm.id] || {
                        producedQuantity: itm.print_run || 0,
                        adjustmentAction: 'CREDITO_PROXIMO_PEDIDO'
                      };
                      const orderedQty = itm.print_run || 0;
                      const diffQty = itemData.producedQuantity - orderedQty;

                      const updates: any = {
                        over_short_quantity: diffQty,
                        expedition_notes: expeditionTransitionNotes || null
                      };

                      if (diffQty < 0) {
                        updates.shortage_quantity = Math.abs(diffQty);
                        updates.courtesy_quantity = 0;
                        updates.adjustment_resolved = false;
                      } else if (diffQty > 0) {
                        updates.courtesy_quantity = diffQty;
                        updates.shortage_quantity = 0;
                        updates.adjustment_resolved = false;
                      } else {
                        updates.shortage_quantity = 0;
                        updates.courtesy_quantity = 0;
                        updates.adjustment_resolved = true;
                      }

                      // Update item no banco
                      const { error } = await updateOrderItem(itm.id, updates);
                      if (error) {
                        console.error(`Erro ao atualizar item ${itm.id}:`, error.message);
                      }

                      // Registra Log de Ajustes do Saldo (order_balance_adjustments)
                      if (diffQty !== 0) {
                        const adjType = diffQty >= 0 ? 'SOBRA' : 'FALTA';
                        await createOrderBalanceAdjustment({
                          tenant_id: tenantId,
                          order_id: itm.order_id,
                          order_item_id: itm.id,
                          customer_id: itm.order?.customer_id || expeditionTransitionItem.order?.customer_id,
                          product_id: itm.product_id,
                          ordered_quantity: orderedQty,
                          produced_quantity: itemData.producedQuantity,
                          difference_quantity: diffQty,
                          adjustment_type: adjType,
                          action_taken: itemData.adjustmentAction as any,
                          notes: expeditionTransitionNotes || `Registrado na consolidação da Expedição (${adjType})`,
                          created_by_name: user?.full_name || user?.email || 'Sistema'
                        });

                        // Registra Crédito/Débito em customer_stock_credits
                        if (['CREDITO_PROXIMO_PEDIDO', 'PENDENCIA_ENTREGA', 'REPRODUCAO_PENDENTE'].includes(itemData.adjustmentAction)) {
                          const creditType = diffQty < 0 ? 'PENDENCIA_ENTREGA' : 'CORTESIA_SOBRA';
                          const absQty = Math.abs(diffQty);

                          const { error: creditError } = await createCustomerStockCredit({
                            tenant_id: tenantId,
                            customer_id: itm.order?.customer_id || expeditionTransitionItem.order?.customer_id,
                            product_id: itm.product_id,
                            credit_type: creditType,
                            original_quantity: absQty,
                            remaining_quantity: absQty,
                            source_order_id: itm.order_id,
                            source_adjustment_id: null,
                            status: 'ATIVO',
                            notes: expeditionTransitionNotes || `Registrado na Expedição (${diffQty < 0 ? 'Falta' : 'Cortesia'})`
                          });

                          if (creditError) {
                            console.error('Erro ao registrar saldo acumulado do cliente:', creditError.message);
                          }
                        }
                      }
                    }

                    // 2. Salvar Dados Técnicos de Frete (Consolidado)
                    await updateOrder(expeditionTransitionItem.order_id, {
                      shipping_type: selectedShippingType as any,
                      notes: expeditionFreightNotes ? (expeditionTransitionItem.order?.notes + '\n' + expeditionFreightNotes) : expeditionTransitionItem.order?.notes
                    });

                    await saveOrderShippingVolumes(expeditionTransitionItem.order_id, [{
                      order_id: expeditionTransitionItem.order_id,
                      volume_number: expeditionFreightVolumes,
                      weight_kg: parseFloat(expeditionFreightWeight) || null,
                      width_cm: parseFloat(expeditionFreightWidth) || null,
                      height_cm: parseFloat(expeditionFreightHeight) || null,
                      length_cm: parseFloat(expeditionFreightLength) || null,
                      packaging_type_id: expeditionFreightPackagingTypeId || null,
                      notes: expeditionFreightNotes || null
                    }], tenantId);

                    // 3. Mover Todos os Itens Selecionados para a Expedição
                    setIsExpeditionTransitionModalOpen(false);
                    for (const itm of activeItemsToMove) {
                      expeditionTransitionMoveBypass.current = true;
                      await moveOrderItemToStage(itm, expeditionTransitionTargetStageId);
                    }

                    setExpeditionTransitionItem(null);
                  } catch (err) {
                    console.error(err);
                    alert('Ocorreu um erro ao salvar os dados da expedição.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processando...' : 'Confirmar Expedição'}
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
