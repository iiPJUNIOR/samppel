'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, createProduct, updateProduct, adjustStock } from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, Warehouse, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function ProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);

  // Stock Adjustment Fields
  const [stockQtyChange, setStockQtyChange] = useState(100);
  const [stockAdjType, setStockAdjType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [stockDescription, setStockDescription] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getProducts();
      setProducts(data || []);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowedRoles = ['Administrador', 'Comercial', 'Produção'];
    if (user && allowedRoles.includes(user.role)) {
      fetchProducts();
    }
  }, [user]);

  // Security guard check
  const allowedRoles = ['Administrador', 'Comercial', 'Produção'];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O seu perfil de **{user.role}** não tem permissão para visualizar o estoque ou catálogo de produtos comerciais.
        </p>
      </div>
    );
  }

  // Open modals
  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedProduct(null);
    setFormName('');
    setFormSku('');
    setFormDescription('');
    setFormPrice(0.00);
    setFormStock(0);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setModalType('edit');
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || '');
    setFormDescription(product.description || '');
    setFormPrice(Number(product.price));
    setFormStock(product.stock_quantity);
    setIsFormModalOpen(true);
  };

  const handleOpenStock = (product: any) => {
    setSelectedProduct(product);
    setStockQtyChange(100);
    setStockAdjType('ENTRADA');
    setStockDescription('');
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formName,
      sku: formSku,
      description: formDescription,
      price: Number(formPrice),
      stock_quantity: modalType === 'create' ? Number(formStock) : undefined // stock changes handled by adjustments in edit mode
    };

    if (modalType === 'create') {
      const { error } = await createProduct(payload);
      if (error) alert('Erro ao cadastrar produto: ' + error.message);
      else {
        setIsFormModalOpen(false);
        fetchProducts();
      }
    } else {
      // If user is Produção, they can't edit basic attributes (only Admin/Comercial can)
      if (user?.role === 'Produção') {
        alert('Seu perfil de Produção não possui privilégios para alterar atributos básicos ou preços.');
        return;
      }

      const { error } = await updateProduct(selectedProduct.id, payload);
      if (error) alert('Erro ao atualizar produto: ' + error.message);
      else {
        setIsFormModalOpen(false);
        fetchProducts();
      }
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Output is stored as negative quantity
    const quantity = stockAdjType === 'SAIDA' ? -Math.abs(stockQtyChange) : Math.abs(stockQtyChange);
    const desc = stockDescription || `Ajuste manual de estoque (${stockAdjType})`;

    const { error } = await adjustStock(
      selectedProduct.id,
      quantity,
      stockAdjType as any,
      desc
    );

    if (error) {
      alert('Erro ao ajustar estoque: ' + error);
    } else {
      setIsStockModalOpen(false);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial';
  const canEditDetails = user?.role === 'Administrador' || user?.role === 'Comercial';

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Produtos & Estoque</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerencie o catálogo de especificações de embalagens, preços comerciais e contagem de estoque.
          </p>
        </div>
        
        {canCreate && (
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Novo Produto</span>
          </button>
        )}
      </header>

      {/* FILTERS */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="form-label">Buscar Produto</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Buscar por nome do produto ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchProducts} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>SKU / Código</th>
                <th>Nome do Produto</th>
                <th>Descrição</th>
                <th>Preço Unitário</th>
                <th>Estoque Físico</th>
                <th>Sincronização ERP</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={7} />
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum produto cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td><code style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', backgroundColor: 'var(--background)', borderRadius: '4px' }}>{product.sku || '---'}</code></td>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.description || '---'}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span className="badge" style={{ 
                        backgroundColor: product.stock_quantity < 500 ? 'var(--danger-bg)' : 'rgba(var(--primary-rgb), 0.08)',
                        color: product.stock_quantity < 500 ? 'var(--danger)' : 'var(--primary)',
                        display: 'inline-flex',
                        gap: '0.25rem',
                        alignItems: 'center'
                      }}>
                        <Warehouse size={12} />
                        {product.stock_quantity.toLocaleString('pt-BR')} un
                      </span>
                    </td>
                    <td>
                      {product.conta_azul_id ? (
                        <span className="badge badge-success" title={`ID: ${product.conta_azul_id}`}>
                          <CheckCircle2 size={12} />
                          Integrado ({product.conta_azul_id.substring(0, 8)})
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <HelpCircle size={12} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleOpenStock(product)} 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                      >
                        <Warehouse size={12} />
                        <span>Ajustar Estoque</span>
                      </button>

                      {canEditDetails && (
                        <button 
                          onClick={() => handleOpenEdit(product)} 
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                        >
                          <Edit size={12} />
                          <span>Editar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (CREATE / EDIT DETAILS) */}
      {isFormModalOpen && (
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
                {modalType === 'create' ? 'Cadastrar Novo Produto' : 'Editar Atributos de Produto'}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleProductSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Nome do Produto de Embalagem *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Código do Produto *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: CX-DUP-M"
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição Técnica das Medidas e Papel</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Ex: Papel duplex 250g, alça cordão de nylon, reforço no fundo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preço Unitário Comercial (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-input" 
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                />
              </div>

              {modalType === 'create' && (
                <div className="form-group">
                  <label className="form-label">Estoque Inicial (Unidades) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                  />
                </div>
              )}

              <footer style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              } as any}>
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Salvar Produto' : 'Salvar Alterações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {isStockModalOpen && (
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
            maxWidth: '450px',
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
                Ajustar Estoque: {selectedProduct?.name}
              </h3>
              <button 
                onClick={() => setIsStockModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleStockSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Estoque Atual:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedProduct?.stock_quantity.toLocaleString('pt-BR')} un</span>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Movimentação *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'ENTRADA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    onClick={() => setStockAdjType('ENTRADA')}
                  >
                    <ArrowUpRight size={14} />
                    Entrada
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'SAIDA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    onClick={() => setStockAdjType('SAIDA')}
                  >
                    <ArrowDownRight size={14} />
                    Saída
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'AJUSTE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setStockAdjType('AJUSTE')}
                  >
                    Ajuste
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade de Unidades *</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-input" 
                  required
                  value={stockQtyChange}
                  onChange={(e) => setStockQtyChange(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motivo / Descrição *</label>
                <textarea 
                  className="form-textarea" 
                  required
                  placeholder="Ex: Recebimento de bobina de fornecedor Klabin, ou Retirada de caixas para produção, etc..."
                  value={stockDescription}
                  onChange={(e) => setStockDescription(e.target.value)}
                />
              </div>

              <footer style={{
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Movimentação
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
