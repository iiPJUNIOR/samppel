'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct, adjustStock, getStockTransactions, getCustomerProductStock, getCustomers } from '@/services/supabase';
import OperatorAuthModal from '@/components/OperatorAuthModal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, Warehouse, ArrowUpRight, ArrowDownRight, RefreshCw, History, Package, Clock, Trash2 } from 'lucide-react';

function StockInlineEdit({ product, onSave }: { product: any, onSave: (id: string, newStock: number) => Promise<void> }) {
  const [val, setVal] = useState(product.stock_quantity?.toString() || '0');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVal(product.stock_quantity?.toString() || '0');
  }, [product.stock_quantity]);

  const handleBlur = async () => {
    setIsEditing(false);
    const numVal = parseInt(val, 10);
    if (isNaN(numVal) || numVal === product.stock_quantity) {
      setVal(product.stock_quantity?.toString() || '0');
      return;
    }
    setLoading(true);
    await onSave(product.id, numVal);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Warehouse size={12} style={{ color: product.stock_quantity < 500 ? 'var(--danger)' : 'var(--primary)' }} />
      {isEditing ? (
        <input
          type="number"
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); }}
          style={{ width: '80px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--primary)', borderRadius: '3px' }}
          disabled={loading}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          style={{
            cursor: 'pointer',
            padding: '2px 4px',
            borderBottom: '1px dashed var(--primary)',
            color: product.stock_quantity < 500 ? 'var(--danger)' : 'var(--text)',
            opacity: loading ? 0.5 : 1
          }}
          title="Clique para editar"
        >
          {loading ? 'Salvando...' : Number(val).toLocaleString('pt-BR')} un
        </span>
      )}
    </div>
  );
}

export default function ProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'lisas' | 'custom_stocks' | 'all'>('lisas');
  const [customStocks, setCustomStocks] = useState<any[]>([]);

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
  const [formBindRequiresHandling, setFormBindRequiresHandling] = useState(false);
  const [formCategory, setFormCategory] = useState<'LISAS' | 'PERSONALIZADA'>('LISAS');
  const [formMeasure, setFormMeasure] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

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
      const [productsRes, customStocksRes, customersRes] = await Promise.all([
        getProducts(user?.tenant_id),
        getCustomerProductStock(undefined, undefined, user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'),
        getCustomers(user?.tenant_id)
      ]);
      setProducts(productsRes.data || []);
      setCustomStocks(customStocksRes.data || []);
      setCustomers(customersRes.data || []);
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
    setFormStock(0);
    setFormBindToFirstItem(false);
    setFormBindRequiresHandling(false);
    setFormCategory('LISAS');
    setFormMeasure('');
    setFormCustomer('');
    setIsFormModalOpen(true);
  };

  const handleDeleteProduct = async (product: any) => {
    if (confirm(`Tem certeza que deseja apagar o produto "${product.name}"?\nIsso não será possível se ele já estiver sendo usado em pedidos ou em estoques vinculados.`)) {
      const res = await deleteProduct(product.id);
      if (res.error) {
        alert('Erro ao apagar produto. É provável que ele já esteja vinculado a um pedido ou estoque (Ação bloqueada pelo banco de dados por segurança).');
      } else {
        await fetchProducts();
      }
    }
  };

  const handleOpenEdit = (product: any) => {
    setModalType('edit');
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || '');
    setFormDescription(product.description || '');
    setFormStock(product.stock_quantity);
    setFormBindToFirstItem(!!product.bind_to_first_item);
    setFormBindRequiresHandling(!!product.bind_requires_handling);
    setFormCategory(product.category || 'LISAS');
    setFormMeasure(product.measure || '');
    setFormCustomer(product.customer_id || '');
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

    let payload: any = {
      name: formName,
      sku: formSku,
      description: formDescription,
      price: Number(formPrice),
      bind_to_first_item: formBindToFirstItem,
      bind_requires_handling: formBindToFirstItem ? formBindRequiresHandling : false,
      category: formCategory,
      measure: formMeasure || null,
      customer_id: formCategory === 'PERSONALIZADA' ? (formCustomer || null) : null,
      stock_quantity: modalType === 'create' ? Number(formStock) : undefined
    };

    if (modalType === 'create') {
      let res = await createProduct(payload);
      if (res.error && res.error.message?.includes('category')) {
        delete payload.category;
        res = await createProduct(payload);
      }
      if (res.error) alert('Erro ao cadastrar produto: ' + res.error.message);
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

      let res = await updateProduct(selectedProduct.id, payload);
      if (res.error && res.error.message?.includes('category')) {
        delete payload.category;
        res = await updateProduct(selectedProduct.id, payload);
      }
      if (res.error) alert('Erro ao atualizar produto: ' + res.error.message);
      else {
        setIsFormModalOpen(false);
        fetchProducts();
      }
    }
  };

  const handleInlineStockSave = async (productId: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const diff = newStock - product.stock_quantity;
    if (diff === 0) return;
    
    const { error } = await adjustStock(
      productId,
      Math.abs(diff),
      diff > 0 ? 'ENTRADA' : 'SAIDA',
      'Ajuste Rápido Inline',
      user?.tenant_id
    );

    if (error) {
      alert('Erro ao atualizar estoque: ' + error);
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newStock } : p));
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'lisas' && p.category === 'LISAS');
    return matchesSearch && matchesTab;
  });

  const allCustomerStocks = [
    ...customStocks,
    ...products.filter(p => p.category === 'PERSONALIZADA').map(p => ({
      id: `prod-${p.id}`,
      customer: customers.find(c => c.id === p.customer_id) || { name: 'Cliente Não Vinculado' },
      product: p,
      quantity: p.stock_quantity || 0,
      created_at: p.created_at,
      updated_at: p.updated_at
    }))
  ];

  const filteredCustomStocks = allCustomerStocks.filter(s => 
    s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial';
  const canEditDetails = user?.role === 'Administrador' || user?.role === 'Comercial';
  const isAdmin = user?.role === 'Administrador';
  const isVendedor = user?.role === 'Vendedor';
  const numCols = 6 + (isAdmin ? 1 : 0) - (isVendedor ? 1 : 0);

  const lisasCount = products.filter(p => p.category === 'LISAS').length;
  const customStocksCount = allCustomerStocks.length;

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Produtos &amp; Estoque</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Catálogo de produtos integrado ao Conta Azul com controle soberano de estoque e saldo físico no Portal.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canCreate && (
            <button
              onClick={handleSyncProducts}
              disabled={isSyncingProducts}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem' }}
              title="Sincronizar novos produtos e atualizações cadastrais do Conta Azul (preserva saldos de estoque locais)"
            >
              <RefreshCw size={14} className={isSyncingProducts ? 'spinner' : ''} />
              <span>{isSyncingProducts ? 'Sincronizando...' : 'Atualizar Catálogo (Conta Azul)'}</span>
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

      {/* TABS DE ALTERNÂNCIA */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('lisas')}
          className={`btn ${activeTab === 'lisas' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Package size={16} />
          <span>Lisas / Genéricas ({lisasCount})</span>
        </button>

        <button 
          onClick={() => setActiveTab('custom_stocks')}
          className={`btn ${activeTab === 'custom_stocks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Package size={16} />
          <span>Estoque de Clientes ({customStocksCount})</span>
        </button>

        <button 
          onClick={() => setActiveTab('all')}
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Warehouse size={16} />
          <span>Todos ({products.length})</span>
        </button>
      </div>

      {activeTab !== 'custom_stocks' ? (
        <>
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
                <th>SKU / Código / Lote</th>
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
                      <StockInlineEdit product={product} onSave={handleInlineStockSave} />
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

                        {canEditDetails && (
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            title="Apagar produto"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                              padding: '0.375rem 0.75rem', background: 'transparent',
                              border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem', fontWeight: 500, color: '#ef4444',
                              cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Trash2 size={12} />
                            <span>Apagar</span>
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
      </>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente Proprietário</th>
                  <th>Produto Personalizado</th>
                  <th>Tamanho / Medida</th>
                  <th>Quantidade em Estoque na Fábrica</th>
                  <th>Última Movimentação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                ) : filteredCustomStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum lote de personalizado armazenado na fábrica.
                    </td>
                  </tr>
                ) : (
                  filteredCustomStocks.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.customer?.name || 'Cliente'}</td>
                      <td style={{ fontWeight: 500 }}>{s.product?.name || 'Produto'}</td>
                      <td><code>{s.product?.measure || 'Padrão'}</code></td>
                      <td style={{ fontWeight: 700, color: 'hsl(142.1, 76.2%, 36.3%)' }}>
                        {s.quantity?.toLocaleString('pt-BR')} un
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(s.updated_at || s.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <label className="form-label">Categoria do Produto *</label>
                <select 
                  className="form-input" 
                  value={formCategory} 
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  required
                >
                  <option value="LISAS">Lisas</option>
                  <option value="PERSONALIZADA">Personalizada</option>
                </select>
              </div>

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
                <label className="form-label">SKU / Código / Lote *</label>
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
                <label className="form-label">Medidas (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: 32x24x11,5 cm"
                  value={formMeasure}
                  onChange={(e) => setFormMeasure(e.target.value)}
                />
              </div>

              {formCategory === 'PERSONALIZADA' && (
                <div className="form-group">
                  <label className="form-label">Cliente Vinculado (Opcional)</label>
                  <select 
                    className="form-select"
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                  >
                    <option value="">— Nenhum —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="formBindToFirstItem"
                    checked={formBindToFirstItem}
                    onChange={(e) => {
                      setFormBindToFirstItem(e.target.checked);
                      if (!e.target.checked) setFormBindRequiresHandling(false);
                    }}
                    style={{ width: 'auto', height: 'auto', margin: 0, cursor: 'pointer' }}
                  />
                  <label htmlFor="formBindToFirstItem" style={{ margin: 0, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)' }}>
                    Vincular ao primeiro item do pedido (não produzir)
                  </label>
                </div>

                {formBindToFirstItem && (
                  <div style={{ marginLeft: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input 
                      type="checkbox" 
                      id="formBindRequiresHandling"
                      checked={formBindRequiresHandling}
                      onChange={(e) => setFormBindRequiresHandling(e.target.checked)}
                      style={{ width: 'auto', height: 'auto', margin: 0, cursor: 'pointer' }}
                    />
                    <label htmlFor="formBindRequiresHandling" style={{ margin: 0, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Este item vinculado exige Manuseio? (Se sim, entra na quantidade de manuseio)
                    </label>
                  </div>
                )}
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
