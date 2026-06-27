/**
 * Script de migração: cria a tabela order_items e popula com os pedidos importados.
 * 
 * Executa direto pela Management API do Supabase (não precisa de conexão direta ao Postgres).
 * 
 * Uso: node scratch/run_migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  });
  console.log('✓ Variáveis do .env.local carregadas.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.');
  process.exit(1);
}

// Extrair o project ref da URL (ex: cywbfcrtuawsgtbsjnnb)
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
console.log(`✓ Project Ref: ${projectRef}`);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// SQL de migração para criar a tabela order_items com RLS e Triggers
const migrationSQL = `
-- 1. TABELA DE ITENS DE PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    item_type VARCHAR(50) NOT NULL DEFAULT 'PRODUTO' CHECK (item_type IN ('PRODUTO', 'SERVICO')),
    name VARCHAR(255) NOT NULL,
    item_index INTEGER NOT NULL DEFAULT 1,
    friendly_id VARCHAR(150),
    
    measure VARCHAR(100),
    print_run INTEGER NOT NULL DEFAULT 0,
    boxes_count INTEGER NOT NULL DEFAULT 0,
    packaging_type VARCHAR(50) NOT NULL DEFAULT 'CAIXA' CHECK (packaging_type IN ('CAIXA', 'PACOTE')),
    over_short_quantity INTEGER NOT NULL DEFAULT 0,
    
    status VARCHAR(50) NOT NULL DEFAULT 'A produzir' CHECK (
        status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado', 'Estoque')
    ),
    production_sector VARCHAR(100) NOT NULL DEFAULT 'Impressão' CHECK (
        production_sector IN ('Impressão', 'Corte e Vinco', 'Colagem', 'Manuseio', 'Expedição', 'Concluído', 'Estoque')
    ),
    stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL,
    physical_location VARCHAR(100),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_stage ON order_items(stage_id);

-- 3. RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS
DROP POLICY IF EXISTS "Leitura de Itens por Tenant" ON order_items;
CREATE POLICY "Leitura de Itens por Tenant" ON order_items
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insercao de Itens por Tenant" ON order_items;
CREATE POLICY "Insercao de Itens por Tenant" ON order_items
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Itens por Tenant" ON order_items;
CREATE POLICY "Modificacao de Itens por Tenant" ON order_items
    FOR UPDATE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Remocao de Itens por Tenant" ON order_items;
CREATE POLICY "Remocao de Itens por Tenant" ON order_items
    FOR DELETE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. TRIGGER MODTIME
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_items_modtime ON order_items;
CREATE TRIGGER update_order_items_modtime
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 6. POLÍTICA PARA SERVICE_ROLE (bypass RLS para sincronização do servidor)
DROP POLICY IF EXISTS "Service Role Full Access order_items" ON order_items;
CREATE POLICY "Service Role Full Access order_items" ON order_items
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
`;

async function runMigration() {
  console.log('\n=== INICIANDO MIGRAÇÃO DA TABELA order_items ===\n');

  // Tentar criar a tabela via Management API do Supabase
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  console.log('1. Executando SQL de criação via Management API...');
  
  try {
    const res = await fetch(mgmtUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!res.ok) {
      const text = await res.text();
      console.log(`   ⚠ Management API retornou ${res.status}: ${text.substring(0, 200)}`);
      console.log('   → Tentando via RPC do supabase-js...');
      
      // Fallback: tentar via RPC personalizado
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL });
      if (error) {
        console.log('   ⚠ RPC também falhou. Será necessário rodar o SQL manualmente no Supabase Studio.');
        console.log('   → Arquivo: supabase/supabase_order_items_migration.sql');
      } else {
        console.log('   ✓ SQL executado via RPC com sucesso!');
      }
    } else {
      console.log('   ✓ Tabela criada via Management API com sucesso!');
    }
  } catch (e) {
    console.log(`   ⚠ Erro na Management API: ${e.message}`);
  }

  // Verificar se a tabela foi criada
  console.log('\n2. Verificando se a tabela order_items existe agora...');
  
  // Aguardar um momento para o schema cache recarregar
  await new Promise(r => setTimeout(r, 2000));
  
  const { data: testData, error: testError } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .limit(1);

  if (testError) {
    console.log(`   ❌ Tabela ainda não acessível: ${testError.message}`);
    console.log('\n📋 INSTRUÇÃO MANUAL:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('   2. Cole o conteúdo do arquivo: supabase/supabase_order_items_migration.sql');
    console.log('   3. Execute o SQL');
    console.log('   4. Rode novamente este script para popular os dados\n');
    return false;
  }

  console.log('   ✓ Tabela order_items acessível!');
  return true;
}

async function populateOrderItems() {
  console.log('\n3. Buscando pedidos existentes para criar os itens do Kanban...');

  // Buscar pedidos existentes
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('*, customer:customers(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (ordersError || !orders || orders.length === 0) {
    console.log('   ⚠ Nenhum pedido encontrado para popular os itens.');
    return;
  }

  console.log(`   ✓ ${orders.length} pedidos encontrados.`);

  // Verificar quais já têm order_items
  const { data: existingItems } = await supabaseAdmin
    .from('order_items')
    .select('order_id')
    .eq('tenant_id', tenantId);

  const ordersWithItems = new Set((existingItems || []).map(i => i.order_id));

  let created = 0;
  let skipped = 0;

  for (const order of orders) {
    if (ordersWithItems.has(order.id)) {
      skipped++;
      continue;
    }

    // Criar 1 item de pedido por pedido importado
    const itemPayload = {
      tenant_id: tenantId,
      order_id: order.id,
      product_id: order.product_id || null,
      item_type: 'PRODUTO',
      name: order.art_name || `Item do Pedido ${order.pv_number || order.order_number}`,
      item_index: 1,
      friendly_id: `${order.pv_number || ('PV-' + order.order_number)}/1`,
      measure: order.measure || '15x10x5 cm',
      print_run: order.print_run || 1000,
      boxes_count: order.boxes_count || 1,
      packaging_type: order.packaging_type || 'CAIXA',
      over_short_quantity: 0,
      status: order.status || 'A produzir',
      production_sector: order.production_sector || 'Impressão',
      stage_id: null,
      notes: order.notes || ''
    };

    const { error: insertError } = await supabaseAdmin
      .from('order_items')
      .insert([itemPayload]);

    if (insertError) {
      console.log(`   ❌ Erro ao criar item para ${order.pv_number}: ${insertError.message}`);
    } else {
      created++;
      console.log(`   ✓ Item criado para: ${order.pv_number || order.art_name} (${order.customer?.name || 'Cliente'})`);
    }
  }

  console.log(`\n✅ CONCLUÍDO: ${created} itens criados, ${skipped} pedidos já tinham itens.`);
}

async function main() {
  const tableReady = await runMigration();
  
  if (tableReady) {
    await populateOrderItems();
    console.log('\n🎉 Migração e população concluídas! Atualize a página do Kanban.');
  }
}

main().catch(console.error);
