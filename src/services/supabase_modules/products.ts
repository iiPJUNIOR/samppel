import { getDbClient, isMockMode, mockProducts, setMockProducts, enqueueSync } from '../supabaseClient';

// Produtos & Estoque
export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price?: number;
  stock_quantity: number;
  category?: 'LISAS' | 'PERSONALIZADA' | string;
  conta_azul_id?: string | null;
  bind_to_first_item?: boolean;
  bind_requires_handling?: boolean;
  created_at?: string;
  updated_at?: string;
}

function parseProductCategory(p: any): string {
  if (p.category) return p.category;
  if (p.description && typeof p.description === 'string') {
    const match = p.description.match(/\[CATEGORIA:\s*([A-Z_]+)\]/i);
    if (match && match[1]) return match[1].toUpperCase();
  }
  const normName = (p.name || '').toLowerCase();
  if (normName.includes('sem impress') || normName.includes('lisa') || normName.includes('padrao')) {
    return 'LISAS';
  }
  return 'PERSONALIZADA';
}

function parseProductMeasure(p: any): string | null {
  if (p.measure) return p.measure;
  if (p.description && typeof p.description === 'string') {
    const match = p.description.match(/\[MEDIDA:\s*([^\]]+)\]/i);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function parseProductCustomer(p: any): string | null {
  if (p.customer_id) return p.customer_id;
  if (p.description && typeof p.description === 'string') {
    const match = p.description.match(/\[CLIENTE:\s*([^\]]+)\]/i);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function parseProductBindToFirst(p: any): boolean {
  if (p.description && typeof p.description === 'string') {
    if (/\[BIND_FIRST:TRUE\]/i.test(p.description)) return true;
    if (/\[BIND_FIRST:FALSE\]/i.test(p.description)) return false;
  }
  return !!p.bind_to_first_item;
}

function parseProductBindHandling(p: any): boolean {
  if (p.description && typeof p.description === 'string') {
    if (/\[BIND_HANDLING:TRUE\]/i.test(p.description)) return true;
    if (/\[BIND_HANDLING:FALSE\]/i.test(p.description)) return false;
  }
  return !!p.bind_requires_handling;
}

function encodeProductDescription(desc: string | null | undefined, category: string | undefined, measure: string | undefined, customerId: string | undefined, bindToFirst: boolean | undefined = false, bindHandling: boolean | undefined = false): string {
  let cleanDesc = (desc || '')
    .replace(/\s*\[CATEGORIA:\s*[A-Z_]+\]/gi, '')
    .replace(/\s*\[MEDIDA:\s*[^\]]+\]/gi, '')
    .replace(/\s*\[CLIENTE:\s*[^\]]+\]/gi, '')
    .replace(/\s*\[BIND_FIRST:\s*(TRUE|FALSE)\]/gi, '')
    .replace(/\s*\[BIND_HANDLING:\s*(TRUE|FALSE)\]/gi, '')
    .trim();
  if (category) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[CATEGORIA:${category}]` : `[CATEGORIA:${category}]`;
  }
  if (measure) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[MEDIDA:${measure}]` : `[MEDIDA:${measure}]`;
  }
  if (customerId) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[CLIENTE:${customerId}]` : `[CLIENTE:${customerId}]`;
  }
  if (bindToFirst) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[BIND_FIRST:TRUE]` : `[BIND_FIRST:TRUE]`;
  } else {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[BIND_FIRST:FALSE]` : `[BIND_FIRST:FALSE]`;
  }
  if (bindHandling) {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[BIND_HANDLING:TRUE]` : `[BIND_HANDLING:TRUE]`;
  } else {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[BIND_HANDLING:FALSE]` : `[BIND_HANDLING:FALSE]`;
  }
  return cleanDesc;
}

export async function getProducts(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockProducts.filter(p => p.tenant_id === tenantId), error: null };
  const { data, error } = await getDbClient().from('products').select('*').eq('tenant_id', tenantId).order('name');
  if (data) {
    const mapped = data.map((p: any) => ({
      ...p,
      category: parseProductCategory(p),
      measure: parseProductMeasure(p),
      customer_id: parseProductCustomer(p),
      bind_to_first_item: parseProductBindToFirst(p),
      bind_requires_handling: parseProductBindHandling(p),
      description: (p.description || '')
        .replace(/\s*\[CATEGORIA:\s*[A-Z_]+\]/gi, '')
        .replace(/\s*\[MEDIDA:\s*[^\]]+\]/gi, '')
        .replace(/\s*\[CLIENTE:\s*[^\]]+\]/gi, '')
        .replace(/\s*\[BIND_FIRST:\s*(TRUE|FALSE)\]/gi, '')
        .replace(/\s*\[BIND_HANDLING:\s*(TRUE|FALSE)\]/gi, '')
        .trim()
    }));
    return { data: mapped, error: null };
  }
  return { data, error };
}

export async function createProduct(product: any) {
  const category = product.category || 'LISAS';
  const description = encodeProductDescription(product.description, category, product.measure, product.customer_id, product.bind_to_first_item, product.bind_requires_handling);
  const payload = {
    ...product,
    description,
    category
  };
  
  delete payload.measure;
  delete payload.customer_id;
  delete payload.bind_requires_handling;
  delete payload.bind_to_first_item;

  const newProd = {
    id: product.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: product.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    stock_quantity: product.stock_quantity || 0,
    created_at: new Date().toISOString(),
    ...payload
  };
  if (isMockMode) {
    mockProducts.unshift(newProd);
    await enqueueSync(newProd.tenant_id, 'PRODUCT', newProd.id, 'CREATE');
    return { data: newProd, error: null };
  }
  let { data, error } = await getDbClient().from('products').insert([newProd]).select().single();
  if (error && error.message?.includes('category')) {
    const { category: _, ...restProd } = newProd;
    const retryRes = await getDbClient().from('products').insert([restProd]).select().single();
    data = retryRes.data;
    error = retryRes.error;
  }
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'CREATE');
    data = {
      ...data,
      category: parseProductCategory(data),
      measure: parseProductMeasure(data),
      customer_id: parseProductCustomer(data),
      bind_to_first_item: parseProductBindToFirst(data),
      bind_requires_handling: parseProductBindHandling(data),
      description: (data.description || '')
        .replace(/\s*\[CATEGORIA:\s*[A-Z_]+\]/gi, '')
        .replace(/\s*\[MEDIDA:\s*[^\]]+\]/gi, '')
        .replace(/\s*\[CLIENTE:\s*[^\]]+\]/gi, '')
        .replace(/\s*\[BIND_FIRST:\s*(TRUE|FALSE)\]/gi, '')
        .replace(/\s*\[BIND_HANDLING:\s*(TRUE|FALSE)\]/gi, '')
        .trim()
    };
  }
  return { data, error };
}

export async function updateProduct(id: string, updates: any) {
  if (isMockMode) {
    const updatedMocks = mockProducts.map(p => p.id === id ? { ...p, ...updates } : p);
    setMockProducts(updatedMocks);
    const updated = mockProducts.find(p => p.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'PRODUCT', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }

  const payload = { ...updates };
  payload.description = encodeProductDescription(payload.description, payload.category, payload.measure, payload.customer_id, payload.bind_to_first_item, payload.bind_requires_handling);
  
  delete payload.measure;
  delete payload.customer_id;
  delete payload.bind_requires_handling;
  delete payload.bind_to_first_item;

  let { data, error } = await getDbClient().from('products').update(payload).eq('id', id).select().single();
  if (error && error.message?.includes('category')) {
    const { category: _, ...restUpdates } = payload;
    const retryRes = await getDbClient().from('products').update(restUpdates).eq('id', id).select().single();
    data = retryRes.data;
    error = retryRes.error;
  }
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'UPDATE');
    data = {
      ...data,
      category: parseProductCategory(data),
      measure: parseProductMeasure(data),
      customer_id: parseProductCustomer(data),
      bind_to_first_item: parseProductBindToFirst(data),
      bind_requires_handling: parseProductBindHandling(data),
      description: (data.description || '')
        .replace(/\s*\[CATEGORIA:\s*[A-Z_]+\]/gi, '')
        .replace(/\s*\[MEDIDA:\s*[^\]]+\]/gi, '')
        .replace(/\s*\[CLIENTE:\s*[^\]]+\]/gi, '')
        .replace(/\s*\[BIND_FIRST:\s*(TRUE|FALSE)\]/gi, '')
        .replace(/\s*\[BIND_HANDLING:\s*(TRUE|FALSE)\]/gi, '')
        .trim()
    };
  }
  return { data, error };
}

export async function deleteProduct(id: string) {
  if (isMockMode) {
    const idx = mockProducts.findIndex(p => p.id === id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    return { data: null, error: null };
  }
  const { data, error } = await getDbClient()
    .from('products')
    .delete()
    .eq('id', id)
    .select()
    .single();
    
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'DELETE');
  }
  return { data, error };
}

export async function adjustStock(productId: string, quantity: number, type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'PEDIDO', description: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', operatorId?: string | null, allowNegative = true) {
  if (isMockMode) {
    const updatedMocks = mockProducts.map(p => {
      if (p.id === productId) {
        const newQty = p.stock_quantity + quantity;
        return { ...p, stock_quantity: !allowNegative && newQty < 0 ? 0 : newQty };
      }
      return p;
    });
    setMockProducts(updatedMocks);
    return { error: null };
  }
  const { data: prod } = await getDbClient().from('products').select('stock_quantity').eq('id', productId).single();
  if (prod) {
    const newQty = (prod.stock_quantity || 0) + quantity;
    const finalQty = !allowNegative && newQty < 0 ? 0 : newQty;
    
    // Check if operator_id column exists by omitting it first if it fails, but let's just omit it since it's not in schema.sql
    await getDbClient().from('products').update({ stock_quantity: finalQty }).eq('id', productId);
    
    // We omit operator_id because it was not found in schema.sql for stock_transactions
    await getDbClient().from('stock_transactions').insert([{
      tenant_id: tenantId,
      product_id: productId,
      quantity,
      type,
      description
    }]);
  }
  return { error: null };
}

export async function getStockTransactions(productId: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: [], error: null };
  const { data, error } = await getDbClient()
    .from('stock_transactions')
    .select('*')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function checkProductStock(productId: string): Promise<number> {
  if (isMockMode) {
    const p = mockProducts.find(p => p.id === productId);
    return p ? (p.stock_quantity || 0) : 0;
  }
  const { data } = await getDbClient()
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();
  return data?.stock_quantity || 0;
}
