import { supabase, supabaseAdmin, getCustomers, getProducts, getOrders, getSuppliers, getFinancialTransactions, updateCustomer, updateProduct, updateOrder, updateSupplier, reconcileTransaction } from './supabase';
import { ContaAzulService } from './conta_azul';

const isMockMode = 
  !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0') ||
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').includes('placeholder');

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
      queueItems = (data || []).filter(item => 
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
      const item = queueList.find(q => q.id === queueId);
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
