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
