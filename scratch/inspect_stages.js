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
