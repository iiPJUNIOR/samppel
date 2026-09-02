import { getContaAzulConfig, updateContaAzulConfig, createIntegrationLog, supabase, supabaseAdmin } from './supabase';

const CONTA_AZUL_API_URL = 'https://api-v2.contaazul.com';
const CONTA_AZUL_AUTH_URL = 'https://auth.contaazul.com/oauth2';

function extractOpNumber(notes: string): string | null {
  if (!notes) return null;
  // Procura por padrões de OP como AUT.478.2026, OP.123.2026, AUT478, OP-478, OP 478
  const opRegex = /(AUT\.\d+\.\d{4}|AUT\d+\.\d{4}|OP\.\d+\.\d{4}|OP\-\d+|OP\s*\d+|AUT\s*\d+)/i;
  const match = notes.match(opRegex);
  return match ? match[0].trim() : null;
}

export function isSaleEmAndamento(sale: any): boolean {
  if (!sale) return false;

  const checkVal = (val: any): boolean => {
    if (!val) return false;
    if (typeof val === 'string') {
      const s = val.toUpperCase();
      return (
        s === 'EM_ANDAMENTO' || s.includes('ANDAMENTO') ||
        s === 'ORCAMENTO' || s.includes('ORÇAMENTO') ||
        s === 'RECUSADO' || s.includes('RECUSAD') ||
        s === 'REJEITADO' || s.includes('REJEITAD')
      );
    }
    if (typeof val === 'object') {
      const nome = (val.nome || val.status || val.descricao || val.situacao || '').toString().toUpperCase();
      const desc = (val.descricao || '').toString().toUpperCase();
      return (
        nome === 'EM_ANDAMENTO' || nome.includes('ANDAMENTO') ||
        nome === 'ORCAMENTO' || desc.includes('ANDAMENTO') || desc.includes('ORÇAMENTO') ||
        nome === 'RECUSADO' || desc.includes('RECUSAD') ||
        nome === 'REJEITADO' || desc.includes('REJEITAD')
      );
    }
    return false;
  };

  return (
    checkVal(sale.situacao) ||
    checkVal(sale.venda?.situacao) ||
    checkVal(sale.situacao_venda) ||
    checkVal(sale.venda?.situacao_venda) ||
    checkVal(sale.status)
  );
}

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
    const isMock = true;

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
    const isMock = true;

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
    const isMock = true;

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
    const isMock = true;

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
    const isMock = true;

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
  public async importCustomers(onProgress?: (step: string, progress: number) => void): Promise<{ imported: number; updated: number }> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    if (isMock) {
      onProgress?.('Carregando clientes simulados...', 100);
      return { imported: 3, updated: 0 };
    }

    try {
      onProgress?.('Buscando clientes no Conta Azul...', 5);
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

      let currentIdx = 0;
      for (const pessoa of items) {
        currentIdx++;
        const pct = 10 + Math.floor((currentIdx / items.length) * 85);
        const isCliente = (pessoa.perfis || []).includes('Cliente');
        if (!isCliente) continue;

        onProgress?.(`Processando ${pessoa.nome || 'cliente'}...`, pct);
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
   * Importa / Sincroniza Produtos e Quantidades de Estoque do Conta Azul para o Supabase local
   */
  public async importProducts(onProgress?: (step: string, progress: number) => void): Promise<{ imported: number; updated: number; total: number }> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    if (isMock) {
      return { imported: 0, updated: 0, total: 0 };
    }

    try {
      onProgress?.('Autenticando com Conta Azul...', 5);
      const token = await this.getValidAccessToken();

      onProgress?.('Buscando catálogo de produtos e estoque no Conta Azul...', 15);

      const dbClient = supabaseAdmin || supabase;
      if (!dbClient) throw new Error('Cliente Supabase não inicializado.');

      // 1. Busca Produtos no Conta Azul
      let productsList: any[] = [];
      try {
        const prodRes = await fetch(`${CONTA_AZUL_API_URL}/v1/products?size=200`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          productsList = Array.isArray(prodData) ? prodData : (prodData.items || prodData.data || []);
        } else {
          console.warn('Endpoint /v1/products respondeu status:', prodRes.status);
        }
      } catch (e) {
        console.error('Erro ao buscar /v1/products:', e);
      }

      // 2. Busca Serviços no Conta Azul (caso existam produtos cadastrados como serviços)
      try {
        const servRes = await fetch(`${CONTA_AZUL_API_URL}/v1/services?size=200`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (servRes.ok) {
          const servData = await servRes.json();
          const servList = Array.isArray(servData) ? servData : (servData.items || servData.data || []);
          productsList = [...productsList, ...servList];
        }
      } catch (e) {
        // Serviços são opcionais
      }

      onProgress?.(`Encontrados ${productsList.length} itens no Conta Azul. Processando...`, 30);

      let imported = 0;
      let updated = 0;
      let currentIdx = 0;

      for (const prod of productsList) {
        currentIdx++;
        const pct = 30 + Math.floor((currentIdx / (productsList.length || 1)) * 65);
        const prodName = prod.name || prod.nome || 'Produto sem nome';
        onProgress?.(`Processando ${prodName}...`, pct);

        const caId = prod.id || prod.conta_azul_id;
        const code = prod.code || prod.codigo || prod.sku || (prodName.toUpperCase().replace(/\s+/g, '-'));
        const price = prod.value || prod.preco || prod.price || prod.valor || 0;
        const desc = prod.description || prod.descricao || '';
        
        // Extrai saldo em estoque
        let stockQty = 0;
        if (typeof prod.stock === 'object' && prod.stock !== null) {
          stockQty = prod.stock.quantity ?? prod.stock.saldo ?? 0;
        } else if (typeof prod.stock_quantity === 'number') {
          stockQty = prod.stock_quantity;
        } else if (typeof prod.saldo === 'number') {
          stockQty = prod.saldo;
        } else if (typeof prod.quantidade === 'number') {
          stockQty = prod.quantidade;
        }

        // Tenta localizar produto existente no Supabase por conta_azul_id, sku ou name
        let query = dbClient
          .from('products')
          .select('id, stock_quantity')
          .eq('tenant_id', this.tenantId);

        if (caId && code) {
          query = query.or(`conta_azul_id.eq.${caId},sku.eq.${code}`);
        } else if (caId) {
          query = query.eq('conta_azul_id', caId);
        } else if (code) {
          query = query.eq('sku', code);
        } else {
          query = query.eq('name', prodName);
        }

        const { data: existingProd } = await query.maybeSingle();

        const payload: any = {
          name: prodName,
          sku: code,
          description: desc,
          price: price,
          conta_azul_id: caId || undefined
        };

        if (existingProd) {
          const { error } = await dbClient
            .from('products')
            .update(payload)
            .eq('id', existingProd.id);
          if (error) console.error('Erro ao atualizar produto:', error);
          else updated++;
        } else {
          const { error } = await dbClient
            .from('products')
            .insert([{ tenant_id: this.tenantId, ...payload, stock_quantity: 0 }]);
          if (error) console.error('Erro ao inserir produto:', error);
          else imported++;
        }
      }

      onProgress?.('Sincronização de produtos e estoque concluída!', 100);

      await createIntegrationLog(
        'IMPORT_PRODUCTS',
        'SUCCESS',
        { count: productsList.length },
        { imported, updated },
        null,
        this.tenantId
      );

      return { imported, updated, total: productsList.length };
    } catch (err: any) {
      console.error('Erro ao importar produtos e estoque:', err);
      await createIntegrationLog(
        'IMPORT_PRODUCTS',
        'ERROR',
        null,
        null,
        err.message || 'Falha ao importar produtos do Conta Azul',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Localiza ou cria automaticamente um produto no banco para vincular ao pedido
   */
  private async resolveOrCreateProduct(
    dbClient: any,
    mainItem: any,
    customerId?: string
  ): Promise<string | null> {
    if (!mainItem) return null;

    const mainItemCaId = mainItem.id_item || mainItem.id || mainItem.conta_azul_id;
    const prodName = mainItem.descricao || mainItem.nome || mainItem.name || 'Produto Importado';
    const prodSku = mainItem.codigo || mainItem.sku || '';

    // 1. Tentar encontrar por conta_azul_id ou sku
    let query = dbClient
      .from('products')
      .select('id')
      .eq('tenant_id', this.tenantId);

    if (mainItemCaId && prodSku) {
      query = query.or(`conta_azul_id.eq.${mainItemCaId},sku.eq.${prodSku}`);
    } else if (mainItemCaId) {
      query = query.eq('conta_azul_id', mainItemCaId);
    } else if (prodSku) {
      query = query.eq('sku', prodSku);
    } else {
      query = query.eq('name', prodName);
    }

    const { data: existingProd } = await query.maybeSingle();
    if (existingProd?.id) {
      return existingProd.id;
    }

    // 2. Fallback por nome
    if (prodName && prodName !== 'Produto Importado') {
      const { data: prodByName } = await dbClient
        .from('products')
        .select('id')
        .eq('tenant_id', this.tenantId)
        .ilike('name', prodName)
        .maybeSingle();

      if (prodByName?.id) {
        if (mainItemCaId) {
          await dbClient.from('products').update({ conta_azul_id: mainItemCaId }).eq('id', prodByName.id);
        }
        return prodByName.id;
      }
    }

    // 3. Auto-criação do produto no Supabase
    try {
      const fallbackSku = prodSku || (prodName.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 30)) || `PROD-${Date.now()}`;
      const { data: newProd, error: prodErr } = await dbClient
        .from('products')
        .insert([{
          tenant_id: this.tenantId,
          name: prodName,
          sku: fallbackSku,
          conta_azul_id: mainItemCaId || null,
          price: mainItem.valor_unitario || mainItem.valor || mainItem.preco || 0,
          stock_quantity: 0,
          category: 'PERSONALIZADA',
          customer_id: customerId || null
        }])
        .select('id')
        .single();

      if (newProd?.id) {
        console.log(`[resolveOrCreateProduct] Produto "${prodName}" auto-criado com sucesso (ID: ${newProd.id}).`);
        return newProd.id;
      }
      if (prodErr) {
        console.warn('Aviso ao auto-criar produto:', prodErr);
      }
    } catch (e) {
      console.error('Erro ao auto-criar produto para pedido:', e);
    }

    return null;
  }

  /**
   * Importa pedidos (vendas) do Conta Azul para o banco local (v2 /venda)
   */
  public async importOrders(startDate?: string, endDate?: string, onProgress?: (step: string, progress: number) => void): Promise<{ imported: number; updated: number }> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = false;

    if (isMock) {
      return { imported: 2, updated: 0 };
    }

    const MIN_SYNC_DATE = '2026-09-01';
    const effectiveStartDate = (startDate && startDate >= MIN_SYNC_DATE) ? startDate : MIN_SYNC_DATE;

    try {
      onProgress?.('Autenticando e verificando tokens...', 5);
      const token = await this.getValidAccessToken();
      
      onProgress?.('Buscando lista de vendas no Conta Azul...', 10);
      const allItems: any[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        let url = `${CONTA_AZUL_API_URL}/v1/venda/busca?tamanho_pagina=100&pagina=${currentPage}`;
        if (effectiveStartDate) {
          url += `&data_inicio=${effectiveStartDate}`;
        }
        if (endDate) {
          url += `&data_fim=${endDate}`;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Erro ao buscar vendas do Conta Azul na página ${currentPage}: ${response.status} - ${errText}`);
        }

        const resData = await response.json();
        const pageItems = resData.itens || [];
        allItems.push(...pageItems);
        
        if (pageItems.length < 100) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }

      const items = allItems;
      onProgress?.(`Encontrados ${items.length} pedidos. Sincronizando...`, 15);

      const dbClient = supabaseAdmin || supabase;
      if (!dbClient) throw new Error('Cliente Supabase nao inicializado');

      let imported = 0;
      let updated = 0;

      let currentIdx = 0;
      for (const saleSummary of items) {
        currentIdx++;
        const pct = 15 + Math.floor((currentIdx / items.length) * 80);
        const statusStr = (saleSummary.situacao?.nome || saleSummary.situacao?.descricao || saleSummary.situacao || '').toString().toUpperCase();
        if (statusStr === 'CANCELADO' || isSaleEmAndamento(saleSummary)) {
          console.log(`[importOrders] Ignorando PV-${saleSummary.numero} por estar em orçamento ("Em andamento") no Conta Azul.`);
          continue;
        }

        onProgress?.(`PV-${saleSummary.numero || currentIdx}: Puxando detalhes do pedido...`, pct);
        // Endpoint oficial /v1/venda/{id} da API v2 da Conta Azul
        const saleRes = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/${saleSummary.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!saleRes.ok) {
          console.error(`Erro ao buscar detalhes da venda ${saleSummary.id}`);
          continue;
        }
        const saleDetail = await saleRes.json();
        if (isSaleEmAndamento(saleDetail) || isSaleEmAndamento(saleDetail.venda)) {
          console.log(`[importOrders] Ignorando PV-${saleSummary.numero} por estar em orçamento ("Em andamento") no Conta Azul.`);
          continue;
        }

        // Filtro estrito: Apenas vendas com Data da Venda a partir de 01/09/2026 na sincronização em lote
        const rawSaleDate = saleDetail.venda?.data 
          || saleDetail.data 
          || saleSummary.data 
          || saleDetail.venda?.data_venda 
          || saleSummary.data_venda 
          || saleDetail.venda?.data_emissao 
          || saleSummary.data_emissao 
          || saleDetail.venda?.emissao 
          || saleSummary.emissao 
          || saleSummary.criado_em 
          || new Date().toISOString();

        const saleDateOnly = (rawSaleDate || '').split('T')[0].split(' ')[0];
        if (saleDateOnly && saleDateOnly < MIN_SYNC_DATE) {
          console.log(`[importOrders] Ignorando PV-${saleSummary.numero} pois Data da venda (${saleDateOnly}) é anterior a ${MIN_SYNC_DATE}.`);
          continue;
        }

        const parsedOrderDate = rawSaleDate.includes('T') ? rawSaleDate : `${rawSaleDate}T12:00:00.000Z`;

        onProgress?.(`PV-${saleSummary.numero || currentIdx}: Puxando itens do pedido...`, pct);
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
            .select('id, document, email, phone')
            .eq('tenant_id', this.tenantId)
            .eq('conta_azul_id', clientUuid)
            .maybeSingle();

          let custDetails: any = null;
          const needsDetails = !existingCust || !existingCust.document || !existingCust.email || !existingCust.phone;

          if (needsDetails) {
            try {
              onProgress?.(`PV-${saleSummary.numero || currentIdx}: Buscando cadastro detalhado do cliente...`, pct);
              const custResponse = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas/${clientUuid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (custResponse.ok) {
                custDetails = await custResponse.json();
              }
            } catch (err) {
              console.error('Erro ao buscar detalhes da pessoa no Conta Azul:', err);
            }
          }

          const nameVal = custDetails?.nome || clienteInfo.nome || 'Cliente Importado';
          const docVal = custDetails?.documento || clienteInfo.documento || '';
          const emailVal = custDetails?.email || '';
          const phoneVal = custDetails?.telefone_celular || custDetails?.telefone_comercial || '';
          let addrVal = '';
          if (custDetails?.enderecos?.[0]) {
            const addr = custDetails.enderecos[0];
            addrVal = `${addr.logradouro || ''}, ${addr.numero || ''} ${addr.complemento ? '(' + addr.complemento + ')' : ''} - ${addr.bairro || ''}, ${addr.cidade || ''}/${addr.estado || ''}`;
          }

          if (existingCust) {
            customerId = existingCust.id;
            if (needsDetails && custDetails) {
              await dbClient
                .from('customers')
                .update({
                  name: nameVal,
                  document: docVal,
                  email: emailVal,
                  phone: phoneVal,
                  address: addrVal
                })
                .eq('id', customerId);
            }
          } else {
            const { data: newCust, error: custErr } = await dbClient
              .from('customers')
              .insert([{
                tenant_id: this.tenantId,
                name: nameVal,
                conta_azul_id: clientUuid,
                document: docVal,
                email: emailVal,
                phone: phoneVal,
                address: addrVal
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

        const productId = await this.resolveOrCreateProduct(dbClient, mainItem, customerId);

        let localStatus: any = 'A produzir';
        if (statusStr === 'PAGO' || statusStr === 'QUITADO') {
          localStatus = 'Pago';
        } else if (statusStr === 'FATURADO') {
          localStatus = 'Faturado';
        }

        const sellerName = saleDetail.vendedor?.nome || 'Vendas Samppel';

        const condicao = saleDetail.venda?.condicao_pagamento;
        let installments = condicao?.parcelas || [];
        
        // Pix e vendas À vista são liquidadas imediatamente
        const isPaidAVista = condicao?.pagamento_a_vista === true || 
                             condicao?.opcao_condicao_pagamento === 'À vista';

        if (installments.length === 0 && isPaidAVista) {
          installments = [{
            valor: saleDetail.venda?.composicao_valor?.valor_liquido || 0,
            data_vencimento: saleDetail.venda?.data_compromisso || new Date().toISOString().split('T')[0],
            forma_pagamento: condicao?.tipo_pagamento || 'Pix',
            numero: 1
          }];
        }
        
        const installmentsTotal = installments.length || 1;
        const installmentsPaid = (localStatus === 'Pago' || isPaidAVista) ? installmentsTotal : 0;
        const firstPaymentDate = (localStatus === 'Pago' || isPaidAVista)
          ? (installments?.[0]?.data_vencimento || saleSummary.data || new Date().toISOString().split('T')[0])
          : null;

        const notesStr = [saleDetail.venda?.observacoes, saleDetail.venda?.condicao_pagamento?.observacoes_pagamento].filter(Boolean).join('\n\n');
        const mainItemDesc = (mainItem.descricao || mainItem.nome || '').toLowerCase();
        const measure = this.extractMeasure([mainItem.nome, mainItem.descricao, notesStr]);
        
        const getSituacaoDesc = (situacao: any) => {
          if (!situacao) return 'Aprovado';
          if (situacao.descricao) return situacao.descricao;
          const nome = situacao.nome || '';
          if (nome === 'APROVADO') return 'Aprovado';
          if (nome === 'CANCELADO') return 'Cancelado';
          if (nome === 'EM_ANDAMENTO') return 'Em andamento';
          if (nome === 'FATURADO') return 'Faturado';
          if (nome === 'RECUSADO') return 'Recusado';
          return nome;
        };
        const contaAzulStatus = getSituacaoDesc(saleDetail.venda?.situacao || saleSummary.situacao);

        const resolvedShippingType = this.parseShippingType(saleDetail);
        const { boxesCount, packagingType: resolvedPackagingType } = this.parsePackagingDetails(notesStr, mainItemDesc, resolvedShippingType);
        const opNumber = extractOpNumber(notesStr);

        const orderPayload: any = {
          customer_id: customerId,
          product_id: productId || null,
          pv_number: `PV-${saleDetail.venda?.numero || saleSummary.numero}`,
          op_number: opNumber,
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
          notes: notesStr,
          order_date: parsedOrderDate,
          conta_azul_status: contaAzulStatus,
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

        // Sincronizar parcelas financeiras para o local
        if (installments && installments.length > 0) {
          // Primeiro removemos as parcelas financeiras locais antigas desse pedido
          await dbClient
            .from('financial_transactions')
            .delete()
            .eq('order_id', orderId);

          let totalPaidInstallments = 0;
          let paymentReleasedDate: string | null = null;

          // E inserimos as novas parcelas
          const transactionsPayload = [];
          
          for (let i = 0; i < installments.length; i++) {
            const inst = installments[i];
            const installmentNumber = i + 1;
            // Status real da parcela, iniciamos como PENDENTE
            let realInstStatus = 'PENDENTE';
            let paymentDateStr: string | null = null;
            let instNotes: string | null = null;
            

            if (inst.id) {
              try {
                onProgress?.(`PV-${saleSummary.numero || currentIdx}: Sincronizando parcela ${installmentNumber}...`, pct);
                // Puxamos o status REAL da parcela pela API financeira do Conta Azul
                const instRes = await fetch(`${CONTA_AZUL_API_URL}/v1/financeiro/eventos-financeiros/parcelas/${inst.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (instRes.ok) {
                  const instDetail = await instRes.json();
                  // Usar o status real retornado: PENDENTE, ATRASADO, BAIXADO, QUITADO, CONCILIADO
                  const apiStatus = (instDetail.status || instDetail.situacao || '').toUpperCase();
                  if (apiStatus) realInstStatus = apiStatus;
                  
                  const isPaid = apiStatus === 'QUITADO' || apiStatus === 'BAIXADO' || apiStatus === 'CONCILIADO';
                  if (isPaid) {
                    totalPaidInstallments++;
                    paymentDateStr = instDetail.baixas?.[0]?.data_pagamento || instDetail.data_vencimento || null;
                    if (!paymentReleasedDate || (paymentDateStr && paymentDateStr < paymentReleasedDate)) {
                      paymentReleasedDate = paymentDateStr;
                    }
                  }
                  
                  // Extrair observação da baixa
                  if (instDetail.baixas && instDetail.baixas.length > 0) {
                    instNotes = instDetail.baixas
                      .map((b: any) => b.observacao?.trim())
                      .filter(Boolean)
                      .join('; ');
                  }
                }
              } catch (err) {
                console.error(`Erro ao buscar detalhes da parcela ${inst.id} na API:`, err);
              }
            }
            
            // Fallback: se não conseguimos o status da API, ler da própria parcela da venda
            if (realInstStatus === 'PENDENTE' && inst.situacao) {
              const fallbackStatus = (inst.situacao || '').toUpperCase();
              if (fallbackStatus) realInstStatus = fallbackStatus;
            }
            
            // Para o fallback de pagamento local (sem API)
            const isInstPaidFallback = localStatus === 'Pago' || isPaidAVista;
            if (realInstStatus === 'PENDENTE' && isInstPaidFallback) {
              realInstStatus = 'QUITADO';
              totalPaidInstallments++;
              paymentDateStr = inst.data_vencimento || null;
              if (!paymentReleasedDate) paymentReleasedDate = paymentDateStr;
            }

            const dbStatus = (realInstStatus === 'QUITADO' || realInstStatus === 'BAIXADO' || realInstStatus === 'CONCILIADO')
              ? 'CONCILIADO'
              : (realInstStatus === 'CANCELADO' ? 'CANCELADO' : 'PENDENTE');

            transactionsPayload.push({
              tenant_id: this.tenantId,
              order_id: orderId,
              type: 'RECEITA',
              amount: inst.valor || inst.value || 0,
              status: dbStatus,
              description: `Parcela ${installmentNumber}/${installmentsTotal} - ${inst.forma_pagamento || 'Pix'}`,
              due_date: inst.data_vencimento || new Date().toISOString().split('T')[0],
              payment_date: (realInstStatus === 'QUITADO' || realInstStatus === 'BAIXADO' || realInstStatus === 'CONCILIADO')
                ? (paymentDateStr || inst.data_vencimento || new Date().toISOString().split('T')[0])
                : null,
              notes: instNotes
            });
          }

          const { error: finInsertErr } = await dbClient
            .from('financial_transactions')
            .insert(transactionsPayload);

          if (finInsertErr) {
            console.error('Erro ao inserir transações financeiras:', finInsertErr);
          }

          // Se tivermos alguma parcela paga, atualizamos o orders correspondente com a data real
          if (totalPaidInstallments > 0) {
            await dbClient
              .from('orders')
              .update({
                installments_paid: totalPaidInstallments,
                first_payment_date: paymentReleasedDate || installments[0].data_vencimento
              })
              .eq('id', orderId);
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
            }
          }

          const itemDesc = (item.description || item.descricao || '').toLowerCase();
          const itemMeasure = this.extractMeasure([item.name || item.nome, item.description || item.descricao, notesStr, measure]);

          let itemBoxesCount = 1;
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

          const itemVal = Number(item.value || item.valor || 0);
          const itemQty = Number(item.quantity || item.quantidade || 0);
          const itemTotalPrice = itemQty > 0 ? itemQty * itemVal : itemVal;

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
            notes: item.description || item.descricao || '',
            unit_price: itemVal,
            total_price: itemTotalPrice
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
    const notes = [
      saleDetail.venda?.observacoes,
      saleDetail.venda?.condicao_pagamento?.observacoes_pagamento
    ].filter(Boolean).join(' ').toLowerCase();
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

  private extractMeasure(texts: (string | null | undefined)[]): string {
    for (const text of texts) {
      if (!text) continue;

      // 1. Padrão explícito com palavras-chave: "Medida: 20x15x5 cm", "Medidas: 30 x 40", "Dimensões: 15x10"
      const keywordMatch = text.match(/(?:medidas?|dimens[õo]es|tamanho|formato):\s*([0-9.,]+\s*[xX]\s*[0-9.,]+(?:\s*[xX]\s*[0-9.,]+)?(?:\/[0-9]+\s*g)?(?:\s*cm|\s*mm|\s*m)?)/i);
      if (keywordMatch && keywordMatch[1]) {
        return keywordMatch[1].trim();
      }

      // 2. Padrão numérico isolado de dimensões (ex: "38X31X19/100G", "20x15x5 cm", "20x15x5", "30x40 cm", "25x30")
      const dimMatch = text.match(/\b([0-9]{1,3}(?:[.,][0-9])?\s*[xX]\s*[0-9]{1,3}(?:[.,][0-9])?(?:\s*[xX]\s*[0-9]{1,3}(?:[.,][0-9])?)?(?:\/[0-9]+\s*g)?\s*(?:cm|mm|m)?)\b/i);
      if (dimMatch && dimMatch[1]) {
        return dimMatch[1].trim();
      }
    }

    return '—';
  }

  private parsePackagingDetails(notesStr: string, mainItemDesc: string, resolvedShippingType: string): { boxesCount: number; packagingType: 'CAIXA' | 'PACOTE' } {
    let boxesCount = 0;
    let packagingType: 'CAIXA' | 'PACOTE' = 'CAIXA';

    const notesStrLower = (notesStr || '').toLowerCase();
    const mainItemDescLower = (mainItemDesc || '').toLowerCase();

    // 1. Extrair da linha "Embalagem:" nas observações de pagamento / notas
    const embalagemMatch = notesStr.match(/embalagem:\s*([^\n\r]+)/i);

    if (embalagemMatch && embalagemMatch[1]) {
      const embText = embalagemMatch[1].trim().toLowerCase();
      
      // Identificar Tipo (PACOTE vs CAIXA)
      if (embText.includes('pac') || embText.includes('saco') || embText.includes('envelope')) {
        packagingType = 'PACOTE';
      } else if (embText.includes('caix') || embText.includes('cx')) {
        packagingType = 'CAIXA';
      }

      // Identificar Quantidade (número)
      const numMatch = embText.match(/(\d+)/);
      if (numMatch) {
        boxesCount = parseInt(numMatch[1], 10);
      }
    }

    // 2. Se a linha "Embalagem:" não existia ou não especificou tipo, verificar palavras-chave nas observações gerais ou descrição do item
    if (!embalagemMatch) {
      if (notesStrLower.includes('pacote') || notesStrLower.includes('pacotes') || mainItemDescLower.includes('pacote') || mainItemDescLower.includes('saco')) {
        packagingType = 'PACOTE';
      } else if (notesStrLower.includes('caixa') || notesStrLower.includes('caixas') || mainItemDescLower.includes('caixa')) {
        packagingType = 'CAIXA';
      } else if (resolvedShippingType === 'RETIRADA' || resolvedShippingType === 'LALAMOVE' || resolvedShippingType === 'MOTOBOY') {
        packagingType = 'PACOTE';
      }
    }

    // 3. Se a quantidade de volumes não foi encontrada, buscar em "caixas: 10", "pacotes: 5" ou no texto da observação
    if (boxesCount === 0) {
      const boxesMatch = mainItemDesc.match(/caixas?:\s*(\d+)/i) || mainItemDesc.match(/pacotes?:\s*(\d+)/i) || notesStr.match(/(\d+)\s*(?:caixas|pacotes|volumes|cx|pac)/i);
      if (boxesMatch && boxesMatch[1]) {
        boxesCount = parseInt(boxesMatch[1], 10);
      }
    }

    // Default se nenhuma quantidade foi encontrada
    if (boxesCount === 0) {
      boxesCount = 1;
    }

    return { boxesCount, packagingType };
  }

  async getSaleIdByNumber(orderNumber: string | number): Promise<string> {
    const token = await this.getValidAccessToken();
    const cleanNumber = String(orderNumber).replace(/\D/g, '');
    if (!cleanNumber) {
      throw new Error(`Número de pedido inválido: ${orderNumber}`);
    }

    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Mapeamento de intervalos de data do presente para o passado
    // Cada janela é estritamente limitada com data_inicio e data_fim para
    // garantir que o número de correspondências parciais por lote seja pequeno.
    const intervals = [
      // Janela 1: Últimos 30 dias (cobre 95% dos casos de uso de importação manual)
      {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
        name: 'Últimos 30 dias'
      },
      // Janela 2: De 30 a 90 dias atrás (cobre pedidos recentes criados nos meses anteriores)
      {
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        name: 'De 30 a 90 dias atrás'
      },
      // Janela 3: De 90 a 365 dias atrás (cobre o último ano completo)
      {
        start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        name: 'Último ano'
      },
      // Janela 4: Histórico geral antigo (desde 2020)
      {
        start: new Date('2020-01-01'),
        end: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        name: 'Histórico antigo (desde 2020)'
      }
    ];

    for (const interval of intervals) {
      let page = 1;
      const size = 100;
      let hasMore = true;
      
      while (hasMore) {
        const url = `${CONTA_AZUL_API_URL}/v1/venda/busca?tamanho_pagina=${size}&pagina=${page}&data_inicio=${formatDate(interval.start)}&data_fim=${formatDate(interval.end)}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error(`Erro ao buscar venda no Conta Azul (${interval.name}, pág ${page}): ${await res.text()}`);
        }

        const sales = await res.json();
        const salesList = sales?.itens || (Array.isArray(sales) ? sales : (sales?.vendas || sales?.data || []));

        if (salesList.length === 0) {
          hasMore = false;
          break;
        }

        const exactSale = salesList.find((s: any) => {
          const numStr = String(s.numero || s.venda?.numero || s.number || '').trim();
          return numStr === cleanNumber;
        });

        if (exactSale) {
          const saleId = exactSale.id || exactSale.uuid || exactSale.venda?.id;
          if (!saleId) {
            throw new Error(`ID da venda de número ${cleanNumber} não disponível na API.`);
          }
          return saleId;
        }

        if (salesList.length < size) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    throw new Error(`Pedido de número ${cleanNumber} não foi encontrado no Conta Azul.`);
  }

  async importSingleOrder(saleId: string, onProgress?: (step: string, progress: number) => void) {
    onProgress?.('Conectando ao Conta Azul e buscando dados do pedido...', 15);
    const token = await this.getValidAccessToken();
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) throw new Error('Cliente Supabase nao inicializado');

    // 1. Fetch sale details
    const saleRes = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/${saleId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!saleRes.ok) {
      throw new Error(`Erro ao buscar detalhes da venda: ${await saleRes.text()}`);
    }
    const saleDetail = await saleRes.json();
    
    // Verificar se a venda está em orçamento ("Em andamento")
    if (isSaleEmAndamento(saleDetail) || isSaleEmAndamento(saleDetail.venda)) {
      const pvNum = saleDetail.venda?.numero ? `PV-${saleDetail.venda.numero}` : 'este pedido';
      throw new Error(`O pedido ${pvNum} consta como "Em andamento" (orçamento) no Conta Azul e não pode ser importado para produção até ser aprovado/faturado.`);
    }

    const saleSummary = {
      id: saleId,
      numero: saleDetail.venda?.numero,
      criado_em: saleDetail.venda?.data_compromisso,
      situacao: saleDetail.venda?.situacao
    };

    onProgress?.('Sincronizando cliente e itens do pedido...', 40);

    // 2. Fetch items
    const itemsRes = await fetch(`${CONTA_AZUL_API_URL}/v1/venda/${saleId}/itens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!itemsRes.ok) {
      throw new Error(`Erro ao buscar itens da venda: ${await itemsRes.text()}`);
    }
    const itemsData = await itemsRes.json();
    const saleItems = itemsData.itens || [];
    if (saleItems.length === 0) {
      return { success: false, message: 'Venda sem itens' };
    }

    const mainItem = saleItems[0];
    const mainItemCaId = mainItem.id_item;
    const clienteInfo = saleDetail.cliente;
    const clientUuid = clienteInfo?.uuid;

    let customerId = '';
    if (clientUuid) {
      const { data: existingCust } = await dbClient
        .from('customers')
        .select('id, document, email, phone')
        .eq('tenant_id', this.tenantId)
        .eq('conta_azul_id', clientUuid)
        .maybeSingle();

      let custDetails: any = null;
      const needsDetails = !existingCust || !existingCust.document || !existingCust.email || !existingCust.phone;
      if (needsDetails) {
        try {
          const custResponse = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas/${clientUuid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (custResponse.ok) {
            custDetails = await custResponse.json();
          }
        } catch (err) {
          console.error('Erro ao buscar detalhes da pessoa no Conta Azul:', err);
        }
      }

      const nameVal = custDetails?.nome || clienteInfo.nome || 'Cliente Importado';
      const docVal = custDetails?.documento || clienteInfo.documento || '';
      const emailVal = custDetails?.email || '';
      const phoneVal = custDetails?.telefone_celular || custDetails?.telefone_comercial || '';
      let addrVal = '';
      if (custDetails?.enderecos?.[0]) {
        const addr = custDetails.enderecos[0];
        addrVal = `${addr.logradouro || ''}, ${addr.numero || ''} ${addr.complemento ? '(' + addr.complemento + ')' : ''} - ${addr.bairro || ''}, ${addr.cidade || ''}/${addr.estado || ''}`;
      }

      if (existingCust) {
        customerId = existingCust.id;
        if (needsDetails && custDetails) {
          await dbClient
            .from('customers')
            .update({
              name: nameVal,
              document: docVal,
              email: emailVal,
              phone: phoneVal,
              address: addrVal
            })
            .eq('id', customerId);
        }
      } else {
        const { data: newCust } = await dbClient
          .from('customers')
          .insert([{
            tenant_id: this.tenantId,
            name: nameVal,
            conta_azul_id: clientUuid,
            document: docVal,
            email: emailVal,
            phone: phoneVal,
            address: addrVal
          }])
          .select('id')
          .single();
        if (newCust) customerId = newCust.id;
      }
    }

    // 3. Resolve Product
    const productId = await this.resolveOrCreateProduct(dbClient, mainItem, customerId);

    // 4. Resolve Seller, Installments, Payments
    const sellerName = saleDetail.vendedor?.nome || 'Vendedor Samppel';
    const localStatus = 'A produzir';

    let installments = saleDetail.venda?.condicao_pagamento?.parcelas || [];
    if (installments.length === 0 && saleDetail.venda?.condicao_pagamento?.pagamento_a_vista) {
      installments = [{
        valor: saleDetail.venda?.composicao_valor?.valor_liquido || 0,
        data_vencimento: saleDetail.venda?.data_compromisso || new Date().toISOString().split('T')[0],
        forma_pagamento: saleDetail.venda?.condicao_pagamento?.tipo_pagamento || 'Pix',
        numero: 1
      }];
    }

    const installmentsTotal = installments.length || 1;
    let installmentsPaid = 0;
    let paymentReleasedDate: string | null = null;
    let firstPaymentDate: string | null = null;

    const notesStr = [saleDetail.venda?.observacoes, saleDetail.venda?.condicao_pagamento?.observacoes_pagamento].filter(Boolean).join('\n\n');
    const mainItemDesc = (mainItem.descricao || mainItem.nome || '').toLowerCase();
    const measure = this.extractMeasure([mainItem.nome, mainItem.descricao, notesStr]);
    const resolvedShippingType = this.parseShippingType(saleDetail);
    const { boxesCount, packagingType: resolvedPackagingType } = this.parsePackagingDetails(notesStr, mainItemDesc, resolvedShippingType);

    const getSituacaoDesc = (situacao: any) => {
      if (!situacao) return 'Aprovado';
      if (situacao.descricao) return situacao.descricao;
      const nome = situacao.nome || '';
      if (nome === 'APROVADO') return 'Aprovado';
      if (nome === 'CANCELADO') return 'Cancelado';
      if (nome === 'EM_ANDAMENTO') return 'Em andamento';
      if (nome === 'FATURADO') return 'Faturado';
      if (nome === 'RECUSADO') return 'Recusado';
      return nome;
    };
    const contaAzulStatus = getSituacaoDesc(saleDetail.venda?.situacao || saleSummary.situacao);
    const opNumber = extractOpNumber(notesStr);

    const rawSaleDate = saleDetail.venda?.data 
      || saleDetail.data 
      || (saleSummary as any).data 
      || saleDetail.venda?.data_venda 
      || (saleSummary as any).data_venda 
      || saleDetail.venda?.data_emissao 
      || (saleSummary as any).data_emissao 
      || saleDetail.venda?.emissao 
      || (saleSummary as any).emissao 
      || (saleSummary as any).criado_em 
      || new Date().toISOString();

    const parsedOrderDate = rawSaleDate.includes('T') ? rawSaleDate : `${rawSaleDate}T12:00:00.000Z`;

    const orderPayload: any = {
      tenant_id: this.tenantId,
      customer_id: customerId,
      product_id: productId || null,
      pv_number: `PV-${saleDetail.venda?.numero || saleSummary.numero}`,
      op_number: opNumber,
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
      notes: notesStr,
      order_date: parsedOrderDate,
      conta_azul_status: contaAzulStatus,
      conta_azul_id: saleSummary.id
    };

    onProgress?.('Atualizando contas a receber e parcelamento do pedido...', 75);

    let orderId = '';
    const { data: existingOrder } = await dbClient
      .from('orders')
      .select('id')
      .eq('tenant_id', this.tenantId)
      .eq('conta_azul_id', saleSummary.id)
      .maybeSingle();

    if (existingOrder) {
      orderId = existingOrder.id;
      const { error: updErr } = await dbClient
        .from('orders')
        .update(orderPayload)
        .eq('id', orderId);
      if (updErr) {
        throw new Error(`Erro ao atualizar pedido no banco: ${updErr.message}`);
      }
    } else {
      const { data: newOrder, error: insErr } = await dbClient
        .from('orders')
        .insert([orderPayload])
        .select('id')
        .single();
      if (insErr) {
        throw new Error(`Erro ao inserir novo pedido no banco: ${insErr.message}`);
      }
      if (newOrder) orderId = newOrder.id;
    }

    // Resolve order items mapping
    if (orderId) {
      const { data: existingItems } = await dbClient
        .from('order_items')
        .select('id, name, friendly_id, item_index')
        .eq('order_id', orderId);

      const processedIds = new Set<string>();

      for (let i = 0; i < saleItems.length; i++) {
        const item = saleItems[i];
        let itemProdId = '';
        if (item.id_item) {
          const { data: itemP } = await dbClient
            .from('products')
            .select('id')
            .eq('tenant_id', this.tenantId)
            .eq('sku', item.codigo || '')
            .maybeSingle();
          if (itemP) itemProdId = itemP.id;
        }

        const itemPayload = {
          order_id: orderId,
          tenant_id: this.tenantId,
          item_index: i + 1,
          name: item.nome || item.descricao || `Item ${i+1}`,
          product_id: itemProdId || null,
          print_run: Math.round(Number(item.quantidade) || 1000),
          boxes_count: 0,
          packaging_type: 'CAIXA' as const,
          notes: item.description || item.descricao || '',
          friendly_id: `PV-${saleDetail.venda?.numero || saleSummary.numero}/${i + 1}`
        };

        const existingItem = existingItems?.find((ei: any) => 
          !processedIds.has(ei.id) && (
            (ei.friendly_id && ei.friendly_id === itemPayload.friendly_id) || 
            (ei.item_index && ei.item_index === itemPayload.item_index) ||
            ei.name === itemPayload.name
          )
        );

        if (existingItem) {
          processedIds.add(existingItem.id);
          const { error: updItemErr } = await dbClient.from('order_items').update(itemPayload).eq('id', existingItem.id);
          if (updItemErr) {
            throw new Error(`Erro ao atualizar item do pedido no banco: ${updItemErr.message}`);
          }
        } else {
          const { data: insItemData, error: insItemErr } = await dbClient
            .from('order_items')
            .insert([itemPayload])
            .select('id')
            .single();
          if (insItemErr) {
            throw new Error(`Erro ao inserir item do pedido no banco: ${insItemErr.message}`);
          }
          if (insItemData) {
            processedIds.add(insItemData.id);
          }
        }
      }

      // Deletar os itens duplicados antigos órfãos que não foram processados nesta importação
      if (existingItems && existingItems.length > 0) {
        const idsToDelete = existingItems.map(ei => ei.id).filter(id => !processedIds.has(id));
        if (idsToDelete.length > 0) {
          const { error: delItemsErr } = await dbClient
            .from('order_items')
            .delete()
            .eq('order_id', orderId)
            .in('id', idsToDelete);
          if (delItemsErr) {
            console.error('Erro ao deletar itens de pedido duplicados/órfãos:', delItemsErr);
          }
        }
      }

      // Reconcile financial transactions
      await dbClient.from('financial_transactions').delete().eq('order_id', orderId);
      
      const transactionsPayload = [];
      let totalPaidInstallments = 0;

      for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        const installmentNumber = i + 1;
        // Status real da parcela, iniciamos como PENDENTE
        let realInstStatus = 'PENDENTE';
        let paymentDateStr: string | null = null;
        let instNotes: string | null = null;

        if (inst.id) {
          try {
            const instRes = await fetch(`${CONTA_AZUL_API_URL}/v1/financeiro/eventos-financeiros/parcelas/${inst.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (instRes.ok) {
              const instDetail = await instRes.json();
              // Usar o status real retornado: PENDENTE, ATRASADO, BAIXADO, QUITADO, CONCILIADO
              const apiStatus = (instDetail.status || instDetail.situacao || '').toUpperCase();
              if (apiStatus) realInstStatus = apiStatus;
              
              const isPaid = apiStatus === 'QUITADO' || apiStatus === 'BAIXADO' || apiStatus === 'CONCILIADO';
              if (isPaid) {
                totalPaidInstallments++;
                paymentDateStr = instDetail.baixas?.[0]?.data_pagamento || instDetail.data_vencimento || null;
                if (!paymentReleasedDate || (paymentDateStr && paymentDateStr < paymentReleasedDate)) {
                  paymentReleasedDate = paymentDateStr;
                }
              }
              if (instDetail.baixas && instDetail.baixas.length > 0) {
                instNotes = instDetail.baixas
                  .map((b: any) => b.observacao?.trim())
                  .filter(Boolean)
                  .join('; ');
              }
            }
          } catch (err) {
            console.error(`Erro ao buscar detalhes da parcela:`, err);
          }
        }

        // Fallback: ler o campo situacao da própria parcela da venda
        if (realInstStatus === 'PENDENTE' && inst.situacao) {
          realInstStatus = (inst.situacao || '').toUpperCase() || 'PENDENTE';
        }

        const dbStatus = (realInstStatus === 'QUITADO' || realInstStatus === 'BAIXADO' || realInstStatus === 'CONCILIADO')
          ? 'CONCILIADO'
          : (realInstStatus === 'CANCELADO' ? 'CANCELADO' : 'PENDENTE');

        transactionsPayload.push({
          tenant_id: this.tenantId,
          order_id: orderId,
          type: 'RECEITA',
          amount: inst.valor || inst.value || 0,
          status: dbStatus,
          description: `Parcela ${installmentNumber}/${installmentsTotal} - ${inst.forma_pagamento || 'Pix'}`,
          due_date: inst.data_vencimento || new Date().toISOString().split('T')[0],
          payment_date: (realInstStatus === 'QUITADO' || realInstStatus === 'BAIXADO' || realInstStatus === 'CONCILIADO')
            ? (paymentDateStr || inst.data_vencimento || new Date().toISOString().split('T')[0])
            : null,
          notes: instNotes
        });
      }

      if (transactionsPayload.length > 0) {
        const { error: finErr } = await dbClient.from('financial_transactions').insert(transactionsPayload);
        if (finErr) {
          throw new Error(`Erro ao salvar parcelas financeiras no banco: ${finErr.message}`);
        }
      }

      if (totalPaidInstallments > 0) {
        await dbClient
          .from('orders')
          .update({
            installments_paid: totalPaidInstallments,
            first_payment_date: paymentReleasedDate || installments[0].data_vencimento
          })
          .eq('id', orderId);
      }
    }

    return { success: true, orderId };
  }

  async findPessoaOnContaAzul(query: { documento?: string; busca?: string }) {
    const token = await this.getValidAccessToken();
    const cleanDoc = (query.documento || '').replace(/\D/g, '');
    
    let url = `${CONTA_AZUL_API_URL}/v1/pessoas?tamanho_pagina=5`;
    if (cleanDoc) {
      url += `&documento=${cleanDoc}`;
    } else if (query.busca) {
      url += `&busca=${encodeURIComponent(query.busca)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar no Conta Azul: ${await response.text()}`);
    }

    const resData = await response.json();
    const items = resData.itens || resData.items || [];
    if (items.length === 0) {
      return null;
    }

    const firstItem = items[0];
    const detailResponse = await fetch(`${CONTA_AZUL_API_URL}/v1/pessoas/${firstItem.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!detailResponse.ok) {
      return {
        conta_azul_id: firstItem.id,
        name: firstItem.nome || firstItem.nome_fantasia || '',
        document: firstItem.documento || '',
        email: firstItem.email || '',
        phone: firstItem.telefone_celular || firstItem.telefone_comercial || firstItem.telefone || '',
        address: ''
      };
    }

    const detail = await detailResponse.json();
    let addrVal = '';
    if (detail.enderecos?.[0]) {
      const addr = detail.enderecos[0];
      addrVal = `${addr.logradouro || ''}, ${addr.numero || ''} ${addr.complemento ? '(' + addr.complemento + ')' : ''} - ${addr.bairro || ''}, ${addr.cidade || ''}/${addr.estado || ''}`;
    }

    return {
      conta_azul_id: detail.id,
      name: detail.nome || detail.nome_fantasia || '',
      document: detail.documento || '',
      email: detail.email || '',
      phone: detail.telefone_celular || detail.telefone_comercial || detail.telefone || '',
      address: addrVal
    };
  }
}
export default ContaAzulService;
