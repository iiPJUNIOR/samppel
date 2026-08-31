import { getDbClient, isMockMode, mockFinancial, mockOrders, setMockFinancial, enqueueSync } from '../supabaseClient';

// Financeiro
export async function getFinancialTransactions(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockFinancial.filter(f => f.tenant_id === tenantId).map(f => {
      const order = mockOrders.find(o => o.id === f.order_id);
      return {
        ...f,
        order
      };
    });
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('financial_transactions')
    .select('*, order:orders(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createFinancialTransaction(transaction: any) {
  const newFin = {
    id: transaction.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: transaction.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...transaction
  };
  if (isMockMode) {
    mockFinancial.unshift(newFin);
    await enqueueSync(newFin.tenant_id, 'FINANCIAL', newFin.id, 'CREATE');
    return { data: newFin, error: null };
  }
  const { data, error } = await getDbClient().from('financial_transactions').insert([transaction]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'FINANCIAL', data.id, 'CREATE');
  }
  return { data, error };
}

export async function reconcileTransaction(id: string, paymentDate = new Date().toISOString().split('T')[0]) {
  if (isMockMode) {
    const updatedMocks = mockFinancial.map(f => f.id === id ? { ...f, status: 'CONCILIADO', payment_date: paymentDate } : f);
    setMockFinancial(updatedMocks);
    const updated = mockFinancial.find(f => f.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'FINANCIAL', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient()
    .from('financial_transactions')
    .update({ status: 'CONCILIADO', payment_date: paymentDate })
    .eq('id', id)
    .select()
    .single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'FINANCIAL', data.id, 'UPDATE');
  }
  return { data, error };
}
