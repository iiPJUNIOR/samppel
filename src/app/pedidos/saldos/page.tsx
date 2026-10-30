'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/apiFetch';
import {
  getProducts,
  getCustomerProductStock,
  getCustomerStockCredits,
  getOrderBalanceAdjustments
} from '@/services/supabase';
import SearchableCustomerSelect from '@/components/SearchableCustomerSelect';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Scale,
  Package,
  Clock,
  ArrowUpRight,
  History,
  Trash2,
  Ban,
  X,
  User
} from 'lucide-react';

function formatPvLabel(pv?: string | null, orderNumber?: number | string | null): string {
  const raw = String(pv || orderNumber || '').trim();
  if (!raw) return 'Ajuste Manual';
  return /^pv[-\s]/i.test(raw) ? raw.replace(/^pv\s+/i, 'PV-').toUpperCase() : `PV-${raw}`;
}

function getActionBadgeInfo(actionTaken: string, adjustmentType: string): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  switch (actionTaken) {
    case 'CREDITO_PROXIMO_PEDIDO':
      return {
        label: 'Sobra Enviada (- Abater)',
        bg: 'rgba(16, 185, 129, 0.1)',
        color: 'var(--success, #10b981)',
        border: 'rgba(16, 185, 129, 0.25)'
      };
    case 'PENDENCIA_ENTREGA':
      return {
        label: 'Falta a Entregar (+ Produzir)',
        bg: 'rgba(220, 38, 38, 0.1)',
        color: 'var(--danger, #dc2626)',
        border: 'rgba(220, 38, 38, 0.25)'
      };
    case 'REPRODUCAO_PENDENTE':
      return {
        label: 'Reprodução Pendente (+ Produzir)',
        bg: 'rgba(220, 38, 38, 0.1)',
        color: 'var(--danger, #dc2626)',
        border: 'rgba(220, 38, 38, 0.25)'
      };
    case 'GUARDAR_ESTOQUE_CLIENTE':
      return {
        label: 'Guardado no Estoque da Fábrica',
        bg: 'rgba(37, 99, 235, 0.1)',
        color: 'var(--primary, #2563eb)',
        border: 'rgba(37, 99, 235, 0.25)'
      };
    case 'COBRADO_ADICIONAL':
      return {
        label: 'Cobrado Valor Adicional',
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#d97706',
        border: 'rgba(245, 158, 11, 0.28)'
      };
    case 'CANCELADO_DESCONTO':
      return {
        label: 'Desconto no Faturamento',
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#d97706',
        border: 'rgba(245, 158, 11, 0.28)'
      };
    default:
      return {
        label:
          adjustmentType === 'SOBRA'
            ? 'Cortesia Gratuita (Brinde — Sem Abater)'
            : 'Tratado Manualmente (Sem Saldo)',
        bg: 'rgba(100, 116, 139, 0.12)',
        color: 'var(--text-muted, #64748b)',
        border: 'rgba(100, 116, 139, 0.25)'
      };
  }
}

export default function SaldosCreditosPage() {
  const { user } = useAuth();

  // Controle de Permissão (Administrador, Comercial, Vendedor ou Supervisor têm acesso de leitura)
  const isAdmin = user?.role === 'Administrador';
  const isSupervisorWithFinance =
    user?.role === 'Supervisão' &&
    (user?.allowed_modules || ['pedidos', 'produtos', 'financeiro', 'clientes', 'relatorios', 'dashboard']).includes('financeiro');
  const isLegacySupervisor =
    user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
  const isAuthorized =
    isAdmin || user?.role === 'Vendedor' || user?.role === 'Comercial' || isSupervisorWithFinance || isLegacySupervisor;

  // Listas de dados
  const [credits, setCredits] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Controle de Estado
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'credits' | 'history' | 'stocks'>('credits');
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'UTILIZADO' | 'CANCELADO' | 'TODOS'>('ATIVO');

  // Filtros
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Administrativo de Cancelamento / Exclusão
  const [manageTarget, setManageTarget] = useState<any | null>(null);
  const [manageReason, setManageReason] = useState('');
  const [manageBusy, setManageBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [prodRes, creditsRes, stocksRes, adjustmentsRes] = await Promise.all([
        getProducts(tenantId),
        getCustomerStockCredits(undefined, undefined, tenantId),
        getCustomerProductStock(undefined, undefined, tenantId),
        getOrderBalanceAdjustments(undefined, undefined, tenantId)
      ]);

      setProducts(prodRes.data || []);

      const allCredits = (creditsRes.data || []).filter(
        (c: any) => c.credit_type === 'PENDENCIA_ENTREGA' || c.credit_type === 'CORTESIA_SOBRA'
      );
      setCredits(allCredits);
      setStocks(stocksRes.data || []);
      setAdjustments(adjustmentsRes.data || []);
    } catch (e) {
      console.error('Erro ao carregar dados de saldos e créditos:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, fetchData]);

  const handleAdminManageCredit = async (action: 'CANCEL' | 'DELETE') => {
    if (!isAdmin || !manageTarget) return;
    setManageBusy(true);
    try {
      const res = await authenticatedFetch('/api/admin/saldos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          creditId: manageTarget.id,
          reason: manageReason.trim()
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao processar alteração do saldo.');
      }
      setManageTarget(null);
      setManageReason('');
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao gerenciar saldo.');
    } finally {
      setManageBusy(false);
    }
  };

  if (user && !isAuthorized) {
    return (
      <div
        className="page-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center'
        }}
      >
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Você não possui privilégios administrativos. Apenas Administradores e a equipe Comercial autorizada podem consultar saldos e créditos de fábrica.
        </p>
      </div>
    );
  }

  const activeCreditsCount = credits.filter((c) => c.status === 'ATIVO').length;

  const filteredCredits = credits.filter((c) => {
    const matchStatus = statusFilter === 'TODOS' ? true : c.status === statusFilter;
    const matchCustomer = filterCustomer ? c.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? c.product_id === filterProduct : true;
    const q = searchQuery.trim().toLowerCase();
    const pvStr = formatPvLabel(c.source_order?.pv_number, c.source_order?.order_number).toLowerCase();
    const matchSearch = q
      ? c.customer?.name?.toLowerCase().includes(q) ||
        c.product?.name?.toLowerCase().includes(q) ||
        pvStr.includes(q) ||
        c.notes?.toLowerCase().includes(q)
      : true;
    return matchStatus && matchCustomer && matchProduct && matchSearch;
  });

  const filteredAdjustments = adjustments.filter((a) => {
    const matchCustomer = filterCustomer ? a.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? a.product_id === filterProduct : true;
    const q = searchQuery.trim().toLowerCase();
    const pvStr = formatPvLabel(a.order?.pv_number, a.order?.order_number).toLowerCase();
    const matchSearch = q
      ? a.customer?.name?.toLowerCase().includes(q) ||
        a.product?.name?.toLowerCase().includes(q) ||
        pvStr.includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        a.created_by_name?.toLowerCase().includes(q)
      : true;
    return matchCustomer && matchProduct && matchSearch;
  });

  const filteredStocks = stocks.filter((s) => {
    const matchCustomer = filterCustomer ? s.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? s.product_id === filterProduct : true;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = q
      ? s.customer?.name?.toLowerCase().includes(q) || s.product?.name?.toLowerCase().includes(q)
      : true;
    return matchCustomer && matchProduct && matchSearch;
  });

  const creditColsCount = isAdmin ? 9 : 8;

  return (
    <div className="page-container">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Saldos & Créditos de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Painel de conferência e gerenciamento de faltas a produzir, excedentes enviados a abater e histórico completo da expedição.
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

      {/* ABAS DE NAVEGAÇÃO */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('credits')}
            className={`btn ${activeTab === 'credits' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <Scale size={16} />
            <span>Créditos e Saldos Ativos ({activeCreditsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <History size={16} />
            <span>Histórico Completo da Expedição ({adjustments.length})</span>
          </button>

          {stocks.length > 0 && (
            <button
              onClick={() => setActiveTab('stocks')}
              className={`btn ${activeTab === 'stocks' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <Package size={16} />
              <span>Estoque na Fábrica ({stocks.length})</span>
            </button>
          )}
        </div>

        {activeTab === 'credits' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ width: 'auto', minWidth: '140px', height: '34px', fontSize: '0.8rem', padding: '0 0.6rem' }}
            >
              <option value="ATIVO">Somente Ativos</option>
              <option value="UTILIZADO">Utilizados</option>
              <option value="CANCELADO">Cancelados</option>
              <option value="TODOS">Todos os Status</option>
            </select>
          </div>
        )}
      </div>

      {/* BARRA DE FILTROS */}
      <div
        className="filter-bar"
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
          <label className="form-label">Pesquisa Rápida</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Buscar por cliente, produto, PV ou observação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ flex: 1.5, minWidth: '240px' }}>
          <label className="form-label">Filtrar por Cliente</label>
          <SearchableCustomerSelect
            value={filterCustomer}
            onChange={setFilterCustomer}
            tenantId={user?.tenant_id}
            placeholder="Todos os Clientes (Buscar por nome/CNPJ)..."
          />
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label">Filtrar por Produto</label>
          <select
            className="form-select"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
          >
            <option value="">Todos os Produtos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

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

      {/* CONTEÚDO PRINCIPAL */}
      <div className="card">
        <div className="table-responsive">
          {activeTab === 'credits' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Produto de Referência</th>
                  <th>Tipo de Saldo</th>
                  <th>Qtd. Original</th>
                  <th>Saldo Disponível</th>
                  <th>Origem do Ajuste</th>
                  <th>Data do Evento</th>
                  <th>Notas / Justificativa</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Ações (Admin)</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={creditColsCount} />)
                ) : filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={creditColsCount} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum saldo ou crédito encontrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((c) => {
                    const isShortage = c.credit_type === 'PENDENCIA_ENTREGA';
                    const isCancelledOrUsed = c.status !== 'ATIVO';
                    return (
                      <tr key={c.id} style={{ opacity: isCancelledOrUsed ? 0.72 : 1 }}>
                        <td style={{ fontWeight: 600 }}>{c.customer?.name || 'Cliente'}</td>
                        <td style={{ fontWeight: 500 }}>{c.product?.name || 'Produto'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            {isShortage ? (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                  color: 'var(--danger, #dc2626)',
                                  border: '1px solid rgba(220, 38, 38, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}
                              >
                                Falta a Entregar (+ Produzir)
                              </span>
                            ) : (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  color: 'var(--success, #10b981)',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}
                              >
                                Excedente Enviado (- Abater)
                              </span>
                            )}
                            {c.status !== 'ATIVO' && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase'
                                }}
                              >
                                Status: {c.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{Number(c.original_quantity || 0).toLocaleString('pt-BR')} un</td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: isCancelledOrUsed
                              ? 'var(--text-muted)'
                              : isShortage
                              ? 'var(--danger, #dc2626)'
                              : 'var(--success, #10b981)'
                          }}
                        >
                          {isShortage ? '+' : '-'}
                          {Number(c.remaining_quantity || 0).toLocaleString('pt-BR')} un
                        </td>
                        <td>
                          {c.source_order ? (
                            <span
                              className="badge badge-info"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <ArrowUpRight size={10} />
                              {formatPvLabel(c.source_order.pv_number, c.source_order.order_number)}
                            </span>
                          ) : (
                            <span className="badge badge-secondary">Ajuste Manual</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)'
                            }}
                          >
                            <Clock size={12} />
                            {new Date(c.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', maxWidth: '280px', color: 'var(--text-muted)' }}>
                          {c.notes || '---'}
                        </td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setManageTarget(c);
                                setManageReason('');
                              }}
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.74rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--danger, #dc2626)',
                                borderColor: 'rgba(220, 38, 38, 0.3)'
                              }}
                              title="Cancelar ou excluir este registro de saldo (exclusivo Administrador)"
                            >
                              <Trash2 size={13} />
                              <span>Cancelar / Excluir</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'history' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Produto de Referência</th>
                  <th>Origem (PV)</th>
                  <th>Contratado / Produzido</th>
                  <th>Diferença</th>
                  <th>Decisão na Expedição</th>
                  <th>Data / Responsável</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
                ) : filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum registro de conferência de expedição encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((a) => {
                    const diff = Number(a.difference_quantity || 0);
                    const badge = getActionBadgeInfo(a.action_taken, a.adjustment_type);
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.customer?.name || 'Cliente'}</td>
                        <td style={{ fontWeight: 500 }}>{a.product?.name || a.order_item?.name || 'Produto'}</td>
                        <td>
                          {a.order ? (
                            <span
                              className="badge badge-info"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <ArrowUpRight size={10} />
                              {formatPvLabel(a.order.pv_number, a.order.order_number)}
                            </span>
                          ) : (
                            <span className="badge badge-secondary">Manual</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {Number(a.ordered_quantity || 0).toLocaleString('pt-BR')} un →{' '}
                          <strong>{Number(a.produced_quantity || 0).toLocaleString('pt-BR')} un</strong>
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            color: diff > 0 ? 'var(--success, #10b981)' : diff < 0 ? 'var(--danger, #dc2626)' : 'var(--text-muted)'
                          }}
                        >
                          {diff > 0 ? `+${diff.toLocaleString('pt-BR')} un (Sobra)` : diff < 0 ? `${diff.toLocaleString('pt-BR')} un (Falta)` : '0 un'}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={11} />
                              {new Date(a.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {a.created_by_name && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                                <User size={11} />
                                {a.created_by_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', maxWidth: '260px', color: 'var(--text-muted)' }}>
                          {a.notes || '---'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'stocks' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Produto Guardado</th>
                  <th>Quantidade em Estoque</th>
                  <th>Última Atualização</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum lote personalizado guardado na fábrica.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.customer?.name || 'Cliente'}</td>
                      <td style={{ fontWeight: 500 }}>{s.product?.name || 'Produto'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {Number(s.quantity || 0).toLocaleString('pt-BR')} un
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(s.updated_at || s.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL ADMINISTRATIVO: CANCELAR OU EXCLUIR SALDO */}
      {isAdmin && manageTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              maxWidth: '500px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem'
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Gerenciar Registro de Saldo (Administrador)
              </h3>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={manageBusy}
                onClick={() => setManageTarget(null)}
                style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}
            >
              <div>
                <strong>Cliente:</strong> {manageTarget.customer?.name || 'Cliente'}
              </div>
              <div>
                <strong>Produto:</strong> {manageTarget.product?.name || 'Produto'}
              </div>
              <div>
                <strong>Origem:</strong>{' '}
                {manageTarget.source_order
                  ? formatPvLabel(manageTarget.source_order.pv_number, manageTarget.source_order.order_number)
                  : 'Ajuste Manual'}
              </div>
              <div>
                <strong>Saldo Atual:</strong>{' '}
                {Number(manageTarget.remaining_quantity || 0).toLocaleString('pt-BR')} un (Status: {manageTarget.status})
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Justificativa do Cancelamento (Opcional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Convertido em cortesia gratuita sem abatimento..."
                value={manageReason}
                onChange={(e) => setManageReason(e.target.value)}
                disabled={manageBusy}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                flexWrap: 'wrap',
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={manageBusy}
                onClick={() => handleAdminManageCredit('DELETE')}
                style={{
                  color: 'var(--danger, #dc2626)',
                  borderColor: 'rgba(220, 38, 38, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem'
                }}
              >
                <Trash2 size={14} />
                <span>Excluir Permanentemente</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={manageBusy}
                  onClick={() => setManageTarget(null)}
                >
                  Fechar
                </button>
                {manageTarget.status === 'ATIVO' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={manageBusy}
                    onClick={() => handleAdminManageCredit('CANCEL')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Ban size={14} />
                    <span>{manageBusy ? 'Processando...' : 'Cancelar Saldo'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
