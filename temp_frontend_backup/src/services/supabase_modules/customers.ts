import { getDbClient, isMockMode, mockCustomers, setMockCustomers } from '../supabaseClient';
import { enqueueSync } from '../supabaseClient'; // Ensure it's imported correctly

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
  
  const { data, error } = await getDbClient().from('customers').insert([customer]).select().single();
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
