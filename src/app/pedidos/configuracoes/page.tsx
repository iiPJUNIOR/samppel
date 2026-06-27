'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getOrderStages, 
  createOrderStage, 
  updateOrderStage, 
  deleteOrderStage, 
  getProfilesWithPermissions, 
  saveProfileStagePermission,
  getOrders
} from '@/services/supabase';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Edit3, 
  Save, 
  Loader2, 
  RefreshCw,
  Sliders,
  Users
} from 'lucide-react';

export default function ProcessSettingsPage() {
  const { user } = useAuth();
  
  // Estados para dados do banco
  const [stages, setStages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para indicar salvamento de permissao
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  
  // Estado para etapa selecionada para edicao
  const [selectedStage, setSelectedStage] = useState<any | null>(null);
  
  // Estados para os inputs do formulario (usados para Criacao e Edicao)
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#3b82f6');
  
  // Estado para armazenar as permissões editadas no formulário da etapa
  const [stagePermissions, setStagePermissions] = useState<{[profileId: string]: {canEnter: boolean, canExit: boolean}}>({});

  const handleFormPermissionChange = (profileId: string, type: 'canEnter' | 'canExit') => {
    setStagePermissions(prev => {
      const current = prev[profileId] || { canEnter: false, canExit: false };
      return {
        ...prev,
        [profileId]: {
          ...current,
          [type]: !current[type]
        }
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [stagesRes, profilesRes, ordersRes] = await Promise.all([
        getOrderStages(tenantId),
        getProfilesWithPermissions(tenantId),
        getOrders(tenantId)
      ]);
      
      if (stagesRes.data) {
        setStages(stagesRes.data);
      }
      if (profilesRes.data) {
        setProfiles(profilesRes.data);
      }
      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do processo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchData();
    }
  }, [user]);

  // Inicializar permissões vazias/padrão para novo registro
  useEffect(() => {
    if (profiles.length > 0 && !selectedStage) {
      const initialPerms: {[profileId: string]: {canEnter: boolean, canExit: boolean}} = {};
      profiles.forEach(p => {
        const isAdmin = p.role === 'Administrador';
        initialPerms[p.id] = {
          canEnter: isAdmin,
          canExit: isAdmin
        };
      });
      setStagePermissions(initialPerms);
    }
  }, [profiles, selectedStage]);

  // Bloqueia acesso de quem nao e admin
  if (user && user.role !== 'Administrador') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Apenas usuários com perfil de Administrador possuem permissões de sistema para configurar etapas de produção e gerenciar liberações de movimentação.
        </p>
      </div>
    );
  }

  // Submit do Formulario (Criar ou Atualizar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim()) return;

    setLoading(true);
    try {
      if (selectedStage) {
        // Modo de Edicao
        const { error } = await updateOrderStage(selectedStage.id, {
          name: stageName.trim(),
          color: stageColor
        });

        if (error) {
          alert('Erro ao atualizar etapa: ' + error.message);
        } else {
          // Salvar permissões modificadas no formulário
          const savePromises = Object.entries(stagePermissions).map(([profileId, perms]) => {
            const profile = profiles.find(p => p.id === profileId);
            if (profile?.role === 'Administrador') return Promise.resolve();
            return saveProfileStagePermission(profileId, selectedStage.id, perms.canEnter, perms.canExit);
          });
          await Promise.all(savePromises);

          setSelectedStage(null);
          setStageName('');
          setStageColor('#3b82f6');
          await fetchData();
        }
      } else {
        // Modo de Criacao
        const maxSequence = stages.reduce((max, s) => s.sequence > max ? s.sequence : max, 0);
        const newStage = {
          tenant_id: user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
          name: stageName.trim(),
          color: stageColor,
          sequence: maxSequence + 1
        };

        const { data, error } = await createOrderStage(newStage);
        if (error) {
          alert('Erro ao criar etapa: ' + error.message);
        } else {
          // Salvar permissões inseridas no formulário para a nova etapa
          if (data && data.id) {
            const savePromises = Object.entries(stagePermissions).map(([profileId, perms]) => {
              const profile = profiles.find(p => p.id === profileId);
              if (profile?.role === 'Administrador') return Promise.resolve();
              return saveProfileStagePermission(profileId, data.id, perms.canEnter, perms.canExit);
            });
            await Promise.all(savePromises);
          }

          setStageName('');
          setStageColor('#3b82f6');
          await fetchData();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar etapa:', err);
      alert('Erro ao salvar etapa.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar propriedades da etapa no formulario da esquerda
  const handleSelectStageForEdit = (stage: any) => {
    setSelectedStage(stage);
    setStageName(stage.name);
    setStageColor(stage.color);

    // Inicializar as permissões da etapa selecionada com base nos perfis carregados
    const initialPerms: {[profileId: string]: {canEnter: boolean, canExit: boolean}} = {};
    profiles.forEach(p => {
      const isAdmin = p.role === 'Administrador';
      const pPerm = p.profile_stage_permissions?.find((sp: any) => sp.stage_id === stage.id);
      initialPerms[p.id] = {
        canEnter: isAdmin ? true : (pPerm ? pPerm.can_enter : false),
        canExit: isAdmin ? true : (pPerm ? pPerm.can_exit : false)
      };
    });
    setStagePermissions(initialPerms);
  };

  // Limpar selecao e voltar para modo de criacao
  const handleClearSelection = () => {
    setSelectedStage(null);
    setStageName('');
    setStageColor('#3b82f6');

    // Resetar permissões para o padrão do formulário de criação
    const initialPerms: {[profileId: string]: {canEnter: boolean, canExit: boolean}} = {};
    profiles.forEach(p => {
      const isAdmin = p.role === 'Administrador';
      initialPerms[p.id] = {
        canEnter: isAdmin,
        canExit: isAdmin
      };
    });
    setStagePermissions(initialPerms);
  };

  const handleDeleteStage = async (stage: any) => {
    const ordersCount = orders.filter(o => o.stage_id === stage.id).length;
    if (ordersCount > 0) {
      alert(`Não é possível excluir a etapa "${stage.name}" pois ela possui ${ordersCount} pedido(s) vinculado(s). Remova ou altere esses pedidos antes de prosseguir.`);
      return;
    }

    if (confirm(`Deseja realmente excluir a etapa "${stage.name}"?`)) {
      const { error } = await deleteOrderStage(stage.id);
      if (error) {
        alert('Erro ao excluir etapa: ' + error.message);
      } else {
        // Se a etapa deletada for a que estava em edicao, limpa a selecao
        if (selectedStage?.id === stage.id) {
          handleClearSelection();
        }
        fetchData();
      }
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
      fetchData();
    } catch (err) {
      console.error('Erro ao reordenar etapas:', err);
      alert('Erro ao reordenar etapas de produção.');
      setLoading(false);
    }
  };

  const handleToggleEntryExitPermission = async (profileId: string, stageId: string, type: 'enter' | 'exit', currentPermissions: any[]) => {
    setSavingPermission(profileId);
    
    // Encontra o registro de permissao atual para essa etapa
    const stagePerm = currentPermissions.find((p: any) => p.stage_id === stageId);
    
    let canEnter = stagePerm ? stagePerm.can_enter : false;
    let canExit = stagePerm ? stagePerm.can_exit : false;
    
    if (type === 'enter') {
      canEnter = !canEnter;
    } else {
      canExit = !canExit;
    }
    
    const { error } = await saveProfileStagePermission(profileId, stageId, canEnter, canExit);
    if (error) {
      alert('Erro ao atualizar permissão: ' + error.message);
    } else {
      await fetchData();
    }
    setSavingPermission(null);
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações de Processo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Customize as etapas do painel Kanban de produção e gerencie as permissões de entrada (colocar) e saída (tirar) de cada colaborador.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {loading ? <Loader2 size={16} className="spinner" /> : <RefreshCw size={16} />}
          <span>Atualizar Dados</span>
        </button>
      </header>

      {loading && stages.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SEÇÃO 1: GESTÃO DE ETAPAS DE PRODUÇÃO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            
            {/* Card para Cadastrar / Editar Etapa */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedStage ? <Edit3 size={18} style={{ color: 'var(--primary)' }} /> : <Plus size={18} style={{ color: 'var(--primary)' }} />}
                {selectedStage ? 'Editar Etapa de Produção' : 'Nova Etapa de Produção'}
              </h3>
              
              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Liberações para esta Etapa
                  </label>
                  <div style={{ 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: 'var(--surface-subtle)'
                  }}>
                    {profiles.map(p => {
                      const isAdmin = p.role === 'Administrador';
                      const perm = stagePermissions[p.id] || { canEnter: isAdmin, canExit: isAdmin };
                      
                      return (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '50%' }}>
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.full_name}>
                              {p.full_name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {p.role}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: isAdmin ? 'not-allowed' : 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={perm.canEnter}
                                disabled={isAdmin}
                                onChange={() => handleFormPermissionChange(p.id, 'canEnter')}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span>Colocar</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: isAdmin ? 'not-allowed' : 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={perm.canExit}
                                disabled={isAdmin}
                                onChange={() => handleFormPermissionChange(p.id, 'canExit')}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span>Tirar</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    {selectedStage ? 'Salvar Alterações' : 'Adicionar Etapa'}
                  </button>
                  
                  {selectedStage && (
                    <button 
                      type="button" 
                      onClick={handleClearSelection} 
                      className="btn btn-secondary" 
                      style={{ width: '100%' }}
                    >
                      Nova Etapa de Produção
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista e Reordenação das Etapas */}
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
                      <th>Nome da Etapa (Clique para editar)</th>
                      <th style={{ width: '120px' }}>Cor Visual</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((stage, index) => {
                      const ordersCount = orders.filter(o => o.stage_id === stage.id).length;
                      const isSelected = selectedStage?.id === stage.id;

                      return (
                        <tr 
                          key={stage.id}
                          style={{
                            backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.04)' : 'transparent',
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
                          <td 
                            onClick={() => handleSelectStageForEdit(stage)}
                            style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'inherit';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {stage.name}
                              {ordersCount > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                                  ({ordersCount} pedidos)
                                </span>
                              )}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: stage.color }} />
                              <code style={{ fontSize: '0.75rem' }}>{stage.color}</code>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleSelectStageForEdit(stage)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: MATRIZ DE PERMISSÕES DE MOVIMENTAÇÃO DE ETAPAS */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Permissões de Movimentação por Colaborador
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              Defina os privilégios de **Colocar (Entrada)** e **Tirar (Saída)** pedidos de cada etapa. Administradores possuem liberação total nativa.
            </p>

            <div className="table-responsive">
              <table className="table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th rowSpan={2} style={{ textAlign: 'left', padding: '1rem', minWidth: '180px', verticalAlign: 'middle' }}>Nome / E-mail</th>
                    <th rowSpan={2} style={{ textAlign: 'left', padding: '1rem', width: '130px', verticalAlign: 'middle' }}>Cargo</th>
                    {stages.map((stage) => (
                      <th 
                        key={stage.id} 
                        colSpan={2}
                        style={{ 
                          textAlign: 'center', 
                          padding: '0.5rem', 
                          fontSize: '0.75rem',
                          minWidth: '140px',
                          borderLeft: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color }} />
                          <span>{stage.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {stages.map((stage) => (
                      <React.Fragment key={stage.id}>
                        <th style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', fontWeight: 600 }}>Colocar</th>
                        <th style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tirar</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const isAdmin = profile.role === 'Administrador';
                    const profilePermissions = profile.profile_stage_permissions || [];

                    return (
                      <tr 
                        key={profile.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: savingPermission === profile.id ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{profile.full_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.email}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${
                            profile.role === 'Administrador' ? 'badge-primary' :
                            profile.role === 'Comercial' ? 'badge-info' :
                            profile.role === 'Produção' ? 'badge-warning' : 'badge-success'
                          }`}>
                            {profile.role}
                          </span>
                        </td>
                        {stages.map((stage) => {
                          const stagePerm = profilePermissions.find((p: any) => p.stage_id === stage.id);
                          const canEnter = stagePerm ? stagePerm.can_enter : false;
                          const canExit = stagePerm ? stagePerm.can_exit : false;

                          return (
                            <React.Fragment key={stage.id}>
                              {/* Colocar Checkbox */}
                              <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem', borderLeft: '1px solid var(--border)' }}>
                                {isAdmin ? (
                                  <input 
                                    type="checkbox"
                                    checked={true}
                                    disabled={true}
                                    style={{ transform: 'scale(1.05)', cursor: 'not-allowed', accentColor: 'var(--primary)' }}
                                  />
                                ) : (
                                  <input 
                                    type="checkbox"
                                    checked={canEnter}
                                    disabled={savingPermission === profile.id}
                                    onChange={() => handleToggleEntryExitPermission(profile.id, stage.id, 'enter', profilePermissions)}
                                    style={{ transform: 'scale(1.05)', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                  />
                                )}
                              </td>
                              {/* Tirar Checkbox */}
                              <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                                {isAdmin ? (
                                  <input 
                                    type="checkbox"
                                    checked={true}
                                    disabled={true}
                                    style={{ transform: 'scale(1.05)', cursor: 'not-allowed', accentColor: 'var(--primary)' }}
                                  />
                                ) : (
                                  <input 
                                    type="checkbox"
                                    checked={canExit}
                                    disabled={savingPermission === profile.id}
                                    onChange={() => handleToggleEntryExitPermission(profile.id, stage.id, 'exit', profilePermissions)}
                                    style={{ transform: 'scale(1.05)', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                  />
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
