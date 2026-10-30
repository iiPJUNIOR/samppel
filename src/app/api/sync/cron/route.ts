import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { SyncQueueService } from '@/services/sync_queue';
import { ContaAzulService } from '@/services/conta_azul';
import { requireCronOrAuth, supabaseAdmin } from '@/lib/serverAuth';
import { checkSupabaseHealth } from '@/lib/supabaseHealth';
import {
  sendDatabaseDownAlert,
  sendDailyMorningReport,
  sendMonitoringAnomalyAlert,
} from '@/services/emailService';

export const maxDuration = 300; // 5 minutos de timeout na Vercel (Pro)
export const dynamic = 'force-dynamic';

const COOLDOWN_INCREMENTAL_MS = 12 * 60 * 1000; // 12 minutos anti-duplicidade entre agendadores
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_OPEN_MS = 2 * 60 * 60 * 1000; // 2 horas de pausa automatica em falha OAuth/END_TRIAL
const ANOMALY_EMAIL_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas entre alertas automaticos de pico

interface CronEventEntry {
  at: string;
  mode: 'incremental' | 'full';
  source: string;
  status: 'EXECUTED' | 'BLOCKED_COOLDOWN' | 'BLOCKED_CIRCUIT' | 'ERROR' | 'ERROR_OAUTH';
  detail: string;
}

function detectCronSource(request: NextRequest, authReason?: string): string {
  if (request.headers.get('x-vercel-cron')) {
    return 'Vercel Cron';
  }
  if (authReason === 'USER_SESSION') {
    return 'Disparo Manual (Sessao UI)';
  }
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (ua.includes('github') || ua.includes('curl')) {
    return 'GitHub Actions / cURL';
  }
  if (ua.includes('cron-job') || ua.includes('uptimerobot') || ua.includes('betterstack')) {
    return `Agendador Externo (${ua.slice(0, 32)})`;
  }
  return ua ? `Externo (${ua.slice(0, 28)})` : 'Agendador Externo';
}

function prependCronEvent(existing: unknown, entry: CronEventEntry): CronEventEntry[] {
  const list = Array.isArray(existing) ? (existing as CronEventEntry[]) : [];
  return [entry, ...list].slice(0, 30);
}

async function getMonitoringState(): Promise<any | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data } = await supabaseAdmin
      .from('system_monitoring_state')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();
    return data || null;
  } catch (err) {
    console.warn('[CronSync] Nao foi possivel ler system_monitoring_state:', err);
    return null;
  }
}

async function updateMonitoringState(patch: Record<string, any>) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin
      .from('system_monitoring_state')
      .upsert({ id: 'global', ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch (err) {
    console.warn('[CronSync] Nao foi possivel atualizar system_monitoring_state:', err);
  }
}

function isOAuthOrPlanBlockError(message: string): boolean {
  const normalized = (message || '').toLowerCase();
  return (
    normalized.includes('falha ao atualizar token') ||
    normalized.includes('end_trial') ||
    normalized.includes('invalid_grant') ||
    normalized.includes('não autenticado') ||
    normalized.includes('nao autenticado') ||
    normalized.includes('não está elegível para uso da api')
  );
}

async function performSync(
  tenantId: string,
  startDateStr: string,
  endDateStr: string,
  mode: 'incremental' | 'full' = 'incremental',
  cronSource = 'Agendador'
) {
  console.log(
    `[CronSync] Iniciando sincronizacao [MODO: ${mode.toUpperCase()} | ORIGEM: ${cronSource}] para o tenant ${tenantId} (${startDateStr} ate ${endDateStr})...`
  );

  // 1. Verificacao previa da saude e conectividade do Supabase
  const health = await checkSupabaseHealth({
    sendAlertIfDown: true,
    source: `Cron ${mode === 'incremental' ? '15 Minutos' : 'Diario'} (/api/sync/cron)`,
    forceAlert: mode === 'full',
  });

  if (!health.ok) {
    const errorMsg = `Supabase inacessivel ou pausado durante o cron: ${health.error}`;
    console.error(`[CronSync] ABORTADO: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    // 2. Process outbox sync queue (sempre processa fila pendente)
    const queueService = new SyncQueueService(tenantId);
    const queueResult = await queueService.processQueue();
    console.log(`[CronSync] Fila processada:`, queueResult);

    let productResult = { imported: 0, updated: 0, total: 0 };
    const caService = new ContaAzulService(tenantId);

    // 3. Sincronizar catalogo de produtos: APENAS no modo FULL (evita centenas de queries desnecessarias a cada 15 min)
    if (mode === 'full') {
      productResult = await caService.importProducts().catch((err) => {
        console.error('[CronSync] Erro ao sincronizar catalogo de produtos:', err);
        return { imported: 0, updated: 0, total: 0 };
      });
      console.log(`[CronSync] Catalogo de produtos sincronizado:`, productResult);
    } else {
      console.log(`[CronSync] Modo incremental: importacao de produtos pulada para poupar recursos.`);
    }

    // 4. Fetch orders from Conta Azul no periodo estipulado
    const importResult = await caService.importOrders(startDateStr, endDateStr);
    console.log(`[CronSync] Importacao concluida com sucesso:`, importResult);

    // 5. Atualiza estado de monitoramento e zera falhas consecutivas de OAuth
    const nowIso = new Date().toISOString();
    const state = await getMonitoringState();
    await updateMonitoringState({
      ...(mode === 'full' ? { last_full_cron_at: nowIso } : { last_incremental_cron_at: nowIso }),
      last_cron_source: cronSource,
      oauth_consecutive_failures: 0,
      oauth_circuit_open_until: null,
      oauth_last_failure_reason: null,
      recent_cron_events: prependCronEvent(state?.recent_cron_events, {
        at: nowIso,
        mode,
        source: cronSource,
        status: 'EXECUTED',
        detail: `Sucesso (${importResult.imported} novos, ${importResult.updated} atualizados)`,
      }),
    });

    // 6. Grava snapshot compacto de telemetria e avalia velocidade de consultas (detector N+1)
    if (supabaseAdmin) {
      try {
        const { data: snapResult } = await supabaseAdmin.rpc('record_monitoring_snapshot', {
          p_source: mode === 'full' ? 'cron_full' : 'cron_15m',
        });
        const deltaCallsPerMin = Number(snapResult?.delta_calls_per_min || 0);
        const lastAlertMs = state?.last_anomaly_alert_at
          ? new Date(state.last_anomaly_alert_at).getTime()
          : 0;

        if (
          deltaCallsPerMin > 1500 &&
          (!lastAlertMs || Date.now() - lastAlertMs > ANOMALY_EMAIL_COOLDOWN_MS)
        ) {
          await updateMonitoringState({ last_anomaly_alert_at: nowIso });
          await sendMonitoringAnomalyAlert({
            title: 'Pico Anormal de Consultas SQL Detectado (Alerta Anti-N+1)',
            severity: 'ATENCAO',
            category: 'Telemetria de Consultas Postgres',
            description:
              'A Central de Monitoramento detectou uma aceleracao atipica na taxa de chamadas SQL por minuto entre os dois ultimos snapshots.',
            recommendedAction:
              'Acesse /monitoramento na aba Consultas & Detector N+1 para inspecionar a query lider em chamadas e, se necessario, redefinir a linha de base.',
            metrics: {
              'Taxa Media Detectada': `${deltaCallsPerMin.toLocaleString('pt-BR')} queries/min`,
              'Limite Preventivo': '1.500 queries/min',
              'Origem da Coleta': cronSource,
            },
          });
        }
      } catch (snapErr) {
        console.warn('[CronSync] Aviso ao gravar snapshot de telemetria:', snapErr);
      }
    }

    // 7. Limpeza automatica de logs antigos e sync_queue concluida: apenas no modo FULL diario
    if (mode === 'full') {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { getDbClient } = await import('@/services/supabaseClient');
        const db = getDbClient();

        await db
          .from('conta_azul_integration_logs')
          .delete()
          .lt('created_at', sevenDaysAgo);

        await db
          .from('sync_queue')
          .delete()
          .eq('status', 'COMPLETED')
          .lt('updated_at', sevenDaysAgo);
      } catch (cleanErr) {
        console.warn('[CronSync] Aviso na limpeza automatica de logs/sync_queue:', cleanErr);
      }

      // 8. Enviar relatorio diario por e-mail: APENAS no modo FULL
      try {
        await sendDailyMorningReport({
          isHealthy: true,
          latencyMs: health.latencyMs,
          syncQueuePending: (queueResult as any)?.pending ?? queueResult?.failures ?? 0,
          importResult,
        });
        console.log('[CronSync] Relatorio matinal enviado por e-mail com sucesso.');
      } catch (emailErr) {
        console.warn('[CronSync] Falha ao enviar e-mail de relatorio matinal:', emailErr);
      }
    }

    return { queueResult, productResult, importResult, mode };
  } catch (error: any) {
    const errMsg = error?.message || 'Falha desconhecida durante a sincronizacao';
    console.error(`[CronSync] Erro durante a sincronizacao [MODO: ${mode}]:`, error);

    const nowIso = new Date().toISOString();
    const state = await getMonitoringState();
    const isOAuthBlock = isOAuthOrPlanBlockError(errMsg);

    if (isOAuthBlock) {
      const nextFailures = Number(state?.oauth_consecutive_failures || 0) + 1;
      const shouldOpenCircuit = nextFailures >= CIRCUIT_BREAKER_THRESHOLD;
      const openUntilIso = shouldOpenCircuit
        ? new Date(Date.now() + CIRCUIT_BREAKER_OPEN_MS).toISOString()
        : state?.oauth_circuit_open_until || null;

      await updateMonitoringState({
        oauth_consecutive_failures: nextFailures,
        oauth_last_failure_reason: errMsg.slice(0, 450),
        oauth_circuit_open_until: openUntilIso,
        last_cron_source: cronSource,
        recent_cron_events: prependCronEvent(state?.recent_cron_events, {
          at: nowIso,
          mode,
          source: cronSource,
          status: 'ERROR_OAUTH',
          detail: shouldOpenCircuit
            ? `Circuit Breaker aberto por 2h apos ${nextFailures} falhas: ${errMsg.slice(0, 140)}`
            : `Falha OAuth/Plano (${nextFailures}/${CIRCUIT_BREAKER_THRESHOLD}): ${errMsg.slice(0, 140)}`,
        }),
      });

      const lastAlertMs = state?.last_anomaly_alert_at
        ? new Date(state.last_anomaly_alert_at).getTime()
        : 0;
      if (
        shouldOpenCircuit &&
        (!lastAlertMs || Date.now() - lastAlertMs > ANOMALY_EMAIL_COOLDOWN_MS)
      ) {
        await updateMonitoringState({ last_anomaly_alert_at: nowIso });
        try {
          await sendMonitoringAnomalyAlert({
            title: 'Circuit Breaker Ativado: Integracao Conta Azul Pausada',
            severity: 'CRITICO',
            category: 'Integracao Conta Azul / Protecao Anti-Flood',
            description:
              'A sincronizacao automatica falhou 3 vezes consecutivas por erro de autenticacao OAuth2 ou restricao de plano (END_TRIAL). O Circuit Breaker pausou novos crons automaticos por 2 horas para impedir gravacao massiva de logs de erro no Supabase.',
            recommendedAction:
              'Reconecte o Conta Azul com a conta comercial ativa da Samppel em Configuracoes > Integracao e clique em Reiniciar Circuit Breaker em /monitoramento.',
            metrics: {
              'Falhas Consecutivas': nextFailures,
              'Pausado Automaticamente Ate': new Date(openUntilIso!).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
              }),
              'Ultimo Erro': errMsg.slice(0, 160),
            },
          });
        } catch (alertErr) {
          console.error('[CronSync] Falha ao enviar alerta do Circuit Breaker:', alertErr);
        }
      }
    } else {
      await updateMonitoringState({
        last_cron_source: cronSource,
        recent_cron_events: prependCronEvent(state?.recent_cron_events, {
          at: nowIso,
          mode,
          source: cronSource,
          status: 'ERROR',
          detail: errMsg.slice(0, 180),
        }),
      });
    }

    // Notifica por e-mail sobre falha caso seja o cron diario
    if (mode === 'full') {
      try {
        await sendDailyMorningReport({
          isHealthy: false,
          latencyMs: health.latencyMs,
          error: errMsg,
        });
      } catch (emailErr) {
        console.error('[CronSync] Erro secundario ao tentar avisar falha por e-mail:', emailErr);
      }
    }

    throw error;
  }
}

// Handles GET (cron call) and POST (manual UI trigger)
async function handleSync(request: NextRequest) {
  const authCheck = await requireCronOrAuth(request);
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: 'Nao autorizado. Forneca o cabecalho Authorization: Bearer <CRON_SECRET>.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const isSync = searchParams.get('sync') === 'true';
  const forceRun = searchParams.get('force') === 'true';
  const mode = (searchParams.get('mode') || 'incremental') as 'incremental' | 'full';
  const cronSource = detectCronSource(request, authCheck.reason);
  const isManualTrigger = isSync || forceRun || authCheck.reason === 'USER_SESSION';

  // Travas preventivas para execucoes automaticas de agendadores (Cooldown 12m + Circuit Breaker OAuth)
  if (!isManualTrigger && supabaseAdmin) {
    const state = await getMonitoringState();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    if (state?.oauth_circuit_open_until) {
      const openUntilMs = new Date(state.oauth_circuit_open_until).getTime();
      if (openUntilMs > nowMs) {
        await updateMonitoringState({
          last_blocked_cron_at: nowIso,
          last_blocked_cron_source: cronSource,
          recent_cron_events: prependCronEvent(state.recent_cron_events, {
            at: nowIso,
            mode,
            source: cronSource,
            status: 'BLOCKED_CIRCUIT',
            detail: `Ignorado pelo Circuit Breaker ativo ate ${new Date(openUntilMs).toLocaleTimeString('pt-BR')}`,
          }),
        });

        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'OAUTH_CIRCUIT_OPEN',
          openUntil: state.oauth_circuit_open_until,
          message:
            'Sincronizacao automatica pausada temporariamente pelo Circuit Breaker OAuth/Conta Azul para proteger o banco contra flood de logs.',
        });
      }
    }

    if (mode === 'incremental' && state?.last_incremental_cron_at) {
      const lastMs = new Date(state.last_incremental_cron_at).getTime();
      const elapsedMs = nowMs - lastMs;
      if (elapsedMs >= 0 && elapsedMs < COOLDOWN_INCREMENTAL_MS) {
        const elapsedMin = Math.max(1, Math.round(elapsedMs / 60000));
        await updateMonitoringState({
          duplicate_cron_blocked_count: Number(state.duplicate_cron_blocked_count || 0) + 1,
          last_blocked_cron_at: nowIso,
          last_blocked_cron_source: cronSource,
          recent_cron_events: prependCronEvent(state.recent_cron_events, {
            at: nowIso,
            mode,
            source: cronSource,
            status: 'BLOCKED_COOLDOWN',
            detail: `Bloqueado (duplicidade): ultimo cron incremental rodou ha ${elapsedMin} min`,
          }),
        });

        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'COOLDOWN_GUARD',
          elapsedMinutes: elapsedMin,
          message: `Sincronizacao incremental ignorada pela trava anti-duplicidade (executada ha ${elapsedMin} min; intervalo minimo: 12 min).`,
        });
      }
    }

    // Reserva imediatamente o timestamp de execucao incremental para evitar corrida entre dois crons simultaneos
    if (mode === 'incremental') {
      await updateMonitoringState({
        last_incremental_cron_at: nowIso,
        last_cron_source: cronSource,
      });
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Janela de busca padrao:
  // - Incremental (15 min): Janela movel retrospectiva de 4 horas
  // - Full (Diario): Janela padrao de 24 horas (desde ontem)
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const fourHoursAgoStr = fourHoursAgo.toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const defaultStart = mode === 'incremental' ? fourHoursAgoStr : yesterdayStr;
  const MIN_SYNC_DATE = '2026-09-01';
  const rawStartDate = searchParams.get('startDate') || defaultStart;
  const startDateStr = rawStartDate < MIN_SYNC_DATE ? MIN_SYNC_DATE : rawStartDate;
  const endDateStr = searchParams.get('endDate') || todayStr;

  // Se chamado de forma sincrona explicita (ex: teste ou UI manual que queira aguardar retorno completo)
  if (isSync) {
    try {
      const syncOutput = await performSync(tenantId, startDateStr, endDateStr, mode, cronSource);
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: `Sync completed successfully (${mode})`,
        ...syncOutput,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Falha ao processar a sincronizacao.' },
        { status: 500 }
      );
    }
  }

  // Execucao padrao em segundo plano via after() para resposta instantanea ao disparador
  after(async () => {
    try {
      await performSync(tenantId, startDateStr, endDateStr, mode, cronSource);
    } catch (err: any) {
      console.error(`[CronSync After Hook] Falha [${mode}]:`, err);
      if (mode === 'full') {
        await sendDatabaseDownAlert({
          error: err?.message || 'Falha na execucao em background do cron diario',
          source: 'Cron Diario (/api/sync/cron)',
        });
      }
    }
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    source: cronSource,
    message: `Sincronizacao iniciada com sucesso em segundo plano [Modo: ${mode}]`,
    mode,
    range: {
      startDate: startDateStr,
      endDate: endDateStr,
    },
  });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
