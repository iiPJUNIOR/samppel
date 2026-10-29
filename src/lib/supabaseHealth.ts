import { supabaseAdmin, supabase } from '@/services/supabaseClient';
import { sendDatabaseDownAlert } from '@/services/emailService';

export interface HealthCheckResult {
  ok: boolean;
  status: 'healthy' | 'paused' | 'unreachable' | 'degraded';
  latencyMs: number;
  error?: string;
  timestamp: string;
  checkedAt: number;
}

// Armazena em memória no servidor o último alerta enviado para evitar spam de e-mails em sequência
let lastAlertSentTimestamp = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos de intervalo entre alertas repetidos

export async function checkSupabaseHealth(options?: {
  sendAlertIfDown?: boolean;
  source?: string;
  forceAlert?: boolean;
}): Promise<HealthCheckResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  const client = supabaseAdmin || supabase;
  if (!client) {
    const errorMsg = 'Cliente Supabase não inicializado (credenciais ausentes).';
    if (options?.sendAlertIfDown) {
      await maybeSendAlert(errorMsg, options.source, options.forceAlert);
    }
    return {
      ok: false,
      status: 'unreachable',
      latencyMs: 0,
      error: errorMsg,
      timestamp,
      checkedAt: start
    };
  }

  try {
    // Timeout estrito de 6 segundos para detecção rápida de banco pausado ou sem resposta
    const checkPromise = client
      .from('profiles')
      .select('id')
      .limit(1);

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED: Supabase não respondeu em 6 segundos (provavelmente pausado)')), 6000)
    );

    const result = await Promise.race([checkPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    if (result.error) {
      throw result.error;
    }

    return {
      ok: true,
      status: 'healthy',
      latencyMs,
      timestamp,
      checkedAt: start
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    const errorMsg = error?.message || String(error);
    
    // Identifica se é erro característico de projeto pausado (falha de DNS, conexão recusada, gateway 503 ou timeout)
    const isPausedLike = 
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('TIMEOUT_EXCEEDED') ||
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('503') ||
      errorMsg.includes('Could not resolve');

    const status: HealthCheckResult['status'] = isPausedLike ? 'paused' : 'unreachable';

    console.error(`[SupabaseHealthCheck] Falha na verificação de saúde do banco (${status}):`, errorMsg);

    if (options?.sendAlertIfDown) {
      await maybeSendAlert(errorMsg, options.source, options.forceAlert);
    }

    return {
      ok: false,
      status,
      latencyMs,
      error: errorMsg,
      timestamp,
      checkedAt: start
    };
  }
}

/**
 * Envia o alerta respeitando o cooldown para evitar inundações de caixa de entrada
 */
async function maybeSendAlert(errorMsg: string, source = 'Monitor de Saúde do Sistema', force = false) {
  const now = Date.now();
  if (!force && (now - lastAlertSentTimestamp < ALERT_COOLDOWN_MS)) {
    console.log(`[SupabaseHealthCheck] Alerta ignorado devido ao cooldown de 30 minutos (último envio há ${Math.round((now - lastAlertSentTimestamp)/1000)}s).`);
    return;
  }

  lastAlertSentTimestamp = now;
  try {
    await sendDatabaseDownAlert({
      error: errorMsg,
      source,
      timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });
    console.log('[SupabaseHealthCheck] E-mail de alerta de Supabase pausado enviado com sucesso!');
  } catch (err) {
    console.error('[SupabaseHealthCheck] Falha ao despachar e-mail de alerta:', err);
  }
}
