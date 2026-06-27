'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getOrders, 
  getCustomers, 
  getProducts, 
  createOrder, 
  updateOrder,
  getOrderStages,
  getOrderItems,
  createOrderItem,
  updateOrderItem,
  getOrderBalanceAdjustments,
  createOrderBalanceAdjustment,
  getCustomerStockCredits,
  getCustomerProductStock,
  updateCustomerStockCredit,
  updateCustomerProductStock,
  getFinancialTransactions,
  getProductionMachines,
  logSectorTransition,
  getHandlingTeams,
  getPackagingMaterialTypes,
  getOrderItemPackaging,
  saveOrderItemPackagingVolumes,
  getPackagingSettings,
  supabase
} from '@/services/supabase';
import { parseDeadlineFromNotes, isCardOverdue } from '@/services/deadline_service';
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
  Eye,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale
} from 'lucide-react';

export default function PedidosPage() {
  const { user } = useAuth();
  
  // Listas de dados
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar a animação de mudança de etapa
  const [recentlyMovedOrderId, setRecentlyMovedOrderId] = useState<string | null>(null);
  const [recentlyMovedItemId, setRecentlyMovedItemId] = useState<string | null>(null);
  
  // Modo de visualização: Kanban (padrão) ou Lista
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Estados dos Filtros
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterHandlingTeam, setFilterHandlingTeam] = useState('');

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customerCredits, setCustomerCredits] = useState<any[]>([]);
  const [customerStocks, setCustomerStocks] = useState<any[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);
  const [productionMachines, setProductionMachines] = useState<any[]>([]);
  const [handlingTeams, setHandlingTeams] = useState<any[]>([]);
  const [packagingMaterialTypes, setPackagingMaterialTypes] = useState<any[]>([]);
  const [packagingSettings, setPackagingSettings] = useState<any>(null);

  // Estados do Modal de Embalagem
  const [isPackagingModalOpen, setIsPackagingModalOpen] = useState(false);
  const [packagingModalItem, setPackagingModalItem] = useState<any>(null);
  const [packagingModalSiblings, setPackagingModalSiblings] = useState<any[]>([]);
  const [packagingVolumes, setPackagingVolumes] = useState<any[]>([]);
  const [packagingModalTargetStageId, setPackagingModalTargetStageId] = useState<string>('');
  const [savingPackaging, setSavingPackaging] = useState(false);
  // Registro local de quais itens já têm embalagem preenchida (cache client-side)
  const [itemsWithPackaging, setItemsWithPackaging] = useState<Set<string>>(new Set());

  // Estados do Modal de Sugestão de Crédito/Estoque
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionItem, setSuggestionItem] = useState<any>(null);
  const [suggestionTargetStageId, setSuggestionTargetStageId] = useState<string>('');
  const [suggestionCredit, setSuggestionCredit] = useState<any>(null);
  const [suggestionStock, setSuggestionStock] = useState<any>(null);
  const [suggestionAction, setSuggestionAction] = useState<string>('MANTER_INTEGRO');
  const [suggestionQuantityToConsume, setSuggestionQuantityToConsume] = useState(0);

  // Estados do Modal de Sobras/Faltas (Conferência)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<any>(null);
  const [adjustmentTargetStageId, setAdjustmentTargetStageId] = useState<string>('');
  const [producedQuantity, setProducedQuantity] = useState(1000);
  const [adjustmentAction, setAdjustmentAction] = useState<any>('CREDITO_PROXIMO_PEDIDO');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // Estados do Modal de Detalhes do Card
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);

  // Estados dos Campos do Formulário
  const [formCustomer, setFormCustomer] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formMeasure, setFormMeasure] = useState('');
  const [formPrintRun, setFormPrintRun] = useState(1000);
  const [formBoxes, setFormBoxes] = useState(1);
  const [formFreight, setFormFreight] = useState(0);
  const [formSeller, setFormSeller] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formInternalNotes, setFormInternalNotes] = useState('');
  const [formStatus, setFormStatus] = useState('A produzir');
  const [formStageId, setFormStageId] = useState('');
  const [formSector, setFormSector] = useState<'Impressão' | 'Corte e Vinco' | 'Colagem' | 'Manuseio' | 'Expedição' | 'Concluído' | 'Estoque'>('Impressão');

  // Campos específicos da Kelly
  const [formPvNumber, setFormPvNumber] = useState('');
  const [formOpNumber, setFormOpNumber] = useState('');
  const [formArtName, setFormArtName] = useState('');
  const [formPackagingType, setFormPackagingType] = useState<'CAIXA' | 'PACOTE'>('CAIXA');
  const [formShippingType, setFormShippingType] = useState<'RETIRADA' | 'ENTREGA_PROPRIA' | 'TRANSPORTADORA' | 'LALAMOVE' | 'MOTOBOY' | 'TRANSPORTADORA_LONGA'>('RETIRADA');
  const [formFirstPaymentDate, setFormFirstPaymentDate] = useState('');
  const [formInstallmentsTotal, setFormInstallmentsTotal] = useState(1);
  const [formInstallmentsPaid, setFormInstallmentsPaid] = useState(0);
  const [formOverShortQuantity, setFormOverShortQuantity] = useState(0);
  const [formPhysicalLocation, setFormPhysicalLocation] = useState('Salão');
  const [formProductionStartDate, setFormProductionStartDate] = useState('');

  const [formSelectedProductStock, setFormSelectedProductStock] = useState<number | null>(null);
  const [formMachineId, setFormMachineId] = useState('');
  const [formHandlingTeamId, setFormHandlingTeamId] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

      // Chamadas críticas — se qualquer uma falhar, o Kanban não carrega
      const [ordersRes, customersRes, productsRes, stagesRes, itemsRes, adjRes, credRes, stockRes, finRes] = await Promise.all([
        getOrders(tenantId),
        getCustomers(tenantId),
        getProducts(tenantId),
        getOrderStages(tenantId),
        getOrderItems(undefined, tenantId),
        getOrderBalanceAdjustments(undefined, undefined, tenantId),
        getCustomerStockCredits(undefined, 'ATIVO', tenantId),
        getCustomerProductStock(undefined, undefined, tenantId),
        getFinancialTransactions(tenantId),
      ]);

      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
      setStages(stagesRes.data || []);
      setOrderItems(itemsRes.data || []);
      setAdjustments(adjRes.data || []);
      setCustomerCredits(credRes.data || []);
      setCustomerStocks(stockRes.data || []);
      setFinancialTransactions(finRes.data || []);

      // Chamadas opcionais — tabelas que podem não existir ainda (migração pendente)
      const [machResult, teamsResult, pmtResult, settingsResult] = await Promise.allSettled([
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId)
      ]);

      if (machResult.status === 'fulfilled') setProductionMachines(machResult.value.data || []);
      if (teamsResult.status === 'fulfilled') setHandlingTeams(teamsResult.value.data || []);
      if (pmtResult.status === 'fulfilled') setPackagingMaterialTypes(pmtResult.value.data || []);
      if (settingsResult.status === 'fulfilled') setPackagingSettings(settingsResult.value.data || null);

      // Pré-carregar cache de quais itens já têm embalagem registrada
      const itemIds: string[] = (itemsRes.data || []).map((i: any) => i.id);
      if (itemIds.length > 0) {
        const packaged = new Set<string>();
        await Promise.allSettled(itemIds.map(async (id) => {
          const { data } = await getOrderItemPackaging(id);
          if (data && data.length > 0) packaged.add(id);
        }));
        setItemsWithPackaging(packaged);
      }
    } catch (e) {
      console.error('Erro ao carregar dados da página de pedidos:', e);
    } finally {
      setLoading(false);
    }
  };


  const fetchUserPermissions = async () => {
    if (!user || !supabase) return;
    try {
      if (user.role === 'Administrador') {
        return; // Admin tem permissão irrestrita por padrão
      }
      
      const { data, error } = await supabase
        .from('profile_stage_permissions')
        .select('stage_id, can_enter, can_exit')
        .eq('profile_id', user.id);
        
      if (data) {
        setUserPermissions(data);
      }
    } catch (err) {
      console.error('Erro ao carregar permissões do usuário:', err);
    }
  };

  const [importing, setImporting] = useState(false);

  const handleImportOrders = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/sync/import-orders', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Falha ao importar pedidos.');
      }
      const data = await res.json();
      if (data.success) {
        alert(`Sincronização concluída com sucesso! Pedidos importados: ${data.imported}, atualizados: ${data.updated}.`);
        fetchAllData();
      } else {
        alert('Erro ao importar pedidos: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao importar pedidos.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchUserPermissions();
  }, [user]);

  // Atualizar estoque do produto selecionado no formulário
  useEffect(() => {
    if (formProduct) {
      const prod = products.find(p => p.id === formProduct);
      setFormSelectedProductStock(prod ? prod.stock_quantity : 0);
    } else {
      setFormSelectedProductStock(null);
    }
  }, [formProduct, products]);

  // Verificar e mover automaticamente itens em atraso para a coluna "Atrasado"
  useEffect(() => {
    const checkAndTransitionOverdueItems = async () => {
      if (orderItems.length === 0 || stages.length === 0 || loading) return;
      
      const atrasadoStage = stages.find(s => s.name === 'Atrasado');
      if (!atrasadoStage) return;

      const overdueItems = orderItems.filter(item => {
        const stage = stages.find(s => s.id === item.stage_id);
        const isIntermediate = stage && ['Em produção', 'Manuseio', 'Em revisão', 'Expedição'].includes(stage.name);
        if (!isIntermediate) return false;

        // Chamada centralizada
        return isCardOverdue(item, stages);
      });

      if (overdueItems.length > 0) {
        let updatedAny = false;
        for (const item of overdueItems) {
          try {
            await updateOrderItem(item.id, {
              stage_id: atrasadoStage.id,
              status: 'Atrasado'
            });
            updatedAny = true;
          } catch (err) {
            console.error(`Erro ao atrasar item ${item.friendly_id} automaticamente:`, err);
          }
        }
        if (updatedAny) {
          await fetchAllData();
        }
      }
    };

    checkAndTransitionOverdueItems();
  }, [orderItems, stages, loading]);

  // Movimentar item de pedido para uma etapa
  const moveOrderItemToStage = async (item: any, targetStageId: string) => {
    const currentStageId = item.stage_id;
    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    const currentStage = stages.find(s => s.id === currentStageId);
    const isMovingFromPackagingToExpedition = currentStage?.name === 'Em revisão' && targetStage.name === 'Expedição';

    if (isMovingFromPackagingToExpedition) {
      // Se ainda não tem dados de embalagem registrados, abre o modal de embalagem primeiro
      if (!itemsWithPackaging.has(item.id)) {
        const siblings = orderItems.filter(
          (si: any) => si.order_id === item.order_id && si.id !== item.id
        );
        setPackagingModalItem(item);
        setPackagingModalSiblings(siblings);
        setPackagingModalTargetStageId(targetStageId);
        const autoAssocId = getAutoAssociatedPackagingItemId(item, siblings);
        // Inicializar com um volume padrão
        setPackagingVolumes([{
          units_per_box: Math.ceil((item.print_run || 1) / Math.max(item.boxes_count || 1, 1)),
          box_count: item.boxes_count || 1,
          weight_kg: '',
          length_cm: '',
          width_cm: '',
          height_cm: '',
          packaging_material_type_id: '',
          associated_order_item_id: autoAssocId,
          notes: ''
        }]);
        setIsPackagingModalOpen(true);
        return; // O modal de ajuste abrirá após salvar a embalagem
      }

      // Embalagem já preenchida: vai direto para o modal de ajuste de conferência
      setAdjustmentItem(item);
      setAdjustmentTargetStageId(targetStageId);
      setProducedQuantity(item.print_run || 1000);
      setAdjustmentAction('CREDITO_PROXIMO_PEDIDO');
      setAdjustmentNotes('');
      setIsAdjustmentModalOpen(true);
      return;
    }

    // Sugestão de consumo de créditos ou estoque recorrente ao iniciar produção
    const isMovingFromPedidosToProductionOrStock = 
      (!currentStage || currentStage.name === 'A produzir') && 
      (targetStage.name === 'Em produção' || targetStage.name === 'Estoque');

    if (isMovingFromPedidosToProductionOrStock) {
      const customerId = item.order?.customer_id;
      const productId = item.product_id;
      
      const activeCredit = customerCredits.find(c => 
        c.customer_id === customerId && 
        c.product_id === productId && 
        c.credit_type === 'PENDENCIA_ENTREGA' && 
        c.remaining_quantity > 0
      );
      
      const activeStock = customerStocks.find(s => 
        s.customer_id === customerId && 
        s.product_id === productId && 
        s.quantity > 0
      );

      if (activeCredit || activeStock) {
        setSuggestionItem(item);
        setSuggestionTargetStageId(targetStageId);
        setSuggestionCredit(activeCredit || null);
        setSuggestionStock(activeStock || null);
        setSuggestionAction('MANTER_INTEGRO');
        setSuggestionQuantityToConsume(0);
        setIsSuggestionModalOpen(true);
        return;
      }
    }

    // Regras de Transições baseadas em Papel
    if (user && user.role !== 'Administrador') {
      // 1. Vendedor(a) regular
      if (isVendedor) {
        const userFirstName = user.full_name.split(' ')[0].toLowerCase();
        const sellerNameLower = (item.order?.seller_name || '').toLowerCase();
        if (!sellerNameLower.includes(userFirstName)) {
          alert('Permissão Negada: Vendedores só podem movimentar seus próprios pedidos.');
          return;
        }
      }

      // 2. Financeiro
      if (user.role === 'Financeiro') {
        const currentStage = stages.find(s => s.id === currentStageId);
        if (currentStage && ['Em revisão', 'Expedição', 'Concluído'].includes(currentStage.name)) {
          alert('Permissão Negada: Operadores do Financeiro não podem movimentar cards fora das fases de Embalagem/Expedição/Conclusão.');
          return;
        }
      }

      // 3. Expedição (Apenas eles, Admin ou Supervisor Comercial podem concluir)
      if (targetStage.name === 'Concluído') {
        if (user.role !== 'Expedição' && !isSupervisor) {
          alert('Permissão Negada: Apenas operadores da Expedição ou Supervisor de Vendas podem mover cards para Concluído.');
          return;
        }
      }

      // 4. Estoque
      if (user.role === 'Estoque') {
        const currentStage = stages.find(s => s.id === currentStageId);
        if (currentStage?.name !== 'Estoque' || targetStage.name !== 'Estoque') {
          alert('Permissão Negada: Operadores de Estoque só podem manipular cards na coluna de Estoque.');
          return;
        }
      }

      // Validar saída da etapa atual (se houver uma etapa atual)
      if (currentStageId) {
        const currentStagePerm = userPermissions.find(p => p.stage_id === currentStageId);
        if (!currentStagePerm || !currentStagePerm.can_exit) {
          const currentStage = stages.find(s => s.id === currentStageId);
          alert(`Você não tem liberação para retirar itens da etapa "${currentStage?.name || 'desconhecida'}".`);
          return;
        }
      }

      // Validar entrada na etapa de destino
      const targetStagePerm = userPermissions.find(p => p.stage_id === targetStageId);
      if (!targetStagePerm || !targetStagePerm.can_enter) {
        alert(`Você não tem liberação para colocar itens na etapa "${targetStage.name}".`);
        return;
      }
    }

    // Regra básica de negócio: Não mover para produção se não houver sinal ou se houver parcelas vencidas
    const isProductionStage = ['Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Concluído', 'Atrasado'].includes(targetStage.name);
    
    if (isProductionStage && user?.role !== 'Administrador') {
      const isParentPaid = !!item.order?.first_payment_date;
      const isOverdue = hasOverdueInstallments(item.order_id);
      
      if (!isParentPaid) {
        alert(`Bloqueio de Produção: O pedido ${item.order?.pv_number || 'PV'} ainda não foi autorizado financeiramente (sem data de sinal/primeiro pagamento).`);
        return;
      }
      
      if (isOverdue) {
        alert(`Bloqueio de Produção: O pedido ${item.order?.pv_number || 'PV'} possui parcelas em atraso financeiro no Conta Azul.`);
        return;
      }
    }

    setLoading(true);
    try {
      const getSectorForStageName = (stageName: string, currentSector: string): string => {
        if (stageName === 'Manuseio') return 'Manuseio';
        if (stageName === 'Embalagem' || stageName === 'Em revisão' || stageName === 'Expedição') return 'Expedição';
        if (stageName === 'Concluído') return 'Concluído';
        if (stageName === 'Estoque') return 'Estoque';
        return currentSector;
      };

      const targetSector = getSectorForStageName(targetStage.name, item.production_sector);
      const updates = {
        stage_id: targetStageId,
        status: targetStage.name,
        production_sector: targetSector
      };

      const { error } = await updateOrderItem(item.id, updates);
      if (error) {
        alert('Erro ao mover item: ' + error.message);
      } else {
        if (item.production_sector !== targetSector) {
          const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
          await logSectorTransition(item.id, targetSector, item.machine_id, tenantId);
        }
        await fetchAllData();
        setRecentlyMovedItemId(item.id);
        setTimeout(() => {
          setRecentlyMovedItemId(null);
        }, 1500);
      }
    } catch (e) {
      console.error('Erro ao mover item:', e);
      alert('Erro ao mover item.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentItem) return;

    const orderedQty = adjustmentItem.print_run || 0;
    const diffQty = producedQuantity - orderedQty;
    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

    setLoading(true);
    try {
      // 1. Criar o registro de ajuste na tabela order_balance_adjustments
      const adjustmentPayload = {
        tenant_id: tenantId,
        order_id: adjustmentItem.order_id,
        order_item_id: adjustmentItem.id,
        customer_id: adjustmentItem.order?.customer_id,
        product_id: adjustmentItem.product_id,
        ordered_quantity: orderedQty,
        produced_quantity: producedQuantity,
        difference_quantity: diffQty,
        adjustment_type: (diffQty >= 0 ? 'SOBRA' : 'FALTA') as 'SOBRA' | 'FALTA',
        action_taken: adjustmentAction,
        notes: adjustmentNotes
      };

      const { error: adjError } = await createOrderBalanceAdjustment(adjustmentPayload);
      if (adjError) {
        alert('Erro ao gravar ajuste de saldo: ' + adjError.message);
        setLoading(false);
        return;
      }

      // 2. Atualizar a diferença de tiragem (over_short_quantity) no item de pedido
      const itemUpdate = {
        over_short_quantity: diffQty,
        stage_id: adjustmentTargetStageId,
        status: 'Expedição'
      };

      const { error: itemError } = await updateOrderItem(adjustmentItem.id, itemUpdate);
      if (itemError) {
        alert('Erro ao atualizar item de pedido: ' + itemError.message);
      } else {
        setIsAdjustmentModalOpen(false);
        setAdjustmentItem(null);
        await fetchAllData();
      }
    } catch (err) {
      console.error('Erro na submissão de ajuste:', err);
      alert('Erro ao processar a conferência.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packagingModalItem) return;
    setSavingPackaging(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const volumesToSave = packagingVolumes.map((v, i) => ({
        order_item_id: packagingModalItem.id,
        tenant_id: tenantId,
        volume_index: i + 1,
        units_per_box: Number(v.units_per_box) || 0,
        box_count: Number(v.box_count) || 1,
        weight_kg: v.weight_kg !== '' ? Number(v.weight_kg) : null,
        length_cm: v.length_cm !== '' ? Number(v.length_cm) : null,
        width_cm: v.width_cm !== '' ? Number(v.width_cm) : null,
        height_cm: v.height_cm !== '' ? Number(v.height_cm) : null,
        packaging_material_type_id: v.packaging_material_type_id || null,
        associated_order_item_id: v.associated_order_item_id || null,
        notes: v.notes || null,
        registered_by: user?.id || null
      }));

      const { error } = await saveOrderItemPackagingVolumes(
        packagingModalItem.id, tenantId, volumesToSave, user?.id
      );

      if (error) {
        alert('Erro ao salvar dados de embalagem: ' + (error as any).message);
        return;
      }

      // Atualizar cache local
      setItemsWithPackaging(prev => new Set([...prev, packagingModalItem.id]));

      // Fechar modal de embalagem
      setIsPackagingModalOpen(false);

      // Abrir o modal de ajuste/conferência (próximo passo obrigatório)
      setAdjustmentItem(packagingModalItem);
      setAdjustmentTargetStageId(packagingModalTargetStageId);
      setProducedQuantity(packagingModalItem.print_run || 1000);
      setAdjustmentAction('CREDITO_PROXIMO_PEDIDO');
      setAdjustmentNotes('');
      setIsAdjustmentModalOpen(true);

      setPackagingModalItem(null);
      setPackagingVolumes([]);
    } catch (err) {
      console.error('Erro ao salvar embalagem:', err);
      alert('Erro inesperado ao salvar dados de embalagem.');
    } finally {
      setSavingPackaging(false);
    }
  };

  const handleAddPackagingVolume = () => {
    setPackagingVolumes(prev => [...prev, {
      units_per_box: 0,
      box_count: 1,
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
      packaging_material_type_id: '',
      associated_order_item_id: '',
      notes: ''
    }]);
  };

  const handleRemovePackagingVolume = (index: number) => {
    setPackagingVolumes(prev => prev.filter((_, i) => i !== index));
  };

  const handlePackagingVolumeChange = (index: number, field: string, value: any) => {
    setPackagingVolumes(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const getAutoAssociatedPackagingItemId = (item: any, siblings: any[]): string => {
    if (!packagingSettings) return '';
    const keywords = packagingSettings.keywords || 'caixa,fundo,divisoria,saco,embalagem,pacote';
    const rule = packagingSettings.association_rule || 'FIRST_ITEM';

    if (rule === 'MANUAL') return '';

    // Helper to check if an item name matches packaging keywords
    const checkIsPackaging = (i: any) => {
      if (!i || !i.name) return false;
      const kList = keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      const nameLower = i.name.toLowerCase();
      return kList.some((k: string) => nameLower.includes(k));
    };

    // If current item is itself a packaging item, don't associate packaging to it
    if (checkIsPackaging(item)) return '';

    // All items in the PV (current + siblings)
    const allPvItems = [item, ...siblings];

    // Filter packaging siblings
    const packagingSiblings = siblings.filter(checkIsPackaging);
    if (packagingSiblings.length === 0) return '';

    // Filter non-packaging items
    const nonPackagingItems = allPvItems.filter(i => !checkIsPackaging(i));
    if (nonPackagingItems.length === 0) return '';

    let targetItem = null;

    if (rule === 'FIRST_ITEM') {
      // Find the one with lowest item_index
      targetItem = [...nonPackagingItems].sort((a, b) => (a.item_index || 0) - (b.item_index || 0))[0];
    } else if (rule === 'LARGEST_QUANTITY') {
      // Find the one with highest print_run
      targetItem = [...nonPackagingItems].sort((a, b) => (b.print_run || 0) - (a.print_run || 0))[0];
    }

    // If the current item is the target of the auto-association rule, pre-fill with the first packaging sibling
    if (targetItem && targetItem.id === item.id) {
      return packagingSiblings[0].id;
    }

    return '';
  };

  const handleOpenPackagingModal = async (item: any) => {
    const siblings = orderItems.filter((si: any) => si.order_id === item.order_id && si.id !== item.id);
    setPackagingModalItem(item);
    setPackagingModalSiblings(siblings);
    setPackagingModalTargetStageId('');

    // Carregar dados existentes se houver
    const { data: existingVolumes } = await getOrderItemPackaging(item.id);
    if (existingVolumes && existingVolumes.length > 0) {
      setPackagingVolumes(existingVolumes.map((v: any) => ({
        units_per_box: v.units_per_box,
        box_count: v.box_count,
        weight_kg: v.weight_kg ?? '',
        length_cm: v.length_cm ?? '',
        width_cm: v.width_cm ?? '',
        height_cm: v.height_cm ?? '',
        packaging_material_type_id: v.packaging_material_type_id || '',
        associated_order_item_id: v.associated_order_item_id || '',
        notes: v.notes || ''
      })));
    } else {
      const autoAssocId = getAutoAssociatedPackagingItemId(item, siblings);
      setPackagingVolumes([{
        units_per_box: Math.ceil((item.print_run || 1) / Math.max(item.boxes_count || 1, 1)),
        box_count: item.boxes_count || 1,
        weight_kg: '', length_cm: '', width_cm: '', height_cm: '',
        packaging_material_type_id: '', associated_order_item_id: autoAssocId, notes: ''
      }]);
    }
    setIsPackagingModalOpen(true);
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionItem) return;

    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      
      if (suggestionAction === 'CONSUMIR_CREDITO' && suggestionCredit) {
        const qtyToConsume = Math.min(suggestionQuantityToConsume, suggestionCredit.remaining_quantity);
        const newRemaining = suggestionCredit.remaining_quantity - qtyToConsume;
        const status = newRemaining === 0 ? ('UTILIZADO' as const) : ('ATIVO' as const);

        await updateCustomerStockCredit(suggestionCredit.id, {
          remaining_quantity: newRemaining,
          status
        });

        // Grava histórico de saldo
        await createOrderBalanceAdjustment({
          tenant_id: tenantId,
          order_id: suggestionItem.order_id,
          order_item_id: suggestionItem.id,
          customer_id: suggestionItem.order?.customer_id,
          product_id: suggestionItem.product_id,
          ordered_quantity: suggestionItem.print_run || 0,
          produced_quantity: suggestionItem.print_run || 0,
          difference_quantity: -qtyToConsume,
          adjustment_type: 'FALTA',
          action_taken: 'CREDITO_PROXIMO_PEDIDO',
          notes: `Abatimento efetuado: Consumidos ${qtyToConsume} de crédito de falta pendente do PV original.`
        });
      } 
      else if (suggestionAction === 'CONSUMIR_ESTOQUE' && suggestionStock) {
        const qtyToConsume = Math.min(suggestionQuantityToConsume, suggestionStock.quantity);
        const newQty = suggestionStock.quantity - qtyToConsume;

        await updateCustomerProductStock(suggestionStock.id, {
          quantity: newQty
        });

        // Grava histórico de saldo
        await createOrderBalanceAdjustment({
          tenant_id: tenantId,
          order_id: suggestionItem.order_id,
          order_item_id: suggestionItem.id,
          customer_id: suggestionItem.order?.customer_id,
          product_id: suggestionItem.product_id,
          ordered_quantity: suggestionItem.print_run || 0,
          produced_quantity: suggestionItem.print_run || 0,
          difference_quantity: qtyToConsume,
          adjustment_type: 'SOBRA',
          action_taken: 'GUARDAR_ESTOQUE_CLIENTE',
          notes: `Despacho de estoque: Consumidos ${qtyToConsume} sacos do estoque de personalizados na fábrica.`
        });
      }
      else {
        // MANTER_INTEGRO
        await createOrderBalanceAdjustment({
          tenant_id: tenantId,
          order_id: suggestionItem.order_id,
          order_item_id: suggestionItem.id,
          customer_id: suggestionItem.order?.customer_id,
          product_id: suggestionItem.product_id,
          ordered_quantity: suggestionItem.print_run || 0,
          produced_quantity: suggestionItem.print_run || 0,
          difference_quantity: 0,
          adjustment_type: 'SOBRA',
          action_taken: 'OUTRO',
          notes: `Decisão de início de produção: Mantido crédito/estoque intacto para produzir tiragem completa solicitada.`
        });
      }

      // 2. Mover o card para a etapa correspondente
      const targetStage = stages.find(s => s.id === suggestionTargetStageId);
      const updates = {
        stage_id: suggestionTargetStageId,
        status: targetStage?.name || 'Produção',
        production_sector: targetStage?.name === 'Estoque' ? 'Estoque' : suggestionItem.production_sector
      };

      const { error: itemError } = await updateOrderItem(suggestionItem.id, updates);
      if (itemError) {
        alert('Erro ao mover item: ' + itemError.message);
      } else {
        setIsSuggestionModalOpen(false);
        setSuggestionItem(null);
        await fetchAllData();
      }
    } catch (err) {
      console.error('Erro ao processar sugestão:', err);
      alert('Erro ao processar decisão.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para HTML5 Drag and Drop
  const handleDragStart = (e: React.DragEvent, item: any) => {
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const itemToMove = orderItems.find(i => i.id === itemId);
    if (!itemToMove) return;

    await moveOrderItemToStage(itemToMove, targetStageId);
  };

  // Abrir modal para Criação
  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedOrder(null);
    setSelectedItem(null);
    setFormCustomer('');
    setFormProduct('');
    setFormMeasure('');
    setFormPrintRun(1000);
    setFormBoxes(1);
    setFormFreight(0);
    setFormSeller(user?.role === 'Comercial' ? user.full_name.split(' ')[0] : '');
    setFormNotes('');
    setFormInternalNotes('');
    
    // Inicia na primeira etapa
    const firstStage = stages[0];
    setFormStageId(firstStage?.id || '');
    setFormStatus(firstStage?.name || 'A produzir');
    setFormSector('Impressão');
    setFormMachineId('');
    setFormHandlingTeamId('');

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

  // Abrir modal de Detalhes do Card (read-only, rápido)
  const handleOpenDetail = (item: any) => {
    setDetailItem(item);
    setIsDetailModalOpen(true);
  };

  // Abrir modal para Edição
  const handleOpenEdit = (entity: any) => {
    setModalType('edit');
    if (entity.order_id) {
      // É um order_item do Kanban
      setSelectedItem(entity);
      const order = entity.order || {};
      setSelectedOrder(order);
      
      setFormCustomer(order.customer_id || '');
      setFormProduct(entity.product_id || '');
      setFormMeasure(entity.measure || '');
      setFormPrintRun(entity.print_run || 1000);
      setFormBoxes(entity.boxes_count || 1);
      setFormFreight(Number(order.freight_value || 0));
      setFormSeller(order.seller_name || '');
      setFormNotes(entity.notes || '');
      setFormInternalNotes(order.internal_notes || '');
      setFormStatus(entity.status || 'A produzir');
      setFormStageId(entity.stage_id || '');
      setFormSector(entity.production_sector || 'Impressão');
      setFormMachineId(entity.machine_id || '');
      setFormHandlingTeamId(entity.handling_team_id || '');

      setFormPvNumber(order.pv_number || '');
      setFormOpNumber(order.op_number || '');
      setFormArtName(entity.name || '');
      setFormPackagingType(entity.packaging_type || 'CAIXA');
      setFormShippingType(order.shipping_type || 'RETIRADA');
      setFormFirstPaymentDate(order.first_payment_date || '');
      setFormInstallmentsTotal(order.installments_total || 1);
      setFormInstallmentsPaid(order.installments_paid || 0);
      setFormOverShortQuantity(entity.over_short_quantity || 0);
      setFormPhysicalLocation(entity.physical_location || 'Salão');
      setFormProductionStartDate(order.production_start_date || '');
    } else {
      // É um pedido macro vindo da listagem
      setSelectedOrder(entity);
      const correspondingItem = orderItems.find(item => item.order_id === entity.id);
      if (correspondingItem) {
        setSelectedItem(correspondingItem);
        setFormProduct(correspondingItem.product_id || '');
        setFormMeasure(correspondingItem.measure || '');
        setFormPrintRun(correspondingItem.print_run || 1000);
        setFormBoxes(correspondingItem.boxes_count || 1);
        setFormNotes(correspondingItem.notes || '');
        setFormStatus(correspondingItem.status || 'A produzir');
        setFormStageId(correspondingItem.stage_id || '');
        setFormSector(correspondingItem.production_sector || 'Impressão');
        setFormMachineId(correspondingItem.machine_id || '');
        setFormHandlingTeamId(correspondingItem.handling_team_id || '');
        setFormArtName(correspondingItem.name || '');
        setFormPackagingType(correspondingItem.packaging_type || 'CAIXA');
        setFormOverShortQuantity(correspondingItem.over_short_quantity || 0);
        setFormPhysicalLocation(correspondingItem.physical_location || 'Salão');
      } else {
        setSelectedItem(null);
        setFormProduct(entity.product_id || '');
        setFormMeasure(entity.measure || '');
        setFormPrintRun(entity.print_run || 1000);
        setFormBoxes(entity.boxes_count || 1);
        setFormNotes(entity.notes || '');
        setFormStatus(entity.status || 'A produzir');
        setFormStageId(entity.stage_id || '');
        setFormSector(entity.production_sector || 'Impressão');
        setFormMachineId('');
        setFormHandlingTeamId('');
        setFormArtName(entity.art_name || '');
        setFormPackagingType(entity.packaging_type || 'CAIXA');
        setFormOverShortQuantity(entity.over_short_quantity || 0);
        setFormPhysicalLocation(entity.physical_location || 'Salão');
      }

      setFormCustomer(entity.customer_id || '');
      setFormFreight(Number(entity.freight_value || 0));
      setFormSeller(entity.seller_name || '');
      setFormInternalNotes(entity.internal_notes || '');
      setFormPvNumber(entity.pv_number || '');
      setFormOpNumber(entity.op_number || '');
      setFormShippingType(entity.shipping_type || 'RETIRADA');
      setFormFirstPaymentDate(entity.first_payment_date || '');
      setFormInstallmentsTotal(entity.installments_total || 1);
      setFormInstallmentsPaid(entity.installments_paid || 0);
      setFormProductionStartDate(entity.production_start_date || '');
    }
    setIsModalOpen(true);
  };

  // Submit do formulário de pedidos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === 'create') {
      const orderPayload = {
        customer_id: formCustomer,
        product_id: formProduct || null,
        measure: formMeasure,
        print_run: Number(formPrintRun),
        boxes_count: Number(formBoxes),
        freight_value: Number(formFreight),
        seller_name: formSeller || 'Vendas Samppel',
        notes: formNotes,
        internal_notes: formInternalNotes,
        status: formStatus,
        stage_id: formStageId || null,
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

      const { data: newOrder, error } = await createOrder(orderPayload);
      if (error) {
        alert('Erro ao criar pedido: ' + error.message);
      } else if (newOrder) {
        // Criar o item de pedido inicial correspondente
        const firstItemPayload = {
          tenant_id: newOrder.tenant_id,
          order_id: newOrder.id,
          product_id: newOrder.product_id,
          item_type: 'PRODUTO' as const,
          name: newOrder.art_name || 'Item Principal',
          measure: newOrder.measure,
          print_run: newOrder.print_run,
          boxes_count: newOrder.boxes_count,
          packaging_type: newOrder.packaging_type,
          over_short_quantity: newOrder.over_short_quantity,
          status: newOrder.status,
          production_sector: newOrder.production_sector,
          stage_id: newOrder.stage_id,
          machine_id: null,
          handling_team_id: null,
          physical_location: newOrder.physical_location,
          notes: newOrder.notes
        };
        const itemRes = await createOrderItem(firstItemPayload);
        if (itemRes.error) {
          console.error('Erro ao criar item inicial do pedido:', itemRes.error);
        }
        setIsModalOpen(false);
        fetchAllData();
      }
    } else {
      // Editando
      if (selectedItem) {
        // 1. Atualizar campos do item de pedido
        const itemPayload = {
          name: formArtName,
          product_id: formProduct || null,
          measure: formMeasure,
          print_run: Number(formPrintRun),
          boxes_count: Number(formBoxes),
          packaging_type: formPackagingType,
          status: formStatus,
          stage_id: formStageId || null,
          production_sector: formSector,
          machine_id: formMachineId || null,
          handling_team_id: formHandlingTeamId || null,
          physical_location: formPhysicalLocation,
          over_short_quantity: Number(formOverShortQuantity),
          notes: formNotes
        };

        // 2. Atualizar campos do pedido macro
        let orderPayload: any = {};
        if (user?.role === 'Financeiro') {
          orderPayload = {
            first_payment_date: formFirstPaymentDate || null,
            installments_total: Number(formInstallmentsTotal),
            installments_paid: Number(formInstallmentsPaid),
            production_start_date: formProductionStartDate || null,
            internal_notes: formInternalNotes
          };
        } else if (user?.role === 'Produção' || user?.role === 'Estoque' || user?.role === 'Expedição') {
          orderPayload = {
            internal_notes: formInternalNotes
          };
        } else {
          // Admin ou Comercial
          orderPayload = {
            customer_id: formCustomer,
            seller_name: formSeller,
            freight_value: Number(formFreight),
            pv_number: formPvNumber,
            op_number: formOpNumber || null,
            shipping_type: formShippingType,
            first_payment_date: formFirstPaymentDate || null,
            installments_total: Number(formInstallmentsTotal),
            installments_paid: Number(formInstallmentsPaid),
            production_start_date: formProductionStartDate || null,
            internal_notes: formInternalNotes
          };
        }

        const [itemRes, orderRes] = await Promise.all([
          updateOrderItem(selectedItem.id, itemPayload),
          updateOrder(selectedItem.order_id, orderPayload)
        ]);

        if (itemRes.error) {
          alert('Erro ao atualizar item: ' + itemRes.error.message);
        } else if (orderRes.error) {
          alert('Erro ao atualizar pedido: ' + orderRes.error.message);
        } else {
          // Log de transição se houver mudança de setor ou de máquina
          const sectorChanged = selectedItem.production_sector !== formSector;
          const machineChanged = selectedItem.machine_id !== formMachineId;
          
          if (sectorChanged || machineChanged) {
            const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
            await logSectorTransition(selectedItem.id, formSector, formMachineId || null, tenantId);
          }

          setIsModalOpen(false);
          fetchAllData();
        }
      } else if (selectedOrder) {
        // Fallback caso estejamos editando um pedido legado sem item correspondente
        let updatePayload: any = {};
        if (user?.role === 'Produção') {
          updatePayload = {
            status: formStatus,
            stage_id: formStageId || null,
            production_sector: formSector,
            physical_location: formPhysicalLocation,
            over_short_quantity: Number(formOverShortQuantity),
            internal_notes: formInternalNotes
          };
        } else if (user?.role === 'Financeiro') {
          updatePayload = {
            status: formStatus,
            stage_id: formStageId || null,
            first_payment_date: formFirstPaymentDate || null,
            installments_total: Number(formInstallmentsTotal),
            installments_paid: Number(formInstallmentsPaid),
            production_start_date: formProductionStartDate || null,
            internal_notes: formInternalNotes
          };
        } else {
          updatePayload = {
            customer_id: formCustomer,
            product_id: formProduct || null,
            measure: formMeasure,
            print_run: Number(formPrintRun),
            boxes_count: Number(formBoxes),
            freight_value: Number(formFreight),
            seller_name: formSeller,
            notes: formNotes,
            internal_notes: formInternalNotes,
            status: formStatus,
            stage_id: formStageId || null,
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
    }
  };

  const isSupervisor = user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
  const isVendedor = user?.role === 'Comercial' && !isSupervisor;
  const hideMonetaryValues = (user?.role === 'Comercial' && !isVendedor) ? false : ((user?.role === 'Comercial' && isVendedor) || ['Produção', 'Estoque', 'Expedição'].includes(user?.role || ''));

  // Lógica de Filtros
  const filteredOrders = orders.filter(order => {
    if (isVendedor && user) {
      const userFirstName = user.full_name.split(' ')[0].toLowerCase();
      const sellerNameLower = (order.seller_name || '').toLowerCase();
      if (!sellerNameLower.includes(userFirstName)) return false;
    }
    const matchCustomer = filterCustomer ? order.customer_id === filterCustomer : true;
    const matchSeller = filterSeller ? order.seller_name.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchStatus = filterStatus ? order.status === filterStatus : true;
    const matchSector = filterSector ? order.production_sector === filterSector : true;
    const matchDate = filterDate ? new Date(order.order_date).toLocaleDateString('pt-BR') === new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR') : true;
    return matchCustomer && matchSeller && matchStatus && matchSector && matchDate;
  });

  // Lógica de Filtros para Itens no Kanban
  const filteredOrderItems = orderItems.filter(item => {
    const parentOrder = item.order || {};
    
    if (isVendedor && user) {
      const userFirstName = user.full_name.split(' ')[0].toLowerCase();
      const sellerNameLower = (parentOrder.seller_name || '').toLowerCase();
      if (!sellerNameLower.includes(userFirstName)) return false;
    }

    if (user?.role === 'Estoque') {
      const stage = stages.find(s => s.id === item.stage_id);
      if (stage?.name !== 'Estoque') return false;
    }

    if (user?.role === 'Expedição') {
      const stage = stages.find(s => s.id === item.stage_id);
      if (!stage || !['Em revisão', 'Expedição', 'Concluído', 'Atrasado'].includes(stage.name)) return false;
    }

    const matchCustomer = filterCustomer ? parentOrder.customer_id === filterCustomer : true;
    const matchSeller = filterSeller ? parentOrder.seller_name?.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    const matchSector = filterSector ? item.production_sector === filterSector : true;
    const matchDate = filterDate ? new Date(parentOrder.order_date).toLocaleDateString('pt-BR') === new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR') : true;
    const matchHandlingTeam = filterHandlingTeam ? item.handling_team_id === filterHandlingTeam : true;
    return matchCustomer && matchSeller && matchStatus && matchSector && matchDate && matchHandlingTeam;
  });

  const getFreightBadgeStyle = (shippingType: string) => {
    switch (shippingType) {
      case 'LALAMOVE':
      case 'MOTOBOY':
        return { backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)', color: 'hsl(271, 91.2%, 65.1%)', label: '⚡ Lalamove/Moto' };
      case 'ENTREGA_PROPRIA':
        return { backgroundColor: 'hsla(24, 95.8%, 53.1%, 0.15)', color: 'hsl(24, 95.8%, 53.1%)', label: '🚗 Carro Próprio' };
      case 'TRANSPORTADORA':
      case 'TRANSPORTADORA_LONGA':
        return { backgroundColor: 'hsla(221.2, 83.2%, 53.3%, 0.15)', color: 'hsl(221.2, 83.2%, 53.3%)', label: '🚛 Transportadora' };
      case 'RETIRADA':
      default:
        return { backgroundColor: 'hsla(215.4, 16.3%, 46.9%, 0.15)', color: 'hsl(215.4, 16.3%, 46.9%)', label: '🏪 Retirada' };
    }
  };

  const visibleStages = stages.filter(stage => {
    if (!user) return true;
    if (user.role === 'Produção') {
      return ['Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Atrasado'].includes(stage.name);
    }
    if (user.role === 'Estoque') {
      return ['Estoque'].includes(stage.name);
    }
    if (user.role === 'Expedição') {
      return ['Em revisão', 'Expedição', 'Concluído', 'Atrasado'].includes(stage.name);
    }
    return true;
  });

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial';
  
  const isReadOnlyForForm = (field: string) => {
    if (modalType === 'create') return false;
    if (user?.role === 'Administrador' || user?.role === 'Comercial') return false;
    
    if (user?.role === 'Produção') {
      return !['status', 'sector', 'physicalLocation', 'overShortQuantity', 'internalNotes'].includes(field);
    }
    
    if (user?.role === 'Financeiro') {
      return !['status', 'firstPaymentDate', 'installmentsPaid', 'installmentsTotal', 'productionStartDate', 'internalNotes'].includes(field);
    }

    if (user?.role === 'Expedição') {
      return !['status', 'packaging_type', 'boxes', 'overShortQuantity', 'physicalLocation', 'internalNotes'].includes(field);
    }

    if (user?.role === 'Estoque') {
      return !['status', 'physicalLocation', 'internalNotes'].includes(field);
    }
    
    return true;
  };

  const hasOverdueInstallments = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.status === 'Atrasado') return true;

    const orderTransactions = financialTransactions.filter(t => t.order_id === orderId);
    const hasOverdue = orderTransactions.some(t => 
      t.status === 'PENDENTE' && 
      t.due_date && 
      new Date(t.due_date + 'T23:59:59') < new Date()
    );
    return hasOverdue;
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pedidos & Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Acompanhe a produção física pelo Kanban ou gerencie o status de faturamento na listagem.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Alternador de Modo de Visualização */}
          <div style={{ display: 'flex', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'kanban' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'kanban' ? 'var(--shadow-sm)' : 'none',
                fontWeight: viewMode === 'kanban' ? 600 : 500
              }}
            >
              <LayoutGrid size={14} />
              <span>Painel Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                fontWeight: viewMode === 'list' ? 600 : 500
              }}
            >
              <List size={14} />
              <span>Lista</span>
            </button>
          </div>

          <button 
            onClick={handleImportOrders} 
            disabled={importing}
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={16} className={importing ? 'spinner' : ''} />
            <span>{importing ? 'Importando...' : 'Importar Conta Azul'}</span>
          </button>

          {canCreate && (
            <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Plus size={16} />
              <span>Novo Pedido</span>
            </button>
          )}
        </div>
      </header>

      {/* BARRA DE FILTROS */}
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
            {stages.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
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

        {/* Filtro exclusivo para o setor de manuseio */}
        {(user?.role === 'Produção' || user?.role === 'Administrador' || user?.role === 'Comercial') && handlingTeams.length > 0 && (
          <div className="form-group" style={{ background: 'hsla(271, 91.2%, 65.1%, 0.06)', border: '1px solid hsla(271, 91.2%, 65.1%, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              👥 Filtrar por Equipe de Manuseio
            </label>
            <select 
              className="form-select"
              value={filterHandlingTeam}
              onChange={(e) => setFilterHandlingTeam(e.target.value)}
            >
              <option value="">Todas as Equipes</option>
              {handlingTeams
                .filter(t => t.status === 'ATIVO')
                .map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))
              }
            </select>
          </div>
        )}

        <button 
          className="btn btn-secondary" 
          onClick={() => {
            setFilterCustomer('');
            setFilterSeller('');
            setFilterStatus('');
            setFilterSector('');
            setFilterDate('');
            setFilterHandlingTeam('');
          }}
        >
          Limpar Filtros
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* 1. VISUALIZAÇÃO KANBAN */
        <div 
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            width: '100%',
            minHeight: '70vh',
            alignItems: 'flex-start'
          }}
        >
          {visibleStages.map((stage) => {
            const originalIdx = stages.findIndex(s => s.id === stage.id);
            const stageItems = filteredOrderItems.filter(item => 
              item.stage_id === stage.id || (!item.stage_id && originalIdx === 0)
            );

            return (
              <div 
                key={stage.id} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.id)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '80vh'
                }}
              >
                {/* Header da Coluna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: `2px solid ${stage.color}`, paddingBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
                      <span 
                        style={{ 
                          fontWeight: 700, 
                          fontSize: '0.75rem', 
                          color: 'var(--text)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '90px'
                        }} 
                        title={stage.name}
                      >
                        {stage.name}
                      </span>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '1px 5px', fontWeight: 600 }}>
                      {stageItems.length}
                    </span>
                  </div>
                </div>

                {/* Lista de Cards da Etapa */}
                <div 
                  className="no-scrollbar"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    overflowY: 'auto',
                    flex: 1,
                    minHeight: '150px'
                  }}
                >
                  {stageItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1.5rem 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      Vazio
                    </div>
                  ) : (
                    stageItems.map((item) => {
                      const parentOrder = item.order || {};
                      const isReleased = !!parentOrder.first_payment_date;
                      const overShort = item.over_short_quantity || 0;
                      const freightStyle = getFreightBadgeStyle(parentOrder.shipping_type);
                      
                      return (
                        <div 
                          key={item.id}
                          className={recentlyMovedItemId === item.id ? 'pulse-glow' : ''}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={(e) => {
                            // Abre detalhes apenas em clique direto (não durante drag)
                            const target = e.target as HTMLElement;
                            const isButton = target.closest('button');
                            if (!isButton) handleOpenDetail(item);
                          }}
                          style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderLeft: `3px solid ${stage.color}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                        >
                          {/* PV e OP */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.725rem', color: 'var(--text)' }}>
                                {item.friendly_id || '---'}
                              </span>
                              {hasOverdueInstallments(item.order_id) && (
                                <span 
                                  className="blinking-dot" 
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--danger)',
                                    display: 'inline-block'
                                  }}
                                  title="Atenção: Parcela em atraso no Conta Azul!"
                                />
                              )}
                            </div>
                            {parentOrder.op_number ? (
                              <span 
                                style={{ 
                                  fontSize: '0.625rem', 
                                  color: 'var(--primary)', 
                                  fontWeight: 600, 
                                  backgroundColor: 'rgba(var(--primary-rgb), 0.1)', 
                                  padding: '1px 4px', 
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {parentOrder.op_number}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Est.</span>
                            )}
                          </div>

                          {/* Arte & Cliente */}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.75rem', lineHeight: '1.1', wordBreak: 'break-all' }}>
                              🎨 {item.name || 'Arte'}
                            </div>
                            <div 
                              style={{ 
                                fontSize: '0.65rem', 
                                color: 'var(--text-muted)', 
                                marginTop: '1px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '120px'
                              }} 
                              title={parentOrder.customer?.name}
                            >
                              {parentOrder.customer?.name}
                            </div>
                          </div>

                          {/* Produto e Tiragem */}
                          <div style={{ fontSize: '0.65rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '0.2rem 0', display: 'flex', justifyContent: 'space-between', gap: '2px' }}>
                            <span>{item.print_run?.toLocaleString('pt-BR')} un</span>
                            <span style={{ fontWeight: 600 }}>
                              {item.boxes_count}{item.packaging_type === 'PACOTE' ? 'pct' : 'cx'}
                            </span>
                          </div>

                          {/* Setor, Tipo e Localização */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', gap: '2px' }}>
                            <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '0px 4px', textTransform: 'capitalize' }}>
                              {item.production_sector}
                            </span>
                            <span 
                              style={{ 
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '55px'
                              }} 
                              title={item.physical_location || 'Salão'}
                            >
                              📍 {item.physical_location || 'Salão'}
                            </span>
                          </div>

                          {/* Destaque / Badge do Tipo de Frete e Liberação */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px', flexWrap: 'wrap', gap: '2px' }}>
                            <span 
                              style={{ 
                                fontSize: '0.6rem', 
                                padding: '1px 4px', 
                                borderRadius: '3px',
                                backgroundColor: freightStyle.backgroundColor,
                                color: freightStyle.color,
                                fontWeight: 600
                              }}
                            >
                              {freightStyle.label}
                            </span>

                            {isReleased ? (
                              <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.15rem', fontSize: '0.6rem', padding: '1px 4px' }}>
                                <CheckCircle2 size={8} />
                                Lib.
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '0.15rem', fontSize: '0.6rem', padding: '1px 4px' }}>
                                <AlertCircle size={8} />
                                Bloq.
                              </span>
                            )}

                            {adjustments.some(adj => adj.order_item_id === item.id) && (
                              <span 
                                className="badge" 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center',
                                  gap: '0.15rem', 
                                  fontSize: '0.6rem', 
                                  padding: '1px 4px', 
                                  backgroundColor: 'hsla(168, 83.8%, 38.6%, 0.15)', 
                                  color: 'hsl(168, 83.8%, 38.6%)', 
                                  fontWeight: 600 
                                }}
                                title={`Conferência realizada: ${
                                  (adjustments.find(adj => adj.order_item_id === item.id)?.difference_quantity || 0) > 0 ? 'Sobra' : 'Falta'
                                } de ${Math.abs(adjustments.find(adj => adj.order_item_id === item.id)?.difference_quantity || 0)} unidades.`}
                              >
                                <Scale size={8} />
                                Conf.
                              </span>
                            )}
                          </div>

                          {/* Exibição do Prazo Extraído */}
                          {(() => {
                            const deadline = parseDeadlineFromNotes(item.notes || parentOrder.notes);
                            if (!deadline) return null;
                            const isOverdue = deadline.getTime() < Date.now() && stage.name !== 'Concluído';
                            
                            return (
                              <div style={{ 
                                fontSize: '0.6rem', 
                                marginTop: '2px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.15rem',
                                color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                                fontWeight: isOverdue ? 700 : 400
                              }}>
                                📅 Prazo: {deadline.toLocaleDateString('pt-BR')}
                                {isOverdue && <span style={{ fontSize: '0.6rem' }}>⚠️ (Atrasado)</span>}
                              </div>
                            );
                          })()}

                          {/* Informações adicionais como Prazo e Vendedora */}
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>Vend: {parentOrder.seller_name || 'Samppel'}</span>
                            <span>Tipo: {item.item_type}</span>
                          </div>

                          {/* Badge de Equipe de Manuseio */}
                          {item.production_sector === 'Manuseio' && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginTop: '2px',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: item.handling_team_id
                                ? 'hsla(271, 91.2%, 65.1%, 0.12)'
                                : 'hsla(0, 84.2%, 60.2%, 0.08)',
                              border: `1px solid ${item.handling_team_id ? 'hsla(271, 91.2%, 65.1%, 0.3)' : 'hsla(0, 84.2%, 60.2%, 0.2)'}`,
                            }}>
                              <span style={{ fontSize: '0.6rem' }}>👥</span>
                              <span style={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 700,
                                color: item.handling_team_id ? 'hsl(271, 91.2%, 55%)' : 'hsl(0, 84.2%, 50%)'
                              }}>
                                {item.handling_team_id
                                  ? (handlingTeams.find(t => t.id === item.handling_team_id)?.name || 'Equipe desconhecida')
                                  : 'Sem equipe vinculada'
                                }
                              </span>
                            </div>
                          )}
                          {/* Badge de Embalagem — aparece somente em "Em revisão" */}
                          {stage.name === 'Em revisão' && (
                            <button
                              onClick={() => handleOpenPackagingModal(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                marginTop: '4px',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${itemsWithPackaging.has(item.id) ? 'hsla(168, 83.8%, 38.6%, 0.4)' : 'hsla(38, 92.7%, 50.2%, 0.4)'}`,
                                background: itemsWithPackaging.has(item.id)
                                  ? 'hsla(168, 83.8%, 38.6%, 0.1)'
                                  : 'hsla(38, 92.7%, 50.2%, 0.08)',
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'center',
                              }}
                            >
                              <span style={{ fontSize: '0.65rem' }}>{itemsWithPackaging.has(item.id) ? '✅' : '📦'}</span>
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: itemsWithPackaging.has(item.id) ? 'hsl(168, 83.8%, 35%)' : 'hsl(38, 92.7%, 45%)'
                              }}>
                                {itemsWithPackaging.has(item.id) ? 'Embalagem Registrada' : 'Registrar Embalagem'}
                              </span>
                            </button>
                          )}

                          {/* Ações (Setas de Navegação Manual + Editar) */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '1px' }}>
                              <button
                                disabled={originalIdx === 0}
                                onClick={() => moveOrderItemToStage(item, stages[originalIdx - 1].id)}
                                className="btn btn-secondary"
                                style={{ padding: '1px 3px', display: 'flex', alignItems: 'center' }}
                                title="Voltar"
                              >
                                <ChevronLeft size={10} />
                              </button>
                              <button
                                disabled={originalIdx === stages.length - 1}
                                onClick={() => moveOrderItemToStage(item, stages[originalIdx + 1].id)}
                                className="btn btn-secondary"
                                style={{ padding: '1px 3px', display: 'flex', alignItems: 'center' }}
                                title="Avançar"
                              >
                                <ChevronRight size={10} />
                              </button>
                            </div>

                            <button 
                              onClick={() => handleOpenEdit(item)} 
                              className="btn btn-primary" 
                              style={{ padding: '1px 4px', fontSize: '0.625rem', display: 'flex', alignItems: 'center', gap: '1px' }}
                            >
                              {isReadOnlyForForm('customer') ? <Eye size={10} /> : <Edit3 size={10} />}
                              <span>{isReadOnlyForForm('customer') ? 'Ver' : 'Edit'}</span>
                            </button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        
        /* 2. VISUALIZAÇÃO EM LISTA (TABELA) */
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum pedido encontrado.
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
                            backgroundColor: (order.stage?.color || '#3b82f6') + '15', 
                            color: order.stage?.color || '#3b82f6',
                            display: 'flex',
                            justifyContent: 'center'
                          }}>
                            {order.stage?.name || order.status}
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
      )}

      {/* MODAL DE SUGESTÃO DE SALDOS E CRÉDITOS */}
      {isSuggestionModalOpen && suggestionItem && (
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
          zIndex: 1002,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                💡 Alerta: Crédito ou Estoque de Personalizados
              </h3>
              <button 
                onClick={() => setIsSuggestionModalOpen(false)} 
                className="btn btn-secondary" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <p>O cliente <strong>{suggestionItem.order?.customer?.name}</strong> possui pendências ou estoques ativos na fábrica para o produto <strong>{suggestionItem.name}</strong>.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                {suggestionCredit && (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsla(346.8, 77.2%, 49.8%, 0.1)', border: '1px solid hsla(346.8, 77.2%, 49.8%, 0.2)', color: 'hsl(346.8, 77.2%, 49.8%)' }}>
                    <strong>Falta/Crédito Pendente:</strong> {suggestionCredit.remaining_quantity?.toLocaleString('pt-BR')} unidades (origem PV {suggestionCredit.source_order?.pv_number || 'original'})
                  </div>
                )}
                {suggestionStock && (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'hsla(142.1, 76.2%, 36.3%, 0.1)', border: '1px solid hsla(142.1, 76.2%, 36.3%, 0.2)', color: 'hsl(142.1, 76.2%, 36.3%)' }}>
                    <strong>Estoque de Personalizados na Fábrica:</strong> {suggestionStock.quantity?.toLocaleString('pt-BR')} unidades prontas
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Decisão do Usuário</label>
                <select 
                  className="form-select"
                  value={suggestionAction}
                  onChange={(e) => {
                    const action = e.target.value;
                    setSuggestionAction(action);
                    if (action === 'CONSUMIR_CREDITO' && suggestionCredit) {
                      setSuggestionQuantityToConsume(Math.min(suggestionItem.print_run || 0, suggestionCredit.remaining_quantity));
                    } else if (action === 'CONSUMIR_ESTOQUE' && suggestionStock) {
                      setSuggestionQuantityToConsume(Math.min(suggestionItem.print_run || 0, suggestionStock.quantity));
                    } else {
                      setSuggestionQuantityToConsume(0);
                    }
                  }}
                >
                  <option value="MANTER_INTEGRO">Manter Crédito/Estoque intacto (Produzir lote completo: {suggestionItem.print_run?.toLocaleString('pt-BR')} un)</option>
                  {suggestionCredit && (
                    <option value="CONSUMIR_CREDITO">Abater quantidade do Crédito de Falta</option>
                  )}
                  {suggestionStock && (
                    <option value="CONSUMIR_ESTOQUE">Consumir quantidade do Estoque na Fábrica</option>
                  )}
                </select>
              </div>

              {suggestionAction !== 'MANTER_INTEGRO' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Quantidade a Consumir</label>
                  <input 
                    type="number" 
                    min="1"
                    max={
                      suggestionAction === 'CONSUMIR_CREDITO' 
                        ? suggestionCredit?.remaining_quantity 
                        : suggestionStock?.quantity
                    }
                    className="form-input"
                    value={suggestionQuantityToConsume}
                    onChange={(e) => setSuggestionQuantityToConsume(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Disponível: {
                      suggestionAction === 'CONSUMIR_CREDITO' 
                        ? suggestionCredit?.remaining_quantity?.toLocaleString('pt-BR') 
                        : suggestionStock?.quantity?.toLocaleString('pt-BR')
                    } unidades
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsSuggestionModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancelar Movimentação
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Confirmar e Iniciar Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE REGISTRO DE EMBALAGEM (VOLUMES, PESO, DIMENSÕES)  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isPackagingModalOpen && packagingModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '720px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📦 Registro de Embalagem
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {packagingModalItem.friendly_id} — {packagingModalItem.name}
                  {packagingModalTargetStageId && (
                    <span style={{ marginLeft: '0.5rem', color: 'hsl(38, 92.7%, 45%)', fontWeight: 600 }}>
                      ⚠️ Preenchimento obrigatório para avançar para Expedição
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setIsPackagingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Resumo do item */}
            <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Qtd. Total:</span><br /><strong>{packagingModalItem.print_run?.toLocaleString('pt-BR')} un</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Caixas/Pct:</span><br /><strong>{packagingModalItem.boxes_count}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Tipo Emb.:</span><br /><strong>{packagingModalItem.packaging_type}</strong></div>
            </div>

            <form onSubmit={handleSavePackaging}>
              {/* Lista de volumes */}
              {packagingVolumes.map((vol, idx) => (
                <div key={idx} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  padding: '1rem', marginBottom: '1rem',
                  background: 'var(--surface-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      📦 Volume {idx + 1}
                    </h4>
                    {packagingVolumes.length > 1 && (
                      <button type="button" onClick={() => handleRemovePackagingVolume(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        🗑 Remover
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Unidades por Caixa/Pacote *</label>
                      <input type="number" className="form-input" required min={0} value={vol.units_per_box}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'units_per_box', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número de Caixas/Pacotes *</label>
                      <input type="number" className="form-input" required min={1} value={vol.box_count}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'box_count', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Peso por Caixa (kg)</label>
                      <input type="number" step="0.001" className="form-input" placeholder="Ex: 2.500" value={vol.weight_kg}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'weight_kg', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Dimensões por Caixa (cm) — Comprimento × Largura × Altura</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <input type="number" step="0.01" className="form-input" placeholder="Comp." value={vol.length_cm}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'length_cm', e.target.value)} />
                        <input type="number" step="0.01" className="form-input" placeholder="Larg." value={vol.width_cm}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'width_cm', e.target.value)} />
                        <input type="number" step="0.01" className="form-input" placeholder="Alt." value={vol.height_cm}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'height_cm', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de Material de Embalagem</label>
                      <select className="form-select" value={vol.packaging_material_type_id}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'packaging_material_type_id', e.target.value)}>
                        <option value="">— Nenhum —</option>
                        {packagingMaterialTypes.filter(t => t.status === 'ATIVO').map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.category === 'CAIXA' ? '📦' : t.category === 'FUNDO' ? '🟫' : t.category === 'DIVISORIA' ? '🔲' : t.category === 'SACO' ? '🛍️' : '➕'} {t.name}{t.code ? ` (${t.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {packagingModalSiblings.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">Vincular a item do PV (embalagem)</label>
                        <select className="form-select" value={vol.associated_order_item_id}
                          onChange={(e) => handlePackagingVolumeChange(idx, 'associated_order_item_id', e.target.value)}>
                          <option value="">— Nenhum —</option>
                          {packagingModalSiblings.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.friendly_id} — {s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Observações deste volume</label>
                      <input type="text" className="form-input" placeholder="Ex: caixas lacradas com fita, frágil..." value={vol.notes}
                        onChange={(e) => handlePackagingVolumeChange(idx, 'notes', e.target.value)} />
                    </div>
                  </div>

                  {/* Cubo dimensional calculado */}
                  {vol.length_cm && vol.width_cm && vol.height_cm && (
                    <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'hsla(221.2, 83.2%, 53.3%, 0.08)', border: '1px solid hsla(221.2, 83.2%, 53.3%, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'hsl(221.2, 83.2%, 53.3%)' }}>
                      📐 Volume unitário: <strong>{(Number(vol.length_cm) * Number(vol.width_cm) * Number(vol.height_cm) / 1000000).toFixed(4)} m³</strong>
                      {vol.weight_kg && (<span style={{ marginLeft: '1rem' }}>⚖️ Peso total: <strong>{(Number(vol.weight_kg) * Number(vol.box_count)).toFixed(3)} kg</strong></span>)}
                    </div>
                  )}
                </div>
              ))}

              {/* Botão adicionar volume */}
              <button type="button" onClick={handleAddPackagingVolume}
                style={{ width: '100%', padding: '0.5rem', border: '1px dashed var(--border)', background: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                ➕ Adicionar Volume
              </button>

              {/* Rodapé do modal */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPackagingModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPackaging}>
                  {savingPackaging ? 'Salvando...' : packagingModalTargetStageId ? '✅ Salvar e Avançar para Expedição' : '💾 Salvar Embalagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFERÊNCIA DE EMBALAGEM / SOBRAS E FALTAS */}
      {isAdjustmentModalOpen && adjustmentItem && (
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
          zIndex: 1001,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                ⚖️ Conferência de Sobras & Faltas
              </h3>
              <button 
                onClick={() => setIsAdjustmentModalOpen(false)} 
                className="btn btn-secondary" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p><strong>Item:</strong> {adjustmentItem.friendly_id} - {adjustmentItem.name}</p>
              <p><strong>Cliente:</strong> {adjustmentItem.order?.customer?.name || 'Cliente'}</p>
              <p><strong>Tiragem do Pedido:</strong> {adjustmentItem.print_run?.toLocaleString('pt-BR')} unidades</p>
            </div>

            <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Quantidade Produzida Final *</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  className="form-input" 
                  value={producedQuantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProducedQuantity(val);
                    const diff = val - (adjustmentItem.print_run || 0);
                    if (diff > 0) {
                      setAdjustmentAction('CREDITO_PROXIMO_PEDIDO');
                    } else if (diff < 0) {
                      setAdjustmentAction('REPRODUCAO_PENDENTE');
                    } else {
                      setAdjustmentAction('OUTRO');
                    }
                  }}
                />
              </div>

              <div style={{ 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem'
              }}>
                <strong>Saldo Calculado:</strong>{' '}
                {producedQuantity - (adjustmentItem.print_run || 0) === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>0 (Sem sobras ou faltas)</span>
                ) : producedQuantity - (adjustmentItem.print_run || 0) > 0 ? (
                  <span style={{ color: 'hsl(142.1, 76.2%, 36.3%)', fontWeight: 600 }}>
                    +{producedQuantity - (adjustmentItem.print_run || 0)} unidades (Sobra / Excedente)
                  </span>
                ) : (
                  <span style={{ color: 'hsl(346.8, 77.2%, 49.8%)', fontWeight: 600 }}>
                    {producedQuantity - (adjustmentItem.print_run || 0)} unidades (Falta)
                  </span>
                )}
              </div>

              {producedQuantity - (adjustmentItem.print_run || 0) !== 0 && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tratamento do Saldo</label>
                  <select 
                    className="form-select"
                    value={adjustmentAction}
                    onChange={(e) => setAdjustmentAction(e.target.value)}
                  >
                    {producedQuantity - (adjustmentItem.print_run || 0) > 0 ? (
                      <>
                        <option value="CREDITO_PROXIMO_PEDIDO">Cortesia / Crédito para o Próximo Pedido</option>
                        <option value="GUARDAR_ESTOQUE_CLIENTE">Guardar no Estoque de Personalizados (Fábrica)</option>
                        <option value="COBRADO_ADICIONAL">Cobrar Valor Adicional do Cliente</option>
                        <option value="OUTRO">Outro / Tratar Manualmente</option>
                      </>
                    ) : (
                      <>
                        <option value="REPRODUCAO_PENDENTE">Programar Reprodução Pendente (Lote Corretivo)</option>
                        <option value="CREDITO_PROXIMO_PEDIDO">Abater/Crédito no Próximo Pedido (Compensação)</option>
                        <option value="CANCELADO_DESCONTO">Gerar Desconto Proporcional no Faturamento</option>
                        <option value="OUTRO">Outro / Tratar Manualmente</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Observações e Histórico Livre</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Descreva detalhes do saldo..."
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAdjustmentModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Confirmar e Enviar para Expedição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO E EDIÇÃO DE PEDIDOS */}
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
                
                {/* Número do PV */}
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

                {/* Número da OP */}
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

                {/* Seleção do Cliente */}
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

                {/* Seleção do Produto */}
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

                {/* Medidas */}
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

                {/* Tiragem */}
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

                {/* Tipo de Embalagem */}
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

                {/* Qtd. Embalagens */}
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

                {/* Tipo de Envio */}
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

                {/* Valor do Frete */}
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

                {/* Vendedora */}
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

                {/* Localização Física */}
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

              {/* CONTROLE FINANCEIRO */}
              {user?.role !== 'Produção' && user?.role !== 'Estoque' && user?.role !== 'Expedição' && (
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                
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
                  <label className="form-label" style={{ fontWeight: 600 }}>Setor de Produção Física</label>
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
                    <option value="Impressão">Impressão</option>
                    <option value="Corte e Vinco">Corte e Vinco</option>
                    <option value="Colagem">Colagem</option>
                    <option value="Guilhotina">Guilhotina</option>
                    <option value="Manuseio">Manuseio / Acabamento</option>
                    <option value="Expedição">Expedição</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Estoque">Estoque (Pronta Entrega)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Máquina de Produção Vinculada</label>
                  <select 
                    className="form-select"
                    value={formMachineId}
                    disabled={isReadOnlyForForm('sector')}
                    onChange={(e) => setFormMachineId(e.target.value)}
                  >
                    <option value="">Nenhuma Máquina Vinculada</option>
                    {productionMachines
                      .filter(m => m.sector === formSector && m.status === 'ATIVO')
                      .map((mach) => (
                        <option key={mach.id} value={mach.id}>{mach.name}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Campo de Equipe de Manuseio — visível sempre que setor for Manuseio */}
                {formSector === 'Manuseio' && (
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'hsla(271, 91.2%, 65.1%, 0.08)', border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👥 Equipe de Manuseio Responsável
                    </label>
                    <select 
                      className="form-select"
                      value={formHandlingTeamId}
                      onChange={(e) => setFormHandlingTeamId(e.target.value)}
                    >
                      <option value="">Sem Equipe Vinculada</option>
                      {handlingTeams
                        .filter(t => t.status === 'ATIVO')
                        .map((team) => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))
                      }
                    </select>
                    {!formHandlingTeamId && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        ⚠️ Indique com qual equipe este material está sendo trabalhado.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Observações Públicas */}
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

              {/* Observações Internas */}
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

      {/* ========================================
          MODAL DE DETALHES DO CARD
          ======================================== */}
      {isDetailModalOpen && detailItem && (() => {
        const order = detailItem.order || {};
        const customer = order.customer || {};
        const currentStage = stages.find(s => s.id === detailItem.stage_id);
        const itemAdjs = adjustments.filter(a => a.order_item_id === detailItem.id);
        const deadline = parseDeadlineFromNotes(detailItem.notes || order.notes);
        const isOverdue = deadline ? deadline.getTime() < Date.now() && currentStage?.name !== 'Concluído' : false;
        const freightStyle = getFreightBadgeStyle(order.shipping_type);
        const isReleased = !!order.first_payment_date;

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false); }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1100, padding: '1rem',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header */}
              <div style={{
                padding: '1.1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${currentStage?.color || 'var(--primary)'}18 0%, transparent 100%)`,
                borderLeft: `4px solid ${currentStage?.color || 'var(--primary)'}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                      {detailItem.friendly_id || '---'}
                    </span>
                    {currentStage && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700,
                        backgroundColor: currentStage.color + '22',
                        color: currentStage.color,
                        padding: '2px 8px', borderRadius: '99px',
                        border: `1px solid ${currentStage.color}55`
                      }}>
                        {currentStage.name}
                      </span>
                    )}
                    {isOverdue && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>⚠️ Atrasado</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    🎨 {detailItem.name} · {customer.name || 'Cliente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Corpo com scroll */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Seção: Informações do Pedido */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Pedido
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'PV', value: order.pv_number || '—' },
                      { label: 'OP', value: order.op_number || '—' },
                      { label: 'Arte', value: detailItem.name || '—' },
                      { label: 'Vendedor(a)', value: order.seller_name || 'Samppel' },
                      { label: 'Data do Pedido', value: order.order_date ? new Date(order.order_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                      { label: 'Início Produção', value: order.production_start_date ? new Date(order.production_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Seção: Cliente */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: '#a855f7', borderRadius: '2px', display: 'inline-block' }} />
                    Cliente
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'Nome', value: customer.name || '—' },
                      { label: 'CNPJ/CPF', value: customer.cnpj || customer.cpf || '—' },
                      { label: 'E-mail', value: customer.email || '—' },
                      { label: 'Telefone', value: customer.phone || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Seção: Produção */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} />
                    Produção
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'Tiragem', value: (detailItem.print_run || 0).toLocaleString('pt-BR') + ' un' },
                      { label: 'Caixas', value: `${detailItem.boxes_count || 0} ${detailItem.packaging_type === 'PACOTE' ? 'pct' : 'cx'}` },
                      { label: 'Medida', value: detailItem.measure || '—' },
                      { label: 'Setor', value: detailItem.production_sector || '—' },
                      { label: 'Localização', value: detailItem.physical_location || 'Salão' },
                      { label: 'Sobra/Falta', value: detailItem.over_short_quantity > 0 ? `+${detailItem.over_short_quantity}` : detailItem.over_short_quantity < 0 ? `${detailItem.over_short_quantity}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Seção: Financeiro */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }} />
                    Financeiro
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.75rem', borderRadius: '99px',
                      backgroundColor: isReleased ? 'hsla(142, 76.2%, 36.3%, 0.12)' : 'hsla(0, 84.2%, 60.2%, 0.10)',
                      border: `1px solid ${isReleased ? 'hsla(142, 76.2%, 36.3%, 0.35)' : 'hsla(0, 84.2%, 60.2%, 0.3)'}`,
                      color: isReleased ? 'hsl(142, 76.2%, 36.3%)' : 'hsl(0, 84.2%, 50%)',
                      fontSize: '0.75rem', fontWeight: 700
                    }}>
                      {isReleased ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {isReleased ? 'Liberado para Produção' : 'Aguardando Pagamento'}
                    </div>
                    {isReleased && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sinal: {new Date(order.first_payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.6rem' }}>
                    {[
                      { label: 'Frete', value: freightStyle.label },
                      { label: 'Parcelas', value: `${order.installments_paid || 0}/${order.installments_total || 1} pagas` },
                      { label: 'Frete (R$)', value: order.freight_value ? `R$ ${Number(order.freight_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Seção: Prazo */}
                {deadline && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                    <section>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '3px', height: '12px', backgroundColor: isOverdue ? 'var(--danger)' : '#f97316', borderRadius: '2px', display: 'inline-block' }} />
                        Prazo
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)',
                        backgroundColor: isOverdue ? 'hsla(0, 84.2%, 60.2%, 0.08)' : 'hsla(38, 92.7%, 50.2%, 0.08)',
                        border: `1px solid ${isOverdue ? 'hsla(0, 84.2%, 60.2%, 0.3)' : 'hsla(38, 92.7%, 50.2%, 0.3)'}`,
                        color: isOverdue ? 'var(--danger)' : 'hsl(38, 92.7%, 45%)',
                        fontSize: '0.82rem', fontWeight: 700
                      }}>
                        📅 {deadline.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        {isOverdue && <span>(ATRASADO)</span>}
                      </div>
                    </section>
                  </>
                )}

                {/* Seção: Observações */}
                {(detailItem.notes || order.notes || order.internal_notes) && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                    <section>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '3px', height: '12px', backgroundColor: '#eab308', borderRadius: '2px', display: 'inline-block' }} />
                        Observações
                      </div>
                      {detailItem.notes && (
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Obs. do Item</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{detailItem.notes}</p>
                        </div>
                      )}
                      {(order.notes && !detailItem.notes) && (
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Obs. do Pedido</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{order.notes}</p>
                        </div>
                      )}
                      {order.internal_notes && (
                        <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '0.6rem', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>🔒 Anotações Internas</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{order.internal_notes}</p>
                        </div>
                      )}
                    </section>
                  </>
                )}

                {/* Seção: Conferências (se houver) */}
                {itemAdjs.length > 0 && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                    <section>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '3px', height: '12px', backgroundColor: 'hsl(168, 83.8%, 38.6%)', borderRadius: '2px', display: 'inline-block' }} />
                        Conferência de Tiragem ({itemAdjs.length})
                      </div>
                      {itemAdjs.map((adj: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: adj.difference_quantity >= 0 ? 'hsla(142, 76.2%, 36.3%, 0.08)' : 'hsla(0, 84.2%, 60.2%, 0.08)',
                          border: `1px solid ${adj.difference_quantity >= 0 ? 'hsla(142, 76.2%, 36.3%, 0.25)' : 'hsla(0, 84.2%, 60.2%, 0.25)'}`,
                          marginBottom: '0.35rem',
                          fontSize: '0.78rem'
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>Pedido: {adj.ordered_quantity?.toLocaleString('pt-BR')} → Produzido: {adj.produced_quantity?.toLocaleString('pt-BR')}</span>
                          <span style={{ fontWeight: 700, color: adj.difference_quantity >= 0 ? 'hsl(142, 76.2%, 36.3%)' : 'hsl(0, 84.2%, 50%)' }}>
                            {adj.difference_quantity >= 0 ? '+' : ''}{adj.difference_quantity?.toLocaleString('pt-BR')} un
                          </span>
                        </div>
                      ))}
                    </section>
                  </>
                )}

              </div>

              {/* Footer */}
              <div style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'var(--background)'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ID: {detailItem.id?.substring(0, 8)}… · Tipo: {detailItem.item_type}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Edit3 size={13} /> Editar Pedido
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
