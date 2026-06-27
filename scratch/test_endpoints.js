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
