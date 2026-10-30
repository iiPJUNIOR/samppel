import { getDbClient } from '../supabaseClient';

export async function getSuppliers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient().from('suppliers').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createSupplier(supplier: any) {
  const newSupp = {
    id: supplier.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: supplier.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...supplier
  };
  const { data, error } = await getDbClient().from('suppliers').insert([newSupp]).select().single();
  return { data, error };
}

export async function updateSupplier(id: string, updates: any) {
  const { data, error } = await getDbClient().from('suppliers').update(updates).eq('id', id).select().single();
  return { data, error };
}
