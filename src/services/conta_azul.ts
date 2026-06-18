import { getContaAzulConfig, updateContaAzulConfig, createIntegrationLog } from './supabase';

const CONTA_AZUL_API_URL = 'https://api.contaazul.com';
const CONTA_AZUL_AUTH_URL = 'https://app.contaazul.com/oauth2';

interface ContaAzulTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Service to handle all Conta Azul ERP REST API integration and OAuth 2.0 flows.
 */
export class ContaAzulService {
  private tenantId: string;

  constructor(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
    this.tenantId = tenantId;
  }

  /**
   * Generates the Conta Azul OAuth 2.0 authorization URL
   */
  public async getAuthorizationUrl(clientId: string, redirectUri: string, state: string): Promise<string> {
    const scope = encodeURIComponent('sales customers products financial contacts');
    return `${CONTA_AZUL_AUTH_URL}/authorize?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${clientId}&scope=${scope}&state=${state}&response_type=code`;
  }

  /**
   * Exchanges authorization code for Access and Refresh Tokens
   */
  public async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<ContaAzulTokens> {
    const isMock = clientId.includes('placeholder') || clientSecret.includes('placeholder');
    
    // Create audit log for token exchange
    await createIntegrationLog(
      'OAUTH_CODE_EXCHANGE',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      { client_id: clientId, redirect_uri: redirectUri },
      null,
      isMock ? 'Mock token generated.' : 'Requesting authorization token...',
      this.tenantId
    );

    if (isMock) {
      const tokens: ContaAzulTokens = {
        access_token: `mock_access_${Math.random().toString(36).substring(2)}`,
        refresh_token: `mock_refresh_${Math.random().toString(36).substring(2)}`,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Conta Azul exchange error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const tokens: ContaAzulTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
      };

      // Save credentials in database
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
        error.message || 'Token exchange failed',
        this.tenantId
      );
      throw error;
    }
  }

  /**
   * Gets a valid access token. Refreshes if expired or close to expiration.
   */
  private async getValidAccessToken(): Promise<string> {
    const { data: config, error } = await getContaAzulConfig(this.tenantId);
    if (error || !config) {
      throw new Error('Conta Azul integration is not configured.');
    }

    const { client_id, client_secret, access_token, refresh_token, expires_at } = config;
    if (!client_id || !client_secret) {
      throw new Error('Conta Azul client_id and client_secret are required.');
    }

    const isMock = client_id.includes('placeholder') || client_secret.includes('placeholder');
    if (isMock) {
      return access_token || 'mock_access_token';
    }

    if (!access_token || !refresh_token) {
      throw new Error('Conta Azul is not authenticated (missing tokens).');
    }

    // Check if token is expired or expires in next 5 minutes
    const expiresAtMs = expires_at ? new Date(expires_at).getTime() : 0;
    const nowMs = Date.now();
    const isExpired = expiresAtMs - nowMs < 5 * 60 * 1000;

    if (!isExpired) {
      return access_token;
    }

    // Refresh token
    try {
      const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      const response = await fetch(`${CONTA_AZUL_AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token || refresh_token; // may return new refresh token
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
        err.message || 'Token refresh failed',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Synchronize Customer to Conta Azul
   */
  public async syncCustomer(customer: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = !config || config.client_id.includes('placeholder');

    await createIntegrationLog(
      'SYNC_CUSTOMER',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      customer,
      null,
      isMock ? 'Running sync in mock mode...' : 'Calling Conta Azul customer endpoint...',
      this.tenantId
    );

    if (isMock) {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 500));
      return customer.conta_azul_id || `ca_cust_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      const payload = {
        name: customer.name,
        company_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document, // CPF/CNPJ
        address: customer.address ? {
          street: customer.address.split(',')[0] || customer.address,
          number: '',
          complement: '',
          neighborhood: '',
          zip_code: '',
          city: '',
          state: ''
        } : undefined
      };

      let response;
      if (customer.conta_azul_id) {
        // Update
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/customers/${customer.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/customers`, {
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
        throw new Error(`Conta Azul API Customer error: ${response.status} - ${errorText}`);
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
        err.message || 'Customer sync failed',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Synchronize Supplier to Conta Azul (treated as general Contacts in Conta Azul schema)
   */
  public async syncSupplier(supplier: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = !config || config.client_id.includes('placeholder');

    await createIntegrationLog(
      'SYNC_SUPPLIER',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      supplier,
      null,
      isMock ? 'Running sync in mock mode...' : 'Calling Conta Azul contacts endpoint...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return supplier.conta_azul_id || `ca_supp_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      const payload = {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        document: supplier.document,
        supplier: true, // Specific flag for supplier
        address: supplier.address ? { street: supplier.address } : undefined
      };

      let response;
      if (supplier.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/customers/${supplier.conta_azul_id}`, { // Conta Azul handles suppliers under /customers endpoint with supplier=true flag
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/customers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`Supplier sync API error: ${response.statusText}`);
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
        err.message || 'Supplier sync failed',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Synchronize Product to Conta Azul
   */
  public async syncProduct(product: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = !config || config.client_id.includes('placeholder');

    await createIntegrationLog(
      'SYNC_PRODUCT',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      product,
      null,
      isMock ? 'Running sync in mock mode...' : 'Calling Conta Azul products endpoint...',
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
        cost: product.price * 0.4, // Assume mock cost
        // stock item fields
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
        throw new Error(`Product sync API error: ${response.statusText}`);
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
        err.message || 'Product sync failed',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Synchronize Order/Sale to Conta Azul
   */
  public async syncOrder(order: any, customer: any, product: any): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = !config || config.client_id.includes('placeholder');

    await createIntegrationLog(
      'SYNC_ORDER',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      { order_id: order.id, customer_id: customer?.id, product_id: product?.id },
      null,
      isMock ? 'Running sync in mock mode...' : 'Calling Conta Azul sales endpoint...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return order.conta_azul_id || `ca_sale_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();

      if (!customer?.conta_azul_id) {
        throw new Error('Customer must be synced with Conta Azul first.');
      }
      if (!product?.conta_azul_id) {
        throw new Error('Product must be synced with Conta Azul first.');
      }

      // Format Conta Azul Sale object
      let saleNumber = order.order_number;
      if (order.pv_number) {
        const numericPart = order.pv_number.replace(/\D/g, '');
        if (numericPart) {
          saleNumber = parseInt(numericPart, 10);
        }
      }

      const payload = {
        number: saleNumber,
        emission_date: order.order_date || new Date().toISOString(),
        status: order.status === 'Pago' ? 'COMMITTED' : 'APPROVED', // APPROVED, COMMITTED, CANCELLED
        customer_id: customer.conta_azul_id,
        seller: order.seller_name,
        notes: order.notes,
        shipping_cost: order.freight_value,
        items: [
          {
            product_id: product.conta_azul_id,
            quantity: order.print_run, // Tiragem as total items
            value: product.price, // Unit price
            description: `Medidas: ${order.measure}. Caixas: ${order.boxes_count}.`
          }
        ]
      };

      let response;
      if (order.conta_azul_id) {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/sales/${order.conta_azul_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONTA_AZUL_API_URL}/v1/sales`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`Order sync API error: ${response.statusText}`);
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
        err.message || 'Order sync failed',
        this.tenantId
      );
      throw err;
    }
  }

  /**
   * Synchronize Financial Transaction to Conta Azul
   */
  public async syncFinancial(financial: any, order: any = null): Promise<string> {
    const { data: config } = await getContaAzulConfig(this.tenantId);
    const isMock = !config || config.client_id.includes('placeholder');

    await createIntegrationLog(
      'SYNC_FINANCIAL',
      isMock ? 'SUCCESS' : 'PENDING_RETRY',
      financial,
      null,
      isMock ? 'Running sync in mock mode...' : 'Calling Conta Azul financial endpoint...',
      this.tenantId
    );

    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return financial.conta_azul_id || `ca_fin_${Math.random().toString(36).substring(2, 8)}`;
    }

    try {
      const token = await this.getValidAccessToken();
      
      // Select API path based on income (RECEITA) or expense (DESPESA)
      const isIncome = financial.type === 'RECEITA';
      const endpoint = isIncome ? 'receivables' : 'payables';

      const payload = {
        due_date: financial.due_date,
        value: financial.amount,
        description: financial.description,
        category_id: isIncome ? 'receita-venda' : 'despesa-insumo', // Simplified category
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
        throw new Error(`Financial sync API error: ${response.statusText}`);
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
        err.message || 'Financial sync failed',
        this.tenantId
      );
      throw err;
    }
  }
}
export default ContaAzulService;
