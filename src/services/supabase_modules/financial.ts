import { getDbClient } from '../supabaseClient';

// Financeiro
export async function getFinancialTransactions(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
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
  const { data, error } = await getDbClient().from('financial_transactions').insert([newFin]).select().single();
  return { data, error };
}

export async function reconcileTransaction(id: string, paymentDate = new Date().toISOString().split('T')[0]) {
  const { data, error } = await getDbClient()
    .from('financial_transactions')
    .update({ status: 'CONCILIADO', payment_date: paymentDate })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}
