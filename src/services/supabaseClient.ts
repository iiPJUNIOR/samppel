import { createClient } from '@supabase/supabase-js';

// Variaveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Cliente Supabase Anonimo (usado no navegador e no servidor)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase Admin (disponivel apenas no lado do servidor)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Retorna o cliente apropriado: supabaseAdmin no servidor (para bypassar RLS em background) e supabase no navegador (com token do usuario autenticado)
export function getDbClient() {
  if (typeof window === 'undefined') {
    return supabaseAdmin || supabase;
  }
  return supabase;
}

async function getClientAuthHeaders(extraHeaders?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('Falha ao obter sessao para cabecalho autenticado:', err);
  }
  return headers;
}

// Logs de integracao
export async function getIntegrationLogs(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('conta_azul_integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

function sanitizeLogData(data: any): any {
  if (!data) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return { count: data.length, sample: data.slice(0, 2).map(sanitizeLogData) };
  }
  const allowedKeys = ['id', 'numero', 'orderId', 'pv_number', 'client_id', 'imported', 'updated', 'total', 'action', 'status', 'name', 'step', 'progress'];
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (allowedKeys.includes(key) || typeof data[key] === 'string' || typeof data[key] === 'number' || typeof data[key] === 'boolean') {
      const val = data[key];
      if (typeof val === 'string' && val.length > 250) {
        sanitized[key] = val.substring(0, 250) + '...';
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

function capErrorPayload(data: any, depth = 0): any {
  if (data === null || data === undefined) return null;
  if (typeof data === 'string') {
    return data.length > 1200 ? data.substring(0, 1200) + '... [truncado]' : data;
  }
  if (typeof data !== 'object') return data;
  if (depth > 2) return '[objeto aninhado compactado]';
  if (Array.isArray(data)) {
    return { total_items: data.length, sample: data.slice(0, 3).map((item) => capErrorPayload(item, depth + 1)) };
  }
  const out: Record<string, any> = {};
  const keys = Object.keys(data).slice(0, 20);
  for (const k of keys) {
    out[k] = capErrorPayload(data[k], depth + 1);
  }
  return out;
}

export async function createIntegrationLog(
  action: string,
  status: 'SUCCESS' | 'ERROR' | 'PENDING_RETRY',
  payload: any,
  response: any,
  errorMessage: string | null = null,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
) {
  // Em caso de sucesso, compacta o payload para nao inflar a ingestao de logs e egress no Supabase
  const finalPayload = status === 'SUCCESS' ? sanitizeLogData(payload) : capErrorPayload(payload);
  const finalResponse = status === 'SUCCESS' ? sanitizeLogData(response) : capErrorPayload(response);
  const cappedError = errorMessage && errorMessage.length > 1500 ? errorMessage.substring(0, 1500) + '... [truncado]' : errorMessage;

  const log = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    tenant_id: tenantId,
    action,
    status,
    payload: finalPayload,
    response: finalResponse,
    error_message: cappedError,
    created_at: new Date().toISOString()
  };
  const { error } = await getDbClient().from('conta_azul_integration_logs').insert([log]);
  return { data: log, error };
}

// Fila de sincronizacao (Sync Queue) - mantida apenas para leitura historica no painel de configuracoes
export async function getSyncQueue(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  const { data, error } = await getDbClient()
    .from('sync_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

/**
 * Sincronizacao reversa (Portal -> Conta Azul) desativada por governanca:
 * o Conta Azul atua como fonte primaria de vendas e cadastros oficiais.
 */
export async function enqueueSync(
  _tenantId: string,
  _entityType: 'CUSTOMER' | 'SUPPLIER' | 'PRODUCT' | 'ORDER' | 'FINANCIAL',
  _entityId: string,
  _action: 'CREATE' | 'UPDATE' | 'DELETE'
) {
  return { data: null, error: null };
}

// Configuracoes da Conta Azul
export async function getContaAzulConfig(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
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
    const headers = await getClientAuthHeaders();
    const res = await fetch('/api/config/conta-azul', { headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Falha ao buscar credenciais');
    }
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
  if (typeof window === 'undefined') {
    try {
      if (!supabaseAdmin) throw new Error('Cliente Supabase nao inicializado');

      const { data: existing } = await supabaseAdmin
        .from('conta_azul_config')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const payload: any = { ...updates, updated_at: new Date().toISOString() };

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
    const headers = await getClientAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch('/api/config/conta-azul', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        client_id: updates.client_id,
        client_secret: updates.client_secret
      })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Falha ao salvar credenciais');
    }
    return { data: { success: true }, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
