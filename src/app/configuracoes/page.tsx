'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { 
  getContaAzulConfig, 
  updateContaAzulConfig, 
  getIntegrationLogs,
  getSyncQueue,
  getProductionMachines,
  createProductionMachine,
  updateProductionMachine,
  deleteProductionMachine,
  getHandlingTeams,
  createHandlingTeam,
  updateHandlingTeam,
  deleteHandlingTeam,
  getPackagingMaterialTypes,
  createPackagingMaterialType,
  updatePackagingMaterialType,
  deletePackagingMaterialType,
  getPackagingSettings,
  savePackagingSettings
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
  Clock,
  Plus,
  Trash2,
  Edit3,
  Settings,
  Users,
  Package
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
  
  // States de Máquinas de Produção
  const [machines, setMachines] = useState<any[]>([]);
  const [machineName, setMachineName] = useState('');
  const [machineSector, setMachineSector] = useState('Impressão');
  const [machineStatus, setMachineStatus] = useState<'ATIVO' | 'INATIVO' | 'MANUTENCAO'>('ATIVO');
  const [editingMachine, setEditingMachine] = useState<any | null>(null);
  const [submittingMachine, setSubmittingMachine] = useState(false);
  
  // States de Equipes de Manuseio
  const [handlingTeams, setHandlingTeams] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamStatus, setTeamStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // States de Tipos de Material de Embalagem
  const [packagingMaterials, setPackagingMaterials] = useState<any[]>([]);
  const [pmtName, setPmtName] = useState('');
  const [pmtCode, setPmtCode] = useState('');
  const [pmtCategory, setPmtCategory] = useState<'CAIXA' | 'FUNDO' | 'DIVISORIA' | 'SACO' | 'OUTRO'>('CAIXA');
  const [pmtStatus, setPmtStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingPmt, setEditingPmt] = useState<any | null>(null);
  const [submittingPmt, setSubmittingPmt] = useState(false);
  
  // States de Configurações de Embalagem (Convenções)
  const [packagingKeywords, setPackagingKeywords] = useState('caixa,fundo,divisoria,saco,embalagem,pacote');
  const [packagingAssociationRule, setPackagingAssociationRule] = useState<'FIRST_ITEM' | 'LARGEST_QUANTITY' | 'MANUAL'>('FIRST_ITEM');
  const [savingSettings, setSavingSettings] = useState(false);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchConfigAndLogs = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [configRes, logsRes, queueRes, machinesRes, teamsRes, pmtRes, settingsRes] = await Promise.all([
        getContaAzulConfig(),
        getIntegrationLogs(),
        getSyncQueue(),
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId)
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
      setMachines(machinesRes.data || []);
      setHandlingTeams(teamsRes.data || []);
      setPackagingMaterials(pmtRes.data || []);
      
      if (settingsRes.data) {
        setPackagingKeywords(settingsRes.data.keywords || 'caixa,fundo,divisoria,saco,embalagem,pacote');
        setPackagingAssociationRule(settingsRes.data.association_rule || 'FIRST_ITEM');
      }
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

  // Aciona o redirecionamento do fluxo do OAuth 2.0
  const handleOAuthConnect = async () => {
    if (!clientId || !clientSecret) {
      alert('Por favor, salve seu Client ID e Client Secret primeiro.');
      return;
    }
    
    // Gera a URL de autorização do OAuth
    // Em produção, isso direciona para o endpoint de autorização do Conta Azul
    const redirectUri = `${window.location.origin}/api/auth/conta-azul/callback`;
    
    const scope = encodeURIComponent('openid profile aws.cognito.signin.user.admin');
    const authUrl = `https://auth.contaazul.com/login?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${clientId}&scope=${scope}&state=d3b07384-d113-4ec8-a5c6-e91bc4ff99e0&response_type=code`;

    // Sempre redireciona para a URL de autorização real do Conta Azul
    const isMock = false;
    if (isMock) {
      // Bloco inacessível
    } else {
      window.location.href = authUrl;
    }
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName.trim()) return;

    setSubmittingMachine(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingMachine) {
        // Edit mode
        const { error } = await updateProductionMachine(editingMachine.id, {
          name: machineName.trim(),
          sector: machineSector,
          status: machineStatus
        });
        if (error) {
          alert('Erro ao atualizar máquina: ' + error.message);
        } else {
          setEditingMachine(null);
          setMachineName('');
          fetchConfigAndLogs();
        }
      } else {
        // Create mode
        const { error } = await createProductionMachine({
          tenant_id: tenantId,
          name: machineName.trim(),
          sector: machineSector,
          status: machineStatus
        });
        if (error) {
          alert('Erro ao criar máquina: ' + error.message);
        } else {
          setMachineName('');
          fetchConfigAndLogs();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar máquina:', err);
    } finally {
      setSubmittingMachine(false);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (confirm('Deseja realmente excluir esta máquina de produção?')) {
      const { error } = await deleteProductionMachine(id);
      if (error) {
        alert('Erro ao excluir máquina: ' + error.message);
      } else {
        fetchConfigAndLogs();
      }
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setSubmittingTeam(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingTeam) {
        // Edit mode
        const { error } = await updateHandlingTeam(editingTeam.id, {
          name: teamName.trim(),
          status: teamStatus
        });
        if (error) {
          alert('Erro ao atualizar equipe: ' + error.message);
        } else {
          setEditingTeam(null);
          setTeamName('');
          fetchConfigAndLogs();
        }
      } else {
        // Create mode
        const { error } = await createHandlingTeam({
          tenant_id: tenantId,
          name: teamName.trim(),
          status: teamStatus
        });
        if (error) {
          alert('Erro ao criar equipe: ' + error.message);
        } else {
          setTeamName('');
          fetchConfigAndLogs();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar equipe:', err);
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (confirm('Deseja realmente excluir esta equipe de manuseio?')) {
      const { error } = await deleteHandlingTeam(id);
      if (error) {
        alert('Erro ao excluir equipe: ' + error.message);
      } else {
        fetchConfigAndLogs();
      }
    }
  };

  const handleSavePmt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmtName.trim()) return;
    setSubmittingPmt(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingPmt) {
        const { error } = await updatePackagingMaterialType(editingPmt.id, {
          name: pmtName.trim(), code: pmtCode.trim() || null, category: pmtCategory, status: pmtStatus
        });
        if (error) { alert('Erro: ' + error.message); }
        else { setEditingPmt(null); setPmtName(''); setPmtCode(''); fetchConfigAndLogs(); }
      } else {
        const { error } = await createPackagingMaterialType({
          tenant_id: tenantId, name: pmtName.trim(), code: pmtCode.trim() || null, category: pmtCategory, status: pmtStatus
        });
        if (error) { alert('Erro: ' + error.message); }
        else { setPmtName(''); setPmtCode(''); fetchConfigAndLogs(); }
      }
    } catch (err) { console.error(err); }
    finally { setSubmittingPmt(false); }
  };

  const handleDeletePmt = async (id: string) => {
    if (confirm('Excluir este tipo de material de embalagem?')) {
      const { error } = await deletePackagingMaterialType(id);
      if (error) { alert('Erro: ' + error.message); }
      else { fetchConfigAndLogs(); }
    }
  };

  const handleSavePackagingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const { error } = await savePackagingSettings({
        tenant_id: tenantId,
        keywords: packagingKeywords.trim().toLowerCase(),
        association_rule: packagingAssociationRule
      });
      if (error) {
        alert('Erro ao salvar configurações de embalagem: ' + error.message);
      } else {
        alert('Configurações de embalagem salvas com sucesso!');
        fetchConfigAndLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Aciona o processo manual de sincronização da fila de segundo plano
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

      {/* SEÇÃO DE GERENCIAMENTO DE MÁQUINAS E SETORES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Formulário de Máquina */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            {editingMachine ? 'Editar Máquina de Produção' : 'Nova Máquina de Produção'}
          </h3>
          
          <form onSubmit={handleSaveMachine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome da Máquina *</label>
              <input 
                type="text" 
                className="form-input"
                required
                placeholder="Ex: Guilhotina B, Rotalina 2..."
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Setor de Atuação *</label>
              <select 
                className="form-select"
                value={machineSector}
                onChange={(e) => setMachineSector(e.target.value)}
              >
                <option value="Impressão">Impressão</option>
                <option value="Corte e Vinco">Corte e Vinco</option>
                <option value="Colagem">Colagem</option>
                <option value="Guilhotina">Guilhotina</option>
                <option value="Manuseio">Manuseio</option>
                <option value="Expedição">Expedição</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status da Máquina *</label>
              <select 
                className="form-select"
                value={machineStatus}
                onChange={(e) => setMachineStatus(e.target.value as any)}
              >
                <option value="ATIVO">🟢 Ativo</option>
                <option value="INATIVO">🔴 Inativo</option>
                <option value="MANUTENCAO">🔧 Em Manutenção</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {submittingMachine ? 'Salvando...' : editingMachine ? 'Salvar Alterações' : 'Cadastrar Máquina'}
              </button>
              {editingMachine && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingMachine(null);
                    setMachineName('');
                    setMachineSector('Impressão');
                    setMachineStatus('ATIVO');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Máquinas cadastradas */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} style={{ color: 'var(--primary)' }} />
            Máquinas Cadastradas ({machines.length})
          </h3>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                        {m.sector}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        m.status === 'ATIVO' ? 'badge-success' : 
                        m.status === 'INATIVO' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {m.status === 'ATIVO' ? 'ATIVO' : m.status === 'INATIVO' ? 'INATIVO' : 'MANUTENÇÃO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setEditingMachine(m);
                            setMachineName(m.name);
                            setMachineSector(m.sector);
                            setMachineStatus(m.status);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteMachine(m.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {machines.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma máquina de produção cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SEÇÃO DE GERENCIAMENTO DE EQUIPES DE MANUSEIO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Formulário de Equipe */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            {editingTeam ? 'Editar Equipe de Manuseio' : 'Nova Equipe de Manuseio'}
          </h3>
          
          <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome da Equipe *</label>
              <input 
                type="text" 
                className="form-input"
                required
                placeholder="Ex: João, Zé, Equipe Alfa..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status da Equipe *</label>
              <select 
                className="form-select"
                value={teamStatus}
                onChange={(e) => setTeamStatus(e.target.value as any)}
              >
                <option value="ATIVO">🟢 Ativo</option>
                <option value="INATIVO">🔴 Inativo</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {submittingTeam ? 'Salvando...' : editingTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}
              </button>
              {editingTeam && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamName('');
                    setTeamStatus('ATIVO');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Equipes cadastradas */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            Equipes de Manuseio Ativas ({handlingTeams.length})
          </h3>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome da Equipe</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {handlingTeams.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'ATIVO' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {t.status === 'ATIVO' ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setEditingTeam(t);
                            setTeamName(t.name);
                            setTeamStatus(t.status);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteTeam(t.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {handlingTeams.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma equipe de manuseio cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* REGRAS E CONVENÇÕES DE EMBALAGEM */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} style={{ color: 'var(--primary)' }} />
          Convenções e Regras de Associação de Embalagem
        </h3>
        <form onSubmit={handleSavePackagingSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Palavras-chave para identificar itens de Embalagem no PV</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Ex: caixa, fundo, divisoria, saco, embalagem (separado por vírgulas)"
              value={packagingKeywords}
              onChange={(e) => setPackagingKeywords(e.target.value)}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Utilizado para detectar automaticamente quais itens irmãos no Pedido de Venda representam caixas ou materiais de embalagem.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Regra de Associação Padrão</label>
            <select
              className="form-select"
              value={packagingAssociationRule}
              onChange={(e) => setPackagingAssociationRule(e.target.value as any)}
            >
              <option value="FIRST_ITEM">🥇 Associar caixas ao primeiro item de produto do PV</option>
              <option value="LARGEST_QUANTITY">📈 Associar caixas ao item de maior tiragem do PV</option>
              <option value="MANUAL">✏️ Associação manual pelo operador (sem sugestão)</option>
            </select>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Convenção administrativa para associar e carregar automaticamente os insumos de caixa a um dos itens do PV.
            </span>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings ? 'Salvando...' : 'Salvar Regras de Embalagem'}
            </button>
          </div>
        </form>
      </div>

      {/* TIPOS DE MATERIAL DE EMBALAGEM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            {editingPmt ? 'Editar Material' : 'Novo Material de Embalagem'}
          </h3>
          <form onSubmit={handleSavePmt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input type="text" className="form-input" required placeholder="Ex: Caixa de Papelão Corrugado" value={pmtName} onChange={(e) => setPmtName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Código de Referência</label>
              <input type="text" className="form-input" placeholder="Ex: CX-001" value={pmtCode} onChange={(e) => setPmtCode(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select className="form-select" value={pmtCategory} onChange={(e) => setPmtCategory(e.target.value as any)}>
                <option value="CAIXA">📦 Caixa</option>
                <option value="FUNDO">🟫 Fundo</option>
                <option value="DIVISORIA">🔲 Divisória</option>
                <option value="SACO">🛍️ Saco / Sacola</option>
                <option value="OUTRO">➕ Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={pmtStatus} onChange={(e) => setPmtStatus(e.target.value as any)}>
                <option value="ATIVO">🟢 Ativo</option>
                <option value="INATIVO">🔴 Inativo</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {submittingPmt ? 'Salvando...' : editingPmt ? 'Salvar' : 'Cadastrar'}
              </button>
              {editingPmt && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingPmt(null); setPmtName(''); setPmtCode(''); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: 'var(--primary)' }} />
            Materiais de Embalagem Cadastrados ({packagingMaterials.length})
          </h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Código</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {packagingMaterials.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.code || '—'}</span></td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>
                        {m.category === 'CAIXA' ? '📦 Caixa' : m.category === 'FUNDO' ? '🟫 Fundo' : m.category === 'DIVISORIA' ? '🔲 Divisória' : m.category === 'SACO' ? '🛍️ Saco' : '➕ Outro'}
                      </span>
                    </td>
                    <td><span className={`badge ${m.status === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>{m.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingPmt(m); setPmtName(m.name); setPmtCode(m.code || ''); setPmtCategory(m.category); setPmtStatus(m.status); }} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Edit3 size={12} /><span>Editar</span>
                        </button>
                        <button onClick={() => handleDeletePmt(m.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}>
                          <Trash2 size={12} /><span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packagingMaterials.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum material de embalagem cadastrado.</td></tr>
                )}
              </tbody>
            </table>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Terminal size={18} style={{ color: 'var(--primary)' }} />
            Histórico de Logs de Integração
          </h3>
          <Link href="/configuracoes/logs" className="btn btn-secondary" style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}>
            <Terminal size={14} />
            <span>Auditoria Completa & Filtros</span>
          </Link>
        </div>
        
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
