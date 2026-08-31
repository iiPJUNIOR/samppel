// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function DetailViewModal(props: any) {
  const {
    isBusinessDays,
    Copy,
    CopyButton,
    Edit3,
    RefreshCw,
    Scale,
    adjustments,
    calculateExpeditionDate,
    capitalizeText,
    detailItem,
    extractOrderDetails,
    financialTransactions,
    formatDocument,
    formatPhone,
    getFreightBadgeStyle,
    getItemRealMeasure,
    handleOpenEdit,
    handleOpenHandlingTeamModalForItem,
    handleRequestDeleteManualOrder,
    handleSyncSingleOrder,
    handlingTeams,
    hideMonetaryValues,
    isAdmin,
    isManualOrder,
    itemHandlingTeamsMap,
    orderItems,
    orderRangeChoiceMap,
    parseDeadlineFromNotes,
    productionMachines,
    setExpeditionResolutionNotes,
    setExpeditionResolutionType,
    setExpeditionTargetItem,
    setExpeditionTargetShortage,
    setIsDetailModalOpen,
    setIsExpeditionModalOpen,
    shortagesMap,
    showToast,
    stages,
    syncingSingleOrder,
    user
  } = props;

        const order = detailItem.order || {};
        const customer = order.customer || {};
        const currentStage = stages.find(s => s.id === detailItem.stage_id);
        const itemAdjs = adjustments.filter(a => a.order_item_id === detailItem.id);
        const deadline = parseDeadlineFromNotes(detailItem.notes || order.notes);
        const isOverdue = deadline ? deadline.getTime() < Date.now() && currentStage?.name !== 'Concluído' : false;
        const freightStyle = getFreightBadgeStyle(order.shipping_type);
        const isReleased = !!order.first_payment_date;
        const currentMachine = productionMachines.find(m => m.id === detailItem.machine_id);
        const machineName = currentMachine ? currentMachine.name : '—';

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false); }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999,
              padding: '0.5rem',
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg, 12px)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '860px',
              maxHeight: 'min(92vh, calc(100dvh - 1rem))',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header Padrão do Sistema (Responsivo no Mobile) */}
              <div style={{
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                background: `linear-gradient(135deg, ${currentStage?.color || 'var(--primary)'}18 0%, transparent 100%)`,
                borderLeft: `4px solid ${currentStage?.color || 'var(--primary)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 280px', minWidth: 0 }}>
                  <Image
                    src="/logo.png"
                    alt="Samppel Logo"
                    width={210}
                    height={55}
                    style={{ objectFit: 'contain', height: '52px', width: 'auto', maxHeight: '52px', flexShrink: 0 }}
                    priority
                  />
                  <div style={{ height: '36px', width: '1px', backgroundColor: 'var(--border)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', wordBreak: 'break-all' }}>
                        {detailItem.friendly_id || order.pv_number || '---'}
                      </span>
                      {currentStage && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700,
                          backgroundColor: currentStage.color + '22',
                          color: currentStage.color,
                          padding: '2px 8px', borderRadius: '99px',
                          border: `1px solid ${currentStage.color}55`,
                          whiteSpace: 'nowrap'
                        }}>
                          {currentStage.name}
                        </span>
                      )}
                      {isOverdue && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>Atrasado</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer.name || 'Cliente'} · {detailItem.name}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                  {(!user?.role || user.role !== 'Produção' || currentStage?.name === 'Em produção') && (
                    <button
                      onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                      className="btn btn-primary"
                      title="Editar informações do pedido"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                    >
                      <Edit3 size={12} />
                      <span className="desktop-only-inline">Editar</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.3rem' }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Corpo com Scroll Padrão */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {!isReleased && (
                  <div style={{
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    color: 'var(--danger)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={16} />
                    <span>Atenção: Este pedido está Bloqueado (Aguardando Pagamento/Sinal).</span>
                  </div>
                )}

                {/* Card 1: Dados do Pedido (Full Width) */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Dados do Pedido
                  </div>
                  <div className="grid-responsive-3" style={{ gap: '0.65rem' }}>
                    {[
                      { label: 'PV', value: order.pv_number || '—' },
                      { label: 'OP', value: order.op_number || '—' },
                      { label: 'Produto/Serviço', value: detailItem.name || '—' },
                      { label: 'Vendedor(a)', value: order.seller_name || 'Samppel' },
                      { label: 'Data do Pedido', value: order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : '—' },
                      {
                        label: 'Data de expedição', value: (() => {
                          const expRes = calculateExpeditionDate(detailItem, order, { isBusinessDays, chosenDays: orderRangeChoiceMap.get(order.id) });
                          return expRes.expeditionDate ? expRes.expeditionDate.toLocaleDateString('pt-BR') : '—';
                        })()
                      },
                      { label: 'Início Produção', value: order.production_start_date ? new Date(order.production_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                      { label: 'Nota Fiscal (NF-e)', value: order.invoice_number || '—' },
                      { label: 'Número da Coleta', value: order.pickup_number || '—' },
                      { label: 'Cotação de Frete', value: order.freight_quotation || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Card 2: Dados do Cliente (Full Width) */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: '#a855f7', borderRadius: '2px', display: 'inline-block' }} />
                    Dados do Cliente
                  </div>
                  <div className="grid-responsive-2" style={{ gap: '0.65rem' }}>
                    {(() => {
                      const formattedDoc = formatDocument(customer.document);
                      const formattedEmail = customer.email ? customer.email.toLowerCase() : '';
                      const formattedPhone = formatPhone(customer.phone);
                      return [
                        { label: 'Nome', value: customer.name || '—', copyText: customer.name },
                        { label: 'CNPJ/CPF', value: formattedDoc || '—', copyText: formattedDoc },
                        { label: 'E-mail', value: formattedEmail || '—', copyText: formattedEmail, style: { textTransform: 'lowercase' } },
                        { label: 'Telefone', value: formattedPhone || '—', copyText: formattedPhone },
                      ].map(({ label, value, copyText, style }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600, wordBreak: 'break-all', ...style }}>
                            {value}
                            {copyText && copyText !== '—' && <CopyButton text={copyText} />}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </section>

                {/* Card: Especificações deste Item / Card */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} />
                    Especificações deste Item / Card
                  </div>
                  <div className="grid-responsive-3" style={{ gap: '0.65rem' }}>
                    {(() => {
                      const specDetails = extractOrderDetails(detailItem.notes || order.notes);
                      const packagingText = specDetails?.embalagem || (detailItem.boxes_count ? `${detailItem.boxes_count} ${detailItem.packaging_type === 'PACOTE' ? 'pct' : 'cx'}` : null);

                      const specsList = [
                        { label: 'OP', value: capitalizeText(specDetails?.op) },
                        { label: 'Tiragem', value: detailItem.print_run ? detailItem.print_run.toLocaleString('pt-BR') + ' un' : '—' },
                        { label: 'Clichê', value: capitalizeText(specDetails?.cliche) },
                        { label: 'Embalagem', value: capitalizeText(packagingText) },
                        { label: 'Medida', value: capitalizeText(getItemRealMeasure(detailItem)) },
                        { label: 'Impressão', value: capitalizeText(specDetails?.impressao) },
                        { label: 'Prazo de Entrega', value: capitalizeText(specDetails?.prazo) },
                        { label: 'Frete', value: capitalizeText(specDetails?.freteInfo) },
                        { label: 'Meio de Pagamento', value: capitalizeText(specDetails?.meioPag) },
                        { label: 'Forma de Pagamento', value: capitalizeText(specDetails?.formaPag) },
                        { label: 'Faturamento', value: capitalizeText(specDetails?.faturamento) },
                        { label: 'Máquina Vinculada', value: capitalizeText(machineName) },
                        { label: 'Localização', value: capitalizeText(detailItem.physical_location) },
                        { label: 'Sobra/Falta Produção', value: detailItem.over_short_quantity ? (detailItem.over_short_quantity > 0 ? `+${detailItem.over_short_quantity}` : `${detailItem.over_short_quantity}`) : '—' },
                        { label: 'Falta na Entrega', value: detailItem.shortage_quantity ? `${detailItem.shortage_quantity} un` : '—' },
                        { label: 'Cortesia/Brinde', value: detailItem.courtesy_quantity ? `${detailItem.courtesy_quantity} un` : '—' },
                      ];

                      return specsList.map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </section>


                {/* Seção: Controle Financeiro & Contas a Receber (Estilo Conta Azul em Card) */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '4px', height: '14px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }} />
                      Contas a Receber & Parcelamento
                    </div>
                    {order.conta_azul_id && (
                      <button
                        type="button"
                        onClick={() => handleSyncSingleOrder(order.id)}
                        disabled={syncingSingleOrder}
                        className="btn btn-secondary"
                        title={syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar Conta Azul'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.68rem',
                          height: '24px',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={11} className={syncingSingleOrder ? 'spinner' : ''} />
                        <span className="desktop-only-inline">{syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar Conta Azul'}</span>
                      </button>
                    )}
                  </div>

                  {/* Descrição e Condição de Pagamento */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem', marginBottom: '2px' }}>
                      {order.payment_condition || `${order.installments_total || 1}x no Pix - Pagamento Instantâneo`}
                    </div>
                    <span style={{ fontSize: '0.75rem' }}>
                      Consulte na tabela abaixo, as informações presentes no seu financeiro (contas a receber):
                    </span>
                  </div>

                  {/* Tabela de Parcelas Estilo Conta Azul */}
                  {(() => {
                    const orderTransactions = financialTransactions.filter(t => t.order_id === order.id);
                    const totalOrderValue = Number(order.total_amount || 0) || orderItems.filter(i => i.order_id === order.id).reduce((acc, i) => acc + Number(i.total_price || 0), 0);

                    let installmentsList: any[] = [];

                    if (orderTransactions.length > 0) {
                      const sorted = [...orderTransactions].sort((a, b) => {
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return a.due_date.localeCompare(b.due_date);
                      });

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      installmentsList = sorted.map((t: any, index: number) => {
                        const statusUpper = (t.status || 'PENDENTE').toUpperCase();
                        const isPaid = ['CONCILIADO', 'QUITADO', 'BAIXADO'].includes(statusUpper);
                        const dueDate = t.due_date ? new Date(t.due_date + 'T00:00:00') : null;
                        const valor = Number(t.amount || 0);
                        const recebido = t.received_amount !== undefined && t.received_amount !== null ? Number(t.received_amount) : (isPaid ? valor : 0);
                        const emAberto = t.open_amount !== undefined && t.open_amount !== null ? Number(t.open_amount) : (isPaid ? 0 : valor);

                        let sitLabel = 'Em Aberto';
                        let sitBg = '#fef3c7'; // soft amber
                        let sitColor = '#d97706';

                        if (isPaid || emAberto === 0) {
                          sitLabel = 'Recebido';
                          sitBg = '#dcfce7'; // soft green
                          sitColor = '#16a34a';
                        } else if (dueDate && dueDate.getTime() < today.getTime()) {
                          sitLabel = 'Atrasado';
                          sitBg = '#fee2e2'; // soft red
                          sitColor = '#dc2626';
                        }

                        return {
                          vencimento: t.due_date ? new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
                          parcela: `${index + 1}/${sorted.length}`,
                          forma: order.payment_condition || 'Pix - Pagamento Instantâneo',
                          conta: 'Conta Banco',
                          valor,
                          recebido,
                          emAberto,
                          sitLabel,
                          sitBg,
                          sitColor
                        };
                      });
                    } else {
                      // Fallback virtual caso não tenha transações sincronizadas do CA
                      const totalInst = order.installments_total || 1;
                      const paidInst = order.installments_paid || 0;
                      const instValue = totalOrderValue > 0 ? totalOrderValue / totalInst : 0;
                      const baseDate = order.order_date ? new Date(order.order_date) : new Date();

                      for (let i = 0; i < totalInst; i++) {
                        const dueDate = new Date(baseDate);
                        dueDate.setDate(dueDate.getDate() + (i * 30));
                        const isPaid = i < paidInst;

                        installmentsList.push({
                          vencimento: dueDate.toLocaleDateString('pt-BR'),
                          parcela: `${i + 1}/${totalInst}`,
                          forma: order.payment_condition || 'Pix - Pagamento Instantâneo',
                          conta: 'Conta Banco',
                          valor: instValue,
                          recebido: isPaid ? instValue : 0,
                          emAberto: isPaid ? 0 : instValue,
                          sitLabel: isPaid ? 'Recebido' : 'Em Aberto',
                          sitBg: isPaid ? '#dcfce7' : '#fef3c7',
                          sitColor: isPaid ? '#16a34a' : '#d97706'
                        });
                      }
                    }

                    const totalRecebido = installmentsList.reduce((acc, item) => acc + item.recebido, 0);
                    const totalEmAberto = installmentsList.reduce((acc, item) => acc + item.emAberto, 0);
                    const totalEmAtraso = installmentsList.filter(item => item.sitLabel === 'Atrasado').reduce((acc, item) => acc + item.emAberto, 0);
                    const totalAReceber = totalEmAberto - totalEmAtraso;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Tabela */}
                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflowX: 'auto', backgroundColor: 'var(--surface)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left', minWidth: '650px' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.04)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.5rem 0.65rem', width: '32px' }}>
                                  <input type="checkbox" disabled style={{ borderRadius: '3px' }} />
                                </th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Vencimento</th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parcela</th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Forma de pagamento</th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Conta</th>
                                {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Valor R$</th>}
                                {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Recebido R$</th>}
                                {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Em aberto R$</th>}
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Situação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {installmentsList.map((inst, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '0.55rem 0.65rem' }}>
                                    <input type="checkbox" disabled style={{ borderRadius: '3px' }} />
                                  </td>
                                  <td style={{ padding: '0.55rem 0.65rem', fontWeight: 500 }}>{inst.vencimento}</td>
                                  <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>{inst.parcela}</td>
                                  <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>{inst.forma}</td>
                                  <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>{inst.conta}</td>
                                  {!hideMonetaryValues && (
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 600 }}>
                                      {inst.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  )}
                                  {!hideMonetaryValues && (
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 500 }}>
                                      {inst.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  )}
                                  {!hideMonetaryValues && (
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 500 }}>
                                      {inst.emAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  )}
                                  <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '2px 10px',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: inst.sitColor,
                                      backgroundColor: inst.sitBg
                                    }}>
                                      {inst.sitLabel}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Cards Resumo de Totais (Recebido / Em aberto) */}
                        {!hideMonetaryValues && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Card 1: Recebido */}
                            <div style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'var(--surface)'
                            }}>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>Recebido</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total recebido (R$)</span>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
                                  {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Card 2: Em aberto */}
                            <div style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'var(--surface)',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>Em aberto</span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total a receber (R$)</span>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16a34a' }}>
                                    {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>+</span>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total em atraso (R$)</span>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#dc2626' }}>
                                    {totalEmAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>=</span>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total em aberto (R$)</span>
                                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb' }}>
                                    {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </section>

                {/* Card: Informações de Manuseio & Produtos do Pedido */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Informações de Manuseio & Produtos do Pedido</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.3rem 0.75rem',
                        gap: '0.35rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-xs)'
                      }}
                      onClick={() => {
                        const itemsInOrder = orderItems.filter(i => i.order_id === order.id);
                        const targetItem = itemsInOrder.find(i => i.id === detailItem?.id) || itemsInOrder[0] || detailItem;
                        if (targetItem) {
                          handleOpenHandlingTeamModalForItem(targetItem, targetItem.stage_id);
                        }
                      }}
                      title="Editar ou vincular equipe de manuseio aos produtos deste pedido"
                    >
                      <Edit3 size={14} />
                      <span>Editar Equipe de Manuseio</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orderItems.filter(i => i.order_id === order.id).map((i: any) => {
                      const itemStage = stages.find(s => s.id === i.stage_id);
                      const isCurrent = i.id === detailItem.id;

                      // Resgata alocações do Map ou fallback para equipe vinculada ao item
                      let handlingAllocations = itemHandlingTeamsMap.get(i.id) || [];
                      if (handlingAllocations.length === 0 && i.handling_team_id) {
                        handlingAllocations = [{
                          id: i.id + '-default',
                          tenant_id: i.tenant_id,
                          order_item_id: i.id,
                          handling_team_id: i.handling_team_id,
                          quantity: Number(i.print_run || i.quantity || 0),
                          team: i.handling_team,
                          is_completed: false
                        }];
                      }

                      const totalItemQty = Number(i.print_run || i.quantity || 0);
                      const totalSaida = handlingAllocations.reduce((sum, a) => sum + Number(a.quantity || 0), 0);
                      const totalRetorno = handlingAllocations.reduce((sum, a) => sum + Number(a.return_quantity || 0), 0);
                      const faltamAlocar = Math.max(0, totalItemQty - totalSaida);
                      const faltamRetornar = Math.max(0, totalSaida - totalRetorno);
                      const isRetornoConferido = handlingAllocations.length > 0 && totalRetorno >= totalSaida && handlingAllocations.every(a => a.is_completed);
                      const isAllConferido = handlingAllocations.length > 0 && totalSaida >= totalItemQty && totalRetorno >= totalItemQty && handlingAllocations.every(a => a.is_completed);

                      return (
                        <div
                          key={i.id}
                          style={{
                            border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem 0.85rem',
                            backgroundColor: isCurrent ? 'hsla(var(--primary-rgb), 0.03)' : 'var(--background)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.55rem'
                          }}
                        >
                          {/* Cabeçalho do Item com Botão Fixado Abaixo do Número do Pedido/Item */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: '1 1 300px', minWidth: 0 }}>

                              {/* Coluna Esquerda Fixa: Número do Item + Botão de Atualizar Manuseio Embaixo */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '115px', flexShrink: 0 }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: isCurrent ? 'var(--primary)' : 'var(--surface)',
                                  color: isCurrent ? '#fff' : 'var(--text)',
                                  border: '1px solid var(--border)',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {i.friendly_id || '—'} {isCurrent && '(Atual)'}
                                </span>

                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.2rem 0.45rem',
                                    gap: '0.3rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    borderColor: 'var(--primary)',
                                    color: 'var(--primary)',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                  }}
                                  onClick={() => {
                                    handleOpenHandlingTeamModalForItem(i, i.stage_id);
                                  }}
                                  title="Atualizar saídas, retornos e conferências de manuseio deste item"
                                >
                                  <RefreshCw size={11} />
                                  <span>Atualizar Manuseio</span>
                                </button>
                              </div>

                              {/* Coluna de Descrição/Nome do Produto (Espaço Amplo Garantido) */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', wordBreak: 'break-word', lineHeight: '1.3' }}>
                                  {i.name}
                                </span>
                                {i.measure && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Medida: <strong>{i.measure}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Informações da Direita: Tiragem, Estágio e Código de Manuseio Discreto */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
                                <span>Tiragem: <strong>{totalItemQty.toLocaleString('pt-BR')} un</strong></span>
                                <span style={{
                                  color: itemStage?.color || 'var(--text-muted)',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '99px',
                                  backgroundColor: 'var(--surface)',
                                  border: '1px solid var(--border)'
                                }}>
                                  {itemStage?.name || 'A produzir'}
                                </span>
                              </div>

                              {/* Exibição Discreta do Código de Manuseio */}
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Cód. Manuseio: <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                                  {handlingAllocations.map(a => (a.handling_code || '').replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS')).filter(Boolean).join(', ') || `MS${(i.friendly_id || '262/1').replace(/^PV-?/i, '')}/1`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* EXIBIÇÃO DE OCORRÊNCIA DE FALTA / AVARIA REGISTRADA OU RESOLVIDA */}
                          {(() => {
                            const itemShortages = shortagesMap.get(i.id) || [];
                            const pendingShortage = itemShortages.find(s => s.status === 'PENDENTE_EXPEDICAO');
                            const resolvedShortage = itemShortages.find(s => s.status === 'RESOLVIDO');

                            if (pendingShortage) {
                              return (
                                <div style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.12)',
                                  border: '1.5px solid hsla(0, 84.2%, 60.2%, 0.4)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: 'hsl(0, 84.2%, 45%)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={16} />
                                    <div>
                                      <div>🚨 FALTA / AVARIA REGISTRADA: {pendingShortage.shortage_quantity.toLocaleString('pt-BR')} un (Pendente Expedição)</div>
                                      <div style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.9 }}>
                                        Motivo: {pendingShortage.reason === 'MANUSEIO_AVARIA' ? 'Avaria no Manuseio' : pendingShortage.reason === 'PRODUCAO_DEFECT' ? 'Falta na Produção' : pendingShortage.reason}
                                        {pendingShortage.notes ? ` — "${pendingShortage.notes}"` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{
                                      padding: '0.3rem 0.65rem',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      backgroundColor: 'hsl(0, 84.2%, 48%)',
                                      borderColor: 'hsl(0, 84.2%, 48%)',
                                      color: '#fff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      border: 'none'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpeditionTargetShortage(pendingShortage);
                                      setExpeditionTargetItem(i);
                                      setExpeditionResolutionType('DESCONTO_FATURA');
                                      setExpeditionResolutionNotes('');
                                      setIsExpeditionModalOpen(true);
                                    }}
                                  >
                                    <Scale size={13} />
                                    <span>💳 Resolver na Expedição</span>
                                  </button>
                                </div>
                              );
                            }

                            if (resolvedShortage) {
                              return (
                                <div style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'hsla(142, 71%, 45%, 0.12)',
                                  border: '1px solid hsla(142, 71%, 45%, 0.3)',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: 'hsl(142, 71%, 32%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}>
                                  <CheckCircle2 size={14} />
                                  <span>Ocorrência de Falta ({resolvedShortage.shortage_quantity.toLocaleString('pt-BR')} un) Resolvida na Expedição — <strong>{resolvedShortage.resolution_type === 'DESCONTO_FATURA' ? '🟢 Débito / Desconto na Fatura' : resolvedShortage.resolution_type === 'REPOSICAO' ? '🔵 Re-Impressão / Reposição' : '🟡 Aceite Parcial'}</strong></span>
                                </div>
                              );
                            }

                            return null;
                          })()}

                          {/* Resumo/Status Evidente das Informações de Manuseio */}
                          {handlingAllocations.length > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: isAllConferido ? 'hsla(142, 71%, 45%, 0.1)' : 'hsla(45, 93%, 47%, 0.1)',
                              border: `1px solid ${isAllConferido ? 'hsla(142, 71%, 45%, 0.3)' : 'hsla(45, 93%, 47%, 0.3)'}`
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: isAllConferido ? 'hsl(142, 71%, 35%)' : isRetornoConferido ? 'hsl(38, 92%, 35%)' : 'hsl(45, 93%, 35%)' }}>
                                <CheckCircle2 size={14} />
                                <span>
                                  {isAllConferido
                                    ? '✓ MANUSEIO TOTALMENTE CONFERIDO E FINALIZADO'
                                    : isRetornoConferido
                                      ? `✓ RETORNO CONFERIDO (FALTAM ALOCAR ${faltamAlocar.toLocaleString('pt-BR')} UN DA TIRAGEM)`
                                      : '⌛ MANUSEIO EM ANDAMENTO'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.73rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                                <span>Total Saída: <strong style={{ color: 'var(--text)' }}>{totalSaida.toLocaleString('pt-BR')} un</strong></span>
                                <span>Total Retorno: <strong style={{ color: isRetornoConferido ? 'hsl(142, 71%, 35%)' : 'var(--text)' }}>{totalRetorno.toLocaleString('pt-BR')} un</strong></span>
                                {faltamRetornar > 0 ? (
                                  <span style={{
                                    color: 'hsl(0, 84.2%, 45%)',
                                    fontWeight: 800,
                                    backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.12)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid hsla(0, 84.2%, 60.2%, 0.25)'
                                  }}>
                                    Faltam {faltamRetornar.toLocaleString('pt-BR')} un retornar
                                  </span>
                                ) : faltamAlocar > 0 ? (
                                  <span style={{
                                    color: 'hsl(38, 92%, 35%)',
                                    fontWeight: 800,
                                    backgroundColor: 'hsla(45, 93%, 47%, 0.15)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid hsla(45, 93%, 47%, 0.3)'
                                  }}>
                                    ⚠️ Faltam alocar {faltamAlocar.toLocaleString('pt-BR')} un
                                  </span>
                                ) : isAllConferido ? (
                                  <span style={{
                                    color: 'hsl(142, 71%, 35%)',
                                    fontWeight: 800,
                                    backgroundColor: 'hsla(142, 71%, 45%, 0.12)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid hsla(142, 71%, 45%, 0.3)'
                                  }}>
                                    ✓ 100% Retornado
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          )}

                          {/* Grade de Alocações / Retornos de Manuseio */}
                          {handlingAllocations.length > 0 ? (
                            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                <thead>
                                  <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0.35rem 0.6rem' }}>Cód. / Equipe</th>
                                    <th style={{ padding: '0.35rem 0.6rem' }}>Data Saída</th>
                                    <th style={{ padding: '0.35rem 0.6rem', textAlign: 'right' }}>Qtd Saída</th>
                                    <th style={{ padding: '0.35rem 0.6rem' }}>Data Retorno</th>
                                    <th style={{ padding: '0.35rem 0.6rem', textAlign: 'right' }}>Qtd Retorno</th>
                                    <th style={{ padding: '0.35rem 0.6rem', textAlign: 'center' }}>Conferência</th>
                                    <th style={{ padding: '0.35rem 0.6rem', textAlign: 'right' }}>Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {handlingAllocations.map((alloc, aIdx) => {
                                    const teamName = alloc.team?.name || handlingTeams.find(t => t.id === alloc.handling_team_id)?.name || 'Equipe de Manuseio';
                                    const hCode = (alloc.handling_code || `MS${(i.friendly_id || '262/1').replace(/^PV-?/i, '')}/${aIdx + 1}`).replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS');
                                    return (
                                      <tr key={aIdx} style={{ borderBottom: aIdx < handlingAllocations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <td style={{ padding: '0.35rem 0.6rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.7rem', marginRight: '5px', whiteSpace: 'nowrap' }}>[{hCode}]</span>
                                          <span style={{ color: 'var(--primary)', whiteSpace: 'nowrap' }}>{teamName}</span>
                                        </td>
                                        <td style={{ padding: '0.35rem 0.6rem', color: alloc.departure_date ? 'var(--text)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                                          {alloc.departure_date ? new Date(alloc.departure_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Pendente'}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                          {Number(alloc.quantity || 0).toLocaleString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.6rem', color: (alloc.return_date || alloc.completed_at) ? 'var(--text)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                                          {(alloc.return_date || alloc.completed_at) ? new Date((alloc.return_date || alloc.completed_at) + 'T00:00:00').toLocaleDateString('pt-BR') : 'Pendente'}
                                        </td>
                                        <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                          {Number(alloc.return_quantity || 0).toLocaleString('pt-BR')}
                                        </td>
                                        <td style={{ padding: "0.35rem 0.6rem", textAlign: "center" }}>
                                          <span style={{
                                            fontSize: "0.68rem",
                                            fontWeight: 700,
                                            padding: "3px 8px",
                                            borderRadius: "99px",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.3rem",
                                            backgroundColor: alloc.is_completed ? "hsla(142, 71%, 45%, 0.12)" : "hsla(45, 93%, 47%, 0.12)",
                                            color: alloc.is_completed ? "hsl(142, 71%, 32%)" : "hsl(45, 93%, 32%)",
                                            border: `1px solid ${alloc.is_completed ? "hsla(142, 71%, 45%, 0.3)" : "hsla(45, 93%, 47%, 0.3)"}`,
                                            whiteSpace: "nowrap"
                                          }}>
                                            {alloc.is_completed ? (
                                              <>
                                                <CheckCircle2 size={12} />
                                                <span>Conferido</span>
                                              </>
                                            ) : (
                                              <>
                                                <Clock size={12} />
                                                <span>Pendente</span>
                                              </>
                                            )}
                                          </span>
                                        </td>
                                        <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right' }}>
                                          <button
                                            type="button"
                                            className="btn btn-outline"
                                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', gap: '0.2rem', alignItems: 'center' }}
                                            onClick={() => handleOpenHandlingTeamModalForItem(i, i.stage_id, alloc.id)}
                                            title="Editar somente esta equipe de manuseio"
                                          >
                                            <Edit3 size={11} /> Editar Equipe
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', padding: '0.45rem 0.65rem', borderRadius: '4px', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>Nenhuma equipe de manuseio vinculada a este item ainda.</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Clique em "Atualizar Manuseio" para alocar equipe e controlar o retorno.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>


                {/* Seção: Observações e Anotações Internas */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Observações e Anotações Internas
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Observações (Visível para todos)</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre-wrap', backgroundColor: 'var(--background)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        {detailItem.notes || order.notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma observação informada.</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Anotações Internas (Uso Interno)</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre-wrap', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px dashed var(--primary)' }}>
                        {order.internal_notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma anotação interna informada.</span>}
                      </div>
                    </div>
                  </div>
                </section>

              </div>

              {/* Rodapé do Modal com Botões Padrão */}
              {/* Rodapé Padrão do Modal */}
              <div style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                backgroundColor: 'var(--surface-subtle, transparent)'
              }}>
                <button
                  onClick={() => {
                    const text = `PV: ${order.pv_number || '—'}\nCliente: ${customer.name || '—'}\nArte: ${detailItem.name}\nTiragem: ${detailItem.print_run} un`;
                    navigator.clipboard.writeText(text);
                    showToast('Resumo copiado para a área de transferência!');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Copy size={13} />
                  <span>Copiar Resumo</span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {isAdmin && isManualOrder(order) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleRequestDeleteManualOrder(order, detailItem);
                      }}
                      className="btn btn-danger"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Excluir este pedido manual definitivamente"
                    >
                      <Trash2 size={13} />
                      <span>Excluir Pedido Manual</span>
                    </button>
                  )}

                  {!isManualOrder(order) && (
                    <button
                      onClick={() => handleSyncSingleOrder(order.id)}
                      disabled={syncingSingleOrder}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <RefreshCw size={13} className={syncingSingleOrder ? 'spinner' : ''} />
                      <span>{syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>
                  )}

                  {(!user?.role || user.role !== 'Produção' || currentStage?.name === 'Em produção') && (
                    <button
                      onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Edit3 size={13} />
                      <span>Editar Pedido</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                  >
                    Fechar
                  </button>
                </div>
              </div>

            </div>
          </div>

        );
}
