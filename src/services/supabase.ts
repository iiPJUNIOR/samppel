import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Detect if we are using placeholder/mock keys
const isMockMode = 
  !supabaseUrl || 
  supabaseUrl.includes('your-project-id') || 
  supabaseUrl.includes('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0') ||
  supabaseAnonKey.includes('placeholder');

// Real Supabase Clients (only initialized if not in mock mode)
export const supabase = !isMockMode 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const supabaseAdmin = !isMockMode && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// --- IN-MEMORY MOCK DATA FOR SEEDING & OUT-OF-THE-BOX WORKABILITY ---
// If the user hasn't setup Supabase yet, we run CRUD in memory

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

// Customers
export async function getCustomers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockCustomers.filter(c => c.tenant_id === tenantId), error: null };
  const { data, error } = await supabase!.from('customers').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createCustomer(customer: any) {
  const newCust = {
    id: customer.id || typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: customer.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...customer
  };
  
  if (isMockMode) {
    mockCustomers.unshift(newCust);
    // Add to sync queue
    await enqueueSync(newCust.tenant_id, 'CUSTOMER', newCust.id, 'CREATE');
    return { data: newCust, error: null };
  }
  
  const { data, error } = await supabase!.from('customers').insert([customer]).select().single();
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
  const { data, error } = await supabase!.from('customers').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'CUSTOMER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Suppliers
export async function getSuppliers(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockSuppliers.filter(s => s.tenant_id === tenantId), error: null };
  const { data, error } = await supabase!.from('suppliers').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createSupplier(supplier: any) {
  const newSupp = {
    id: supplier.id || typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: supplier.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...supplier
  };
  if (isMockMode) {
    mockSuppliers.unshift(newSupp);
    await enqueueSync(newSupp.tenant_id, 'SUPPLIER', newSupp.id, 'CREATE');
    return { data: newSupp, error: null };
  }
  const { data, error } = await supabase!.from('suppliers').insert([supplier]).select().single();
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
  const { data, error } = await supabase!.from('suppliers').update(updates).eq('id', id).select().single();
  if (!error && data) {
    await enqueueSync(data.tenant_id, 'SUPPLIER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Products & Stock
export async function getProducts(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockProducts.filter(p => p.tenant_id === tenantId), error: null };
  const { data, error } = await supabase!.from('products').select('*').eq('tenant_id', tenantId).order('name');
  return { data, error };
}

export async function createProduct(product: any) {
  const newProd = {
    id: product.id || typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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
  const { data, error } = await supabase!.from('products').insert([product]).select().single();
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
  const { data, error } = await supabase!.from('products').update(updates).eq('id', id).select().single();
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
  // Insert stock transaction and product stock updates are normally handled in a database transaction/trigger, or here manually
  const { data: prod } = await supabase!.from('products').select('stock_quantity').eq('id', productId).single();
  if (prod) {
    const newQty = (prod.stock_quantity || 0) + quantity;
    await supabase!.from('products').update({ stock_quantity: newQty < 0 ? 0 : newQty }).eq('id', productId);
    await supabase!.from('stock_transactions').insert([{
      tenant_id: tenantId,
      product_id: productId,
      quantity,
      type,
      description
    }]);
  }
  return { error: null };
}

// Orders (Pedidos)
export async function getOrders(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    // Return mock orders with client and product info joined in-memory
    const ordersWithJoins = mockOrders.filter(o => o.tenant_id === tenantId).map(order => {
      const customer = mockCustomers.find(c => c.id === order.customer_id) || { name: 'Cliente Desconhecido' };
      const product = mockProducts.find(p => p.id === order.product_id) || { name: 'Produto Desconhecido', stock_quantity: 0 };
      return {
        ...order,
        customer,
        product
      };
    });
    // Order by created_at desc
    ordersWithJoins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: ordersWithJoins, error: null };
  }
  
  const { data, error } = await supabase!
    .from('orders')
    .select('*, customer:customers(*), product:products(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createOrder(order: any) {
  const newOrder = {
    id: order.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: order.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    order_number: mockOrders.length + 1001,
    created_at: new Date().toISOString(),
    ...order
  };
  
  if (isMockMode) {
    mockOrders.unshift(newOrder);
    
    // Auto adjust stock (negative transaction, output of boxes count or quantity)
    // Decrement from stock the boxes count as raw count
    await adjustStock(newOrder.product_id, -newOrder.boxes_count, 'PEDIDO', `Pedido #${newOrder.order_number} cadastrado`, newOrder.tenant_id);
    
    // Auto generate financial record (receita pendente)
    const product = mockProducts.find(p => p.id === newOrder.product_id);
    const amount = (product ? product.price * newOrder.print_run : 0) + newOrder.freight_value;
    const customer = mockCustomers.find(c => c.id === newOrder.customer_id);
    
    const newFin = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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
    
    // Enqueue order sync
    await enqueueSync(newOrder.tenant_id, 'ORDER', newOrder.id, 'CREATE');
    return { data: newOrder, error: null };
  }
  
  const { data, error } = await supabase!.from('orders').insert([order]).select().single();
  if (!error && data) {
    // Adjust stock
    await adjustStock(data.product_id, -data.boxes_count, 'PEDIDO', `Pedido #${data.order_number} cadastrado`, data.tenant_id);
    
    // Create financial record
    const { data: prod } = await supabase!.from('products').select('price').eq('id', data.product_id).single();
    const { data: cust } = await supabase!.from('customers').select('name').eq('id', data.customer_id).single();
    const amount = ((prod ? prod.price : 0) * data.print_run) + data.freight_value;
    
    await supabase!.from('financial_transactions').insert([{
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
      // If order is paid, update financial status
      if (updates.status === 'Pago') {
        mockFinancial = mockFinancial.map(f => f.order_id === id ? { ...f, status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] } : f);
      }
      await enqueueSync(updated.tenant_id, 'ORDER', id, 'UPDATE');
    }
    return { data: updated, error: null };
  }
  
  const { data, error } = await supabase!.from('orders').update(updates).eq('id', id).select().single();
  if (!error && data) {
    if (updates.status === 'Pago') {
      await supabase!
        .from('financial_transactions')
        .update({ status: 'CONCILIADO', payment_date: new Date().toISOString().split('T')[0] })
        .eq('order_id', id);
    }
    await enqueueSync(data.tenant_id, 'ORDER', data.id, 'UPDATE');
  }
  return { data, error };
}

// Financial (Financeiro)
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
  const { data, error } = await supabase!
    .from('financial_transactions')
    .select('*, order:orders(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createFinancialTransaction(transaction: any) {
  const newFin = {
    id: transaction.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
    tenant_id: transaction.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
    created_at: new Date().toISOString(),
    ...transaction
  };
  if (isMockMode) {
    mockFinancial.unshift(newFin);
    await enqueueSync(newFin.tenant_id, 'FINANCIAL', newFin.id, 'CREATE');
    return { data: newFin, error: null };
  }
  const { data, error } = await supabase!.from('financial_transactions').insert([transaction]).select().single();
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
  const { data, error } = await supabase!
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

// Integration Logs
export async function getIntegrationLogs(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    const list = [...mockLogs];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: list, error: null };
  }
  const { data, error } = await supabase!
    .from('conta_azul_integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

export async function createIntegrationLog(action: string, status: 'SUCCESS' | 'ERROR' | 'PENDING_RETRY', payload: any, response: any, errorMessage: string | null = null, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const log = {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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
  const { data, error } = await supabaseAdmin!.from('conta_azul_integration_logs').insert([log]).select().single();
  return { data, error };
}

// Sync Queue (Filas)
export async function getSyncQueue(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { data: mockQueue.filter(q => q.tenant_id === tenantId), error: null };
  }
  const { data, error } = await supabaseAdmin!
    .from('sync_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function enqueueSync(tenantId: string, entityType: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'ORDER' | 'FINANCIAL', entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE') {
  const newSync = {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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
    // Check if duplicate pending sync exists
    const exists = mockQueue.some(q => q.entity_id === entityId && q.entity_type === entityType && q.status === 'PENDING');
    if (!exists) {
      mockQueue.unshift(newSync);
    }
    return { data: newSync, error: null };
  }
  
  // Insert into sync queue, avoiding duplicates if already pending
  const { data: existing } = await supabaseAdmin!
    .from('sync_queue')
    .select('id')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .eq('status', 'PENDING')
    .maybeSingle();
    
  if (existing) {
    return { data: existing, error: null };
  }
  
  const { data, error } = await supabaseAdmin!
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

// Conta Azul Configuration API
export async function getContaAzulConfig(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) return { data: mockContaAzulConfig, error: null };
  const { data, error } = await supabaseAdmin!
    .from('conta_azul_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  return { data, error };
}

export async function updateContaAzulConfig(updates: any, tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    mockContaAzulConfig = { ...mockContaAzulConfig, ...updates, updated_at: new Date().toISOString() };
    return { data: mockContaAzulConfig, error: null };
  }
  const { data: existing } = await supabaseAdmin!
    .from('conta_azul_config')
    .select('id')
    .eq('tenant_id', tenantId)
    .maybeSingle();
    
  if (existing) {
    const { data, error } = await supabaseAdmin!
      .from('conta_azul_config')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabaseAdmin!
      .from('conta_azul_config')
      .insert([{ tenant_id: tenantId, ...updates }])
      .select()
      .single();
    return { data, error };
  }
}
