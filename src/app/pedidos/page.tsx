'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  createCustomerStockCredit,
  getCustomerStockCredits,
  getCustomerProductStock,
  updateCustomerStockCredit,
  updateCustomerProductStock,
  getFinancialTransactions,
  getProductionMachines,
  createProductionMachine,
  updateProductionMachine,
  deleteProductionMachine,
  getProductionSectors,
  createProductionSector,
  updateProductionSector,
  deleteProductionSector,
  logSectorTransition,
  logNotesTransition,
  getHandlingTeams,
  getPackagingMaterialTypes,
  getOrderItemPackaging,
  saveOrderItemPackagingVolumes,
  getPackagingSettings,
  getShippingTypesConfig,
  createShippingTypeConfig,
  deleteShippingTypeConfig,
  type ShippingTypeConfig,
  getPendingAdjustment,
  resolvePendingAdjustment,
  supabase
} from '@/services/supabase';
import { parseDeadlineFromNotes, isCardOverdue } from '@/services/deadline_service';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import OperatorAuthModal from '@/components/OperatorAuthModal';
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
  EyeOff,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale,
  Copy,
  Check,
  Users,
  AlertTriangle,
  Download,
  Clock
} from 'lucide-react';

// Auxiliar para mapear o nome da etapa (do banco de dados) para um status válido do order_items
const getStatusForStageName = (stageName: string): string => {
  if (stageName === 'Pedidos') return 'A produzir';
  if (stageName === 'Embalagem') return 'Em revisão';
  if (stageName === 'Concluído') return 'Entregue';
  return stageName;
};

// Extrair número de Autorização do texto das observações (padrão: AUT. XXX.YYYY ou similar)
const extractAuthorization = (notes: string | null): string | null => {
  if (!notes) return null;
  const match = notes.match(/AUT\.\s*([\w\.\/-]+)/i);
  return match ? `AUT. ${match[1]}` : null;
};

// Extrair Prazo de Produção do texto das observações (ex: "PRAZO: ATÉ 30 DIAS APÓS...")
const extractProductionDeadline = (notes: string | null): string | null => {
  if (!notes) return null;
  const match = notes.match(/(?:PRAZO\s*(?:DE\s*(?:PRODUÇÃO|ENTREGA))?|PRAZO\s*PRODUÇÃO):\s*([^.\n\r]+)/i);
  if (match) return match[1].trim();
  
  const altMatch = notes.match(/(ATÉ\s*\d+\s*DIAS\s*(?:APÓS|CORRIDOS)[^.\n\r]*)/i);
  return altMatch ? altMatch[1].trim() : null;
};

// Extrair quantidade de dias de prazo para cálculo de atrasos
const extractDeadlineDays = (deadlineText: string | null): number | null => {
  if (!deadlineText) return null;
  const match = deadlineText.match(/(\d+)\s*dias/i);
  return match ? parseInt(match[1]) : null;
};

// Verificar se o item está atrasado (cronômetro a partir da data de início da produção)
const checkIsDelayed = (item: any, stagesList: any[]): boolean => {
  const parentOrder = item.order || {};
  if (parentOrder.conta_azul_status === 'Em andamento') return false;
  if (!parentOrder.production_start_date) return false;

  const itemStage = stagesList.find(s => s.id === item.stage_id);
  if (itemStage?.name === 'Concluído') return false;

  const notesText = item.notes || parentOrder.notes;
  const deadlineText = extractProductionDeadline(notesText);
  if (!deadlineText) return false;

  const deadlineDays = extractDeadlineDays(deadlineText);
  if (!deadlineDays) return false;

  const startDate = new Date(parentOrder.production_start_date + 'T12:00:00');
  const limitDate = new Date(startDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  
  return Date.now() > limitDate.getTime();
};

// Componente de botão de cópia rápido
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      type="button"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.15rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: copied ? 'var(--success, #10b981)' : 'var(--text-muted, #94a3b8)',
        transition: 'color 0.2s',
        marginLeft: '0.35rem',
        verticalAlign: 'middle'
      }}
      title="Copiar"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};

// Formatação de telefone brasileiro
const formatPhone = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
};

// Formatação de documento (CNPJ/CPF)
const formatDocument = (doc: string) => {
  if (!doc) return '';
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 14) {
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9)}`;
  }
  return doc;
};

export default function PedidosPage() {
  const { user } = useAuth();

  // Operator secondary authentication
  const [isOpAuthOpen, setIsOpAuthOpen] = useState(false);
  const [pendingKanbanMove, setPendingKanbanMove] = useState<{
    item: any;
    targetStageId: string;
  } | null>(null);
  
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
  
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    localStorage.setItem('pedidos_view_mode', viewMode);
    window.dispatchEvent(new Event('pedidos_view_mode_changed'));
  }, [viewMode]);

  const [filterCustomer, setFilterCustomer] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_customer') || '';
    return '';
  });
  const [filterSeller, setFilterSeller] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_seller') || '';
    return '';
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterHandlingTeam, setFilterHandlingTeam] = useState('');
  const [filterSearchOrder, setFilterSearchOrder] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_search') || '';
    return '';
  });
  const [filterContaAzulStatus, setFilterContaAzulStatus] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_conta_azul') || '';
    return '';
  });
  // Filtro específico para a Fase Pedidos / Status de Liberação (liberados, bloqueados, autorizados)
  const [filterPedidosRelease, setFilterPedidosRelease] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_release') || '';
    return '';
  });
  // Filtro de Etapa do Kanban
  const [filterStage, setFilterStage] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_stage') || '';
    return '';
  });

  const [pullOrderNumber, setPullOrderNumber] = useState('');
  const [syncingOrderNumber, setSyncingOrderNumber] = useState('');

  // Sincronizar e salvar todos os filtros no localStorage conforme forem alterados
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pedidos_filter_customer', filterCustomer);
    localStorage.setItem('pedidos_filter_seller', filterSeller);
    localStorage.setItem('pedidos_filter_search', filterSearchOrder);
    localStorage.setItem('pedidos_filter_conta_azul', filterContaAzulStatus);
    localStorage.setItem('pedidos_filter_release', filterPedidosRelease);
    localStorage.setItem('pedidos_filter_stage', filterStage);
  }, [filterCustomer, filterSeller, filterSearchOrder, filterContaAzulStatus, filterPedidosRelease, filterStage]);

  // Sort direction per kanban column: 'asc' | 'desc'
  const [columnSortDirs, setColumnSortDirs] = useState<Record<string, 'asc' | 'desc'>>({});

  const getContaAzulStatusStyle = (status: string) => {
    const norm = (status || '').toLowerCase().trim();
    if (norm.includes('aprovado')) {
      return { backgroundColor: 'hsla(168, 83.8%, 38.6%, 0.1)', color: 'hsl(168, 83.8%, 35%)' };
    }
    if (norm.includes('cancelado')) {
      return { backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)', color: 'hsl(0, 84.2%, 50%)' };
    }
    if (norm.includes('andamento')) {
      return { backgroundColor: 'hsla(38, 92.7%, 50.2%, 0.1)', color: 'hsl(38, 92.7%, 45%)' };
    }
    if (norm.includes('faturado')) {
      return { backgroundColor: 'hsla(221.2, 83.2%, 53.3%, 0.1)', color: 'hsl(221.2, 83.2%, 48%)' };
    }
    if (norm.includes('recusado')) {
      return { backgroundColor: 'hsla(0, 0%, 20%, 0.1)', color: 'hsl(0, 0%, 15%)' };
    }
    return { backgroundColor: 'var(--surface-subtle)', color: 'var(--text-muted)' };
  };

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [syncingSingleOrder, setSyncingSingleOrder] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customerCredits, setCustomerCredits] = useState<any[]>([]);
  const [customerStocks, setCustomerStocks] = useState<any[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);
  const [productionMachines, setProductionMachines] = useState<any[]>([]);
  const [productionSectors, setProductionSectors] = useState<any[]>([
    { id: 'sec-default-1', name: 'Impressão' },
    { id: 'sec-default-2', name: 'Corte e Vinco' },
    { id: 'sec-default-3', name: 'Colagem' },
    { id: 'sec-default-4', name: 'Guilhotina' },
    { id: 'sec-default-5', name: 'Manuseio' },
    { id: 'sec-default-6', name: 'Expedição' },
    { id: 'sec-default-7', name: 'Concluído' },
    { id: 'sec-default-8', name: 'Estoque' }
  ]);
  const [handlingTeams, setHandlingTeams] = useState<any[]>([]);
  const [packagingMaterialTypes, setPackagingMaterialTypes] = useState<any[]>([]);
  const [packagingSettings, setPackagingSettings] = useState<any>(null);
  const [isSectorCrudModalOpen, setIsSectorCrudModalOpen] = useState(false);
  const [isMachineCrudModalOpen, setIsMachineCrudModalOpen] = useState(false);

  // Estados do formulário CRUD de Setores
  const [sectorFormName, setSectorFormName] = useState('');
  const [sectorFormStatus, setSectorFormStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingSector, setEditingSector] = useState<any>(null);
  const [savingSector, setSavingSector] = useState(false);

  // Estados do formulário CRUD de Máquinas
  const [machineFormName, setMachineFormName] = useState('');
  const [machineFormSector, setMachineFormSector] = useState('Impressão');
  const [machineFormStatus, setMachineFormStatus] = useState<'ATIVO' | 'INATIVO' | 'MANUTENCAO'>('ATIVO');
  const [editingMachineState, setEditingMachineState] = useState<any>(null);
  const [savingMachine, setSavingMachine] = useState(false);

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
  const [detailShortage, setDetailShortage] = useState(0);
  const [detailCourtesy, setDetailCourtesy] = useState(0);
  const [detailExpeditionNotes, setDetailExpeditionNotes] = useState('');
  const [savingExpeditionDetails, setSavingExpeditionDetails] = useState(false);

  // Estados do Modal de Transição Expedição -> Concluído (Falta/Cortesia)
  const [isExpeditionTransitionModalOpen, setIsExpeditionTransitionModalOpen] = useState(false);
  const [expeditionTransitionItem, setExpeditionTransitionItem] = useState<any>(null);
  const [expeditionTransitionTargetStageId, setExpeditionTransitionTargetStageId] = useState<string>('');
  const [expeditionTransitionType, setExpeditionTransitionType] = useState<'NENHUM' | 'FALTA' | 'CORTESIA'>('NENHUM');
  const [expeditionTransitionQuantity, setExpeditionTransitionQuantity] = useState(0);
  const [expeditionTransitionNotes, setExpeditionTransitionNotes] = useState('');
  const expeditionTransitionMoveBypass = useRef(false);

  // Estados do Modal de Alerta de Produção (A partir de Faltas/Cortesias anteriores)
  const [isProductionAlertModalOpen, setIsProductionAlertModalOpen] = useState(false);
  const [productionAlertData, setProductionAlertData] = useState<any>(null);
  const [productionAlertItem, setProductionAlertItem] = useState<any>(null);
  const [productionAlertTargetStageId, setProductionAlertTargetStageId] = useState<string>('');
  const productionAlertBypass = useRef(false);

  // Estados do Modal de Conferência Física Obrigatória (Antes da Expedição)
  const [isConferencyModalOpen, setIsConferencyModalOpen] = useState(false);
  const [conferencyData, setConferencyData] = useState<any>(null);
  const [conferencyItem, setConferencyItem] = useState<any>(null);
  const [conferencyTargetStageId, setConferencyTargetStageId] = useState<string>('');
  const [conferencyChecked, setConferencyChecked] = useState(false);
  const [conferencyPhysicalQuantity, setConferencyPhysicalQuantity] = useState<number>(0);
  const conferencyBypass = useRef(false);

  // Estados do Modal de Peso e Dimensões de Frete (Obrigatório antes da Expedição)
  const [isFreightModalOpen, setIsFreightModalOpen] = useState(false);
  const [freightItem, setFreightItem] = useState<any>(null);
  const [freightTargetStageId, setFreightTargetStageId] = useState<string>('');
  const [freightWeight, setFreightWeight] = useState<string>('');
  const [freightLength, setFreightLength] = useState<string>('');
  const [freightWidth, setFreightWidth] = useState<string>('');
  const [freightHeight, setFreightHeight] = useState<string>('');
  const [freightBoxesCount, setFreightBoxesCount] = useState<string>('');
  const [freightQtyPerBox, setFreightQtyPerBox] = useState<string>('');
  const [selectedFreightSiblings, setSelectedFreightSiblings] = useState<string[]>([]);
  const freightBypass = useRef(false);

  // Estados para o Modal de Alerta de Pedido Em Andamento (não faturado/aprovado)
  const [isOrderInProgressModalOpen, setIsOrderInProgressModalOpen] = useState(false);
  const [inProgressItem, setInProgressItem] = useState<any>(null);
  const [inProgressTargetStageId, setInProgressTargetStageId] = useState<string>('');
  const [inProgressSyncing, setInProgressSyncing] = useState(false);
  const inProgressOrderBypass = useRef(false);
  const authActionType = useRef<'kanban_move' | 'save_details'>('kanban_move');

  // Estados do Modal Didático de Alerta de Pedido Bloqueado (Sem Sinal/Pagamento)
  const [isBlockedPaymentModalOpen, setIsBlockedPaymentModalOpen] = useState(false);
  const [blockedPaymentItem, setBlockedPaymentItem] = useState<any>(null);
  const [blockedPaymentTargetStageId, setBlockedPaymentTargetStageId] = useState<string>('');
  const blockedPaymentBypass = useRef(false);

  const handleConfirmBlockedPaymentMove = async () => {
    if (!blockedPaymentItem || !blockedPaymentTargetStageId) return;
    const item = blockedPaymentItem;
    const targetStageId = blockedPaymentTargetStageId;

    setIsBlockedPaymentModalOpen(false);
    setBlockedPaymentItem(null);
    setBlockedPaymentTargetStageId('');

    blockedPaymentBypass.current = true;
    await moveOrderItemToStage(item, targetStageId);
    blockedPaymentBypass.current = false;
  };

  const handleCancelBlockedPaymentMove = () => {
    setIsBlockedPaymentModalOpen(false);
    setBlockedPaymentItem(null);
    setBlockedPaymentTargetStageId('');
  };

  // Estados de Notificação Toast, Drag/Drop e Filtros Mobile
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'info'; id: number } | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  
  // Custom Pointer Events DND Refs
  const dragCloneRef = useRef<HTMLElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const activeDragItemId = useRef<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);


  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastNotification(null);
    }, 3500);
  };



  // Estados de Tipo de Frete e CRUD
  const [shippingTypes, setShippingTypes] = useState<ShippingTypeConfig[]>([]);
  const [selectedShippingType, setSelectedShippingType] = useState<string>('');
  const [isShippingCrudModalOpen, setIsShippingCrudModalOpen] = useState(false);
  const [newShippingTypeName, setNewShippingTypeName] = useState<string>('');

  // Estados do Modal de Autorização de Retrocesso de Etapa
  const [isRevertAuthModalOpen, setIsRevertAuthModalOpen] = useState(false);
  const [pendingRevertItem, setPendingRevertItem] = useState<any>(null);
  const [pendingRevertTargetStageId, setPendingRevertTargetStageId] = useState('');
  const [revertAuthEmail, setRevertAuthEmail] = useState('');
  const [revertAuthPassword, setRevertAuthPassword] = useState('');
  const [showRevertPassword, setShowRevertPassword] = useState(false);
  const [revertAuthJustification, setRevertAuthJustification] = useState('');
  const [revertAuthLoading, setRevertAuthLoading] = useState(false);
  const [revertAuthError, setRevertAuthError] = useState('');

  // Estados do Modal de Aviso de Itens Vinculados em Expedição
  const [isLinkedItemsWarningOpen, setIsLinkedItemsWarningOpen] = useState(false);
  const [linkedItemsWarningData, setLinkedItemsWarningData] = useState<any>(null);
  const expeditionMoveBypass = useRef(false);

  // Ref que indica que o próximo move foi aprovado pelo Admin (bypass da verificação)
  const adminMoveOverride = useRef(false);

  // Estados do Modal de Equipe de Manuseio Responsável
  const [isHandlingTeamModalOpen, setIsHandlingTeamModalOpen] = useState(false);
  const [handlingTeamModalItem, setHandlingTeamModalItem] = useState<any>(null);
  const [handlingTeamModalTargetStageId, setHandlingTeamModalTargetStageId] = useState<string>('');
  const [selectedHandlingTeamId, setSelectedHandlingTeamId] = useState<string>('');
  const handlingTeamMoveBypass = useRef(false);
  const currentOperator = useRef<{ id: string; name: string } | null>(null);

  const getTimeInStage = (updatedAt: string) => {
    if (!updatedAt) return '—';
    const diffMs = Date.now() - new Date(updatedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} dia(s)`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} hora(s)`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins > 0) return `${diffMins} minuto(s)`;
    return 'poucos segundos';
  };

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

      const fetchedProducts = productsRes.data || [];
      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(fetchedProducts);
      setStages(stagesRes.data || []);

      const joinedItems = (itemsRes.data || []).map((item: any) => {
        const prod = fetchedProducts.find((p: any) => p.id === item.product_id) || item.product || null;
        return {
          ...item,
          product: prod
        };
      });
      setOrderItems(joinedItems);
      setAdjustments(adjRes.data || []);
      setCustomerCredits(credRes.data || []);
      setCustomerStocks(stockRes.data || []);
      setFinancialTransactions(finRes.data || []);

      // Chamadas opcionais — tabelas que podem não existir ainda (migração pendente)
      const [machResult, teamsResult, pmtResult, settingsResult, sectorsResult, shippingTypesResult] = await Promise.allSettled([
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId),
        getProductionSectors(tenantId),
        getShippingTypesConfig(tenantId)
      ]);

      if (machResult.status === 'fulfilled') setProductionMachines(machResult.value.data || []);
      if (sectorsResult.status === 'fulfilled' && sectorsResult.value.data && sectorsResult.value.data.length > 0) {
        setProductionSectors(sectorsResult.value.data);
      }
      if (teamsResult.status === 'fulfilled') setHandlingTeams(teamsResult.value.data || []);
      if (pmtResult.status === 'fulfilled') setPackagingMaterialTypes(pmtResult.value.data || []);
      if (shippingTypesResult.status === 'fulfilled') setShippingTypes(shippingTypesResult.value.data || []);
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
      return ordersRes.data || [];
    } catch (e) {
      console.error('Erro ao carregar dados da página de pedidos:', e);
      return [];
    } finally {
      setLoading(false);
    }
  };


  const fetchUserPermissions = async () => {
    if (!user || !supabase) return;
    try {
      if (user.role === 'Administrador' && !user.is_factory_account) {
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
  const [importStartDate, setImportStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('importStartDate');
      if (saved) return saved;
    }
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });
  const [importEndDate, setImportEndDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('importEndDate');
      if (saved) return saved;
    }
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('importStartDate', importStartDate);
      localStorage.setItem('importEndDate', importEndDate);
    }
  }, [importStartDate, importEndDate]);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ success: boolean; imported?: number; updated?: number; error?: string } | null>(null);
  const [activeAbortController, setActiveAbortController] = useState<AbortController | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isSyncingSingle, setIsSyncingSingle] = useState(false);

  const handleCancelSync = () => {
    if (activeAbortController) {
      activeAbortController.abort();
      setIsCancelled(true);
    }
  };

  const handleImportOrders = async () => {
    setIsSyncingSingle(false);
    setImporting(true);
    setIsSyncModalOpen(true);
    setSyncStep('Iniciando comunicação com Conta Azul...');
    setSyncProgress(5);
    setSyncResult(null);
    setIsCancelled(false);

    const controller = new AbortController();
    setActiveAbortController(controller);

    try {
      const queryParams = new URLSearchParams();
      if (importStartDate) queryParams.append('startDate', importStartDate);
      if (importEndDate) queryParams.append('endDate', importEndDate);

      const res = await fetch(`/api/sync/import-orders?${queryParams.toString()}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: user?.role }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error('Falha ao conectar com o serviço de importação.');
      }

      const reader = res.body?.getReader();
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
            if (line.trim()) {
              try {
                const chunk = JSON.parse(line);
                if (chunk.step) setSyncStep(chunk.step);
                if (chunk.progress !== undefined) setSyncProgress(chunk.progress);
                if (chunk.success !== undefined) {
                  if (chunk.success) {
                    setSyncProgress(100);
                    setSyncStep('Sincronização concluída com sucesso!');
                    setSyncResult({ success: true, imported: chunk.imported, updated: chunk.updated });
                    fetchAllData();
                  } else {
                    throw new Error(chunk.error || 'Erro desconhecido');
                  }
                }
              } catch (e) {
                console.error('Erro ao ler linha de progresso:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setSyncProgress(90);
        setSyncStep('Sincronização interrompida pelo usuário.');
        setSyncResult({ success: false, error: 'A importação local foi cancelada por você.' });
      } else {
        setSyncProgress(100);
        setSyncStep('Falha na sincronização.');
        setSyncResult({ success: false, error: err.message || 'Erro ao importar pedidos.' });
      }
    } finally {
      setImporting(false);
      setActiveAbortController(null);
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

  const handleOpAuthSuccess = async (operatorId: string, operatorName: string) => {
    setIsOpAuthOpen(false);
    
    currentOperator.current = { id: operatorId, name: operatorName };

    if (authActionType.current === 'save_details') {
      authActionType.current = 'kanban_move'; // reseta
      await executeDetailsSave(operatorId, operatorName);
    } else {
      if (!pendingKanbanMove) return;
      const { item, targetStageId } = pendingKanbanMove;
      setPendingKanbanMove(null);
      await moveOrderItemToStage(item, targetStageId, operatorId, operatorName);
    }
  };

  // Função auxiliar para resetar todos os bypasses de movimentação
  const resetAllBypasses = () => {
    freightBypass.current = false;
    conferencyBypass.current = false;
    productionAlertBypass.current = false;
    expeditionMoveBypass.current = false;
    handlingTeamMoveBypass.current = false;
    expeditionTransitionMoveBypass.current = false;
    inProgressOrderBypass.current = false;
    currentOperator.current = null;
  };

  // Movimentar item de pedido para uma etapa
  const moveOrderItemToStage = async (item: any, targetStageId: string, operatorId?: string | null, operatorName?: string | null) => {
    if (user?.role === 'Vendedor') {
      alert('Acesso de Leitura: Vendedores não podem movimentar cards no Kanban.');
      return;
    }
    // ---------------------------------------------------------------
    // RESOLVER OPERADOR AUTENTICADO DA MOVIMENTAÇÃO CORRENTE
    // ---------------------------------------------------------------
    const isAdmin = user?.role === 'Administrador';
    const activeOpId = operatorId || currentOperator.current?.id || (isAdmin ? user?.id : null);
    const activeOpName = operatorName || currentOperator.current?.name || (isAdmin ? (user?.full_name || user?.email) : null);

    // Se o operatorId veio como parâmetro direto da autenticação bem-sucedida, salvamos na ref
    if (operatorId && operatorName) {
      currentOperator.current = { id: operatorId, name: operatorName };
    }

    // ---------------------------------------------------------------
    // REGRA DE AUTENTICAÇÃO SECUNDÁRIA DO OPERADOR (EXIGIDO APENAS PARA NÃO-ADMINS)
    // ---------------------------------------------------------------
    if (!isAdmin && !activeOpId) {
      setPendingKanbanMove({ item, targetStageId });
      setIsOpAuthOpen(true);
      return;
    }

    const currentStageId = item.stage_id;
    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    const currentStage = stages.find(s => s.id === currentStageId);

    const parentOrder = orders.find(o => o.id === item.order_id) || item.order;

    // ---------------------------------------------------------------
    // REGRA DE SEGURANÇA: PEDIDO EM ANDAMENTO (NÃO APROVADO) NO CONTA AZUL
    // ---------------------------------------------------------------
    const isFromInitial = !currentStageId || currentStage?.name === 'Pedidos';
    const isMovingToProd = targetStage.name !== 'Pedidos';
    const isOrderInProgress = parentOrder?.conta_azul_status === 'Em andamento';

    if (isFromInitial && isMovingToProd && isOrderInProgress && !inProgressOrderBypass.current) {
      setInProgressItem(item);
      setInProgressTargetStageId(targetStageId);
      setIsOrderInProgressModalOpen(true);
      return;
    }

    // ---------------------------------------------------------------
    // REGRA DE VALIDAÇÃO DE FRETE (Qualquer etapa -> Expedição) - TRAVA ANTERIOR
    // ---------------------------------------------------------------
    if (targetStage.name === 'Expedição' && !freightBypass.current) {
      setFreightItem(item);
      setFreightTargetStageId(targetStageId);
      
      setFreightWeight(parentOrder?.package_weight !== undefined && parentOrder?.package_weight !== null ? String(parentOrder.package_weight) : '');
      setFreightLength(parentOrder?.package_length !== undefined && parentOrder?.package_length !== null ? String(parentOrder.package_length) : '');
      setFreightWidth(parentOrder?.package_width !== undefined && parentOrder?.package_width !== null ? String(parentOrder.package_width) : '');
      setFreightHeight(parentOrder?.package_height !== undefined && parentOrder?.package_height !== null ? String(parentOrder.package_height) : '');
      
      setSelectedShippingType(parentOrder?.shipping_type || '');
      setFreightBoxesCount(item.boxes_count !== undefined && item.boxes_count !== null ? String(item.boxes_count) : (parentOrder?.boxes_count !== undefined && parentOrder?.boxes_count !== null ? String(parentOrder.boxes_count) : ''));
      setFreightQtyPerBox(item.quantity_per_box !== undefined && item.quantity_per_box !== null ? String(item.quantity_per_box) : (parentOrder?.quantity_per_box !== undefined && parentOrder?.quantity_per_box !== null ? String(parentOrder.quantity_per_box) : ''));
      
      setIsFreightModalOpen(true);
      return;
    }

    // ---------------------------------------------------------------
    // REGRA DE CONFERÊNCIA FÍSICA OBRIGATÓRIA (Qualquer etapa -> Expedição)
    // ---------------------------------------------------------------
    if (targetStage.name === 'Expedição' && !conferencyBypass.current) {
      if (item.applied_adjustment_id) {
        setConferencyItem(item);
        setConferencyTargetStageId(targetStageId);
        setConferencyChecked(false);
        setLoading(true);
        try {
          const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
          const { data: credits } = await getCustomerStockCredits(item.order?.customer_id, undefined, tenantId);
          const appliedCredit = (credits || []).find((c: any) => c.id === item.applied_adjustment_id);
          if (appliedCredit) {
            setConferencyData(appliedCredit);
            setConferencyPhysicalQuantity(item.adjusted_production_quantity || item.print_run || 0);
            setIsConferencyModalOpen(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Erro ao buscar saldo acumulado aplicado para conferência:', err);
        } finally {
          setLoading(false);
        }
      }
    }

    // ---------------------------------------------------------------
    // REGRA DE ALERTA DE PRODUÇÃO (A produzir -> Em produção/Estoque)
    // ---------------------------------------------------------------
    const isMovingFromPedidosToProductionOrStock = 
      (!currentStage || currentStage.name === 'Pedidos' || currentStage.name === 'A produzir') && 
      (targetStage.name === 'Em produção' || targetStage.name === 'Estoque');

    if (isMovingFromPedidosToProductionOrStock && !productionAlertBypass.current) {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const customerId = item.order?.customer_id;
      const productId = item.product_id;

      if (customerId && productId) {
        setLoading(true);
        try {
          const { data: credits } = await getCustomerStockCredits(customerId, 'ATIVO', tenantId);
          const activeCredit = (credits || []).find((c: any) => c.product_id === productId);
          
          if (activeCredit) {
            setProductionAlertData(activeCredit);
            setProductionAlertItem(item);
            setProductionAlertTargetStageId(targetStageId);
            setIsProductionAlertModalOpen(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Erro ao buscar ajuste pendente no início da produção:', err);
        } finally {
          setLoading(false);
        }
      }
    }

    // Alerta de itens vinculados na expedição
    if (targetStage.name === 'Expedição' && !expeditionMoveBypass.current) {
      const siblingItems = orderItems.filter(i => i.order_id === item.order_id && i.id !== item.id);
      if (siblingItems.length > 0) {
        setLinkedItemsWarningData({ item, targetStageId, siblings: siblingItems });
        setIsLinkedItemsWarningOpen(true);
        return;
      }
    }

    // REGRA DE MANUSEIO: Vincular equipe de manuseio ao entrar na etapa 'Manuseio' vindos de 'Em produção' ou 'Estoque'
    if (targetStage.name === 'Manuseio' && 
        (currentStage?.name === 'Em produção' || currentStage?.name === 'Estoque') && 
        !handlingTeamMoveBypass.current) {
      
      setHandlingTeamModalItem(item);
      setHandlingTeamModalTargetStageId(targetStageId);
      setSelectedHandlingTeamId(item.handling_team_id || '');
      setIsHandlingTeamModalOpen(true);
      return;
    }

    // REGRA DE ENTRADA NA EXPEDIÇÃO: Perguntar sobre ocorrências de falta ou cortesia
    if (targetStage.name === 'Expedição' && 
        !expeditionTransitionMoveBypass.current) {
      
      setExpeditionTransitionItem(item);
      setExpeditionTransitionTargetStageId(targetStageId);
      setExpeditionTransitionType('NENHUM');
      setExpeditionTransitionQuantity(0);
      setExpeditionTransitionNotes(item.expedition_notes || '');
      setIsExpeditionTransitionModalOpen(true);
      return;
    }

    // ---------------------------------------------------------------
    // REGRA DE RETROCESSO: Janela de 10 minutos + aprovação do Admin
    // ---------------------------------------------------------------
    if (!adminMoveOverride.current) {
      const currentSeq: number = currentStage ? ((currentStage as any)?.sequence ?? 999) : 0;
      const targetSeq: number = (targetStage as any)?.sequence ?? 0;
      const isMovingBackward = targetSeq < currentSeq;

      if (isMovingBackward) {
        const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
        let lastMove: any = null;
        try {
          const raw = localStorage.getItem(`samppel_mv_${item.id}`);
          if (raw) lastMove = JSON.parse(raw);
        } catch {}

        const withinGrace =
          lastMove &&
          lastMove.movedByUserId === user?.id &&
          lastMove.fromStageId === targetStageId &&
          Date.now() - lastMove.movedAt < WINDOW_MS;

        if (!withinGrace) {
          // Exige aprovação do Administrador
          setPendingRevertItem(item);
          setPendingRevertTargetStageId(targetStageId);
          setRevertAuthEmail(user?.email || '');
          setRevertAuthPassword('');
          setShowRevertPassword(false);
          setRevertAuthJustification('');
          setRevertAuthError('');
          setIsRevertAuthModalOpen(true);
          return;
        }
      }
    }
    // Limpar o override após usar
    adminMoveOverride.current = false;
    // ---------------------------------------------------------------

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
    if (user && user.role !== 'Administrador' && !activeOpId) {
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

    // Regra básica de negócio: Alerta didático de pedido bloqueado (sem sinal) ao mover para produção
    const isProductionStage = ['Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Concluído', 'Atrasado'].includes(targetStage.name);
    
    if (isProductionStage) {
      const isParentPaid = !!item.order?.first_payment_date;
      const isOverdue = hasOverdueInstallments(item.order_id);
      
      if (!isParentPaid && !blockedPaymentBypass.current) {
        setBlockedPaymentItem(item);
        setBlockedPaymentTargetStageId(targetStageId);
        setIsBlockedPaymentModalOpen(true);
        return;
      }
      
      if (isOverdue && user?.role !== 'Administrador') {
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

      const targetStatus = getStatusForStageName(targetStage.name);
      const targetSector = getSectorForStageName(targetStage.name, item.production_sector);
      const updates: any = {
        stage_id: targetStageId,
        status: targetStatus,
        production_sector: targetSector,
        last_operator_id: activeOpId || null
      };

      if (selectedHandlingTeamId) {
        updates.handling_team_id = selectedHandlingTeamId;
      }

      const { error } = await updateOrderItem(item.id, updates);
      if (error) {
        alert('Erro ao mover item: ' + error.message);
      } else {
        // Sincronizar sub-itens vinculados (embalagens, acessórios) do mesmo pedido
        const boundSubItems = orderItems.filter(i => i.order_id === item.order_id && i.product?.bind_to_first_item === true);
        if (boundSubItems.length > 0) {
          try {
            await Promise.all(boundSubItems.map(sib => 
              updateOrderItem(sib.id, {
                stage_id: targetStageId,
                status: targetStatus,
                production_sector: targetSector,
                handling_team_id: updates.handling_team_id || sib.handling_team_id,
                last_operator_id: activeOpId || null
              })
            ));
          } catch (sibErr) {
            console.error('Erro ao sincronizar sub-itens vinculados:', sibErr);
          }
        }
        // REGRA DE INÍCIO DE PRODUÇÃO: Se saiu de Pedidos (coluna index 0) para outra coluna de produção,
        // inicializa a data de início da produção do pedido.
        const fromStageIdx = currentStageId ? stages.findIndex(s => s.id === currentStageId) : 0;
        const targetStageIdx = stages.findIndex(s => s.id === targetStageId);
        if (fromStageIdx === 0 && targetStageIdx > 0 && !item.order?.production_start_date) {
          const todayStr = new Date().toISOString().split('T')[0];
          await updateOrder(item.order_id, { production_start_date: todayStr });
        }

        if (item.production_sector !== targetSector) {
          const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
          await logSectorTransition(item.id, targetSector, item.machine_id, tenantId, activeOpId);
        }
        await fetchAllData();

        // Gravar o move no localStorage para a janela de retrocesso de 10 min
        try {
          localStorage.setItem(`samppel_mv_${item.id}`, JSON.stringify({
            fromStageId: currentStageId,
            toStageId: targetStageId,
            movedAt: Date.now(),
            movedByUserId: user?.id
          }));
        } catch {}

        setRecentlyMovedItemId(item.id);
        showToast(`${item.friendly_id || item.order?.pv_number || 'Pedido'} movimentado para "${targetStage.name}"`);

        setTimeout(() => {
          setRecentlyMovedItemId(null);
        }, 1500);

      }
    } catch (e) {
      console.error('Erro ao mover item:', e);
      alert('Erro ao mover item.');
    } finally {
      setSelectedHandlingTeamId('');
      setLoading(false);
      resetAllBypasses();
    }
  };

  const handleSyncSingleOrder = async (orderId: string) => {
    if (!orderId) return;
    const cleanPv = selectedOrder?.pv_number?.replace(/\D/g, '') || '';
    setSyncingOrderNumber(cleanPv);
    setIsSyncingSingle(true);
    setImporting(true);
    setIsSyncModalOpen(true);
    setSyncStep('Iniciando comunicação com o Conta Azul para este pedido...');
    setSyncProgress(5);
    setSyncResult(null);

    try {
      const res = await fetch('/api/sync/import-single-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userRole: user?.role })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Falha ao conectar com o serviço de importação.');
      }

      const reader = res.body?.getReader();
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
            if (line.trim()) {
              try {
                const chunk = JSON.parse(line);
                if (chunk.step) setSyncStep(chunk.step);
                if (chunk.progress !== undefined) setSyncProgress(chunk.progress);
                if (chunk.success !== undefined) {
                  const isSuccess = chunk.success && (!chunk.result || chunk.result.success !== false);
                  if (isSuccess) {
                    setSyncProgress(100);
                    setSyncStep('Sincronização concluída com sucesso!');
                    setSyncResult({ success: true });
                    
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
                    const [ordersRes, finRes] = await Promise.all([
                      getOrders(tenantId),
                      getFinancialTransactions(tenantId)
                    ]);
                    
                    if (ordersRes.data) {
                      setOrders(ordersRes.data);
                      const match = ordersRes.data.find((o: any) => o.id === orderId);
                      if (match) setSelectedOrder(match);
                    }
                    if (finRes.data) {
                      setFinancialTransactions(finRes.data);
                    }
                    
                    fetchAllData();
                  } else {
                    const errMsg = chunk.error || chunk.result?.message || 'Erro desconhecido ao sincronizar pedido.';
                    setSyncProgress(100);
                    setSyncStep('Falha na sincronização.');
                    setSyncResult({ success: false, error: errMsg });
                  }
                }
              } catch (e) {
                console.error('Erro ao ler linha de progresso:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setSyncProgress(100);
      setSyncStep('Falha na sincronização.');
      setSyncResult({ success: false, error: err.message || 'Erro ao importar pedido.' });
    } finally {
      setImporting(false);
    }
  };

  const handleSyncOrderByNumber = async (orderNumber: string) => {
    if (!orderNumber) return;
    setSyncingOrderNumber(orderNumber);
    setIsSyncingSingle(true);
    setImporting(true);
    setIsSyncModalOpen(true);
    setSyncStep(`Iniciando comunicação com o Conta Azul para o pedido ${orderNumber}...`);
    setSyncProgress(5);
    setSyncResult(null);

    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const res = await fetch('/api/sync/import-single-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, tenantId, userRole: user?.role })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Falha ao conectar com o serviço de importação.');
      }

      const reader = res.body?.getReader();
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
            if (line.trim()) {
              try {
                const chunk = JSON.parse(line);
                if (chunk.step) setSyncStep(chunk.step);
                if (chunk.progress !== undefined) setSyncProgress(chunk.progress);
                if (chunk.success !== undefined) {
                  const isSuccess = chunk.success && (!chunk.result || chunk.result.success !== false);
                  if (isSuccess) {
                    setSyncProgress(100);
                    setSyncStep('Sincronização concluída com sucesso!');
                    setSyncResult({ success: true });
                    setPullOrderNumber(''); // Limpar campo após puxar
                    
                    // Recarregar os dados para que o novo card apareça
                    const refreshedOrders = await fetchAllData();
                    
                    // Buscar o pv_number do pedido importado e setar automaticamente no filtro local
                    if (chunk.result && chunk.result.orderId && refreshedOrders) {
                      const importedOrder = refreshedOrders.find((o: any) => o.id === chunk.result.orderId);
                      if (importedOrder && importedOrder.pv_number) {
                        const cleanPv = importedOrder.pv_number.replace(/\D/g, '');
                        setFilterSearchOrder(cleanPv);
                      }
                    }
                  } else {
                    const errMsg = chunk.error || chunk.result?.message || 'Erro desconhecido ao sincronizar pedido.';
                    setSyncProgress(100);
                    setSyncStep('Falha na sincronização.');
                    setSyncResult({ success: false, error: errMsg });
                  }
                }
              } catch (e) {
                console.error('Erro ao ler linha de progresso:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setSyncProgress(100);
      setSyncStep('Falha na sincronização.');
      setSyncResult({ success: false, error: err.message || 'Erro ao importar pedido.' });
    } finally {
      setImporting(false);
    }
  };

  const handleSyncInProgressOrder = async () => {
    if (!inProgressItem) return;
    setInProgressSyncing(true);

    try {
      const parentOrder = orders.find(o => o.id === inProgressItem.order_id) || inProgressItem.order;
      if (!parentOrder?.id) throw new Error('Dados do pedido não encontrados.');

      const res = await fetch('/api/sync/import-single-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: parentOrder.id, userRole: user?.role })
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Falha ao conectar com o serviço de sincronização.');
      }

      const reader = res.body?.getReader();
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
              const chunk = JSON.parse(line);
              if (chunk.success === false) {
                throw new Error(chunk.error || 'Erro desconhecido ao sincronizar.');
              }
            } catch (e: any) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      // Recarregar os dados locais
      await fetchAllData();

      // Consultar de forma isolada e imediata o status do pedido atualizado no banco
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const { data: orderRes } = await getOrders(tenantId);
      const updatedOrder = (orderRes || []).find((o: any) => o.id === parentOrder.id);
      
      if (updatedOrder && updatedOrder.conta_azul_status !== 'Em andamento') {
        alert('Pedido atualizado no Conta Azul e agora consta como Aprovado! Iniciando a produção/separação...');
        setIsOrderInProgressModalOpen(false);
        inProgressOrderBypass.current = true;
        await moveOrderItemToStage(inProgressItem, inProgressTargetStageId);
      } else {
        alert('Sincronização concluída com sucesso, mas este pedido continua constando como "Em andamento" no Conta Azul.');
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar status de andamento:', err);
      alert('Erro ao sincronizar pedido: ' + (err.message || 'Erro desconhecido.'));
    } finally {
      setInProgressSyncing(false);
    }
  };

  const handleForceStartInProgressOrder = async () => {
    setIsOrderInProgressModalOpen(false);
    inProgressOrderBypass.current = true;
    await moveOrderItemToStage(inProgressItem, inProgressTargetStageId);
  };

  const handleCancelInProgressOrder = () => {
    setIsOrderInProgressModalOpen(false);
    setInProgressItem(null);
    setInProgressTargetStageId('');
    resetAllBypasses();
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
        notes: adjustmentNotes,
        created_by_name: user?.full_name || user?.email || 'Sistema'
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
          notes: `Abatimento efetuado: Consumidos ${qtyToConsume} de crédito de falta pendente do PV original.`,
          created_by_name: user?.full_name || user?.email || 'Sistema'
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
          notes: `Despacho de estoque: Consumidos ${qtyToConsume} sacos do estoque de personalizados na fábrica.`,
          created_by_name: user?.full_name || user?.email || 'Sistema'
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
          notes: `Decisão de início de produção: Mantido crédito/estoque intacto para produzir tiragem completa solicitada.`,
          created_by_name: user?.full_name || user?.email || 'Sistema'
        });
      }

      // 2. Mover o card para a etapa correspondente
      const targetStage = stages.find(s => s.id === suggestionTargetStageId);
      const targetStatus = targetStage ? getStatusForStageName(targetStage.name) : 'Em produção';
      const updates = {
        stage_id: suggestionTargetStageId,
        status: targetStatus,
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

  // =========================================================================
  // MOTOR DE ARRASTO CUSTOMIZADO (POINTER EVENTS DND - TIPO TRELLO/GODELLO)
  // =========================================================================

  const cleanupCustomDrag = () => {
    if (dragCloneRef.current && dragCloneRef.current.parentNode) {
      dragCloneRef.current.parentNode.removeChild(dragCloneRef.current);
    }
    dragCloneRef.current = null;
    activeDragItemId.current = null;
    setDraggedItemId(null);
    setDragOverStageId(null);
    setDragOverIndex(null);
    
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (e: React.PointerEvent, item: any) => {
    // Apenas botão esquerdo do mouse ou toque
    if (e.button !== 0) return;

    // Ignora se clicou em um botão (ex: botão Edit, Copiar PV)
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    // PREVENIR comportamento padrão (seleção de texto/HTML5 drag)
    e.preventDefault();

    const currentTarget = e.currentTarget as HTMLElement;
    const rect = currentTarget.getBoundingClientRect();
    
    // Calcula o offset (onde exatamente o mouse pegou no card)
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Cria o clone físico 100% sólido
    const clone = currentTarget.cloneNode(true) as HTMLElement;
    clone.id = 'custom-pointer-clone';
    clone.style.position = 'fixed';
    clone.style.top = '0px';
    clone.style.left = '0px';
    clone.style.width = `${rect.width}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = 'var(--surface)';
    clone.style.border = '2px solid var(--primary)';
    clone.style.borderRadius = '8px';
    clone.style.boxShadow = 'var(--shadow-premium)';
    clone.style.opacity = '1';
    clone.style.zIndex = '999999';
    clone.style.pointerEvents = 'none'; // Ignora cliques para podermos detectar os elementos embaixo!
    clone.style.transition = 'none'; // Desliga transições CSS para não engasgar o movimento
    clone.style.transform = `translate3d(${e.clientX - dragOffset.current.x}px, ${e.clientY - dragOffset.current.y}px, 0) rotate(3deg)`;
    
    document.body.appendChild(clone);
    
    dragCloneRef.current = clone;
    activeDragItemId.current = item.id;
    
    setDraggedItemId(item.id);

    // Registra eventos no document para seguir fora do card
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    e.preventDefault();
    if (!dragCloneRef.current || !activeDragItemId.current) return;

    // Atualiza a posição do clone (60FPS, sem state do React)
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    dragCloneRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(3deg)`;

    // Encontra a coluna debaixo do mouse
    // Como o clone tem pointerEvents: 'none', ele pega a coluna debaixo!
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    if (!elementBelow) return;

    const column = elementBelow.closest('.kanban-column');
    if (column) {
      const stageId = column.getAttribute('data-stage-id');
      if (stageId) {
        setDragOverStageId(stageId);
        
        // Lógica de Indexação (Opcional, para placeholder exato)
        const cards = Array.from(column.querySelectorAll('.kanban-card-base'));
        let foundIndex = cards.length;
        for (let i = 0; i < cards.length; i++) {
          const cardRect = cards[i].getBoundingClientRect();
          const midY = cardRect.top + cardRect.height / 2;
          if (e.clientY < midY) {
            foundIndex = i;
            break;
          }
        }
        setDragOverIndex(foundIndex);
      }
    } else {
      setDragOverStageId(null);
    }
  };

  const handlePointerUp = async (e: PointerEvent) => {
    const itemId = activeDragItemId.current;
    
    // Encontra a coluna alvo
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    let targetStageId = null;
    
    if (elementBelow) {
      const column = elementBelow.closest('.kanban-column');
      if (column) {
        targetStageId = column.getAttribute('data-stage-id');
      }
    }

    // Limpa a interface visual
    cleanupCustomDrag();

    if (itemId && targetStageId) {
      const itemToMove = orderItems.find(i => i.id === itemId);
      if (itemToMove && itemToMove.stage_id !== targetStageId) {
        await moveOrderItemToStage(itemToMove, targetStageId);
      }
    }
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
    setDetailShortage(item.shortage_quantity || 0);
    setDetailCourtesy(item.courtesy_quantity || 0);
    setDetailExpeditionNotes(item.expedition_notes || '');
    setIsDetailModalOpen(true);
  };

  const handleSaveExpeditionDetails = async () => {
    if (!detailItem) return;
    setSavingExpeditionDetails(true);
    try {
      const { error } = await updateOrderItem(detailItem.id, {
        shortage_quantity: detailShortage,
        courtesy_quantity: detailCourtesy,
        expedition_notes: detailExpeditionNotes || null
      });

      if (error) {
        alert('Erro ao salvar informações de expedição: ' + error.message);
      } else {
        // Atualizar o item localmente para refletir a mudança imediata no modal de detalhes
        setDetailItem((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            shortage_quantity: detailShortage,
            courtesy_quantity: detailCourtesy,
            expedition_notes: detailExpeditionNotes || null
          };
        });
        await fetchAllData();
        alert('Informações de expedição salvas com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao salvar dados de expedição:', err);
      alert('Erro ao salvar dados de expedição.');
    } finally {
      setSavingExpeditionDetails(false);
    }
  };

  // Submeter aprovacao do Administrador para retrocesso de etapa
  const handleRevertAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevertAuthLoading(true);
    setRevertAuthError('');

    try {

      // Validar credenciais do Admin via cliente Supabase temporário
      // (sem afetar a sessão atual do usuário logado)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
        email: revertAuthEmail.trim(),
        password: revertAuthPassword
      });

      if (authError || !authData?.user) {
        setRevertAuthError('Credenciais inválidas. Verifique o e-mail e senha do Administrador.');
        return;
      }

      // Verificar se o usuário autenticado é Administrador
      const { data: adminProfile, error: profileError } = await tempClient
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      // Encerrar sessão temporária imediatamente após a verificação
      await tempClient.auth.signOut();

      if (profileError || !adminProfile) {
        setRevertAuthError('Não foi possível verificar o perfil do Administrador.');
        return;
      }

      if (adminProfile.role !== 'Administrador') {
        setRevertAuthError(`O usuário "${adminProfile.full_name}" não tem perfil de Administrador.`);
        return;
      }

      // Aprovado! Ativar override e executar o retrocesso
      adminMoveOverride.current = true;
      setIsRevertAuthModalOpen(false);

      // Pequena pausa para o estado fechar o modal antes de iniciar o move
      await new Promise(r => setTimeout(r, 80));

      if (pendingRevertItem && pendingRevertTargetStageId) {
        await moveOrderItemToStage(pendingRevertItem, pendingRevertTargetStageId);
      }

      setPendingRevertItem(null);
      setPendingRevertTargetStageId('');
      setRevertAuthEmail('');
      setRevertAuthPassword('');
      setRevertAuthJustification('');
    } catch (err: any) {
      console.error('Erro ao validar credenciais do Admin:', err);
      setRevertAuthError('Erro inesperado ao validar credenciais.');
    } finally {
      setRevertAuthLoading(false);
    }
  };

  // Confirmação de movimentação para expedição com múltiplos itens vinculados
  const handleConfirmExpeditionMoveAll = async () => {
    if (!linkedItemsWarningData) return;
    const { item, siblings, targetStageId } = linkedItemsWarningData;
    setIsLinkedItemsWarningOpen(false);
    setLinkedItemsWarningData(null);
    
    // Captura o operador autenticado do PIN antes de chamar as funções que limpam a ref!
    const savedOpId = currentOperator.current?.id;
    const savedOpName = currentOperator.current?.name;

    setLoading(true);
    try {
      expeditionMoveBypass.current = true;
      freightBypass.current = true;
      conferencyBypass.current = true;
      productionAlertBypass.current = true;
      handlingTeamMoveBypass.current = true;
      expeditionTransitionMoveBypass.current = true;
      adminMoveOverride.current = true;

      // 1. Mover o item principal
      await moveOrderItemToStage(item, targetStageId, savedOpId, savedOpName);

      // 2. Mover todos os irmãos
      for (const sib of siblings) {
        const fullSib = orderItems.find(oi => oi.id === sib.id);
        if (fullSib) {
          expeditionMoveBypass.current = true;
          freightBypass.current = true;
          conferencyBypass.current = true;
          productionAlertBypass.current = true;
          handlingTeamMoveBypass.current = true;
          expeditionTransitionMoveBypass.current = true;
          adminMoveOverride.current = true;
          
          await moveOrderItemToStage(fullSib, targetStageId, savedOpId, savedOpName);
        }
      }
    } catch (err) {
      console.error('Erro ao mover todos os subitens:', err);
      alert('Ocorreu um erro ao tentar mover todos os subitens.');
    } finally {
      resetAllBypasses();
      setLoading(false);
    }
  };

  const handleConfirmExpeditionMove = async () => {
    if (!linkedItemsWarningData) return;
    const { item, targetStageId } = linkedItemsWarningData;
    setIsLinkedItemsWarningOpen(false);
    setLinkedItemsWarningData(null);
    
    const savedOpId = currentOperator.current?.id;
    const savedOpName = currentOperator.current?.name;

    expeditionMoveBypass.current = true;
    await moveOrderItemToStage(item, targetStageId, savedOpId, savedOpName);
    expeditionMoveBypass.current = false;
  };

  // ==========================================
  // OPERAÇÕES CRUD DE SETORES DE PRODUÇÃO
  // ==========================================
  const reloadSectors = async () => {
    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
    const { data, error } = await getProductionSectors(tenantId);
    if (!error && data) {
      setProductionSectors(data.length > 0 ? data : [
        { id: 'sec-default-1', name: 'Impressão' },
        { id: 'sec-default-2', name: 'Corte e Vinco' },
        { id: 'sec-default-3', name: 'Colagem' },
        { id: 'sec-default-4', name: 'Guilhotina' },
        { id: 'sec-default-5', name: 'Manuseio' },
        { id: 'sec-default-6', name: 'Expedição' },
        { id: 'sec-default-7', name: 'Concluído' },
        { id: 'sec-default-8', name: 'Estoque' }
      ]);
    }
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorFormName.trim()) return;

    setSavingSector(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingSector) {
        // Edit mode
        const { error } = await updateProductionSector(editingSector.id, {
          name: sectorFormName.trim(),
          status: sectorFormStatus
        });
        if (error) {
          alert('Erro ao atualizar setor: ' + error.message);
        } else {
          setEditingSector(null);
          setSectorFormName('');
          await reloadSectors();
        }
      } else {
        // Create mode
        const { error } = await createProductionSector({
          tenant_id: tenantId,
          name: sectorFormName.trim(),
          status: sectorFormStatus
        });
        if (error) {
          alert('Erro ao criar setor: ' + error.message);
        } else {
          setSectorFormName('');
          await reloadSectors();
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar setor:', err);
    } finally {
      setSavingSector(false);
    }
  };

  const handleDeleteSector = async (id: string) => {
    const secToDelete = productionSectors.find(s => s.id === id);
    if (!secToDelete) return;
    
    // Verificar se tem máquina associada
    const hasMachine = productionMachines.some(m => m.sector === secToDelete.name);
    if (hasMachine) {
      alert(`Não é possível excluir o setor "${secToDelete.name}" pois há máquinas vinculadas a ele. Remova ou altere as máquinas primeiro.`);
      return;
    }

    if (confirm(`Deseja realmente excluir o setor de produção "${secToDelete.name}"?`)) {
      const { error } = await deleteProductionSector(id);
      if (error) {
        alert('Erro ao excluir setor: ' + error.message);
      } else {
        await reloadSectors();
      }
    }
  };

  // ==========================================
  // OPERAÇÕES CRUD DE MÁQUINAS DE PRODUÇÃO
  // ==========================================
  const reloadMachines = async () => {
    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
    const { data } = await getProductionMachines(tenantId);
    if (data) {
      setProductionMachines(data);
    }
  };

  const handleSaveMachineForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineFormName.trim()) return;

    setSavingMachine(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingMachineState) {
        // Edit mode
        const { error } = await updateProductionMachine(editingMachineState.id, {
          name: machineFormName.trim(),
          sector: machineFormSector,
          status: machineFormStatus
        });
        if (error) {
          alert('Erro ao atualizar máquina: ' + error.message);
        } else {
          setEditingMachineState(null);
          setMachineFormName('');
          await reloadMachines();
        }
      } else {
        // Create mode
        const { error } = await createProductionMachine({
          tenant_id: tenantId,
          name: machineFormName.trim(),
          sector: machineFormSector,
          status: machineFormStatus
        });
        if (error) {
          alert('Erro ao criar máquina: ' + error.message);
        } else {
          setMachineFormName('');
          await reloadMachines();
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar máquina:', err);
    } finally {
      setSavingMachine(false);
    }
  };

  const handleDeleteMachineForm = async (id: string) => {
    const machToDelete = productionMachines.find(m => m.id === id);
    if (!machToDelete) return;

    if (confirm(`Deseja realmente excluir a máquina "${machToDelete.name}"?`)) {
      const { error } = await deleteProductionMachine(id);
      if (error) {
        alert('Erro ao excluir máquina: ' + error.message);
      } else {
        await reloadMachines();
      }
    }
  };

  // Abrir modal para Edição
  const handleOpenEdit = (entity: any) => {
    // Segurança: se for operador do setor de Produção, só pode editar cards na etapa "Em produção"
    if (user?.role === 'Produção') {
      const itemStage = stages.find(s => s.id === entity.stage_id);
      if (!entity.order_id || itemStage?.name !== 'Em produção') {
        alert('Operadores do setor de Produção só possuem permissão para editar cards na etapa "Em produção".');
        return;
      }
    }

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

  const executeDetailsSave = async (opId?: string | null, opName?: string | null) => {
    if (!selectedItem) return;

    const activeOpId = opId || currentOperator.current?.id || user?.id;

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
    } else if (user?.role === 'Produção' || user?.role === 'Fábrica' || user?.role === 'Estoque' || user?.role === 'Expedição') {
      orderPayload = {
        internal_notes: formInternalNotes
      };
    } else {
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
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

      // Log de transição se houver mudança de setor ou de máquina
      const sectorChanged = selectedItem.production_sector !== formSector;
      const machineChanged = selectedItem.machine_id !== formMachineId;
      if (sectorChanged || machineChanged) {
        await logSectorTransition(selectedItem.id, formSector, formMachineId || null, tenantId, activeOpId);
      }

      // Log de transição de Observações Gerais
      const notesChanged = selectedItem.notes !== formNotes;
      if (notesChanged) {
        await logNotesTransition(selectedItem.id, 'OBSERVACOES', selectedItem.notes || '', formNotes || '', tenantId, activeOpId);
      }

      // Log de transição de Anotações Internas
      const oldInternalNotes = selectedItem.order?.internal_notes || '';
      const internalNotesChanged = oldInternalNotes !== formInternalNotes;
      if (internalNotesChanged) {
        await logNotesTransition(selectedItem.id, 'ANOTACOES_INTERNAS', oldInternalNotes, formInternalNotes || '', tenantId, activeOpId);
      }

      setIsModalOpen(false);
      fetchAllData();
    }
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
        // Se for operador de produção/fábrica e alterou máquina, setor, observações ou anotações internas, exige autenticação secundária
        const isFactoryUser = user?.role === 'Produção' || user?.role === 'Fábrica' || user?.is_factory_account;
        const sectorChanged = selectedItem.production_sector !== formSector;
        const machineChanged = selectedItem.machine_id !== formMachineId;
        const notesChanged = selectedItem.notes !== formNotes;
        const internalNotesChanged = (selectedItem.order?.internal_notes || '') !== formInternalNotes;
        const activeOpId = currentOperator.current?.id;

        if (isFactoryUser && (sectorChanged || machineChanged || notesChanged || internalNotesChanged) && !activeOpId) {
          authActionType.current = 'save_details';
          setIsOpAuthOpen(true);
          return;
        }

        await executeDetailsSave(activeOpId);
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
  const hideMonetaryValues = user?.role !== 'Administrador' && user?.role !== 'Vendedor' && !(user?.role === 'Comercial' && !isSupervisor);

  const cleanPvForMatch = (pv: string) => {
    return (pv || '').split('/')[0].trim().toLowerCase();
  };

  // Lógica de Filtros
  const filteredOrders = orders.filter(order => {
    if (isVendedor && user) {
      const userFirstName = user.full_name.split(' ')[0].toLowerCase();
      const sellerNameLower = (order.seller_name || '').toLowerCase();
      if (!sellerNameLower.includes(userFirstName)) return false;
    }
    const matchCustomer = filterCustomer ? (order.customer?.name || '').toLowerCase().includes(filterCustomer.toLowerCase()) : true;
    const matchSeller = filterSeller ? order.seller_name.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchSearchOrder = filterSearchOrder ? (
      cleanPvForMatch(order.pv_number || '') === `pv-${filterSearchOrder.toLowerCase()}` ||
      cleanPvForMatch(order.pv_number || '') === filterSearchOrder.toLowerCase()
    ) : true;
    const matchContaAzulStatus = filterContaAzulStatus ? order.conta_azul_status === filterContaAzulStatus : true;
    return matchCustomer && matchSeller && matchSearchOrder && matchContaAzulStatus;
  });

  // Lógica de Filtros para Itens no Kanban
  const filteredOrderItems = orderItems.filter(item => {
    // Não exibir cards de itens de produto configurados para vincular ao primeiro item
    if (item.product?.bind_to_first_item === true) return false;

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

    const matchCustomer = filterCustomer ? (parentOrder.customer?.name || '').toLowerCase().includes(filterCustomer.toLowerCase()) : true;
    const matchSeller = filterSeller ? parentOrder.seller_name?.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchSearchOrder = filterSearchOrder ? (
      cleanPvForMatch(parentOrder.pv_number || '') === `pv-${filterSearchOrder.toLowerCase()}` ||
      cleanPvForMatch(parentOrder.pv_number || '') === filterSearchOrder.toLowerCase() ||
      cleanPvForMatch(item.friendly_id || '') === `pv-${filterSearchOrder.toLowerCase()}` ||
      cleanPvForMatch(item.friendly_id || '') === filterSearchOrder.toLowerCase()
    ) : true;
    const matchContaAzulStatus = filterContaAzulStatus ? parentOrder.conta_azul_status === filterContaAzulStatus : true;

    // Filtro para a Fase "Pedidos" / Liberação
    let matchPedidosRelease = true;
    if (filterPedidosRelease) {
      const isReleased = !!parentOrder.first_payment_date;
      const hasAuth = !!extractAuthorization(item.notes || parentOrder.notes);
      if (filterPedidosRelease === 'liberados') matchPedidosRelease = isReleased;
      else if (filterPedidosRelease === 'bloqueados') matchPedidosRelease = !isReleased;
      else if (filterPedidosRelease === 'autorizados') matchPedidosRelease = hasAuth;
    }

    // Filtro de Etapa do Kanban
    let matchStage = true;
    if (filterStage) {
      const currentStage = stages.find(s => s.id === item.stage_id);
      const stageName = currentStage?.name || 'Pedidos';
      matchStage = stageName.toLowerCase() === filterStage.toLowerCase();
    }

    return matchCustomer && matchSeller && matchSearchOrder && matchContaAzulStatus && matchPedidosRelease && matchStage;
  });

  const getFreightBadgeStyle = (shippingType: string) => {
    switch (shippingType) {
      case 'LALAMOVE':
      case 'MOTOBOY':
        return { backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)', color: 'hsl(271, 91.2%, 65.1%)', label: 'Lalamove/Moto' };
      case 'ENTREGA_PROPRIA':
        return { backgroundColor: 'hsla(24, 95.8%, 53.1%, 0.15)', color: 'hsl(24, 95.8%, 53.1%)', label: 'Carro Próprio' };
      case 'TRANSPORTADORA':
      case 'TRANSPORTADORA_LONGA':
        return { backgroundColor: 'hsla(221.2, 83.2%, 53.3%, 0.15)', color: 'hsl(221.2, 83.2%, 53.3%)', label: 'Transportadora' };
      case 'RETIRADA':
      default:
        return { backgroundColor: 'hsla(215.4, 16.3%, 46.9%, 0.15)', color: 'hsl(215.4, 16.3%, 46.9%)', label: 'Retirada' };
    }
  };

  const visibleStages = stages.filter(stage => {
    if (!user) return true;
    if (user.role === 'Produção' || user.role === 'Fábrica') {
      return stage.name !== 'Pedidos';
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
    
    // Se o usuário for Produção ou Fábrica:
    if (user?.role === 'Produção' || user?.role === 'Fábrica') {
      // Eles podem alterar o Setor de Produção Física, a Máquina Vinculada, Observações e Anotações Internas
      if (field === 'sector' || field === 'machine_id' || field === 'notes' || field === 'internalNotes') {
        return false;
      }
      return true;
    }

    // Estoque e Expedição não possuem permissão de edição em nenhum campo do pedido
    if (user?.role === 'Estoque' || user?.role === 'Expedição') {
      return true;
    }
    
    if (user?.role === 'Financeiro') {
      return !['status', 'firstPaymentDate', 'installmentsPaid', 'installmentsTotal', 'productionStartDate', 'internalNotes'].includes(field);
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
    <div 
      className="page-container"
      style={viewMode === 'kanban' ? {
        height: 'calc(100vh - 4rem)',
        maxHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: '1rem',
        paddingBottom: '1rem'
      } : undefined}
    >
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Pedidos & Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Acompanhe a produção física pelo Kanban ou gerencie o status de faturamento na listagem.
          </p>
        </div>
        
        {!['Produção', 'Fábrica'].includes(user?.role || '') && (
          <div className="page-header-actions">
            <div className="import-action-bar">
              {/* Opção 1: Importar por Período */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', paddingLeft: '0.25rem', whiteSpace: 'nowrap' }}>Importar Período:</span>
                <input 
                  type="date" 
                  value={importStartDate} 
                  onChange={(e) => setImportStartDate(e.target.value)}
                  disabled={importing}
                  style={{
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none',
                    width: '110px'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>a</span>
                <input 
                  type="date" 
                  value={importEndDate} 
                  onChange={(e) => setImportEndDate(e.target.value)}
                  disabled={importing}
                  style={{
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none',
                    width: '110px'
                  }}
                />
                <button 
                  onClick={handleImportOrders} 
                  disabled={importing}
                  className="btn btn-secondary" 
                  style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  <RefreshCw size={12} className={importing ? 'spinner' : ''} />
                  <span>{importing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
              </div>

              {/* Divisor Vertical */}
              <div className="import-divider-vertical" style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)', alignSelf: 'center' }} />

              {/* Opção 2: Importar Pedido por Número */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                  <Download size={12} />
                  Importar Nº:
                </span>
                <input 
                  type="text" 
                  placeholder="Ex: 406"
                  value={pullOrderNumber} 
                  onChange={(e) => setPullOrderNumber(e.target.value)}
                  disabled={importing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSyncOrderByNumber(pullOrderNumber);
                    }
                  }}
                  style={{
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.75rem',
                    width: '75px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={() => handleSyncOrderByNumber(pullOrderNumber)} 
                  disabled={importing || !pullOrderNumber.trim()}
                  className="btn btn-secondary" 
                  style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  <Download size={12} />
                  <span>Importar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* BARRA DE FILTROS RESPONSIVA */}
      {(() => {
        const activeFiltersCount = [
          filterCustomer,
          filterSeller,
          filterContaAzulStatus,
          filterPedidosRelease,
          filterStage
        ].filter(Boolean).length;

        return (
          <div className="filter-bar">
            {/* Linha Superior (Sempre Visível): Busca PV + Toggle Kanban/Lista + Botão Filtros Mobile */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Alternador de Modo de Visualização */}
              <div style={{ display: 'flex', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '2px', height: '36px', alignItems: 'center' }}>
                <button
                  onClick={() => setViewMode('kanban')}
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    height: '100%',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: viewMode === 'kanban' ? 'var(--surface)' : 'transparent',
                    color: viewMode === 'kanban' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'kanban' ? 'var(--shadow-sm)' : 'none',
                    fontWeight: viewMode === 'kanban' ? 600 : 500
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    border: 'none',
                    height: '100%',
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

              {/* Busca de Pedidos por PV / OP */}
              <div style={{ flex: 1, minWidth: '160px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pesquisar PV/OP..."
                  value={filterSearchOrder}
                  onChange={(e) => setFilterSearchOrder(e.target.value)}
                  style={{ height: '36px', fontSize: '0.825rem', padding: '0.4rem 0.75rem' }}
                />
              </div>

              {/* Botão de Filtros no Celular */}
              <button
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="btn btn-secondary mobile-only-flex"
                style={{
                  height: '36px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.78rem',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 600,
                  backgroundColor: isMobileFiltersOpen || activeFiltersCount > 0 ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                  borderColor: isMobileFiltersOpen || activeFiltersCount > 0 ? 'var(--primary)' : 'var(--border)',
                  color: isMobileFiltersOpen || activeFiltersCount > 0 ? 'var(--primary)' : 'var(--text)'
                }}
              >
                <Filter size={14} />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '99px',
                    padding: '1px 6px',
                    lineHeight: 1
                  }}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

            </div>

            {/* Grupo de Filtros Expandível (Desktop Inline / Mobile Collapsible) */}
            <div className={`filter-bar-expandable ${isMobileFiltersOpen ? 'is-open' : ''}`}>
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cliente..."
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vendedora</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vendedora..."
                  value={filterSeller}
                  onChange={(e) => setFilterSeller(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Situação</label>
                <select
                  className="form-select"
                  value={filterContaAzulStatus}
                  onChange={(e) => setFilterContaAzulStatus(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Faturado">Faturado</option>
                  <option value="Recusado">Recusado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Liberação</label>
                <select
                  className="form-select"
                  value={filterPedidosRelease}
                  onChange={(e) => setFilterPedidosRelease(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="liberados">Liberados</option>
                  <option value="bloqueados">Bloqueados</option>
                  <option value="autorizados">Com Autorização</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Etapa</label>
                <select
                  className="form-select"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                >
                  <option value="">Todas as Etapas</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ height: '34px', fontSize: '0.75rem', padding: '0.3rem 0.6rem', alignSelf: 'flex-end' }}
                  onClick={() => {
                    setFilterCustomer('');
                    setFilterSeller('');
                    setFilterSearchOrder('');
                    setFilterContaAzulStatus('');
                    setFilterPedidosRelease('');
                    setFilterStage('');
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('pedidos_filter_customer');
                      localStorage.removeItem('pedidos_filter_seller');
                      localStorage.removeItem('pedidos_filter_search');
                      localStorage.removeItem('pedidos_filter_conta_azul');
                      localStorage.removeItem('pedidos_filter_release');
                      localStorage.removeItem('pedidos_filter_stage');
                    }
                  }}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        );
      })()}


      {loading && orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* 1. VISUALIZAÇÃO KANBAN */
        <div 
          className="no-scrollbar kanban-board-container"
          style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            width: '100%',
            flex: 1,
            minHeight: 0,
            alignItems: 'stretch',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginTop: '1rem'
          }}
        >
          {(() => {
            const columns = [...visibleStages.map((s) => ({ ...s, isVirtual: false, originalIdx: stages.findIndex(stg => stg.id === s.id) }))];
            if (columns.length > 0) {
              columns.push({
                id: 'virtual-delayed',
                name: 'Atrasados',
                color: '#ef4444',
                isVirtual: true,
                originalIdx: -1
              } as any);

            }
            return columns.map((stage) => {
              const isVirtual = stage.isVirtual;
              const originalIdx = stage.originalIdx;
              const stageItemsRaw = isVirtual
                ? filteredOrderItems.filter(item => checkIsDelayed(item, stages))
                : filteredOrderItems.filter(item =>
                    item.stage_id === stage.id || (!item.stage_id && originalIdx === 0)
                  );

            const sortDir = columnSortDirs[stage.id] || 'asc';
            const isFirstColumn = originalIdx === 0;

            const stageItems = [...stageItemsRaw].sort((a, b) => {
              const aDate = new Date(a.order?.order_date || 0).getTime();
              const bDate = new Date(b.order?.order_date || 0).getTime();
              const aAprovado = (a.order?.conta_azul_status || '').toLowerCase() === 'aprovado';
              const bAprovado = (b.order?.conta_azul_status || '').toLowerCase() === 'aprovado';

              // Regra de prioridade da primeira coluna:
              // Se possuir autorização "AUT." E o pagamento estiver recebido, vai pro topo absoluto.
              if (isFirstColumn) {
                const aAuth = extractAuthorization(a.notes || a.order?.notes);
                const bAuth = extractAuthorization(b.notes || b.order?.notes);
                const aReleased = !!a.order?.first_payment_date;
                const bReleased = !!b.order?.first_payment_date;

                const aPriority = !!aAuth && aReleased;
                const bPriority = !!bAuth && bReleased;

                if (aPriority && !bPriority) return -1;
                if (!aPriority && bPriority) return 1;

                // Caso empatem em prioridade, mantém a ordenação por Aprovados
                if (aAprovado && !bAprovado) return -1;
                if (!aAprovado && bAprovado) return 1;
              }

              return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
            });

            const isEmpty = stageItems.length === 0;

            return (
              <div
                key={stage.id}
                className="kanban-column"
                data-stage-id={stage.id}

                style={{
                  flex: isEmpty ? '0 0 140px' : '1 1 280px',
                  minWidth: isEmpty ? '140px' : '260px',
                  maxWidth: isEmpty ? '140px' : '450px',
                  backgroundColor: isEmpty ? 'hsla(0, 0%, 50%, 0.02)' : 'var(--background)',
                  border: isVirtual 
                    ? '2px dashed var(--danger)' 
                    : isEmpty ? '1px dashed var(--border)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  height: '100%',
                  maxHeight: '100%',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  position: 'relative'
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
                          color: isVirtual ? 'var(--danger)' : 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px'
                        }}
                        title={stage.name}
                      >
                        {stage.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span className={`badge ${isVirtual ? 'badge-danger' : 'badge-secondary'}`} style={{ fontSize: '0.65rem', padding: '1px 5px', fontWeight: 600 }}>
                        {stageItems.length}
                      </span>
                      {/* Sort toggle button */}
                      {!isVirtual && (
                        <button
                          title={columnSortDirs[stage.id] === 'desc' ? 'Mais novos primeiro' : 'Mais antigos primeiro'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setColumnSortDirs(prev => ({
                              ...prev,
                              [stage.id]: prev[stage.id] === 'desc' ? 'asc' : 'desc'
                            }));
                          }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '1px 3px',
                            display: 'flex', alignItems: 'center',
                            borderRadius: '3px',
                            transition: 'color 0.15s ease',
                            fontSize: '0.65rem', lineHeight: 1
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          {columnSortDirs[stage.id] === 'desc' ? '↓' : '↑'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick filter chips para a coluna "Pedidos" */}
                  {(isFirstColumn || stage.name === 'Pedidos') && (
                    <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => setFilterPedidosRelease('')}
                        style={{
                          fontSize: '0.6rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: filterPedidosRelease === '' ? '1px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: filterPedidosRelease === '' ? 'var(--surface)' : 'transparent',
                          color: filterPedidosRelease === '' ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: filterPedidosRelease === '' ? 700 : 500,
                          lineHeight: '1.2'
                        }}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFilterPedidosRelease('liberados')}
                        style={{
                          fontSize: '0.6rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: filterPedidosRelease === 'liberados' ? '1px solid #10b981' : '1px solid var(--border)',
                          backgroundColor: filterPedidosRelease === 'liberados' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          color: filterPedidosRelease === 'liberados' ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: filterPedidosRelease === 'liberados' ? 700 : 500,
                          lineHeight: '1.2'
                        }}
                        title="Filtrar apenas pedidos liberados para produção"
                      >
                        Liberados
                      </button>
                      <button
                        onClick={() => setFilterPedidosRelease('bloqueados')}
                        style={{
                          fontSize: '0.6rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: filterPedidosRelease === 'bloqueados' ? '1px solid #ef4444' : '1px solid var(--border)',
                          backgroundColor: filterPedidosRelease === 'bloqueados' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                          color: filterPedidosRelease === 'bloqueados' ? '#ef4444' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: filterPedidosRelease === 'bloqueados' ? 700 : 500,
                          lineHeight: '1.2'
                        }}
                        title="Filtrar apenas pedidos bloqueados aguardando pagamento/sinal"
                      >
                        Bloqueados
                      </button>
                      <button
                        onClick={() => setFilterPedidosRelease('autorizados')}
                        style={{
                          fontSize: '0.6rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: filterPedidosRelease === 'autorizados' ? '1px solid #8b5cf6' : '1px solid var(--border)',
                          backgroundColor: filterPedidosRelease === 'autorizados' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                          color: filterPedidosRelease === 'autorizados' ? '#8b5cf6' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: filterPedidosRelease === 'autorizados' ? 700 : 500,
                          lineHeight: '1.2'
                        }}
                        title="Filtrar apenas pedidos com número de autorização (AUT)"
                      >
                        Autorizados
                      </button>
                    </div>
                  )}
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
                    minHeight: 0
                  }}
                >
                  {stageItems.length === 0 ? (
                    <>
                      {dragOverStageId === stage.id && draggedItemId && (
                        <div className="kanban-drop-placeholder">
                          Encaixar nesta etapa
                        </div>
                      )}
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1.5rem 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        Vazio
                      </div>
                    </>
                  ) : (
                    stageItems.map((item, idx) => {
                      const parentOrder = item.order || {};
                      const isReleased = !!parentOrder.first_payment_date;
                      const overShort = item.over_short_quantity || 0;
                      const freightStyle = getFreightBadgeStyle(parentOrder.shipping_type);
                      const isBeingDragged = draggedItemId === item.id;
                      const showPlaceholderBefore = dragOverStageId === stage.id && dragOverIndex === idx && !isBeingDragged;
                      
                      return (
                        <React.Fragment key={item.id}>
                          {showPlaceholderBefore && (
                            <div className="kanban-drop-placeholder">
                              Encaixar nesta etapa
                            </div>
                          )}
                          <div 
                            className={`kanban-card-base ${recentlyMovedItemId === item.id ? 'pulse-glow' : ''} ${isBeingDragged ? 'kanban-card-dragging' : ''}`}
                            onPointerDown={(e) => handlePointerDown(e, item)}
                            style={{ 
                              touchAction: 'none',
                              backgroundColor: isReleased ? 'var(--surface)' : 'var(--danger-bg)',
                              border: isReleased ? '1px solid var(--border)' : '1.5px solid rgba(239, 68, 68, 0.35)',
                              borderLeft: `3px solid ${stage.color}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              boxShadow: isReleased ? 'var(--shadow-sm)' : '0 1px 3px rgba(239, 68, 68, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem'
                            }}
                            onClick={(e) => {
                              // Abre detalhes apenas em clique direto (não durante drag)
                              const target = e.target as HTMLElement;
                              const isButton = target.closest('button');

                              if (!isButton) handleOpenDetail(item);
                            }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = isReleased ? 'var(--shadow-md)' : '0 4px 6px rgba(239, 68, 68, 0.15)';
                            if (!isReleased) {
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = isReleased ? 'var(--shadow-sm)' : '0 1px 3px rgba(239, 68, 68, 0.08)';
                            if (!isReleased) {
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                            }
                          }}
                        >
                          {/* PV e OP */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.725rem', color: 'var(--text)' }}>
                                {item.friendly_id || '---'}
                              </span>
                              {!isReleased && (
                                <span title="Pedido Bloqueado (Aguardando Pagamento/Sinal)" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <AlertTriangle size={11} color="var(--danger)" style={{ flexShrink: 0 }} />
                                </span>
                              )}
                              {hasOverdueInstallments(item.order_id) && (
                                <span 
                                  className="blinking-dot" 
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#EF4444',
                                    display: 'inline-block',
                                    boxShadow: '0 0 8px #EF4444',
                                    animation: 'blinkAnimation 1.2s infinite ease-in-out',
                                    marginLeft: '2px',
                                    marginRight: '2px',
                                    flexShrink: 0
                                  }}
                                  title="Atenção: Parcela em atraso no Conta Azul!"
                                />
                              )}
                              {parentOrder.conta_azul_status && (() => {
                                const badgeStyle = getContaAzulStatusStyle(parentOrder.conta_azul_status);
                                return (
                                  <span style={{
                                    fontSize: '0.55rem',
                                    fontWeight: 700,
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                    backgroundColor: badgeStyle.backgroundColor,
                                    color: badgeStyle.color,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.01em',
                                    display: 'inline-block',
                                    lineHeight: '1'
                                  }}>
                                    {parentOrder.conta_azul_status}
                                  </span>
                                );
                              })()}
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
                              {item.name || 'Arte'}
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

                          {/* Destaque de Autorização (AUT.) se houver nas observações */}
                          {(() => {
                            const authNum = extractAuthorization(item.notes || parentOrder.notes);
                            if (!authNum) return null;
                            return (
                              <div style={{
                                backgroundColor: 'hsla(142, 76.2%, 36.3%, 0.1)',
                                border: '1px solid hsla(142, 76.2%, 36.3%, 0.35)',
                                color: 'hsl(142, 76.2%, 30%)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '2px 6px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                width: 'fit-content',
                                marginTop: '1px'
                              }}>
                                <Check size={8} strokeWidth={3} />
                                {authNum}
                              </div>
                            );
                          })()}

                          {/* Destaque de Prazo de Produção se houver nas observações */}
                          {(() => {
                            const deadlineText = extractProductionDeadline(item.notes || parentOrder.notes);
                            if (!deadlineText) return null;
                            return (
                              <div style={{
                                fontSize: '0.62rem',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                marginTop: '1px',
                                textTransform: 'lowercase'
                              }} title={deadlineText}>
                                <span>🕒 prazo: {deadlineText.length > 25 ? `${deadlineText.substring(0, 25)}...` : deadlineText}</span>
                              </div>
                            );
                          })()}

                          {/* Produto e Tiragem */}
                          <div style={{ fontSize: '0.65rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '0.2rem 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2px', alignItems: 'center' }}>
                              {item.adjusted_production_quantity !== undefined && item.adjusted_production_quantity !== null ? (
                                <span style={{ fontWeight: 700, color: item.adjusted_quantity_math?.includes('(Falta)') ? 'hsl(346.8, 77.2%, 49.8%)' : 'hsl(142.1, 76.2%, 36.3%)' }}>
                                  {item.adjusted_production_quantity?.toLocaleString('pt-BR')} un (Líquido)
                                </span>
                              ) : (
                                <span>{item.print_run?.toLocaleString('pt-BR')} un</span>
                              )}
                              <span style={{ fontWeight: 600 }}>
                                {item.boxes_count}{item.packaging_type === 'PACOTE' ? 'pct' : 'cx'}
                              </span>
                            </div>
                            
                            {item.adjusted_quantity_math && (
                              <div style={{ 
                                fontSize: '0.58rem', 
                                color: 'var(--text-muted)', 
                                backgroundColor: 'var(--background)',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                border: '1px solid var(--border)',
                                marginTop: '1px',
                                fontFamily: 'monospace',
                                display: 'inline-block',
                                width: 'fit-content'
                              }} title="Matemática do Saldo Acumulado Aplicado">
                                {item.adjusted_quantity_math}
                              </div>
                            )}
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
                              {item.physical_location || 'Salão'}
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

                            {parentOrder.conta_azul_status === 'Em andamento' ? (
                              <span 
                                className="badge" 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center',
                                  gap: '0.15rem', 
                                  fontSize: '0.6rem', 
                                  padding: '1px 4.5px',
                                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                  color: '#eab308',
                                  border: '1px solid rgba(234, 179, 8, 0.3)',
                                  fontWeight: 700,
                                  borderRadius: '3px'
                                }}
                                title="Orçamento em andamento no Conta Azul!"
                              >
                                <Clock size={8} />
                                Orçamento em andamento
                              </span>
                            ) : checkIsDelayed(item, stages) ? (
                              <span 
                                className="badge" 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center',
                                  gap: '0.15rem', 
                                  fontSize: '0.6rem', 
                                  padding: '1px 4.5px',
                                  backgroundColor: 'var(--danger)',
                                  color: 'white',
                                  fontWeight: 700,
                                  borderRadius: '3px'
                                }}
                                title="Atrasado pelo cronômetro de produção!"
                              >
                                <AlertTriangle size={8} />
                                ATRASADO
                              </span>
                            ) : null}
                          </div>

                          {/* Exibição do Prazo Extraído */}
                          {(() => {
                            const deadline = parseDeadlineFromNotes(item.notes || parentOrder.notes);
                            if (!deadline) return null;
                            const isOverdue = deadline.getTime() < Date.now() && stage.name !== 'Concluído' && parentOrder.conta_azul_status !== 'Em andamento';
                            
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
                                Prazo: {deadline.toLocaleDateString('pt-BR')}
                                {isOverdue && <span style={{ fontSize: '0.6rem', color: 'var(--danger)' }}>(Atrasado)</span>}
                                {parentOrder.conta_azul_status === 'Em andamento' && (
                                  <span style={{ fontSize: '0.6rem', color: '#eab308', fontWeight: 700 }}>(Orçamento em andamento)</span>
                                )}
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
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: itemsWithPackaging.has(item.id) ? 'hsl(168, 83.8%, 35%)' : 'hsl(38, 92.7%, 45%)'
                              }}>
                                {itemsWithPackaging.has(item.id) ? 'Embalagem Registrada' : 'Registrar Embalagem'}
                              </span>
                            </button>
                          )}

                          {(() => {
                            const productionItems = orderItems.filter(i => i.order_id === item.order_id && i.product?.bind_to_first_item !== true);
                            const firstProductionItem = [...productionItems].sort((a, b) => (a.item_index || 0) - (b.item_index || 0))[0];
                            const isFirstProductionItem = firstProductionItem && firstProductionItem.id === item.id;
                            const boundItems = orderItems.filter(i => i.order_id === item.order_id && i.product?.bind_to_first_item === true);

                            const siblingProductionItems = orderItems.filter(i => i.order_id === item.order_id && i.id !== item.id && i.product?.bind_to_first_item !== true);

                            const anySiblingInExpedition = siblingProductionItems.some(i => {
                              const s = stages.find(st => st.id === i.stage_id);
                              return s?.name === 'Expedição';
                            });

                            return (
                              <>
                                {isFirstProductionItem && boundItems.length > 0 && (
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    padding: '6px 8px',
                                    borderRadius: 'var(--radius-sm, 4px)',
                                    backgroundColor: 'hsla(168, 83.8%, 35%, 0.08)',
                                    border: '1px solid hsla(168, 83.8%, 35%, 0.3)',
                                    fontSize: '0.625rem',
                                    marginTop: '4px',
                                    boxSizing: 'border-box'
                                  }}>
                                    <div style={{ fontWeight: 700, color: 'hsl(168, 83.8%, 30%)', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                                      <Truck size={10} />
                                      <span>Itens Vinculados (Sem Produção)</span>
                                    </div>
                                    {boundItems.map((sib: any) => (
                                      <div key={sib.id} style={{ fontSize: '0.58rem', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }} title={sib.name}>
                                          {sib.name}
                                        </span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                                          {sib.print_run?.toLocaleString('pt-BR') || 0} un
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {siblingProductionItems.length > 0 && (
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    padding: '4px',
                                    borderRadius: 'var(--radius-sm, 4px)',
                                    backgroundColor: anySiblingInExpedition ? 'hsla(38, 92.7%, 50.2%, 0.08)' : 'var(--background)',
                                    border: `1px solid ${anySiblingInExpedition ? 'hsl(38, 92.7%, 50.2%)' : 'var(--border)'}`,
                                    fontSize: '0.625rem',
                                    marginTop: '4px',
                                    boxSizing: 'border-box'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700, color: anySiblingInExpedition ? 'hsl(38, 92.7%, 45%)' : 'var(--text-muted)' }}>
                                      <span>Pedido Conjunto ({siblingProductionItems.length + 1} itens)</span>
                                    </div>
                                    {siblingProductionItems.map((sib: any) => {
                                      const sibStage = stages.find(s => s.id === sib.stage_id);
                                      return (
                                        <div key={sib.id} style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85px' }} title={sib.name}>
                                            {sib.name}
                                          </span>
                                          <span style={{ fontWeight: 600, color: sibStage?.color || 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {sibStage?.name || 'A produzir'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {/* Ações (Setas de Navegação Manual + Editar) */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                            {(() => {
                              const realStageIdx = item.stage_id ? stages.findIndex(s => s.id === item.stage_id) : 0;
                              return (
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  <button
                                    disabled={realStageIdx <= 0}
                                    onClick={() => moveOrderItemToStage(item, stages[realStageIdx - 1].id)}
                                    className="btn btn-secondary"
                                    style={{ padding: '1px 3px', display: 'flex', alignItems: 'center' }}
                                    title="Voltar"
                                  >
                                    <ChevronLeft size={10} />
                                  </button>
                                  <button
                                    disabled={realStageIdx === -1 || realStageIdx === stages.length - 1}
                                    onClick={() => moveOrderItemToStage(item, stages[realStageIdx + 1].id)}
                                    className="btn btn-secondary"
                                    style={{ padding: '1px 3px', display: 'flex', alignItems: 'center' }}
                                    title="Avançar"
                                  >
                                    <ChevronRight size={10} />
                                  </button>
                                </div>
                              );
                            })()}

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
                      </React.Fragment>
                    );
                  })
                )}

                {dragOverStageId === stage.id &&
                 draggedItemId &&
                 stageItems.length > 0 &&
                 (dragOverIndex === stageItems.length || dragOverIndex === null) &&
                 !stageItems.some((i, idx) => i.id === draggedItemId && (dragOverIndex === idx || dragOverIndex === idx + 1)) && (
                  <div className="kanban-drop-placeholder">
                    Encaixar nesta etapa
                  </div>
                )}
              </div>
            </div>

            );
          })
          })()}
        </div>
      ) : (
        
        /* 2. VISUALIZAÇÃO EM LISTA (TABELA) */
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>PV / OP</th>
                  <th>Produto/Serviço (Cliente)</th>
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
                      <tr key={order.id} style={{ backgroundColor: isReleased ? undefined : 'var(--danger-bg)' }}>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                            <span>{order.pv_number || '---'}</span>
                            {order.conta_azul_status && (() => {
                              const badgeStyle = getContaAzulStatusStyle(order.conta_azul_status);
                              return (
                                <span style={{
                                  fontSize: '0.55rem',
                                  fontWeight: 700,
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  backgroundColor: badgeStyle.backgroundColor,
                                  color: badgeStyle.color,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.01em',
                                  display: 'inline-block',
                                  lineHeight: '1'
                                }}>
                                  {order.conta_azul_status}
                                </span>
                              );
                            })()}
                          </div>
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
                            {order.art_name || 'Arte Genérica'}
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
                            {order.physical_location || 'Salão'}
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
                Alerta: Crédito ou Estoque de Personalizados
              </h3>
              <button 
                onClick={() => { setIsSuggestionModalOpen(false); resetAllBypasses(); }} 
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
                  onClick={() => { setIsSuggestionModalOpen(false); resetAllBypasses(); }} 
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
      {/* MODAL DE TRANSIÇÃO DA EXPEDIÇÃO PARA CONCLUÍDO (OCORRÊNCIAS) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isExpeditionTransitionModalOpen && expeditionTransitionItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '500px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Truck size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Ocorrências de Expedição
              </h2>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              O item <strong>{expeditionTransitionItem.friendly_id}</strong> está sendo enviado para a Expedição. Houve alguma falta ou cortesia a registrar na remessa deste pedido?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Tipo de Ocorrência *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {[
                    { type: 'NENHUM', label: 'Não houve falta ou cortesia (Entrega normal)' },
                    { type: 'FALTA', label: 'Falta na Entrega (Entregue a menos que o pedido)' },
                    { type: 'CORTESIA', label: 'Cortesia / Brinde (Entregue a mais como cortesia)' }
                  ].map((opt) => (
                    <label key={opt.type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text)' }}>
                      <input 
                        type="radio" 
                        name="expeditionType" 
                        checked={expeditionTransitionType === opt.type}
                        onChange={() => {
                          setExpeditionTransitionType(opt.type as any);
                          if (opt.type === 'NENHUM') setExpeditionTransitionQuantity(0);
                        }}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {expeditionTransitionType !== 'NENHUM' && (
                <div className="form-group" style={{ margin: 0, animation: 'fadeIn 0.2s ease' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    {expeditionTransitionType === 'FALTA' ? 'Quantidade Faltante (unidades) *' : 'Quantidade de Cortesia (unidades) *'}
                  </label>
                  <input 
                    type="number"
                    className="form-input"
                    min="1"
                    required
                    value={expeditionTransitionQuantity || ''}
                    onChange={(e) => setExpeditionTransitionQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    placeholder="Insira a quantidade de unidades..."
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Observações da Expedição</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={expeditionTransitionNotes}
                  onChange={(e) => setExpeditionTransitionNotes(e.target.value)}
                  placeholder="Insira notas sobre a entrega, transportadora, sobra ou observações gerais..."
                  style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsExpeditionTransitionModalOpen(false);
                  setExpeditionTransitionItem(null);
                  resetAllBypasses();
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  if (expeditionTransitionType !== 'NENHUM' && !expeditionTransitionQuantity) {
                    alert('Por favor, insira a quantidade de unidades da ocorrência.');
                    return;
                  }

                  const updates: any = {};
                  if (expeditionTransitionType === 'FALTA') {
                    updates.shortage_quantity = expeditionTransitionQuantity;
                    updates.courtesy_quantity = 0;
                    updates.adjustment_resolved = false;
                  } else if (expeditionTransitionType === 'CORTESIA') {
                    updates.courtesy_quantity = expeditionTransitionQuantity;
                    updates.shortage_quantity = 0;
                    updates.adjustment_resolved = false;
                  } else {
                    updates.shortage_quantity = 0;
                    updates.courtesy_quantity = 0;
                    updates.adjustment_resolved = true;
                  }
                  updates.expedition_notes = expeditionTransitionNotes || null;

                  setLoading(true);
                  try {
                    const { error } = await updateOrderItem(expeditionTransitionItem.id, updates);
                    if (error) {
                      alert('Erro ao salvar ocorrências de expedição: ' + error.message);
                      setLoading(false);
                      return;
                    }

                    // Se houve falta ou cortesia, grava o saldo acumulado (crédito/débito) de forma imediata!
                    if (expeditionTransitionType !== 'NENHUM') {
                      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
                      const creditType = expeditionTransitionType === 'FALTA' ? 'PENDENCIA_ENTREGA' : 'CORTESIA_SOBRA';
                      const adjType = expeditionTransitionType === 'FALTA' ? 'FALTA' : 'SOBRA';
                      const actionTaken = 'CREDITO_PROXIMO_PEDIDO';
                      
                      // Criar registro na tabela de créditos/pendências
                      const { data: creditData, error: creditError } = await createCustomerStockCredit({
                        tenant_id: tenantId,
                        customer_id: expeditionTransitionItem.order?.customer_id,
                        product_id: expeditionTransitionItem.product_id,
                        credit_type: creditType,
                        original_quantity: expeditionTransitionQuantity,
                        remaining_quantity: expeditionTransitionQuantity,
                        source_order_id: expeditionTransitionItem.order_id,
                        source_adjustment_id: null,
                        status: 'ATIVO',
                        notes: expeditionTransitionNotes || `Registrado na entrada da Expedição (${expeditionTransitionType === 'FALTA' ? 'Falta' : 'Cortesia'})`
                      });

                      if (creditError) {
                        console.error('Erro ao registrar saldo acumulado:', creditError.message);
                      } else if (creditData) {
                        // Grava log de ajuste de saldo para auditoria
                        const orderedQty = expeditionTransitionItem.print_run || 0;
                        const differenceQty = expeditionTransitionType === 'FALTA' ? -expeditionTransitionQuantity : expeditionTransitionQuantity;
                        const producedQty = orderedQty + differenceQty;

                        await createOrderBalanceAdjustment({
                          tenant_id: tenantId,
                          order_id: expeditionTransitionItem.order_id,
                          order_item_id: expeditionTransitionItem.id,
                          customer_id: expeditionTransitionItem.order?.customer_id,
                          product_id: expeditionTransitionItem.product_id,
                          ordered_quantity: orderedQty,
                          produced_quantity: Math.max(0, producedQty),
                          difference_quantity: differenceQty,
                          adjustment_type: adjType,
                          action_taken: actionTaken,
                          notes: expeditionTransitionNotes || `${expeditionTransitionType === 'FALTA' ? 'Falta' : 'Cortesia/Bonificação'} registrada pela Embalagem na entrada da Expedição`,
                          created_by_name: user?.full_name || user?.email || 'Sistema'
                        });
                      }
                    }

                    // Prossegue para a expedição com o bypass ativo
                    expeditionTransitionMoveBypass.current = true;
                    setIsExpeditionTransitionModalOpen(false);
                    await moveOrderItemToStage(expeditionTransitionItem, expeditionTransitionTargetStageId);
                    setExpeditionTransitionItem(null);
                  } catch (err) {
                    console.error(err);
                    alert('Ocorreu um erro ao salvar os dados.');
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processando...' : 'Confirmar e Mover para Expedição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE DADOS TÉCNICOS DE FRETE E EMBALAGEM (OBRIGATÓRIO) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isFreightModalOpen && freightItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '650px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Truck size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Dados Técnicos de Frete
              </h2>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Insira o tipo de frete, o peso total e as dimensões da embalagem para viabilizar o cálculo do frete.
            </p>

            {/* PAINEL DE RESUMO DO PEDIDO */}
            {(() => {
              const parentOrder = orders.find(o => o.id === freightItem.order_id) || freightItem.order;
              const customerObj = customers.find(c => c.id === parentOrder?.customer_id);
              return (
                <div style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.825rem',
                  lineHeight: 1.4,
                  color: 'var(--text)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Número do Pedido</span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>PV-{parentOrder?.pv_number || 'Sem PV'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Tiragem</span>
                      <strong>{freightItem.print_run ? `${freightItem.print_run.toLocaleString('pt-BR')} un` : '-'}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Cliente</span>
                      <strong style={{ color: 'var(--text)' }}>{customerObj?.name || parentOrder?.customer?.name || 'Cliente Não Identificado'}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Produto / Arte</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{freightItem.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Tipo de Frete *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <select
                    className="form-input"
                    required
                    value={selectedShippingType}
                    onChange={(e) => setSelectedShippingType(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', flex: 1, backgroundColor: 'var(--background)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">Selecione o tipo de frete...</option>
                    {shippingTypes.filter(s => s.status === 'ATIVO').map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsShippingCrudModalOpen(true)}
                    style={{ padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', minWidth: '36px', border: '1px solid var(--border)' }}
                    title="Cadastrar Tipos de Frete"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Peso Total (kg) *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  required
                  placeholder="Ex: 12.50"
                  value={freightWeight}
                  onChange={(e) => setFreightWeight(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Comprimento (cm) *</label>
                  <input 
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 40"
                    value={freightLength}
                    onChange={(e) => setFreightLength(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Largura (cm) *</label>
                  <input 
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 30"
                    value={freightWidth}
                    onChange={(e) => setFreightWidth(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Altura (cm) *</label>
                  <input 
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 20"
                    value={freightHeight}
                    onChange={(e) => setFreightHeight(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Quantidade de Caixas *</label>
                  <input 
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 10"
                    value={freightBoxesCount}
                    onChange={(e) => setFreightBoxesCount(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Qtd dentro da Caixa *</label>
                  <input 
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    required
                    placeholder="Ex: 500"
                    value={freightQtyPerBox}
                    onChange={(e) => setFreightQtyPerBox(e.target.value)}
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              {/* LISTA DE CHECKBOXES PARA AGRUPAR ITENS IRMÃOS NO MESMO FRETE */}
              {(() => {
                const siblingItems = orderItems.filter(
                  (oi: any) => oi.order_id === freightItem.order_id && oi.id !== freightItem.id
                );
                if (siblingItems.length === 0) return null;
                return (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text)' }}>
                      📦 Juntar outros itens deste pedido na mesma caixa/frete:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {siblingItems.map((sib: any) => {
                        const sibStage = stages.find(s => s.id === sib.stage_id);
                        const hasStarted = sibStage && sibStage.name !== 'Pedidos';
                        const isChecked = selectedFreightSiblings.includes(sib.id);
                        return (
                          <label 
                            key={sib.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              fontSize: '0.8rem', 
                              cursor: hasStarted ? 'pointer' : 'not-allowed', 
                              color: hasStarted ? 'var(--text)' : 'var(--text-muted)',
                              opacity: hasStarted ? 1 : 0.6,
                              userSelect: 'none' 
                            }}
                            title={hasStarted ? '' : 'Este item ainda está na etapa inicial de Pedidos e sua produção não foi iniciada.'}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked && hasStarted}
                              disabled={!hasStarted}
                              onChange={(e) => {
                                if (!hasStarted) return;
                                if (e.target.checked) {
                                  setSelectedFreightSiblings(prev => [...prev, sib.id]);
                                } else {
                                  setSelectedFreightSiblings(prev => prev.filter(id => id !== sib.id));
                                }
                              }}
                              style={{ width: '14px', height: '14px', cursor: hasStarted ? 'pointer' : 'not-allowed' }}
                            />
                            <span>
                              <strong>{sib.friendly_id}</strong> - {sib.name} (Qtd: {sib.print_run})
                              {!hasStarted && <span style={{ color: '#ef4444', marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>(Produção Não Iniciada)</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setIsFreightModalOpen(false);
                  setFreightItem(null);
                  setFreightTargetStageId('');
                  resetAllBypasses();
                }}
              >
                Cancelar
              </button>
              
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  const weight = parseFloat(freightWeight);
                  const length = parseInt(freightLength, 10);
                  const width = parseInt(freightWidth, 10);
                  const height = parseInt(freightHeight, 10);
                  const boxes = parseInt(freightBoxesCount, 10);
                  const qtyPerBox = parseInt(freightQtyPerBox, 10);

                  if (!selectedShippingType) {
                    alert('Por favor, selecione o tipo de frete.');
                    return;
                  }

                  if (isNaN(weight) || weight <= 0 || isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
                    alert('Todos os campos de peso e dimensões devem ser preenchidos com valores numéricos maiores que zero.');
                    return;
                  }

                  if (isNaN(boxes) || boxes <= 0 || isNaN(qtyPerBox) || qtyPerBox <= 0) {
                    alert('A quantidade de caixas e a quantidade por caixa devem ser valores inteiros maiores que zero.');
                    return;
                  }

                  setLoading(true);
                  try {
                    // 1. Salvar os dados na tabela orders do Supabase
                    const { error: orderErr } = await updateOrder(freightItem.order_id, {
                      package_weight: weight,
                      package_length: length,
                      package_width: width,
                      package_height: height,
                      shipping_type: selectedShippingType,
                      boxes_count: boxes,
                      quantity_per_box: qtyPerBox
                    });

                    if (orderErr) {
                      alert('Erro ao salvar dados de frete na ordem: ' + orderErr.message);
                      setLoading(false);
                      return;
                    }

                    // 2. Atualizar o item do pedido correspondente
                    const { error: itemErr } = await updateOrderItem(freightItem.id, {
                      boxes_count: boxes,
                      quantity_per_box: qtyPerBox
                    });

                    if (itemErr) {
                      alert('Erro ao atualizar o item do pedido: ' + itemErr.message);
                    }

                    // Se houver subitens irmãos selecionados, copia os dados das caixas para eles também
                    if (selectedFreightSiblings.length > 0) {
                      await Promise.all(selectedFreightSiblings.map(sibId =>
                        updateOrderItem(sibId, {
                          boxes_count: boxes,
                          quantity_per_box: qtyPerBox
                        })
                      ));
                    }

                    // 3. Atualizar o estado das ordens e itens localmente em memória
                    setOrders(prev => prev.map(o => o.id === freightItem.order_id ? {
                      ...o,
                      package_weight: weight,
                      package_length: length,
                      package_width: width,
                      package_height: height,
                      shipping_type: selectedShippingType,
                      boxes_count: boxes,
                      quantity_per_box: qtyPerBox
                    } : o));

                    setOrderItems(prev => prev.map(i => {
                      if (i.id === freightItem.id || selectedFreightSiblings.includes(i.id)) {
                        return {
                          ...i,
                          boxes_count: boxes,
                          quantity_per_box: qtyPerBox
                        };
                      }
                      return i;
                    }));

                    const savedOpId = currentOperator.current?.id;
                    const savedOpName = currentOperator.current?.name;

                    // 4. Avançar para os modais subsequentes (Bypass de frete ativado)
                    freightBypass.current = true;
                    setIsFreightModalOpen(false);
                    await moveOrderItemToStage(freightItem, freightTargetStageId, savedOpId, savedOpName);

                    // Mover os subitens vinculados agrupados no mesmo frete
                    for (const sibId of selectedFreightSiblings) {
                      const fullSib = orderItems.find(oi => oi.id === sibId);
                      if (fullSib) {
                        freightBypass.current = true;
                        await moveOrderItemToStage(fullSib, freightTargetStageId, savedOpId, savedOpName);
                      }
                    }

                    // 5. Limpar estados de formulário
                    setFreightItem(null);
                    setFreightTargetStageId('');
                    setFreightWeight('');
                    setFreightLength('');
                    setFreightWidth('');
                    setFreightHeight('');
                    setFreightBoxesCount('');
                    setFreightQtyPerBox('');
                    setSelectedShippingType('');
                    setSelectedFreightSiblings([]);
                  } catch (err) {
                    console.error('Erro no salvamento técnico de frete:', err);
                    alert('Ocorreu um erro no processamento das informações de frete.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Salvando...' : 'Salvar e Prosseguir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE ALERTA DE PRODUÇÃO (FALTAS / CORTESIAS ANTERIORES) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isProductionAlertModalOpen && productionAlertData && productionAlertItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '520px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <AlertCircle size={24} style={{ color: productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'var(--danger)' : 'var(--success)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                {productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'Falta a Entregar (Saldo Acumulado)' : 'Cortesia/Bonificação Pendente (Saldo Acumulado)'}
              </h2>
            </div>

            <div style={{
              backgroundColor: productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px dashed ${productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? 'var(--danger)' : 'var(--success)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              {productionAlertData.credit_type === 'PENDENCIA_ENTREGA' ? (
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text)' }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>O que aconteceu?</strong>
                    <br />
                    No pedido anterior <strong>{productionAlertData.source_order?.pv_number || 'PV de origem'}</strong> deste mesmo produto, a fábrica não conseguiu entregar o total completo, gerando uma <strong>falta de {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} unidades</strong> para o cliente.
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>Como corrigir agora?</strong>
                    <br />
                    Como o cliente já pagou por essas unidades no pedido anterior, nós devemos <strong>somar</strong> essa quantidade na tiragem do novo pedido atual dele para entregar a diferença devida.
                  </p>
                  <div style={{ 
                    marginTop: '0.75rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid var(--border)', 
                    fontWeight: 700, 
                    fontSize: '0.9rem',
                    color: 'var(--danger)'
                  }}>
                    Ajuste de Tiragem:
                    <br />
                    {productionAlertItem.print_run.toLocaleString('pt-BR')} un (Pedido) + {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} un (Falta) = {(productionAlertItem.print_run + productionAlertData.remaining_quantity).toLocaleString('pt-BR')} un a produzir.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text)' }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>O que aconteceu?</strong>
                    <br />
                    No pedido anterior <strong>{productionAlertData.source_order?.pv_number || 'PV de origem'}</strong> deste mesmo produto, sobrou um excedente que foi enviado como <strong>cortesia/bonificação de {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} unidades</strong> ao cliente.
                  </p>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    <strong>Como corrigir agora?</strong>
                    <br />
                    Como o cliente já recebeu fisicamente essas unidades anteriormente, nós podemos <strong>subtrair/abater</strong> essa quantidade da tiragem do novo pedido atual para evitar produzir itens duplicados.
                  </p>
                  <div style={{ 
                    marginTop: '0.75rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid var(--border)', 
                    fontWeight: 700, 
                    fontSize: '0.9rem',
                    color: 'var(--success)'
                  }}>
                    Ajuste de Tiragem:
                    <br />
                    {productionAlertItem.print_run.toLocaleString('pt-BR')} un (Pedido) - {productionAlertData.remaining_quantity.toLocaleString('pt-BR')} un (Bonificado) = {Math.max(0, productionAlertItem.print_run - productionAlertData.remaining_quantity).toLocaleString('pt-BR')} un a produzir.
                  </div>
                </div>
              )}
            </div>

            {productionAlertData.notes && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Histórico / Observações de origem:</span>
                <pre style={{
                  margin: '0.25rem 0 0 0',
                  padding: '0.5rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text)',
                  fontFamily: 'inherit'
                }}>{productionAlertData.notes}</pre>
              </div>
            )}

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 500 }}>
              Deseja aplicar esta matemática de saldo acumulado na produção deste novo pedido?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setIsProductionAlertModalOpen(false);
                  setProductionAlertData(null);
                  setProductionAlertItem(null);
                  resetAllBypasses();
                }}
              >
                Voltar / Cancelar
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                style={{ border: '1px solid var(--border)' }}
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Prossegue sem aplicar ajustes
                    productionAlertBypass.current = true;
                    setIsProductionAlertModalOpen(false);
                    await moveOrderItemToStage(productionAlertItem, productionAlertTargetStageId);
                    setProductionAlertData(null);
                    setProductionAlertItem(null);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Não, manter original
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const originalPrintRun = productionAlertItem.print_run || 0;
                    const remainingQty = productionAlertData.remaining_quantity || 0;
                    let finalProductionQty = originalPrintRun;
                    let mathString = '';

                    if (productionAlertData.credit_type === 'PENDENCIA_ENTREGA') {
                      finalProductionQty = originalPrintRun + remainingQty;
                      mathString = `${originalPrintRun.toLocaleString('pt-BR')} + ${remainingQty.toLocaleString('pt-BR')} = ${finalProductionQty.toLocaleString('pt-BR')} (Falta)`;
                    } else {
                      finalProductionQty = Math.max(0, originalPrintRun - remainingQty);
                      mathString = `${originalPrintRun.toLocaleString('pt-BR')} - ${remainingQty.toLocaleString('pt-BR')} = ${finalProductionQty.toLocaleString('pt-BR')} (Cortesia)`;
                    }

                    // 1. Atualiza o item de pedido com a matemática do saldo aplicado
                    await updateOrderItem(productionAlertItem.id, {
                      applied_adjustment_id: productionAlertData.id,
                      adjusted_quantity_math: mathString,
                      adjusted_production_quantity: finalProductionQty
                    });

                    // 2. Marca o saldo acumulado como UTILIZADO temporariamente para evitar outros usos
                    await updateCustomerStockCredit(productionAlertData.id, {
                      status: 'UTILIZADO'
                    });

                    // 3. Move o card para a produção
                    productionAlertBypass.current = true;
                    setIsProductionAlertModalOpen(false);
                    await moveOrderItemToStage(productionAlertItem, productionAlertTargetStageId);
                    setProductionAlertData(null);
                    setProductionAlertItem(null);
                  } catch (err) {
                    console.error('Erro ao aplicar saldo:', err);
                    alert('Erro ao aplicar saldo no pedido.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Aplicando...' : 'Sim, aplicar saldo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE CONFERÊNCIA FÍSICA OBRIGATÓRIA ANTES DE EXPEDIR */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isConferencyModalOpen && conferencyData && conferencyItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '550px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Conferência de Saldo de Carga
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Este pedido compensou um saldo acumulado do pedido anterior deste cliente para o mesmo produto (<strong>{conferencyItem.name}</strong>).
            </p>

            <div style={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                <div><strong style={{ color: 'var(--text-muted)' }}>Saldo Anterior Compensado:</strong> {conferencyData.credit_type === 'PENDENCIA_ENTREGA' ? `Falta de ${conferencyData.original_quantity} unidades (Acrescentada) do pedido original ${conferencyData.source_order?.pv_number || 'PV'}` : `Cortesia de ${conferencyData.original_quantity} unidades (Descontada) do pedido original ${conferencyData.source_order?.pv_number || 'PV'}`}</div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Matemática de Tiragem:</strong> <code>{conferencyItem.adjusted_quantity_math}</code></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Tiragem Líquida Esperada:</strong> {conferencyItem.adjusted_production_quantity?.toLocaleString('pt-BR')} unidades</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Quantos itens estão sendo enviados fisicamente no lote deste pedido? *</label>
              <input 
                type="number"
                className="form-input"
                min="0"
                required
                value={conferencyPhysicalQuantity || ''}
                onChange={(e) => setConferencyPhysicalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
              />
            </div>

            <div style={{
              border: '1px solid rgba(var(--primary-rgb), 0.3)',
              backgroundColor: 'rgba(var(--primary-rgb), 0.04)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox"
                  checked={conferencyChecked}
                  onChange={(e) => setConferencyChecked(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', marginTop: '0.15rem' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  Confirmo que verifiquei fisicamente a carga e o saldo acumulado foi devidamente considerado no carregamento.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setIsConferencyModalOpen(false);
                  setConferencyData(null);
                  setConferencyItem(null);
                  setConferencyChecked(false);
                  resetAllBypasses();
                }}
              >
                Voltar / Cancelar
              </button>
              
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading || !conferencyChecked}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

                    // 1. Atualiza o status do saldo acumulado original para UTILIZADO (zerado para sempre)
                    const { error: creditError } = await updateCustomerStockCredit(conferencyData.id, {
                      status: 'UTILIZADO',
                      remaining_quantity: 0
                    });
                    
                    if (creditError) {
                      console.error('Erro ao zerar saldo acumulado:', creditError.message);
                    }

                    // 2. Atualiza a quantidade produzida final/expedida no item de pedido e marca como resolvido
                    await updateOrderItem(conferencyItem.id, {
                      over_short_quantity: conferencyPhysicalQuantity - (conferencyItem.print_run || 0),
                      adjustment_resolved: true
                    });

                    // 3. Move o card para a etapa de Expedição
                    conferencyBypass.current = true;
                    setIsConferencyModalOpen(false);
                    await moveOrderItemToStage(conferencyItem, conferencyTargetStageId);
                    
                    setConferencyData(null);
                    setConferencyItem(null);
                    setConferencyChecked(false);
                  } catch (err) {
                    console.error('Erro ao processar conferência final:', err);
                    alert('Ocorreu um erro no processamento da conferência.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processando...' : 'Confirmar e Liberar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE VINCULAÇÃO DE EQUIPE DE MANUSEIO E ITENS MÚLTIPLOS */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isHandlingTeamModalOpen && handlingTeamModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '550px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Users size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Vincular Equipe de Manuseio
              </h2>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Informação do Item Atual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Item sendo Movido</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 }}>
                  {handlingTeamModalItem.friendly_id} — {handlingTeamModalItem.name}
                </span>
              </div>

              {/* Informação sobre múltiplos itens do pedido */}
              {(() => {
                const siblingItems = orderItems.filter(i => 
                  i.order_id === handlingTeamModalItem.order_id && 
                  i.id !== handlingTeamModalItem.id
                );
                if (siblingItems.length === 0) return null;

                const currentIdx = handlingTeamModalItem.friendly_id?.split('/')[1] || String(handlingTeamModalItem.item_index || 1);

                return (
                  <div style={{
                    backgroundColor: 'hsla(35, 100%, 50%, 0.05)',
                    border: '1px solid hsla(35, 100%, 50%, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(35, 90%, 40%)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <AlertTriangle size={15} />
                      <span>Aviso: Este item é o /{currentIdx} de um pedido conjunto</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      Este pedido possui mais itens associados que estão em andamento na produção.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>
                        Outros itens deste pedido:
                      </span>
                      {siblingItems.map((sib: any) => {
                        const sibStage = stages.find(s => s.id === sib.stage_id);
                        return (
                          <div key={sib.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {sib.friendly_id || `/${sib.item_index}`} · {sib.name}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Há {getTimeInStage(sib.updated_at)} nesta etapa
                              </span>
                            </div>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '99px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              backgroundColor: sibStage?.color ? `${sibStage.color}15` : 'var(--surface-subtle)',
                              color: sibStage?.color || 'var(--text-muted)',
                              border: `1px solid ${sibStage?.color ? `${sibStage.color}30` : 'var(--border)'}`
                            }}>
                              {sibStage?.name || sib.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Seletor de Equipe */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Equipe de Manuseio Responsável *</label>
                <select
                  className="form-select"
                  value={selectedHandlingTeamId}
                  onChange={(e) => setSelectedHandlingTeamId(e.target.value)}
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="">— Selecione uma Equipe —</option>
                  {handlingTeams
                    .filter(t => t.status === 'ATIVO')
                    .map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsHandlingTeamModalOpen(false);
                  setHandlingTeamModalItem(null);
                  setSelectedHandlingTeamId('');
                  resetAllBypasses();
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={async () => {
                  if (!selectedHandlingTeamId) {
                    alert('Por favor, selecione qual equipe de manuseio será responsável pelo item.');
                    return;
                  }
                  setIsHandlingTeamModalOpen(false);
                  handlingTeamMoveBypass.current = true;
                  await moveOrderItemToStage(handlingTeamModalItem, handlingTeamModalTargetStageId);
                  setHandlingTeamModalItem(null);
                  setSelectedHandlingTeamId('');
                }}
              >
                {loading ? 'Processando...' : 'Confirmar e Mover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE AVISO DE ITENS VINCULADOS EM EXPEDIÇÃO */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isLinkedItemsWarningOpen && linkedItemsWarningData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '500px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle size={24} style={{ color: '#eab308' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Pedido Conjunto / Múltiplos Itens
              </h2>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              O item <strong>{linkedItemsWarningData.item.friendly_id}</strong> faz parte do pedido <strong>{linkedItemsWarningData.item.order?.pv_number}</strong>, que contém mais de um item.
            </p>

            <div style={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                Outros itens vinculados a este pedido:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {linkedItemsWarningData.siblings.map((sib: any) => {
                  const sibStage = stages.find(s => s.id === sib.stage_id);
                  return (
                    <div key={sib.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                        {sib.friendly_id || '—'} · {sib.name}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: (sibStage?.color || '#888') + '22',
                        color: sibStage?.color || 'var(--text-muted)',
                        border: `1px solid ${(sibStage?.color || '#888')}55`,
                        whiteSpace: 'nowrap'
                      }}>
                        {sibStage?.name || 'A produzir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 1.25rem 0', fontWeight: 600 }}>
              Deseja prosseguir com o envio de <strong>{linkedItemsWarningData.item.friendly_id}</strong> para a Expedição?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={handleConfirmExpeditionMoveAll} 
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', width: '100%', padding: '0.6rem 1rem' }}
              >
                Movimentar todos
              </button>
              <button 
                type="button" 
                onClick={handleConfirmExpeditionMove} 
                className="btn btn-outline"
                style={{ 
                  fontSize: '0.85rem', 
                  width: '100%', 
                  padding: '0.6rem 1rem',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  backgroundColor: 'transparent'
                }}
              >
                Movimentar somente este
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsLinkedItemsWarningOpen(false);
                  setLinkedItemsWarningData(null);
                }} 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', width: '100%', padding: '0.6rem 1rem' }}
              >
                Cancelar movimentação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE PROGRESSO DE SINCRONIZAÇÃO */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isSyncModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '2rem', maxWidth: '420px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}>
              <RefreshCw size={20} className={importing ? 'spinner' : ''} style={{ color: 'var(--primary)', animation: importing ? 'spin 1s linear infinite' : 'none' }} />
              Sincronização Conta Azul
            </h2>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 500 }}>
              {isSyncingSingle ? (
                `Pedido: ${syncingOrderNumber ? `PV-${syncingOrderNumber}` : (selectedOrder?.pv_number || 'Sem número')}`
              ) : (
                `Período: ${importStartDate ? new Date(importStartDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} a ${importEndDate ? new Date(importEndDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Fim'}`
              )}
            </div>

            {/* Progresso */}
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--border)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${syncProgress}%`,
                  backgroundColor: syncResult && !syncResult.success ? 'var(--danger)' : 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease-out'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'left', flex: 1, paddingRight: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={syncStep}>
                  {syncStep}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 700 }}>
                  {syncProgress}%
                </span>
              </div>
            </div>

            {/* Resultados / Erros */}
            {syncResult && (
              <div style={{
                backgroundColor: syncResult.success ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                border: `1px solid ${syncResult.success ? '#2ed573' : 'var(--danger)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                {syncResult.success ? (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2ed573', fontSize: '0.9rem', fontWeight: 700 }}>
                      Sincronizado com Sucesso
                    </h4>
                    {isSyncingSingle ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        O pedido foi sincronizado e suas parcelas e status financeiro foram atualizados.
                      </p>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <li>Pedidos importados: <strong>{syncResult.imported}</strong></li>
                        <li>Pedidos atualizados: <strong>{syncResult.updated}</strong></li>
                      </ul>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>
                      Falha na Importação
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {syncResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              {importing ? (
                <>
                  <button
                    onClick={handleCancelSync}
                    className="btn btn-danger"
                    style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                  >
                    Cancelar Sincronização
                  </button>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3, textAlign: 'left', width: '100%', display: 'block' }}>
                    * A escuta local será interrompida e o modal será fechado. As chamadas em andamento no servidor não podem ser desfeitas via API.
                  </span>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    setSyncingOrderNumber('');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                >
                  Fechar
                </button>
              )}
            </div>
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
                  Registro de Embalagem
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {packagingModalItem.friendly_id} — {packagingModalItem.name}
                  {packagingModalTargetStageId && (
                    <span style={{ marginLeft: '0.5rem', color: 'hsl(38, 92.7%, 45%)', fontWeight: 600 }}>
                      Preenchimento obrigatório para avançar para Expedição
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => { setIsPackagingModalOpen(false); resetAllBypasses(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Resumo do item */}
            <div className="grid-responsive-3" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', gap: '0.5rem', fontSize: '0.75rem' }}>
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
                      Volume {idx + 1}
                    </h4>
                    {packagingVolumes.length > 1 && (
                      <button type="button" onClick={() => handleRemovePackagingVolume(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid-responsive-2" style={{ gap: '0.75rem' }}>
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
                      <div className="grid-responsive-3" style={{ gap: '0.5rem' }}>
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
                            {t.name}{t.code ? ` (${t.code})` : ''}
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
                      Volume unitário: <strong>{(Number(vol.length_cm) * Number(vol.width_cm) * Number(vol.height_cm) / 1000000).toFixed(4)} m³</strong>
                      {vol.weight_kg && (<span style={{ marginLeft: '1rem' }}>Peso total: <strong>{(Number(vol.weight_kg) * Number(vol.box_count)).toFixed(3)} kg</strong></span>)}
                    </div>
                  )}
                </div>
              ))}

              {/* Botão adicionar volume */}
              <button type="button" onClick={handleAddPackagingVolume}
                style={{ width: '100%', padding: '0.5rem', border: '1px dashed var(--border)', background: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                Adicionar Volume
              </button>

              {/* Rodapé do modal */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                 <button type="button" className="btn btn-secondary" onClick={() => { setIsPackagingModalOpen(false); resetAllBypasses(); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPackaging}>
                  {savingPackaging ? 'Salvando...' : packagingModalTargetStageId ? 'Salvar e Avançar para Expedição' : 'Salvar Embalagem'}
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
                Conferência de Sobras & Faltas
              </h3>
              <button 
                onClick={() => { setIsAdjustmentModalOpen(false); resetAllBypasses(); }} 
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
                  onClick={() => { setIsAdjustmentModalOpen(false); resetAllBypasses(); }} 
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
              <div className="grid-responsive-2" style={{ gap: '1rem' }}>
                
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
                  <label className="form-label">Produto/Serviço / Identificação Visual da Embalagem *</label>
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
                  <label className="form-label">Localização Física na Fábrica</label>
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
                <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>Controle Financeiro & Liberação da Fábrica</h4>
                  <div className="grid-responsive-2" style={{ gap: '1rem' }}>
                    
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
              <div className="grid-responsive-2" style={{ gap: '1rem', marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                
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

                {/* Campo de Equipe de Manuseio — visível sempre que setor for Manuseio */}
                {formSector === 'Manuseio' && (
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'hsla(271, 91.2%, 65.1%, 0.08)', border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Equipe de Manuseio Responsável
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
                        Indique com qual equipe este material está sendo trabalhado.
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
                  disabled={isReadOnlyForForm('internalNotes')}
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
                {(!isReadOnlyForForm('customer') || !isReadOnlyForForm('status') || !isReadOnlyForForm('machine_id')) && (
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
          MODAL DE AUTORIZAÇÃO DE RETROCESSO
          ======================================== */}
      {isRevertAuthModalOpen && pendingRevertItem && (() => {
        const item = pendingRevertItem;
        const order = item.order || {};
        const fromStage = stages.find(s => s.id === item.stage_id);
        const toStage  = stages.find(s => s.id === pendingRevertTargetStageId);

        // Calcular tempo desde o último move
        let movedAgoText = '';
        try {
          const raw = localStorage.getItem(`samppel_mv_${item.id}`);
          if (raw) {
            const rec = JSON.parse(raw);
            const diffMin = Math.floor((Date.now() - rec.movedAt) / 60000);
            movedAgoText = diffMin < 60
              ? `${diffMin} minuto${diffMin !== 1 ? 's' : ''} atrás`
              : `${Math.floor(diffMin / 60)}h ${diffMin % 60}min atrás`;
          }
        } catch {}

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setIsRevertAuthModalOpen(false); }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1200, padding: '1rem',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              borderTop: '3px solid hsl(38, 92.7%, 50.2%)',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '480px',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header */}
              <div style={{
                padding: '1.1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'hsla(38, 92.7%, 50.2%, 0.06)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                      Autorização Necessária
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    A janela de 10 minutos para desfazer este move expirou
                  </span>
                </div>
                <button
                  onClick={() => setIsRevertAuthModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '-2px' }}
                >
                  &times;
                </button>
              </div>

              {/* Contexto do movimento */}
              <div style={{
                margin: '1.1rem 1.5rem 0',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Movimento solicitado
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>
                    {item.friendly_id || '---'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontWeight: 700, fontSize: '0.72rem',
                    backgroundColor: (fromStage?.color || '#888') + '22',
                    color: fromStage?.color || 'var(--text)',
                    border: `1px solid ${(fromStage?.color || '#888')}55`
                  }}>
                    {fromStage?.name || 'Etapa atual'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontWeight: 700, fontSize: '0.72rem',
                    backgroundColor: (toStage?.color || '#888') + '22',
                    color: toStage?.color || 'var(--text)',
                    border: `1px solid ${(toStage?.color || '#888')}55`
                  }}>
                    {toStage?.name || 'Etapa destino'}
                  </span>
                  {movedAgoText && (
                    <span style={{ fontSize: '0.68rem', color: 'hsl(38, 92.7%, 45%)', fontWeight: 600 }}>
                      · Movido {movedAgoText}
                    </span>
                  )}
                </div>
              </div>

              {/* Formulário de autorização */}
              <form onSubmit={handleRevertAuthSubmit} style={{ padding: '1rem 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Para retroceder um card além da janela de 10 minutos, um <strong>Administrador</strong> precisa confirmar a ação com suas credenciais.
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>E-mail do Administrador</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={revertAuthEmail}
                    onChange={e => setRevertAuthEmail(e.target.value)}
                    required
                    autoComplete="off"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Senha do Administrador</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      type={showRevertPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={revertAuthPassword}
                      onChange={e => setRevertAuthPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{ fontSize: '0.85rem', paddingRight: '2.5rem', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRevertPassword(!showRevertPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--text-muted, #888)',
                        padding: '4px'
                      }}
                    >
                      {showRevertPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Justificativa <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'normal', marginLeft: '4px' }}>(Opcional)</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Descreva o motivo do retrocesso manual..."
                    value={revertAuthJustification}
                    onChange={e => setRevertAuthJustification(e.target.value)}
                    rows={2}
                    style={{ fontSize: '0.82rem', resize: 'none' }}
                  />
                </div>

                {revertAuthError && (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.08)',
                    border: '1px solid hsla(0, 84.2%, 60.2%, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'hsl(0, 84.2%, 50%)',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}>
                    {revertAuthError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsRevertAuthModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                    disabled={revertAuthLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '130px', justifyContent: 'center' }}
                    disabled={revertAuthLoading}
                  >
                    {revertAuthLoading ? (
                      <><Loader2 size={13} className="spin" /> Verificando...</>
                    ) : (
                      <><CheckCircle2 size={13} /> Aprovar Retrocesso</>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        );
      })()}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE CRUD DE TIPOS DE FRETE (CONFIGURAÇÕES DO ADMIN) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isShippingCrudModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3100, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '450px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Cadastrar Tipos de Frete
              </h2>
              <button 
                type="button" 
                onClick={() => {
                  setIsShippingCrudModalOpen(false);
                  setNewShippingTypeName('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            {/* Form de Adicionar Novo */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input 
                type="text"
                className="form-input"
                placeholder="Ex: Lalamove, Motoboy..."
                value={newShippingTypeName}
                onChange={(e) => setNewShippingTypeName(e.target.value)}
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (!newShippingTypeName.trim()) return;
                  setLoading(true);
                  try {
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
                    const { data, error } = await createShippingTypeConfig({
                      tenant_id: tenantId,
                      name: newShippingTypeName.trim(),
                      status: 'ATIVO'
                    });

                    if (error) {
                      alert('Erro ao cadastrar tipo de frete: ' + error.message);
                    } else if (data) {
                      setShippingTypes(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
                      setNewShippingTypeName('');
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                Adicionar
              </button>
            </div>

            {/* Listagem com Opção de Deletar */}
            <div style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)'
            }}>
              {shippingTypes.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Nenhum tipo de frete cadastrado.
                </div>
              ) : (
                shippingTypes.map((type) => (
                  <div 
                    key={type.id} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.82rem',
                      color: 'var(--text)'
                    }}
                  >
                    <span>{type.name}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Deseja realmente remover o tipo de frete "${type.name}"?`)) return;
                        setLoading(true);
                        try {
                          const { error } = await deleteShippingTypeConfig(type.id);
                          if (error) {
                            alert('Erro ao excluir tipo de frete: ' + error.message);
                          } else {
                            setShippingTypes(prev => prev.filter(s => s.id !== type.id));
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsShippingCrudModalOpen(false);
                  setNewShippingTypeName('');
                }}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && detailItem && (() => {
        const order = detailItem.order || {};
        const customer = order.customer || {};
        const currentStage = stages.find(s => s.id === detailItem.stage_id);
        const itemAdjs = adjustments.filter(a => a.order_item_id === detailItem.id);
        const deadline = parseDeadlineFromNotes(detailItem.notes || order.notes);
        const isOverdue = deadline ? deadline.getTime() < Date.now() && currentStage?.name !== 'Concluído' : false;
        const freightStyle = getFreightBadgeStyle(order.shipping_type);
        const isReleased = !!order.first_payment_date;
        const currentMachine = productionMachines.find(m => m.id === detailItem.machine_id);
        const machineName = currentMachine ? currentMachine.name : '—';

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
              maxWidth: '860px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header Padrão do Sistema */}
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
                      {detailItem.friendly_id || order.pv_number || '---'}
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
                      <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>Atrasado</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {customer.name || 'Cliente'} · {detailItem.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {(!user?.role || user.role !== 'Produção' || currentStage?.name === 'Em produção') && (
                    <button
                      onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit3 size={12} /> Editar
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.2rem' }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Corpo com Scroll Padrão */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {!isReleased && (
                  <div style={{
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    color: 'var(--danger)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={16} />
                    <span>Atenção: Este pedido está Bloqueado (Aguardando Pagamento/Sinal).</span>
                  </div>
                )}

                {/* Card 1: Dados do Pedido (Full Width) */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Dados do Pedido
                  </div>
                  <div className="grid-responsive-3" style={{ gap: '0.65rem' }}>
                    {[
                      { label: 'PV', value: order.pv_number || '—' },
                      { label: 'OP', value: order.op_number || '—' },
                      { label: 'Produto/Serviço', value: detailItem.name || '—' },
                      { label: 'Vendedor(a)', value: order.seller_name || 'Samppel' },
                      { label: 'Data do Pedido', value: order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : '—' },
                      { label: 'Início Produção', value: order.production_start_date ? new Date(order.production_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Card 2: Dados do Cliente (Full Width) */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: '#a855f7', borderRadius: '2px', display: 'inline-block' }} />
                    Dados do Cliente
                  </div>
                  <div className="grid-responsive-2" style={{ gap: '0.65rem' }}>
                    {(() => {
                      const formattedDoc = formatDocument(customer.document);
                      const formattedEmail = customer.email ? customer.email.toLowerCase() : '';
                      const formattedPhone = formatPhone(customer.phone);
                      return [
                        { label: 'Nome', value: customer.name || '—', copyText: customer.name },
                        { label: 'CNPJ/CPF', value: formattedDoc || '—', copyText: formattedDoc },
                        { label: 'E-mail', value: formattedEmail || '—', copyText: formattedEmail, style: { textTransform: 'lowercase' } },
                        { label: 'Telefone', value: formattedPhone || '—', copyText: formattedPhone },
                      ].map(({ label, value, copyText, style }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600, wordBreak: 'break-all', ...style }}>
                            {value}
                            {copyText && copyText !== '—' && <CopyButton text={copyText} />}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </section>

                {/* Card: Especificações deste Item / Card */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} />
                    Especificações deste Item / Card
                  </div>
                  <div className="grid-responsive-3" style={{ gap: '0.65rem' }}>
                    {[
                      { label: 'Tiragem', value: (detailItem.print_run || 0).toLocaleString('pt-BR') + ' un' },
                      { label: 'Caixas', value: `${detailItem.boxes_count || 0} ${detailItem.packaging_type === 'PACOTE' ? 'pct' : 'cx'}` },
                      { label: 'Medida', value: detailItem.measure || '—' },
                      { label: 'Setor', value: detailItem.production_sector || '—' },
                      { label: 'Máquina Vinculada', value: machineName },
                      { label: 'Localização', value: detailItem.physical_location || 'Salão' },
                      { label: 'Sobra/Falta Produção', value: detailItem.over_short_quantity > 0 ? `+${detailItem.over_short_quantity}` : detailItem.over_short_quantity < 0 ? `${detailItem.over_short_quantity}` : '—' },
                      { label: 'Falta na Entrega', value: detailItem.shortage_quantity ? `${detailItem.shortage_quantity} un` : '—' },
                      { label: 'Cortesia/Brinde', value: detailItem.courtesy_quantity ? `${detailItem.courtesy_quantity} un` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Seção: Controle Financeiro & Contas a Receber (Estilo Conta Azul em Card) */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '4px', height: '14px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }} />
                      Contas a Receber & Parcelamento
                    </div>
                    {order.conta_azul_id && (
                      <button
                        type="button"
                        onClick={() => handleSyncSingleOrder(order.id)}
                        disabled={syncingSingleOrder}
                        className="btn btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.68rem',
                          height: '24px',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={11} className={syncingSingleOrder ? 'spinner' : ''} />
                        <span>{syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar Conta Azul'}</span>
                      </button>
                    )}
                  </div>

                  {/* Descrição e Condição de Pagamento */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem', marginBottom: '2px' }}>
                      {order.payment_condition || `${order.installments_total || 1}x no Pix - Pagamento Instantâneo`}
                    </div>
                    <span style={{ fontSize: '0.75rem' }}>
                      Consulte na tabela abaixo, as informações presentes no seu financeiro (contas a receber):
                    </span>
                  </div>

                  {/* Tabela de Parcelas Estilo Conta Azul */}
                  {(() => {
                    const orderTransactions = financialTransactions.filter(t => t.order_id === order.id);
                    const totalOrderValue = Number(order.total_amount || 0) || orderItems.filter(i => i.order_id === order.id).reduce((acc, i) => acc + Number(i.total_price || 0), 0);
                    
                    let installmentsList: any[] = [];

                    if (orderTransactions.length > 0) {
                      const sorted = [...orderTransactions].sort((a, b) => {
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return a.due_date.localeCompare(b.due_date);
                      });

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      installmentsList = sorted.map((t: any, index: number) => {
                        const statusUpper = (t.status || 'PENDENTE').toUpperCase();
                        const isPaid = ['CONCILIADO', 'QUITADO', 'BAIXADO'].includes(statusUpper);
                        const dueDate = t.due_date ? new Date(t.due_date + 'T00:00:00') : null;
                        const valor = Number(t.amount || 0);
                        const recebido = t.received_amount !== undefined && t.received_amount !== null ? Number(t.received_amount) : (isPaid ? valor : 0);
                        const emAberto = t.open_amount !== undefined && t.open_amount !== null ? Number(t.open_amount) : (isPaid ? 0 : valor);

                        let sitLabel = 'Em Aberto';
                        let sitBg = '#fef3c7'; // soft amber
                        let sitColor = '#d97706';

                        if (isPaid || emAberto === 0) {
                          sitLabel = 'Recebido';
                          sitBg = '#dcfce7'; // soft green
                          sitColor = '#16a34a';
                        } else if (dueDate && dueDate.getTime() < today.getTime()) {
                          sitLabel = 'Atrasado';
                          sitBg = '#fee2e2'; // soft red
                          sitColor = '#dc2626';
                        }

                        return {
                          vencimento: t.due_date ? new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
                          parcela: `${index + 1}/${sorted.length}`,
                          forma: order.payment_condition || 'Pix - Pagamento Instantâneo',
                          conta: 'Conta Banco',
                          valor,
                          recebido,
                          emAberto,
                          sitLabel,
                          sitBg,
                          sitColor
                        };
                      });
                    } else {
                      // Fallback virtual caso não tenha transações sincronizadas do CA
                      const totalInst = order.installments_total || 1;
                      const paidInst = order.installments_paid || 0;
                      const instValue = totalOrderValue > 0 ? totalOrderValue / totalInst : 0;
                      const baseDate = order.order_date ? new Date(order.order_date) : new Date();

                      for (let i = 0; i < totalInst; i++) {
                        const dueDate = new Date(baseDate);
                        dueDate.setDate(dueDate.getDate() + (i * 30));
                        const isPaid = i < paidInst;

                        installmentsList.push({
                          vencimento: dueDate.toLocaleDateString('pt-BR'),
                          parcela: `${i + 1}/${totalInst}`,
                          forma: order.payment_condition || 'Pix - Pagamento Instantâneo',
                          conta: 'Conta Banco',
                          valor: instValue,
                          recebido: isPaid ? instValue : 0,
                          emAberto: isPaid ? 0 : instValue,
                          sitLabel: isPaid ? 'Recebido' : 'Em Aberto',
                          sitBg: isPaid ? '#dcfce7' : '#fef3c7',
                          sitColor: isPaid ? '#16a34a' : '#d97706'
                        });
                      }
                    }

                    const totalRecebido = installmentsList.reduce((acc, item) => acc + item.recebido, 0);
                    const totalEmAberto = installmentsList.reduce((acc, item) => acc + item.emAberto, 0);
                    const totalEmAtraso = installmentsList.filter(item => item.sitLabel === 'Atrasado').reduce((acc, item) => acc + item.emAberto, 0);
                    const totalAReceber = totalEmAberto - totalEmAtraso;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Tabela */}
                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflowX: 'auto', backgroundColor: 'var(--surface)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left', minWidth: '650px' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.04)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.5rem 0.65rem', width: '32px' }}>
                                  <input type="checkbox" disabled style={{ borderRadius: '3px' }} />
                                </th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Vencimento</th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parcela</th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Forma de pagamento</th>
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>Conta</th>
                                {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Valor R$</th>}
                                {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Recebido R$</th>}
                                {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Em aberto R$</th>}
                                <th style={{ padding: '0.5rem 0.65rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Situação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {installmentsList.map((inst, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '0.55rem 0.65rem' }}>
                                    <input type="checkbox" disabled style={{ borderRadius: '3px' }} />
                                  </td>
                                  <td style={{ padding: '0.55rem 0.65rem', fontWeight: 500 }}>{inst.vencimento}</td>
                                  <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>{inst.parcela}</td>
                                  <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>{inst.forma}</td>
                                  <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>{inst.conta}</td>
                                  {!hideMonetaryValues && (
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 600 }}>
                                      {inst.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  )}
                                  {!hideMonetaryValues && (
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 500 }}>
                                      {inst.recebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  )}
                                  {!hideMonetaryValues && (
                                    <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 500 }}>
                                      {inst.emAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  )}
                                  <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '2px 10px',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: inst.sitColor,
                                      backgroundColor: inst.sitBg
                                    }}>
                                      {inst.sitLabel}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Cards Resumo de Totais (Recebido / Em aberto) */}
                        {!hideMonetaryValues && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Card 1: Recebido */}
                            <div style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'var(--surface)'
                            }}>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>Recebido</span>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total recebido (R$)</span>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
                                  {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Card 2: Em aberto */}
                            <div style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'var(--surface)',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>Em aberto</span>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total a receber (R$)</span>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16a34a' }}>
                                    {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>+</span>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total em atraso (R$)</span>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#dc2626' }}>
                                    {totalEmAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>=</span>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total em aberto (R$)</span>
                                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb' }}>
                                    {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </section>

                {/* Card: Produtos do Pedido */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Produtos do Pedido
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '450px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.04)', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Item</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Produto</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Qtd</th>
                          {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Valor Un.</th>}
                          {!hideMonetaryValues && <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Subtotal</th>}
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Estágio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.filter(i => i.order_id === order.id).map((i: any) => {
                          const itemStage = stages.find(s => s.id === i.stage_id);
                          const unitPrice = i.unit_price !== undefined && i.unit_price !== null ? Number(i.unit_price) : (i.product?.price || 0);
                          const subtotal = i.total_price !== undefined && i.total_price !== null ? Number(i.total_price) : ((i.print_run || 0) * unitPrice);
                          const isCurrent = i.id === detailItem.id;
                          return (
                            <tr key={i.id} style={{ 
                              borderBottom: '1px solid var(--border)',
                              backgroundColor: isCurrent ? 'rgba(var(--primary-rgb), 0.04)' : 'transparent',
                              fontWeight: isCurrent ? 700 : 400
                            }}>
                              <td style={{ padding: '0.5rem 0.75rem', color: isCurrent ? 'var(--primary)' : 'var(--text)' }}>
                                {i.friendly_id || '—'} {isCurrent && '(Este)'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem' }}>{i.name}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{(i.print_run || 0).toLocaleString('pt-BR')}</td>
                              {!hideMonetaryValues && (
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                  R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              )}
                              {!hideMonetaryValues && (
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                  R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              )}
                              <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                                <span style={{ 
                                  color: itemStage?.color || 'var(--text-muted)',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {itemStage?.name || 'A produzir'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Card: Observações e Anotações */}
                {(order.notes || order.internal_notes) && (
                  <section style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md, 10px)',
                    padding: '1rem 1.15rem',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '4px', height: '14px', backgroundColor: '#eab308', borderRadius: '2px', display: 'inline-block' }} />
                      Observações & Anotações
                    </div>
                    {order.notes && (
                      <div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Obs. do Pedido / Pagamento</span>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap', margin: 0 }}>{order.notes}</p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '0.6rem' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>Anotações Internas</span>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap', margin: 0 }}>{order.internal_notes}</p>
                      </div>
                    )}
                  </section>
                )}

              </div>

              {/* Rodapé do Modal com Botões Padrão */}
              {/* Rodapé Padrão do Modal */}
              <div style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                backgroundColor: 'var(--surface-subtle, transparent)'
              }}>
                <button
                  onClick={() => {
                    const text = `PV: ${order.pv_number || '—'}\nCliente: ${customer.name || '—'}\nArte: ${detailItem.name}\nTiragem: ${detailItem.print_run} un`;
                    navigator.clipboard.writeText(text);
                    showToast('Resumo copiado para a área de transferência!');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Copy size={13} />
                  <span>Copiar Resumo</span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {order.conta_azul_id && (
                    <button
                      onClick={() => handleSyncSingleOrder(order.id)}
                      disabled={syncingSingleOrder}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <RefreshCw size={13} className={syncingSingleOrder ? 'spinner' : ''} />
                      <span>{syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>
                  )}

                  {(!user?.role || user.role !== 'Produção' || currentStage?.name === 'Em produção') && (
                    <button
                      onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Edit3 size={13} />
                      <span>Editar Pedido</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                  >
                    Fechar
                  </button>
                </div>
              </div>

            </div>
          </div>

        );
      })()}

      {/* ========================================
          MODAL CRUD DE SETORES DE PRODUÇÃO
          ======================================== */}
      {isSectorCrudModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsSectorCrudModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200, padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--background)'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                Gerenciar Setores de Produção Física
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSectorCrudModalOpen(false);
                  setEditingSector(null);
                  setSectorFormName('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Form */}
              <form onSubmit={handleSaveSector} style={{
                backgroundColor: 'rgba(var(--primary-rgb), 0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {editingSector ? 'Editar Setor' : 'Adicionar Novo Setor'}
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Nome do Setor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Impressão, Guilhotina, Embalagem..."
                    value={sectorFormName}
                    onChange={(e) => setSectorFormName(e.target.value)}
                    required
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Status</label>
                  <select
                    className="form-select"
                    value={sectorFormStatus}
                    onChange={(e) => setSectorFormStatus(e.target.value as any)}
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  >
                    <option value="ATIVO">Ativo (visível nos selects)</option>
                    <option value="INATIVO">Inativo (oculto nos selects)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {editingSector && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSector(null);
                        setSectorFormName('');
                        setSectorFormStatus('ATIVO');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingSector}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {savingSector ? 'Salvando...' : editingSector ? 'Salvar Alterações' : 'Adicionar Setor'}
                  </button>
                </div>
              </form>

              {/* Lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Setores Cadastrados ({productionSectors.length})
                </div>

                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Nome</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionSectors.map((sec) => (
                        <tr key={sec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{sec.name}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: sec.status === 'ATIVO' ? '#10b981' : '#64748b',
                              backgroundColor: sec.status === 'ATIVO' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)'
                            }}>
                              {sec.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSector(sec);
                                  setSectorFormName(sec.name);
                                  setSectorFormStatus(sec.status);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.72rem' }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSector(sec.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: '0.72rem' }}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================
          MODAL CRUD DE MÁQUINAS DE PRODUÇÃO
          ======================================== */}
      {isMachineCrudModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsMachineCrudModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200, padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--background)'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                Gerenciar Máquinas de Produção Vinculadas
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMachineCrudModalOpen(false);
                  setEditingMachineState(null);
                  setMachineFormName('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Form */}
              <form onSubmit={handleSaveMachineForm} style={{
                backgroundColor: 'rgba(var(--primary-rgb), 0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {editingMachineState ? 'Editar Máquina' : 'Adicionar Nova Máquina'}
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Nome da Máquina</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Flexografia 4 Cores, Guilhotina Hidráulica..."
                    value={machineFormName}
                    onChange={(e) => setMachineFormName(e.target.value)}
                    required
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Setor de Produção Física</label>
                  <select
                    className="form-select"
                    value={machineFormSector}
                    onChange={(e) => setMachineFormSector(e.target.value)}
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  >
                    {productionSectors
                      .filter(s => s.status === 'ATIVO')
                      .map((sec) => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Status</label>
                  <select
                    className="form-select"
                    value={machineFormStatus}
                    onChange={(e) => setMachineFormStatus(e.target.value as any)}
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}
                  >
                    <option value="ATIVO">Ativa (Disponível)</option>
                    <option value="INATIVO">Inativa (Oculta)</option>
                    <option value="MANUTENCAO">Em Manutenção</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {editingMachineState && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMachineState(null);
                        setMachineFormName('');
                        setMachineFormStatus('ATIVO');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingMachine}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {savingMachine ? 'Salvando...' : editingMachineState ? 'Salvar Alterações' : 'Adicionar Máquina'}
                  </button>
                </div>
              </form>

              {/* Lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Máquinas Cadastradas ({productionMachines.length})
                </div>

                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Nome</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Setor</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionMachines.map((mach) => {
                        let statusColor = '#ef4444';
                        let statusBg = 'rgba(239,68,68,0.1)';
                        let statusLabel = 'Inativa';

                        if (mach.status === 'ATIVO') {
                          statusColor = '#10b981';
                          statusBg = 'rgba(16,185,129,0.1)';
                          statusLabel = 'Ativa';
                        } else if (mach.status === 'MANUTENCAO') {
                          statusColor = '#f97316';
                          statusBg = 'rgba(249,115,22,0.1)';
                          statusLabel = 'Manutenção';
                        }

                        return (
                          <tr key={mach.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{mach.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{mach.sector}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: statusColor,
                                backgroundColor: statusBg
                              }}>
                                {statusLabel}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMachineState(mach);
                                    setMachineFormName(mach.name);
                                    setMachineFormSector(mach.sector || 'Impressão');
                                    setMachineFormStatus(mach.status);
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.72rem' }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMachineForm(mach.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: '0.72rem' }}
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA: PEDIDO EM ANDAMENTO NO CONTA AZUL */}
      {isOrderInProgressModalOpen && inProgressItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.75rem', maxWidth: '520px', width: '90%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={26} style={{ color: 'var(--warning)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Pedido Não Aprovado no Conta Azul
              </h2>
            </div>

            <div style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0' }}>
                O pedido <strong>PV-{inProgressItem.order?.pv_number || inProgressItem.order_id}</strong> ainda consta com o status <strong>"Em andamento"</strong> (Aguardando Aprovação/Faturamento) no Conta Azul.
              </p>
              
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}>
                ℹ️ <strong>Importante:</strong> Iniciar a produção ou separação de estoque de pedidos ainda não aprovados comercialmente/financeiramente pode gerar retrabalho ou desperdício de matéria-prima.
              </div>

              <p style={{ margin: '0' }}>
                Caso o status do pedido tenha sido atualizado recentemente no Conta Azul, clique em <strong>Sincronizar Pedido Agora</strong> para buscar a aprovação em tempo real. Caso contrário, se tiver autorização, você pode optar por <strong>Iniciar Mesmo Assim</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={handleSyncInProgressOrder}
                disabled={inProgressSyncing}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', height: '42px', fontWeight: 600 }}
              >
                <RefreshCw size={16} className={inProgressSyncing ? 'spinner' : ''} />
                <span>{inProgressSyncing ? 'Buscando dados no Conta Azul...' : 'Sincronizar Pedido Agora'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handleForceStartInProgressOrder}
                  disabled={inProgressSyncing}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}
                >
                  Iniciar Mesmo Assim
                </button>
                <button 
                  onClick={handleCancelInProgressOrder}
                  disabled={inProgressSyncing}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIDÁTICO: ALERTA DE PEDIDO BLOQUEADO (AGUARDANDO PAGAMENTO / SINAL) */}
      {isBlockedPaymentModalOpen && blockedPaymentItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 99999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
            maxWidth: '540px', width: '90%', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            {/* Cabeçalho de Alerta Destacado */}
            <div style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>

                <AlertTriangle size={24} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  Atenção: Este pedido está Bloqueado
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                  Aguardando Pagamento / Sinal Financeiro
                </p>
              </div>
            </div>

            {/* Conteúdo Explicativo Didático */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Informações Resumidas do Card */}
              <div style={{
                backgroundColor: 'var(--surface-subtle, #f8fafc)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                    {blockedPaymentItem.friendly_id || blockedPaymentItem.order?.pv_number || 'Pedido'}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {blockedPaymentItem.name || blockedPaymentItem.art_name}
                  </span>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Cliente: <strong>{blockedPaymentItem.order?.customer?.name || 'Cliente não informado'}</strong>
                </div>
              </div>

              {/* Explicação Didática sobre Riscos */}
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                borderLeft: '4px solid #ef4444',
                borderRadius: '6px',
                padding: '0.85rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--text)',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.3rem' }}>
                  Por que o pedido está bloqueado?
                </strong>
                Este pedido ainda não possui a confirmação da data do primeiro pagamento ou sinal financeiro no Conta Azul. Iniciar a produção sem o recebimento do sinal pode gerar custos operacionais sem garantia de recebimento.
              </div>

              <div style={{
                textAlign: 'center',
                padding: '0.5rem 0',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text)'
              }}>
                Deseja colocar este pedido em produção mesmo assim?
              </div>

              {/* Botões Didáticos de Ação */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelBlockedPaymentMove}
                  style={{ padding: '0.65rem 1.15rem', fontSize: '0.85rem', fontWeight: 600, flex: 1 }}
                >
                  Não, Manter Bloqueado
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmBlockedPaymentMove}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.15rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md, 8px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    flex: 1
                  }}
                >
                  <span>Sim, Colocar em Produção</span>
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE DE NOTIFICAÇÃO TOAST FLUTUANTE */}
      {toastNotification && (
        <div className="toast-container-floating">
          <div className="toast-card-item">
            <CheckCircle2 size={18} color="#10b981" />
            <span>{toastNotification.message}</span>
          </div>
        </div>
      )}

      <OperatorAuthModal 
        isOpen={isOpAuthOpen}
        tenantId={user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'}
        onSuccess={handleOpAuthSuccess}
        onClose={() => {
          setIsOpAuthOpen(false);
          resetAllBypasses();
        }}
        actionDescription={pendingKanbanMove ? `Mover item para outra etapa do Kanban` : 'Movimentação Kanban'}
        targetStageId={pendingKanbanMove?.targetStageId}
        currentStageId={pendingKanbanMove?.item?.stage_id}
      />
    </div>
  );
}


