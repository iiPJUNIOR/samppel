'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { HandlingReworkModal } from '@/components/modals/HandlingReworkModal';
import { DetailModal } from '@/components/modals/DetailModal';
import { RevertAuthModal } from '@/components/modals/RevertAuthModal';
import { SuggestionModal } from '@/components/modals/SuggestionModal';
import { ExpeditionTransitionModal } from '@/components/modals/ExpeditionTransitionModal';
import { ColetaAgendadaModal } from '@/components/modals/ColetaAgendadaModal';
import { FreightModal } from '@/components/modals/FreightModal';
import { ProductionAlertModal } from '@/components/modals/ProductionAlertModal';
import { ConferencyModal } from '@/components/modals/ConferencyModal';
import { HandlingTeamModal } from '@/components/modals/HandlingTeamModal';
import { LinkedItemsWarningModal } from '@/components/modals/LinkedItemsWarningModal';
import { SyncModal } from '@/components/modals/SyncModal';
import { PackagingModal } from '@/components/modals/PackagingModal';
import { AdjustmentModal } from '@/components/modals/AdjustmentModal';
import { ShippingCrudModal } from '@/components/modals/ShippingCrudModal';
import { DetailViewModal } from '@/components/modals/DetailViewModal';
import { SectorCrudModal } from '@/components/modals/SectorCrudModal';
import { MachineCrudModal } from '@/components/modals/MachineCrudModal';
import { OrderInProgressModal } from '@/components/modals/OrderInProgressModal';
import { InsufficientStockModal } from '@/components/modals/InsufficientStockModal';
import { SiblingMoveModal } from '@/components/modals/SiblingMoveModal';
import { FaturadoAlertModal } from '@/components/modals/FaturadoAlertModal';
import { BlockedPaymentModal } from '@/components/modals/BlockedPaymentModal';
import { MoveStageModal } from '@/components/modals/MoveStageModal';
import { LocationCrudModal } from '@/components/modals/LocationCrudModal';
import { ShortageModal } from '@/components/modals/ShortageModal';
import { ExpeditionModal } from '@/components/modals/ExpeditionModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import {
  getOrders,
  getCustomers,
  getProducts,
  createOrder,
  updateOrder,
  deleteOrder,
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
  getOrderItemHandlingTeamsBulk,
  saveOrderItemHandlingTeams,
  saveOrderShippingVolumes,
  type OrderItemHandlingTeam,
  getSellerPermissionsMap,
  getOrderItemShortages,
  getOrderItemShortagesBulk,
  saveOrderItemShortage,
  resolveOrderItemShortage,
  type OrderItemShortage,
  supabase
} from '@/services/supabase';
import { parseDeadlineFromNotes, isCardOverdue, calculateExpeditionDate, detectScopeDays } from '@/services/deadline_service';
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
  X,
  Download,
  Clock,
  ArrowRightLeft,
  Calendar,
  MapPin,
  Trash2,
  Layers,
  Cpu
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

// Synchronous order deadline configs loader from localStorage
const initOrderDeadlineConfigMap = (): Map<string, { isBusinessDays: boolean; chosenDays: number }> => {
  const map = new Map<string, { isBusinessDays: boolean; chosenDays: number }>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('samppel_order_deadline_configs');
      if (raw) {
        const obj = JSON.parse(raw);
        Object.entries(obj).forEach(([k, v]: [string, any]) => {
          if (v && typeof v === 'object') {
            map.set(k, { isBusinessDays: !!v.isBusinessDays, chosenDays: Number(v.chosenDays || 15) });
          }
        });
      }
    } catch (e) { }
  }
  return map;
};

// Synchronous handling teams map cache loader for 0ms initial render
const initHandlingTeamsMapFromCache = (): Map<string, OrderItemHandlingTeam[]> => {
  const map = new Map<string, OrderItemHandlingTeam[]>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('samppel_handling_teams_v2') || localStorage.getItem('samppel_order_item_handling_teams');
      if (raw) {
        const list: OrderItemHandlingTeam[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(item => {
            const arr = map.get(item.order_item_id) || [];
            arr.push(item);
            map.set(item.order_item_id, arr);
          });
        }
      }
    } catch (e) { }
  }
  return map;
};

const initShortagesMapFromCache = (): Map<string, OrderItemShortage[]> => {
  const map = new Map<string, OrderItemShortage[]>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('samppel_shortages');
      if (raw) {
        const list: OrderItemShortage[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(item => {
            const arr = map.get(item.order_item_id) || [];
            arr.push(item);
            map.set(item.order_item_id, arr);
          });
        }
      }
    } catch (e) { }
  }
  return map;
};

export default function PedidosPage() {
  const { user } = useAuth();
  const isAdmin =
    !user ||
    user?.role === 'Administrador' ||
    user?.actual_role === 'Administrador' ||
    user?.role?.toLowerCase() === 'administrador' ||
    user?.role?.toLowerCase() === 'admin' ||
    user?.email?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase() === 'admin@samppel.com.br';

  const isManualOrder = (order: any): boolean => {
    if (!order) return true;
    const caId = order.conta_azul_id;
    if (!caId) return true;
    if (typeof caId === 'string' && (
      caId.startsWith('ca_sale_') ||
      caId.startsWith('manual_') ||
      caId.startsWith('mock_') ||
      caId.length < 20
    )) {
      return true;
    }
    return false;
  };

  // Modal de Confirmação de Exclusão de Pedido Manual (Apenas Admin)
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    orderId: string;
    pvNumber: string;
    customerName: string;
    artName: string;
    measure?: string;
    printRun?: number;
  } | null>(null);
  const [isDeletingManualOrder, setIsDeletingManualOrder] = useState(false);

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
  // Filtro de Tamanho / Medidas
  const [filterSize, setFilterSize] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pedidos_filter_size') || '';
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
    localStorage.setItem('pedidos_filter_size', filterSize);
  }, [filterCustomer, filterSeller, filterSearchOrder, filterContaAzulStatus, filterPedidosRelease, filterStage, filterSize]);

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

    // Verificação de estoque desativada a pedido do usuário
    // Movimentação direta de cards permitida livremente sem bloqueio de estoque insuficiente

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
    id?: string;
    handling_team_id: string;
    quantity: number;          // Qtd Saída
    departure_date?: string;   // Data Saída
    return_quantity?: number;  // Qtd Retorno
    return_date?: string;      // Data Retorno
    handling_code?: string;    // Código de Manuseio (ex: MAN-1171/1)
    is_completed?: boolean;    // Conferido
    completed_at?: string;
  }
  const [isHandlingTeamModalOpen, setIsHandlingTeamModalOpen] = useState(false);
  const [isHandlingReworkModalOpen, setIsHandlingReworkModalOpen] = useState(false);
  const [pendingHandlingPayload, setPendingHandlingPayload] = useState<any[]>([]);
  const [handlingTeamModalItem, setHandlingTeamModalItem] = useState<any>(null);
  const [handlingTeamModalTargetStageId, setHandlingTeamModalTargetStageId] = useState<string>('');
  const [selectedHandlingTeamId, setSelectedHandlingTeamId] = useState<string>('');
  const [handlingTeamAllocations, setHandlingTeamAllocations] = useState<HandlingTeamRow[]>([]);
  const [itemHandlingTeamsMap, setItemHandlingTeamsMap] = useState<Map<string, OrderItemHandlingTeam[]>>(initHandlingTeamsMapFromCache);
  const [savingHandlingTeam, setSavingHandlingTeam] = useState(false);
  const handlingTeamMoveBypass = useRef(false);
  const currentOperator = useRef<{ id: string; name: string } | null>(null);

  const [targetHandlingAllocationId, setTargetHandlingAllocationId] = useState<string | null>(null);

  // Estados para preferência e cálculo da Data de Expedição (Padrão: Dias Corridos / DC)
  const [isBusinessDays, setIsBusinessDays] = useState<boolean>(false);
  const [orderRangeChoiceMap, setOrderRangeChoiceMap] = useState<Map<string, number>>(new Map());
  const [orderDeadlineConfigMap, setOrderDeadlineConfigMap] = useState<Map<string, { isBusinessDays: boolean; chosenDays: number }>>(initOrderDeadlineConfigMap);

  // Estados para Modal Dedicado de Ajuste de Prazo & Data de Expedição
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [deadlineModalItem, setDeadlineModalItem] = useState<any>(null);
  const [deadlineModalOrder, setDeadlineModalOrder] = useState<any>(null);
  const [deadlineModalIsBusiness, setDeadlineModalIsBusiness] = useState(true);
  const [deadlineModalDays, setDeadlineModalDays] = useState(15);

  const handleSaveDeadlineModal = () => {
    if (!deadlineModalOrder && !deadlineModalItem) return;
    const orderId = deadlineModalOrder?.id || deadlineModalItem?.order_id;
    if (!orderId) return;

    const updatedMap = new Map(orderDeadlineConfigMap);
    updatedMap.set(orderId, {
      isBusinessDays: deadlineModalIsBusiness,
      chosenDays: deadlineModalDays
    });

    setOrderDeadlineConfigMap(updatedMap);
    if (typeof window !== 'undefined') {
      try {
        const obj = Object.fromEntries(updatedMap);
        localStorage.setItem('samppel_order_deadline_configs', JSON.stringify(obj));
      } catch (e) { }
    }

    setIsDeadlineModalOpen(false);
    showToast('Data de Expedição atualizada com sucesso!');
  };

  // Estados para Registro de Faltas/Avarias e Liquidação na Expedição
  const [shortagesMap, setShortagesMap] = useState<Map<string, OrderItemShortage[]>>(initShortagesMapFromCache);
  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [shortageItem, setShortageItem] = useState<any>(null);
  const [shortageQty, setShortageQty] = useState<number>(0);
  const [shortageReason, setShortageReason] = useState<string>('MANUSEIO_AVARIA');
  const [shortageNotes, setShortageNotes] = useState<string>('');
  const [savingShortage, setSavingShortage] = useState(false);

  // Estados para Modal de Expedição (Conferência de Crédito / Débito do Cliente)
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
  const [expeditionTargetShortage, setExpeditionTargetShortage] = useState<OrderItemShortage | null>(null);
  const [expeditionTargetItem, setExpeditionTargetItem] = useState<any>(null);
  const [expeditionResolutionType, setExpeditionResolutionType] = useState<'DESCONTO_FATURA' | 'REPOSICAO' | 'ACEITE_PARCIAL'>('DESCONTO_FATURA');
  const [expeditionResolutionNotes, setExpeditionResolutionNotes] = useState<string>('');
  const [savingExpeditionResolution, setSavingExpeditionResolution] = useState(false);

  const fetchShortagesForItem = async (orderItemId: string) => {
    try {
      const { data } = await getOrderItemShortages(undefined, orderItemId);
      if (data) {
        setShortagesMap(prev => {
          const updated = new Map(prev);
          updated.set(orderItemId, data);
          return updated;
        });
      }
    } catch (e) { }
  };

  const handleOpenHandlingTeamModalForItem = async (item: any, targetStageId: string, targetAllocationId?: string) => {
    setHandlingTeamModalItem(item);
    setHandlingTeamModalTargetStageId(targetStageId);
    setTargetHandlingAllocationId(targetAllocationId || null);
    setSavingHandlingTeam(false);

    const totalQty = Number(item.print_run || item.quantity || 1000);
    const defaultDate = new Date().toISOString().slice(0, 10);
    const rawPv = item.friendly_id || item.order?.pv_number || (item.order_id ? item.order_id.slice(0, 6) : '262/1');
    const itemPv = rawPv.replace(/^PV-?/i, '');

    try {
      const { data } = await getOrderItemHandlingTeams(item.id);
      if (data && data.length > 0) {
        let listToLoad = data;
        if (targetAllocationId) {
          const match = data.filter((d: any) => d.id === targetAllocationId || d.handling_code === targetAllocationId);
          if (match.length > 0) listToLoad = match;
        }

        setHandlingTeamAllocations(listToLoad.map((d, idx) => ({
          id: d.id,
          handling_team_id: d.handling_team_id,
          quantity: d.quantity,
          departure_date: d.departure_date || defaultDate,
          return_quantity: d.return_quantity || 0,
          return_date: d.return_date || d.completed_at || '',
          handling_code: (d.handling_code || `MS${itemPv}/${idx + 1}`).replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS'),
          is_completed: d.is_completed || false,
          completed_at: d.completed_at || d.return_date || ''
        })));
      } else {
        const defaultTeam = item.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
        setHandlingTeamAllocations([
          {
            handling_team_id: defaultTeam,
            quantity: totalQty,
            departure_date: defaultDate,
            return_quantity: totalQty,
            return_date: '',
            handling_code: `MS${itemPv}/1`,
            is_completed: false,
            completed_at: ''
          }
        ]);
      }
    } catch (err) {
      const defaultTeam = item.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
      setHandlingTeamAllocations([
        {
          handling_team_id: defaultTeam,
          quantity: totalQty,
          departure_date: defaultDate,
          return_quantity: totalQty,
          return_date: '',
          handling_code: `MS${itemPv}/1`,
          is_completed: false,
          completed_at: ''
        }
      ]);
    } finally {
      setLoading(false);
      setIsHandlingTeamModalOpen(true);
    }
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
    const defaultDate = new Date().toISOString().slice(0, 10);
    try {
      const { data } = await getOrderItemHandlingTeams(newItem.id);
      if (data && data.length > 0) {
        setHandlingTeamAllocations(data.map(d => ({
          handling_team_id: d.handling_team_id,
          quantity: d.quantity,
          departure_date: d.departure_date || defaultDate,
          return_quantity: d.return_quantity || 0,
          return_date: d.return_date || d.completed_at || '',
          is_completed: d.is_completed || false,
          completed_at: d.completed_at || d.return_date || ''
        })));
      } else {
        const defaultTeam = newItem.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
        setHandlingTeamAllocations([
          {
            handling_team_id: defaultTeam,
            quantity: totalQty,
            departure_date: defaultDate,
            return_quantity: totalQty,
            return_date: '',
            is_completed: false,
            completed_at: ''
          }
        ]);
      }
    } catch (err) {
      const defaultTeam = newItem.handling_team_id || (handlingTeams.find(t => t.status === 'ATIVO')?.id || '');
      setHandlingTeamAllocations([
        {
          handling_team_id: defaultTeam,
          quantity: totalQty,
          departure_date: defaultDate,
          return_quantity: totalQty,
          return_date: '',
          is_completed: false,
          completed_at: ''
        }
      ]);
    }
  };

  const executeSaveHandlingTeam = async (payloadToSave: any[]) => {
    setSavingHandlingTeam(true);
    try {
      const saveRes = await saveOrderItemHandlingTeams(handlingTeamModalItem.id, payloadToSave);
      const { data } = await getOrderItemHandlingTeams(handlingTeamModalItem.id);
      
      const savedList = Array.isArray(saveRes.data) ? saveRes.data : [];
      const fetchedList = Array.isArray(data) ? data : [];
      const finalTeams = savedList.length >= fetchedList.length ? savedList : fetchedList;

      setItemHandlingTeamsMap(prev => {
        const updated = new Map(prev);
        updated.set(handlingTeamModalItem.id, finalTeams);
        return updated;
      });

      showToast(`Equipes de manuseio do item ${handlingTeamModalItem.friendly_id || ''} salvas com sucesso!`);

      if (handlingTeamModalTargetStageId && handlingTeamModalTargetStageId !== handlingTeamModalItem.stage_id) {
        handlingTeamMoveBypass.current = true;
        await moveOrderItemToStage(handlingTeamModalItem, handlingTeamModalTargetStageId);
      }

      setIsHandlingTeamModalOpen(false);
      setIsHandlingReworkModalOpen(false);
      setHandlingTeamModalItem(null);
      setHandlingTeamModalTargetStageId('');
      setPendingHandlingPayload([]);
    } catch (err: any) {
      console.error('Erro ao salvar equipes de manuseio:', err);
      alert('Erro ao salvar equipes de manuseio: ' + (err.message || 'Falha ao gravar no banco.'));
    } finally {
      setSavingHandlingTeam(false);
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
  const [formShippingType, setFormShippingType] = useState<string>('SEM_FRETE');
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

      const fetchedOrders = ordersRes.data || [];
      const fetchedProducts = productsRes.data || [];
      setOrders(fetchedOrders);
      setCustomers(customersRes.data || []);
      setProducts(fetchedProducts);
      setStages(stagesRes.data || []);

      const joinedItems = (itemsRes.data || []).map((item: any) => {
        const prod = fetchedProducts.find((p: any) => p.id === item.product_id) || item.product || null;
        const ord = fetchedOrders.find((o: any) => o.id === item.order_id) || item.order || null;
        return {
          ...item,
          order: ord,
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

        const [teamsBulkRes, shortagesBulkRes] = await Promise.all([
          getOrderItemHandlingTeamsBulk(itemIds),
          getOrderItemShortagesBulk(itemIds)
        ]);

        (teamsBulkRes.data || []).forEach((t: OrderItemHandlingTeam) => {
          const arr = teamsMap.get(t.order_item_id) || [];
          arr.push(t);
          teamsMap.set(t.order_item_id, arr);
        });

        const sMap = new Map<string, OrderItemShortage[]>();
        (shortagesBulkRes.data || []).forEach((s: OrderItemShortage) => {
          const arr = sMap.get(s.order_item_id) || [];
          arr.push(s);
          sMap.set(s.order_item_id, arr);
        });

        await Promise.allSettled(itemIds.map(async (id) => {
          const pkgRes = await getOrderItemPackaging(id);
          if (pkgRes.data && pkgRes.data.length > 0) packaged.add(id);
        }));

        setItemsWithPackaging(packaged);
        if (typeof window !== 'undefined' && Array.isArray(teamsBulkRes.data)) {
          try {
            localStorage.setItem('samppel_handling_teams_v2', JSON.stringify(teamsBulkRes.data));
          } catch (e) { }
        }
        setItemHandlingTeamsMap(teamsMap);
        setShortagesMap(sMap);
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
    // REGRA DE AUTENTICAÇÃO SECUNDÁRIA DO OPERADOR (EXIGIDO APENAS PARA FÁBRICA)
    // ---------------------------------------------------------------
    const isFactoryUser = user?.role === 'Produção' || user?.role === 'Fábrica' || user?.is_factory_account;
    if (isFactoryUser && !activeOpId) {
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
    // verifica se todos os 3 pilares de cada lote foram preenchidos (Saída, Retorno e Conferência).
    if (currentStage?.name === 'Manuseio' && targetStage.name !== 'Manuseio' && targetStage.name !== 'Atrasado' && !handlingTeamMoveBypass.current) {
      const { data: teams } = await getOrderItemHandlingTeams(item.id);
      const isUserAdmin = user?.role === 'Administrador' || (user?.role as string) === 'Admin';

      const uncompletedLots = (teams || []).filter(t => {
        const hasSaida = !!t.departure_date && Number(t.quantity) > 0;
        const hasRetorno = (!!t.return_date || !!t.completed_at) && Number(t.return_quantity) > 0;
        const isConferido = !!t.is_completed;
        return !hasSaida || !hasRetorno || !isConferido;
      });

      const isPending = !teams || teams.length === 0 || uncompletedLots.length > 0;

      if (isPending) {
        if (!isUserAdmin) {
          // Bloqueio estrito para Operador
          setLoading(false);
          resetAllBypasses();
          alert(
            '⚠️ ATENÇÃO - AÇÃO BLOQUEADA\n\n' +
            'Este item não pode sair da etapa Manuseio pois possui equipes pendentes de retorno ou conferência.\n\n' +
            'Para liberar a movimentação, todas as equipes devem possuir:\n' +
            '• Data de Saída e Quantidade de Saída\n' +
            '• Data de Retorno e Quantidade de Retorno\n' +
            '• Checkbox "Conferido" marcada\n\n' +
            'O modal de Manuseio será aberto para regularização.'
          );
          handleOpenHandlingTeamModalForItem(item, item.stage_id);
          return;
        } else {
          // Permissão para Admin com aviso explicativo e diálogo de confirmação
          const lotSummary = (teams && teams.length > 0)
            ? `Existe(m) ${uncompletedLots.length} de ${teams.length} equipe(s) pendente(s) de retorno/conferência.`
            : 'Nenhuma equipe de manuseio cadastrada para este item.';

          const confirmForce = window.confirm(
            `⚠️ ATENÇÃO ADMINISTRADOR\n\n` +
            `Este item possui pendências na etapa Manuseio:\n${lotSummary}\n\n` +
            `Como Administrador, você possui permissão para forçar a movimentação para a etapa "${targetStage.name}".\n\n` +
            `Deseja confirmar e forçar a movimentação do pedido mesmo assim?`
          );

          if (!confirmForce) {
            setLoading(false);
            resetAllBypasses();
            handleOpenHandlingTeamModalForItem(item, item.stage_id);
            return;
          }
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
        } catch { }

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
        i => i.order_id === item.order_id && i.id !== item.id && i.stage_id !== targetStageId && !isItemBoundToFirstItem(i)
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

    // Verificação de estoque desativada a pedido do usuário
    // Movimentação direta de cards permitida livremente sem bloqueio de estoque insuficiente


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
        const boundSubItems = orderItems.filter(i => i.order_id === item.order_id && isItemBoundToFirstItem(i));
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
        const isEnteringProductionOrStock = fromStageIdx === 0 && (targetStageIdx === 1 || targetStageIdx === 6 || targetStage.name === 'Em produção' || targetStage.name === 'Produção' || targetStage.name === 'Estoque');

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
        } catch { }

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
      } catch (err) { }
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
    setFormShippingType('SEM_FRETE');
    setFormFirstPaymentDate('');
    setFormInstallmentsTotal(1);
    setFormInstallmentsPaid(0);
    setFormOverShortQuantity(0);
    setFormPhysicalLocation('Salão');
    setFormProductionStartDate('');
    setIsModalOpen(true);
  };

  // Abrir modal de Detalhes do Card (read-only, rápido)
  const handleOpenDetail = async (item: any) => {
    setDetailItem(item);
    setDetailShortage(item.shortage_quantity || 0);
    setDetailCourtesy(item.courtesy_quantity || 0);
    setDetailExpeditionNotes(item.expedition_notes || '');
    setIsDetailModalOpen(true);

    // Carregar informações de manuseio dos itens do pedido
    const parentOrderId = item.order_id;
    const siblingItems = orderItems.filter(i => i.order_id === parentOrderId);
    for (const sItem of siblingItems) {
      try {
        const { data } = await getOrderItemHandlingTeams(sItem.id);
        if (data) {
          setItemHandlingTeamsMap(prev => {
            const updated = new Map(prev);
            updated.set(sItem.id, data);
            return updated;
          });
        }
      } catch (e) {
        console.error('Erro ao carregar manuseio para detalhes:', e);
      }
    }
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

  const handleRequestDeleteManualOrder = (order: any, item?: any) => {
    if (!isAdmin) {
      alert('Apenas usuários com perfil de Administrador têm permissão para excluir pedidos manuais.');
      return;
    }
    const pvNumber = order?.pv_number || (order?.id ? `ID: ${order.id.slice(0, 8)}` : 'Manual');
    const customerName = order?.customer?.name || (customers.find(c => c.id === order?.customer_id)?.name) || 'Cliente não identificado';
    const artName = item?.name || order?.art_name || 'Arte/Produto';
    const measure = item?.measure || order?.measure || '';
    const printRun = item?.print_run || order?.print_run || 0;

    setOrderToDelete({
      orderId: order?.id || item?.order_id,
      pvNumber,
      customerName,
      artName,
      measure,
      printRun
    });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteManualOrder = async () => {
    if (!orderToDelete || !isAdmin) return;
    setIsDeletingManualOrder(true);
    try {
      const { error } = await deleteOrder(orderToDelete.orderId);
      if (error) {
        alert('Erro ao excluir pedido: ' + error.message);
      } else {
        setIsDeleteConfirmModalOpen(false);
        setOrderToDelete(null);
        setIsModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedItem(null);
        setSelectedOrder(null);
        await fetchAllData();
      }
    } catch (err: any) {
      console.error('Erro ao excluir pedido manual:', err);
      alert('Falha ao excluir pedido manual.');
    } finally {
      setIsDeletingManualOrder(false);
    }
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
      const productNameOrArt = formArtName.trim();
      if (!productNameOrArt) {
        alert('Por favor, informe ou selecione o Produto / Arte da Embalagem.');
        return;
      }

      // Destino Inicial Obrigatório: Produção ou Estoque (Nunca Pedidos)
      let targetStage = stages.find(s => s.name === 'Em produção' || s.name === 'Produção') || stages[1] || stages[0];
      let targetStatus = 'Em produção';
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
        freight_value: 0,
        seller_name: formSeller || 'Vendas Samppel',
        notes: formNotes,
        internal_notes: formInternalNotes,
        status: targetStatus,
        stage_id: targetStage?.id || null,
        production_sector: targetSector,
        order_date: new Date().toISOString(),

        pv_number: formPvNumber || `PV-${Date.now().toString().substring(8)}`,
        op_number: formOpNumber || null,
        art_name: productNameOrArt,
        packaging_type: formPackagingType,
        shipping_type: 'SEM_FRETE',
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
          name: productNameOrArt,
          measure: newOrder.measure,
          print_run: newOrder.print_run,
          boxes_count: newOrder.boxes_count,
          packaging_type: newOrder.packaging_type,
          over_short_quantity: newOrder.over_short_quantity,
          status: newOrder.status,
          production_sector: newOrder.production_sector,
          stage_id: newOrder.stage_id,
          machine_id: formMachineId || null,
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

  // Helper para verificar permissões de carteira de vendedor do usuário logado
  const canUserViewOrderSeller = (sellerName: string): boolean => {
    if (!user) return true;
    if (user.role === 'Administrador') return true;

    if (user.role === 'Comercial' || user.role === 'Vendedor') {
      const sellerPermsMap = getSellerPermissionsMap();
      const userPerms = sellerPermsMap[user.id];

      if (!userPerms) {
        // Fallback por primeiro nome caso não configurado ainda em Ajustes
        const userFirstName = user.full_name.split(' ')[0].toLowerCase();
        const sellerNameLower = (sellerName || '').toLowerCase();
        return sellerNameLower.includes(userFirstName);
      }

      const mode = userPerms.seller_access_mode || 'OWN';
      if (mode === 'ALL' || (userPerms.allowed_sellers || []).includes('*')) return true;

      const primary = (userPerms.primary_seller_name || '').toLowerCase();
      const sLower = (sellerName || '').toLowerCase();

      // Se coincidir com o vendedor principal vinculado
      if (primary && (sLower.includes(primary) || primary.includes(sLower))) return true;

      // Se coincidir com algum dos vendedores autorizados na lista
      const allowed = userPerms.allowed_sellers || [];
      return allowed.some(a => a && (sLower.includes(a.toLowerCase()) || a.toLowerCase().includes(sLower)));
    }

    return true;
  };

  // Lista dinâmica de todos os tamanhos/medidas presentes nos cards e pedidos
  const availableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    (orderItems || []).forEach((item: any) => {
      const m = getItemRealMeasure(item);
      if (m && m !== '—' && m.trim().length > 0) {
        sizesSet.add(m.trim());
      }
      if (item.measure && item.measure !== '—' && item.measure !== '15x10x5 cm' && item.measure.trim().length > 0) {
        sizesSet.add(item.measure.trim());
      }
    });
    (orders || []).forEach((order: any) => {
      const m = getItemRealMeasure(order);
      if (m && m !== '—' && m.trim().length > 0) {
        sizesSet.add(m.trim());
      }
      if (order.measure && order.measure !== '—' && order.measure !== '15x10x5 cm' && order.measure.trim().length > 0) {
        sizesSet.add(order.measure.trim());
      }
      if (order.size && order.size !== '—' && order.size.trim().length > 0) {
        sizesSet.add(order.size.trim());
      }
    });
    return Array.from(sizesSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [orderItems, orders]);

  // Lógica de Filtros
  const filteredOrders = orders.filter(order => {
    if (isVendedor && user) {
      if (!canUserViewOrderSeller(order.seller_name)) return false;
    }
    const matchCustomer = filterCustomer ? (order.customer?.name || '').toLowerCase().includes(filterCustomer.toLowerCase()) : true;
    const matchSeller = filterSeller ? order.seller_name.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchSearchOrder = filterSearchOrder ? (
      cleanPvForMatch(order.pv_number || '') === `pv-${filterSearchOrder.toLowerCase()}` ||
      cleanPvForMatch(order.pv_number || '') === filterSearchOrder.toLowerCase()
    ) : true;
    const matchContaAzulStatus = filterContaAzulStatus ? order.conta_azul_status === filterContaAzulStatus : true;
    const matchSize = filterSize ? (
      getItemRealMeasure(order).toLowerCase() === filterSize.toLowerCase() ||
      (order.measure || '').toLowerCase() === filterSize.toLowerCase() ||
      (order.size || '').toLowerCase() === filterSize.toLowerCase() ||
      (order.product_name || order.art_name || order.name || '').toLowerCase().includes(filterSize.toLowerCase())
    ) : true;
    return matchCustomer && matchSeller && matchSearchOrder && matchContaAzulStatus && matchSize;
  });

  // Helper para verificar se um item de pedido está configurado para ser vinculado ao primeiro item (Sem Produção)
  const isItemBoundToFirstItem = (item: any): boolean => {
    if (!item) return false;

    // 1. Relação direta vinda do JOIN de banco de dados
    if (item.product?.bind_to_first_item === true) return true;

    // 2. Busca por product_id no estado global de produtos
    if (item.product_id) {
      const prod = products.find((p: any) => p.id === item.product_id);
      if (prod?.bind_to_first_item === true) return true;
    }

    // 3. Fallback por Nome (itens importados sem product_id vinculado)
    if (item.name) {
      const itemNameLower = item.name.trim().toLowerCase();

      const matchedProd = products.find((p: any) => {
        if (!p.bind_to_first_item) return false;
        const prodNameLower = (p.name || '').trim().toLowerCase();
        if (!prodNameLower) return false;
        return itemNameLower === prodNameLower || itemNameLower.includes(prodNameLower) || prodNameLower.includes(itemNameLower);
      });

      if (matchedProd) return true;

      // Regra de segurança extra para Clichê com produto cadastrado tipo vincular
      if (itemNameLower.includes('clichê') || itemNameLower.includes('cliche')) {
        const hasClicheBoundProd = products.some((p: any) => p.bind_to_first_item && (p.name || '').toLowerCase().includes('clich'));
        if (hasClicheBoundProd) return true;
      }
    }

    return false;
  };

  // Helper para verificar se um item não produzido/vinculado exige Manuseio
  const doesBoundItemRequireHandling = (item: any): boolean => {
    if (!item) return false;
    if (!isItemBoundToFirstItem(item)) return false;

    if (item.product?.bind_requires_handling === true) return true;
    if (item.product_id) {
      const prod = products.find((p: any) => p.id === item.product_id);
      if (prod?.bind_requires_handling === true) return true;
    }
    if (item.name) {
      const itemNameLower = item.name.trim().toLowerCase();
      const matchedProd = products.find((p: any) => {
        if (!p.bind_to_first_item) return false;
        const prodNameLower = (p.name || '').trim().toLowerCase();
        return prodNameLower && (itemNameLower === prodNameLower || itemNameLower.includes(prodNameLower) || prodNameLower.includes(itemNameLower));
      });
      if (matchedProd?.bind_requires_handling === true) return true;
    }
    return false;
  };

  // Lógica de Filtros para Itens no Kanban
  const filteredOrderItems = orderItems.filter(item => {
    // Não exibir cards de itens de produto configurados para vincular ao primeiro item
    if (isItemBoundToFirstItem(item)) return false;

    const parentOrder = item.order || {};

    // Não exibir cards de pedidos que constam como 'Em andamento' (Orçamento) ou 'Recusado' no Conta Azul
    const caStatusLower = (parentOrder.conta_azul_status || '').toLowerCase();
    if ((caStatusLower === 'em andamento' || caStatusLower.includes('andamento') || caStatusLower.includes('recusad') || caStatusLower.includes('rejeitad')) && filterContaAzulStatus !== parentOrder.conta_azul_status) {
      return false;
    }

    if (isVendedor && user) {
      if (!canUserViewOrderSeller(parentOrder.seller_name)) return false;
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
      if (filterPedidosRelease === 'liberados') matchPedidosRelease = isReleased;
      else if (filterPedidosRelease === 'bloqueados') matchPedidosRelease = !isReleased;
    }

    // Filtro de Etapa do Kanban
    let matchStage = true;
    if (filterStage) {
      const currentStage = stages.find(s => s.id === item.stage_id);
      const stageName = currentStage?.name || 'Pedidos';
      matchStage = stageName.toLowerCase() === filterStage.toLowerCase();
    }

    // Filtro de Tamanho / Medidas
    let matchSize = true;
    if (filterSize) {
      const itemMeasure = getItemRealMeasure(item).toLowerCase();
      const parentMeasure = getItemRealMeasure(parentOrder).toLowerCase();
      const targetSize = filterSize.toLowerCase();
      matchSize = itemMeasure === targetSize ||
        (item.measure || '').toLowerCase() === targetSize ||
        (item.name || '').toLowerCase().includes(targetSize) ||
        (item.art_name || '').toLowerCase().includes(targetSize) ||
        parentMeasure === targetSize ||
        (parentOrder.measure || '').toLowerCase() === targetSize ||
        (parentOrder.size || '').toLowerCase() === targetSize ||
        (parentOrder.product_name || parentOrder.art_name || parentOrder.name || '').toLowerCase().includes(targetSize);
    }

    return matchCustomer && matchSeller && matchSearchOrder && matchContaAzulStatus && matchPedidosRelease && matchStage && matchSize;
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
          filterStage,
          filterSize
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
                {/* Controle de Cálculo: Dias Úteis vs Corridos (Exclusivo para Administrador) */}
                {(user?.role === 'Administrador') && (
                  <div style={{
                    display: 'flex',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2px',
                    height: '32px',
                    alignItems: 'center'
                  }} title="Define se o cálculo da Data de Expedição utiliza Dias Úteis ou Corridos">
                    <button
                      type="button"
                      onClick={() => setIsBusinessDays(true)}
                      className="btn"
                      style={{
                        padding: '0.2rem 0.55rem', fontSize: '0.72rem', border: 'none', height: '100%',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isBusinessDays ? 'var(--primary)' : 'transparent',
                        color: isBusinessDays ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: isBusinessDays ? 700 : 500
                      }}
                    >
                      Dias Úteis
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBusinessDays(false)}
                      className="btn"
                      style={{
                        padding: '0.2rem 0.55rem', fontSize: '0.72rem', border: 'none', height: '100%',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: !isBusinessDays ? 'var(--primary)' : 'transparent',
                        color: !isBusinessDays ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: !isBusinessDays ? 700 : 500
                      }}
                    >
                      Dias Corridos
                    </button>
                  </div>
                )}

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

                {/* Tamanhos / Medidas */}
                <select
                  className="form-select"
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  style={{ height: '30px', fontSize: '0.76rem', padding: '0.2rem 0.45rem', flex: '1 1 120px', minWidth: '105px', maxWidth: '160px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">Tamanho (Todos)</option>
                  {availableSizes.map((size: string) => (
                    <option key={size} value={size}>{size}</option>
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
                      setFilterSize('');
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('pedidos_filter_customer');
                        localStorage.removeItem('pedidos_filter_seller');
                        localStorage.removeItem('pedidos_filter_search');
                        localStorage.removeItem('pedidos_filter_conta_azul');
                        localStorage.removeItem('pedidos_filter_release');
                        localStorage.removeItem('pedidos_filter_stage');
                        localStorage.removeItem('pedidos_filter_size');
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
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {(filterCustomer || filterSeller || filterContaAzulStatus || filterPedidosRelease || filterStage || filterSize || filterSearchOrder) && filteredOrderItems.length === 0 && (
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.1,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 0,
              width: '100%',
              color: 'var(--text-muted, #64748b)'
            }}>
              <Search size={120} strokeWidth={1.5} />
              <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginTop: '1rem', marginBottom: '0.5rem', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>Filtro Ativado</h2>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>Não há pedidos correspondentes à busca.</p>
            </div>
          )}
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

              const getItemExpeditionTimestamp = (item: any): number => {
                const parentOrder = item.order || {};
                const orderId = parentOrder.id || item.order_id;
                const config = orderDeadlineConfigMap.get(orderId);
                const effectiveIsBusiness = config ? config.isBusinessDays : isBusinessDays;
                const effectiveChosenDays = config ? config.chosenDays : orderRangeChoiceMap.get(item.order_id);

                const expRes = calculateExpeditionDate(item, parentOrder, { isBusinessDays: effectiveIsBusiness, chosenDays: effectiveChosenDays });
                if (expRes?.expeditionDate) {
                  return expRes.expeditionDate.getTime();
                }
                if (parentOrder.delivery_date) {
                  return new Date(parentOrder.delivery_date).getTime();
                }
                if (parentOrder.order_date) {
                  return new Date(parentOrder.order_date).getTime();
                }
                return 0;
              };

              const stageItems = [...stageItemsRaw].sort((a, b) => {
                const aExpTime = getItemExpeditionTimestamp(a);
                const bExpTime = getItemExpeditionTimestamp(b);
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

                // Ordenação primária pela Data de Expedição
                if (aExpTime && bExpTime) {
                  return sortDir === 'asc' ? aExpTime - bExpTime : bExpTime - aExpTime;
                }
                if (aExpTime && !bExpTime) return -1;
                if (!aExpTime && bExpTime) return 1;

                // Fallback por data do pedido
                const aDate = new Date(a.order?.order_date || 0).getTime();
                const bDate = new Date(b.order?.order_date || 0).getTime();
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
                            title={columnSortDirs[stage.id] === 'desc' ? 'Data de expedição: Decrescente (Clique para Crescente)' : 'Data de expedição: Crescente (Clique para Decrescente)'}
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

                              {/* Exibição Calculada da Data de Expedição com Botões Inline DU / DC */}
                              {(() => {
                                const orderId = parentOrder.id || item.order_id;
                                const config = orderDeadlineConfigMap.get(orderId);
                                const effectiveIsBusiness = config ? config.isBusinessDays : isBusinessDays;
                                const effectiveChosenDays = config ? config.chosenDays : orderRangeChoiceMap.get(item.order_id);

                                const expRes = calculateExpeditionDate(item, parentOrder, { isBusinessDays: effectiveIsBusiness, chosenDays: effectiveChosenDays });
                                if (!expRes.expeditionDate) return null;
                                const isOverdue = isCardOverdue(item, stages, { isBusinessDays: effectiveIsBusiness, chosenDays: effectiveChosenDays });
                                const isAdminUser = user?.role === 'Administrador';

                                return (
                                  <div style={{
                                    fontSize: '0.66rem',
                                    marginTop: '3px',
                                    marginBottom: '2px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: '0.25rem',
                                      color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                                      fontWeight: isOverdue ? 700 : 400
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                        <span>Data de expedição: <strong style={{ color: isOverdue ? 'var(--danger)' : 'var(--text)', fontSize: '0.72rem' }}>{expRes.expeditionDate.toLocaleDateString('pt-BR')}</strong></span>

                                        {/* Botões Inline DU (Dias Úteis) e DC (Dias Corridos) */}
                                        {isAdminUser ? (
                                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedMap = new Map(orderDeadlineConfigMap);
                                                const current = updatedMap.get(orderId) || { isBusinessDays: true, chosenDays: expRes.scopeDays };
                                                updatedMap.set(orderId, { ...current, isBusinessDays: true });
                                                setOrderDeadlineConfigMap(updatedMap);
                                                if (typeof window !== 'undefined') {
                                                  try { localStorage.setItem('samppel_order_deadline_configs', JSON.stringify(Object.fromEntries(updatedMap))); } catch (e) { }
                                                }
                                              }}
                                              style={{
                                                fontSize: '0.58rem',
                                                fontWeight: 800,
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: effectiveIsBusiness ? 'var(--primary)' : 'var(--surface)',
                                                color: effectiveIsBusiness ? '#ffffff' : 'var(--text-muted)',
                                                cursor: 'pointer'
                                              }}
                                              title="Calcular por Dias Úteis (pula fins de semana)"
                                            >
                                              DU
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedMap = new Map(orderDeadlineConfigMap);
                                                const current = updatedMap.get(orderId) || { isBusinessDays: true, chosenDays: expRes.scopeDays };
                                                updatedMap.set(orderId, { ...current, isBusinessDays: false });
                                                setOrderDeadlineConfigMap(updatedMap);
                                                if (typeof window !== 'undefined') {
                                                  try { localStorage.setItem('samppel_order_deadline_configs', JSON.stringify(Object.fromEntries(updatedMap))); } catch (e) { }
                                                }
                                              }}
                                              style={{
                                                fontSize: '0.58rem',
                                                fontWeight: 800,
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: !effectiveIsBusiness ? 'var(--primary)' : 'var(--surface)',
                                                color: !effectiveIsBusiness ? '#ffffff' : 'var(--text-muted)',
                                                cursor: 'pointer'
                                              }}
                                              title="Calcular por Dias Corridos"
                                            >
                                              DC
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.56rem', fontWeight: 800, padding: '1px 3px', borderRadius: '3px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            {effectiveIsBusiness ? 'DU' : 'DC'}
                                          </span>
                                        )}

                                        {/* Se houver Faixa de Escopo (ex: 30 a 35 dias), exibe botões inline [30d] [35d] */}
                                        {expRes.hasRange && isAdminUser && (
                                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '2px' }}>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedMap = new Map(orderDeadlineConfigMap);
                                                const current = updatedMap.get(orderId) || { isBusinessDays: effectiveIsBusiness, chosenDays: expRes.scopeDays };
                                                updatedMap.set(orderId, { ...current, chosenDays: expRes.minDays });
                                                setOrderDeadlineConfigMap(updatedMap);
                                                if (typeof window !== 'undefined') {
                                                  try { localStorage.setItem('samppel_order_deadline_configs', JSON.stringify(Object.fromEntries(updatedMap))); } catch (e) { }
                                                }
                                              }}
                                              style={{
                                                fontSize: '0.58rem',
                                                fontWeight: 800,
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: expRes.scopeDays === expRes.minDays ? 'var(--primary)' : 'var(--surface)',
                                                color: expRes.scopeDays === expRes.minDays ? '#ffffff' : 'var(--text-muted)',
                                                cursor: 'pointer'
                                              }}
                                              title={`Considerar ${expRes.minDays} dias`}
                                            >
                                              {expRes.minDays}d
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedMap = new Map(orderDeadlineConfigMap);
                                                const current = updatedMap.get(orderId) || { isBusinessDays: effectiveIsBusiness, chosenDays: expRes.scopeDays };
                                                updatedMap.set(orderId, { ...current, chosenDays: expRes.maxDays });
                                                setOrderDeadlineConfigMap(updatedMap);
                                                if (typeof window !== 'undefined') {
                                                  try { localStorage.setItem('samppel_order_deadline_configs', JSON.stringify(Object.fromEntries(updatedMap))); } catch (e) { }
                                                }
                                              }}
                                              style={{
                                                fontSize: '0.58rem',
                                                fontWeight: 800,
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: expRes.scopeDays === expRes.maxDays ? 'var(--primary)' : 'var(--surface)',
                                                color: expRes.scopeDays === expRes.maxDays ? '#ffffff' : 'var(--text-muted)',
                                                cursor: 'pointer'
                                              }}
                                              title={`Considerar ${expRes.maxDays} dias`}
                                            >
                                              {expRes.maxDays}d
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {isOverdue && <span style={{ fontSize: '0.58rem', color: 'var(--danger)', fontWeight: 800 }}>(Atrasado)</span>}
                                      {parentOrder.conta_azul_status === 'Em andamento' && (
                                        <span style={{ fontSize: '0.58rem', color: '#eab308', fontWeight: 700 }}>(Orçamento)</span>
                                      )}
                                    </div>
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
                                    title={`Conferência realizada: ${(adjustments.find(adj => adj.order_item_id === item.id)?.difference_quantity || 0) > 0 ? 'Sobra' : 'Falta'
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

                              {/* Exibição da Máquina Vinculada (Mostra no card apenas se tiver máquina vinculada) */}
                              {(() => {
                                const linkedMachine = productionMachines.find(m => m.id === item.machine_id) || item.machine;
                                if (!linkedMachine) return null;
                                return (
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: 'hsl(217, 91%, 38%)',
                                    backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
                                    border: '1px solid hsla(217, 91%, 60%, 0.25)',
                                    padding: '1.5px 6px',
                                    borderRadius: '4px',
                                    marginTop: '3px',
                                    width: 'fit-content'
                                  }}>
                                    <Cpu size={9} />
                                    <span>Máquina: {linkedMachine.name}</span>
                                  </div>
                                );
                              })()}

                              {/* Badge(s) de Equipe(s) de Manuseio com Suporte a Múltiplas Equipes, Códigos e Status Finalizado */}
                              {(item.production_sector === 'Manuseio' || stage.name === 'Manuseio') && (() => {
                                const rawAllocations = itemHandlingTeamsMap.get(item.id) || [];
                                const totalPrintRun = Number(item.print_run || item.quantity || 0);

                                // Fallback seguro se não houver alocações detalhadas mas houver equipe atribuída ao item
                                let itemAllocations = rawAllocations;
                                if (itemAllocations.length === 0 && item.handling_team_id) {
                                  itemAllocations = [{
                                    id: item.id + '-fallback',
                                    tenant_id: item.tenant_id,
                                    order_item_id: item.id,
                                    handling_team_id: item.handling_team_id,
                                    quantity: totalPrintRun,
                                    team: item.handling_team,
                                    is_completed: item.handling_status === 'CONFERIDO' || item.is_completed || false,
                                    handling_code: item.handling_code
                                  }];
                                }

                                const totalAllocated = itemAllocations.reduce((sum, a) => sum + Number(a.quantity || 0), 0);
                                const remainingQty = Math.max(0, totalPrintRun - totalAllocated);
                                const isAllConferido = itemAllocations.length > 0 && totalAllocated >= totalPrintRun && itemAllocations.every(a => a.is_completed);
                                const rawPv = item.friendly_id || item.order?.pv_number || (item.order_id ? item.order_id.slice(0, 6) : '262/1');
                                const itemPv = rawPv.replace(/^PV-?/i, '');

                                return (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.2rem',
                                      marginTop: '3px'
                                    }}
                                  >
                                    {itemAllocations.length > 0 ? (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                        {itemAllocations.map((alloc, idx) => {
                                          const teamName = alloc.team?.name || handlingTeams.find(t => t.id === alloc.handling_team_id)?.name || 'Equipe';
                                          const hCode = (alloc.handling_code || `MS${itemPv}/${idx + 1}`).replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS');
                                          return (
                                            <div
                                              key={alloc.id || idx}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenHandlingTeamModalForItem(item, item.stage_id, alloc.id);
                                              }}
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.2rem",
                                                padding: "1px 5px",
                                                borderRadius: "4px",
                                                backgroundColor: alloc.is_completed ? "hsla(142, 71%, 45%, 0.12)" : "hsla(271, 91.2%, 65.1%, 0.12)",
                                                border: `1px solid ${alloc.is_completed ? "hsla(142, 71%, 45%, 0.3)" : "hsla(271, 91.2%, 65.1%, 0.3)"}`,
                                                fontSize: "0.6rem",
                                                fontWeight: 700,
                                                color: alloc.is_completed ? "hsl(142, 71%, 35%)" : "hsl(271, 91.2%, 55%)",
                                                cursor: "pointer"
                                              }}
                                              title={`Clique para editar a equipe ${teamName} (${hCode})`}
                                            >
                                              <Users size={9} />
                                              <span>{teamName} ({alloc.quantity.toLocaleString('pt-BR')})</span>
                                              <span style={{ fontSize: '0.55rem', opacity: 0.85, fontWeight: 600 }}>• {hCode}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '2px 5px',
                                        borderRadius: '4px',
                                        background: item.handling_team_id
                                          ? 'hsla(271, 91.2%, 65.1%, 0.12)'
                                          : 'hsla(0, 84.2%, 60.2%, 0.08)',
                                        border: `1px solid ${item.handling_team_id ? 'hsla(271, 91.2%, 65.1%, 0.3)' : 'hsla(0, 84.2%, 60.2%, 0.2)'}`
                                      }}>
                                        <span style={{
                                          fontSize: '0.6rem',
                                          fontWeight: 700,
                                          color: item.handling_team_id ? 'hsl(271, 91.2%, 55%)' : 'hsl(0, 84.2%, 50%)'
                                        }}>
                                          {item.handling_team_id
                                            ? `${handlingTeams.find(t => t.id === item.handling_team_id)?.name || 'Equipe'} (${totalPrintRun.toLocaleString('pt-BR')} un)`
                                            : 'Sem equipe vinculada (Clique para definir)'
                                          }
                                        </span>
                                      </div>
                                    )}

                                    {/* Badge de Status: "Manuseio concluído" se finalizado (100% alocado e conferido) ou "Faltam xxx" se pendente */}
                                    {isAllConferido ? (
                                      <div style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: 'hsla(142, 71%, 45%, 0.15)',
                                        color: 'hsl(142, 71%, 32%)',
                                        border: '1px solid hsla(142, 71%, 45%, 0.35)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        width: 'fit-content'
                                      }}>
                                        <CheckCircle2 size={10} />
                                        <span>✓ Manuseio concluído</span>
                                      </div>
                                    ) : remainingQty > 0 ? (
                                      <div style={{
                                        fontSize: '0.58rem',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        backgroundColor: 'hsla(38, 92%, 50%, 0.15)',
                                        color: 'hsl(38, 92%, 35%)',
                                        border: '1px solid hsla(38, 92%, 50%, 0.4)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        width: 'fit-content'
                                      }}>
                                        <AlertTriangle size={9} />
                                        <span>Faltam {remainingQty.toLocaleString('pt-BR')} un para manuseio</span>
                                      </div>
                                    ) : (
                                      <div style={{
                                        fontSize: '0.58rem',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        backgroundColor: 'hsla(45, 93%, 47%, 0.15)',
                                        color: 'hsl(45, 93%, 35%)',
                                        border: '1px solid hsla(45, 93%, 47%, 0.4)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        width: 'fit-content'
                                      }}>
                                        <Clock size={9} />
                                        <span>Manuseio em andamento (Pendente conferência)</span>
                                      </div>
                                    )}
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
                                const productionItems = orderItems.filter(i => i.order_id === item.order_id && !isItemBoundToFirstItem(i));
                                const firstProductionItem = [...productionItems].sort((a, b) => (a.item_index || 0) - (b.item_index || 0))[0];
                                const isFirstProductionItem = firstProductionItem && firstProductionItem.id === item.id;
                                const boundItems = orderItems.filter(i => i.order_id === item.order_id && isItemBoundToFirstItem(i));

                                const siblingProductionItems = orderItems.filter(i => i.order_id === item.order_id && i.id !== item.id && !isItemBoundToFirstItem(i));

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

                                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                  {isAdmin && isManualOrder(parentOrder) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestDeleteManualOrder(parentOrder, item);
                                      }}
                                      className="btn btn-danger"
                                      style={{ padding: '1px 4px', fontSize: '0.625rem', display: 'flex', alignItems: 'center', gap: '1px' }}
                                      title="Excluir este pedido manual (Apenas Administrador)"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  )}
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
      {isSuggestionModalOpen && <SuggestionModal {...{ handleSuggestionSubmit, loading, resetAllBypasses, setIsSuggestionModalOpen, setSuggestionAction, setSuggestionQuantityToConsume, suggestionAction, suggestionCredit, suggestionItem, suggestionQuantityToConsume, suggestionStock }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE TRANSIÇÃO DA EXPEDIÇÃO PARA CONCLUÍDO (OCORRÊNCIAS) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isExpeditionTransitionModalOpen && <ExpeditionTransitionModal {...{ createCustomerStockCredit, createOrderBalanceAdjustment, expeditionFreightHeight, expeditionFreightLength, expeditionFreightNotes, expeditionFreightPackagingTypeId, expeditionFreightVolumes, expeditionFreightWeight, expeditionFreightWidth, expeditionItemConferencyMap, expeditionSelectedSiblings, expeditionSiblings, expeditionTransitionItem, expeditionTransitionMoveBypass, expeditionTransitionNotes, expeditionTransitionTargetStageId, loading, moveOrderItemToStage, resetAllBypasses, saveOrderShippingVolumes, selectedShippingType, setExpeditionFreightHeight, setExpeditionFreightLength, setExpeditionFreightVolumes, setExpeditionFreightWeight, setExpeditionFreightWidth, setExpeditionSelectedSiblings, setExpeditionTransitionItem, setExpeditionTransitionNotes, setIsExpeditionTransitionModalOpen, setLoading, setSelectedShippingType, shippingTypes, stages, updateExpeditionItemConferency, updateOrder, updateOrderItem, user }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE DADOS DA COLETA AGENDADA (NOTA, COLETA E COTAÇÃO) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isColetaAgendadaModalOpen && <ColetaAgendadaModal {...{ coletaAgendadaItem, coletaAgendadaMoveBypass, coletaAgendadaTargetStageId, coletaFreightQuotation, coletaInvoiceNumber, coletaPickupNumber, coletaSelectedSiblings, coletaSiblings, loading, moveOrderItemToStage, orderItems, resetAllBypasses, setColetaAgendadaItem, setColetaFreightQuotation, setColetaInvoiceNumber, setColetaPickupNumber, setColetaSelectedSiblings, setIsColetaAgendadaModalOpen, setLoading, stages, updateOrder }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE DADOS TÉCNICOS DE FRETE E EMBALAGEM (OBRIGATÓRIO) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isFreightModalOpen && <FreightModal {...{ currentOperator, customers, freightBoxesCount, freightBypass, freightHeight, freightItem, freightLength, freightQtyPerBox, freightTargetStageId, freightWeight, freightWidth, loading, moveOrderItemToStage, orderItems, orders, resetAllBypasses, selectedFreightSiblings, selectedShippingType, setFreightBoxesCount, setFreightHeight, setFreightItem, setFreightLength, setFreightQtyPerBox, setFreightTargetStageId, setFreightWeight, setFreightWidth, setIsFreightModalOpen, setIsShippingCrudModalOpen, setLoading, setOrderItems, setOrders, setSelectedFreightSiblings, setSelectedShippingType, shippingTypes, stages, updateOrder, updateOrderItem }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE ALERTA DE PRODUÇÃO (FALTAS / CORTESIAS ANTERIORES) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isProductionAlertModalOpen && <ProductionAlertModal {...{ loading, moveOrderItemToStage, productionAlertBypass, productionAlertData, productionAlertItem, productionAlertTargetStageId, resetAllBypasses, setIsProductionAlertModalOpen, setLoading, setProductionAlertData, setProductionAlertItem, updateCustomerStockCredit, updateOrderItem }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE CONFERÊNCIA FÍSICA OBRIGATÓRIA ANTES DE EXPEDIR */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isConferencyModalOpen && <ConferencyModal {...{ conferencyBypass, conferencyChecked, conferencyData, conferencyItem, conferencyPhysicalQuantity, conferencyTargetStageId, loading, moveOrderItemToStage, resetAllBypasses, setConferencyChecked, setConferencyData, setConferencyItem, setConferencyPhysicalQuantity, setIsConferencyModalOpen, setLoading, updateCustomerStockCredit, updateOrderItem, user }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE VINCULAÇÃO DE EQUIPE DE MANUSEIO E ITENS MÚLTIPLOS */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isHandlingTeamModalOpen && <HandlingTeamModal {...{ executeSaveHandlingTeam, handleSwitchHandlingModalItem, handlingTeamAllocations, handlingTeamModalItem, handlingTeamModalTargetStageId, handlingTeams, itemHandlingTeamsMap, orderItems, orders, resetAllBypasses, savingHandlingTeam, setHandlingTeamAllocations, setHandlingTeamModalItem, setHandlingTeamModalTargetStageId, setIsHandlingReworkModalOpen, setIsHandlingTeamModalOpen, setIsShortageModalOpen, setPendingHandlingPayload, setShortageItem, setShortageNotes, setShortageQty, setShortageReason, stages }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE AVISO DE RETRABALHO DE MANUSEIO */}
      {/* ──────────────────────────────────────────────────────────── */}
      <HandlingReworkModal
        isOpen={isHandlingReworkModalOpen}
        isLoading={savingHandlingTeam}
        onClose={() => setIsHandlingReworkModalOpen(false)}
        onConfirm={() => {
          setIsHandlingReworkModalOpen(false);
          executeSaveHandlingTeam(pendingHandlingPayload);
        }}
      />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE AVISO DE ITENS VINCULADOS EM EXPEDIÇÃO */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isLinkedItemsWarningOpen && <LinkedItemsWarningModal {...{ handleConfirmExpeditionMove, handleConfirmExpeditionMoveAll, linkedItemsWarningData, setIsLinkedItemsWarningOpen, setLinkedItemsWarningData, stages }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE PROGRESSO DE SINCRONIZAÇÃO */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isSyncModalOpen && <SyncModal {...{ RefreshCw, handleCancelSync, importEndDate, importStartDate, importing, isSyncingSingle, selectedOrder, setIsSyncModalOpen, setSyncingOrderNumber, syncProgress, syncResult, syncStep, syncingOrderNumber }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE REGISTRO DE EMBALAGEM (VOLUMES, PESO, DIMENSÕES)  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isPackagingModalOpen && <PackagingModal {...{ handleAddPackagingVolume, handlePackagingVolumeChange, handleRemovePackagingVolume, handleSavePackaging, packagingMaterialTypes, packagingModalItem, packagingModalSiblings, packagingModalTargetStageId, packagingVolumes, resetAllBypasses, savingPackaging, setIsPackagingModalOpen }} />}

      {/* MODAL DE CONFERÊNCIA DE EMBALAGEM / SOBRAS E FALTAS */}
      {isAdjustmentModalOpen && <AdjustmentModal {...{ adjustmentAction, adjustmentItem, adjustmentNotes, handleAdjustmentSubmit, loading, producedQuantity, resetAllBypasses, setAdjustmentAction, setAdjustmentNotes, setIsAdjustmentModalOpen, setProducedQuantity }} />}

      {/* MODAL DE CRIAÇÃO E EDIÇÃO DE PEDIDOS */}
      {isModalOpen && <DetailModal {...{ CheckCircle2, customers, factoryLocations, formArtName, formCustomer, formEmbalagem, formFirstPaymentDate, formFormaPag, formFreight, formFreteInfo, formHandlingAllocations, formInitialDestination, formInstallmentsPaid, formInstallmentsTotal, formInternalNotes, formMachineId, formMeasure, formMeioPag, formNotes, formOpNumber, formOverShortQuantity, formPhysicalLocation, formPrazo, formPrintRun, formProductionStartDate, formPvNumber, formSector, formSelectedProductStock, formSeller, formShippingType, formStageId, getItemRealMeasure, handleOpenLocationCrudModal, handleRequestDeleteManualOrder, handleSubmit, handlingTeams, hideMonetaryValues, isAdmin, isManualOrder, isModalOpen, isReadOnlyForForm, modalType, productionMachines, productionSectors, products, selectedItem, selectedOrder, setFormArtName, setFormCustomer, setFormEmbalagem, setFormFirstPaymentDate, setFormFormaPag, setFormFreight, setFormFreteInfo, setFormHandlingAllocations, setFormHandlingTeamId, setFormInitialDestination, setFormInstallmentsPaid, setFormInstallmentsTotal, setFormInternalNotes, setFormMachineId, setFormMeasure, setFormMeioPag, setFormNotes, setFormOpNumber, setFormOverShortQuantity, setFormPhysicalLocation, setFormPrazo, setFormPrintRun, setFormProduct, setFormProductionStartDate, setFormPvNumber, setFormSector, setFormSelectedProductStock, setFormSeller, setFormShippingType, setFormStageId, setFormStatus, setIsMachineCrudModalOpen, setIsModalOpen, setIsSectorCrudModalOpen, stages, user }} />}

      {/* ========================================
          MODAL DE AUTORIZAÇÃO DE RETROCESSO
          ======================================== */}
      {isRevertAuthModalOpen && <RevertAuthModal {...{ Eye, EyeOff, Loader2, handleRevertAuthSubmit, pendingRevertItem, pendingRevertTargetStageId, revertAuthEmail, revertAuthError, revertAuthJustification, revertAuthLoading, revertAuthPassword, setIsRevertAuthModalOpen, setRevertAuthEmail, setRevertAuthJustification, setRevertAuthPassword, setShowRevertPassword, showRevertPassword, stages }} />}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL DE CRUD DE TIPOS DE FRETE (CONFIGURAÇÕES DO ADMIN) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isShippingCrudModalOpen && <ShippingCrudModal {...{ createShippingTypeConfig, deleteShippingTypeConfig, loading, newShippingTypeName, setIsShippingCrudModalOpen, setLoading, setNewShippingTypeName, setShippingTypes, shippingTypes, user }} />}

      {isDetailModalOpen && <DetailViewModal {...{ Copy, CopyButton, Edit3, RefreshCw, Scale, adjustments, calculateExpeditionDate, capitalizeText, detailItem, extractOrderDetails, financialTransactions, formatDocument, formatPhone, getFreightBadgeStyle, getItemRealMeasure, handleOpenEdit, handleOpenHandlingTeamModalForItem, handleRequestDeleteManualOrder, handleSyncSingleOrder, handlingTeams, hideMonetaryValues, isAdmin, isManualOrder, itemHandlingTeamsMap, orderItems, orderRangeChoiceMap, parseDeadlineFromNotes, productionMachines, setExpeditionResolutionNotes, setExpeditionResolutionType, setExpeditionTargetItem, setExpeditionTargetShortage, setIsDetailModalOpen, setIsExpeditionModalOpen, shortagesMap, showToast, stages, syncingSingleOrder, user }} />}

      {/* ========================================
          MODAL CRUD DE SETORES DE PRODUÇÃO
          ======================================== */}
      {isSectorCrudModalOpen && <SectorCrudModal {...{ editingSector, handleDeleteSector, handleSaveSector, productionSectors, savingSector, sectorFormName, sectorFormStatus, setEditingSector, setIsSectorCrudModalOpen, setSectorFormName, setSectorFormStatus }} />}

      {/* ========================================
          MODAL CRUD DE MÁQUINAS DE PRODUÇÃO
          ======================================== */}
      {isMachineCrudModalOpen && <MachineCrudModal {...{ editingMachineState, handleDeleteMachineForm, handleSaveMachineForm, machineFormName, machineFormSector, machineFormStatus, productionMachines, productionSectors, savingMachine, setEditingMachineState, setIsMachineCrudModalOpen, setMachineFormName, setMachineFormSector, setMachineFormStatus }} />}

      {/* MODAL DE ALERTA: PEDIDO EM ANDAMENTO NO CONTA AZUL */}
      {isOrderInProgressModalOpen && <OrderInProgressModal {...{ RefreshCw, handleCancelInProgressOrder, handleForceStartInProgressOrder, handleSyncInProgressOrder, inProgressItem, inProgressSyncing }} />}

      {/* ═══ MODAL DE ESTOQUE INSUFICIENTE ═══ */}
      {isInsufficientStockModalOpen && <InsufficientStockModal {...{ handleCancelInsufficientStockMove, handleConfirmInsufficientStockMove, insufficientStockData, selectedInsufficientItemIds, setSelectedInsufficientItemIds }} />}

      {/* ═══ MODAL DE CONFIRMAÇÃO DE MOVIMENTAÇÃO DE ITENS IRMÃOS DE UM MESMO PEDIDO ═══ */}
      {isSiblingMoveModalOpen && <SiblingMoveModal {...{ Layers, handleCancelSiblingMove, handleConfirmSiblingMoveAll, orders, setSiblingMoveSelectedIds, siblingMoveItem, siblingMoveList, siblingMoveSelectedIds, siblingMoveTargetStageId, stages }} />}

      {/* MODAL: ALERTA DE FATURADO (AO ENTRAR NA EXPEDIÇÃO) */}
      {isFaturadoAlertModalOpen && <FaturadoAlertModal {...{ faturadoAlertItem, handleCancelFaturadoAlertMove, handleConfirmFaturadoAlertMove }} />}

      {/* MODAL DIDÁTICO: ALERTA DE PEDIDO BLOQUEADO (AGUARDANDO PAGAMENTO / SINAL) */}
      {isBlockedPaymentModalOpen && <BlockedPaymentModal {...{ RefreshCw, blockedPaymentItem, blockedPaymentTargetStageId, blockedSyncFeedback, checkIsDelayed, handleCancelBlockedPaymentMove, handleConfirmBlockedPaymentMove, handleSyncSingleOrder, hasOverdueInstallments, importing, stages }} />}

      {/* MODAL DE MOVER PEDIDO DE ETAPA (MOBILE / MANUAL) */}
      {isMoveStageModalOpen && <MoveStageModal {...{ ArrowRightLeft, itemToMoveStage, moveOrderItemToStage, setIsMoveStageModalOpen, setItemToMoveStage, stages }} />}

      {/* MODAL CRUD: GERENCIAR LOCALIZAÇÕES FÍSICAS NA FÁBRICA */}
      {isLocationCrudModalOpen && <LocationCrudModal {...{ Edit3, Loader2, editingLocation, factoryLocations, handleDeleteLocationClick, handleEditLocationClick, handleSaveLocation, locationName, locationStatus, setEditingLocation, setIsLocationCrudModalOpen, setLocationName, setLocationStatus, submittingLocation }} />}

      {/* MODAL DEDICADO: REGISTRAR FALTA / AVARIA DE PRODUTO */}
      {isShortageModalOpen && <ShortageModal {...{ currentOperator, fetchShortagesForItem, saveOrderItemShortage, savingShortage, setIsShortageModalOpen, setSavingShortage, setShortageNotes, setShortageQty, setShortageReason, shortageItem, shortageNotes, shortageQty, shortageReason, showToast }} />}

      {/* MODAL DEDICADO: LIQUIDAÇÃO DE FALTAS / CRÉDITO E DÉBITO NA EXPEDIÇÃO */}
      {isExpeditionModalOpen && <ExpeditionModal {...{ Scale, currentOperator, expeditionResolutionNotes, expeditionResolutionType, expeditionTargetItem, expeditionTargetShortage, fetchShortagesForItem, resolveOrderItemShortage, savingExpeditionResolution, setExpeditionResolutionNotes, setExpeditionResolutionType, setIsExpeditionModalOpen, setSavingExpeditionResolution, showToast }} />}

      {/* ========================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PEDIDO MANUAL (ADMIN)
          ======================================== */}
      {/* ========================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PEDIDO MANUAL (ADMIN)
          ======================================== */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmModalOpen}
        orderToDelete={orderToDelete ? {
          pvNumber: orderToDelete.pvNumber,
          customerName: orderToDelete.customerName,
          artName: orderToDelete.artName,
          printRun: orderToDelete.printRun
        } : null}
        isDeleting={isDeletingManualOrder}
        onClose={() => {
          setIsDeleteConfirmModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={handleConfirmDeleteManualOrder}
      />
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


