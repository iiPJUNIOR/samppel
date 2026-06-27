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
