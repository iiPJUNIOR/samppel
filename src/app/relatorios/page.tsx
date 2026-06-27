'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getCustomers, 
  getProducts, 
  getProductionMachines, 
  getSectorTransitionReport,
  getCustomerStockCredits,
  getOrderBalanceAdjustments,
  getCustomerProductStock
} from '@/services/supabase';
import { Skeleton, CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  Clock, 
  Calendar, 
  Users, 
  Package, 
  Cpu, 
  Sliders, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  BarChart2, 
  Search,
  Hourglass,
  Gauge,
  Coins,
  History,
  TrendingDown
} from 'lucide-react';

export default function RelatoriosPage() {
  const { user } = useAuth();
  
  // Navigation tabs: 'efficiency' | 'credits'
  const [activeTab, setActiveTab] = useState<'efficiency' | 'credits'>('efficiency');

  // Lists for filters
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');

  // Loading and Data states
  const [loading, setLoading] = useState(true);
  const [submittingFilters, setSubmittingFilters] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Tab 2 Data states
  const [credits, setCredits] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [productStocks, setProductStocks] = useState<any[]>([]);

  const fetchFiltersData = async () => {
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [custRes, prodRes, machRes] = await Promise.all([
        getCustomers(tenantId),
        getProducts(tenantId),
        getProductionMachines(tenantId)
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setMachines(machRes.data || []);
    } catch (e) {
      console.error('Error fetching filter listings:', e);
    }
  };

  const fetchReport = async (isFilterSubmit = false) => {
    if (isFilterSubmit) {
      setSubmittingFilters(true);
    } else {
      setLoading(true);
    }
    
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      
      // Fetch transition report
      const reportRes = await getSectorTransitionReport(tenantId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerId: selectedCustomerId || undefined,
        productId: selectedProductId || undefined,
        machineId: selectedMachineId || undefined
      });
      setReportData(reportRes.data || null);

      // Fetch credits, adjustments and stocks
      const [creditsRes, adjRes, stocksRes] = await Promise.all([
        getCustomerStockCredits(selectedCustomerId || undefined, undefined, tenantId),
        getOrderBalanceAdjustments(undefined, selectedCustomerId || undefined, tenantId),
        getCustomerProductStock(selectedCustomerId || undefined, selectedProductId || undefined, tenantId)
      ]);
      
      setCredits(creditsRes.data || []);
      setAdjustments(adjRes.data || []);
      setProductStocks(stocksRes.data || []);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setLoading(false);
      setSubmittingFilters(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
    fetchReport();
  }, [user]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(true);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('');
    setSelectedProductId('');
    setSelectedMachineId('');
    setTimeout(() => {
      fetchReport(true);
    }, 50);
  };

  // Render Skeletons during initial load
  if (loading) {
    return (
      <div className="page-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Relatório de Eficiência por Setor</h1>
            <Skeleton height={20} width={340} />
          </div>
        </header>
        <CardSkeleton />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // --- TAB 1 (EFFICIENCY) CALCULATIONS ---
  const {
    averageTimes = [],
    longestStays = [],
    byPeriod = [],
    byCustomer = [],
    byProduct = [],
    byMachine = []
  } = reportData || {};

  const maxAverageHours = Math.max(...averageTimes.map((t: any) => t.averageHours), 1);
  const maxCustomerHours = Math.max(...byCustomer.slice(0, 5).map((c: any) => c.averageHours), 1);
  const maxProductHours = Math.max(...byProduct.slice(0, 5).map((p: any) => p.averageHours), 1);
  const maxMachineHours = Math.max(...byMachine.slice(0, 5).map((m: any) => m.averageHours), 1);
  const maxPeriodHours = Math.max(...byPeriod.slice(0, 10).map((p: any) => p.averageHours), 1);

  const totalTransitions = averageTimes.reduce((sum: number, t: any) => sum + t.count, 0);
  const totalAvgHours = averageTimes.reduce((sum: number, t: any) => sum + t.averageHours, 0);
  const overallAvgHours = averageTimes.length ? (totalAvgHours / averageTimes.length).toFixed(1) : '0';

  // --- TAB 2 (CREDITS & WASTES) CALCULATIONS ---
  
  // 1. Top clientes com mais créditos pendentes (status === 'ATIVO' e remaining_quantity > 0)
  const pendingCreditsMap: Record<string, { customerName: string; totalQty: number; count: number }> = {};
  credits.filter(c => c.status === 'ATIVO' && c.remaining_quantity > 0).forEach(c => {
    const name = c.customer?.name || 'Cliente Desconhecido';
    if (!pendingCreditsMap[name]) {
      pendingCreditsMap[name] = { customerName: name, totalQty: 0, count: 0 };
    }
    pendingCreditsMap[name].totalQty += c.remaining_quantity;
    pendingCreditsMap[name].count += 1;
  });
  const topCreditedCustomers = Object.values(pendingCreditsMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);
  const maxPendingCreditsQty = Math.max(...topCreditedCustomers.map(c => c.totalQty), 1);

  // 2. Top situações de sobras grandes (adjustment_type === 'SOBRA' e action_taken === 'GUARDAR_ESTOQUE_CLIENTE' ou similar)
  const largeLeftovers = adjustments
    .filter(a => a.adjustment_type === 'SOBRA')
    .map(a => {
      // Prejuízo estimado baseado em valor fictício ou real do produto (ex: R$ 1.50/unidade)
      const unitCost = Number(a.product?.price) || 1.50;
      const potentialLoss = a.difference_quantity * unitCost;
      return {
        ...a,
        potentialLoss
      };
    })
    .sort((a, b) => b.difference_quantity - a.difference_quantity)
    .slice(0, 10);

  // Total de perda financeira potencial estimada
  const totalPotentialLoss = largeLeftovers.reduce((sum, item) => sum + item.potentialLoss, 0);

  // 3. Histórico de consumo de créditos/estoques
  // Filtramos por ações de consumo de crédito ou estoque
  const consumptionHistory = adjustments
    .filter(a => ['CREDITO_PROXIMO_PEDIDO', 'GUARDAR_ESTOQUE_CLIENTE', 'CANCELADO_DESCONTO', 'COBRADO_ADICIONAL'].includes(a.action_taken))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Relatórios e Eficiência de Produção</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Análise de tempos médios, gargalos operacionais e controle de créditos/sobras de estoque.
          </p>
        </div>
        <button onClick={() => fetchReport()} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} className={submittingFilters ? 'spinner' : ''} />
          <span>Atualizar</span>
        </button>
      </header>

      {/* TAB SELECTOR */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '1px' }}>
        <button 
          onClick={() => setActiveTab('efficiency')}
          className={`btn ${activeTab === 'efficiency' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'efficiency' ? '2px solid var(--primary)' : 'none' }}
        >
          ⏱️ Eficiência Operacional
        </button>
        <button 
          onClick={() => setActiveTab('credits')}
          className={`btn ${activeTab === 'credits' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'credits' ? '2px solid var(--primary)' : 'none' }}
        >
          📦 Sobras, Faltas e Créditos
        </button>
      </div>

      {/* FILTERS PANEL CARD */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={16} style={{ color: 'var(--primary)' }} />
          Filtros de Análise
        </h3>
        <form onSubmit={handleApplyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Data Inicial</label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Data Final</label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Cliente</label>
            <select className="form-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">Todos os Clientes</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {activeTab === 'efficiency' ? (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Produto</label>
                <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                  <option value="">Todos os Produtos</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Máquina</label>
                <select className="form-select" value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)}>
                  <option value="">Todas as Máquinas</option>
                  {machines.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sector})</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Produto Vinculado</label>
              <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Todos os Produtos</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 1' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }} disabled={submittingFilters}>
              <Search size={14} />
              <span>{submittingFilters ? 'Filtrando...' : 'Filtrar'}</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: EFICIÊNCIA OPERACIONAL                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'efficiency' && (
        <>
          {/* KEY METRICS */}
          <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Média Geral por Etapa</span>
                <span className="metric-value">{overallAvgHours}h</span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Tempo médio de passagem
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                <Hourglass size={24} />
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Passagens Registradas</span>
                <span className="metric-value">{totalTransitions}</span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Total de logs no período
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <Gauge size={24} />
              </div>
            </div>

            <div className="card metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="metric-info">
                <span className="metric-label">Gargalo Crítico</span>
                <span className="metric-value" style={{ color: 'var(--danger)', fontSize: '1.25rem', fontWeight: 800 }}>
                  {averageTimes.length 
                    ? [...averageTimes].sort((a: any, b: any) => b.averageHours - a.averageHours)[0]?.sector 
                    : 'Nenhum'
                  }
                </span>
                <span className="metric-sublabel">
                  Setor com maior tempo de permanência
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                Tempo Médio em Cada Etapa (Horas / Dias)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {averageTimes.map((item: any) => {
                  const pct = (item.averageHours / maxAverageHours) * 100;
                  let barColor = 'var(--primary)';
                  if (item.sector === 'Atrasado') barColor = 'var(--danger)';
                  if (item.sector === 'Expedição' || item.sector === 'Concluído') barColor = 'var(--success)';
                  
                  return (
                    <div key={item.sector} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{item.sector}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {item.averageHours}h ({item.averageDays} dias) — <strong style={{ color: 'var(--text)' }}>{item.count} cards</strong>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--background)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.max(pct, 3)}%`, 
                          height: '100%', 
                          backgroundColor: barColor, 
                          borderRadius: '5px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
                {averageTimes.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma movimentação registrada para calcular tempos médios.
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                Evolução Temporal (Tempo Médio por Dia)
              </h3>
              {byPeriod.length > 0 ? (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingBottom: '10px', marginTop: '1rem', overflowX: 'auto' }}>
                  {byPeriod.slice(0, 10).map((p: any) => {
                    const pct = (p.averageHours / maxPeriodHours) * 80;
                    return (
                      <div key={p.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '40px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{p.averageHours}h</span>
                        <div style={{
                          width: '24px',
                          height: `${Math.max(pct, 8)}px`,
                          background: 'linear-gradient(to top, var(--primary) 0%, hsla(221.2, 83.2%, 60.3%, 0.8) 100%)',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'height 0.3s ease'
                        }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.date.substring(0, 5)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum dado temporal disponível.
                </div>
              )}
            </div>
          </div>

          {/* GROUPS RANKINGS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} style={{ color: 'var(--primary)' }} />
                Clientes com Maior Tempo de Produção
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {byCustomer.slice(0, 5).map((c: any) => {
                  const pct = (c.averageHours / maxCustomerHours) * 100;
                  return (
                    <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>{c.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.averageHours}h de média</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={16} style={{ color: 'var(--primary)' }} />
                Produtos com Maior Duração Média
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {byProduct.slice(0, 5).map((p: any) => {
                  const pct = (p.averageHours / maxProductHours) * 100;
                  return (
                    <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{p.averageHours}h de média</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Cpu size={16} style={{ color: 'var(--primary)' }} />
                Tempo Médio Utilizado por Máquina
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {byMachine.slice(0, 5).map((m: any) => {
                  const pct = (m.averageHours / maxMachineHours) * 100;
                  return (
                    <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.name}>{m.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{m.averageHours}h de média</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABLE OF BOTTLENECK ITEMS */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              Gargalos Individuais — Cards com Maior Duração Consecutiva
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>PV / Item</th>
                    <th>Nome Arte (Cliente)</th>
                    <th>Setor de Bloqueio</th>
                    <th>Máquina Vinculada</th>
                    <th>Duração em Horas</th>
                    <th>Duração em Dias</th>
                  </tr>
                </thead>
                <tbody>
                  {longestStays.map((stay: any) => (
                    <tr key={`${stay.itemId}_${stay.sector}`}>
                      <td style={{ fontWeight: 700 }}>{stay.friendlyId}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{stay.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stay.customerName}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: stay.sector === 'Atrasado' ? 'hsla(0, 84.2%, 60.2%, 0.15)' : 'var(--surface-subtle)', 
                          color: stay.sector === 'Atrasado' ? 'var(--danger)' : 'var(--text)'
                        }}>
                          {stay.sector}
                        </span>
                      </td>
                      <td>{stay.machineName}</td>
                      <td style={{ fontWeight: 700 }}>{stay.durationHours}h</td>
                      <td style={{ color: stay.durationDays > 3 ? 'var(--danger)' : 'var(--text)', fontWeight: stay.durationDays > 3 ? 700 : 400 }}>
                        {stay.durationDays} dias
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: SOBRAS, FALTAS E CRÉDITOS                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'credits' && (
        <>
          {/* TAB 2 KEY METRICS */}
          <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Créditos de Estoque Ativos</span>
                <span className="metric-value">
                  {credits.filter(c => c.status === 'ATIVO' && c.remaining_quantity > 0).reduce((sum, c) => sum + c.remaining_quantity, 0).toLocaleString('pt-BR')} un
                </span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Aguardando consumo em novos pedidos
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                <Coins size={24} />
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Estoque de Personalizados</span>
                <span className="metric-value">
                  {productStocks.reduce((sum, s) => sum + s.quantity, 0).toLocaleString('pt-BR')} un
                </span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Saldo parado armazenado na fábrica
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <Package size={24} />
              </div>
            </div>

            <div className="card metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="metric-info">
                <span className="metric-label">Prejuízo Potencial (Sobras)</span>
                <span className="metric-value" style={{ color: 'var(--danger)' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPotentialLoss)}
                </span>
                <span className="metric-sublabel">
                  Excedente de produção não faturado
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                <TrendingDown size={24} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* 1. TOP CLIENTES COM MAIS CRÉDITOS PENDENTES */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Coins size={18} style={{ color: 'var(--primary)' }} />
                Top Clientes com Mais Créditos Pendentes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {topCreditedCustomers.map((c: any) => {
                  const pct = (c.totalQty / maxPendingCreditsQty) * 100;
                  return (
                    <div key={c.customerName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{c.customerName}</span>
                        <span style={{ color: 'var(--primary)' }}>
                          <strong>{c.totalQty.toLocaleString('pt-BR')} un</strong> em {c.count} créditos
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--background)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.max(pct, 3)}%`, 
                          height: '100%', 
                          backgroundColor: 'var(--primary)', 
                          borderRadius: '5px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
                {topCreditedCustomers.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum crédito de cliente pendente no momento.
                  </div>
                )}
              </div>
            </div>

            {/* 2. TOP SITUAÇÕES DE SOBRAS GRANDES (PREJUÍZO POTENCIAL) */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
                Gargalos Físicos — Maiores Sobras na Fábrica (Prejuízo)
              </h3>
              <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>PV / Cliente</th>
                      <th>Produto</th>
                      <th style={{ textAlign: 'right' }}>Qtd. Sobra</th>
                      <th style={{ textAlign: 'right' }}>Perda Estimada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {largeLeftovers.map((left: any) => (
                      <tr key={left.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{left.order?.pv_number || `PV-${left.order?.order_number || '???'}`}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{left.customer?.name}</div>
                        </td>
                        <td>{left.product?.name || 'Insumo'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--warning)' }}>+{left.difference_quantity.toLocaleString('pt-BR')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(left.potentialLoss)}
                        </td>
                      </tr>
                    ))}
                    {largeLeftovers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          Nenhuma sobra registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* 3. HISTÓRICO DE CONSUMO DE CRÉDITOS E ESTOQUES */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--primary)' }} />
              Histórico de Lançamentos e Consumo de Crédito / Estoque
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Produto / Descrição</th>
                    <th>Qtd. Transação</th>
                    <th>Ação Executada</th>
                    <th>Status / Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionHistory.map((h: any) => (
                    <tr key={h.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ fontWeight: 600 }}>{h.order?.pv_number || `PV-${h.order?.order_number || '???'}`}</td>
                      <td>{h.customer?.name}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{h.product?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.notes || '—'}</div>
                      </td>
                      <td style={{ 
                        fontWeight: 700, 
                        color: h.difference_quantity > 0 ? 'var(--success)' : 'var(--danger)',
                        textAlign: 'center'
                      }}>
                        {h.difference_quantity > 0 ? `+${h.difference_quantity.toLocaleString('pt-BR')}` : h.difference_quantity.toLocaleString('pt-BR')}
                      </td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: 'var(--surface-subtle)', 
                          border: '1px solid var(--border)',
                          fontSize: '0.7rem'
                        }}>
                          {h.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' ? '📥 Armazenado' : 
                           h.action_taken === 'CREDITO_PROXIMO_PEDIDO' ? '🪙 Crédito Gerado' : 
                           h.action_taken === 'CANCELADO_DESCONTO' ? '💸 Desconto Aplicado' : 
                           h.action_taken === 'COBRADO_ADICIONAL' ? '💳 Cobrança Extra' : h.action_taken}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${h.difference_quantity > 0 ? 'badge-success' : 'badge-info'}`}>
                          {h.difference_quantity > 0 ? 'Entrada' : 'Consumido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {consumptionHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        Nenhum consumo de crédito ou movimentação de estoque registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
