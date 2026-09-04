import { createClient } from '@supabase/supabase-js';
import { adjustStock } from './supabase_modules/products';

// Variaveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Detecta se estamos usando chaves de demonstracao/mock
export const isMockMode = false;

// Cliente Supabase Anonimo (usado no navegador e no servidor)
export const supabase = !isMockMode 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Cliente Supabase Admin (disponivel apenas no lado do servidor)
export const supabaseAdmin = !isMockMode && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Retorna o cliente apropriado: supabaseAdmin no servidor (para bypassar RLS em background) e supabase no navegador (com token do usuario autenticado)
export function getDbClient() {
  if (typeof window === 'undefined') {
    return supabaseAdmin || supabase!;
  }
  return supabase!;
}

// --- DADOS SIMULADOS (MOCK DATA) PARA MODO SANDBOX ---
let mockCompanies: any[] = [
  { id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Samppel Embalagens Ltda', cnpj: '12.345.678/0001-90', created_at: new Date().toISOString() }
];

export let mockProfiles: any[] = [
  { id: 'e00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Ana Silva (Admin)', role: 'Administrador', email: 'admin@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Mariana Souza (Vendas)', role: 'Comercial', email: 'comercial@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Carlos Mendes (Fábrica)', role: 'Produção', email: 'producao@samppel.com.br', created_at: new Date().toISOString() },
  { id: 'e00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', full_name: 'Beatriz Lima (Financeiro)', role: 'Financeiro', email: 'financeiro@samppel.com.br', created_at: new Date().toISOString() }
];

export function setMockProfiles(newMocks: any[]) {
  mockProfiles = newMocks;
}

export let mockCustomers: any[] = [
  { id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Chocolate Gourmet Brasil', document: '22.333.444/0001-55', email: 'contato@chocobrasil.com.br', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000 - São Paulo/SP', conta_azul_id: 'ca_cust_1', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Cosméticos Florescer Ltda', document: '33.444.555/0001-66', email: 'suporte@florescer.com.br', phone: '(21) 97654-3210', address: 'Rua das Flores, 45 - Rio de Janeiro/RJ', conta_azul_id: 'ca_cust_2', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Boutique do Café Especial', document: '44.555.666/0001-77', email: 'financeiro@boutiquecafe.com', phone: '(31) 3456-7890', address: 'Praça da Liberdade, 300 - Belo Horizonte/MG', conta_azul_id: null, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

export function setMockCustomers(newMocks: any[]) {
  mockCustomers = newMocks;
}

export let mockSuppliers: any[] = [
  { id: '500184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Papelaria Klabin Distribuidora', document: '11.111.111/0001-11', email: 'vendas@klabin.com.br', phone: '(11) 3003-1234', address: 'Rodovia Dutra, Km 200 - Guarulhos/SP', conta_azul_id: 'ca_supp_1', created_at: new Date().toISOString() },
  { id: '500284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Tintas Especiais Dupont', document: '22.222.222/0001-22', email: 'tintas@dupont.com', phone: '(19) 3876-5432', address: 'Distrito Industrial - Campinas/SP', conta_azul_id: 'ca_supp_2', created_at: new Date().toISOString() }
];

export function setMockSuppliers(newMocks: any[]) {
  mockSuppliers = newMocks;
}

export let mockProducts: any[] = [
  { id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa Kraft para Bombom (P)', sku: 'KRAFT-BOM-P', description: 'Caixa em papel kraft para 6 bombons com berço', price: 2.50, stock_quantity: 1500, conta_azul_id: 'ca_prod_1', created_at: new Date().toISOString() },
  { id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Sacola Duplex Branca Premium (M)', sku: 'SAC-DUP-M', description: 'Sacola em papel duplex com alça de cordão', price: 4.80, stock_quantity: 800, conta_azul_id: 'ca_prod_2', created_at: new Date().toISOString() },
  { id: '800384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', name: 'Caixa Correio E-commerce (G)', sku: 'CX-CORR-G', description: 'Caixa de papelão onda B para envios postais', price: 3.90, stock_quantity: 2500, conta_azul_id: null, created_at: new Date().toISOString() }
];

export function setMockProducts(newMocks: any[]) {
  mockProducts = newMocks;
}

export let mockOrders: any[] = [
  { id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', order_number: 1001, pv_number: 'PV-1001', op_number: 'OP-5001', art_name: 'Sacola Choco Brasil Prata', seller_name: 'Mariana Souza', measure: '15x10x5 cm', print_run: 5000, boxes_count: 10, packaging_type: 'CAIXA', freight_value: 150.00, shipping_type: 'ENTREGA_PROPRIA', status: 'A produzir', production_sector: 'Impressão', physical_location: 'Máquina Flexo 1', notes: 'Cliente solicitou pressa. Logo centralizada na tampa.', internal_notes: 'Confirmado pagamento da primeira parcela por boleto.', order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 3, installments_paid: 1, first_payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 100, conta_azul_status: 'Aprovado', conta_azul_id: 'ca_order_1', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', order_number: 1002, pv_number: 'PV-1002', op_number: 'OP-5002', art_name: 'Sacola Florescer Rosa Luxo', seller_name: 'Camila Neves', measure: '25x30x10 cm', print_run: 2000, boxes_count: 4, packaging_type: 'PACOTE', freight_value: 80.00, shipping_type: 'TRANSPORTADORA', status: 'Em revisão', production_sector: 'Corte e Vinco', physical_location: 'Salão', notes: 'Acabamento com verniz localizado.', internal_notes: 'Aguardando aprovação do layout final de faca pelo cliente.', order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 1, installments_paid: 0, first_payment_date: null, over_short_quantity: 0, conta_azul_status: 'Aprovado', conta_azul_id: null, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', product_id: '800384c8-3e4b-4b14-87cf-45ef42d17c03', order_number: 1003, pv_number: 'PV-1003', op_number: null, art_name: 'Caixa Padrão Correios', seller_name: 'Mariana Souza', measure: '30x20x15 cm', print_run: 1000, boxes_count: 2, packaging_type: 'CAIXA', freight_value: 60.00, shipping_type: 'RETIRADA', status: 'Expedição', production_sector: 'Expedição', physical_location: 'Pátio', notes: 'Coleta pela transportadora Braspress.', internal_notes: 'Nota fiscal já gerada e anexada ao pacote.', order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 1, installments_paid: 1, first_payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: -10, conta_azul_status: 'Aprovado', conta_azul_id: 'ca_order_3', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', product_id: '800284c8-3e4b-4b14-87cf-45ef42d17c02', order_number: 1004, pv_number: 'PV-1004', op_number: 'OP-5004', art_name: 'Sacola Florescer Kraft M', seller_name: 'Camila Neves', measure: '20x20x8 cm', print_run: 3000, boxes_count: 6, packaging_type: 'CAIXA', freight_value: 120.00, shipping_type: 'ENTREGA_PROPRIA', status: 'Pago', production_sector: 'Concluído', physical_location: 'Salão', notes: 'Sem observações.', internal_notes: 'Entregue com sucesso no dia 15/06.', order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 2, installments_paid: 2, first_payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 50, conta_azul_status: 'Aprovado', conta_azul_id: 'ca_order_4', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a00584c8-3e4b-4b14-87cf-45ef42d17c05', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', customer_id: 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', product_id: '800184c8-3e4b-4b14-87cf-45ef42d17c01', order_number: 1005, pv_number: 'PV-1005', op_number: 'OP-5005', art_name: 'Saco Café Gourmet Preto', seller_name: 'Mariana Souza', measure: '15x10x5 cm', print_run: 10000, boxes_count: 20, packaging_type: 'CAIXA', freight_value: 250.00, shipping_type: 'RETIRADA', status: 'Atrasado', production_sector: 'Colagem', physical_location: 'Máquina Coladeira 2', notes: 'Urgente! Atraso devido a problema na máquina coladeira.', internal_notes: 'Cliente cobrou posicionamento hoje cedo.', order_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), installments_total: 4, installments_paid: 2, first_payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], over_short_quantity: 0, conta_azul_status: 'Aprovado', conta_azul_id: null, created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
];

export function setMockOrders(newMocks: any[]) {
  mockOrders = newMocks;
}

export let mockFinancial: any[] = [
  { id: 'f00184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', type: 'RECEITA', amount: 12650.00, status: 'PENDENTE', description: 'Venda Chocolate Gourmet Brasil #1', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: null, created_at: new Date().toISOString() },
  { id: 'f00284c8-3e4b-4b14-87cf-45ef42d17c02', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', type: 'RECEITA', amount: 3960.00, status: 'CONCILIADO', description: 'Venda Boutique do Café #3', due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00384c8-3e4b-4b14-87cf-45ef42d17c03', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', type: 'RECEITA', amount: 14520.00, status: 'CONCILIADO', description: 'Venda Chocolate Gourmet Brasil #4', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00484c8-3e4b-4b14-87cf-45ef42d17c04', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: null, type: 'DESPESA', amount: 4500.00, status: 'CONCILIADO', description: 'Compra de Papel Kraft - Klabin', due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'f00584c8-3e4b-4b14-87cf-45ef42d17c05', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', order_id: null, type: 'DESPESA', amount: 1200.00, status: 'PENDENTE', description: 'Compra de Tintas Especiais - Dupont', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], payment_date: null, created_at: new Date().toISOString() }
];

export function setMockFinancial(newMocks: any[]) {
  mockFinancial = newMocks;
}

let mockLogs: any[] = [
  { id: '100184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', action: 'OAUTH_REFRESH', status: 'SUCCESS', payload: { client_id: 'mock_client' }, response: { message: 'Token refreshed in mock mode', expires_in: 3600 }, error_message: null, created_at: new Date().toISOString() }
];

let mockQueue: any[] = [
  { id: '900184c8-3e4b-4b14-87cf-45ef42d17c01', tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', entity_type: 'ORDER', entity_id: 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', action: 'CREATE', retry_count: 0, max_retries: 5, status: 'PENDING', last_error: null, next_retry_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let mockContaAzulConfig: any = {
  id: 'c-azul-config-mock',
  tenant_id: 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  client_id: 'ca_id',
  client_secret: 'ca_sec',
  access_token: 'ca_acc',
  refresh_token: 'ca_ref',
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};



// Pedidos (Orders)

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
  const { error } = await getDbClient().from('conta_azul_integration_logs').insert([log]);
  return { data: log, error };
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
