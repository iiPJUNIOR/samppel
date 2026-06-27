/**
 * Diagnóstico completo do Kanban: verifica orders, order_items, order_stages e RLS
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

const db = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('=== DIAGNÓSTICO DO KANBAN ===\n');

  // 1. Pedidos
  const { data: orders } = await db.from('orders').select('id, pv_number, status, art_name, conta_azul_id').eq('tenant_id', tenantId);
  console.log(`1. ORDERS (${orders?.length || 0} registros):`);
  (orders || []).forEach(o => console.log(`   - ${o.pv_number} | status="${o.status}" | art="${o.art_name}" | ca_id=${o.conta_azul_id ? '✓' : '❌'}`));

  // 2. Order Items
  const { data: items, error: itemsErr } = await db
    .from('order_items')
    .select('id, order_id, name, status, item_index, friendly_id, stage_id, production_sector')
    .eq('tenant_id', tenantId);
  
  console.log(`\n2. ORDER_ITEMS (${items?.length || 0} registros):`);
  if (itemsErr) console.log('   ERRO:', itemsErr.message);
  (items || []).forEach(i => console.log(`   - [${i.friendly_id || i.id.substring(0,8)}] "${i.name}" | status="${i.status}" | sector="${i.production_sector}" | stage_id=${i.stage_id || 'null'}`));

  // 3. Order Stages
  const { data: stages } = await db.from('order_stages').select('id, name, position').eq('tenant_id', tenantId).order('position');
  console.log(`\n3. ORDER_STAGES (${stages?.length || 0} registros):`);
  (stages || []).forEach(s => console.log(`   - [pos ${s.position}] "${s.name}" (${s.id})`));

  // 4. Como o Kanban agrupa os itens
  console.log('\n4. MAPEAMENTO: Itens por status (como o Kanban os exibiria):');
  const byStatus = {};
  (items || []).forEach(i => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  });
  if (Object.keys(byStatus).length === 0) {
    console.log('   ⚠ Nenhum item para mapear.');
  } else {
    Object.entries(byStatus).forEach(([s, n]) => console.log(`   - "${s}": ${n} itens`));
  }

  // 5. Verificar se o JOIN funciona (como o getOrderItems faz)
  console.log('\n5. TESTE DO JOIN (como getOrderItems consulta):');
  const { data: joinData, error: joinErr } = await db
    .from('order_items')
    .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
    .eq('tenant_id', tenantId)
    .limit(2);
  
  if (joinErr) {
    console.log('   ❌ JOIN falhou:', joinErr.message);
  } else {
    console.log(`   ✓ JOIN OK - ${joinData?.length || 0} itens retornados`);
    if (joinData && joinData[0]) {
      const first = joinData[0];
      console.log(`   → Primeiro item: "${first.name}" | order=${first.order?.pv_number} | customer=${first.order?.customer?.name}`);
    }
  }

  // 6. Verificar outros problemas: order_stages tem estágio "A produzir"?
  const aProduizirStage = (stages || []).find(s => s.name === 'A produzir');
  console.log('\n6. ESTÁGIO "A produzir" existe?', aProduizirStage ? `✓ Sim (id: ${aProduizirStage.id})` : '❌ NÃO ENCONTRADO');
  
  // 7. Checar se os itens deveriam ter stage_id ou é baseado só em status
  console.log('\n7. CONCLUSÃO:');
  const totalOrders = orders?.length || 0;
  const totalItems = items?.length || 0;
  
  if (totalItems === 0) {
    console.log('   ❌ PROBLEMA: Nenhum order_item existe. Precisa criar itens para os pedidos.');
  } else if (totalItems > 0 && !(stages || []).length) {
    console.log('   ❌ PROBLEMA: Itens existem mas não há order_stages configuradas.');
  } else if (totalItems > 0 && (stages || []).length > 0) {
    const itemsWithStage = (items || []).filter(i => i.stage_id);
    console.log(`   ✓ ${totalItems} itens e ${stages?.length} etapas encontradas.`);
    console.log(`   → ${itemsWithStage.length} itens com stage_id definido, ${totalItems - itemsWithStage.length} sem stage_id.`);
    if (itemsWithStage.length === 0) {
      console.log('   ⚠ ATENÇÃO: Nenhum item tem stage_id. O Kanban agrupa por status, não por stage_id.');
    }
  }
}

diagnose().catch(console.error);
