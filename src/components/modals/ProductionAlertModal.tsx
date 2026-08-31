// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ProductionAlertModal(props: any) {
  const {
    loading,
    moveOrderItemToStage,
    productionAlertBypass,
    productionAlertData,
    productionAlertItem,
    productionAlertTargetStageId,
    resetAllBypasses,
    setIsProductionAlertModalOpen,
    setLoading,
    setProductionAlertData,
    setProductionAlertItem,
    updateCustomerStockCredit,
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
            padding: '1.5rem', maxWidth: '520px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <AlertCircle size={24} style={{ color: productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'var(--danger)' : 'var(--success)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                {productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'Falta a Entregar (Saldo Acumulado)' : 'Cortesia/Bonificação Pendente (Saldo Acumulado)'}
              </h2>
            </div>

            <div style={{
              backgroundColor: productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px dashed ${productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'var(--danger)' : 'var(--success)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              {productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? (
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text)' }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>O que aconteceu?</strong>
                    <br />
                    No pedido anterior <strong>{productionAlertData.source_order?.pv_number || 'PV de origem'}</strong> deste mesmo produto, a fábrica não conseguiu entregar o total completo, gerando uma <strong>falta de {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} unidades</strong> para o cliente.
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>Como corrigir agora?</strong>
                    <br />
                    Como o cliente já pagou por essas unidades no pedido anterior, nós devemos <strong>somar</strong> essa quantidade na tiragem do novo pedido atual dele para entregar a diferença devida.
                  </p>
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--danger)'
                  }}>
                    Ajuste de Tiragem:
                    <br />
                    {productionAlertItem.print_run.toLocaleString('pt-BR')} un (Pedido) + {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} un (Falta) = {(productionAlertItem.print_run + productionAlertData.remaining_quantity).toLocaleString('pt-BR')} un a produzir.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text)' }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>O que aconteceu?</strong>
                    <br />
                    No pedido anterior <strong>{productionAlertData.source_order?.pv_number || 'PV de origem'}</strong> deste mesmo produto, sobrou um excedente que foi enviado como <strong>cortesia/bonificação de {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} unidades</strong> ao cliente.
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>Como corrigir agora?</strong>
                    <br />
                    Como o cliente já recebeu fisicamente essas unidades anteriormente, nós podemos <strong>subtrair/abater</strong> essa quantidade da tiragem do novo pedido atual para evitar produzir itens duplicados.
                  </p>
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--success)'
                  }}>
                    Ajuste de Tiragem:
                    <br />
                    {productionAlertItem.print_run.toLocaleString('pt-BR')} un (Pedido) - {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} un (Bonificado) = {Math.max(0, productionAlertItem.print_run - productionAlertData.remaining_quantity).toLocaleString('pt-BR')} un a produzir.
                  </div>
                </div>
              )}
            </div>

            {productionAlertData.notes && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Histórico / Observações de origem:</span>
                <pre style={{
                  margin: '0.25rem 0 0 0',
                  padding: '0.5rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text)',
                  fontFamily: 'inherit'
                }}>{productionAlertData.notes}</pre>
              </div>
            )}

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
              Deseja aplicar esta matemática de saldo acumulado na produção deste novo pedido?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setIsProductionAlertModalOpen(false);
                  setProductionAlertData(null);
                  setProductionAlertItem(null);
                  resetAllBypasses();
                }}
              >
                Voltar / Cancelar
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                style={{ border: '1px solid var(--border)' }}
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Prossegue sem aplicar ajustes
                    productionAlertBypass.current = true;
                    setIsProductionAlertModalOpen(false);
                    await moveOrderItemToStage(productionAlertItem, productionAlertTargetStageId);
                    setProductionAlertData(null);
                    setProductionAlertItem(null);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Não, manter original
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const originalPrintRun = productionAlertItem.print_run || 0;
                    const remainingQty = productionAlertData.remaining_quantity || 0;
                    let finalProductionQty = originalPrintRun;
                    let mathString = '';

                    if (productionAlertData.credit_type === 'PENDENCIA_ENTREGA') {
                      finalProductionQty = originalPrintRun + remainingQty;
                      mathString = `${originalPrintRun.toLocaleString('pt-BR')} + ${remainingQty.toLocaleString('pt-BR')} = ${finalProductionQty.toLocaleString('pt-BR')} (Falta)`;
                    } else {
                      finalProductionQty = Math.max(0, originalPrintRun - remainingQty);
                      mathString = `${originalPrintRun.toLocaleString('pt-BR')} - ${remainingQty.toLocaleString('pt-BR')} = ${finalProductionQty.toLocaleString('pt-BR')} (Cortesia)`;
                    }

                    // 1. Atualiza o item de pedido com a matemática do saldo aplicado
                    await updateOrderItem(productionAlertItem.id, {
                      applied_adjustment_id: productionAlertData.id,
                      adjusted_quantity_math: mathString,
                      adjusted_production_quantity: finalProductionQty
                    });

                    // 2. Marca o saldo acumulado como UTILIZADO temporariamente para evitar outros usos
                    await updateCustomerStockCredit(productionAlertData.id, {
                      status: 'UTILIZADO'
                    });

                    // 3. Move o card para a produção
                    productionAlertBypass.current = true;
                    setIsProductionAlertModalOpen(false);
                    await moveOrderItemToStage(productionAlertItem, productionAlertTargetStageId);
                    setProductionAlertData(null);
                    setProductionAlertItem(null);
                  } catch (err) {
                    console.error('Erro ao aplicar saldo:', err);
                    alert('Erro ao aplicar saldo no pedido.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Aplicando...' : 'Sim, aplicar saldo'}
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
