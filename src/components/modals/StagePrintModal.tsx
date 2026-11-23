// @ts-nocheck

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Search,
  Filter,
  ArrowLeft,
  Check,
  RotateCcw,
  FileText,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Layers,
  AlertTriangle
} from 'lucide-react';

interface StagePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: { id: string; name: string; color?: string; isVirtual?: boolean } | null;
  allStageItems: any[];
  kanbanFilteredItems: any[];
  hasActiveKanbanFilters: boolean;
  kanbanActiveFilterValues?: {
    searchOrder?: string;
    customer?: string;
    seller?: string;
    contaAzulStatus?: string;
    release?: string;
    shipping?: string;
  };
  stages: any[];
  orderItems: any[];
  productionMachines: any[];
  handlingTeams: any[];
  itemHandlingTeamsMap: Map<string, any[]>;
  hasOverdueInstallments: (orderId: string) => boolean;
  checkIsDelayed: (item: any, stagesList: any[]) => boolean;
  calculateExpeditionDate: (item: any, order?: any, options?: { isBusinessDays?: boolean; chosenDays?: number }) => any;
  getExpeditionUrgency: (item: any, stagesList: any[], options?: { isBusinessDays?: boolean; chosenDays?: number }) => any;
  getItemRealMeasure: (item: any) => string;
  matchDimensions: (queryStr: string, targetMeasure: string) => boolean;
  extractOrderDetails: (notes: string | null, secondaryNotes?: string | null) => any;
  combineOrderNotes: (primaryNotes?: string | null, secondaryNotes?: string | null) => string;
  getFreightBadgeStyle: (shippingType: string, notesFreight?: string | null) => { backgroundColor: string; color: string; label: string };
  checkMatchShipping: (shippingFilter: string, shippingType?: string | null, carrierName?: string | null, notes?: string | null) => boolean;
  capitalizeText: (val: any) => string;
  isItemBoundToFirstItem: (item: any) => boolean;
  isManualOrder: (order: any) => boolean;
  orderDeadlineConfigMap: Map<string, { isBusinessDays: boolean; chosenDays: number }>;
  orderRangeChoiceMap: Map<string, number>;
  isBusinessDays: boolean;
  user: any;
  historicalStageInfo?: { hasMore: boolean; totalCount: number | null } | null;
}

type UrgencyFilter = 'all' | 'overdue' | 'near' | 'ontime';
type ReleaseFilter = 'all' | 'liberados' | 'bloqueados';
type OriginTypeFilter = 'all' | 'split' | 'conjunto' | 'op_estoque' | 'conta_azul' | 'manual';
type SortMode =
  | 'expedition_asc'
  | 'expedition_desc'
  | 'customer_asc'
  | 'pv_asc'
  | 'measure_asc'
  | 'qty_desc'
  | 'qty_asc';

export function StagePrintModal({
  isOpen,
  onClose,
  stage,
  allStageItems,
  kanbanFilteredItems,
  hasActiveKanbanFilters,
  kanbanActiveFilterValues,
  stages,
  orderItems,
  productionMachines,
  handlingTeams,
  itemHandlingTeamsMap,
  hasOverdueInstallments,
  checkIsDelayed,
  calculateExpeditionDate,
  getExpeditionUrgency,
  getItemRealMeasure,
  matchDimensions,
  extractOrderDetails,
  combineOrderNotes,
  getFreightBadgeStyle,
  checkMatchShipping,
  capitalizeText,
  isItemBoundToFirstItem,
  isManualOrder,
  orderDeadlineConfigMap,
  orderRangeChoiceMap,
  isBusinessDays,
  user,
  historicalStageInfo
}: StagePrintModalProps) {
  const [step, setStep] = useState<'filters' | 'preview'>('filters');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [mounted, setMounted] = useState(false);

  // Filtros completos
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [onlyOverdueInstallments, setOnlyOverdueInstallments] = useState(false);
  const [sizeSearch, setSizeSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const [contaAzulFilter, setContaAzulFilter] = useState('');
  const [shippingFilter, setShippingFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [handlingFilter, setHandlingFilter] = useState('');
  const [originFilter, setOriginFilter] = useState<OriginTypeFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('expedition_asc');

  // Personalizacao das colunas da folha
  const [showPaperCheckCol, setShowPaperCheckCol] = useState(true);
  const [showNotesAndCliche, setShowNotesAndCliche] = useState(true);
  const [showOpsAndMachine, setShowOpsAndMachine] = useState(true);
  const [showFreightAndSeller, setShowFreightAndSeller] = useState(true);
  const [showFooterSignature, setShowFooterSignature] = useState(true);

  // Ajuste fino manual de itens desmarcados
  const [showManualItemsList, setShowManualItemsList] = useState(false);
  const [excludedItemIds, setExcludedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resetar estado ao abrir uma nova etapa
  useEffect(() => {
    if (!isOpen || !stage) return;
    setStep('filters');
    setUrgencyFilter(stage.isVirtual ? 'overdue' : 'all');
    setOnlyOverdueInstallments(false);
    setSizeSearch('');
    setGeneralSearch('');
    setCustomerSearch('');
    setSellerSearch('');
    setReleaseFilter('all');
    setContaAzulFilter('');
    setShippingFilter('');
    setSectorFilter('');
    setLocationFilter('');
    setMachineFilter('');
    setHandlingFilter('');
    setOriginFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortMode(
      stage.name.toLowerCase().includes('conclu') || stage.name.toLowerCase().includes('cancel')
        ? 'expedition_desc'
        : 'expedition_asc'
    );
    setShowManualItemsList(false);
    setExcludedItemIds(new Set());
  }, [isOpen, stage?.id]);

  // Ativa classe no body durante a tela de revisao para que window.print() / Ctrl+P imprima apenas a folha limpa
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen && step === 'preview') {
      document.body.classList.add('samppel-print-active');
    } else {
      document.body.classList.remove('samppel-print-active');
    }
    return () => {
      document.body.classList.remove('samppel-print-active');
    };
  }, [isOpen, step]);

  // Pre-calcula metadados ricos dos itens da etapa uma unica vez
  const enrichedItems = useMemo(() => {
    if (!isOpen || !allStageItems) return [];

    // Contagem de irmaos de producao por pedido para identificar Pedido Conjunto
    const prodCountByOrder = new Map<string, number>();
    for (const oi of orderItems || []) {
      if (!oi?.order_id || isItemBoundToFirstItem(oi)) continue;
      prodCountByOrder.set(oi.order_id, (prodCountByOrder.get(oi.order_id) || 0) + 1);
    }

    return allStageItems.map((item: any) => {
      const parentOrder = item.order || {};
      const orderId = parentOrder.id || item.order_id;
      const cfg = orderDeadlineConfigMap.get(orderId);
      const effectiveBusiness = cfg ? cfg.isBusinessDays : isBusinessDays;
      const effectiveChosenDays = cfg ? cfg.chosenDays : orderRangeChoiceMap.get(item.order_id);

      const expRes = calculateExpeditionDate(item, parentOrder, {
        isBusinessDays: effectiveBusiness,
        chosenDays: effectiveChosenDays
      });
      const expUrgency = getExpeditionUrgency(item, stages, {
        isBusinessDays: effectiveBusiness,
        chosenDays: effectiveChosenDays
      });
      const isDelayedTimer = checkIsDelayed(item, stages);
      const isOverdue = Boolean(expUrgency?.isOverdue || isDelayedTimer);
      const isNear = Boolean(!isOverdue && expUrgency?.isNearExpedition);
      const isReleased = Boolean(parentOrder.first_payment_date);
      const hasOverdueParcel = hasOverdueInstallments(item.order_id);
      const orderDetails = extractOrderDetails(item.notes, parentOrder.notes);
      const realMeasure = getItemRealMeasure(item);
      const freightStyle = getFreightBadgeStyle(parentOrder.shipping_type, orderDetails?.freteInfo);
      const combinedNotes = combineOrderNotes(item.notes, parentOrder.notes);
      const linkedMachine = productionMachines.find((m: any) => m.id === item.machine_id) || item.machine || null;

      const rawAllocs = itemHandlingTeamsMap.get(item.id) || [];
      let itemAllocations = rawAllocs;
      if (itemAllocations.length === 0 && item.handling_team_id) {
        itemAllocations = [{
          id: `${item.id}-fallback`,
          handling_team_id: item.handling_team_id,
          quantity: Number(item.print_run || item.quantity || 0),
          team: item.handling_team || handlingTeams.find((t: any) => t.id === item.handling_team_id),
          is_completed: item.handling_status === 'CONFERIDO' || item.is_completed || false
        }];
      }

      const printRunDisplay =
        item.adjusted_production_quantity !== undefined && item.adjusted_production_quantity !== null
          ? Number(item.adjusted_production_quantity)
          : Number(item.print_run || parentOrder.print_run || 0);

      const packagingLabel = (() => {
        if (orderDetails?.embalagem) return capitalizeText(orderDetails.embalagem);
        const bCount = item.boxes_count || parentOrder.boxes_count;
        const pType = item.packaging_type || parentOrder.packaging_type;
        return bCount ? `${bCount} ${pType === 'PACOTE' ? 'pct' : 'cx'}` : '—';
      })();

      const isSplit = Boolean(item.friendly_id?.endsWith('.1') || item.friendly_id?.endsWith('.2') || item.split_from_item_id || item.split_at);
      const isConjunto = (prodCountByOrder.get(orderId) || 0) > 1;
      const pvStr = String(item.friendly_id || parentOrder.pv_number || '').toUpperCase();
      const isOpEstoque = !pvStr.startsWith('PV-') && (Boolean(parentOrder.op_number || item.op_number) || pvStr.startsWith('OP-') || pvStr.startsWith('ESTOQUE'));
      const manual = isManualOrder(parentOrder);

      return {
        item,
        parentOrder,
        orderId,
        expDate: expRes?.expeditionDate ? new Date(expRes.expeditionDate.getTime()) : null,
        daysRemaining: expUrgency?.daysRemaining ?? null,
        isOverdue,
        isNear,
        isDelayedTimer,
        isReleased,
        hasOverdueParcel,
        orderDetails,
        realMeasure,
        freightStyle,
        combinedNotes,
        linkedMachine,
        itemAllocations,
        printRunDisplay,
        packagingLabel,
        isSplit,
        isConjunto,
        isOpEstoque,
        isManual: manual,
        customerName: parentOrder.customer?.name || parentOrder.customer_name || 'Cliente não informado',
        sellerName: parentOrder.seller_name || item.seller_name || 'Samppel',
        sectorName: item.production_sector || parentOrder.production_sector || '',
        locationName: item.physical_location || parentOrder.physical_location || 'Salão',
        pvLabel: item.friendly_id || parentOrder.pv_number || '---',
        opLabel: item.op_number || parentOrder.op_number || ''
      };
    });
  }, [
    isOpen,
    allStageItems,
    orderItems,
    stages,
    productionMachines,
    handlingTeams,
    itemHandlingTeamsMap,
    orderDeadlineConfigMap,
    orderRangeChoiceMap,
    isBusinessDays
  ]);

  // Sugestoes rapidas (chips) de Tamanhos, Vendedoras, Setores e Locais presentes nesta etapa
  const stageCatalogs = useMemo(() => {
    const sizeFreq = new Map<string, number>();
    const sellerFreq = new Map<string, number>();
    const sectors = new Set<string>();
    const locations = new Set<string>();
    const caStatuses = new Set<string>();

    for (const row of enrichedItems) {
      if (row.realMeasure && row.realMeasure !== '—') {
        const cleanM = row.realMeasure.trim();
        sizeFreq.set(cleanM, (sizeFreq.get(cleanM) || 0) + 1);
      }
      if (row.sellerName) {
        sellerFreq.set(row.sellerName, (sellerFreq.get(row.sellerName) || 0) + 1);
      }
      if (row.sectorName) sectors.add(row.sectorName);
      if (row.locationName) locations.add(row.locationName);
      if (row.parentOrder?.conta_azul_status) caStatuses.add(row.parentOrder.conta_azul_status);
    }

    const topSizes = Array.from(sizeFreq.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12);

    const topSellers = Array.from(sellerFreq.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10);

    return {
      topSizes,
      topSellers,
      sectors: Array.from(sectors).sort((a, b) => a.localeCompare(b)),
      locations: Array.from(locations).sort((a, b) => a.localeCompare(b)),
      caStatuses: Array.from(caStatuses).sort((a, b) => a.localeCompare(b))
    };
  }, [enrichedItems]);

  // Aplicacao de todos os filtros + ordenacao
  const filteredRows = useMemo(() => {
    const sizeQ = sizeSearch.trim().toLowerCase();
    const generalQ = generalSearch.trim().toLowerCase();
    const custQ = customerSearch.trim().toLowerCase();
    const sellQ = sellerSearch.trim().toLowerCase();

    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    const list = enrichedItems.filter((row: any) => {
      const { item, parentOrder } = row;

      // 1. Urgencia / Prazo
      if (urgencyFilter === 'overdue' && !row.isOverdue) return false;
      if (urgencyFilter === 'near' && !row.isNear) return false;
      if (urgencyFilter === 'ontime' && (row.isOverdue || row.isNear)) return false;
      if (onlyOverdueInstallments && !row.hasOverdueParcel) return false;

      // 2. Tamanho / Medida (Pesquisa inteligente, sem dropdown)
      if (sizeQ) {
        const sizeTerms = sizeQ.split(/\s+/).filter(Boolean);
        const itemRealM = (row.realMeasure || '').toLowerCase();
        const itemM = (item.measure || '').toLowerCase();
        const itemS = (item.size || '').toLowerCase();
        const itemN = (item.name || '').toLowerCase();
        const itemArt = (item.art_name || '').toLowerCase();
        const itemProd = (item.product?.name || '').toLowerCase();
        const combinedText = `${itemRealM} ${itemM} ${itemS} ${itemN} ${itemArt} ${itemProd}`;
        const combinedNoSpaces = combinedText.replace(/\s+/g, '');

        const matchesSize = sizeTerms.every((term: string) => {
          const tNorm = term.replace(/\s+/g, '');
          const isDim = /^\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?(?:\s*[xX]\s*\d+(?:[.,]\d+)?)?$/.test(term);
          if (isDim) {
            return (
              matchDimensions(term, itemRealM) ||
              matchDimensions(term, itemM) ||
              matchDimensions(term, itemS) ||
              matchDimensions(term, itemN) ||
              combinedNoSpaces.includes(tNorm)
            );
          }
          return combinedText.includes(term) || combinedNoSpaces.includes(tNorm);
        });
        if (!matchesSize) return false;
      }

      // 3. Busca Geral (PV, OP, Produto, Arte, Cliche, Obs)
      if (generalQ) {
        const terms = generalQ.split(/\s+/).filter(Boolean);
        const haystack = [
          row.pvLabel,
          parentOrder.pv_number,
          row.opLabel,
          item.name,
          item.art_name,
          item.product?.name,
          row.orderDetails?.cliche,
          row.orderDetails?.embalagem,
          row.combinedNotes,
          parentOrder.internal_notes,
          row.customerName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const haystackNoSpaces = haystack.replace(/\s+/g, '');

        const ok = terms.every((t: string) => {
          const cleanT = t.replace(/^pv-?/i, '');
          return haystack.includes(t) || haystack.includes(cleanT) || haystackNoSpaces.includes(t.replace(/\s+/g, ''));
        });
        if (!ok) return false;
      }

      // 4. Cliente
      if (custQ) {
        const custHaystack = [
          row.customerName,
          parentOrder.customer?.trade_name,
          parentOrder.customer?.company_name,
          parentOrder.customer?.document
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!custHaystack.includes(custQ)) return false;
      }

      // 5. Vendedora
      if (sellQ) {
        if (!row.sellerName.toLowerCase().includes(sellQ)) return false;
      }

      // 6. Liberacao financeira
      if (releaseFilter === 'liberados' && !row.isReleased) return false;
      if (releaseFilter === 'bloqueados' && row.isReleased) return false;

      // 7. Status Conta Azul
      if (contaAzulFilter) {
        if (contaAzulFilter === 'Faturado') {
          const isFat = row.orderDetails?.faturamento || (row.orderDetails?.formaPag && row.orderDetails.formaPag.toLowerCase().includes('faturado'));
          if (parentOrder.conta_azul_status !== 'Faturado' && !isFat) return false;
        } else if (parentOrder.conta_azul_status !== contaAzulFilter) {
          return false;
        }
      }

      // 8. Frete / Envio
      if (shippingFilter) {
        if (!checkMatchShipping(shippingFilter, parentOrder.shipping_type, parentOrder.carrier_name, row.combinedNotes)) {
          return false;
        }
      }

      // 9. Setor e Localizacao Fisica
      if (sectorFilter) {
        if (sectorFilter === '__SEM_SETOR__' && row.sectorName) return false;
        if (sectorFilter !== '__SEM_SETOR__' && row.sectorName !== sectorFilter) return false;
      }
      if (locationFilter) {
        if (row.locationName !== locationFilter) return false;
      }

      // 10. Maquina vinculada
      if (machineFilter) {
        if (machineFilter === '__WITH__' && !row.linkedMachine) return false;
        else if (machineFilter === '__WITHOUT__' && row.linkedMachine) return false;
        else if (machineFilter !== '__WITH__' && machineFilter !== '__WITHOUT__' && row.linkedMachine?.id !== machineFilter) return false;
      }

      // 11. Equipe de manuseio
      if (handlingFilter) {
        const allocs = row.itemAllocations || [];
        const totalAllocated = allocs.reduce((s: number, a: any) => s + Number(a.status === 'PARCIALMENTE_CONCLUIDO' ? a.return_quantity || 0 : a.quantity || 0), 0);
        const allDone = allocs.length > 0 && totalAllocated >= Number(item.print_run || item.quantity || 0) && allocs.every((a: any) => a.is_completed);

        if (handlingFilter === '__WITH__' && allocs.length === 0) return false;
        else if (handlingFilter === '__WITHOUT__' && allocs.length > 0) return false;
        else if (handlingFilter === '__DONE__' && !allDone) return false;
        else if (handlingFilter === '__PENDING__' && (allocs.length === 0 || allDone)) return false;
        else if (!handlingFilter.startsWith('__') && !allocs.some((a: any) => a.handling_team_id === handlingFilter)) return false;
      }

      // 12. Origem / Tipo do card
      if (originFilter === 'split' && !row.isSplit) return false;
      if (originFilter === 'conjunto' && !row.isConjunto) return false;
      if (originFilter === 'op_estoque' && !row.isOpEstoque) return false;
      if (originFilter === 'conta_azul' && row.isManual) return false;
      if (originFilter === 'manual' && !row.isManual) return false;

      // 13. Periodo da Data de Expedicao
      if (fromTs !== null || toTs !== null) {
        if (!row.expDate) return false;
        const ts = row.expDate.getTime();
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
      }

      return true;
    });

    // Ordenacao
    return [...list].sort((a: any, b: any) => {
      switch (sortMode) {
        case 'expedition_desc': {
          const at = a.expDate ? a.expDate.getTime() : 0;
          const bt = b.expDate ? b.expDate.getTime() : 0;
          return bt - at;
        }
        case 'customer_asc':
          return a.customerName.localeCompare(b.customerName) || a.pvLabel.localeCompare(b.pvLabel);
        case 'pv_asc':
          return a.pvLabel.localeCompare(b.pvLabel, 'pt-BR', { numeric: true });
        case 'measure_asc':
          return (a.realMeasure || '').localeCompare(b.realMeasure || '', 'pt-BR', { numeric: true });
        case 'qty_desc':
          return b.printRunDisplay - a.printRunDisplay;
        case 'qty_asc':
          return a.printRunDisplay - b.printRunDisplay;
        case 'expedition_asc':
        default: {
          const at = a.expDate ? a.expDate.getTime() : Number.MAX_SAFE_INTEGER;
          const bt = b.expDate ? b.expDate.getTime() : Number.MAX_SAFE_INTEGER;
          return at - bt;
        }
      }
    });
  }, [
    enrichedItems,
    urgencyFilter,
    onlyOverdueInstallments,
    sizeSearch,
    generalSearch,
    customerSearch,
    sellerSearch,
    releaseFilter,
    contaAzulFilter,
    shippingFilter,
    sectorFilter,
    locationFilter,
    machineFilter,
    handlingFilter,
    originFilter,
    dateFrom,
    dateTo,
    sortMode,
    matchDimensions,
    checkMatchShipping
  ]);

  // Itens finais que irao para a folha (excluindo eventuais itens desmarcados manualmente)
  const finalPrintRows = useMemo(() => {
    if (excludedItemIds.size === 0) return filteredRows;
    return filteredRows.filter((r: any) => !excludedItemIds.has(r.item.id));
  }, [filteredRows, excludedItemIds]);

  const totalUnits = useMemo(
    () => finalPrintRows.reduce((acc: number, r: any) => acc + (Number(r.printRunDisplay) || 0), 0),
    [finalPrintRows]
  );

  const totalOverdueInSelection = useMemo(
    () => finalPrintRows.filter((r: any) => r.isOverdue).length,
    [finalPrintRows]
  );

  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (urgencyFilter === 'overdue') parts.push('Somente Atrasados');
    else if (urgencyFilter === 'near') parts.push('Próx. Entrega (<= 10 dias)');
    else if (urgencyFilter === 'ontime') parts.push('Somente No Prazo');
    if (onlyOverdueInstallments) parts.push('Com Parcela Vencida');
    if (sizeSearch.trim()) parts.push(`Tamanho: "${sizeSearch.trim()}"`);
    if (generalSearch.trim()) parts.push(`Busca: "${generalSearch.trim()}"`);
    if (customerSearch.trim()) parts.push(`Cliente: "${customerSearch.trim()}"`);
    if (sellerSearch.trim()) parts.push(`Vendedora: "${sellerSearch.trim()}"`);
    if (releaseFilter === 'liberados') parts.push('Somente Liberados');
    if (releaseFilter === 'bloqueados') parts.push('Somente Bloqueados');
    if (contaAzulFilter) parts.push(`Conta Azul: ${contaAzulFilter}`);
    if (shippingFilter) parts.push(`Frete: ${shippingFilter}`);
    if (sectorFilter) parts.push(`Setor: ${sectorFilter === '__SEM_SETOR__' ? 'Sem setor' : sectorFilter}`);
    if (locationFilter) parts.push(`Local: ${locationFilter}`);
    if (machineFilter) {
      const mName =
        machineFilter === '__WITH__'
          ? 'Com Máquina'
          : machineFilter === '__WITHOUT__'
            ? 'Sem Máquina'
            : productionMachines.find((m: any) => m.id === machineFilter)?.name || machineFilter;
      parts.push(`Máquina: ${mName}`);
    }
    if (handlingFilter) {
      const hName =
        handlingFilter === '__WITH__'
          ? 'Com Equipe'
          : handlingFilter === '__WITHOUT__'
            ? 'Sem Equipe'
            : handlingFilter === '__DONE__'
              ? 'Manuseio Concluído'
              : handlingFilter === '__PENDING__'
                ? 'Manuseio Pendente'
                : handlingTeams.find((t: any) => t.id === handlingFilter)?.name || handlingFilter;
      parts.push(`Manuseio: ${hName}`);
    }
    if (originFilter !== 'all') {
      const labels: Record<string, string> = {
        split: 'Desmembrados (.1/.2)',
        conjunto: 'Pedido Conjunto',
        op_estoque: 'OP / Estoque',
        conta_azul: 'Conta Azul',
        manual: 'Manuais'
      };
      parts.push(`Tipo: ${labels[originFilter] || originFilter}`);
    }
    if (dateFrom || dateTo) {
      parts.push(`Expedição: ${dateFrom ? new Date(`${dateFrom}T12:00:00`).toLocaleDateString('pt-BR') : '...'} até ${dateTo ? new Date(`${dateTo}T12:00:00`).toLocaleDateString('pt-BR') : '...'}`);
    }
    if (excludedItemIds.size > 0) {
      parts.push(`${excludedItemIds.size} item(ns) removido(s) manualmente`);
    }
    return parts;
  }, [
    urgencyFilter,
    onlyOverdueInstallments,
    sizeSearch,
    generalSearch,
    customerSearch,
    sellerSearch,
    releaseFilter,
    contaAzulFilter,
    shippingFilter,
    sectorFilter,
    locationFilter,
    machineFilter,
    handlingFilter,
    originFilter,
    dateFrom,
    dateTo,
    excludedItemIds,
    productionMachines,
    handlingTeams
  ]);

  const clearAllFilters = () => {
    setUrgencyFilter('all');
    setOnlyOverdueInstallments(false);
    setSizeSearch('');
    setGeneralSearch('');
    setCustomerSearch('');
    setSellerSearch('');
    setReleaseFilter('all');
    setContaAzulFilter('');
    setShippingFilter('');
    setSectorFilter('');
    setLocationFilter('');
    setMachineFilter('');
    setHandlingFilter('');
    setOriginFilter('all');
    setDateFrom('');
    setDateTo('');
    setExcludedItemIds(new Set());
  };

  const applyKanbanBarFilters = () => {
    if (!kanbanActiveFilterValues) return;
    if (kanbanActiveFilterValues.searchOrder) setGeneralSearch(kanbanActiveFilterValues.searchOrder);
    if (kanbanActiveFilterValues.customer) setCustomerSearch(kanbanActiveFilterValues.customer);
    if (kanbanActiveFilterValues.seller) setSellerSearch(kanbanActiveFilterValues.seller);
    if (kanbanActiveFilterValues.contaAzulStatus) setContaAzulFilter(kanbanActiveFilterValues.contaAzulStatus);
    if (kanbanActiveFilterValues.release === 'liberados' || kanbanActiveFilterValues.release === 'bloqueados') {
      setReleaseFilter(kanbanActiveFilterValues.release);
    }
    if (kanbanActiveFilterValues.shipping) setShippingFilter(kanbanActiveFilterValues.shipping);
  };

  const handleTriggerPrint = () => {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      window.print();
    }, 60);
  };

  if (!isOpen || !stage) return null;

  const renderPrintableSheet = () => {
    const generatedAt = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div
        className="samppel-print-sheet"
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'Arial, Helvetica, sans-serif',
          width: '100%'
        }}
      >
        {/* Cabecalho Institucional da Folha */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '8px',
            marginBottom: '10px',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>
                SAMPPEL — LISTA DE PEDIDOS DA ETAPA
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1.5px solid ${stage.color || '#2563eb'}`,
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  textTransform: 'uppercase'
                }}
              >
                {stage.name}
              </span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>
              <strong>Filtros aplicados:</strong>{' '}
              {activeFiltersSummary.length > 0 ? activeFiltersSummary.join('  |  ') : 'Todos os itens da etapa (sem filtro adicional)'}
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '10px', color: '#334155', whiteSpace: 'nowrap', lineHeight: 1.45 }}>
            <div><strong>Impresso em:</strong> {generatedAt}</div>
            <div><strong>Gerado por:</strong> {user?.full_name || user?.email || 'Operador'}</div>
            <div style={{ fontSize: '11px', color: '#0f172a', marginTop: '2px' }}>
              <strong>{finalPrintRows.length}</strong> {finalPrintRows.length === 1 ? 'item' : 'itens'} |{' '}
              <strong>{totalUnits.toLocaleString('pt-BR')} un</strong>
              {totalOverdueInSelection > 0 ? ` | ${totalOverdueInSelection} atrasado(s)` : ''}
            </div>
          </div>
        </div>

        {/* Tabela Formato Lista para Impressao */}
        <table
          className="samppel-print-table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: orientation === 'landscape' ? '10.5px' : '9.5px',
            color: '#0f172a'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
              <th style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 800, width: '24px', borderRight: '1px solid #cbd5e1' }}>#</th>
              {showPaperCheckCol && (
                <th style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 800, width: '28px', borderRight: '1px solid #cbd5e1' }}>OK</th>
              )}
              <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 800, width: '90px', borderRight: '1px solid #cbd5e1' }}>PV / OP</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #cbd5e1' }}>Cliente / Produto / Arte</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 800, width: '105px', borderRight: '1px solid #cbd5e1' }}>Tamanho / Medida</th>
              <th style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 800, width: '78px', borderRight: '1px solid #cbd5e1' }}>Qtd / Emb.</th>
              <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 800, width: '105px', borderRight: showOpsAndMachine || showFreightAndSeller ? '1px solid #cbd5e1' : 'none' }}>Expedição / Status</th>
              {(showOpsAndMachine || showFreightAndSeller) && (
                <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: 800, width: orientation === 'landscape' ? '160px' : '120px' }}>
                  {showOpsAndMachine && showFreightAndSeller
                    ? 'Local / Máq / Frete'
                    : showOpsAndMachine
                      ? 'Local / Máq / Equipe'
                      : 'Frete / Vendedora'}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {finalPrintRows.map((row: any, index: number) => {
              const { item, parentOrder, orderDetails } = row;
              const expDateStr = row.expDate ? row.expDate.toLocaleDateString('pt-BR') : 'Sem data';

              const extraNotesChunks: string[] = [];
              if (showNotesAndCliche) {
                if (orderDetails?.cliche) extraNotesChunks.push(`Clichê: ${orderDetails.cliche}`);
                if (orderDetails?.impressao) extraNotesChunks.push(`Arte/Cor: ${orderDetails.impressao}`);
                if (orderDetails?.detalheItem) extraNotesChunks.push(`Detalhe: ${orderDetails.detalheItem}`);
                if (parentOrder.internal_notes) extraNotesChunks.push(`Obs. Interna: ${parentOrder.internal_notes}`);
              }

              const teamLabels = (row.itemAllocations || []).map((a: any) => {
                const tName = a.team?.name || handlingTeams.find((t: any) => t.id === a.handling_team_id)?.name || 'Equipe';
                return `${tName} (${Number(a.status === 'PARCIALMENTE_CONCLUIDO' ? a.return_quantity || 0 : a.quantity || 0).toLocaleString('pt-BR')})`;
              });

              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #cbd5e1',
                    backgroundColor: index % 2 === 1 ? '#f8fafc' : '#ffffff'
                  }}
                >
                  <td style={{ padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', fontWeight: 700, color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                    {index + 1}
                  </td>
                  {showPaperCheckCol && (
                    <td style={{ padding: '5px 4px', textAlign: 'center', verticalAlign: 'top', borderRight: '1px solid #e2e8f0' }}>
                      <div
                        style={{
                          width: '13px',
                          height: '13px',
                          border: '1.5px solid #0f172a',
                          borderRadius: '2px',
                          margin: '1px auto 0 auto',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '5px 6px', verticalAlign: 'top', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{row.pvLabel}</div>
                    {row.opLabel && (
                      <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#1e40af', marginTop: '1px' }}>
                        {row.opLabel}
                      </div>
                    )}
                    {parentOrder.conta_azul_status && (
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginTop: '2px' }}>
                        {parentOrder.conta_azul_status}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'top', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                      {row.customerName}
                    </div>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px', lineHeight: 1.25 }}>
                      {item.name || item.art_name || 'Arte não informada'}
                    </div>
                    {extraNotesChunks.length > 0 && (
                      <div style={{ fontSize: '8.5px', color: '#475569', marginTop: '2px', lineHeight: 1.3 }}>
                        {extraNotesChunks.join('  |  ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'top', borderRight: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                    {row.realMeasure}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', verticalAlign: 'top', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      {row.printRunDisplay.toLocaleString('pt-BR')} un
                    </div>
                    {item.adjusted_production_quantity !== undefined && item.adjusted_production_quantity !== null && (
                      <div style={{ fontSize: '8px', color: '#475569' }}>(Líquido)</div>
                    )}
                    {row.packagingLabel !== '—' && (
                      <div style={{ fontSize: '8.5px', color: '#475569', marginTop: '1px' }}>
                        {row.packagingLabel}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'top', borderRight: showOpsAndMachine || showFreightAndSeller ? '1px solid #e2e8f0' : 'none' }}>
                    <div style={{ fontWeight: row.isOverdue ? 800 : 700, color: row.isOverdue ? '#b91c1c' : '#0f172a' }}>
                      {expDateStr}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                      {row.isOverdue ? (
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 800,
                            padding: '1px 4px',
                            border: '1px solid #b91c1c',
                            color: '#b91c1c',
                            borderRadius: '2px',
                            textTransform: 'uppercase'
                          }}
                        >
                          ATRASADO
                        </span>
                      ) : row.isNear && row.daysRemaining !== null ? (
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 800,
                            padding: '1px 4px',
                            border: '1px solid #b45309',
                            color: '#92400e',
                            borderRadius: '2px'
                          }}
                        >
                          {row.daysRemaining === 0 ? 'HOJE' : `FALTA ${row.daysRemaining}D`}
                        </span>
                      ) : null}
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          padding: '1px 4px',
                          border: `1px solid ${row.isReleased ? '#15803d' : '#b91c1c'}`,
                          color: row.isReleased ? '#166534' : '#991b1b',
                          borderRadius: '2px'
                        }}
                      >
                        {row.isReleased ? 'LIBERADO' : 'BLOQUEADO'}
                      </span>
                    </div>
                  </td>
                  {(showOpsAndMachine || showFreightAndSeller) && (
                    <td style={{ padding: '5px 6px', verticalAlign: 'top', fontSize: '8.5px', lineHeight: 1.35, color: '#1e293b' }}>
                      {showOpsAndMachine && (
                        <>
                          <div><strong>Local:</strong> {row.locationName}</div>
                          {row.sectorName && <div><strong>Setor:</strong> {row.sectorName}</div>}
                          {row.linkedMachine && <div><strong>Máq:</strong> {row.linkedMachine.name}</div>}
                          {teamLabels.length > 0 && <div><strong>Eq:</strong> {teamLabels.join(', ')}</div>}
                        </>
                      )}
                      {showFreightAndSeller && (
                        <>
                          <div><strong>Frete:</strong> {row.freightStyle.label}</div>
                          <div><strong>Vend:</strong> {row.sellerName}</div>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #0f172a', fontWeight: 800 }}>
              <td colSpan={showPaperCheckCol ? 5 : 4} style={{ padding: '6px', textAlign: 'right' }}>
                TOTAIS DA LISTA ({finalPrintRows.length} {finalPrintRows.length === 1 ? 'item' : 'itens'}):
              </td>
              <td style={{ padding: '6px', textAlign: 'right', fontSize: '10.5px' }}>
                {totalUnits.toLocaleString('pt-BR')} un
              </td>
              <td colSpan={showOpsAndMachine || showFreightAndSeller ? 2 : 1} style={{ padding: '6px', fontSize: '9.5px' }}>
                {totalOverdueInSelection > 0 ? `${totalOverdueInSelection} atrasado(s)` : 'Sem atrasados na seleção'}
              </td>
            </tr>
          </tfoot>
        </table>

        {showFooterSignature && (
          <div
            style={{
              marginTop: '18px',
              paddingTop: '10px',
              borderTop: '1px dashed #94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '20px',
              fontSize: '10px',
              color: '#334155'
            }}
          >
            <div>Conferido / Separado por: ___________________________________________</div>
            <div>Data / Hora: _____/_____/________  ____:____</div>
            <div>Visto Supervisor: _________________________</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(4px)',
          zIndex: 250000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        className="no-print"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-scroll"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg, 14px)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: step === 'preview' ? '1060px' : '920px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: 'var(--text)',
            animation: 'fadeIn 0.18s ease'
          }}
        >
          {/* Cabecalho do Modal */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              backgroundColor: 'var(--surface)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(var(--primary-rgb), 0.12)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Printer size={19} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>
                    {step === 'filters' ? 'Imprimir Pedidos da Etapa' : 'Revisão para Impressão (Folha A4)'}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: `${stage.color || '#2563eb'}20`,
                      color: stage.color || 'var(--primary)',
                      border: `1px solid ${stage.color || '#2563eb'}55`
                    }}
                  >
                    {stage.name} ({allStageItems.length})
                  </span>
                </div>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {step === 'filters'
                    ? 'Selecione os filtros desejados e clique em Revisão para Impressão para abrir a folha em formato de lista.'
                    : 'Confira a folha exatamente como será impressa no papel antes de enviar para a impressora.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', flexShrink: 0 }}
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Conteudo Rolavel */}
          {step === 'filters' ? (
            <div
              className="modal-scroll"
              style={{
                padding: '1.15rem 1.25rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Avisos Contextuais (Filtros ativos no Kanban ou Coluna Historica Paginada) */}
              {hasActiveKanbanFilters && kanbanFilteredItems.length !== allStageItems.length && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
                    border: '1px solid rgba(var(--primary-rgb), 0.25)',
                    fontSize: '0.78rem'
                  }}
                >
                  <span>
                    O painel Kanban está com filtros ativos ({kanbanFilteredItems.length} de {allStageItems.length} itens visíveis nesta etapa).
                  </span>
                  <button
                    type="button"
                    onClick={applyKanbanBarFilters}
                    className="btn btn-secondary"
                    style={{ padding: '0.28rem 0.65rem', fontSize: '0.74rem', fontWeight: 700 }}
                  >
                    Puxar filtros ativos do Kanban
                  </button>
                </div>
              )}

              {historicalStageInfo?.hasMore && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--warning-bg)',
                    border: '1px solid var(--border)',
                    fontSize: '0.76rem',
                    color: 'var(--text)'
                  }}
                >
                  <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <span>
                    Esta coluna histórica carrega em lotes de 30 itens ({allStageItems.length} carregados de {historicalStageInfo.totalCount ?? allStageItems.length}). Para incluir pedidos ainda mais antigos, role a coluna no Kanban antes de imprimir.
                  </span>
                </div>
              )}

              {/* BLOCO 1: Situacao / Prazo (Urgencia) */}
              <div
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    1. Situação de Prazo / Atraso
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={onlyOverdueInstallments}
                      onChange={(e) => setOnlyOverdueInstallments(e.target.checked)}
                      style={{ accentColor: 'var(--danger)' }}
                    />
                    <span>Somente com parcela vencida no Conta Azul</span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {[
                    { id: 'all', label: `Todos da Etapa (${enrichedItems.length})` },
                    { id: 'overdue', label: `Somente Atrasados (${enrichedItems.filter((r: any) => r.isOverdue).length})`, danger: true },
                    { id: 'near', label: `Vencendo <= 10 dias (${enrichedItems.filter((r: any) => r.isNear).length})`, warning: true },
                    { id: 'ontime', label: `No Prazo > 10 dias (${enrichedItems.filter((r: any) => !r.isOverdue && !r.isNear).length})` }
                  ].map((opt) => {
                    const active = urgencyFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setUrgencyFilter(opt.id as UrgencyFilter)}
                        className="btn"
                        style={{
                          padding: '0.4rem 0.78rem',
                          fontSize: '0.78rem',
                          fontWeight: active ? 700 : 600,
                          borderRadius: '8px',
                          border: active
                            ? `1.5px solid ${opt.danger ? 'var(--danger)' : opt.warning ? 'var(--warning)' : 'var(--primary)'}`
                            : '1px solid var(--border)',
                          backgroundColor: active
                            ? opt.danger
                              ? 'var(--danger-bg)'
                              : opt.warning
                                ? 'var(--warning-bg)'
                                : 'rgba(var(--primary-rgb), 0.12)'
                            : 'var(--surface)',
                          color: active
                            ? opt.danger
                              ? 'var(--danger)'
                              : opt.warning
                                ? 'var(--warning)'
                                : 'var(--primary)'
                            : 'var(--text)'
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BLOCO 2: Tamanho / Medida (BARRA DE PESQUISA OBRIGATORIA - SEM DROPDOWN) */}
              <div
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    2. Filtrar por Tamanho / Medida (Pesquisa Direta)
                  </span>
                  {sizeSearch && (
                    <button
                      type="button"
                      onClick={() => setSizeSearch('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Limpar tamanho
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: '11px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={sizeSearch}
                    onChange={(e) => setSizeSearch(e.target.value)}
                    placeholder="Digite o tamanho ou medida (ex: 34x24, 40x32x14,5, 26x16, MINI, XM, 90g)..."
                    style={{
                      paddingTop: '0.38rem',
                      paddingBottom: '0.38rem',
                      paddingLeft: '2.1rem',
                      paddingRight: sizeSearch ? '2.1rem' : '0.8rem',
                      height: '38px',
                      fontSize: '0.84rem',
                      lineHeight: 1.35
                    }}
                  />
                  {sizeSearch && (
                    <button
                      type="button"
                      onClick={() => setSizeSearch('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '2px'
                      }}
                      title="Limpar pesquisa de tamanho"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {stageCatalogs.topSizes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.1rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Medidas na etapa:
                    </span>
                    {stageCatalogs.topSizes.map(([measure, count]) => {
                      const isSel = sizeSearch.trim().toLowerCase() === measure.toLowerCase();
                      return (
                        <button
                          key={measure}
                          type="button"
                          onClick={() => setSizeSearch(isSel ? '' : measure)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: isSel ? 'rgba(var(--primary-rgb), 0.14)' : 'var(--surface)',
                            color: isSel ? 'var(--primary)' : 'var(--text)',
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {measure} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BLOCO 3: Todos os Demais Filtros (Busca, Cliente, Vendedora, Financeiro, Frete, Operacional, Datas, Ordem) */}
              <div
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  3. Filtros Complementares e Ordenação
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '0.7rem' }}>
                  {/* Busca Geral */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      PV / OP / Produto / Clichê / Obs
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={generalSearch}
                      onChange={(e) => setGeneralSearch(e.target.value)}
                      placeholder="Ex: PV-2455, OP-8301, Sacola..."
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    />
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Cliente (Razão / Fantasia / Doc)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Pesquisar cliente..."
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    />
                  </div>

                  {/* Vendedora */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Vendedora / Responsável
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={sellerSearch}
                      onChange={(e) => setSellerSearch(e.target.value)}
                      placeholder="Ex: Larissa, Fábrica, Lucas..."
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    />
                  </div>

                  {/* Liberacao Financeira */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Liberação Financeira
                    </label>
                    <select
                      className="form-select"
                      value={releaseFilter}
                      onChange={(e) => setReleaseFilter(e.target.value as ReleaseFilter)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="all">Todas (Liberados e Bloq.)</option>
                      <option value="liberados">Somente Liberados (Sinal OK)</option>
                      <option value="bloqueados">Somente Bloqueados</option>
                    </select>
                  </div>

                  {/* Status Conta Azul */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Status Conta Azul
                    </label>
                    <select
                      className="form-select"
                      value={contaAzulFilter}
                      onChange={(e) => setContaAzulFilter(e.target.value)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="">Todos os Status</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Faturado">Faturado</option>
                      <option value="Cancelado">Cancelado</option>
                      {stageCatalogs.caStatuses
                        .filter((s) => !['Aprovado', 'Faturado', 'Cancelado'].includes(s))
                        .map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                  </div>

                  {/* Tipo de Frete */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Tipo de Frete / Envio
                    </label>
                    <select
                      className="form-select"
                      value={shippingFilter}
                      onChange={(e) => setShippingFilter(e.target.value)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="">Todos os Fretes</option>
                      <option value="RETIRADA">Retirada</option>
                      <option value="ENTREGA_PROPRIA">Carro Próprio</option>
                      <option value="TRANSPORTADORA">Transportadora</option>
                      <option value="LALAMOVE">Lalamove / Moto</option>
                      <option value="CORREIOS">Correios / Sedex</option>
                      <option value="SEM_FRETE">Sem Frete</option>
                    </select>
                  </div>

                  {/* Localizacao Fisica */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Localização Física
                    </label>
                    <select
                      className="form-select"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="">Todas as Localizações</option>
                      {stageCatalogs.locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Setor */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Setor de Produção
                    </label>
                    <select
                      className="form-select"
                      value={sectorFilter}
                      onChange={(e) => setSectorFilter(e.target.value)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="">Todos os Setores</option>
                      {stageCatalogs.sectors.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                      <option value="__SEM_SETOR__">Sem Setor Definido</option>
                    </select>
                  </div>

                  {/* Maquina Vinculada */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Máquina Vinculada
                    </label>
                    <select
                      className="form-select"
                      value={machineFilter}
                      onChange={(e) => setMachineFilter(e.target.value)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="">Todas as Máquinas</option>
                      <option value="__WITH__">Com Máquina Vinculada</option>
                      <option value="__WITHOUT__">Sem Máquina Definida</option>
                      {productionMachines.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Equipe de Manuseio */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Equipe / Status de Manuseio
                    </label>
                    <select
                      className="form-select"
                      value={handlingFilter}
                      onChange={(e) => setHandlingFilter(e.target.value)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="">Todas / Indiferente</option>
                      <option value="__WITH__">Com Equipe Vinculada</option>
                      <option value="__WITHOUT__">Sem Equipe Vinculada</option>
                      <option value="__PENDING__">Manuseio Pendente</option>
                      <option value="__DONE__">Manuseio Concluído</option>
                      {handlingTeams.map((t: any) => (
                        <option key={t.id} value={t.id}>Equipe: {t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo / Origem do Card */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Tipo / Vínculo do Card
                    </label>
                    <select
                      className="form-select"
                      value={originFilter}
                      onChange={(e) => setOriginFilter(e.target.value as OriginTypeFilter)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="all">Todos os Tipos</option>
                      <option value="conjunto">Pedido Conjunto (2+ itens)</option>
                      <option value="split">Desmembrados (.1 / .2)</option>
                      <option value="op_estoque">OPs / Estoque</option>
                      <option value="conta_azul">Importados Conta Azul</option>
                      <option value="manual">Pedidos Manuais</option>
                    </select>
                  </div>

                  {/* Ordenacao */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.25rem' }}>
                      Ordenação da Lista Impressa
                    </label>
                    <select
                      className="form-select"
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      style={{ height: '36px', padding: '0.35rem 0.65rem', fontSize: '0.82rem', lineHeight: 1.35 }}
                    >
                      <option value="expedition_asc">Expedição: Mais urgente</option>
                      <option value="expedition_desc">Expedição: Mais recente</option>
                      <option value="customer_asc">Cliente (A - Z)</option>
                      <option value="pv_asc">Número PV / OP (Crescente)</option>
                      <option value="measure_asc">Tamanho / Medida (A - Z)</option>
                      <option value="qty_desc">Tiragem (Maior - Menor)</option>
                      <option value="qty_asc">Tiragem (Menor - Maior)</option>
                    </select>
                  </div>
                </div>

                {/* Periodo de Data de Expedicao */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', paddingTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} />
                    Data de Expedição:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>De</span>
                    <input
                      type="date"
                      className="form-input"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      style={{ height: '34px', fontSize: '0.8rem', width: '146px', padding: '0.28rem 0.5rem', lineHeight: 1.3 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Até</span>
                    <input
                      type="date"
                      className="form-input"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      style={{ height: '34px', fontSize: '0.8rem', width: '146px', padding: '0.28rem 0.5rem', lineHeight: 1.3 }}
                    />
                  </div>

                  {stageCatalogs.topSellers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem', marginLeft: 'auto' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vendedoras:</span>
                      {stageCatalogs.topSellers.slice(0, 5).map(([sName, sCount]) => {
                        const isSel = sellerSearch.trim().toLowerCase() === sName.toLowerCase();
                        return (
                          <button
                            key={sName}
                            type="button"
                            onClick={() => setSellerSearch(isSel ? '' : sName)}
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '5px',
                              border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                              backgroundColor: isSel ? 'rgba(var(--primary-rgb), 0.14)' : 'var(--surface)',
                              color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                              fontWeight: isSel ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {sName} ({sCount})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 4: Opcoes da Folha Impressa e Selecao Fina */}
              <div
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <SlidersHorizontal size={13} />
                    4. Informações Visíveis na Folha Impressa
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualItemsList(!showManualItemsList)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <span>Conferir / Desmarcar itens individuais ({finalPrintRows.length})</span>
                    {showManualItemsList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.78rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showPaperCheckCol} onChange={(e) => setShowPaperCheckCol(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    <span>Coluna Check [ ] (p/ papel)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showNotesAndCliche} onChange={(e) => setShowNotesAndCliche(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    <span>Clichê / Arte / Obs</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showOpsAndMachine} onChange={(e) => setShowOpsAndMachine(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    <span>Local / Máquina / Equipe</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showFreightAndSeller} onChange={(e) => setShowFreightAndSeller(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    <span>Frete / Vendedora</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showFooterSignature} onChange={(e) => setShowFooterSignature(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    <span>Assinatura no rodapé</span>
                  </label>
                </div>

                {showManualItemsList && (
                  <div
                    className="modal-scroll"
                    style={{
                      marginTop: '0.25rem',
                      maxHeight: '190px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface)',
                      padding: '0.45rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0.35rem 0.45rem 0.35rem', borderBottom: '1px solid var(--border)', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {finalPrintRows.length} de {filteredRows.length} marcado(s)
                      </span>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                          type="button"
                          onClick={() => setExcludedItemIds(new Set())}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem' }}
                        >
                          Marcar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcludedItemIds(new Set(filteredRows.map((r: any) => r.item.id)))}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.72rem' }}
                        >
                          Desmarcar todos
                        </button>
                      </div>
                    </div>
                    {filteredRows.length === 0 ? (
                      <div style={{ padding: '0.85rem', textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Nenhum pedido corresponde aos filtros selecionados.
                      </div>
                    ) : (
                      filteredRows.map((row: any) => {
                        const checked = !excludedItemIds.has(row.item.id);
                        return (
                          <label
                            key={row.item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.6rem',
                              padding: '0.35rem 0.4rem',
                              borderBottom: '1px solid var(--border)',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setExcludedItemIds((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.delete(row.item.id);
                                    else next.add(row.item.id);
                                    return next;
                                  });
                                }}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{row.pvLabel}</span>
                              <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {row.customerName} — {row.item.name}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, fontSize: '0.72rem' }}>
                              <span style={{ fontWeight: 600 }}>{row.realMeasure}</span>
                              <span>{row.printRunDisplay.toLocaleString('pt-BR')} un</span>
                              {row.isOverdue && (
                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Atrasado</span>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TELA 2: REVISAO PARA IMPRESSAO (PREVIA REAL DA FOLHA A4) */
            <div
              className="modal-scroll"
              style={{
                padding: '1.25rem',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#cbd5e1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start'
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  width: '100%',
                  maxWidth: orientation === 'landscape' ? '980px' : '760px',
                  minHeight: '520px',
                  padding: '22px 24px',
                  borderRadius: '4px',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.28)',
                  boxSizing: 'border-box'
                }}
              >
                {renderPrintableSheet()}
              </div>
            </div>
          )}

          {/* Rodape Fixo de Acoes */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            {step === 'filters' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                  <div>
                    <strong style={{ color: finalPrintRows.length > 0 ? 'var(--primary)' : 'var(--danger)', fontSize: '0.95rem' }}>
                      {finalPrintRows.length}
                    </strong>{' '}
                    <span>{finalPrintRows.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}</span>
                    <span style={{ color: 'var(--text-muted)' }}> de {allStageItems.length}</span>
                  </div>
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Tiragem total: <strong style={{ color: 'var(--text)' }}>{totalUnits.toLocaleString('pt-BR')} un</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {activeFiltersSummary.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      <RotateCcw size={14} />
                      <span>Limpar Filtros</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.95rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('preview')}
                    disabled={finalPrintRows.length === 0}
                    className="btn btn-primary"
                    style={{
                      padding: '0.55rem 1.15rem',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      opacity: finalPrintRows.length === 0 ? 0.45 : 1,
                      cursor: finalPrintRows.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <FileText size={15} />
                    <span>Revisão para Impressão</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStep('filters')}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <ArrowLeft size={14} />
                    <span>Voltar aos Filtros</span>
                  </button>

                  <div
                    style={{
                      display: 'inline-flex',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '2px',
                      backgroundColor: 'var(--background)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className="btn"
                      style={{
                        padding: '0.32rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: orientation === 'portrait' ? 700 : 500,
                        backgroundColor: orientation === 'portrait' ? 'var(--primary)' : 'transparent',
                        color: orientation === 'portrait' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      A4 Retrato
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className="btn"
                      style={{
                        padding: '0.32rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: orientation === 'landscape' ? 700 : 500,
                        backgroundColor: orientation === 'landscape' ? 'var(--primary)' : 'transparent',
                        color: orientation === 'landscape' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      A4 Paisagem
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.95rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerPrint}
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 800 }}
                  >
                    <Printer size={16} />
                    <span>Imprimir Folha Agora</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Portal exclusivo para impressao limpa em A4 sem cortes de altura/overflow nem barra lateral */}
      {mounted && step === 'preview' &&
        createPortal(
          <div id="samppel-print-sheet-portal">
            <style>{`
              @page {
                size: A4 ${orientation};
                margin: 10mm;
              }
            `}</style>
            {renderPrintableSheet()}
          </div>,
          document.body
        )}
    </>
  );
}
