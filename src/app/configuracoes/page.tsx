'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
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
  savePackagingSettings,
  getOrderStages,
  saveProfileStagePermission,
  createOrderStage,
  updateOrderStage,
  deleteOrderStage,
  getProfilesWithPermissions,
  getFactoryLocations,
  createFactoryLocation,
  updateFactoryLocation,
  deleteFactoryLocation,
  getOrders,
  saveSellerPermissions,
  getSellerPermissionsMap
} from '@/services/supabase';
import { 
  ShieldAlert, 
  Cpu, 
  RefreshCw, 
  Link2, 
  Terminal,
  Clock,
  Trash2,
  Edit3,
  Settings,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  Sliders,
  UserPlus,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Zap,
  MapPin
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'operadores' | 'convites' | 'producao' | 'embalagem' | 'integracao' | 'sistema'>('operadores');
  
  // States
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [isConfigWarningModalOpen, setIsConfigWarningModalOpen] = useState(false);
  const [isProducaoRoleNoticeModalOpen, setIsProducaoRoleNoticeModalOpen] = useState(false);
  const [noticeModalUser, setNoticeModalUser] = useState('');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUserLoading, setIsDeletingUserLoading] = useState(false);
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

  // States de Localizações Físicas na Fábrica
  const [factoryLocations, setFactoryLocations] = useState<any[]>([]);
  const [locationName, setLocationName] = useState('');
  const [locationStatus, setLocationStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [submittingLocation, setSubmittingLocation] = useState(false);

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

  // States de Operadores de Produção (Auditoria)
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [operatorName, setOperatorName] = useState('');
  const [operatorEmail, setOperatorEmail] = useState('');
  const [operatorPin, setOperatorPin] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [submittingOperator, setSubmittingOperator] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  const [selectedOperatorForPermissions, setSelectedOperatorForPermissions] = useState<any | null>(null);
  const [selectedStage, setSelectedStage] = useState<any | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#3b82f6');
  const [submittingStage, setSubmittingStage] = useState(false);
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [factoryAccountId, setFactoryAccountId] = useState<string>('');
  const [savingFactoryAccount, setSavingFactoryAccount] = useState(false);

  // States para Carteiras e Permissões de Vendedores
  const [availableSellersList, setAvailableSellersList] = useState<string[]>([]);
  const [sellerPermissionsMap, setSellerPermissionsMap] = useState<Record<string, { primary_seller_name: string; seller_access_mode: string; allowed_sellers: string[] }>>({});

  // States de Convites de Usuários
  const [invitesList, setInvitesList] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Administrador' | 'Produção' | 'Fábrica' | 'Vendedor'>('Vendedor');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [fetchingInvites, setFetchingInvites] = useState(false);

  const fetchInvites = async () => {
    setFetchingInvites(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const res = await fetch(`/api/admin/invite?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.data) setInvitesList(json.data);
    } catch (err) {
      console.error('Erro ao buscar convites:', err);
    } finally {
      setFetchingInvites(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmittingInvite(true);
    setInviteSuccess(null);
    setInviteError(null);

    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          full_name: inviteFullName.trim(),
          role: inviteRole,
          tenantId
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao enviar convite.');
      }

      setInviteSuccess(`Convite enviado com sucesso para ${inviteEmail}!`);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('Vendedor');
      fetchInvites();
    } catch (err: any) {
      setInviteError(err.message || 'Falha ao enviar convite.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm('Deseja realmente cancelar e excluir este convite de usuário?')) return;

    try {
      const res = await fetch(`/api/admin/invite?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cancelar convite.');

      fetchInvites();
    } catch (err: any) {
      alert('Erro ao cancelar convite: ' + err.message);
    }
  };

  const handleResendInvite = async (inv: any) => {
    setInviteSuccess(null);
    setInviteError(null);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const res = await fetch('/api/admin/invite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inv.id,
          email: inv.email,
          full_name: inv.full_name,
          role: inv.role,
          tenantId
        })
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Erro ao reenviar convite.');

      setInviteSuccess(`Novo link renovado e e-mail de convite reenviado para ${inv.email}!`);
      fetchInvites();
    } catch (err: any) {
      alert('Erro ao reenviar convite: ' + err.message);
    }
  };


  const isInviteExpired = (createdAt: string) => {
    if (!createdAt) return false;
    const sentTime = new Date(createdAt).getTime();
    const hoursDiff = (Date.now() - sentTime) / (1000 * 60 * 60);
    return hoursDiff >= 24;
  };


  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncing24h, setSyncing24h] = useState(false);
  const [sync24hStatus, setSync24hStatus] = useState<string | null>(null);
  const [wiping, setWiping] = useState(false);
  const [wipingSuccess, setWipingSuccess] = useState(false);
  const [wipingStock, setWipingStock] = useState(false);
  const [wipingStockSuccess, setWipingStockSuccess] = useState(false);

  const handleSync24h = async () => {
    setSyncing24h(true);
    setSync24hStatus('Iniciando sincronização forçada das últimas 24h...');

    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startDateStr = yesterday.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];

      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const response = await fetch(`/api/sync/import-orders?tenantId=${tenantId}&startDate=${startDateStr}&endDate=${endDateStr}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: user?.role })
      });

      if (!response.ok) {
        throw new Error('Falha ao conectar com o serviço de sincronização 24h.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.step) {
                setSync24hStatus(data.step);
              }
              if (data.success !== undefined) {
                if (data.success) {
                  const msg = `Sincronização 24h concluída! Pedidos novos: ${data.imported || 0} | Atualizados/Forçados: ${data.updated || 0}`;
                  setSync24hStatus(msg);
                  alert(msg);
                } else {
                  throw new Error(data.error || 'Erro durante a sincronização 24h.');
                }
              }
            } catch (pErr) {
              // ignora parsing parcial
            }
          }
        }
      }

      await fetchConfigAndLogs();
    } catch (err: any) {
      console.error('Erro na sincronização 24h:', err);
      const errMsg = err.message || 'Erro ao sincronizar últimas 24h';
      setSync24hStatus(`Erro: ${errMsg}`);
      alert(errMsg);
    } finally {
      setSyncing24h(false);
    }
  };

  const fetchConfigAndLogs = async () => {
    setLoading(true);
    try {
      fetchInvites();
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

      const [configRes, logsRes, queueRes, machinesRes, teamsRes, pmtRes, settingsRes, operatorsRes, stagesRes, profilesRes, locationsRes, ordersRes] = await Promise.all([
        getContaAzulConfig(),
        getIntegrationLogs(),
        getSyncQueue(),
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId),
        fetch(`/api/operators?tenantId=${tenantId}`).then(res => res.json()),
        getOrderStages(tenantId),
        getProfilesWithPermissions(tenantId),
        getFactoryLocations(tenantId),
        getOrders(tenantId)
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
      setFactoryLocations(locationsRes.data || []);
      setPackagingMaterials(pmtRes.data || []);
      setOperatorsList(operatorsRes.data || []);
      setStages(stagesRes.data || []);

      if (ordersRes.data) {
        const sellers = Array.from(new Set(ordersRes.data.map((o: any) => o.seller_name).filter(Boolean))) as string[];
        if (!sellers.includes('Vendas Samppel')) sellers.push('Vendas Samppel');
        setAvailableSellersList(sellers.sort());
      }
      setSellerPermissionsMap(getSellerPermissionsMap());

      const allProfiles = profilesRes.data || [];
      const mappedProfiles = allProfiles.map((p: any) => ({
        ...p,
        name: p.full_name || p.name || 'Sem nome'
      }));
      setProfilesList(mappedProfiles);

      const activeFactory = allProfiles.find((p: any) => p.is_factory_account === true);
      setFactoryAccountId(activeFactory ? activeFactory.id : '');
      
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['integracao', 'producao', 'embalagem', 'sistema', 'operadores'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchConfigAndLogs();
    }

    const client = supabase;
    if (client) {
      const channel = client
        .channel('profiles-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchConfigAndLogs();
          fetchInvites();
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
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

  const handleWipeData = async () => {
    const confirmWipe1 = confirm(
      "ATENÇÃO: Você está prestes a apagar todos os pedidos, itens, financeiro e contatos locais do portal!\n\nIsso não afetará em nada os seus dados reais no Conta Azul.\n\nDeseja continuar?"
    );
    if (!confirmWipe1) return;

    const confirmWipe2 = confirm(
      "CONFIRMAÇÃO FINAL: Tem certeza absoluta? Essa ação é irreversível e o portal ficará sem pedidos até a próxima sincronização."
    );
    if (!confirmWipe2) return;

    setWiping(true);
    setWipingSuccess(false);
    try {
      const res = await fetch('/api/config/wipe', {
        method: 'POST'
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao redefinir base de dados.');
      }

      setWipingSuccess(true);
      alert('Portal Samppel zerado com sucesso! Iniciando re-sincronização do painel...');
      fetchConfigAndLogs();
    } catch (err: any) {
      alert('Erro ao zerar o portal: ' + err.message);
    } finally {
      setWiping(false);
    }
  };

  const handleWipeStock = async () => {
    const confirmWipe = confirm(
      "ATENÇÃO: Deseja realmente zerar todo o catálogo de produtos e estoques locais?\n\n- Seus pedidos, clientes e histórico de produção serão MANTIDOS intactos.\n- Seus dados reais no Conta Azul NÃO serão afetados.\n\nDeseja continuar?"
    );
    if (!confirmWipe) return;

    setWipingStock(true);
    setWipingStockSuccess(false);
    try {
      const res = await fetch('/api/config/wipe-stock', {
        method: 'POST'
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao redefinir produtos e estoque.');
      }

      setWipingStockSuccess(true);
      alert('Catálogo de produtos e estoques zerados com sucesso! Você pode ir na tela de Produtos e clicar em "Atualizar Catálogo (Conta Azul)" para importar os produtos limpos.');
    } catch (err: any) {
      alert('Erro ao zerar produtos e estoque: ' + err.message);
    } finally {
      setWipingStock(false);
    }
  };

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

  const handleConfigureApiClick = () => {
    if (isEditingCredentials) {
      setIsEditingCredentials(false);
    } else {
      setIsConfigWarningModalOpen(true);
    }
  };

  const handleConfirmUnlockApi = () => {
    setIsEditingCredentials(true);
    setIsConfigWarningModalOpen(false);
  };

  // Aciona o redirecionamento do fluxo do OAuth 2.0
  const handleOAuthConnect = async () => {
    if (!clientId || !clientSecret) {
      alert('Por favor, salve seu Client ID e Client Secret primeiro.');
      return;
    }
    
    // Gera a URL de autorização do OAuth
    const redirectUri = `${window.location.origin}/api/auth/conta-azul/callback`;
    
    const scope = encodeURIComponent('openid profile aws.cognito.signin.user.admin');
    const authUrl = `https://auth.contaazul.com/login?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${clientId}&scope=${scope}&state=d3b07384-d113-4ec8-a5c6-e91bc4ff99e0&response_type=code`;

    window.location.href = authUrl;
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

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;
    setSubmittingLocation(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingLocation) {
        const { error } = await updateFactoryLocation(editingLocation.id, {
          name: locationName.trim(),
          status: locationStatus
        });
        if (error) {
          alert('Erro ao atualizar localização: ' + error.message);
        } else {
          setEditingLocation(null);
          setLocationName('');
          fetchConfigAndLogs();
        }
      } else {
        const { error } = await createFactoryLocation({
          tenant_id: tenantId,
          name: locationName.trim(),
          status: locationStatus
        });
        if (error) {
          alert('Erro ao criar localização: ' + error.message);
        } else {
          setLocationName('');
          fetchConfigAndLogs();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar localização:', err);
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (confirm('Deseja realmente excluir esta localização física da fábrica?')) {
      const { error } = await deleteFactoryLocation(id);
      if (error) {
        alert('Erro ao excluir localização: ' + error.message);
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

  // Operações de Operadores de Produção (Administração)
  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName.trim() || !operatorEmail.trim() || !operatorPin.trim() || !operatorPassword.trim()) {
      alert('Nome, Email, PIN e Senha são obrigatórios.');
      return;
    }

    if (!/^\d{4,6}$/.test(operatorPin)) {
      alert('O PIN deve conter entre 4 e 6 dígitos numéricos.');
      return;
    }

    if (operatorPassword.length < 6) {
      alert('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setSubmittingOperator(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: operatorName.trim(),
          email: operatorEmail.trim(),
          pin: operatorPin.trim(),
          password: operatorPassword.trim(),
          tenantId
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao criar operador.');

      alert('Operador cadastrado com sucesso!');
      setOperatorName('');
      setOperatorEmail('');
      setOperatorPin('');
      setOperatorPassword('');
      fetchConfigAndLogs(); // Atualizar tabela
    } catch (err: any) {
      alert('Erro ao salvar operador: ' + err.message);
    } finally {
      setSubmittingOperator(false);
    }
  };

  const handleToggleOperatorStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      const res = await fetch('/api/operators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao alterar status do operador.');

      fetchConfigAndLogs();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleToggleForcePassword = async (id: string, currentForce: boolean) => {
    try {
      const res = await fetch('/api/operators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, force_password_change: !currentForce })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao forçar troca de senha.');

      fetchConfigAndLogs();
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };


  const handleRequestDeleteUser = (userItem: any) => {
    if (userItem.id === user?.id) {
      alert('Você não pode excluir o seu próprio usuário conectado.');
      return;
    }
    setUserToDelete(userItem);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUserLoading(true);

    try {
      const res = await fetch(`/api/admin/invite?id=${userToDelete.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao excluir usuário.');
      }
      if (selectedOperatorForPermissions?.id === userToDelete.id) {
        setSelectedOperatorForPermissions(null);
      }
      setUserToDelete(null);
      fetchConfigAndLogs();
    } catch (err: any) {
      alert('Erro ao excluir usuário: ' + err.message);
    } finally {
      setIsDeletingUserLoading(false);
    }
  };

  const handleToggleOperatorStagePermission = async (profileId: string, stageId: string, type: 'enter' | 'exit', currentPermissions: any[]) => {
    setSavingPermission(profileId);
    
    const stagePerm = currentPermissions.find((p: any) => p.stage_id === stageId);
    let canEnter = stagePerm ? stagePerm.can_enter : false;
    let canExit = stagePerm ? stagePerm.can_exit : false;
    
    if (type === 'enter') {
      canEnter = !canEnter;
    } else {
      canExit = !canExit;
    }

    // Atualização instantânea no estado local (elimina a piscada da tela)
    const newPerms = [...(currentPermissions || [])];
    const existingIdx = newPerms.findIndex((p: any) => p.stage_id === stageId);
    if (existingIdx >= 0) {
      newPerms[existingIdx] = { ...newPerms[existingIdx], can_enter: canEnter, can_exit: canExit };
    } else {
      newPerms.push({ stage_id: stageId, can_enter: canEnter, can_exit: canExit });
    }

    if (selectedOperatorForPermissions && selectedOperatorForPermissions.id === profileId) {
      setSelectedOperatorForPermissions({
        ...selectedOperatorForPermissions,
        profile_stage_permissions: newPerms
      });
    }

    setProfilesList(prev => prev.map(p => p.id === profileId ? { ...p, profile_stage_permissions: newPerms } : p));
    
    const { error } = await saveProfileStagePermission(profileId, stageId, canEnter, canExit);
    if (error) {
      alert('Erro ao atualizar permissão: ' + error.message);
    }
    setSavingPermission(null);
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim()) return;

    setSubmittingStage(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (selectedStage) {
        const { error } = await updateOrderStage(selectedStage.id, {
          name: stageName.trim(),
          color: stageColor
        });
        if (error) throw error;
        setSelectedStage(null);
        setStageName('');
        setStageColor('#3b82f6');
      } else {
        const maxSequence = stages.reduce((max, s) => s.sequence > max ? s.sequence : max, 0);
        const { error } = await createOrderStage({
          tenant_id: tenantId,
          name: stageName.trim(),
          color: stageColor,
          sequence: maxSequence + 1
        });
        if (error) throw error;
        setStageName('');
        setStageColor('#3b82f6');
      }
      fetchConfigAndLogs();
    } catch (err: any) {
      alert('Erro ao salvar etapa: ' + err.message);
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleMoveStage = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const stage1 = stages[index];
    const stage2 = stages[newIndex];

    const tempSeq = stage1.sequence;
    stage1.sequence = stage2.sequence;
    stage2.sequence = tempSeq;

    setLoading(true);
    try {
      await Promise.all([
        updateOrderStage(stage1.id, { sequence: stage1.sequence }),
        updateOrderStage(stage2.id, { sequence: stage2.sequence })
      ]);
      fetchConfigAndLogs();
    } catch (err: any) {
      console.error('Erro ao reordenar etapas:', err);
      alert('Erro ao reordenar etapas de produção.');
      setLoading(false);
    }
  };

  const handleDeleteStage = async (stage: any) => {
    if (confirm(`Deseja realmente excluir a etapa "${stage.name}"?`)) {
      setLoading(true);
      try {
        const { error } = await deleteOrderStage(stage.id);
        if (error) throw error;
        if (selectedStage?.id === stage.id) {
          setSelectedStage(null);
          setStageName('');
          setStageColor('#3b82f6');
        }
        fetchConfigAndLogs();
      } catch (err: any) {
        alert('Erro ao excluir etapa: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateOperatorRole = async (profileId: string, newRole: string) => {
    setSavingFactoryAccount(true);
    try {
      const isFactory = newRole === 'Fábrica';

      const res = await fetch('/api/operators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: profileId,
          role: isFactory ? 'Fábrica' : newRole,
          is_factory_account: isFactory
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao atualizar perfil.');

      // Atualiza o perfil no modal reativamente
      const updatedOp = profilesList.find(p => p.id === profileId);
      if (updatedOp) {
        setSelectedOperatorForPermissions({
          ...updatedOp,
          role: isFactory ? 'Fábrica' : newRole,
          is_factory_account: isFactory
        });
      }

      if (newRole === 'Produção') {
        const userName = updatedOp?.name || updatedOp?.full_name || 'do Operador';
        setNoticeModalUser(userName);
        setIsProducaoRoleNoticeModalOpen(true);
      } else {
        alert('Perfil do usuário atualizado com sucesso!');
      }

      fetchConfigAndLogs();
    } catch (err: any) {
      alert('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setSavingFactoryAccount(false);
    }
  };

  const activeOp = selectedOperatorForPermissions 
    ? (profilesList.find(o => o.id === selectedOperatorForPermissions.id) || selectedOperatorForPermissions)
    : null;

  const isConnected = config?.access_token && new Date(config.expires_at).getTime() > Date.now();

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{`
        .tabs-nav {
          display: flex;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
          padding-bottom: 0.5rem;
          overflow-x: auto;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .tab-btn:hover {
          background: var(--surface-subtle);
          color: var(--text);
        }
        .tab-btn.active {
          background: var(--primary-subtle, rgba(59, 130, 246, 0.15));
          color: var(--primary, #3b82f6);
        }
      `}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações do Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerencie conexões de APIs, máquinas de produção, equipes de manuseio e regras de embalagem.
          </p>
        </div>
        <button onClick={fetchConfigAndLogs} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Sincronizar Painel</span>
        </button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="tabs-nav">
        <button 
          onClick={() => setActiveTab('operadores')} 
          className={`tab-btn ${activeTab === 'operadores' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>Operadores de Produção</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('convites');
            fetchInvites();
          }} 
          className={`tab-btn ${activeTab === 'convites' ? 'active' : ''}`}
        >
          <UserPlus size={16} />
          <span>Convites de Usuários</span>
        </button>
        <button 
          onClick={() => setActiveTab('producao')} 
          className={`tab-btn ${activeTab === 'producao' ? 'active' : ''}`}
        >
          <Cpu size={16} />
          <span>Produção &amp; Fábrica</span>
        </button>
        <button 
          onClick={() => setActiveTab('embalagem')} 
          className={`tab-btn ${activeTab === 'embalagem' ? 'active' : ''}`}
        >
          <Package size={16} />
          <span>Regras de Embalagem</span>
        </button>
        <button 
          onClick={() => setActiveTab('integracao')} 
          className={`tab-btn ${activeTab === 'integracao' ? 'active' : ''}`}
        >
          <RefreshCw size={16} />
          <span>Integração ERP</span>
        </button>
        <button 
          onClick={() => setActiveTab('sistema')} 
          className={`tab-btn ${activeTab === 'sistema' ? 'active' : ''}`}
        >
          <Settings size={16} />
          <span>Geral &amp; Sistema</span>
        </button>
      </div>

      {/* TAB CONTENT: INTEGRACAO ERP */}
      {activeTab === 'integracao' && (
        <>
          <div className="grid-responsive-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* CONTA AZUL API CREDENTIALS FORM */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={18} style={{ color: 'var(--primary)' }} />
                  Credenciais de API Conta Azul
                </span>
                {!isEditingCredentials && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--surface-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    🔒 Configurado e Bloqueado
                  </span>
                )}
              </h3>
              
              <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Client ID *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    required
                    disabled={!isEditingCredentials}
                    placeholder="Insira o Client ID do Conta Azul..."
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    style={{
                      opacity: isEditingCredentials ? 1 : 0.75,
                      backgroundColor: isEditingCredentials ? 'var(--surface)' : 'var(--background)',
                      cursor: isEditingCredentials ? 'text' : 'not-allowed'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Client Secret *</label>
                  <input 
                    type="password" 
                    className="form-input"
                    required
                    disabled={!isEditingCredentials}
                    placeholder="Insira o Client Secret do Conta Azul..."
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    style={{
                      opacity: isEditingCredentials ? 1 : 0.75,
                      backgroundColor: isEditingCredentials ? 'var(--surface)' : 'var(--background)',
                      cursor: isEditingCredentials ? 'text' : 'not-allowed'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  {isEditingCredentials ? (
                    <button type="submit" className="btn btn-primary">
                      Salvar Credenciais
                    </button>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Credenciais salvas. Clique em **Configurar API** ao lado se precisar alterar.
                    </p>
                  )}
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

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button 
                  onClick={handleOAuthConnect} 
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  Conectar com a Conta Azul
                </button>
                
                <button 
                  type="button"
                  onClick={handleSync24h}
                  disabled={syncing24h || syncing}
                  className="btn"
                  style={{ 
                    flex: 1, 
                    minWidth: '160px', 
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    display: 'flex', 
                    gap: '0.4rem', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: (syncing24h || syncing) ? 'not-allowed' : 'pointer',
                    opacity: (syncing24h || syncing) ? 0.7 : 1
                  }}
                  title="Busca todos os pedidos criados ou alterados nas últimas 24 horas no Conta Azul e força a atualização de pagamentos/status"
                >
                  <Zap size={16} className={syncing24h ? 'spinner' : ''} />
                  <span>{syncing24h ? 'Sincronizando 24h...' : '⚡ Sincronizar Últimas 24h'}</span>
                </button>

                <button 
                  onClick={handleTriggerSync} 
                  disabled={syncing || syncing24h}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '140px', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
                >
                  <RefreshCw size={16} className={syncing ? 'spinner' : ''} />
                  <span>Sincronizar Fila</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfigureApiClick}
                  className={`btn ${isEditingCredentials ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}
                  title={isEditingCredentials ? 'Bloquear edição das credenciais de API' : 'Liberar alteração das credenciais de API Conta Azul'}
                >
                  <Settings size={16} />
                  <span>{isEditingCredentials ? 'Bloquear API' : 'Configurar API'}</span>
                </button>
              </div>

              {sync24hStatus && (
                <div style={{
                  marginTop: '1rem',
                  fontSize: '0.8rem',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500
                }}>
                  <RefreshCw size={15} className={syncing24h ? 'spinner' : ''} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span>{sync24hStatus}</span>
                </div>
              )}

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
        </>
      )}

      {/* TAB CONTENT: PRODUCAO */}
      {activeTab === 'producao' && (
        <>
          {/* SEÇÃO DE GERENCIAMENTO DE ETAPAS DO KANBAN */}
          <div className="grid-responsive-1-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Formulário de Etapa */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'var(--primary)' }} />
                {selectedStage ? 'Editar Etapa do Kanban' : 'Nova Etapa do Kanban'}
              </h3>
              
              <form onSubmit={handleSaveStage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nome da Etapa *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    required
                    placeholder="Ex: Layout e Faca, Acabamento..."
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cor no Kanban</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="color"
                      style={{ width: '40px', height: '38px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '2px', cursor: 'pointer' }}
                      value={stageColor}
                      onChange={(e) => setStageColor(e.target.value)}
                    />
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="#3b82f6"
                      value={stageColor}
                      onChange={(e) => setStageColor(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingStage}>
                    {selectedStage ? 'Salvar Alterações' : 'Criar Etapa'}
                  </button>
                  {selectedStage && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedStage(null);
                        setStageName('');
                        setStageColor('#3b82f6');
                      }} 
                      className="btn btn-secondary"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tabela de Etapas Ativas */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'var(--primary)' }} />
                Etapas Ativas ({stages.length})
              </h3>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Ordem</th>
                      <th>Nome da Etapa</th>
                      <th>Cor Visual</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((stage, index) => (
                      <tr 
                        key={stage.id}
                        style={{
                          backgroundColor: selectedStage?.id === stage.id ? 'rgba(var(--primary-rgb), 0.04)' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              onClick={() => handleMoveStage(index, 'up')}
                              disabled={index === 0 || loading}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              onClick={() => handleMoveStage(index, 'down')}
                              disabled={index === stages.length - 1 || loading}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{stage.name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span 
                              style={{ 
                                display: 'inline-block', 
                                width: '14px', 
                                height: '14px', 
                                borderRadius: '50%', 
                                backgroundColor: stage.color || '#3b82f6', 
                                border: '1px solid var(--border)' 
                              }} 
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stage.color}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => {
                                setSelectedStage(stage);
                                setStageName(stage.name);
                                setStageColor(stage.color);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Edit3 size={12} />
                              <span>Editar</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteStage(stage)}
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
                    {stages.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          Nenhuma etapa ativa configurada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border)', marginBottom: '2.5rem' }} />

          {/* SEÇÃO DE GERENCIAMENTO DE MÁQUINAS E SETORES */}
          <div className="grid-responsive-1-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            
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
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="MANUTENCAO">Em Manutenção</option>
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
          <div className="grid-responsive-1-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            
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
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
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

          {/* LOCALIZAÇÕES FÍSICAS NA FÁBRICA */}
          <div className="grid-responsive-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} />
                {editingLocation ? 'Editar Localização Física' : 'Cadastrar Localização Física na Fábrica'}
              </h3>
              
              <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nome da Localização *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="Ex: Salão, Pátio, Prateleira A1, Máquina Flexo 2..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status da Localização</label>
                  <select 
                    className="form-input"
                    value={locationStatus}
                    onChange={(e) => setLocationStatus(e.target.value as any)}
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {editingLocation && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingLocation(null);
                        setLocationName('');
                      }} 
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submittingLocation}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {submittingLocation ? 'Salvando...' : (editingLocation ? 'Salvar Alteração' : 'Cadastrar Localização')}
                  </button>
                </div>
              </form>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} />
                Localizações Físicas Ativas ({factoryLocations.length})
              </h3>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nome do Local</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factoryLocations.map((loc) => (
                      <tr key={loc.id}>
                        <td style={{ fontWeight: 600 }}>{loc.name}</td>
                        <td>
                          <span className={`badge ${
                            loc.status === 'ATIVO' ? 'badge-success' : 'badge-danger'
                          }`}>
                            {loc.status === 'ATIVO' ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => {
                                setEditingLocation(loc);
                                setLocationName(loc.name);
                                setLocationStatus(loc.status);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Edit3 size={12} />
                              <span>Editar</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteLocation(loc.id)}
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
                    {factoryLocations.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          Nenhuma localização física cadastrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB CONTENT: OPERADORES DE PRODUÇÃO */}
      {activeTab === 'operadores' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                Controle de Usuários e Perfis ({profilesList.length})
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Gerencie todos os colaboradores cadastrados. Clique no nome de qualquer usuário para configurar seu Perfil de Acesso (Administrador, Produção, Terminal de Fábrica) e suas liberações do processo.
              </p>
            </div>
            <button
              onClick={() => {
                fetchConfigAndLogs();
                fetchInvites();
              }}
              disabled={loading}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              title="Atualizar lista de usuários em tempo real"
            >
              <RefreshCw size={14} className={loading ? 'spinner' : ''} />
              <span>Atualizar Lista</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome (Clique para Configurar)</th>
                  <th>E-mail</th>
                  <th>Perfil / Cargo</th>
                  <th>Status</th>
                  <th>Forçar Troca de Senha</th>
                  <th style={{ textAlign: 'right' }}>Ações de Controle</th>
                </tr>
              </thead>
              <tbody>
                {profilesList.map(op => (
                  <tr key={op.id}>
                    <td>
                      <button 
                        onClick={() => setSelectedOperatorForPermissions(op)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          font: 'inherit',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textAlign: 'left'
                        }}
                      >
                        {op.name}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{op.email}</td>
                    <td>
                      <select
                        value={op.is_factory_account ? 'Fábrica' : (op.role || 'Produção')}
                        onChange={(e) => handleUpdateOperatorRole(op.id, e.target.value)}
                        disabled={savingFactoryAccount}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: '1px solid var(--border)',
                          backgroundColor: op.is_factory_account ? 'rgba(234, 179, 8, 0.12)' : 
                                           op.role === 'Administrador' ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface)',
                          color: op.is_factory_account ? '#b45309' : 
                                 op.role === 'Administrador' ? '#1d4ed8' : 'var(--text)',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Produção">Produção</option>
                        <option value="Fábrica">Terminal de Fábrica</option>
                        <option value="Vendedor">Vendedor</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${op.status === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {op.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${op.force_password_change ? 'badge-danger' : 'badge-success'}`}>
                        {op.force_password_change ? 'Exigida' : 'Não'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          onClick={() => setSelectedOperatorForPermissions(op)}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.25rem 0.55rem', 
                            fontSize: '0.72rem', 
                            fontWeight: 600,
                            color: 'var(--primary)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            display: 'flex', 
                            gap: '0.3rem', 
                            alignItems: 'center' 
                          }}
                          title="Configurar permissões de etapas e perfil do usuário"
                        >
                          <Sliders size={12} />
                          <span>Configurar</span>
                        </button>
                        <button 
                          onClick={() => handleToggleOperatorStatus(op.id, op.status)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}
                        >
                          {op.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                        </button>
                        <button 
                          onClick={() => handleToggleForcePassword(op.id, !!op.force_password_change)}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            fontSize: '0.72rem', 
                            fontWeight: 600,
                            backgroundColor: op.force_password_change ? 'var(--success-bg)' : 'var(--danger-bg)',
                            color: op.force_password_change ? 'var(--success)' : 'var(--danger)',
                            border: op.force_password_change ? '1px solid var(--success)' : '1px solid var(--danger)'
                          }}
                        >
                          {op.force_password_change ? 'Remover Exigência' : 'Exigir Troca Senha'}
                        </button>
                        {op.id !== user?.id && (
                          <button 
                            onClick={() => handleRequestDeleteUser(op)}
                            className="btn btn-secondary"
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              fontSize: '0.72rem', 
                              fontWeight: 600, 
                              color: 'var(--danger)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              display: 'flex', 
                              gap: '0.25rem', 
                              alignItems: 'center' 
                            }}
                            title="Excluir este usuário permanentemente do portal"
                          >
                            <Trash2 size={12} />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {profilesList.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      Nenhum usuário cadastrado no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE PERMISSÕES DO OPERADOR */}
      {selectedOperatorForPermissions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '650px',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '2rem',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedOperatorForPermissions(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: 'none',
                background: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              &times;
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} style={{ color: 'var(--primary)' }} />
              Configurar Usuário: {selectedOperatorForPermissions.name}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
              Configure a conta do usuário ou defina quais etapas do processo ele está liberado para movimentar na fábrica.
            </p>

            {/* SELETOR DE PERFIL/CARGO */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Perfil / Nível de Acesso</label>
              <select
                className="form-select"
                value={activeOp!.is_factory_account ? 'Fábrica' : activeOp!.role}
                onChange={(e) => handleUpdateOperatorRole(activeOp!.id, e.target.value as any)}
                disabled={savingFactoryAccount}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <option value="Administrador">Administrador (Acesso total)</option>
                <option value="Produção">Produção (Operador individual)</option>
                <option value="Fábrica">Terminal de Fábrica (Apenas Kanban & necessita PIN de operador)</option>
                <option value="Vendedor">Vendedor (Visualização de Pedidos e Produtos)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Definir como "Terminal de Fábrica" bloqueia esta conta na visualização do Kanban de produção, exigindo PIN de um operador para qualquer movimento.
              </span>
            </div>

            {/* CONFIGURAÇÃO DE CARTEIRA DE VENDEDOR E PERMISSÕES */}
            {(() => {
              const currentSellerData = sellerPermissionsMap[activeOp!.id] || {
                primary_seller_name: activeOp!.full_name || activeOp!.name || '',
                seller_access_mode: 'OWN',
                allowed_sellers: [activeOp!.full_name || activeOp!.name || '']
              };

              const handleSaveUserSellerPermissions = async (
                profileId: string,
                primarySellerName: string,
                sellerAccessMode: 'OWN' | 'SPECIFIC' | 'ALL',
                allowedSellers: string[]
              ) => {
                setSellerPermissionsMap(prev => ({
                  ...prev,
                  [profileId]: {
                    primary_seller_name: primarySellerName,
                    seller_access_mode: sellerAccessMode,
                    allowed_sellers: allowedSellers
                  }
                }));
                await saveSellerPermissions(profileId, primarySellerName, sellerAccessMode, allowedSellers);
              };

              return (
                <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                    <Users size={16} />
                    <span>Vendedor Vinculado & Permissões de Carteira</span>
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Vincule este usuário a um nome de vendedor pré-existente e defina quais carteiras de pedidos ele está autorizado a visualizar.
                  </p>

                  {/* 1. Vendedor Vinculado (Carteira Principal) */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vendedor Principal Vinculado (Carteira)</label>
                    <select
                      className="form-select"
                      value={currentSellerData.primary_seller_name || ''}
                      onChange={(e) => handleSaveUserSellerPermissions(activeOp!.id, e.target.value, (currentSellerData.seller_access_mode as any) || 'OWN', currentSellerData.allowed_sellers || [])}
                      style={{ fontSize: '0.825rem', padding: '0.4rem 0.6rem' }}
                    >
                      <option value="">— Selecione o Vendedor (Ex: Isabela Cardoso) —</option>
                      {availableSellersList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Modo de Visibilidade de Pedidos */}
                  <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Modo de Visibilidade de Pedidos</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name={`seller_mode_${activeOp!.id}`}
                          value="OWN"
                          checked={currentSellerData.seller_access_mode === 'OWN' || !currentSellerData.seller_access_mode}
                          onChange={() => handleSaveUserSellerPermissions(activeOp!.id, currentSellerData.primary_seller_name, 'OWN', [currentSellerData.primary_seller_name || ''])}
                        />
                        <span>🔒 <strong>Apenas Próprios Pedidos</strong> (Somente sua própria carteira)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name={`seller_mode_${activeOp!.id}`}
                          value="SPECIFIC"
                          checked={currentSellerData.seller_access_mode === 'SPECIFIC'}
                          onChange={() => handleSaveUserSellerPermissions(activeOp!.id, currentSellerData.primary_seller_name, 'SPECIFIC', currentSellerData.allowed_sellers || [])}
                        />
                        <span>👥 <strong>Vendedores Específicos</strong> (Visualiza sua carteira + carteiras liberadas pelo Admin)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name={`seller_mode_${activeOp!.id}`}
                          value="ALL"
                          checked={currentSellerData.seller_access_mode === 'ALL'}
                          onChange={() => handleSaveUserSellerPermissions(activeOp!.id, currentSellerData.primary_seller_name, 'ALL', ['*'])}
                        />
                        <span>🌐 <strong>Todos os Vendedores</strong> (Acesso irrestrito a todas as carteiras da empresa)</span>
                      </label>
                    </div>
                  </div>

                  {/* 3. Seleção de Vendedores Liberados se SPECIFIC */}
                  {currentSellerData.seller_access_mode === 'SPECIFIC' && (
                    <div style={{ backgroundColor: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.4rem' }}>
                        Selecione quais vendedores este usuário tem autorização para visualizar:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.4rem' }}>
                        {availableSellersList.map(seller => {
                          const isChecked = (currentSellerData.allowed_sellers || []).includes(seller) || seller === currentSellerData.primary_seller_name;
                          return (
                            <label key={seller} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let updated = [...(currentSellerData.allowed_sellers || [])];
                                  if (e.target.checked) {
                                    if (!updated.includes(seller)) updated.push(seller);
                                  } else {
                                    updated = updated.filter(s => s !== seller);
                                  }
                                  handleSaveUserSellerPermissions(activeOp!.id, currentSellerData.primary_seller_name, 'SPECIFIC', updated);
                                }}
                              />
                              <span>{seller} {seller === currentSellerData.primary_seller_name ? '(Próprio)' : ''}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TABELA DE PERMISSÕES DE ETAPAS */}
            {activeOp!.role === 'Administrador' && !activeOp!.is_factory_account ? (
              <div style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.05)', color: 'var(--primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 500 }}>
                💡 Administradores têm permissão irrestrita de leitura e escrita em todas as etapas da fábrica por padrão.
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                      Etapas Autorizadas no Kanban (Entrada e Saída)
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Marque para quais colunas do processo este {activeOp!.role === 'Vendedor' ? 'vendedor' : 'operador'} pode colocar (Entrada) ou retirar (Saída) pedidos.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      disabled={savingPermission === activeOp!.id}
                      onClick={async () => {
                        const opId = activeOp!.id;
                        setSavingPermission(opId);
                        const allPerms = stages.map(s => ({ stage_id: s.id, can_enter: true, can_exit: true }));
                        setSelectedOperatorForPermissions({ ...selectedOperatorForPermissions, profile_stage_permissions: allPerms });
                        setProfilesList(prev => prev.map(p => p.id === opId ? { ...p, profile_stage_permissions: allPerms } : p));
                        for (const s of stages) {
                          await saveProfileStagePermission(opId, s.id, true, true);
                        }
                        setSavingPermission(null);
                      }}
                    >
                      Liberar Todas
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      disabled={savingPermission === activeOp!.id}
                      onClick={async () => {
                        const opId = activeOp!.id;
                        setSavingPermission(opId);
                        setSelectedOperatorForPermissions({ ...selectedOperatorForPermissions, profile_stage_permissions: [] });
                        setProfilesList(prev => prev.map(p => p.id === opId ? { ...p, profile_stage_permissions: [] } : p));
                        for (const s of stages) {
                          await saveProfileStagePermission(opId, s.id, false, false);
                        }
                        setSavingPermission(null);
                      }}
                    >
                      Bloquear Todas
                    </button>
                  </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '40vh', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Etapa do Processo</th>
                        <th style={{ textAlign: 'center', padding: '0.75rem 1rem', width: '130px' }}>Entrada (Colocar)</th>
                        <th style={{ textAlign: 'center', padding: '0.75rem 1rem', width: '130px' }}>Saída (Tirar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stages.map(stage => {
                        const opPermissions = activeOp!.profile_stage_permissions || [];
                        const stagePerm = opPermissions.find((p: any) => p.stage_id === stage.id);
                        const canEnter = stagePerm ? stagePerm.can_enter : false;
                        const canExit = stagePerm ? stagePerm.can_exit : false;

                        return (
                          <tr key={stage.id}>
                            <td style={{ fontWeight: 600, padding: '0.75rem 1rem' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color || '#3b82f6', marginRight: '0.5rem' }} />
                              {stage.name}
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>
                              <input 
                                type="checkbox"
                                checked={canEnter}
                                disabled={savingPermission === activeOp!.id}
                                onChange={() => handleToggleOperatorStagePermission(activeOp!.id, stage.id, 'enter', opPermissions)}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>
                              <input 
                                type="checkbox"
                                checked={canExit}
                                disabled={savingPermission === activeOp!.id}
                                onChange={() => handleToggleOperatorStagePermission(activeOp!.id, stage.id, 'exit', opPermissions)}
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              {activeOp && activeOp.id !== user?.id ? (
                <button
                  type="button"
                  onClick={() => handleRequestDeleteUser(activeOp)}
                  className="btn btn-secondary"
                  style={{ color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} />
                  <span>Excluir Usuário</span>
                </button>
              ) : <div />}

              <button 
                onClick={() => setSelectedOperatorForPermissions(null)}
                className="btn btn-primary"
                style={{ minWidth: '100px' }}
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMBALAGEM */}
      {activeTab === 'embalagem' && (
        <>
          {/* REGRAS E CONVENÇÕES DE EMBALAGEM */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} style={{ color: 'var(--primary)' }} />
              Convenções e Regras de Associação de Embalagem
            </h3>
            <form onSubmit={handleSavePackagingSettings} className="grid-responsive-2" style={{ gap: '1.5rem', alignItems: 'end' }}>
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
                  <option value="FIRST_ITEM">Associar caixas ao primeiro item de produto do PV</option>
                  <option value="LARGEST_QUANTITY">Associar caixas ao item de maior tiragem do PV</option>
                  <option value="MANUAL">Associação manual pelo operador (sem sugestão)</option>
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
          <div className="grid-responsive-1-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
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
                    <option value="CAIXA">Caixa</option>
                    <option value="FUNDO">Fundo</option>
                    <option value="DIVISORIA">Divisória</option>
                    <option value="SACO">Saco / Sacola</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-select" value={pmtStatus} onChange={(e) => setPmtStatus(e.target.value as any)}>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
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
                            {m.category === 'CAIXA' ? 'Caixa' : m.category === 'FUNDO' ? 'Fundo' : m.category === 'DIVISORIA' ? 'Divisória' : m.category === 'SACO' ? 'Saco' : 'Outro'}
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
        </>
      )}

      {/* TAB CONTENT: SISTEMA & GERAL */}
      {activeTab === 'sistema' && (
        <>
          {/* THEME CONFIGURATION */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} />
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

          {/* ZONA DE PERIGO: REDEFINIÇÃO DE DADOS */}
          <div className="card" style={{ border: '1px solid var(--danger)', backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.02)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--danger)' }} />
              Zona de Perigo: Redefinição de Dados
            </h3>
            
            {/* OPÇÃO 1: ZERAR SOMENTE ESTOQUE E PRODUTOS */}
            <div style={{ paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px dashed var(--border)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.35rem' }}>
                1. Zerar Apenas Catálogo de Produtos &amp; Estoque
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                Exclui todos os produtos importados, movimentações e saldos de estoque do portal para permitir uma reimportação limpa e sem duplicidades. 
                <strong style={{ color: 'var(--success)', display: 'block', marginTop: '0.25rem' }}>
                  ✓ Seus pedidos existentes, clientes, histórico de produção e financeiro serão MANTIDOS intactos.
                </strong>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={handleWipeStock}
                  disabled={wipingStock}
                  className="btn"
                  style={{
                    backgroundColor: wipingStock ? 'var(--border)' : 'var(--warning, #f59e0b)',
                    color: '#000',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: wipingStock ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={16} />
                  <span>{wipingStock ? 'Limpando produtos e estoques...' : 'Zerar Apenas Produtos & Estoque'}</span>
                </button>
                {wipingStockSuccess && (
                  <span style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>
                    ✓ Produtos e estoques zerados com sucesso!
                  </span>
                )}
              </div>
            </div>

            {/* OPÇÃO 2: ZERAR TODO O PORTAL */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.35rem' }}>
                2. Zerar Todo o Banco de Dados Local
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                Esta ação **exclui permanentemente** todos os pedidos locais, itens do Kanban, histórico de setores, lançamentos financeiros locais, clientes e produtos importados. 
                <strong style={{ color: 'var(--text)', display: 'block', marginTop: '0.25rem' }}>
                  ⚠️ Seus dados reais no Conta Azul NÃO serão tocados ou alterados de forma alguma.
                </strong>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={handleWipeData}
                  disabled={wiping}
                  className="btn"
                  style={{
                    backgroundColor: wiping ? 'var(--border)' : 'var(--danger)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: wiping ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={16} />
                  <span>{wiping ? 'Limpando todo o banco local...' : 'Zerar Todo o Banco Local (Manter Chaves)'}</span>
                </button>
                {wipingSuccess && (
                  <span style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>
                    ✓ Redefinição total concluída!
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB CONTENT: CONVITES DE USUÁRIOS */}
      {activeTab === 'convites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* GRID: FORMULÁRIO DE CONVITE + LISTA DE CONVITES */}
          <div className="grid-responsive-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            
            {/* FORMULÁRIO DE NOVO CONVITE */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} style={{ color: 'var(--primary)' }} />
                <span>Convidar Novo Usuário</span>
              </h3>

              {inviteSuccess && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              {inviteError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{inviteError}</span>
                </div>
              )}

              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text)' }}>
                    Endereço de E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: usuario@samppel.com.br"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text)' }}>
                    Nome Completo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: João Silva"
                    value={inviteFullName}
                    onChange={(e) => setInviteFullName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text)' }}>
                    Papel / Perfil no Portal *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                  >
                    <option value="Administrador">Outros Administradores</option>
                    <option value="Produção">Produção</option>
                    <option value="Fábrica">Fábrica</option>
                    <option value="Vendedor">Vendedor</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginTop: '0.5rem',
                    cursor: submittingInvite ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={16} />
                  <span>{submittingInvite ? 'Enviando convite...' : 'Disparar Convite por E-mail'}</span>
                </button>
              </form>
            </div>

            {/* TABELA DE CONVITES ENVIADOS / PENDENTES */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={18} style={{ color: 'var(--primary)' }} />
                  <span>Convites Enviados</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}>
                    {invitesList.length}
                  </span>
                </h3>
                <button
                  onClick={fetchInvites}
                  disabled={fetchingInvites}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={14} className={fetchingInvites ? 'spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>

              {invitesList.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', background: 'var(--surface-subtle)', borderRadius: '8px' }}>
                  Nenhum convite pendente encontrado. Use o formulário para convidar novos usuários.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Usuário / E-mail</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Papel</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Data</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitesList.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{inv.full_name || 'Sem nome'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inv.email}</div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--surface-subtle)', color: 'var(--text)' }}>
                              {inv.role}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {isInviteExpired(inv.created_at) ? (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: 'var(--danger)'
                              }}>
                                • EXPIRADO (24h+)
                              </span>
                            ) : (
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--primary)'
                              }}>
                                • PENDENTE
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleResendInvite(inv)}
                              title="Reenviar e-mail de convite e renovar o link de acesso"
                              style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                marginRight: '0.4rem'
                              }}
                            >
                              <RefreshCw size={13} />
                              <span>Reenviar</span>
                            </button>
                            <button
                              onClick={() => handleCancelInvite(inv.id)}
                              title="Cancelar convite"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                padding: '0.3rem',
                                borderRadius: '4px',
                                verticalAlign: 'middle'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal de Alerta de Alteração de Credenciais de API */}
      {isConfigWarningModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            padding: '1.75rem', maxWidth: '480px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
            }}>
              <ShieldAlert size={32} style={{ color: 'var(--danger)' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>
                Atenção: Alteração de Credenciais de API
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.5', margin: 0 }}>
                Qualquer alteração indevida no <strong>Client ID</strong> ou <strong>Client Secret</strong> irá <strong>interromper a sincronização</strong> com o Conta Azul!
              </p>
            </div>

            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px',
              backgroundColor: 'var(--background)', border: '1px dashed var(--border)',
              fontSize: '0.78rem', color: 'var(--text-muted)'
            }}>
              💡 Recomendado alterar somente se houver troca de chaves na sua conta oficial do Conta Azul.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsConfigWarningModalOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlockApi}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Liberar Edição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Customizado de Confirmação de Exclusão de Usuário */}
      {userToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            padding: '1.75rem', maxWidth: '460px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
            }}>
              <Trash2 size={28} style={{ color: 'var(--danger)' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>
                Excluir Usuário Permanentemente
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.5', margin: 0 }}>
                Tem certeza de que deseja excluir o usuário <strong>{userToDelete.name || userToDelete.email}</strong>?
              </p>
            </div>

            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px',
              backgroundColor: 'var(--background)', border: '1px dashed var(--border)',
              fontSize: '0.78rem', color: 'var(--text-muted)'
            }}>
              ⚠️ Esta ação revogará imediatamente o acesso do colaborador ao portal e excluirá seu cadastro.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={isDeletingUserLoading}
                onClick={() => setUserToDelete(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingUserLoading}
                onClick={handleConfirmDeleteUser}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
              >
                {isDeletingUserLoading ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Excluir Usuário</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AVISO AO ALTERAR PERFIL PARA PRODUÇÃO */}
      {isProducaoRoleNoticeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <KeyRound size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text)' }}>
                Perfil Alterado para Produção com Sucesso!
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                O colaborador agora possui o papel de Operador de Produção.
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: 'var(--text)',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#b45309', display: 'block', marginBottom: '0.25rem' }}>
                ⚠️ Ação necessária no primeiro acesso:
              </strong>
              Por favor, peça para o usuário <strong>{noticeModalUser}</strong> fazer login na conta dele e cadastrar um <strong>PIN de fábrica (4 a 6 dígitos numéricos)</strong> no perfil dele, pois sem o PIN ele não conseguirá movimentar os cartões de produção.
            </div>

            <button
              onClick={() => setIsProducaoRoleNoticeModalOpen(false)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              Entendido / Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

