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

  // Aciona a importacao de clientes do Conta Azul para o banco local
  const handleImportCustomers = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/sync/import-customers', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Falha ao importar clientes.');
      }
      const data = await res.json();
      if (data.success) {
        alert(`Sincronizacao concluida com sucesso! Clientes importados: ${data.imported}, atualizados: ${data.updated}.`);
        fetchCustomers();
      } else {
        alert('Erro ao importar clientes: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao importar clientes.');
    } finally {
      setImporting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.document && c.document.includes(search))
  );

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
                  <TableRowSkeleton key={idx} cols={7} />
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum cliente cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td><code>{customer.document || '---'}</code></td>
                    <td>{customer.email || '---'}</td>
                    <td>{customer.phone || '---'}</td>
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
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: 00.000.000/0001-00"
                  value={formDocument}
                  onChange={(e) => setFormDocument(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Ex: financeiro@empresa.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: (11) 98765-4321"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
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
    </div>
  );
}
