import { getDbClient } from '../supabaseClient';
import { adjustStock } from './products';

export async function getOrders(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  
  const selectQuery = [
    'id', 'tenant_id', 'order_number', 'pv_number', 'op_number', 'art_name', 'seller_name',
    'measure', 'print_run', 'boxes_count', 'packaging_type', 'freight_value', 'shipping_type',
    'status', 'production_sector', 'physical_location', 'notes', 'internal_notes', 'order_date',
    'installments_total', 'installments_paid', 'first_payment_date', 'production_start_date', 'over_short_quantity',
    'package_weight', 'package_length', 'package_width', 'package_height', 'quantity_per_box',
    'invoice_number', 'pickup_number', 'freight_quotation', 'scheduled_date', 'carrier_name',
    'conta_azul_status', 'conta_azul_id', 'customer_id', 'product_id', 'stage_id', 'created_at', 'updated_at',
    'customer:customers(id, name, document, phone, email, address)',
    'product:products(id, name, sku, price, stock_quantity)',
    'stage:order_stages(id, name, color, sequence)'
  ].join(', ');

  const { data, error } = await getDbClient()
    .from('orders')
    .select(selectQuery)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data: (data as any[] | null), error };
}

export async function createOrder(order: any) {
  
  let orderToInsert = { ...order };
  if (!orderToInsert.product_id) {
    // Busca o primeiro produto disponível para satisfazer a FK NOT NULL da tabela orders
    const { data: existingProd } = await getDbClient()
      .from('products')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingProd?.id) {
      orderToInsert.product_id = existingProd.id;
    } else {
      // Se não houver produtos cadastrados, cria um produto genérico padrão
      const { data: newProd } = await getDbClient()
        .from('products')
        .insert([{
          tenant_id: orderToInsert.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
          name: 'Produto Sob Encomenda / Geral',
          category: 'PERSONALIZADA',
          description: '[CATEGORIA:PERSONALIZADA]',
          price: 0,
          stock_quantity: 0
        }])
        .select('id')
        .single();
      if (newProd?.id) {
        orderToInsert.product_id = newProd.id;
      }
    }
  }
  
  const { data, error } = await getDbClient().from('orders').insert([orderToInsert]).select().single();
  if (!error && data) {
    
    const { data: prod } = await getDbClient().from('products').select('price').eq('id', data.product_id).single();
    const { data: cust } = await getDbClient().from('customers').select('name').eq('id', data.customer_id).single();
    const amount = ((prod ? prod.price : 0) * data.print_run) + data.freight_value;
    
    await getDbClient().from('financial_transactions').insert([{
      tenant_id: data.tenant_id,
      order_id: data.id,
      type: 'RECEITA',
      amount,
      status: 'PENDENTE',
      description: `Venda ${cust ? cust.name : 'Cliente'} #${data.order_number}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]);
  }
  return { data, error };
}

export async function updateOrder(id: string, updates: any) {
  
  const { data, error } = await getDbClient().from('orders').update(updates).eq('id', id).select().single();
  if (!error && data) {
    if (updates.status === 'Pago') {
      await getDbClient()
        .from('financial_transactions')
        .update({ status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] })
        .eq('order_id', id);
    }
  }
  return { data, error };
}

export async function deleteOrder(id: string) {

  // Deleta itens do pedido
  await getDbClient().from('order_items').delete().eq('order_id', id);
  // Deleta transações financeiras se houver
  await getDbClient().from('financial_transactions').delete().eq('order_id', id);
  // Deleta o registro em orders
  const { data, error } = await getDbClient().from('orders').delete().eq('id', id).select().single();
  return { data, error };
}

// Etapas do Kanban
export async function getOrderStages(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sequence', { ascending: true });
  return { data, error };
}

export async function createOrderStage(stage: any) {
  const { data, error } = await getDbClient()
    .from('order_stages')
    .insert([stage])
    .select()
    .single();
  return { data, error };
}

export async function updateOrderStage(id: string, updates: any) {
  const { data, error } = await getDbClient()
    .from('order_stages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteOrderStage(id: string) {
  const { data, error } = await getDbClient()
    .from('order_stages')
    .delete()
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// Permissões por Perfil

// --- ITENS DE PEDIDO (ORDER ITEMS) ---

export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  product_id: string | null;
  item_type: 'PRODUTO' | 'SERVICO';
  name: string;
  item_index: number;
  friendly_id: string;
  measure: string | null;
  print_run: number;
  boxes_count: number;
  quantity_per_box?: number | null;
  packaging_type: 'CAIXA' | 'PACOTE';
  over_short_quantity: number;
  shortage_quantity?: number;
  courtesy_quantity?: number;
  expedition_notes?: string | null;
  status: string;
  production_sector: string;
  stage_id: string | null;
  machine_id: string | null;
  handling_team_id: string | null;
  physical_location: string | null;
  notes: string | null;
  adjustment_resolved?: boolean;
  resolved_by_item_id?: string | null;
  applied_adjustment_id?: string | null;
  adjusted_quantity_math?: string | null;
  adjusted_production_quantity?: number | null;
  last_operator_id?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  product?: any;
  stage?: any;
}

export async function getOrderItems(orderId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  // Query base com colunas otimizadas para economizar Egress e acelerar carregamento
  const itemFields = [
    'id', 'tenant_id', 'order_id', 'product_id', 'item_type', 'name', 'item_index',
    'friendly_id', 'measure', 'print_run', 'boxes_count', 'packaging_type',
    'over_short_quantity', 'status', 'production_sector', 'stage_id', 'physical_location',
    'machine_id', 'handling_team_id', 'notes', 'unit_price', 'total_price',
    'shortage_quantity', 'courtesy_quantity', 'expedition_notes',
    'adjustment_resolved', 'resolved_by_item_id', 'applied_adjustment_id',
    'adjusted_quantity_math', 'adjusted_production_quantity', 'quantity_per_box', 'last_operator_id',
    'created_at', 'updated_at'
  ].join(', ');

  const relationFields = [
    'product:products(id, name, sku, price, stock_quantity)',
    'stage:order_stages(id, name, color, sequence)',
    'order:orders(id, order_number, pv_number, op_number, art_name, seller_name, status, order_date, conta_azul_id, conta_azul_status, first_payment_date, shipping_type, freight_value, packaging_type, notes, internal_notes, installments_total, installments_paid, production_start_date, physical_location, customer:customers(id, name, document, phone, email, address))'
  ].join(', ');

  const baseSelect = `${itemFields}, ${relationFields}`;
  const fullSelect = `${itemFields}, machine:production_machines(id, name), handling_team:handling_teams(id, name), ${relationFields}`;

  const buildQuery = (selectStr: string) => {
    let q = getDbClient()
      .from('order_items')
      .select(selectStr)
      .eq('tenant_id', tenantId);
    if (orderId) {
      q = q.eq('order_id', orderId);
    }
    return q.order('created_at', { ascending: false });
  };

  // Tenta com JOINs completos primeiro; se falhar (tabelas ausentes), tenta sem eles
  let { data, error } = await buildQuery(fullSelect);
  if (error && (error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('schema cache'))) {
    const fallback = await buildQuery(baseSelect);
    data = fallback.data;
    error = fallback.error;
  }

  return { data, error };
}


export async function createOrderItem(item: Omit<OrderItem, 'id' | 'item_index' | 'friendly_id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  const { data, error } = await getDbClient()
    .from('order_items')
    .insert([{ ...item, tenant_id: item.tenant_id || tenantId }])
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  return { data, error };
}

export async function updateOrderItem(id: string, updates: Partial<OrderItem>) {

  const selectItemFields = [
    'id', 'tenant_id', 'order_id', 'product_id', 'item_type', 'name', 'item_index',
    'friendly_id', 'measure', 'print_run', 'boxes_count', 'packaging_type',
    'over_short_quantity', 'status', 'production_sector', 'stage_id', 'physical_location',
    'machine_id', 'handling_team_id', 'notes', 'unit_price', 'total_price',
    'shortage_quantity', 'courtesy_quantity', 'expedition_notes',
    'adjustment_resolved', 'resolved_by_item_id', 'applied_adjustment_id',
    'adjusted_quantity_math', 'adjusted_production_quantity', 'quantity_per_box', 'last_operator_id',
    'created_at', 'updated_at'
  ].join(', ');
  const fullSelectForUpdate = `${selectItemFields}, product:products(id, name, sku, price, stock_quantity), stage:order_stages(id, name, color, sequence), machine:production_machines(id, name), handling_team:handling_teams(id, name)`;
  const baseSelectForUpdate = `${selectItemFields}, product:products(id, name, sku, price, stock_quantity), stage:order_stages(id, name, color, sequence)`;

  let { data, error } = await getDbClient()
    .from('order_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(fullSelectForUpdate)
    .single();

  // Fallback se tabelas opcionais não existem ainda
  if (error && (error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('schema cache'))) {
    const fallback = await getDbClient()
      .from('order_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(baseSelectForUpdate)
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  return { data, error };
}

export interface SplitOrderItemParams {
  originalItem: any;
  advanceQuantity: number;
  targetStageId: string;
  targetBoxesCount?: number;
  remainingBoxesCount?: number;
  userId?: string;
  tenantId?: string;
}

export async function splitOrderItem(params: SplitOrderItemParams) {
  const {
    originalItem,
    advanceQuantity,
    targetStageId,
    targetBoxesCount,
    remainingBoxesCount,
    userId,
    tenantId = originalItem?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
  } = params;

  const originalPrintRun = Number(originalItem.print_run || 0);
  if (advanceQuantity <= 0 || advanceQuantity >= originalPrintRun) {
    return { data: null, error: new Error(`Quantidade inválida. Deve ser maior que 0 e menor que ${originalPrintRun}.`) };
  }

  const remainingQuantity = originalPrintRun - advanceQuantity;

  // Identificadores com sufixos .1 e .2 recursivos
  const baseId = (
    originalItem.friendly_id || 
    originalItem.order?.pv_number || 
    originalItem.order?.op_number || 
    'CARD'
  ).trim();

  const part1FriendlyId = `${baseId}.1`;
  const part2FriendlyId = `${baseId}.2`;

  const totalBoxes = Number(originalItem.boxes_count || 1);
  const part1Boxes = targetBoxesCount ?? Math.max(1, Math.round(totalBoxes * (advanceQuantity / originalPrintRun)));
  const part2Boxes = remainingBoxesCount ?? Math.max(1, totalBoxes - part1Boxes);

  const nowIso = new Date().toISOString();

  // 1. Atualiza o card original (Card 2 - Permanece na etapa atual)
  const card2Updates = {
    friendly_id: part2FriendlyId,
    print_run: remainingQuantity,
    boxes_count: part2Boxes,
    split_at: nowIso,
    split_by_user_id: userId || null,
    notes: originalItem.notes 
      ? `${originalItem.notes}\n[Desmembrado: Saldo restante de ${baseId}]`
      : `Saldo restante de ${baseId}`,
    updated_at: nowIso
  };

  const { data: updatedCard2, error: errUpdate } = await getDbClient()
    .from('order_items')
    .update(card2Updates)
    .eq('id', originalItem.id)
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  if (errUpdate) {
    console.error('Erro ao atualizar card remanescente no desmembramento:', errUpdate);
    return { data: null, error: errUpdate };
  }

  // 2. Insere o novo card (Card 1 - Avança para a etapa de destino)
  const card1Payload = {
    tenant_id: tenantId,
    order_id: originalItem.order_id,
    product_id: originalItem.product_id || null,
    item_type: originalItem.item_type || 'PRODUTO',
    name: originalItem.name,
    friendly_id: part1FriendlyId,
    measure: originalItem.measure || null,
    print_run: advanceQuantity,
    boxes_count: part1Boxes,
    packaging_type: originalItem.packaging_type || 'CAIXA',
    over_short_quantity: 0,
    status: 'A produzir',
    stage_id: targetStageId,
    production_sector: originalItem.production_sector || 'Impressão',
    physical_location: originalItem.physical_location || null,
    machine_id: originalItem.machine_id || null,
    notes: originalItem.notes 
      ? `${originalItem.notes}\n[Desmembrado de ${baseId}]`
      : `Desmembrado de ${baseId}`,
    split_from_item_id: originalItem.id,
    split_at: nowIso,
    split_by_user_id: userId || null,
    created_at: nowIso,
    updated_at: nowIso
  };

  const { data: insertedCard1, error: errInsert } = await getDbClient()
    .from('order_items')
    .insert([card1Payload])
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  if (errInsert) {
    console.error('Erro ao inserir novo card desmembrado:', errInsert);
    return { data: null, error: errInsert };
  }

  // 3. Blindagem de Estoque e Status caso a etapa de destino na divisao ja seja Estoque ou Concluido
  if (insertedCard1) {
    const destStageName = (insertedCard1.stage?.name || '').trim();
    const isEnteringStockOrCompleted = destStageName === 'Estoque' || destStageName === 'Concluído';

    if (destStageName === 'Concluído' || destStageName === 'Estoque') {
      const alignedStatus = destStageName === 'Concluído' ? 'Concluído' : 'Em estoque';
      const alignedSector = destStageName === 'Concluído' ? 'Concluído' : 'Estoque';
      await getDbClient()
        .from('order_items')
        .update({ status: alignedStatus, production_sector: alignedSector })
        .eq('id', insertedCard1.id);
      insertedCard1.status = alignedStatus;
      insertedCard1.production_sector = alignedSector;
    }

    if (isEnteringStockOrCompleted && originalItem.product_id) {
      const friendlyUpper = (originalItem.friendly_id || '').toUpperCase().trim();
      const pvUpper = (originalItem.order?.pv_number || '').toUpperCase().trim();
      const opUpper = (originalItem.order?.op_number || '').toUpperCase().trim();
      const sellerUpper = (originalItem.order?.seller_name || '').toUpperCase().trim();
      const isOp =
        friendlyUpper.startsWith('OP-') ||
        pvUpper.startsWith('OP-') ||
        opUpper.startsWith('OP-') ||
        sellerUpper === 'FÁBRICA' ||
        sellerUpper === 'FABRICA';

      // Verifica se o card pai ja havia movimentado o estoque antes de ser dividido
      const { data: parentTx } = await getDbClient()
        .from('stock_transactions')
        .select('id')
        .eq('product_id', originalItem.product_id)
        .ilike('description', `%[ITEM:${originalItem.id}]%`)
        .limit(1);

      const { data: childTx } = await getDbClient()
        .from('stock_transactions')
        .select('id')
        .eq('product_id', originalItem.product_id)
        .ilike('description', `%[ITEM:${insertedCard1.id}]%`)
        .limit(1);

      const hasParentMovedStock = !!(parentTx && parentTx.length > 0);
      const hasChildMovedStock = !!(childTx && childTx.length > 0);

      if (!hasParentMovedStock && !hasChildMovedStock) {
        if (isOp) {
          await adjustStock(
            originalItem.product_id,
            advanceQuantity,
            'ENTRADA',
            `[ITEM:${insertedCard1.id}] Entrada automatica no estoque via divisao/conclusao parcial da OP ${part1FriendlyId} (${advanceQuantity} un)`,
            tenantId
          );
        } else if (destStageName === 'Estoque') {
          await adjustStock(
            originalItem.product_id,
            -advanceQuantity,
            'SAIDA',
            `[ITEM:${insertedCard1.id}] Baixa automatica no estoque via divisao parcial do pedido ${part1FriendlyId} (${advanceQuantity} un)`,
            tenantId
          );
        }
      }
    }
  }

  return {
    data: {
      card1: insertedCard1,
      card2: updatedCard2
    },
    error: null
  };
}

export interface FinalizePartialHandlingParams {
  originalItem: any;
  allocationIndex: number;
  allAllocations: any[];
  deliveredQuantity: number;
  concluidoStageId: string;
  manuseioStageId: string;
  irParaManuseioStageId?: string;
  remainderDestination: 'SAME_TEAM' | 'OTHER_TEAM' | 'IR_PARA_MANUSEIO';
  remainderTeamId?: string;
  originTeamName?: string;
  destinationTeamName?: string;
  operatorId?: string | null;
  operatorName?: string | null;
  giveImmediateStockEntry?: boolean;
  notes?: string;
  tenantId?: string;
}

export async function finalizePartialHandlingAndSplitToCompleted(params: FinalizePartialHandlingParams) {
  const {
    originalItem,
    allocationIndex,
    allAllocations = [],
    deliveredQuantity,
    concluidoStageId,
    manuseioStageId,
    irParaManuseioStageId,
    remainderDestination,
    remainderTeamId,
    originTeamName = 'Equipe de Manuseio',
    destinationTeamName = 'Equipe de Manuseio',
    operatorId,
    operatorName = 'Operador',
    giveImmediateStockEntry = true,
    notes = '',
    tenantId = originalItem?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
  } = params;

  const originalPrintRun = Number(originalItem?.print_run || originalItem?.quantity || 0);
  const deliveredQty = Number(deliveredQuantity || 0);

  if (deliveredQty <= 0 || deliveredQty >= originalPrintRun) {
    return {
      data: null,
      error: new Error(`A quantidade entregue para finalizacao parcial deve ser entre 1 e ${originalPrintRun - 1} unidades.`)
    };
  }

  const remainingQuantity = originalPrintRun - deliveredQty;
  const targetAllocation = allAllocations[allocationIndex] || allAllocations[0] || {};
  const currentTeamId = targetAllocation.handling_team_id || originalItem.handling_team_id || '';

  const baseId = (
    originalItem.friendly_id ||
    originalItem.order?.op_number ||
    originalItem.order?.pv_number ||
    'CARD'
  ).trim();

  const part1FriendlyId = `${baseId}.1`;
  const part2FriendlyId = `${baseId}.2`;

  const totalBoxes = Number(originalItem.boxes_count || 1);
  const part1Boxes = Math.max(1, Math.round(totalBoxes * (deliveredQty / Math.max(1, originalPrintRun))));
  const part2Boxes = Math.max(1, totalBoxes - part1Boxes);

  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);
  const nowPtBr = new Date().toLocaleString('pt-BR');

  // Define etapa e equipe do card remanescente (.2 - saldo que faltou)
  const finalRemainderStageId =
    remainderDestination === 'IR_PARA_MANUSEIO' && irParaManuseioStageId
      ? irParaManuseioStageId
      : manuseioStageId;

  const finalRemainderTeamId =
    remainderDestination === 'SAME_TEAM'
      ? currentTeamId
      : remainderDestination === 'OTHER_TEAM'
      ? (remainderTeamId || currentTeamId)
      : null;

  const remainderStatus =
    remainderDestination === 'IR_PARA_MANUSEIO' ? 'A produzir' : 'Manuseio';

  const destSummary =
    remainderDestination === 'SAME_TEAM'
      ? `Mesma Equipe (${originTeamName})`
      : remainderDestination === 'OTHER_TEAM'
      ? `Outra Equipe (${destinationTeamName})`
      : 'Ir para Manuseio (Definir Equipe Depois)';

  const auditTagCard2 = `[MANUSEIO-SALDO-PENDENTE | DATA:${nowPtBr} | RESP:${operatorName} | ORIGEM:${baseId} (${originalPrintRun} un) | ENTREGUE_CONCLUIDO:${part1FriendlyId} (${deliveredQty} un) | SALDO_RESTANTE:${remainingQuantity} un | DESTINO:${destSummary}${notes ? ` | OBS:${notes}` : ''}]`;
  const auditTagCard1 = `[MANUSEIO-PARCIAL-CONCLUIDO | DATA:${nowPtBr} | RESP:${operatorName} | ORIGEM:${baseId} (${originalPrintRun} un) | ENTREGUE:${deliveredQty} un | EQUIPE:${originTeamName} | SALDO_GERADO:${part2FriendlyId} (${remainingQuantity} un -> ${destSummary})${notes ? ` | OBS:${notes}` : ''}]`;

  // 1. Atualiza o card original (Card .2 - Permanece com o saldo faltante para a mesma ou outra equipe)
  const card2Updates: any = {
    friendly_id: part2FriendlyId,
    print_run: remainingQuantity,
    boxes_count: part2Boxes,
    stage_id: finalRemainderStageId,
    status: remainderStatus,
    production_sector: 'Manuseio',
    handling_team_id: finalRemainderTeamId,
    split_at: nowIso,
    split_by_user_id: operatorId || null,
    notes: originalItem.notes
      ? `${originalItem.notes}\n${auditTagCard2}`
      : auditTagCard2,
    updated_at: nowIso
  };

  const { data: updatedCard2, error: errUpdate } = await getDbClient()
    .from('order_items')
    .update(card2Updates)
    .eq('id', originalItem.id)
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  if (errUpdate) {
    console.error('Erro ao atualizar card do saldo faltante (.2):', errUpdate);
    return { data: null, error: errUpdate };
  }

  // 2. Insere o novo card (Card .1 - Parte entregue vai direto para Concluido)
  const card1Payload: any = {
    tenant_id: tenantId,
    order_id: originalItem.order_id,
    product_id: originalItem.product_id || null,
    item_type: originalItem.item_type || 'PRODUTO',
    name: originalItem.name,
    friendly_id: part1FriendlyId,
    measure: originalItem.measure || null,
    print_run: deliveredQty,
    boxes_count: part1Boxes,
    packaging_type: originalItem.packaging_type || 'CAIXA',
    over_short_quantity: 0,
    status: 'Concluído',
    stage_id: concluidoStageId,
    production_sector: 'Concluído',
    physical_location: originalItem.physical_location || null,
    machine_id: originalItem.machine_id || null,
    handling_team_id: currentTeamId || null,
    notes: originalItem.notes
      ? `${originalItem.notes}\n${auditTagCard1}`
      : auditTagCard1,
    split_from_item_id: originalItem.id,
    split_at: nowIso,
    split_by_user_id: operatorId || null,
    created_at: nowIso,
    updated_at: nowIso
  };

  const { data: insertedCard1, error: errInsert } = await getDbClient()
    .from('order_items')
    .insert([card1Payload])
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  if (errInsert || !insertedCard1) {
    console.error('Erro ao inserir card concluido (.1):', errInsert);
    return { data: null, error: errInsert || new Error('Falha ao criar card concluido (.1).') };
  }

  // 3. Registra a alocacao CONCLUIDA no Card .1 (8.000 un entregues e conferidas)
  const rawPv = part1FriendlyId.replace(/^PV-?/i, '');
  const completedAllocationForCard1 = [
    {
      handling_team_id: currentTeamId,
      quantity: deliveredQty,
      departure_date: targetAllocation.departure_date || todayStr,
      return_quantity: deliveredQty,
      return_date: targetAllocation.return_date || todayStr,
      handling_code: targetAllocation.handling_code || `MS${rawPv}/1`,
      is_completed: true,
      completed_at: targetAllocation.return_date || todayStr,
      services: targetAllocation.services || [],
      status: 'CONCLUIDO' as const,
      notes: `Entrega parcial finalizada e enviada diretamente para Concluido (${deliveredQty.toLocaleString('pt-BR')} un de ${originalPrintRun.toLocaleString('pt-BR')} un).${notes ? ` Obs: ${notes}` : ''}`
    }
  ];
  await saveOrderItemHandlingTeams(insertedCard1.id, completedAllocationForCard1, tenantId);

  // 4. Atualiza a alocacao PENDENTE no Card .2 (2.000 un restantes para a mesma ou outra equipe)
  const rawPv2 = part2FriendlyId.replace(/^PV-?/i, '');
  if (remainderDestination === 'IR_PARA_MANUSEIO' || !finalRemainderTeamId) {
    await saveOrderItemHandlingTeams(updatedCard2.id, [], tenantId);
  } else {
    const pendingAllocationForCard2 = [
      {
        handling_team_id: finalRemainderTeamId,
        quantity: remainingQuantity,
        departure_date: remainderDestination === 'SAME_TEAM' ? (targetAllocation.departure_date || todayStr) : todayStr,
        return_quantity: 0,
        return_date: '',
        handling_code: `MS${rawPv2}/1`,
        is_completed: false,
        completed_at: '',
        services: targetAllocation.services || [],
        status: 'PENDENTE' as const,
        notes: `Saldo remanescente (${remainingQuantity.toLocaleString('pt-BR')} un) desmembrado apos entrega parcial de ${deliveredQty.toLocaleString('pt-BR')} un no card ${part1FriendlyId} (${destSummary}).`
      }
    ];
    await saveOrderItemHandlingTeams(updatedCard2.id, pendingAllocationForCard2, tenantId);
  }

  // 5. Entrada Positiva Imediata no Estoque para o Card .1 (8.000 un)
  let stockEntered = false;
  if (giveImmediateStockEntry && originalItem.product_id) {
    // Verifica se o card original ja era uma transformacao Saco->Sacola que deu entrada previa no ato da criacao
    const isPreEnteredSacoToSacola = (originalItem.notes || '').includes('[SACO_TO_SACOLA|');

    const { data: existingChildTx } = await getDbClient()
      .from('stock_transactions')
      .select('id')
      .eq('product_id', originalItem.product_id)
      .ilike('description', `%[ITEM:${insertedCard1.id}]%`)
      .limit(1);

    if (!isPreEnteredSacoToSacola && (!existingChildTx || existingChildTx.length === 0)) {
      const stockDesc = `[ITEM:${insertedCard1.id}] [MANUSEIO-PARCIAL] Entrada imediata no estoque via finalizacao parcial de manuseio (${part1FriendlyId} - ${deliveredQty.toLocaleString('pt-BR')} un entregues de ${originalPrintRun.toLocaleString('pt-BR')} un | Equipe: ${originTeamName} | Responsavel: ${operatorName})`;
      const stockRes = await adjustStock(
        originalItem.product_id,
        deliveredQty,
        'ENTRADA',
        stockDesc,
        tenantId
      );
      if (!stockRes.error) {
        stockEntered = true;
      }
    }
  }

  // 6. Grava divergencia e rastreabilidade no historico de manuseio
  const formattedMsg = `Entrega parcial finalizada: ${deliveredQty.toLocaleString('pt-BR')} un enviadas direto para Concluido no card ${part1FriendlyId}${stockEntered ? ' (com entrada imediata no estoque)' : ''}. Saldo restante de ${remainingQuantity.toLocaleString('pt-BR')} un gerou o card ${part2FriendlyId} (${destSummary}).`;

  await saveHandlingDivergence(
    {
      order_item_id: updatedCard2.id,
      order_id: originalItem.order_id,
      handling_team_id: currentTeamId || null,
      handling_code: targetAllocation.handling_code || null,
      type: 'FALTA',
      divergence_quantity: remainingQuantity,
      withdrawn_quantity: originalPrintRun,
      returned_quantity: deliveredQty,
      event_date: targetAllocation.return_date || todayStr,
      formatted_message: formattedMsg,
      reported_by_operator_id: operatorId || null,
      reported_by_name: operatorName || 'Operador',
      notes: notes || null
    },
    tenantId
  );

  await saveHandlingDivergence(
    {
      order_item_id: insertedCard1.id,
      order_id: originalItem.order_id,
      handling_team_id: currentTeamId || null,
      handling_code: targetAllocation.handling_code || null,
      type: 'FALTA',
      divergence_quantity: remainingQuantity,
      withdrawn_quantity: originalPrintRun,
      returned_quantity: deliveredQty,
      event_date: targetAllocation.return_date || todayStr,
      formatted_message: formattedMsg,
      reported_by_operator_id: operatorId || null,
      reported_by_name: operatorName || 'Operador',
      notes: notes || null
    },
    tenantId
  );

  return {
    data: {
      completedCard: insertedCard1,
      remainderCard: updatedCard2,
      deliveredQuantity: deliveredQty,
      remainingQuantity,
      stockEntered
    },
    error: null
  };
}

export interface SplitInfoResult {
  isSplit: boolean;
  role: 'parent' | 'child' | 'none';
  parentItem: any | null;
  childItems: any[];
  partnerItem: any | null;
  canRevert: boolean;
  reasonCannotRevert?: string;
  suggestedFriendlyId?: string;
  totalPrintRun?: number;
  totalBoxes?: number;
}

export async function getCardSplitInfo(itemId: string, tenantId?: string): Promise<{ data: SplitInfoResult | null; error: any }> {
  if (!itemId) return { data: null, error: new Error('ID do item é obrigatório.') };

  try {

    // Modo Banco de Dados Real (Supabase)
    const { data: current, error: curErr } = await getDbClient()
      .from('order_items')
      .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
      .eq('id', itemId)
      .single();

    if (curErr || !current) {
      return { data: null, error: curErr || new Error('Item não encontrado.') };
    }

    // Cenário 1: O item atual é o FILHO (possui split_from_item_id)
    if (current.split_from_item_id) {
      const { data: parent } = await getDbClient()
        .from('order_items')
        .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
        .eq('id', current.split_from_item_id)
        .maybeSingle();

      const { data: subChildren } = await getDbClient()
        .from('order_items')
        .select('id, friendly_id')
        .eq('split_from_item_id', current.id);

      const hasSubChildren = !!(subChildren && subChildren.length > 0);
      const isCompleted = current.stage?.name === 'Concluído';
      const totalQty = (parent ? Number(parent.print_run || 0) : 0) + Number(current.print_run || 0);
      const totalBx = (parent ? Number(parent.boxes_count || 1) : 1) + Number(current.boxes_count || 0);
      const restoredId = (parent?.friendly_id || current.friendly_id || '').replace(/\.[12]$/, '');

      let reasonCannotRevert: string | undefined;
      if (hasSubChildren) {
        reasonCannotRevert = 'Este card possui subdivisões ativas (.1.1). Reverta primeiro a divisão mais profunda.';
      } else if (!parent) {
        reasonCannotRevert = 'O card original de onde este foi dividido não foi encontrado no sistema.';
      } else if (isCompleted) {
        reasonCannotRevert = 'Este card já foi concluído/expedido e não pode mais ser reunificado.';
      }

      return {
        data: {
          isSplit: true,
          role: 'child',
          parentItem: parent || null,
          childItems: [current],
          partnerItem: parent || null,
          canRevert: !hasSubChildren && !!parent && !isCompleted,
          reasonCannotRevert,
          suggestedFriendlyId: restoredId,
          totalPrintRun: totalQty,
          totalBoxes: totalBx
        },
        error: null
      };
    }

    // Cenário 2: O item atual é o PAI (existem outros itens com split_from_item_id = current.id)
    const { data: children } = await getDbClient()
      .from('order_items')
      .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
      .eq('split_from_item_id', current.id)
      .order('created_at', { ascending: false });

    if (children && children.length > 0) {
      const primaryChild = children[0];
      const { data: subChildren } = await getDbClient()
        .from('order_items')
        .select('id, friendly_id')
        .eq('split_from_item_id', primaryChild.id);

      const hasSubChildren = !!(subChildren && subChildren.length > 0);
      const isChildCompleted = primaryChild.stage?.name === 'Concluído';
      const totalQty = Number(current.print_run || 0) + Number(primaryChild.print_run || 0);
      const totalBx = Number(current.boxes_count || 1) + Number(primaryChild.boxes_count || 0);
      const restoredId = (current.friendly_id || '').replace(/\.2$/, '');

      let reasonCannotRevert: string | undefined;
      if (hasSubChildren) {
        reasonCannotRevert = `O card filho (${primaryChild.friendly_id}) possui subdivisões ativas. Reverta-as primeiro.`;
      } else if (isChildCompleted) {
        reasonCannotRevert = `O card filho (${primaryChild.friendly_id}) já foi concluído/expedido e não pode ser reunificado.`;
      }

      return {
        data: {
          isSplit: true,
          role: 'parent',
          parentItem: current,
          childItems: children,
          partnerItem: primaryChild,
          canRevert: !hasSubChildren && !isChildCompleted,
          reasonCannotRevert,
          suggestedFriendlyId: restoredId,
          totalPrintRun: totalQty,
          totalBoxes: totalBx
        },
        error: null
      };
    }

    // Cenário 3: Fallback por sufixo de friendly_id (.1 e .2) se o split_from_item_id estiver nulo
    const currentFriendly = (current.friendly_id || '').trim();
    if (/\.[12]$/.test(currentFriendly) && current.order_id) {
      const isDot1 = currentFriendly.endsWith('.1');
      const siblingSuffix = isDot1 ? '.2' : '.1';
      const basePrefix = currentFriendly.slice(0, -2);
      const expectedSiblingFriendly = `${basePrefix}${siblingSuffix}`;

      const { data: sibling } = await getDbClient()
        .from('order_items')
        .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
        .eq('order_id', current.order_id)
        .eq('friendly_id', expectedSiblingFriendly)
        .maybeSingle();

      if (sibling) {
        const parentItem = isDot1 ? sibling : current;
        const childItem = isDot1 ? current : sibling;
        const totalQty = Number(parentItem.print_run || 0) + Number(childItem.print_run || 0);
        const totalBx = Number(parentItem.boxes_count || 1) + Number(childItem.boxes_count || 0);

        return {
          data: {
            isSplit: true,
            role: isDot1 ? 'child' : 'parent',
            parentItem,
            childItems: [childItem],
            partnerItem: sibling,
            canRevert: true,
            suggestedFriendlyId: basePrefix,
            totalPrintRun: totalQty,
            totalBoxes: totalBx
          },
          error: null
        };
      }
    }

    return {
      data: {
        isSplit: false,
        role: 'none',
        parentItem: null,
        childItems: [],
        partnerItem: null,
        canRevert: false
      },
      error: null
    };
  } catch (err: any) {
    console.error('Erro ao consultar split info do item:', err);
    return { data: null, error: err };
  }
}

export interface RevertSplitOrderItemParams {
  currentItemId: string;
  partnerItemId?: string;
  targetStageId?: string;
  userId?: string;
  tenantId?: string;
}

export async function revertSplitOrderItem(params: RevertSplitOrderItemParams) {
  const { currentItemId, partnerItemId, targetStageId, userId, tenantId } = params;

  const splitInfoRes = await getCardSplitInfo(currentItemId, tenantId);
  if (splitInfoRes.error || !splitInfoRes.data || !splitInfoRes.data.isSplit) {
    return {
      data: null,
      error: splitInfoRes.error || new Error('Não foi possível localizar o par de desmembramento deste card.')
    };
  }

  const { role, parentItem, childItems, partnerItem } = splitInfoRes.data;

  let parent = parentItem;
  let child = partnerItemId 
    ? childItems.find(c => c.id === partnerItemId) || partnerItem
    : partnerItem;

  if (role === 'child') {
    child = childItems[0];
    parent = parentItem;
  }

  if (!parent || !child) {
    return { data: null, error: new Error('Não foi possível identificar o card pai e o card filho para a reunificação.') };
  }

  if (child.id === parent.id) {
    return { data: null, error: new Error('Inconsistência nos identificadores: o card pai e o filho são idênticos.') };
  }

  const totalPrintRun = Number(parent.print_run || 0) + Number(child.print_run || 0);
  const totalBoxes = Number(parent.boxes_count || 1) + Number(child.boxes_count || 0);

  // Restaura o friendly_id removendo .2 do pai, ou .1 do filho
  let restoredFriendlyId = (parent.friendly_id || '').trim();
  if (/\.2$/.test(restoredFriendlyId)) {
    restoredFriendlyId = restoredFriendlyId.replace(/\.2$/, '');
  } else if (/\.1$/.test((child.friendly_id || '').trim())) {
    restoredFriendlyId = (child.friendly_id || '').trim().replace(/\.1$/, '');
  }

  // Limpa as anotações geradas no split
  let cleanedNotes = (parent.notes || '')
    .replace(/\r?\n?\[Desmembrado: Saldo restante de [^\]]+\]/gi, '')
    .replace(/\r?\n?\[Desmembrado de [^\]]+\]/gi, '')
    .replace(/\r?\n?Saldo restante de [^\n\r]+/gi, '')
    .trim();

  const nowIso = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const auditNote = `[Desmembramento revertido: reunificado com ${child.friendly_id || 'card filho'} (+${Number(child.print_run || 0).toLocaleString('pt-BR')} un) em ${dateFormatted}]`;
  cleanedNotes = cleanedNotes ? `${cleanedNotes}\n${auditNote}` : auditNote;

  const finalStageId = targetStageId || parent.stage_id;

  // 1. Checa se o pai possui outros filhos além deste
  const { data: otherChildren } = await getDbClient()
    .from('order_items')
    .select('id')
    .eq('split_from_item_id', parent.id)
    .neq('id', child.id);

  const hasOtherChildren = !!(otherChildren && otherChildren.length > 0);

  // 2. Atualiza o card pai com a tiragem somada e friendly_id recomposto
  const parentUpdates: any = {
    friendly_id: restoredFriendlyId,
    print_run: totalPrintRun,
    boxes_count: totalBoxes,
    stage_id: finalStageId,
    notes: cleanedNotes,
    split_at: hasOtherChildren ? parent.split_at : null,
    split_by_user_id: hasOtherChildren ? parent.split_by_user_id : null,
    updated_at: nowIso
  };

  const { data: updatedParent, error: updateErr } = await getDbClient()
    .from('order_items')
    .update(parentUpdates)
    .eq('id', parent.id)
    .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
    .single();

  if (updateErr) {
    console.error('Erro ao atualizar card pai na reversão de split:', updateErr);
    return { data: null, error: updateErr };
  }

  // 3. Se a etapa mudou na reunificação, grava histórico de etapas
  if (finalStageId !== parent.stage_id) {
    try {
      await getDbClient().from('order_item_stage_history').insert([{
        tenant_id: tenantId || parent.tenant_id,
        order_item_id: parent.id,
        from_stage_id: parent.stage_id,
        to_stage_id: finalStageId,
        changed_by_profile_id: userId || null,
        notes: `Reunificação de desmembramento com ${child.friendly_id}`
      }]);
    } catch (stgErr) {
      console.warn('Aviso ao gravar histórico de etapa na reunificação:', stgErr);
    }
  }

  // 4. Remove o card filho (dependências em cascata como histórico e manuseio são limpos)
  const { error: deleteErr } = await getDbClient()
    .from('order_items')
    .delete()
    .eq('id', child.id);

  if (deleteErr) {
    console.error('Erro ao excluir card filho na reversão de split:', deleteErr);
    return { data: null, error: deleteErr };
  }

  return {
    data: {
      reunifiedCard: updatedParent,
      deletedCardId: child.id
    },
    error: null
  };
}

export async function getPendingAdjustment(tenantId: string, customerId: string, productId: string | null) {
  if (!customerId || !productId) return { data: null, error: null };

  // Puxar itens com RLS e join do orders
  const { data, error } = await getDbClient()
    .from('order_items')
    .select('*, order:orders(*)')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .eq('adjustment_resolved', false)
    .or('shortage_quantity.gt.0,courtesy_quantity.gt.0');

  if (error) {
    console.error('Erro getPendingAdjustment:', error);
    return { data: null, error };
  }

  // Filtrar localmente em JS para garantir segurança do join de orders
  if (data && data.length > 0) {
    const filtered = data.find((item: any) => item.order && item.order.customer_id === customerId);
    return { data: filtered || null, error: null };
  }

  return { data: null, error: null };
}

export async function resolvePendingAdjustment(pendingItemId: string, resolvingItemId: string) {

  const { error } = await getDbClient()
    .from('order_items')
    .update({
      adjustment_resolved: true,
      resolved_by_item_id: resolvingItemId,
      updated_at: new Date().toISOString()
    })
    .eq('id', pendingItemId);

  return { success: !error, error };
}

export async function deleteOrderItem(id: string) {

  const { data, error } = await getDbClient()
    .from('order_items')
    .delete()
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// --- ESTOQUE PERSONALIZADO, SOBRAS/FALTAS E CRÉDITOS ---

export interface CustomerProductStock {
  id: string;
  tenant_id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  customer?: any;
  product?: any;
}

export interface OrderBalanceAdjustment {
  id: string;
  tenant_id: string;
  order_id: string;
  order_item_id: string | null;
  customer_id: string;
  product_id: string;
  ordered_quantity: number;
  produced_quantity: number;
  difference_quantity: number;
  adjustment_type: 'SOBRA' | 'FALTA';
  action_taken: 'GUARDAR_ESTOQUE_CLIENTE' | 'CREDITO_PROXIMO_PEDIDO' | 'PENDENCIA_ENTREGA' | 'CANCELADO_DESCONTO' | 'COBRADO_ADICIONAL' | 'REPRODUCAO_PENDENTE' | 'OUTRO';
  notes: string | null;
  created_by_name?: string | null;
  created_at: string;
  order?: any;
  order_item?: any;
  customer?: any;
  product?: any;
}

export interface CustomerStockCredit {
  id: string;
  tenant_id: string;
  customer_id: string;
  product_id: string;
  credit_type: 'CORTESIA_SOBRA' | 'PENDENCIA_ENTREGA';
  original_quantity: number;
  remaining_quantity: number;
  source_order_id: string | null;
  source_adjustment_id: string | null;
  status: 'ATIVO' | 'UTILIZADO' | 'EXPIRADO' | 'CANCELADO';
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: any;
  product?: any;
  source_order?: any;
}

// --- OPERAÇÕES: ESTOQUE PERSONALIZADO POR CLIENTE ---

export async function getCustomerProductStock(customerId?: string, productId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  let query = getDbClient()
    .from('customer_product_stock')
    .select('*, customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId);

  if (customerId) query = query.eq('customer_id', customerId);
  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query;
  return { data, error };
}

export async function createCustomerProductStock(stock: Omit<CustomerProductStock, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = stock.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  const { data, error } = await getDbClient()
    .from('customer_product_stock')
    .upsert({ ...stock, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: 'customer_id, product_id' })
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

export async function updateCustomerProductStock(id: string, updates: Partial<CustomerProductStock>) {

  const { data, error } = await getDbClient()
    .from('customer_product_stock')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

// --- OPERAÇÕES: AJUSTES DE SALDO (SOBRAS E FALTAS) ---

export async function getOrderBalanceAdjustments(orderId?: string, customerId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  let query = getDbClient()
    .from('order_balance_adjustments')
    .select('*, order:orders(*), order_item:order_items(*), customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId);

  if (orderId) query = query.eq('order_id', orderId);
  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export function isClicheName(name?: string | null): boolean {
  if (!name) return false;
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('cliche');
}

export async function createOrderBalanceAdjustment(adjustment: Omit<OrderBalanceAdjustment, 'id' | 'created_at'>) {
  const tenantId = adjustment.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  // Trava Anti-Cliche: itens tecnicos de Cliche nao geram saldo de sobra/falta
  if (adjustment.product_id) {
    const { data: prodCheck } = await getDbClient()
      .from('products')
      .select('name')
      .eq('id', adjustment.product_id)
      .maybeSingle();
    if (isClicheName(prodCheck?.name)) {
      return { data: null, error: null };
    }
  }

  const { data, error } = await getDbClient()
    .from('order_balance_adjustments')
    .insert([{ ...adjustment, tenant_id: tenantId }])
    .select('*, order:orders(*), customer:customers(*), product:products(*)')
    .single();

  if (!error && data) {
    if (data.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' && data.difference_quantity > 0) {
      await createCustomerProductStock({
        tenant_id: tenantId,
        customer_id: data.customer_id,
        product_id: data.product_id,
        quantity: data.difference_quantity
      });
      
      const { data: cust } = await getDbClient().from('customers').select('name').eq('id', data.customer_id).single();
      const { data: ord } = await getDbClient().from('orders').select('order_number').eq('id', data.order_id).single();
      await adjustStock(
        data.product_id,
        data.difference_quantity,
        'ENTRADA',
        `[ESTOQUE_CLIENTE] Entrada de Sobra - Cliente: ${cust ? cust.name : 'Cliente'} - PV: ${ord ? ord.order_number : 'PV'}`,
        tenantId
      );
    }

    if (['CREDITO_PROXIMO_PEDIDO', 'PENDENCIA_ENTREGA', 'REPRODUCAO_PENDENTE'].includes(data.action_taken) && data.difference_quantity !== 0) {
      const type = data.difference_quantity > 0 ? 'CORTESIA_SOBRA' : 'PENDENCIA_ENTREGA';
      const qty = Math.abs(data.difference_quantity);
      await createCustomerStockCredit({
        tenant_id: tenantId,
        customer_id: data.customer_id,
        product_id: data.product_id,
        credit_type: type,
        original_quantity: qty,
        remaining_quantity: qty,
        source_order_id: data.order_id,
        source_adjustment_id: data.id,
        status: 'ATIVO',
        notes: data.notes
      });
    }
  }

  return { data, error };
}

// --- OPERAÇÕES: CRÉDITOS E PENDÊNCIAS DE ESTOQUE ---

export async function getCustomerStockCredits(customerId?: string, status?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  let query = getDbClient()
    .from('customer_stock_credits')
    .select('*, customer:customers(*), product:products(*), source_order:orders(*)')
    .eq('tenant_id', tenantId);

  if (customerId) query = query.eq('customer_id', customerId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createCustomerStockCredit(credit: Omit<CustomerStockCredit, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = credit.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const db = getDbClient();

  // 1. Trava Anti-Cliche: impede geracao de credito/falta sobre itens de Cliche
  if (credit.product_id) {
    const { data: prodCheck } = await db
      .from('products')
      .select('name')
      .eq('id', credit.product_id)
      .maybeSingle();
    if (isClicheName(prodCheck?.name)) {
      return { data: null, error: null };
    }
  }

  // 2. Protecao Anti-Duplicidade por source_adjustment_id
  if (credit.source_adjustment_id) {
    const { data: existingByAdj } = await db
      .from('customer_stock_credits')
      .select('*, customer:customers(*), product:products(*)')
      .eq('source_adjustment_id', credit.source_adjustment_id)
      .maybeSingle();
    if (existingByAdj) {
      return { data: existingByAdj, error: null };
    }
  }

  // 3. Protecao Anti-Duplicidade em janela de 60s para chamadas concorrentes sem source_adjustment_id
  const recentWindowIso = new Date(Date.now() - 60 * 1000).toISOString();
  let dupQuery = db
    .from('customer_stock_credits')
    .select('*, customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId)
    .eq('customer_id', credit.customer_id)
    .eq('product_id', credit.product_id)
    .eq('credit_type', credit.credit_type)
    .eq('original_quantity', credit.original_quantity)
    .eq('status', 'ATIVO')
    .gte('created_at', recentWindowIso);

  if (credit.source_order_id) {
    dupQuery = dupQuery.eq('source_order_id', credit.source_order_id);
  }

  const { data: recentDup } = await dupQuery.limit(1).maybeSingle();
  if (recentDup) {
    return { data: recentDup, error: null };
  }

  const { data, error } = await db
    .from('customer_stock_credits')
    .insert([{ ...credit, tenant_id: tenantId }])
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

export async function updateCustomerStockCredit(id: string, updates: Partial<CustomerStockCredit>) {

  const { data, error } = await getDbClient()
    .from('customer_stock_credits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

// --- INCIDENTES DE PEDIDOS (ORDER INCIDENTS) ---

export interface OrderIncident {
  id: string;
  tenant_id: string;
  order_id: string;
  order_item_id: string | null;
  category: 'PRODUCAO' | 'TRANSPORTE' | 'FINANCEIRO' | 'CLIENTE' | 'MANUSEIO' | 'OUTRO';
  description: string;
  status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO';
  created_by: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  updated_at: string;
  order?: any;
  order_item?: any;
  creator?: any;
  resolver?: any;
}

export async function getOrderIncidents(orderId?: string, category?: string, status?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  let query = getDbClient()
    .from('order_incidents')
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*), resolver:profiles!resolved_by(*)')
    .eq('tenant_id', tenantId);

  if (orderId) query = query.eq('order_id', orderId);
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrderIncident(incident: Omit<OrderIncident, 'id' | 'created_at' | 'resolved_at' | 'updated_at'>) {
  const tenantId = incident.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .insert([{ ...incident, tenant_id: tenantId }])
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*)')
    .single();

  return { data, error };
}

export async function resolveOrderIncident(id: string, resolvedBy: string, status: 'RESOLVIDO' = 'RESOLVIDO') {

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .update({
      status,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*), resolver:profiles!resolved_by(*)')
    .single();

  return { data, error };
}

export async function updateOrderIncident(id: string, updates: Partial<OrderIncident>) {

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*), resolver:profiles!resolved_by(*)')
    .single();

  return { data, error };
}

// --- OPERAÇÕES: MÁQUINAS E HISTÓRICO DE PRODUÇÃO POR SETOR ---

export interface ProductionMachine {
  id: string;
  tenant_id: string;
  name: string;
  sector: string;
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO';
  created_at: string;
  updated_at: string;
}

export interface OrderItemSectorHistory {
  id: string;
  tenant_id: string;
  order_item_id: string;
  sector: string;
  machine_id: string | null;
  entered_at: string;
  exited_at: string | null;
  created_at: string;
  machine?: any;
}

export interface ProductionSector {
  id: string;
  tenant_id: string;
  name: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

export async function getProductionMachines(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  // Se executado no cliente, chama a rota de API do servidor para pular RLS de máquinas
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/config/machines');
      if (!response.ok) {
        throw new Error('Falha ao obter máquinas via API');
      }
      const json = await response.json();
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  const { data, error } = await getDbClient()
    .from('production_machines')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createProductionMachine(machine: Omit<ProductionMachine, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = machine.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/config/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...machine, tenant_id: tenantId })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao criar máquina');
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  const { data, error } = await getDbClient()
    .from('production_machines')
    .insert([{ ...machine, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateProductionMachine(id: string, updates: Partial<ProductionMachine>) {

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/config/machines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao atualizar máquina');
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  const { data, error } = await getDbClient()
    .from('production_machines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteProductionMachine(id: string) {

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(`/api/config/machines?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao excluir máquina');
      return { data: true, error: null };
    } catch (err: any) {
      return { data: false, error: err };
    }
  }

  const { error } = await getDbClient()
    .from('production_machines')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

export async function getProductionSectors(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  // Se executado no cliente, chama a rota de API do servidor para pular RLS de setores
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/config/sectors');
      if (!response.ok) {
        throw new Error('Falha ao obter setores via API');
      }
      const json = await response.json();
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  const { data, error } = await getDbClient()
    .from('production_sectors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createProductionSector(sector: Omit<ProductionSector, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = sector.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/config/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sector, tenant_id: tenantId })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao criar setor');
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  const { data, error } = await getDbClient()
    .from('production_sectors')
    .insert([{ ...sector, tenant_id: tenantId }])
    .select()
    .maybeSingle();
  return { data, error };
}

export async function updateProductionSector(id: string, updates: Partial<ProductionSector>) {

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/config/sectors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao atualizar setor');
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  const { data, error } = await getDbClient()
    .from('production_sectors')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  return { data, error };
}

export async function deleteProductionSector(id: string) {

  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(`/api/config/sectors?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Falha ao excluir setor');
      return { data: true, error: null };
    } catch (err: any) {
      return { data: false, error: err };
    }
  }

  const { error } = await getDbClient()
    .from('production_sectors')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

export async function getOrderItemSectorHistory(orderItemId: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('order_item_sector_history')
    .select('*, machine:production_machines(*), operator:profiles(*)')
    .eq('order_item_id', orderItemId)
    .eq('tenant_id', tenantId)
    .order('entered_at', { ascending: true });
  return { data, error };
}

export async function logSectorTransition(
  orderItemId: string,
  sector: string,
  machineId: string | null,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  operatorId?: string | null
) {

  const db = getDbClient();
  
  // 1. Fechar transição aberta anterior
  await db
    .from('order_item_sector_history')
    .update({ exited_at: new Date().toISOString() })
    .eq('order_item_id', orderItemId)
    .is('exited_at', null);

  // 2. Inserir nova transição
  const { data, error } = await db
    .from('order_item_sector_history')
    .insert([{
      tenant_id: tenantId,
      order_item_id: orderItemId,
      sector,
      machine_id: machineId,
      entered_at: new Date().toISOString(),
      operator_id: operatorId || null
    }])
    .select()
    .single();

  return { data, error };
}

// --- OPERAÇÕES: OPERADORES DE PRODUÇÃO ---

export interface ProductionOperator {
  id: string;
  tenant_id: string;
  name: string;
  pin_hash: string;
  password_hash: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

export async function getOperators(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('profiles')
    .select('id, full_name, email, status, created_at')
    .eq('tenant_id', tenantId)
    .eq('role', 'Produção')
    .order('full_name', { ascending: true });

  const mappedData = data ? data.map(p => ({
    id: p.id,
    name: p.full_name,
    email: p.email,
    status: p.status || 'ATIVO',
    created_at: p.created_at
  })) : null;

  return { data: mappedData, error };
}

export async function getActiveOperators(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('profiles')
    .select('id, full_name, status')
    .eq('tenant_id', tenantId)
    .eq('role', 'Produção')
    .eq('status', 'ATIVO')
    .order('full_name', { ascending: true });

  const mappedData = data ? data.map(p => ({
    id: p.id,
    name: p.full_name,
    status: p.status || 'ATIVO'
  })) : null;

  return { data: mappedData, error };
}

export async function createOperator(operator: any) {
  const tenantId = operator.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const { data, error } = await getDbClient()
    .from('profiles')
    .insert([{ 
      full_name: operator.name, 
      email: operator.email,
      role: 'Produção', 
      tenant_id: tenantId, 
      status: operator.status || 'ATIVO',
      pin: operator.pin
    }])
    .select()
    .single();
  return { data, error };
}

export async function updateOperator(id: string, updates: any) {
  
  const dbPayload: any = {};
  if (updates.name !== undefined) dbPayload.full_name = updates.name;
  if (updates.status !== undefined) dbPayload.status = updates.status;
  if (updates.pin !== undefined) dbPayload.pin = updates.pin;

  const { data, error } = await getDbClient()
    .from('profiles')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function updateOperatorStatus(id: string, status: 'ATIVO' | 'INATIVO') {
  return updateOperator(id, { status });
}

// --- OPERAÇÕES: EQUIPES DE MANUSEIO ---

export interface HandlingTeam {
  id: string;
  tenant_id: string;
  name: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

export async function getHandlingTeams(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data: data || [], error };
}

export async function createHandlingTeam(team: Omit<HandlingTeam, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = team.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .insert([{ ...team, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateHandlingTeam(id: string, updates: Partial<HandlingTeam>) {
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteHandlingTeam(id: string) {
  const { error } = await getDbClient()
    .from('handling_teams')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: DIVISÃO DE EQUIPES DE MANUSEIO POR ITEM
// ─────────────────────────────────────────────────────────────────

export interface OrderItemHandlingTeam {
  id: string;
  tenant_id: string;
  order_item_id: string;
  handling_team_id: string;
  quantity: number;
  departure_date?: string | null;
  return_quantity?: number | null;
  return_date?: string | null;
  handling_code?: string | null;
  is_completed?: boolean;
  completed_at?: string | null;
  services?: string[];
  parent_allocation_id?: string | null;
  status?: string;
  notes?: string | null;
  team?: HandlingTeam;
  created_at?: string;
  updated_at?: string;
}


export const HANDLING_SERVICE_OPTIONS = [
  { key: 'CA', label: 'Colagem de Alça' },
  { key: 'CC', label: 'Colocação de Cordão' },
  { key: 'DB', label: 'Dobra de Boca' },
  { key: 'RBC', label: 'Reforço de Boca e Colagem' },
  { key: 'RF', label: 'Reforço de Fundo' },
] as const;

let handlingTeamsMemoryCache: OrderItemHandlingTeam[] = [];
const HANDLING_CACHE_KEY = 'samppel_handling_teams_v2';

function loadHandlingCache(): OrderItemHandlingTeam[] {
  if (typeof window === 'undefined') return handlingTeamsMemoryCache;
  try {
    const raw = localStorage.getItem(HANDLING_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        handlingTeamsMemoryCache = parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar cache de equipes de manuseio:', e);
  }
  return handlingTeamsMemoryCache;
}

function saveHandlingCache(list: OrderItemHandlingTeam[]) {
  handlingTeamsMemoryCache = list;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HANDLING_CACHE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao salvar cache de equipes de manuseio:', e);
    }
  }
}

export async function getOrderItemHandlingTeams(orderItemId: string) {
  const currentCache = loadHandlingCache();

  try {
    const { data, error } = await getDbClient()
      .from('order_item_handling_teams')
      .select('*, team:handling_teams(*)')
      .eq('order_item_id', orderItemId);

    if (data && data.length > 0) {
      const updated = [
        ...currentCache.filter(t => t.order_item_id !== orderItemId),
        ...data
      ];
      saveHandlingCache(updated);
      return { data, error: null };
    }
  } catch (err) {
    console.warn('Falha na consulta remota de equipes de manuseio:', err);
  }

  const cachedList = currentCache.filter(t => t.order_item_id === orderItemId);
  return { data: cachedList, error: null };
}

export async function getOrderItemHandlingTeamsBulk(orderItemIds: string[]) {
  const currentCache = loadHandlingCache();

  if (!orderItemIds || orderItemIds.length === 0) {
    return { data: currentCache, error: null };
  }

  try {
    const { data, error } = await getDbClient()
      .from('order_item_handling_teams')
      .select('*, team:handling_teams(*)')
      .in('order_item_id', orderItemIds);

    if (data && data.length > 0) {
      const cacheMap = new Map(currentCache.map(c => [c.id, c]));
      data.forEach(d => cacheMap.set(d.id, d));
      const updatedList = Array.from(cacheMap.values());
      saveHandlingCache(updatedList);
      return { data, error: null };
    }
  } catch (err) {
    console.warn('Falha na consulta remota bulk de equipes de manuseio:', err);
  }

  const cachedList = currentCache.filter(t => orderItemIds.includes(t.order_item_id));
  return { data: cachedList, error: null };
}

export async function saveOrderItemHandlingTeams(
  orderItemId: string,
  teams: {
    handling_team_id: string;
    quantity: number;
    departure_date?: string | null;
    return_quantity?: number | null;
    return_date?: string | null;
    handling_code?: string | null;
    is_completed?: boolean;
    completed_at?: string | null;
    services?: string[];
  }[],
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
) {
  const currentCache = loadHandlingCache();

  // Filtra itens com equipe válida e quantidade > 0
  const validTeams = teams.filter(t => t.handling_team_id && Number(t.quantity) > 0);

  // Cria lista atualizada de alocações para o item
  const newAllocations: OrderItemHandlingTeam[] = validTeams.map((t, idx) => ({
    id: (t as any).id || `h-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    tenant_id: tenantId,
    order_item_id: orderItemId,
    handling_team_id: t.handling_team_id,
    quantity: Number(t.quantity),
    departure_date: t.departure_date || null,
    return_quantity: Number(t.return_quantity || 0),
    return_date: t.return_date || t.completed_at || null,
    handling_code: t.handling_code || null,
    is_completed: t.is_completed || false,
    completed_at: t.completed_at || t.return_date || null,
    services: (t as any).services || [],
    parent_allocation_id: (t as any).parent_allocation_id || null,
    status: (t as any).status || (t.is_completed ? 'CONCLUIDO' : 'PENDENTE'),
    notes: (t as any).notes || null
  }));

  // Atualiza cache em localStorage imediatamente
  const updatedCache = [
    ...currentCache.filter(t => t.order_item_id !== orderItemId),
    ...newAllocations
  ];
  saveHandlingCache(updatedCache);

  if (validTeams.length === 0) {
    return { data: newAllocations, error: null };
  }

  // Persiste no Supabase
  try {
    await getDbClient()
      .from('order_item_handling_teams')
      .delete()
      .eq('order_item_id', orderItemId);

    const isUuid = (val?: string | null) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const payload = newAllocations.map(t => {
      const obj: any = {
        tenant_id: tenantId,
        order_item_id: orderItemId,
        handling_team_id: t.handling_team_id,
        quantity: Number(t.quantity),
        departure_date: t.departure_date ? t.departure_date : null,
        return_quantity: t.return_quantity ? Number(t.return_quantity) : 0,
        return_date: t.return_date ? t.return_date : (t.completed_at ? t.completed_at : null),
        handling_code: t.handling_code ? t.handling_code : null,
        is_completed: t.is_completed || false,
        completed_at: t.completed_at ? t.completed_at : (t.return_date ? t.return_date : null),
        services: t.services || [],
        parent_allocation_id: isUuid(t.parent_allocation_id) ? t.parent_allocation_id : null,
        status: t.status || (t.is_completed ? 'CONCLUIDO' : 'PENDENTE'),
        notes: t.notes || null
      };
      if (isUuid(t.id)) {
        obj.id = t.id;
      }
      return obj;
    });

    const sortedPayload = [...payload].sort((a, b) => {
      if (!a.parent_allocation_id && b.parent_allocation_id) return -1;
      if (a.parent_allocation_id && !b.parent_allocation_id) return 1;
      return 0;
    });

    let { data, error } = await getDbClient()
      .from('order_item_handling_teams')
      .insert(sortedPayload)
      .select('*, team:handling_teams(*)');

    if (error || !data || data.length < validTeams.length) {
      console.warn('Inserção no Supabase com alerta/restrição. Tentando inserção individual:', error?.message);
      const individualSaved: any[] = [];
      for (const p of payload) {
        const res = await getDbClient()
          .from('order_item_handling_teams')
          .insert([p])
          .select('*, team:handling_teams(*)');
        if (res.data && res.data.length > 0) {
          individualSaved.push(...res.data);
        }
      }
      if (individualSaved.length > 0) {
        data = individualSaved;
      }
    }

    if (data && data.length > 0) {
      const finalCache = [
        ...loadHandlingCache().filter(t => t.order_item_id !== orderItemId),
        ...data
      ];
      saveHandlingCache(finalCache);
      return { data, error: null };
    }
  } catch (dbErr) {
    console.warn('Erro ao salvar no banco remoto Supabase, mantendo no cache local:', dbErr);
  }

  return { data: newAllocations, error: null };
}

// ─────────────────────────────────────────────────────────────────
// DIVERGÊNCIAS E AUDITORIA DE RETORNO DE MANUSEIO (FALTA / EXCESSO)
// ─────────────────────────────────────────────────────────────────

export interface HandlingDivergenceRecord {
  id: string;
  tenant_id: string;
  order_item_id: string;
  order_id?: string | null;
  handling_team_id?: string | null;
  handling_allocation_id?: string | null;
  handling_code?: string | null;
  type: 'FALTA' | 'EXCESSO';
  divergence_quantity: number;
  withdrawn_quantity: number;
  returned_quantity: number;
  event_date: string;
  formatted_message: string;
  reported_by_operator_id?: string | null;
  reported_by_name?: string | null;
  notes?: string | null;
  created_at?: string;
  team?: HandlingTeam;
}

const HANDLING_DIVERGENCES_CACHE_KEY = 'samppel_handling_divergences_v1';

export async function saveHandlingDivergence(
  divergence: Partial<HandlingDivergenceRecord>,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
) {
  const newRecord: HandlingDivergenceRecord = {
    id: divergence.id || `div-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenant_id: tenantId,
    order_item_id: divergence.order_item_id || '',
    order_id: divergence.order_id || null,
    handling_team_id: divergence.handling_team_id || null,
    handling_allocation_id: divergence.handling_allocation_id || null,
    handling_code: divergence.handling_code || null,
    type: divergence.type || 'FALTA',
    divergence_quantity: Number(divergence.divergence_quantity || 0),
    withdrawn_quantity: Number(divergence.withdrawn_quantity || 0),
    returned_quantity: Number(divergence.returned_quantity || 0),
    event_date: divergence.event_date || new Date().toISOString().slice(0, 10),
    formatted_message: divergence.formatted_message || '',
    reported_by_operator_id: divergence.reported_by_operator_id || null,
    reported_by_name: divergence.reported_by_name || 'Operador',
    notes: divergence.notes || null,
    created_at: new Date().toISOString()
  };

  // Salva no cache local
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(HANDLING_DIVERGENCES_CACHE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push(newRecord);
      localStorage.setItem(HANDLING_DIVERGENCES_CACHE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Erro ao salvar divergência no cache local:', e);
    }
  }

  try {
    const { data, error } = await getDbClient()
      .from('order_item_handling_divergences')
      .insert([newRecord])
      .select('*, team:handling_teams(*)')
      .single();

    if (error) {
      console.warn('Erro ao gravar divergência de manuseio no Supabase:', error.message);
      return { data: newRecord, error: null };
    }
    return { data, error: null };
  } catch (err: any) {
    console.warn('Falha na requisição de divergência:', err);
    return { data: newRecord, error: null };
  }
}

export async function getHandlingDivergencesForItem(orderItemId: string) {
  let localList: HandlingDivergenceRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(HANDLING_DIVERGENCES_CACHE_KEY);
      if (raw) localList = JSON.parse(raw);
    } catch (e) {}
  }

  try {
    const { data, error } = await getDbClient()
      .from('order_item_handling_divergences')
      .select('*, team:handling_teams(*)')
      .eq('order_item_id', orderItemId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return { data: localList.filter(d => d.order_item_id === orderItemId), error: null };
    }
    return { data, error: null };
  } catch (err) {
    return { data: localList.filter(d => d.order_item_id === orderItemId), error: null };
  }
}


// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: LOCALIZAÇÕES FÍSICAS NA FÁBRICA
// ─────────────────────────────────────────────────────────────────

export interface FactoryLocation {
  id: string;
  tenant_id: string;
  name: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

export async function getFactoryLocations(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('factory_locations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createFactoryLocation(loc: Omit<FactoryLocation, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = loc.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const { data, error } = await getDbClient()
    .from('factory_locations')
    .insert([{ ...loc, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateFactoryLocation(id: string, updates: Partial<FactoryLocation>) {
  const { data, error } = await getDbClient()
    .from('factory_locations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteFactoryLocation(id: string) {
  const { error } = await getDbClient()
    .from('factory_locations')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: TIPOS DE MATERIAL DE EMBALAGEM
// ─────────────────────────────────────────────────────────────────

export interface PackagingMaterialType {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  category: 'CAIXA' | 'FUNDO' | 'DIVISORIA' | 'SACO' | 'OUTRO';
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

export async function getPackagingMaterialTypes(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createPackagingMaterialType(item: Omit<PackagingMaterialType, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .insert([{ ...item, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updatePackagingMaterialType(id: string, updates: Partial<PackagingMaterialType>) {
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deletePackagingMaterialType(id: string) {
  const { error } = await getDbClient().from('packaging_material_types').delete().eq('id', id);
  return { data: !error, error };
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: VOLUMES DE EMBALAGEM POR ITEM DE PEDIDO
// ─────────────────────────────────────────────────────────────────

export interface OrderItemPackaging {
  id: string;
  tenant_id: string;
  order_item_id: string;
  volume_index: number;
  units_per_box: number;
  box_count: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  packaging_material_type_id: string | null;
  associated_order_item_id: string | null;
  notes: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  material_type?: PackagingMaterialType | null;
}

export async function getOrderItemPackaging(orderItemId: string) {
  const { data, error } = await getDbClient()
    .from('order_item_packaging')
    .select('*, material_type:packaging_material_types(*)')
    .eq('order_item_id', orderItemId)
    .order('volume_index', { ascending: true });
  return { data, error };
}

export async function getOrderItemPackagingBulk(orderItemIds: string[]) {
  if (!orderItemIds || orderItemIds.length === 0) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await getDbClient()
      .from('order_item_packaging')
      .select('order_item_id')
      .in('order_item_id', orderItemIds);

    return { data: data || [], error };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function saveOrderItemPackagingVolumes(
  orderItemId: string,
  tenantId: string,
  volumes: Omit<OrderItemPackaging, 'id' | 'created_at' | 'updated_at' | 'material_type'>[],
  registeredBy?: string
) {

  const db = getDbClient();
  try {
    // Delete existing and re-insert
    await db.from('order_item_packaging').delete().eq('order_item_id', orderItemId);
    const now = new Date().toISOString();
    const records = volumes.map((v, i) => ({
      ...v,
      order_item_id: orderItemId,
      tenant_id: tenantId,
      volume_index: i + 1,
      registered_by: registeredBy || null,
      updated_at: now
    }));

    if (records.length === 0) return { data: [], error: null };

    const { data, error } = await db
      .from('order_item_packaging')
      .insert(records)
      .select();
    return { data, error };
  } catch (err: any) {
    throw err;
  }
}

export async function hasPackagingData(orderItemId: string): Promise<boolean> {
  const { count, error } = await getDbClient()
    .from('order_item_packaging')
    .select('id', { count: 'exact', head: true })
    .eq('order_item_id', orderItemId);
  return (count || 0) > 0;
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: CONFIGURAÇÕES DE EMBALAGEM (CONVENÇÕES)
// ─────────────────────────────────────────────────────────────────

export interface PackagingSettings {
  id: string;
  tenant_id: string;
  keywords: string;
  association_rule: 'FIRST_ITEM' | 'LARGEST_QUANTITY' | 'MANUAL';
  created_at: string;
  updated_at: string;
}

export async function getPackagingSettings(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  const { data, error } = await getDbClient()
    .from('packaging_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  // Se nao encontrar registro, retorna um padrao inicial sem erro
  if (!data && !error) {
    const defaultSettings = {
      id: 'ps-default',
      tenant_id: tenantId,
      keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
      association_rule: 'FIRST_ITEM' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { data: defaultSettings, error: null };
  }

  return { data, error };
}

export async function savePackagingSettings(item: Omit<PackagingSettings, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  const { data, error } = await getDbClient()
    .from('packaging_settings')
    .upsert({
      tenant_id: tenantId,
      keywords: item.keywords,
      association_rule: item.association_rule,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────
// RELATÓRIOS E AUDITORIA DE TRANSIÇÕES DE SETOR / MÁQUINAS
// ─────────────────────────────────────────────────────────────────

export async function getSectorTransitionReport(
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  filters: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    productId?: string;
    machineId?: string;
  } = {}
) {
  let historyData: any[] = [];
    const { data, error } = await getDbClient()
      .from('order_item_sector_history')
      .select('*, order_item:order_items(*, order:orders(*, customer:customers(*), product:products(*)), machine:production_machines(*))')
      .eq('tenant_id', tenantId);
      historyData = data || [];

  // Aplicar filtros de pesquisa
  let filtered = historyData;

  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    filtered = filtered.filter(h => new Date(h.entered_at).getTime() >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate + 'T23:59:59').getTime();
    filtered = filtered.filter(h => new Date(h.entered_at).getTime() <= end);
  }
  if (filters.customerId) {
    filtered = filtered.filter(h => h.order_item?.order?.customer_id === filters.customerId);
  }
  if (filters.productId) {
    filtered = filtered.filter(h => h.order_item?.product_id === filters.productId || h.order_item?.order?.product_id === filters.productId);
  }
  if (filters.machineId) {
    filtered = filtered.filter(h => h.machine_id === filters.machineId);
  }

  // 1. Calcular tempo médio por etapa/setor
  const sectorDurations: Record<string, number[]> = {};
  filtered.forEach(h => {
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!sectorDurations[h.sector]) {
      sectorDurations[h.sector] = [];
    }
    sectorDurations[h.sector].push(duration);
  });

  const averageTimes = Object.keys(sectorDurations).map(sector => {
    const arr = sectorDurations[sector];
    const total = arr.reduce((sum, val) => sum + val, 0);
    const avgMs = arr.length ? total / arr.length : 0;
    const avgHours = Number((avgMs / (1000 * 60 * 60)).toFixed(2));
    return {
      sector,
      count: arr.length,
      averageHours: avgHours,
      averageDays: Number((avgHours / 24).toFixed(2))
    };
  });

  // 2. Identificar os cards que mais tempo demoraram (stays) por setor ou máquina
  const staysByItem: Record<string, { item: any; totalDuration: number; sector: string; machineName: string }> = {};
  filtered.forEach(h => {
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;
    const key = `${h.order_item_id}_${h.sector}`;

    if (!staysByItem[key]) {
      staysByItem[key] = {
        item: h.order_item || { id: h.order_item_id, name: 'Item Desconhecido' },
        totalDuration: 0,
        sector: h.sector,
        machineName: h.machine?.name || 'Manual / Sem máquina'
      };
    }
    staysByItem[key].totalDuration += duration;
  });

  const longestStays = Object.values(staysByItem)
    .map(stay => ({
      itemId: stay.item.id,
      friendlyId: stay.item.friendly_id || 'PV-???/1',
      itemName: stay.item.name,
      customerName: stay.item.order?.customer?.name || 'Cliente Genérico',
      sector: stay.sector,
      machineName: stay.machineName,
      durationHours: Number((stay.totalDuration / (1000 * 60 * 60)).toFixed(2)),
      durationDays: Number((stay.totalDuration / (1000 * 60 * 60 * 24)).toFixed(2))
    }))
    .sort((a, b) => b.durationHours - a.durationHours)
    .slice(0, 10);

  // 3. Distribuição por Período
  const periodMap: Record<string, { date: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const dateStr = new Date(h.entered_at).toLocaleDateString('pt-BR');
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!periodMap[dateStr]) {
      periodMap[dateStr] = { date: dateStr, duration: 0, count: 0 };
    }
    periodMap[dateStr].duration += duration;
    periodMap[dateStr].count += 1;
  });
  const byPeriod = Object.values(periodMap).map(p => ({
    date: p.date,
    averageHours: Number(((p.duration / p.count) / (1000 * 60 * 60)).toFixed(2)),
    count: p.count
  })).slice(0, 30);

  // 4. Distribuição por Cliente
  const customerMap: Record<string, { name: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const name = h.order_item?.order?.customer?.name || 'Cliente Genérico';
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!customerMap[name]) {
      customerMap[name] = { name, duration: 0, count: 0 };
    }
    customerMap[name].duration += duration;
    customerMap[name].count += 1;
  });
  const byCustomer = Object.values(customerMap).map(c => ({
    name: c.name,
    averageHours: Number(((c.duration / c.count) / (1000 * 60 * 60)).toFixed(2)),
    count: c.count
  })).sort((a, b) => b.averageHours - a.averageHours);

  // 5. Distribuição por Produto
  const productMap: Record<string, { name: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const name = h.order_item?.order?.product?.name || h.order_item?.name || 'Produto Genérico';
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!productMap[name]) {
      productMap[name] = { name, duration: 0, count: 0 };
    }
    productMap[name].duration += duration;
    productMap[name].count += 1;
  });
  const byProduct = Object.values(productMap).map(p => ({
    name: p.name,
    averageHours: Number(((p.duration / p.count) / (1000 * 60 * 60)).toFixed(2)),
    count: p.count
  })).sort((a, b) => b.averageHours - a.averageHours);

  // 6. Distribuição por Máquina
  const machineMap: Record<string, { name: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const name = h.machine?.name || 'Manual / Sem máquina';
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!machineMap[name]) {
      machineMap[name] = { name, duration: 0, count: 0 };
    }
    machineMap[name].duration += duration;
    machineMap[name].count += 1;
  });
  const byMachine = Object.values(machineMap).map(m => ({
    name: m.name,
    averageHours: Number(((m.duration / m.count) / (1000 * 60 * 60)).toFixed(2)),
    count: m.count
  })).sort((a, b) => b.averageHours - a.averageHours);

  return {
    data: {
      averageTimes,
      longestStays,
      byPeriod,
      byCustomer,
      byProduct,
      byMachine
    },
    error: null
  };
}

// ─────────────────────────────────────────────────────────────────
// CONFIGURAÇÕES DE TIPOS DE FRETE (SHIPPING TYPES CONFIG)
// ─────────────────────────────────────────────────────────────────

export interface ShippingTypeConfig {
  id: string;
  tenant_id: string;
  name: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

export async function getShippingTypesConfig(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  const { data, error } = await getDbClient()
    .from('shipping_types_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  return { data, error };
}

export async function createShippingTypeConfig(typeConfig: Omit<ShippingTypeConfig, 'id' | 'created_at' | 'updated_at'> & { tenant_id?: string }, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const payload = {
    ...typeConfig,
    tenant_id: typeConfig.tenant_id || tenantId
  };

  const { data, error } = await getDbClient()
    .from('shipping_types_config')
    .insert([payload])
    .select()
    .single();

  return { data, error };
}

export async function deleteShippingTypeConfig(id: string) {

  const { error } = await getDbClient()
    .from('shipping_types_config')
    .delete()
    .eq('id', id);

  return { error };
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: VOLUMES DE EXPEDIÇÃO CONSOLIDADOS (PEDIDO)
// ─────────────────────────────────────────────────────────────────

export interface OrderShippingVolume {
  id: string;
  tenant_id: string;
  order_id: string;
  volume_number: number;
  weight_kg?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  packaging_type_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getOrderShippingVolumes(orderId: string) {
  const { data, error } = await getDbClient()
    .from('order_shipping_volumes')
    .select('*, packaging_type:packaging_material_types(*)')
    .eq('order_id', orderId)
    .order('volume_number', { ascending: true });
  return { data: data || [], error };
}

export async function saveOrderShippingVolumes(
  orderId: string, 
  volumes: Omit<OrderShippingVolume, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>[], 
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
) {

  // Substituição completa dos volumes do pedido
  await getDbClient()
    .from('order_shipping_volumes')
    .delete()
    .eq('order_id', orderId);

  if (volumes.length === 0) {
    return { data: [], error: null };
  }

  const payload = volumes.map(v => ({
    tenant_id: tenantId,
    order_id: orderId,
    volume_number: v.volume_number,
    weight_kg: v.weight_kg ? Number(v.weight_kg) : null,
    width_cm: v.width_cm ? Number(v.width_cm) : null,
    height_cm: v.height_cm ? Number(v.height_cm) : null,
    length_cm: v.length_cm ? Number(v.length_cm) : null,
    packaging_type_id: v.packaging_type_id || null,
    notes: v.notes || null
  }));

  const { data, error } = await getDbClient()
    .from('order_shipping_volumes')
    .insert(payload)
    .select();

  return { data, error };
}

// Histórico de transições de etapas do Kanban
export async function getOrderItemStageHistory(orderItemId: string) {
  const { data, error } = await getDbClient()
    .from('order_item_stage_history')
    .select('*, from_stage:from_stage_id(*), to_stage:to_stage_id(*), changed_by:changed_by_profile_id(*)')
    .eq('order_item_id', orderItemId)
    .order('changed_at', { ascending: true });
  return { data, error };
}

export async function getAllStageHistory(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('order_item_stage_history')
    .select('*, from_stage:from_stage_id(*), to_stage:to_stage_id(*), changed_by:changed_by_profile_id(*)')
    .eq('tenant_id', tenantId)
    .order('changed_at', { ascending: true });
  return { data, error };
}

// Histórico de alterações de notas/observações do item
export async function logNotesTransition(
  orderItemId: string,
  notesType: 'OBSERVACOES' | 'ANOTACOES_INTERNAS',
  oldContent: string | null,
  newContent: string | null,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  operatorId?: string | null
) {

  const { data, error } = await getDbClient()
    .from('order_item_notes_history')
    .insert([{
      tenant_id: tenantId,
      order_item_id: orderItemId,
      notes_type: notesType,
      old_content: oldContent,
      new_content: newContent,
      operator_id: operatorId || null
    }])
    .select()
    .single();

  return { data, error };
}

export async function getOrderItemNotesHistory(orderItemId: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  const { data, error } = await getDbClient()
    .from('order_item_notes_history')
    .select('*, operator:profiles(*)')
    .eq('order_item_id', orderItemId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  return { data, error };
}

// --- OPERAÇÕES: REGISTRO DE FALTAS / AVARIAS E LIQUIDAÇÃO NA EXPEDIÇÃO ---

export interface OrderItemShortage {
  id: string;
  tenant_id?: string;
  order_id: string;
  order_item_id: string;
  customer_id?: string;
  shortage_quantity: number;
  reason: string; // 'MANUSEIO_AVARIA', 'PRODUCAO_DEFECT', 'EXTRAVIO', 'DEFEITO_MATERIAL'
  notes?: string;
  reported_by_operator_id?: string;
  reported_by_name?: string;
  reported_at: string;
  status: 'PENDENTE_EXPEDICAO' | 'RESOLVIDO';
  resolution_type?: 'DESCONTO_FATURA' | 'REPOSICAO' | 'ACEITE_PARCIAL';
  resolution_notes?: string;
  resolved_by_operator_id?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at?: string;
}

export async function getOrderItemShortages(orderId?: string, orderItemId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {

  try {
    let query = getDbClient()
      .from('order_item_shortages')
      .select('*')
      .eq('tenant_id', tenantId);

    if (orderId) query = query.eq('order_id', orderId);
    if (orderItemId) query = query.eq('order_item_id', orderItemId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      let localData: OrderItemShortage[] = [];
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
        if (stored) localData = JSON.parse(stored);
      } catch (e) {}
      if (orderId) localData = localData.filter(s => s.order_id === orderId);
      if (orderItemId) localData = localData.filter(s => s.order_item_id === orderItemId);
      return { data: localData, error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    let localData: OrderItemShortage[] = [];
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
      if (stored) localData = JSON.parse(stored);
    } catch (e) {}
    if (orderId) localData = localData.filter(s => s.order_id === orderId);
    if (orderItemId) localData = localData.filter(s => s.order_item_id === orderItemId);
    return { data: localData, error: null };
  }
}

export async function getOrderItemShortagesBulk(orderItemIds: string[], tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (!orderItemIds || orderItemIds.length === 0) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await getDbClient()
      .from('order_item_shortages')
      .select('*')
      .in('order_item_id', orderItemIds)
      .eq('tenant_id', tenantId);

    if (!error && data) {
      return { data, error: null };
    }
  } catch (err) {}

  let localData: OrderItemShortage[] = [];
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
    if (stored) localData = JSON.parse(stored);
  } catch (e) {}
  return { data: localData.filter(s => orderItemIds.includes(s.order_item_id)), error: null };
}

export async function saveOrderItemShortage(shortage: Partial<OrderItemShortage>, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const newShortage: OrderItemShortage = {
    id: shortage.id || `shortage-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenant_id: tenantId,
    order_id: shortage.order_id || '',
    order_item_id: shortage.order_item_id || '',
    customer_id: shortage.customer_id || '',
    shortage_quantity: Number(shortage.shortage_quantity || 0),
    reason: shortage.reason || 'MANUSEIO_AVARIA',
    notes: shortage.notes || '',
    reported_by_operator_id: shortage.reported_by_operator_id || '',
    reported_by_name: shortage.reported_by_name || 'Operador',
    reported_at: shortage.reported_at || new Date().toISOString(),
    status: shortage.status || 'PENDENTE_EXPEDICAO',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await getDbClient()
      .from('order_item_shortages')
      .insert([newShortage])
      .select()
      .single();

    if (error) {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
        const list = stored ? JSON.parse(stored) : [];
        list.push(newShortage);
        if (typeof window !== 'undefined') localStorage.setItem('samppel_shortages', JSON.stringify(list));
      } catch (e) {}
      return { data: newShortage, error: null };
    }

    return { data, error: null };
  } catch (err) {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
      const list = stored ? JSON.parse(stored) : [];
      list.push(newShortage);
      if (typeof window !== 'undefined') localStorage.setItem('samppel_shortages', JSON.stringify(list));
    } catch (e) {}
    return { data: newShortage, error: null };
  }
}

export async function resolveOrderItemShortage(
  shortageId: string,
  resolution: {
    resolution_type: 'DESCONTO_FATURA' | 'REPOSICAO' | 'ACEITE_PARCIAL';
    resolution_notes?: string;
    resolved_by_operator_id?: string;
    resolved_by_name?: string;
  }
) {
  const patch = {
    status: 'RESOLVIDO' as const,
    resolution_type: resolution.resolution_type,
    resolution_notes: resolution.resolution_notes || '',
    resolved_by_operator_id: resolution.resolved_by_operator_id || '',
    resolved_by_name: resolution.resolved_by_name || 'Expedição',
    resolved_at: new Date().toISOString()
  };

  try {
    const { data, error } = await getDbClient()
      .from('order_item_shortages')
      .update(patch)
      .eq('id', shortageId)
      .select()
      .single();

    if (error) {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
        let list: OrderItemShortage[] = stored ? JSON.parse(stored) : [];
        list = list.map(s => s.id === shortageId ? { ...s, ...patch } : s);
        if (typeof window !== 'undefined') localStorage.setItem('samppel_shortages', JSON.stringify(list));
      } catch (e) {}
      return { data: { id: shortageId, ...patch }, error: null };
    }

    return { data, error: null };
  } catch (err) {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('samppel_shortages') : null;
      let list: OrderItemShortage[] = stored ? JSON.parse(stored) : [];
      list = list.map(s => s.id === shortageId ? { ...s, ...patch } : s);
      if (typeof window !== 'undefined') localStorage.setItem('samppel_shortages', JSON.stringify(list));
    } catch (e) {}
    return { data: { id: shortageId, ...patch }, error: null };
  }
}

