'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, createProduct, updateProduct, adjustStock, getStockTransactions } from '@/services/supabase';
import OperatorAuthModal from '@/components/OperatorAuthModal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, Warehouse, ArrowUpRight, ArrowDownRight, RefreshCw, History } from 'lucide-react';

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

  // Stock History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleOpenHistory = async (product: any) => {
    setSelectedProduct(product);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await getStockTransactions(product.id, user?.tenant_id);
      setStockHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formBindToFirstItem, setFormBindToFirstItem] = useState(false);

  // Stock Adjustment Fields
  const [stockQtyChange, setStockQtyChange] = useState(100);
  const [stockAdjType, setStockAdjType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [stockDescription, setStockDescription] = useState('');

  // Operator secondary authentication
  const [isOpAuthOpen, setIsOpAuthOpen] = useState(false);
  const [pendingStockAdj, setPendingStockAdj] = useState<{ quantity: number; type: any; desc: string } | null>(null);

  // Sync Products & Stock state
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSyncProducts = async () => {
    setIsSyncingProducts(true);
    setSyncStep('Iniciando comunicação com Conta Azul...');
    setSyncProgress(5);

    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const response = await fetch(`/api/sync/import-products?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: user?.role })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert('Erro ao sincronizar produtos: ' + (errorData.error || response.statusText));
        setIsSyncingProducts(false);
        return;
      }

      const reader = response.body?.getReader();
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
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.step) setSyncStep(data.step);
              if (typeof data.progress === 'number') setSyncProgress(data.progress);
              if (data.success) {
                const msg = `Sincronização concluída com sucesso!\n\n• Novas criações: ${data.imported || 0}\n• Atualizações e Estoque: ${data.updated || 0}`;
                alert(msg);
                await fetchProducts();
              } else if (data.error) {
                alert('Erro na sincronização: ' + data.error);
              }
            } catch (e) {
              console.error('Erro ao ler progresso da API:', e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao conectar com API de produtos:', err);
      alert('Falha na conexão para sincronizar produtos.');
    } finally {
      setIsSyncingProducts(false);
    }
  };

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
    setFormBindToFirstItem(false);
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
    setFormBindToFirstItem(!!product.bind_to_first_item);
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
      bind_to_first_item: formBindToFirstItem,
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

    if (user?.role === 'Administrador') {
      const { error } = await adjustStock(
        selectedProduct.id,
        quantity,
        stockAdjType as any,
        `${desc} (Autorizado por Administrador: ${user.full_name})`,
        user.tenant_id
      );

      if (error) {
        alert('Erro ao ajustar estoque: ' + error);
      } else {
        setIsStockModalOpen(false);
        fetchProducts();
      }
    } else {
      setPendingStockAdj({ quantity, type: stockAdjType, desc });
      setIsOpAuthOpen(true);
    }
  };

  const handleOpAuthSuccess = async (operatorId: string, operatorName: string) => {
    setIsOpAuthOpen(false);
    if (!selectedProduct || !pendingStockAdj) return;

    const { error } = await adjustStock(
      selectedProduct.id,
      pendingStockAdj.quantity,
      pendingStockAdj.type,
      `${pendingStockAdj.desc} (Autorizado por Operador: ${operatorName})`,
      user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
      operatorId
    );

    setPendingStockAdj(null);

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
  const isAdmin = user?.role === 'Administrador';
  const isVendedor = user?.role === 'Vendedor';
  const numCols = 6 + (isAdmin ? 1 : 0) - (isVendedor ? 1 : 0);

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Produtos &amp; Estoque</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Lista geral de produtos cadastrados e nível de estoque atual.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canCreate && (
            <button
              onClick={handleSyncProducts}
              disabled={isSyncingProducts}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem' }}
              title="Sincronizar produtos novos, atualizações e saldos de estoque do Conta Azul"
            >
              <RefreshCw size={14} className={isSyncingProducts ? 'spinner' : ''} />
              <span>{isSyncingProducts ? 'Sincronizando...' : 'Atualizar Estoque/Produtos'}</span>
            </button>
          )}

          {canCreate && (
            <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem' }}>
              <Plus size={14} />
              <span>Novo Produto</span>
            </button>
          )}
        </div>
      </header>

      {/* FILTERS */}
      <div className="filter-bar" style={{ alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>SKU / Código</th>
                <th>Nome do Produto</th>
                <th>Descrição</th>
                {isAdmin && <th>Preço Unitário</th>}
                <th>Estoque Físico</th>
                <th>Sincronização ERP</th>
                {!isVendedor && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={numCols} />
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={numCols} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
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
                    {isAdmin && (
                      <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </td>
                    )}
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
                    {!isVendedor && (
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenStock(product)}
                          title="Ajustar estoque"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.375rem 0.75rem', background: 'transparent',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Warehouse size={12} />
                          <span>Estoque</span>
                        </button>

                        <button
                          onClick={() => handleOpenHistory(product)}
                          title="Histórico de movimentações"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.375rem 0.75rem', background: 'transparent',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <History size={12} />
                          <span>Histórico</span>
                        </button>

                        {canEditDetails && (
                          <button
                            onClick={() => handleOpenEdit(product)}
                            title="Editar produto"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                              padding: '0.375rem 0.75rem', background: 'transparent',
                              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)',
                              cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          >
                            <Edit size={12} />
                            <span>Editar</span>
                          </button>
                        )}
                      </td>
                    )}
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

              {isAdmin && (
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
              )}

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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="formBindToFirstItem"
                  checked={formBindToFirstItem}
                  onChange={(e) => setFormBindToFirstItem(e.target.checked)}
                  style={{ width: 'auto', height: 'auto', margin: 0, cursor: 'pointer' }}
                />
                <label htmlFor="formBindToFirstItem" style={{ margin: 0, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)' }}>
                  Vincular ao primeiro item do pedido (não produzir)
                </label>
              </div>

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

      <OperatorAuthModal 
        isOpen={isOpAuthOpen}
        tenantId={user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'}
        onSuccess={handleOpAuthSuccess}
        onClose={() => setIsOpAuthOpen(false)}
        actionDescription={`Ajuste de Estoque (${stockAdjType}) - ${selectedProduct?.name}`}
      />

      {/* Modal de Progresso da Sincronização */}
      {isSyncingProducts && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            padding: '1.75rem', maxWidth: '460px', width: '90%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <RefreshCw size={28} className="spinner" style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Sincronizando Produtos & Estoque</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {syncStep || 'Buscando produtos e saldos no Conta Azul...'}
            </p>
            <div style={{ width: '100%', backgroundColor: 'var(--background)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${syncProgress}%`,
                backgroundColor: 'var(--primary)',
                height: '100%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DE ESTOQUE */}
      {isHistoryModalOpen && selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} />
                  Extrato de Movimentações
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Produto: {selectedProduct.name}
                </p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✖
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Carregando extrato...</div>
              ) : stockHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma movimentação registrada para este produto.</div>
              ) : (
                <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Qtd</th>
                      <th>Motivo / Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((tx) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleString('pt-BR')}</td>
                        <td>
                          <span className={`badge ${tx.type === 'ENTRADA' ? 'badge-success' : tx.type === 'SAIDA' ? 'badge-danger' : tx.type === 'PEDIDO' ? 'badge-warning' : 'badge-primary'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold', color: tx.quantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{tx.description || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
