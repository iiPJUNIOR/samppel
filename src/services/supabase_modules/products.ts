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
  category?: 'LISAS' | 'PERSONALIZADA' | 'COMPRA' | string;
  conta_azul_id?: string | null;
  bind_to_first_item?: boolean;
  bind_requires_handling?: boolean;
  created_at?: string;
  updated_at?: string;
}

function parseProductCategory(p: any): string | null {
  if (p.category) {
    if (p.category === 'SEM_CATEGORIA' || p.category === '' || p.category === 'NENHUMA') return null;
    return p.category;
  }
  if (p.description && typeof p.description === 'string') {
    const match = p.description.match(/\[CATEGORIA:\s*([A-Z_]+)\]/i);
    if (match && match[1]) {
      const cat = match[1].toUpperCase();
      if (cat === 'SEM_CATEGORIA' || cat === 'NENHUMA' || cat === 'NENHUM' || cat === 'VAZIO') {
        return null;
      }
      return cat;
    }
  }
  const normName = (p.name || '').toLowerCase();
  if (normName.includes('sem impress') || normName.includes('lisa') || normName.includes('padrao')) {
    return 'LISAS';
  }
  return null;
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

function encodeProductDescription(desc: string | null | undefined, category: string | undefined | null, measure: string | undefined, customerId: string | undefined, bindToFirst: boolean | undefined = false, bindHandling: boolean | undefined = false): string {
  let cleanDesc = (desc || '')
    .replace(/\s*\[CATEGORIA:\s*[A-Z_]+\]/gi, '')
    .replace(/\s*\[MEDIDA:\s*[^\]]+\]/gi, '')
    .replace(/\s*\[CLIENTE:\s*[^\]]+\]/gi, '')
    .replace(/\s*\[BIND_FIRST:\s*(TRUE|FALSE)\]/gi, '')
    .replace(/\s*\[BIND_HANDLING:\s*(TRUE|FALSE)\]/gi, '')
    .trim();
  if (category && category !== 'SEM_CATEGORIA') {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[CATEGORIA:${category}]` : `[CATEGORIA:${category}]`;
  } else {
    cleanDesc = cleanDesc ? `${cleanDesc}\n[CATEGORIA:SEM_CATEGORIA]` : `[CATEGORIA:SEM_CATEGORIA]`;
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

export interface PaginatedProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tab?: 'lisas' | 'custom_stocks' | 'compra' | 'sem_categoria' | 'all';
  tenantId?: string;
}

export async function getProductsPaginated({
  page = 1,
  pageSize = 25,
  search = '',
  tab = 'all',
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
}: PaginatedProductsParams) {
  if (isMockMode) {
    let list = mockProducts.filter(p => p.tenant_id === tenantId);
    if (tab === 'lisas') list = list.filter(p => p.category === 'LISAS');
    else if (tab === 'custom_stocks') list = list.filter(p => p.category === 'PERSONALIZADA');
    else if (tab === 'compra') list = list.filter(p => p.category === 'COMPRA');
    else if (tab === 'sem_categoria') list = list.filter(p => !p.category || (p.category !== 'LISAS' && p.category !== 'PERSONALIZADA' && p.category !== 'COMPRA'));
    
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s));
    }
    const totalCount = list.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return {
      data: list.slice(from, to),
      totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      error: null
    };
  }

  let query = getDbClient()
    .from('products')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  // Filtro de Categoria por Aba
  if (tab === 'lisas') {
    query = query.or('description.ilike.%[CATEGORIA:LISAS]%,and(description.not.ilike.%[CATEGORIA:%,name.ilike.%sem impress%),and(description.not.ilike.%[CATEGORIA:%,name.ilike.%lisa%),and(description.not.ilike.%[CATEGORIA:%,name.ilike.%padrao%)');
  } else if (tab === 'custom_stocks') {
    query = query.ilike('description', '%[CATEGORIA:PERSONALIZADA]%');
  } else if (tab === 'compra') {
    query = query.ilike('description', '%[CATEGORIA:COMPRA]%');
  } else if (tab === 'sem_categoria') {
    query = query.or('description.ilike.%[CATEGORIA:SEM_CATEGORIA]%,and(description.not.ilike.%[CATEGORIA:LISAS]%,description.not.ilike.%[CATEGORIA:PERSONALIZADA]%,description.not.ilike.%[CATEGORIA:COMPRA]%,name.not.ilike.%sem impress%,name.not.ilike.%lisa%,name.not.ilike.%padrao%)');
  }

  // Filtro de Pesquisa
  if (search && search.trim()) {
    const s = search.trim().replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('name', { ascending: true })
    .range(from, to);

  if (error) {
    return { data: [], totalCount: 0, page, pageSize, totalPages: 1, error };
  }

  const mapped = (data || []).map((p: any) => ({
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

  const total = count || 0;

  return {
    data: mapped,
    totalCount: total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    error: null
  };
}

export async function getProductCategoryCounts(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockProducts.filter(p => p.tenant_id === tenantId);
    return {
      all: list.length,
      lisas: list.filter(p => p.category === 'LISAS').length,
      custom_stocks: list.filter(p => p.category === 'PERSONALIZADA').length,
      compra: list.filter(p => p.category === 'COMPRA').length,
      sem_categoria: list.filter(p => !p.category || (p.category !== 'LISAS' && p.category !== 'PERSONALIZADA' && p.category !== 'COMPRA')).length
    };
  }

  try {
    const client = getDbClient();
    const [allRes, compraRes, customRes, lisasRes] = await Promise.all([
      client.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      client.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).ilike('description', '%[CATEGORIA:COMPRA]%'),
      client.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).ilike('description', '%[CATEGORIA:PERSONALIZADA]%'),
      client.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).or('description.ilike.%[CATEGORIA:LISAS]%,and(description.not.ilike.%[CATEGORIA:%,name.ilike.%sem impress%),and(description.not.ilike.%[CATEGORIA:%,name.ilike.%lisa%),and(description.not.ilike.%[CATEGORIA:%,name.ilike.%padrao%)')
    ]);

    const all = allRes.count || 0;
    const compra = compraRes.count || 0;
    const custom_stocks = customRes.count || 0;
    const lisas = lisasRes.count || 0;
    const sem_categoria = Math.max(0, all - (lisas + custom_stocks + compra));

    return {
      all,
      lisas,
      custom_stocks,
      compra,
      sem_categoria
    };
  } catch (e) {
    console.error('Error fetching category counts:', e);
    return { all: 0, lisas: 0, custom_stocks: 0, compra: 0, sem_categoria: 0 };
  }
}

export async function createProduct(product: any) {
  const category = product.category || null;
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
