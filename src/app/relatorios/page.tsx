'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  getCustomers, 
  getProducts, 
  getProductionMachines, 
  getSectorTransitionReport,
  getCustomerStockCredits,
  getOrderBalanceAdjustments,
  getCustomerProductStock,
  getOrders,
  getOrderItems,
  getFinancialTransactions,
  getOrderStages,
  getAllStageHistory,
  getOrderItemStageHistory,
  getOrderItemSectorHistory
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
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const formatHoursToRealTime = (decimalHours: number | string): string => {
  const hoursNum = typeof decimalHours === 'string' ? parseFloat(decimalHours) : decimalHours;
  if (isNaN(hoursNum) || hoursNum < 0) return '0m';

  const totalMinutes = Math.round(hoursNum * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatHoursToDaysHours = (decimalHours: number | string): string => {
  const hoursNum = typeof decimalHours === 'string' ? parseFloat(decimalHours) : decimalHours;
  if (isNaN(hoursNum) || hoursNum <= 0) return '0d';

  const totalMinutes = Math.round(hoursNum * 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    if (hours > 0) {
      return `${days}d ${hours}h`;
    }
    return `${days}d`;
  }

  const minutes = totalMinutes % 60;
  if (totalHours > 0) {
    return `${totalHours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function RelatoriosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const dataFetchedRef = React.useRef(false);

  useEffect(() => {
    if (user && !['Administrador', 'Comercial'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  // Navigation tabs: 'efficiency' | 'credits' | 'commercial' | 'traceability'
  const [activeTab, setActiveTab] = useState<'efficiency' | 'credits' | 'commercial' | 'traceability'>('efficiency');

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

  // Novos estados para Comercial, Rastreamento e Histórico de Kanban
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);
  const [orderStages, setOrderStages] = useState<any[]>([]);
  const [stageHistory, setStageHistory] = useState<any[]>([]);

  // Estados específicos para a Timeline de Rastreio de Pedido por Número
  const [traceSearchNumber, setTraceSearchNumber] = useState('');
  const [traceTimeline, setTraceTimeline] = useState<any[]>([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState('');
  const [traceOrderItems, setTraceOrderItems] = useState<any[]>([]);
  const [traceSelectedItemId, setTraceSelectedItemId] = useState<string>('all');
  const [traceSelectedOrder, setTraceSelectedOrder] = useState<any | null>(null);
  const [traceSortOrder, setTraceSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  const openOrderDetails = (order: any) => {
    const client = customers.find(c => c.id === order.customer_id);
    const orderFinance = financialTransactions.filter(f => f.order_id === order.id);
    setSelectedOrderDetails({ ...order, customer: client, finance: orderFinance });
    setIsDetailsModalOpen(true);
  };

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

      // Fetch credits, adjustments, stocks, orders, order items, financial transactions, stages, and stage history
      const [creditsRes, adjRes, stocksRes, ordersRes, itemsRes, finRes, stagesRes, histRes] = await Promise.all([
        getCustomerStockCredits(selectedCustomerId || undefined, undefined, tenantId),
        getOrderBalanceAdjustments(undefined, selectedCustomerId || undefined, tenantId),
        getCustomerProductStock(selectedCustomerId || undefined, selectedProductId || undefined, tenantId),
        getOrders(tenantId),
        getOrderItems(undefined, tenantId),
        getFinancialTransactions(tenantId),
        getOrderStages(tenantId),
        getAllStageHistory(tenantId)
      ]);
      
      setCredits(creditsRes.data || []);
      setAdjustments(adjRes.data || []);
      setProductStocks(stocksRes.data || []);
      setOrders(ordersRes.data || []);
      setOrderItems(itemsRes.data || []);
      setFinancialTransactions(finRes.data || []);
      setOrderStages(stagesRes.data || []);
      setStageHistory(histRes.data || []);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setLoading(false);
      setSubmittingFilters(false);
    }
  };

  useEffect(() => {
    if (user && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchFiltersData();
      fetchReport();
    }
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

  const handleSearchTraceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceSearchNumber.trim()) return;
    
    setTraceLoading(true);
    setTraceError('');
    setTraceTimeline([]);
    setTraceOrderItems([]);
    setTraceSelectedItemId('all');
    setTraceSelectedOrder(null);
    setTraceSortOrder('asc');

    try {
      const cleanNum = traceSearchNumber.replace(/\D/g, '');
      if (!cleanNum) {
        setTraceError('Digite um número de pedido válido.');
        setTraceLoading(false);
        return;
      }

      // 1. Procurar o pedido localmente para obter o ID
      const targetOrder = orders.find(o => {
        const numStr = String(o.pv_number || '').replace(/\D/g, '');
        return numStr === cleanNum;
      });

      if (!targetOrder) {
        setTraceError(`Pedido PV-${cleanNum} não encontrado no banco de dados do portal.`);
        setTraceLoading(false);
        return;
      }

      setTraceSelectedOrder(targetOrder);

      // 2. Buscar todos os itens deste pedido
      const itemsOfOrder = orderItems.filter(item => item.order_id === targetOrder.id);
      if (itemsOfOrder.length === 0) {
        setTraceError(`Nenhum item encontrado para o pedido PV-${cleanNum}.`);
        setTraceLoading(false);
        return;
      }
      
      // Ordenar os itens pelo índice para exibição ordenada dos botões
      itemsOfOrder.sort((a, b) => (a.item_index || 0) - (b.item_index || 0));
      setTraceOrderItems(itemsOfOrder);

      // 3. Buscar o histórico de transições de cada um desses itens
      const timelineEvents: any[] = [];

      for (const item of itemsOfOrder) {
        // A. Histórico de Estágios do Kanban
        const { data: historyEvents } = await getOrderItemStageHistory(item.id);
        if (historyEvents && historyEvents.length > 0) {
          historyEvents.forEach((evt: any) => {
            timelineEvents.push({
              ...evt,
              order_item_id: item.id,
              itemFriendlyId: item.friendly_id,
              itemName: item.name,
              eventType: 'stage_change'
            });
          });
        }

        // B. Histórico de Setores/Máquinas
        const { data: sectorEvents } = await getOrderItemSectorHistory(item.id, targetOrder.tenant_id);
        if (sectorEvents && sectorEvents.length > 0) {
          sectorEvents.forEach((evt: any) => {
            timelineEvents.push({
              id: evt.id,
              created_at: evt.entered_at,
              changed_at: evt.entered_at,
              order_item_id: item.id,
              itemFriendlyId: item.friendly_id,
              itemName: item.name,
              from_stage: null,
              to_stage: null,
              changed_by: evt.operator,
              sector: evt.sector,
              machineName: evt.machine?.name || 'Sem Máquina',
              eventType: 'sector_change'
            });
          });
        }
      }

      // Ordenar os eventos por data de ocorrência decrescente (mais recente no topo)
      timelineEvents.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
      
      setTraceTimeline(timelineEvents);
      if (timelineEvents.length === 0) {
        setTraceError(`O pedido PV-${cleanNum} foi importado mas ainda não foi movido no Kanban (nenhum histórico registrado).`);
      }
    } catch (err: any) {
      console.error('Erro ao rastrear pedido:', err);
      setTraceError(err.message || 'Erro ao buscar dados de rastreamento.');
    } finally {
      setTraceLoading(false);
    }
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

  // --- TAB 3 (COMMERCIAL & SALES) CALCULATIONS ---
  const sellerStatsMap: Record<string, { sellerName: string; totalOrders: number; totalRevenue: number }> = {};
  
  orders.forEach(order => {
    const seller = order.seller_name || 'Vendedor Desconhecido';
    if (!sellerStatsMap[seller]) {
      sellerStatsMap[seller] = { sellerName: seller, totalOrders: 0, totalRevenue: 0 };
    }
    sellerStatsMap[seller].totalOrders += 1;
    
    // Somar transações do tipo RECEITA para esse pedido
    const orderTrans = financialTransactions.filter(t => t.order_id === order.id && t.type === 'RECEITA' && t.status !== 'CANCELADO');
    const orderTotal = orderTrans.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    sellerStatsMap[seller].totalRevenue += orderTotal;
  });

  const sellerStatsList = Object.values(sellerStatsMap)
    .map(stat => ({
      ...stat,
      ticketAverage: stat.totalOrders > 0 ? stat.totalRevenue / stat.totalOrders : 0
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const itemStatsMap: Record<string, { itemName: string; totalQty: number; totalOrders: number }> = {};
  
  orderItems.forEach(item => {
    const name = item.name || 'Item Desconhecido';
    if (!itemStatsMap[name]) {
      itemStatsMap[name] = { itemName: name, totalQty: 0, totalOrders: 0 };
    }
    itemStatsMap[name].totalQty += Number(item.print_run || 0);
    itemStatsMap[name].totalOrders += 1;
  });

  const sortedItemsList = Object.values(itemStatsMap)
    .sort((a, b) => b.totalQty - a.totalQty);

  const topSellingItems = sortedItemsList.slice(0, 10);
  const bottomSellingItems = sortedItemsList.filter(i => i.totalQty > 0).slice(-10).reverse();

  // --- TAB 4 (STAGE HISTORY & KANBAN TRANSITIONS) CALCULATIONS ---
  const stageTimesMap: Record<string, { stageName: string; totalMs: number; count: number }> = {};
  
  orderStages.forEach(st => {
    stageTimesMap[st.id] = { stageName: st.name, totalMs: 0, count: 0 };
  });

  const historyByItem: Record<string, any[]> = {};
  stageHistory.forEach(h => {
    if (!historyByItem[h.order_item_id]) {
      historyByItem[h.order_item_id] = [];
    }
    historyByItem[h.order_item_id].push(h);
  });

  Object.keys(historyByItem).forEach(itemId => {
    const itemHistory = historyByItem[itemId].sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
    
    for (let i = 0; i < itemHistory.length; i++) {
      const current = itemHistory[i];
      const next = itemHistory[i + 1];
      
      const entryTime = new Date(current.changed_at).getTime();
      const exitTime = next ? new Date(next.changed_at).getTime() : Date.now();
      const durationMs = exitTime - entryTime;
      
      const stageId = current.to_stage_id;
      if (stageId && stageTimesMap[stageId]) {
        stageTimesMap[stageId].totalMs += durationMs;
        stageTimesMap[stageId].count += 1;
      }
    }
  });

  const stageAveragesList = Object.values(stageTimesMap)
    .map(avg => {
      const averageHours = avg.count > 0 ? (avg.totalMs / (1000 * 60 * 60)) / avg.count : 0;
      return {
        stageName: avg.stageName,
        averageHours,
        count: avg.count
      };
    })
    .sort((a, b) => b.averageHours - a.averageHours); // Ordenar pelas etapas que mais retêm tempo

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

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '1px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="no-scrollbar">
        <button 
          onClick={() => setActiveTab('efficiency')}
          className={`btn ${activeTab === 'efficiency' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'efficiency' ? '2px solid var(--primary)' : 'none' }}
        >
          Eficiência Operacional
        </button>
        <button 
          onClick={() => setActiveTab('credits')}
          className={`btn ${activeTab === 'credits' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'credits' ? '2px solid var(--primary)' : 'none' }}
        >
          Sobras, Faltas e Créditos
        </button>
        <button 
          onClick={() => setActiveTab('commercial')}
          className={`btn ${activeTab === 'commercial' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'commercial' ? '2px solid var(--primary)' : 'none' }}
        >
          Desempenho Comercial
        </button>
        <button 
          onClick={() => setActiveTab('traceability')}
          className={`btn ${activeTab === 'traceability' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'traceability' ? '2px solid var(--primary)' : 'none' }}
        >
          Rastreamento Kanban
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

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', gridColumn: 'span 1' }}>
            <label className="form-label" style={{ visibility: 'hidden', display: 'block', marginBottom: '0.375rem', fontSize: '0.75rem' }}>&nbsp;</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', height: '41px', border: '1px solid transparent' }} disabled={submittingFilters}>
                <Search size={14} />
                <span>{submittingFilters ? 'Filtrando...' : 'Filtrar'}</span>
              </button>
              <button type="button" className="btn btn-secondary" style={{ height: '41px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleResetFilters}>
                Limpar
              </button>
            </div>
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
                <span className="metric-label">Eficiência Média</span>
                <span className="metric-value">{formatHoursToRealTime(overallAvgHours)}</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>{item.sector}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {formatHoursToRealTime(item.averageHours)} {item.averageHours >= 24 ? `(${formatHoursToDaysHours(item.averageHours)})` : ''} — <strong style={{ color: 'var(--text)' }}>{item.count} cards</strong>
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
                      <div key={p.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{formatHoursToRealTime(p.averageHours)}</span>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>{c.customerName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatHoursToRealTime(c.averageHours)} de média</span>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>{p.productName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatHoursToRealTime(p.averageHours)} de média</span>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>{m.machineName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatHoursToRealTime(m.averageHours)} de média</span>
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
                      <td style={{ fontWeight: 700 }}>{formatHoursToRealTime(stay.durationHours)}</td>
                      <td style={{ color: stay.durationHours >= 72 ? 'var(--danger)' : 'var(--text)', fontWeight: stay.durationHours >= 72 ? 700 : 400 }}>
                        {formatHoursToDaysHours(stay.durationHours)}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
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
                          {h.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' ? 'Armazenado' : 
                           h.action_taken === 'CREDITO_PROXIMO_PEDIDO' ? 'Crédito Gerado' : 
                           h.action_taken === 'CANCELADO_DESCONTO' ? 'Desconto Aplicado' : 
                           h.action_taken === 'COBRADO_ADICIONAL' ? 'Cobrança Extra' : h.action_taken}
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

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: DESEMPENHO COMERCIAL                                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'commercial' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Cards do Top Vendedores */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                Desempenho por Vendedora
              </h3>
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '0.825rem' }}>
                  <thead>
                    <tr>
                      <th>Vendedora</th>
                      <th style={{ textAlign: 'center' }}>Pedidos</th>
                      <th style={{ textAlign: 'right' }}>Faturamento</th>
                      <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerStatsList.map((stat, idx) => (
                      <tr key={stat.sellerName}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ marginRight: '0.35rem', color: idx === 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                            {idx === 0 ? '👑' : `#${idx + 1}`}
                          </span>
                          {stat.sellerName}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{stat.totalOrders}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                          R$ {stat.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          R$ {stat.ticketAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {sellerStatsList.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          Nenhum dado comercial disponível.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Produtos/Itens Mais Vendidos (Tiragem Física) */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} style={{ color: 'var(--primary)' }} />
                Produtos Mais Vendidos (Volume Físico)
              </h3>
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '0.825rem' }}>
                  <thead>
                    <tr>
                      <th>Produto / Tamanho</th>
                      <th style={{ textAlign: 'center' }}>Pedidos</th>
                      <th style={{ textAlign: 'right' }}>Tiragem Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingItems.map((item, idx) => (
                      <tr key={item.itemName}>
                        <td style={{ fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.itemName}>
                          <span style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }}>
                            #{idx + 1}
                          </span>
                          {item.itemName}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.totalOrders}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {item.totalQty.toLocaleString('pt-BR')} un
                        </td>
                      </tr>
                    ))}
                    {topSellingItems.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          Nenhum dado de itens disponível.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Produtos Menos Vendidos (Menos Saem) */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
              Produtos com Menor Saída (Volume de Produção)
            </h3>
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th>Produto / Descrição</th>
                    <th style={{ textAlign: 'center' }}>Pedidos Registrados</th>
                    <th style={{ textAlign: 'right' }}>Tiragem Acumulada</th>
                  </tr>
                </thead>
                <tbody>
                  {bottomSellingItems.map((item, idx) => (
                    <tr key={item.itemName}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }}>
                          #{sortedItemsList.length - bottomSellingItems.length + idx + 1}
                        </span>
                        {item.itemName}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.totalOrders}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {item.totalQty.toLocaleString('pt-BR')} un
                      </td>
                    </tr>
                  ))}
                  {bottomSellingItems.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                        Nenhum dado de itens disponível.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: RASTREAMENTO KANBAN                                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'traceability' && (
        <>
          {/* Gráfico do Tempo Médio por Etapa */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hourglass size={18} style={{ color: 'var(--primary)' }} />
              Tempo Médio de Retenção por Etapa do Kanban
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Esta métrica aponta gargalos na linha de produção, medindo a média de dias que os cartões de itens passam estacionados em cada coluna do Kanban.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stageAveragesList.map(avg => {
                const percentage = Math.min((avg.averageHours / 120) * 100, 100);
                const roundedDays = (avg.averageHours / 24).toFixed(1);
                
                return (
                  <div key={avg.stageName} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 100px', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>{avg.stageName}</span>
                    <div style={{ height: '12px', backgroundColor: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: avg.averageHours > 48 ? 'var(--danger, #ef4444)' : avg.averageHours > 24 ? 'var(--warning, #f59e0b)' : 'var(--primary, #3b82f6)',
                        borderRadius: '6px',
                        transition: 'width 0.5s ease-in-out'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>
                      {roundedDays} dias ({formatHoursToRealTime(avg.averageHours)})
                    </span>
                  </div>
                );
              })}
              {stageAveragesList.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  Aguardando primeiras movimentações do Kanban para gerar cálculo de tempo.
                </div>
              )}
            </div>
          </div>

          {/* Rastreio Individual de Pedido por Número */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--primary)' }} />
              Rastreamento Histórico de Pedido (Timeline)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Consulte a timeline de movimentação de um pedido. Descubra quem moveu, quando moveu e qual item transitou no Kanban.
            </p>
            
            <form onSubmit={handleSearchTraceOrder} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Nº do pedido comercial (Ex: 521)" 
                className="form-input"
                value={traceSearchNumber}
                onChange={(e) => setTraceSearchNumber(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={traceLoading || !traceSearchNumber.trim()}
                style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.85rem', padding: '0.4rem 1rem' }}
              >
                <Search size={14} />
                <span>Rastrear</span>
              </button>
            </form>

            {traceLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={16} className="spinner" />
                <span>Buscando histórico e carregando timeline...</span>
              </div>
            )}

            {traceError && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--danger)', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.85rem', 
                marginBottom: '1rem' 
              }}>
                {traceError}
              </div>
            )}

            {traceSelectedOrder && (
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Histórico carregado do pedido:</span>
                  <button
                    type="button"
                    onClick={() => openOrderDetails(traceSelectedOrder)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '0.85rem'
                    }}
                    title="Clique para abrir os detalhes deste pedido"
                  >
                    PV-{traceSelectedOrder.pv_number?.replace(/\D/g, '')}
                  </button>
                  <span style={{ color: 'var(--text-muted)' }}>&bull; Cliente: <strong>{customers.find(c => c.id === traceSelectedOrder.customer_id)?.name || 'Cliente Desconhecido'}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => setTraceSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.60rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  title={traceSortOrder === 'asc' ? 'Exibindo: Mais antigos primeiro (Ordem crescente). Clique para inverter.' : 'Exibindo: Mais recentes primeiro (Ordem decrescente). Clique para inverter.'}
                >
                  {traceSortOrder === 'asc' ? (
                    <>
                      <span>Antigos primeiro</span>
                      <ArrowUpRight size={13} style={{ color: '#2ed573' }} />
                    </>
                  ) : (
                    <>
                      <span>Recentes primeiro</span>
                      <ArrowDownRight size={13} style={{ color: 'var(--danger)' }} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Seletores de subitens */}
            {traceOrderItems.length > 1 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '0.5rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setTraceSelectedItemId('all')}
                  className="btn"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: traceSelectedItemId === 'all' ? 'var(--primary)' : 'transparent',
                    color: traceSelectedItemId === 'all' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  Todos os itens ({traceOrderItems.length})
                </button>
                {traceOrderItems.map(item => {
                  const finalPart = item.friendly_id ? `/${item.friendly_id.split('/').pop()}` : `/${item.item_index}`;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTraceSelectedItemId(item.id)}
                      className="btn"
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: traceSelectedItemId === item.id ? 'var(--primary)' : 'transparent',
                        color: traceSelectedItemId === item.id ? '#fff' : 'var(--text-muted)',
                        fontWeight: 600
                      }}
                      title={item.name}
                    >
                      {finalPart} ({item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name})
                    </button>
                  );
                })}
              </div>
            )}

            {(() => {
              // 1. Filtrar eventos
              let filteredEvents = [...traceTimeline];
              if (traceSelectedItemId !== 'all') {
                filteredEvents = filteredEvents.filter(evt => evt.order_item_id === traceSelectedItemId);
              }

              // Ordenar com base no estado traceSortOrder (Antigos primeiro ou Recentes primeiro)
              filteredEvents.sort((a, b) => {
                const timeA = new Date(a.changed_at).getTime();
                const timeB = new Date(b.changed_at).getTime();
                return traceSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
              });

              if (filteredEvents.length === 0) return null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border)', marginLeft: '10px', paddingLeft: '20px', marginTop: '1.5rem' }}>
                  {filteredEvents.map((evt, idx) => {
                    const cleanFriendlyId = (traceOrderItems.length === 1 && evt.itemFriendlyId.endsWith('/1'))
                      ? evt.itemFriendlyId.substring(0, evt.itemFriendlyId.length - 2)
                      : evt.itemFriendlyId;

                    const labelType = traceOrderItems.length > 1 ? 'Item' : 'Pedido';

                    return (
                      <div key={evt.id || idx} style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        {/* Marcador na Timeline */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-26px', 
                          top: '4px', 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--primary)',
                          border: '2px solid var(--surface)' 
                        }} />
                        
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {new Date(evt.changed_at).toLocaleString('pt-BR')}
                        </div>
                        <div style={{ fontSize: '0.825rem', marginTop: '2px', color: 'var(--text)' }}>
                          {evt.eventType === 'sector_change' ? (
                            <>
                              {labelType} <strong style={{ color: 'var(--primary)' }}>{cleanFriendlyId}</strong> teve o Setor de Produção Física alterado para{' '}
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{evt.sector}</span>
                              {evt.machineName && evt.machineName !== 'Sem Máquina' && (
                                <>
                                  {' '}na máquina <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{evt.machineName}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {labelType} <strong style={{ color: 'var(--primary)' }}>{cleanFriendlyId}</strong> foi movido de{' '}
                              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{evt.from_stage?.name || 'Início'}</span> para{' '}
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{evt.to_stage?.name || 'Final'}</span>
                            </>
                          )}
                        </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                        {evt.eventType === 'sector_change' ? 'Alterado por: ' : 'Movido por: '}<strong style={{ color: 'var(--text)' }}>
                          {evt.changed_by ? (evt.changed_by.full_name || evt.changed_by.name || evt.changed_by.email || 'Operador') : 'Sistema'}
                        </strong> {evt.changed_by?.role ? `(${evt.changed_by.role})` : ''}
                      </div>
                    </div>
                  );
                })}
                </div>
              );
            })()}
          </div>
        </>
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
              <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Transações e Parcelas Financeiras</h4>
                {selectedOrderDetails.finance && selectedOrderDetails.finance.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Vencimento</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem' }}>Valor</th>
                          <th style={{ textAlign: 'center', padding: '0.5rem' }}>Status</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrderDetails.finance.map((f: any, fIdx: number) => {
                          const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.amount);
                          return (
                            <tr key={f.id || fIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '0.5rem' }}>{f.due_date ? new Date(f.due_date).toLocaleDateString('pt-BR') : 'Sem data'}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{currencyFormat}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                <span className="badge" style={{
                                  backgroundColor: f.status === 'CONCILIADO' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                                  color: f.status === 'CONCILIADO' ? '#2ed573' : 'var(--danger)',
                                  border: `1px solid ${f.status === 'CONCILIADO' ? '#2ed57330' : 'var(--danger)30'}`,
                                  fontSize: '0.7rem'
                                }}>
                                  {f.status === 'CONCILIADO' ? 'PAGO' : f.status}
                                </span>
                              </td>
                              <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{f.description || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>
                    Nenhuma parcela financeira encontrada localmente para este pedido.
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end',
              backgroundColor: 'var(--background)'
            }}>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="btn btn-secondary"
                style={{
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'var(--text)'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
