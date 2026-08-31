import { getDbClient, isMockMode, mockSuppliers, setMockSuppliers } from '../supabaseClient';
import { enqueueSync } from '../supabaseClient';

export async function getSuppliers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockSuppliers.filter(s => s.tenant_id === tenantId), error: null };
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
  if (isMockMode) {
    const updatedMocks = [newSupp, ...mockSuppliers];
    setMockSuppliers(updatedMocks);
    await enqueueSync(newSupp.tenant_id, 'SUPPLIER', newSupp.id, 'CREATE');
    return { data: newSupp, error: null };
  }
  const { data, error } = await getDbClient().from('suppliers').insert([supplier]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'SUPPLIER', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateSupplier(id: string, updates: any) {
  if (isMockMode) {
    const updatedMocks = mockSuppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    setMockSuppliers(updatedMocks);
    const updated = updatedMocks.find(s => s.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'SUPPLIER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient().from('suppliers').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'SUPPLIER', data.id, 'UPDATE');
  }
  return { data, error };
}
