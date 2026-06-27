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
