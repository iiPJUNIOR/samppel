'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSuppliers, createSupplier, updateSupplier } from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, RefreshCw } from 'lucide-react';

export default function FornecedoresPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await getSuppliers();
      setSuppliers(data || []);
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowedRoles = ['Administrador', 'Comercial'];
    if (user && allowedRoles.includes(user.role)) {
      fetchSuppliers();
    }
  }, [user]);

  // Security guard check: Only Comercial and Administrador can access
  const allowedRoles = ['Administrador', 'Comercial'];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O seu perfil de **{user.role}** não possui autorização para gerenciar ou visualizar o cadastro de fornecedores.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedSupplier(null);
    setFormName('');
    setFormDocument('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setModalType('edit');
    setSelectedSupplier(supplier);
    setFormName(supplier.name);
    setFormDocument(supplier.document || '');
    setFormEmail(supplier.email || '');
    setFormPhone(supplier.phone || '');
    setFormAddress(supplier.address || '');
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
      const { error } = await createSupplier(payload);
      if (error) {
        alert('Erro ao cadastrar fornecedor: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchSuppliers();
      }
    } else {
      const { error } = await updateSupplier(selectedSupplier.id, payload);
      if (error) {
        alert('Erro ao atualizar fornecedor: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchSuppliers();
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.document && s.document.includes(search))
  );

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Cadastro de Fornecedores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerenciamento de fornecedores de insumos (papel, bobinas, tintas) integrados à Conta Azul.
          </p>
        </div>
        
        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          <span>Novo Fornecedor</span>
        </button>
      </header>

      {/* SEARCH BAR */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="form-label">Buscar Fornecedor</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Digite o nome ou CNPJ do fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchSuppliers} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* SUPPLIERS LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Razão Social / Nome</th>
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
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum fornecedor cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td style={{ fontWeight: 600 }}>{supplier.name}</td>
                    <td><code>{supplier.document || '---'}</code></td>
                    <td>{supplier.email || '---'}</td>
                    <td>{supplier.phone || '---'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {supplier.address || '---'}
                    </td>
                    <td>
                      {supplier.conta_azul_id ? (
                        <span className="badge badge-success" title={`ID: ${supplier.conta_azul_id}`}>
                          <CheckCircle2 size={12} />
                          Integrado ({supplier.conta_azul_id.substring(0, 8)})
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
                        onClick={() => handleOpenEdit(supplier)} 
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
                {modalType === 'create' ? 'Cadastrar Novo Fornecedor' : 'Editar Fornecedor'}
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
                <label className="form-label">Razão Social / Nome Fantasia *</label>
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
                  placeholder="Ex: suprimentos@fornecedor.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: (11) 3003-9999"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Industrial / Escritório</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Rua, Número, Cidade/UF..."
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
                  {modalType === 'create' ? 'Salvar Fornecedor' : 'Salvar Alterações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
