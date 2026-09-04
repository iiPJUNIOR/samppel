'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, getProductsPaginated, getProductCategoryCounts, createProduct, updateProduct, deleteProduct, adjustStock, getStockTransactions, getCustomerProductStock, getCustomers } from '@/services/supabase';
import OperatorAuthModal from '@/components/OperatorAuthModal';
import SearchableCustomerSelect from '@/components/SearchableCustomerSelect';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, Warehouse, ArrowUpRight, ArrowDownRight, RefreshCw, History, Package, Clock, Trash2, Users, ShoppingCart, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function StockInlineEdit({ product, onSave, canEdit = true }: { product: any, onSave: (id: string, newStock: number) => Promise<void>, canEdit?: boolean }) {
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

  if (!canEdit) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Warehouse size={12} style={{ color: product.stock_quantity < 500 ? 'var(--danger)' : 'var(--primary)' }} />
        <span style={{ color: product.stock_quantity < 500 ? 'var(--danger)' : 'var(--text)' }}>
          {Number(val).toLocaleString('pt-BR')} un
        </span>
      </div>
    );
  }

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

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  name: 420,
  category: 140,
  customer: 240,
  stock: 140,
  actions: 360,
};

export default function ProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({
    all: 0,
    lisas: 0,
    custom_stocks: 0,
    compra: 0,
    sem_categoria: 0
  });
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'lisas' | 'custom_stocks' | 'compra' | 'sem_categoria' | 'all'>('lisas');
  const [customStocks, setCustomStocks] = useState<any[]>([]);

  // Column Resizing State
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('produtos_column_widths');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            if (!parsed.actions || parsed.actions < 350) {
              parsed.actions = 360;
            }
            return { ...DEFAULT_COLUMN_WIDTHS, ...parsed };
          }
        } catch (e) {}
      }
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const resizingStateRef = React.useRef<{
    col: string;
    startX: number;
    startWidth: number;
    currentWidth: number;
  } | null>(null);

  const rafRef = React.useRef<number | null>(null);

  const handleMouseDownResize = (col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startWidth = colWidths[col] || DEFAULT_COLUMN_WIDTHS[col] || 150;
    resizingStateRef.current = {
      col,
      startX: e.clientX,
      startWidth,
      currentWidth: startWidth,
    };

    if (typeof document !== 'undefined') {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingStateRef.current) return;
      const { col: activeCol, startX: initialX, startWidth: initialWidth } = resizingStateRef.current;
      const diff = moveEvent.clientX - initialX;
      const minW = activeCol === 'name' ? 180 : (activeCol === 'actions' ? 320 : 70);
      const newWidth = Math.max(minW, initialWidth + diff);
      resizingStateRef.current.currentWidth = newWidth;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setColWidths(prev => {
          if (prev[activeCol] === newWidth) return prev;
          return { ...prev, [activeCol]: newWidth };
        });
      });
    };

    const onMouseUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (resizingStateRef.current) {
        const { col: activeCol, currentWidth: finalWidth } = resizingStateRef.current;
        resizingStateRef.current = null;
        setColWidths(latest => {
          const updated = { ...latest, [activeCol]: finalWidth };
          try {
            localStorage.setItem('produtos_column_widths', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResetColWidths = () => {
    setColWidths(DEFAULT_COLUMN_WIDTHS);
    try {
      localStorage.removeItem('produtos_column_widths');
    } catch (e) {}
  };

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Customer Link Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalProduct, setCustomerModalProduct] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [savingCustomerLink, setSavingCustomerLink] = useState(false);

  const handleOpenCustomerModal = (itemOrProduct: any) => {
    const prod = itemOrProduct.product || itemOrProduct;
    const currentCustId = itemOrProduct.customer?.id || prod.customer_id || '';
    setCustomerModalProduct(prod);
    setSelectedCustomerId(currentCustId);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomerLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerModalProduct) return;
    setSavingCustomerLink(true);
    try {
      const res = await updateProduct(customerModalProduct.id, {
        ...customerModalProduct,
        customer_id: selectedCustomerId || null
      });
      if (res.error) {
        alert('Erro ao atualizar cliente vinculado: ' + res.error.message);
      } else {
        setIsCustomerModalOpen(false);
        await fetchProducts();
      }
    } catch (err: any) {
      console.error('Erro ao vincular cliente:', err);
      alert('Erro ao salvar cliente: ' + err.message);
    } finally {
      setSavingCustomerLink(false);
    }
  };

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
  const [formCategory, setFormCategory] = useState<'LISAS' | 'PERSONALIZADA' | 'COMPRA' | ''>('');
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

  // Search debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [paginatedRes, countsRes, customStocksRes, customersRes] = await Promise.all([
        getProductsPaginated({
          page,
          pageSize,
          search: debouncedSearch,
          tab: activeTab,
          tenantId: user?.tenant_id
        }),
        getProductCategoryCounts(user?.tenant_id),
        getCustomerProductStock(undefined, undefined, user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'),
        getCustomers(user?.tenant_id)
      ]);

      setProducts(paginatedRes.data || []);
      setTotalCount(paginatedRes.totalCount || 0);
      setTotalPages(paginatedRes.totalPages || 1);
      if (countsRes) setCategoryCounts(countsRes);
      setCustomStocks(customStocksRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowedRoles = ['Administrador', 'Comercial', 'Vendedor', 'Produção'];
    if (user && allowedRoles.includes(user.role)) {
      fetchProducts();
    }
  }, [user, page, pageSize, activeTab, debouncedSearch]);

  // Security guard check
  const allowedRoles = ['Administrador', 'Comercial', 'Vendedor', 'Produção'];
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
    setFormCategory('');
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
    if (user?.role === 'Vendedor' || user?.role === 'Comercial') {
      if (product.category === 'LISAS') {
        alert('Produtos da categoria Lisas / Genéricas são somente leitura para vendedores.');
        return;
      }
      handleOpenCustomerModal(product);
      return;
    }
    setModalType('edit');
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || '');
    setFormDescription(product.description || '');
    setFormStock(product.stock_quantity);
    setFormBindToFirstItem(!!product.bind_to_first_item);
    setFormBindRequiresHandling(!!product.bind_requires_handling);
    setFormCategory(product.category || '');
    setFormMeasure(product.measure || '');
    setFormCustomer(product.customer_id || '');
    setIsFormModalOpen(true);
  };

  const handleOpenStock = (product: any) => {
    setSelectedProduct(product);
    setStockAdjType('AJUSTE');
    setStockQtyChange(product.stock_quantity || 0);
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
      category: formCategory || null,
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

    const currentStock = Number(selectedProduct.stock_quantity || 0);
    let quantity = 0;
    let desc = '';

    if (stockAdjType === 'AJUSTE') {
      const newTotal = Number(stockQtyChange);
      quantity = newTotal - currentStock;
      if (quantity === 0) {
        setIsStockModalOpen(false);
        return;
      }
      desc = stockDescription || `Ajuste de saldo de ${currentStock} un para ${newTotal} un`;
    } else if (stockAdjType === 'SAIDA') {
      quantity = -Math.abs(Number(stockQtyChange));
      desc = stockDescription || `Saída manual de estoque (${Math.abs(quantity)} un)`;
    } else {
      quantity = Math.abs(Number(stockQtyChange));
      desc = stockDescription || `Entrada manual de estoque (${quantity} un)`;
    }

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

  const isAdmin = user?.role === 'Administrador';
  const isVendedor = user?.role === 'Vendedor' || user?.role === 'Comercial';
  const canCreate = isAdmin;
  const canEditDetails = isAdmin;
  const numCols = activeTab === 'all' ? 5 : 4;

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
          onClick={() => { setActiveTab('lisas'); setPage(1); }}
          className={`btn ${activeTab === 'lisas' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Package size={16} />
          <span>Lisas / Genéricas ({categoryCounts.lisas})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('custom_stocks'); setPage(1); }}
          className={`btn ${activeTab === 'custom_stocks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Package size={16} />
          <span>Estoque de Clientes ({categoryCounts.custom_stocks})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('compra'); setPage(1); }}
          className={`btn ${activeTab === 'compra' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <ShoppingCart size={16} />
          <span>Compra ({categoryCounts.compra})</span>
        </button>

        {categoryCounts.sem_categoria > 0 && (
          <button 
            onClick={() => { setActiveTab('sem_categoria'); setPage(1); }}
            className={`btn ${activeTab === 'sem_categoria' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <HelpCircle size={16} />
            <span>Sem Categoria ({categoryCounts.sem_categoria})</span>
          </button>
        )}

        <button 
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Warehouse size={16} />
          <span>Todos ({categoryCounts.all})</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="filter-bar" style={{ alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Buscar por nome, SKU, descrição ou cliente vinculado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button 
          onClick={handleResetColWidths} 
          className="btn btn-secondary" 
          style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
          title="Restaurar larguras padrão das colunas"
        >
          Restaurar Colunas
        </button>
      </div>

      {/* PRODUCTS TABLE UNIFICADA COM COLUNAS AJUSTÁVEIS */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive" style={{ borderRadius: 0, border: 'none', boxShadow: 'none', overflowX: 'auto' }}>
          <table 
            className="table" 
            style={{ 
              width: '100%', 
              minWidth: `${(colWidths.name || 420) + (activeTab === 'all' ? (colWidths.category || 140) : 0) + (colWidths.customer || 240) + (colWidths.stock || 140) + (colWidths.actions || 360)}px`,
              borderCollapse: 'collapse',
              tableLayout: 'fixed'
            }}
          >
            <colgroup>
              <col style={{ width: `${colWidths.name || 420}px` }} />
              {activeTab === 'all' && <col style={{ width: `${colWidths.category || 140}px` }} />}
              <col style={{ width: `${colWidths.customer || 240}px` }} />
              <col style={{ width: `${colWidths.stock || 140}px` }} />
              <col style={{ width: `${colWidths.actions || 360}px` }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ position: 'relative', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  <span>Nome do Produto</span>
                  <div
                    onMouseDown={(e) => handleMouseDownResize('name', e)}
                    title="Arraste para ajustar largura da coluna"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10 }}
                  />
                </th>
                {activeTab === 'all' && (
                  <th style={{ position: 'relative', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    <span>Categoria</span>
                    <div
                      onMouseDown={(e) => handleMouseDownResize('category', e)}
                      title="Arraste para ajustar largura da coluna"
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10 }}
                    />
                  </th>
                )}
                <th style={{ position: 'relative', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  <span>Cliente Vinculado</span>
                  <div
                    onMouseDown={(e) => handleMouseDownResize('customer', e)}
                    title="Arraste para ajustar largura da coluna"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10 }}
                  />
                </th>
                <th style={{ position: 'relative', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  <span>Estoque Físico</span>
                  <div
                    onMouseDown={(e) => handleMouseDownResize('stock', e)}
                    title="Arraste para ajustar largura da coluna"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10 }}
                  />
                </th>
                <th style={{ position: 'relative', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  <span>Ações</span>
                  <div
                    onMouseDown={(e) => handleMouseDownResize('actions', e)}
                    title="Arraste para ajustar largura da coluna"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10 }}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={numCols} />
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={numCols} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum produto encontrado nesta visualização.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const linkedCust = customers.find(c => c.id === product.customer_id);
                  return (
                    <tr key={product.id}>
                      <td style={{ verticalAlign: 'middle', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailProduct(product);
                            setIsDetailModalOpen(true);
                          }}
                          title="Clique para ver detalhes do produto"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            fontWeight: 600,
                            color: 'var(--text)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'inline-block',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          {product.name}
                        </button>
                      </td>
                      {activeTab === 'all' && (
                        <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {product.category === 'LISAS' ? (
                            <span className="badge badge-secondary">Lisas</span>
                          ) : product.category === 'PERSONALIZADA' ? (
                            <span className="badge badge-primary">Personalizada</span>
                          ) : product.category === 'COMPRA' ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                              Compra
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              Sem Categoria
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ verticalAlign: 'middle', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={linkedCust ? linkedCust.name : 'Não vinculado'}>
                        {product.category === 'PERSONALIZADA' ? (
                          linkedCust ? (
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{linkedCust.name}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Não vinculado</span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        <StockInlineEdit product={product} onSave={handleInlineStockSave} canEdit={isAdmin} />
                      </td>
                      <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleOpenStock(product)}
                                title="Ajustar estoque"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.3rem 0.55rem', background: 'transparent',
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
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.3rem 0.55rem', background: 'transparent',
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

                              <button
                                onClick={() => handleOpenEdit(product)}
                                title="Editar produto"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.3rem 0.55rem', background: 'transparent',
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

                              <button
                                onClick={() => handleDeleteProduct(product)}
                                title="Apagar produto"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.3rem 0.55rem', background: 'transparent',
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
                            </>
                          ) : (
                            product.category === 'PERSONALIZADA' ? (
                              <>
                                <button
                                  onClick={() => handleOpenCustomerModal(product)}
                                  title="Alterar cliente vinculado a este produto"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    padding: '0.3rem 0.55rem', background: 'transparent',
                                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
                                    cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover, rgba(0,0,0,0.04))'; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <Users size={12} />
                                  <span>{linkedCust ? 'Alterar Cliente' : 'Vincular Cliente'}</span>
                                </button>
                                <button
                                  onClick={() => handleOpenHistory(product)}
                                  title="Histórico de movimentações"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    padding: '0.3rem 0.55rem', background: 'transparent',
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
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenHistory(product)}
                                  title="Histórico de movimentações"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    padding: '0.3rem 0.55rem', background: 'transparent',
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
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Somente Leitura
                                </span>
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.875rem 1.25rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span>
              Exibindo <strong>{totalCount === 0 ? 0 : (page - 1) * pageSize + 1}</strong> a <strong>{Math.min(page * pageSize, totalCount)}</strong> de <strong>{totalCount}</strong> produtos
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Itens por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
              title="Primeira Página"
            >
              <ChevronsLeft size={14} />
            </button>

            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
              title="Página Anterior"
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ fontSize: '0.8125rem', padding: '0 0.5rem', color: 'var(--text)', fontWeight: 600 }}>
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
              title="Próxima Página"
            >
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
              title="Última Página"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT DETAIL MODAL */}
      {isDetailModalOpen && detailProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border)'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Detalhes do Produto</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Visão geral completa dos atributos cadastrais e técnicos</span>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)', padding: '0.2rem' }}
              >
                &times;
              </button>
            </header>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Nome do Produto
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.25rem' }}>
                  {detailProduct.name}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '0.85rem', margin: 0, backgroundColor: 'var(--background)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>SKU / Código / Lote</span>
                  <code style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {detailProduct.sku || 'Não informado'}
                  </code>
                </div>

                <div className="card" style={{ padding: '0.85rem', margin: 0, backgroundColor: 'var(--background)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Categoria</span>
                  <div>
                    {detailProduct.category === 'LISAS' ? (
                      <span className="badge badge-secondary">Lisas</span>
                    ) : detailProduct.category === 'PERSONALIZADA' ? (
                      <span className="badge badge-primary">Personalizada</span>
                    ) : detailProduct.category === 'COMPRA' ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        Compra
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        Sem Categoria
                      </span>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: '0.85rem', margin: 0, backgroundColor: 'var(--background)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Preço Unitário</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detailProduct.price || 0)}
                  </span>
                </div>

                <div className="card" style={{ padding: '0.85rem', margin: 0, backgroundColor: 'var(--background)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Estoque Físico Atual</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: detailProduct.stock_quantity < 500 ? 'var(--danger)' : 'var(--primary)' }}>
                    {Number(detailProduct.stock_quantity || 0).toLocaleString('pt-BR')} un
                  </span>
                </div>

                <div className="card" style={{ padding: '0.85rem', margin: 0, backgroundColor: 'var(--background)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Medidas</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                    {detailProduct.measure || 'Não informada'}
                  </span>
                </div>

                <div className="card" style={{ padding: '0.85rem', margin: 0, backgroundColor: 'var(--background)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Integração ERP (Conta Azul)</span>
                  <div>
                    {detailProduct.conta_azul_id ? (
                      <span className="badge badge-success" title={`ID: ${detailProduct.conta_azul_id}`}>
                        <CheckCircle2 size={12} />
                        Integrado ({detailProduct.conta_azul_id.substring(0, 8)})
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <HelpCircle size={12} />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {detailProduct.category === 'PERSONALIZADA' && (
                <div>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Cliente Vinculado
                  </label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem' }}>
                    {(() => {
                      const linked = customers.find(c => c.id === detailProduct.customer_id);
                      return linked ? `${linked.name} (${linked.document || 'Sem documento'})` : 'Nenhum cliente vinculado a este produto personalizado';
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Descrição Técnica e Observações
                </label>
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  marginTop: '0.35rem',
                  fontSize: '0.875rem',
                  color: detailProduct.description ? 'var(--text)' : 'var(--text-muted)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {detailProduct.description || 'Nenhuma descrição técnica cadastrada.'}
                </div>
              </div>
            </div>

            <footer style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const prodToEdit = detailProduct;
                  setIsDetailModalOpen(false);
                  handleOpenEdit(prodToEdit);
                }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
              >
                <Edit size={14} />
                <span>Editar Produto</span>
              </button>
            </footer>
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
                <label className="form-label">Categoria do Produto</label>
                <select 
                  className="form-input" 
                  value={formCategory} 
                  onChange={(e) => setFormCategory(e.target.value as any)}
                >
                  <option value="">Sem Categoria</option>
                  <option value="LISAS">Lisas</option>
                  <option value="PERSONALIZADA">Personalizada</option>
                  <option value="COMPRA">Compra</option>
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
                  <SearchableCustomerSelect
                    customers={customers}
                    value={formCustomer}
                    onChange={setFormCustomer}
                    placeholder="Buscar cliente por nome ou CNPJ/CPF..."
                  />
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
            maxWidth: '480px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                  Ajustar Estoque
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {selectedProduct?.name}
                </span>
              </div>
              <button 
                onClick={() => setIsStockModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleStockSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* TIPO DE MOVIMENTAÇÃO */}
              <div className="form-group">
                <label className="form-label">Tipo de Operação *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'AJUSTE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      setStockAdjType('AJUSTE');
                      setStockQtyChange(selectedProduct?.stock_quantity || 0);
                    }}
                  >
                    Definir Saldo
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'ENTRADA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      setStockAdjType('ENTRADA');
                      setStockQtyChange(0);
                    }}
                  >
                    <ArrowUpRight size={14} />
                    Entrada (+)
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'SAIDA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      setStockAdjType('SAIDA');
                      setStockQtyChange(0);
                    }}
                  >
                    <ArrowDownRight size={14} />
                    Saída (-)
                  </button>
                </div>
              </div>

              {/* CARD DE PREVIEW DE ESTOQUE */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estoque Atual:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
                    {Number(selectedProduct?.stock_quantity || 0).toLocaleString('pt-BR')} un
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    {stockAdjType === 'AJUSTE' ? 'Novo Saldo Final:' : 'Saldo Previsto:'}
                  </span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: (() => {
                      const cur = Number(selectedProduct?.stock_quantity || 0);
                      const next = stockAdjType === 'AJUSTE'
                        ? Number(stockQtyChange || 0)
                        : (stockAdjType === 'ENTRADA' ? cur + Math.abs(Number(stockQtyChange || 0)) : cur - Math.abs(Number(stockQtyChange || 0)));
                      return next < 500 ? 'var(--danger)' : 'var(--primary)';
                    })()
                  }}>
                    {(() => {
                      const cur = Number(selectedProduct?.stock_quantity || 0);
                      const next = stockAdjType === 'AJUSTE'
                        ? Number(stockQtyChange || 0)
                        : (stockAdjType === 'ENTRADA' ? cur + Math.abs(Number(stockQtyChange || 0)) : cur - Math.abs(Number(stockQtyChange || 0)));
                      return `${Number(next).toLocaleString('pt-BR')} un`;
                    })()}
                  </span>
                </div>
              </div>

              {/* QUANTIDADE INPUT */}
              <div className="form-group">
                <label className="form-label">
                  {stockAdjType === 'AJUSTE' 
                    ? 'Novo Saldo Total em Estoque (Unidades) *' 
                    : stockAdjType === 'ENTRADA' 
                      ? 'Quantidade a Adicionar (Unidades) *' 
                      : 'Quantidade a Retirar (Unidades) *'}
                </label>
                <input 
                  type="number" 
                  min={stockAdjType === 'AJUSTE' ? 0 : 1}
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
                  placeholder={
                    stockAdjType === 'AJUSTE'
                      ? 'Ex: Contagem física de balanço, ajuste de inventário mensal...'
                      : stockAdjType === 'ENTRADA'
                        ? 'Ex: Recebimento de compra de fornecedor, devolução de lote...'
                        : 'Ex: Baixa por refugo, retirada para amostras...'
                  }
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
                  {stockAdjType === 'AJUSTE' ? 'Confirmar Novo Saldo' : 'Confirmar Movimentação'}
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
      {/* MODAL DE VINCULAÇÃO / ALTERAÇÃO DE CLIENTE (VENDEDORES E ADMIN) */}
      {isCustomerModalOpen && customerModalProduct && (
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
          zIndex: 10000,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '520px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} style={{ color: 'var(--primary)' }} />
                  Vincular Cliente ao Produto
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Defina qual cliente é o proprietário deste produto em estoque.
                </p>
              </div>
              <button 
                onClick={() => setIsCustomerModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSaveCustomerLink} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.875rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Produto Selecionado
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  {customerModalProduct.name}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>SKU: <strong style={{ color: 'var(--text)' }}>{customerModalProduct.sku || '---'}</strong></span>
                  {customerModalProduct.measure && (
                    <span>Medida: <strong style={{ color: 'var(--text)' }}>{customerModalProduct.measure}</strong></span>
                  )}
                  <span>Estoque: <strong style={{ color: 'var(--primary)' }}>{customerModalProduct.stock_quantity?.toLocaleString('pt-BR')} un</strong></span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Selecione o Cliente Proprietário *
                </label>
                <SearchableCustomerSelect
                  customers={customers}
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  placeholder="Buscar cliente por nome ou CNPJ/CPF..."
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Ao salvar, este produto personalizado ficará associado a este cliente na fábrica e nas consultas de saldo.
                </span>
              </div>

              <footer style={{
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button 
                  type="button" 
                  onClick={() => setIsCustomerModalOpen(false)} 
                  className="btn btn-secondary"
                  disabled={savingCustomerLink}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingCustomerLink}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {savingCustomerLink && <RefreshCw size={14} className="spinner" />}
                  <span>{savingCustomerLink ? 'Salvando Vínculo...' : 'Salvar Vínculo'}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
