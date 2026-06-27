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

async function testJoins() {
  console.log('=== TESTANDO O JOIN EXATO DO getOrderItems ===\n');
  
  // Teste 1: Query completa com todos os JOINs (como o código faz)
  console.log('1. Query completa com todos os JOINs:');
  const { data: full, error: fullErr } = await db
    .from('order_items')
    .select('*, product:products(*), stage:order_stages(*), machine:production_machines(*), handling_team:handling_teams(*), order:orders(*, customer:customers(*))')
    .eq('tenant_id', tenantId);
  
  if (fullErr) {
    console.log(`   ❌ ERRO: ${fullErr.message}`);
    console.log(`   Code: ${fullErr.code}`);
  } else {
    console.log(`   ✓ Retornou ${full?.length || 0} itens`);
    if (full && full[0]) {
      console.log('   Primeiro item:');
      const i = full[0];
      console.log(`     - name: "${i.name}"`);
      console.log(`     - stage_id: ${i.stage_id}`);
      console.log(`     - stage: ${JSON.stringify(i.stage)}`);
      console.log(`     - order: ${i.order ? `pv_number=${i.order.pv_number}` : 'null'}`);
      console.log(`     - machine: ${JSON.stringify(i.machine)}`);
      console.log(`     - handling_team: ${JSON.stringify(i.handling_team)}`);
    }
  }

  // Teste 2: Sem production_machines e handling_teams
  console.log('\n2. Query sem production_machines e handling_teams:');
  const { data: partial, error: partialErr } = await db
    .from('order_items')
    .select('*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))')
    .eq('tenant_id', tenantId);
  
  if (partialErr) {
    console.log(`   ❌ ERRO: ${partialErr.message}`);
  } else {
    console.log(`   ✓ Retornou ${partial?.length || 0} itens`);
  }

  // Teste 3: Verificar se production_machines existe
  console.log('\n3. Testando tabela production_machines:');
  const { data: machines, error: machErr } = await db
    .from('production_machines')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1);
  if (machErr) console.log(`   ❌ ${machErr.message}`);
  else console.log(`   ✓ production_machines OK (${machines?.length} registros)`);

  // Teste 4: Verificar se handling_teams existe
  console.log('\n4. Testando tabela handling_teams:');
  const { data: teams, error: teamsErr } = await db
    .from('handling_teams')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1);
  if (teamsErr) console.log(`   ❌ ${teamsErr.message}`);
  else console.log(`   ✓ handling_teams OK (${teams?.length} registros)`);
}

testJoins().catch(console.error);
