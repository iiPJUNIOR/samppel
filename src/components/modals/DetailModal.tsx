// @ts-nocheck
import React from 'react';
import Image from 'next/image';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2
} from 'lucide-react';

export function DetailModal(props: any) {
  const {
    CheckCircle2,
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  {modalType === 'create' ? 'Cadastrar Novo Pedido' : (isReadOnlyForForm('customer') ? 'Detalhes do Pedido' : 'Editar Informações do Pedido')}
                </h3>
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
                {modalType === 'create' && (
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
                        <span>🏭 Entra em Produção (A Produzir)</span>
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
                        <span>📦 Entra em Estoque (Pronta Entrega)</span>
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


                {/* Seleção do Cliente (Obrigatório) */}
                <div className="form-group">
                  <label className="form-label">Cliente (Razão Social) *</label>
                  <input
                    type="text"
                    list="customers-list"
                    className="form-input"
                    required
                    placeholder="Ex: Doce Vida Doceria (Digite ou selecione)"
                    value={formCustomer}
                    disabled={isReadOnlyForForm('customer')}
                    onChange={(e) => setFormCustomer(e.target.value)}
                  />
                  <datalist id="customers-list">
                    {customers.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
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
                  <label className="form-label">Máquina de Produção (Opcional)</label>
                  <select
                    className="form-select"
                    value={formMachineId}
                    disabled={isReadOnlyForForm('machine_id')}
                    onChange={(e) => setFormMachineId(e.target.value)}
                  >
                    <option value="">— Nenhuma máquina vinculada —</option>
                    {productionMachines.filter(m => m.status === 'ATIVO').map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.sector})</option>
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
                    type="number"
                    className="form-input"
                    placeholder="Ex: 1000"
                    value={formPrintRun || ''}
                    disabled={isReadOnlyForForm('printRun')}
                    onChange={(e) => setFormPrintRun(Number(e.target.value))}
                  />
                </div>

                {/* Tipo de Envio e Valor do Frete (Ocultos no cadastro de Novo Pedido, pois são fabricações para estoque) */}
                {modalType !== 'create' && (
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

                    {!hideMonetaryValues && (
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
                    )}
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

                    {!hideMonetaryValues && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ETAPA DO KANBAN E SETOR (DINÂMICO) */}
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

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Setor de Produção Física</label>
                    {user?.role === 'Administrador' && (
                      <button
                        type="button"
                        onClick={() => setIsSectorCrudModalOpen(true)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '20px', height: '20px', borderRadius: '4px',
                          border: '1px solid var(--primary)', backgroundColor: 'rgba(37,99,235,0.08)',
                          color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem',
                          fontWeight: 700, padding: 0, transition: 'all 0.15s ease'
                        }}
                        title="Gerenciar Setores de Produção"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      >
                        +
                      </button>
                    )}
                  </div>
                  <select
                    className="form-select"
                    value={formSector}
                    disabled={isReadOnlyForForm('sector')}
                    onChange={(e) => {
                      setFormSector(e.target.value as any);
                      setFormMachineId('');
                      setFormHandlingTeamId('');
                    }}
                  >
                    {productionSectors
                      .filter(s => s.status === 'ATIVO')
                      .map((sec) => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Máquina de Produção Vinculada</label>
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
                    onChange={(e) => setFormMachineId(e.target.value)}
                  >
                    <option value="">Nenhuma Máquina Vinculada</option>
                    {productionMachines
                      .filter(m => m.status === 'ATIVO')
                      .map((mach) => (
                        <option key={mach.id} value={mach.id}>
                          {mach.name} {mach.sector ? `(${mach.sector})` : ''}
                        </option>
                      ))
                    }
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
                  {modalType === 'edit' && isAdmin && selectedOrder && isManualOrder(selectedOrder) && (
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteManualOrder(selectedOrder, selectedItem)}
                      className="btn btn-danger"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                      title="Excluir este pedido manual (Apenas Administrador)"
                    >
                      <Trash2 size={13} />
                      <span>Excluir Pedido Manual</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                    Fechar
                  </button>
                  {(!isReadOnlyForForm('customer') || !isReadOnlyForForm('status') || !isReadOnlyForForm('machine_id')) && (
                    <button type="submit" className="btn btn-primary">
                      {modalType === 'create' ? 'Salvar Pedido' : 'Salvar Alterações'}
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
