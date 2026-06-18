'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getOrders, 
  getCustomers, 
  getProducts, 
  createOrder, 
  updateOrder 
} from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle,
  Truck,
  Eye
} from 'lucide-react';

export default function PedidosPage() {
  const { user } = useAuth();
  
  // Data lists
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form Fields State
  const [formCustomer, setFormCustomer] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formMeasure, setFormMeasure] = useState('');
  const [formPrintRun, setFormPrintRun] = useState(1000);
  const [formBoxes, setFormBoxes] = useState(1);
  const [formFreight, setFormFreight] = useState(0);
  const [formSeller, setFormSeller] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formInternalNotes, setFormInternalNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'A produzir' | 'Em produção' | 'Manuseio' | 'Em revisão' | 'Expedição' | 'Entregue' | 'Faturado' | 'Pago' | 'Atrasado'>('A produzir');
  const [formSector, setFormSector] = useState<'Impressão' | 'Corte e Vinco' | 'Colagem' | 'Manuseio' | 'Expedição' | 'Concluído' | 'Estoque'>('Impressão');

  // Kelly's new fields
  const [formPvNumber, setFormPvNumber] = useState('');
  const [formOpNumber, setFormOpNumber] = useState('');
  const [formArtName, setFormArtName] = useState('');
  const [formPackagingType, setFormPackagingType] = useState<'CAIXA' | 'PACOTE'>('CAIXA');
  const [formShippingType, setFormShippingType] = useState<'RETIRADA' | 'ENTREGA_PROPRIA' | 'TRANSPORTADORA'>('RETIRADA');
  const [formFirstPaymentDate, setFormFirstPaymentDate] = useState('');
  const [formInstallmentsTotal, setFormInstallmentsTotal] = useState(1);
  const [formInstallmentsPaid, setFormInstallmentsPaid] = useState(0);
  const [formOverShortQuantity, setFormOverShortQuantity] = useState(0);
  const [formPhysicalLocation, setFormPhysicalLocation] = useState('Salão');
  const [formProductionStartDate, setFormProductionStartDate] = useState('');

  const [formSelectedProductStock, setFormSelectedProductStock] = useState<number | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts()
      ]);
      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (e) {
      console.error('Error fetching orders page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update selected product stock on change in form
  useEffect(() => {
    if (formProduct) {
      const prod = products.find(p => p.id === formProduct);
      setFormSelectedProductStock(prod ? prod.stock_quantity : 0);
    } else {
      setFormSelectedProductStock(null);
    }
  }, [formProduct, products]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedOrder(null);
    setFormCustomer('');
    setFormProduct('');
    setFormMeasure('');
    setFormPrintRun(1000);
    setFormBoxes(1);
    setFormFreight(0);
    setFormSeller(user?.role === 'Comercial' ? user.full_name.split(' ')[0] : '');
    setFormNotes('');
    setFormInternalNotes('');
    setFormStatus('A produzir');
    setFormSector('Impressão');

    setFormPvNumber('');
    setFormOpNumber('');
    setFormArtName('');
    setFormPackagingType('CAIXA');
    setFormShippingType('RETIRADA');
    setFormFirstPaymentDate('');
    setFormInstallmentsTotal(1);
    setFormInstallmentsPaid(0);
    setFormOverShortQuantity(0);
    setFormPhysicalLocation('Salão');
    setFormProductionStartDate('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (order: any) => {
    setModalType('edit');
    setSelectedOrder(order);
    setFormCustomer(order.customer_id);
    setFormProduct(order.product_id);
    setFormMeasure(order.measure);
    setFormPrintRun(order.print_run);
    setFormBoxes(order.boxes_count);
    setFormFreight(Number(order.freight_value));
    setFormSeller(order.seller_name);
    setFormNotes(order.notes || '');
    setFormInternalNotes(order.internal_notes || '');
    setFormStatus(order.status);
    setFormSector(order.production_sector);

    setFormPvNumber(order.pv_number || '');
    setFormOpNumber(order.op_number || '');
    setFormArtName(order.art_name || '');
    setFormPackagingType(order.packaging_type || 'CAIXA');
    setFormShippingType(order.shipping_type || 'RETIRADA');
    setFormFirstPaymentDate(order.first_payment_date || '');
    setFormInstallmentsTotal(order.installments_total || 1);
    setFormInstallmentsPaid(order.installments_paid || 0);
    setFormOverShortQuantity(order.over_short_quantity || 0);
    setFormPhysicalLocation(order.physical_location || 'Salão');
    setFormProductionStartDate(order.production_start_date || '');
    setIsModalOpen(true);
  };

  // Submit Order Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === 'create') {
      const orderPayload = {
        customer_id: formCustomer,
        product_id: formProduct,
        measure: formMeasure,
        print_run: Number(formPrintRun),
        boxes_count: Number(formBoxes),
        freight_value: Number(formFreight),
        seller_name: formSeller || 'Vendas Samppel',
        notes: formNotes,
        internal_notes: formInternalNotes,
        status: formStatus,
        production_sector: formSector,
        order_date: new Date().toISOString(),

        pv_number: formPvNumber || `PV-${Date.now().toString().substring(8)}`,
        op_number: formOpNumber || null,
        art_name: formArtName || 'Arte Genérica',
        packaging_type: formPackagingType,
        shipping_type: formShippingType,
        first_payment_date: formFirstPaymentDate || null,
        installments_total: Number(formInstallmentsTotal),
        installments_paid: Number(formInstallmentsPaid),
        over_short_quantity: Number(formOverShortQuantity),
        physical_location: formPhysicalLocation,
        production_start_date: formProductionStartDate || null
      };

      const { error } = await createOrder(orderPayload);
      if (error) {
        alert('Erro ao criar pedido: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchAllData();
      }
    } else {
      // Editing
      // Setup payload based on user role to strictly enforce backend expectations
      let updatePayload: any = {};
      
      if (user?.role === 'Produção') {
        // Production role can only edit status, sector, physical_location, over_short_quantity & internal notes
        updatePayload = {
          status: formStatus,
          production_sector: formSector,
          physical_location: formPhysicalLocation,
          over_short_quantity: Number(formOverShortQuantity),
          internal_notes: formInternalNotes
        };
      } else if (user?.role === 'Financeiro') {
        // Finance role can change status, payment information, installments, and internal notes
        updatePayload = {
          status: formStatus,
          first_payment_date: formFirstPaymentDate || null,
          installments_total: Number(formInstallmentsTotal),
          installments_paid: Number(formInstallmentsPaid),
          production_start_date: formProductionStartDate || null,
          internal_notes: formInternalNotes
        };
      } else {
        // Admin & Comercial can change everything
        updatePayload = {
          customer_id: formCustomer,
          product_id: formProduct,
          measure: formMeasure,
          print_run: Number(formPrintRun),
          boxes_count: Number(formBoxes),
          freight_value: Number(formFreight),
          seller_name: formSeller,
          notes: formNotes,
          internal_notes: formInternalNotes,
          status: formStatus,
          production_sector: formSector,

          pv_number: formPvNumber,
          op_number: formOpNumber || null,
          art_name: formArtName,
          packaging_type: formPackagingType,
          shipping_type: formShippingType,
          first_payment_date: formFirstPaymentDate || null,
          installments_total: Number(formInstallmentsTotal),
          installments_paid: Number(formInstallmentsPaid),
          over_short_quantity: Number(formOverShortQuantity),
          physical_location: formPhysicalLocation,
          production_start_date: formProductionStartDate || null
        };
      }

      const { error } = await updateOrder(selectedOrder.id, updatePayload);
      if (error) {
        alert('Erro ao atualizar pedido: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchAllData();
      }
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchCustomer = filterCustomer ? order.customer_id === filterCustomer : true;
    const matchSeller = filterSeller ? order.seller_name.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchStatus = filterStatus ? order.status === filterStatus : true;
    const matchSector = filterSector ? order.production_sector === filterSector : true;
    const matchDate = filterDate ? new Date(order.order_date).toLocaleDateString('pt-BR') === new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR') : true;
    return matchCustomer && matchSeller && matchStatus && matchSector && matchDate;
  });

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial';
  const isReadOnlyForForm = (field: string) => {
    if (modalType === 'create') return false;
    if (user?.role === 'Administrador' || user?.role === 'Comercial') return false;
    
    // Produção can edit: status, sector, physicalLocation, overShortQuantity, internalNotes
    if (user?.role === 'Produção') {
      return !['status', 'sector', 'physicalLocation', 'overShortQuantity', 'internalNotes'].includes(field);
    }
    
    // Financeiro can edit: status, firstPaymentDate, installmentsPaid, installmentsTotal, productionStartDate, internalNotes
    if (user?.role === 'Financeiro') {
      return !['status', 'firstPaymentDate', 'installmentsPaid', 'installmentsTotal', 'productionStartDate', 'internalNotes'].includes(field);
    }
    
    return true;
  };

  const statusColors: Record<string, string> = {
    'A produzir': 'var(--info)',
    'Em produção': 'var(--warning)',
    'Manuseio': 'var(--primary)',
    'Em revisão': 'var(--warning)',
    'Expedição': 'var(--primary)',
    'Entregue': 'var(--success)',
    'Faturado': 'var(--secondary)',
    'Pago': 'var(--success)',
    'Atrasado': 'var(--danger)'
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pedidos & Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerencie pedidos personalizados, acompanhe a produção física e status de faturamento.
          </p>
        </div>
        
        {canCreate && (
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Novo Pedido</span>
          </button>
        )}
      </header>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Filtrar por Cliente</label>
          <select 
            className="form-select" 
            value={filterCustomer} 
            onChange={(e) => setFilterCustomer(e.target.value)}
          >
            <option value="">Todos os Clientes</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Filtrar por Vendedora</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Nome da vendedora"
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Filtrar por Status</label>
          <select 
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="A produzir">A produzir</option>
            <option value="Em revisão">Em revisão</option>
            <option value="Expedição">Expedição</option>
            <option value="Entregue">Entregue</option>
            <option value="Faturado">Faturado</option>
            <option value="Pago">Pago</option>
            <option value="Atrasado">Atrasado</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Setor de Produção</label>
          <select 
            className="form-select"
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
          >
            <option value="">Todos os Setores</option>
            <option value="Impressão">Impressão</option>
            <option value="Corte e Vinco">Corte e Vinco</option>
            <option value="Colagem">Colagem</option>
            <option value="Expedição">Expedição</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Filtrar por Data</label>
          <input 
            type="date" 
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={() => {
            setFilterCustomer('');
            setFilterSeller('');
            setFilterStatus('');
            setFilterSector('');
            setFilterDate('');
          }}
        >
          Limpar Filtros
        </button>
      </div>

      {/* ORDERS LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>PV / OP</th>
                <th>Nome Arte (Cliente)</th>
                <th>Produto / Medida</th>
                <th>Tiragem (Cortesia/Falta)</th>
                <th>Embalagem Final</th>
                <th>Setor / Local</th>
                <th>Liberação Fábrica</th>
                <th>Status</th>
                <th>Entrega / Lançamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={10} />
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isReleased = !!order.first_payment_date;
                  const overShort = order.over_short_quantity || 0;
                  
                  return (
                    <tr key={order.id}>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.pv_number || '---'}</div>
                        {order.op_number ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                            {order.op_number}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem OP (Estoque)</div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                          🎨 {order.art_name || 'Arte Genérica'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {order.customer?.name}
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <div>{order.product?.name}</div>
                        <div>
                          <code style={{ fontSize: '0.7rem', padding: '0.125rem 0.25rem', backgroundColor: 'var(--background)', borderRadius: '3px' }}>
                            {order.measure}
                          </code>
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 500 }}>{order.print_run?.toLocaleString('pt-BR')} un</div>
                        {overShort !== 0 && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            color: overShort > 0 ? 'var(--success)' : 'var(--danger)' 
                          }}>
                            {overShort > 0 ? `+${overShort} (Cortesia)` : `${overShort} (Falta)`}
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 500 }}>
                          {order.boxes_count} {order.packaging_type === 'PACOTE' ? 'pacote(s)' : 'caixa(s)'}
                        </div>
                        {order.packaging_type === 'PACOTE' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(100 un por pct)</div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize', display: 'block', textAlign: 'center', marginBottom: '4px' }}>
                          {order.production_sector}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          📍 {order.physical_location || 'Salão'}
                        </span>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        {isReleased ? (
                          <div>
                            <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.25rem' }}>
                              <CheckCircle2 size={12} />
                              Liberada
                            </span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Início: {new Date(order.production_start_date || order.first_payment_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '0.25rem' }}>
                              <AlertCircle size={12} />
                              Aguard. Pgto
                            </span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '4px' }}>
                              Fábrica travada
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <span className="badge" style={{ 
                          backgroundColor: statusColors[order.status] + '15', 
                          color: statusColors[order.status],
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ verticalAlign: 'top', fontSize: '0.8rem' }}>
                        <div>Prev: {order.first_payment_date ? new Date(new Date(order.order_date).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') : 'Sem data'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                          Venda: {new Date(order.order_date).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <button 
                          onClick={() => handleOpenEdit(order)} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {isReadOnlyForForm('customer') ? (
                            <>
                              <Eye size={12} />
                              <span>Ver</span>
                            </>
                          ) : (
                            <>
                              <Edit3 size={12} />
                              <span>Editar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT MODAL */}
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
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
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
                {modalType === 'create' ? 'Cadastrar Novo Pedido' : (isReadOnlyForForm('customer') ? 'Detalhes do Pedido' : 'Editar Informações do Pedido')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* PV Number */}
                <div className="form-group">
                  <label className="form-label">Número do PV (ERP Conta Azul) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="Ex: PV-1234"
                    value={formPvNumber}
                    disabled={isReadOnlyForForm('pv_number')}
                    onChange={(e) => setFormPvNumber(e.target.value)}
                  />
                </div>

                {/* OP Number */}
                <div className="form-group">
                  <label className="form-label">Número da OP (Fábrica) - Deixe em branco se for Estoque</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: OP-5678"
                    value={formOpNumber}
                    disabled={isReadOnlyForForm('op_number')}
                    onChange={(e) => setFormOpNumber(e.target.value)}
                  />
                </div>

                {/* Nome da Arte */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nome da Arte / Identificação Visual da Embalagem *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="Ex: Sacola Kraft Chocolate Gourmet Brasil - Logo Prata"
                    value={formArtName}
                    disabled={isReadOnlyForForm('art_name')}
                    onChange={(e) => setFormArtName(e.target.value)}
                  />
                </div>

                {/* Customer Select */}
                <div className="form-group">
                  <label className="form-label">Cliente (Razão Social) *</label>
                  <select 
                    className="form-select"
                    required
                    value={formCustomer}
                    disabled={isReadOnlyForForm('customer')}
                    onChange={(e) => setFormCustomer(e.target.value)}
                  >
                    <option value="">Selecione o Cliente</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product Select */}
                <div className="form-group">
                  <label className="form-label">Produto de Embalagem *</label>
                  <select 
                    className="form-select"
                    required
                    value={formProduct}
                    disabled={isReadOnlyForForm('product')}
                    onChange={(e) => setFormProduct(e.target.value)}
                  >
                    <option value="">Selecione o Produto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock_quantity})</option>
                    ))}
                  </select>
                  {formSelectedProductStock !== null && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      color: formSelectedProductStock < formPrintRun ? 'var(--danger)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '2px'
                    }}>
                      {formSelectedProductStock < formPrintRun ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                      Estoque disponível: {formSelectedProductStock.toLocaleString()} un
                    </span>
                  )}
                </div>

                {/* Measure */}
                <div className="form-group">
                  <label className="form-label">Medidas Customizadas *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: 20x15x8 cm"
                    required
                    value={formMeasure}
                    disabled={isReadOnlyForForm('measure')}
                    onChange={(e) => setFormMeasure(e.target.value)}
                  />
                </div>

                {/* Print Run (Tiragem) */}
                <div className="form-group">
                  <label className="form-label">Tiragem Total (Unidades) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    min={1}
                    value={formPrintRun}
                    disabled={isReadOnlyForForm('printRun')}
                    onChange={(e) => setFormPrintRun(Number(e.target.value))}
                  />
                </div>

                {/* Packaging Type */}
                <div className="form-group">
                  <label className="form-label">Tipo de Embalagem Final *</label>
                  <select 
                    className="form-select"
                    required
                    value={formPackagingType}
                    disabled={isReadOnlyForForm('packaging_type')}
                    onChange={(e) => setFormPackagingType(e.target.value as any)}
                  >
                    <option value="CAIXA">Caixas</option>
                    <option value="PACOTE">Pacotes (100 un)</option>
                  </select>
                </div>

                {/* Boxes/Packages count */}
                <div className="form-group">
                  <label className="form-label">Qtd. de Caixas/Pacotes de Embalagem *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    min={1}
                    value={formBoxes}
                    disabled={isReadOnlyForForm('boxes')}
                    onChange={(e) => setFormBoxes(Number(e.target.value))}
                  />
                </div>

                {/* Shipping Type */}
                <div className="form-group">
                  <label className="form-label">Tipo de Frete/Envio *</label>
                  <select 
                    className="form-select"
                    required
                    value={formShippingType}
                    disabled={isReadOnlyForForm('shipping_type')}
                    onChange={(e) => setFormShippingType(e.target.value as any)}
                  >
                    <option value="RETIRADA">Cliente Retira</option>
                    <option value="ENTREGA_PROPRIA">Entrega Própria Samppel</option>
                    <option value="TRANSPORTADORA">Transportadora (Coleta)</option>
                  </select>
                </div>

                {/* Freight Value */}
                <div className="form-group">
                  <label className="form-label">Valor do Frete (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    value={formFreight}
                    disabled={isReadOnlyForForm('freight')}
                    onChange={(e) => setFormFreight(Number(e.target.value))}
                  />
                </div>

                {/* Seller */}
                <div className="form-group">
                  <label className="form-label">Vendedora Responsável *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    value={formSeller}
                    disabled={isReadOnlyForForm('seller')}
                    onChange={(e) => setFormSeller(e.target.value)}
                  />
                </div>

                {/* Physical Location */}
                <div className="form-group">
                  <label className="form-label">📍 Localização Física na Fábrica</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Máquina Flexo 2, Salão, Pátio"
                    value={formPhysicalLocation}
                    disabled={isReadOnlyForForm('physicalLocation')}
                    onChange={(e) => setFormPhysicalLocation(e.target.value)}
                  />
                </div>

                {/* Cortesia ou Falta */}
                <div className="form-group">
                  <label className="form-label">Diferença de Tiragem (Cortesia "+" / Falta "-")</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Ex: +100 ou -50"
                    value={formOverShortQuantity}
                    disabled={isReadOnlyForForm('overShortQuantity')}
                    onChange={(e) => setFormOverShortQuantity(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* FINANCE & RELEASE CONTROLS */}
              <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>Controle Financeiro & Liberação da Fábrica</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Data do Primeiro Pagamento (Libera Produção)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formFirstPaymentDate}
                      disabled={isReadOnlyForForm('firstPaymentDate')}
                      onChange={(e) => setFormFirstPaymentDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data Real de Início da Produção</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formProductionStartDate}
                      disabled={isReadOnlyForForm('productionStartDate')}
                      onChange={(e) => setFormProductionStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total de Parcelas</label>
                    <input 
                      type="number" 
                      min="1"
                      className="form-input" 
                      value={formInstallmentsTotal}
                      disabled={isReadOnlyForForm('installmentsTotal')}
                      onChange={(e) => setFormInstallmentsTotal(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parcelas Pagas</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      value={formInstallmentsPaid}
                      disabled={isReadOnlyForForm('installmentsPaid')}
                      onChange={(e) => setFormInstallmentsPaid(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Status and production sector (dynamic access control) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Status do Pedido</label>
                  <select 
                    className="form-select"
                    value={formStatus}
                    disabled={isReadOnlyForForm('status')}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="A produzir">A produzir</option>
                    <option value="Em produção">Em produção</option>
                    <option value="Manuseio">Manuseio</option>
                    <option value="Em revisão">Em revisão</option>
                    <option value="Expedição">Expedição</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Faturado">Faturado</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Setor de Produção Física</label>
                  <select 
                    className="form-select"
                    value={formSector}
                    disabled={isReadOnlyForForm('sector')}
                    onChange={(e) => setFormSector(e.target.value as any)}
                  >
                    <option value="Impressão">Impressão</option>
                    <option value="Corte e Vinco">Corte e Vinco</option>
                    <option value="Colagem">Colagem</option>
                    <option value="Manuseio">Manuseio / Acabamento</option>
                    <option value="Expedição">Expedição</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Estoque">Estoque (Pronta Entrega)</option>
                  </select>
                </div>
              </div>

              {/* Observation (Public) */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Observações do Pedido (Cliente/Layout)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Instruções de personalização, acabamento ou dados da transportadora..."
                  value={formNotes}
                  disabled={isReadOnlyForForm('notes')}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Internal Observation (Separate area) */}
              <div className="form-group" style={{ marginTop: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}>
                <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>Anotações Internas (Uso Exclusivo Samppel)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Detalhamento operacional interno, histórico de pagamentos, logs da fábrica, etc..."
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                />
              </div>

              <footer style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Fechar
                </button>
                {(!isReadOnlyForForm('customer') || !isReadOnlyForForm('status')) && (
                  <button type="submit" className="btn btn-primary">
                    {modalType === 'create' ? 'Salvar Pedido' : 'Salvar Alterações'}
                  </button>
                )}
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
