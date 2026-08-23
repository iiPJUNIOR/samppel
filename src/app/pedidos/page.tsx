'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  checkProductStock,
  adjustStock,
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
  getFactoryLocations,
  createFactoryLocation,
  updateFactoryLocation,
  deleteFactoryLocation,
  createCustomer,
  getOrderItemHandlingTeams,
  saveOrderItemHandlingTeams,
  saveOrderShippingVolumes,
  type OrderItemHandlingTeam,
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
  ChevronUp,
  ChevronDown,
  Loader2,
  Scale,
  Copy,
  Check,
  Users,
  AlertTriangle,
  Download,
  Clock,
  ArrowRightLeft,
  MapPin,
  Trash2,
  Layers
} from 'lucide-react';

// Auxiliar para mapear o nome da etapa (do banco de dados) para um status válido do order_items
const getStatusForStageName = (stageName: string): string => {
  if (stageName === 'Pedidos') return 'A produzir';
  if (stageName === 'Produção') return 'Em produção';
  if (stageName === 'Em produção') return 'Em produção';
  if (stageName === 'Embalagem') return 'Em revisão';
  if (stageName === 'Coleta agendada') return 'Expedição'; // Ou um novo status se criarmos
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

// Extrair detalhes estruturados do pedido
const extractOrderDetails = (notes: string | null) => {
  if (!notes) return null;
  
  // Cut the notes at "ABAIXO:" to ignore client-only info.
  const relevantNotes = notes.split(/ABAIXO:/i)[0];
  
  const extract = (keyRegex: RegExp) => {
    const match = relevantNotes.match(keyRegex);
    return match ? match[1].trim() : null;
  };

  let cliche = extract(/Clich[êe]\s*:\s*([^\n\r]+)/i) || extract(/Chichê:\s*([^\n\r]+)/i);
  if (cliche) {
    cliche = cliche.replace(/Embalage(?:m|ns)\s*:.*/i, '').replace(/[\s|-]+$/, '').trim();
    if (!cliche) cliche = null;
  }
  const embalagem = extract(/Embalage(?:m|ns)\s*:\s*([^\n\r]+)/i);
  const prazo = extract(/Prazo de entrega\s*:\s*([^\n\r]+)/i);
  const freteInfo = extract(/Frete\s*:\s*([^\n\r]+)/i);
  const meioPag = extract(/Meio de pag(?:amento|\.)?\s*:\s*([^\n\r]+)/i);
  const formaPag = extract(/Forma de pag(?:amento|\.)?\s*:\s*([^\n\r]+)/i);
  const op = extract(/OP\s*:\s*([^\n\r]+)/i);

  const impressaoMatch = relevantNotes.match(/Impressão\s+([^\n\r]+)/i);
  const impressao = impressaoMatch ? impressaoMatch[1].trim() : null;

  const faturamentoMatch = relevantNotes.match(/(PEDIDO FATURADO[^\n\r]*)/i);
  const faturamento = faturamentoMatch ? faturamentoMatch[1].trim() : null;

  if (!cliche && !embalagem && !prazo && !freteInfo && !meioPag && !formaPag && !op && !impressao && !faturamento) return null;

  return { cliche, embalagem, prazo, freteInfo, meioPag, formaPag, op, impressao, faturamento };
};

// Helper para garantir primeira letra maiúscula em valores de especificações
const capitalizeText = (val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  const str = String(val).trim();
  if (str === '—') return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper para extrair a medida real do item (do campo ou do nome/descrição do produto)
const getItemRealMeasure = (item: any): string => {
  if (!item) return '—';
  if (item.measure && item.measure !== '15x10x5 cm' && item.measure !== '—' && item.measure.trim().length > 0) {
    return item.measure;
  }
  const text = item.name || item.art_name || item.product?.name || item.order?.product?.name || '';
  const match = text.match(/\b([0-9]{1,3}(?:[.,][0-9])?\s*[xX]\s*[0-9]{1,3}(?:[.,][0-9])?(?:\s*[xX]\s*[0-9]{1,3}(?:[.,][0-9])?)?(?:\/[0-9]+\s*g)?\s*(?:cm|mm|m)?)\b/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '—';
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
    // Toggle kanban-mode class for CSS containment
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      if (viewMode === 'kanban') {
        appContainer.classList.add('kanban-mode');
      } else {
        appContainer.classList.remove('kanban-mode');
      }
    }
  }, [viewMode]);

  // Set kanban-mode on initial mount
  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (appContainer && viewMode === 'kanban') {
      appContainer.classList.add('kanban-mode');
    }
    return () => {
      document.querySelector('.app-container')?.classList.remove('kanban-mode');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  
  // Estados para Consolidação de Expedição (Irmãos e Frete)
  const [expeditionSiblings, setExpeditionSiblings] = useState<any[]>([]);
  const [expeditionSelectedSiblings, setExpeditionSelectedSiblings] = useState<string[]>([]);
  const [expeditionFreightVolumes, setExpeditionFreightVolumes] = useState<number>(1);
  const [expeditionFreightWeight, setExpeditionFreightWeight] = useState<string>('');
  const [expeditionFreightWidth, setExpeditionFreightWidth] = useState<string>('');
  const [expeditionFreightHeight, setExpeditionFreightHeight] = useState<string>('');
  const [expeditionFreightLength, setExpeditionFreightLength] = useState<string>('');
  const [expeditionFreightNotes, setExpeditionFreightNotes] = useState<string>('');
  const [expeditionFreightPackagingTypeId, setExpeditionFreightPackagingTypeId] = useState<string>('');
  const [expeditionItemConferencyMap, setExpeditionItemConferencyMap] = useState<Record<string, { producedQuantity: number; adjustmentAction: string }>>({});

  const updateExpeditionItemConferency = (itemId: string, field: 'producedQuantity' | 'adjustmentAction', value: any) => {
    setExpeditionItemConferencyMap(prev => {
      const existing = prev[itemId] || { producedQuantity: 0, adjustmentAction: 'CREDITO_PROXIMO_PEDIDO' };
      const updated = { ...existing, [field]: value };
      if (field === 'producedQuantity') {
        const itm = orderItems.find(i => i.id === itemId) || (expeditionTransitionItem?.id === itemId ? expeditionTransitionItem : null);
        const orderedQty = itm?.print_run || 0;
        const diff = Number(value) - orderedQty;
        if (diff > 0) {
          updated.adjustmentAction = 'CREDITO_PROXIMO_PEDIDO';
        } else if (diff < 0) {
          updated.adjustmentAction = 'PENDENCIA_ENTREGA';
        } else {
          updated.adjustmentAction = 'OUTRO';
        }
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const expeditionTransitionMoveBypass = useRef(false);

  // Estados do Modal de Alerta de Produção (A partir de Faltas/Cortesias anteriores)
  const [isProductionAlertModalOpen, setIsProductionAlertModalOpen] = useState(false);
  const [productionAlertData, setProductionAlertData] = useState<any>(null);
  const [productionAlertItem, setProductionAlertItem] = useState<any>(null);
  const [productionAlertTargetStageId, setProductionAlertTargetStageId] = useState<string>('');
  const productionAlertBypass = useRef(false);

  // Estados do Modal de Coleta Agendada (Número da Nota, Coleta e Cotação)
  const [isColetaAgendadaModalOpen, setIsColetaAgendadaModalOpen] = useState(false);
  const [coletaAgendadaItem, setColetaAgendadaItem] = useState<any>(null);
  const [coletaAgendadaTargetStageId, setColetaAgendadaTargetStageId] = useState<string>('');
  const [coletaInvoiceNumber, setColetaInvoiceNumber] = useState<string>('');
  const [coletaPickupNumber, setColetaPickupNumber] = useState<string>('');
  const [coletaFreightQuotation, setColetaFreightQuotation] = useState<string>('');
  const [coletaSiblings, setColetaSiblings] = useState<any[]>([]);
  const [coletaSelectedSiblings, setColetaSelectedSiblings] = useState<string[]>([]);
  const coletaAgendadaMoveBypass = useRef(false);

  // Estados do Modal de Falta de Estoque na Movimentação
  const [isInsufficientStockModalOpen, setIsInsufficientStockModalOpen] = useState(false);
  const [insufficientStockData, setInsufficientStockData] = useState<any>(null);
  const [selectedInsufficientItemIds, setSelectedInsufficientItemIds] = useState<string[]>([]);
  const insufficientStockMoveBypass = useRef(false);

  const handleConfirmInsufficientStockMove = async (selectedInsufficientItems: any[]) => {
    if (!siblingMoveTargetStageId || !insufficientStockData) return;
    const itemsToMove = [...(insufficientStockData.sufficientItems || []), ...selectedInsufficientItems];
    
    setIsInsufficientStockModalOpen(false);
    setInsufficientStockData(null);
    
    insufficientStockMoveBypass.current = true;
    siblingMoveBypass.current = true;
    
    for (const itm of itemsToMove) {
      await moveOrderItemToStage(itm, siblingMoveTargetStageId);
    }
    setSiblingMoveItem(null);
    setSiblingMoveTargetStageId('');
    setSiblingMoveList([]);
  };

  const handleCancelInsufficientStockMove = () => {
    setIsInsufficientStockModalOpen(false);
    setInsufficientStockData(null);
    setSiblingMoveItem(null);
    setSiblingMoveTargetStageId('');
    setSiblingMoveList([]);
    setSelectedInsufficientItemIds([]);
    resetAllBypasses();
  };

  // Estados do Modal de Agrupamento de Itens Irmãos (/1, /2, etc.) ao Mover de Fase
  const [isSiblingMoveModalOpen, setIsSiblingMoveModalOpen] = useState(false);
  const [siblingMoveItem, setSiblingMoveItem] = useState<any>(null);
  const [siblingMoveTargetStageId, setSiblingMoveTargetStageId] = useState<string>('');
  const [siblingMoveList, setSiblingMoveList] = useState<any[]>([]);
  const [siblingMoveSelectedIds, setSiblingMoveSelectedIds] = useState<string[]>([]);
  const siblingMoveBypass = useRef(false);

  const handleConfirmSiblingMoveAll = async (moveSiblings: boolean) => {
    if (!siblingMoveItem || !siblingMoveTargetStageId) return;
    const item = siblingMoveItem;
    const targetStageId = siblingMoveTargetStageId;
    const selectedIds = siblingMoveSelectedIds;

    setIsSiblingMoveModalOpen(false);

    const itemsToMove = [item];
    if (moveSiblings && selectedIds.length > 0) {
      itemsToMove.push(...orderItems.filter(i => selectedIds.includes(i.id)));
    }

    // Check stock for all items BEFORE moving
    const targetStage = stages.find(s => s.id === targetStageId);
    const targetStageIdx = stages.findIndex(s => s.id === targetStageId);
    const isEnteringProdOrStock = targetStageIdx === 1 || targetStageIdx === 6 || targetStage?.name === 'Em produção' || targetStage?.name === 'Produção' || targetStage?.name === 'Estoque';
    let stockAlertData = null;
    
    if (!insufficientStockMoveBypass.current && isEnteringProdOrStock) {
      const insufficientItems = [];
      const sufficientItems = [];
      
      for (const itm of itemsToMove) {
        const fromStageIdx = itm.stage_id ? stages.findIndex(s => s.id === itm.stage_id) : 0;
        if (fromStageIdx === 0 && itm.product_id) {
          const qtyRequired = itm.print_run || itm.quantity || 1;
          const currentStock = await checkProductStock(itm.product_id);
          if (currentStock - qtyRequired < 0) {
            insufficientItems.push({
              item: itm,
              productName: itm.product?.name || itm.name || itm.art_name,
              qtyRequired,
              currentStock
            });
          } else {
            sufficientItems.push(itm);
          }
        } else {
          sufficientItems.push(itm);
        }
      }
      
      if (insufficientItems.length > 0) {
        stockAlertData = { insufficientItems, sufficientItems };
      }
    }

    if (stockAlertData) {
      setInsufficientStockData(stockAlertData);
      setSiblingMoveTargetStageId(targetStageId);
      setIsInsufficientStockModalOpen(true);
      return;
    }

    setSiblingMoveItem(null);
    setSiblingMoveTargetStageId('');
    setSiblingMoveList([]);

    siblingMoveBypass.current = true;
    insufficientStockMoveBypass.current = true; // Bypass stock check inside moveOrderItemToStage since we already checked it
    for (const itm of itemsToMove) {
      await moveOrderItemToStage(itm, targetStageId);
    }
  };

  const handleCancelSiblingMove = () => {
    setIsSiblingMoveModalOpen(false);
    setSiblingMoveItem(null);
    setSiblingMoveTargetStageId('');
    setSiblingMoveList([]);
    resetAllBypasses();
  };

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
  const [blockedSyncFeedback, setBlockedSyncFeedback] = useState<{ message: string; type: 'warning' | 'success' } | null>(null);
  const blockedPaymentBypass = useRef(false);

  const handleConfirmBlockedPaymentMove = async () => {
    if (!blockedPaymentItem || !blockedPaymentTargetStageId) return;
    const item = blockedPaymentItem;
    const targetStageId = blockedPaymentTargetStageId;

    setIsBlockedPaymentModalOpen(false);
    setBlockedPaymentItem(null);
    setBlockedPaymentTargetStageId('');
    setBlockedSyncFeedback(null);

    blockedPaymentBypass.current = true;
    await moveOrderItemToStage(item, targetStageId);
  };

  const handleCancelBlockedPaymentMove = () => {
    setIsBlockedPaymentModalOpen(false);
    setBlockedPaymentItem(null);
    setBlockedPaymentTargetStageId('');
    setBlockedSyncFeedback(null);
    resetAllBypasses();
  };

  // Estados do Modal Faturado Alert (Entrando na Expedição)
  const [isFaturadoAlertModalOpen, setIsFaturadoAlertModalOpen] = useState(false);
  const [faturadoAlertItem, setFaturadoAlertItem] = useState<any>(null);
  const [faturadoAlertTargetStageId, setFaturadoAlertTargetStageId] = useState<string>('');
  const faturadoAlertBypass = useRef(false);

  const handleConfirmFaturadoAlertMove = async () => {
    if (!faturadoAlertItem || !faturadoAlertTargetStageId) return;
    const item = faturadoAlertItem;
    const targetStageId = faturadoAlertTargetStageId;

    setIsFaturadoAlertModalOpen(false);
    setFaturadoAlertItem(null);
    setFaturadoAlertTargetStageId('');

    faturadoAlertBypass.current = true;
    await moveOrderItemToStage(item, targetStageId);
  };

  const handleCancelFaturadoAlertMove = () => {
    setIsFaturadoAlertModalOpen(false);
    setFaturadoAlertItem(null);
    setFaturadoAlertTargetStageId('');
    resetAllBypasses();
  };

  // Estados de Notificação Toast, Drag/Drop e Filtros Mobile
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'info'; id: number } | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  
  // Custom Pointer Events DND Refs
  const dragCloneRef = useRef<HTMLElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const activeDragItemId = useRef<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const isDragActive = useRef<boolean>(false);
  const dragPendingItem = useRef<any>(null);
  const dragPendingTarget = useRef<HTMLElement | null>(null);
  const touchHoldTimer = useRef<any>(null);
  const activePointerId = useRef<number | null>(null);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const wasJustDragged = useRef<boolean>(false);
  const currentOverStageId = useRef<string | null>(null);
  const currentOverIndex = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const cachedColumnRects = useRef<Array<{ stageId: string; left: number; right: number; top: number; width: number; cardsY: Array<{ top: number; bottom: number; mid: number }> }>>([]);
  const guideLineRef = useRef<HTMLElement | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isMoveStageModalOpen, setIsMoveStageModalOpen] = useState(false);
  const [itemToMoveStage, setItemToMoveStage] = useState<any>(null);


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

  // Estados do Modal de Equipe de Manuseio (Desmembramento/Divisão por Equipe)
  interface HandlingTeamRow {
    handling_team_id: string;
    quantity: number;
    is_completed?: boolean;
    completed_at?: string;
  }
  const [isHandlingTeamModalOpen, setIsHandlingTeamModalOpen] = useState(false);
  const [handlingTeamModalItem, setHandlingTeamModalItem] = useState<any>(null);
  const [handlingTeamModalTargetStageId, setHandlingTeamModalTargetStageId] = useState<string>('');
  const [selectedHandlingTeamId, setSelectedHandlingTeamId] = useState<string>('');
  const [handlingTeamAllocations, setHandlingTeamAllocations] = useState<HandlingTeamRow[]>([]);
  const [itemHandlingTeamsMap, setItemHandlingTeamsMap] = useState<Map<string, OrderItemHandlingTeam[]>>(new Map());
  const handlingTeamMoveBypass = useRef(false);
  const currentOperator = useRef<{ id: string; name: string } | null>(null);

  const handleOpenHandlingTeamModalForItem = async (item: any, targetStageId: string) => {
    setHandlingTeamModalItem(item);
    setHandlingTeamModalTargetStageId(targetStageId);

    const totalQty = Number(item.print_run || item.quantity || 1000);
    try {
      const { data } = await getOrderItemHandlingTeams(item.id);
      if (data && data.length > 0) {
        setHandlingTeamAllocations(data.map(d => ({
          handling_team_id: d.handling_team_id,
          quantity: d.quantity,
          is_completed: d.is_completed || false,
          completed_at: d.completed_at || ''
        })));
      } else {
        const defaultTeam = item.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
        setHandlingTeamAllocations([
          { handling_team_id: defaultTeam, quantity: totalQty, is_completed: false, completed_at: '' }
        ]);
      }
    } catch (err) {
      const defaultTeam = item.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
      setHandlingTeamAllocations([
        { handling_team_id: defaultTeam, quantity: totalQty, is_completed: false, completed_at: '' }
      ]);
    }
    setIsHandlingTeamModalOpen(true);
  };

  const handleSwitchHandlingModalItem = async (newItem: any) => {
    if (handlingTeamModalItem && handlingTeamAllocations.length > 0) {
      const valid = handlingTeamAllocations.filter(a => a.handling_team_id && a.quantity > 0);
      if (valid.length > 0) {
        try {
          await saveOrderItemHandlingTeams(handlingTeamModalItem.id, handlingTeamAllocations);
          const { data } = await getOrderItemHandlingTeams(handlingTeamModalItem.id);
          if (data) {
            setItemHandlingTeamsMap(prev => {
              const updated = new Map(prev);
              updated.set(handlingTeamModalItem.id, data);
              return updated;
            });
          }
        } catch (e) {
          console.error('Erro ao salvar alocações do item anterior:', e);
        }
      }
    }

    setHandlingTeamModalItem(newItem);
    const totalQty = Number(newItem.print_run || newItem.quantity || 1000);
    try {
      const { data } = await getOrderItemHandlingTeams(newItem.id);
      if (data && data.length > 0) {
        setHandlingTeamAllocations(data.map(d => ({
          handling_team_id: d.handling_team_id,
          quantity: d.quantity,
          is_completed: d.is_completed || false,
          completed_at: d.completed_at || ''
        })));
      } else {
        const defaultTeam = newItem.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
        setHandlingTeamAllocations([
          { handling_team_id: defaultTeam, quantity: totalQty, is_completed: false, completed_at: '' }
        ]);
      }
    } catch (err) {
      const defaultTeam = newItem.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
      setHandlingTeamAllocations([
        { handling_team_id: defaultTeam, quantity: totalQty, is_completed: false, completed_at: '' }
      ]);
    }
  };

  // Estados de Localizações Físicas na Fábrica (CRUD)
  const [factoryLocations, setFactoryLocations] = useState<any[]>([]);
  const [isLocationCrudModalOpen, setIsLocationCrudModalOpen] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationStatus, setLocationStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [submittingLocation, setSubmittingLocation] = useState(false);

  const handleOpenLocationCrudModal = () => {
    setLocationName('');
    setLocationStatus('ATIVO');
    setEditingLocation(null);
    setIsLocationCrudModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;
    setSubmittingLocation(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingLocation) {
        const { data, error } = await updateFactoryLocation(editingLocation.id, {
          name: locationName.trim(),
          status: locationStatus
        });
        if (error) throw error;
        setFactoryLocations(prev => prev.map(l => l.id === editingLocation.id ? data : l));
        if (formPhysicalLocation === editingLocation.name) {
          setFormPhysicalLocation(data.name);
        }
        showToast('Localização atualizada com sucesso!');
      } else {
        const { data, error } = await createFactoryLocation({
          tenant_id: tenantId,
          name: locationName.trim(),
          status: locationStatus
        });
        if (error) throw error;
        setFactoryLocations(prev => [...prev, data]);
        setFormPhysicalLocation(data.name);
        showToast(`Localização "${data.name}" criada e selecionada!`);
      }
      setLocationName('');
      setLocationStatus('ATIVO');
      setEditingLocation(null);
    } catch (err: any) {
      console.error('Erro ao salvar localização:', err);
      alert('Erro ao salvar localização: ' + (err.message || 'Falha ao salvar'));
    } finally {
      setSubmittingLocation(false);
    }
  };

  const handleEditLocationClick = (loc: any) => {
    setEditingLocation(loc);
    setLocationName(loc.name);
    setLocationStatus(loc.status);
  };

  const handleDeleteLocationClick = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a localização "${name}"?`)) return;
    try {
      const { error } = await deleteFactoryLocation(id);
      if (error) throw error;
      setFactoryLocations(prev => prev.filter(l => l.id !== id));
      if (formPhysicalLocation === name) {
        setFormPhysicalLocation('Salão');
      }
      showToast(`Localização "${name}" removida com sucesso.`);
    } catch (err: any) {
      console.error('Erro ao remover localização:', err);
      alert('Erro ao remover localização: ' + (err.message || 'Falha ao excluir'));
    }
  };

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
  const [formCliche, setFormCliche] = useState('');
  const [formEmbalagem, setFormEmbalagem] = useState('');
  const [formPrazo, setFormPrazo] = useState('');
  const [formFreteInfo, setFormFreteInfo] = useState('');
  const [formMeioPag, setFormMeioPag] = useState('');
  const [formFormaPag, setFormFormaPag] = useState('');
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
  const [formInitialDestination, setFormInitialDestination] = useState<'PRODUCAO' | 'ESTOQUE'>('PRODUCAO');

  const [formSelectedProductStock, setFormSelectedProductStock] = useState<number | null>(null);
  const [formMachineId, setFormMachineId] = useState('');
  const [formHandlingTeamId, setFormHandlingTeamId] = useState('');
  const [formHandlingAllocations, setFormHandlingAllocations] = useState<HandlingTeamRow[]>([]);

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
      const [machResult, teamsResult, pmtResult, settingsResult, sectorsResult, shippingTypesResult, locationsResult] = await Promise.allSettled([
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId),
        getProductionSectors(tenantId),
        getShippingTypesConfig(tenantId),
        getFactoryLocations(tenantId)
      ]);

      if (machResult.status === 'fulfilled') setProductionMachines(machResult.value.data || []);
      if (sectorsResult.status === 'fulfilled' && sectorsResult.value.data && sectorsResult.value.data.length > 0) {
        setProductionSectors(sectorsResult.value.data);
      }
      if (teamsResult.status === 'fulfilled') setHandlingTeams(teamsResult.value.data || []);
      if (pmtResult.status === 'fulfilled') setPackagingMaterialTypes(pmtResult.value.data || []);
      if (shippingTypesResult.status === 'fulfilled') setShippingTypes(shippingTypesResult.value.data || []);
      if (settingsResult.status === 'fulfilled') setPackagingSettings(settingsResult.value.data || null);
      if (locationsResult.status === 'fulfilled') setFactoryLocations(locationsResult.value.data || []);

      // Pré-carregar cache de embalagens e alocações de equipes de manuseio
      const itemIds: string[] = (itemsRes.data || []).map((i: any) => i.id);
      if (itemIds.length > 0) {
        const packaged = new Set<string>();
        const teamsMap = new Map<string, OrderItemHandlingTeam[]>();

        await Promise.allSettled(itemIds.map(async (id) => {
          const [pkgRes, teamsRes] = await Promise.all([
            getOrderItemPackaging(id),
            getOrderItemHandlingTeams(id)
          ]);
          if (pkgRes.data && pkgRes.data.length > 0) packaged.add(id);
          if (teamsRes.data && teamsRes.data.length > 0) teamsMap.set(id, teamsRes.data);
        }));

        setItemsWithPackaging(packaged);
        setItemHandlingTeamsMap(teamsMap);
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
    coletaAgendadaMoveBypass.current = false;
    inProgressOrderBypass.current = false;
    blockedPaymentBypass.current = false;
    siblingMoveBypass.current = false;
    insufficientStockMoveBypass.current = false;
    adminMoveOverride.current = false;
    faturadoAlertBypass.current = false;
    currentOperator.current = null;
  };

  // Movimentar item de pedido para uma etapa
  const moveOrderItemToStage = async (item: any, targetStageId: string, operatorId?: string | null, operatorName?: string | null) => {
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

    // REGRA DE TRAVA DO MANUSEIO:
    // Se estiver saindo de Manuseio para outra etapa (exceto se for cancelamento/reversão específica),
    // verifica se todas as frações estão concluídas e com conferência efetuada
    if (currentStage?.name === 'Manuseio' && targetStage.name !== 'Manuseio' && targetStage.name !== 'Atrasado' && !handlingTeamMoveBypass.current) {
      const { data: teams } = await getOrderItemHandlingTeams(item.id);
      if (teams && teams.length > 0) {
        const hasUncompleted = teams.some(t => !t.is_completed);
        if (hasUncompleted) {
          setLoading(false);
          resetAllBypasses();
          alert('ATENÇÃO: Existem frações de manuseio deste item que ainda não foram conferidas. Você deve marcar todas como concluídas (com data de conclusão) no modal de manuseio antes de avançar para a próxima etapa.');
          handleOpenHandlingTeamModalForItem(item, item.stage_id);
          return;
        }
      }
    }

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
    // REGRA DE ALERTA DE FATURADO (Qualquer etapa -> Expedição)
    // ---------------------------------------------------------------
    if (targetStage.name === 'Expedição' && !faturadoAlertBypass.current) {
      const details = extractOrderDetails(item.notes || parentOrder.notes);
      if (details?.formaPag && details.formaPag.toUpperCase().includes('FATURADO')) {
        setFaturadoAlertItem(item);
        setFaturadoAlertTargetStageId(targetStageId);
        setIsFaturadoAlertModalOpen(true);
        return;
      }
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

    // REGRA DE MANUSEIO: Vincular equipes de manuseio ao entrar na etapa 'Manuseio'
    if (targetStage.name === 'Manuseio' && 
        currentStage?.name !== 'Manuseio' && 
        !handlingTeamMoveBypass.current) {
      
      handleOpenHandlingTeamModalForItem(item, targetStageId);
      return;
    }

    // ---------------------------------------------------------------
    // REGRA DE CONSOLIDAÇÃO DE EXPEDIÇÃO:
    // Ao entrar na Expedição, consolidar itens irmãos, coletar falta/cortesia e dados de frete.
    // ---------------------------------------------------------------
    if (targetStage.name === 'Expedição' && !expeditionTransitionMoveBypass.current) {
      const siblingItems = orderItems.filter(i => i.order_id === item.order_id && i.id !== item.id && i.stage_id !== targetStageId);
      
      setExpeditionTransitionItem(item);
      setExpeditionTransitionTargetStageId(targetStageId);
      
      // Ocorrências
      setExpeditionTransitionType('NENHUM');
      setExpeditionTransitionQuantity(0);
      setExpeditionTransitionNotes(item.expedition_notes || '');
      
      // Irmãos (Consolidação)
      setExpeditionSiblings(siblingItems);
      setExpeditionSelectedSiblings(siblingItems.map(s => s.id)); // Default todos
      
      // Frete Consolidado
      setSelectedShippingType(parentOrder?.shipping_type || '');
      setExpeditionFreightVolumes(1);
      setExpeditionFreightWeight(parentOrder?.package_weight !== undefined && parentOrder?.package_weight !== null ? String(parentOrder.package_weight) : '');
      setExpeditionFreightWidth(parentOrder?.package_width !== undefined && parentOrder?.package_width !== null ? String(parentOrder.package_width) : '');
      setExpeditionFreightHeight(parentOrder?.package_height !== undefined && parentOrder?.package_height !== null ? String(parentOrder.package_height) : '');
      setExpeditionFreightLength(parentOrder?.package_length !== undefined && parentOrder?.package_length !== null ? String(parentOrder.package_length) : '');
      setExpeditionFreightNotes('');
      setExpeditionFreightPackagingTypeId('');

      // Inicializar mapa de conferência individual de sobras e faltas por item
      const initialMap: Record<string, { producedQuantity: number; adjustmentAction: string }> = {};
      initialMap[item.id] = {
        producedQuantity: item.print_run || 0,
        adjustmentAction: 'CREDITO_PROXIMO_PEDIDO'
      };
      siblingItems.forEach((sib: any) => {
        initialMap[sib.id] = {
          producedQuantity: sib.print_run || 0,
          adjustmentAction: 'CREDITO_PROXIMO_PEDIDO'
        };
      });
      setExpeditionItemConferencyMap(initialMap);

      setIsExpeditionTransitionModalOpen(true);
      return;
    }

    // ---------------------------------------------------------------
    // REGRA DE TRANSIÇÃO PARA COLETA AGENDADA:
    // Exige preenchimento do Número da Nota, Número da Coleta e Cotação.
    // ---------------------------------------------------------------
    if ((targetStage.name === 'Coleta agendada' || targetStage.name === 'Coleta Agendada') && !coletaAgendadaMoveBypass.current) {
      const siblingItems = orderItems.filter(i => i.order_id === item.order_id && i.id !== item.id && i.stage_id !== targetStageId);

      setColetaAgendadaItem(item);
      setColetaAgendadaTargetStageId(targetStageId);
      setColetaInvoiceNumber(parentOrder?.invoice_number || '');
      setColetaPickupNumber(parentOrder?.pickup_number || '');
      setColetaFreightQuotation(parentOrder?.freight_quotation || '');
      setColetaSiblings(siblingItems);
      setColetaSelectedSiblings(siblingItems.map(s => s.id));

      setIsColetaAgendadaModalOpen(true);
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

    // Regra de negócio: Alerta didático de pedido bloqueado (sem sinal ou em atraso) ao mover para Produção, Estoque ou qualquer etapa
    const isParentPaid = !!parentOrder?.first_payment_date;
    const isOverdue = hasOverdueInstallments(item.order_id) || checkIsDelayed(item, stages);
    
    if ((!isParentPaid || isOverdue) && !blockedPaymentBypass.current) {
      setBlockedPaymentItem(item);
      setBlockedPaymentTargetStageId(targetStageId);
      setIsBlockedPaymentModalOpen(true);
      return;
    }

    // ---------------------------------------------------------------
    // REGRA DE AGRUPAMENTO DE IRMÃOS (/1, /2, etc.):
    // Pergunta se deseja mover todos os outros itens do mesmo pedido para a nova etapa
    // ---------------------------------------------------------------
    if (targetStage.name !== 'Expedição' && targetStage.name !== 'Coleta agendada' && targetStage.name !== 'Coleta Agendada' && !siblingMoveBypass.current) {
      const siblingItems = orderItems.filter(
        i => i.order_id === item.order_id && i.id !== item.id && i.stage_id !== targetStageId && i.product?.bind_to_first_item !== true
      );

      if (siblingItems.length > 0) {
        setSiblingMoveItem(item);
        setSiblingMoveTargetStageId(targetStageId);
        setSiblingMoveList(siblingItems);
        setSiblingMoveSelectedIds(siblingItems.map(s => s.id));
        setIsSiblingMoveModalOpen(true);
        return;
      }
    }

    // ---------------------------------------------------------------
    // REGRA DE ESTOQUE: VERIFICAR E BAIXAR AO ENTRAR EM PRODUÇÃO OU ESTOQUE
    // A baixa ocorre ao sair da primeira coluna (Pedidos/A produzir) para "Em produção" ou "Estoque"
    // ---------------------------------------------------------------
    const fromStageIdxStock = currentStageId ? stages.findIndex(s => s.id === currentStageId) : 0;
    const targetStageIdxStock = stages.findIndex(s => s.id === targetStageId);
    const isEnteringProductionOrStock = fromStageIdxStock === 0 && (targetStageIdxStock === 1 || targetStageIdxStock === 6 || targetStage.name === 'Em produção' || targetStage.name === 'Produção' || targetStage.name === 'Estoque');
    
    if (isEnteringProductionOrStock && item.product_id && !insufficientStockMoveBypass.current) {
      const qtyRequired = item.print_run || item.quantity || 1;
      const currentStock = await checkProductStock(item.product_id);

      if ((currentStock - qtyRequired) < 0) {
        setInsufficientStockData({
          insufficientItems: [{
            item: item,
            productName: item.product?.name || item.name || item.art_name,
            qtyRequired,
            currentStock
          }],
          sufficientItems: []
        });
        setSiblingMoveTargetStageId(targetStageId);
        setIsInsufficientStockModalOpen(true);
        return; // Interrompe para abrir o modal didático
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

        // BAIXA AUTOMÁTICA DE ESTOQUE
        if (isEnteringProductionOrStock && item.product_id) {
          const qtyRequired = item.print_run || item.quantity || 1;
          const userTenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
          try {
            await adjustStock(
              item.product_id,
              -qtyRequired, // negative because it's a deduction
              'PEDIDO',
              `Baixa automática pelo Pedido ${item.order?.pv_number || item.order_id} - Entrou em ${targetStage.name}`,
              userTenantId,
              user?.id || null,
              true // allow negative
            );
          } catch (stockErr) {
            console.error('Erro ao baixar estoque automaticamente:', stockErr);
          }
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

                      if (isBlockedPaymentModalOpen && blockedPaymentItem) {
                        const targetOrderId = blockedPaymentItem.order_id || blockedPaymentItem.order?.id;
                        const updatedOrder = ordersRes.data.find((o: any) => o.id === targetOrderId);
                        if (updatedOrder) {
                          const updatedItem = (updatedOrder.items || []).find((i: any) => i.id === blockedPaymentItem.id) || {
                            ...blockedPaymentItem,
                            order: updatedOrder
                          };
                          
                          const isPaid = !!updatedOrder.first_payment_date;
                          const isStillOverdue = hasOverdueInstallments(updatedOrder.id) || checkIsDelayed(updatedItem, stages);

                          if (isPaid && !isStillOverdue) {
                            setIsBlockedPaymentModalOpen(false);
                            setBlockedPaymentItem(null);
                            setBlockedSyncFeedback(null);
                            showToast('Pedido sincronizado com sucesso! O pagamento foi identificado no Conta Azul e o pedido foi liberado.');
                            blockedPaymentBypass.current = true;
                            moveOrderItemToStage(updatedItem, blockedPaymentTargetStageId);
                          } else {
                            setBlockedPaymentItem(updatedItem);
                            setBlockedSyncFeedback({
                              message: 'Sincronização concluída com sucesso! No entanto, o pagamento do sinal ainda não consta no ERP ou o pedido permanece em atraso financeiro. O status de bloqueio continua mantido.',
                              type: 'warning'
                            });
                          }
                        }
                      }
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

      const itemToMove = packagingModalItem;
      const targetStageId = packagingModalTargetStageId;
      setPackagingModalItem(null);
      setPackagingVolumes([]);

      // Chamar transição para Expedição que abrirá o modal de Consolidação e Sobras/Faltas
      await moveOrderItemToStage(itemToMove, targetStageId);
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
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.remove('is-dragging-card');
      document.body.style.cursor = '';
      const cols = document.querySelectorAll('.kanban-column');
      cols.forEach(c => c.classList.remove('column-drag-hover'));
      if (guideLineRef.current) {
        guideLineRef.current.style.opacity = '0';
      }
    }
    if (touchHoldTimer.current) {
      clearTimeout(touchHoldTimer.current);
      touchHoldTimer.current = null;
    }
    if (dragPendingTarget.current && activePointerId.current !== null) {
      try {
        if (dragPendingTarget.current.hasPointerCapture(activePointerId.current)) {
          dragPendingTarget.current.releasePointerCapture(activePointerId.current);
        }
      } catch (err) {}
    }
    if (dragCloneRef.current && dragCloneRef.current.parentNode) {
      dragCloneRef.current.parentNode.removeChild(dragCloneRef.current);
    }
    dragCloneRef.current = null;
    activeDragItemId.current = null;
    dragPendingItem.current = null;
    dragPendingTarget.current = null;
    isDragActive.current = false;
    activePointerId.current = null;
    currentOverStageId.current = null;
    currentOverIndex.current = null;
    cachedColumnRects.current = [];

    setDraggedItemId(null);
    setDragOverStageId(null);
    setDragOverIndex(null);
    
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);
  };

  const updateDragFrame = () => {
    if (!isDragActive.current || !dragCloneRef.current) return;

    // 1. Posiciona a cópia do card via GPU acelerada pura (60/120Hz liso)
    const x = lastPointerPos.current.x - dragOffset.current.x;
    const y = lastPointerPos.current.y - dragOffset.current.y;
    dragCloneRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(2deg)`;

    const curX = lastPointerPos.current.x;
    const curY = lastPointerPos.current.y;

    let foundCol: any = null;

    // 2. Procura no cache de coordenadas (ZERO reflows de DOM, ZERO React re-renders!)
    for (const col of cachedColumnRects.current) {
      if (curX >= col.left && curX <= col.right) {
        foundCol = col;
        break;
      }
    }

    // 3. Atualiza destaque da coluna e linha guia nativa via DOM puro (ZERO React setState)
    if (foundCol) {
      if (currentOverStageId.current !== foundCol.stageId) {
        currentOverStageId.current = foundStageIdRef(foundCol.stageId);
      }

      // Posiciona a linha guia de encaixe nativa (#kanban-drag-guide-line)
      if (guideLineRef.current) {
        let lineY = foundCol.top + 10;
        let cardIdx = foundCol.cardsY.length;
        for (let i = 0; i < foundCol.cardsY.length; i++) {
          if (curY < foundCol.cardsY[i].mid) {
            cardIdx = i;
            lineY = foundCol.cardsY[i].top - 3;
            break;
          } else {
            lineY = foundCol.cardsY[i].bottom + 3;
          }
        }
        currentOverIndex.current = cardIdx;

        guideLineRef.current.style.width = `${foundCol.width}px`;
        guideLineRef.current.style.transform = `translate3d(${foundCol.left}px, ${lineY}px, 0)`;
        guideLineRef.current.style.opacity = '1';
      }
    } else {
      if (currentOverStageId.current !== null) {
        currentOverStageId.current = null;
        const allCols = document.querySelectorAll('.kanban-column');
        allCols.forEach(c => c.classList.remove('column-drag-hover'));
      }
      if (guideLineRef.current) {
        guideLineRef.current.style.opacity = '0';
      }
    }
  };

  const foundStageIdRef = (stageId: string) => {
    const allCols = document.querySelectorAll('.kanban-column');
    allCols.forEach(c => {
      if (c.getAttribute('data-stage-id') === stageId) {
        c.classList.add('column-drag-hover');
      } else {
        c.classList.remove('column-drag-hover');
      }
    });
    return stageId;
  };

  const startDragMode = (item: any, currentTarget: HTMLElement, clientX: number, clientY: number) => {
    if (isDragActive.current) return;

    wasJustDragged.current = true;

    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }
    if (typeof document !== 'undefined') {
      document.body.classList.add('is-dragging-card');
      document.body.style.cursor = 'grabbing';

      // Cria a linha guia de encaixe no DOM nativo se ainda não existir
      let guide = document.getElementById('kanban-drag-guide-line');
      if (!guide) {
        guide = document.createElement('div');
        guide.id = 'kanban-drag-guide-line';
        document.body.appendChild(guide);
      }
      guideLineRef.current = guide;
    }

    isDragActive.current = true;
    const rect = currentTarget.getBoundingClientRect();

    // Cacheia coordenadas numéricas puras de todas as colunas e cards de uma só vez
    const cols = Array.from(document.querySelectorAll('.kanban-column'));
    cachedColumnRects.current = cols.map((cEl) => {
      const cRect = cEl.getBoundingClientRect();
      const cardEls = Array.from(cEl.querySelectorAll('.kanban-card-base'));
      const cardsY = cardEls.map((kEl) => {
        const kRect = kEl.getBoundingClientRect();
        return {
          top: kRect.top,
          bottom: kRect.bottom,
          mid: kRect.top + kRect.height / 2
        };
      });
      return {
        stageId: cEl.getAttribute('data-stage-id') || '',
        left: cRect.left,
        right: cRect.right,
        top: cRect.top,
        width: cRect.width,
        cardsY
      };
    });

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
    clone.style.opacity = '0.92';
    clone.style.zIndex = '999999';
    clone.style.pointerEvents = 'none';
    clone.style.userSelect = 'none';
    clone.style.webkitUserSelect = 'none';
    clone.style.transition = 'none';
    clone.style.transform = `translate3d(${clientX - dragOffset.current.x}px, ${clientY - dragOffset.current.y}px, 0) rotate(2deg)`;
    
    document.body.appendChild(clone);
    
    dragCloneRef.current = clone;
    activeDragItemId.current = item.id;
    setDraggedItemId(item.id);
  };

  const canUserMoveItemStage = (item: any) => {
    if (!user) return true;
    if (['Admin', 'Gerente', 'Comercial', 'Vendedor', 'Atendimento'].includes(user.role)) return true;
    if (user.role === 'Estoque') {
      const currentStage = stages.find(s => s.id === item.stage_id);
      return currentStage?.name === 'Estoque';
    }
    if (user.role === 'Expedição') {
      const currentStage = stages.find(s => s.id === item.stage_id);
      return currentStage && ['Em revisão', 'Expedição', 'Concluído'].includes(currentStage.name);
    }
    if (['Produção', 'Fábrica'].includes(user.role)) {
      return true;
    }
    return true;
  };

  const handlePointerDown = (e: React.PointerEvent, item: any) => {
    if ((e.pointerType as string) === 'touch') return;
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    wasJustDragged.current = false;

    const currentTarget = e.currentTarget as HTMLElement;
    const rect = currentTarget.getBoundingClientRect();
    
    activePointerId.current = e.pointerId;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    dragPendingItem.current = item;
    dragPendingTarget.current = currentTarget;
    isDragActive.current = false;

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    const dist = Math.hypot(deltaX, deltaY);

    if (!isDragActive.current) {
      if (dist < 4) return;
      if (dragPendingItem.current && dragPendingTarget.current) {
        startDragMode(dragPendingItem.current, dragPendingTarget.current, e.clientX, e.clientY);
      }
    }

    if (isDragActive.current) {
      if (e.cancelable) e.preventDefault();

      // Sincroniza com a taxa de atualização do monitor (rAF)
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          updateDragFrame();
        });
      }
    }
  };

  const handlePointerCancel = (e: PointerEvent) => {
    if (!isDragActive.current) {
      cleanupCustomDrag();
    }
  };

  const handlePointerUp = async (e: PointerEvent) => {
    const wasActive = isDragActive.current;
    const itemId = activeDragItemId.current;
    
    let targetStageId = currentOverStageId.current;
    if (!targetStageId && wasActive) {
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elementBelow) {
        const column = elementBelow.closest('.kanban-column');
        if (column) {
          targetStageId = column.getAttribute('data-stage-id');
        }
      }
    }

    cleanupCustomDrag();

    if (wasActive && itemId && targetStageId) {
      const itemToMove = orderItems.find(i => i.id === itemId);
      if (itemToMove && itemToMove.stage_id !== targetStageId) {
        await moveOrderItemToStage(itemToMove, targetStageId);
      }
    }

    // Mantém a trava por 150ms para capturar e anular o evento sintético onClick do navegador
    if (wasActive) {
      setTimeout(() => {
        wasJustDragged.current = false;
      }, 150);
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
    setFormInitialDestination('PRODUCAO');
    
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
      
      const cust = customers.find(c => c.id === order.customer_id);
      setFormCustomer(cust ? cust.name : '');
      setFormProduct(entity.product_id || '');
      setFormMeasure(getItemRealMeasure(entity));
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

      const existingAllocations = itemHandlingTeamsMap.get(entity.id) || [];
      if (existingAllocations.length > 0) {
        setFormHandlingAllocations(existingAllocations.map(a => ({
          handling_team_id: a.handling_team_id,
          quantity: a.quantity,
          is_completed: a.is_completed || false,
          completed_at: a.completed_at || ''
        })));
      } else {
        const defaultTeam = entity.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
        setFormHandlingAllocations([
          { handling_team_id: defaultTeam, quantity: Number(entity.print_run || 1000), is_completed: false, completed_at: '' }
        ]);
      }

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

      const specDetails = extractOrderDetails(entity.notes || order.notes);
      setFormCliche(specDetails?.cliche || '');
      setFormEmbalagem(specDetails?.embalagem || '');
      setFormPrazo(specDetails?.prazo || '');
      setFormFreteInfo(specDetails?.freteInfo || '');
      setFormMeioPag(specDetails?.meioPag || '');
      setFormFormaPag(specDetails?.formaPag || '');
    } else {
      // É um pedido macro vindo da listagem
      setSelectedOrder(entity);
      const correspondingItem = orderItems.find(item => item.order_id === entity.id);
      if (correspondingItem) {
        setSelectedItem(correspondingItem);
        setFormProduct(correspondingItem.product_id || '');
        setFormMeasure(getItemRealMeasure(correspondingItem));
        setFormPrintRun(correspondingItem.print_run || 1000);
        setFormBoxes(correspondingItem.boxes_count || 1);
        setFormNotes(correspondingItem.notes || '');
        setFormStatus(correspondingItem.status || 'A produzir');
        setFormStageId(correspondingItem.stage_id || '');
        setFormSector(correspondingItem.production_sector || 'Impressão');
        setFormMachineId(correspondingItem.machine_id || '');
        setFormHandlingTeamId(correspondingItem.handling_team_id || '');

        const existingAllocations = itemHandlingTeamsMap.get(correspondingItem.id) || [];
        if (existingAllocations.length > 0) {
          setFormHandlingAllocations(existingAllocations.map(a => ({
            handling_team_id: a.handling_team_id,
            quantity: a.quantity,
            is_completed: a.is_completed || false,
            completed_at: a.completed_at || ''
          })));
        } else {
          const defaultTeam = correspondingItem.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
          setFormHandlingAllocations([
            { handling_team_id: defaultTeam, quantity: Number(correspondingItem.print_run || 1000), is_completed: false, completed_at: '' }
          ]);
        }

        setFormArtName(correspondingItem.name || '');
        setFormPackagingType(correspondingItem.packaging_type || 'CAIXA');
        setFormOverShortQuantity(correspondingItem.over_short_quantity || 0);
        setFormPhysicalLocation(correspondingItem.physical_location || 'Salão');
      } else {
        setSelectedItem(null);
        setFormProduct(entity.product_id || '');
        setFormMeasure(getItemRealMeasure(entity));
        setFormPrintRun(entity.print_run || 1000);
        setFormBoxes(entity.boxes_count || 1);
        setFormNotes(entity.notes || '');
        setFormStatus(entity.status || 'A produzir');
        setFormStageId(entity.stage_id || '');
        setFormSector(entity.production_sector || 'Impressão');
        setFormMachineId('');
        setFormHandlingTeamId('');
        setFormHandlingAllocations([]);
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

  const resolveCustomerId = async (name: string) => {
    if (!name || !name.trim()) return null;
    const existingCust = customers.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existingCust) {
      return existingCust.id;
    } else {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const { data: newCust, error: custError } = await createCustomer({ name: name.trim(), tenant_id: tenantId });
      if (custError) {
        console.error('Erro ao criar cliente:', custError.message);
        return null;
      }
      if (newCust) return newCust.id;
    }
    return null;
  };

  const executeDetailsSave = async (opId?: string | null, opName?: string | null) => {
    if (!selectedItem) return;

    const activeOpId = opId || currentOperator.current?.id || user?.id;

    const specLines = [
      formCliche ? `Chichê: ${formCliche}` : '',
      formEmbalagem ? `Embalagem: ${formEmbalagem}` : '',
      formPrazo ? `Prazo de entrega: ${formPrazo}` : '',
      formFreteInfo ? `Frete: ${formFreteInfo}` : '',
      formMeioPag ? `Meio de pag.: ${formMeioPag}` : '',
      formFormaPag ? `Forma de pag.: ${formFormaPag}` : ''
    ].filter(Boolean).join('\n');

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
      handling_team_id: formHandlingAllocations[0]?.handling_team_id || formHandlingTeamId || null,
      physical_location: formPhysicalLocation,
      over_short_quantity: Number(formOverShortQuantity),
      notes: specLines || formNotes
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
      const resolvedCustomerId = await resolveCustomerId(formCustomer);
      orderPayload = {
        customer_id: resolvedCustomerId || null,
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

      // Gravar divisão de equipes de manuseio se estiver em Manuseio
      if (formHandlingAllocations && formHandlingAllocations.length > 0) {
        const validAllocations = formHandlingAllocations.filter(a => a.handling_team_id && a.quantity > 0);
        if (validAllocations.length > 0) {
          try {
            await saveOrderItemHandlingTeams(selectedItem.id, formHandlingAllocations);
            const { data: updatedTeams } = await getOrderItemHandlingTeams(selectedItem.id);
            if (updatedTeams) {
              setItemHandlingTeamsMap(prev => {
                const updated = new Map(prev);
                updated.set(selectedItem.id, updatedTeams);
                return updated;
              });
            }
          } catch (teamErr) {
            console.error('Erro ao salvar frações de manuseio no salvar do card:', teamErr);
          }
        }
      }

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
      let targetStage = stages.find(s => s.name === 'A produzir') || stages[0];
      let targetStatus = 'A produzir';
      let targetSector: any = 'Impressão';

      if (formInitialDestination === 'ESTOQUE') {
        const estoqueStage = stages.find(s => s.name === 'Estoque');
        if (estoqueStage) {
          targetStage = estoqueStage;
          targetStatus = 'Estoque';
          targetSector = 'Estoque';
        }
      }

      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const resolvedCustomerId = await resolveCustomerId(formCustomer);

      const orderPayload = {
        tenant_id: tenantId,
        customer_id: resolvedCustomerId || null,
        product_id: formProduct || null,
        measure: formMeasure,
        print_run: Number(formPrintRun),
        boxes_count: Number(formBoxes),
        freight_value: Number(formFreight),
        seller_name: formSeller || 'Vendas Samppel',
        notes: formNotes,
        internal_notes: formInternalNotes,
        status: targetStatus,
        stage_id: targetStage?.id || null,
        production_sector: targetSector,
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
          const resolvedCustomerId = await resolveCustomerId(formCustomer);
          updatePayload = {
            customer_id: resolvedCustomerId || null,
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

  const isSupervisor = (user?.role === 'Comercial' || user?.role === 'Vendedor') && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
  const isVendedor = (user?.role === 'Comercial' || user?.role === 'Vendedor') && !isSupervisor;
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

    // Não exibir cards de pedidos que constam como 'Em andamento' (Orçamento) ou 'Recusado' no Conta Azul
    const caStatusLower = (parentOrder.conta_azul_status || '').toLowerCase();
    if ((caStatusLower === 'em andamento' || caStatusLower.includes('andamento') || caStatusLower.includes('recusad') || caStatusLower.includes('rejeitad')) && filterContaAzulStatus !== parentOrder.conta_azul_status) {
      return false;
    }

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

  const getFreightBadgeStyle = (shippingType: string, notesFreight?: string | null) => {
    if (notesFreight) {
      const nfUpper = notesFreight.toUpperCase();
      if (nfUpper.includes('ENTREGA') && !nfUpper.includes('CORREIO') && !nfUpper.includes('SEDEX')) {
         return { backgroundColor: 'hsla(24, 95.8%, 53.1%, 0.15)', color: 'hsl(24, 95.8%, 53.1%)', label: capitalizeText(notesFreight) };
      }
      if (nfUpper.includes('CORREIO') || nfUpper.includes('SEDEX') || nfUpper.includes('PAC') || nfUpper.includes('TRANSP')) {
         return { backgroundColor: 'hsla(221.2, 83.2%, 53.3%, 0.15)', color: 'hsl(221.2, 83.2%, 53.3%)', label: capitalizeText(notesFreight) };
      }
      if (nfUpper.includes('LALA') || nfUpper.includes('MOTO')) {
         return { backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)', color: 'hsl(271, 91.2%, 65.1%)', label: capitalizeText(notesFreight) };
      }
      return { backgroundColor: 'hsla(215.4, 16.3%, 46.9%, 0.15)', color: 'hsl(215.4, 16.3%, 46.9%)', label: capitalizeText(notesFreight) };
    }

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

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial' || user?.role === 'Vendedor';
  
  const isReadOnlyForForm = (field: string) => {
    if (modalType === 'create') return false;
    if (user?.role === 'Administrador' || user?.role === 'Comercial' || user?.role === 'Vendedor') return false;
    
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
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem 0.75rem 0 0.75rem',
        boxSizing: 'border-box',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden'
      } : undefined}
    >
      <header className="page-header" style={{ display: isHeaderCollapsed ? 'none' : undefined, marginBottom: viewMode === 'kanban' ? '0.5rem' : undefined }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Pedidos & Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Acompanhe a produção física pelo Kanban ou gerencie o status de faturamento na listagem.
          </p>
        </div>
        
        {/* Controles de importação: só no modo lista (no kanban ficam na filter bar) */}
        {viewMode !== 'kanban' && !['Produção', 'Fábrica'].includes(user?.role || '') && (
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

      {/* ═══════════════════════════════════════════════════════════════
          BARRA DE FILTROS PREMIUM — KANBAN HEADER
          ═══════════════════════════════════════════════════════════════ */}
      {(() => {
        const activeFiltersCount = [
          filterCustomer,
          filterSeller,
          filterContaAzulStatus,
          filterPedidosRelease,
          filterStage
        ].filter(Boolean).length;

        return (
          <div
            className="filter-bar"
            style={{
              padding: '0.65rem 1rem',
              marginBottom: '0.5rem',
              flexShrink: 0,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            {/* ═══ SESSÃO 1: CABEÇALHO SUPERIOR (ALINHADO DA ESQUERDA) ═══ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
              
              {/* Esquerda: Logo + Ações alinhadas sequencialmente a partir da esquerda */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                
                {/* Logo da Samppel */}
                <div className="filterbar-logo" style={{ display: 'flex', alignItems: 'center', paddingRight: '0.75rem', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
                  <Image
                    src="/logo.png"
                    alt="Samppel Logo"
                    width={320}
                    height={85}
                    style={{ objectFit: 'contain', height: '32px', width: 'auto', maxHeight: '32px' }}
                    priority
                  />
                </div>

                {/* Botão Novo Pedido */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="btn btn-primary"
                  style={{
                    height: '32px', display: 'inline-flex', gap: '0.4rem', alignItems: 'center',
                    padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
                    backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff',
                    whiteSpace: 'nowrap', flexShrink: 0, borderRadius: 'var(--radius-md)', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                  }}
                  title="Cadastrar Novo Pedido Manualmente (Produção ou Estoque)"
                >
                  <Plus size={16} />
                  <span>Novo Pedido</span>
                </button>

                {/* Card de Importação Conta Azul */}
                {viewMode === 'kanban' && !['Produção', 'Fábrica'].includes(user?.role || '') && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0,
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '0.25rem 0.6rem'
                  }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      Conta Azul
                    </span>
                    <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

                    {/* Importar por Período */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <input
                        type="date"
                        value={importStartDate}
                        onChange={(e) => setImportStartDate(e.target.value)}
                        disabled={importing}
                        style={{
                          height: '26px', padding: '0.15rem 0.35rem', fontSize: '0.72rem',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface)', color: 'var(--text)', outline: 'none', width: '110px'
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>→</span>
                      <input
                        type="date"
                        value={importEndDate}
                        onChange={(e) => setImportEndDate(e.target.value)}
                        disabled={importing}
                        style={{
                          height: '26px', padding: '0.15rem 0.35rem', fontSize: '0.72rem',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface)', color: 'var(--text)', outline: 'none', width: '110px'
                        }}
                      />
                      <button
                        onClick={handleImportOrders}
                        disabled={importing}
                        className="btn btn-primary"
                        style={{
                          height: '26px', display: 'flex', gap: '0.3rem', alignItems: 'center',
                          padding: '0.18rem 0.6rem', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0,
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <RefreshCw size={11} className={importing ? 'spinner' : ''} />
                        <span>{importing ? 'Sincronizando...' : 'Por Período'}</span>
                      </button>
                    </div>

                    <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

                    {/* Importar por Pedido Nº */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <input
                        type="text"
                        placeholder="Nº PV..."
                        value={pullOrderNumber}
                        onChange={(e) => setPullOrderNumber(e.target.value)}
                        disabled={importing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSyncOrderByNumber(pullOrderNumber);
                        }}
                        style={{
                          height: '26px', padding: '0.15rem 0.35rem', fontSize: '0.72rem', width: '65px',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface)', color: 'var(--text)', outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleSyncOrderByNumber(pullOrderNumber)}
                        disabled={importing || !pullOrderNumber.trim()}
                        className="btn btn-secondary"
                        style={{
                          height: '26px', display: 'flex', gap: '0.25rem', alignItems: 'center',
                          padding: '0.18rem 0.55rem', fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0,
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <Download size={11} />
                        <span>Importar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direita: Segmented Control Modo de Exibição & Collapse */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2px',
                  height: '32px',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className="btn"
                    title="Visualização em Kanban"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.25rem 0.7rem', fontSize: '0.78rem', border: 'none', height: '100%',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                      color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: viewMode === 'kanban' ? 700 : 500,
                      boxShadow: viewMode === 'kanban' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <LayoutGrid size={14} />
                    <span className="desktop-only-inline">Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="btn"
                    title="Visualização em Lista"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.25rem 0.7rem', fontSize: '0.78rem', border: 'none', height: '100%',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                      color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: viewMode === 'list' ? 700 : 500,
                      boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    <List size={14} />
                    <span className="desktop-only-inline">Lista</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  className="btn btn-secondary"
                  title={isHeaderCollapsed ? 'Expandir painel de filtros' : 'Ocultar filtros'}
                  style={{
                    height: '32px', width: '32px', minWidth: '32px', padding: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isHeaderCollapsed ? 'var(--primary)' : 'var(--surface)',
                    color: isHeaderCollapsed ? '#ffffff' : 'var(--text-muted)',
                    borderColor: 'var(--border)'
                  }}
                >
                  {isHeaderCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* ═══ SESSÃO 2: PAINEL DE FILTROS & BUSCA ORGANIZADO EM CARDS ═══ */}
            {!isHeaderCollapsed && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                flexWrap: 'wrap',
                paddingTop: '0.45rem',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.2rem' }}>
                  <Filter size={13} />
                  <span>Filtros:</span>
                </div>

                {/* Busca PV / OP */}
                <div style={{ position: 'relative', flex: '1 1 150px', minWidth: '130px', maxWidth: '190px' }}>
                  <div style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    <Search size={13} />
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pesquisar PV/OP..."
                    value={filterSearchOrder}
                    onChange={(e) => setFilterSearchOrder(e.target.value)}
                    style={{ height: '30px', fontSize: '0.78rem', padding: '0.2rem 0.5rem 0.2rem 1.9rem', width: '100%', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>

                {/* Cliente */}
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filtrar Cliente..."
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  style={{ height: '30px', fontSize: '0.78rem', padding: '0.2rem 0.55rem', flex: '1 1 110px', minWidth: '90px', maxWidth: '160px', borderRadius: 'var(--radius-sm)' }}
                />

                {/* Vendedora */}
                <input
                  type="text"
                  className="form-input"
                  placeholder="Vendedora..."
                  value={filterSeller}
                  onChange={(e) => setFilterSeller(e.target.value)}
                  style={{ height: '30px', fontSize: '0.78rem', padding: '0.2rem 0.55rem', flex: '1 1 100px', minWidth: '85px', maxWidth: '140px', borderRadius: 'var(--radius-sm)' }}
                />

                {/* Status Conta Azul */}
                <select
                  className="form-select"
                  value={filterContaAzulStatus}
                  onChange={(e) => setFilterContaAzulStatus(e.target.value)}
                  style={{ height: '30px', fontSize: '0.76rem', padding: '0.2rem 0.45rem', flex: '1 1 110px', minWidth: '95px', maxWidth: '140px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">Status CA (Todos)</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Faturado">Faturado</option>
                  <option value="Recusado">Recusado</option>
                </select>

                {/* Liberações (Financeiro/Sinal) */}
                <select
                  className="form-select"
                  value={filterPedidosRelease}
                  onChange={(e) => setFilterPedidosRelease(e.target.value)}
                  style={{ height: '30px', fontSize: '0.76rem', padding: '0.2rem 0.45rem', flex: '1 1 110px', minWidth: '95px', maxWidth: '140px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">Liberações (Todas)</option>
                  <option value="liberados">Liberados</option>
                  <option value="bloqueados">Bloqueados</option>
                  <option value="autorizados">Com Autorização</option>
                </select>

                {/* Etapas Kanban */}
                <select
                  className="form-select"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  style={{ height: '30px', fontSize: '0.76rem', padding: '0.2rem 0.45rem', flex: '1 1 120px', minWidth: '105px', maxWidth: '150px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">Todas as Etapas</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>

                {/* Limpar Filtros Button */}
                {activeFiltersCount > 0 && (
                  <button
                    className="btn"
                    style={{
                      height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.65rem',
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
                      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                      color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb), 0.25)',
                      borderRadius: 'var(--radius-sm)', fontWeight: 600, whiteSpace: 'nowrap'
                    }}
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
                    <span style={{
                      backgroundColor: 'var(--primary)', color: '#ffffff',
                      borderRadius: '50%', width: '16px', height: '16px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700
                    }}>{activeFiltersCount}</span>
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}
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
            flex: '1 1 0',
            minHeight: 0,
            alignItems: 'stretch',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingTop: '0.25rem',
            paddingBottom: '0.5rem',
            boxSizing: 'border-box'
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
                  alignSelf: 'stretch',
                  backgroundColor: isEmpty ? 'hsla(0, 0%, 50%, 0.02)' : 'var(--background)',
                  border: isVirtual 
                    ? '2px dashed var(--danger)' 
                    : isEmpty ? '1px dashed var(--border)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem 0.4rem 0.2rem 0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  height: '100%',
                  maxHeight: '100%',
                  boxSizing: 'border-box',
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
                    minHeight: 0,
                    paddingBottom: '0.25rem'
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
                      const orderDetails = extractOrderDetails(item.notes || parentOrder.notes);
                      const freightStyle = getFreightBadgeStyle(parentOrder.shipping_type, orderDetails?.freteInfo);
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
                              touchAction: 'pan-y',
                              userSelect: 'none',
                              backgroundColor: isReleased ? 'var(--surface)' : 'var(--danger-bg)',
                              borderTop: isReleased ? '1px solid var(--border)' : '1.5px solid rgba(239, 68, 68, 0.35)',
                              borderRight: isReleased ? '1px solid var(--border)' : '1.5px solid rgba(239, 68, 68, 0.35)',
                              borderBottom: isReleased ? '1px solid var(--border)' : '1.5px solid rgba(239, 68, 68, 0.35)',
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
                              // Abre detalhes apenas em clique direto (não durante ou após um drag)
                              if (wasJustDragged.current) {
                                wasJustDragged.current = false;
                                return;
                              }
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
                            {parentOrder.op_number && (
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

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '1px' }}>
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
                                  width: 'fit-content'
                                }}>
                                  <Check size={8} strokeWidth={3} />
                                  {authNum}
                                </div>
                              );
                            })()}

                            {/* Destaque de Faturamento */}
                            {(() => {
                              const isFaturado = orderDetails?.faturamento || (orderDetails?.formaPag && orderDetails.formaPag.toLowerCase().includes('faturado'));
                              if (!isFaturado) return null;
                              
                              const text = orderDetails?.faturamento ? orderDetails.faturamento.toUpperCase() : 'PEDIDO FATURADO';
                              return (
                                <div style={{
                                  backgroundColor: 'hsla(220, 90%, 50%, 0.1)',
                                  border: '1px solid hsla(220, 90%, 50%, 0.35)',
                                  color: 'hsl(220, 90%, 40%)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '2px 6px',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  width: 'fit-content'
                                }}>
                                  <CheckCircle2 size={10} strokeWidth={2.5} />
                                  {text}
                                </div>
                              );
                            })()}
                          </div>

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

                          {/* Informações Extras (Clichê, Pagamento) */}
                          {(orderDetails?.cliche || orderDetails?.meioPag || orderDetails?.formaPag) && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1px',
                              fontSize: '0.62rem',
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                              marginBottom: '2px'
                            }}>
                              {orderDetails.cliche && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Clichê:</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={orderDetails.cliche}>{capitalizeText(orderDetails.cliche)}</span>
                                </div>
                              )}
                              {orderDetails.meioPag && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Pgto:</span>
                                  <span>{capitalizeText(orderDetails.meioPag)}{orderDetails.formaPag ? ` - ${capitalizeText(orderDetails.formaPag)}` : ''}</span>
                                </div>
                              )}
                              {!orderDetails.meioPag && orderDetails.formaPag && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Pgto:</span>
                                  <span>{capitalizeText(orderDetails.formaPag)}</span>
                                </div>
                              )}
                            </div>
                          )}

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
                                {(() => {
                                  const d = extractOrderDetails(item.notes || parentOrder.notes);
                                  if (d?.embalagem) return capitalizeText(d.embalagem);
                                  return item.boxes_count ? `${item.boxes_count}${item.packaging_type === 'PACOTE' ? 'pct' : 'cx'}` : null;
                                })()}
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

                          {/* Informações adicionais como Prazo e Vendedora + Botão Mover no Mobile */}
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span>Vend: {parentOrder.seller_name || 'Samppel'}</span>

                            {/* Botão Mover de Etapa (Mobile) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canUserMoveItemStage(item)) {
                                  setItemToMoveStage(item);
                                  setIsMoveStageModalOpen(true);
                                }
                              }}
                              disabled={!canUserMoveItemStage(item)}
                              className="btn btn-secondary mobile-only-flex"
                              style={{
                                fontSize: '0.62rem',
                                padding: '1px 6px',
                                height: '22px',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontWeight: 600,
                                opacity: canUserMoveItemStage(item) ? 1 : 0.45,
                                cursor: canUserMoveItemStage(item) ? 'pointer' : 'not-allowed'
                              }}
                              title={canUserMoveItemStage(item) ? 'Mover este pedido de etapa' : 'Sem permissão para mover de etapa'}
                            >
                              <ArrowRightLeft size={10} />
                              <span>Mover</span>
                            </button>
                          </div>

                          {/* Badge(s) de Equipe(s) de Manuseio com Suporte a Múltiplas Equipes e Quantidades */}
                          {(item.production_sector === 'Manuseio' || stage.name === 'Manuseio') && (() => {
                            const itemAllocations = itemHandlingTeamsMap.get(item.id) || [];
                            
                            if (itemAllocations.length > 0) {
                              return (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenHandlingTeamModalForItem(item, item.stage_id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.2rem',
                                    marginTop: '3px',
                                    cursor: 'pointer'
                                  }}
                                  title="Clique para gerenciar / alterar divisão de equipes de manuseio"
                                >
                                  {itemAllocations.map((alloc) => {
                                    const teamName = alloc.team?.name || handlingTeams.find(t => t.id === alloc.handling_team_id)?.name || 'Equipe';
                                    return (
                                      <div key={alloc.id || alloc.handling_team_id} style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.12)',
                                        border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: 'hsl(271, 91.2%, 55%)'
                                      }}>
                                        <Users size={10} />
                                        <span>{teamName} ({alloc.quantity.toLocaleString('pt-BR')})</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            return (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenHandlingTeamModalForItem(item, item.stage_id);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  marginTop: '3px',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  background: item.handling_team_id
                                    ? 'hsla(271, 91.2%, 65.1%, 0.12)'
                                    : 'hsla(0, 84.2%, 60.2%, 0.08)',
                                  border: `1px solid ${item.handling_team_id ? 'hsla(271, 91.2%, 65.1%, 0.3)' : 'hsla(0, 84.2%, 60.2%, 0.2)'}`,
                                  cursor: 'pointer'
                                }}
                                title="Clique para vincular / dividir equipes de manuseio"
                              >
                                <span style={{ 
                                  fontSize: '0.6rem', 
                                  fontWeight: 700,
                                  color: item.handling_team_id ? 'hsl(271, 91.2%, 55%)' : 'hsl(0, 84.2%, 50%)'
                                }}>
                                  {item.handling_team_id
                                    ? (handlingTeams.find(t => t.id === item.handling_team_id)?.name || 'Equipe desconhecida')
                                    : 'Sem equipe vinculada (Clique para definir)'
                                  }
                                </span>
                              </div>
                            );
                          })()}
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
                </div>

                {/* Rodapé da Coluna (Fixado na base da coluna, fora da rolagem de cards) */}
                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '0.35rem',
                  paddingBottom: '0.2rem',
                  paddingLeft: '0.35rem',
                  paddingRight: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--surface-subtle)',
                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  flexShrink: 0,
                  marginTop: 'auto'
                }}>
                  <span style={{ fontWeight: 600 }}>
                    {stageItems.length} {stageItems.length === 1 ? 'item' : 'itens'}
                  </span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stage.color }} />
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
                            {(() => {
                              const d = extractOrderDetails(order.notes);
                              if (d?.embalagem) return capitalizeText(d.embalagem);
                              return order.boxes_count ? `${order.boxes_count} ${order.packaging_type === 'PACOTE' ? 'pacote(s)' : 'caixa(s)'}` : '—';
                            })()}
                          </div>
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
            padding: '1.5rem', maxWidth: '780px', width: '100%',
            maxHeight: '88vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <Truck size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    Consolidação de Expedição e Frete
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pedido #{expeditionTransitionItem.order?.pv_number || expeditionTransitionItem.friendly_id} · {expeditionTransitionItem.order?.customer?.name || 'Cliente'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: expeditionSiblings.length > 0 ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              
              {/* COLUNA 1: CHECKLIST DE AGRUPAMENTO DE ITENS NA MESMA CAIXA/FRETE */}
              {expeditionSiblings.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        📦 Agrupar Itens na Mesma Caixa / Frete
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                    Este pedido foi desmembrado para produção. <strong>Marque abaixo os outros itens que você deseja colocar nesta mesma caixa/envio</strong> para irem juntos à Expedição:
                  </p>

                  {/* BOTOES DE AÇÃO RAPIDA MARCAR/DESMARCAR */}
                  <div style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0' }}>
                    <button
                      type="button"
                      onClick={() => setExpeditionSelectedSiblings(expeditionSiblings.map(s => s.id))}
                      style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                    >
                      ✓ Marcar Todos (Juntar Pedido Inteiro)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpeditionSelectedSiblings([])}
                      style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      Desmarcar Todos (Enviar Só Este)
                    </button>
                  </div>

                  {/* LISTA DE ITENS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Item Principal (Sempre selecionado) */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center',
                      padding: '0.5rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked disabled style={{ accentColor: 'var(--primary)' }} />
                        <div>
                          <strong style={{ color: 'var(--text)', display: 'block', fontSize: '0.8rem' }}>
                            {expeditionTransitionItem.friendly_id} · {expeditionTransitionItem.name}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Item atual sendo movido</span>
                        </div>
                      </div>
                    </div>

                    {/* Itens Irmãos */}
                    {expeditionSiblings.map((sib: any) => {
                      const sibStage = stages.find(s => s.id === sib.stage_id);
                      const isChecked = expeditionSelectedSiblings.includes(sib.id);
                      return (
                        <label key={sib.id} style={{
                          display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', cursor: 'pointer',
                          padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: isChecked ? 'var(--surface)' : 'transparent',
                          border: `1px solid ${isChecked ? 'var(--border)' : 'transparent'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExpeditionSelectedSiblings([...expeditionSelectedSiblings, sib.id]);
                                } else {
                                  setExpeditionSelectedSiblings(expeditionSelectedSiblings.filter(id => id !== sib.id));
                                }
                              }}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            <div>
                              <span style={{ color: 'var(--text)', fontWeight: 600, display: 'block' }}>
                                {sib.friendly_id || '—'} · {sib.name}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: isChecked ? 'var(--success)' : 'var(--text-muted)' }}>
                                {isChecked ? '↳ Será enviado junto nesta caixa' : '↳ Continuará na etapa atual'}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: (sibStage?.color || '#888') + '22',
                            color: sibStage?.color || 'var(--text-muted)',
                            border: `1px solid ${(sibStage?.color || '#888')}55`,
                            whiteSpace: 'nowrap'
                          }}>
                            {sibStage?.name || 'A produzir'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COLUNA 2: DADOS TÉCNICOS DE FRETE E EMBALAGEM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--surface-subtle)' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Truck size={16} /> Dados Técnicos de Frete Consolidados
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Tipo de Frete *</label>
                      <select
                        className="form-input"
                        required
                        value={selectedShippingType}
                        onChange={(e) => setSelectedShippingType(e.target.value)}
                        style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                      >
                        <option value="">Selecione...</option>
                        {shippingTypes.filter(s => s.status === 'ATIVO').map((type) => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Volumes/Caixas *</label>
                      <input 
                        type="number"
                        className="form-input"
                        min="1"
                        required
                        value={expeditionFreightVolumes || ''}
                        onChange={(e) => setExpeditionFreightVolumes(parseInt(e.target.value) || 1)}
                        style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                        placeholder="Ex: 1"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Peso (kg)</label>
                      <input type="number" step="0.01" className="form-input" value={expeditionFreightWeight} onChange={e => setExpeditionFreightWeight(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0.00" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Alt (cm)</label>
                      <input type="number" step="0.1" className="form-input" value={expeditionFreightHeight} onChange={e => setExpeditionFreightHeight(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Larg (cm)</label>
                      <input type="number" step="0.1" className="form-input" value={expeditionFreightWidth} onChange={e => setExpeditionFreightWidth(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Comp (cm)</label>
                      <input type="number" step="0.1" className="form-input" value={expeditionFreightLength} onChange={e => setExpeditionFreightLength(e.target.value)} style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* OCORRÊNCIAS DE EMBALAGEM / SOBRAS & FALTAS INDIVIDUAIS POR ITEM */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', backgroundColor: 'var(--surface)' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Conferência de Sobras & Faltas (Por Item)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Itens Selecionados: <strong>{[expeditionTransitionItem, ...expeditionSiblings.filter(s => expeditionSelectedSiblings.includes(s.id))].length}</strong>
                    </span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {[expeditionTransitionItem, ...expeditionSiblings.filter(s => expeditionSelectedSiblings.includes(s.id))].map((itm: any) => {
                      const itemData = expeditionItemConferencyMap[itm.id] || { producedQuantity: itm.print_run || 0, adjustmentAction: 'CREDITO_PROXIMO_PEDIDO' };
                      const orderedQty = itm.print_run || 0;
                      const diffQty = itemData.producedQuantity - orderedQty;

                      return (
                        <div key={itm.id} style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          padding: '0.65rem 0.75rem',
                          backgroundColor: 'var(--background)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                              {itm.friendly_id || 'Item'} · {itm.name}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Contratado: <strong>{orderedQty.toLocaleString('pt-BR')} un</strong>
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', alignItems: 'center' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.72rem' }}>Qtd Produzida Final *</label>
                              <input 
                                type="number"
                                min="0"
                                required
                                className="form-input"
                                value={itemData.producedQuantity}
                                onChange={(e) => updateExpeditionItemConferency(itm.id, 'producedQuantity', Number(e.target.value))}
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                              />
                            </div>

                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Saldo Calculado:</span>
                              {diffQty === 0 ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>0 (Sem sobras/faltas)</span>
                              ) : diffQty > 0 ? (
                                <span style={{ fontSize: '0.75rem', color: 'hsl(142.1, 76.2%, 36.3%)', fontWeight: 700 }}>+{diffQty.toLocaleString('pt-BR')} un (Sobra)</span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'hsl(346.8, 77.2%, 49.8%)', fontWeight: 700 }}>{diffQty.toLocaleString('pt-BR')} un (Falta)</span>
                              )}
                            </div>
                          </div>

                          {diffQty !== 0 && (
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.72rem' }}>Tratamento do Saldo (Cliente) *</label>
                              <select
                                className="form-select"
                                value={itemData.adjustmentAction}
                                onChange={(e) => updateExpeditionItemConferency(itm.id, 'adjustmentAction', e.target.value)}
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                {diffQty > 0 ? (
                                  <>
                                    <option value="CREDITO_PROXIMO_PEDIDO">Cortesia / Crédito para o Próximo Pedido</option>
                                    <option value="GUARDAR_ESTOQUE_CLIENTE">Guardar no Estoque de Personalizados (Fábrica)</option>
                                    <option value="COBRADO_ADICIONAL">Cobrar Valor Adicional do Cliente</option>
                                    <option value="OUTRO">Outro / Tratar Manualmente</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="PENDENCIA_ENTREGA">Registrar Pendência de Entrega (Gerar Crédito)</option>
                                    <option value="REPRODUCAO_PENDENTE">Programar Reprodução Pendente (Lote Corretivo)</option>
                                    <option value="CANCELADO_DESCONTO">Gerar Desconto Proporcional no Faturamento</option>
                                    <option value="OUTRO">Outro / Tratar Manualmente</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* OBSERVAÇÕES */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Observações da Expedição</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={expeditionTransitionNotes}
                    onChange={(e) => setExpeditionTransitionNotes(e.target.value)}
                    placeholder="Instruções de envio, notas de embalagem ou sobra/falta..."
                    style={{ padding: '0.4rem 0.5rem', fontSize: '0.8rem', marginTop: '0.2rem', resize: 'vertical' }}
                  />
                </div>
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
                  if (!selectedShippingType) {
                    alert('Por favor, informe o Tipo de Frete consolidado.');
                    return;
                  }

                  const activeItemsToMove = [
                    expeditionTransitionItem,
                    ...expeditionSiblings.filter(s => expeditionSelectedSiblings.includes(s.id))
                  ];

                  setLoading(true);
                  try {
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

                    // 1. Processar Ocorrências e Crédito/Débito Individual para Cada Item Selecionado
                    for (const itm of activeItemsToMove) {
                      const itemData = expeditionItemConferencyMap[itm.id] || {
                        producedQuantity: itm.print_run || 0,
                        adjustmentAction: 'CREDITO_PROXIMO_PEDIDO'
                      };
                      const orderedQty = itm.print_run || 0;
                      const diffQty = itemData.producedQuantity - orderedQty;

                      const updates: any = {
                        over_short_quantity: diffQty,
                        expedition_notes: expeditionTransitionNotes || null
                      };

                      if (diffQty < 0) {
                        updates.shortage_quantity = Math.abs(diffQty);
                        updates.courtesy_quantity = 0;
                        updates.adjustment_resolved = false;
                      } else if (diffQty > 0) {
                        updates.courtesy_quantity = diffQty;
                        updates.shortage_quantity = 0;
                        updates.adjustment_resolved = false;
                      } else {
                        updates.shortage_quantity = 0;
                        updates.courtesy_quantity = 0;
                        updates.adjustment_resolved = true;
                      }

                      // Update item no banco
                      const { error } = await updateOrderItem(itm.id, updates);
                      if (error) {
                        console.error(`Erro ao atualizar item ${itm.id}:`, error.message);
                      }

                      // Registra Log de Ajustes do Saldo (order_balance_adjustments)
                      if (diffQty !== 0) {
                        const adjType = diffQty >= 0 ? 'SOBRA' : 'FALTA';
                        await createOrderBalanceAdjustment({
                          tenant_id: tenantId,
                          order_id: itm.order_id,
                          order_item_id: itm.id,
                          customer_id: itm.order?.customer_id || expeditionTransitionItem.order?.customer_id,
                          product_id: itm.product_id,
                          ordered_quantity: orderedQty,
                          produced_quantity: itemData.producedQuantity,
                          difference_quantity: diffQty,
                          adjustment_type: adjType,
                          action_taken: itemData.adjustmentAction as any,
                          notes: expeditionTransitionNotes || `Registrado na consolidação da Expedição (${adjType})`,
                          created_by_name: user?.full_name || user?.email || 'Sistema'
                        });

                        // Registra Crédito/Débito em customer_stock_credits
                        if (['CREDITO_PROXIMO_PEDIDO', 'PENDENCIA_ENTREGA', 'REPRODUCAO_PENDENTE'].includes(itemData.adjustmentAction)) {
                          const creditType = diffQty < 0 ? 'PENDENCIA_ENTREGA' : 'CORTESIA_SOBRA';
                          const absQty = Math.abs(diffQty);

                          const { error: creditError } = await createCustomerStockCredit({
                            tenant_id: tenantId,
                            customer_id: itm.order?.customer_id || expeditionTransitionItem.order?.customer_id,
                            product_id: itm.product_id,
                            credit_type: creditType,
                            original_quantity: absQty,
                            remaining_quantity: absQty,
                            source_order_id: itm.order_id,
                            source_adjustment_id: null,
                            status: 'ATIVO',
                            notes: expeditionTransitionNotes || `Registrado na Expedição (${diffQty < 0 ? 'Falta' : 'Cortesia'})`
                          });

                          if (creditError) {
                            console.error('Erro ao registrar saldo acumulado do cliente:', creditError.message);
                          }
                        }
                      }
                    }

                    // 2. Salvar Dados Técnicos de Frete (Consolidado)
                    await updateOrder(expeditionTransitionItem.order_id, {
                      shipping_type: selectedShippingType as any,
                      notes: expeditionFreightNotes ? (expeditionTransitionItem.order?.notes + '\n' + expeditionFreightNotes) : expeditionTransitionItem.order?.notes
                    });

                    await saveOrderShippingVolumes(expeditionTransitionItem.order_id, [{
                      order_id: expeditionTransitionItem.order_id,
                      volume_number: expeditionFreightVolumes,
                      weight_kg: parseFloat(expeditionFreightWeight) || null,
                      width_cm: parseFloat(expeditionFreightWidth) || null,
                      height_cm: parseFloat(expeditionFreightHeight) || null,
                      length_cm: parseFloat(expeditionFreightLength) || null,
                      packaging_type_id: expeditionFreightPackagingTypeId || null,
                      notes: expeditionFreightNotes || null
                    }], tenantId);

                    // 3. Mover Todos os Itens Selecionados para a Expedição
                    setIsExpeditionTransitionModalOpen(false);
                    for (const itm of activeItemsToMove) {
                      expeditionTransitionMoveBypass.current = true;
                      await moveOrderItemToStage(itm, expeditionTransitionTargetStageId);
                    }

                    setExpeditionTransitionItem(null);
                  } catch (err) {
                    console.error(err);
                    alert('Ocorreu um erro ao salvar os dados da expedição.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Processando...' : 'Confirmar Expedição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE DADOS DA COLETA AGENDADA (NOTA, COLETA E COTAÇÃO) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isColetaAgendadaModalOpen && coletaAgendadaItem && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                <Clock size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  Dados da Coleta Agendada
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Pedido #{coletaAgendadaItem.order?.pv_number || coletaAgendadaItem.friendly_id} · {coletaAgendadaItem.order?.customer?.name || 'Cliente'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Preencha os dados do despacho de <strong>{coletaAgendadaItem.friendly_id}</strong> para agendar a coleta:
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                // 1. Atualizar informações de Coleta no Pedido Principal
                await updateOrder(coletaAgendadaItem.order_id, {
                  invoice_number: coletaInvoiceNumber || null,
                  pickup_number: coletaPickupNumber || null,
                  freight_quotation: coletaFreightQuotation || null
                });

                // 2. Mover Item Principal para Coleta Agendada
                coletaAgendadaMoveBypass.current = true;
                setIsColetaAgendadaModalOpen(false);
                await moveOrderItemToStage(coletaAgendadaItem, coletaAgendadaTargetStageId);

                // 3. Mover Itens Irmãos Selecionados
                if (coletaSelectedSiblings.length > 0) {
                  for (const sibId of coletaSelectedSiblings) {
                    const sibItem = orderItems.find(i => i.id === sibId);
                    if (sibItem) {
                      coletaAgendadaMoveBypass.current = true;
                      await moveOrderItemToStage(sibItem, coletaAgendadaTargetStageId);
                    }
                  }
                }

                setColetaAgendadaItem(null);
              } catch (err) {
                console.error('Erro ao salvar dados da coleta agendada:', err);
                alert('Ocorreu um erro ao salvar os dados da coleta.');
              } finally {
                setLoading(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Número da Nota (NF-e) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={coletaInvoiceNumber}
                    onChange={(e) => setColetaInvoiceNumber(e.target.value)}
                    placeholder="Ex: 12345"
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Número da Coleta *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={coletaPickupNumber}
                    onChange={(e) => setColetaPickupNumber(e.target.value)}
                    placeholder="Ex: COL-98765"
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.78rem' }}>Cotação de Frete *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={coletaFreightQuotation}
                    onChange={(e) => setColetaFreightQuotation(e.target.value)}
                    placeholder="Ex: COT-44521 ou R$ 150"
                    style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* CHECKLIST DE ITENS IRMÃOS PARA COLETA AGENDADA */}
              {coletaSiblings.length > 0 && (
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                    📦 Mover outros itens deste pedido para Coleta Agendada juntos ({coletaSiblings.length})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {coletaSiblings.map((sib: any) => {
                      const sibStage = stages.find(s => s.id === sib.stage_id);
                      const isChecked = coletaSelectedSiblings.includes(sib.id);
                      return (
                        <label key={sib.id} style={{
                          display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center', cursor: 'pointer',
                          padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: isChecked ? 'var(--surface)' : 'transparent',
                          border: `1px solid ${isChecked ? 'var(--border)' : 'transparent'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setColetaSelectedSiblings([...coletaSelectedSiblings, sib.id]);
                                } else {
                                  setColetaSelectedSiblings(coletaSelectedSiblings.filter(id => id !== sib.id));
                                }
                              }}
                              style={{ accentColor: '#10b981' }}
                            />
                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                              {sib.friendly_id || '—'} · {sib.name}
                            </span>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: (sibStage?.color || '#888') + '22',
                            color: sibStage?.color || 'var(--text-muted)',
                            border: `1px solid ${(sibStage?.color || '#888')}55`,
                            whiteSpace: 'nowrap'
                          }}>
                            {sibStage?.name || 'Expedição'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsColetaAgendadaModalOpen(false);
                    setColetaAgendadaItem(null);
                    resetAllBypasses();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Agendando...' : 'Confirmar e Agendar Coleta'}
                </button>
              </div>
            </form>
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
      {isHandlingTeamModalOpen && handlingTeamModalItem && (() => {
        const parentOrder = orders.find(o => o.id === handlingTeamModalItem.order_id) || handlingTeamModalItem.order;
        const allSiblingItems = orderItems.filter(i => i.order_id === handlingTeamModalItem.order_id);
        const totalItemQty = Number(handlingTeamModalItem.print_run || handlingTeamModalItem.quantity || 0);
        const totalAllocated = handlingTeamAllocations.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
        const isTargetManuseio = handlingTeamModalTargetStageId && stages.find(s => s.id === handlingTeamModalTargetStageId)?.name === 'Manuseio';
        const isCurrentManuseio = stages.find(s => s.id === handlingTeamModalItem.stage_id)?.name === 'Manuseio';
        const showConferenceChecks = isCurrentManuseio || isTargetManuseio;

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 3000, padding: '1rem', backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
              padding: '1.5rem', maxWidth: '640px', width: '100%',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'hsl(271, 91.2%, 55%)'
                  }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                      Vincular Equipe de Manuseio
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {parentOrder?.pv_number ? `Pedido / PV: ${parentOrder.pv_number}` : `Pedido #${parentOrder?.order_number || 'S/N'}`} · Cliente: <strong>{parentOrder?.customer?.name || handlingTeamModalItem.customer_name || 'Não informado'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Seletor de Itens Irmãos do Pedido (quando houver múltiplos) */}
                {allSiblingItems.length > 1 && (
                  <div style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Itens deste Pedido ({allSiblingItems.length} itens no lote):
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Clique para alternar o item
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
                      {allSiblingItems.map((itm) => {
                        const isSelected = itm.id === handlingTeamModalItem.id;
                        const itmAllocations = itemHandlingTeamsMap.get(itm.id) || [];
                        const isDone = itmAllocations.length > 0 && itmAllocations.every(a => a.is_completed);
                        const itmStage = stages.find(s => s.id === itm.stage_id);

                        return (
                          <button
                            key={itm.id}
                            type="button"
                            onClick={() => handleSwitchHandlingModalItem(itm)}
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.76rem',
                              fontWeight: isSelected ? 700 : 500,
                              backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                              color: isSelected ? '#ffffff' : 'var(--text)',
                              border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ opacity: isSelected ? 1 : 0.8 }}>{itm.friendly_id || `/${itm.item_index}`}</span>
                            <span>·</span>
                            <span>{itm.name?.slice(0, 16)}{itm.name?.length > 16 ? '...' : ''}</span>
                            <span style={{ opacity: 0.85 }}>({Number(itm.print_run || 0).toLocaleString('pt-BR')} un)</span>
                            {isDone && <Check size={12} style={{ color: isSelected ? '#fff' : 'var(--success)' }} />}
                            {itmStage && !isSelected && (
                              <span style={{ fontSize: '0.65rem', opacity: 0.7, padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--background)' }}>
                                {itmStage.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Card com Detalhes Completos do Item Ativo */}
                <div style={{
                  backgroundColor: 'hsla(var(--primary-rgb), 0.04)',
                  border: '1px solid hsla(var(--primary-rgb), 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        {handlingTeamModalItem.friendly_id || `Item #${handlingTeamModalItem.item_index || 1}`}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                        {handlingTeamModalItem.name}
                      </span>
                    </div>

                    <div style={{
                      padding: '3px 10px',
                      borderRadius: '99px',
                      backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)',
                      color: 'hsl(271, 91.2%, 50%)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)'
                    }}>
                      Tiragem: {totalItemQty.toLocaleString('pt-BR')} un
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>Medida: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.measure || 'Padrão'}</strong></span>
                    {handlingTeamModalItem.production_sector && (
                      <span>Setor Atual: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.production_sector}</strong></span>
                    )}
                    {handlingTeamModalItem.boxes_count && (
                      <span>Volumes: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.boxes_count} cx</strong></span>
                    )}
                  </div>
                </div>

                {/* Distribuição de Lotes e Equipes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>
                        Distribuição de Lotes e Equipes *
                      </label>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '99px',
                        backgroundColor: totalAllocated === totalItemQty
                          ? 'hsla(142, 71%, 45%, 0.12)'
                          : totalAllocated < totalItemQty
                          ? 'hsla(45, 93%, 47%, 0.15)'
                          : 'hsla(0, 84%, 60%, 0.15)',
                        color: totalAllocated === totalItemQty
                          ? 'hsl(142, 71%, 35%)'
                          : totalAllocated < totalItemQty
                          ? 'hsl(45, 93%, 35%)'
                          : 'hsl(0, 84%, 45%)',
                        border: `1px solid ${totalAllocated === totalItemQty ? 'hsla(142, 71%, 45%, 0.3)' : totalAllocated < totalItemQty ? 'hsla(45, 93%, 47%, 0.3)' : 'hsla(0, 84%, 60%, 0.3)'}`
                      }}>
                        {totalAllocated === totalItemQty
                          ? `Total: ${totalAllocated.toLocaleString('pt-BR')} un (100% Distribuído)`
                          : totalAllocated < totalItemQty
                          ? `Alocado: ${totalAllocated.toLocaleString('pt-BR')} / ${totalItemQty.toLocaleString('pt-BR')} un (Faltam ${(totalItemQty - totalAllocated).toLocaleString('pt-BR')})`
                          : `Alocado: ${totalAllocated.toLocaleString('pt-BR')} / ${totalItemQty.toLocaleString('pt-BR')} un (Excesso de ${(totalAllocated - totalItemQty).toLocaleString('pt-BR')})`}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        const remaining = Math.max(0, totalItemQty - totalAllocated);
                        setHandlingTeamAllocations(prev => [
                          ...prev,
                          { handling_team_id: '', quantity: remaining, is_completed: false, completed_at: '' }
                        ]);
                      }}
                    >
                      <Plus size={14} /> Adicionar Lote
                    </button>
                  </div>

                  {handlingTeamAllocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                        backgroundColor: 'var(--background)',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Lote {idx + 1} - Equipe de Manuseio
                        </label>
                        <select
                          className="form-select"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', marginTop: '2px' }}
                          value={alloc.handling_team_id}
                          onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, handling_team_id: e.target.value } : a))}
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
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', marginTop: '2px' }}
                          value={alloc.quantity || ''}
                          placeholder="Qtd."
                          onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, quantity: Number(e.target.value) } : a))}
                        />
                      </div>

                      {showConferenceChecks && (
                        <>
                          <div style={{ flex: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Conferido</label>
                            <input
                              type="checkbox"
                              style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: '6px' }}
                              checked={alloc.is_completed || false}
                              onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? {
                                ...a,
                                is_completed: e.target.checked,
                                completed_at: e.target.checked ? (a.completed_at || new Date().toISOString().slice(0, 10)) : ''
                              } : a))}
                            />
                          </div>

                          <div style={{ flex: 1.3 }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Data Conclusão</label>
                            <input
                              type="date"
                              className="form-input"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', marginTop: '2px' }}
                              value={alloc.completed_at || ''}
                              onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, completed_at: e.target.value } : a))}
                              disabled={!alloc.is_completed}
                            />
                          </div>
                        </>
                      )}

                      {handlingTeamAllocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setHandlingTeamAllocations(prev => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            marginTop: '1.25rem',
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
              </div>

              {/* Rodapé e Ações */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsHandlingTeamModalOpen(false);
                    setHandlingTeamModalItem(null);
                    setHandlingTeamModalTargetStageId('');
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
                    // Validações
                    const validAllocations = handlingTeamAllocations.filter(a => a.handling_team_id && a.quantity > 0);
                    if (validAllocations.length === 0) {
                      alert('Por favor, selecione ao menos uma equipe de manuseio com quantidade maior que zero.');
                      return;
                    }

                    const hasIncompleteRow = handlingTeamAllocations.some(a => (a.quantity > 0 && !a.handling_team_id) || (a.handling_team_id && !a.quantity));
                    if (hasIncompleteRow) {
                      alert('Existem lotes preenchidos incorretamente. Verifique se todos possuem equipe e quantidade.');
                      return;
                    }

                    setLoading(true);
                    try {
                      // 1. Salva no banco de dados
                      await saveOrderItemHandlingTeams(handlingTeamModalItem.id, handlingTeamAllocations);
                      
                      // 2. Atualiza estado local de alocações
                      const { data } = await getOrderItemHandlingTeams(handlingTeamModalItem.id);
                      if (data) {
                        setItemHandlingTeamsMap(prev => {
                          const updated = new Map(prev);
                          updated.set(handlingTeamModalItem.id, data);
                          return updated;
                        });
                      }

                      showToast(`Equipes de manuseio do item ${handlingTeamModalItem.friendly_id || ''} salvas com sucesso!`);

                      // 3. Se for movimentação para etapa, executa o move
                      if (handlingTeamModalTargetStageId && handlingTeamModalTargetStageId !== handlingTeamModalItem.stage_id) {
                        handlingTeamMoveBypass.current = true;
                        await moveOrderItemToStage(handlingTeamModalItem, handlingTeamModalTargetStageId);
                      }

                      setIsHandlingTeamModalOpen(false);
                      setHandlingTeamModalItem(null);
                      setHandlingTeamModalTargetStageId('');
                    } catch (err: any) {
                      console.error('Erro ao salvar equipes de manuseio:', err);
                      alert('Erro ao salvar equipes de manuseio: ' + (err.message || 'Falha ao gravar no banco.'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? 'Gravando...' : (handlingTeamModalTargetStageId && handlingTeamModalTargetStageId !== handlingTeamModalItem.stage_id ? 'Salvar e Mover para Manuseio' : 'Salvar Distribuição')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 300000, padding: '1rem', backdropFilter: 'blur(4px)'
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
                
                {/* Seleção do Destino Inicial (Obrigatório na Criação) */}
                {modalType === 'create' && (
                  <div className="form-group" style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block' }}>
                      Destino Inicial Obrigatório do Pedido *
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
                <div className="form-group">
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
                            setShippingTypes(prev => prev.filter(t => t.id !== type.id));
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
              backgroundColor: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999,
              padding: '0.5rem',
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg, 12px)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '860px',
              maxHeight: 'min(92vh, calc(100dvh - 1rem))',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header Padrão do Sistema (Responsivo no Mobile) */}
              <div style={{
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                background: `linear-gradient(135deg, ${currentStage?.color || 'var(--primary)'}18 0%, transparent 100%)`,
                borderLeft: `4px solid ${currentStage?.color || 'var(--primary)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 280px', minWidth: 0 }}>
                  <Image 
                    src="/logo.png" 
                    alt="Samppel Logo" 
                    width={210} 
                    height={55} 
                    style={{ objectFit: 'contain', height: '52px', width: 'auto', maxHeight: '52px', flexShrink: 0 }}
                    priority 
                  />
                  <div style={{ height: '36px', width: '1px', backgroundColor: 'var(--border)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', wordBreak: 'break-all' }}>
                        {detailItem.friendly_id || order.pv_number || '---'}
                      </span>
                      {currentStage && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700,
                          backgroundColor: currentStage.color + '22',
                          color: currentStage.color,
                          padding: '2px 8px', borderRadius: '99px',
                          border: `1px solid ${currentStage.color}55`,
                          whiteSpace: 'nowrap'
                        }}>
                          {currentStage.name}
                        </span>
                      )}
                      {isOverdue && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>Atrasado</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer.name || 'Cliente'} · {detailItem.name}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                  {(!user?.role || user.role !== 'Produção' || currentStage?.name === 'Em produção') && (
                    <button
                      onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                      className="btn btn-primary"
                      title="Editar informações do pedido"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                    >
                      <Edit3 size={12} />
                      <span className="desktop-only-inline">Editar</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.3rem' }}
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
                      { label: 'Nota Fiscal (NF-e)', value: order.invoice_number || '—' },
                      { label: 'Número da Coleta', value: order.pickup_number || '—' },
                      { label: 'Cotação de Frete', value: order.freight_quotation || '—' },
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
                    {(() => {
                      const specDetails = extractOrderDetails(detailItem.notes || order.notes);
                      const packagingText = specDetails?.embalagem || (detailItem.boxes_count ? `${detailItem.boxes_count} ${detailItem.packaging_type === 'PACOTE' ? 'pct' : 'cx'}` : null);

                      const specsList = [
                        { label: 'OP', value: capitalizeText(specDetails?.op) },
                        { label: 'Tiragem', value: detailItem.print_run ? detailItem.print_run.toLocaleString('pt-BR') + ' un' : '—' },
                        { label: 'Clichê', value: capitalizeText(specDetails?.cliche) },
                        { label: 'Embalagem', value: capitalizeText(packagingText) },
                        { label: 'Medida', value: capitalizeText(getItemRealMeasure(detailItem)) },
                        { label: 'Impressão', value: capitalizeText(specDetails?.impressao) },
                        { label: 'Prazo de Entrega', value: capitalizeText(specDetails?.prazo) },
                        { label: 'Frete', value: capitalizeText(specDetails?.freteInfo) },
                        { label: 'Meio de Pagamento', value: capitalizeText(specDetails?.meioPag) },
                        { label: 'Forma de Pagamento', value: capitalizeText(specDetails?.formaPag) },
                        { label: 'Faturamento', value: capitalizeText(specDetails?.faturamento) },
                        { label: 'Máquina Vinculada', value: capitalizeText(machineName) },
                        { label: 'Localização', value: capitalizeText(detailItem.physical_location) },
                        { label: 'Sobra/Falta Produção', value: detailItem.over_short_quantity ? (detailItem.over_short_quantity > 0 ? `+${detailItem.over_short_quantity}` : `${detailItem.over_short_quantity}`) : '—' },
                        { label: 'Falta na Entrega', value: detailItem.shortage_quantity ? `${detailItem.shortage_quantity} un` : '—' },
                        { label: 'Cortesia/Brinde', value: detailItem.courtesy_quantity ? `${detailItem.courtesy_quantity} un` : '—' },
                      ];

                      return specsList.map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                        </div>
                      ));
                    })()}
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
                        title={syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar Conta Azul'}
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
                        <span className="desktop-only-inline">{syncingSingleOrder ? 'Sincronizando...' : 'Sincronizar Conta Azul'}</span>
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


                {/* Seção: Observações e Anotações Internas */}
                <section style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ width: '4px', height: '14px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Observações e Anotações Internas
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Observações (Visível para todos)</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre-wrap', backgroundColor: 'var(--background)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        {detailItem.notes || order.notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma observação informada.</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Anotações Internas (Uso Interno)</span>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre-wrap', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px dashed var(--primary)' }}>
                        {order.internal_notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma anotação interna informada.</span>}
                      </div>
                    </div>
                  </div>
                </section>

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
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
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

      {/* ═══ MODAL DE ESTOQUE INSUFICIENTE ═══ */}
      {isInsufficientStockModalOpen && insufficientStockData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 12px)',
            width: '100%', maxWidth: '550px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.5rem', borderBottom: '1px solid var(--border)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                  Atenção: Estoque Insuficiente
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Alguns produtos não possuem saldo suficiente para este avanço.
                </p>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Os itens abaixo não possuem estoque suficiente. <strong>Selecione os que você deseja forçar o avanço</strong> (o estoque ficará negativo). Os que não forem selecionados <strong>permanecerão em Pedidos</strong>.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insufficientStockData.insufficientItems.map((stk: any) => {
                  const isSelected = selectedInsufficientItemIds.includes(stk.item.id);
                  return (
                    <label key={stk.item.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-body)',
                      transition: 'all 0.2s'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInsufficientItemIds(prev => [...prev, stk.item.id]);
                          } else {
                            setSelectedInsufficientItemIds(prev => prev.filter(id => id !== stk.item.id));
                          }
                        }}
                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                          {stk.productName}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Necessário: <strong style={{ color: '#ef4444' }}>{stk.qtyRequired}</strong>
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Em Estoque: <strong>{stk.currentStock}</strong>
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Ficará: <strong style={{ color: '#ef4444' }}>{stk.currentStock - stk.qtyRequired}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-body)' }}>
              <button 
                onClick={() => {
                  const selectedItems = insufficientStockData.insufficientItems
                    .filter((stk: any) => selectedInsufficientItemIds.includes(stk.item.id))
                    .map((stk: any) => stk.item);
                  handleConfirmInsufficientStockMove(selectedItems);
                }}
                className="btn btn-primary"
                style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', backgroundColor: 'var(--primary)', border: 'none' }}
              >
                Confirmar Avanço
              </button>
              <button 
                onClick={handleCancelInsufficientStockMove}
                className="btn btn-secondary"
                style={{ flex: 1, height: '38px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
              >
                Cancelar Movimentação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DE CONFIRMAÇÃO DE MOVIMENTAÇÃO DE ITENS IRMÃOS DE UM MESMO PEDIDO ═══ */}
      {isSiblingMoveModalOpen && siblingMoveItem && (() => {
        const targetStg = stages.find(s => s.id === siblingMoveTargetStageId);
        const targetStageName = targetStg?.name || 'etapa selecionada';
        const parentOrd = orders.find(o => o.id === siblingMoveItem.order_id) || siblingMoveItem.order;

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200000,
            backdropFilter: 'blur(4px)', padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
              maxWidth: '560px', width: '100%', overflow: 'hidden',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease', color: 'var(--text)'
            }}>
              {/* Header */}
              <div style={{
                backgroundColor: 'var(--primary)',
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
                  <Layers size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    Mover Outros Itens deste Pedido?
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                    Este pedido possui múltiplos cards vinculados ({siblingMoveList.length + 1} no total).
                  </p>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Resumo do Pedido */}
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)' }}>
                      PV: {parentOrd?.pv_number || 'Pedido'}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Etapa Destino: <strong style={{ color: 'var(--text)' }}>{targetStageName}</strong>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Cliente: <strong>{parentOrd?.customer?.name || 'Cliente não informado'}</strong>
                  </div>
                </div>

                {/* Pergunta Explicativa */}
                <div style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  Você está movendo o item <strong>{siblingMoveItem.name || siblingMoveItem.art_name}</strong>. Marque os outros itens deste pedido que também devem ser movidos para a etapa <strong>{targetStageName}</strong>:
                </div>

                {/* Lista dos Itens do Pedido com Checkboxes */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  maxHeight: '220px', overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem'
                }}>
                  {/* Item Atual (Fixo e Checado) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.45rem 0.65rem', borderRadius: '6px',
                    backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
                    border: '1px solid rgba(var(--primary-rgb), 0.2)'
                  }}>
                    <input type="checkbox" checked disabled style={{ accentColor: 'var(--primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {siblingMoveItem.name || siblingMoveItem.art_name} (Item Principal)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Sendo movido agora para {targetStageName}
                      </span>
                    </div>
                  </div>

                  {/* Outros Itens Irmãos */}
                  {siblingMoveList.map((sib: any) => {
                    const currentStg = stages.find(s => s.id === sib.stage_id);
                    const isChecked = siblingMoveSelectedIds.includes(sib.id);

                    return (
                      <label
                        key={sib.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.45rem 0.65rem', borderRadius: '6px',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isChecked ? 'var(--surface)' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSiblingMoveSelectedIds([...siblingMoveSelectedIds, sib.id]);
                            } else {
                              setSiblingMoveSelectedIds(siblingMoveSelectedIds.filter(id => id !== sib.id));
                            }
                          }}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                            {sib.name || sib.art_name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Fase atual: {currentStg?.name || 'Desconhecida'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Botões de Ação */}
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelSiblingMove}
                    style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleConfirmSiblingMoveAll(false)}
                    style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Mover Apenas Este Item
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleConfirmSiblingMoveAll(true)}
                    disabled={siblingMoveSelectedIds.length === 0}
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Mover Selecionados ({siblingMoveSelectedIds.length + 1})
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: ALERTA DE FATURADO (AO ENTRAR NA EXPEDIÇÃO) */}
      {isFaturadoAlertModalOpen && faturadoAlertItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
            maxWidth: '500px', width: '90%', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            <div style={{
              backgroundColor: '#3b82f6',
              padding: '1.25rem 1.5rem',
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <AlertCircle size={28} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Atenção: Pedido Faturado</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                  Verifique os procedimentos de faturamento antes de prosseguir.
                </p>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                O pedido <strong>{faturadoAlertItem.order?.pv_number || faturadoAlertItem.order_id}</strong> possui a forma de pagamento definida como <strong>FATURADO</strong>.
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                Certifique-se de que a nota fiscal e as condições de pagamento estão corretas antes de prosseguir com a Expedição. Deseja continuar a movimentação?
              </p>
            </div>
            
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-body)', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                onClick={handleCancelFaturadoAlertMove}
                style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)', backgroundColor: 'transparent' }}
              >
                Cancelar
              </button>
              <button 
                className="btn" 
                onClick={handleConfirmFaturadoAlertMove}
                style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600, color: '#fff', backgroundColor: '#3b82f6', border: 'none' }}
              >
                Ciente, Prosseguir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIDÁTICO: ALERTA DE PEDIDO BLOQUEADO (AGUARDANDO PAGAMENTO / SINAL) */}
      {isBlockedPaymentModalOpen && blockedPaymentItem && (() => {
        const targetStg = stages.find(s => s.id === blockedPaymentTargetStageId);
        const targetStageName = targetStg?.name || 'etapa selecionada';
        const isParentPaid = !!blockedPaymentItem.order?.first_payment_date;
        const isOverdue = hasOverdueInstallments(blockedPaymentItem.order_id) || checkIsDelayed(blockedPaymentItem, stages);

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200000,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
              maxWidth: '560px', width: '90%', overflow: 'hidden',
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
                    Confirmação Necessária: Pedido Bloqueado
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                    {!isParentPaid && isOverdue
                      ? 'Aguardando Pagamento / Sinal Financeiro E Possui Pendência de Atraso'
                      : !isParentPaid
                      ? 'Atenção: Este pedido está Bloqueado (Aguardando Pagamento/Sinal)'
                      : 'Pedido com Parcelas ou Prazo em Atraso Financeiro'
                    }
                  </p>
                </div>
              </div>

              {/* Conteúdo Explicativo Didático */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Informações Resumidas do Card */}
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
                      PV / OP: {blockedPaymentItem.friendly_id || blockedPaymentItem.order?.pv_number || 'Pedido'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {blockedPaymentItem.name || blockedPaymentItem.art_name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Cliente: <strong>{blockedPaymentItem.order?.customer?.name || 'Cliente não informado'}</strong>
                  </div>
                </div>

                {/* Explicação Didática sobre Riscos */}
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '8px',
                  padding: '0.95rem 1.15rem',
                  fontSize: '0.86rem',
                  color: 'var(--text)',
                  lineHeight: '1.55'
                }}>
                  <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                    Motivo do Alerta de Confirmação:
                  </strong>
                  {!isParentPaid && isOverdue
                    ? 'Este pedido consta como BLOQUEADO (Aguardando Pagamento/Sinal) E também possui parcelas em atraso no Conta Azul ou prazo de fabricação estourado.'
                    : !isParentPaid
                    ? 'Este pedido está registrado como BLOQUEADO (Aguardando Pagamento/Sinal). A confirmação do primeiro pagamento ou sinal financeiro ainda NÃO foi lançada no Conta Azul. Movimentar este pedido sem a devida liberação do financeiro pode acarretar custos operacionais e de matéria-prima sem garantia de pagamento.'
                    : 'Este pedido possui parcelas em atraso financeiro no Conta Azul ou ultrapassou o prazo limite estimado para produção.'
                  }
                </div>

                {/* Botão de Re-sincronização no Conta Azul para Checagem Rápida */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(var(--primary-rgb), 0.05)',
                  border: '1px solid rgba(var(--primary-rgb), 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text)', flex: 1 }}>
                    <strong>Deseja re-verificar no Conta Azul?</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Caso o sinal já tenha sido pago recentemente no ERP, sincronize para checar a liberação.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={importing}
                    onClick={() => handleSyncSingleOrder(blockedPaymentItem.order_id || blockedPaymentItem.order?.id)}
                    style={{
                      height: '32px',
                      padding: '0.3rem 0.8rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '6px'
                    }}
                  >
                    <RefreshCw size={14} className={importing ? 'spinner' : ''} />
                    <span>{importing ? 'Sincronizando...' : 'Sincronizar Pedido'}</span>
                  </button>
                </div>

                {/* Alerta de resultado da sincronização quando o status permanece mantido */}
                {blockedSyncFeedback && (
                  <div style={{
                    backgroundColor: blockedSyncFeedback.type === 'warning' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                    border: `1px solid ${blockedSyncFeedback.type === 'warning' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                    color: blockedSyncFeedback.type === 'warning' ? '#b45309' : '#15803d',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    lineHeight: '1.45',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.2s ease-in-out'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{blockedSyncFeedback.message}</span>
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  padding: '0.2rem 0',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--text)'
                }}>
                  Deseja confirmar a movimentação deste pedido para <u>{targetStageName}</u> mesmo assim?
                </div>

                {/* Botões Didáticos de Ação */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelBlockedPaymentMove}
                    style={{ padding: '0.65rem 1.15rem', fontSize: '0.85rem', fontWeight: 600, flex: 1 }}
                  >
                    Manter Bloqueado
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
                    <span>Confirmar e Mover Pedido</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE MOVER PEDIDO DE ETAPA (MOBILE / MANUAL) */}
      {isMoveStageModalOpen && itemToMoveStage && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsMoveStageModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200000, padding: '0.75rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)',
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Cabecalho */}
            <div style={{
              padding: '0.85rem 1.15rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(var(--primary-rgb), 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  Mover Pedido de Etapa
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoveStageModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Dados do Item / Pedido */}
            <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                {itemToMoveStage.friendly_id || itemToMoveStage.order?.pv_number || '---'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {itemToMoveStage.order?.customer?.name || 'Cliente'} · {itemToMoveStage.name || 'Item'}
              </div>
            </div>

            {/* Opções de Etapa */}
            <div style={{ padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '350px', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Selecione a nova etapa:
              </span>

              {stages.map((stg) => {
                const isCurrent = itemToMoveStage.stage_id === stg.id || (!itemToMoveStage.stage_id && stg.id === stages[0]?.id);
                return (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={async () => {
                      const targetItem = itemToMoveStage;
                      setIsMoveStageModalOpen(false);
                      setItemToMoveStage(null);
                      if (!isCurrent) {
                        await moveOrderItemToStage(targetItem, stg.id);
                      }
                    }}
                    disabled={isCurrent}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isCurrent ? `2px solid ${stg.color}` : '1px solid var(--border)',
                      backgroundColor: isCurrent ? `${stg.color}15` : 'var(--surface)',
                      cursor: isCurrent ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stg.color, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 700 : 500, color: 'var(--text)' }}>
                        {stg.name}
                      </span>
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: stg.color, backgroundColor: `${stg.color}25`, padding: '2px 8px', borderRadius: '99px' }}>
                        Etapa Atual
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rodapé */}
            <div style={{ padding: '0.75rem 1.15rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--background)' }}>
              <button
                type="button"
                onClick={() => setIsMoveStageModalOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRUD: GERENCIAR LOCALIZAÇÕES FÍSICAS NA FÁBRICA */}
      {isLocationCrudModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 200000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg, 16px)',
            maxWidth: '560px', width: '92%', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease', color: 'var(--text)'
          }}>
            {/* Cabeçalho */}
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'var(--surface-subtle, #f8fafc)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={22} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Gerenciar Localizações Físicas na Fábrica
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsLocationCrudModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Form de Criação/Edição */}
            <form onSubmit={handleSaveLocation} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                {editingLocation ? `Editar Localização: "${editingLocation.name}"` : '➕ Nova Localização Física'}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                  <label className="form-label">Nome do Local / Setor / Prateleira *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Prateleira B2, Setor de Tintas, Salão..."
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={locationStatus}
                    onChange={(e) => setLocationStatus(e.target.value as any)}
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {editingLocation && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => { setEditingLocation(null); setLocationName(''); setLocationStatus('ATIVO'); }}
                  >
                    Cancelar Edição
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingLocation}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submittingLocation ? <Loader2 size={16} className="spinner" /> : (editingLocation ? <Edit3 size={16} /> : <Plus size={16} />)}
                  <span>{editingLocation ? 'Salvar Alteração' : 'Adicionar Local'}</span>
                </button>
              </div>
            </form>

            {/* Lista / Tabela de Locais Existentes */}
            <div style={{ padding: '1.25rem 1.5rem', maxHeight: '260px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Locais Cadastrados ({factoryLocations.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {factoryLocations.map((loc) => (
                  <div 
                    key={loc.id} 
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem', borderRadius: '8px',
                      backgroundColor: 'var(--surface-subtle, #f8fafc)', border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: loc.status === 'ATIVO' ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{loc.name}</span>
                      <span className={`badge ${loc.status === 'ATIVO' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {loc.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => handleEditLocationClick(loc)}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        title="Editar localização"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteLocationClick(loc.id, loc.name)}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        title="Excluir localização"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {factoryLocations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhuma localização física cadastrada ainda.
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface-subtle)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setIsLocationCrudModalOpen(false)}
              >
                Concluído
              </button>
            </div>
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


