'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getFinancialTransactions, 
  createFinancialTransaction, 
  reconcileTransaction,
  getOrders
} from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  Plus, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

export default function FinanceiroPage() {
  const { user } = useAuth();
  
  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form Fields
  const [formType, setFormType] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [formAmount, setFormAmount] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formOrderId, setFormOrderId] = useState('');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [financeRes, ordersRes] = await Promise.all([
        getFinancialTransactions(),
        getOrders()
      ]);
      setTransactions(financeRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (e) {
      console.error('Error fetching finance page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowed = ['Administrador', 'Financeiro'];
    if (user && allowed.includes(user.role)) {
      fetchFinanceData();
    }
  }, [user]);

  // Security guard check
  const allowed = ['Administrador', 'Financeiro'];
  if (user && !allowed.includes(user.role)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O seu perfil de **{user.role}** não tem permissões financeiras para realizar conciliações ou acessar o caixa da empresa.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setFormType('RECEITA');
    setFormAmount(0);
    setFormDescription('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormOrderId('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      type: formType,
      amount: Number(formAmount),
      description: formDescription,
      due_date: formDueDate,
      order_id: formOrderId || null,
      status: 'PENDENTE'
    };

    const { error } = await createFinancialTransaction(payload);
    if (error) {
      alert('Erro ao lançar título financeiro: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchFinanceData();
    }
  };

  const handleReconcile = async (id: string) => {
    if (!confirm('Deseja confirmar a conciliação e liquidação deste título financeiro?')) return;
    
    const { error } = await reconcileTransaction(id);
    if (error) {
      alert('Erro ao conciliar título: ' + error);
    } else {
      fetchFinanceData();
    }
  };

  // Calculations
  const totalReceivables = transactions
    .filter(t => t.type === 'RECEITA' && t.status === 'CONCILIADO')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayables = transactions
    .filter(t => t.type === 'DESPESA' && t.status === 'CONCILIADO')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalReceivables - totalPayables;

  // Filter listings
  const filteredTransactions = transactions.filter(t => {
    const matchType = filterType ? t.type === filterType : true;
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchType && matchStatus;
  });

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Conciliação Financeira</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Acompanhe contas a pagar e receber, concilie boletos e sincronize com a Conta Azul.
          </p>
        </div>
        
        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          <span>Lançar Título</span>
        </button>
      </header>

      {/* BALANCE PANELS */}
      <div className="dashboard-grid">
        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Total de Receitas Liquidadas</span>
            <span className="metric-value" style={{ color: 'var(--success)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceivables)}
            </span>
          </div>
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Total de Despesas Pagas</span>
            <span className="metric-value" style={{ color: 'var(--danger)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPayables)}
            </span>
          </div>
          <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Saldo em Caixa Real</span>
            <span className="metric-value" style={{ color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netBalance)}
            </span>
          </div>
          <div className="metric-icon" style={{ backgroundColor: netBalance >= 0 ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(239, 68, 68, 0.1)', color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Tipo de Título</label>
          <select 
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="RECEITA">Receitas (Inflow)</option>
            <option value="DESPESA">Despesas (Outflow)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status da Conciliação</label>
          <select 
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CONCILIADO">Conciliado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <button onClick={fetchFinanceData} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* TRANSACTIONS TABLE LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Descrição / Título</th>
                <th>Tipo</th>
                <th>Valor do Título</th>
                <th>Vencimento</th>
                <th>Data de Conciliação</th>
                <th>Pedido Vinculado</th>
                <th>Status</th>
                <th>Sincronização ERP</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={9} />
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhuma movimentação financeira registrada para este filtro.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isIncome = t.type === 'RECEITA';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.description}</td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: isIncome ? 'var(--success)' : 'var(--danger)',
                          display: 'inline-flex',
                          gap: '0.25rem'
                        }}>
                          {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: isIncome ? 'var(--success)' : 'var(--danger)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </td>
                      <td>{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td>{t.payment_date ? new Date(t.payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}</td>
                      <td>
                        {t.order ? (
                          <span style={{ fontWeight: 500 }}>Pedido #{t.order.order_number}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Avulso</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'CONCILIADO' ? 'badge-success' : 'badge-danger'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {t.conta_azul_id ? (
                          <span className="badge badge-success" title={`ID: ${t.conta_azul_id}`}>
                            <CheckCircle2 size={12} />
                            Integrado ({t.conta_azul_id.substring(0, 8)})
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <HelpCircle size={12} />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td>
                        {t.status === 'PENDENTE' && (
                          <button 
                            onClick={() => handleReconcile(t.id)} 
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Conciliar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '500px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                Lançar Novo Título Financeiro
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Tipo de Lançamento *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'RECEITA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setFormType('RECEITA')}
                  >
                    <ArrowUpRight size={16} />
                    Receita (Entrada)
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'DESPESA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setFormType('DESPESA')}
                  >
                    <ArrowDownRight size={16} />
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição da Transação *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="Ex: Compra de matéria-prima Kraft Klabin"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  className="form-input" 
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Vencimento *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pedido Vinculado (Opcional)</label>
                <select 
                  className="form-select"
                  value={formOrderId}
                  onChange={(e) => setFormOrderId(e.target.value)}
                >
                  <option value="">Nenhum pedido (Lançamento avulso)</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>Pedido #{o.order_number} ({o.customer?.name})</option>
                  ))}
                </select>
              </div>

              <footer style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Título
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
