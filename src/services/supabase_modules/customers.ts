import { getDbClient, isMockMode, mockCustomers, setMockCustomers } from '../supabaseClient';
import { enqueueSync } from '../supabaseClient'; // Ensure it's imported correctly

export interface PaginatedCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tenantId?: string;
}

export async function getCustomersPaginated({
  page = 1,
  pageSize = 25,
  search = '',
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
}: PaginatedCustomersParams = {}) {
  if (isMockMode) {
    let list = mockCustomers.filter(c => c.tenant_id === tenantId);
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      list = list.filter(c => 
        (c.name || '').toLowerCase().includes(s) || 
        (c.document || '').includes(s)
      );
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
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (search && search.trim()) {
    const s = search.trim().replace(/[%_]/g, '');
    const cleanDoc = s.replace(/\D/g, '');
    if (cleanDoc && cleanDoc.length >= 3) {
      query = query.or(`name.ilike.%${s}%,document.ilike.%${cleanDoc}%,document.ilike.%${s}%`);
    } else {
      query = query.or(`name.ilike.%${s}%,document.ilike.%${s}%`);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('name', { ascending: true })
    .range(from, to);

  const totalCount = count || 0;
  return {
    data: data || [],
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    error
  };
}

export async function searchCustomers(query: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', limit = 30) {
  if (isMockMode) {
    const s = (query || '').trim().toLowerCase();
    const cleanDoc = s.replace(/\D/g, '');
    const list = mockCustomers
      .filter(c => c.tenant_id === tenantId && (
        !s ||
        (c.name || '').toLowerCase().includes(s) ||
        (c.document || '').includes(cleanDoc || s)
      ))
      .slice(0, limit);
    return { data: list, error: null };
  }

  // Se executando no navegador, prioriza a rota de API corporativa (imune a RLS de anon)
  if (typeof window !== 'undefined') {
    try {
      const url = `/api/customers/search?q=${encodeURIComponent(query || '')}&tenantId=${encodeURIComponent(tenantId)}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return { data: json.data, error: null };
        }
      }
    } catch (e) {
      console.warn('Fallback para RPC direta de busca de clientes:', e);
    }
  }

  // Chamada via RPC direto no PostgreSQL (servidor ou fallback de cliente)
  try {
    const { data, error } = await getDbClient().rpc('search_customers_enterprise', {
      p_tenant_id: tenantId,
      p_query: query || '',
      p_customer_id: null,
      p_limit: limit
    });
    if (!error && data) {
      return { data, error: null };
    }
  } catch (rpcErr) {
    console.warn('RPC search_customers_enterprise indisponível, usando fallback query:', rpcErr);
  }

  // Fallback padrão se RPC falhar
  const s = (query || '').trim().replace(/[%_]/g, '');
  const cleanDoc = s.replace(/\D/g, '');
  let q = getDbClient()
    .from('customers')
    .select('id, name, document, phone, email, address, conta_azul_id')
    .eq('tenant_id', tenantId);

  if (cleanDoc && cleanDoc.length >= 3) {
    q = q.or(`name.ilike.%${s}%,document.ilike.%${cleanDoc}%,document.ilike.%${s}%`);
  } else if (s) {
    q = q.or(`name.ilike.%${s}%,document.ilike.%${s}%`);
  }

  const { data, error } = await q.order('name', { ascending: true }).limit(limit);
  return { data: data || [], error };
}

export async function getCustomerById(id: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (!id) return { data: null, error: null };
  if (isMockMode) {
    const cust = mockCustomers.find(c => c.id === id);
    return { data: cust || null, error: null };
  }

  // Se executando no navegador, busca na API de backend para evitar falhas de RLS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/customers/search?id=${encodeURIComponent(id)}&tenantId=${encodeURIComponent(tenantId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.customer) {
          return { data: json.customer, error: null };
        }
      }
    } catch (e) {
      console.warn('Fallback para getDbClient em getCustomerById:', e);
    }
  }

  const { data, error } = await getDbClient()
    .from('customers')
    .select('id, name, document, phone, email, address, conta_azul_id')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}

export async function getCustomers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockCustomers.filter(c => c.tenant_id === tenantId), error: null };
  const { data, error } = await getDbClient().from('customers').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createCustomer(customer: any) {
  const newCust = {
    id: customer.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: customer.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...customer
  };
  
  if (isMockMode) {
    const updatedMocks = [newCust, ...mockCustomers];
    setMockCustomers(updatedMocks);
    await enqueueSync(newCust.tenant_id, 'CUSTOMER', newCust.id, 'CREATE');
    return { data: newCust, error: null };
  }
  
  const { data, error } = await getDbClient().from('customers').insert([newCust]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'CUSTOMER', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateCustomer(id: string, updates: any) {
  if (isMockMode) {
    const updatedMocks = mockCustomers.map(c => c.id === id ? { ...c, ...updates } : c);
    setMockCustomers(updatedMocks);
    const updated = updatedMocks.find(c => c.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'CUSTOMER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient().from('customers').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'CUSTOMER', data.id, 'UPDATE');
  }
  return { data, error };
}
