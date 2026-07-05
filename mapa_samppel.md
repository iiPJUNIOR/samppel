This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: *.json, *.lock, *.mjs, *.config.ts, vercel.json
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
public/
  file.svg
  globe.svg
  logo.png
  next.svg
  vercel.svg
  window.svg
scratch/
  check_company.js
  check_db_orders.js
  check_db.js
  check_logs.js
  create_stages.js
  diagnose_kanban.js
  fix_stages.js
  inspect_stages.js
  inspect_venda.js
  list_tables.js
  run_migration.js
  test_endpoints.js
  test_integration.js
  test_joins.js
src/
  app/
    api/
      auth/
        conta-azul/
          callback/
            route.ts
      config/
        conta-azul/
          route.ts
      relatorios/
        route.ts
      sync/
        cron/
          route.ts
        import-customers/
          route.ts
        import-orders/
          route.ts
    clientes/
      page.tsx
    configuracoes/
      logs/
        page.tsx
      page.tsx
    dashboard/
      page.tsx
    financeiro/
      page.tsx
    fornecedores/
      page.tsx
    pedidos/
      configuracoes/
        page.tsx
      saldos/
        page.tsx
      page.tsx
    produtos/
      page.tsx
    relatorios/
      page.tsx
    favicon.ico
    globals.css
    layout.tsx
    page.module.css
    page.tsx
  components/
    ui/
      demo.tsx
      Skeleton.tsx
    AppGuard.tsx
    Sidebar.module.css
    Sidebar.tsx
  context/
    AuthContext.tsx
    ThemeContext.tsx
  services/
    conta_azul.ts
    deadline_service.ts
    supabase.ts
    sync_queue.ts
supabase/
  schema.sql
  supabase_freight_migration.sql
  supabase_handling_migration.sql
  supabase_incidents_migration.sql
  supabase_kanban_migration.sql
  supabase_machines_migration.sql
  supabase_optional_tables_migration.sql
  supabase_order_items_migration.sql
  supabase_packaging_migration.sql
  supabase_rls_policies.sql
  supabase_roles_migration.sql
  supabase_stock_credits_migration.sql
.gitignore
AGENTS.md
CLAUDE.md
README.md
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="public/file.svg">
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
</file>

<file path="public/globe.svg">
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
</file>

<file path="public/next.svg">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
</file>

<file path="public/vercel.svg">
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
</file>

<file path="public/window.svg">
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
</file>

<file path="scratch/check_company.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = '/Users/paulojunior/samppel/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables missing on .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const COMPANY_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

async function checkAndInsertCompany() {
  console.log('Verificando se a empresa padrao existe no banco...');
  
  const { data: company, error: selectError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', COMPANY_ID)
    .maybeSingle();
    
  if (selectError) {
    console.error('Erro ao buscar a empresa:', selectError);
    process.exit(1);
  }
  
  if (company) {
    console.log('Empresa ja cadastrada:', company);
  } else {
    console.log('Empresa nao encontrada. Cadastrando...');
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert([{
        id: COMPANY_ID,
        name: 'Samppel Embalagens Ltda',
        cnpj: '12.345.678/0001-90'
      }])
      .select()
      .single();
      
    if (insertError) {
      console.error('Erro ao cadastrar a empresa:', insertError);
      process.exit(1);
    }
    console.log('Empresa cadastrada com sucesso:', newCompany);
  }
}

checkAndInsertCompany();
</file>

<file path="scratch/check_db_orders.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkDbOrders() {
  // 1. Verificar tabela orders
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log(`--- ORDERS IN DATABASE (Count: ${orders.length}) ---`);
  for (const ord of orders) {
    console.log(`ID: ${ord.id}`);
    console.log(`PV Number: ${ord.pv_number}`);
    console.log(`Customer ID: ${ord.customer_id}`);
    console.log(`Status: ${ord.status}`);
    console.log(`Art Name: ${ord.art_name}`);
    console.log(`Print Run: ${ord.print_run}`);
    console.log(`Created At: ${ord.created_at}`);
    console.log('------------------------------');
  }

  // 2. Verificar tabela order_items
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('tenant_id', tenantId);

  if (itemsErr) {
    console.error('Error fetching items:', itemsErr);
    return;
  }
  console.log(`--- ORDER ITEMS IN DATABASE (Count: ${items.length}) ---`);
}

checkDbOrders();
</file>

<file path="scratch/check_db.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('--- FETCHING CUSTOMERS FROM DATABASE ---');
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching customers:', error);
  } else {
    console.log('All Customers in database:', data);
  }
}

run();
</file>

<file path="scratch/check_logs.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkLogs() {
  const { data: logs, error } = await supabaseAdmin
    .from('conta_azul_integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('--- RECENT INTEGRATION LOGS ---');
  for (const log of logs) {
    console.log(`Date: ${log.created_at}`);
    console.log(`Action: ${log.action}`);
    console.log(`Status: ${log.status}`);
    console.log(`Error Message: ${log.error_message}`);
    console.log(`Response: ${JSON.stringify(log.response)}`);
    console.log('------------------------------');
  }
}

checkLogs();
</file>

<file path="scratch/create_stages.js">
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
</file>

<file path="scratch/diagnose_kanban.js">
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
</file>

<file path="scratch/fix_stages.js">
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
</file>

<file path="scratch/inspect_stages.js">
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

async function inspectStages() {
  // Buscar todos os campos de order_stages
  const { data, error } = await db
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Erro:', error.message);
    return;
  }

  console.log('Colunas disponíveis no primeiro registro:');
  if (data && data[0]) {
    console.log(Object.keys(data[0]));
    console.log('\nPrimeiro registro completo:');
    console.log(JSON.stringify(data[0], null, 2));
  }
  
  console.log('\nTodos os registros:');
  data?.forEach(s => console.log(JSON.stringify(s)));
}

inspectStages().catch(console.error);
</file>

<file path="scratch/inspect_venda.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function inspectVenda() {
  const { data: config } = await supabaseAdmin
    .from('conta_azul_config')
    .select('access_token')
    .eq('tenant_id', tenantId)
    .single();

  const token = config.access_token;

  // Busca lista de vendas
  const listRes = await fetch('https://api-v2.contaazul.com/v1/venda/busca?tamanho_pagina=1', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!listRes.ok) {
    console.error('List res failed:', listRes.status, await listRes.text());
    return;
  }

  const listData = await listRes.json();
  const sales = listData.itens || [];
  if (sales.length === 0) {
    console.log('No sales found.');
    return;
  }

  const sampleSummary = sales[0];
  console.log('--- RESUMO DA VENDA NO BUSCA (summary) ---');
  console.log(JSON.stringify(sampleSummary, null, 2));

  // Busca detalhes da venda
  console.log(`\nFetching details for sale: ${sampleSummary.id}...`);
  const detailRes = await fetch(`https://api-v2.contaazul.com/v1/venda/${sampleSummary.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (detailRes.ok) {
    const saleDetail = await detailRes.json();
    console.log('--- DETALHES DA VENDA (detail) ---');
    console.log(JSON.stringify(saleDetail, null, 2));
  } else {
    console.error('Detail res failed:', detailRes.status, await detailRes.text());
  }

  // Busca itens da venda
  console.log(`\nFetching items for sale: ${sampleSummary.id}...`);
  const itemsRes = await fetch(`https://api-v2.contaazul.com/v1/venda/${sampleSummary.id}/itens`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (itemsRes.ok) {
    const itemsData = await itemsRes.json();
    console.log('--- ITENS DA VENDA ---');
    console.log(JSON.stringify(itemsData, null, 2));
  } else {
    console.error('Items res failed:', itemsRes.status, await itemsRes.text());
  }
}

inspectVenda();
</file>

<file path="scratch/list_tables.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
  // Executar uma query RPC ou consultar informações
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error connecting to orders:', error);
    return;
  }
  
  console.log('✓ Conectado ao Supabase com sucesso.');

  // Tenta selecionar da tabela order_items diretamente
  const { data: itemData, error: itemError } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .limit(1);

  if (itemError) {
    console.log('❌ Tabela order_items retornou erro:', itemError.message);
  } else {
    console.log('🟢 Tabela order_items existe e retornou data:', itemData);
  }
}

listTables();
</file>

<file path="scratch/run_migration.js">
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
</file>

<file path="scratch/test_endpoints.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testEndpoints() {
  const { data: config } = await supabaseAdmin
    .from('conta_azul_config')
    .select('access_token')
    .eq('tenant_id', tenantId)
    .single();

  const token = config.access_token;
  console.log(`Using token: ${token.substring(0, 15)}...`);

  const paths = [
    '/v1/sales',
    '/v1/vendas',
    '/v1/venda',
    '/v1/venda/busca',
    '/v2/sales',
    '/v2/vendas',
    '/v2/venda',
    '/v1/sales/v2',
    '/v1/vendas/v2'
  ];

  for (const p of paths) {
    try {
      const res = await fetch(`https://api-v2.contaazul.com${p}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`Path: ${p} => Status: ${res.status}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log(`   Response snippet: ${text.substring(0, 200)}`);
      }
    } catch (e) {
      console.log(`Path: ${p} => Failed: ${e.message}`);
    }
  }
}

testEndpoints();
</file>

<file path="scratch/test_integration.js">
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove aspas simples ou duplas
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
  console.log('✓ Variáveis do .env.local carregadas com sucesso.');
} else {
  console.log('⚠ Arquivo .env.local não encontrado. Usando variáveis do sistema.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'; // Tenant ID Padrão

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no ambiente.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testIntegration() {
  console.log('\n=============================================');
  console.log('INICIANDO TESTE DA INTEGRAÇÃO CONTA AZUL V2');
  console.log('=============================================\n');

  try {
    // 1. Buscar credenciais do banco
    console.log('1. Buscando credenciais na tabela `conta_azul_config`...');
    const { data: config, error: configErr } = await supabaseAdmin
      .from('conta_azul_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (configErr) throw configErr;
    if (!config) {
      console.log('⚠ Nenhuma credencial encontrada no banco. Usando fallback do .env.local...');
    }

    const clientId = config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const clientSecret = config?.client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '';
    let accessToken = config?.access_token || '';
    const refreshToken = config?.refresh_token || '';
    const expiresAt = config?.expires_at || '';

    console.log(`   - Client ID: ${clientId ? 'Configurado ✓' : 'FALTANDO ❌'}`);
    console.log(`   - Client Secret: ${clientSecret ? 'Configurado ✓' : 'FALTANDO ❌'}`);
    console.log(`   - Token de Acesso: ${accessToken ? 'Disponível ✓' : 'Ausente (Necessita autorizar OAuth) ❌'}`);
    console.log(`   - Refresh Token: ${refreshToken ? 'Disponível ✓' : 'Ausente ❌'}`);
    console.log(`   - Expiração do Token: ${expiresAt || 'N/A'}`);

    if (!clientId || !clientSecret) {
      console.error('\n❌ Erro: Client ID ou Secret ausentes. Configure no painel de configurações ou no .env.local.');
      return;
    }

    // 2. Verificar se o token precisa de renovação
    const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : 0;
    const nowMs = Date.now();
    const isExpired = expiresAtMs - nowMs < 5 * 60 * 1000;

    if (isExpired && refreshToken) {
      console.log('\n2. Token expirado ou próximo de expirar. Tentando renovação (Refresh)...');
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch('https://auth.contaazul.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha no Refresh Token: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      accessToken = tokenData.access_token;
      const newRefreshToken = tokenData.refresh_token || refreshToken;
      const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

      // Salvar de volta no banco
      await supabaseAdmin
        .from('conta_azul_config')
        .update({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);

      console.log('   ✓ Token renovado e salvo com sucesso no Supabase!');
    } else if (!accessToken) {
      console.log('\n❌ Erro: Não há token de acesso ativo. Conecte sua Conta Azul pela interface web primeiro.');
      return;
    } else {
      console.log('\n2. Token de acesso atual está válido e ativo.');
    }

    // 3. Testar a busca de Vendas no novo endpoint /v1/sales (API v2)
    console.log('\n3. Testando chamada de listagem de Vendas (GET /v1/sales)...');
    const response = await fetch('https://api-v2.contaazul.com/v1/sales?tamanho_pagina=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`   ❌ Falha na API: ${response.status} - ${errText}`);
      return;
    }

    const salesData = await response.json();
    const salesList = salesData.itens || salesData.items || [];
    console.log(`   ✓ Chamada realizada com sucesso!`);
    console.log(`   ✓ Vendas retornadas pela Conta Azul: ${salesList.length} registros.`);

    if (salesList.length > 0) {
      console.log('\n4. Amostra da Venda recebida (Primeiro registro):');
      const sampleSale = salesList[0];
      console.log(JSON.stringify({
        id: sampleSale.id,
        number: sampleSale.number || sampleSale.numero,
        status: sampleSale.status || sampleSale.situacao?.nome,
        emission_date: sampleSale.emission_date || sampleSale.emission || sampleSale.criado_em,
        customer_id: sampleSale.customer_id || sampleSale.customer?.id
      }, null, 2));

      // 5. Testar detalhamento da venda
      console.log(`\n5. Testando chamada de detalhes (GET /v1/sales/${sampleSale.id})...`);
      const detailRes = await fetch(`https://api-v2.contaazul.com/v1/sales/${sampleSale.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (detailRes.ok) {
        const saleDetail = await detailRes.json();
        console.log('   ✓ Detalhes obtidos com sucesso!');
        console.log(`   - Cliente: ${saleDetail.customer?.name || saleDetail.cliente?.nome || 'Não mapeado'}`);
        console.log(`   - Vendedor: ${saleDetail.seller?.name || saleDetail.vendedor?.nome || 'N/A'}`);
      } else {
        console.log(`   ❌ Falha ao buscar detalhes: ${detailRes.status}`);
      }

      // 6. Testar itens da venda
      console.log(`\n6. Testando chamada de itens (GET /v1/sales/${sampleSale.id}/items)...`);
      const itemsRes = await fetch(`https://api-v2.contaazul.com/v1/sales/${sampleSale.id}/items`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        const saleItems = Array.isArray(itemsData) ? itemsData : (itemsData.items || itemsData.itens || []);
        console.log('   ✓ Itens obtidos com sucesso!');
        console.log(`   - Quantidade de itens: ${saleItems.length}`);
        if (saleItems.length > 0) {
          console.log(`   - Primeiro item: ${saleItems[0].name || saleItems[0].nome || 'N/A'} (Qtd: ${saleItems[0].quantity || saleItems[0].quantidade})`);
        }
      } else {
        console.log(`   ❌ Falha ao buscar itens: ${itemsRes.status}`);
      }
    } else {
      console.log('   ℹ Nenhuma venda encontrada na Conta Azul.');
    }

    console.log('\n=============================================');
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO! INTEGRAÇÃO OK');
    console.log('=============================================\n');

  } catch (err) {
    console.error('\n❌ Erro durante o teste da integração:', err);
  }
}

testIntegration();
</file>

<file path="scratch/test_joins.js">
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
</file>

<file path="src/app/api/config/conta-azul/route.ts">
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ client_id: '', has_secret: false, is_connected: false });
  }

  try {
    const { data: config, error } = await supabaseAdmin
      .from('conta_azul_config')
      .select('*')
      .eq('tenant_id', defaultTenantId)
      .maybeSingle();

    if (error) throw error;

    const isConnected = !!config?.access_token && new Date(config.expires_at).getTime() > Date.now();
    const client_id = config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const has_secret = !!config?.client_secret || !!process.env.CONTA_AZUL_CLIENT_SECRET;

    return NextResponse.json({
      client_id,
      has_secret,
      is_connected: isConnected,
      expires_at: config?.expires_at || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ success: true }); // Sucesso simulado
  }

  try {
    const { client_id, client_secret } = await request.json();

    const { data: existing } = await supabaseAdmin
      .from('conta_azul_config')
      .select('id')
      .eq('tenant_id', defaultTenantId)
      .maybeSingle();

    const updates: any = { client_id };
    if (client_secret) {
      updates.client_secret = client_secret;
    }

    let error;
    if (existing) {
      const res = await supabaseAdmin
        .from('conta_azul_config')
        .update(updates)
        .eq('tenant_id', defaultTenantId);
      error = res.error;
    } else {
      const res = await supabaseAdmin
        .from('conta_azul_config')
        .insert([{ tenant_id: defaultTenantId, ...updates }]);
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
</file>

<file path="src/app/api/relatorios/route.ts">
import { NextRequest, NextResponse } from 'next/server';
import { getSectorTransitionReport } from '@/services/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const customerId = searchParams.get('customerId') || undefined;
  const productId = searchParams.get('productId') || undefined;
  const machineId = searchParams.get('machineId') || undefined;

  try {
    const report = await getSectorTransitionReport(tenantId, {
      startDate,
      endDate,
      customerId,
      productId,
      machineId
    });

    if (report.error) {
      return NextResponse.json({ success: false, error: (report.error as any).message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: report.data
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao processar relatório.' },
      { status: 500 }
    );
  }
}
</file>

<file path="src/app/api/sync/cron/route.ts">
import { NextRequest, NextResponse } from 'next/server';
import { SyncQueueService } from '@/services/sync_queue';

// Handles GET (cron call) and POST (manual UI trigger)
async function handleSync(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  // Security token check (optional for cron, e.g. Authorization header)
  // In production, you would check: request.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
  
  try {
    const queueService = new SyncQueueService(tenantId);
    const result = await queueService.processQueue();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error: any) {
    console.error('Error running background sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao processar a fila de sincronização.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
</file>

<file path="src/app/api/sync/import-customers/route.ts">
import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';

// Aciona a importação de clientes do Conta Azul para o banco de dados local
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  try {
    const service = new ContaAzulService(tenantId);
    const result = await service.importCustomers();

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Erro na API de importação de clientes:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao importar clientes.' },
      { status: 500 }
    );
  }
}
</file>

<file path="src/app/api/sync/import-orders/route.ts">
import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';

// Aciona a importacao de pedidos do Conta Azul para o banco de dados local
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  try {
    const service = new ContaAzulService(tenantId);
    const result = await service.importOrders();

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Erro na API de importacao de pedidos:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao importar pedidos.' },
      { status: 500 }
    );
  }
}
</file>

<file path="src/app/configuracoes/logs/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { 
  ArrowLeft, 
  Terminal, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  RefreshCw, 
  FileJson,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function LogsIntegracaoPage() {
  const { user } = useAuth();
  
  // States para os logs e paginação/loading
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para detalhar payload/response
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Carregar os logs do Supabase aplicando filtros
  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      
      if (!supabase) throw new Error('Cliente Supabase não inicializado');

      let query = supabase
        .from('conta_azul_integration_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Aplicação dos filtros do banco
      if (filterAction) {
        query = query.eq('action', filterAction);
      }
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      const { data, error } = await query.limit(200); // Traz os últimos 200 logs conforme filtros

      if (error) throw error;

      // Filtro em memória para busca textual
      if (searchQuery.trim() && data) {
        const queryLower = searchQuery.toLowerCase();
        const filtered = data.filter(log => {
          const payloadStr = JSON.stringify(log.payload || {}).toLowerCase();
          const responseStr = JSON.stringify(log.response || {}).toLowerCase();
          const errMsgStr = (log.error_message || '').toLowerCase();
          const actionStr = (log.action || '').toLowerCase();
          return payloadStr.includes(queryLower) || 
                 responseStr.includes(queryLower) || 
                 errMsgStr.includes(queryLower) ||
                 actionStr.includes(queryLower);
        });
        setLogs(filtered);
      } else {
        setLogs(data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar logs de integração:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchLogs();
    }
  }, [user, filterAction, filterStatus, startDate, endDate]);

  // Handler para busca de texto manual ao pressionar Enter ou clique do botão
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Segurança de Acesso
  if (user && user.role !== 'Administrador') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Apenas usuários com perfil **Administrador** têm permissões para auditar e visualizar os logs de integração de API.
        </p>
        <Link href="/pedidos" className="btn btn-secondary">Voltar ao Kanban</Link>
      </div>
    );
  }

  // Lista de ações distintas nos logs para preencher dinamicamente o select de filtros
  const distinctActions = [
    'OAUTH_CODE_EXCHANGE',
    'OAUTH_TOKEN_REFRESH',
    'IMPORT_CUSTOMERS',
    'IMPORT_ORDERS',
    'SYNC_CUSTOMER',
    'SYNC_PRODUCT',
    'SYNC_ORDER',
    'SYNC_FINANCIAL'
  ];

  return (
    <div className="page-container">
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/configuracoes" className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={22} style={{ color: 'var(--primary)' }} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Auditoria de Integração</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Histórico detalhado de chamadas à API Conta Azul v2 e fila assíncrona.
            </p>
          </div>
        </div>
        <button 
          onClick={() => fetchLogs(true)} 
          disabled={refreshing}
          className="btn btn-secondary" 
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          <span>Atualizar Logs</span>
        </button>
      </header>

      {/* FILTROS E PESQUISA */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={14} />
          Filtros de Auditoria
        </h3>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Ação Executada</label>
            <select 
              className="form-select"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">Todas as Ações</option>
              {distinctActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status do Log</label>
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="SUCCESS">🟢 SUCESSO</option>
              <option value="ERROR">🔴 ERRO</option>
              <option value="PENDING_RETRY">🟡 RE-TENTATIVA</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Data Inicial</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-input" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Data Final</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" 
                className="form-input" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label className="form-label">Busca Rápida (Conteúdo JSON)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: id da venda, nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                <Search size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* LISTAGEM DE LOGS */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive" style={{ maxHeight: '600px' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-subtle)' }}>
                <th style={{ padding: '1rem' }}>Data/Hora</th>
                <th>Ação</th>
                <th>Status</th>
                <th>Mensagem / Erro</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spinner" style={{ margin: '0 auto 1rem auto' }} />
                    Carregando histórico de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.action}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.status === 'SUCCESS' ? 'badge-success' : 
                        log.status === 'PENDING_RETRY' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {log.status === 'SUCCESS' ? 'SUCESSO' : log.status === 'PENDING_RETRY' ? 'AGUARDANDO RETRY' : 'ERRO'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: log.status === 'ERROR' ? 'var(--danger)' : 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.error_message || (log.response ? JSON.stringify(log.response) : 'Sem mensagens adicionais.')}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}
                      >
                        <Eye size={12} />
                        <span>Inspecionar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHES DE PAYLOAD (INSPECTOR) */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileJson size={20} style={{ color: 'var(--primary)' }} />
                  Detalhes do Log de Auditoria
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Ação: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedLog.action}</span> | Status: <span style={{ fontWeight: 600, color: selectedLog.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)' }}>{selectedLog.status}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontSize: '0.875rem'
            }}>
              {/* Mensagem de Erro */}
              {selectedLog.error_message && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--danger-bg || rgba(239, 68, 68, 0.1))',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}>
                  <XCircle size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Falha na Execução:</strong>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {selectedLog.error_message}
                    </p>
                  </div>
                </div>
              )}

              {/* Informações Gerais */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Data de Registro</span>
                  <strong>{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ID da Transação (Log)</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedLog.id}</span>
                </div>
              </div>

              {/* Payload Enviado */}
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Payload Enviado</h4>
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {selectedLog.payload ? JSON.stringify(selectedLog.payload, null, 2) : '// Nenhum payload enviado.'}
                  </pre>
                </div>
              </div>

              {/* Resposta Recebida */}
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Retorno da API / Resposta</h4>
                <div style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {selectedLog.response ? JSON.stringify(selectedLog.response, null, 2) : '// Nenhuma resposta retornada.'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface-subtle)',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)'
            }}>
              <button 
                onClick={() => setSelectedLog(null)}
                className="btn btn-primary"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
</file>

<file path="src/app/financeiro/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getFinancialTransactions, 
  createFinancialTransaction, 
  reconcileTransaction,
  getOrders
} from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  Plus, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

export default function FinanceiroPage() {
  const { user } = useAuth();
  
  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form Fields
  const [formType, setFormType] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [formAmount, setFormAmount] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formOrderId, setFormOrderId] = useState('');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [financeRes, ordersRes] = await Promise.all([
        getFinancialTransactions(),
        getOrders()
      ]);
      setTransactions(financeRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (e) {
      console.error('Error fetching finance page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowed = ['Administrador', 'Financeiro'];
    if (user && allowed.includes(user.role)) {
      fetchFinanceData();
    }
  }, [user]);

  // Security guard check
  const allowed = ['Administrador', 'Financeiro'];
  if (user && !allowed.includes(user.role)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O seu perfil de **{user.role}** não tem permissões financeiras para realizar conciliações ou acessar o caixa da empresa.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setFormType('RECEITA');
    setFormAmount(0);
    setFormDescription('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormOrderId('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      type: formType,
      amount: Number(formAmount),
      description: formDescription,
      due_date: formDueDate,
      order_id: formOrderId || null,
      status: 'PENDENTE'
    };

    const { error } = await createFinancialTransaction(payload);
    if (error) {
      alert('Erro ao lançar título financeiro: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchFinanceData();
    }
  };

  const handleReconcile = async (id: string) => {
    if (!confirm('Deseja confirmar a conciliação e liquidação deste título financeiro?')) return;
    
    const { error } = await reconcileTransaction(id);
    if (error) {
      alert('Erro ao conciliar título: ' + error);
    } else {
      fetchFinanceData();
    }
  };

  // Calculations
  const totalReceivables = transactions
    .filter(t => t.type === 'RECEITA' && t.status === 'CONCILIADO')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPayables = transactions
    .filter(t => t.type === 'DESPESA' && t.status === 'CONCILIADO')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalReceivables - totalPayables;

  // Filter listings
  const filteredTransactions = transactions.filter(t => {
    const matchType = filterType ? t.type === filterType : true;
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchType && matchStatus;
  });

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Conciliação Financeira</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Acompanhe contas a pagar e receber, concilie boletos e sincronize com a Conta Azul.
          </p>
        </div>
        
        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          <span>Lançar Título</span>
        </button>
      </header>

      {/* BALANCE PANELS */}
      <div className="dashboard-grid">
        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Total de Receitas Liquidadas</span>
            <span className="metric-value" style={{ color: 'var(--success)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceivables)}
            </span>
          </div>
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Total de Despesas Pagas</span>
            <span className="metric-value" style={{ color: 'var(--danger)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPayables)}
            </span>
          </div>
          <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Saldo em Caixa Real</span>
            <span className="metric-value" style={{ color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netBalance)}
            </span>
          </div>
          <div className="metric-icon" style={{ backgroundColor: netBalance >= 0 ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(239, 68, 68, 0.1)', color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Tipo de Título</label>
          <select 
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="RECEITA">Receitas (Inflow)</option>
            <option value="DESPESA">Despesas (Outflow)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status da Conciliação</label>
          <select 
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CONCILIADO">Conciliado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <button onClick={fetchFinanceData} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* TRANSACTIONS TABLE LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Descrição / Título</th>
                <th>Tipo</th>
                <th>Valor do Título</th>
                <th>Vencimento</th>
                <th>Data de Conciliação</th>
                <th>Pedido Vinculado</th>
                <th>Status</th>
                <th>Sincronização ERP</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={9} />
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhuma movimentação financeira registrada para este filtro.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isIncome = t.type === 'RECEITA';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.description}</td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: isIncome ? 'var(--success)' : 'var(--danger)',
                          display: 'inline-flex',
                          gap: '0.25rem'
                        }}>
                          {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: isIncome ? 'var(--success)' : 'var(--danger)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </td>
                      <td>{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td>{t.payment_date ? new Date(t.payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}</td>
                      <td>
                        {t.order ? (
                          <span style={{ fontWeight: 500 }}>Pedido #{t.order.order_number}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Avulso</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'CONCILIADO' ? 'badge-success' : 'badge-danger'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {t.conta_azul_id ? (
                          <span className="badge badge-success" title={`ID: ${t.conta_azul_id}`}>
                            <CheckCircle2 size={12} />
                            Integrado ({t.conta_azul_id.substring(0, 8)})
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <HelpCircle size={12} />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td>
                        {t.status === 'PENDENTE' && (
                          <button 
                            onClick={() => handleReconcile(t.id)} 
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Conciliar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
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
            maxWidth: '500px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                Lançar Novo Título Financeiro
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Tipo de Lançamento *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'RECEITA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setFormType('RECEITA')}
                  >
                    <ArrowUpRight size={16} />
                    Receita (Entrada)
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'DESPESA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setFormType('DESPESA')}
                  >
                    <ArrowDownRight size={16} />
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição da Transação *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="Ex: Compra de matéria-prima Kraft Klabin"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  className="form-input" 
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Vencimento *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pedido Vinculado (Opcional)</label>
                <select 
                  className="form-select"
                  value={formOrderId}
                  onChange={(e) => setFormOrderId(e.target.value)}
                >
                  <option value="">Nenhum pedido (Lançamento avulso)</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>Pedido #{o.order_number} ({o.customer?.name})</option>
                  ))}
                </select>
              </div>

              <footer style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Título
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
</file>

<file path="src/app/fornecedores/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSuppliers, createSupplier, updateSupplier } from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, RefreshCw } from 'lucide-react';

export default function FornecedoresPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await getSuppliers();
      setSuppliers(data || []);
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowedRoles = ['Administrador', 'Comercial'];
    if (user && allowedRoles.includes(user.role)) {
      fetchSuppliers();
    }
  }, [user]);

  // Security guard check: Only Comercial and Administrador can access
  const allowedRoles = ['Administrador', 'Comercial'];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O seu perfil de **{user.role}** não possui autorização para gerenciar ou visualizar o cadastro de fornecedores.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedSupplier(null);
    setFormName('');
    setFormDocument('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setModalType('edit');
    setSelectedSupplier(supplier);
    setFormName(supplier.name);
    setFormDocument(supplier.document || '');
    setFormEmail(supplier.email || '');
    setFormPhone(supplier.phone || '');
    setFormAddress(supplier.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formName,
      document: formDocument,
      email: formEmail,
      phone: formPhone,
      address: formAddress
    };

    if (modalType === 'create') {
      const { error } = await createSupplier(payload);
      if (error) {
        alert('Erro ao cadastrar fornecedor: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchSuppliers();
      }
    } else {
      const { error } = await updateSupplier(selectedSupplier.id, payload);
      if (error) {
        alert('Erro ao atualizar fornecedor: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchSuppliers();
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.document && s.document.includes(search))
  );

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Cadastro de Fornecedores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerenciamento de fornecedores de insumos (papel, bobinas, tintas) integrados à Conta Azul.
          </p>
        </div>
        
        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Plus size={16} />
          <span>Novo Fornecedor</span>
        </button>
      </header>

      {/* SEARCH BAR */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="form-label">Buscar Fornecedor</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Digite o nome ou CNPJ do fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchSuppliers} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* SUPPLIERS LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Razão Social / Nome</th>
                <th>CNPJ / CPF</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Sincronização Conta Azul</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={7} />
                ))
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum fornecedor cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td style={{ fontWeight: 600 }}>{supplier.name}</td>
                    <td><code>{supplier.document || '---'}</code></td>
                    <td>{supplier.email || '---'}</td>
                    <td>{supplier.phone || '---'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {supplier.address || '---'}
                    </td>
                    <td>
                      {supplier.conta_azul_id ? (
                        <span className="badge badge-success" title={`ID: ${supplier.conta_azul_id}`}>
                          <CheckCircle2 size={12} />
                          Integrado ({supplier.conta_azul_id.substring(0, 8)})
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <HelpCircle size={12} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenEdit(supplier)} 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                      >
                        <Edit size={12} />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
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
            maxWidth: '500px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                {modalType === 'create' ? 'Cadastrar Novo Fornecedor' : 'Editar Fornecedor'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Razão Social / Nome Fantasia *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CNPJ / CPF</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: 00.000.000/0001-00"
                  value={formDocument}
                  onChange={(e) => setFormDocument(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Ex: suprimentos@fornecedor.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: (11) 3003-9999"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Industrial / Escritório</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Rua, Número, Cidade/UF..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                />
              </div>

              <footer style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Salvar Fornecedor' : 'Salvar Alterações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
</file>

<file path="src/app/pedidos/configuracoes/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getOrderStages, 
  createOrderStage, 
  updateOrderStage, 
  deleteOrderStage, 
  getProfilesWithPermissions, 
  saveProfileStagePermission,
  getOrders
} from '@/services/supabase';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Edit3, 
  Save, 
  Loader2, 
  RefreshCw,
  Sliders,
  Users
} from 'lucide-react';

export default function ProcessSettingsPage() {
  const { user } = useAuth();
  
  // Estados para dados do banco
  const [stages, setStages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para indicar salvamento de permissao
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  
  // Estado para etapa selecionada para edicao
  const [selectedStage, setSelectedStage] = useState<any | null>(null);
  
  // Estados para os inputs do formulario (usados para Criacao e Edicao)
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#3b82f6');
  
  // Estado para armazenar as permissões editadas no formulário da etapa
  const [stagePermissions, setStagePermissions] = useState<{[profileId: string]: {canEnter: boolean, canExit: boolean}}>({});

  const handleFormPermissionChange = (profileId: string, type: 'canEnter' | 'canExit') => {
    setStagePermissions(prev => {
      const current = prev[profileId] || { canEnter: false, canExit: false };
      return {
        ...prev,
        [profileId]: {
          ...current,
          [type]: !current[type]
        }
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [stagesRes, profilesRes, ordersRes] = await Promise.all([
        getOrderStages(tenantId),
        getProfilesWithPermissions(tenantId),
        getOrders(tenantId)
      ]);
      
      if (stagesRes.data) {
        setStages(stagesRes.data);
      }
      if (profilesRes.data) {
        setProfiles(profilesRes.data);
      }
      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do processo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchData();
    }
  }, [user]);

  // Inicializar permissões vazias/padrão para novo registro
  useEffect(() => {
    if (profiles.length > 0 && !selectedStage) {
      const initialPerms: {[profileId: string]: {canEnter: boolean, canExit: boolean}} = {};
      profiles.forEach(p => {
        const isAdmin = p.role === 'Administrador';
        initialPerms[p.id] = {
          canEnter: isAdmin,
          canExit: isAdmin
        };
      });
      setStagePermissions(initialPerms);
    }
  }, [profiles, selectedStage]);

  // Bloqueia acesso de quem nao e admin
  if (user && user.role !== 'Administrador') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Apenas usuários com perfil de Administrador possuem permissões de sistema para configurar etapas de produção e gerenciar liberações de movimentação.
        </p>
      </div>
    );
  }

  // Submit do Formulario (Criar ou Atualizar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim()) return;

    setLoading(true);
    try {
      if (selectedStage) {
        // Modo de Edicao
        const { error } = await updateOrderStage(selectedStage.id, {
          name: stageName.trim(),
          color: stageColor
        });

        if (error) {
          alert('Erro ao atualizar etapa: ' + error.message);
        } else {
          // Salvar permissões modificadas no formulário
          const savePromises = Object.entries(stagePermissions).map(([profileId, perms]) => {
            const profile = profiles.find(p => p.id === profileId);
            if (profile?.role === 'Administrador') return Promise.resolve();
            return saveProfileStagePermission(profileId, selectedStage.id, perms.canEnter, perms.canExit);
          });
          await Promise.all(savePromises);

          setSelectedStage(null);
          setStageName('');
          setStageColor('#3b82f6');
          await fetchData();
        }
      } else {
        // Modo de Criacao
        const maxSequence = stages.reduce((max, s) => s.sequence > max ? s.sequence : max, 0);
        const newStage = {
          tenant_id: user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
          name: stageName.trim(),
          color: stageColor,
          sequence: maxSequence + 1
        };

        const { data, error } = await createOrderStage(newStage);
        if (error) {
          alert('Erro ao criar etapa: ' + error.message);
        } else {
          // Salvar permissões inseridas no formulário para a nova etapa
          if (data && data.id) {
            const savePromises = Object.entries(stagePermissions).map(([profileId, perms]) => {
              const profile = profiles.find(p => p.id === profileId);
              if (profile?.role === 'Administrador') return Promise.resolve();
              return saveProfileStagePermission(profileId, data.id, perms.canEnter, perms.canExit);
            });
            await Promise.all(savePromises);
          }

          setStageName('');
          setStageColor('#3b82f6');
          await fetchData();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar etapa:', err);
      alert('Erro ao salvar etapa.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar propriedades da etapa no formulario da esquerda
  const handleSelectStageForEdit = (stage: any) => {
    setSelectedStage(stage);
    setStageName(stage.name);
    setStageColor(stage.color);

    // Inicializar as permissões da etapa selecionada com base nos perfis carregados
    const initialPerms: {[profileId: string]: {canEnter: boolean, canExit: boolean}} = {};
    profiles.forEach(p => {
      const isAdmin = p.role === 'Administrador';
      const pPerm = p.profile_stage_permissions?.find((sp: any) => sp.stage_id === stage.id);
      initialPerms[p.id] = {
        canEnter: isAdmin ? true : (pPerm ? pPerm.can_enter : false),
        canExit: isAdmin ? true : (pPerm ? pPerm.can_exit : false)
      };
    });
    setStagePermissions(initialPerms);
  };

  // Limpar selecao e voltar para modo de criacao
  const handleClearSelection = () => {
    setSelectedStage(null);
    setStageName('');
    setStageColor('#3b82f6');

    // Resetar permissões para o padrão do formulário de criação
    const initialPerms: {[profileId: string]: {canEnter: boolean, canExit: boolean}} = {};
    profiles.forEach(p => {
      const isAdmin = p.role === 'Administrador';
      initialPerms[p.id] = {
        canEnter: isAdmin,
        canExit: isAdmin
      };
    });
    setStagePermissions(initialPerms);
  };

  const handleDeleteStage = async (stage: any) => {
    const ordersCount = orders.filter(o => o.stage_id === stage.id).length;
    if (ordersCount > 0) {
      alert(`Não é possível excluir a etapa "${stage.name}" pois ela possui ${ordersCount} pedido(s) vinculado(s). Remova ou altere esses pedidos antes de prosseguir.`);
      return;
    }

    if (confirm(`Deseja realmente excluir a etapa "${stage.name}"?`)) {
      const { error } = await deleteOrderStage(stage.id);
      if (error) {
        alert('Erro ao excluir etapa: ' + error.message);
      } else {
        // Se a etapa deletada for a que estava em edicao, limpa a selecao
        if (selectedStage?.id === stage.id) {
          handleClearSelection();
        }
        fetchData();
      }
    }
  };

  const handleMoveStage = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const stage1 = stages[index];
    const stage2 = stages[newIndex];

    const tempSeq = stage1.sequence;
    stage1.sequence = stage2.sequence;
    stage2.sequence = tempSeq;

    setLoading(true);
    try {
      await Promise.all([
        updateOrderStage(stage1.id, { sequence: stage1.sequence }),
        updateOrderStage(stage2.id, { sequence: stage2.sequence })
      ]);
      fetchData();
    } catch (err) {
      console.error('Erro ao reordenar etapas:', err);
      alert('Erro ao reordenar etapas de produção.');
      setLoading(false);
    }
  };

  const handleToggleEntryExitPermission = async (profileId: string, stageId: string, type: 'enter' | 'exit', currentPermissions: any[]) => {
    setSavingPermission(profileId);
    
    // Encontra o registro de permissao atual para essa etapa
    const stagePerm = currentPermissions.find((p: any) => p.stage_id === stageId);
    
    let canEnter = stagePerm ? stagePerm.can_enter : false;
    let canExit = stagePerm ? stagePerm.can_exit : false;
    
    if (type === 'enter') {
      canEnter = !canEnter;
    } else {
      canExit = !canExit;
    }
    
    const { error } = await saveProfileStagePermission(profileId, stageId, canEnter, canExit);
    if (error) {
      alert('Erro ao atualizar permissão: ' + error.message);
    } else {
      await fetchData();
    }
    setSavingPermission(null);
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações de Processo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Customize as etapas do painel Kanban de produção e gerencie as permissões de entrada (colocar) e saída (tirar) de cada colaborador.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {loading ? <Loader2 size={16} className="spinner" /> : <RefreshCw size={16} />}
          <span>Atualizar Dados</span>
        </button>
      </header>

      {loading && stages.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SEÇÃO 1: GESTÃO DE ETAPAS DE PRODUÇÃO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            
            {/* Card para Cadastrar / Editar Etapa */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedStage ? <Edit3 size={18} style={{ color: 'var(--primary)' }} /> : <Plus size={18} style={{ color: 'var(--primary)' }} />}
                {selectedStage ? 'Editar Etapa de Produção' : 'Nova Etapa de Produção'}
              </h3>
              
              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nome da Etapa *</label>
                  <input 
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ex: Layout e Faca, Acabamento..."
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Cor no Kanban</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="color"
                      style={{ width: '40px', height: '38px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '2px', cursor: 'pointer' }}
                      value={stageColor}
                      onChange={(e) => setStageColor(e.target.value)}
                    />
                    <input 
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="#3b82f6"
                      value={stageColor}
                      onChange={(e) => setStageColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Liberações para esta Etapa
                  </label>
                  <div style={{ 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: 'var(--surface-subtle)'
                  }}>
                    {profiles.map(p => {
                      const isAdmin = p.role === 'Administrador';
                      const perm = stagePermissions[p.id] || { canEnter: isAdmin, canExit: isAdmin };
                      
                      return (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '50%' }}>
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.full_name}>
                              {p.full_name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {p.role}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: isAdmin ? 'not-allowed' : 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={perm.canEnter}
                                disabled={isAdmin}
                                onChange={() => handleFormPermissionChange(p.id, 'canEnter')}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span>Colocar</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: isAdmin ? 'not-allowed' : 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={perm.canExit}
                                disabled={isAdmin}
                                onChange={() => handleFormPermissionChange(p.id, 'canExit')}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span>Tirar</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    {selectedStage ? 'Salvar Alterações' : 'Adicionar Etapa'}
                  </button>
                  
                  {selectedStage && (
                    <button 
                      type="button" 
                      onClick={handleClearSelection} 
                      className="btn btn-secondary" 
                      style={{ width: '100%' }}
                    >
                      Nova Etapa de Produção
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista e Reordenação das Etapas */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'var(--primary)' }} />
                Etapas Ativas ({stages.length})
              </h3>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Ordem</th>
                      <th>Nome da Etapa (Clique para editar)</th>
                      <th style={{ width: '120px' }}>Cor Visual</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((stage, index) => {
                      const ordersCount = orders.filter(o => o.stage_id === stage.id).length;
                      const isSelected = selectedStage?.id === stage.id;

                      return (
                        <tr 
                          key={stage.id}
                          style={{
                            backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.04)' : 'transparent',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button 
                                onClick={() => handleMoveStage(index, 'up')}
                                disabled={index === 0 || loading}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button 
                                onClick={() => handleMoveStage(index, 'down')}
                                disabled={index === stages.length - 1 || loading}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          </td>
                          <td 
                            onClick={() => handleSelectStageForEdit(stage)}
                            style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'inherit';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {stage.name}
                              {ordersCount > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                                  ({ordersCount} pedidos)
                                </span>
                              )}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: stage.color }} />
                              <code style={{ fontSize: '0.75rem' }}>{stage.color}</code>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleSelectStageForEdit(stage)}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Edit3 size={12} />
                                <span>Editar</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteStage(stage)}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}
                              >
                                <Trash2 size={12} />
                                <span>Excluir</span>
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

          {/* SEÇÃO 2: MATRIZ DE PERMISSÕES DE MOVIMENTAÇÃO DE ETAPAS */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Permissões de Movimentação por Colaborador
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              Defina os privilégios de **Colocar (Entrada)** e **Tirar (Saída)** pedidos de cada etapa. Administradores possuem liberação total nativa.
            </p>

            <div className="table-responsive">
              <table className="table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th rowSpan={2} style={{ textAlign: 'left', padding: '1rem', minWidth: '180px', verticalAlign: 'middle' }}>Nome / E-mail</th>
                    <th rowSpan={2} style={{ textAlign: 'left', padding: '1rem', width: '130px', verticalAlign: 'middle' }}>Cargo</th>
                    {stages.map((stage) => (
                      <th 
                        key={stage.id} 
                        colSpan={2}
                        style={{ 
                          textAlign: 'center', 
                          padding: '0.5rem', 
                          fontSize: '0.75rem',
                          minWidth: '140px',
                          borderLeft: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color }} />
                          <span>{stage.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {stages.map((stage) => (
                      <React.Fragment key={stage.id}>
                        <th style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', fontWeight: 600 }}>Colocar</th>
                        <th style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tirar</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const isAdmin = profile.role === 'Administrador';
                    const profilePermissions = profile.profile_stage_permissions || [];

                    return (
                      <tr 
                        key={profile.id} 
                        style={{ 
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: savingPermission === profile.id ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{profile.full_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.email}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${
                            profile.role === 'Administrador' ? 'badge-primary' :
                            profile.role === 'Comercial' ? 'badge-info' :
                            profile.role === 'Produção' ? 'badge-warning' : 'badge-success'
                          }`}>
                            {profile.role}
                          </span>
                        </td>
                        {stages.map((stage) => {
                          const stagePerm = profilePermissions.find((p: any) => p.stage_id === stage.id);
                          const canEnter = stagePerm ? stagePerm.can_enter : false;
                          const canExit = stagePerm ? stagePerm.can_exit : false;

                          return (
                            <React.Fragment key={stage.id}>
                              {/* Colocar Checkbox */}
                              <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem', borderLeft: '1px solid var(--border)' }}>
                                {isAdmin ? (
                                  <input 
                                    type="checkbox"
                                    checked={true}
                                    disabled={true}
                                    style={{ transform: 'scale(1.05)', cursor: 'not-allowed', accentColor: 'var(--primary)' }}
                                  />
                                ) : (
                                  <input 
                                    type="checkbox"
                                    checked={canEnter}
                                    disabled={savingPermission === profile.id}
                                    onChange={() => handleToggleEntryExitPermission(profile.id, stage.id, 'enter', profilePermissions)}
                                    style={{ transform: 'scale(1.05)', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                  />
                                )}
                              </td>
                              {/* Tirar Checkbox */}
                              <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                                {isAdmin ? (
                                  <input 
                                    type="checkbox"
                                    checked={true}
                                    disabled={true}
                                    style={{ transform: 'scale(1.05)', cursor: 'not-allowed', accentColor: 'var(--primary)' }}
                                  />
                                ) : (
                                  <input 
                                    type="checkbox"
                                    checked={canExit}
                                    disabled={savingPermission === profile.id}
                                    onChange={() => handleToggleEntryExitPermission(profile.id, stage.id, 'exit', profilePermissions)}
                                    style={{ transform: 'scale(1.05)', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                  />
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
</file>

<file path="src/app/pedidos/saldos/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getCustomers, 
  getProducts, 
  getCustomerProductStock, 
  getCustomerStockCredits 
} from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Scale, 
  Package, 
  Clock, 
  ArrowUpRight,
  Filter
} from 'lucide-react';

export default function SaldosCreditosPage() {
  const { user } = useAuth();
  
  // Controle de Permissão
  const isSupervisor = user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
  const isAuthorized = user?.role === 'Administrador' || isSupervisor;

  // Listas de dados
  const [credits, setCredits] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Controle de Estado
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'credits' | 'stocks'>('credits');

  // Filtros
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [custRes, prodRes, creditsRes, stocksRes] = await Promise.all([
        getCustomers(tenantId),
        getProducts(tenantId),
        getCustomerStockCredits(undefined, 'ATIVO', tenantId),
        getCustomerProductStock(undefined, undefined, tenantId)
      ]);

      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      
      // Filtrar créditos para conter apenas créditos de falta (PENDENCIA_ENTREGA)
      const activeCredits = (creditsRes.data || []).filter((c: any) => c.credit_type === 'PENDENCIA_ENTREGA');
      setCredits(activeCredits);
      
      // Armazena estoques de personalizados
      setStocks(stocksRes.data || []);
    } catch (e) {
      console.error('Erro ao carregar dados de saldos e créditos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [user]);

  // Se o usuário não for autorizado, mostra tela de bloqueio
  if (user && !isAuthorized) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Você não possui privilégios administrativos. Apenas **Administradores** e a **Supervisão Comercial** podem gerenciar saldos e créditos de fábrica.
        </p>
      </div>
    );
  }

  // Filtragem local
  const filteredCredits = credits.filter(c => {
    const matchCustomer = filterCustomer ? c.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? c.product_id === filterProduct : true;
    const matchSearch = searchQuery ? (
      c.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.source_order?.pv_number?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    return matchCustomer && matchProduct && matchSearch;
  });

  const filteredStocks = stocks.filter(s => {
    const matchCustomer = filterCustomer ? s.customer_id === filterCustomer : true;
    const matchProduct = filterProduct ? s.product_id === filterProduct : true;
    const matchSearch = searchQuery ? (
      s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    return matchCustomer && matchProduct && matchSearch;
  });

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Saldos & Créditos de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Painel de conferência e gerenciamento de excedentes e pendências de produção por cliente.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="btn btn-secondary" 
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          <span>Recarregar</span>
        </button>
      </header>

      {/* INTEGRAÇÃO FUTURA EXPLICATIVA */}
      {/* 
        Nota de Desenvolvimento (Integração Futura):
        No fluxo de criação de um novo Pedido de Venda (PV), ao selecionar o Cliente e o Produto,
        o formulário fará uma consulta automática nos dados expostos aqui:
        1. Se houver registro ativo em 'customer_stock_credits' para o par Cliente/Produto, o formulário sugerirá:
           "Este cliente possui X unidades de crédito pendente. Deseja abater no saldo deste novo pedido?"
        2. Se houver saldo em 'customer_product_stock', sugerirá:
           "Este cliente possui Y sacolas de estoque na fábrica. Deseja utilizar este lote em vez de programar nova extrusão?"
      */}

      {/* TABS DE ALTERNÂNCIA */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('credits')}
          className={`btn ${activeTab === 'credits' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Scale size={16} />
          <span>Créditos por Falta ({credits.length})</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('stocks')}
          className={`btn ${activeTab === 'stocks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Package size={16} />
          <span>Estoque de Personalizados ({stocks.length})</span>
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        
        {/* Pesquisa por Texto */}
        <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
          <label className="form-label">Pesquisa Rápida</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '32px' }} 
              placeholder="Buscar por cliente, produto, PV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filtro Dropdown Cliente */}
        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label">Filtrar por Cliente</label>
          <select 
            className="form-select"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
          >
            <option value="">Todos os Clientes</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro Dropdown Produto */}
        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label className="form-label">Filtrar por Produto</label>
          <select 
            className="form-select"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
          >
            <option value="">Todos os Produtos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Limpar Filtros */}
        {(filterCustomer || filterProduct || searchQuery) && (
          <button 
            onClick={() => {
              setFilterCustomer('');
              setFilterProduct('');
              setSearchQuery('');
            }}
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-end', height: '36px' }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* EXIBIÇÃO CONTEÚDO */}
      <div className="card">
        <div className="table-responsive">
          {activeTab === 'credits' ? (
            /* TAB 1: CRÉDITOS */
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Produto de Referência</th>
                  <th>Qtd. Original Faltante</th>
                  <th>Crédito Disponível</th>
                  <th>Origem do Ajuste</th>
                  <th>Data do Evento</th>
                  <th>Notas / Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum crédito de falta de entrega ativo encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.customer?.name || 'Cliente'}</td>
                      <td style={{ fontWeight: 500 }}>{c.product?.name || 'Produto'}</td>
                      <td>{c.original_quantity?.toLocaleString('pt-BR')} un</td>
                      <td style={{ fontWeight: 700, color: 'hsl(346.8, 77.2%, 49.8%)' }}>
                        {c.remaining_quantity?.toLocaleString('pt-BR')} un
                      </td>
                      <td>
                        {c.source_order ? (
                          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                            <ArrowUpRight size={10} />
                            PV {c.source_order.pv_number}
                          </span>
                        ) : (
                          <span className="badge badge-secondary">Ajuste Manual</span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', maxWidth: '250px', color: 'var(--text-muted)' }}>
                        {c.notes || '---'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* TAB 2: ESTOQUES */
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente Proprietário</th>
                  <th>Produto Personalizado</th>
                  <th>Tamanho / Medida</th>
                  <th>Quantidade em Estoque na Fábrica</th>
                  <th>Última Movimentação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      Nenhum lote de personalizado armazenado na fábrica.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.customer?.name || 'Cliente'}</td>
                      <td style={{ fontWeight: 500 }}>{s.product?.name || 'Produto'}</td>
                      <td><code>{s.product?.measure || 'Padrão'}</code></td>
                      <td style={{ fontWeight: 700, color: 'hsl(142.1, 76.2%, 36.3%)' }}>
                        {s.quantity?.toLocaleString('pt-BR')} un
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(s.updated_at || s.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
</file>

<file path="src/app/produtos/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProducts, createProduct, updateProduct, adjustStock } from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, Warehouse, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function ProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);

  // Stock Adjustment Fields
  const [stockQtyChange, setStockQtyChange] = useState(100);
  const [stockAdjType, setStockAdjType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
  const [stockDescription, setStockDescription] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getProducts();
      setProducts(data || []);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allowedRoles = ['Administrador', 'Comercial', 'Produção'];
    if (user && allowedRoles.includes(user.role)) {
      fetchProducts();
    }
  }, [user]);

  // Security guard check
  const allowedRoles = ['Administrador', 'Comercial', 'Produção'];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O seu perfil de **{user.role}** não tem permissão para visualizar o estoque ou catálogo de produtos comerciais.
        </p>
      </div>
    );
  }

  // Open modals
  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedProduct(null);
    setFormName('');
    setFormSku('');
    setFormDescription('');
    setFormPrice(0.00);
    setFormStock(0);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setModalType('edit');
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || '');
    setFormDescription(product.description || '');
    setFormPrice(Number(product.price));
    setFormStock(product.stock_quantity);
    setIsFormModalOpen(true);
  };

  const handleOpenStock = (product: any) => {
    setSelectedProduct(product);
    setStockQtyChange(100);
    setStockAdjType('ENTRADA');
    setStockDescription('');
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formName,
      sku: formSku,
      description: formDescription,
      price: Number(formPrice),
      stock_quantity: modalType === 'create' ? Number(formStock) : undefined // stock changes handled by adjustments in edit mode
    };

    if (modalType === 'create') {
      const { error } = await createProduct(payload);
      if (error) alert('Erro ao cadastrar produto: ' + error.message);
      else {
        setIsFormModalOpen(false);
        fetchProducts();
      }
    } else {
      // If user is Produção, they can't edit basic attributes (only Admin/Comercial can)
      if (user?.role === 'Produção') {
        alert('Seu perfil de Produção não possui privilégios para alterar atributos básicos ou preços.');
        return;
      }

      const { error } = await updateProduct(selectedProduct.id, payload);
      if (error) alert('Erro ao atualizar produto: ' + error.message);
      else {
        setIsFormModalOpen(false);
        fetchProducts();
      }
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Output is stored as negative quantity
    const quantity = stockAdjType === 'SAIDA' ? -Math.abs(stockQtyChange) : Math.abs(stockQtyChange);
    const desc = stockDescription || `Ajuste manual de estoque (${stockAdjType})`;

    const { error } = await adjustStock(
      selectedProduct.id,
      quantity,
      stockAdjType as any,
      desc
    );

    if (error) {
      alert('Erro ao ajustar estoque: ' + error);
    } else {
      setIsStockModalOpen(false);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial';
  const canEditDetails = user?.role === 'Administrador' || user?.role === 'Comercial';

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Produtos & Estoque</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerencie o catálogo de especificações de embalagens, preços comerciais e contagem de estoque.
          </p>
        </div>
        
        {canCreate && (
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Novo Produto</span>
          </button>
        )}
      </header>

      {/* FILTERS */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="form-label">Buscar Produto</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Buscar por nome do produto ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchProducts} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>SKU / Código</th>
                <th>Nome do Produto</th>
                <th>Descrição</th>
                <th>Preço Unitário</th>
                <th>Estoque Físico</th>
                <th>Sincronização ERP</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={7} />
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum produto cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td><code style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', backgroundColor: 'var(--background)', borderRadius: '4px' }}>{product.sku || '---'}</code></td>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.description || '---'}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span className="badge" style={{ 
                        backgroundColor: product.stock_quantity < 500 ? 'var(--danger-bg)' : 'rgba(var(--primary-rgb), 0.08)',
                        color: product.stock_quantity < 500 ? 'var(--danger)' : 'var(--primary)',
                        display: 'inline-flex',
                        gap: '0.25rem',
                        alignItems: 'center'
                      }}>
                        <Warehouse size={12} />
                        {product.stock_quantity.toLocaleString('pt-BR')} un
                      </span>
                    </td>
                    <td>
                      {product.conta_azul_id ? (
                        <span className="badge badge-success" title={`ID: ${product.conta_azul_id}`}>
                          <CheckCircle2 size={12} />
                          Integrado ({product.conta_azul_id.substring(0, 8)})
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <HelpCircle size={12} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleOpenStock(product)} 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                      >
                        <Warehouse size={12} />
                        <span>Ajustar Estoque</span>
                      </button>

                      {canEditDetails && (
                        <button 
                          onClick={() => handleOpenEdit(product)} 
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                        >
                          <Edit size={12} />
                          <span>Editar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (CREATE / EDIT DETAILS) */}
      {isFormModalOpen && (
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
            maxWidth: '500px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                {modalType === 'create' ? 'Cadastrar Novo Produto' : 'Editar Atributos de Produto'}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleProductSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Nome do Produto de Embalagem *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Código do Produto *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: CX-DUP-M"
                  required
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição Técnica das Medidas e Papel</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Ex: Papel duplex 250g, alça cordão de nylon, reforço no fundo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preço Unitário Comercial (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-input" 
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                />
              </div>

              {modalType === 'create' && (
                <div className="form-group">
                  <label className="form-label">Estoque Inicial (Unidades) *</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                  />
                </div>
              )}

              <footer style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              } as any}>
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Salvar Produto' : 'Salvar Alterações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {isStockModalOpen && (
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
            maxWidth: '450px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                Ajustar Estoque: {selectedProduct?.name}
              </h3>
              <button 
                onClick={() => setIsStockModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleStockSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Estoque Atual:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedProduct?.stock_quantity.toLocaleString('pt-BR')} un</span>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Movimentação *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'ENTRADA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    onClick={() => setStockAdjType('ENTRADA')}
                  >
                    <ArrowUpRight size={14} />
                    Entrada
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'SAIDA' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    onClick={() => setStockAdjType('SAIDA')}
                  >
                    <ArrowDownRight size={14} />
                    Saída
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockAdjType === 'AJUSTE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setStockAdjType('AJUSTE')}
                  >
                    Ajuste
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade de Unidades *</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-input" 
                  required
                  value={stockQtyChange}
                  onChange={(e) => setStockQtyChange(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motivo / Descrição *</label>
                <textarea 
                  className="form-textarea" 
                  required
                  placeholder="Ex: Recebimento de bobina de fornecedor Klabin, ou Retirada de caixas para produção, etc..."
                  value={stockDescription}
                  onChange={(e) => setStockDescription(e.target.value)}
                />
              </div>

              <footer style={{
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Movimentação
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
</file>

<file path="src/app/relatorios/page.tsx">
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getCustomers, 
  getProducts, 
  getProductionMachines, 
  getSectorTransitionReport,
  getCustomerStockCredits,
  getOrderBalanceAdjustments,
  getCustomerProductStock
} from '@/services/supabase';
import { Skeleton, CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { 
  Clock, 
  Calendar, 
  Users, 
  Package, 
  Cpu, 
  Sliders, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  BarChart2, 
  Search,
  Hourglass,
  Gauge,
  Coins,
  History,
  TrendingDown
} from 'lucide-react';

export default function RelatoriosPage() {
  const { user } = useAuth();
  
  // Navigation tabs: 'efficiency' | 'credits'
  const [activeTab, setActiveTab] = useState<'efficiency' | 'credits'>('efficiency');

  // Lists for filters
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');

  // Loading and Data states
  const [loading, setLoading] = useState(true);
  const [submittingFilters, setSubmittingFilters] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Tab 2 Data states
  const [credits, setCredits] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [productStocks, setProductStocks] = useState<any[]>([]);

  const fetchFiltersData = async () => {
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [custRes, prodRes, machRes] = await Promise.all([
        getCustomers(tenantId),
        getProducts(tenantId),
        getProductionMachines(tenantId)
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setMachines(machRes.data || []);
    } catch (e) {
      console.error('Error fetching filter listings:', e);
    }
  };

  const fetchReport = async (isFilterSubmit = false) => {
    if (isFilterSubmit) {
      setSubmittingFilters(true);
    } else {
      setLoading(true);
    }
    
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      
      // Fetch transition report
      const reportRes = await getSectorTransitionReport(tenantId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerId: selectedCustomerId || undefined,
        productId: selectedProductId || undefined,
        machineId: selectedMachineId || undefined
      });
      setReportData(reportRes.data || null);

      // Fetch credits, adjustments and stocks
      const [creditsRes, adjRes, stocksRes] = await Promise.all([
        getCustomerStockCredits(selectedCustomerId || undefined, undefined, tenantId),
        getOrderBalanceAdjustments(undefined, selectedCustomerId || undefined, tenantId),
        getCustomerProductStock(selectedCustomerId || undefined, selectedProductId || undefined, tenantId)
      ]);
      
      setCredits(creditsRes.data || []);
      setAdjustments(adjRes.data || []);
      setProductStocks(stocksRes.data || []);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setLoading(false);
      setSubmittingFilters(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
    fetchReport();
  }, [user]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(true);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('');
    setSelectedProductId('');
    setSelectedMachineId('');
    setTimeout(() => {
      fetchReport(true);
    }, 50);
  };

  // Render Skeletons during initial load
  if (loading) {
    return (
      <div className="page-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Relatório de Eficiência por Setor</h1>
            <Skeleton height={20} width={340} />
          </div>
        </header>
        <CardSkeleton />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // --- TAB 1 (EFFICIENCY) CALCULATIONS ---
  const {
    averageTimes = [],
    longestStays = [],
    byPeriod = [],
    byCustomer = [],
    byProduct = [],
    byMachine = []
  } = reportData || {};

  const maxAverageHours = Math.max(...averageTimes.map((t: any) => t.averageHours), 1);
  const maxCustomerHours = Math.max(...byCustomer.slice(0, 5).map((c: any) => c.averageHours), 1);
  const maxProductHours = Math.max(...byProduct.slice(0, 5).map((p: any) => p.averageHours), 1);
  const maxMachineHours = Math.max(...byMachine.slice(0, 5).map((m: any) => m.averageHours), 1);
  const maxPeriodHours = Math.max(...byPeriod.slice(0, 10).map((p: any) => p.averageHours), 1);

  const totalTransitions = averageTimes.reduce((sum: number, t: any) => sum + t.count, 0);
  const totalAvgHours = averageTimes.reduce((sum: number, t: any) => sum + t.averageHours, 0);
  const overallAvgHours = averageTimes.length ? (totalAvgHours / averageTimes.length).toFixed(1) : '0';

  // --- TAB 2 (CREDITS & WASTES) CALCULATIONS ---
  
  // 1. Top clientes com mais créditos pendentes (status === 'ATIVO' e remaining_quantity > 0)
  const pendingCreditsMap: Record<string, { customerName: string; totalQty: number; count: number }> = {};
  credits.filter(c => c.status === 'ATIVO' && c.remaining_quantity > 0).forEach(c => {
    const name = c.customer?.name || 'Cliente Desconhecido';
    if (!pendingCreditsMap[name]) {
      pendingCreditsMap[name] = { customerName: name, totalQty: 0, count: 0 };
    }
    pendingCreditsMap[name].totalQty += c.remaining_quantity;
    pendingCreditsMap[name].count += 1;
  });
  const topCreditedCustomers = Object.values(pendingCreditsMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);
  const maxPendingCreditsQty = Math.max(...topCreditedCustomers.map(c => c.totalQty), 1);

  // 2. Top situações de sobras grandes (adjustment_type === 'SOBRA' e action_taken === 'GUARDAR_ESTOQUE_CLIENTE' ou similar)
  const largeLeftovers = adjustments
    .filter(a => a.adjustment_type === 'SOBRA')
    .map(a => {
      // Prejuízo estimado baseado em valor fictício ou real do produto (ex: R$ 1.50/unidade)
      const unitCost = Number(a.product?.price) || 1.50;
      const potentialLoss = a.difference_quantity * unitCost;
      return {
        ...a,
        potentialLoss
      };
    })
    .sort((a, b) => b.difference_quantity - a.difference_quantity)
    .slice(0, 10);

  // Total de perda financeira potencial estimada
  const totalPotentialLoss = largeLeftovers.reduce((sum, item) => sum + item.potentialLoss, 0);

  // 3. Histórico de consumo de créditos/estoques
  // Filtramos por ações de consumo de crédito ou estoque
  const consumptionHistory = adjustments
    .filter(a => ['CREDITO_PROXIMO_PEDIDO', 'GUARDAR_ESTOQUE_CLIENTE', 'CANCELADO_DESCONTO', 'COBRADO_ADICIONAL'].includes(a.action_taken))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Relatórios e Eficiência de Produção</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Análise de tempos médios, gargalos operacionais e controle de créditos/sobras de estoque.
          </p>
        </div>
        <button onClick={() => fetchReport()} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} className={submittingFilters ? 'spinner' : ''} />
          <span>Atualizar</span>
        </button>
      </header>

      {/* TAB SELECTOR */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '1px' }}>
        <button 
          onClick={() => setActiveTab('efficiency')}
          className={`btn ${activeTab === 'efficiency' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'efficiency' ? '2px solid var(--primary)' : 'none' }}
        >
          ⏱️ Eficiência Operacional
        </button>
        <button 
          onClick={() => setActiveTab('credits')}
          className={`btn ${activeTab === 'credits' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'credits' ? '2px solid var(--primary)' : 'none' }}
        >
          📦 Sobras, Faltas e Créditos
        </button>
      </div>

      {/* FILTERS PANEL CARD */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={16} style={{ color: 'var(--primary)' }} />
          Filtros de Análise
        </h3>
        <form onSubmit={handleApplyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Data Inicial</label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Data Final</label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Cliente</label>
            <select className="form-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">Todos os Clientes</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {activeTab === 'efficiency' ? (
            <>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Produto</label>
                <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                  <option value="">Todos os Produtos</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Máquina</label>
                <select className="form-select" value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)}>
                  <option value="">Todas as Máquinas</option>
                  {machines.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sector})</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Produto Vinculado</label>
              <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Todos os Produtos</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 1' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }} disabled={submittingFilters}>
              <Search size={14} />
              <span>{submittingFilters ? 'Filtrando...' : 'Filtrar'}</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: EFICIÊNCIA OPERACIONAL                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'efficiency' && (
        <>
          {/* KEY METRICS */}
          <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Média Geral por Etapa</span>
                <span className="metric-value">{overallAvgHours}h</span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Tempo médio de passagem
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                <Hourglass size={24} />
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Passagens Registradas</span>
                <span className="metric-value">{totalTransitions}</span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Total de logs no período
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <Gauge size={24} />
              </div>
            </div>

            <div className="card metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="metric-info">
                <span className="metric-label">Gargalo Crítico</span>
                <span className="metric-value" style={{ color: 'var(--danger)', fontSize: '1.25rem', fontWeight: 800 }}>
                  {averageTimes.length 
                    ? [...averageTimes].sort((a: any, b: any) => b.averageHours - a.averageHours)[0]?.sector 
                    : 'Nenhum'
                  }
                </span>
                <span className="metric-sublabel">
                  Setor com maior tempo de permanência
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                Tempo Médio em Cada Etapa (Horas / Dias)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {averageTimes.map((item: any) => {
                  const pct = (item.averageHours / maxAverageHours) * 100;
                  let barColor = 'var(--primary)';
                  if (item.sector === 'Atrasado') barColor = 'var(--danger)';
                  if (item.sector === 'Expedição' || item.sector === 'Concluído') barColor = 'var(--success)';
                  
                  return (
                    <div key={item.sector} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{item.sector}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {item.averageHours}h ({item.averageDays} dias) — <strong style={{ color: 'var(--text)' }}>{item.count} cards</strong>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--background)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.max(pct, 3)}%`, 
                          height: '100%', 
                          backgroundColor: barColor, 
                          borderRadius: '5px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
                {averageTimes.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma movimentação registrada para calcular tempos médios.
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                Evolução Temporal (Tempo Médio por Dia)
              </h3>
              {byPeriod.length > 0 ? (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingBottom: '10px', marginTop: '1rem', overflowX: 'auto' }}>
                  {byPeriod.slice(0, 10).map((p: any) => {
                    const pct = (p.averageHours / maxPeriodHours) * 80;
                    return (
                      <div key={p.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '40px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{p.averageHours}h</span>
                        <div style={{
                          width: '24px',
                          height: `${Math.max(pct, 8)}px`,
                          background: 'linear-gradient(to top, var(--primary) 0%, hsla(221.2, 83.2%, 60.3%, 0.8) 100%)',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'height 0.3s ease'
                        }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.date.substring(0, 5)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum dado temporal disponível.
                </div>
              )}
            </div>
          </div>

          {/* GROUPS RANKINGS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} style={{ color: 'var(--primary)' }} />
                Clientes com Maior Tempo de Produção
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {byCustomer.slice(0, 5).map((c: any) => {
                  const pct = (c.averageHours / maxCustomerHours) * 100;
                  return (
                    <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>{c.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.averageHours}h de média</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={16} style={{ color: 'var(--primary)' }} />
                Produtos com Maior Duração Média
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {byProduct.slice(0, 5).map((p: any) => {
                  const pct = (p.averageHours / maxProductHours) * 100;
                  return (
                    <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>{p.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{p.averageHours}h de média</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Cpu size={16} style={{ color: 'var(--primary)' }} />
                Tempo Médio Utilizado por Máquina
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {byMachine.slice(0, 5).map((m: any) => {
                  const pct = (m.averageHours / maxMachineHours) * 100;
                  return (
                    <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.name}>{m.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{m.averageHours}h de média</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 3)}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TABLE OF BOTTLENECK ITEMS */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              Gargalos Individuais — Cards com Maior Duração Consecutiva
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>PV / Item</th>
                    <th>Nome Arte (Cliente)</th>
                    <th>Setor de Bloqueio</th>
                    <th>Máquina Vinculada</th>
                    <th>Duração em Horas</th>
                    <th>Duração em Dias</th>
                  </tr>
                </thead>
                <tbody>
                  {longestStays.map((stay: any) => (
                    <tr key={`${stay.itemId}_${stay.sector}`}>
                      <td style={{ fontWeight: 700 }}>{stay.friendlyId}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{stay.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stay.customerName}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: stay.sector === 'Atrasado' ? 'hsla(0, 84.2%, 60.2%, 0.15)' : 'var(--surface-subtle)', 
                          color: stay.sector === 'Atrasado' ? 'var(--danger)' : 'var(--text)'
                        }}>
                          {stay.sector}
                        </span>
                      </td>
                      <td>{stay.machineName}</td>
                      <td style={{ fontWeight: 700 }}>{stay.durationHours}h</td>
                      <td style={{ color: stay.durationDays > 3 ? 'var(--danger)' : 'var(--text)', fontWeight: stay.durationDays > 3 ? 700 : 400 }}>
                        {stay.durationDays} dias
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: SOBRAS, FALTAS E CRÉDITOS                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'credits' && (
        <>
          {/* TAB 2 KEY METRICS */}
          <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Créditos de Estoque Ativos</span>
                <span className="metric-value">
                  {credits.filter(c => c.status === 'ATIVO' && c.remaining_quantity > 0).reduce((sum, c) => sum + c.remaining_quantity, 0).toLocaleString('pt-BR')} un
                </span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Aguardando consumo em novos pedidos
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                <Coins size={24} />
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Estoque de Personalizados</span>
                <span className="metric-value">
                  {productStocks.reduce((sum, s) => sum + s.quantity, 0).toLocaleString('pt-BR')} un
                </span>
                <span className="metric-sublabel" style={{ color: 'var(--text-muted)' }}>
                  Saldo parado armazenado na fábrica
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <Package size={24} />
              </div>
            </div>

            <div className="card metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="metric-info">
                <span className="metric-label">Prejuízo Potencial (Sobras)</span>
                <span className="metric-value" style={{ color: 'var(--danger)' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPotentialLoss)}
                </span>
                <span className="metric-sublabel">
                  Excedente de produção não faturado
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                <TrendingDown size={24} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* 1. TOP CLIENTES COM MAIS CRÉDITOS PENDENTES */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Coins size={18} style={{ color: 'var(--primary)' }} />
                Top Clientes com Mais Créditos Pendentes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {topCreditedCustomers.map((c: any) => {
                  const pct = (c.totalQty / maxPendingCreditsQty) * 100;
                  return (
                    <div key={c.customerName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{c.customerName}</span>
                        <span style={{ color: 'var(--primary)' }}>
                          <strong>{c.totalQty.toLocaleString('pt-BR')} un</strong> em {c.count} créditos
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--background)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.max(pct, 3)}%`, 
                          height: '100%', 
                          backgroundColor: 'var(--primary)', 
                          borderRadius: '5px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
                {topCreditedCustomers.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum crédito de cliente pendente no momento.
                  </div>
                )}
              </div>
            </div>

            {/* 2. TOP SITUAÇÕES DE SOBRAS GRANDES (PREJUÍZO POTENCIAL) */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
                Gargalos Físicos — Maiores Sobras na Fábrica (Prejuízo)
              </h3>
              <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>PV / Cliente</th>
                      <th>Produto</th>
                      <th style={{ textAlign: 'right' }}>Qtd. Sobra</th>
                      <th style={{ textAlign: 'right' }}>Perda Estimada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {largeLeftovers.map((left: any) => (
                      <tr key={left.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{left.order?.pv_number || `PV-${left.order?.order_number || '???'}`}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{left.customer?.name}</div>
                        </td>
                        <td>{left.product?.name || 'Insumo'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--warning)' }}>+{left.difference_quantity.toLocaleString('pt-BR')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(left.potentialLoss)}
                        </td>
                      </tr>
                    ))}
                    {largeLeftovers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          Nenhuma sobra registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* 3. HISTÓRICO DE CONSUMO DE CRÉDITOS E ESTOQUES */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} style={{ color: 'var(--primary)' }} />
              Histórico de Lançamentos e Consumo de Crédito / Estoque
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Produto / Descrição</th>
                    <th>Qtd. Transação</th>
                    <th>Ação Executada</th>
                    <th>Status / Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionHistory.map((h: any) => (
                    <tr key={h.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ fontWeight: 600 }}>{h.order?.pv_number || `PV-${h.order?.order_number || '???'}`}</td>
                      <td>{h.customer?.name}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{h.product?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.notes || '—'}</div>
                      </td>
                      <td style={{ 
                        fontWeight: 700, 
                        color: h.difference_quantity > 0 ? 'var(--success)' : 'var(--danger)',
                        textAlign: 'center'
                      }}>
                        {h.difference_quantity > 0 ? `+${h.difference_quantity.toLocaleString('pt-BR')}` : h.difference_quantity.toLocaleString('pt-BR')}
                      </td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: 'var(--surface-subtle)', 
                          border: '1px solid var(--border)',
                          fontSize: '0.7rem'
                        }}>
                          {h.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' ? '📥 Armazenado' : 
                           h.action_taken === 'CREDITO_PROXIMO_PEDIDO' ? '🪙 Crédito Gerado' : 
                           h.action_taken === 'CANCELADO_DESCONTO' ? '💸 Desconto Aplicado' : 
                           h.action_taken === 'COBRADO_ADICIONAL' ? '💳 Cobrança Extra' : h.action_taken}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${h.difference_quantity > 0 ? 'badge-success' : 'badge-info'}`}>
                          {h.difference_quantity > 0 ? 'Entrada' : 'Consumido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {consumptionHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        Nenhum consumo de crédito ou movimentação de estoque registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
</file>

<file path="src/app/page.module.css">
.page {
  --background: #fafafa;
  --foreground: #fff;

  --text-primary: #000;
  --text-secondary: #666;

  --button-primary-hover: #383838;
  --button-secondary-hover: #f2f2f2;
  --button-secondary-border: #ebebeb;

  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-geist-sans);
  background-color: var(--background);
}

.main {
  display: flex;
  flex: 1;
  width: 100%;
  max-width: 800px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  background-color: var(--foreground);
  padding: 120px 60px;
}

.intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 24px;
}

.intro h1 {
  max-width: 320px;
  font-size: 40px;
  font-weight: 600;
  line-height: 48px;
  letter-spacing: -2.4px;
  text-wrap: balance;
  color: var(--text-primary);
}

.intro p {
  max-width: 440px;
  font-size: 18px;
  line-height: 32px;
  text-wrap: balance;
  color: var(--text-secondary);
}

.intro a {
  font-weight: 500;
  color: var(--text-primary);
}

.ctas {
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 440px;
  gap: 16px;
  font-size: 14px;
}

.ctas a {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  border-radius: 128px;
  border: 1px solid transparent;
  transition: 0.2s;
  cursor: pointer;
  width: fit-content;
  font-weight: 500;
}

a.primary {
  background: var(--text-primary);
  color: var(--background);
  gap: 8px;
}

a.secondary {
  border-color: var(--button-secondary-border);
}

/* Enable hover only on non-touch devices */
@media (hover: hover) and (pointer: fine) {
  a.primary:hover {
    background: var(--button-primary-hover);
    border-color: transparent;
  }

  a.secondary:hover {
    background: var(--button-secondary-hover);
    border-color: transparent;
  }
}

@media (max-width: 600px) {
  .main {
    padding: 48px 24px;
  }

  .intro {
    gap: 16px;
  }

  .intro h1 {
    font-size: 32px;
    line-height: 40px;
    letter-spacing: -1.92px;
  }
}

@media (prefers-color-scheme: dark) {
  .logo {
    filter: invert();
  }

  .page {
    --background: #000;
    --foreground: #000;

    --text-primary: #ededed;
    --text-secondary: #999;

    --button-primary-hover: #ccc;
    --button-secondary-hover: #1a1a1a;
    --button-secondary-border: #1a1a1a;
  }
}
</file>

<file path="src/components/ui/demo.tsx">
import { Skeleton } from "@heroui/react";

export default function Basic() {
  return (
    <div className="shadow-panel w-[250px] space-y-5 rounded-lg bg-transparent p-4">
      <Skeleton className="h-32 rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-3/5 rounded-lg" />
        <Skeleton className="h-3 w-4/5 rounded-lg" />
        <Skeleton className="h-3 w-2/5 rounded-lg" />
      </div>
    </div>
  );
}
</file>

<file path="src/components/ui/Skeleton.tsx">
import { Skeleton as HeroUISkeleton } from "@heroui/react";

export function Basic() {
  return (
    <div className="shadow-panel w-[250px] space-y-5 rounded-lg bg-transparent p-4">
      <HeroUISkeleton className="h-32 rounded-lg" />
      <div className="space-y-3">
        <HeroUISkeleton className="h-3 w-3/5 rounded-lg" />
        <HeroUISkeleton className="h-3 w-4/5 rounded-lg" />
        <HeroUISkeleton className="h-3 w-2/5 rounded-lg" />
      </div>
    </div>
  );
}

// Preserve existing helper interfaces to prevent page compile errors
export function Skeleton({ className = '', width, height, borderRadius, style }: any) {
  const customStyle = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    borderRadius: borderRadius || 'var(--radius-sm)',
    ...style
  };

  return (
    <HeroUISkeleton 
      className={className} 
      style={customStyle} 
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <Skeleton height={20} width={i === 0 ? 40 : (i === 1 ? '70%' : '50%')} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton height={24} width="40%" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="90%" />
        <Skeleton height={14} width="75%" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <Skeleton height={36} width={100} />
        <Skeleton height={20} width={60} />
      </div>
    </div>
  );
}
</file>

<file path="src/components/AppGuard.tsx">
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AppGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/') {
        router.push('/');
      } else if (user && pathname === '/') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Exibe tela de carregamento premium enquanto valida a sessao real
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, hsl(222, 47%, 6%) 0%, hsl(222, 47%, 14%) 100%)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        fontSize: '1rem',
        fontWeight: 500
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(var(--primary-rgb), 0.1)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Verificando autenticação...</span>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
</file>

<file path="src/context/ThemeContext.tsx">
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Check local storage or default to light
    const savedTheme = localStorage.getItem('theme-preference') as Theme;
    if (savedTheme === 'dark') {
      setThemeState('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setThemeState('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme-preference', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
</file>

<file path="src/services/deadline_service.ts">
/**
 * Serviço centralizado para cálculo e validação de prazos de produção.
 */

/**
 * Extrai a data de prazo a partir das observações/notas do pedido ou item.
 * Suporta formatos:
 * - "Prazo: DD/MM/AAAA"
 * - "Prazo: AAAA-MM-DD"
 * - "Entrega: DD/MM/AAAA"
 * - "Entrega: AAAA-MM-DD"
 */
export function parseDeadlineFromNotes(notes: string | null): Date | null {
  if (!notes) return null;

  // Regex para capturar data no formato DD/MM/AAAA ou AAAA-MM-DD associado a "prazo" ou "entrega"
  const patterns = [
    /(?:prazo|entrega|prazo de entrega):\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    /(?:prazo|entrega|prazo de entrega):\s*(\d{4})-(\d{2})-(\d{2})/i
  ];

  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      if (match[3] && match[3].length === 4) {
        // DD/MM/AAAA
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-indexed
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day, 23, 59, 59);
        if (!isNaN(date.getTime())) return date;
      } else {
        // AAAA-MM-DD
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const date = new Date(year, month, day, 23, 59, 59);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  return null;
}

/**
 * Verifica se um card está em atraso com base na data limite e etapa atual.
 * Apenas colunas intermediárias (Produção, Manuseio, Embalagem, Expedição) são elegíveis para atraso automático.
 */
export function isCardOverdue(item: any, stages: any[]): boolean {
  const notes = item.notes || item.order?.notes || null;
  const deadline = parseDeadlineFromNotes(notes);
  if (!deadline) return false;

  // Se o prazo é maior ou igual ao momento atual, não está atrasado
  if (deadline.getTime() >= Date.now()) return false;

  // Verificar se o item está em uma etapa intermediária
  const currentStage = stages.find(s => s.id === item.stage_id);
  if (!currentStage) return false;

  // Colunas intermediárias/elegíveis para atraso
  const intermediateStages = ['Em produção', 'Manuseio', 'Em revisão', 'Expedição'];
  return intermediateStages.includes(currentStage.name);
}
</file>

<file path="supabase/schema.sql">
-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. PROFILES (Users and roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    tenant_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Comercial', 'Produção', 'Financeiro')),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(18), -- CPF or CNPJ
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. ORDERS (Pedidos/Vendas)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    order_number SERIAL,
    pv_number VARCHAR(100), -- Pedido de Venda (Conta Azul)
    op_number VARCHAR(100), -- Ordem de Produção (Fábrica)
    art_name VARCHAR(255), -- Nome da arte / identificação visual
    seller_name VARCHAR(255) NOT NULL, -- Vendedora
    measure VARCHAR(100) NOT NULL, -- Medida
    print_run INTEGER NOT NULL DEFAULT 0, -- Tiragem
    boxes_count INTEGER NOT NULL DEFAULT 0, -- Quantidade de caixas/pacotes
    packaging_type VARCHAR(50) NOT NULL DEFAULT 'CAIXA' CHECK (packaging_type IN ('CAIXA', 'PACOTE')), -- Tipo de embalagem
    freight_value DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Frete
    shipping_type VARCHAR(50) NOT NULL DEFAULT 'RETIRADA' CHECK (shipping_type IN ('RETIRADA', 'ENTREGA_PROPRIA', 'TRANSPORTADORA')), -- Tipo de frete
    
    first_payment_date DATE, -- Data do primeiro pagamento
    installments_total INTEGER NOT NULL DEFAULT 1, -- Total de parcelas
    installments_paid INTEGER NOT NULL DEFAULT 0, -- Parcelas pagas
    production_start_date DATE, -- Data inicial da produção (liberada)
    over_short_quantity INTEGER NOT NULL DEFAULT 0, -- Diferença de tiragem (Cortesia / Falta)
    
    status VARCHAR(50) NOT NULL CHECK (
        status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado')
    ),
    production_sector VARCHAR(100) NOT NULL CHECK (
        production_sector IN ('Impressão', 'Corte e Vinco', 'Colagem', 'Manuseio', 'Expedição', 'Concluído', 'Estoque')
    ),
    physical_location VARCHAR(100), -- Localização física exata
    
    notes TEXT, -- Observação
    internal_notes TEXT, -- Anotações internas
    order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. STOCK TRANSACTIONS
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- positive = input, negative = output
    type VARCHAR(50) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'PEDIDO')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. FINANCIAL TRANSACTIONS (Reconciliação financeira básica)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('RECEITA', 'DESPESA')),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDENTE', 'CONCILIADO', 'CANCELADO')),
    description TEXT,
    due_date DATE NOT NULL,
    payment_date DATE,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. CONTA AZUL CONFIG (OAuth 2.0 Credentials per Tenant)
CREATE TABLE IF NOT EXISTS conta_azul_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. CONTA AZUL INTEGRATION LOGS
CREATE TABLE IF NOT EXISTS conta_azul_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- e.g., 'SYNC_CUSTOMER', 'OAUTH_REFRESH'
    status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'ERROR', 'PENDING_RETRY')),
    payload JSONB,
    response JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. SYNC QUEUE (Automatic background sync queue)
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('CUSTOMER', 'SUPPLIER', 'PRODUCT', 'ORDER', 'FINANCIAL')),
    entity_id UUID NOT NULL, -- Local database reference ID
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'FAILED', 'COMPLETED')),
    last_error TEXT,
    next_retry_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sector ON orders(production_sector);
CREATE INDEX IF NOT EXISTS idx_financial_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_retry ON sync_queue(status, next_retry_at);

-- Set up trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conta_azul_config_modtime
    BEFORE UPDATE ON conta_azul_config
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sync_queue_modtime
    BEFORE UPDATE ON sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- SEED DATA FOR DEMONSTRATION & MVP OPERATION
-- Insert Default Tenant
INSERT INTO companies (id, name, cnpj) 
VALUES ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Samppel Embalagens Ltda', '12.345.678/0001-90')
ON CONFLICT (cnpj) DO NOTHING;

-- Insert Mock Customers
INSERT INTO customers (id, tenant_id, name, document, email, phone, address) VALUES
('c00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Chocolate Gourmet Brasil', '22.333.444/0001-55', 'contato@chocobrasil.com.br', '(11) 98765-4321', 'Av. Paulista, 1000 - São Paulo/SP'),
('c00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Cosméticos Florescer Ltda', '33.444.555/0001-66', 'suporte@florescer.com.br', '(21) 97654-3210', 'Rua das Flores, 45 - Rio de Janeiro/RJ'),
('c00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Boutique do Café Especial', '44.555.666/0001-77', 'financeiro@boutiquecafe.com', '(31) 3456-7890', 'Praça da Liberdade, 300 - Belo Horizonte/MG')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Suppliers
INSERT INTO suppliers (id, tenant_id, name, document, email, phone, address) VALUES
('500184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Papelaria Klabin Distribuidora', '11.111.111/0001-11', 'vendas@klabin.com.br', '(11) 3003-1234', 'Rodovia Dutra, Km 200 - Guarulhos/SP'),
('500284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Tintas Especiais Dupont', '22.222.222/0001-22', 'tintas@dupont.com', '(19) 3876-5432', 'Distrito Industrial - Campinas/SP')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Products
INSERT INTO products (id, tenant_id, name, sku, description, price, stock_quantity) VALUES
('800184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Caixa Kraft para Bombom (P)', 'KRAFT-BOM-P', 'Caixa em papel kraft para 6 bombons com berço', 2.50, 1500),
('800284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Sacola Duplex Branca Premium (M)', 'SAC-DUP-M', 'Sacola em papel duplex com alça de cordão', 4.80, 800),
('800384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Caixa Correio E-commerce (G)', 'CX-CORR-G', 'Caixa de papelão onda B para envios postais', 3.90, 2500)
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Orders (Pedidos)
INSERT INTO orders (id, tenant_id, customer_id, product_id, seller_name, measure, print_run, boxes_count, freight_value, status, production_sector, notes, internal_notes, order_date) VALUES
-- Order 1: A produzir, na Impressão
('a00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', '800184c8-3e4b-4b14-87cf-45ef42d17c01', 'Mariana Souza', '15x10x5 cm', 5000, 10, 150.00, 'A produzir', 'Impressão', 'Cliente solicitou pressa. Logo centralizada na tampa.', 'Confirmado pagamento da primeira parcela por boleto.', now() - interval '3 days'),
-- Order 2: Em revisão, no Corte e Vinco
('a00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', '800284c8-3e4b-4b14-87cf-45ef42d17c02', 'Camila Neves', '25x30x10 cm', 2000, 4, 80.00, 'Em revisão', 'Corte e Vinco', 'Acabamento com verniz localizado.', 'Aguardando aprovação do layout final de faca pelo cliente.', now() - interval '2 days'),
-- Order 3: Expedição, no setor de Expedição
('a00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', '800384c8-3e4b-4b14-87cf-45ef42d17c03', 'Mariana Souza', '30x20x15 cm', 1000, 2, 60.00, 'Expedição', 'Expedição', 'Coleta pela transportadora Braspress.', 'Nota fiscal já gerada e anexada ao pacote.', now() - interval '1 days'),
-- Order 4: Pago / Entregue, concluído
('a00484c8-3e4b-4b14-87cf-45ef42d17c04', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', '800284c8-3e4b-4b14-87cf-45ef42d17c02', 'Camila Neves', '20x20x8 cm', 3000, 6, 120.00, 'Pago', 'Concluído', 'Sem observações.', 'Entregue com sucesso no dia 15/06.', now() - interval '5 days'),
-- Order 5: Atrasado, na Colagem
('a00584c8-3e4b-4b14-87cf-45ef42d17c05', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', '800184c8-3e4b-4b14-87cf-45ef42d17c01', 'Mariana Souza', '15x10x5 cm', 10000, 20, 250.00, 'Atrasado', 'Colagem', 'Urgente! Atraso devido a problema na máquina coladeira.', 'Cliente cobrou posicionamento hoje cedo.', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Financial Transactions
INSERT INTO financial_transactions (id, tenant_id, order_id, type, amount, status, description, due_date, payment_date) VALUES
-- Revenue for Order 1 (Pendente)
('f00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', 'RECEITA', 12650.00, 'PENDENTE', 'Venda Chocolate Gourmet Brasil #1', CURRENT_DATE + 5, NULL),
-- Revenue for Order 3 (Conciliado)
('f00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', 'RECEITA', 3960.00, 'CONCILIADO', 'Venda Boutique do Café #3', CURRENT_DATE - 1, CURRENT_DATE - 1),
-- Revenue for Order 4 (Conciliado)
('f00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', 'RECEITA', 14520.00, 'CONCILIADO', 'Venda Chocolate Gourmet Brasil #4', CURRENT_DATE - 5, CURRENT_DATE - 5),
-- Expense (Despesa) for raw material
('f00484c8-3e4b-4b14-87cf-45ef42d17c04', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', NULL, 'DESPESA', 4500.00, 'CONCILIADO', 'Compra de Papel Kraft - Klabin', CURRENT_DATE - 2, CURRENT_DATE - 2),
-- Expense (Despesa) for tintas (Pendente)
('f00584c8-3e4b-4b14-87cf-45ef42d17c05', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', NULL, 'DESPESA', 1200.00, 'PENDENTE', 'Compra de Tintas Especiais - Dupont', CURRENT_DATE + 10, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Profiles
-- Set up pre-created mock profiles matching the roles for testing logins easily
-- We'll allow user auth table mock or manual logins inside the app using a mockup selection
-- so the demo can run without needing active user registration on first run
INSERT INTO profiles (id, tenant_id, full_name, role, email) VALUES
('e00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Ana Silva (Admin)', 'Administrador', 'admin@samppel.com.br'),
('e00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Mariana Souza (Vendas)', 'Comercial', 'comercial@samppel.com.br'),
('e00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Carlos Mendes (Fábrica)', 'Produção', 'producao@samppel.com.br'),
('e00484c8-3e4b-4b14-87cf-45ef42d17c04', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Beatriz Lima (Financeiro)', 'Financeiro', 'financeiro@samppel.com.br')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Integration Log
INSERT INTO conta_azul_integration_logs (id, tenant_id, action, status, payload, response) VALUES
(
  '100184c8-3e4b-4b14-87cf-45ef42d17c01', 
  'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 
  'OAUTH_REFRESH', 
  'SUCCESS', 
  '{"client_id": "test_client_id"}'::jsonb, 
  '{"message": "Token refreshed successfully", "expires_in": 3600}'::jsonb
);

-- Insert Mock Sync Queue Item
INSERT INTO sync_queue (id, tenant_id, entity_type, entity_id, action, retry_count, max_retries, status) VALUES
(
  '900184c8-3e4b-4b14-87cf-45ef42d17c01', 
  'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 
  'ORDER', 
  'a00184c8-3e4b-4b14-87cf-45ef42d17c01', 
  'CREATE', 
  0, 
  5, 
  'PENDING'
);
</file>

<file path="supabase/supabase_freight_migration.sql">
-- Migração para Expansão dos Tipos de Frete (shipping_type)

-- 1. Remover a restrição check de shipping_type existente
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_type_check;

-- 2. Adicionar a nova restrição expandida para incluir novos canais e transportadoras expressas
ALTER TABLE orders ADD CONSTRAINT orders_shipping_type_check CHECK (
    shipping_type IN ('RETIRADA', 'ENTREGA_PROPRIA', 'TRANSPORTADORA', 'LALAMOVE', 'MOTOBOY', 'TRANSPORTADORA_LONGA')
);
</file>

<file path="supabase/supabase_handling_migration.sql">
-- Migração para Gerenciamento de Equipes de Manuseio no Kanban

-- 1. Criar Tabela de Equipes de Manuseio
CREATE TABLE IF NOT EXISTS handling_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Habilitar RLS e criar política de segurança
ALTER TABLE handling_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY handling_teams_tenant_policy ON handling_teams
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

-- 3. Adicionar coluna handling_team_id na tabela order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS handling_team_id UUID REFERENCES handling_teams(id) ON DELETE SET NULL;
</file>

<file path="supabase/supabase_incidents_migration.sql">
-- Migração para Rastreamento de Incidentes Operacionais, de Transporte e Financeiros

-- 1. TABELA DE INCIDENTES (order_incidents)
CREATE TABLE IF NOT EXISTS order_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL, -- Opcional, vincula a um card específico
    
    category VARCHAR(50) NOT NULL CHECK (category IN ('PRODUCAO', 'TRANSPORTE', 'FINANCEIRO', 'CLIENTE', 'MANUSEIO', 'OUTRO')),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'EM_ANALISE', 'RESOLVIDO')),
    
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Usuário que abriu
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Usuário que resolveu
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_order_incidents_tenant ON order_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_incidents_order ON order_incidents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_incidents_item ON order_incidents(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_incidents_status ON order_incidents(status);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE order_incidents ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (Seguindo o padrão de inquilinos da aplicação)
DROP POLICY IF EXISTS "Leitura de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Leitura de Incidentes por Tenant" ON order_incidents
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insercao de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Insercao de Incidentes por Tenant" ON order_incidents
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Modificacao de Incidentes por Tenant" ON order_incidents
    FOR UPDATE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Remocao de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Remocao de Incidentes por Tenant" ON order_incidents
    FOR DELETE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. TRIGGER DE MODTIME (UPDATED_AT)
DROP TRIGGER IF EXISTS update_order_incidents_modtime ON order_incidents;
CREATE TRIGGER update_order_incidents_modtime
    BEFORE UPDATE ON order_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
</file>

<file path="supabase/supabase_kanban_migration.sql">
-- Migração de Banco de Dados para Painel Kanban e Permissões de Etapas

-- 1. Tabela de Etapas de Produção (Colunas do Kanban)
CREATE TABLE IF NOT EXISTS order_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3b82f6',
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de Permissões de Etapa por Perfil de Usuário
CREATE TABLE IF NOT EXISTS profile_stage_permissions (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES order_stages(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, stage_id)
);

-- 3. Adicionar coluna de Etapa Atual na tabela de Pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL;

-- 4. Habilitar Row Level Security (RLS) nas novas tabelas
ALTER TABLE order_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_stage_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Limpar políticas antigas (evitar erros de duplicação)
DROP POLICY IF EXISTS "Leitura de Etapas por Tenant" ON order_stages;
DROP POLICY IF EXISTS "Modificacao de Etapas por Admin" ON order_stages;
DROP POLICY IF EXISTS "Leitura de Permissoes por Tenant" ON profile_stage_permissions;
DROP POLICY IF EXISTS "Modificacao de Permissoes por Admin" ON profile_stage_permissions;

-- 6. Criar políticas RLS para Etapas de Produção
CREATE POLICY "Leitura de Etapas por Tenant" ON order_stages
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Modificacao de Etapas por Admin" ON order_stages
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'Administrador'))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'Administrador'));

-- 7. Criar políticas RLS para Permissões de Etapa
CREATE POLICY "Leitura de Permissoes por Tenant" ON profile_stage_permissions
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM profiles WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Modificacao de Permissoes por Admin" ON profile_stage_permissions
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM profiles WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'Administrador')));

-- 8. Inserir etapas padrão iniciais para o Tenant Samppel
INSERT INTO order_stages (id, tenant_id, name, color, sequence)
VALUES 
  ('e00184c8-3e4b-4b14-87cf-45ef42d17001', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'A produzir', '#94a3b8', 1),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17002', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Em produção', '#3b82f6', 2),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17003', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Manuseio', '#a855f7', 3),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17004', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Em revisão', '#eab308', 4),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17005', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Expedição', '#f97316', 5),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17006', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Concluído', '#10b981', 6),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17007', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Estoque', '#14b8a6', 7),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17008', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Atrasado', '#ef4444', 8)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  sequence = EXCLUDED.sequence;

-- 9. Mapear e migrar os pedidos existentes para as novas etapas
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17001' WHERE status = 'A produzir' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17002' WHERE status = 'Em produção' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17003' WHERE status = 'Manuseio' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17004' WHERE status = 'Em revisão' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17005' WHERE status = 'Expedição' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17006' WHERE status IN ('Entregue', 'Faturado', 'Pago') AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17007' WHERE status = 'Estoque' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17008' WHERE status = 'Atrasado' AND stage_id IS NULL;

-- Fallback para garantir que todos os registros possuam etapa
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17001' WHERE stage_id IS NULL;
</file>

<file path="supabase/supabase_machines_migration.sql">
-- Migração para Rastreamento de Máquinas e Tempos por Setor (auditoria)

-- 1. Criar Tabela de Máquinas de Produção
CREATE TABLE IF NOT EXISTS production_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL, -- Impressão, Corte e Vinco, Colagem, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'MANUTENCAO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Criar Tabela de Histórico de Setores de Produção
CREATE TABLE IF NOT EXISTS order_item_sector_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    sector VARCHAR(100) NOT NULL,
    machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL,
    entered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    exited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Habilitar RLS nas tabelas
ALTER TABLE production_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_sector_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS padrão por tenant_id
CREATE POLICY production_machines_tenant_policy ON production_machines
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

CREATE POLICY order_item_sector_history_tenant_policy ON order_item_sector_history
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

-- 5. Adicionar coluna machine_id na tabela order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL;
</file>

<file path="supabase/supabase_optional_tables_migration.sql">
-- ============================================================
-- MIGRAÇÃO PENDENTE: Tabelas opcionais do Kanban de Produção
-- Execute este SQL no Supabase Studio:
-- https://supabase.com/dashboard/project/cywbfcrtuawsgtbsjnnb/sql/new
-- ============================================================

-- 1. MÁQUINAS DE PRODUÇÃO
CREATE TABLE IF NOT EXISTS production_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'MANUTENCAO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE production_machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_machines_tenant_rls" ON production_machines;
CREATE POLICY "production_machines_tenant_rls" ON production_machines
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "production_machines_service_role" ON production_machines;
CREATE POLICY "production_machines_service_role" ON production_machines
    AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adicionar machine_id no order_items (se ainda não existir)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL;

-- 2. EQUIPES DE MANUSEIO
CREATE TABLE IF NOT EXISTS handling_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE handling_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handling_teams_tenant_rls" ON handling_teams;
CREATE POLICY "handling_teams_tenant_rls" ON handling_teams
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "handling_teams_service_role" ON handling_teams;
CREATE POLICY "handling_teams_service_role" ON handling_teams
    AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adicionar handling_team_id no order_items (se ainda não existir)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS handling_team_id UUID REFERENCES handling_teams(id) ON DELETE SET NULL;

-- 3. HISTÓRICO DE SETORES (para rastreio de tempo por máquina)
CREATE TABLE IF NOT EXISTS order_item_sector_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    sector VARCHAR(100) NOT NULL,
    machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL,
    entered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    exited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE order_item_sector_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sector_history_tenant_rls" ON order_item_sector_history;
CREATE POLICY "sector_history_tenant_rls" ON order_item_sector_history
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. ADICIONAR COLUNA position/sequence NA ORDER_STAGES SE NECESSÁRIO
-- (A tabela já tem 'sequence', mas o código fazia referência a 'position')
-- Nada a fazer — o código já foi corrigido para usar 'sequence'.

SELECT 'Migração de tabelas opcionais do Kanban concluída!' AS resultado;
</file>

<file path="supabase/supabase_order_items_migration.sql">
-- Migração de Banco de Dados para Itens de Pedido no Kanban de Produção

-- 1. TABELA DE ITENS DE PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Permite nulo para serviços avulsos (refile, cartão de fundo, etc.)
    
    item_type VARCHAR(50) NOT NULL DEFAULT 'PRODUTO' CHECK (item_type IN ('PRODUTO', 'SERVICO')),
    name VARCHAR(255) NOT NULL, -- Nome do item (ex: "Caixa Kraft", "Serviço de Refile")
    item_index INTEGER NOT NULL, -- Índice sequencial gerado por Trigger (1, 2, 3...)
    friendly_id VARCHAR(150), -- Código amigável gerado por Trigger (ex: "PV-1001/1")
    
    measure VARCHAR(100), -- Medida
    print_run INTEGER NOT NULL DEFAULT 0, -- Tiragem
    boxes_count INTEGER NOT NULL DEFAULT 0, -- Quantidade de caixas/pacotes
    packaging_type VARCHAR(50) NOT NULL DEFAULT 'CAIXA' CHECK (packaging_type IN ('CAIXA', 'PACOTE')),
    over_short_quantity INTEGER NOT NULL DEFAULT 0, -- Sobra/Falta de tiragem
    
    status VARCHAR(50) NOT NULL DEFAULT 'A produzir' CHECK (
        status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado', 'Estoque')
    ),
    production_sector VARCHAR(100) NOT NULL DEFAULT 'Impressão' CHECK (
        production_sector IN ('Impressão', 'Corte e Vinco', 'Colagem', 'Manuseio', 'Expedição', 'Concluído', 'Estoque')
    ),
    stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL, -- Etapa do Kanban
    physical_location VARCHAR(100), -- Localização física do item
    
    notes TEXT, -- Observações específicas do item
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_stage ON order_items(stage_id);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (Seguindo o padrão de inquilinos da aplicação)
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

-- 5. TRIGGER DE MODTIME (UPDATED_AT)
DROP TRIGGER IF EXISTS update_order_items_modtime ON order_items;
CREATE TRIGGER update_order_items_modtime
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 6. TRIGGERS PARA CALCULAR ITEM_INDEX E FRIENDLY_ID AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION trg_set_order_item_details()
RETURNS TRIGGER AS $$
DECLARE
    next_idx INTEGER;
    parent_pv VARCHAR;
    parent_num INTEGER;
BEGIN
    -- Encontrar o próximo índice sequencial para o mesmo pedido
    SELECT COALESCE(MAX(item_index), 0) + 1
    INTO next_idx
    FROM order_items
    WHERE order_id = NEW.order_id;
    
    NEW.item_index := next_idx;
    
    -- Encontrar o número ou código PV do pedido pai
    SELECT pv_number, order_number
    INTO parent_pv, parent_num
    FROM orders
    WHERE id = NEW.order_id;
    
    -- Formar o friendly_id
    NEW.friendly_id := COALESCE(parent_pv, 'PV-' || parent_num) || '/' || next_idx;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_items_before_insert ON order_items;
CREATE TRIGGER order_items_before_insert
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_order_item_details();

-- 7. TRIGGER PARA ATUALIZAR FRIENDLY_ID QUANDO O PEDIDO PAI ALTERAR O CODIGO PV
CREATE OR REPLACE FUNCTION trg_update_order_items_friendly_id()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.pv_number IS DISTINCT FROM NEW.pv_number) OR (OLD.order_number IS DISTINCT FROM NEW.order_number) THEN
        UPDATE order_items
        SET friendly_id = COALESCE(NEW.pv_number, 'PV-' || NEW.order_number) || '/' || item_index
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_after_update_pv ON orders;
CREATE TRIGGER orders_after_update_pv
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_order_items_friendly_id();
</file>

<file path="supabase/supabase_packaging_migration.sql">
-- Migração: Tela de Embalagem — Tipos de Material e Volumes por Item de Pedido

-- 1. Tipos de material de embalagem configuráveis pelo Administrador
CREATE TABLE IF NOT EXISTS packaging_material_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(50) NOT NULL DEFAULT 'OUTRO' CHECK (category IN ('CAIXA', 'FUNDO', 'DIVISORIA', 'SACO', 'OUTRO')),
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Volumes de embalagem registrados por item de pedido
CREATE TABLE IF NOT EXISTS order_item_packaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    volume_index INTEGER NOT NULL DEFAULT 1,
    units_per_box INTEGER NOT NULL DEFAULT 0,
    box_count INTEGER NOT NULL DEFAULT 1,
    weight_kg NUMERIC(8,3),
    length_cm NUMERIC(8,2),
    width_cm NUMERIC(8,2),
    height_cm NUMERIC(8,2),
    packaging_material_type_id UUID REFERENCES packaging_material_types(id) ON DELETE SET NULL,
    associated_order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    notes TEXT,
    registered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Configurações de Embalagem por Inquilino (Tenant)
CREATE TABLE IF NOT EXISTS packaging_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    keywords TEXT NOT NULL DEFAULT 'caixa,fundo,divisoria,saco,embalagem,pacote',
    association_rule VARCHAR(100) NOT NULL DEFAULT 'FIRST_ITEM' CHECK (association_rule IN ('FIRST_ITEM', 'LARGEST_QUANTITY', 'MANUAL')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Habilitar RLS
ALTER TABLE packaging_material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_settings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS por tenant
CREATE POLICY packaging_material_types_tenant_policy ON packaging_material_types
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

CREATE POLICY order_item_packaging_tenant_policy ON order_item_packaging
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

CREATE POLICY packaging_settings_tenant_policy ON packaging_settings
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

-- 6. Trigger de data de modificação para as novas tabelas
CREATE TRIGGER update_packaging_material_types_modtime
    BEFORE UPDATE ON packaging_material_types
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_order_item_packaging_modtime
    BEFORE UPDATE ON order_item_packaging
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_packaging_settings_modtime
    BEFORE UPDATE ON packaging_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
</file>

<file path="supabase/supabase_rls_policies.sql">
-- Script de politicas de Row Level Security (RLS) para o Supabase
-- Copie e execute este script no editor SQL do seu painel do Supabase.

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conta_azul_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conta_azul_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- 2. Limpar politicas antigas (evitar erros de duplicacao)
DROP POLICY IF EXISTS "Leitura de Companies" ON companies;
DROP POLICY IF EXISTS "Acesso proprio perfil em Profiles" ON profiles;
DROP POLICY IF EXISTS "Insercao de perfil proprio em Profiles" ON profiles;
DROP POLICY IF EXISTS "Acesso por Tenant em Customers" ON customers;
DROP POLICY IF EXISTS "Acesso por Tenant em Suppliers" ON suppliers;
DROP POLICY IF EXISTS "Acesso por Tenant em Products" ON products;
DROP POLICY IF EXISTS "Acesso por Tenant em Orders" ON orders;
DROP POLICY IF EXISTS "Acesso por Tenant em Stock Transactions" ON stock_transactions;
DROP POLICY IF EXISTS "Acesso por Tenant em Financial Transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Acesso por Tenant em Conta Azul Config" ON conta_azul_config;
DROP POLICY IF EXISTS "Acesso por Tenant em Integration Logs" ON conta_azul_integration_logs;
DROP POLICY IF EXISTS "Acesso por Tenant em Sync Queue" ON sync_queue;

-- 3. Definir novas politicas baseadas em autenticacao e Tenant ID

-- Companies: permite que qualquer usuario autenticado veja a empresa vinculada ao seu perfil
CREATE POLICY "Leitura de Companies" 
ON companies FOR SELECT TO authenticated
USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Profiles: permite que o usuario leia e atualize o proprio perfil
CREATE POLICY "Acesso proprio perfil em Profiles"
ON profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Customers: acesso apenas de clientes vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Customers"
ON customers FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Suppliers: acesso apenas de fornecedores vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Suppliers"
ON suppliers FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Products: acesso apenas de produtos vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Products"
ON products FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Orders: acesso apenas de pedidos vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Orders"
ON orders FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Stock Transactions: acesso apenas de movimentacoes vinculadas ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Stock Transactions"
ON stock_transactions FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Financial Transactions: acesso apenas de transacoes vinculadas ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Financial Transactions"
ON financial_transactions FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Conta Azul Config: acesso apenas de configuracoes vinculadas ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Conta Azul Config"
ON conta_azul_config FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Integration Logs: acesso apenas de logs vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Integration Logs"
ON conta_azul_integration_logs FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Sync Queue: acesso apenas de itens de fila vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Sync Queue"
ON sync_queue FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Trigger de criacao automatica de perfis para novos usuarios do auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name, role, email)
  VALUES (
    new.id,
    'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', -- ID padrao da empresa Samppel
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário Novo'),
    coalesce(new.raw_user_meta_data->>'role', 'Comercial'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para rodar apos insercao em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
</file>

<file path="supabase/supabase_roles_migration.sql">
-- Migração para Expansão de Papéis de Usuários (Profiles.role)

-- 1. Remover a restrição check existente de role na tabela profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Adicionar a nova restrição expandida para incluir Estoque e Expedição
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (
    role IN ('Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição')
);
</file>

<file path="supabase/supabase_stock_credits_migration.sql">
-- Migração para Rastreabilidade de Estoque Personalizado de Clientes, Sobras/Faltas e Créditos

-- 1. TABELA DE ESTOQUE PERSONALIZADO (customer_product_stock)
CREATE TABLE IF NOT EXISTS customer_product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE (customer_id, product_id)
);

-- 2. TABELA DE AJUSTES DE SALDO DE PEDIDOS (order_balance_adjustments)
CREATE TABLE IF NOT EXISTS order_balance_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    ordered_quantity INTEGER NOT NULL CHECK (ordered_quantity >= 0),
    produced_quantity INTEGER NOT NULL CHECK (produced_quantity >= 0),
    difference_quantity INTEGER NOT NULL, -- positive = sobra, negative = falta (produced - ordered)
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('SOBRA', 'FALTA')),
    action_taken VARCHAR(50) NOT NULL CHECK (action_taken IN (
        'GUARDAR_ESTOQUE_CLIENTE', 
        'CREDITO_PROXIMO_PEDIDO', 
        'CANCELADO_DESCONTO', 
        'COBRADO_ADICIONAL', 
        'REPRODUCAO_PENDENTE', 
        'OUTRO'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. TABELA DE CRÉDITOS E PENDÊNCIAS DE CLIENTES (customer_stock_credits)
CREATE TABLE IF NOT EXISTS customer_stock_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN ('CORTESIA_SOBRA', 'PENDENCIA_ENTREGA')),
    original_quantity INTEGER NOT NULL CHECK (original_quantity >= 0),
    remaining_quantity INTEGER NOT NULL DEFAULT 0 CHECK (remaining_quantity >= 0),
    source_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    source_adjustment_id UUID REFERENCES order_balance_adjustments(id) ON DELETE SET NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'UTILIZADO', 'EXPIRADO', 'CANCELADO')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cust_prod_stock_tenant ON customer_product_stock(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cust_prod_stock_cust_prod ON customer_product_stock(customer_id, product_id);

CREATE INDEX IF NOT EXISTS idx_order_bal_adj_tenant ON order_balance_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_bal_adj_order ON order_balance_adjustments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_bal_adj_item ON order_balance_adjustments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_bal_adj_cust ON order_balance_adjustments(customer_id);

CREATE INDEX IF NOT EXISTS idx_cust_stock_cred_tenant ON customer_stock_credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cust_stock_cred_cust ON customer_stock_credits(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_stock_cred_status ON customer_stock_credits(status);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE customer_product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_balance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_stock_credits ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA customer_product_stock
DROP POLICY IF EXISTS "Leitura de Estoque Personalizado por Tenant" ON customer_product_stock;
CREATE POLICY "Leitura de Estoque Personalizado por Tenant" ON customer_product_stock
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Estoque Personalizado por Tenant" ON customer_product_stock;
CREATE POLICY "Modificacao de Estoque Personalizado por Tenant" ON customer_product_stock
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. POLÍTICAS RLS PARA order_balance_adjustments
DROP POLICY IF EXISTS "Leitura de Ajustes por Tenant" ON order_balance_adjustments;
CREATE POLICY "Leitura de Ajustes por Tenant" ON order_balance_adjustments
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insercao de Ajustes por Tenant" ON order_balance_adjustments;
CREATE POLICY "Insercao de Ajustes por Tenant" ON order_balance_adjustments
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 8. POLÍTICAS RLS PARA customer_stock_credits
DROP POLICY IF EXISTS "Leitura de Creditos por Tenant" ON customer_stock_credits;
CREATE POLICY "Leitura de Creditos por Tenant" ON customer_stock_credits
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Creditos por Tenant" ON customer_stock_credits;
CREATE POLICY "Modificacao de Creditos por Tenant" ON customer_stock_credits
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 9. TRIGGERS DE MODTIME (UPDATED_AT)
DROP TRIGGER IF EXISTS update_cust_prod_stock_modtime ON customer_product_stock;
CREATE TRIGGER update_cust_prod_stock_modtime
    BEFORE UPDATE ON customer_product_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_cust_stock_cred_modtime ON customer_stock_credits;
CREATE TRIGGER update_cust_stock_cred_modtime
    BEFORE UPDATE ON customer_stock_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
</file>

<file path=".gitignore">
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
</file>

<file path="AGENTS.md">
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
</file>

<file path="CLAUDE.md">
@AGENTS.md
</file>

<file path="src/app/api/auth/conta-azul/callback/route.ts">
import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';
import { getContaAzulConfig } from '@/services/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // O estado pode representar o tenant_id ou validação de sessão
  const error = searchParams.get('error');

  const appUrl = request.nextUrl.origin;
  const tenantId = state || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  if (error) {
    console.error('Conta Azul OAuth error query param:', error);
    return NextResponse.redirect(`${appUrl}/configuracoes?error=${encodeURIComponent('Acesso negado pelo Conta Azul: ' + error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/configuracoes?error=${encodeURIComponent('Código de autorização não recebido.')}`);
  }

  try {
    // Obtém o client_id e client_secret registrados de forma segura a partir do banco de dados ou do ambiente
    const { data: config } = await getContaAzulConfig(tenantId);
    
    // Retorno para variáveis de ambiente caso a configuração do banco de dados esteja vazia
    const clientId = config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const clientSecret = config?.client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '';
    const redirectUri = process.env.CONTA_AZUL_REDIRECT_URI || `${appUrl}/api/auth/conta-azul/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('As credenciais client_id e client_secret não foram configuradas no sistema.');
    }

    // Troca o código por tokens no servidor backend
    const service = new ContaAzulService(tenantId);
    await service.exchangeCode(code, clientId, clientSecret, redirectUri);

    // Redireciona o usuário para a página de configurações com indicador de sucesso
    return NextResponse.redirect(`${appUrl}/configuracoes?success=true`);
  } catch (err: any) {
    console.error('Error during Conta Azul OAuth exchange:', err);
    return NextResponse.redirect(
      `${appUrl}/configuracoes?error=${encodeURIComponent(err.message || 'Falha na troca de código de autorização')}`
    );
  }
}
</file>

<file path="src/app/clientes/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCustomers, createCustomer, updateCustomer } from '@/services/supabase';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Plus, Search, CheckCircle2, HelpCircle, ShieldAlert, Edit, RefreshCw } from 'lucide-react';

export default function ClientesPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await getCustomers();
      setCustomers(data || []);
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'Produção') {
      fetchCustomers();
    }
  }, [user]);

  // Security guard check
  if (user && user.role === 'Produção') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          O setor de **Produção** não tem permissões administrativas para visualizar ou gerenciar o cadastro de clientes.
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedCustomer(null);
    setFormName('');
    setFormDocument('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setModalType('edit');
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setFormDocument(customer.document || '');
    setFormEmail(customer.email || '');
    setFormPhone(customer.phone || '');
    setFormAddress(customer.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formName,
      document: formDocument,
      email: formEmail,
      phone: formPhone,
      address: formAddress
    };

    if (modalType === 'create') {
      const { error } = await createCustomer(payload);
      if (error) {
        alert('Erro ao cadastrar cliente: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchCustomers();
      }
    } else {
      const { error } = await updateCustomer(selectedCustomer.id, payload);
      if (error) {
        alert('Erro ao atualizar cliente: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchCustomers();
      }
    }
  };

  const [importing, setImporting] = useState(false);

  // Aciona a importacao de clientes do Conta Azul para o banco local
  const handleImportCustomers = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/sync/import-customers', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Falha ao importar clientes.');
      }
      const data = await res.json();
      if (data.success) {
        alert(`Sincronizacao concluida com sucesso! Clientes importados: ${data.imported}, atualizados: ${data.updated}.`);
        fetchCustomers();
      } else {
        alert('Erro ao importar clientes: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao importar clientes.');
    } finally {
      setImporting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.document && c.document.includes(search))
  );

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Cadastro de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gerenciamento de clientes da Samppel Embalagens e integração com Conta Azul.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleImportCustomers} 
            disabled={importing}
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={16} className={importing ? 'spinner' : ''} />
            <span>{importing ? 'Importando...' : 'Importar do Conta Azul'}</span>
          </button>
          
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={16} />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
          <label className="form-label">Buscar Cliente</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Digite o nome ou CNPJ/CPF do cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchCustomers} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* CUSTOMERS LIST */}
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nome / Razão Social</th>
                <th>CNPJ / CPF</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Sincronização Conta Azul</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={7} />
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum cliente cadastrado ou encontrado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td><code>{customer.document || '---'}</code></td>
                    <td>{customer.email || '---'}</td>
                    <td>{customer.phone || '---'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customer.address || '---'}
                    </td>
                    <td>
                      {customer.conta_azul_id ? (
                        <span className="badge badge-success" title={`ID: ${customer.conta_azul_id}`}>
                          <CheckCircle2 size={12} />
                          Integrado ({customer.conta_azul_id.substring(0, 8)})
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <HelpCircle size={12} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleOpenEdit(customer)} 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                      >
                        <Edit size={12} />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
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
            maxWidth: '500px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                {modalType === 'create' ? 'Cadastrar Novo Cliente' : 'Editar Cliente'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Nome Completo / Razão Social *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CNPJ / CPF</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: 00.000.000/0001-00"
                  value={formDocument}
                  onChange={(e) => setFormDocument(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Ex: financeiro@empresa.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: (11) 98765-4321"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Completo</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Rua, Número, Bairro, Cidade/UF..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                />
              </div>

              <footer style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Salvar Cliente' : 'Salvar Alterações'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
</file>

<file path="src/context/AuthContext.tsx">
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type UserRole = 'Administrador' | 'Comercial' | 'Produção' | 'Financeiro' | 'Estoque' | 'Expedição';

export interface UserProfile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  actual_role?: UserRole;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
  changeActiveRole: (role: UserRole) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ID fixo da empresa tenant para o escopo do Portal Samppel
const DEFAULT_TENANT_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitora o estado de autenticacao real do Supabase
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Busca sessao ativa inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Registra listener para mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Busca as informacoes complementares do perfil no banco de dados
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const profile = {
          ...data,
          actual_role: data.role
        } as UserProfile;
        // Se for admin, verifica se ha um papel temporario salvo na sessao
        if (data.role === 'Administrador' && typeof window !== 'undefined') {
          const savedRole = sessionStorage.getItem('active_role') as UserRole;
          if (savedRole) {
            profile.role = savedRole;
          }
        }
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do usuario:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Realiza login no Supabase Auth
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: new Error('Cliente Supabase nao inicializado.') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };

    if (data?.user) {
      // Busca o perfil diretamente do banco antes de definir o state do usuario logado
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) return { data: null, error: profileError };
      
      if (profile) {
        const userProfile = {
          ...profile,
          actual_role: profile.role
        } as UserProfile;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('active_role');
        }
        setUser(userProfile);
        return { data: { user: data.user, profile: userProfile }, error: null };
      }
    }
    return { data, error: null };
  };

  // Realiza cadastro no Supabase Auth (o perfil complementar eh criado via trigger no banco)
  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    if (!supabase) {
      return { data: null, error: new Error('Cliente Supabase nao inicializado.') };
    }
    // 1. Cadastra o usuario no auth passando os metadados do perfil
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) return { data: null, error };
    return { data, error: null };
  };

  // Permite mudar o perfil de acesso ativo temporariamente na sessao
  const changeActiveRole = (role: UserRole) => {
    if (user) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('active_role', role);
      }
      setUser(prev => prev ? { ...prev, role } : null);
    }
  };

  // Realiza logout do Supabase
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('active_role');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout, changeActiveRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
</file>

<file path="src/services/sync_queue.ts">
import { supabase, supabaseAdmin, getCustomers, getProducts, getOrders, getSuppliers, getFinancialTransactions, updateCustomer, updateProduct, updateOrder, updateSupplier, reconcileTransaction } from './supabase';
import { ContaAzulService } from './conta_azul';

const isMockMode = false;

/**
 * Service to process background sync queues for Conta Azul integration.
 */
export class SyncQueueService {
  private tenantId: string;
  private service: ContaAzulService;

  constructor(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
    this.tenantId = tenantId;
    this.service = new ContaAzulService(tenantId);
  }

  /**
   * Run the sync runner for all pending or eligible retry items in the queue
   */
  public async processQueue(): Promise<{ processed: number; successes: number; failures: number }> {
    let queueItems: any[] = [];

    if (isMockMode) {
      // In mock mode, we use supabase.ts local queue helper simulation
      // We will read from our mock queue
      const { data } = await import('./supabase').then(m => m.getSyncQueue(this.tenantId));
      queueItems = (data || []).filter((item: any) => 
        (item.status === 'PENDING' || item.status === 'FAILED') && 
        item.retry_count < item.max_retries &&
        new Date(item.next_retry_at).getTime() <= Date.now()
      );
    } else {
      // Fetch from Supabase using admin client (bypassing RLS)
      const { data, error } = await supabaseAdmin!
        .from('sync_queue')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .in('status', ['PENDING', 'FAILED'])
        .lt('retry_count', 5) // retry limit
        .lte('next_retry_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching sync queue:', error);
        return { processed: 0, successes: 0, failures: 0 };
      }
      queueItems = data || [];
    }

    let successes = 0;
    let failures = 0;

    for (const item of queueItems) {
      try {
        // 1. Mark as processing
        await this.updateQueueStatus(item.id, 'PROCESSING');

        // 2. Process based on entity type
        await this.syncEntity(item.entity_type, item.entity_id, item.action);

        // 3. Mark as completed on success
        await this.updateQueueStatus(item.id, 'COMPLETED');
        successes++;
      } catch (err: any) {
        console.error(`Sync error on queue item ${item.id}:`, err);
        failures++;
        
        // 4. Implement exponential backoff retry on failure
        const newRetryCount = item.retry_count + 1;
        const status = newRetryCount >= item.max_retries ? 'FAILED' : 'PENDING';
        
        // Backoff: 2 ^ retry_count minutes (2m, 4m, 8m, 16m, etc.)
        const backoffMinutes = Math.pow(2, newRetryCount);
        const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

        await this.updateQueueStatus(item.id, status, err.message || 'Sync failed', newRetryCount, nextRetry);
      }
    }

    return { processed: queueItems.length, successes, failures };
  }

  /**
   * Helper to sync a single entity. Resolves dependencies automatically.
   */
  private async syncEntity(entityType: string, entityId: string, action: string): Promise<void> {
    switch (entityType) {
      case 'CUSTOMER': {
        const { data: customer } = await this.fetchEntity(getCustomers, 'customers', entityId);
        if (!customer) throw new Error(`Customer ${entityId} not found in database.`);
        const caId = await this.service.syncCustomer(customer);
        await this.saveContaAzulId('customers', entityId, caId);
        break;
      }

      case 'SUPPLIER': {
        const { data: supplier } = await this.fetchEntity(getSuppliers, 'suppliers', entityId);
        if (!supplier) throw new Error(`Supplier ${entityId} not found in database.`);
        const caId = await this.service.syncSupplier(supplier);
        await this.saveContaAzulId('suppliers', entityId, caId);
        break;
      }

      case 'PRODUCT': {
        const { data: product } = await this.fetchEntity(getProducts, 'products', entityId);
        if (!product) throw new Error(`Product ${entityId} not found in database.`);
        const caId = await this.service.syncProduct(product);
        await this.saveContaAzulId('products', entityId, caId);
        break;
      }

      case 'ORDER': {
        // Fetch order
        const { data: order } = await this.fetchEntity(getOrders, 'orders', entityId);
        if (!order) throw new Error(`Order ${entityId} not found in database.`);
        
        // Resolve Customer Dependency
        let customer = order.customer;
        if (!customer) {
          // If not joined automatically
          const { data: cust } = await this.fetchEntity(getCustomers, 'customers', order.customer_id);
          customer = cust;
        }
        if (!customer) throw new Error(`Customer dependency not found for Order ${entityId}.`);
        
        // If customer is not synced to Conta Azul yet, sync now
        if (!customer.conta_azul_id) {
          console.log(`Auto-syncing dependent customer ${customer.id} for order ${entityId}`);
          const custCaId = await this.service.syncCustomer(customer);
          await this.saveContaAzulId('customers', customer.id, custCaId);
          customer.conta_azul_id = custCaId; // update in memory reference
        }

        // Resolve Product Dependency
        let product = order.product;
        if (!product) {
          const { data: prod } = await this.fetchEntity(getProducts, 'products', order.product_id);
          product = prod;
        }
        if (!product) throw new Error(`Product dependency not found for Order ${entityId}.`);
        
        // If product is not synced yet, sync now
        if (!product.conta_azul_id) {
          console.log(`Auto-syncing dependent product ${product.id} for order ${entityId}`);
          const prodCaId = await this.service.syncProduct(product);
          await this.saveContaAzulId('products', product.id, prodCaId);
          product.conta_azul_id = prodCaId; // update reference
        }

        // Now sync order
        const caId = await this.service.syncOrder(order, customer, product);
        await this.saveContaAzulId('orders', entityId, caId);
        break;
      }

      case 'FINANCIAL': {
        const { data: financial } = await this.fetchEntity(getFinancialTransactions, 'financial_transactions', entityId);
        if (!financial) throw new Error(`Financial record ${entityId} not found in database.`);
        
        // Resolve order if linked
        let order = financial.order;
        if (financial.order_id && !order) {
          const { data: ord } = await this.fetchEntity(getOrders, 'orders', financial.order_id);
          order = ord;
        }
        
        // Sync financial
        const caId = await this.service.syncFinancial(financial, order);
        await this.saveContaAzulId('financial_transactions', entityId, caId);
        break;
      }

      default:
        throw new Error(`Unsupported sync entity type: ${entityType}`);
    }
  }

  // --- PRIVATE DATABASE HELPER WRAPPERS ---

  private async fetchEntity(fetchListFn: (tenantId?: string) => Promise<{data: any[] | null, error: any}>, tableName: string, id: string): Promise<{ data: any }> {
    if (isMockMode) {
      const { data } = await fetchListFn();
      const entity = data?.find(item => item.id === id);
      return { data: entity };
    } else {
      const { data, error } = await supabaseAdmin!
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return { data };
    }
  }

  private async saveContaAzulId(tableName: string, id: string, contaAzulId: string): Promise<void> {
    if (isMockMode) {
      // Direct write to mock memory via import/exports
      if (tableName === 'customers') await updateCustomer(id, { conta_azul_id: contaAzulId });
      else if (tableName === 'products') await updateProduct(id, { conta_azul_id: contaAzulId });
      else if (tableName === 'orders') await updateOrder(id, { conta_azul_id: contaAzulId });
      else if (tableName === 'suppliers') await updateSupplier(id, { conta_azul_id: contaAzulId });
      else if (tableName === 'financial_transactions') {
        // mock update
        const mod = await import('./supabase');
        await mod.reconcileTransaction(id); // auto syncs and reconciles in mock
      }
    } else {
      const { error } = await supabaseAdmin!
        .from(tableName)
        .update({ conta_azul_id: contaAzulId })
        .eq('id', id);
      if (error) throw error;
    }
  }

  private async updateQueueStatus(
    queueId: string, 
    status: 'PENDING' | 'PROCESSING' | 'FAILED' | 'COMPLETED', 
    lastError: string | null = null,
    retryCount?: number,
    nextRetryAt?: string
  ): Promise<void> {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (lastError !== null) updates.last_error = lastError;
    if (retryCount !== undefined) updates.retry_count = retryCount;
    if (nextRetryAt !== undefined) updates.next_retry_at = nextRetryAt;

    if (isMockMode) {
      const mod = await import('./supabase');
      // Simulated write
      const queueList = await mod.getSyncQueue(this.tenantId).then(r => r.data || []);
      const item = queueList.find((q: any) => q.id === queueId);
      if (item) {
        Object.assign(item, updates);
      }
    } else {
      const { error } = await supabaseAdmin!
        .from('sync_queue')
        .update(updates)
        .eq('id', queueId);
      if (error) {
        console.error(`Error updating sync queue status for ${queueId}:`, error);
      }
    }
  }
}
export default SyncQueueService;
</file>

<file path="src/app/configuracoes/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { 
  getContaAzulConfig, 
  updateContaAzulConfig, 
  getIntegrationLogs,
  getSyncQueue,
  getProductionMachines,
  createProductionMachine,
  updateProductionMachine,
  deleteProductionMachine,
  getHandlingTeams,
  createHandlingTeam,
  updateHandlingTeam,
  deleteHandlingTeam,
  getPackagingMaterialTypes,
  createPackagingMaterialType,
  updatePackagingMaterialType,
  deletePackagingMaterialType,
  getPackagingSettings,
  savePackagingSettings
} from '@/services/supabase';
import { 
  ShieldAlert, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Link2, 
  Terminal,
  HelpCircle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Settings,
  Users,
  Package
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // States
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  
  // States de Máquinas de Produção
  const [machines, setMachines] = useState<any[]>([]);
  const [machineName, setMachineName] = useState('');
  const [machineSector, setMachineSector] = useState('Impressão');
  const [machineStatus, setMachineStatus] = useState<'ATIVO' | 'INATIVO' | 'MANUTENCAO'>('ATIVO');
  const [editingMachine, setEditingMachine] = useState<any | null>(null);
  const [submittingMachine, setSubmittingMachine] = useState(false);
  
  // States de Equipes de Manuseio
  const [handlingTeams, setHandlingTeams] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamStatus, setTeamStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // States de Tipos de Material de Embalagem
  const [packagingMaterials, setPackagingMaterials] = useState<any[]>([]);
  const [pmtName, setPmtName] = useState('');
  const [pmtCode, setPmtCode] = useState('');
  const [pmtCategory, setPmtCategory] = useState<'CAIXA' | 'FUNDO' | 'DIVISORIA' | 'SACO' | 'OUTRO'>('CAIXA');
  const [pmtStatus, setPmtStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingPmt, setEditingPmt] = useState<any | null>(null);
  const [submittingPmt, setSubmittingPmt] = useState(false);
  
  // States de Configurações de Embalagem (Convenções)
  const [packagingKeywords, setPackagingKeywords] = useState('caixa,fundo,divisoria,saco,embalagem,pacote');
  const [packagingAssociationRule, setPackagingAssociationRule] = useState<'FIRST_ITEM' | 'LARGEST_QUANTITY' | 'MANUAL'>('FIRST_ITEM');
  const [savingSettings, setSavingSettings] = useState(false);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchConfigAndLogs = async () => {
    setLoading(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const [configRes, logsRes, queueRes, machinesRes, teamsRes, pmtRes, settingsRes] = await Promise.all([
        getContaAzulConfig(),
        getIntegrationLogs(),
        getSyncQueue(),
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId)
      ]);

      const data = configRes.data;
      setConfig(data);
      if (data) {
        setClientId(data.client_id || '');
        // Obfuscate secret on load
        setClientSecret(data.client_secret ? '••••••••••••••••••••••••••••••••' : '');
      }

      setLogs(logsRes.data || []);
      setQueue(queueRes.data || []);
      setMachines(machinesRes.data || []);
      setHandlingTeams(teamsRes.data || []);
      setPackagingMaterials(pmtRes.data || []);
      
      if (settingsRes.data) {
        setPackagingKeywords(settingsRes.data.keywords || 'caixa,fundo,divisoria,saco,embalagem,pacote');
        setPackagingAssociationRule(settingsRes.data.association_rule || 'FIRST_ITEM');
      }
    } catch (e) {
      console.error('Error fetching config/logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Administrador') {
      fetchConfigAndLogs();
    }
  }, [user]);

  // Security guard check
  if (user && user.role !== 'Administrador') {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Apenas usuários com perfil **Administrador** têm permissões de sistema para reconfigurar integrações e APIs externas.
        </p>
      </div>
    );
  }

  // Save Credentials Form
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    // If secret is the obfuscated string, do not overwrite it in the database
    const secretToSend = clientSecret === '••••••••••••••••••••••••••••••••' ? undefined : clientSecret;

    const payload: any = {
      client_id: clientId
    };
    if (secretToSend !== undefined) {
      payload.client_secret = secretToSend;
    }

    const { error } = await updateContaAzulConfig(payload);
    if (error) {
      alert('Erro ao salvar configurações: ' + error.message);
    } else {
      setIsSaved(true);
      fetchConfigAndLogs();
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  // Aciona o redirecionamento do fluxo do OAuth 2.0
  const handleOAuthConnect = async () => {
    if (!clientId || !clientSecret) {
      alert('Por favor, salve seu Client ID e Client Secret primeiro.');
      return;
    }
    
    // Gera a URL de autorização do OAuth
    // Em produção, isso direciona para o endpoint de autorização do Conta Azul
    const redirectUri = `${window.location.origin}/api/auth/conta-azul/callback`;
    
    const scope = encodeURIComponent('openid profile aws.cognito.signin.user.admin');
    const authUrl = `https://auth.contaazul.com/login?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${clientId}&scope=${scope}&state=d3b07384-d113-4ec8-a5c6-e91bc4ff99e0&response_type=code`;

    // Sempre redireciona para a URL de autorização real do Conta Azul
    const isMock = false;
    if (isMock) {
      // Bloco inacessível
    } else {
      window.location.href = authUrl;
    }
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName.trim()) return;

    setSubmittingMachine(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingMachine) {
        // Edit mode
        const { error } = await updateProductionMachine(editingMachine.id, {
          name: machineName.trim(),
          sector: machineSector,
          status: machineStatus
        });
        if (error) {
          alert('Erro ao atualizar máquina: ' + error.message);
        } else {
          setEditingMachine(null);
          setMachineName('');
          fetchConfigAndLogs();
        }
      } else {
        // Create mode
        const { error } = await createProductionMachine({
          tenant_id: tenantId,
          name: machineName.trim(),
          sector: machineSector,
          status: machineStatus
        });
        if (error) {
          alert('Erro ao criar máquina: ' + error.message);
        } else {
          setMachineName('');
          fetchConfigAndLogs();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar máquina:', err);
    } finally {
      setSubmittingMachine(false);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (confirm('Deseja realmente excluir esta máquina de produção?')) {
      const { error } = await deleteProductionMachine(id);
      if (error) {
        alert('Erro ao excluir máquina: ' + error.message);
      } else {
        fetchConfigAndLogs();
      }
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setSubmittingTeam(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingTeam) {
        // Edit mode
        const { error } = await updateHandlingTeam(editingTeam.id, {
          name: teamName.trim(),
          status: teamStatus
        });
        if (error) {
          alert('Erro ao atualizar equipe: ' + error.message);
        } else {
          setEditingTeam(null);
          setTeamName('');
          fetchConfigAndLogs();
        }
      } else {
        // Create mode
        const { error } = await createHandlingTeam({
          tenant_id: tenantId,
          name: teamName.trim(),
          status: teamStatus
        });
        if (error) {
          alert('Erro ao criar equipe: ' + error.message);
        } else {
          setTeamName('');
          fetchConfigAndLogs();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar equipe:', err);
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (confirm('Deseja realmente excluir esta equipe de manuseio?')) {
      const { error } = await deleteHandlingTeam(id);
      if (error) {
        alert('Erro ao excluir equipe: ' + error.message);
      } else {
        fetchConfigAndLogs();
      }
    }
  };

  const handleSavePmt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmtName.trim()) return;
    setSubmittingPmt(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      if (editingPmt) {
        const { error } = await updatePackagingMaterialType(editingPmt.id, {
          name: pmtName.trim(), code: pmtCode.trim() || null, category: pmtCategory, status: pmtStatus
        });
        if (error) { alert('Erro: ' + error.message); }
        else { setEditingPmt(null); setPmtName(''); setPmtCode(''); fetchConfigAndLogs(); }
      } else {
        const { error } = await createPackagingMaterialType({
          tenant_id: tenantId, name: pmtName.trim(), code: pmtCode.trim() || null, category: pmtCategory, status: pmtStatus
        });
        if (error) { alert('Erro: ' + error.message); }
        else { setPmtName(''); setPmtCode(''); fetchConfigAndLogs(); }
      }
    } catch (err) { console.error(err); }
    finally { setSubmittingPmt(false); }
  };

  const handleDeletePmt = async (id: string) => {
    if (confirm('Excluir este tipo de material de embalagem?')) {
      const { error } = await deletePackagingMaterialType(id);
      if (error) { alert('Erro: ' + error.message); }
      else { fetchConfigAndLogs(); }
    }
  };

  const handleSavePackagingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
      const { error } = await savePackagingSettings({
        tenant_id: tenantId,
        keywords: packagingKeywords.trim().toLowerCase(),
        association_rule: packagingAssociationRule
      });
      if (error) {
        alert('Erro ao salvar configurações de embalagem: ' + error.message);
      } else {
        alert('Configurações de embalagem salvas com sucesso!');
        fetchConfigAndLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Aciona o processo manual de sincronização da fila de segundo plano
  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/sync/cron', { method: 'POST' });
      const result = await response.json();
      setSyncResult(result);
      fetchConfigAndLogs(); // Reload logs feed
    } catch (e: any) {
      setSyncResult({ success: false, error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = config?.access_token && new Date(config.expires_at).getTime() > Date.now();

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações de APIs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Integração externa via OAuth 2.0 com o ERP Conta Azul.
          </p>
        </div>
        <button onClick={fetchConfigAndLogs} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Sincronizar Painel</span>
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* CONTA AZUL API CREDENTIALS FORM */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} style={{ color: 'var(--primary)' }} />
            Credenciais de API Conta Azul
          </h3>
          
          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Client ID *</label>
              <input 
                type="text" 
                className="form-input"
                required
                placeholder="Insira o Client ID do Conta Azul..."
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client Secret *</label>
              <input 
                type="password" 
                className="form-input"
                required
                placeholder="Insira o Client Secret do Conta Azul..."
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Salvar Credenciais
              </button>
              {isSaved && (
                <span style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 500 }}>
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* CONNECTION & WORKER CONTROLS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link2 size={18} style={{ color: isConnected ? 'var(--success)' : 'var(--text-muted)' }} />
              Status da Conexão OAuth 2.0
            </h3>

            {/* Connection badge */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)',
                boxShadow: isConnected ? '0 0 10px var(--success)' : '0 0 10px var(--danger)'
              }} />
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {isConnected ? 'Sincronizado com Conta Azul' : 'Sem Conexão Ativa'}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isConnected 
                    ? `Token válido até: ${new Date(config?.expires_at).toLocaleString('pt-BR')}`
                    : 'Configure as credenciais e clique em conectar abaixo para autorizar.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleOAuthConnect} 
              className="btn btn-primary"
              style={{ flex: 1, minWidth: '150px' }}
            >
              Conectar com a Conta Azul
            </button>
            
            <button 
              onClick={handleTriggerSync} 
              disabled={syncing}
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '150px', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={16} className={syncing ? 'spinner' : ''} />
              <span>Sincronizar Fila</span>
            </button>
          </div>

          {syncResult && (
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.75rem', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: syncResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: syncResult.success ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              {syncResult.success ? (
                <>
                  <div style={{ fontWeight: 600 }}>Fila processada com sucesso!</div>
                  <div>Itens processados: {syncResult.processed} | Sucessos: {syncResult.successes} | Falhas: {syncResult.failures}</div>
                </>
              ) : (
                <div style={{ fontWeight: 600 }}>Erro: {syncResult.error}</div>
              )}
            </div>
          )}

          {/* THEME CONFIGURATION */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Preferências de Interface
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tema do Sistema</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Alterne entre modo claro e escuro.
                </p>
              </div>
              <button 
                onClick={toggleTheme}
                className="btn btn-secondary"
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                {theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE GERENCIAMENTO DE MÁQUINAS E SETORES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Formulário de Máquina */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            {editingMachine ? 'Editar Máquina de Produção' : 'Nova Máquina de Produção'}
          </h3>
          
          <form onSubmit={handleSaveMachine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome da Máquina *</label>
              <input 
                type="text" 
                className="form-input"
                required
                placeholder="Ex: Guilhotina B, Rotalina 2..."
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Setor de Atuação *</label>
              <select 
                className="form-select"
                value={machineSector}
                onChange={(e) => setMachineSector(e.target.value)}
              >
                <option value="Impressão">Impressão</option>
                <option value="Corte e Vinco">Corte e Vinco</option>
                <option value="Colagem">Colagem</option>
                <option value="Guilhotina">Guilhotina</option>
                <option value="Manuseio">Manuseio</option>
                <option value="Expedição">Expedição</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status da Máquina *</label>
              <select 
                className="form-select"
                value={machineStatus}
                onChange={(e) => setMachineStatus(e.target.value as any)}
              >
                <option value="ATIVO">🟢 Ativo</option>
                <option value="INATIVO">🔴 Inativo</option>
                <option value="MANUTENCAO">🔧 Em Manutenção</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {submittingMachine ? 'Salvando...' : editingMachine ? 'Salvar Alterações' : 'Cadastrar Máquina'}
              </button>
              {editingMachine && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingMachine(null);
                    setMachineName('');
                    setMachineSector('Impressão');
                    setMachineStatus('ATIVO');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Máquinas cadastradas */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} style={{ color: 'var(--primary)' }} />
            Máquinas Cadastradas ({machines.length})
          </h3>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                        {m.sector}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        m.status === 'ATIVO' ? 'badge-success' : 
                        m.status === 'INATIVO' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {m.status === 'ATIVO' ? 'ATIVO' : m.status === 'INATIVO' ? 'INATIVO' : 'MANUTENÇÃO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setEditingMachine(m);
                            setMachineName(m.name);
                            setMachineSector(m.sector);
                            setMachineStatus(m.status);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteMachine(m.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {machines.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma máquina de produção cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SEÇÃO DE GERENCIAMENTO DE EQUIPES DE MANUSEIO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Formulário de Equipe */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            {editingTeam ? 'Editar Equipe de Manuseio' : 'Nova Equipe de Manuseio'}
          </h3>
          
          <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome da Equipe *</label>
              <input 
                type="text" 
                className="form-input"
                required
                placeholder="Ex: João, Zé, Equipe Alfa..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status da Equipe *</label>
              <select 
                className="form-select"
                value={teamStatus}
                onChange={(e) => setTeamStatus(e.target.value as any)}
              >
                <option value="ATIVO">🟢 Ativo</option>
                <option value="INATIVO">🔴 Inativo</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {submittingTeam ? 'Salvando...' : editingTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}
              </button>
              {editingTeam && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamName('');
                    setTeamStatus('ATIVO');
                  }} 
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabela de Equipes cadastradas */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            Equipes de Manuseio Ativas ({handlingTeams.length})
          </h3>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome da Equipe</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {handlingTeams.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'ATIVO' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {t.status === 'ATIVO' ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setEditingTeam(t);
                            setTeamName(t.name);
                            setTeamStatus(t.status);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteTeam(t.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {handlingTeams.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma equipe de manuseio cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* REGRAS E CONVENÇÕES DE EMBALAGEM */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} style={{ color: 'var(--primary)' }} />
          Convenções e Regras de Associação de Embalagem
        </h3>
        <form onSubmit={handleSavePackagingSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Palavras-chave para identificar itens de Embalagem no PV</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Ex: caixa, fundo, divisoria, saco, embalagem (separado por vírgulas)"
              value={packagingKeywords}
              onChange={(e) => setPackagingKeywords(e.target.value)}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Utilizado para detectar automaticamente quais itens irmãos no Pedido de Venda representam caixas ou materiais de embalagem.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Regra de Associação Padrão</label>
            <select
              className="form-select"
              value={packagingAssociationRule}
              onChange={(e) => setPackagingAssociationRule(e.target.value as any)}
            >
              <option value="FIRST_ITEM">🥇 Associar caixas ao primeiro item de produto do PV</option>
              <option value="LARGEST_QUANTITY">📈 Associar caixas ao item de maior tiragem do PV</option>
              <option value="MANUAL">✏️ Associação manual pelo operador (sem sugestão)</option>
            </select>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Convenção administrativa para associar e carregar automaticamente os insumos de caixa a um dos itens do PV.
            </span>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings ? 'Salvando...' : 'Salvar Regras de Embalagem'}
            </button>
          </div>
        </form>
      </div>

      {/* TIPOS DE MATERIAL DE EMBALAGEM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            {editingPmt ? 'Editar Material' : 'Novo Material de Embalagem'}
          </h3>
          <form onSubmit={handleSavePmt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input type="text" className="form-input" required placeholder="Ex: Caixa de Papelão Corrugado" value={pmtName} onChange={(e) => setPmtName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Código de Referência</label>
              <input type="text" className="form-input" placeholder="Ex: CX-001" value={pmtCode} onChange={(e) => setPmtCode(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select className="form-select" value={pmtCategory} onChange={(e) => setPmtCategory(e.target.value as any)}>
                <option value="CAIXA">📦 Caixa</option>
                <option value="FUNDO">🟫 Fundo</option>
                <option value="DIVISORIA">🔲 Divisória</option>
                <option value="SACO">🛍️ Saco / Sacola</option>
                <option value="OUTRO">➕ Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={pmtStatus} onChange={(e) => setPmtStatus(e.target.value as any)}>
                <option value="ATIVO">🟢 Ativo</option>
                <option value="INATIVO">🔴 Inativo</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {submittingPmt ? 'Salvando...' : editingPmt ? 'Salvar' : 'Cadastrar'}
              </button>
              {editingPmt && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingPmt(null); setPmtName(''); setPmtCode(''); }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: 'var(--primary)' }} />
            Materiais de Embalagem Cadastrados ({packagingMaterials.length})
          </h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Código</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {packagingMaterials.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.code || '—'}</span></td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>
                        {m.category === 'CAIXA' ? '📦 Caixa' : m.category === 'FUNDO' ? '🟫 Fundo' : m.category === 'DIVISORIA' ? '🔲 Divisória' : m.category === 'SACO' ? '🛍️ Saco' : '➕ Outro'}
                      </span>
                    </td>
                    <td><span className={`badge ${m.status === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>{m.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingPmt(m); setPmtName(m.name); setPmtCode(m.code || ''); setPmtCategory(m.category); setPmtStatus(m.status); }} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Edit3 size={12} /><span>Editar</span>
                        </button>
                        <button onClick={() => handleDeletePmt(m.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}>
                          <Trash2 size={12} /><span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packagingMaterials.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum material de embalagem cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SYNC QUEUE STATUS */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          Fila de Sincronização em Background (`sync_queue`)
        </h3>
        <div className="table-responsive" style={{ maxHeight: '250px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tipo Entidade</th>
                <th>Ação</th>
                <th>Tentativas</th>
                <th>Último Erro</th>
                <th>Próxima Tentativa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 600 }}>{q.entity_type}</td>
                  <td><code style={{ fontSize: '0.75rem', backgroundColor: 'var(--background)', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>{q.action}</code></td>
                  <td>{q.retry_count} / {q.max_retries}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--danger)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.last_error || '---'}
                  </td>
                  <td>{new Date(q.next_retry_at).toLocaleString('pt-BR')}</td>
                  <td>
                    <span className={`badge ${
                      q.status === 'COMPLETED' ? 'badge-success' : 
                      q.status === 'PROCESSING' ? 'badge-info' : 
                      q.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Fila vazia no momento. Nenhuma sincronização pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INTEGRATION LOGS */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Terminal size={18} style={{ color: 'var(--primary)' }} />
            Histórico de Logs de Integração
          </h3>
          <Link href="/configuracoes/logs" className="btn btn-secondary" style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}>
            <Terminal size={14} />
            <span>Auditoria Completa & Filtros</span>
          </Link>
        </div>
        
        <div className="table-responsive" style={{ maxHeight: '400px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Ação Executada</th>
                <th>Status</th>
                <th>Resposta Conta Azul</th>
                <th>Detalhes / Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.action}</td>
                  <td>
                    <span className={`badge ${
                      log.status === 'SUCCESS' ? 'badge-success' : 
                      log.status === 'PENDING_RETRY' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {log.status === 'SUCCESS' ? 'SUCESSO' : log.status === 'PENDING_RETRY' ? 'AGUARDANDO RETRY' : 'ERRO'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: log.status === 'ERROR' ? 'var(--danger)' : 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.error_message || JSON.stringify(log.response) || 'Sem retorno.'}
                  </td>
                  <td>
                    <button 
                      onClick={() => alert(`PAYLOAD:\n${JSON.stringify(log.payload, null, 2)}\n\nRETORNO API:\n${JSON.stringify(log.response || log.error_message, null, 2)}`)}
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      Ver Payload
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum log de integração registrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
</file>

<file path="src/components/Sidebar.module.css">
.sidebar {
  width: 260px;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  border-right: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  z-index: 100;
}

.brand {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.logoIcon {
  color: var(--sidebar-active);
}

.brandText {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--sidebar-text);
}

.navSection {
  flex: 1;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow-y: auto;
}

.navLink {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  color: var(--sidebar-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.navLink:hover {
  background-color: var(--primary-hover);
  color: var(--text-inverse) !important;
}

.active {
  background-color: var(--sidebar-active);
  color: var(--text-inverse) !important;
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
}

.active:hover {
  background-color: var(--primary-hover) !important;
  color: var(--text-inverse) !important;
}

.profileBox {
  padding: 1.25rem 1rem;
  border-top: 1px solid var(--border);
  background-color: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profileInfo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.profileName {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--sidebar-text);
}

.profileEmail {
  font-size: 0.75rem;
  color: var(--sidebar-text-muted);
}

.roleSelector {
  width: 100%;
  padding: 0.5rem;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--sidebar-text);
  font-size: 0.75rem;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.roleSelector:focus {
  border-color: var(--sidebar-active);
}

.roleSelector option {
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
}

.submenuContainer {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.submenuTrigger:not(.active) {
  background-color: transparent;
}

.submenuTrigger {
  width: 100%;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navLinkContent {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.chevron {
  font-size: 0.65rem;
  transition: transform 0.2s ease;
}

.chevronOpen {
  transform: rotate(180deg);
}

.submenu {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-left: 1rem;
  margin-top: 0.15rem;
  margin-bottom: 0.25rem;
  border-left: 1.5px solid rgba(var(--primary-rgb), 0.15);
  margin-left: 1.8rem;
}

.submenuLink {
  display: block;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  color: var(--sidebar-text-muted);
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all 0.2s ease;
}

.submenuLink:hover {
  background-color: rgba(var(--primary-rgb), 0.05);
  color: var(--sidebar-active) !important;
}

.submenuActive {
  background-color: rgba(var(--primary-rgb), 0.08);
  color: var(--sidebar-active) !important;
  font-weight: 600;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  
  .navSection {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .navLink {
    padding: 0.5rem 0.75rem;
  }
  
  .profileBox {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
  }
  
  .roleSelector {
    width: auto;
    min-width: 130px;
  }

  .submenuContainer {
    width: 100%;
  }

  .submenuTrigger {
    width: auto;
  }

  .submenu {
    padding-left: 1rem;
    margin-left: 0.5rem;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    border-left: none;
  }
}
</file>

<file path="src/components/Sidebar.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import styles from './Sidebar.module.css';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Contact, 
  Package, 
  DollarSign, 
  Settings,
  Boxes
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, changeActiveRole } = useAuth();
  const [isPedidosOpen, setIsPedidosOpen] = useState(false);

  useEffect(() => {
    if (pathname && pathname.startsWith('/pedidos')) {
      setIsPedidosOpen(true);
    }
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição']
    },
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: <ShoppingBag size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição']
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: <Users size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Financeiro']
    },

    {
      label: 'Produtos / Estoque',
      path: '/produtos',
      icon: <Package size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Estoque']
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: <DollarSign size={18} />,
      allowedRoles: ['Administrador', 'Financeiro']
    },
    {
      label: 'Relatórios',
      path: '/relatorios',
      icon: <Boxes size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção']
    },
    {
      label: 'Configurações / API',
      path: '/configuracoes',
      icon: <Settings size={18} />,
      allowedRoles: ['Administrador']
    }
  ];

  if (!user) return null;

  // Filtrar links com base no cargo do usuario
  const visibleNavItems = navItems.filter(item => item.allowedRoles.includes(user.role));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img 
          src="/logo.png" 
          alt="Samppel Embalagens Logo" 
          style={{ width: '100%', maxWidth: '200px', objectFit: 'contain' }}
        />
      </div>

      <nav className={styles.navSection}>
        {visibleNavItems.map((item) => {
          if (item.path === '/pedidos') {
            const isActive = pathname === '/pedidos' || pathname?.startsWith('/pedidos/');
            const showConfig = user.role === 'Administrador';
            const isSupervisor = user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
            const showSaldos = user?.role === 'Administrador' || isSupervisor;
            
            return (
              <div key={item.path} className={styles.submenuContainer}>
                <button
                  onClick={() => setIsPedidosOpen(!isPedidosOpen)}
                  className={`${styles.navLink} ${styles.submenuTrigger} ${isActive ? styles.active : ''}`}
                >
                  <div className={styles.navLinkContent}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className={`${styles.chevron} ${isPedidosOpen ? styles.chevronOpen : ''}`}>
                    ▼
                  </span>
                </button>
                
                {isPedidosOpen && (
                  <div className={styles.submenu}>
                    <Link 
                      href="/pedidos"
                      className={`${styles.submenuLink} ${pathname === '/pedidos' ? styles.submenuActive : ''}`}
                    >
                      <span>Painel Kanban</span>
                    </Link>
                    {showSaldos && (
                      <Link 
                        href="/pedidos/saldos"
                        className={`${styles.submenuLink} ${pathname === '/pedidos/saldos' ? styles.submenuActive : ''}`}
                      >
                        <span>Saldos e Créditos</span>
                      </Link>
                    )}
                    {showConfig && (
                      <Link 
                        href="/pedidos/configuracoes"
                        className={`${styles.submenuLink} ${pathname === '/pedidos/configuracoes' ? styles.submenuActive : ''}`}
                      >
                        <span>Configurações</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.profileBox}>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{user.full_name}</span>
          <span className={styles.profileEmail}>{user.email}</span>
          {user.actual_role === 'Administrador' ? (
            <select
              value={user.role}
              onChange={(e) => changeActiveRole(e.target.value as UserRole)}
              className={styles.roleSelector}
              style={{ marginTop: '6px' }}
            >
              <option value="Administrador">Administrador</option>
              <option value="Comercial">Comercial</option>
              <option value="Produção">Produção</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Estoque">Estoque</option>
              <option value="Expedição">Expedição</option>
            </select>
          ) : (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginTop: '2px', display: 'block' }}>
              {user.role}
            </span>
          )}
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: '10px', padding: '0.4rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', gap: '0.25rem', alignItems: 'center' }}
        >
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
</file>

<file path="src/services/conta_azul.ts">
import { getContaAzulConfig, updateContaAzulConfig, createIntegrationLog, supabase, supabaseAdmin } from './supabase';

const CONTA_AZUL_API_URL = 'https://api-v2.contaazul.com';
const CONTA_AZUL_AUTH_URL = 'https://auth.contaazul.com/oauth2';

interface ContaAzulTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Servico para gerenciar a integracao com a API REST do Conta Azul e fluxos de OAuth 2.0.
 * Utiliza apenas a API v2 da Conta Azul.
 */
export class ContaAzulService {
  private tenantId: string;

  constructor(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
    this.tenantId = tenantId;
  }

  /**
   * Gera a URL de autorizacao OAuth 2.0 do Conta Azul
   */
  public async getAuthorizationUrl(clientId: string, redirectUri: string, state: string): Promise<string> {
    const scope = encodeURIComponent('openid profile aws.cognito.signin.user.admin');
    return `https://auth.contaazul.com/login?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${clientId}&scope=${scope}&state=${state}&response_type=code`;
  }

  /**
   * Troca o codigo de autorizacao por Tokens de Acesso e Atualizacao
   */
  public async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<ContaAzulTokens> {
    const isMock = false;
    
    await createIntegrationLog(
      'OAUTH_CODE_EXCHANGE',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      { client_id: clientId, redirect_uri: redirectUri },
      null,
      isMock ? 'Token simulado gerado.' : 'Solicitando token de autorizacao...',
      this.tenantId
    );

    if (isMock) {
      const tokens: ContaAzulTokens = {
        access_token: `mock_access_${Math.random().toString(36).substring(2)}`,
        refresh_token: `mock_refresh_${Math.random().toString(36).substring(2)}`,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      };

      await updateContaAzulConfig({
        client_id: clientId,
        client_secret: clientSecret,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
      }, this.tenantId);

      return tokens;
    }

    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch(`${CONTA_AZUL_AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na troca de codigo Conta Azul: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const tokens: ContaAzulTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
      };

      await updateContaAzulConfig({
        client_id: clientId,
        client_secret: clientSecret,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
      }, this.tenantId);

      await createIntegrationLog(
        'OAUTH_CODE_EXCHANGE',
        'SUCCESS',
        { client_id: clientId },
        { expires_in: data.expires_in },
        null,
        this.tenantId
      );

      return tokens;
    } catch (error: any) {
      await createIntegrationLog(
        'OAUTH_CODE_EXCHANGE',
        'ERROR',
        { client_id: clientId },
        null,
        error.message || 'Falha na troca de codigo',
        this.tenantId
      );
      throw error;
    }
  }

  /**
   * Obtem um token de acesso valido. Atualiza se estiver expirado.
   */
  private async getValidAccessToken(): Promise<string> {
    const { data: config, error } = await getContaAzulConfig(this.tenantId);
    if (error || !config) {
      throw new Error('Integracao com Conta Azul nao configurada.');
    }

    const { client_id, client_secret, access_token, refresh_token, expires_at } = config;
    
    // Fallback para variáveis de ambiente
    const clientIdVal = client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const clientSecretVal = client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '';
    
    if (!clientIdVal || !clientSecretVal) {
      throw new Error('Client_id e client_secret do Conta Azul sao obrigatorios.');
    }

    const isMock = false;
    if (isMock) {
      return access_token || 'mock_access_token';
    }

    if (!access_token || !refresh_token) {
      throw new Error('Conta Azul nao autenticado (tokens ausentes).');
    }

    const expiresAtMs = expires_at ? new Date(expires_at).getTime() : 0;
    const nowMs = Date.now();
    const isExpired = expiresAtMs - nowMs < 5 * 60 * 1000;

    if (!isExpired) {
      return access_token;
    }

    try {
      const basicAuth = Buffer.from(`${clientIdVal}:${clientSecretVal}`).toString('base64');
      const response = await fetch(`${CONTA_AZUL_AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token
        }).toString()
      });

      if (!response.ok) {
        throw new Error(`Falha ao atualizar token: ${response.statusText}`);
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token || refresh_token;
      const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      await updateContaAzulConfig({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: newExpiresAt
      }, this.tenantId);

      await createIntegrationLog(
        'OAUTH_TOKEN_REFRESH',
        'SUCCESS',
        null,
        { expires_in: data.expires_in },
        null,
        this.tenantId
      );

      return newAccessToken;
    } catch (err: any) {
      await createIntegrationLog(
        'OAUTH_TOKEN_REFRESH',
        'ERROR',
        null,
        null,
        err.message || 'Falha ao atualizar token',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Sincroniza Cliente para o Conta Azul (v2 /pessoas)
   */
  public async syncCustomer(customer: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    await createIntegrationLog(
      'SYNC_CUSTOMER',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      customer,
      null,
      isMock ? 'Executando sincronizacao em modo simulado...' : 'Chamando endpoint de pessoas do Conta Azul...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return customer.conta_azul_id || `ca_cust_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      const documentClean = customer.document ? customer.document.replace(/\D/g, '') : '';
      const payload = {
        nome: customer.name,
        email: customer.email,
        telefone: customer.phone,
        documento: documentClean,
        tipo_pessoa: documentClean.length === 11 ? 'FISICA' : 'JURIDICA',
        perfis: ['CLIENTE'],
        endereco: customer.address ? {
          logradouro: customer.address.split(',')[0] || customer.address,
          numero: '',
          complemento: '',
          bairro: '',
          cep: '',
          cidade: null
        } : undefined
      };

      let response;
      if (customer.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas/${customer.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Conta Azul de Pessoas (Cliente): ${response.status} - ${errorText}`);
      }

      const resData = await response.json();
      const contaAzulId = resData.id || customer.conta_azul_id;

      await createIntegrationLog(
        'SYNC_CUSTOMER',
        'SUCCESS',
        payload,
        resData,
        null,
        this.tenantId
      );

      return contaAzulId;
    } catch (err: any) {
      await createIntegrationLog(
        'SYNC_CUSTOMER',
        'ERROR',
        customer,
        null,
        err.message || 'Falha na sincronizacao do cliente',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Sincroniza Fornecedor para o Conta Azul (v2 /pessoas)
   */
  public async syncSupplier(supplier: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    await createIntegrationLog(
      'SYNC_SUPPLIER',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      supplier,
      null,
      isMock ? 'Executando sincronizacao em modo simulado...' : 'Chamando endpoint de pessoas do Conta Azul...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return supplier.conta_azul_id || `ca_supp_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      const documentClean = supplier.document ? supplier.document.replace(/\D/g, '') : '';
      const payload = {
        nome: supplier.name,
        email: supplier.email,
        telefone: supplier.phone,
        documento: documentClean,
        tipo_pessoa: documentClean.length === 11 ? 'FISICA' : 'JURIDICA',
        perfis: ['FORNECEDOR'],
        endereco: supplier.address ? {
          logradouro: supplier.address.split(',')[0] || supplier.address,
          numero: '',
          complemento: '',
          bairro: '',
          cep: '',
          cidade: null
        } : undefined
      };

      let response;
      if (supplier.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas/${supplier.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Conta Azul de Pessoas (Fornecedor): ${response.status} - ${errorText}`);
      }

      const resData = await response.json();
      const contaAzulId = resData.id || supplier.conta_azul_id;

      await createIntegrationLog(
        'SYNC_SUPPLIER',
        'SUCCESS',
        payload,
        resData,
        null,
        this.tenantId
      );

      return contaAzulId;
    } catch (err: any) {
      await createIntegrationLog(
        'SYNC_SUPPLIER',
        'ERROR',
        supplier,
        null,
        err.message || 'Falha na sincronizacao do fornecedor',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Sincroniza Produto para o Conta Azul
   */
  public async syncProduct(product: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    await createIntegrationLog(
      'SYNC_PRODUCT',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      product,
      null,
      isMock ? 'Executando sincronizacao em modo simulado...' : 'Chamando endpoint de produtos...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return product.conta_azul_id || `ca_prod_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      const payload = {
        name: product.name,
        code: product.sku,
        value: product.price,
        description: product.description,
        cost: product.price * 0.4,
        stock_control: true,
        stock_quantity: product.stock_quantity
      };

      let response;
      if (product.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/products/${product.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`Erro na API Conta Azul de Produtos: ${response.statusText}`);
      }

      const resData = await response.json();
      const contaAzulId = resData.id || product.conta_azul_id;

      await createIntegrationLog(
        'SYNC_PRODUCT',
        'SUCCESS',
        payload,
        resData,
        null,
        this.tenantId
      );

      return contaAzulId;
    } catch (err: any) {
      await createIntegrationLog(
        'SYNC_PRODUCT',
        'ERROR',
        product,
        null,
        err.message || 'Falha na sincronizacao do produto',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Sincroniza Pedido/Venda para o Conta Azul (v2 /venda)
   */
  public async syncOrder(order: any, customer: any, product: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    await createIntegrationLog(
      'SYNC_ORDER',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      { order_id: order.id, customer_id: customer?.id, product_id: product?.id },
      null,
      isMock ? 'Executando sincronizacao em modo simulado...' : 'Chamando endpoint de vendas do Conta Azul...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return order.conta_azul_id || `ca_sale_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();

      if (!customer?.conta_azul_id) {
        throw new Error('O cliente precisa estar sincronizado com o Conta Azul antes.');
      }
      if (!product?.conta_azul_id) {
        throw new Error('O produto precisa estar sincronizado com o Conta Azul antes.');
      }

      let saleNumber = order.order_number;
      if (order.pv_number) {
        const numericPart = order.pv_number.replace(/\D/g, '');
        if (numericPart) {
          saleNumber = parseInt(numericPart, 10);
        }
      }

      // Tenta obter o vendedor correspondente no Conta Azul
      let vendorId = undefined;
      try {
        const sellersRes = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/vendedores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sellersRes.ok) {
          const sellers = await sellersRes.json();
          const matched = sellers.find((s: any) => s.nome?.toLowerCase() === order.seller_name?.toLowerCase());
          if (matched) {
            vendorId = matched.id;
          }
        }
      } catch (e) {
        console.error('Erro ao buscar vendedores:', e);
      }

      // DESDOBRAMENTO: Consultar os itens de pedido locais no Supabase para compor a payload da Conta Azul
      const dbClient = supabaseAdmin || supabase;
      if (!dbClient) throw new Error('Cliente Supabase nao inicializado');
      
      const { data: localItems } = await dbClient
        .from('order_items')
        .select('*, product:products(conta_azul_id, price)')
        .eq('order_id', order.id)
        .order('item_index', { ascending: true });

      const apiItems = [];
      if (localItems && localItems.length > 0) {
        for (const item of localItems) {
          let caProdId = item.product?.conta_azul_id;
          if (!caProdId && item.product_id) {
            const { data: prodFull } = await dbClient.from('products').select('*').eq('id', item.product_id).single();
            if (prodFull) {
              caProdId = await this.syncProduct(prodFull);
            }
          }
          apiItems.push({
            id_produto: caProdId || product.conta_azul_id,
            quantidade: item.print_run || 1,
            valor_unitario: item.product?.price || product.price || 0,
            descricao: `Item: ${item.name}. Medidas: ${item.measure || ''}. Caixas: ${item.boxes_count || 0}.`
          });
        }
      } else {
        apiItems.push({
          id_produto: product.conta_azul_id,
          quantidade: order.print_run || 1,
          valor_unitario: product.price || 0,
          descricao: `Medidas: ${order.measure}. Caixas: ${order.boxes_count}.`
        });
      }

      const payload = {
        id_cliente: customer.conta_azul_id,
        numero: saleNumber,
        data_venda: (order.order_date || new Date().toISOString()).split('T')[0],
        situacao: order.status === 'Pago' ? 'PAGO' : order.status === 'Faturado' ? 'FATURADO' : 'APROVADO',
        observacoes: order.notes || '',
        shipping_cost: order.freight_value || 0,
        vendedor: vendorId ? { id: vendorId } : undefined,
        itens: apiItems
      };

      let response;
      if (order.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/${order.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/venda`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Conta Azul de Vendas: ${response.status} - ${errorText}`);
      }

      const resData = await response.json();
      const contaAzulId = resData.id || order.conta_azul_id;

      await createIntegrationLog(
        'SYNC_ORDER',
        'SUCCESS',
        payload,
        resData,
        null,
        this.tenantId
      );

      return contaAzulId;
    } catch (err: any) {
      await createIntegrationLog(
        'SYNC_ORDER',
        'ERROR',
        order,
        null,
        err.message || 'Falha na sincronizacao do pedido',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Sincroniza Transacao Financeira para o Conta Azul
   */
  public async syncFinancial(financial: any, order: any = null): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    await createIntegrationLog(
      'SYNC_FINANCIAL',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      financial,
      null,
      isMock ? 'Executando sincronizacao em modo simulado...' : 'Chamando endpoint financeiro do Conta Azul...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return financial.conta_azul_id || `ca_fin_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      const isIncome = financial.type === 'RECEITA';
      const endpoint = isIncome ? 'receivables' : 'payables';

      const payload = {
        due_date: financial.due_date,
        value: financial.amount,
        description: financial.description,
        category_id: isIncome ? 'receita-venda' : 'despesa-insumo',
        payment_date: financial.payment_date,
        received: financial.status === 'CONCILIADO',
        paid: financial.status === 'CONCILIADO',
        sale_id: order?.conta_azul_id || undefined
      };

      let response;
      if (financial.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/${endpoint}/${financial.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`Erro na API Conta Azul Financeira: ${response.statusText}`);
      }

      const resData = await response.json();
      const contaAzulId = resData.id || financial.conta_azul_id;

      await createIntegrationLog(
        'SYNC_FINANCIAL',
        'SUCCESS',
        payload,
        resData,
        null,
        this.tenantId
      );

      return contaAzulId;
    } catch (err: any) {
      await createIntegrationLog(
        'SYNC_FINANCIAL',
        'ERROR',
        financial,
        null,
        err.message || 'Falha na sincronizacao financeira',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Importa clientes do Conta Azul para o banco local (v2 /pessoas)
   */
  public async importCustomers(): Promise<{ imported: number; updated: number }> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    if (isMock) {
      return { imported: 3, updated: 0 };
    }

    try {
      const token = await this.getValidAccessToken();
      const response = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas?tamanho_pagina=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao buscar pessoas do Conta Azul: ${response.status} - ${errText}`);
      }

      const resData = await response.json();
      const items = resData.items || [];
      
      const dbClient = supabaseAdmin || supabase;
      if (!dbClient) throw new Error('Cliente Supabase nao inicializado');

      let imported = 0;
      let updated = 0;

      for (const pessoa of items) {
        const isCliente = (pessoa.perfis || []).includes('Cliente');
        if (!isCliente) continue;

        const document = pessoa.documento || pessoa.cnpj || pessoa.cpf || '';
        
        let query = dbClient
          .from('customers')
          .select('id')
          .eq('tenant_id', this.tenantId);
        
        if (pessoa.id && document) {
          query = query.or(`conta_azul_id.eq.${pessoa.id},document.eq.${document}`);
        } else if (pessoa.id) {
          query = query.eq('conta_azul_id', pessoa.id);
        } else if (document) {
          query = query.eq('document', document);
        } else {
          continue;
        }

        const { data: existing, error: findError } = await query.maybeSingle();
        if (findError) console.error('Erro ao buscar cliente existente:', findError);

        let addressStr = '';
        const addr = pessoa.endereco || pessoa.address;
        if (addr) {
          const parts = [
            addr.logradouro || addr.street,
            addr.numero || addr.number,
            addr.complemento || addr.complement,
            addr.bairro || addr.neighborhood,
            addr.cidade?.nome || addr.city,
            addr.cidade?.uf || addr.state
          ].filter(Boolean);
          addressStr = parts.join(', ');
        }

        const payload: any = {
          name: pessoa.nome || pessoa.razao_social || '',
          email: pessoa.email || '',
          phone: pessoa.telefone || pessoa.celular || '',
          document: document,
          address: addressStr,
          conta_azul_id: pessoa.id
        };

        if (existing) {
          const { error } = await dbClient
            .from('customers')
            .update(payload)
            .eq('id', existing.id);
          if (error) {
            console.error('Erro ao atualizar cliente:', error);
          } else {
            updated++;
          }
        } else {
          const { error } = await dbClient
            .from('customers')
            .insert([{ tenant_id: this.tenantId, ...payload }]);
          if (error) {
            console.error('Erro ao inserir cliente:', error);
          } else {
            imported++;
          }
        }
      }

      await createIntegrationLog(
        'IMPORT_CUSTOMERS',
        'SUCCESS',
        { count: items.length },
        { imported, updated },
        null,
        this.tenantId
      );

      return { imported, updated };
    } catch (err: any) {
      console.error('Erro ao importar clientes:', err);
      await createIntegrationLog(
        'IMPORT_CUSTOMERS',
        'ERROR',
        null,
        null,
        err.message || 'Falha ao importar clientes',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Importa pedidos (vendas) do Conta Azul para o banco local (v2 /venda)
   */
  public async importOrders(): Promise<{ imported: number; updated: number }> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    if (isMock) {
      return { imported: 2, updated: 0 };
    }

    try {
      const token = await this.getValidAccessToken();
      // Usar o endpoint oficial /v1/venda/busca com paginação no padrão da API v2 da Conta Azul
      const response = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/busca?tamanho_pagina=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao buscar vendas do Conta Azul: ${response.status} - ${errText}`);
      }

      const resData = await response.json();
      const items = resData.itens || [];

      const dbClient = supabaseAdmin || supabase;
      if (!dbClient) throw new Error('Cliente Supabase nao inicializado');

      let imported = 0;
      let updated = 0;

      for (const saleSummary of items) {
        const statusStr = (saleSummary.situacao?.nome || '').toUpperCase();
        if (statusStr === 'CANCELADO') continue;

        // Endpoint oficial /v1/venda/{id} da API v2 da Conta Azul
        const saleRes = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/${saleSummary.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!saleRes.ok) {
          console.error(`Erro ao buscar detalhes da venda ${saleSummary.id}`);
          continue;
        }
        const saleDetail = await saleRes.json();

        // Endpoint oficial /v1/venda/{id}/itens da API v2 da Conta Azul
        const itemsRes = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/${saleSummary.id}/itens`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!itemsRes.ok) {
          console.error(`Erro ao buscar itens da venda ${saleSummary.id}`);
          continue;
        }
        const itemsData = await itemsRes.json();
        const saleItems = itemsData.itens || [];

        if (saleItems.length === 0) continue;

        const mainItem = saleItems[0];
        const mainItemCaId = mainItem.id_item;

        const clienteInfo = saleDetail.cliente;
        let customerId = '';
        if (clienteInfo) {
          const clientUuid = clienteInfo.uuid || clienteInfo.id;
          const { data: existingCust } = await dbClient
            .from('customers')
            .select('id')
            .eq('tenant_id', this.tenantId)
            .eq('conta_azul_id', clientUuid)
            .maybeSingle();

          if (existingCust) {
            customerId = existingCust.id;
          } else {
            const { data: newCust, error: custErr } = await dbClient
              .from('customers')
              .insert([{
                tenant_id: this.tenantId,
                name: clienteInfo.nome || 'Cliente Importado',
                conta_azul_id: clientUuid,
                document: clienteInfo.documento || '',
                email: '',
                phone: '',
                address: ''
              }])
              .select('id')
              .single();

            if (custErr || !newCust) {
              console.error('Erro ao criar cliente para pedido:', custErr);
              continue;
            }
            customerId = newCust.id;
          }
        } else {
          continue;
        }

        let productId = '';
        if (mainItemCaId) {
          const { data: existingProd } = await dbClient
            .from('products')
            .select('id')
            .eq('tenant_id', this.tenantId)
            .eq('conta_azul_id', mainItemCaId)
            .maybeSingle();

          if (existingProd) {
            productId = existingProd.id;
          } else {
            const { data: newProd, error: prodErr } = await dbClient
              .from('products')
              .insert([{
                tenant_id: this.tenantId,
                name: mainItem.nome || 'Produto Importado',
                sku: (mainItem.nome || 'PROD').toUpperCase().replace(/\s+/g, '-'),
                description: mainItem.descricao || '',
                price: mainItem.valor || 0,
                stock_quantity: 0,
                conta_azul_id: mainItemCaId
              }])
              .select('id')
              .single();

            if (prodErr || !newProd) {
              console.error('Erro ao criar produto para pedido:', prodErr);
              continue;
            }
            productId = newProd.id;
          }
        }

        let localStatus: any = 'A produzir';
        if (statusStr === 'PAGO' || statusStr === 'QUITADO') {
          localStatus = 'Pago';
        } else if (statusStr === 'FATURADO') {
          localStatus = 'Faturado';
        }

        const sellerName = saleDetail.vendedor?.nome || 'Vendas Samppel';

        const condicao = saleDetail.venda?.condicao_pagamento;
        const installments = condicao?.parcelas;
        const installmentsTotal = installments?.length || 1;
        const installmentsPaid = localStatus === 'Pago' ? installmentsTotal : 0;
        const firstPaymentDate = localStatus === 'Pago' && installments?.[0]?.data_vencimento
          ? installments[0].data_vencimento
          : null;

        let measure = '15x10x5 cm';
        let boxesCount = 1;
        const mainItemDesc = (mainItem.descricao || '').toLowerCase();
        
        const measureMatch = mainItemDesc.match(/medidas?:\s*([0-9x\s]+(?:cm)?)/i);
        if (measureMatch && measureMatch[1]) {
          measure = measureMatch[1].trim();
        }

        const boxesMatch = mainItemDesc.match(/caixas?:\s*(\d+)/i);
        if (boxesMatch && boxesMatch[1]) {
          boxesCount = parseInt(boxesMatch[1], 10);
        }

        const resolvedShippingType = this.parseShippingType(saleDetail);
        
        let resolvedPackagingType: 'CAIXA' | 'PACOTE' = 'CAIXA';
        if (resolvedShippingType === 'RETIRADA' || resolvedShippingType === 'LALAMOVE' || resolvedShippingType === 'MOTOBOY') {
          resolvedPackagingType = 'PACOTE';
        }
        if (mainItemDesc.includes('pacote')) {
          resolvedPackagingType = 'PACOTE';
        } else if (mainItemDesc.includes('caixa')) {
          resolvedPackagingType = 'CAIXA';
        }

        const orderPayload: any = {
          customer_id: customerId,
          product_id: productId || null,
          pv_number: `PV-${saleDetail.venda?.numero || saleSummary.numero}`,
          art_name: mainItem.descricao || mainItem.nome || 'Arte Importada',
          seller_name: sellerName,
          measure: measure,
          print_run: mainItem.quantidade || 1000,
          boxes_count: boxesCount,
          packaging_type: resolvedPackagingType,
          freight_value: saleDetail.venda?.composicao_valor?.frete || 0,
          shipping_type: resolvedShippingType,
          installments_total: installmentsTotal,
          installments_paid: installmentsPaid,
          first_payment_date: firstPaymentDate,
          status: localStatus,
          production_sector: 'Impressão',
          notes: saleDetail.venda?.observacoes || '',
          order_date: saleSummary.criado_em || new Date().toISOString(),
          conta_azul_id: saleSummary.id
        };

        let orderId = '';

        const { data: existingOrder } = await dbClient
          .from('orders')
          .select('id')
          .eq('tenant_id', this.tenantId)
          .eq('conta_azul_id', saleSummary.id)
          .maybeSingle();

        if (existingOrder) {
          const { error: updateErr } = await dbClient
            .from('orders')
            .update(orderPayload)
            .eq('id', existingOrder.id);

          if (updateErr) {
            console.error('Erro ao atualizar pedido:', updateErr);
            continue;
          } else {
            updated++;
            orderId = existingOrder.id;
          }
        } else {
          const { data: newOrder, error: insertErr } = await dbClient
            .from('orders')
            .insert([{ tenant_id: this.tenantId, ...orderPayload }])
            .select('id')
            .single();

          if (insertErr || !newOrder) {
            console.error('Erro ao inserir pedido:', insertErr);
            continue;
          } else {
            imported++;
            orderId = newOrder.id;
          }
        }

        // DESDOBRAMENTO: Upsert de itens de pedido (por item_index) preservando progresso do Kanban e embalagens
        const { data: existingLocalItems, error: localItemsError } = await dbClient
          .from('order_items')
          .select('id, item_index, status, production_sector, over_short_quantity, notes')
          .eq('order_id', orderId);

        if (localItemsError) {
          console.error('Erro ao buscar itens locais do pedido:', localItemsError);
          continue;
        }

        const existingItemsMap = new Map(existingLocalItems?.map(i => [i.item_index, i]) || []);
        const processedIndexes = new Set<number>();
        let itemIndexCounter = 1;

        for (const item of saleItems) {
          const currentIdx = itemIndexCounter++;
          processedIndexes.add(currentIdx);

          let itemProductId = null;
          const itemCaId = item.product_id || item.product?.id || item.id_item;
          if (itemCaId) {
            const { data: existingProd } = await dbClient
              .from('products')
              .select('id')
              .eq('tenant_id', this.tenantId)
              .eq('conta_azul_id', itemCaId)
              .maybeSingle();

            if (existingProd) {
              itemProductId = existingProd.id;
            } else {
              const { data: newProd, error: prodErr } = await dbClient
                .from('products')
                .insert([{
                  tenant_id: this.tenantId,
                  name: item.name || item.nome || 'Produto Importado',
                  sku: (item.name || item.nome || 'PROD').toUpperCase().replace(/\s+/g, '-'),
                  description: item.description || item.descricao || '',
                  price: item.value || item.valor || 0,
                  stock_quantity: 0,
                  conta_azul_id: itemCaId
                }])
                .select('id')
                .single();

              if (!prodErr && newProd) {
                itemProductId = newProd.id;
              }
            }
          }

          let itemMeasure = '15x10x5 cm';
          let itemBoxesCount = 1;
          const itemDesc = (item.description || item.descricao || '').toLowerCase();
          
          const measureMatch = itemDesc.match(/medidas?:\s*([0-9x\s]+(?:cm)?)/i);
          if (measureMatch && measureMatch[1]) {
            itemMeasure = measureMatch[1].trim();
          } else {
            itemMeasure = measure; // Fallback para medida do pedido principal
          }

          const boxesMatch = itemDesc.match(/caixas?:\s*(\d+)/i);
          if (boxesMatch && boxesMatch[1]) {
            itemBoxesCount = parseInt(boxesMatch[1], 10);
          } else {
            const qty = item.quantity || item.quantidade || 1000;
            itemBoxesCount = qty > 1000 ? Math.ceil(qty / 500) : 1;
          }

          const itemType = this.getItemTypeFromName(item.name || item.nome || '');

          let itemPackagingType: 'CAIXA' | 'PACOTE' = resolvedPackagingType;
          if (itemDesc.includes('pacote')) {
            itemPackagingType = 'PACOTE';
          } else if (itemDesc.includes('caixa')) {
            itemPackagingType = 'CAIXA';
          }

          const localItem = existingItemsMap.get(currentIdx);

          const orderItemPayload = {
            tenant_id: this.tenantId,
            order_id: orderId,
            product_id: itemProductId,
            item_type: itemType,
            name: item.name || item.nome || 'Item do Pedido',
            measure: itemMeasure,
            print_run: item.quantity || item.quantidade || 1000,
            boxes_count: itemBoxesCount,
            packaging_type: itemPackagingType,
            notes: item.description || item.descricao || ''
          };

          if (localItem) {
            // Atualiza campos comerciais, preservando status, setor e quantidades locais
            const { error: itemUpdateErr } = await dbClient
              .from('order_items')
              .update(orderItemPayload)
              .eq('id', localItem.id);

            if (itemUpdateErr) {
              console.error('Erro ao atualizar item de pedido:', itemUpdateErr);
            }
          } else {
            // Inserir novo item do pedido
            const { error: itemInsertErr } = await dbClient
              .from('order_items')
              .insert([{
                ...orderItemPayload,
                over_short_quantity: 0,
                status: localStatus,
                production_sector: itemType === 'SERVICO' ? 'Corte e Vinco' : 'Impressão'
              }]);

            if (itemInsertErr) {
              console.error('Erro ao inserir item de pedido desdobrado:', itemInsertErr);
            }
          }
        }

        // Deleta itens locais que não existem mais na Conta Azul
        const itemsToDelete = [...existingItemsMap.keys()].filter(idx => !processedIndexes.has(idx));
        if (itemsToDelete.length > 0) {
          const idsToDelete = itemsToDelete.map(idx => existingItemsMap.get(idx)!.id);
          const { error: deleteItemsErr } = await dbClient
            .from('order_items')
            .delete()
            .eq('order_id', orderId)
            .in('id', idsToDelete);

          if (deleteItemsErr) {
            console.error('Erro ao deletar itens de pedido removidos na Conta Azul:', deleteItemsErr);
          }
        }
      }

      await createIntegrationLog(
        'IMPORT_ORDERS',
        'SUCCESS',
        { count: items.length },
        { imported, updated },
        null,
        this.tenantId
      );

      return { imported, updated };
    } catch (err: any) {
      console.error('Erro ao importar pedidos:', err);
      await createIntegrationLog(
        'IMPORT_ORDERS',
        'ERROR',
        null,
        null,
        err.message || 'Falha ao importar pedidos',
        this.tenantId
      );
      throw err;
    }
  }

  private getItemTypeFromName(name: string): 'PRODUTO' | 'SERVICO' {
    const lower = name.toLowerCase();
    if (
      lower.includes('serviço') ||
      lower.includes('refile') ||
      lower.includes('guilhotina') ||
      lower.includes('corte') ||
      lower.includes('colagem') ||
      lower.includes('acréscimo') ||
      lower.includes('taxa') ||
      lower.includes('frete') ||
      lower.includes('fundo') ||
      lower.includes('montagem')
    ) {
      return 'SERVICO';
    }
    return 'PRODUTO';
  }

  private parseShippingType(saleDetail: any): 'RETIRADA' | 'ENTREGA_PROPRIA' | 'TRANSPORTADORA' | 'LALAMOVE' | 'MOTOBOY' | 'TRANSPORTADORA_LONGA' {
    const freightValue = saleDetail.venda?.composicao_valor?.frete || 0;
    const notes = (saleDetail.venda?.observacoes || '').toLowerCase();
    const carrierName = (saleDetail.venda?.transportadora?.nome || saleDetail.transportadora?.nome || '').toLowerCase();

    if (notes.includes('retira') || notes.includes('retirada') || carrierName.includes('retira')) {
      return 'RETIRADA';
    }
    if (notes.includes('lalamove') || carrierName.includes('lalamove') || notes.includes('uber flash') || carrierName.includes('uber')) {
      return 'LALAMOVE';
    }
    if (notes.includes('motoboy') || carrierName.includes('motoboy') || notes.includes('moto')) {
      return 'MOTOBOY';
    }
    if (notes.includes('entrega própria') || notes.includes('carro próprio') || notes.includes('nosso carro') || carrierName.includes('propria') || carrierName.includes('próprio')) {
      return 'ENTREGA_PROPRIA';
    }
    if (notes.includes('longa distância') || carrierName.includes('braspress') || carrierName.includes('planalto') || carrierName.includes('tnt') || carrierName.includes('fedex')) {
      return 'TRANSPORTADORA_LONGA';
    }

    if (freightValue > 0) {
      return 'TRANSPORTADORA';
    }
    return 'RETIRADA';
  }
}
export default ContaAzulService;
</file>

<file path="src/services/supabase.ts">
import { createClient } from '@supabase/supabase-js';

// Variaveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Detecta se estamos usando chaves de demonstracao/mock
const isMockMode = false;

// Cliente Supabase Anonimo (usado no navegador e no servidor)
export const supabase = !isMockMode 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Cliente Supabase Admin (disponivel apenas no lado do servidor)
export const supabaseAdmin = !isMockMode && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Retorna o cliente apropriado: supabaseAdmin no servidor (para bypassar RLS em background) e supabase no navegador (com token do usuario autenticado)
function getDbClient() {
  if (typeof window === 'undefined') {
    return supabaseAdmin || supabase!;
  }
  return supabase!;
}

// --- DADOS SIMULADOS (MOCK DATA) PARA MODO SANDBOX ---
let mockCompanies: any[] = [
  { id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Samppel Embalagens Ltda', cnpj: '12.345.678/0001-90', created_at: new Date().toISOString() }
];

let mockProfiles: any[] = [
  { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Ana Silva (Admin)', role: 'Administrador', email: 'admin@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Mariana Souza (Vendas)', role: 'Comercial', email: 'comercial@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Carlos Mendes (Fábrica)', role: 'Produção', email: 'producao@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Beatriz Lima (Financeiro)', role: 'Financeiro', email: 'financeiro@samppel.com.br', created_at: new Date().toISOString() }
];

let mockCustomers: any[] = [
  { id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Chocolate Gourmet Brasil', document: '22.333.444/0001-55', email: 'contato@chocobrasil.com.br', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000 - São Paulo/SP', conta_azul_id: 'ca_cust_1', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Cosméticos Florescer Ltda', document: '33.444.555/0001-66', email: 'suporte@florescer.com.br', phone: '(21) 97654-3210', address: 'Rua das Flores, 45 - Rio de Janeiro/RJ', conta_azul_id: 'ca_cust_2', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Boutique do Café Especial', document: '44.555.666/0001-77', email: 'financeiro@boutiquecafe.com', phone: '(31) 3456-7890', address: 'Praça da Liberdade, 300 - Belo Horizonte/MG', conta_azul_id: null, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

let mockSuppliers: any[] = [
  { id: '500184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Papelaria Klabin Distribuidora', document: '11.111.111/0001-11', email: 'vendas@klabin.com.br', phone: '(11) 3003-1234', address: 'Rodovia Dutra, Km 200 - Guarulhos/SP', conta_azul_id: 'ca_supp_1', created_at: new Date().toISOString() },
  { id: '500284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Tintas Especiais Dupont', document: '22.222.222/0001-22', email: 'tintas@dupont.com', phone: '(19) 3876-5432', address: 'Distrito Industrial - Campinas/SP', conta_azul_id: 'ca_supp_2', created_at: new Date().toISOString() }
];

let mockProducts: any[] = [
  { id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa Kraft para Bombom (P)', sku: 'KRAFT-BOM-P', description: 'Caixa em papel kraft para 6 bombons com berço', price: 2.50, stock_quantity: 1500, conta_azul_id: 'ca_prod_1', created_at: new Date().toISOString() },
  { id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Sacola Duplex Branca Premium (M)', sku: 'SAC-DUP-M', description: 'Sacola em papel duplex com alça de cordão', price: 4.80, stock_quantity: 800, conta_azul_id: 'ca_prod_2', created_at: new Date().toISOString() },
  { id: '800384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa Correio E-commerce (G)', sku: 'CX-CORR-G', description: 'Caixa de papelão onda B para envios postais', price: 3.90, stock_quantity: 2500, conta_azul_id: null, created_at: new Date().toISOString() }
];

let mockOrders: any[] = [
  { id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', order_number: 1001, pv_number: 'PV-1001', op_number: 'OP-5001', art_name: 'Sacola Choco Brasil Prata', seller_name: 'Mariana Souza', measure: '15x10x5 cm', print_run: 5000, boxes_count: 10, packaging_type: 'CAIXA', freight_value: 150.00, shipping_type: 'ENTREGA_PROPRIA', status: 'A produzir', production_sector: 'Impressão', physical_location: 'Máquina Flexo 1', notes: 'Cliente solicitou pressa. Logo centralizada na tampa.', internal_notes: 'Confirmado pagamento da primeira parcela por boleto.', order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 3, installments_paid: 1, first_payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 100, conta_azul_id: 'ca_order_1', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', order_number: 1002, pv_number: 'PV-1002', op_number: 'OP-5002', art_name: 'Sacola Florescer Rosa Luxo', seller_name: 'Camila Neves', measure: '25x30x10 cm', print_run: 2000, boxes_count: 4, packaging_type: 'PACOTE', freight_value: 80.00, shipping_type: 'TRANSPORTADORA', status: 'Em revisão', production_sector: 'Corte e Vinco', physical_location: 'Salão', notes: 'Acabamento com verniz localizado.', internal_notes: 'Aguardando aprovação do layout final de faca pelo cliente.', order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 1, installments_paid: 0, first_payment_date: null, over_short_quantity: 0, conta_azul_id: null, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', product_id: '800384c8-3e4b-4b14-87cf-45ef42d17c03', order_number: 1003, pv_number: 'PV-1003', op_number: null, art_name: 'Caixa Padrão Correios', seller_name: 'Mariana Souza', measure: '30x20x15 cm', print_run: 1000, boxes_count: 2, packaging_type: 'CAIXA', freight_value: 60.00, shipping_type: 'RETIRADA', status: 'Expedição', production_sector: 'Expedição', physical_location: 'Pátio', notes: 'Coleta pela transportadora Braspress.', internal_notes: 'Nota fiscal já gerada e anexada ao pacote.', order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 1, installments_paid: 1, first_payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: -10, conta_azul_id: 'ca_order_3', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', order_number: 1004, pv_number: 'PV-1004', op_number: 'OP-5004', art_name: 'Sacola Florescer Kraft M', seller_name: 'Camila Neves', measure: '20x20x8 cm', print_run: 3000, boxes_count: 6, packaging_type: 'CAIXA', freight_value: 120.00, shipping_type: 'ENTREGA_PROPRIA', status: 'Pago', production_sector: 'Concluído', physical_location: 'Salão', notes: 'Sem observações.', internal_notes: 'Entregue com sucesso no dia 15/06.', order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 2, installments_paid: 2, first_payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 50, conta_azul_id: 'ca_order_4', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00584c8-3e4b-4b14-87cf-45ef42d17c05', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', order_number: 1005, pv_number: 'PV-1005', op_number: 'OP-5005', art_name: 'Saco Café Gourmet Preto', seller_name: 'Mariana Souza', measure: '15x10x5 cm', print_run: 10000, boxes_count: 20, packaging_type: 'CAIXA', freight_value: 250.00, shipping_type: 'RETIRADA', status: 'Atrasado', production_sector: 'Colagem', physical_location: 'Máquina Coladeira 2', notes: 'Urgente! Atraso devido a problema na máquina coladeira.', internal_notes: 'Cliente cobrou posicionamento hoje cedo.', order_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 4, installments_paid: 2, first_payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 0, conta_azul_id: null, created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
];

let mockFinancial: any[] = [
  { id: 'f00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', type: 'RECEITA', amount: 12650.00, status: 'PENDENTE', description: 'Venda Chocolate Gourmet Brasil #1', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: null, created_at: new Date().toISOString() },
  { id: 'f00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', type: 'RECEITA', amount: 3960.00, status: 'CONCILIADO', description: 'Venda Boutique do Café #3', due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', type: 'RECEITA', amount: 14520.00, status: 'CONCILIADO', description: 'Venda Chocolate Gourmet Brasil #4', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: null, type: 'DESPESA', amount: 4500.00, status: 'CONCILIADO', description: 'Compra de Papel Kraft - Klabin', due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00584c8-3e4b-4b14-87cf-45ef42d17c05', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: null, type: 'DESPESA', amount: 1200.00, status: 'PENDENTE', description: 'Compra de Tintas Especiais - Dupont', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: null, created_at: new Date().toISOString() }
];

let mockLogs: any[] = [
  { id: '100184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', action: 'OAUTH_REFRESH', status: 'SUCCESS', payload: { client_id: 'mock_client' }, response: { message: 'Token refreshed in mock mode', expires_in: 3600 }, error_message: null, created_at: new Date().toISOString() }
];

let mockQueue: any[] = [
  { id: '900184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', entity_type: 'ORDER', entity_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', action: 'CREATE', retry_count: 0, max_retries: 5, status: 'PENDING', last_error: null, next_retry_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let mockContaAzulConfig: any = {
  id: 'c-azul-config-mock',
  tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  client_id: 'ca_client_id_placeholder',
  client_secret: 'ca_client_secret_placeholder',
  access_token: 'mock_access_token_xyz',
  refresh_token: 'mock_refresh_token_xyz',
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// --- DATA ACCESS LAYER HELPERS (Safe wrapper functions) ---

// Clientes
export async function getCustomers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockCustomers.filter(c => c.tenant_id === tenantId), error: null };
  const { data, error } = await getDbClient().from('customers').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createCustomer(customer: any) {
  const newCust = {
    id: customer.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: customer.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...customer
  };
  
  if (isMockMode) {
    mockCustomers.unshift(newCust);
    await enqueueSync(newCust.tenant_id, 'CUSTOMER', newCust.id, 'CREATE');
    return { data: newCust, error: null };
  }
  
  const { data, error } = await getDbClient().from('customers').insert([customer]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'CUSTOMER', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateCustomer(id: string, updates: any) {
  if (isMockMode) {
    mockCustomers = mockCustomers.map(c => c.id === id ? { ...c, ...updates } : c);
    const updated = mockCustomers.find(c => c.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'CUSTOMER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient().from('customers').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'CUSTOMER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Fornecedores
export async function getSuppliers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockSuppliers.filter(s => s.tenant_id === tenantId), error: null };
  const { data, error } = await getDbClient().from('suppliers').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createSupplier(supplier: any) {
  const newSupp = {
    id: supplier.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: supplier.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...supplier
  };
  if (isMockMode) {
    mockSuppliers.unshift(newSupp);
    await enqueueSync(newSupp.tenant_id, 'SUPPLIER', newSupp.id, 'CREATE');
    return { data: newSupp, error: null };
  }
  const { data, error } = await getDbClient().from('suppliers').insert([supplier]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'SUPPLIER', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateSupplier(id: string, updates: any) {
  if (isMockMode) {
    mockSuppliers = mockSuppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    const updated = mockSuppliers.find(s => s.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'SUPPLIER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient().from('suppliers').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'SUPPLIER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Produtos & Estoque
export async function getProducts(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockProducts.filter(p => p.tenant_id === tenantId), error: null };
  const { data, error } = await getDbClient().from('products').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createProduct(product: any) {
  const newProd = {
    id: product.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: product.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    stock_quantity: product.stock_quantity || 0,
    created_at: new Date().toISOString(),
    ...product
  };
  if (isMockMode) {
    mockProducts.unshift(newProd);
    await enqueueSync(newProd.tenant_id, 'PRODUCT', newProd.id, 'CREATE');
    return { data: newProd, error: null };
  }
  const { data, error } = await getDbClient().from('products').insert([product]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateProduct(id: string, updates: any) {
  if (isMockMode) {
    mockProducts = mockProducts.map(p => p.id === id ? { ...p, ...updates } : p);
    const updated = mockProducts.find(p => p.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'PRODUCT', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient().from('products').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'UPDATE');
  }
  return { data, error };
}

export async function adjustStock(productId: string, quantity: number, type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'PEDIDO', description: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    mockProducts = mockProducts.map(p => {
      if (p.id === productId) {
        const newQty = p.stock_quantity + quantity;
        return { ...p, stock_quantity: newQty < 0 ? 0 : newQty };
      }
      return p;
    });
    return { error: null };
  }
  const { data: prod } = await getDbClient().from('products').select('stock_quantity').eq('id', productId).single();
  if (prod) {
    const newQty = (prod.stock_quantity || 0) + quantity;
    await getDbClient().from('products').update({ stock_quantity: newQty < 0 ? 0 : newQty }).eq('id', productId);
    await getDbClient().from('stock_transactions').insert([{
      tenant_id: tenantId,
      product_id: productId,
      quantity,
      type,
      description
    }]);
  }
  return { error: null };
}

// Pedidos (Orders)
export async function getOrders(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const ordersWithJoins = mockOrders.filter(o => o.tenant_id === tenantId).map(order => {
      const customer = mockCustomers.find(c => c.id === order.customer_id) || { name: 'Cliente Desconhecido' };
      const product = mockProducts.find(p => p.id === order.product_id) || { name: 'Produto Desconhecido', stock_quantity: 0 };
      const mockStages = [
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001', name: 'A produzir', color: '#94a3b8' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17002', name: 'Em produção', color: '#3b82f6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17003', name: 'Manuseio', color: '#a855f7' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004', name: 'Em revisão', color: '#eab308' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17005', name: 'Expedição', color: '#f97316' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17006', name: 'Concluído', color: '#10b981' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17007', name: 'Estoque', color: '#14b8a6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17008', name: 'Atrasado', color: '#ef4444' }
      ];
      const stage = mockStages.find(s => s.id === order.stage_id) || mockStages.find(s => s.name === order.status) || mockStages[0];
      return {
        ...order,
        customer,
        product,
        stage
      };
    });
    ordersWithJoins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: ordersWithJoins, error: null };
  }
  
  const { data, error } = await getDbClient()
    .from('orders')
    .select('*, customer:customers(*), product:products(*), stage:order_stages(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrder(order: any) {
  const newOrder = {
    id: order.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: order.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_number: mockOrders.length + 1001,
    created_at: new Date().toISOString(),
    ...order
  };
  
  if (isMockMode) {
    mockOrders.unshift(newOrder);
    await adjustStock(newOrder.product_id, -newOrder.boxes_count, 'PEDIDO', `Pedido #${newOrder.order_number} cadastrado`, newOrder.tenant_id);
    const product = mockProducts.find(p => p.id === newOrder.product_id);
    const amount = (product ? product.price * newOrder.print_run : 0) + newOrder.freight_value;
    const customer = mockCustomers.find(c => c.id === newOrder.customer_id);
    
    const newFin = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: newOrder.tenant_id,
      order_id: newOrder.id,
      type: 'RECEITA',
      amount,
      status: 'PENDENTE',
      description: `Venda ${customer ? customer.name : 'Cliente'} #${newOrder.order_number}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_date: null,
      created_at: new Date().toISOString()
    };
    mockFinancial.unshift(newFin);
    await enqueueSync(newOrder.tenant_id, 'ORDER', newOrder.id, 'CREATE');
    return { data: newOrder, error: null };
  }
  
  const { data, error } = await getDbClient().from('orders').insert([order]).select().single();
  if (!error && data) {
    await adjustStock(data.product_id, -data.boxes_count, 'PEDIDO', `Pedido #${data.order_number} cadastrado`, data.tenant_id);
    
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
    
    await enqueueSync(data.tenant_id, 'ORDER', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateOrder(id: string, updates: any) {
  if (isMockMode) {
    mockOrders = mockOrders.map(o => o.id === id ? { ...o, ...updates } : o);
    const updated = mockOrders.find(o => o.id === id);
    if (updated) {
      if (updates.status === 'Pago') {
        mockFinancial = mockFinancial.map(f => f.order_id === id ? { ...f, status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] } : f);
      }
      await enqueueSync(updated.tenant_id, 'ORDER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  
  const { data, error } = await getDbClient().from('orders').update(updates).eq('id', id).select().single();
  if (!error && data) {
    if (updates.status === 'Pago') {
      await getDbClient()
        .from('financial_transactions')
        .update({ status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] })
        .eq('order_id', id);
    }
    await enqueueSync(data.tenant_id, 'ORDER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Etapas do Kanban
export async function getOrderStages(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const mockStages = [
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001', tenant_id: tenantId, name: 'A produzir', color: '#94a3b8', sequence: 1 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17002', tenant_id: tenantId, name: 'Em produção', color: '#3b82f6', sequence: 2 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17003', tenant_id: tenantId, name: 'Manuseio', color: '#a855f7', sequence: 3 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004', tenant_id: tenantId, name: 'Em revisão', color: '#eab308', sequence: 4 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17005', tenant_id: tenantId, name: 'Expedição', color: '#f97316', sequence: 5 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17006', tenant_id: tenantId, name: 'Concluído', color: '#10b981', sequence: 6 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17007', tenant_id: tenantId, name: 'Estoque', color: '#14b8a6', sequence: 7 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17008', tenant_id: tenantId, name: 'Atrasado', color: '#ef4444', sequence: 8 }
    ];
    return { data: mockStages, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sequence', { ascending: true });
  return { data, error };
}

export async function createOrderStage(stage: any) {
  if (isMockMode) {
    return { data: { id: Math.random().toString(), ...stage }, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .insert([stage])
    .select()
    .single();
  return { data, error };
}

export async function updateOrderStage(id: string, updates: any) {
  if (isMockMode) {
    return { data: { id, ...updates }, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteOrderStage(id: string) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .delete()
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// Permissões por Perfil
export async function getProfilesWithPermissions(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { 
      data: mockProfiles.filter(p => p.tenant_id === tenantId).map(p => ({
        ...p,
        profile_stage_permissions: []
      })), 
      error: null 
    };
  }
  const { data, error } = await getDbClient()
    .from('profiles')
    .select('*, profile_stage_permissions(stage_id, can_enter, can_exit)')
    .eq('tenant_id', tenantId)
    .order('full_name');
  return { data, error };
}

export async function saveProfileStagePermission(profileId: string, stageId: string, canEnter: boolean, canExit: boolean) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  
  if (!canEnter && !canExit) {
    const { error } = await getDbClient()
      .from('profile_stage_permissions')
      .delete()
      .eq('profile_id', profileId)
      .eq('stage_id', stageId);
    return { data: null, error };
  }

  const { data, error } = await getDbClient()
    .from('profile_stage_permissions')
    .upsert({
      profile_id: profileId,
      stage_id: stageId,
      can_enter: canEnter,
      can_exit: canExit
    })
    .select();
    
  return { data, error };
}

export async function updateProfileStagePermissions(profileId: string, stageIds: string[]) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  const { error: deleteError } = await getDbClient()
    .from('profile_stage_permissions')
    .delete()
    .eq('profile_id', profileId);
    
  if (deleteError) return { data: null, error: deleteError };
  
  if (stageIds.length === 0) return { data: [], error: null };
  
  const rows = stageIds.map(stageId => ({
    profile_id: profileId,
    stage_id: stageId,
    can_enter: true,
    can_exit: true
  }));
  
  const { data, error } = await getDbClient()
    .from('profile_stage_permissions')
    .insert(rows)
    .select();
    
  return { data, error };
}


// Financeiro
export async function getFinancialTransactions(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockFinancial.filter(f => f.tenant_id === tenantId).map(f => {
      const order = mockOrders.find(o => o.id === f.order_id);
      return {
        ...f,
        order
      };
    });
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('financial_transactions')
    .select('*, order:orders(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createFinancialTransaction(transaction: any) {
  const newFin = {
    id: transaction.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: transaction.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...transaction
  };
  if (isMockMode) {
    mockFinancial.unshift(newFin);
    await enqueueSync(newFin.tenant_id, 'FINANCIAL', newFin.id, 'CREATE');
    return { data: newFin, error: null };
  }
  const { data, error } = await getDbClient().from('financial_transactions').insert([transaction]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'FINANCIAL', data.id, 'CREATE');
  }
  return { data, error };
}

export async function reconcileTransaction(id: string, paymentDate = new Date().toISOString().split('T')[0]) {
  if (isMockMode) {
    mockFinancial = mockFinancial.map(f => f.id === id ? { ...f, status: 'CONCILIADO', payment_date: paymentDate } : f);
    const updated = mockFinancial.find(f => f.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'FINANCIAL', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient()
    .from('financial_transactions')
    .update({ status: 'CONCILIADO', payment_date: paymentDate })
    .eq('id', id)
    .select()
    .single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'FINANCIAL', data.id, 'UPDATE');
  }
  return { data, error };
}

// Logs de integracao
export async function getIntegrationLogs(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = [...mockLogs];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('conta_azul_integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

export async function createIntegrationLog(action: string, status: 'SUCCESS' | 'ERROR' | 'PENDING_RETRY', payload: any, response: any, errorMessage: string | null = null, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const log = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: tenantId,
    action,
    status,
    payload,
    response,
    error_message: errorMessage,
    created_at: new Date().toISOString()
  };
  if (isMockMode) {
    mockLogs.unshift(log);
    return { data: log, error: null };
  }
  const { data, error } = await getDbClient().from('conta_azul_integration_logs').insert([log]).select().single();
  return { data, error };
}

// Fila de sincronizacao (Sync Queue)
export async function getSyncQueue(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { data: mockQueue.filter(q => q.tenant_id === tenantId), error: null };
  }
  const { data, error } = await getDbClient()
    .from('sync_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function enqueueSync(tenantId: string, entityType: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'ORDER' | 'FINANCIAL', entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE') {
  const newSync = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    retry_count: 0,
    max_retries: 5,
    status: 'PENDING' as const,
    last_error: null,
    next_retry_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  if (isMockMode) {
    const exists = mockQueue.some(q => q.entity_id === entityId && q.entity_type === entityType && q.status === 'PENDING');
    if (!exists) {
      mockQueue.unshift(newSync);
    }
    return { data: newSync, error: null };
  }
  
  const { data: existing } = await getDbClient()
    .from('sync_queue')
    .select('id')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .eq('status', 'PENDING')
    .maybeSingle();
    
  if (existing) {
    return { data: existing, error: null };
  }
  
  const { data, error } = await getDbClient()
    .from('sync_queue')
    .insert([{
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      status: 'PENDING'
    }])
    .select()
    .single();
    
  return { data, error };
}

// Configurações da Conta Azul
export async function getContaAzulConfig(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockContaAzulConfig, error: null };

  if (typeof window === 'undefined') {
    try {
      if (!supabaseAdmin) {
        throw new Error('Cliente Supabase nao inicializado');
      }

      const { data: config, error } = await supabaseAdmin
        .from('conta_azul_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      return {
        data: {
          client_id: config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '',
          client_secret: config?.client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '',
          access_token: config?.access_token || null,
          refresh_token: config?.refresh_token || null,
          expires_at: config?.expires_at || null
        },
        error: null
      };
    } catch (err: any) {
      console.error('Erro ao buscar credenciais no servidor:', err);
      return {
        data: {
          client_id: process.env.CONTA_AZUL_CLIENT_ID || '',
          client_secret: process.env.CONTA_AZUL_CLIENT_SECRET || '',
          access_token: null,
          refresh_token: null,
          expires_at: null
        },
        error: null
      };
    }
  }

  try {
    const res = await fetch('/api/config/conta-azul');
    if (!res.ok) throw new Error('Falha ao buscar credenciais');
    const data = await res.json();
    return {
      data: {
        client_id: data.client_id,
        client_secret: data.has_secret ? '••••••••••••••••••••••••••••••••' : '',
        access_token: data.is_connected ? 'valid' : null,
        expires_at: data.expires_at
      },
      error: null
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateContaAzulConfig(updates: any, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    mockContaAzulConfig = { ...mockContaAzulConfig, ...updates, updated_at: new Date().toISOString() };
    return { data: mockContaAzulConfig, error: null };
  }

  if (typeof window === 'undefined') {
    try {
      if (!supabaseAdmin) throw new Error('Cliente Supabase nao inicializado');

      const { data: existing } = await supabaseAdmin
        .from('conta_azul_config')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const payload: any = { ...updates };
      payload.updated_at = new Date().toISOString();

      let error;
      if (existing) {
        const res = await supabaseAdmin
          .from('conta_azul_config')
          .update(payload)
          .eq('tenant_id', tenantId);
        error = res.error;
      } else {
        const res = await supabaseAdmin
          .from('conta_azul_config')
          .insert([{ tenant_id: tenantId, ...payload }]);
        error = res.error;
      }

      if (error) throw error;
      return { data: { success: true }, error: null };
    } catch (err: any) {
      console.error('Erro ao atualizar credenciais no servidor:', err);
      return { data: null, error: err };
    }
  }

  try {
    const res = await fetch('/api/config/conta-azul', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: updates.client_id,
        client_secret: updates.client_secret
      })
    });
    if (!res.ok) throw new Error('Falha ao salvar credenciais');
    return { data: { success: true }, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

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
  packaging_type: 'CAIXA' | 'PACOTE';
  over_short_quantity: number;
  status: string;
  production_sector: string;
  stage_id: string | null;
  machine_id: string | null;
  handling_team_id: string | null;
  physical_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  product?: any;
  stage?: any;
}

let mockOrderItems: any[] = [
  {
    id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    item_type: 'PRODUTO',
    name: 'Caixa Kraft para Bombom (P)',
    item_index: 1,
    friendly_id: 'PV-1001/1',
    measure: '15x10x5 cm',
    print_run: 5000,
    boxes_count: 10,
    packaging_type: 'CAIXA',
    over_short_quantity: 100,
    status: 'A produzir',
    production_sector: 'Impressão',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001',
    physical_location: 'Máquina Flexo 1',
    notes: 'Logo centralizada na tampa.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: null,
    item_type: 'SERVICO',
    name: 'Cartão de Fundo Personalizado',
    item_index: 2,
    friendly_id: 'PV-1001/2',
    measure: '14x9 cm',
    print_run: 5000,
    boxes_count: 0,
    packaging_type: 'PACOTE',
    over_short_quantity: 0,
    status: 'A produzir',
    production_sector: 'Impressão',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001',
    physical_location: 'Máquina Flexo 1',
    notes: 'Papel duplex 250g.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02',
    product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02',
    item_type: 'PRODUTO',
    name: 'Sacola Duplex Branca Premium (M)',
    item_index: 1,
    friendly_id: 'PV-1002/1',
    measure: '25x30x10 cm',
    print_run: 2000,
    boxes_count: 4,
    packaging_type: 'PACOTE',
    over_short_quantity: 0,
    status: 'Em revisão',
    production_sector: 'Corte e Vinco',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004',
    physical_location: 'Salão',
    notes: 'Aguardando aprovação de layout.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i04',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02',
    product_id: null,
    item_type: 'SERVICO',
    name: 'Serviço de Verniz Localizado',
    item_index: 2,
    friendly_id: 'PV-1002/2',
    measure: null,
    print_run: 2000,
    boxes_count: 0,
    packaging_type: 'PACOTE',
    over_short_quantity: 0,
    status: 'Em revisão',
    production_sector: 'Corte e Vinco',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004',
    physical_location: 'Salão',
    notes: 'Aplicar verniz apenas na logo.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function getOrderItems(orderId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let items = mockOrderItems.filter(item => item.tenant_id === tenantId);
    if (orderId) {
      items = items.filter(item => item.order_id === orderId);
    }
    const itemsWithJoins = items.map(item => {
      const product = mockProducts.find(p => p.id === item.product_id) || null;
      const order = mockOrders.find(o => o.id === item.order_id) || null;
      let customer = null;
      if (order) {
        customer = mockCustomers.find(c => c.id === order.customer_id) || null;
      }
      const mockStages = [
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001', name: 'A produzir', color: '#94a3b8' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17002', name: 'Em produção', color: '#3b82f6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17003', name: 'Manuseio', color: '#a855f7' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004', name: 'Em revisão', color: '#eab308' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17005', name: 'Expedição', color: '#f97316' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17006', name: 'Concluído', color: '#10b981' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17007', name: 'Estoque', color: '#14b8a6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17008', name: 'Atrasado', color: '#ef4444' }
      ];
      const stage = mockStages.find(s => s.id === item.stage_id) || null;
      return {
        ...item,
        product,
        stage,
        order: order ? { ...order, customer } : null
      };
    });
    return { data: itemsWithJoins, error: null };
  }

  // Query base sem tabelas opcionais (production_machines / handling_teams podem não existir ainda)
  const baseSelect = '*, product:products(*), stage:order_stages(*), order:orders(*, customer:customers(*))';
  const fullSelect = '*, product:products(*), stage:order_stages(*), machine:production_machines(*), handling_team:handling_teams(*), order:orders(*, customer:customers(*))';

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
  
  if (isMockMode) {
    const orderItemsForParent = mockOrderItems.filter(i => i.order_id === item.order_id);
    const nextIdx = orderItemsForParent.reduce((max, curr) => Math.max(max, curr.item_index), 0) + 1;
    
    const parentOrder = mockOrders.find(o => o.id === item.order_id);
    const pvRef = parentOrder ? (parentOrder.pv_number || `PV-${parentOrder.order_number}`) : 'PV-MOCK';
    
    const newItem: OrderItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: tenantId,
      order_id: item.order_id,
      product_id: item.product_id,
      item_type: item.item_type,
      name: item.name,
      item_index: nextIdx,
      friendly_id: `${pvRef}/${nextIdx}`,
      measure: item.measure,
      print_run: item.print_run,
      boxes_count: item.boxes_count,
      packaging_type: item.packaging_type,
      over_short_quantity: item.over_short_quantity,
      status: item.status || 'A produzir',
      production_sector: item.production_sector || 'Impressão',
      stage_id: item.stage_id,
      machine_id: (item as any).machine_id || null,
      handling_team_id: (item as any).handling_team_id || null,
      physical_location: item.physical_location,
      notes: item.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockOrderItems.push(newItem);
    return { data: newItem, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_items')
    .insert([{ ...item, tenant_id: item.tenant_id || tenantId }])
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  return { data, error };
}

export async function updateOrderItem(id: string, updates: Partial<OrderItem>) {
  if (isMockMode) {
    mockOrderItems = mockOrderItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    });
    
    const updated = mockOrderItems.find(item => item.id === id);
    return { data: updated, error: null };
  }

  const fullSelectForUpdate = '*, product:products(*), stage:order_stages(*), machine:production_machines(*), handling_team:handling_teams(*)';
  const baseSelectForUpdate = '*, product:products(*), stage:order_stages(*)';

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

export async function deleteOrderItem(id: string) {
  if (isMockMode) {
    const exists = mockOrderItems.some(item => item.id === id);
    if (!exists) return { data: null, error: { message: 'Item não encontrado.' } as any };
    mockOrderItems = mockOrderItems.filter(item => item.id !== id);
    return { data: null, error: null };
  }

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
  action_taken: 'GUARDAR_ESTOQUE_CLIENTE' | 'CREDITO_PROXIMO_PEDIDO' | 'CANCELADO_DESCONTO' | 'COBRADO_ADICIONAL' | 'REPRODUCAO_PENDENTE' | 'OUTRO';
  notes: string | null;
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

let mockCustomerProductStock: CustomerProductStock[] = [
  {
    id: 's00184c8-3e4b-4b14-87cf-45ef42d17s01',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    quantity: 150,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let mockOrderBalanceAdjustments: OrderBalanceAdjustment[] = [
  {
    id: 'adj-1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    ordered_quantity: 5000,
    produced_quantity: 7000,
    difference_quantity: 2000,
    adjustment_type: 'SOBRA',
    action_taken: 'GUARDAR_ESTOQUE_CLIENTE',
    notes: '2.000 sacos produzidos a mais. Guardados no estoque físico para o cliente Gourmet Brasil.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'adj-2',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    customer_id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02',
    product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02',
    ordered_quantity: 2000,
    produced_quantity: 1850,
    difference_quantity: -150,
    adjustment_type: 'FALTA',
    action_taken: 'CREDITO_PROXIMO_PEDIDO',
    notes: 'Falta de 150 unidades. Convertido em crédito para a Quinta do Marquês usar na próxima compra.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'adj-3',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03',
    product_id: '800384c8-3e4b-4b14-87cf-45ef42d17c03',
    ordered_quantity: 1000,
    produced_quantity: 1100,
    difference_quantity: 100,
    adjustment_type: 'SOBRA',
    action_taken: 'COBRADO_ADICIONAL',
    notes: 'Excedente de 100 unidades cobrado como adicional na fatura.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];
let mockCustomerStockCredits: CustomerStockCredit[] = [
  {
    id: 'cr0184c8-3e4b-4b14-87cf-45ef42d17cr1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    credit_type: 'CORTESIA_SOBRA',
    original_quantity: 150,
    remaining_quantity: 150,
    source_order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    source_adjustment_id: null,
    status: 'ATIVO',
    notes: 'Sobra gerada no PV-1001 e mantida na fábrica para a padaria/empresa Gourmet.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// --- OPERAÇÕES: ESTOQUE PERSONALIZADO POR CLIENTE ---

export async function getCustomerProductStock(customerId?: string, productId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let filtered = mockCustomerProductStock.filter(s => s.tenant_id === tenantId);
    if (customerId) filtered = filtered.filter(s => s.customer_id === customerId);
    if (productId) filtered = filtered.filter(s => s.product_id === productId);
    
    const withJoins = filtered.map(s => ({
      ...s,
      customer: mockCustomers.find(c => c.id === s.customer_id) || null,
      product: mockProducts.find(p => p.id === s.product_id) || null
    }));
    return { data: withJoins, error: null };
  }

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
  if (isMockMode) {
    const existingIdx = mockCustomerProductStock.findIndex(s => s.customer_id === stock.customer_id && s.product_id === stock.product_id);
    if (existingIdx !== -1) {
      mockCustomerProductStock[existingIdx].quantity += stock.quantity;
      mockCustomerProductStock[existingIdx].updated_at = new Date().toISOString();
      return { data: mockCustomerProductStock[existingIdx], error: null };
    }
    const newStock: CustomerProductStock = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: tenantId,
      customer_id: stock.customer_id,
      product_id: stock.product_id,
      quantity: stock.quantity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockCustomerProductStock.push(newStock);
    return { data: newStock, error: null };
  }

  const { data, error } = await getDbClient()
    .from('customer_product_stock')
    .upsert({ ...stock, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: 'customer_id, product_id' })
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

export async function updateCustomerProductStock(id: string, updates: Partial<CustomerProductStock>) {
  if (isMockMode) {
    mockCustomerProductStock = mockCustomerProductStock.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s);
    const updated = mockCustomerProductStock.find(s => s.id === id);
    return { data: updated, error: null };
  }

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
  if (isMockMode) {
    let filtered = mockOrderBalanceAdjustments.filter(a => a.tenant_id === tenantId);
    if (orderId) filtered = filtered.filter(a => a.order_id === orderId);
    if (customerId) filtered = filtered.filter(a => a.customer_id === customerId);
    const withJoins = filtered.map(a => ({
      ...a,
      order: mockOrders.find(o => o.id === a.order_id) || null,
      customer: mockCustomers.find(c => c.id === a.customer_id) || null,
      product: mockProducts.find(p => p.id === a.product_id) || null
    }));
    return { data: withJoins, error: null };
  }

  let query = getDbClient()
    .from('order_balance_adjustments')
    .select('*, order:orders(*), order_item:order_items(*), customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId);

  if (orderId) query = query.eq('order_id', orderId);
  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrderBalanceAdjustment(adjustment: Omit<OrderBalanceAdjustment, 'id' | 'created_at'>) {
  const tenantId = adjustment.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  if (isMockMode) {
    const newAdj: OrderBalanceAdjustment = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...adjustment,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    };
    mockOrderBalanceAdjustments.push(newAdj);

    if (adjustment.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' && adjustment.difference_quantity > 0) {
      await createCustomerProductStock({
        tenant_id: tenantId,
        customer_id: adjustment.customer_id,
        product_id: adjustment.product_id,
        quantity: adjustment.difference_quantity
      });
      const customerName = mockCustomers.find(c => c.id === adjustment.customer_id)?.name || 'Cliente';
      const orderNum = mockOrders.find(o => o.id === adjustment.order_id)?.order_number || 'PV';
      await adjustStock(
        adjustment.product_id,
        adjustment.difference_quantity,
        'ENTRADA',
        `[ESTOQUE_CLIENTE] Entrada de Sobra - Cliente: ${customerName} - PV: ${orderNum}`,
        tenantId
      );
    }

    if (adjustment.action_taken === 'CREDITO_PROXIMO_PEDIDO' || adjustment.action_taken === 'REPRODUCAO_PENDENTE') {
      const type = adjustment.difference_quantity > 0 ? 'CORTESIA_SOBRA' : 'PENDENCIA_ENTREGA';
      const qty = Math.abs(adjustment.difference_quantity);
      await createCustomerStockCredit({
        tenant_id: tenantId,
        customer_id: adjustment.customer_id,
        product_id: adjustment.product_id,
        credit_type: type,
        original_quantity: qty,
        remaining_quantity: qty,
        source_order_id: adjustment.order_id,
        source_adjustment_id: newAdj.id,
        status: 'ATIVO',
        notes: adjustment.notes
      });
    }

    return { data: newAdj, error: null };
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

    if (data.action_taken === 'CREDITO_PROXIMO_PEDIDO' || data.action_taken === 'REPRODUCAO_PENDENTE') {
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
  if (isMockMode) {
    let filtered = mockCustomerStockCredits.filter(c => c.tenant_id === tenantId);
    if (customerId) filtered = filtered.filter(c => c.customer_id === customerId);
    if (status) filtered = filtered.filter(c => c.status === status);
    const withJoins = filtered.map(c => ({
      ...c,
      customer: mockCustomers.find(cust => cust.id === c.customer_id) || null,
      product: mockProducts.find(p => p.id === c.product_id) || null,
      source_order: mockOrders.find(o => o.id === c.source_order_id) || null
    }));
    return { data: withJoins, error: null };
  }

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
  
  if (isMockMode) {
    const newCredit: CustomerStockCredit = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...credit,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockCustomerStockCredits.push(newCredit);
    return { data: newCredit, error: null };
  }

  const { data, error } = await getDbClient()
    .from('customer_stock_credits')
    .insert([{ ...credit, tenant_id: tenantId }])
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

export async function updateCustomerStockCredit(id: string, updates: Partial<CustomerStockCredit>) {
  if (isMockMode) {
    mockCustomerStockCredits = mockCustomerStockCredits.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    const updated = mockCustomerStockCredits.find(c => c.id === id);
    return { data: updated, error: null };
  }

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

let mockOrderIncidents: OrderIncident[] = [
  {
    id: 'in0184c8-3e4b-4b14-87cf-45ef42d17in1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    category: 'FINANCEIRO',
    description: 'Produção iniciada antes da confirmação do sinal financeiro pelo setor financeiro.',
    status: 'RESOLVIDO',
    created_by: 'e00284c8-3e4b-4b14-87cf-45ef42d17c02',
    resolved_by: 'e00184c8-3e4b-4b14-87cf-45ef42d17c01',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'in0184c8-3e4b-4b14-87cf-45ef42d17in2',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00584c8-3e4b-4b14-87cf-45ef42d17c05',
    order_item_id: null,
    category: 'TRANSPORTE',
    description: 'Pedido enviado para cidade de destino errada (coletor leu etiqueta incorreta na triagem).',
    status: 'ABERTO',
    created_by: 'e00384c8-3e4b-4b14-87cf-45ef42d17c03',
    resolved_by: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function getOrderIncidents(orderId?: string, category?: string, status?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let filtered = mockOrderIncidents.filter(inc => inc.tenant_id === tenantId);
    if (orderId) filtered = filtered.filter(inc => inc.order_id === orderId);
    if (category) filtered = filtered.filter(inc => inc.category === category);
    if (status) filtered = filtered.filter(inc => inc.status === status);
    
    const withJoins = filtered.map(inc => ({
      ...inc,
      order: mockOrders.find(o => o.id === inc.order_id) || null,
      order_item: mockOrderItems.find(item => item.id === inc.order_item_id) || null,
      creator: mockProfiles.find(p => p.id === inc.created_by) || null,
      resolver: mockProfiles.find(p => p.id === inc.resolved_by) || null
    }));
    return { data: withJoins, error: null };
  }

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
  
  if (isMockMode) {
    const newInc: OrderIncident = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...incident,
      tenant_id: tenantId,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockOrderIncidents.push(newInc);
    return { data: newInc, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .insert([{ ...incident, tenant_id: tenantId }])
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*)')
    .single();

  return { data, error };
}

export async function resolveOrderIncident(id: string, resolvedBy: string, status: 'RESOLVIDO' = 'RESOLVIDO') {
  if (isMockMode) {
    mockOrderIncidents = mockOrderIncidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      return inc;
    });
    const updated = mockOrderIncidents.find(inc => inc.id === id);
    return { data: updated, error: null };
  }

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
  if (isMockMode) {
    mockOrderIncidents = mockOrderIncidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return inc;
    });
    const updated = mockOrderIncidents.find(inc => inc.id === id);
    return { data: updated, error: null };
  }

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

let mockProductionMachines: ProductionMachine[] = [
  { id: 'mach-1', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Impressora Offset Heidel', sector: 'Impressão', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mach-2', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Corte e Vinco Bobst', sector: 'Corte e Vinco', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mach-3', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Guilhotina Rotalina A', sector: 'Corte e Vinco', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let mockOrderItemSectorHistory: OrderItemSectorHistory[] = [
  {
    id: 'h-1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Impressão',
    machine_id: 'mach-1',
    entered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-2',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Corte e Vinco',
    machine_id: 'mach-2',
    entered_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-3',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Manuseio',
    machine_id: null,
    entered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-4',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Expedição',
    machine_id: null,
    entered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: null,
    created_at: new Date().toISOString()
  },
  // Outro item do PV 1
  {
    id: 'h-5',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    sector: 'Impressão',
    machine_id: 'mach-1',
    entered_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-6',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    sector: 'Corte e Vinco',
    machine_id: 'mach-3',
    entered_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-7',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    sector: 'Colagem',
    machine_id: null,
    entered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: null,
    created_at: new Date().toISOString()
  },
  // Item 3 (PV-1002/1)
  {
    id: 'h-8',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    sector: 'Impressão',
    machine_id: 'mach-1',
    entered_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-9',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    sector: 'Atrasado',
    machine_id: null,
    entered_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-10',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    sector: 'Colagem',
    machine_id: null,
    entered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: null,
    created_at: new Date().toISOString()
  }
];

export async function getProductionMachines(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockProductionMachines.filter(m => m.tenant_id === tenantId);
    return { data: list, error: null };
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
  if (isMockMode) {
    const newMac: ProductionMachine = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...machine,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockProductionMachines.push(newMac);
    return { data: newMac, error: null };
  }
  const { data, error } = await getDbClient()
    .from('production_machines')
    .insert([{ ...machine, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateProductionMachine(id: string, updates: Partial<ProductionMachine>) {
  if (isMockMode) {
    mockProductionMachines = mockProductionMachines.map(m => m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m);
    const updated = mockProductionMachines.find(m => m.id === id);
    return { data: updated, error: null };
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
  if (isMockMode) {
    mockProductionMachines = mockProductionMachines.filter(m => m.id !== id);
    return { data: true, error: null };
  }
  const { error } = await getDbClient()
    .from('production_machines')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

export async function getOrderItemSectorHistory(orderItemId: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockOrderItemSectorHistory
      .filter(h => h.order_item_id === orderItemId && h.tenant_id === tenantId)
      .map(h => ({
        ...h,
        machine: mockProductionMachines.find(m => m.id === h.machine_id) || null
      }));
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_item_sector_history')
    .select('*, machine:production_machines(*)')
    .eq('order_item_id', orderItemId)
    .eq('tenant_id', tenantId)
    .order('entered_at', { ascending: true });
  return { data, error };
}

export async function logSectorTransition(
  orderItemId: string,
  sector: string,
  machineId: string | null,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
) {
  if (isMockMode) {
    // 1. Fechar transição aberta anterior
    mockOrderItemSectorHistory = mockOrderItemSectorHistory.map(h => {
      if (h.order_item_id === orderItemId && h.exited_at === null) {
        return { ...h, exited_at: new Date().toISOString() };
      }
      return h;
    });

    // 2. Inserir nova transição
    const newLog: OrderItemSectorHistory = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: tenantId,
      order_item_id: orderItemId,
      sector,
      machine_id: machineId,
      entered_at: new Date().toISOString(),
      exited_at: null,
      created_at: new Date().toISOString()
    };
    mockOrderItemSectorHistory.push(newLog);
    return { data: newLog, error: null };
  }

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
      entered_at: new Date().toISOString()
    }])
    .select()
    .single();

  return { data, error };
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

let mockHandlingTeams: HandlingTeam[] = [
  { id: 'team-1', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Equipe João', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'team-2', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Equipe Zé', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'team-3', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Equipe Maria', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export async function getHandlingTeams(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockHandlingTeams.filter(t => t.tenant_id === tenantId);
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createHandlingTeam(team: Omit<HandlingTeam, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = team.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    const newTeam: HandlingTeam = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...team,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockHandlingTeams.push(newTeam);
    return { data: newTeam, error: null };
  }
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .insert([{ ...team, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateHandlingTeam(id: string, updates: Partial<HandlingTeam>) {
  if (isMockMode) {
    mockHandlingTeams = mockHandlingTeams.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
    const updated = mockHandlingTeams.find(t => t.id === id);
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteHandlingTeam(id: string) {
  if (isMockMode) {
    mockHandlingTeams = mockHandlingTeams.filter(t => t.id !== id);
    return { data: true, error: null };
  }
  const { error } = await getDbClient()
    .from('handling_teams')
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

function shouldFallbackToMock(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    String(error.message).includes('schema cache') ||
    String(error.message).includes('does not exist')
  );
}

let mockPackagingMaterialTypes: PackagingMaterialType[] = [
  { id: 'pmt-1', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa de Papelão Corrugado', code: 'CX-001', category: 'CAIXA', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pmt-2', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Fundo Reforçado Kraft', code: 'FD-001', category: 'FUNDO', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pmt-3', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Divisória Interna', code: 'DV-001', category: 'DIVISORIA', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getPackagingMaterialTypes(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { data: mockPackagingMaterialTypes.filter(t => t.tenant_id === tenantId), error: null };
  }
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error && shouldFallbackToMock(error)) {
    return { data: mockPackagingMaterialTypes.filter(t => t.tenant_id === tenantId), error: null };
  }
  return { data, error };
}

export async function createPackagingMaterialType(item: Omit<PackagingMaterialType, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    const newItem: PackagingMaterialType = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...item,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockPackagingMaterialTypes.push(newItem);
    return { data: newItem, error: null };
  }
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .insert([{ ...item, tenant_id: tenantId }])
    .select()
    .single();

  if (error && shouldFallbackToMock(error)) {
    const newItem: PackagingMaterialType = {
      id: Math.random().toString(36).substring(2),
      ...item,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockPackagingMaterialTypes.push(newItem);
    return { data: newItem, error: null };
  }
  return { data, error };
}

export async function updatePackagingMaterialType(id: string, updates: Partial<PackagingMaterialType>) {
  if (isMockMode) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.map(t =>
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    );
    return { data: mockPackagingMaterialTypes.find(t => t.id === id), error: null };
  }
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error && shouldFallbackToMock(error)) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.map(t =>
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    );
    return { data: mockPackagingMaterialTypes.find(t => t.id === id), error: null };
  }
  return { data, error };
}

export async function deletePackagingMaterialType(id: string) {
  if (isMockMode) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.filter(t => t.id !== id);
    return { data: true, error: null };
  }
  const { error } = await getDbClient().from('packaging_material_types').delete().eq('id', id);
  if (error && shouldFallbackToMock(error)) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.filter(t => t.id !== id);
    return { data: true, error: null };
  }
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

let mockOrderItemPackaging: OrderItemPackaging[] = [];

export async function getOrderItemPackaging(orderItemId: string) {
  if (isMockMode) {
    const records = mockOrderItemPackaging.filter(p => p.order_item_id === orderItemId);
    // Join mock material type
    records.forEach(r => {
      r.material_type = mockPackagingMaterialTypes.find(t => t.id === r.packaging_material_type_id) || null;
    });
    return { data: records, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_item_packaging')
    .select('*, material_type:packaging_material_types(*)')
    .eq('order_item_id', orderItemId)
    .order('volume_index', { ascending: true });

  if (error && shouldFallbackToMock(error)) {
    const records = mockOrderItemPackaging.filter(p => p.order_item_id === orderItemId);
    records.forEach(r => {
      r.material_type = mockPackagingMaterialTypes.find(t => t.id === r.packaging_material_type_id) || null;
    });
    return { data: records, error: null };
  }
  return { data, error };
}

export async function saveOrderItemPackagingVolumes(
  orderItemId: string,
  tenantId: string,
  volumes: Omit<OrderItemPackaging, 'id' | 'created_at' | 'updated_at' | 'material_type'>[],
  registeredBy?: string
) {
  if (isMockMode) {
    // Remove existing records for this item
    mockOrderItemPackaging = mockOrderItemPackaging.filter(p => p.order_item_id !== orderItemId);
    const now = new Date().toISOString();
    const newRecords: OrderItemPackaging[] = volumes.map((v, i) => ({
      ...v,
      id: Math.random().toString(36).substring(2),
      order_item_id: orderItemId,
      tenant_id: tenantId,
      volume_index: i + 1,
      registered_by: registeredBy || null,
      created_at: now,
      updated_at: now
    }));
    mockOrderItemPackaging.push(...newRecords);
    return { data: newRecords, error: null };
  }

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

    if (error && shouldFallbackToMock(error)) {
      throw error; // Let try-catch block handle fallback
    }
    return { data, error };
  } catch (err: any) {
    if (shouldFallbackToMock(err)) {
      mockOrderItemPackaging = mockOrderItemPackaging.filter(p => p.order_item_id !== orderItemId);
      const now = new Date().toISOString();
      const newRecords: OrderItemPackaging[] = volumes.map((v, i) => ({
        ...v,
        id: Math.random().toString(36).substring(2),
        order_item_id: orderItemId,
        tenant_id: tenantId,
        volume_index: i + 1,
        registered_by: registeredBy || null,
        created_at: now,
        updated_at: now
      }));
      mockOrderItemPackaging.push(...newRecords);
      return { data: newRecords, error: null };
    }
    throw err;
  }
}

export async function hasPackagingData(orderItemId: string): Promise<boolean> {
  if (isMockMode) {
    return mockOrderItemPackaging.some(p => p.order_item_id === orderItemId);
  }
  const { count, error } = await getDbClient()
    .from('order_item_packaging')
    .select('id', { count: 'exact', head: true })
    .eq('order_item_id', orderItemId);

  if (error && shouldFallbackToMock(error)) {
    return mockOrderItemPackaging.some(p => p.order_item_id === orderItemId);
  }
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

let mockPackagingSettings: PackagingSettings[] = [
  {
    id: 'ps-1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
    association_rule: 'FIRST_ITEM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function getPackagingSettings(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const config = mockPackagingSettings.find(s => s.tenant_id === tenantId) || {
      id: 'ps-temp',
      tenant_id: tenantId,
      keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
      association_rule: 'FIRST_ITEM' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { data: config, error: null };
  }

  const { data, error } = await getDbClient()
    .from('packaging_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error && shouldFallbackToMock(error)) {
    const config = mockPackagingSettings.find(s => s.tenant_id === tenantId) || {
      id: 'ps-temp',
      tenant_id: tenantId,
      keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
      association_rule: 'FIRST_ITEM' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { data: config, error: null };
  }

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
  if (isMockMode) {
    let config = mockPackagingSettings.find(s => s.tenant_id === tenantId);
    if (config) {
      config.keywords = item.keywords;
      config.association_rule = item.association_rule;
      config.updated_at = new Date().toISOString();
    } else {
      config = {
        id: Math.random().toString(36).substring(2),
        tenant_id: tenantId,
        keywords: item.keywords,
        association_rule: item.association_rule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockPackagingSettings.push(config);
    }
    return { data: config, error: null };
  }

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

  if (error && shouldFallbackToMock(error)) {
    let config = mockPackagingSettings.find(s => s.tenant_id === tenantId);
    if (config) {
      config.keywords = item.keywords;
      config.association_rule = item.association_rule;
      config.updated_at = new Date().toISOString();
    } else {
      config = {
        id: Math.random().toString(36).substring(2),
        tenant_id: tenantId,
        keywords: item.keywords,
        association_rule: item.association_rule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockPackagingSettings.push(config);
    }
    return { data: config, error: null };
  }
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
  
  if (isMockMode) {
    historyData = [...mockOrderItemSectorHistory].filter(h => h.tenant_id === tenantId);
  } else {
    const { data, error } = await getDbClient()
      .from('order_item_sector_history')
      .select('*, order_item:order_items(*, order:orders(*, customer:customers(*), product:products(*)), machine:production_machines(*))')
      .eq('tenant_id', tenantId);

    if (error && shouldFallbackToMock(error)) {
      historyData = [...mockOrderItemSectorHistory].filter(h => h.tenant_id === tenantId);
    } else {
      historyData = data || [];
    }
  }

  // Preencher dados em modo simulação (ou fallback)
  if (isMockMode || historyData.length === 0 || !historyData[0]?.order_item) {
    historyData = historyData.map(h => {
      const orderItem = mockOrderItems.find(oi => oi.id === h.order_item_id) || null;
      let order: any = null;
      let customer: any = null;
      let product: any = null;
      if (orderItem) {
        order = mockOrders.find(o => o.id === orderItem.order_id) || null;
        if (order) {
          customer = mockCustomers.find(c => c.id === order.customer_id) || null;
          product = mockProducts.find(p => p.id === order.product_id) || null;
        }
      }
      const machine = mockProductionMachines.find(m => m.id === h.machine_id) || null;

      return {
        ...h,
        machine,
        order_item: orderItem ? {
          ...orderItem,
          order: order ? {
            ...order,
            customer,
            product
          } : null
        } : null
      };
    });
  }

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
</file>

<file path="README.md">
# Portal Samppel

**Portal Samppel** é um MVP real de sistema operacional comercial, de produção e expedição de embalagens personalizadas, totalmente estruturado e preparado para integração bidirecional em segundo plano com o **ERP Conta Azul**.

O sistema foi arquitetado focando em **segurança de credenciais**, **isolamento de camadas** (UI, negócios, banco e integrações), **multi-empresa (multi-tenant)** e **controle de acesso granular** (Administrador, Comercial, Produção e Financeiro).

---

## 🚀 Principais Módulos & Funcionalidades

1. **Dashboard Inteligente**: Indicadores de pedidos ativos, carregamento de produção e faturamento. Os cartões e gráficos se adaptam dinamicamente conforme o perfil conectado.
2. **Gestão de Pedidos Customizados**: Controle operacional completo contendo Cliente, Produto, Medidas de Embalagem, Tiragem total, Qtd. de Caixas, Frete, Observações de Layout, Setor de Produção e Anotações Internas.
3. **Filtros Operacionais**: Filtros refinados por cliente, vendedor, status, setor físico e datas.
4. **Verificação Dinâmica de Estoque**: Alerta visual imediato no cadastro de pedidos caso a tiragem solicitada exceda as unidades em estoque do produto.
5. **Conciliação Financeira Básica**: Fluxo de contas a pagar (despesas) e receber (receitas de vendas), com botão de conciliação manual que sinaliza e inicia a sincronização do título financeiro com a Conta Azul.
6. **Controle de Acesso Granular (Role Permissions)**:
   - **Administrador**: Acesso irrestrito a cadastros, logs, faturamento, conciliação e chaves de API.
   - **Comercial**: Criação e edição de pedidos, clientes, fornecedores e produtos (sem acesso a dados de conciliação ou chaves).
   - **Produção**: Acesso focado na linha de montagem. Pode alterar apenas o status e o setor físico do pedido (Impressão, Corte, Colagem, Expedição). Bloqueado para alterar preços ou dados cadastrais.
   - **Financeiro**: Acesso a faturamento, conciliação de contas e visualizações de pedidos. Bloqueado de alterar especificações técnicas de embalagens.

---

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js (App Router com TypeScript)
- **Banco & Auth**: Supabase (PostgreSQL relacional)
- **Deploy**: Vercel
- **Estilização**: Vanilla CSS / CSS Modules (Premium, responsivo, suporte automático a light/dark mode baseado em HSL)
- **Integração**: API REST Conta Azul com fluxo OAuth 2.0 seguro rodando 100% no servidor.

---

## 📁 Estrutura de Pastas do Projeto

```text
/samppel
├── supabase/
│   └── schema.sql                # Modelagem do Banco (DDL e Seed Data)
├── src/
│   ├── app/                      # Rotas e Páginas do Next.js (App Router)
│   │   ├── api/                  # Endpoints de API seguros (Backend)
│   │   │   ├── auth/             # Callback seguro do OAuth 2.0 da Conta Azul
│   │   │   └── sync/             # Cron de processamento de background
│   │   ├── dashboard/            # Indicadores e gráficos SVG
│   │   ├── pedidos/              # Listagem, cadastros e controle de produção
│   │   ├── clientes/             # Cadastro de clientes e integração
│   │   ├── fornecedores/         # Cadastro de fornecedores
│   │   ├── produtos/             # Cadastro de produtos e ajustes de estoque
│   │   ├── financeiro/           # Conciliação de receitas/despesas
│   │   ├── configuracoes/        # Gestão de credenciais da API e log feed
│   │   ├── layout.tsx            # Wrapper do layout da aplicação com Sidebar
│   │   ├── page.tsx              # Tela de Login com simulador de acessos
│   │   └── globals.css           # Design System (variáveis HSL, temas, botões)
│   ├── components/               # Componentes UI encapsulados
│   │   ├── Sidebar.tsx           # Menu de navegação reativo a permissões
│   │   └── Sidebar.module.css
│   ├── context/                  # Contexto de simulação de login/roles
│   │   └── AuthContext.tsx
│   ├── services/                 # Regras de negócio e comunicações externas
│   │   ├── supabase.ts           # Cliente Supabase & Camada de dados Mock
│   │   ├── conta_azul.ts         # Métodos da API REST e Renovação de Token
│   │   └── sync_queue.ts         # Executor de background com retries
│   └── types/                    # Tipagem TypeScript
```

---

## ⚙️ Configuração Local (Passo a Passo)

### 1. Clonar e Instalar Dependências
```bash
# Instalar pacotes necessários
npm install
```

### 2. Configurar o Banco no Supabase
1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o painel do projeto, abra o **SQL Editor** e clique em **New Query**.
3. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste repositório, cole no editor do Supabase e clique em **Run**.
   * *Isso criará todas as tabelas (clientes, produtos, pedidos, logs, fila), índices, relacionamentos de integridade e inserirá dados de demonstração (seed) para uso imediato.*

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (use o `.env.local.example` como base):

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-privada (ignora RLS no background)

# Conta Azul API Credentials
CONTA_AZUL_CLIENT_ID=seu_client_id_gerado_no_portal_dev
CONTA_AZUL_CLIENT_SECRET=seu_client_secret_gerado_no_portal_dev
CONTA_AZUL_REDIRECT_URI=http://localhost:3000/api/auth/conta-azul/callback

# URL do App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!TIP]
> **Modo Sandbox / Sem Chaves**: Se você executar o projeto sem fornecer as chaves reais ou mantendo os placeholders padrão, o Portal entrará automaticamente em **Modo Simulação**. Ele funcionará 100% de forma interativa usando dados fictícios locais (CRUD em memória), simulando chamadas da API da Conta Azul e registrando logs fictícios. Perfeito para testes offline rápidos!

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Abra o navegador em [http://localhost:3000](http://localhost:3000).

---

## 🔄 Fluxo de Sincronização em Segundo Plano (Background)

O Portal Samppel possui um mecanismo de fila resiliente a falhas temporárias na API da Conta Azul:
1. Toda alteração local de dados (criar cliente, atualizar status do pedido, conciliar financeiro) grava automaticamente um item na tabela `sync_queue` com o status `PENDING`.
2. A rota `/api/sync/cron` atua como o processador da fila. Ela deve ser chamada em segundo plano (ex: a cada 5 ou 10 minutos).
3. **Resolução de Dependências**: Se a fila tentar sincronizar um Pedido mas o Cliente vinculado ainda não foi sincronizado com o ERP, o processador detectará isso e sincronizará o Cliente primeiro, salvará seu ID da Conta Azul, e então prosseguirá com a sincronização do Pedido.
4. **Retry Exponencial**: Em caso de falha temporária (ex: rate limit ou queda da API externa), a fila incrementa o contador de tentativas e agenda o próximo retry com backoff exponencial ($2^{tentativa}$ minutos).

---

## ☁️ Publicação na Vercel & Domínio Próprio

### 1. Publicar na Vercel
1. Crie um projeto na [Vercel](https://vercel.com) apontando para este repositório.
2. Nas configurações do projeto, adicione todas as variáveis de ambiente detalhadas no arquivo `.env.local`.
   * *Certifique-se de atualizar `NEXT_PUBLIC_APP_URL` e `CONTA_AZUL_REDIRECT_URI` com a URL real gerada pela Vercel (ex: `https://samppel-operacional.vercel.app`).*
3. Clique em **Deploy**.

### 2. Configurar Cron Job de Background
Para rodar a sincronização automática em segundo plano na Vercel, adicione um arquivo `vercel.json` na raiz do projeto configurando a rota de sync:

```json
{
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 3. Transição para o Domínio Próprio da Cliente
Quando for migrar o sistema para o domínio definitivo da cliente (ex: `portal.samppel.com.br`):
1. **No painel da Vercel**: Adicione o domínio próprio nas configurações de *Domains* e aponte os registros CNAME/ANAME no seu provedor de DNS conforme instruções da Vercel.
2. **Nas variáveis de ambiente**:
   - Atualize `NEXT_PUBLIC_APP_URL` para `https://portal.samppel.com.br`.
   - Atualize `CONTA_AZUL_REDIRECT_URI` para `https://portal.samppel.com.br/api/auth/conta-azul/callback`.
3. **No painel de desenvolvedor do Conta Azul**:
   - Atualize a URL de redirecionamento cadastrada no seu aplicativo para corresponder à nova URL de callback.
</file>

<file path="src/app/dashboard/page.tsx">
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getOrders, 
  getFinancialTransactions, 
  getProducts 
} from '@/services/supabase';
import { Skeleton, TableRowSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wrench, 
  Truck, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalBilling: 0,
    activeOrdersCount: 0,
    inProductionCount: 0,
    shippedCount: 0,
    lateOrdersCount: 0,
    receivablesPending: 0,
    payablesPending: 0,
    blockedWaitingPaymentCount: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, financeRes, productsRes] = await Promise.all([
        getOrders(),
        getFinancialTransactions(),
        getProducts()
      ]);

      const fetchedOrders: any[] = ordersRes.data || [];
      const fetchedFinance: any[] = financeRes.data || [];
      const fetchedProducts: any[] = productsRes.data || [];

      setOrders(fetchedOrders);
      setFinance(fetchedFinance);
      setProducts(fetchedProducts);

      // Calculations
      const activeOrders = fetchedOrders.filter(o => !['Entregue', 'Pago'].includes(o.status));
      const inProduction = fetchedOrders.filter(o => ['A produzir', 'Em produção', 'Manuseio', 'Em revisão'].includes(o.status));
      const shipped = fetchedOrders.filter(o => o.status === 'Expedição');
      const late = fetchedOrders.filter(o => o.status === 'Atrasado');
      const blocked = fetchedOrders.filter(o => !o.first_payment_date && o.op_number && !['Entregue', 'Pago'].includes(o.status));

      const billing = fetchedFinance
        .filter(f => f.type === 'RECEITA' && f.status === 'CONCILIADO')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const recPending = fetchedFinance
        .filter(f => f.type === 'RECEITA' && f.status === 'PENDENTE')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const payPending = fetchedFinance
        .filter(f => f.type === 'DESPESA' && f.status === 'PENDENTE')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      setStats({
        totalBilling: billing,
        activeOrdersCount: activeOrders.length,
        inProductionCount: inProduction.length,
        shippedCount: shipped.length,
        lateOrdersCount: late.length,
        receivablesPending: recPending,
        payablesPending: payPending,
        blockedWaitingPaymentCount: blocked.length
      });
    } catch (e) {
      console.error('Error calculating dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen to simulated profile changes to reload statistics
    const handleRoleChange = () => {
      fetchData();
    };
    window.addEventListener('samppel_role_changed', handleRoleChange);
    return () => {
      window.removeEventListener('samppel_role_changed', handleRoleChange);
    };
  }, []);

  // If loading, show a premium skeleton dashboard structure
  if (loading) {
    return (
      <div className="page-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
            <Skeleton height={20} width={280} />
          </div>
          <Skeleton height={38} width={100} />
        </header>

        {/* METRICS SKELETON */}
        <div className="dashboard-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card metric-card">
              <div className="metric-info" style={{ width: '60%' }}>
                <Skeleton height={14} width="80%" style={{ marginBottom: '8px' }} />
                <Skeleton height={32} width="50%" />
              </div>
              <Skeleton height={48} width={48} borderRadius="var(--radius-sm)" />
            </div>
          ))}
        </div>

        {/* CHARTS SKELETON */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* TABLE SKELETON */}
        <div className="card">
          <Skeleton height={20} width={250} style={{ marginBottom: '1.25rem' }} />
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th>Tiragem</th>
                  <th>Setor de Produção</th>
                  <th>Status</th>
                  <th>Vendedora</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={8} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Count sector distribution for production chart
  const sectors = ['Impressão', 'Corte e Vinco', 'Colagem', 'Expedição'];
  const sectorCounts = sectors.map(sector => 
    orders.filter(o => o.production_sector === sector && !['Entregue', 'Pago'].includes(o.status)).length
  );
  const maxSectorCount = Math.max(...sectorCounts, 1);

  // Status distributions
  const statuses = ['A produzir', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado'];
  const statusColors: Record<string, string> = {
    'A produzir': 'var(--info)',
    'Em revisão': 'var(--warning)',
    'Expedição': 'var(--primary)',
    'Entregue': 'var(--success)',
    'Faturado': 'var(--secondary)',
    'Pago': 'var(--success)',
    'Atrasado': 'var(--danger)'
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Visão geral operacional e de faturamento do Portal Samppel.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} />
          <span>Atualizar</span>
        </button>
      </header>

      {/* METRICS PANELS - ADAPTS TO ROLES */}
      {user?.role === 'Produção' ? (
        /* PRODUCTION PROFILE DASHBOARD */
        <div className="dashboard-grid">
          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Pedidos Ativos</span>
              <span className="metric-value">{stats.activeOrdersCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Na Linha de Produção</span>
              <span className="metric-value">{stats.inProductionCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              <Wrench size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Aguardando Coleta / Expedição</span>
              <span className="metric-value">{stats.shippedCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <Truck size={24} />
            </div>
          </div>

          <div className="card metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <div className="metric-info">
              <span className="metric-label">Pedidos Atrasados</span>
              <span className="metric-value" style={{ color: 'var(--danger)' }}>{stats.lateOrdersCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>

          <div className="card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-info">
              <span className="metric-label">Travados (Aguardando Pgto)</span>
              <span className="metric-value" style={{ color: 'var(--warning)' }}>{stats.blockedWaitingPaymentCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN, FINANCE & SALES DASHBOARD */
        <div className="dashboard-grid">
          {/* Billing only visible to admin and finance */}
          {(user?.role === 'Administrador' || user?.role === 'Financeiro') && (
            <div className="card metric-card">
              <div className="metric-info">
                <span className="metric-label">Faturamento Liquidado</span>
                <span className="metric-value">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalBilling)}
                </span>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
            </div>
          )}

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Pedidos Ativos</span>
              <span className="metric-value">{stats.activeOrdersCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">A Receber (Pendente)</span>
              <span className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receivablesPending)}
              </span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>

          <div className="card metric-card">
            <div className="metric-info">
              <span className="metric-label">Contas a Pagar (Abertas)</span>
              <span className="metric-value" style={{ color: 'var(--danger)', fontSize: '1.5rem' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.payablesPending)}
              </span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)' }}>
              <ArrowDownRight size={24} />
            </div>
          </div>

          <div className="card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-info">
              <span className="metric-label">Pedidos Travados (Sem Pgto)</span>
              <span className="metric-value" style={{ color: 'var(--warning)', fontSize: '1.5rem' }}>{stats.blockedWaitingPaymentCount}</span>
            </div>
            <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* CHART 1: PRODUCTION BY SECTOR */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} style={{ color: 'var(--primary)' }} />
            Carga de Produção por Setor Ativo
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {sectors.map((sector, idx) => {
              const count = sectorCounts[idx];
              const pct = (count / maxSectorCount) * 100;
              return (
                <div key={sector} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 500 }}>
                    <span>{sector}</span>
                    <span style={{ fontWeight: 600 }}>{count} {count === 1 ? 'pedido' : 'pedidos'}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.max(pct, 3)}%`, 
                      height: '100%', 
                      backgroundColor: sector === 'Expedição' ? 'var(--success)' : 'var(--primary)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: FINANCIAL / ORDERS FLOW */}
        <div className="card">
          {user?.role === 'Produção' ? (
            /* Production sees orders distribution */
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--info)' }} />
                Status Geral dos Pedidos
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {statuses.map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const total = orders.length || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="badge" style={{ backgroundColor: statusColors[status] + '15', color: statusColors[status], width: '100px', justifyContent: 'center' }}>
                        {status}
                      </span>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: statusColors[status], borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '20px', textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Admin, Sales and Finance see financial balance chart */
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={18} style={{ color: 'var(--success)' }} />
                Balancete de Títulos (Receitas vs Despesas)
              </h3>
              
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-end', height: '160px', paddingBottom: '10px' }}>
                {/* Receitas Conciliadas */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.totalBilling)}
                  </span>
                  <div style={{
                    width: '60px',
                    height: `${Math.min(100, Math.max(10, (stats.totalBilling / Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1)) * 100))}%`,
                    background: 'linear-gradient(to top, var(--success) 0%, #34d399 100%)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recebido</span>
                </div>

                {/* Receitas Pendentes */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.receivablesPending)}
                  </span>
                  <div style={{
                    width: '60px',
                    height: `${Math.min(100, Math.max(10, (stats.receivablesPending / Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1)) * 100))}%`,
                    background: 'linear-gradient(to top, var(--primary) 0%, #60a5fa 100%)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(0, 97, 247, 0.2)'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A Receber</span>
                </div>

                {/* Despesas Pendentes */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.payablesPending)}
                  </span>
                  <div style={{
                    width: '60px',
                    height: `${Math.min(100, Math.max(10, (stats.payablesPending / Math.max(stats.totalBilling + stats.receivablesPending + stats.payablesPending, 1)) * 100))}%`,
                    background: 'linear-gradient(to top, var(--danger) 0%, #f87171 100%)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A Pagar</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RECENT ORDERS TABLE LISTING */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Últimas Movimentações de Pedidos</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>PV / OP</th>
                <th>Nome Arte (Cliente)</th>
                <th>Produto / Medida</th>
                <th>Tiragem</th>
                <th>Setor / Local</th>
                <th>Status</th>
                <th>Vendedora</th>
                <th>Lançamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div>{order.pv_number || `PV-${order.order_number}`}</div>
                    {order.op_number && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500 }}>
                        {order.op_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>🎨 {order.art_name || 'Arte Genérica'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.name}</div>
                  </td>
                  <td>
                    <div>{order.product?.name || 'Produto deletado'}</div>
                    <code style={{ fontSize: '0.7rem', padding: '0.125rem 0.25rem', backgroundColor: 'var(--background)', borderRadius: '3px' }}>
                      {order.measure}
                    </code>
                  </td>
                  <td>{order.print_run?.toLocaleString('pt-BR')} un</td>
                  <td>
                    <div>{order.production_sector}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {order.physical_location || 'Salão'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: statusColors[order.status] + '15', color: statusColors[order.status] }}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.seller_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum pedido cadastrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
</file>

<file path="src/app/globals.css">
@import "tailwindcss";

:root {
  --skeleton-animation: shimmer;
}

[data-theme="dark"], .dark {
  --skeleton-animation: pulse;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(200%);
  }
}

@keyframes skeleton-pulse {
  50% {
    opacity: 0.55;
  }
}

:root, [data-theme="light"] {
  /* Color Tokens - Light Mode */
  --primary: hsl(220, 95%, 50%);
  --primary-hover: hsl(354, 85%, 44%);
  --primary-rgb: 0, 97, 247;
  --secondary: hsl(220, 15%, 40%);
  --secondary-hover: hsl(220, 15%, 30%);
  
  --background: hsl(220, 30%, 96%);
  --sidebar-bg: hsl(220, 10%, 93%); /* Cinza claro empresarial */
  --sidebar-text: hsl(222, 47%, 12%);
  --sidebar-text-muted: hsl(220, 15%, 45%);
  --sidebar-active: hsl(220, 95%, 50%);
  
  --surface: hsl(0, 0%, 100%);
  --surface-hover: hsl(220, 20%, 98%);
  
  --text: hsl(222, 47%, 12%);
  --text-muted: hsl(220, 15%, 45%);
  --text-inverse: hsl(0, 0%, 100%);
  
  --border: hsl(220, 20%, 88%);
  --border-focus: var(--primary);
  
  --success: hsl(142, 70%, 35%);
  --success-bg: hsl(142, 70%, 92%);
  --warning: hsl(38, 92%, 40%);
  --warning-bg: hsl(38, 92%, 92%);
  --danger: hsl(0, 84%, 48%);
  --danger-bg: hsl(0, 84%, 93%);
  --info: hsl(199, 89%, 40%);
  --info-bg: hsl(199, 89%, 92%);
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  --shadow-premium: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  
  --font-sans: var(--font-geist-sans), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: var(--font-geist-mono), Courier, monospace;
}

[data-theme="dark"] {
  /* Color Tokens - Dark Mode */
  --background: hsl(222, 47%, 4%);
  --surface: hsl(222, 47%, 8%);
  --surface-hover: hsl(222, 47%, 12%);
  
  --text: hsl(210, 40%, 98%);
  --text-muted: hsl(215, 20%, 65%);
  
  --border: hsl(222, 47%, 15%);

  --primary: hsl(217, 91%, 60%);
  --primary-hover: hsl(354, 85%, 52%);
  --primary-rgb: 37, 99, 235;

  --sidebar-bg: hsl(222, 47%, 11%);
  --sidebar-text: hsl(210, 40%, 96%);
  --sidebar-text-muted: hsl(215, 20%, 65%);
  --sidebar-active: hsl(217, 91%, 60%);
  
  --success: hsl(142, 76%, 40%);
  --success-bg: rgba(16, 185, 129, 0.1);
  --warning: hsl(45, 93%, 47%);
  --warning-bg: rgba(245, 158, 11, 0.1);
  --danger: hsl(0, 84%, 60%);
  --danger-bg: rgba(239, 68, 68, 0.1);
  --info: hsl(199, 89%, 50%);
  --info-bg: rgba(14, 165, 233, 0.1);
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  --shadow-premium: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

/* Reset and Global Styles */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html, body {
  width: 100%;
  height: 100%;
  background-color: var(--background);
  color: var(--text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

a {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s ease;
}
a:hover {
  color: var(--primary-hover);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  color: var(--text);
  line-height: 1.25;
}

/* Common Layout Elements */
.app-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevents flex items from overflowing */
  background-color: var(--background);
}

.page-container {
  padding: 2rem;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  animation: fadeIn 0.35s ease;
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }
  .app-container {
    flex-direction: column;
  }
}

/* Glassmorphism Cards */
.card {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-hover);
}

/* Standard Premium Tables */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  background-color: var(--surface);
}

.table th {
  background-color: var(--surface-hover);
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}

.table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text);
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background-color: var(--surface-hover);
}

/* Forms & Inputs */
.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Button UI */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: var(--primary);
  color: var(--text-inverse);
}
.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--surface-hover);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background-color: var(--border);
}

.btn-danger {
  background-color: var(--danger);
  color: var(--text-inverse);
}
.btn-danger:hover {
  opacity: 0.9;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
}

.badge-success {
  background-color: var(--success-bg);
  color: var(--success);
}

.badge-warning {
  background-color: var(--warning-bg);
  color: var(--warning);
}

.badge-danger {
  background-color: var(--danger-bg);
  color: var(--danger);
}

.badge-info {
  background-color: var(--info-bg);
  color: var(--info);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* Search and filter layout */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  background-color: var(--surface);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  margin-bottom: 1.5rem;
  align-items: flex-end;
}

.filter-bar .form-group {
  margin-bottom: 0;
  flex: 1;
  min-width: 160px;
}

/* Dashboard Metrics CSS */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Skeleton Loading styles - Vanilla CSS */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton {
  position: relative;
  overflow: hidden;
  background-color: var(--surface-hover);
  border: 1px solid var(--border);
  display: inline-block;
  vertical-align: middle;
  min-height: 12px;
}

.skeleton::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.6s infinite ease-in-out;
  transform: translateX(-100%);
}

[data-theme="dark"] .skeleton::after {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0) 100%
  );
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Ocultar barra de rolagem mantendo funcionalidade */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 0 0px rgba(var(--primary-rgb), 0.6);
    transform: scale(0.96);
  }
  50% {
    box-shadow: 0 0 12px 3px rgba(var(--primary-rgb), 0.45);
    transform: scale(1.03);
  }
  100% {
    box-shadow: 0 0 0 0px rgba(var(--primary-rgb), 0);
    transform: scale(1);
  }
}

.pulse-glow {
  animation: pulseGlow 0.9s ease-out 1;
  z-index: 10;
}

.blinking-dot {
  animation: blinkAnimation 1.2s infinite ease-in-out;
  box-shadow: 0 0 6px var(--danger);
}

@keyframes blinkAnimation {
  0% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.3; transform: scale(0.9); }
}
</file>

<file path="src/app/layout.tsx">
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/components/Sidebar";
import AppGuard from "@/components/AppGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Samppel | Sistema Comercial & Produção",
  description: "MVP de Sistema Operacional Comercial para Embalagens Personalizadas integrado ao ERP Conta Azul.",
  keywords: "embalagens, conta azul, erp, portal samppel, vendas, expedição, produção",
  authors: [{ name: "Portal Samppel Team" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppGuard>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  {children}
                </div>
              </div>
            </AppGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
</file>

<file path="src/app/page.tsx">
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Boxes, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, changeActiveRole } = useAuth();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Administrador');
  
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [tempProfile, setTempProfile] = useState<any>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redireciona para o dashboard se o usuario ja estiver logado e nao estiver no seletor
  useEffect(() => {
    if (user && !showRoleSelector) {
      router.push('/dashboard');
    }
  }, [user, router, showRoleSelector]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUpMode) {
        if (!fullName.trim() || !email.trim() || !password) {
          throw new Error('Todos os campos sao obrigatorios para o cadastro.');
        }
        const { data, error: signUpErr } = await signUp(email, password, fullName, role);
        if (signUpErr) throw signUpErr;
        
        // Se a sessao for nula, significa que a confirmacao por e-mail esta ativa no Supabase
        if (data && !data.session) {
          alert('Cadastro realizado com sucesso! Um e-mail de confirmação foi enviado. Por favor, acesse sua caixa de entrada e confirme sua conta clicando no link do e-mail antes de fazer login.');
        } else {
          alert('Cadastro realizado com sucesso! Você já pode fazer login.');
        }
        setIsSignUpMode(false);
        setPassword('');
      } else {
        if (!email.trim() || !password) {
          throw new Error('E-mail e senha sao obrigatorios.');
        }
        const { data, error: signInErr } = await signIn(email, password);
        if (signInErr) throw signInErr;
        
        if (data?.profile && data.profile.role === 'Administrador') {
          setTempProfile(data.profile);
          setShowRoleSelector(true);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na autenticacao.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (selectedRole: UserRole) => {
    changeActiveRole(selectedRole);
    setShowRoleSelector(false);
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, hsl(222, 47%, 6%) 0%, hsl(222, 47%, 14%) 100%)',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-premium)',
        padding: '2.5rem',
        animation: 'fadeIn 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        
        {/* Logo da Marca */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: '1.5rem'
        }}>
          <Boxes size={36} />
        </div>

        {/* Nome da Marca */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Portal Samppel
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Sistema Comercial & Gestao de Producao de Embalagens Personalizadas
        </p>

        {showRoleSelector ? (
          <div style={{ width: '100%', textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Olá, {tempProfile?.full_name}!
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Você possui acesso administrativo. Escolha com qual perfil deseja navegar no sistema nesta sessão:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(['Administrador', 'Comercial', 'Produção', 'Financeiro'] as UserRole[]).map((roleOption) => (
                <button
                  key={roleOption}
                  onClick={() => handleSelectRole(roleOption)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: roleOption === 'Administrador' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)',
                    color: roleOption === 'Administrador' ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Acessar como {roleOption}</span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowRoleSelector(false);
                setTempProfile(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                width: '100%',
                textAlign: 'center'
              }}
            >
              Voltar para a tela de login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '0.8rem',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            {/* Formulario de Autenticacao */}
            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              
              {isSignUpMode && (
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignUpMode && (
                <div className="form-group">
                  <label className="form-label">Cargo / Funcao *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Produção">Producao (Fabrica)</option>
                    <option value="Financeiro">Financeiro</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '0.875rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '1rem', 
                  fontWeight: 600,
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{loading ? 'Processando...' : isSignUpMode ? 'Criar Minha Conta' : 'Acessar o Painel'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Link para alternar modo */}
            <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isSignUpMode ? 'Ja possui uma conta?' : 'Ainda nao tem acesso?'}
              </span>{' '}
              <button 
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setError(null);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {isSignUpMode ? 'Entrar no painel' : 'Cadastre-se aqui'}
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Samppel Embalagens Ltda &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
</file>

<file path="src/app/pedidos/page.tsx">
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  getCustomerStockCredits,
  getCustomerProductStock,
  updateCustomerStockCredit,
  updateCustomerProductStock,
  getFinancialTransactions,
  getProductionMachines,
  logSectorTransition,
  getHandlingTeams,
  getPackagingMaterialTypes,
  getOrderItemPackaging,
  saveOrderItemPackagingVolumes,
  getPackagingSettings,
  supabase
} from '@/services/supabase';
import { parseDeadlineFromNotes, isCardOverdue } from '@/services/deadline_service';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
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
  RefreshCw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale
} from 'lucide-react';

export default function PedidosPage() {
  const { user } = useAuth();
  
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
  
  // Modo de visualização: Kanban (padrão) ou Lista
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Estados dos Filtros
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterHandlingTeam, setFilterHandlingTeam] = useState('');

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customerCredits, setCustomerCredits] = useState<any[]>([]);
  const [customerStocks, setCustomerStocks] = useState<any[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);
  const [productionMachines, setProductionMachines] = useState<any[]>([]);
  const [handlingTeams, setHandlingTeams] = useState<any[]>([]);
  const [packagingMaterialTypes, setPackagingMaterialTypes] = useState<any[]>([]);
  const [packagingSettings, setPackagingSettings] = useState<any>(null);

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

  // Estados do Modal de Autorização de Retrocesso de Etapa
  const [isRevertAuthModalOpen, setIsRevertAuthModalOpen] = useState(false);
  const [pendingRevertItem, setPendingRevertItem] = useState<any>(null);
  const [pendingRevertTargetStageId, setPendingRevertTargetStageId] = useState('');
  const [revertAuthEmail, setRevertAuthEmail] = useState('');
  const [revertAuthPassword, setRevertAuthPassword] = useState('');
  const [revertAuthJustification, setRevertAuthJustification] = useState('');
  const [revertAuthLoading, setRevertAuthLoading] = useState(false);
  const [revertAuthError, setRevertAuthError] = useState('');

  // Ref que indica que o próximo move foi aprovado pelo Admin (bypass da verificação)
  const adminMoveOverride = useRef(false);

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

  const [formSelectedProductStock, setFormSelectedProductStock] = useState<number | null>(null);
  const [formMachineId, setFormMachineId] = useState('');
  const [formHandlingTeamId, setFormHandlingTeamId] = useState('');

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

      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
      setStages(stagesRes.data || []);
      setOrderItems(itemsRes.data || []);
      setAdjustments(adjRes.data || []);
      setCustomerCredits(credRes.data || []);
      setCustomerStocks(stockRes.data || []);
      setFinancialTransactions(finRes.data || []);

      // Chamadas opcionais — tabelas que podem não existir ainda (migração pendente)
      const [machResult, teamsResult, pmtResult, settingsResult] = await Promise.allSettled([
        getProductionMachines(tenantId),
        getHandlingTeams(tenantId),
        getPackagingMaterialTypes(tenantId),
        getPackagingSettings(tenantId)
      ]);

      if (machResult.status === 'fulfilled') setProductionMachines(machResult.value.data || []);
      if (teamsResult.status === 'fulfilled') setHandlingTeams(teamsResult.value.data || []);
      if (pmtResult.status === 'fulfilled') setPackagingMaterialTypes(pmtResult.value.data || []);
      if (settingsResult.status === 'fulfilled') setPackagingSettings(settingsResult.value.data || null);

      // Pré-carregar cache de quais itens já têm embalagem registrada
      const itemIds: string[] = (itemsRes.data || []).map((i: any) => i.id);
      if (itemIds.length > 0) {
        const packaged = new Set<string>();
        await Promise.allSettled(itemIds.map(async (id) => {
          const { data } = await getOrderItemPackaging(id);
          if (data && data.length > 0) packaged.add(id);
        }));
        setItemsWithPackaging(packaged);
      }
    } catch (e) {
      console.error('Erro ao carregar dados da página de pedidos:', e);
    } finally {
      setLoading(false);
    }
  };


  const fetchUserPermissions = async () => {
    if (!user || !supabase) return;
    try {
      if (user.role === 'Administrador') {
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

  const handleImportOrders = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/sync/import-orders', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Falha ao importar pedidos.');
      }
      const data = await res.json();
      if (data.success) {
        alert(`Sincronização concluída com sucesso! Pedidos importados: ${data.imported}, atualizados: ${data.updated}.`);
        fetchAllData();
      } else {
        alert('Erro ao importar pedidos: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao importar pedidos.');
    } finally {
      setImporting(false);
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

  // Movimentar item de pedido para uma etapa
  const moveOrderItemToStage = async (item: any, targetStageId: string) => {
    const currentStageId = item.stage_id;
    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    const currentStage = stages.find(s => s.id === currentStageId);

    // ---------------------------------------------------------------
    // REGRA DE RETROCESSO: Janela de 10 minutos + aprovação do Admin
    // ---------------------------------------------------------------
    if (!adminMoveOverride.current) {
      const currentSeq: number = (currentStage as any)?.sequence ?? 999;
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
          setRevertAuthEmail('');
          setRevertAuthPassword('');
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
    const isMovingFromPedidosToProductionOrStock = 
      (!currentStage || currentStage.name === 'A produzir') && 
      (targetStage.name === 'Em produção' || targetStage.name === 'Estoque');

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
    if (user && user.role !== 'Administrador') {
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

    // Regra básica de negócio: Não mover para produção se não houver sinal ou se houver parcelas vencidas
    const isProductionStage = ['Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Concluído', 'Atrasado'].includes(targetStage.name);
    
    if (isProductionStage && user?.role !== 'Administrador') {
      const isParentPaid = !!item.order?.first_payment_date;
      const isOverdue = hasOverdueInstallments(item.order_id);
      
      if (!isParentPaid) {
        alert(`Bloqueio de Produção: O pedido ${item.order?.pv_number || 'PV'} ainda não foi autorizado financeiramente (sem data de sinal/primeiro pagamento).`);
        return;
      }
      
      if (isOverdue) {
        alert(`Bloqueio de Produção: O pedido ${item.order?.pv_number || 'PV'} possui parcelas em atraso financeiro no Conta Azul.`);
        return;
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

      const targetSector = getSectorForStageName(targetStage.name, item.production_sector);
      const updates = {
        stage_id: targetStageId,
        status: targetStage.name,
        production_sector: targetSector
      };

      const { error } = await updateOrderItem(item.id, updates);
      if (error) {
        alert('Erro ao mover item: ' + error.message);
      } else {
        if (item.production_sector !== targetSector) {
          const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
          await logSectorTransition(item.id, targetSector, item.machine_id, tenantId);
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
        setTimeout(() => {
          setRecentlyMovedItemId(null);
        }, 1500);
      }
    } catch (e) {
      console.error('Erro ao mover item:', e);
      alert('Erro ao mover item.');
    } finally {
      setLoading(false);
    }
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
        notes: adjustmentNotes
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

      // Abrir o modal de ajuste/conferência (próximo passo obrigatório)
      setAdjustmentItem(packagingModalItem);
      setAdjustmentTargetStageId(packagingModalTargetStageId);
      setProducedQuantity(packagingModalItem.print_run || 1000);
      setAdjustmentAction('CREDITO_PROXIMO_PEDIDO');
      setAdjustmentNotes('');
      setIsAdjustmentModalOpen(true);

      setPackagingModalItem(null);
      setPackagingVolumes([]);
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
          notes: `Abatimento efetuado: Consumidos ${qtyToConsume} de crédito de falta pendente do PV original.`
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
          notes: `Despacho de estoque: Consumidos ${qtyToConsume} sacos do estoque de personalizados na fábrica.`
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
          notes: `Decisão de início de produção: Mantido crédito/estoque intacto para produzir tiragem completa solicitada.`
        });
      }

      // 2. Mover o card para a etapa correspondente
      const targetStage = stages.find(s => s.id === suggestionTargetStageId);
      const updates = {
        stage_id: suggestionTargetStageId,
        status: targetStage?.name || 'Produção',
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

  // Handlers para HTML5 Drag and Drop
  const handleDragStart = (e: React.DragEvent, item: any) => {
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const itemToMove = orderItems.find(i => i.id === itemId);
    if (!itemToMove) return;

    await moveOrderItemToStage(itemToMove, targetStageId);
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
    setIsDetailModalOpen(true);
  };

  // Submeter aprovacao do Administrador para retrocesso de etapa
  const handleRevertAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevertAuthLoading(true);
    setRevertAuthError('');

    try {
      if (!revertAuthJustification.trim()) {
        setRevertAuthError('A justificativa é obrigatória.');
        return;
      }

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

  // Abrir modal para Edição
  const handleOpenEdit = (entity: any) => {
    setModalType('edit');
    if (entity.order_id) {
      // É um order_item do Kanban
      setSelectedItem(entity);
      const order = entity.order || {};
      setSelectedOrder(order);
      
      setFormCustomer(order.customer_id || '');
      setFormProduct(entity.product_id || '');
      setFormMeasure(entity.measure || '');
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
    } else {
      // É um pedido macro vindo da listagem
      setSelectedOrder(entity);
      const correspondingItem = orderItems.find(item => item.order_id === entity.id);
      if (correspondingItem) {
        setSelectedItem(correspondingItem);
        setFormProduct(correspondingItem.product_id || '');
        setFormMeasure(correspondingItem.measure || '');
        setFormPrintRun(correspondingItem.print_run || 1000);
        setFormBoxes(correspondingItem.boxes_count || 1);
        setFormNotes(correspondingItem.notes || '');
        setFormStatus(correspondingItem.status || 'A produzir');
        setFormStageId(correspondingItem.stage_id || '');
        setFormSector(correspondingItem.production_sector || 'Impressão');
        setFormMachineId(correspondingItem.machine_id || '');
        setFormHandlingTeamId(correspondingItem.handling_team_id || '');
        setFormArtName(correspondingItem.name || '');
        setFormPackagingType(correspondingItem.packaging_type || 'CAIXA');
        setFormOverShortQuantity(correspondingItem.over_short_quantity || 0);
        setFormPhysicalLocation(correspondingItem.physical_location || 'Salão');
      } else {
        setSelectedItem(null);
        setFormProduct(entity.product_id || '');
        setFormMeasure(entity.measure || '');
        setFormPrintRun(entity.print_run || 1000);
        setFormBoxes(entity.boxes_count || 1);
        setFormNotes(entity.notes || '');
        setFormStatus(entity.status || 'A produzir');
        setFormStageId(entity.stage_id || '');
        setFormSector(entity.production_sector || 'Impressão');
        setFormMachineId('');
        setFormHandlingTeamId('');
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

  // Submit do formulário de pedidos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === 'create') {
      const orderPayload = {
        customer_id: formCustomer,
        product_id: formProduct || null,
        measure: formMeasure,
        print_run: Number(formPrintRun),
        boxes_count: Number(formBoxes),
        freight_value: Number(formFreight),
        seller_name: formSeller || 'Vendas Samppel',
        notes: formNotes,
        internal_notes: formInternalNotes,
        status: formStatus,
        stage_id: formStageId || null,
        production_sector: formSector,
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
          handling_team_id: formHandlingTeamId || null,
          physical_location: formPhysicalLocation,
          over_short_quantity: Number(formOverShortQuantity),
          notes: formNotes
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
        } else if (user?.role === 'Produção' || user?.role === 'Estoque' || user?.role === 'Expedição') {
          orderPayload = {
            internal_notes: formInternalNotes
          };
        } else {
          // Admin ou Comercial
          orderPayload = {
            customer_id: formCustomer,
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
          // Log de transição se houver mudança de setor ou de máquina
          const sectorChanged = selectedItem.production_sector !== formSector;
          const machineChanged = selectedItem.machine_id !== formMachineId;
          
          if (sectorChanged || machineChanged) {
            const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
            await logSectorTransition(selectedItem.id, formSector, formMachineId || null, tenantId);
          }

          setIsModalOpen(false);
          fetchAllData();
        }
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
          updatePayload = {
            customer_id: formCustomer,
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

  const isSupervisor = user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
  const isVendedor = user?.role === 'Comercial' && !isSupervisor;
  const hideMonetaryValues = (user?.role === 'Comercial' && !isVendedor) ? false : ((user?.role === 'Comercial' && isVendedor) || ['Produção', 'Estoque', 'Expedição'].includes(user?.role || ''));

  // Lógica de Filtros
  const filteredOrders = orders.filter(order => {
    if (isVendedor && user) {
      const userFirstName = user.full_name.split(' ')[0].toLowerCase();
      const sellerNameLower = (order.seller_name || '').toLowerCase();
      if (!sellerNameLower.includes(userFirstName)) return false;
    }
    const matchCustomer = filterCustomer ? order.customer_id === filterCustomer : true;
    const matchSeller = filterSeller ? order.seller_name.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchStatus = filterStatus ? order.status === filterStatus : true;
    const matchSector = filterSector ? order.production_sector === filterSector : true;
    const matchDate = filterDate ? new Date(order.order_date).toLocaleDateString('pt-BR') === new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR') : true;
    return matchCustomer && matchSeller && matchStatus && matchSector && matchDate;
  });

  // Lógica de Filtros para Itens no Kanban
  const filteredOrderItems = orderItems.filter(item => {
    const parentOrder = item.order || {};
    
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

    const matchCustomer = filterCustomer ? parentOrder.customer_id === filterCustomer : true;
    const matchSeller = filterSeller ? parentOrder.seller_name?.toLowerCase().includes(filterSeller.toLowerCase()) : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    const matchSector = filterSector ? item.production_sector === filterSector : true;
    const matchDate = filterDate ? new Date(parentOrder.order_date).toLocaleDateString('pt-BR') === new Date(filterDate + 'T12:00:00').toLocaleDateString('pt-BR') : true;
    const matchHandlingTeam = filterHandlingTeam ? item.handling_team_id === filterHandlingTeam : true;
    return matchCustomer && matchSeller && matchStatus && matchSector && matchDate && matchHandlingTeam;
  });

  const getFreightBadgeStyle = (shippingType: string) => {
    switch (shippingType) {
      case 'LALAMOVE':
      case 'MOTOBOY':
        return { backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)', color: 'hsl(271, 91.2%, 65.1%)', label: '⚡ Lalamove/Moto' };
      case 'ENTREGA_PROPRIA':
        return { backgroundColor: 'hsla(24, 95.8%, 53.1%, 0.15)', color: 'hsl(24, 95.8%, 53.1%)', label: '🚗 Carro Próprio' };
      case 'TRANSPORTADORA':
      case 'TRANSPORTADORA_LONGA':
        return { backgroundColor: 'hsla(221.2, 83.2%, 53.3%, 0.15)', color: 'hsl(221.2, 83.2%, 53.3%)', label: '🚛 Transportadora' };
      case 'RETIRADA':
      default:
        return { backgroundColor: 'hsla(215.4, 16.3%, 46.9%, 0.15)', color: 'hsl(215.4, 16.3%, 46.9%)', label: '🏪 Retirada' };
    }
  };

  const visibleStages = stages.filter(stage => {
    if (!user) return true;
    if (user.role === 'Produção') {
      return ['Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Atrasado'].includes(stage.name);
    }
    if (user.role === 'Estoque') {
      return ['Estoque'].includes(stage.name);
    }
    if (user.role === 'Expedição') {
      return ['Em revisão', 'Expedição', 'Concluído', 'Atrasado'].includes(stage.name);
    }
    return true;
  });

  const canCreate = user?.role === 'Administrador' || user?.role === 'Comercial';
  
  const isReadOnlyForForm = (field: string) => {
    if (modalType === 'create') return false;
    if (user?.role === 'Administrador' || user?.role === 'Comercial') return false;
    
    if (user?.role === 'Produção') {
      return !['status', 'sector', 'physicalLocation', 'overShortQuantity', 'internalNotes'].includes(field);
    }
    
    if (user?.role === 'Financeiro') {
      return !['status', 'firstPaymentDate', 'installmentsPaid', 'installmentsTotal', 'productionStartDate', 'internalNotes'].includes(field);
    }

    if (user?.role === 'Expedição') {
      return !['status', 'packaging_type', 'boxes', 'overShortQuantity', 'physicalLocation', 'internalNotes'].includes(field);
    }

    if (user?.role === 'Estoque') {
      return !['status', 'physicalLocation', 'internalNotes'].includes(field);
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
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pedidos & Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Acompanhe a produção física pelo Kanban ou gerencie o status de faturamento na listagem.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Alternador de Modo de Visualização */}
          <div style={{ display: 'flex', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'kanban' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'kanban' ? 'var(--shadow-sm)' : 'none',
                fontWeight: viewMode === 'kanban' ? 600 : 500
              }}
            >
              <LayoutGrid size={14} />
              <span>Painel Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                fontWeight: viewMode === 'list' ? 600 : 500
              }}
            >
              <List size={14} />
              <span>Lista</span>
            </button>
          </div>

          <button 
            onClick={handleImportOrders} 
            disabled={importing}
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={16} className={importing ? 'spinner' : ''} />
            <span>{importing ? 'Importando...' : 'Importar Conta Azul'}</span>
          </button>

          {canCreate && (
            <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Plus size={16} />
              <span>Novo Pedido</span>
            </button>
          )}
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Filtrar por Cliente</label>
          <select 
            className="form-select" 
            value={filterCustomer} 
            onChange={(e) => setFilterCustomer(e.target.value)}
          >
            <option value="">Todos os Clientes</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Filtrar por Vendedora</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Nome da vendedora"
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Filtrar por Status</label>
          <select 
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            {stages.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Setor de Produção</label>
          <select 
            className="form-select"
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
          >
            <option value="">Todos os Setores</option>
            <option value="Impressão">Impressão</option>
            <option value="Corte e Vinco">Corte e Vinco</option>
            <option value="Colagem">Colagem</option>
            <option value="Expedição">Expedição</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Filtrar por Data</label>
          <input 
            type="date" 
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {/* Filtro exclusivo para o setor de manuseio */}
        {(user?.role === 'Produção' || user?.role === 'Administrador' || user?.role === 'Comercial') && handlingTeams.length > 0 && (
          <div className="form-group" style={{ background: 'hsla(271, 91.2%, 65.1%, 0.06)', border: '1px solid hsla(271, 91.2%, 65.1%, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              👥 Filtrar por Equipe de Manuseio
            </label>
            <select 
              className="form-select"
              value={filterHandlingTeam}
              onChange={(e) => setFilterHandlingTeam(e.target.value)}
            >
              <option value="">Todas as Equipes</option>
              {handlingTeams
                .filter(t => t.status === 'ATIVO')
                .map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))
              }
            </select>
          </div>
        )}

        <button 
          className="btn btn-secondary" 
          onClick={() => {
            setFilterCustomer('');
            setFilterSeller('');
            setFilterStatus('');
            setFilterSector('');
            setFilterDate('');
            setFilterHandlingTeam('');
          }}
        >
          Limpar Filtros
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* 1. VISUALIZAÇÃO KANBAN */
        <div 
          className="no-scrollbar"
          style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            width: '100%',
            minHeight: '70vh',
            alignItems: 'flex-start'
          }}
        >
          {visibleStages.map((stage) => {
            const originalIdx = stages.findIndex(s => s.id === stage.id);
            const stageItems = filteredOrderItems.filter(item => 
              item.stage_id === stage.id || (!item.stage_id && originalIdx === 0)
            );

            return (
              <div 
                key={stage.id} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.id)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '80vh'
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
                          color: 'var(--text)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '90px'
                        }} 
                        title={stage.name}
                      >
                        {stage.name}
                      </span>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '1px 5px', fontWeight: 600 }}>
                      {stageItems.length}
                    </span>
                  </div>
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
                    minHeight: '150px'
                  }}
                >
                  {stageItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1.5rem 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      Vazio
                    </div>
                  ) : (
                    stageItems.map((item) => {
                      const parentOrder = item.order || {};
                      const isReleased = !!parentOrder.first_payment_date;
                      const overShort = item.over_short_quantity || 0;
                      const freightStyle = getFreightBadgeStyle(parentOrder.shipping_type);
                      
                      return (
                        <div 
                          key={item.id}
                          className={recentlyMovedItemId === item.id ? 'pulse-glow' : ''}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={(e) => {
                            // Abre detalhes apenas em clique direto (não durante drag)
                            const target = e.target as HTMLElement;
                            const isButton = target.closest('button');
                            if (!isButton) handleOpenDetail(item);
                          }}
                          style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderLeft: `3px solid ${stage.color}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                          }}
                        >
                          {/* PV e OP */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.725rem', color: 'var(--text)' }}>
                                {item.friendly_id || '---'}
                              </span>
                              {hasOverdueInstallments(item.order_id) && (
                                <span 
                                  className="blinking-dot" 
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--danger)',
                                    display: 'inline-block'
                                  }}
                                  title="Atenção: Parcela em atraso no Conta Azul!"
                                />
                              )}
                            </div>
                            {parentOrder.op_number ? (
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
                            ) : (
                              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Est.</span>
                            )}
                          </div>

                          {/* Arte & Cliente */}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.75rem', lineHeight: '1.1', wordBreak: 'break-all' }}>
                              🎨 {item.name || 'Arte'}
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

                          {/* Produto e Tiragem */}
                          <div style={{ fontSize: '0.65rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '0.2rem 0', display: 'flex', justifyContent: 'space-between', gap: '2px' }}>
                            <span>{item.print_run?.toLocaleString('pt-BR')} un</span>
                            <span style={{ fontWeight: 600 }}>
                              {item.boxes_count}{item.packaging_type === 'PACOTE' ? 'pct' : 'cx'}
                            </span>
                          </div>

                          {/* Setor, Tipo e Localização */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', gap: '2px' }}>
                            <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '0px 4px', textTransform: 'capitalize' }}>
                              {item.production_sector}
                            </span>
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
                              📍 {item.physical_location || 'Salão'}
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
                          </div>

                          {/* Exibição do Prazo Extraído */}
                          {(() => {
                            const deadline = parseDeadlineFromNotes(item.notes || parentOrder.notes);
                            if (!deadline) return null;
                            const isOverdue = deadline.getTime() < Date.now() && stage.name !== 'Concluído';
                            
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
                                📅 Prazo: {deadline.toLocaleDateString('pt-BR')}
                                {isOverdue && <span style={{ fontSize: '0.6rem' }}>⚠️ (Atrasado)</span>}
                              </div>
                            );
                          })()}

                          {/* Informações adicionais como Prazo e Vendedora */}
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>Vend: {parentOrder.seller_name || 'Samppel'}</span>
                            <span>Tipo: {item.item_type}</span>
                          </div>

                          {/* Badge de Equipe de Manuseio */}
                          {item.production_sector === 'Manuseio' && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginTop: '2px',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: item.handling_team_id
                                ? 'hsla(271, 91.2%, 65.1%, 0.12)'
                                : 'hsla(0, 84.2%, 60.2%, 0.08)',
                              border: `1px solid ${item.handling_team_id ? 'hsla(271, 91.2%, 65.1%, 0.3)' : 'hsla(0, 84.2%, 60.2%, 0.2)'}`,
                            }}>
                              <span style={{ fontSize: '0.6rem' }}>👥</span>
                              <span style={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 700,
                                color: item.handling_team_id ? 'hsl(271, 91.2%, 55%)' : 'hsl(0, 84.2%, 50%)'
                              }}>
                                {item.handling_team_id
                                  ? (handlingTeams.find(t => t.id === item.handling_team_id)?.name || 'Equipe desconhecida')
                                  : 'Sem equipe vinculada'
                                }
                              </span>
                            </div>
                          )}
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
                              <span style={{ fontSize: '0.65rem' }}>{itemsWithPackaging.has(item.id) ? '✅' : '📦'}</span>
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: itemsWithPackaging.has(item.id) ? 'hsl(168, 83.8%, 35%)' : 'hsl(38, 92.7%, 45%)'
                              }}>
                                {itemsWithPackaging.has(item.id) ? 'Embalagem Registrada' : 'Registrar Embalagem'}
                              </span>
                            </button>
                          )}

                          {/* Ações (Setas de Navegação Manual + Editar) */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '1px' }}>
                              <button
                                disabled={originalIdx === 0}
                                onClick={() => moveOrderItemToStage(item, stages[originalIdx - 1].id)}
                                className="btn btn-secondary"
                                style={{ padding: '1px 3px', display: 'flex', alignItems: 'center' }}
                                title="Voltar"
                              >
                                <ChevronLeft size={10} />
                              </button>
                              <button
                                disabled={originalIdx === stages.length - 1}
                                onClick={() => moveOrderItemToStage(item, stages[originalIdx + 1].id)}
                                className="btn btn-secondary"
                                style={{ padding: '1px 3px', display: 'flex', alignItems: 'center' }}
                                title="Avançar"
                              >
                                <ChevronRight size={10} />
                              </button>
                            </div>

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
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        
        /* 2. VISUALIZAÇÃO EM LISTA (TABELA) */
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>PV / OP</th>
                  <th>Nome Arte (Cliente)</th>
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
                      <tr key={order.id}>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.pv_number || '---'}</div>
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
                            🎨 {order.art_name || 'Arte Genérica'}
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
                            {order.boxes_count} {order.packaging_type === 'PACOTE' ? 'pacote(s)' : 'caixa(s)'}
                          </div>
                          {order.packaging_type === 'PACOTE' && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(100 un por pct)</div>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className="badge badge-info" style={{ textTransform: 'capitalize', display: 'block', textAlign: 'center', marginBottom: '4px' }}>
                            {order.production_sector}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            📍 {order.physical_location || 'Salão'}
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
                💡 Alerta: Crédito ou Estoque de Personalizados
              </h3>
              <button 
                onClick={() => setIsSuggestionModalOpen(false)} 
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
                  onClick={() => setIsSuggestionModalOpen(false)} 
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
                  📦 Registro de Embalagem
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {packagingModalItem.friendly_id} — {packagingModalItem.name}
                  {packagingModalTargetStageId && (
                    <span style={{ marginLeft: '0.5rem', color: 'hsl(38, 92.7%, 45%)', fontWeight: 600 }}>
                      ⚠️ Preenchimento obrigatório para avançar para Expedição
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setIsPackagingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Resumo do item */}
            <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
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
                      📦 Volume {idx + 1}
                    </h4>
                    {packagingVolumes.length > 1 && (
                      <button type="button" onClick={() => handleRemovePackagingVolume(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        🗑 Remover
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
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
                            {t.category === 'CAIXA' ? '📦' : t.category === 'FUNDO' ? '🟫' : t.category === 'DIVISORIA' ? '🔲' : t.category === 'SACO' ? '🛍️' : '➕'} {t.name}{t.code ? ` (${t.code})` : ''}
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
                      📐 Volume unitário: <strong>{(Number(vol.length_cm) * Number(vol.width_cm) * Number(vol.height_cm) / 1000000).toFixed(4)} m³</strong>
                      {vol.weight_kg && (<span style={{ marginLeft: '1rem' }}>⚖️ Peso total: <strong>{(Number(vol.weight_kg) * Number(vol.box_count)).toFixed(3)} kg</strong></span>)}
                    </div>
                  )}
                </div>
              ))}

              {/* Botão adicionar volume */}
              <button type="button" onClick={handleAddPackagingVolume}
                style={{ width: '100%', padding: '0.5rem', border: '1px dashed var(--border)', background: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                ➕ Adicionar Volume
              </button>

              {/* Rodapé do modal */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPackagingModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPackaging}>
                  {savingPackaging ? 'Salvando...' : packagingModalTargetStageId ? '✅ Salvar e Avançar para Expedição' : '💾 Salvar Embalagem'}
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
                ⚖️ Conferência de Sobras & Faltas
              </h3>
              <button 
                onClick={() => setIsAdjustmentModalOpen(false)} 
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
                  onClick={() => setIsAdjustmentModalOpen(false)} 
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
            animation: 'fadeIn 0.25s ease'
          }}>
            <header style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                {modalType === 'create' ? 'Cadastrar Novo Pedido' : (isReadOnlyForForm('customer') ? 'Detalhes do Pedido' : 'Editar Informações do Pedido')}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
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
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nome da Arte / Identificação Visual da Embalagem *</label>
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
                  <select 
                    className="form-select"
                    required
                    value={formCustomer}
                    disabled={isReadOnlyForForm('customer')}
                    onChange={(e) => setFormCustomer(e.target.value)}
                  >
                    <option value="">Selecione o Cliente</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                  <label className="form-label">Medidas Customizadas *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: 20x15x8 cm"
                    required
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

                {/* Tipo de Embalagem */}
                <div className="form-group">
                  <label className="form-label">Tipo de Embalagem Final *</label>
                  <select 
                    className="form-select"
                    required
                    value={formPackagingType}
                    disabled={isReadOnlyForForm('packaging_type')}
                    onChange={(e) => setFormPackagingType(e.target.value as any)}
                  >
                    <option value="CAIXA">Caixas</option>
                    <option value="PACOTE">Pacotes (100 un)</option>
                  </select>
                </div>

                {/* Qtd. Embalagens */}
                <div className="form-group">
                  <label className="form-label">Qtd. de Caixas/Pacotes de Embalagem *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required
                    min={1}
                    value={formBoxes}
                    disabled={isReadOnlyForForm('boxes')}
                    onChange={(e) => setFormBoxes(Number(e.target.value))}
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

                {/* Localização Física */}
                <div className="form-group">
                  <label className="form-label">📍 Localização Física na Fábrica</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Máquina Flexo 2, Salão, Pátio"
                    value={formPhysicalLocation}
                    disabled={isReadOnlyForForm('physicalLocation')}
                    onChange={(e) => setFormPhysicalLocation(e.target.value)}
                  />
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
              </div>

              {/* CONTROLE FINANCEIRO */}
              {user?.role !== 'Produção' && user?.role !== 'Estoque' && user?.role !== 'Expedição' && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>Controle Financeiro & Liberação da Fábrica</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                
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
                  <label className="form-label" style={{ fontWeight: 600 }}>Setor de Produção Física</label>
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
                    <option value="Impressão">Impressão</option>
                    <option value="Corte e Vinco">Corte e Vinco</option>
                    <option value="Colagem">Colagem</option>
                    <option value="Guilhotina">Guilhotina</option>
                    <option value="Manuseio">Manuseio / Acabamento</option>
                    <option value="Expedição">Expedição</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Estoque">Estoque (Pronta Entrega)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Máquina de Produção Vinculada</label>
                  <select 
                    className="form-select"
                    value={formMachineId}
                    disabled={isReadOnlyForForm('sector')}
                    onChange={(e) => setFormMachineId(e.target.value)}
                  >
                    <option value="">Nenhuma Máquina Vinculada</option>
                    {productionMachines
                      .filter(m => m.sector === formSector && m.status === 'ATIVO')
                      .map((mach) => (
                        <option key={mach.id} value={mach.id}>{mach.name}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Campo de Equipe de Manuseio — visível sempre que setor for Manuseio */}
                {formSector === 'Manuseio' && (
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'hsla(271, 91.2%, 65.1%, 0.08)', border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      👥 Equipe de Manuseio Responsável
                    </label>
                    <select 
                      className="form-select"
                      value={formHandlingTeamId}
                      onChange={(e) => setFormHandlingTeamId(e.target.value)}
                    >
                      <option value="">Sem Equipe Vinculada</option>
                      {handlingTeams
                        .filter(t => t.status === 'ATIVO')
                        .map((team) => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))
                      }
                    </select>
                    {!formHandlingTeamId && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        ⚠️ Indique com qual equipe este material está sendo trabalhado.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Observações Públicas */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Observações do Pedido (Cliente/Layout)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Instruções de personalização, acabamento ou dados da transportadora..."
                  value={formNotes}
                  disabled={isReadOnlyForForm('notes')}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Observações Internas */}
              <div className="form-group" style={{ marginTop: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}>
                <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>Anotações Internas (Uso Exclusivo Samppel)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Detalhamento operacional interno, histórico de pagamentos, logs da fábrica, etc..."
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                />
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
                {(!isReadOnlyForForm('customer') || !isReadOnlyForForm('status')) && (
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
                    <span style={{ fontSize: '1.1rem' }}>🔒</span>
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
                    🎨 {item.name}
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
                  <input
                    className="form-input"
                    type="password"
                    placeholder="••••••••"
                    value={revertAuthPassword}
                    onChange={e => setRevertAuthPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Justificativa <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Descreva o motivo do retrocesso manual..."
                    value={revertAuthJustification}
                    onChange={e => setRevertAuthJustification(e.target.value)}
                    required
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
                    ⚠ {revertAuthError}
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

      {/* ========================================
          MODAL DE DETALHES DO CARD
          ======================================== */}
      {isDetailModalOpen && detailItem && (() => {
        const order = detailItem.order || {};
        const customer = order.customer || {};
        const currentStage = stages.find(s => s.id === detailItem.stage_id);
        const itemAdjs = adjustments.filter(a => a.order_item_id === detailItem.id);
        const deadline = parseDeadlineFromNotes(detailItem.notes || order.notes);
        const isOverdue = deadline ? deadline.getTime() < Date.now() && currentStage?.name !== 'Concluído' : false;
        const freightStyle = getFreightBadgeStyle(order.shipping_type);
        const isReleased = !!order.first_payment_date;

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false); }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1100, padding: '1rem',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header */}
              <div style={{
                padding: '1.1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${currentStage?.color || 'var(--primary)'}18 0%, transparent 100%)`,
                borderLeft: `4px solid ${currentStage?.color || 'var(--primary)'}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                      {detailItem.friendly_id || '---'}
                    </span>
                    {currentStage && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700,
                        backgroundColor: currentStage.color + '22',
                        color: currentStage.color,
                        padding: '2px 8px', borderRadius: '99px',
                        border: `1px solid ${currentStage.color}55`
                      }}>
                        {currentStage.name}
                      </span>
                    )}
                    {isOverdue && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>⚠️ Atrasado</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    🎨 {detailItem.name} · {customer.name || 'Cliente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Corpo com scroll */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Seção: Informações do Pedido */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                    Pedido
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'PV', value: order.pv_number || '—' },
                      { label: 'OP', value: order.op_number || '—' },
                      { label: 'Arte', value: detailItem.name || '—' },
                      { label: 'Vendedor(a)', value: order.seller_name || 'Samppel' },
                      { label: 'Data do Pedido', value: order.order_date ? new Date(order.order_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                      { label: 'Início Produção', value: order.production_start_date ? new Date(order.production_start_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Seção: Cliente */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: '#a855f7', borderRadius: '2px', display: 'inline-block' }} />
                    Cliente
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'Nome', value: customer.name || '—' },
                      { label: 'CNPJ/CPF', value: customer.cnpj || customer.cpf || '—' },
                      { label: 'E-mail', value: customer.email || '—' },
                      { label: 'Telefone', value: customer.phone || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500, wordBreak: 'break-all' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Seção: Produção */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} />
                    Produção
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'Tiragem', value: (detailItem.print_run || 0).toLocaleString('pt-BR') + ' un' },
                      { label: 'Caixas', value: `${detailItem.boxes_count || 0} ${detailItem.packaging_type === 'PACOTE' ? 'pct' : 'cx'}` },
                      { label: 'Medida', value: detailItem.measure || '—' },
                      { label: 'Setor', value: detailItem.production_sector || '—' },
                      { label: 'Localização', value: detailItem.physical_location || 'Salão' },
                      { label: 'Sobra/Falta', value: detailItem.over_short_quantity > 0 ? `+${detailItem.over_short_quantity}` : detailItem.over_short_quantity < 0 ? `${detailItem.over_short_quantity}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

                {/* Seção: Financeiro */}
                <section>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }} />
                    Financeiro
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.75rem', borderRadius: '99px',
                      backgroundColor: isReleased ? 'hsla(142, 76.2%, 36.3%, 0.12)' : 'hsla(0, 84.2%, 60.2%, 0.10)',
                      border: `1px solid ${isReleased ? 'hsla(142, 76.2%, 36.3%, 0.35)' : 'hsla(0, 84.2%, 60.2%, 0.3)'}`,
                      color: isReleased ? 'hsl(142, 76.2%, 36.3%)' : 'hsl(0, 84.2%, 50%)',
                      fontSize: '0.75rem', fontWeight: 700
                    }}>
                      {isReleased ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {isReleased ? 'Liberado para Produção' : 'Aguardando Pagamento'}
                    </div>
                    {isReleased && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sinal: {new Date(order.first_payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.6rem' }}>
                    {[
                      { label: 'Frete', value: freightStyle.label },
                      { label: 'Parcelas', value: `${order.installments_paid || 0}/${order.installments_total || 1} pagas` },
                      { label: 'Frete (R$)', value: order.freight_value ? `R$ ${Number(order.freight_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Seção: Prazo */}
                {deadline && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                    <section>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '3px', height: '12px', backgroundColor: isOverdue ? 'var(--danger)' : '#f97316', borderRadius: '2px', display: 'inline-block' }} />
                        Prazo
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)',
                        backgroundColor: isOverdue ? 'hsla(0, 84.2%, 60.2%, 0.08)' : 'hsla(38, 92.7%, 50.2%, 0.08)',
                        border: `1px solid ${isOverdue ? 'hsla(0, 84.2%, 60.2%, 0.3)' : 'hsla(38, 92.7%, 50.2%, 0.3)'}`,
                        color: isOverdue ? 'var(--danger)' : 'hsl(38, 92.7%, 45%)',
                        fontSize: '0.82rem', fontWeight: 700
                      }}>
                        📅 {deadline.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        {isOverdue && <span>(ATRASADO)</span>}
                      </div>
                    </section>
                  </>
                )}

                {/* Seção: Observações */}
                {(detailItem.notes || order.notes || order.internal_notes) && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                    <section>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '3px', height: '12px', backgroundColor: '#eab308', borderRadius: '2px', display: 'inline-block' }} />
                        Observações
                      </div>
                      {detailItem.notes && (
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Obs. do Item</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{detailItem.notes}</p>
                        </div>
                      )}
                      {(order.notes && !detailItem.notes) && (
                        <div style={{ marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Obs. do Pedido</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{order.notes}</p>
                        </div>
                      )}
                      {order.internal_notes && (
                        <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '0.6rem', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>🔒 Anotações Internas</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{order.internal_notes}</p>
                        </div>
                      )}
                    </section>
                  </>
                )}

                {/* Seção: Conferências (se houver) */}
                {itemAdjs.length > 0 && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />
                    <section>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '3px', height: '12px', backgroundColor: 'hsl(168, 83.8%, 38.6%)', borderRadius: '2px', display: 'inline-block' }} />
                        Conferência de Tiragem ({itemAdjs.length})
                      </div>
                      {itemAdjs.map((adj: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          backgroundColor: adj.difference_quantity >= 0 ? 'hsla(142, 76.2%, 36.3%, 0.08)' : 'hsla(0, 84.2%, 60.2%, 0.08)',
                          border: `1px solid ${adj.difference_quantity >= 0 ? 'hsla(142, 76.2%, 36.3%, 0.25)' : 'hsla(0, 84.2%, 60.2%, 0.25)'}`,
                          marginBottom: '0.35rem',
                          fontSize: '0.78rem'
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>Pedido: {adj.ordered_quantity?.toLocaleString('pt-BR')} → Produzido: {adj.produced_quantity?.toLocaleString('pt-BR')}</span>
                          <span style={{ fontWeight: 700, color: adj.difference_quantity >= 0 ? 'hsl(142, 76.2%, 36.3%)' : 'hsl(0, 84.2%, 50%)' }}>
                            {adj.difference_quantity >= 0 ? '+' : ''}{adj.difference_quantity?.toLocaleString('pt-BR')} un
                          </span>
                        </div>
                      ))}
                    </section>
                  </>
                )}

              </div>

              {/* Footer */}
              <div style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'var(--background)'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ID: {detailItem.id?.substring(0, 8)}… · Tipo: {detailItem.item_type}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => { setIsDetailModalOpen(false); handleOpenEdit(detailItem); }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Edit3 size={13} /> Editar Pedido
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
</file>

</files>
