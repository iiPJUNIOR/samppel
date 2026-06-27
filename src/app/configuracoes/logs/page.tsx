'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { 
  ArrowLeft, 
  Terminal, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  RefreshCw, 
  FileJson,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function LogsIntegracaoPage() {
  const { user } = useAuth();
  
  // States para os logs e paginação/loading
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para detalhar payload/response
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Carregar os logs do Supabase aplicando filtros
  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      
      if (!supabase) throw new Error('Cliente Supabase não inicializado');

      let query = supabase
        .from('conta_azul_integration_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Aplicação dos filtros do banco
      if (filterAction) {
        query = query.eq('action', filterAction);
      }
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      const { data, error } = await query.limit(200); // Traz os últimos 200 logs conforme filtros

      if (error) throw error;

      // Filtro em memória para busca textual
      if (searchQuery.trim() && data) {
        const queryLower = searchQuery.toLowerCase();
        const filtered = data.filter(log => {
          const payloadStr = JSON.stringify(log.payload || {}).toLowerCase();
          const responseStr = JSON.stringify(log.response || {}).toLowerCase();
          const errMsgStr = (log.error_message || '').toLowerCase();
          const actionStr = (log.action || '').toLowerCase();
          return payloadStr.includes(queryLower) || 
                 responseStr.includes(queryLower) || 
                 errMsgStr.includes(queryLower) ||
                 actionStr.includes(queryLower);
        });
        setLogs(filtered);
      } else {
        setLogs(data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar logs de integração:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchLogs();
    }
  }, [user, filterAction, filterStatus, startDate, endDate]);

  // Handler para busca de texto manual ao pressionar Enter ou clique do botão
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Segurança de Acesso
  if (user && user.role !== 'Administrador') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Apenas usuários com perfil **Administrador** têm permissões para auditar e visualizar os logs de integração de API.
        </p>
        <Link href="/pedidos" className="btn btn-secondary">Voltar ao Kanban</Link>
      </div>
    );
  }

  // Lista de ações distintas nos logs para preencher dinamicamente o select de filtros
  const distinctActions = [
    'OAUTH_CODE_EXCHANGE',
    'OAUTH_TOKEN_REFRESH',
    'IMPORT_CUSTOMERS',
    'IMPORT_ORDERS',
    'SYNC_CUSTOMER',
    'SYNC_PRODUCT',
    'SYNC_ORDER',
    'SYNC_FINANCIAL'
  ];

  return (
    <div className="page-container">
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/configuracoes" className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={22} style={{ color: 'var(--primary)' }} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Auditoria de Integração</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Histórico detalhado de chamadas à API Conta Azul v2 e fila assíncrona.
            </p>
          </div>
        </div>
        <button 
          onClick={() => fetchLogs(true)} 
          disabled={refreshing}
          className="btn btn-secondary" 
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          <span>Atualizar Logs</span>
        </button>
      </header>

      {/* FILTROS E PESQUISA */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={14} />
          Filtros de Auditoria
        </h3>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Ação Executada</label>
            <select 
              className="form-select"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">Todas as Ações</option>
              {distinctActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status do Log</label>
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="SUCCESS">🟢 SUCESSO</option>
              <option value="ERROR">🔴 ERRO</option>
              <option value="PENDING_RETRY">🟡 RE-TENTATIVA</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Data Inicial</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-input" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Data Final</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-input" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label className="form-label">Busca Rápida (Conteúdo JSON)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: id da venda, nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                <Search size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* LISTAGEM DE LOGS */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive" style={{ maxHeight: '600px' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-subtle)' }}>
                <th style={{ padding: '1rem' }}>Data/Hora</th>
                <th>Ação</th>
                <th>Status</th>
                <th>Mensagem / Erro</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spinner" style={{ margin: '0 auto 1rem auto' }} />
                    Carregando histórico de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.action}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.status === 'SUCCESS' ? 'badge-success' : 
                        log.status === 'PENDING_RETRY' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {log.status === 'SUCCESS' ? 'SUCESSO' : log.status === 'PENDING_RETRY' ? 'AGUARDANDO RETRY' : 'ERRO'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: log.status === 'ERROR' ? 'var(--danger)' : 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.error_message || (log.response ? JSON.stringify(log.response) : 'Sem mensagens adicionais.')}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}
                      >
                        <Eye size={12} />
                        <span>Inspecionar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHES DE PAYLOAD (INSPECTOR) */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileJson size={20} style={{ color: 'var(--primary)' }} />
                  Detalhes do Log de Auditoria
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Ação: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedLog.action}</span> | Status: <span style={{ fontWeight: 600, color: selectedLog.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)' }}>{selectedLog.status}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontSize: '0.875rem'
            }}>
              {/* Mensagem de Erro */}
              {selectedLog.error_message && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--danger-bg || rgba(239, 68, 68, 0.1))',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}>
                  <XCircle size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Falha na Execução:</strong>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {selectedLog.error_message}
                    </p>
                  </div>
                </div>
              )}

              {/* Informações Gerais */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Data de Registro</span>
                  <strong>{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ID da Transação (Log)</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedLog.id}</span>
                </div>
              </div>

              {/* Payload Enviado */}
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Payload Enviado</h4>
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {selectedLog.payload ? JSON.stringify(selectedLog.payload, null, 2) : '// Nenhum payload enviado.'}
                  </pre>
                </div>
              </div>

              {/* Resposta Recebida */}
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Retorno da API / Resposta</h4>
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {selectedLog.response ? JSON.stringify(selectedLog.response, null, 2) : '// Nenhuma resposta retornada.'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-subtle)',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)'
            }}>
              <button 
                onClick={() => setSelectedLog(null)}
                className="btn btn-primary"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
