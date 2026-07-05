'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getOrders,
  getFinancialTransactions,
  getProducts
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
      const [ordersRes, financeRes, productsRes] = await Promise.all([
        getOrders(),
        getFinancialTransactions(),
        getProducts()
      ]);

      const fetchedOrders: any[] = ordersRes.data || [];
      const fetchedFinance: any[] = financeRes.data || [];
      const fetchedProducts: any[] = productsRes.data || [];

      setOrders(fetchedOrders);
      setFinance(fetchedFinance);
      setProducts(fetchedProducts);

      const activeOrders = fetchedOrders.filter(o => !['Entregue', 'Pago'].includes(o.status));
      const inProduction = fetchedOrders.filter(o => ['A produzir', 'Em produção', 'Manuseio', 'Em revisão'].includes(o.status));
      const shipped = fetchedOrders.filter(o => o.status === 'Expedição');
      const late = fetchedOrders.filter(o => o.status === 'Atrasado');
      const blocked = fetchedOrders.filter(o => !o.first_payment_date && o.op_number && !['Entregue', 'Pago'].includes(o.status));

      const billing = fetchedFinance
        .filter(f => f.type === 'RECEITA' && f.status === 'CONCILIADO')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const recPending = fetchedFinance
        .filter(f => f.type === 'RECEITA' && f.status === 'PENDENTE')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const payPending = fetchedFinance
        .filter(f => f.type === 'DESPESA' && f.status === 'PENDENTE')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      setStats({
        totalBilling: billing,
        activeOrdersCount: activeOrders.length,
        inProductionCount: inProduction.length,
        shippedCount: shipped.length,
        lateOrdersCount: late.length,
        receivablesPending: recPending,
        payablesPending: payPending,
        blockedWaitingPaymentCount: blocked.length
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
  const sectors = ['Impressão', 'Corte e Vinco', 'Colagem', 'Expedição'];
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
            {greet()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
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
      {user?.role === 'Produção' ? (
        <div className="dashboard-grid">
          <MetricCard
            label="Pedidos Ativos"
            value={stats.activeOrdersCount}
            icon={<ShoppingBag size={20} />}
            iconBg="rgba(var(--primary-rgb), 0.1)"
            iconColor="var(--primary)"
          />
          <MetricCard
            label="Na Linha de Produção"
            value={stats.inProductionCount}
            icon={<Wrench size={20} />}
            iconBg="rgba(217, 119, 6, 0.1)"
            iconColor="var(--warning)"
          />
          <MetricCard
            label="Aguardando Expedição"
            value={stats.shippedCount}
            icon={<Truck size={20} />}
            iconBg="rgba(22, 163, 74, 0.1)"
            iconColor="var(--success)"
          />
          <MetricCard
            label="Pedidos Atrasados"
            value={stats.lateOrdersCount}
            icon={<AlertTriangle size={20} />}
            iconBg="rgba(220, 38, 38, 0.1)"
            iconColor="var(--danger)"
            alert={stats.lateOrdersCount > 0}
          />
          <MetricCard
            label="Travados (Sem Pgto)"
            value={stats.blockedWaitingPaymentCount}
            icon={<AlertTriangle size={20} />}
            iconBg="rgba(217, 119, 6, 0.08)"
            iconColor="var(--warning)"
            alert={stats.blockedWaitingPaymentCount > 0}
            alertColor="var(--warning)"
          />
        </div>
      ) : (
        <div className="dashboard-grid">
          {(user?.role === 'Administrador' || user?.role === 'Financeiro') && (
            <MetricCard
              label="Faturamento Liquidado"
              value={currency(stats.totalBilling)}
              icon={<TrendingUp size={20} />}
              iconBg="rgba(22, 163, 74, 0.1)"
              iconColor="var(--success)"
            />
          )}
          <MetricCard
            label="Pedidos Ativos"
            value={stats.activeOrdersCount}
            icon={<ShoppingBag size={20} />}
            iconBg="rgba(var(--primary-rgb), 0.1)"
            iconColor="var(--primary)"
          />
          <MetricCard
            label="A Receber (Pendente)"
            value={currency(stats.receivablesPending)}
            icon={<ArrowUpRight size={20} />}
            iconBg="rgba(var(--primary-rgb), 0.08)"
            iconColor="var(--primary)"
          />
          <MetricCard
            label="Contas a Pagar"
            value={currency(stats.payablesPending)}
            icon={<ArrowDownRight size={20} />}
            iconBg="rgba(220, 38, 38, 0.08)"
            iconColor="var(--danger)"
          />
          <MetricCard
            label="Pedidos Sem Pagamento"
            value={stats.blockedWaitingPaymentCount}
            icon={<AlertTriangle size={20} />}
            iconBg="rgba(217, 119, 6, 0.08)"
            iconColor="var(--warning)"
            alert={stats.blockedWaitingPaymentCount > 0}
            alertColor="var(--warning)"
          />
        </div>
      )}

      {/* ── Charts ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Chart 1 — Production by Sector */}
        <div className="card">
          <ChartTitle icon={<Wrench size={16} />} label="Carga de Produção por Setor" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {sectors.map((sector, i) => {
              const count = sectorCounts[i];
              const pct = Math.max((count / maxSector) * 100, count > 0 ? 4 : 0);
              return (
                <div key={sector}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{sector}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{count} {count === 1 ? 'pedido' : 'pedidos'}</span>
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

        {/* Chart 2 — Status Distribution or Financial */}
        <div className="card">
          {user?.role === 'Produção' ? (
            <>
              <ChartTitle icon={<ShoppingBag size={16} />} label="Distribuição por Status" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {statuses.map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const total = orders.length || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge" style={{
                        backgroundColor: statusColors[status] + '18',
                        color: statusColors[status],
                        minWidth: '96px', justifyContent: 'center', fontSize: '0.6875rem'
                      }}>
                        {status}
                      </span>
                      <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--surface-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: statusColors[status], borderRadius: '9999px' }} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '20px', textAlign: 'right', color: 'var(--text)' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <ChartTitle icon={<DollarSign size={16} />} label="Balancete Financeiro" />
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-end', height: '150px', paddingBottom: '8px' }}>
                {[
                  { label: 'Recebido', value: stats.totalBilling, color: 'var(--success)', shade: '#34d399' },
                  { label: 'A Receber', value: stats.receivablesPending, color: 'var(--primary)', shade: '#60a5fa' },
                  { label: 'A Pagar', value: stats.payablesPending, color: 'var(--danger)', shade: '#f87171' },
                ].map(({ label, value, color, shade }) => {
                  const total = Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1);
                  const h = Math.min(100, Math.max(8, (value / total) * 100));
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text)' }}>
                        {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}
                      </span>
                      <div style={{
                        width: '52px', height: `${h}%`,
                        background: `linear-gradient(to top, ${color}, ${shade})`,
                        borderRadius: '4px 4px 2px 2px',
                        boxShadow: `0 2px 8px ${color}30`
                      }} />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
    </div>
  );
}

/* ── Sub-components ───────────────────────────────── */

function MetricCard({ label, value, icon, iconBg, iconColor, alert = false, alertColor = 'var(--danger)' }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
  alertColor?: string;
}) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.375rem' }}>
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
