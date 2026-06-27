/**
 * Cria as etapas padrão do Kanban de produção (order_stages).
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

// Etapas padrão do Kanban de produção (mesmas usadas no código)
const defaultStages = [
  { name: 'A produzir',   color: '#94a3b8', position: 1 },
  { name: 'Em produção',  color: '#3b82f6', position: 2 },
  { name: 'Manuseio',     color: '#a855f7', position: 3 },
  { name: 'Em revisão',   color: '#eab308', position: 4 },
  { name: 'Expedição',    color: '#f97316', position: 5 },
  { name: 'Entregue',     color: '#10b981', position: 6 },
  { name: 'Estoque',      color: '#14b8a6', position: 7 },
];

async function createStages() {
  console.log('=== CRIANDO ETAPAS DO KANBAN ===\n');

  // Verificar estrutura da tabela order_stages
  const { data: existing, error: fetchErr } = await db
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId);
  
  if (fetchErr) {
    console.error('❌ Erro ao acessar order_stages:', fetchErr.message);
    return;
  }

  if (existing && existing.length > 0) {
    console.log(`⚠ Já existem ${existing.length} etapas. Listando:`);
    existing.forEach(s => console.log(`  - "${s.name}" (pos: ${s.position})`));
    return;
  }

  console.log('→ Nenhuma etapa encontrada. Criando etapas padrão...\n');

  for (const stage of defaultStages) {
    const { data, error } = await db
      .from('order_stages')
      .insert([{
        tenant_id: tenantId,
        name: stage.name,
        color: stage.color,
        position: stage.position,
        description: `Etapa: ${stage.name}`
      }])
      .select('id, name')
      .single();

    if (error) {
      console.log(`❌ Erro ao criar "${stage.name}": ${error.message}`);
      // Tentar sem o campo description caso não exista
      if (error.message.includes('description')) {
        const { data: d2, error: e2 } = await db
          .from('order_stages')
          .insert([{ tenant_id: tenantId, name: stage.name, color: stage.color, position: stage.position }])
          .select('id, name')
          .single();
        if (e2) {
          console.log(`  → Também falhou sem description: ${e2.message}`);
        } else {
          console.log(`  ✓ "${stage.name}" criado (sem description) - ID: ${d2.id}`);
        }
      }
    } else {
      console.log(`✓ "${stage.name}" criado - ID: ${data.id}`);
    }
  }

  // Verificar resultado final
  const { data: final } = await db.from('order_stages').select('*').eq('tenant_id', tenantId).order('position');
  console.log(`\n✅ Total de etapas criadas: ${final?.length || 0}`);

  // Agora ligar os order_items à etapa "A produzir"
  if (final && final.length > 0) {
    const aProduizirStage = final.find(s => s.name === 'A produzir');
    if (aProduizirStage) {
      console.log(`\n→ Vinculando order_items sem stage_id à etapa "A produzir" (${aProduizirStage.id})...`);
      const { error: updateErr } = await db
        .from('order_items')
        .update({ stage_id: aProduizirStage.id })
        .eq('tenant_id', tenantId)
        .is('stage_id', null);
      
      if (updateErr) {
        console.log('  ❌ Erro ao atualizar stage_id:', updateErr.message);
      } else {
        console.log('  ✓ Itens vinculados à etapa "A produzir"!');
      }
    }
  }

  console.log('\n🎉 Kanban pronto! Atualize a página /pedidos para ver os cards.');
}

createStages().catch(console.error);
