'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getOrders,
  getFinancialTransactions,
  getProducts,
  getOrderItems
} from '@/services/supabase';
import { Skeleton, TableRowSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  ShoppingBag,
  Wrench,
  Truck,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const currency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long',
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [waitingProductionStartItems, setWaitingProductionStartItems] = useState<any[]>([]);

  // Estados para modais de listagem e detalhes a partir dos indicadores
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [updatingPayments, setUpdatingPayments] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  const handleUpdatePayments = async () => {
    if (updatingPayments) return;
    setUpdatingPayments(true);
    setSyncResult(null);
    setSyncStep('Iniciando comunicação com o Conta Azul...');
    setSyncProgress(5);
    setIsSyncModalOpen(true);

    try {
      const total = filteredOrders.length;
      let successCount = 0;

      for (let i = 0; i < total; i++) {
        const o = filteredOrders[i];
        const percent = Math.round(5 + ((i / total) * 90));
        setSyncProgress(percent);
        setSyncStep(`Atualizando faturamento PV-${o.pv_number?.replace(/\D/g, '')}...`);

        try {
          const res = await fetch('/api/sync/import-single-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: o.id, userRole: user?.role })
          });
          if (res.ok) {
            successCount++;
          } else {
            console.warn(`Falha ao sincronizar faturamento do pedido ${o.pv_number}`);
          }
        } catch (err) {
          console.error(`Erro ao sincronizar PV-${o.pv_number}:`, err);
        }
      }

      setSyncProgress(100);
      setSyncStep('Atualização de pagamentos finalizada!');
      setSyncResult({
        success: true,
        message: `Sucesso: ${successCount} de ${total} pagamentos atualizados com o Conta Azul.`
      });
      await fetchData();
    } catch (err) {
      console.error('Erro na sincronização de pagamentos:', err);
      setSyncResult({
        success: false,
        message: 'Erro inesperado durante a atualização dos pagamentos.'
      });
    } finally {
      setUpdatingPayments(false);
    }
  };

  const openIndicatorList = (label: string) => {
    let itemsList: any[] = [];
    if (label === 'Pedidos Ativos') {
      itemsList = orderItems.filter(i => {
        const stageName = i.stage?.name || 'A produzir';
        return !['Concluído', 'Entregue', 'Pago'].includes(stageName);
      });
    } else if (label === 'Na Linha de Produção') {
      itemsList = orderItems.filter(i => {
        const stageName = i.stage?.name || 'A produzir';
        return ['Em produção', 'Manuseio', 'Em revisão'].includes(stageName);
      });
    } else if (label === 'Aguardando Expedição') {
      itemsList = orderItems.filter(i => i.stage?.name === 'Expedição');
    } else if (label === 'Pedidos Atrasados') {
      itemsList = orderItems.filter(i => i.stage?.name === 'Atrasado');
    } else if (label === 'Pedidos Sem Pagamento') {
      itemsList = orderItems.filter(i => {
        const order = i.order || {};
        const stageName = i.stage?.name || 'A produzir';
        return !order.first_payment_date && order.op_number && !['Concluído', 'Entregue', 'Pago'].includes(stageName);
      });
    }

    // Extrair os pedidos únicos a partir desses itens e popular o modal
    const uniqueOrderIds = Array.from(new Set(itemsList.map(i => i.order_id)));
    const list = orders.filter(o => uniqueOrderIds.includes(o.id));

    if (list.length === 0) {
      alert(`Nenhum pedido correspondente ao indicador "${label}".`);
      return;
    }

    setSelectedIndicator(label);
    setFilteredOrders(list);
    setIsListModalOpen(true);
  };

  const openOrderDetails = (order: any) => {
    const orderFinance = finance.filter(f => f.order_id === order.id);
    setSelectedOrderDetails({ ...order, finance: orderFinance });
    setIsDetailsModalOpen(true);
  };

  const [stats, setStats] = useState({
    totalBilling: 0,
    activeOrdersCount: 0,
    inProductionCount: 0,
    shippedCount: 0,
    lateOrdersCount: 0,
    receivablesPending: 0,
    payablesPending: 0,
    blockedWaitingPaymentCount: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, financeRes, productsRes, itemsRes] = await Promise.all([
        getOrders(),
        getFinancialTransactions(),
        getProducts(),
        getOrderItems()
      ]);

      const fetchedOrders: any[] = ordersRes.data || [];
      const fetchedFinance: any[] = financeRes.data || [];
      const fetchedProducts: any[] = productsRes.data || [];
      const fetchedItems: any[] = itemsRes.data || [];

      setOrders(fetchedOrders);
      setFinance(fetchedFinance);
      setProducts(fetchedProducts);

      // Join de itens com produtos e ordens
      const joinedItems = fetchedItems.map((item: any) => {
        const prod = fetchedProducts.find((p: any) => p.id === item.product_id) || item.product || null;
        const order = fetchedOrders.find((o: any) => o.id === item.order_id) || item.order || null;
        return {
          ...item,
          product: prod,
          order: order
        };
      });

      // Filtra apenas itens de produção válidos (excluindo vinculados)
      const validItems = joinedItems.filter(i => i.product?.bind_to_first_item !== true);
      setOrderItems(validItems);

      // 1. Pedidos Ativos (Itens de Pedido Ativos)
      const activeItems = validItems.filter(i => {
        const stageName = i.stage?.name || 'A produzir';
        return !['Concluído', 'Entregue', 'Pago'].includes(stageName);
      });

      // 2. Na Linha de Produção (Itens em Em produção, Manuseio ou Em revisão - Exclui 'A produzir')
      const inProductionItems = validItems.filter(i => {
        const stageName = i.stage?.name || 'A produzir';
        return ['Em produção', 'Manuseio', 'Em revisão'].includes(stageName);
      });

      // 3. Aguardando Expedição (Itens em Expedição)
      const shippedItems = validItems.filter(i => i.stage?.name === 'Expedição');

      // 4. Pedidos Atrasados (Itens em Atrasado)
      const lateItems = validItems.filter(i => i.stage?.name === 'Atrasado');

      // 5. Pedidos Sem Pagamento (Itens ativos com OP gerada mas sem first_payment_date)
      const blockedItems = validItems.filter(i => {
        const order = i.order || {};
        const stageName = i.stage?.name || 'A produzir';
        return !order.first_payment_date && order.op_number && !['Concluído', 'Entregue', 'Pago'].includes(stageName);
      });

      // 6. Aguardando Início de Produção (Itens em A produzir e que já possuem sinal/pagamento)
      const waitingStart = validItems.filter(i => {
        const stageName = i.stage?.name || 'A produzir';
        const isFirstStage = stageName === 'A produzir' || !i.stage_id;
        const isPaid = i.order?.first_payment_date || (i.order?.conta_azul_status || '').toLowerCase() === 'aprovado';
        return isFirstStage && isPaid;
      });

      setWaitingProductionStartItems(waitingStart);

      setStats({
        totalBilling: 0,
        activeOrdersCount: activeItems.length,
        inProductionCount: inProductionItems.length,
        shippedCount: shippedItems.length,
        lateOrdersCount: lateItems.length,
        receivablesPending: 0,
        payablesPending: 0,
        blockedWaitingPaymentCount: blockedItems.length
      });
    } catch (e) {
      console.error('Error calculating dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleRoleChange = () => fetchData();
    window.addEventListener('samppel_role_changed', handleRoleChange);
    return () => window.removeEventListener('samppel_role_changed', handleRoleChange);
  }, []);

  /* ── Status colors ─────────────────────────────── */
  const statusColors: Record<string, string> = {
    'A produzir': 'var(--info)',
    'Em revisão': 'var(--warning)',
    'Expedição': 'var(--primary)',
    'Entregue': 'var(--success)',
    'Faturado': 'var(--secondary)',
    'Pago': 'var(--success)',
    'Atrasado': 'var(--danger)'
  };

  /* ── Skeleton ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: '2rem' }}>
          <Skeleton height={28} width={220} style={{ marginBottom: '6px' }} />
          <Skeleton height={16} width={160} />
        </div>
        <div className="dashboard-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton height={12} width="55%" style={{ marginBottom: '12px' }} />
              <Skeleton height={36} width="40%" />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="card">
          <Skeleton height={18} width={260} style={{ marginBottom: '1.25rem' }} />
          <div className="table-responsive">
            <table className="table">
              <thead><tr>
                {['PV / OP', 'Cliente', 'Produto', 'Tiragem', 'Setor', 'Status', 'Vendedora', 'Data'].map(h => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ── Chart data ────────────────────────────────── */
  const sectors = ['Impressão', 'Corte e Vinco', 'Colagem', 'Guilhotina', 'Manuseio', 'Expedição', 'Estoque'];
  const sectorCounts = sectors.map(s =>
    orders.filter(o => o.production_sector === s && !['Entregue', 'Pago'].includes(o.status)).length
  );
  const maxSector = Math.max(...sectorCounts, 1);

  const statuses = ['A produzir', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado'];

  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {greet()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {today}
          </p>
        </div>
        <button
          onClick={fetchData}
          title="Atualizar dados"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 0.875rem', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <RefreshCw size={14} />
          <span>Atualizar</span>
        </button>
      </header>

      {/* ── Metric Cards ─────────────────────────── */}
      <div className="dashboard-grid">
        <MetricCard
          label="Pedidos Ativos"
          value={stats.activeOrdersCount}
          icon={<ShoppingBag size={20} />}
          iconBg="rgba(var(--primary-rgb), 0.1)"
          iconColor="var(--primary)"
          onClick={() => openIndicatorList('Pedidos Ativos')}
        />
        <MetricCard
          label="Na Linha de Produção"
          value={stats.inProductionCount}
          icon={<Wrench size={20} />}
          iconBg="rgba(217, 119, 6, 0.1)"
          iconColor="var(--warning)"
          onClick={() => openIndicatorList('Na Linha de Produção')}
        />
        <MetricCard
          label="Aguardando Expedição"
          value={stats.shippedCount}
          icon={<Truck size={20} />}
          iconBg="rgba(22, 163, 74, 0.1)"
          iconColor="var(--success)"
          onClick={() => openIndicatorList('Aguardando Expedição')}
        />
        <MetricCard
          label="Pedidos Atrasados"
          value={stats.lateOrdersCount}
          icon={<AlertTriangle size={20} />}
          iconBg="rgba(220, 38, 38, 0.1)"
          iconColor="var(--danger)"
          alert={stats.lateOrdersCount > 0}
          onClick={() => openIndicatorList('Pedidos Atrasados')}
        />
        <MetricCard
          label="Pedidos Sem Pagamento"
          value={stats.blockedWaitingPaymentCount}
          icon={<AlertTriangle size={20} />}
          iconBg="rgba(217, 119, 6, 0.08)"
          iconColor="var(--warning)"
          alert={stats.blockedWaitingPaymentCount > 0}
          alertColor="var(--warning)"
          onClick={() => openIndicatorList('Pedidos Sem Pagamento')}
        />
      </div>

      {/* ── Charts ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Chart 1 — Production by Sector */}
        <div className="card">
          <ChartTitle icon={<Wrench size={16} />} label="Itens em cada Fluxo" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {sectors.map((sector, i) => {
              const count = orderItems.filter(item => item.production_sector === sector && !['Concluído', 'Entregue', 'Pago'].includes(item.stage?.name || 'A produzir')).length;
              const pct = Math.max((count / maxSector) * 100, count > 0 ? 4 : 0);
              return (
                <div key={sector}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{sector}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{count} {count === 1 ? 'item' : 'itens'}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      backgroundColor: sector === 'Expedição' ? 'var(--success)' : 'var(--primary)',
                      borderRadius: '9999px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2 — Aguardando Início de Produção */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <ChartTitle icon={<AlertTriangle size={16} />} label="Aguardando Início de Produção" />
            {waitingProductionStartItems.length > 0 && (
              <span className="badge" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', fontWeight: 700 }}>
                {waitingProductionStartItems.length} {waitingProductionStartItems.length === 1 ? 'pendente' : 'pendentes'}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '280px' }} className="no-scrollbar">
            {waitingProductionStartItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</span>
                <span>Tudo em dia! Nenhum item pago está parado na coluna de entrada.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>
                  Estes itens já possuem pagamento/sinal confirmado, mas ainda não foram movidos para a produção física:
                </p>
                {waitingProductionStartItems.map((item) => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'hsla(38, 92.7%, 50.2%, 0.05)',
                      border: '1px solid hsla(38, 92.7%, 50.2%, 0.2)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {item.friendly_id} ({item.order?.pv_number})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Pago: {item.order?.first_payment_date ? new Date(item.order.first_payment_date).toLocaleDateString('pt-BR') : 'Aprovado'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.name}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      Cliente: {item.order?.customer?.name || 'Cliente Genérico'} • Tiragem: {item.print_run?.toLocaleString('pt-BR')} un
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders Table ───────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Últimas Movimentações</h3>
          <Link
            href="/pedidos"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 500 }}
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-responsive" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>PV / OP</th>
                <th>Nome Arte (Cliente)</th>
                <th>Produto / Medida</th>
                <th>Tiragem</th>
                <th>Setor / Local</th>
                <th>Status</th>
                <th>Vendedora</th>
                <th>Lançamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div>{order.pv_number || `PV-${order.order_number}`}</div>
                    {order.op_number && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 500 }}>{order.op_number}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.art_name || 'Arte Genérica'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{order.product?.name || 'Produto deletado'}</div>
                    <code style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', backgroundColor: 'var(--surface-hover)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      {order.measure}
                    </code>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{order.print_run?.toLocaleString('pt-BR')} un</td>
                  <td>
                    <div>{order.production_sector}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.physical_location || 'Salão'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      backgroundColor: statusColors[order.status] + '18',
                      color: statusColors[order.status],
                      fontSize: '0.6875rem'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{order.seller_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(order.order_date).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Nenhum pedido cadastrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE LISTAGEM DE PEDIDOS DO INDICADOR */}
      {isListModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsListModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--background)'
            }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>
                  {selectedIndicator}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedIndicator === 'Pedidos Sem Pagamento' && (
                  <button
                    disabled={updatingPayments}
                    onClick={handleUpdatePayments}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'opacity 0.2s',
                      opacity: updatingPayments ? 0.7 : 1
                    }}
                  >
                    <RefreshCw 
                      size={13} 
                      style={{
                        animation: updatingPayments ? 'spin 1.2s linear infinite' : 'none'
                      }}
                    />
                    {updatingPayments ? 'Atualizando...' : 'Atualizar Pagamentos'}
                  </button>
                )}
                <button
                  onClick={() => setIsListModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  &times;
                </button>
              </div>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', padding: '1rem' }}>
              <div className="table-responsive">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>PV / OP</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Produto</th>
                      <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr 
                        key={o.id}
                        onClick={() => openOrderDetails(o)}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          <div>{o.pv_number}</div>
                          {o.op_number && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500 }}>{o.op_number}</div>}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                          {o.customer?.name || 'Cliente Desconhecido'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {o.art_name}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span className="badge" style={{
                            backgroundColor: (statusColors[o.status] || 'var(--primary)') + '15',
                            color: statusColors[o.status] || 'var(--primary)',
                            border: `1px solid ${(statusColors[o.status] || 'var(--primary)')}30`
                          }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE STATUS DE ATUALIZAÇÃO CONTA AZUL (PAGAMENTOS EM LOTE) */}
      {isSyncModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '2rem', maxWidth: '420px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}>
              <RefreshCw 
                size={20} 
                style={{ 
                  color: 'var(--primary)', 
                  animation: updatingPayments ? 'spin 1.2s linear infinite' : 'none' 
                }} 
              />
              Atualização de Pagamentos
            </h2>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 500 }}>
              Conta Azul &bull; Em lote
            </div>

            {/* Progresso */}
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${syncProgress}%`,
                  backgroundColor: syncResult && !syncResult.success ? 'var(--danger)' : 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease-out'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'left', flex: 1, paddingRight: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={syncStep}>
                  {syncStep}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 700 }}>
                  {syncProgress}%
                </span>
              </div>
            </div>

            {/* Resultados / Erros */}
            {syncResult && (
              <div style={{
                backgroundColor: syncResult.success ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                border: `1px solid ${syncResult.success ? '#2ed573' : 'var(--danger)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                {syncResult.success ? (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ed573', fontSize: '0.9rem', fontWeight: 700 }}>
                      Sincronizado com Sucesso
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {syncResult.message}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>
                      Falha na Sincronização
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {syncResult.message}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botão de Fechar */}
            <button
              disabled={updatingPayments}
              onClick={() => {
                setIsSyncModalOpen(false);
                setIsListModalOpen(false);
              }}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.6rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                cursor: updatingPayments ? 'not-allowed' : 'pointer',
                opacity: updatingPayments ? 0.6 : 1,
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--text)'
              }}
            >
              {updatingPayments ? 'Aguarde finalização...' : 'Fechar'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO PEDIDO SELECIONADO */}
      {isDetailsModalOpen && selectedOrderDetails && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsDetailsModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--background)'
            }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Pedido {selectedOrderDetails.pv_number}</span>
                  {selectedOrderDetails.op_number && <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>({selectedOrderDetails.op_number})</span>}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Cadastrado em {new Date(selectedOrderDetails.order_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Grid Informações Principais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {/* Bloco Pedido */}
                <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Dados de Produção</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Produto:</strong> {selectedOrderDetails.art_name}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Tiragem:</strong> {selectedOrderDetails.print_run?.toLocaleString('pt-BR')} unidades</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Medida:</strong> {selectedOrderDetails.measure}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Setor Físico:</strong> {selectedOrderDetails.production_sector || 'Não definido'}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Status Kanban:</strong> {selectedOrderDetails.status}</div>
                  </div>
                </div>

                {/* Bloco Cliente */}
                <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Dados do Cliente</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Cliente:</strong> {selectedOrderDetails.customer?.name || 'Não informado'}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Documento:</strong> {selectedOrderDetails.customer?.document || 'Não informado'}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> {selectedOrderDetails.customer?.email || 'Não informado'}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Celular:</strong> {selectedOrderDetails.customer?.phone || 'Não informado'}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Vendedora:</strong> {selectedOrderDetails.seller_name}</div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {selectedOrderDetails.customer?.address && (
                <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Endereço de Entrega:</strong> {selectedOrderDetails.customer.address}
                </div>
              )}

              {/* Bloco Financeiro */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Contas a Receber (Conta Azul)</h4>
                {selectedOrderDetails.finance && selectedOrderDetails.finance.length > 0 ? (
                  <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <table className="table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Parcela</th>
                          <th>Vencimento</th>
                          <th>Valor</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrderDetails.finance.map((f: any, idx: number) => {
                          const statusColor = 
                            f.status === 'QUITADO' || f.status === 'BAIXADO' || f.status === 'CONCILIADO' ? 'var(--success)' :
                            f.status === 'ATRASADO' ? 'var(--danger)' : 'var(--warning)';
                          return (
                            <tr key={f.id || idx}>
                              <td style={{ fontWeight: 600 }}>{f.description || `Parcela ${idx + 1}`}</td>
                              <td>{f.due_date ? new Date(f.due_date).toLocaleDateString('pt-BR') : '---'}</td>
                              <td style={{ fontWeight: 600 }}>{currency(f.amount)}</td>
                              <td>
                                <span className="badge" style={{
                                  backgroundColor: statusColor + '15',
                                  color: statusColor,
                                  border: `1px solid ${statusColor}30`
                                }}>
                                  {f.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Nenhuma parcela financeira localizada para este pedido.
                  </div>
                )}
              </div>

              {/* Observações */}
              {selectedOrderDetails.notes && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Observações Comerciais</h4>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--background)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    margin: 0,
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>{selectedOrderDetails.notes}</pre>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────── */

function MetricCard({ label, value, icon, iconBg, iconColor, alert = false, alertColor = 'var(--danger)', onClick }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
  alertColor?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{ 
        padding: '1.25rem 1.375rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        userSelect: 'none'
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', backgroundColor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.625rem', fontWeight: 700, color: alert ? alertColor : 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      {alert && Number(value) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.6875rem', fontWeight: 600, color: alertColor }}>
          <AlertTriangle size={11} />
          Requer atenção
        </div>
      )}
    </div>
  );
}

function ChartTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{label}</h3>
    </div>
  );
}
