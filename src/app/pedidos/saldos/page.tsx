'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getCustomers, 
  getProducts, 
  getCustomerProductStock, 
  getCustomerStockCredits 
} from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Scale, 
  Package, 
  Clock, 
  ArrowUpRight,
  Filter
} from 'lucide-react';

export default function SaldosCreditosPage() {
  const { user } = useAuth();
  
  // Controle de Permissão
  const isSupervisor = user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
  const isAuthorized = user?.role === 'Administrador' || isSupervisor;

  // Listas de dados
  const [credits, setCredits] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Controle de Estado
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'credits' | 'stocks'>('credits');

  // Filtros
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [custRes, prodRes, creditsRes, stocksRes] = await Promise.all([
        getCustomers(tenantId),
        getProducts(tenantId),
        getCustomerStockCredits(undefined, 'ATIVO', tenantId),
        getCustomerProductStock(undefined, undefined, tenantId)
      ]);

      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      
      // Filtrar créditos para conter apenas créditos de falta (PENDENCIA_ENTREGA)
      const activeCredits = (creditsRes.data || []).filter((c: any) => c.credit_type === 'PENDENCIA_ENTREGA');
      setCredits(activeCredits);
      
      // Armazena estoques de personalizados
      setStocks(stocksRes.data || []);
    } catch (e) {
      console.error('Erro ao carregar dados de saldos e créditos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [user]);

  // Se o usuário não for autorizado, mostra tela de bloqueio
  if (user && !isAuthorized) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Você não possui privilégios administrativos. Apenas **Administradores** e a **Supervisão Comercial** podem gerenciar saldos e créditos de fábrica.
        </p>
      </div>
    );
  }

  // Filtragem local
  const filteredCredits = credits.filter(c => {
    const matchCustomer = filterCustomer ? c.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? c.product_id === filterProduct : true;
    const matchSearch = searchQuery ? (
      c.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.source_order?.pv_number?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    return matchCustomer && matchProduct && matchSearch;
  });

  const filteredStocks = stocks.filter(s => {
    const matchCustomer = filterCustomer ? s.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? s.product_id === filterProduct : true;
    const matchSearch = searchQuery ? (
      s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    return matchCustomer && matchProduct && matchSearch;
  });

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Saldos & Créditos de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Painel de conferência e gerenciamento de excedentes e pendências de produção por cliente.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="btn btn-secondary" 
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          <span>Recarregar</span>
        </button>
      </header>

      {/* INTEGRAÇÃO FUTURA EXPLICATIVA */}
      {/* 
        Nota de Desenvolvimento (Integração Futura):
        No fluxo de criação de um novo Pedido de Venda (PV), ao selecionar o Cliente e o Produto,
        o formulário fará uma consulta automática nos dados expostos aqui:
        1. Se houver registro ativo em 'customer_stock_credits' para o par Cliente/Produto, o formulário sugerirá:
           "Este cliente possui X unidades de crédito pendente. Deseja abater no saldo deste novo pedido?"
        2. Se houver saldo em 'customer_product_stock', sugerirá:
           "Este cliente possui Y sacolas de estoque na fábrica. Deseja utilizar este lote em vez de programar nova extrusão?"
      */}

      {/* TABS DE ALTERNÂNCIA */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('credits')}
          className={`btn ${activeTab === 'credits' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Scale size={16} />
          <span>Créditos por Falta ({credits.length})</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('stocks')}
          className={`btn ${activeTab === 'stocks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Package size={16} />
          <span>Estoque de Personalizados ({stocks.length})</span>
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        
        {/* Pesquisa por Texto */}
        <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
          <label className="form-label">Pesquisa Rápida</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '32px' }} 
              placeholder="Buscar por cliente, produto, PV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filtro Dropdown Cliente */}
        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label">Filtrar por Cliente</label>
          <select 
            className="form-select"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
          >
            <option value="">Todos os Clientes</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro Dropdown Produto */}
        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label">Filtrar por Produto</label>
          <select 
            className="form-select"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
          >
            <option value="">Todos os Produtos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Limpar Filtros */}
        {(filterCustomer || filterProduct || searchQuery) && (
          <button 
            onClick={() => {
              setFilterCustomer('');
              setFilterProduct('');
              setSearchQuery('');
            }}
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-end', height: '36px' }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* EXIBIÇÃO CONTEÚDO */}
      <div className="card">
        <div className="table-responsive">
          {activeTab === 'credits' ? (
            /* TAB 1: CRÉDITOS */
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Produto de Referência</th>
                  <th>Qtd. Original Faltante</th>
                  <th>Crédito Disponível</th>
                  <th>Origem do Ajuste</th>
                  <th>Data do Evento</th>
                  <th>Notas / Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum crédito de falta de entrega ativo encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.customer?.name || 'Cliente'}</td>
                      <td style={{ fontWeight: 500 }}>{c.product?.name || 'Produto'}</td>
                      <td>{c.original_quantity?.toLocaleString('pt-BR')} un</td>
                      <td style={{ fontWeight: 700, color: 'hsl(346.8, 77.2%, 49.8%)' }}>
                        {c.remaining_quantity?.toLocaleString('pt-BR')} un
                      </td>
                      <td>
                        {c.source_order ? (
                          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                            <ArrowUpRight size={10} />
                            PV {c.source_order.pv_number}
                          </span>
                        ) : (
                          <span className="badge badge-secondary">Ajuste Manual</span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', maxWidth: '250px', color: 'var(--text-muted)' }}>
                        {c.notes || '---'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* TAB 2: ESTOQUES */
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente Proprietário</th>
                  <th>Produto Personalizado</th>
                  <th>Tamanho / Medida</th>
                  <th>Quantidade em Estoque na Fábrica</th>
                  <th>Última Movimentação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum lote de personalizado armazenado na fábrica.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.customer?.name || 'Cliente'}</td>
                      <td style={{ fontWeight: 500 }}>{s.product?.name || 'Produto'}</td>
                      <td><code>{s.product?.measure || 'Padrão'}</code></td>
                      <td style={{ fontWeight: 700, color: 'hsl(142.1, 76.2%, 36.3%)' }}>
                        {s.quantity?.toLocaleString('pt-BR')} un
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(s.updated_at || s.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
