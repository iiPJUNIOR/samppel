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
