'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  getProducts,
  createProduct,
  adjustStock,
  createOrder,
  createOrderItem,
  getOrderStages
} from '@/services/supabase';
import {
  Package,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Layers,
  Hash,
  X
} from 'lucide-react';

export interface TransformSacoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProduct: any | null;
  quantity: number;
  description: string;
  tenantId: string;
  user: any;
  onConfirmNormalSaida: () => void;
  onRequestOperatorAuth: (execFn: (opId: string, opName: string) => Promise<void>) => void;
  onSuccess: () => Promise<void>;
}

const DEFAULT_IR_PARA_MANUSEIO_STAGE_ID = '6ea6a68b-332e-4e5e-a159-104a253f9ae8';

export function isSacoProduct(name?: string | null): boolean {
  if (!name) return false;
  return /\bsacos?\b/i.test(name);
}

export function convertSacoNameToSacola(name: string): string {
  if (!name) return '';
  return name
    .replace(/\bSACOS\b/gi, (m) => (m === m.toUpperCase() ? 'SACOLAS' : 'Sacolas'))
    .replace(/\bSACO\b/gi, (m) => (m === m.toUpperCase() ? 'SACOLA' : 'Sacola'))
    .replace(/\bBRANCOS\b/gi, (m) => (m === m.toUpperCase() ? 'BRANCAS' : 'Brancas'))
    .replace(/\bBRANCO\b/gi, (m) => (m === m.toUpperCase() ? 'BRANCA' : 'Branca'))
    .replace(/\bPARDOS\b/gi, (m) => (m === m.toUpperCase() ? 'PARDAS' : 'Pardas'))
    .replace(/\bPARDO\b/gi, (m) => (m === m.toUpperCase() ? 'PARDA' : 'Parda'))
    .replace(/\bPRETOS\b/gi, (m) => (m === m.toUpperCase() ? 'PRETAS' : 'Pretas'))
    .replace(/\bPRETO\b/gi, (m) => (m === m.toUpperCase() ? 'PRETA' : 'Preta'))
    .replace(/\bLISOS\b/gi, (m) => (m === m.toUpperCase() ? 'LISAS' : 'Lisas'))
    .replace(/\bLISO\b/gi, (m) => (m === m.toUpperCase() ? 'LISA' : 'Lisa'))
    .replace(/\bPERSONALIZADOS\b/gi, (m) => (m === m.toUpperCase() ? 'PERSONALIZADAS' : 'Personalizadas'))
    .replace(/\bPERSONALIZADO\b/gi, (m) => (m === m.toUpperCase() ? 'PERSONALIZADA' : 'Personalizada'))
    .replace(/\bIMPRESSOS\b/gi, (m) => (m === m.toUpperCase() ? 'IMPRESSAS' : 'Impressas'))
    .replace(/\bIMPRESSO\b/gi, (m) => (m === m.toUpperCase() ? 'IMPRESSA' : 'Impressa'));
}

export function extractMeasureFromProduct(product: any): string {
  if (!product) return '';
  if (product.measure && String(product.measure).trim()) {
    return String(product.measure).trim();
  }
  const name = String(product.name || '');
  const match = name.match(
    /(\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?(?:\s*[xX]\s*\d+(?:[.,]\d+)?)?(?:\s*[\/(\-]\s*\d+\s*[gG]\)?)?)/
  );
  return match ? match[1].trim() : '';
}

function normalizeForMatch(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[()\/\-_,.;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDimensionsToken(str: string): string {
  const m = (str || '').match(/(\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?(?:\s*[xX]\s*\d+(?:[.,]\d+)?)?)/);
  if (!m) return '';
  return m[1].toUpperCase().replace(/\s+/g, '').replace(/\./g, ',');
}

export default function TransformSacoModal({
  isOpen,
  onClose,
  sourceProduct,
  quantity,
  description,
  tenantId,
  user,
  onConfirmNormalSaida,
  onRequestOperatorAuth,
  onSuccess
}: TransformSacoModalProps) {
  const [step, setStep] = useState<'prompt' | 'transform'>('prompt');
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Dados preenchidos automaticamente na etapa de transformacao
  const [convertedName, setConvertedName] = useState('');
  const [measure, setMeasure] = useState('');
  const [transformQty, setTransformQty] = useState<number>(quantity || 0);
  const [cardNumber, setCardNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Vinculo com produto Sacola
  const [selectedSacolaProduct, setSelectedSacolaProduct] = useState<any | null>(null);
  const [autoMatched, setAutoMatched] = useState(false);
  const [isChoosingManually, setIsChoosingManually] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingNewSacola, setCreatingNewSacola] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && sourceProduct) {
      setStep('prompt');
      const autoName = convertSacoNameToSacola(sourceProduct.name || '');
      const autoMeasure = extractMeasureFromProduct(sourceProduct);
      setConvertedName(autoName);
      setMeasure(autoMeasure);
      setTransformQty(Math.abs(Number(quantity || 0)));
      setNotes(description || '');
      setCardNumber('');
      setSelectedSacolaProduct(null);
      setAutoMatched(false);
      setIsChoosingManually(false);
      setSearchQuery('');
    }
  }, [isOpen, sourceProduct, quantity, description]);

  const loadCatalogAndMatch = async () => {
    if (!sourceProduct) return;
    setLoadingCatalog(true);
    try {
      const { data } = await getProducts(tenantId);
      const allProds = data || [];
      setCatalogProducts(allProds);

      const targetName = convertSacoNameToSacola(sourceProduct.name || '');
      const normTarget = normalizeForMatch(targetName);
      const sourceDim = extractDimensionsToken(sourceProduct.measure || sourceProduct.name || '');

      const sacolaCandidates = allProds.filter(
        (p: any) => p.id !== sourceProduct.id && /\bsacolas?\b/i.test(p.name || '')
      );

      // 1. Busca exata normalizada
      let bestMatch = sacolaCandidates.find(
        (p: any) => normalizeForMatch(p.name) === normTarget
      );

      // 2. Busca inteligente por similaridade de tokens + medida
      if (!bestMatch && sacolaCandidates.length > 0) {
        const targetTokens = normTarget.split(' ').filter((t) => t.length > 1 && t !== 'SACOLA' && t !== 'SACOLAS');
        let bestScore = 0;

        for (const cand of sacolaCandidates) {
          const candNorm = normalizeForMatch(cand.name);
          const candDim = extractDimensionsToken(cand.measure || cand.name || '');

          // Se ambos tem dimensao explicita e sao diferentes, descarta match automatico
          if (sourceDim && candDim && sourceDim !== candDim) {
            continue;
          }

          let score = 0;
          if (sourceDim && candDim && sourceDim === candDim) {
            score += 5;
          }

          for (const tk of targetTokens) {
            if (candNorm.includes(tk)) {
              score += 2;
            }
          }

          // Verifica correspondencia de cor (BRANCA vs PARDA)
          const isTargetBranca = normTarget.includes('BRANCA') || normTarget.includes('BRANCO');
          const isCandBranca = candNorm.includes('BRANCA') || candNorm.includes('BRANCO');
          const isTargetParda = normTarget.includes('PARDA') || normTarget.includes('PARDO') || normTarget.includes('KRAFT');
          const isCandParda = candNorm.includes('PARDA') || candNorm.includes('PARDO') || candNorm.includes('KRAFT');

          if ((isTargetBranca && isCandParda) || (isTargetParda && isCandBranca)) {
            continue;
          }

          if (score > bestScore && score >= 6) {
            bestScore = score;
            bestMatch = cand;
          }
        }
      }

      if (bestMatch) {
        setSelectedSacolaProduct(bestMatch);
        setAutoMatched(true);
        setIsChoosingManually(false);
        if (!measure && bestMatch.measure) {
          setMeasure(bestMatch.measure);
        }
      } else {
        setSelectedSacolaProduct(null);
        setAutoMatched(false);
        setIsChoosingManually(true);
        setSearchQuery(sourceDim || '');
      }
    } catch (err) {
      console.error('Erro ao buscar produtos para vinculo de sacola:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleChooseTransform = async () => {
    setStep('transform');
    await loadCatalogAndMatch();
  };

  const filteredCandidates = useMemo(() => {
    const sacolasOnly = catalogProducts.filter(
      (p) => p.id !== sourceProduct?.id && /\bsacolas?\b/i.test(p.name || '')
    );
    const pool = sacolasOnly.length > 0 ? sacolasOnly : catalogProducts.filter((p) => p.id !== sourceProduct?.id);
    if (!searchQuery.trim()) return pool.slice(0, 40);

    const qNorm = normalizeForMatch(searchQuery);
    const tokens = qNorm.split(' ').filter(Boolean);
    return pool
      .filter((p) => {
        const pNorm = normalizeForMatch(`${p.name || ''} ${p.sku || ''} ${p.measure || ''}`);
        return tokens.every((tk) => pNorm.includes(tk));
      })
      .slice(0, 40);
  }, [catalogProducts, sourceProduct, searchQuery]);

  const handleCreateNewSacolaProduct = async () => {
    if (!convertedName.trim()) {
      alert('Informe o nome do produto Sacola a ser criado.');
      return;
    }
    setCreatingNewSacola(true);
    try {
      const payload: any = {
        tenant_id: tenantId,
        name: convertedName.trim(),
        sku: sourceProduct?.sku ? `${sourceProduct.sku}-SACOLA` : `SAC-${Date.now().toString().slice(-5)}`,
        description: sourceProduct?.description || 'Produto criado na transformacao de Saco para Sacola',
        price: Number(sourceProduct?.price || 0),
        stock_quantity: 0,
        category: sourceProduct?.category || 'LISAS',
        measure: measure.trim() || null,
        customer_id: sourceProduct?.customer_id || null
      };

      let res = await createProduct(payload);
      if (res.error && res.error.message?.includes('category')) {
        delete payload.category;
        res = await createProduct(payload);
      }
      if (res.error) {
        alert('Erro ao criar produto Sacola: ' + res.error.message);
        return;
      }
      if (res.data) {
        setCatalogProducts((prev) => [res.data, ...prev]);
        setSelectedSacolaProduct(res.data);
        setAutoMatched(false);
        setIsChoosingManually(false);
      }
    } catch (err: any) {
      console.error('Erro ao criar Sacola:', err);
      alert('Falha ao criar produto Sacola: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setCreatingNewSacola(false);
    }
  };

  const formattedPvNumber = useMemo(() => {
    const raw = cardNumber.trim();
    if (!raw) return '';
    if (/^(OP|PV|ORC|MAN)/i.test(raw)) return raw.toUpperCase();
    return `OP-${raw}`;
  }, [cardNumber]);

  const executeTransformation = async (operatorId?: string, operatorName?: string) => {
    if (!sourceProduct || !selectedSacolaProduct) return;
    const qty = Math.abs(Number(transformQty || 0));
    if (qty <= 0) {
      alert('A quantidade para transformacao deve ser maior que zero.');
      return;
    }
    if (!cardNumber.trim()) {
      alert('Informe o numero do Card / OP antes de confirmar a transformacao.');
      return;
    }

    setSubmitting(true);
    try {
      const authLabel = operatorName
        ? `Operador: ${operatorName}`
        : `Administrador: ${user?.full_name || user?.email || 'Sistema'}`;

      // 1. Localizar a etapa "Ir para Manuseio"
      let targetStageId = DEFAULT_IR_PARA_MANUSEIO_STAGE_ID;
      try {
        const { data: stagesData } = await getOrderStages(tenantId);
        const foundStage = (stagesData || []).find(
          (s: any) => s.name && s.name.trim().toLowerCase() === 'ir para manuseio'
        );
        if (foundStage?.id) {
          targetStageId = foundStage.id;
        }
      } catch (e) {
        console.warn('Usando stage_id padrao para Ir para Manuseio');
      }

      const nowIso = new Date().toISOString();
      const nowPtBr = new Date().toLocaleString('pt-BR');
      const todayIso = nowIso.split('T')[0];
      const pvCode = formattedPvNumber;
      const rawDigits = cardNumber.replace(/\D/g, '');
      const numericOrderNum = rawDigits ? parseInt(rawDigits.slice(0, 8), 10) : Math.floor(Date.now() / 1000) % 1000000;
      const finalMeasure = measure.trim() || extractMeasureFromProduct(selectedSacolaProduct) || extractMeasureFromProduct(sourceProduct);
      const traceTag = `[SACO_TO_SACOLA|SACO_ID:${sourceProduct.id}|SACOLA_ID:${selectedSacolaProduct.id}|QTY:${qty}]`;
      const cardNotes = [
        `Transformacao de Saco para Sacola (${qty.toLocaleString('pt-BR')} un)`,
        `Origem (Saco): ${sourceProduct.name}${sourceProduct.sku ? ` [SKU: ${sourceProduct.sku}]` : ''}`,
        `Destino (Sacola): ${selectedSacolaProduct.name}${selectedSacolaProduct.sku ? ` [SKU: ${selectedSacolaProduct.sku}]` : ''}`,
        `Registrado por: ${authLabel} em ${nowPtBr}`,
        notes.trim() ? `Observacao: ${notes.trim()}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      // 2. Criar o Pedido (Order) e o Card (OrderItem) na etapa "Ir para Manuseio"
      const orderPayload = {
        tenant_id: tenantId,
        customer_id: selectedSacolaProduct.customer_id || sourceProduct.customer_id || null,
        product_id: selectedSacolaProduct.id,
        order_number: numericOrderNum,
        pv_number: pvCode,
        op_number: cardNumber.trim(),
        art_name: selectedSacolaProduct.name,
        seller_name: 'Fábrica',
        measure: finalMeasure || null,
        print_run: qty,
        boxes_count: 1,
        packaging_type: 'PACOTE' as const,
        freight_value: 0,
        shipping_type: 'SEM_FRETE',
        status: 'Em produção',
        production_sector: 'Manuseio',
        physical_location: 'Salão',
        stage_id: targetStageId,
        order_date: nowIso,
        first_payment_date: todayIso,
        production_start_date: todayIso,
        installments_total: 1,
        installments_paid: 1,
        over_short_quantity: 0,
        notes: cardNotes,
        internal_notes: `Gerado via Transformacao Saco -> Sacola (${authLabel} em ${nowPtBr})\n${traceTag}`
      };

      const { data: createdOrder, error: orderErr } = await createOrder(orderPayload);
      if (orderErr || !createdOrder) {
        throw new Error(orderErr?.message || 'Nao foi possivel criar o pedido para Ir para Manuseio.');
      }

      const itemPayload: any = {
        tenant_id: tenantId,
        order_id: createdOrder.id,
        product_id: selectedSacolaProduct.id,
        item_type: 'PRODUTO' as const,
        name: selectedSacolaProduct.name,
        measure: finalMeasure || null,
        print_run: qty,
        boxes_count: 1,
        packaging_type: 'PACOTE' as const,
        over_short_quantity: 0,
        status: 'Em produção',
        production_sector: 'Manuseio',
        stage_id: targetStageId,
        machine_id: null,
        handling_team_id: null,
        physical_location: 'Salão',
        notes: cardNotes,
        friendly_id: null
      };

      const { data: createdItem, error: itemErr } = await createOrderItem(itemPayload);
      if (itemErr || !createdItem) {
        throw new Error(itemErr?.message || 'Nao foi possivel criar o card na etapa Ir para Manuseio.');
      }

      // 3. Dar SAIDA no estoque do Saco
      const saidaDesc = `Transformacao Saco -> Sacola [Card ${createdItem.friendly_id || pvCode}] -> Vinculado a: ${selectedSacolaProduct.name}${notes.trim() ? ` | ${notes.trim()}` : ''} (${authLabel})`;
      const { error: saidaErr } = await adjustStock(
        sourceProduct.id,
        -qty,
        'SAIDA',
        saidaDesc,
        tenantId,
        operatorId
      );
      if (saidaErr) {
        throw new Error('Erro ao baixar estoque do Saco: ' + ((saidaErr as any)?.message || saidaErr));
      }

      // 4. Dar ENTRADA no estoque da Sacola com marcador de idempotencia [ITEM:<id>]
      // Isso evita que o estoque da Sacola suba em duplicidade quando o card concluir o Manuseio
      const entradaDesc = `Entrada por Transformacao de Saco (${sourceProduct.name}) [Card ${createdItem.friendly_id || pvCode}] [ITEM:${createdItem.id}] (${authLabel})`;
      const { error: entradaErr } = await adjustStock(
        selectedSacolaProduct.id,
        qty,
        'ENTRADA',
        entradaDesc,
        tenantId,
        operatorId
      );
      if (entradaErr) {
        throw new Error('Erro ao adicionar estoque na Sacola: ' + ((entradaErr as any)?.message || entradaErr));
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro na transformacao Saco -> Sacola:', err);
      alert('Erro ao concluir transformacao: ' + (err.message || 'Falha inesperada.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTransform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSacolaProduct) {
      alert('Selecione ou crie o produto Sacola que recebera a entrada de estoque.');
      return;
    }
    if (!cardNumber.trim()) {
      alert('Por favor, escolha o numero do Card / OP que sera gerado na etapa Ir para Manuseio.');
      return;
    }
    const qty = Math.abs(Number(transformQty || 0));
    if (qty <= 0) {
      alert('Informe uma quantidade valida maior que zero.');
      return;
    }

    if (user?.role === 'Administrador') {
      await executeTransformation();
    } else {
      onRequestOperatorAuth(async (opId: string, opName: string) => {
        await executeTransformation(opId, opName);
      });
    }
  };

  if (!isOpen || !sourceProduct) return null;

  const sourceCurrentStock = Number(sourceProduct.stock_quantity || 0);
  const sourceProjectedStock = sourceCurrentStock - Math.abs(Number(transformQty || 0));
  const targetCurrentStock = Number(selectedSacolaProduct?.stock_quantity || 0);
  const targetProjectedStock = targetCurrentStock + Math.abs(Number(transformQty || 0));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="modal-scroll"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-premium)',
          width: '100%',
          maxWidth: step === 'prompt' ? '500px' : '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <header
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {step === 'prompt' ? 'Transformar Saco em Sacola?' : 'Transformar Saco em Sacola + Manuseio'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Origem: {sourceProduct.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </header>

        {step === 'prompt' ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
                Identificamos que o produto selecionado e um <strong>SACO</strong> e voce esta registrando uma{' '}
                <strong>Saida de {Math.abs(Number(quantity || 0)).toLocaleString('pt-BR')} un</strong>.
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Deseja <strong>transformar de Saco para Sacola</strong> (baixando o estoque do Saco, subindo o estoque da
                Sacola vinculada e gerando o card na etapa <strong>Ir para Manuseio</strong>) ou realizar apenas uma
                saida simples?
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleChooseTransform}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <Layers size={16} />
                <span>Sim, Transformar em Sacola (Gerar Card p/ Manuseio)</span>
              </button>

              <button
                type="button"
                onClick={onConfirmNormalSaida}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                Nao, Apenas Saida Normal de Saco
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  textAlign: 'center'
                }}
              >
                Cancelar e Voltar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitTransform} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* RESUMO DE SALDOS: SACO (SAIDA) -> SACOLA (ENTRADA) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '0.75rem',
                alignItems: 'center',
                backgroundColor: 'var(--background)',
                padding: '0.9rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--danger)', display: 'block' }}>
                  Saida de Estoque (Saco)
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginTop: '2px' }}>
                  {sourceProduct.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Atual: <strong>{sourceCurrentStock.toLocaleString('pt-BR')} un</strong> {'->'} Novo:{' '}
                  <strong style={{ color: sourceProjectedStock < 0 ? 'var(--danger)' : 'var(--text)' }}>
                    {sourceProjectedStock.toLocaleString('pt-BR')} un
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ArrowRight size={20} />
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--success, #16a34a)', display: 'block' }}>
                  Entrada de Estoque (Sacola)
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginTop: '2px' }}>
                  {selectedSacolaProduct ? selectedSacolaProduct.name : 'Selecione a Sacola abaixo'}
                </div>
                {selectedSacolaProduct ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Atual: <strong>{targetCurrentStock.toLocaleString('pt-BR')} un</strong> {'->'} Novo:{' '}
                    <strong style={{ color: 'var(--primary)' }}>{targetProjectedStock.toLocaleString('pt-BR')} un</strong>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px', fontWeight: 600 }}>
                    Aguardando selecao de vinculo
                  </div>
                )}
              </div>
            </div>

            {/* CAMPOS AUTOMATICOS: NOME CONVERTIDO, MEDIDA E QUANTIDADE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 140px', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome Sugerido (Sacola)</label>
                <input
                  type="text"
                  className="form-input"
                  value={convertedName}
                  onChange={(e) => setConvertedName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Medida</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 27x18x10,5"
                  value={measure}
                  onChange={(e) => setMeasure(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Quantidade (un) *</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={transformQty}
                  onChange={(e) => setTransformQty(Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>
            </div>

            {/* VINCULO INTELIGENTE COM PRODUTO SACOLA */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Package size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Produto Sacola Vinculado (Destino do Estoque) *
                  </span>
                </div>

                {selectedSacolaProduct && !isChoosingManually && (
                  <button
                    type="button"
                    onClick={() => setIsChoosingManually(true)}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    Trocar Produto Vinculado
                  </button>
                )}
              </div>

              {loadingCatalog ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  <RefreshCw size={14} className="spinner" />
                  <span>Buscando sacola correspondente no catalogo...</span>
                </div>
              ) : selectedSacolaProduct && !isChoosingManually ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                        {autoMatched ? 'Vinculo Automatico Encontrado' : 'Produto Sacola Selecionado'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {selectedSacolaProduct.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        SKU: {selectedSacolaProduct.sku || '---'} | Estoque Atual:{' '}
                        <strong>{Number(selectedSacolaProduct.stock_quantity || 0).toLocaleString('pt-BR')} un</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: 'var(--text)'
                    }}
                  >
                    <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                      <strong>Escolha com qual Sacola vincular:</strong> Nao encontramos uma Sacola com nome identico ou voce optou por escolher manualmente. Selecione abaixo qual produto Sacola vai subir o estoque (ou crie o produto Sacola agora).
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)'
                        }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
                        placeholder="Pesquisar Sacola por nome, medida ou SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateNewSacolaProduct}
                      disabled={creatingNewSacola}
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        whiteSpace: 'nowrap'
                      }}
                      title="Criar novo produto Sacola no catalogo usando o Nome Sugerido acima"
                    >
                      <Plus size={14} />
                      <span>{creatingNewSacola ? 'Criando...' : 'Criar Sacola Automatica'}</span>
                    </button>
                  </div>

                  <div
                    className="modal-scroll"
                    style={{
                      maxHeight: '170px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--background)'
                    }}
                  >
                    {filteredCandidates.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Nenhuma Sacola encontrada para esta busca. Voce pode clicar em &quot;Criar Sacola Automatica&quot; acima.
                      </div>
                    ) : (
                      filteredCandidates.map((cand) => {
                        const isSelected = selectedSacolaProduct?.id === cand.id;
                        return (
                          <div
                            key={cand.id}
                            onClick={() => {
                              setSelectedSacolaProduct(cand);
                              setAutoMatched(false);
                              setIsChoosingManually(false);
                              if (!measure && cand.measure) {
                                setMeasure(cand.measure);
                              }
                            }}
                            style={{
                              padding: '0.55rem 0.75rem',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                              fontSize: '0.82rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{cand.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                              Estoque: <strong>{Number(cand.stock_quantity || 0).toLocaleString('pt-BR')} un</strong>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* NUMERO DO CARD PARA A ETAPA IR PARA MANUSEIO */}
            <div
              style={{
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                  <Hash size={16} style={{ color: 'var(--primary)' }} />
                  <span>Numero do Card / OP para a Etapa &quot;Ir para Manuseio&quot; *</span>
                </label>

                <button
                  type="button"
                  onClick={() => setCardNumber(`OP-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                >
                  Sugerir Numero
                </button>
              </div>

              <input
                type="text"
                className="form-input"
                placeholder="Digite o numero do card (Ex: OP-2385, ORC 2385 ou 2385) *"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Ao confirmar, sera gerado automaticamente o card{' '}
                <strong style={{ color: 'var(--primary)' }}>
                  {formattedPvNumber ? `${formattedPvNumber}/1` : '---'}
                </strong>{' '}
                na etapa <strong>Ir para Manuseio</strong> do Kanban de Pedidos para que voce possa escolher e rastrear a equipe de manuseio que transformou de Saco para Sacola.
              </div>
            </div>

            {/* OBSERVACOES OPCIONAIS */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Observacoes da Transformacao (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Lote separado para colocacao de alca no manuseio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <footer
              style={{
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Voltar
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !selectedSacolaProduct || !cardNumber.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {submitting && <RefreshCw size={14} className="spinner" />}
                  <span>
                    {submitting
                      ? 'Processando Transformacao...'
                      : 'Confirmar Transformacao e Gerar Card'}
                  </span>
                </button>
              </div>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

