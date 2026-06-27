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
