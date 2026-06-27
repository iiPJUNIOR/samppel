/**
 * Corrige as etapas do Kanban: adiciona posições e reordena para
 * que "Pedidos" (ou "A produzir") seja a primeira coluna.
 * Também vincula os itens sem stage_id à primeira etapa.
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

// Ordem desejada das etapas (mapeia nome existente → posição)
const stageOrder = {
  'Pedidos':      1,
  'A produzir':   1, // nome alternativo para a primeira etapa
  'Em produção':  2,
  'Embalagem':    3,
  'Manuseio':     4,
  'Em revisão':   5,
  'Expedição':    6,
  'Estoque':      7,
  'Concluído':    8,
  'Entregue':     9,
  'Atrasado':    10,
};

async function fixStages() {
  console.log('=== CORRIGINDO ETAPAS DO KANBAN ===\n');

  // Buscar etapas existentes
  const { data: stages, error } = await db
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('❌ Erro ao buscar etapas:', error.message);
    return;
  }

  console.log(`Etapas atuais (${stages.length}):`);
  stages.forEach(s => console.log(`  - "${s.name}" | position=${s.position} | id=${s.id}`));

  // Definir posições
  for (const stage of stages) {
    const desiredPos = stageOrder[stage.name];
    if (desiredPos !== undefined) {
      const { error: updateErr } = await db
        .from('order_stages')
        .update({ position: desiredPos })
        .eq('id', stage.id);
      
      if (updateErr) {
        console.log(`❌ Erro ao atualizar posição de "${stage.name}": ${updateErr.message}`);
      } else {
        console.log(`✓ "${stage.name}" → position=${desiredPos}`);
      }
    } else {
      // Etapa desconhecida: coloca no final
      const { error: updateErr } = await db
        .from('order_stages')
        .update({ position: 99 })
        .eq('id', stage.id);
      console.log(`⚠ "${stage.name}" → position=99 (desconhecida)`);
    }
  }

  // Re-buscar para pegar a ordem correta
  const { data: sortedStages } = await db
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true });

  const firstStage = sortedStages?.[0];
  console.log(`\nPrimeira etapa após reordenação: "${firstStage?.name}" (id: ${firstStage?.id})`);

  if (!firstStage) {
    console.log('❌ Nenhuma etapa encontrada após reordenação.');
    return;
  }

  // Contar itens sem stage_id
  const { data: itemsWithoutStage } = await db
    .from('order_items')
    .select('id')
    .eq('tenant_id', tenantId)
    .is('stage_id', null);

  console.log(`\nItens sem stage_id: ${itemsWithoutStage?.length || 0}`);

  if (itemsWithoutStage && itemsWithoutStage.length > 0) {
    // Vincular à primeira etapa para aparecer explicitamente
    const { error: linkErr } = await db
      .from('order_items')
      .update({ stage_id: firstStage.id })
      .eq('tenant_id', tenantId)
      .is('stage_id', null);

    if (linkErr) {
      console.log('❌ Erro ao vincular itens:', linkErr.message);
    } else {
      console.log(`✓ ${itemsWithoutStage.length} itens vinculados à etapa "${firstStage.name}"`);
    }
  }

  // Verificar resultado final
  const { data: finalItems } = await db
    .from('order_items')
    .select('id, name, friendly_id, stage_id')
    .eq('tenant_id', tenantId);

  const { data: finalStages } = await db
    .from('order_stages')
    .select('id, name, position')
    .eq('tenant_id', tenantId)
    .order('position');

  console.log('\n=== ESTADO FINAL ===');
  console.log(`Etapas (${finalStages?.length}):`);
  finalStages?.forEach(s => console.log(`  [${s.position}] "${s.name}" (${s.id})`));
  
  console.log(`\nItens (${finalItems?.length}):`);
  finalItems?.forEach(i => {
    const stageName = finalStages?.find(s => s.id === i.stage_id)?.name || 'SEM ETAPA';
    console.log(`  - ${i.friendly_id || i.id.substring(0,8)}: "${i.name}" → ${stageName}`);
  });

  console.log('\n🎉 Correção concluída! Atualize /pedidos para ver o Kanban.');
}

fixStages().catch(console.error);
