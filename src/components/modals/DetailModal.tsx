// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, RefreshCw
} from 'lucide-react';
import { searchCustomers } from '@/services/supabase';

export function DetailModal(props: any) {
  const {
    formItems,
    setFormItems,
    CheckCircle2,
    canUserDeleteOrder,
    customers,
    factoryLocations,
    formArtName,
    formCustomer,
    formEmbalagem,
    formFirstPaymentDate,
    formFormaPag,
    formFreight,
    formFreteInfo,
    formHandlingAllocations,
    formInitialDestination,
    formInstallmentsPaid,
    formInstallmentsTotal,
    formInternalNotes,
    formMachineId,
    formMeasure,
    formMeioPag,
    formNotes,
    formOpNumber,
    formOverShortQuantity,
    formPhysicalLocation,
    formPrazo,
    formPrintRun,
    formProductionStartDate,
    formPvNumber,
    formSector,
    formSelectedProductStock,
    formSeller,
    formShippingType,
    formStageId,
    getItemRealMeasure,
    handleOpenLocationCrudModal,
    handleRequestDeleteManualOrder,
    handleSubmit,
    handlingTeams,
    hideMonetaryValues,
    isAdmin,
    isManualOrder,
    isModalOpen,
    isReadOnlyForForm,
    modalType,
    productionMachines,
    productionSectors,
    products,
    selectedItem,
    selectedOrder,
    setFormArtName,
    setFormCustomer,
    setFormEmbalagem,
    setFormFirstPaymentDate,
    setFormFormaPag,
    setFormFreight,
    setFormFreteInfo,
    setFormHandlingAllocations,
    setFormHandlingTeamId,
    setFormInitialDestination,
    setFormInstallmentsPaid,
    setFormInstallmentsTotal,
    setFormInternalNotes,
    setFormMachineId,
    setFormMeasure,
    setFormMeioPag,
    setFormNotes,
    setFormOpNumber,
    setFormOverShortQuantity,
    setFormPhysicalLocation,
    setFormPrazo,
    setFormPrintRun,
    setFormProduct,
    setFormProductionStartDate,
    setFormPvNumber,
    setFormSector,
    setFormSelectedProductStock,
    setFormSeller,
    setFormShippingType,
    setFormStageId,
    setFormStatus,
    setIsMachineCrudModalOpen,
    setIsModalOpen,
    setIsSectorCrudModalOpen,
    stages,
    user
  } = props;

  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isSyncingContaAzulCustomer, setIsSyncingContaAzulCustomer] = useState(false);
  const [customerSyncFeedback, setCustomerSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Busca debounce de clientes direto no banco
  useEffect(() => {
    if (!formCustomer || formCustomer.trim().length === 0) {
      setCustomerSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
        const res = await searchCustomers(formCustomer.trim(), tenantId, 20);
        setCustomerSuggestions(res.data || []);
      } catch (err) {
        console.error('Erro na busca de clientes:', err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formCustomer, user?.tenant_id]);

  const updateFormItem = (index: number, field: string, value: any) => {
    if (!setFormItems) return;
    setFormItems((prev: any[]) => {
      if (!prev) return prev;
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const addFormItem = () => {
    if (!setFormItems) return;
    setFormItems((prev: any[]) => prev ? [...prev, { id: Date.now(), artName: '', productId: '', selectedStock: null, measure: '', printRun: '', machineId: '', sector: '' }] : []);
  };

  const removeFormItem = (index: number) => {
    if (!setFormItems) return;
    setFormItems((prev: any[]) => prev ? prev.filter((_, i) => i !== index) : []);
  };

  // Fechar menu suspenso de clientes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSyncContaAzulFromModal = async () => {
    const term = (formCustomer || '').trim();
    if (!term) {
      alert('Digite o nome ou CNPJ/CPF do cliente para buscar no Conta Azul.');
      return;
    }

    setIsSyncingContaAzulCustomer(true);
    setCustomerSyncFeedback({ type: 'info', text: 'Buscando cliente na Conta Azul...' });

    try {
      const cleanDoc = term.replace(/\D/g, '');
      const params = new URLSearchParams();
      if (cleanDoc && (cleanDoc.length === 11 || cleanDoc.length === 14)) {
        params.append('document', cleanDoc);
      } else {
        params.append('name', term);
      }
      params.append('sync', 'true');

      const res = await fetch(`/api/sync/search-customer?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.found) {
        setCustomerSyncFeedback({
          type: 'error',
          text: data.message || data.error || 'Cliente não encontrado no Conta Azul. Você pode continuar com este nome para cadastro manual.'
        });
        return;
      }

      const c = data.customer;
      setFormCustomer(c.name || term);
      setIsCustomerDropdownOpen(false);
      setCustomerSyncFeedback({
        type: 'success',
        text: `Cliente "${c.name}" sincronizado do Conta Azul com sucesso!`
      });

      setTimeout(() => setCustomerSyncFeedback(null), 5000);
    } catch (err: any) {
      console.error(err);
      setCustomerSyncFeedback({
        type: 'error',
        text: 'Erro ao conectar com Conta Azul: ' + (err.message || 'Falha na requisição')
      });
    } finally {
      setIsSyncingContaAzulCustomer(false);
    }
  };

  return (
    <>
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
            overflow: 'hidden',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--surface)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Image
                  src="/logo.png"
                  alt="Samppel Logo"
                  width={210}
                  height={55}
                  style={{ objectFit: 'contain', height: '52px', width: 'auto', maxHeight: '52px', flexShrink: 0 }}
                  priority
                />
                <div style={{ height: '36px', width: '1px', backgroundColor: 'var(--border)', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    {modalType === 'create-op'
                      ? 'Cadastrar Ordem de Produção (OP)'
                      : modalType === 'create'
                        ? 'Cadastrar Novo Pedido'
                        : (isReadOnlyForForm('customer') ? 'Detalhes do Pedido' : 'Editar Informações do Pedido')}
                  </h3>
                  {modalType === 'edit' && selectedOrder && (
                    !isManualOrder(selectedOrder) ? (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--primary)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid rgba(59, 130, 246, 0.25)'
                      }}>
                        Conta Azul
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(148, 163, 184, 0.15)',
                        color: 'var(--text-muted)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)'
                      }}>
                        Pedido Manual
                      </span>
                    )
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1 }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                {/* Seleção do Destino Inicial */}
                {(modalType === 'create' || modalType === 'create-op') && (
                  <div className="form-group" style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                      Destino Inicial do Pedido
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${formInitialDestination === 'PRODUCAO' ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: formInitialDestination === 'PRODUCAO' ? 'var(--surface)' : 'transparent',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                      }}>
                        <input
                          type="radio"
                          name="initialDestination"
                          value="PRODUCAO"
                          checked={formInitialDestination === 'PRODUCAO'}
                          onChange={() => setFormInitialDestination('PRODUCAO')}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span>Entra em Produção (A Produzir)</span>
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${formInitialDestination === 'ESTOQUE' ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: formInitialDestination === 'ESTOQUE' ? 'var(--surface)' : 'transparent',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                      }}>
                        <input
                          type="radio"
                          name="initialDestination"
                          value="ESTOQUE"
                          checked={formInitialDestination === 'ESTOQUE'}
                          onChange={() => setFormInitialDestination('ESTOQUE')}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span>Entra em Estoque (Pronta Entrega)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Número da OP / PV (Obrigatório) */}
                <div className="form-group">
                  <label className="form-label">OP (Número da OP / PV) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ex: OP-1234 ou PV-1234"
                    value={formPvNumber}
                    disabled={isReadOnlyForForm('pv_number')}
                    onChange={(e) => setFormPvNumber(e.target.value)}
                  />
                </div>

                {/* Número da OP (Fábrica) */}
                <div className="form-group">
                  <label className="form-label">Número da OP (Fábrica) - Vazio se for Estoque</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: OP-5678"
                    value={formOpNumber}
                    disabled={isReadOnlyForForm('op_number')}
                    onChange={(e) => setFormOpNumber(e.target.value)}
                  />
                </div>

                {/* Seleção do Cliente (Obrigatório - Autocomplete Dinâmico) */}
                <div className="form-group" style={{ position: 'relative' }} ref={customerDropdownRef}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Cliente (Razão Social) (Opcional)</label>
                    {formCustomer && formCustomer.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleSyncContaAzulFromModal}
                        disabled={isSyncingContaAzulCustomer || isReadOnlyForForm('customer')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          cursor: isSyncingContaAzulCustomer ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                          fontWeight: 500
                        }}
                        title="Buscar este cliente no Conta Azul e vincular"
                      >
                        <RefreshCw size={12} className={isSyncingContaAzulCustomer ? 'spin' : ''} />
                        {isSyncingContaAzulCustomer ? 'Buscando...' : 'Buscar no Conta Azul'}
                      </button>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Doce Vida Doceria (Digite o nome ou documento)"
                      value={formCustomer}
                      disabled={isReadOnlyForForm('customer')}
                      onFocus={() => {
                        if (customerSuggestions.length > 0 || (formCustomer && formCustomer.trim().length > 0)) {
                          setIsCustomerDropdownOpen(true);
                        }
                      }}
                      onChange={(e) => {
                        setFormCustomer(e.target.value);
                        setIsCustomerDropdownOpen(true);
                      }}
                      autoComplete="off"
                    />
                    {isSearchingCustomer && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }}>
                        Buscando...
                      </span>
                    )}
                  </div>

                  {/* Feedback da sincronização pontual */}
                  {customerSyncFeedback && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '0.75rem',
                      color: customerSyncFeedback.type === 'error' ? '#ef4444' : customerSyncFeedback.type === 'success' ? '#10b981' : 'var(--primary)'
                    }}>
                      {customerSyncFeedback.text}
                    </div>
                  )}

                  {/* Dropdown de sugestões dinâmicas */}
                  {isCustomerDropdownOpen && formCustomer && formCustomer.trim().length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1050,
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {customerSuggestions.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormCustomer(c.name);
                            setIsCustomerDropdownOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                            {c.document && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Doc: {c.document}
                              </div>
                            )}
                          </div>
                          {c.company_name && c.company_name !== c.name && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {c.company_name}
                            </span>
                          )}
                        </div>
                      ))}

                      {customerSuggestions.length === 0 && !isSearchingCustomer && (
                        <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Nenhum cliente local encontrado para "{formCustomer}".
                        </div>
                      )}

                      {/* Ação direta para buscar no Conta Azul */}
                      <div
                        onClick={() => handleSyncContaAzulFromModal()}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          color: 'var(--primary)',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.16)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'}
                      >
                        <RefreshCw size={13} className={isSyncingContaAzulCustomer ? 'spin' : ''} />
                        <span>Buscar e importar "{formCustomer}" direto do Conta Azul</span>
                      </div>
                    </div>
                  )}
                </div>

                
                {(modalType === 'create' || modalType === 'create-op') && formItems ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    {formItems.map((item: any, index: number) => (
                      <div key={item.id || index} style={{ padding: '1.25rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border)' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>Item {index + 1}</h4>
                          {index > 0 && (
                            <button type="button" onClick={() => removeFormItem(index)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                              Remover Item
                            </button>
                          )}
                        </div>
                        
{/* Produto / Arte da Embalagem (Obrigatório - Digite ou selecione do catálogo) */}
                <div className="form-group">
                  <label className="form-label">Produto / Arte da Embalagem *</label>
                  <input
                    type="text"
                    list="products-list"
                    className="form-input"
                    required
                    placeholder="Ex: SACOLA PARDA 32X24X11,5 (Digite ou selecione do catálogo)"
                    value={item.artName}
                    disabled={isReadOnlyForForm('art_name')}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateFormItem(index, 'artName', val);
                      const valLower = val.trim().toLowerCase();
                      const getDisplayVal = (p: any) => p.sku ? `[${p.sku}] ${p.name}` : p.name;
                      const matched = products.find(p =>
                        p.name.toLowerCase() === valLower ||
                        getDisplayVal(p).toLowerCase() === valLower ||
                        (p.sku && p.sku.toLowerCase() === valLower)
                      );
                      if (matched) {
                        updateFormItem(index, 'productId', matched.id);
                        updateFormItem(index, 'selectedStock', matched.stock_quantity);
                        if (!item.measure) {
                          updateFormItem(index, 'measure', getItemRealMeasure(matched));
                        }
                      } else {
                        updateFormItem(index, 'productId', '');
                        updateFormItem(index, 'selectedStock', null);
                      }
                    }}
                  />
                  <datalist id="products-list">
                    {products.map(p => {
                      const displayVal = p.sku ? `[${p.sku}] ${p.name}` : p.name;
                      return (
                        <option key={p.id} value={displayVal}>
                          {displayVal} (Estoque: {Number(p.stock_quantity || 0).toLocaleString('pt-BR')} un)
                        </option>
                      );
                    })}
                  </datalist>
                  {item.selectedStock !== null && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: item.selectedStock < item.printRun ? 'var(--danger)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '2px'
                    }}>
                      {item.selectedStock < item.printRun ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                      Estoque disponível: {Number(item.selectedStock).toLocaleString('pt-BR')} un
                    </span>
                  )}
                </div>

                {/* Seleção de Máquina de Produção (Opcional) */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Máquina de Produção (Opcional)</label>
                    {user?.role === 'Administrador' && (
                      <button
                        type="button"
                        onClick={() => setIsMachineCrudModalOpen(true)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '20px', height: '20px', borderRadius: '4px',
                          border: '1px solid var(--primary)', backgroundColor: 'rgba(37,99,235,0.08)',
                          color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem',
                          fontWeight: 700, padding: 0, transition: 'all 0.15s ease'
                        }}
                        title="Gerenciar Máquinas de Produção"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      >
                        +
                      </button>
                    )}
                  </div>
                  <select
                    className="form-select"
                    value={item.machineId}
                    disabled={isReadOnlyForForm('machine_id')}
                    onChange={(e) => {
                      const mId = e.target.value;
                      updateFormItem(index, 'machineId', mId);
                      const mach = productionMachines.find(m => m.id === mId);
                      if (mach?.sector) {
                        updateFormItem(index, 'sector', mach.sector as any);
                      }
                    }}
                  >
                    <option value="">— Nenhuma máquina vinculada —</option>
                    {productionMachines.filter(m => m.status === 'ATIVO').map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.sector ? `(${m.sector})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Medidas */}
                <div className="form-group">
                  <label className="form-label">Medidas Customizadas</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 20x15x8 cm"
                    value={item.measure}
                    disabled={isReadOnlyForForm('measure')}
                    onChange={(e) => updateFormItem(index, 'measure', e.target.value)}
                  />
                </div>

                {/* Tiragem (Opcional) */}
                <div className="form-group">
                  <label className="form-label">Tiragem Total (Unidades)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-input"
                    placeholder="Ex: 1000"
                    value={item.printRun !== undefined && item.printRun !== null ? item.printRun : ''}
                    disabled={isReadOnlyForForm('printRun')}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '');
                      updateFormItem(index, 'printRun', cleanVal ? Number(cleanVal) : '');
                    }}
                  />
                </div>

                
                      </div>
                    ))}
                    <button type="button" onClick={addFormItem} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', backgroundColor: 'transparent', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                      + Adicionar Outro Item / Produto Vinculado
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Produto / Arte da Embalagem (Obrigatório - Digite ou selecione do catálogo) */}
                <div className="form-group">
                  <label className="form-label">Produto / Arte da Embalagem *</label>
                  <input
                    type="text"
                    list="products-list"
                    className="form-input"
                    required
                    placeholder="Ex: SACOLA PARDA 32X24X11,5 (Digite ou selecione do catálogo)"
                    value={formArtName}
                    disabled={isReadOnlyForForm('art_name')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormArtName(val);
                      const valLower = val.trim().toLowerCase();
                      const getDisplayVal = (p: any) => p.sku ? `[${p.sku}] ${p.name}` : p.name;
                      const matched = products.find(p =>
                        p.name.toLowerCase() === valLower ||
                        getDisplayVal(p).toLowerCase() === valLower ||
                        (p.sku && p.sku.toLowerCase() === valLower)
                      );
                      if (matched) {
                        setFormProduct(matched.id);
                        setFormSelectedProductStock(matched.stock_quantity);
                        if (!formMeasure) {
                          setFormMeasure(getItemRealMeasure(matched));
                        }
                      } else {
                        setFormProduct('');
                        setFormSelectedProductStock(null);
                      }
                    }}
                  />
                  <datalist id="products-list">
                    {products.map(p => {
                      const displayVal = p.sku ? `[${p.sku}] ${p.name}` : p.name;
                      return (
                        <option key={p.id} value={displayVal}>
                          {displayVal} (Estoque: {Number(p.stock_quantity || 0).toLocaleString('pt-BR')} un)
                        </option>
                      );
                    })}
                  </datalist>
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
                      Estoque disponível: {Number(formSelectedProductStock).toLocaleString('pt-BR')} un
                    </span>
                  )}
                </div>

                {/* Seleção de Máquina de Produção (Opcional) */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Máquina de Produção (Opcional)</label>
                    {user?.role === 'Administrador' && (
                      <button
                        type="button"
                        onClick={() => setIsMachineCrudModalOpen(true)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '20px', height: '20px', borderRadius: '4px',
                          border: '1px solid var(--primary)', backgroundColor: 'rgba(37,99,235,0.08)',
                          color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem',
                          fontWeight: 700, padding: 0, transition: 'all 0.15s ease'
                        }}
                        title="Gerenciar Máquinas de Produção"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      >
                        +
                      </button>
                    )}
                  </div>
                  <select
                    className="form-select"
                    value={formMachineId}
                    disabled={isReadOnlyForForm('machine_id')}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setFormMachineId(mId);
                      const mach = productionMachines.find(m => m.id === mId);
                      if (mach?.sector && setFormSector) {
                        setFormSector(mach.sector as any);
                      }
                    }}
                  >
                    <option value="">— Nenhuma máquina vinculada —</option>
                    {productionMachines.filter(m => m.status === 'ATIVO').map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.sector ? `(${m.sector})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Medidas */}
                <div className="form-group">
                  <label className="form-label">Medidas Customizadas</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 20x15x8 cm"
                    value={formMeasure}
                    disabled={isReadOnlyForForm('measure')}
                    onChange={(e) => setFormMeasure(e.target.value)}
                  />
                </div>

                {/* Tiragem (Opcional) */}
                <div className="form-group">
                  <label className="form-label">Tiragem Total (Unidades)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-input"
                    placeholder="Ex: 1000"
                    value={formPrintRun !== undefined && formPrintRun !== null ? formPrintRun : ''}
                    disabled={isReadOnlyForForm('printRun')}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '');
                      setFormPrintRun(cleanVal ? Number(cleanVal) : '');
                    }}
                  />
                </div>

                
                  </>
                )}
                
                {/* Tipo de Envio e Valor do Frete (Ocultos no cadastro de Novo Pedido, pois são fabricações para estoque) */}
                {(modalType !== 'create' && modalType !== 'create-op') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Tipo de Frete/Envio</label>
                      <select
                        className="form-select"
                        value={formShippingType}
                        disabled={isReadOnlyForForm('shipping_type')}
                        onChange={(e) => setFormShippingType(e.target.value as any)}
                      >
                        <option value="SEM_FRETE">Não precisa de frete</option>
                        <option value="RETIRADA">Cliente Retira</option>
                        <option value="ENTREGA_PROPRIA">Entrega Própria Samppel</option>
                        <option value="TRANSPORTADORA">Transportadora (Coleta)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Vendedora (Opcional) */}
                <div className="form-group">
                  <label className="form-label">Vendedora Responsável</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Vendas Samppel"
                    value={formSeller}
                    disabled={isReadOnlyForForm('seller')}
                    onChange={(e) => setFormSeller(e.target.value)}
                  />
                </div>

                {/* Localização Física com Dropdown + Botão '+' para CRUD */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Localização Física na Fábrica</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 400 }}>Selecione ou crie um local</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-input"
                      value={formPhysicalLocation}
                      disabled={isReadOnlyForForm('physicalLocation')}
                      onChange={(e) => setFormPhysicalLocation(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {/* Garantir que o valor atual apareça caso seja um texto personalizado legado */}
                      {formPhysicalLocation && !factoryLocations.some(l => l.name === formPhysicalLocation) && (
                        <option value={formPhysicalLocation}>{formPhysicalLocation} (Personalizado)</option>
                      )}

                      {factoryLocations
                        .filter(l => l.status === 'ATIVO' || l.name === formPhysicalLocation)
                        .map(loc => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))
                      }

                      {factoryLocations.length === 0 && (
                        <>
                          <option value="Salão">Salão</option>
                          <option value="Pátio">Pátio</option>
                          <option value="Máquina Flexo 1">Máquina Flexo 1</option>
                          <option value="Máquina Coladeira 2">Máquina Coladeira 2</option>
                          <option value="Prateleira A1">Prateleira A1</option>
                          <option value="Depósito de Materiais">Depósito de Materiais</option>
                        </>
                      )}
                    </select>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleOpenLocationCrudModal}
                      disabled={isReadOnlyForForm('physicalLocation')}
                      title="Gerenciar / Cadastrar Localizações Físicas na Fábrica"
                      style={{
                        padding: '0.6rem 0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-md, 8px)',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        borderColor: 'var(--primary-light, #3b82f6)',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)'
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
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

                {/* ESPECIFICAÇÕES DO CARD (LEITURA / DETALHES DE PRODUÇÃO) */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)' }}>Especificações do Item / Leitura de Pedido</label>
                  <div className="grid-responsive-3" style={{ gap: '0.65rem', marginTop: '0.35rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Embalagem (Especificação)</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 10 pacotes / 10 caixas"
                        value={formEmbalagem}
                        disabled={isReadOnlyForForm('embalagem')}
                        onChange={(e) => setFormEmbalagem(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Prazo de Entrega</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: 15 dias"
                        value={formPrazo}
                        disabled={isReadOnlyForForm('prazo')}
                        onChange={(e) => setFormPrazo(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Frete / Envio (Obs)</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Transportadora / Correio / Retira"
                        value={formFreteInfo}
                        disabled={isReadOnlyForForm('freteInfo')}
                        onChange={(e) => setFormFreteInfo(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Meio de Pagamento</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Boleto / PIX / Cartão"
                        value={formMeioPag}
                        disabled={isReadOnlyForForm('meioPag')}
                        onChange={(e) => setFormMeioPag(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Forma de Pagamento</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Faturado / Parcelado / À vista"
                        value={formFormaPag}
                        disabled={isReadOnlyForForm('formaPag')}
                        onChange={(e) => setFormFormaPag(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* CONTROLE FINANCEIRO */}
              {user?.role !== 'Produção' && user?.role !== 'Estoque' && user?.role !== 'Expedição' && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'rgba(var(--primary-rgb), 0.02)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>Controle Financeiro & Liberação da Fábrica</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

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
                  </div>
                </div>
              )}

              {/* ETAPA DO KANBAN (DINÂMICO) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Etapa / Status de Produção</label>
                  <select
                    className="form-select"
                    value={formStageId}
                    disabled={isReadOnlyForForm('status')}
                    onChange={(e) => {
                      const stageId = e.target.value;
                      setFormStageId(stageId);
                      const targetStage = stages.find(s => s.id === stageId);
                      if (targetStage) {
                        setFormStatus(targetStage.name);
                      }
                    }}
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                </div>

                {/* Gestão Multi-Equipe de Manuseio (Frações / Lotes) */}
                {(formSector === 'Manuseio' || stages.find(s => s.id === formStageId)?.name === 'Manuseio') && (() => {
                  const targetPrintRun = Number(formPrintRun) || 0;
                  const totalAllocated = formHandlingAllocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);

                  return (
                    <div className="form-group" style={{
                      gridColumn: '1 / -1',
                      background: 'hsla(271, 91.2%, 65.1%, 0.05)',
                      border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={18} style={{ color: 'hsl(271, 91.2%, 55%)' }} />
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>
                            Distribuição de Equipes de Manuseio
                          </label>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '99px',
                            backgroundColor: totalAllocated === targetPrintRun
                              ? 'hsla(142, 71%, 45%, 0.12)'
                              : totalAllocated < targetPrintRun
                                ? 'hsla(45, 93%, 47%, 0.15)'
                                : 'hsla(0, 84%, 60%, 0.15)',
                            color: totalAllocated === targetPrintRun
                              ? 'hsl(142, 71%, 35%)'
                              : totalAllocated < targetPrintRun
                                ? 'hsl(45, 93%, 35%)'
                                : 'hsl(0, 84%, 45%)',
                            border: `1px solid ${totalAllocated === targetPrintRun ? 'hsla(142, 71%, 45%, 0.3)' : totalAllocated < targetPrintRun ? 'hsla(45, 93%, 47%, 0.3)' : 'hsla(0, 84%, 60%, 0.3)'}`
                          }}>
                            {totalAllocated === targetPrintRun
                              ? `Total: ${totalAllocated.toLocaleString('pt-BR')} un (100% Distribuído)`
                              : totalAllocated < targetPrintRun
                                ? `Alocado: ${totalAllocated.toLocaleString('pt-BR')} / ${targetPrintRun.toLocaleString('pt-BR')} un (Faltam ${(targetPrintRun - totalAllocated).toLocaleString('pt-BR')})`
                                : `Alocado: ${totalAllocated.toLocaleString('pt-BR')} / ${targetPrintRun.toLocaleString('pt-BR')} un (Excesso de ${(totalAllocated - targetPrintRun).toLocaleString('pt-BR')})`}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', gap: '0.25rem', display: 'flex', alignItems: 'center' }}
                          onClick={() => {
                            const remaining = Math.max(0, targetPrintRun - totalAllocated);
                            setFormHandlingAllocations(prev => [
                              ...prev,
                              { handling_team_id: '', quantity: remaining, is_completed: false, completed_at: '' }
                            ]);
                          }}
                        >
                          <Plus size={14} /> Adicionar Equipe / Fração
                        </button>
                      </div>

                      {formHandlingAllocations.map((alloc, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-start',
                            backgroundColor: 'var(--surface)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Equipe {idx + 1}
                            </label>
                            <select
                              className="form-select"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', marginTop: '2px' }}
                              value={alloc.handling_team_id}
                              onChange={(e) => setFormHandlingAllocations(prev => prev.map((a, i) => i === idx ? { ...a, handling_team_id: e.target.value } : a))}
                            >
                              <option value="">— Selecione a Equipe —</option>
                              {handlingTeams.filter(t => t.status === 'ATIVO').map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                          </div>

                          <div style={{ flex: 1.2 }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Quantidade (un)
                            </label>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', marginTop: '2px' }}
                              value={alloc.quantity || ''}
                              placeholder="Qtd."
                              onChange={(e) => setFormHandlingAllocations(prev => prev.map((a, i) => i === idx ? { ...a, quantity: Number(e.target.value) } : a))}
                            />
                          </div>

                          <div style={{ flex: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Conferido</label>
                            <input
                              type="checkbox"
                              style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: '6px' }}
                              checked={alloc.is_completed || false}
                              onChange={(e) => setFormHandlingAllocations(prev => prev.map((a, i) => i === idx ? {
                                ...a,
                                is_completed: e.target.checked,
                                completed_at: e.target.checked ? (a.completed_at || new Date().toISOString().slice(0, 10)) : ''
                              } : a))}
                            />
                          </div>

                          <div style={{ flex: 1.2 }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Data Conclusão</label>
                            <input
                              type="date"
                              className="form-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', marginTop: '2px' }}
                              value={alloc.completed_at || ''}
                              onChange={(e) => setFormHandlingAllocations(prev => prev.map((a, i) => i === idx ? { ...a, completed_at: e.target.value } : a))}
                              disabled={!alloc.is_completed}
                            />
                          </div>

                          {formHandlingAllocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFormHandlingAllocations(prev => prev.filter((_, i) => i !== idx))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                marginTop: '1.2rem',
                                padding: '4px'
                              }}
                              title="Excluir fração"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* OBSERVAÇÕES E HISTÓRICO */}
              <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>Observações e Anotações Internas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Observações (Visível para todos)</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={formNotes}
                      disabled={isReadOnlyForForm('notes')}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Observações adicionadas pela equipe..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Anotações Internas (Uso Interno)</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={formInternalNotes}
                      disabled={isReadOnlyForForm('internalNotes')}
                      onChange={(e) => setFormInternalNotes(e.target.value)}
                      placeholder="Anotações para controle interno, produção ou financeiro..."
                    />
                  </div>
                </div>
              </div>

              <footer style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div>
                  {modalType === 'edit' && selectedOrder && (canUserDeleteOrder ? canUserDeleteOrder(selectedOrder) : (isAdmin && (user?.email?.toLowerCase().trim() === 'junior.8350i@gmail.com' || user?.can_delete_any_order || isManualOrder(selectedOrder)))) && (
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteManualOrder(selectedOrder, selectedItem)}
                      className="btn btn-danger"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                      title={isManualOrder(selectedOrder) ? "Excluir este pedido manual" : "Excluir este pedido"}
                    >
                      <Trash2 size={13} />
                      <span>{isManualOrder(selectedOrder) ? 'Excluir Pedido Manual' : 'Excluir Pedido'}</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                    Fechar
                  </button>
                  {(!isReadOnlyForForm('customer') || !isReadOnlyForForm('status') || !isReadOnlyForForm('machine_id')) && (
                    <button type="submit" className="btn btn-primary">
                      {modalType === 'create-op' ? 'Gerar OP' : modalType === 'create' ? 'Salvar Pedido' : 'Salvar Alterações'}
                    </button>
                  )}
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
