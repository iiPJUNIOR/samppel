'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  getContaAzulConfig, 
  updateContaAzulConfig, 
  getIntegrationLogs,
  getSyncQueue 
} from '@/services/supabase';
import { 
  ShieldAlert, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Link2, 
  Terminal,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // States
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchConfigAndLogs = async () => {
    setLoading(true);
    try {
      const [configRes, logsRes, queueRes] = await Promise.all([
        getContaAzulConfig(),
        getIntegrationLogs(),
        getSyncQueue()
      ]);

      const data = configRes.data;
      setConfig(data);
      if (data) {
        setClientId(data.client_id || '');
        // Obfuscate secret on load
        setClientSecret(data.client_secret ? '••••••••••••••••••••••••••••••••' : '');
      }

      setLogs(logsRes.data || []);
      setQueue(queueRes.data || []);
    } catch (e) {
      console.error('Error fetching config/logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchConfigAndLogs();
    }
  }, [user]);

  // Security guard check
  if (user && user.role !== 'Administrador') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Apenas usuários com perfil **Administrador** têm permissões de sistema para reconfigurar integrações e APIs externas.
        </p>
      </div>
    );
  }

  // Save Credentials Form
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    // If secret is the obfuscated string, do not overwrite it in the database
    const secretToSend = clientSecret === '••••••••••••••••••••••••••••••••' ? undefined : clientSecret;

    const payload: any = {
      client_id: clientId
    };
    if (secretToSend !== undefined) {
      payload.client_secret = secretToSend;
    }

    const { error } = await updateContaAzulConfig(payload);
    if (error) {
      alert('Erro ao salvar configurações: ' + error.message);
    } else {
      setIsSaved(true);
      fetchConfigAndLogs();
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  // Trigger OAuth 2.0 Flow redirect
  const handleOAuthConnect = async () => {
    if (!clientId || !clientSecret) {
      alert('Por favor, salve seu Client ID e Client Secret primeiro.');
      return;
    }
    
    // Generate OAuth Authorization URL
    // In production this directs to Conta Azul authorize endpoint
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/conta-azul/callback`
      : 'http://localhost:3000/api/auth/conta-azul/callback';
    
    const scope = encodeURIComponent('sales customers products financial contacts');
    const authUrl = `https://app.contaazul.com/oauth2/authorize?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${clientId}&scope=${scope}&state=d3b07384-d113-4ec8-a5c6-e91bc4ff99e0&response_type=code`;

    // In mock mode, we simulate the callback directly by redirecting to our backend callback
    const isMock = clientId.includes('placeholder') || clientId === '';
    if (isMock) {
      const confirmMock = confirm('Sua credencial é fictícia. Deseja simular a autorização OAuth do Conta Azul?');
      if (confirmMock) {
        window.location.href = `/api/auth/conta-azul/callback?code=mock_code_123&state=d3b07384-d113-4ec8-a5c6-e91bc4ff99e0`;
        return;
      }
    } else {
      window.location.href = authUrl;
    }
  };

  // Trigger manual background sync queue process
  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/sync/cron', { method: 'POST' });
      const result = await response.json();
      setSyncResult(result);
      fetchConfigAndLogs(); // Reload logs feed
    } catch (e: any) {
      setSyncResult({ success: false, error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = config?.access_token && new Date(config.expires_at).getTime() > Date.now();

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações de APIs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Integração externa via OAuth 2.0 com o ERP Conta Azul.
          </p>
        </div>
        <button onClick={fetchConfigAndLogs} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Sincronizar Painel</span>
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* CONTA AZUL API CREDENTIALS FORM */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} style={{ color: 'var(--primary)' }} />
            Credenciais de API Conta Azul
          </h3>
          
          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Client ID *</label>
              <input 
                type="text" 
                className="form-input"
                required
                placeholder="Insira o Client ID do Conta Azul..."
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client Secret *</label>
              <input 
                type="password" 
                className="form-input"
                required
                placeholder="Insira o Client Secret do Conta Azul..."
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Salvar Credenciais
              </button>
              {isSaved && (
                <span style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 500 }}>
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* CONNECTION & WORKER CONTROLS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link2 size={18} style={{ color: isConnected ? 'var(--success)' : 'var(--text-muted)' }} />
              Status da Conexão OAuth 2.0
            </h3>

            {/* Connection badge */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)',
                boxShadow: isConnected ? '0 0 10px var(--success)' : '0 0 10px var(--danger)'
              }} />
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {isConnected ? 'Sincronizado com Conta Azul' : 'Sem Conexão Ativa'}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isConnected 
                    ? `Token válido até: ${new Date(config?.expires_at).toLocaleString('pt-BR')}`
                    : 'Configure as credenciais e clique em conectar abaixo para autorizar.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleOAuthConnect} 
              className="btn btn-primary"
              style={{ flex: 1, minWidth: '150px' }}
            >
              Conectar com a Conta Azul
            </button>
            
            <button 
              onClick={handleTriggerSync} 
              disabled={syncing}
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={16} className={syncing ? 'spinner' : ''} />
              <span>Sincronizar Fila</span>
            </button>
          </div>

          {syncResult && (
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.75rem', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: syncResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: syncResult.success ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              {syncResult.success ? (
                <>
                  <div style={{ fontWeight: 600 }}>Fila processada com sucesso!</div>
                  <div>Itens processados: {syncResult.processed} | Sucessos: {syncResult.successes} | Falhas: {syncResult.failures}</div>
                </>
              ) : (
                <div style={{ fontWeight: 600 }}>Erro: {syncResult.error}</div>
              )}
            </div>
          )}

          {/* THEME CONFIGURATION */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Preferências de Interface
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tema do Sistema</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Alterne entre modo claro e escuro.
                </p>
              </div>
              <button 
                onClick={toggleTheme}
                className="btn btn-secondary"
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                {theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SYNC QUEUE STATUS */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          Fila de Sincronização em Background (`sync_queue`)
        </h3>
        <div className="table-responsive" style={{ maxHeight: '250px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tipo Entidade</th>
                <th>Ação</th>
                <th>Tentativas</th>
                <th>Último Erro</th>
                <th>Próxima Tentativa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 600 }}>{q.entity_type}</td>
                  <td><code style={{ fontSize: '0.75rem', backgroundColor: 'var(--background)', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>{q.action}</code></td>
                  <td>{q.retry_count} / {q.max_retries}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--danger)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.last_error || '---'}
                  </td>
                  <td>{new Date(q.next_retry_at).toLocaleString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${
                      q.status === 'COMPLETED' ? 'badge-success' : 
                      q.status === 'PROCESSING' ? 'badge-info' : 
                      q.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Fila vazia no momento. Nenhuma sincronização pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INTEGRATION LOGS */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={18} style={{ color: 'var(--primary)' }} />
          Histórico de Logs de Integração
        </h3>
        
        <div className="table-responsive" style={{ maxHeight: '400px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Ação Executada</th>
                <th>Status</th>
                <th>Resposta Conta Azul</th>
                <th>Detalhes / Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.action}</td>
                  <td>
                    <span className={`badge ${
                      log.status === 'SUCCESS' ? 'badge-success' : 
                      log.status === 'PENDING_RETRY' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {log.status === 'SUCCESS' ? 'SUCESSO' : log.status === 'PENDING_RETRY' ? 'AGUARDANDO RETRY' : 'ERRO'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: log.status === 'ERROR' ? 'var(--danger)' : 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.error_message || JSON.stringify(log.response) || 'Sem retorno.'}
                  </td>
                  <td>
                    <button 
                      onClick={() => alert(`PAYLOAD:\n${JSON.stringify(log.payload, null, 2)}\n\nRETORNO API:\n${JSON.stringify(log.response || log.error_message, null, 2)}`)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      Ver Payload
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum log de integração registrado no momento.
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
