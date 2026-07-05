'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCustomers, createCustomer, updateCustomer } from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, RefreshCw } from 'lucide-react';

export default function ClientesPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [searchingContaAzul, setSearchingContaAzul] = useState(false);

  // Sync Modal State (similar to order sync)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStep, setSyncStep] = useState('');
  const [syncResult, setSyncResult] = useState<any>(null);
  const [activeAbortController, setActiveAbortController] = useState<AbortController | null>(null);

  const formatDocument = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 14);
    if (clean.length <= 11) {
      // CPF: 999.999.999-99
      return clean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 99.999.999/9999-99
      return clean
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 11);
    if (clean.length <= 10) {
      // (99) 9999-9999
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    } else {
      // (99) 99999-9999
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
  };

  const handlePullFromContaAzul = async () => {
    const cleanDoc = formDocument.replace(/\D/g, '');
    if (!cleanDoc && !formName) {
      alert('Preencha o CNPJ/CPF ou o Nome do cliente para buscar no Conta Azul.');
      return;
    }

    setSearchingContaAzul(true);
    try {
      const queryParams = new URLSearchParams();
      if (cleanDoc) queryParams.append('document', cleanDoc);
      else queryParams.append('name', formName);

      const response = await fetch(`/api/sync/search-customer?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Erro na requisição de busca.');
      }
      const data = await response.json();
      if (data.success && data.found && data.customer) {
        const c = data.customer;
        setFormName(c.name || formName);
        if (c.document) setFormDocument(formatDocument(c.document));
        if (c.email) setFormEmail(c.email.toLowerCase());
        if (c.phone) setFormPhone(formatPhone(c.phone));
        if (c.address) setFormAddress(c.address);
        alert('Dados importados da Conta Azul preenchidos com sucesso!');
      } else {
        alert(data.message || 'Nenhum cliente encontrado com essas credenciais na Conta Azul.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao buscar cliente na Conta Azul: ' + err.message);
    } finally {
      setSearchingContaAzul(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await getCustomers();
      setCustomers(data || []);
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'Produção') {
      fetchCustomers();
    }
  }, [user]);

  // Security guard check
  if (user && user.role === 'Produção') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O setor de **Produção** não tem permissões administrativas para visualizar ou gerenciar o cadastro de clientes.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedCustomer(null);
    setFormName('');
    setFormDocument('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setModalType('edit');
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setFormDocument(customer.document || '');
    setFormEmail(customer.email || '');
    setFormPhone(customer.phone || '');
    setFormAddress(customer.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formName,
      document: formDocument,
      email: formEmail,
      phone: formPhone,
      address: formAddress
    };

    if (modalType === 'create') {
      const { error } = await createCustomer(payload);
      if (error) {
        alert('Erro ao cadastrar cliente: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchCustomers();
      }
    } else {
      const { error } = await updateCustomer(selectedCustomer.id, payload);
      if (error) {
        alert('Erro ao atualizar cliente: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchCustomers();
      }
    }
  };

  const [importing, setImporting] = useState(false);

  const handleCancelSync = () => {
    if (activeAbortController) {
      activeAbortController.abort();
    }
  };

  // Aciona a importacao de clientes do Conta Azul com progresso via ReadableStream
  const handleImportCustomers = async () => {
    setImporting(true);
    setSyncProgress(0);
    setSyncStep('Iniciando conexão com a Conta Azul...');
    setSyncResult(null);
    setIsSyncModalOpen(true);

    const controller = new AbortController();
    setActiveAbortController(controller);

    try {
      const res = await fetch('/api/sync/import-customers', { 
        method: 'POST',
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error('Falha ao conectar com o serviço de importação.');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const chunk = JSON.parse(line);
                if (chunk.step) setSyncStep(chunk.step);
                if (chunk.progress !== undefined) setSyncProgress(chunk.progress);
                if (chunk.success !== undefined) {
                  if (chunk.success) {
                    setSyncProgress(100);
                    setSyncStep('Sincronização de clientes concluída com sucesso!');
                    setSyncResult({ success: true, imported: chunk.imported, updated: chunk.updated });
                    fetchCustomers();
                  } else {
                    throw new Error(chunk.error || 'Erro desconhecido');
                  }
                }
              } catch (e) {
                console.error('Erro ao ler linha de progresso:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setSyncProgress(90);
        setSyncStep('Sincronização interrompida pelo usuário.');
        setSyncResult({ success: false, error: 'A importação local de clientes foi cancelada por você.' });
      } else {
        setSyncProgress(100);
        setSyncStep('Falha na sincronização.');
        setSyncResult({ success: false, error: err.message || 'Erro ao importar clientes.' });
      }
    } finally {
      setImporting(false);
      setActiveAbortController(null);
    }
  };

  const getGroupedCustomers = () => {
    // 1. Filtra pela busca
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.document && c.document.includes(search))
    );

    // 2. Agrupa por nome e documento
    const groups: { [key: string]: any[] } = {};
    for (const c of filtered) {
      const cleanDoc = (c.document || '').replace(/\D/g, '');
      const nameKey = (c.name || '').toLowerCase().trim();
      const key = `${nameKey}_${cleanDoc}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(c);
    }

    // 3. Formata e junta os IDs
    return Object.values(groups).map(group => {
      const primary = group[0];
      const allIds = group.map(c => {
        const idStr = c.id || '';
        return idStr.substring(idStr.length - 3);
      }).join(', ');

      return {
        ...primary,
        all_ids: allIds,
        is_grouped: group.length > 1
      };
    });
  };

  const groupedCustomers = getGroupedCustomers();

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Cadastro de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerenciamento de clientes da Samppel Embalagens e integração com Conta Azul.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleImportCustomers} 
            disabled={importing}
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={16} className={importing ? 'spinner' : ''} />
            <span>{importing ? 'Importando...' : 'Importar do Conta Azul'}</span>
          </button>
          
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="form-label">Buscar Cliente</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Digite o nome ou CNPJ/CPF do cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchCustomers} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* CUSTOMERS LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nome / Razão Social</th>
                <th>IDs</th>
                <th>CNPJ / CPF</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Sincronização Conta Azul</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={8} />
                ))
              ) : groupedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum cliente cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                groupedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td><code>{customer.all_ids}</code></td>
                    <td><code>{formatDocument(customer.document) || '---'}</code></td>
                    <td style={{ textTransform: 'lowercase' }}>{customer.email || '---'}</td>
                    <td>{formatPhone(customer.phone) || '---'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customer.address || '---'}
                    </td>
                    <td>
                      {customer.conta_azul_id ? (
                        <span className="badge badge-success" title={`ID: ${customer.conta_azul_id}`}>
                          <CheckCircle2 size={12} />
                          Integrado ({customer.conta_azul_id.substring(0, 8)})
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <HelpCircle size={12} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenEdit(customer)} 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                      >
                        <Edit size={12} />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
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
                {modalType === 'create' ? 'Cadastrar Novo Cliente' : 'Editar Cliente'}
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
                <label className="form-label">Nome Completo / Razão Social *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CNPJ / CPF</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: 00.000.000/0001-00"
                    value={formDocument}
                    onChange={(e) => setFormDocument(formatDocument(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handlePullFromContaAzul}
                    disabled={searchingContaAzul}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', whiteSpace: 'nowrap' }}
                  >
                    <RefreshCw size={12} className={searchingContaAzul ? 'spinner' : ''} />
                    {searchingContaAzul ? 'Buscando...' : 'Buscar no Conta Azul'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Ex: financeiro@empresa.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value.toLowerCase().trim())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: (11) 98765-4321"
                  value={formPhone}
                  onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Completo</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Rua, Número, Bairro, Cidade/UF..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                />
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
                  {modalType === 'create' ? 'Salvar Cliente' : 'Salvar Alterações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE PROGRESSO DE SINCRONIZAÇÃO */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isSyncModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '2rem', maxWidth: '420px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}>
              <RefreshCw size={20} className={importing ? 'spinner' : ''} style={{ color: 'var(--primary)', animation: importing ? 'spin 1s linear infinite' : 'none' }} />
              Sincronização Conta Azul
            </h2>

            {/* Progresso */}
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${syncProgress}%`,
                  backgroundColor: syncResult && !syncResult.success ? 'var(--danger)' : 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease-out'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'left', flex: 1, paddingRight: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={syncStep}>
                  {syncStep}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 700 }}>
                  {syncProgress}%
                </span>
              </div>
            </div>

            {/* Resultados / Erros */}
            {syncResult && (
              <div style={{
                backgroundColor: syncResult.success ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                border: `1px solid ${syncResult.success ? '#2ed573' : 'var(--danger)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                {syncResult.success ? (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ed573', fontSize: '0.9rem', fontWeight: 700 }}>
                      Sincronizado com Sucesso
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>Clientes importados: <strong>{syncResult.imported}</strong></li>
                      <li>Clientes atualizados: <strong>{syncResult.updated}</strong></li>
                    </ul>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>
                      Falha na Importação
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {syncResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              {importing ? (
                <>
                  <button
                    onClick={handleCancelSync}
                    className="btn btn-danger"
                    style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                  >
                    Cancelar Sincronização
                  </button>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3, textAlign: 'left', width: '100%', display: 'block' }}>
                    * A escuta local será interrompida e o modal será fechado. As chamadas em andamento no servidor não podem ser desfeitas via API.
                  </span>
                </>
              ) : (
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                >
                  Concluir e Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
