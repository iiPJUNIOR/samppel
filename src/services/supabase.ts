import { createClient } from '@supabase/supabase-js';

// Variaveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Detecta se estamos usando chaves de demonstracao/mock
const isMockMode = false;

// Cliente Supabase Anonimo (usado no navegador e no servidor)
export const supabase = !isMockMode 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Cliente Supabase Admin (disponivel apenas no lado do servidor)
export const supabaseAdmin = !isMockMode && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Retorna o cliente apropriado: supabaseAdmin no servidor (para bypassar RLS em background) e supabase no navegador (com token do usuario autenticado)
function getDbClient() {
  if (typeof window === 'undefined') {
    return supabaseAdmin || supabase!;
  }
  return supabase!;
}

// --- DADOS SIMULADOS (MOCK DATA) PARA MODO SANDBOX ---
let mockCompanies: any[] = [
  { id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Samppel Embalagens Ltda', cnpj: '12.345.678/0001-90', created_at: new Date().toISOString() }
];

let mockProfiles: any[] = [
  { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Ana Silva (Admin)', role: 'Administrador', email: 'admin@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Mariana Souza (Vendas)', role: 'Comercial', email: 'comercial@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Carlos Mendes (Fábrica)', role: 'Produção', email: 'producao@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Beatriz Lima (Financeiro)', role: 'Financeiro', email: 'financeiro@samppel.com.br', created_at: new Date().toISOString() }
];

let mockCustomers: any[] = [
  { id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Chocolate Gourmet Brasil', document: '22.333.444/0001-55', email: 'contato@chocobrasil.com.br', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000 - São Paulo/SP', conta_azul_id: 'ca_cust_1', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Cosméticos Florescer Ltda', document: '33.444.555/0001-66', email: 'suporte@florescer.com.br', phone: '(21) 97654-3210', address: 'Rua das Flores, 45 - Rio de Janeiro/RJ', conta_azul_id: 'ca_cust_2', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Boutique do Café Especial', document: '44.555.666/0001-77', email: 'financeiro@boutiquecafe.com', phone: '(31) 3456-7890', address: 'Praça da Liberdade, 300 - Belo Horizonte/MG', conta_azul_id: null, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

let mockSuppliers: any[] = [
  { id: '500184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Papelaria Klabin Distribuidora', document: '11.111.111/0001-11', email: 'vendas@klabin.com.br', phone: '(11) 3003-1234', address: 'Rodovia Dutra, Km 200 - Guarulhos/SP', conta_azul_id: 'ca_supp_1', created_at: new Date().toISOString() },
  { id: '500284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Tintas Especiais Dupont', document: '22.222.222/0001-22', email: 'tintas@dupont.com', phone: '(19) 3876-5432', address: 'Distrito Industrial - Campinas/SP', conta_azul_id: 'ca_supp_2', created_at: new Date().toISOString() }
];

let mockProducts: any[] = [
  { id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa Kraft para Bombom (P)', sku: 'KRAFT-BOM-P', description: 'Caixa em papel kraft para 6 bombons com berço', price: 2.50, stock_quantity: 1500, conta_azul_id: 'ca_prod_1', created_at: new Date().toISOString() },
  { id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Sacola Duplex Branca Premium (M)', sku: 'SAC-DUP-M', description: 'Sacola em papel duplex com alça de cordão', price: 4.80, stock_quantity: 800, conta_azul_id: 'ca_prod_2', created_at: new Date().toISOString() },
  { id: '800384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa Correio E-commerce (G)', sku: 'CX-CORR-G', description: 'Caixa de papelão onda B para envios postais', price: 3.90, stock_quantity: 2500, conta_azul_id: null, created_at: new Date().toISOString() }
];

let mockOrders: any[] = [
  { id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', order_number: 1001, pv_number: 'PV-1001', op_number: 'OP-5001', art_name: 'Sacola Choco Brasil Prata', seller_name: 'Mariana Souza', measure: '15x10x5 cm', print_run: 5000, boxes_count: 10, packaging_type: 'CAIXA', freight_value: 150.00, shipping_type: 'ENTREGA_PROPRIA', status: 'A produzir', production_sector: 'Impressão', physical_location: 'Máquina Flexo 1', notes: 'Cliente solicitou pressa. Logo centralizada na tampa.', internal_notes: 'Confirmado pagamento da primeira parcela por boleto.', order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 3, installments_paid: 1, first_payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 100, conta_azul_id: 'ca_order_1', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', order_number: 1002, pv_number: 'PV-1002', op_number: 'OP-5002', art_name: 'Sacola Florescer Rosa Luxo', seller_name: 'Camila Neves', measure: '25x30x10 cm', print_run: 2000, boxes_count: 4, packaging_type: 'PACOTE', freight_value: 80.00, shipping_type: 'TRANSPORTADORA', status: 'Em revisão', production_sector: 'Corte e Vinco', physical_location: 'Salão', notes: 'Acabamento com verniz localizado.', internal_notes: 'Aguardando aprovação do layout final de faca pelo cliente.', order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 1, installments_paid: 0, first_payment_date: null, over_short_quantity: 0, conta_azul_id: null, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', product_id: '800384c8-3e4b-4b14-87cf-45ef42d17c03', order_number: 1003, pv_number: 'PV-1003', op_number: null, art_name: 'Caixa Padrão Correios', seller_name: 'Mariana Souza', measure: '30x20x15 cm', print_run: 1000, boxes_count: 2, packaging_type: 'CAIXA', freight_value: 60.00, shipping_type: 'RETIRADA', status: 'Expedição', production_sector: 'Expedição', physical_location: 'Pátio', notes: 'Coleta pela transportadora Braspress.', internal_notes: 'Nota fiscal já gerada e anexada ao pacote.', order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 1, installments_paid: 1, first_payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: -10, conta_azul_id: 'ca_order_3', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', order_number: 1004, pv_number: 'PV-1004', op_number: 'OP-5004', art_name: 'Sacola Florescer Kraft M', seller_name: 'Camila Neves', measure: '20x20x8 cm', print_run: 3000, boxes_count: 6, packaging_type: 'CAIXA', freight_value: 120.00, shipping_type: 'ENTREGA_PROPRIA', status: 'Pago', production_sector: 'Concluído', physical_location: 'Salão', notes: 'Sem observações.', internal_notes: 'Entregue com sucesso no dia 15/06.', order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 2, installments_paid: 2, first_payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 50, conta_azul_id: 'ca_order_4', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00584c8-3e4b-4b14-87cf-45ef42d17c05', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', order_number: 1005, pv_number: 'PV-1005', op_number: 'OP-5005', art_name: 'Saco Café Gourmet Preto', seller_name: 'Mariana Souza', measure: '15x10x5 cm', print_run: 10000, boxes_count: 20, packaging_type: 'CAIXA', freight_value: 250.00, shipping_type: 'RETIRADA', status: 'Atrasado', production_sector: 'Colagem', physical_location: 'Máquina Coladeira 2', notes: 'Urgente! Atraso devido a problema na máquina coladeira.', internal_notes: 'Cliente cobrou posicionamento hoje cedo.', order_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 4, installments_paid: 2, first_payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 0, conta_azul_id: null, created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
];

let mockFinancial: any[] = [
  { id: 'f00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', type: 'RECEITA', amount: 12650.00, status: 'PENDENTE', description: 'Venda Chocolate Gourmet Brasil #1', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: null, created_at: new Date().toISOString() },
  { id: 'f00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', type: 'RECEITA', amount: 3960.00, status: 'CONCILIADO', description: 'Venda Boutique do Café #3', due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', type: 'RECEITA', amount: 14520.00, status: 'CONCILIADO', description: 'Venda Chocolate Gourmet Brasil #4', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: null, type: 'DESPESA', amount: 4500.00, status: 'CONCILIADO', description: 'Compra de Papel Kraft - Klabin', due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00584c8-3e4b-4b14-87cf-45ef42d17c05', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: null, type: 'DESPESA', amount: 1200.00, status: 'PENDENTE', description: 'Compra de Tintas Especiais - Dupont', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: null, created_at: new Date().toISOString() }
];

let mockLogs: any[] = [
  { id: '100184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', action: 'OAUTH_REFRESH', status: 'SUCCESS', payload: { client_id: 'mock_client' }, response: { message: 'Token refreshed in mock mode', expires_in: 3600 }, error_message: null, created_at: new Date().toISOString() }
];

let mockQueue: any[] = [
  { id: '900184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', entity_type: 'ORDER', entity_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', action: 'CREATE', retry_count: 0, max_retries: 5, status: 'PENDING', last_error: null, next_retry_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let mockContaAzulConfig: any = {
  id: 'c-azul-config-mock',
  tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  client_id: 'ca_client_id_placeholder',
  client_secret: 'ca_client_secret_placeholder',
  access_token: 'mock_access_token_xyz',
  refresh_token: 'mock_refresh_token_xyz',
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// --- DATA ACCESS LAYER HELPERS (Safe wrapper functions) ---

// Clientes
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
    mockCustomers.unshift(newCust);
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
    mockCustomers = mockCustomers.map(c => c.id === id ? { ...c, ...updates } : c);
    const updated = mockCustomers.find(c => c.id === id);
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

// Fornecedores
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
    mockSuppliers.unshift(newSupp);
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
    mockSuppliers = mockSuppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    const updated = mockSuppliers.find(s => s.id === id);
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

// Produtos & Estoque
export async function getProducts(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockProducts.filter(p => p.tenant_id === tenantId), error: null };
  const { data, error } = await getDbClient().from('products').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createProduct(product: any) {
  const newProd = {
    id: product.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: product.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    stock_quantity: product.stock_quantity || 0,
    created_at: new Date().toISOString(),
    ...product
  };
  if (isMockMode) {
    mockProducts.unshift(newProd);
    await enqueueSync(newProd.tenant_id, 'PRODUCT', newProd.id, 'CREATE');
    return { data: newProd, error: null };
  }
  const { data, error } = await getDbClient().from('products').insert([product]).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateProduct(id: string, updates: any) {
  if (isMockMode) {
    mockProducts = mockProducts.map(p => p.id === id ? { ...p, ...updates } : p);
    const updated = mockProducts.find(p => p.id === id);
    if (updated) {
      await enqueueSync(updated.tenant_id, 'PRODUCT', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient().from('products').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'PRODUCT', data.id, 'UPDATE');
  }
  return { data, error };
}

export async function adjustStock(productId: string, quantity: number, type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'PEDIDO', description: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    mockProducts = mockProducts.map(p => {
      if (p.id === productId) {
        const newQty = p.stock_quantity + quantity;
        return { ...p, stock_quantity: newQty < 0 ? 0 : newQty };
      }
      return p;
    });
    return { error: null };
  }
  const { data: prod } = await getDbClient().from('products').select('stock_quantity').eq('id', productId).single();
  if (prod) {
    const newQty = (prod.stock_quantity || 0) + quantity;
    await getDbClient().from('products').update({ stock_quantity: newQty < 0 ? 0 : newQty }).eq('id', productId);
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

// Pedidos (Orders)
export async function getOrders(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const ordersWithJoins = mockOrders.filter(o => o.tenant_id === tenantId).map(order => {
      const customer = mockCustomers.find(c => c.id === order.customer_id) || { name: 'Cliente Desconhecido' };
      const product = mockProducts.find(p => p.id === order.product_id) || { name: 'Produto Desconhecido', stock_quantity: 0 };
      const mockStages = [
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001', name: 'A produzir', color: '#94a3b8' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17002', name: 'Em produção', color: '#3b82f6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17003', name: 'Manuseio', color: '#a855f7' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004', name: 'Em revisão', color: '#eab308' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17005', name: 'Expedição', color: '#f97316' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17006', name: 'Concluído', color: '#10b981' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17007', name: 'Estoque', color: '#14b8a6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17008', name: 'Atrasado', color: '#ef4444' }
      ];
      const stage = mockStages.find(s => s.id === order.stage_id) || mockStages.find(s => s.name === order.status) || mockStages[0];
      return {
        ...order,
        customer,
        product,
        stage
      };
    });
    ordersWithJoins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: ordersWithJoins, error: null };
  }
  
  const { data, error } = await getDbClient()
    .from('orders')
    .select('*, customer:customers(*), product:products(*), stage:order_stages(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrder(order: any) {
  const newOrder = {
    id: order.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: order.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_number: mockOrders.length + 1001,
    created_at: new Date().toISOString(),
    ...order
  };
  
  if (isMockMode) {
    mockOrders.unshift(newOrder);
    await adjustStock(newOrder.product_id, -newOrder.boxes_count, 'PEDIDO', `Pedido #${newOrder.order_number} cadastrado`, newOrder.tenant_id);
    const product = mockProducts.find(p => p.id === newOrder.product_id);
    const amount = (product ? product.price * newOrder.print_run : 0) + newOrder.freight_value;
    const customer = mockCustomers.find(c => c.id === newOrder.customer_id);
    
    const newFin = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: newOrder.tenant_id,
      order_id: newOrder.id,
      type: 'RECEITA',
      amount,
      status: 'PENDENTE',
      description: `Venda ${customer ? customer.name : 'Cliente'} #${newOrder.order_number}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_date: null,
      created_at: new Date().toISOString()
    };
    mockFinancial.unshift(newFin);
    await enqueueSync(newOrder.tenant_id, 'ORDER', newOrder.id, 'CREATE');
    return { data: newOrder, error: null };
  }
  
  const { data, error } = await getDbClient().from('orders').insert([order]).select().single();
  if (!error && data) {
    await adjustStock(data.product_id, -data.boxes_count, 'PEDIDO', `Pedido #${data.order_number} cadastrado`, data.tenant_id);
    
    const { data: prod } = await getDbClient().from('products').select('price').eq('id', data.product_id).single();
    const { data: cust } = await getDbClient().from('customers').select('name').eq('id', data.customer_id).single();
    const amount = ((prod ? prod.price : 0) * data.print_run) + data.freight_value;
    
    await getDbClient().from('financial_transactions').insert([{
      tenant_id: data.tenant_id,
      order_id: data.id,
      type: 'RECEITA',
      amount,
      status: 'PENDENTE',
      description: `Venda ${cust ? cust.name : 'Cliente'} #${data.order_number}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]);
    
    await enqueueSync(data.tenant_id, 'ORDER', data.id, 'CREATE');
  }
  return { data, error };
}

export async function updateOrder(id: string, updates: any) {
  if (isMockMode) {
    mockOrders = mockOrders.map(o => o.id === id ? { ...o, ...updates } : o);
    const updated = mockOrders.find(o => o.id === id);
    if (updated) {
      if (updates.status === 'Pago') {
        mockFinancial = mockFinancial.map(f => f.order_id === id ? { ...f, status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] } : f);
      }
      await enqueueSync(updated.tenant_id, 'ORDER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  
  const { data, error } = await getDbClient().from('orders').update(updates).eq('id', id).select().single();
  if (!error && data) {
    if (updates.status === 'Pago') {
      await getDbClient()
        .from('financial_transactions')
        .update({ status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] })
        .eq('order_id', id);
    }
    await enqueueSync(data.tenant_id, 'ORDER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Etapas do Kanban
export async function getOrderStages(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const mockStages = [
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001', tenant_id: tenantId, name: 'A produzir', color: '#94a3b8', sequence: 1 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17002', tenant_id: tenantId, name: 'Em produção', color: '#3b82f6', sequence: 2 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17003', tenant_id: tenantId, name: 'Manuseio', color: '#a855f7', sequence: 3 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004', tenant_id: tenantId, name: 'Em revisão', color: '#eab308', sequence: 4 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17005', tenant_id: tenantId, name: 'Expedição', color: '#f97316', sequence: 5 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17006', tenant_id: tenantId, name: 'Concluído', color: '#10b981', sequence: 6 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17007', tenant_id: tenantId, name: 'Estoque', color: '#14b8a6', sequence: 7 },
      { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17008', tenant_id: tenantId, name: 'Atrasado', color: '#ef4444', sequence: 8 }
    ];
    return { data: mockStages, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sequence', { ascending: true });
  return { data, error };
}

export async function createOrderStage(stage: any) {
  if (isMockMode) {
    return { data: { id: Math.random().toString(), ...stage }, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .insert([stage])
    .select()
    .single();
  return { data, error };
}

export async function updateOrderStage(id: string, updates: any) {
  if (isMockMode) {
    return { data: { id, ...updates }, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteOrderStage(id: string) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_stages')
    .delete()
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// Permissões por Perfil
export async function getProfilesWithPermissions(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { 
      data: mockProfiles.filter(p => p.tenant_id === tenantId).map(p => ({
        ...p,
        profile_stage_permissions: []
      })), 
      error: null 
    };
  }
  const { data, error } = await getDbClient()
    .from('profiles')
    .select('*, profile_stage_permissions(stage_id, can_enter, can_exit)')
    .eq('tenant_id', tenantId)
    .order('full_name');
  return { data, error };
}

export async function saveProfileStagePermission(profileId: string, stageId: string, canEnter: boolean, canExit: boolean) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  
  if (!canEnter && !canExit) {
    const { error } = await getDbClient()
      .from('profile_stage_permissions')
      .delete()
      .eq('profile_id', profileId)
      .eq('stage_id', stageId);
    return { data: null, error };
  }

  const { data, error } = await getDbClient()
    .from('profile_stage_permissions')
    .upsert({
      profile_id: profileId,
      stage_id: stageId,
      can_enter: canEnter,
      can_exit: canExit
    })
    .select();
    
  return { data, error };
}

export async function updateProfileStagePermissions(profileId: string, stageIds: string[]) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  const { error: deleteError } = await getDbClient()
    .from('profile_stage_permissions')
    .delete()
    .eq('profile_id', profileId);
    
  if (deleteError) return { data: null, error: deleteError };
  
  if (stageIds.length === 0) return { data: [], error: null };
  
  const rows = stageIds.map(stageId => ({
    profile_id: profileId,
    stage_id: stageId,
    can_enter: true,
    can_exit: true
  }));
  
  const { data, error } = await getDbClient()
    .from('profile_stage_permissions')
    .insert(rows)
    .select();
    
  return { data, error };
}


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
    mockFinancial = mockFinancial.map(f => f.id === id ? { ...f, status: 'CONCILIADO', payment_date: paymentDate } : f);
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

// Logs de integracao
export async function getIntegrationLogs(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = [...mockLogs];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('conta_azul_integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

export async function createIntegrationLog(action: string, status: 'SUCCESS' | 'ERROR' | 'PENDING_RETRY', payload: any, response: any, errorMessage: string | null = null, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const log = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: tenantId,
    action,
    status,
    payload,
    response,
    error_message: errorMessage,
    created_at: new Date().toISOString()
  };
  if (isMockMode) {
    mockLogs.unshift(log);
    return { data: log, error: null };
  }
  const { data, error } = await getDbClient().from('conta_azul_integration_logs').insert([log]).select().single();
  return { data, error };
}

// Fila de sincronizacao (Sync Queue)
export async function getSyncQueue(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { data: mockQueue.filter(q => q.tenant_id === tenantId), error: null };
  }
  const { data, error } = await getDbClient()
    .from('sync_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function enqueueSync(tenantId: string, entityType: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'ORDER' | 'FINANCIAL', entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE') {
  const newSync = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    retry_count: 0,
    max_retries: 5,
    status: 'PENDING' as const,
    last_error: null,
    next_retry_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  if (isMockMode) {
    const exists = mockQueue.some(q => q.entity_id === entityId && q.entity_type === entityType && q.status === 'PENDING');
    if (!exists) {
      mockQueue.unshift(newSync);
    }
    return { data: newSync, error: null };
  }
  
  const { data: existing } = await getDbClient()
    .from('sync_queue')
    .select('id')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .eq('status', 'PENDING')
    .maybeSingle();
    
  if (existing) {
    return { data: existing, error: null };
  }
  
  const { data, error } = await getDbClient()
    .from('sync_queue')
    .insert([{
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      status: 'PENDING'
    }])
    .select()
    .single();
    
  return { data, error };
}

// Configurações da Conta Azul
export async function getContaAzulConfig(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockContaAzulConfig, error: null };

  if (typeof window === 'undefined') {
    try {
      if (!supabaseAdmin) {
        throw new Error('Cliente Supabase nao inicializado');
      }

      const { data: config, error } = await supabaseAdmin
        .from('conta_azul_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      return {
        data: {
          client_id: config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '',
          client_secret: config?.client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '',
          access_token: config?.access_token || null,
          refresh_token: config?.refresh_token || null,
          expires_at: config?.expires_at || null
        },
        error: null
      };
    } catch (err: any) {
      console.error('Erro ao buscar credenciais no servidor:', err);
      return {
        data: {
          client_id: process.env.CONTA_AZUL_CLIENT_ID || '',
          client_secret: process.env.CONTA_AZUL_CLIENT_SECRET || '',
          access_token: null,
          refresh_token: null,
          expires_at: null
        },
        error: null
      };
    }
  }

  try {
    const res = await fetch('/api/config/conta-azul');
    if (!res.ok) throw new Error('Falha ao buscar credenciais');
    const data = await res.json();
    return {
      data: {
        client_id: data.client_id,
        client_secret: data.has_secret ? '••••••••••••••••••••••••••••••••' : '',
        access_token: data.is_connected ? 'valid' : null,
        expires_at: data.expires_at
      },
      error: null
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateContaAzulConfig(updates: any, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    mockContaAzulConfig = { ...mockContaAzulConfig, ...updates, updated_at: new Date().toISOString() };
    return { data: mockContaAzulConfig, error: null };
  }

  if (typeof window === 'undefined') {
    try {
      if (!supabaseAdmin) throw new Error('Cliente Supabase nao inicializado');

      const { data: existing } = await supabaseAdmin
        .from('conta_azul_config')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const payload: any = { ...updates };
      payload.updated_at = new Date().toISOString();

      let error;
      if (existing) {
        const res = await supabaseAdmin
          .from('conta_azul_config')
          .update(payload)
          .eq('tenant_id', tenantId);
        error = res.error;
      } else {
        const res = await supabaseAdmin
          .from('conta_azul_config')
          .insert([{ tenant_id: tenantId, ...payload }]);
        error = res.error;
      }

      if (error) throw error;
      return { data: { success: true }, error: null };
    } catch (err: any) {
      console.error('Erro ao atualizar credenciais no servidor:', err);
      return { data: null, error: err };
    }
  }

  try {
    const res = await fetch('/api/config/conta-azul', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: updates.client_id,
        client_secret: updates.client_secret
      })
    });
    if (!res.ok) throw new Error('Falha ao salvar credenciais');
    return { data: { success: true }, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// --- ITENS DE PEDIDO (ORDER ITEMS) ---

export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  product_id: string | null;
  item_type: 'PRODUTO' | 'SERVICO';
  name: string;
  item_index: number;
  friendly_id: string;
  measure: string | null;
  print_run: number;
  boxes_count: number;
  packaging_type: 'CAIXA' | 'PACOTE';
  over_short_quantity: number;
  status: string;
  production_sector: string;
  stage_id: string | null;
  machine_id: string | null;
  handling_team_id: string | null;
  physical_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  product?: any;
  stage?: any;
}

let mockOrderItems: any[] = [
  {
    id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    item_type: 'PRODUTO',
    name: 'Caixa Kraft para Bombom (P)',
    item_index: 1,
    friendly_id: 'PV-1001/1',
    measure: '15x10x5 cm',
    print_run: 5000,
    boxes_count: 10,
    packaging_type: 'CAIXA',
    over_short_quantity: 100,
    status: 'A produzir',
    production_sector: 'Impressão',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001',
    physical_location: 'Máquina Flexo 1',
    notes: 'Logo centralizada na tampa.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: null,
    item_type: 'SERVICO',
    name: 'Cartão de Fundo Personalizado',
    item_index: 2,
    friendly_id: 'PV-1001/2',
    measure: '14x9 cm',
    print_run: 5000,
    boxes_count: 0,
    packaging_type: 'PACOTE',
    over_short_quantity: 0,
    status: 'A produzir',
    production_sector: 'Impressão',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001',
    physical_location: 'Máquina Flexo 1',
    notes: 'Papel duplex 250g.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02',
    product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02',
    item_type: 'PRODUTO',
    name: 'Sacola Duplex Branca Premium (M)',
    item_index: 1,
    friendly_id: 'PV-1002/1',
    measure: '25x30x10 cm',
    print_run: 2000,
    boxes_count: 4,
    packaging_type: 'PACOTE',
    over_short_quantity: 0,
    status: 'Em revisão',
    production_sector: 'Corte e Vinco',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004',
    physical_location: 'Salão',
    notes: 'Aguardando aprovação de layout.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i04',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02',
    product_id: null,
    item_type: 'SERVICO',
    name: 'Serviço de Verniz Localizado',
    item_index: 2,
    friendly_id: 'PV-1002/2',
    measure: null,
    print_run: 2000,
    boxes_count: 0,
    packaging_type: 'PACOTE',
    over_short_quantity: 0,
    status: 'Em revisão',
    production_sector: 'Corte e Vinco',
    stage_id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004',
    physical_location: 'Salão',
    notes: 'Aplicar verniz apenas na logo.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function getOrderItems(orderId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let items = mockOrderItems.filter(item => item.tenant_id === tenantId);
    if (orderId) {
      items = items.filter(item => item.order_id === orderId);
    }
    const itemsWithJoins = items.map(item => {
      const product = mockProducts.find(p => p.id === item.product_id) || null;
      const order = mockOrders.find(o => o.id === item.order_id) || null;
      let customer = null;
      if (order) {
        customer = mockCustomers.find(c => c.id === order.customer_id) || null;
      }
      const mockStages = [
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17001', name: 'A produzir', color: '#94a3b8' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17002', name: 'Em produção', color: '#3b82f6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17003', name: 'Manuseio', color: '#a855f7' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17004', name: 'Em revisão', color: '#eab308' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17005', name: 'Expedição', color: '#f97316' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17006', name: 'Concluído', color: '#10b981' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17007', name: 'Estoque', color: '#14b8a6' },
        { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17008', name: 'Atrasado', color: '#ef4444' }
      ];
      const stage = mockStages.find(s => s.id === item.stage_id) || null;
      return {
        ...item,
        product,
        stage,
        order: order ? { ...order, customer } : null
      };
    });
    return { data: itemsWithJoins, error: null };
  }

  let query = getDbClient()
    .from('order_items')
    .select('*, product:products(*), stage:order_stages(*), machine:production_machines(*), handling_team:handling_teams(*), order:orders(*, customer:customers(*))')
    .eq('tenant_id', tenantId);

  if (orderId) {
    query = query.eq('order_id', orderId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrderItem(item: Omit<OrderItem, 'id' | 'item_index' | 'friendly_id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  if (isMockMode) {
    const orderItemsForParent = mockOrderItems.filter(i => i.order_id === item.order_id);
    const nextIdx = orderItemsForParent.reduce((max, curr) => Math.max(max, curr.item_index), 0) + 1;
    
    const parentOrder = mockOrders.find(o => o.id === item.order_id);
    const pvRef = parentOrder ? (parentOrder.pv_number || `PV-${parentOrder.order_number}`) : 'PV-MOCK';
    
    const newItem: OrderItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: tenantId,
      order_id: item.order_id,
      product_id: item.product_id,
      item_type: item.item_type,
      name: item.name,
      item_index: nextIdx,
      friendly_id: `${pvRef}/${nextIdx}`,
      measure: item.measure,
      print_run: item.print_run,
      boxes_count: item.boxes_count,
      packaging_type: item.packaging_type,
      over_short_quantity: item.over_short_quantity,
      status: item.status || 'A produzir',
      production_sector: item.production_sector || 'Impressão',
      stage_id: item.stage_id,
      machine_id: (item as any).machine_id || null,
      handling_team_id: (item as any).handling_team_id || null,
      physical_location: item.physical_location,
      notes: item.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockOrderItems.push(newItem);
    return { data: newItem, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_items')
    .insert([{ ...item, tenant_id: item.tenant_id || tenantId }])
    .select('*, product:products(*), stage:order_stages(*)')
    .single();

  return { data, error };
}

export async function updateOrderItem(id: string, updates: Partial<OrderItem>) {
  if (isMockMode) {
    mockOrderItems = mockOrderItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    });
    
    const updated = mockOrderItems.find(item => item.id === id);
    return { data: updated, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, product:products(*), stage:order_stages(*), machine:production_machines(*), handling_team:handling_teams(*)')
    .single();

  return { data, error };
}

export async function deleteOrderItem(id: string) {
  if (isMockMode) {
    const exists = mockOrderItems.some(item => item.id === id);
    if (!exists) return { data: null, error: { message: 'Item não encontrado.' } as any };
    mockOrderItems = mockOrderItems.filter(item => item.id !== id);
    return { data: null, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_items')
    .delete()
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// --- ESTOQUE PERSONALIZADO, SOBRAS/FALTAS E CRÉDITOS ---

export interface CustomerProductStock {
  id: string;
  tenant_id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  customer?: any;
  product?: any;
}

export interface OrderBalanceAdjustment {
  id: string;
  tenant_id: string;
  order_id: string;
  order_item_id: string | null;
  customer_id: string;
  product_id: string;
  ordered_quantity: number;
  produced_quantity: number;
  difference_quantity: number;
  adjustment_type: 'SOBRA' | 'FALTA';
  action_taken: 'GUARDAR_ESTOQUE_CLIENTE' | 'CREDITO_PROXIMO_PEDIDO' | 'CANCELADO_DESCONTO' | 'COBRADO_ADICIONAL' | 'REPRODUCAO_PENDENTE' | 'OUTRO';
  notes: string | null;
  created_at: string;
  order?: any;
  order_item?: any;
  customer?: any;
  product?: any;
}

export interface CustomerStockCredit {
  id: string;
  tenant_id: string;
  customer_id: string;
  product_id: string;
  credit_type: 'CORTESIA_SOBRA' | 'PENDENCIA_ENTREGA';
  original_quantity: number;
  remaining_quantity: number;
  source_order_id: string | null;
  source_adjustment_id: string | null;
  status: 'ATIVO' | 'UTILIZADO' | 'EXPIRADO' | 'CANCELADO';
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: any;
  product?: any;
  source_order?: any;
}

let mockCustomerProductStock: CustomerProductStock[] = [
  {
    id: 's00184c8-3e4b-4b14-87cf-45ef42d17s01',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    quantity: 150,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let mockOrderBalanceAdjustments: OrderBalanceAdjustment[] = [
  {
    id: 'adj-1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    ordered_quantity: 5000,
    produced_quantity: 7000,
    difference_quantity: 2000,
    adjustment_type: 'SOBRA',
    action_taken: 'GUARDAR_ESTOQUE_CLIENTE',
    notes: '2.000 sacos produzidos a mais. Guardados no estoque físico para o cliente Gourmet Brasil.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'adj-2',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    customer_id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02',
    product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02',
    ordered_quantity: 2000,
    produced_quantity: 1850,
    difference_quantity: -150,
    adjustment_type: 'FALTA',
    action_taken: 'CREDITO_PROXIMO_PEDIDO',
    notes: 'Falta de 150 unidades. Convertido em crédito para a Quinta do Marquês usar na próxima compra.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'adj-3',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03',
    product_id: '800384c8-3e4b-4b14-87cf-45ef42d17c03',
    ordered_quantity: 1000,
    produced_quantity: 1100,
    difference_quantity: 100,
    adjustment_type: 'SOBRA',
    action_taken: 'COBRADO_ADICIONAL',
    notes: 'Excedente de 100 unidades cobrado como adicional na fatura.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];
let mockCustomerStockCredits: CustomerStockCredit[] = [
  {
    id: 'cr0184c8-3e4b-4b14-87cf-45ef42d17cr1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01',
    product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01',
    credit_type: 'CORTESIA_SOBRA',
    original_quantity: 150,
    remaining_quantity: 150,
    source_order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    source_adjustment_id: null,
    status: 'ATIVO',
    notes: 'Sobra gerada no PV-1001 e mantida na fábrica para a padaria/empresa Gourmet.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// --- OPERAÇÕES: ESTOQUE PERSONALIZADO POR CLIENTE ---

export async function getCustomerProductStock(customerId?: string, productId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let filtered = mockCustomerProductStock.filter(s => s.tenant_id === tenantId);
    if (customerId) filtered = filtered.filter(s => s.customer_id === customerId);
    if (productId) filtered = filtered.filter(s => s.product_id === productId);
    
    const withJoins = filtered.map(s => ({
      ...s,
      customer: mockCustomers.find(c => c.id === s.customer_id) || null,
      product: mockProducts.find(p => p.id === s.product_id) || null
    }));
    return { data: withJoins, error: null };
  }

  let query = getDbClient()
    .from('customer_product_stock')
    .select('*, customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId);

  if (customerId) query = query.eq('customer_id', customerId);
  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query;
  return { data, error };
}

export async function createCustomerProductStock(stock: Omit<CustomerProductStock, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = stock.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    const existingIdx = mockCustomerProductStock.findIndex(s => s.customer_id === stock.customer_id && s.product_id === stock.product_id);
    if (existingIdx !== -1) {
      mockCustomerProductStock[existingIdx].quantity += stock.quantity;
      mockCustomerProductStock[existingIdx].updated_at = new Date().toISOString();
      return { data: mockCustomerProductStock[existingIdx], error: null };
    }
    const newStock: CustomerProductStock = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: tenantId,
      customer_id: stock.customer_id,
      product_id: stock.product_id,
      quantity: stock.quantity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockCustomerProductStock.push(newStock);
    return { data: newStock, error: null };
  }

  const { data, error } = await getDbClient()
    .from('customer_product_stock')
    .upsert({ ...stock, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: 'customer_id, product_id' })
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

export async function updateCustomerProductStock(id: string, updates: Partial<CustomerProductStock>) {
  if (isMockMode) {
    mockCustomerProductStock = mockCustomerProductStock.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s);
    const updated = mockCustomerProductStock.find(s => s.id === id);
    return { data: updated, error: null };
  }

  const { data, error } = await getDbClient()
    .from('customer_product_stock')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

// --- OPERAÇÕES: AJUSTES DE SALDO (SOBRAS E FALTAS) ---

export async function getOrderBalanceAdjustments(orderId?: string, customerId?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let filtered = mockOrderBalanceAdjustments.filter(a => a.tenant_id === tenantId);
    if (orderId) filtered = filtered.filter(a => a.order_id === orderId);
    if (customerId) filtered = filtered.filter(a => a.customer_id === customerId);
    const withJoins = filtered.map(a => ({
      ...a,
      order: mockOrders.find(o => o.id === a.order_id) || null,
      customer: mockCustomers.find(c => c.id === a.customer_id) || null,
      product: mockProducts.find(p => p.id === a.product_id) || null
    }));
    return { data: withJoins, error: null };
  }

  let query = getDbClient()
    .from('order_balance_adjustments')
    .select('*, order:orders(*), order_item:order_items(*), customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId);

  if (orderId) query = query.eq('order_id', orderId);
  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrderBalanceAdjustment(adjustment: Omit<OrderBalanceAdjustment, 'id' | 'created_at'>) {
  const tenantId = adjustment.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  if (isMockMode) {
    const newAdj: OrderBalanceAdjustment = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...adjustment,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    };
    mockOrderBalanceAdjustments.push(newAdj);

    if (adjustment.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' && adjustment.difference_quantity > 0) {
      await createCustomerProductStock({
        tenant_id: tenantId,
        customer_id: adjustment.customer_id,
        product_id: adjustment.product_id,
        quantity: adjustment.difference_quantity
      });
      const customerName = mockCustomers.find(c => c.id === adjustment.customer_id)?.name || 'Cliente';
      const orderNum = mockOrders.find(o => o.id === adjustment.order_id)?.order_number || 'PV';
      await adjustStock(
        adjustment.product_id,
        adjustment.difference_quantity,
        'ENTRADA',
        `[ESTOQUE_CLIENTE] Entrada de Sobra - Cliente: ${customerName} - PV: ${orderNum}`,
        tenantId
      );
    }

    if (adjustment.action_taken === 'CREDITO_PROXIMO_PEDIDO' || adjustment.action_taken === 'REPRODUCAO_PENDENTE') {
      const type = adjustment.difference_quantity > 0 ? 'CORTESIA_SOBRA' : 'PENDENCIA_ENTREGA';
      const qty = Math.abs(adjustment.difference_quantity);
      await createCustomerStockCredit({
        tenant_id: tenantId,
        customer_id: adjustment.customer_id,
        product_id: adjustment.product_id,
        credit_type: type,
        original_quantity: qty,
        remaining_quantity: qty,
        source_order_id: adjustment.order_id,
        source_adjustment_id: newAdj.id,
        status: 'ATIVO',
        notes: adjustment.notes
      });
    }

    return { data: newAdj, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_balance_adjustments')
    .insert([{ ...adjustment, tenant_id: tenantId }])
    .select('*, order:orders(*), customer:customers(*), product:products(*)')
    .single();

  if (!error && data) {
    if (data.action_taken === 'GUARDAR_ESTOQUE_CLIENTE' && data.difference_quantity > 0) {
      await createCustomerProductStock({
        tenant_id: tenantId,
        customer_id: data.customer_id,
        product_id: data.product_id,
        quantity: data.difference_quantity
      });
      
      const { data: cust } = await getDbClient().from('customers').select('name').eq('id', data.customer_id).single();
      const { data: ord } = await getDbClient().from('orders').select('order_number').eq('id', data.order_id).single();
      await adjustStock(
        data.product_id,
        data.difference_quantity,
        'ENTRADA',
        `[ESTOQUE_CLIENTE] Entrada de Sobra - Cliente: ${cust ? cust.name : 'Cliente'} - PV: ${ord ? ord.order_number : 'PV'}`,
        tenantId
      );
    }

    if (data.action_taken === 'CREDITO_PROXIMO_PEDIDO' || data.action_taken === 'REPRODUCAO_PENDENTE') {
      const type = data.difference_quantity > 0 ? 'CORTESIA_SOBRA' : 'PENDENCIA_ENTREGA';
      const qty = Math.abs(data.difference_quantity);
      await createCustomerStockCredit({
        tenant_id: tenantId,
        customer_id: data.customer_id,
        product_id: data.product_id,
        credit_type: type,
        original_quantity: qty,
        remaining_quantity: qty,
        source_order_id: data.order_id,
        source_adjustment_id: data.id,
        status: 'ATIVO',
        notes: data.notes
      });
    }
  }

  return { data, error };
}

// --- OPERAÇÕES: CRÉDITOS E PENDÊNCIAS DE ESTOQUE ---

export async function getCustomerStockCredits(customerId?: string, status?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let filtered = mockCustomerStockCredits.filter(c => c.tenant_id === tenantId);
    if (customerId) filtered = filtered.filter(c => c.customer_id === customerId);
    if (status) filtered = filtered.filter(c => c.status === status);
    const withJoins = filtered.map(c => ({
      ...c,
      customer: mockCustomers.find(cust => cust.id === c.customer_id) || null,
      product: mockProducts.find(p => p.id === c.product_id) || null,
      source_order: mockOrders.find(o => o.id === c.source_order_id) || null
    }));
    return { data: withJoins, error: null };
  }

  let query = getDbClient()
    .from('customer_stock_credits')
    .select('*, customer:customers(*), product:products(*), source_order:orders(*)')
    .eq('tenant_id', tenantId);

  if (customerId) query = query.eq('customer_id', customerId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createCustomerStockCredit(credit: Omit<CustomerStockCredit, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = credit.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  if (isMockMode) {
    const newCredit: CustomerStockCredit = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...credit,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockCustomerStockCredits.push(newCredit);
    return { data: newCredit, error: null };
  }

  const { data, error } = await getDbClient()
    .from('customer_stock_credits')
    .insert([{ ...credit, tenant_id: tenantId }])
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

export async function updateCustomerStockCredit(id: string, updates: Partial<CustomerStockCredit>) {
  if (isMockMode) {
    mockCustomerStockCredits = mockCustomerStockCredits.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    const updated = mockCustomerStockCredits.find(c => c.id === id);
    return { data: updated, error: null };
  }

  const { data, error } = await getDbClient()
    .from('customer_stock_credits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, customer:customers(*), product:products(*)')
    .single();

  return { data, error };
}

// --- INCIDENTES DE PEDIDOS (ORDER INCIDENTS) ---

export interface OrderIncident {
  id: string;
  tenant_id: string;
  order_id: string;
  order_item_id: string | null;
  category: 'PRODUCAO' | 'TRANSPORTE' | 'FINANCEIRO' | 'CLIENTE' | 'MANUSEIO' | 'OUTRO';
  description: string;
  status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO';
  created_by: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  updated_at: string;
  order?: any;
  order_item?: any;
  creator?: any;
  resolver?: any;
}

let mockOrderIncidents: OrderIncident[] = [
  {
    id: 'in0184c8-3e4b-4b14-87cf-45ef42d17in1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    category: 'FINANCEIRO',
    description: 'Produção iniciada antes da confirmação do sinal financeiro pelo setor financeiro.',
    status: 'RESOLVIDO',
    created_by: 'e00284c8-3e4b-4b14-87cf-45ef42d17c02',
    resolved_by: 'e00184c8-3e4b-4b14-87cf-45ef42d17c01',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'in0184c8-3e4b-4b14-87cf-45ef42d17in2',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_id: 'a00584c8-3e4b-4b14-87cf-45ef42d17c05',
    order_item_id: null,
    category: 'TRANSPORTE',
    description: 'Pedido enviado para cidade de destino errada (coletor leu etiqueta incorreta na triagem).',
    status: 'ABERTO',
    created_by: 'e00384c8-3e4b-4b14-87cf-45ef42d17c03',
    resolved_by: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function getOrderIncidents(orderId?: string, category?: string, status?: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    let filtered = mockOrderIncidents.filter(inc => inc.tenant_id === tenantId);
    if (orderId) filtered = filtered.filter(inc => inc.order_id === orderId);
    if (category) filtered = filtered.filter(inc => inc.category === category);
    if (status) filtered = filtered.filter(inc => inc.status === status);
    
    const withJoins = filtered.map(inc => ({
      ...inc,
      order: mockOrders.find(o => o.id === inc.order_id) || null,
      order_item: mockOrderItems.find(item => item.id === inc.order_item_id) || null,
      creator: mockProfiles.find(p => p.id === inc.created_by) || null,
      resolver: mockProfiles.find(p => p.id === inc.resolved_by) || null
    }));
    return { data: withJoins, error: null };
  }

  let query = getDbClient()
    .from('order_incidents')
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*), resolver:profiles!resolved_by(*)')
    .eq('tenant_id', tenantId);

  if (orderId) query = query.eq('order_id', orderId);
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrderIncident(incident: Omit<OrderIncident, 'id' | 'created_at' | 'resolved_at' | 'updated_at'>) {
  const tenantId = incident.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  if (isMockMode) {
    const newInc: OrderIncident = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...incident,
      tenant_id: tenantId,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockOrderIncidents.push(newInc);
    return { data: newInc, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .insert([{ ...incident, tenant_id: tenantId }])
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*)')
    .single();

  return { data, error };
}

export async function resolveOrderIncident(id: string, resolvedBy: string, status: 'RESOLVIDO' = 'RESOLVIDO') {
  if (isMockMode) {
    mockOrderIncidents = mockOrderIncidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      return inc;
    });
    const updated = mockOrderIncidents.find(inc => inc.id === id);
    return { data: updated, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .update({
      status,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*), resolver:profiles!resolved_by(*)')
    .single();

  return { data, error };
}

export async function updateOrderIncident(id: string, updates: Partial<OrderIncident>) {
  if (isMockMode) {
    mockOrderIncidents = mockOrderIncidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return inc;
    });
    const updated = mockOrderIncidents.find(inc => inc.id === id);
    return { data: updated, error: null };
  }

  const { data, error } = await getDbClient()
    .from('order_incidents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, order:orders(*), order_item:order_items(*), creator:profiles!created_by(*), resolver:profiles!resolved_by(*)')
    .single();

  return { data, error };
}

// --- OPERAÇÕES: MÁQUINAS E HISTÓRICO DE PRODUÇÃO POR SETOR ---

export interface ProductionMachine {
  id: string;
  tenant_id: string;
  name: string;
  sector: string;
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO';
  created_at: string;
  updated_at: string;
}

export interface OrderItemSectorHistory {
  id: string;
  tenant_id: string;
  order_item_id: string;
  sector: string;
  machine_id: string | null;
  entered_at: string;
  exited_at: string | null;
  created_at: string;
  machine?: any;
}

let mockProductionMachines: ProductionMachine[] = [
  { id: 'mach-1', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Impressora Offset Heidel', sector: 'Impressão', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mach-2', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Corte e Vinco Bobst', sector: 'Corte e Vinco', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'mach-3', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Guilhotina Rotalina A', sector: 'Corte e Vinco', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let mockOrderItemSectorHistory: OrderItemSectorHistory[] = [
  {
    id: 'h-1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Impressão',
    machine_id: 'mach-1',
    entered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-2',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Corte e Vinco',
    machine_id: 'mach-2',
    entered_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-3',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Manuseio',
    machine_id: null,
    entered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-4',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i01',
    sector: 'Expedição',
    machine_id: null,
    entered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: null,
    created_at: new Date().toISOString()
  },
  // Outro item do PV 1
  {
    id: 'h-5',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    sector: 'Impressão',
    machine_id: 'mach-1',
    entered_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-6',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    sector: 'Corte e Vinco',
    machine_id: 'mach-3',
    entered_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-7',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00184c8-3e4b-4b14-87cf-45ef42d17i02',
    sector: 'Colagem',
    machine_id: null,
    entered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: null,
    created_at: new Date().toISOString()
  },
  // Item 3 (PV-1002/1)
  {
    id: 'h-8',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    sector: 'Impressão',
    machine_id: 'mach-1',
    entered_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-9',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    sector: 'Atrasado',
    machine_id: null,
    entered_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'h-10',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_item_id: 'i00284c8-3e4b-4b14-87cf-45ef42d17i03',
    sector: 'Colagem',
    machine_id: null,
    entered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    exited_at: null,
    created_at: new Date().toISOString()
  }
];

export async function getProductionMachines(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockProductionMachines.filter(m => m.tenant_id === tenantId);
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('production_machines')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createProductionMachine(machine: Omit<ProductionMachine, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = machine.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    const newMac: ProductionMachine = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...machine,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockProductionMachines.push(newMac);
    return { data: newMac, error: null };
  }
  const { data, error } = await getDbClient()
    .from('production_machines')
    .insert([{ ...machine, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateProductionMachine(id: string, updates: Partial<ProductionMachine>) {
  if (isMockMode) {
    mockProductionMachines = mockProductionMachines.map(m => m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m);
    const updated = mockProductionMachines.find(m => m.id === id);
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient()
    .from('production_machines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteProductionMachine(id: string) {
  if (isMockMode) {
    mockProductionMachines = mockProductionMachines.filter(m => m.id !== id);
    return { data: true, error: null };
  }
  const { error } = await getDbClient()
    .from('production_machines')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

export async function getOrderItemSectorHistory(orderItemId: string, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockOrderItemSectorHistory
      .filter(h => h.order_item_id === orderItemId && h.tenant_id === tenantId)
      .map(h => ({
        ...h,
        machine: mockProductionMachines.find(m => m.id === h.machine_id) || null
      }));
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_item_sector_history')
    .select('*, machine:production_machines(*)')
    .eq('order_item_id', orderItemId)
    .eq('tenant_id', tenantId)
    .order('entered_at', { ascending: true });
  return { data, error };
}

export async function logSectorTransition(
  orderItemId: string,
  sector: string,
  machineId: string | null,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
) {
  if (isMockMode) {
    // 1. Fechar transição aberta anterior
    mockOrderItemSectorHistory = mockOrderItemSectorHistory.map(h => {
      if (h.order_item_id === orderItemId && h.exited_at === null) {
        return { ...h, exited_at: new Date().toISOString() };
      }
      return h;
    });

    // 2. Inserir nova transição
    const newLog: OrderItemSectorHistory = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      tenant_id: tenantId,
      order_item_id: orderItemId,
      sector,
      machine_id: machineId,
      entered_at: new Date().toISOString(),
      exited_at: null,
      created_at: new Date().toISOString()
    };
    mockOrderItemSectorHistory.push(newLog);
    return { data: newLog, error: null };
  }

  const db = getDbClient();
  
  // 1. Fechar transição aberta anterior
  await db
    .from('order_item_sector_history')
    .update({ exited_at: new Date().toISOString() })
    .eq('order_item_id', orderItemId)
    .is('exited_at', null);

  // 2. Inserir nova transição
  const { data, error } = await db
    .from('order_item_sector_history')
    .insert([{
      tenant_id: tenantId,
      order_item_id: orderItemId,
      sector,
      machine_id: machineId,
      entered_at: new Date().toISOString()
    }])
    .select()
    .single();

  return { data, error };
}

// --- OPERAÇÕES: EQUIPES DE MANUSEIO ---

export interface HandlingTeam {
  id: string;
  tenant_id: string;
  name: string;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

let mockHandlingTeams: HandlingTeam[] = [
  { id: 'team-1', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Equipe João', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'team-2', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Equipe Zé', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'team-3', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Equipe Maria', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

export async function getHandlingTeams(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = mockHandlingTeams.filter(t => t.tenant_id === tenantId);
    return { data: list, error: null };
  }
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });
  return { data, error };
}

export async function createHandlingTeam(team: Omit<HandlingTeam, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = team.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    const newTeam: HandlingTeam = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...team,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockHandlingTeams.push(newTeam);
    return { data: newTeam, error: null };
  }
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .insert([{ ...team, tenant_id: tenantId }])
    .select()
    .single();
  return { data, error };
}

export async function updateHandlingTeam(id: string, updates: Partial<HandlingTeam>) {
  if (isMockMode) {
    mockHandlingTeams = mockHandlingTeams.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
    const updated = mockHandlingTeams.find(t => t.id === id);
    return { data: updated, error: null };
  }
  const { data, error } = await getDbClient()
    .from('handling_teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteHandlingTeam(id: string) {
  if (isMockMode) {
    mockHandlingTeams = mockHandlingTeams.filter(t => t.id !== id);
    return { data: true, error: null };
  }
  const { error } = await getDbClient()
    .from('handling_teams')
    .delete()
    .eq('id', id);
  return { data: !error, error };
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: TIPOS DE MATERIAL DE EMBALAGEM
// ─────────────────────────────────────────────────────────────────

export interface PackagingMaterialType {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  category: 'CAIXA' | 'FUNDO' | 'DIVISORIA' | 'SACO' | 'OUTRO';
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  updated_at: string;
}

function shouldFallbackToMock(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    String(error.message).includes('schema cache') ||
    String(error.message).includes('does not exist')
  );
}

let mockPackagingMaterialTypes: PackagingMaterialType[] = [
  { id: 'pmt-1', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa de Papelão Corrugado', code: 'CX-001', category: 'CAIXA', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pmt-2', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Fundo Reforçado Kraft', code: 'FD-001', category: 'FUNDO', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pmt-3', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Divisória Interna', code: 'DV-001', category: 'DIVISORIA', status: 'ATIVO', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getPackagingMaterialTypes(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { data: mockPackagingMaterialTypes.filter(t => t.tenant_id === tenantId), error: null };
  }
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error && shouldFallbackToMock(error)) {
    return { data: mockPackagingMaterialTypes.filter(t => t.tenant_id === tenantId), error: null };
  }
  return { data, error };
}

export async function createPackagingMaterialType(item: Omit<PackagingMaterialType, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    const newItem: PackagingMaterialType = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      ...item,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockPackagingMaterialTypes.push(newItem);
    return { data: newItem, error: null };
  }
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .insert([{ ...item, tenant_id: tenantId }])
    .select()
    .single();

  if (error && shouldFallbackToMock(error)) {
    const newItem: PackagingMaterialType = {
      id: Math.random().toString(36).substring(2),
      ...item,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockPackagingMaterialTypes.push(newItem);
    return { data: newItem, error: null };
  }
  return { data, error };
}

export async function updatePackagingMaterialType(id: string, updates: Partial<PackagingMaterialType>) {
  if (isMockMode) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.map(t =>
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    );
    return { data: mockPackagingMaterialTypes.find(t => t.id === id), error: null };
  }
  const { data, error } = await getDbClient()
    .from('packaging_material_types')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error && shouldFallbackToMock(error)) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.map(t =>
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    );
    return { data: mockPackagingMaterialTypes.find(t => t.id === id), error: null };
  }
  return { data, error };
}

export async function deletePackagingMaterialType(id: string) {
  if (isMockMode) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.filter(t => t.id !== id);
    return { data: true, error: null };
  }
  const { error } = await getDbClient().from('packaging_material_types').delete().eq('id', id);
  if (error && shouldFallbackToMock(error)) {
    mockPackagingMaterialTypes = mockPackagingMaterialTypes.filter(t => t.id !== id);
    return { data: true, error: null };
  }
  return { data: !error, error };
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: VOLUMES DE EMBALAGEM POR ITEM DE PEDIDO
// ─────────────────────────────────────────────────────────────────

export interface OrderItemPackaging {
  id: string;
  tenant_id: string;
  order_item_id: string;
  volume_index: number;
  units_per_box: number;
  box_count: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  packaging_material_type_id: string | null;
  associated_order_item_id: string | null;
  notes: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  material_type?: PackagingMaterialType | null;
}

let mockOrderItemPackaging: OrderItemPackaging[] = [];

export async function getOrderItemPackaging(orderItemId: string) {
  if (isMockMode) {
    const records = mockOrderItemPackaging.filter(p => p.order_item_id === orderItemId);
    // Join mock material type
    records.forEach(r => {
      r.material_type = mockPackagingMaterialTypes.find(t => t.id === r.packaging_material_type_id) || null;
    });
    return { data: records, error: null };
  }
  const { data, error } = await getDbClient()
    .from('order_item_packaging')
    .select('*, material_type:packaging_material_types(*)')
    .eq('order_item_id', orderItemId)
    .order('volume_index', { ascending: true });

  if (error && shouldFallbackToMock(error)) {
    const records = mockOrderItemPackaging.filter(p => p.order_item_id === orderItemId);
    records.forEach(r => {
      r.material_type = mockPackagingMaterialTypes.find(t => t.id === r.packaging_material_type_id) || null;
    });
    return { data: records, error: null };
  }
  return { data, error };
}

export async function saveOrderItemPackagingVolumes(
  orderItemId: string,
  tenantId: string,
  volumes: Omit<OrderItemPackaging, 'id' | 'created_at' | 'updated_at' | 'material_type'>[],
  registeredBy?: string
) {
  if (isMockMode) {
    // Remove existing records for this item
    mockOrderItemPackaging = mockOrderItemPackaging.filter(p => p.order_item_id !== orderItemId);
    const now = new Date().toISOString();
    const newRecords: OrderItemPackaging[] = volumes.map((v, i) => ({
      ...v,
      id: Math.random().toString(36).substring(2),
      order_item_id: orderItemId,
      tenant_id: tenantId,
      volume_index: i + 1,
      registered_by: registeredBy || null,
      created_at: now,
      updated_at: now
    }));
    mockOrderItemPackaging.push(...newRecords);
    return { data: newRecords, error: null };
  }

  const db = getDbClient();
  try {
    // Delete existing and re-insert
    await db.from('order_item_packaging').delete().eq('order_item_id', orderItemId);
    const now = new Date().toISOString();
    const records = volumes.map((v, i) => ({
      ...v,
      order_item_id: orderItemId,
      tenant_id: tenantId,
      volume_index: i + 1,
      registered_by: registeredBy || null,
      updated_at: now
    }));

    if (records.length === 0) return { data: [], error: null };

    const { data, error } = await db
      .from('order_item_packaging')
      .insert(records)
      .select();

    if (error && shouldFallbackToMock(error)) {
      throw error; // Let try-catch block handle fallback
    }
    return { data, error };
  } catch (err: any) {
    if (shouldFallbackToMock(err)) {
      mockOrderItemPackaging = mockOrderItemPackaging.filter(p => p.order_item_id !== orderItemId);
      const now = new Date().toISOString();
      const newRecords: OrderItemPackaging[] = volumes.map((v, i) => ({
        ...v,
        id: Math.random().toString(36).substring(2),
        order_item_id: orderItemId,
        tenant_id: tenantId,
        volume_index: i + 1,
        registered_by: registeredBy || null,
        created_at: now,
        updated_at: now
      }));
      mockOrderItemPackaging.push(...newRecords);
      return { data: newRecords, error: null };
    }
    throw err;
  }
}

export async function hasPackagingData(orderItemId: string): Promise<boolean> {
  if (isMockMode) {
    return mockOrderItemPackaging.some(p => p.order_item_id === orderItemId);
  }
  const { count, error } = await getDbClient()
    .from('order_item_packaging')
    .select('id', { count: 'exact', head: true })
    .eq('order_item_id', orderItemId);

  if (error && shouldFallbackToMock(error)) {
    return mockOrderItemPackaging.some(p => p.order_item_id === orderItemId);
  }
  return (count || 0) > 0;
}

// ─────────────────────────────────────────────────────────────────
// OPERAÇÕES: CONFIGURAÇÕES DE EMBALAGEM (CONVENÇÕES)
// ─────────────────────────────────────────────────────────────────

export interface PackagingSettings {
  id: string;
  tenant_id: string;
  keywords: string;
  association_rule: 'FIRST_ITEM' | 'LARGEST_QUANTITY' | 'MANUAL';
  created_at: string;
  updated_at: string;
}

let mockPackagingSettings: PackagingSettings[] = [
  {
    id: 'ps-1',
    tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
    association_rule: 'FIRST_ITEM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function getPackagingSettings(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const config = mockPackagingSettings.find(s => s.tenant_id === tenantId) || {
      id: 'ps-temp',
      tenant_id: tenantId,
      keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
      association_rule: 'FIRST_ITEM' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { data: config, error: null };
  }

  const { data, error } = await getDbClient()
    .from('packaging_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error && shouldFallbackToMock(error)) {
    const config = mockPackagingSettings.find(s => s.tenant_id === tenantId) || {
      id: 'ps-temp',
      tenant_id: tenantId,
      keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
      association_rule: 'FIRST_ITEM' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { data: config, error: null };
  }

  // Se nao encontrar registro, retorna um padrao inicial sem erro
  if (!data && !error) {
    const defaultSettings = {
      id: 'ps-default',
      tenant_id: tenantId,
      keywords: 'caixa,fundo,divisoria,saco,embalagem,pacote',
      association_rule: 'FIRST_ITEM' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return { data: defaultSettings, error: null };
  }

  return { data, error };
}

export async function savePackagingSettings(item: Omit<PackagingSettings, 'id' | 'created_at' | 'updated_at'>) {
  const tenantId = item.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  if (isMockMode) {
    let config = mockPackagingSettings.find(s => s.tenant_id === tenantId);
    if (config) {
      config.keywords = item.keywords;
      config.association_rule = item.association_rule;
      config.updated_at = new Date().toISOString();
    } else {
      config = {
        id: Math.random().toString(36).substring(2),
        tenant_id: tenantId,
        keywords: item.keywords,
        association_rule: item.association_rule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockPackagingSettings.push(config);
    }
    return { data: config, error: null };
  }

  const { data, error } = await getDbClient()
    .from('packaging_settings')
    .upsert({
      tenant_id: tenantId,
      keywords: item.keywords,
      association_rule: item.association_rule,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' })
    .select()
    .single();

  if (error && shouldFallbackToMock(error)) {
    let config = mockPackagingSettings.find(s => s.tenant_id === tenantId);
    if (config) {
      config.keywords = item.keywords;
      config.association_rule = item.association_rule;
      config.updated_at = new Date().toISOString();
    } else {
      config = {
        id: Math.random().toString(36).substring(2),
        tenant_id: tenantId,
        keywords: item.keywords,
        association_rule: item.association_rule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockPackagingSettings.push(config);
    }
    return { data: config, error: null };
  }
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────
// RELATÓRIOS E AUDITORIA DE TRANSIÇÕES DE SETOR / MÁQUINAS
// ─────────────────────────────────────────────────────────────────

export async function getSectorTransitionReport(
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  filters: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    productId?: string;
    machineId?: string;
  } = {}
) {
  let historyData: any[] = [];
  
  if (isMockMode) {
    historyData = [...mockOrderItemSectorHistory].filter(h => h.tenant_id === tenantId);
  } else {
    const { data, error } = await getDbClient()
      .from('order_item_sector_history')
      .select('*, order_item:order_items(*, order:orders(*, customer:customers(*), product:products(*)), machine:production_machines(*))')
      .eq('tenant_id', tenantId);

    if (error && shouldFallbackToMock(error)) {
      historyData = [...mockOrderItemSectorHistory].filter(h => h.tenant_id === tenantId);
    } else {
      historyData = data || [];
    }
  }

  // Preencher dados em modo simulação (ou fallback)
  if (isMockMode || historyData.length === 0 || !historyData[0]?.order_item) {
    historyData = historyData.map(h => {
      const orderItem = mockOrderItems.find(oi => oi.id === h.order_item_id) || null;
      let order: any = null;
      let customer: any = null;
      let product: any = null;
      if (orderItem) {
        order = mockOrders.find(o => o.id === orderItem.order_id) || null;
        if (order) {
          customer = mockCustomers.find(c => c.id === order.customer_id) || null;
          product = mockProducts.find(p => p.id === order.product_id) || null;
        }
      }
      const machine = mockProductionMachines.find(m => m.id === h.machine_id) || null;

      return {
        ...h,
        machine,
        order_item: orderItem ? {
          ...orderItem,
          order: order ? {
            ...order,
            customer,
            product
          } : null
        } : null
      };
    });
  }

  // Aplicar filtros de pesquisa
  let filtered = historyData;

  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    filtered = filtered.filter(h => new Date(h.entered_at).getTime() >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate + 'T23:59:59').getTime();
    filtered = filtered.filter(h => new Date(h.entered_at).getTime() <= end);
  }
  if (filters.customerId) {
    filtered = filtered.filter(h => h.order_item?.order?.customer_id === filters.customerId);
  }
  if (filters.productId) {
    filtered = filtered.filter(h => h.order_item?.product_id === filters.productId || h.order_item?.order?.product_id === filters.productId);
  }
  if (filters.machineId) {
    filtered = filtered.filter(h => h.machine_id === filters.machineId);
  }

  // 1. Calcular tempo médio por etapa/setor
  const sectorDurations: Record<string, number[]> = {};
  filtered.forEach(h => {
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!sectorDurations[h.sector]) {
      sectorDurations[h.sector] = [];
    }
    sectorDurations[h.sector].push(duration);
  });

  const averageTimes = Object.keys(sectorDurations).map(sector => {
    const arr = sectorDurations[sector];
    const total = arr.reduce((sum, val) => sum + val, 0);
    const avgMs = arr.length ? total / arr.length : 0;
    const avgHours = Number((avgMs / (1000 * 60 * 60)).toFixed(2));
    return {
      sector,
      count: arr.length,
      averageHours: avgHours,
      averageDays: Number((avgHours / 24).toFixed(2))
    };
  });

  // 2. Identificar os cards que mais tempo demoraram (stays) por setor ou máquina
  const staysByItem: Record<string, { item: any; totalDuration: number; sector: string; machineName: string }> = {};
  filtered.forEach(h => {
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;
    const key = `${h.order_item_id}_${h.sector}`;

    if (!staysByItem[key]) {
      staysByItem[key] = {
        item: h.order_item || { id: h.order_item_id, name: 'Item Desconhecido' },
        totalDuration: 0,
        sector: h.sector,
        machineName: h.machine?.name || 'Manual / Sem máquina'
      };
    }
    staysByItem[key].totalDuration += duration;
  });

  const longestStays = Object.values(staysByItem)
    .map(stay => ({
      itemId: stay.item.id,
      friendlyId: stay.item.friendly_id || 'PV-???/1',
      itemName: stay.item.name,
      customerName: stay.item.order?.customer?.name || 'Cliente Genérico',
      sector: stay.sector,
      machineName: stay.machineName,
      durationHours: Number((stay.totalDuration / (1000 * 60 * 60)).toFixed(2)),
      durationDays: Number((stay.totalDuration / (1000 * 60 * 60 * 24)).toFixed(2))
    }))
    .sort((a, b) => b.durationHours - a.durationHours)
    .slice(0, 10);

  // 3. Distribuição por Período
  const periodMap: Record<string, { date: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const dateStr = new Date(h.entered_at).toLocaleDateString('pt-BR');
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!periodMap[dateStr]) {
      periodMap[dateStr] = { date: dateStr, duration: 0, count: 0 };
    }
    periodMap[dateStr].duration += duration;
    periodMap[dateStr].count += 1;
  });
  const byPeriod = Object.values(periodMap).map(p => ({
    date: p.date,
    averageHours: Number(((p.duration / p.count) / (1000 * 60 * 60)).toFixed(2)),
    count: p.count
  })).slice(0, 30);

  // 4. Distribuição por Cliente
  const customerMap: Record<string, { name: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const name = h.order_item?.order?.customer?.name || 'Cliente Genérico';
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!customerMap[name]) {
      customerMap[name] = { name, duration: 0, count: 0 };
    }
    customerMap[name].duration += duration;
    customerMap[name].count += 1;
  });
  const byCustomer = Object.values(customerMap).map(c => ({
    name: c.name,
    averageHours: Number(((c.duration / c.count) / (1000 * 60 * 60)).toFixed(2)),
    count: c.count
  })).sort((a, b) => b.averageHours - a.averageHours);

  // 5. Distribuição por Produto
  const productMap: Record<string, { name: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const name = h.order_item?.order?.product?.name || h.order_item?.name || 'Produto Genérico';
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!productMap[name]) {
      productMap[name] = { name, duration: 0, count: 0 };
    }
    productMap[name].duration += duration;
    productMap[name].count += 1;
  });
  const byProduct = Object.values(productMap).map(p => ({
    name: p.name,
    averageHours: Number(((p.duration / p.count) / (1000 * 60 * 60)).toFixed(2)),
    count: p.count
  })).sort((a, b) => b.averageHours - a.averageHours);

  // 6. Distribuição por Máquina
  const machineMap: Record<string, { name: string; duration: number; count: number }> = {};
  filtered.forEach(h => {
    const name = h.machine?.name || 'Manual / Sem máquina';
    const start = new Date(h.entered_at).getTime();
    const end = h.exited_at ? new Date(h.exited_at).getTime() : Date.now();
    const duration = end - start;

    if (!machineMap[name]) {
      machineMap[name] = { name, duration: 0, count: 0 };
    }
    machineMap[name].duration += duration;
    machineMap[name].count += 1;
  });
  const byMachine = Object.values(machineMap).map(m => ({
    name: m.name,
    averageHours: Number(((m.duration / m.count) / (1000 * 60 * 60)).toFixed(2)),
    count: m.count
  })).sort((a, b) => b.averageHours - a.averageHours);

  return {
    data: {
      averageTimes,
      longestStays,
      byPeriod,
      byCustomer,
      byProduct,
      byMachine
    },
    error: null
  };
}



