// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function FreightModal(props: any) {
  const {
    currentOperator,
    customers,
    freightBoxesCount,
    freightBypass,
    freightHeight,
    freightItem,
    freightLength,
    freightQtyPerBox,
    freightTargetStageId,
    freightWeight,
    freightWidth,
    loading,
    moveOrderItemToStage,
    orderItems,
    orders,
    resetAllBypasses,
    selectedFreightSiblings,
    selectedShippingType,
    setFreightBoxesCount,
    setFreightHeight,
    setFreightItem,
    setFreightLength,
    setFreightQtyPerBox,
    setFreightTargetStageId,
    setFreightWeight,
    setFreightWidth,
    setIsFreightModalOpen,
    setIsShippingCrudModalOpen,
    setLoading,
    setOrderItems,
    setOrders,
    setSelectedFreightSiblings,
    setSelectedShippingType,
    shippingTypes,
    stages,
    updateOrder,
    updateOrderItem
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
            padding: '1.5rem', maxWidth: '650px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Truck size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Dados Técnicos de Frete
              </h2>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Insira o tipo de frete, o peso total e as dimensões da embalagem para viabilizar o cálculo do frete.
            </p>

            {/* PAINEL DE RESUMO DO PEDIDO */}
            {(() => {
              const parentOrder = orders.find(o => o.id === freightItem.order_id) || freightItem.order;
              const customerObj = customers.find(c => c.id === parentOrder?.customer_id);
              return (
                <div style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.825rem',
                  lineHeight: 1.4,
                  color: 'var(--text)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Número do Pedido</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>PV-{parentOrder?.pv_number || 'Sem PV'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Tiragem</span>
                      <strong>{freightItem.print_run ? `${freightItem.print_run.toLocaleString('pt-BR')} un` : '-'}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Cliente</span>
                      <strong style={{ color: 'var(--text)' }}>{customerObj?.name || parentOrder?.customer?.name || 'Cliente Não Identificado'}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Produto / Arte</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{freightItem.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Tipo de Frete *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <select
                    className="form-input"
                    required
                    value={selectedShippingType}
                    onChange={(e) => setSelectedShippingType(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', flex: 1, backgroundColor: 'var(--background)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">Selecione o tipo de frete...</option>
                    {shippingTypes.filter(s => s.status === 'ATIVO').map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsShippingCrudModalOpen(true)}
                    style={{ padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', minWidth: '36px', border: '1px solid var(--border)' }}
                    title="Cadastrar Tipos de Frete"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Peso Total (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  required
                  placeholder="Ex: 12.50"
                  value={freightWeight}
                  onChange={(e) => setFreightWeight(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Comprimento (cm) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 40"
                    value={freightLength}
                    onChange={(e) => setFreightLength(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Largura (cm) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 30"
                    value={freightWidth}
                    onChange={(e) => setFreightWidth(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Altura (cm) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 20"
                    value={freightHeight}
                    onChange={(e) => setFreightHeight(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Quantidade de Caixas *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 10"
                    value={freightBoxesCount}
                    onChange={(e) => setFreightBoxesCount(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Qtd dentro da Caixa *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 500"
                    value={freightQtyPerBox}
                    onChange={(e) => setFreightQtyPerBox(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              {/* LISTA DE CHECKBOXES PARA AGRUPAR ITENS IRMÃOS NO MESMO FRETE */}
              {(() => {
                const siblingItems = orderItems.filter(
                  (oi: any) => oi.order_id === freightItem.order_id && oi.id !== freightItem.id
                );
                if (siblingItems.length === 0) return null;
                return (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text)' }}>
                      📦 Juntar outros itens deste pedido na mesma caixa/frete:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {siblingItems.map((sib: any) => {
                        const sibStage = stages.find(s => s.id === sib.stage_id);
                        const hasStarted = sibStage && sibStage.name !== 'Pedidos';
                        const isChecked = selectedFreightSiblings.includes(sib.id);
                        return (
                          <label
                            key={sib.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.8rem',
                              cursor: hasStarted ? 'pointer' : 'not-allowed',
                              color: hasStarted ? 'var(--text)' : 'var(--text-muted)',
                              opacity: hasStarted ? 1 : 0.6,
                              userSelect: 'none'
                            }}
                            title={hasStarted ? '' : 'Este item ainda está na etapa inicial de Pedidos e sua produção não foi iniciada.'}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked && hasStarted}
                              disabled={!hasStarted}
                              onChange={(e) => {
                                if (!hasStarted) return;
                                if (e.target.checked) {
                                  setSelectedFreightSiblings(prev => [...prev, sib.id]);
                                } else {
                                  setSelectedFreightSiblings(prev => prev.filter(id => id !== sib.id));
                                }
                              }}
                              style={{ width: '14px', height: '14px', cursor: hasStarted ? 'pointer' : 'not-allowed' }}
                            />
                            <span>
                              <strong>{sib.friendly_id}</strong> - {sib.name} (Qtd: {sib.print_run})
                              {!hasStarted && <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>(Produção Não Iniciada)</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setIsFreightModalOpen(false);
                  setFreightItem(null);
                  setFreightTargetStageId('');
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
                  const weight = parseFloat(freightWeight);
                  const length = parseInt(freightLength, 10);
                  const width = parseInt(freightWidth, 10);
                  const height = parseInt(freightHeight, 10);
                  const boxes = parseInt(freightBoxesCount, 10);
                  const qtyPerBox = parseInt(freightQtyPerBox, 10);

                  if (!selectedShippingType) {
                    alert('Por favor, selecione o tipo de frete.');
                    return;
                  }

                  if (isNaN(weight) || weight <= 0 || isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
                    alert('Todos os campos de peso e dimensões devem ser preenchidos com valores numéricos maiores que zero.');
                    return;
                  }

                  if (isNaN(boxes) || boxes <= 0 || isNaN(qtyPerBox) || qtyPerBox <= 0) {
                    alert('A quantidade de caixas e a quantidade por caixa devem ser valores inteiros maiores que zero.');
                    return;
                  }

                  setLoading(true);
                  try {
                    // 1. Salvar os dados na tabela orders do Supabase
                    const { error: orderErr } = await updateOrder(freightItem.order_id, {
                      package_weight: weight,
                      package_length: length,
                      package_width: width,
                      package_height: height,
                      shipping_type: selectedShippingType,
                      boxes_count: boxes,
                      quantity_per_box: qtyPerBox
                    });

                    if (orderErr) {
                      alert('Erro ao salvar dados de frete na ordem: ' + orderErr.message);
                      setLoading(false);
                      return;
                    }

                    // 2. Atualizar o item do pedido correspondente
                    const { error: itemErr } = await updateOrderItem(freightItem.id, {
                      boxes_count: boxes,
                      quantity_per_box: qtyPerBox
                    });

                    if (itemErr) {
                      alert('Erro ao atualizar o item do pedido: ' + itemErr.message);
                    }

                    // Se houver subitens irmãos selecionados, copia os dados das caixas para eles também
                    if (selectedFreightSiblings.length > 0) {
                      await Promise.all(selectedFreightSiblings.map(sibId =>
                        updateOrderItem(sibId, {
                          boxes_count: boxes,
                          quantity_per_box: qtyPerBox
                        })
                      ));
                    }

                    // 3. Atualizar o estado das ordens e itens localmente em memória
                    setOrders(prev => prev.map(o => o.id === freightItem.order_id ? {
                      ...o,
                      package_weight: weight,
                      package_length: length,
                      package_width: width,
                      package_height: height,
                      shipping_type: selectedShippingType,
                      boxes_count: boxes,
                      quantity_per_box: qtyPerBox
                    } : o));

                    setOrderItems(prev => prev.map(i => {
                      if (i.id === freightItem.id || selectedFreightSiblings.includes(i.id)) {
                        return {
                          ...i,
                          boxes_count: boxes,
                          quantity_per_box: qtyPerBox
                        };
                      }
                      return i;
                    }));

                    const savedOpId = currentOperator.current?.id;
                    const savedOpName = currentOperator.current?.name;

                    // 4. Avançar para os modais subsequentes (Bypass de frete ativado)
                    freightBypass.current = true;
                    setIsFreightModalOpen(false);
                    await moveOrderItemToStage(freightItem, freightTargetStageId, savedOpId, savedOpName);

                    // Mover os subitens vinculados agrupados no mesmo frete
                    for (const sibId of selectedFreightSiblings) {
                      const fullSib = orderItems.find(oi => oi.id === sibId);
                      if (fullSib) {
                        freightBypass.current = true;
                        await moveOrderItemToStage(fullSib, freightTargetStageId, savedOpId, savedOpName);
                      }
                    }

                    // 5. Limpar estados de formulário
                    setFreightItem(null);
                    setFreightTargetStageId('');
                    setFreightWeight('');
                    setFreightLength('');
                    setFreightWidth('');
                    setFreightHeight('');
                    setFreightBoxesCount('');
                    setFreightQtyPerBox('');
                    setSelectedShippingType('');
                    setSelectedFreightSiblings([]);
                  } catch (err) {
                    console.error('Erro no salvamento técnico de frete:', err);
                    alert('Ocorreu um erro no processamento das informações de frete.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Salvando...' : 'Salvar e Prosseguir'}
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
