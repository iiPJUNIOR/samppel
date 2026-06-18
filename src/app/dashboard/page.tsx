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
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Statistics
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

      const fetchedOrders = ordersRes.data || [];
      const fetchedFinance = financeRes.data || [];
      const fetchedProducts = productsRes.data || [];

      setOrders(fetchedOrders);
      setFinance(fetchedFinance);
      setProducts(fetchedProducts);

      // Calculations
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
    
    // Listen to simulated profile changes to reload statistics
    const handleRoleChange = () => {
      fetchData();
    };
    window.addEventListener('samppel_role_changed', handleRoleChange);
    return () => {
      window.removeEventListener('samppel_role_changed', handleRoleChange);
    };
  }, []);

  // If loading, show a premium skeleton dashboard structure
  if (loading) {
    return (
      <div className="page-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
            <Skeleton height={20} width={280} />
          </div>
          <Skeleton height={38} width={100} />
        </header>

        {/* METRICS SKELETON */}
        <div className="dashboard-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card metric-card">
              <div className="metric-info" style={{ width: '60%' }}>
                <Skeleton height={14} width="80%" style={{ marginBottom: '8px' }} />
                <Skeleton height={32} width="50%" />
              </div>
              <Skeleton height={48} width={48} borderRadius="var(--radius-sm)" />
            </div>
          ))}
        </div>

        {/* CHARTS SKELETON */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* TABLE SKELETON */}
        <div className="card">
          <Skeleton height={20} width={250} style={{ marginBottom: '1.25rem' }} />
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th>Tiragem</th>
                  <th>Setor de Produção</th>
                  <th>Status</th>
                  <th>Vendedora</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={8} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Count sector distribution for production chart
  const sectors = ['Impressão', 'Corte e Vinco', 'Colagem', 'Expedição'];
  const sectorCounts = sectors.map(sector => 
    orders.filter(o => o.production_sector === sector && !['Entregue', 'Pago'].includes(o.status)).length
  );
  const maxSectorCount = Math.max(...sectorCounts, 1);

  // Status distributions
  const statuses = ['A produzir', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado'];
  const statusColors: Record<string, string> = {
    'A produzir': 'var(--info)',
    'Em revisão': 'var(--warning)',
    'Expedição': 'var(--primary)',
    'Entregue': 'var(--success)',
    'Faturado': 'var(--secondary)',
    'Pago': 'var(--success)',
    'Atrasado': 'var(--danger)'
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Visão geral operacional e de faturamento do Sistema Samppel.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Atualizar</span>
        </button>
      </header>

      {/* METRICS PANELS - ADAPTS TO ROLES */}
      {user?.role === 'Produção' ? (
        /* PRODUCTION PROFILE DASHBOARD */
        <div className="dashboard-grid">
          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Pedidos Ativos</span>
              <span className="metric-value">{stats.activeOrdersCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Na Linha de Produção</span>
              <span className="metric-value">{stats.inProductionCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              <Wrench size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Aguardando Coleta / Expedição</span>
              <span className="metric-value">{stats.shippedCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <Truck size={24} />
            </div>
          </div>

          <div className="card metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <div className="metric-info">
              <span className="metric-label">Pedidos Atrasados</span>
              <span className="metric-value" style={{ color: 'var(--danger)' }}>{stats.lateOrdersCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>

          <div className="card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-info">
              <span className="metric-label">Travados (Aguardando Pgto)</span>
              <span className="metric-value" style={{ color: 'var(--warning)' }}>{stats.blockedWaitingPaymentCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN, FINANCE & SALES DASHBOARD */
        <div className="dashboard-grid">
          {/* Billing only visible to admin and finance */}
          {(user?.role === 'Administrador' || user?.role === 'Financeiro') && (
            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Faturamento Liquidado</span>
                <span className="metric-value">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalBilling)}
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
            </div>
          )}

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Pedidos Ativos</span>
              <span className="metric-value">{stats.activeOrdersCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">A Receber (Pendente)</span>
              <span className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receivablesPending)}
              </span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Contas a Pagar (Abertas)</span>
              <span className="metric-value" style={{ color: 'var(--danger)', fontSize: '1.5rem' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.payablesPending)}
              </span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)' }}>
              <ArrowDownRight size={24} />
            </div>
          </div>

          <div className="card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-info">
              <span className="metric-label">Pedidos Travados (Sem Pgto)</span>
              <span className="metric-value" style={{ color: 'var(--warning)', fontSize: '1.5rem' }}>{stats.blockedWaitingPaymentCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* CHART 1: PRODUCTION BY SECTOR */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} style={{ color: 'var(--primary)' }} />
            Carga de Produção por Setor Ativo
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {sectors.map((sector, idx) => {
              const count = sectorCounts[idx];
              const pct = (count / maxSectorCount) * 100;
              return (
                <div key={sector} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 500 }}>
                    <span>{sector}</span>
                    <span style={{ fontWeight: 600 }}>{count} {count === 1 ? 'pedido' : 'pedidos'}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.max(pct, 3)}%`, 
                      height: '100%', 
                      backgroundColor: sector === 'Expedição' ? 'var(--success)' : 'var(--primary)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: FINANCIAL / ORDERS FLOW */}
        <div className="card">
          {user?.role === 'Produção' ? (
            /* Production sees orders distribution */
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--info)' }} />
                Status Geral dos Pedidos
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {statuses.map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const total = orders.length || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="badge" style={{ backgroundColor: statusColors[status] + '15', color: statusColors[status], width: '100px', justifyContent: 'center' }}>
                        {status}
                      </span>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: statusColors[status], borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '20px', textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Admin, Sales and Finance see financial balance chart */
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={18} style={{ color: 'var(--success)' }} />
                Balancete de Títulos (Receitas vs Despesas)
              </h3>
              
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-end', height: '160px', paddingBottom: '10px' }}>
                {/* Receitas Conciliadas */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.totalBilling)}
                  </span>
                  <div style={{
                    width: '60px',
                    height: `${Math.min(100, Math.max(10, (stats.totalBilling / Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1)) * 100))}%`,
                    background: 'linear-gradient(to top, var(--success) 0%, #34d399 100%)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recebido</span>
                </div>

                {/* Receitas Pendentes */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.receivablesPending)}
                  </span>
                  <div style={{
                    width: '60px',
                    height: `${Math.min(100, Math.max(10, (stats.receivablesPending / Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1)) * 100))}%`,
                    background: 'linear-gradient(to top, var(--primary) 0%, #60a5fa 100%)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(0, 97, 247, 0.2)'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A Receber</span>
                </div>

                {/* Despesas Pendentes */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.payablesPending)}
                  </span>
                  <div style={{
                    width: '60px',
                    height: `${Math.min(100, Math.max(10, (stats.payablesPending / Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1)) * 100))}%`,
                    background: 'linear-gradient(to top, var(--danger) 0%, #f87171 100%)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A Pagar</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RECENT ORDERS TABLE LISTING */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Últimas Movimentações de Pedidos</h3>
        <div className="table-responsive">
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
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500 }}>
                        {order.op_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>🎨 {order.art_name || 'Arte Genérica'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.name}</div>
                  </td>
                  <td>
                    <div>{order.product?.name || 'Produto deletado'}</div>
                    <code style={{ fontSize: '0.7rem', padding: '0.125rem 0.25rem', backgroundColor: 'var(--background)', borderRadius: '3px' }}>
                      {order.measure}
                    </code>
                  </td>
                  <td>{order.print_run?.toLocaleString('pt-BR')} un</td>
                  <td>
                    <div>{order.production_sector}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {order.physical_location || 'Salão'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: statusColors[order.status] + '15', color: statusColors[order.status] }}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.seller_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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
