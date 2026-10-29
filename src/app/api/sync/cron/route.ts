import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { SyncQueueService } from '@/services/sync_queue';
import { ContaAzulService } from '@/services/conta_azul';
import { requireCronOrAuth } from '@/lib/serverAuth';
import { checkSupabaseHealth } from '@/lib/supabaseHealth';
import { sendDatabaseDownAlert, sendDailyMorningReport } from '@/services/emailService';

export const maxDuration = 300; // 5 minutos de timeout na Vercel (Pro)
export const dynamic = 'force-dynamic';

async function performSync(tenantId: string, startDateStr: string, endDateStr: string, mode: 'incremental' | 'full' = 'incremental') {
  console.log(`[CronSync] Iniciando sincronização [MODO: ${mode.toUpperCase()}] para o tenant ${tenantId} (${startDateStr} até ${endDateStr})...`);
  
  // 1. Verificação prévia da saúde e conectividade do Supabase
  const health = await checkSupabaseHealth({
    sendAlertIfDown: true,
    source: `Cron ${mode === 'incremental' ? '15 Minutos' : 'Diário'} (/api/sync/cron)`,
    forceAlert: mode === 'full' // Força alerta no cron diário se o banco estiver down
  });

  if (!health.ok) {
    const errorMsg = `Supabase inacessível ou pausado durante o cron: ${health.error}`;
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

    // 3. Sincronizar catálogo de produtos: APENAS no modo FULL (evita centenas de queries desnecessárias a cada 15 min)
    if (mode === 'full') {
      productResult = await caService.importProducts().catch(err => {
        console.error('[CronSync] Erro ao sincronizar catálogo de produtos:', err);
        return { imported: 0, updated: 0, total: 0 };
      });
      console.log(`[CronSync] Catálogo de produtos sincronizado:`, productResult);
    } else {
      console.log(`[CronSync] Modo incremental: importação de produtos pulada para poupar recursos.`);
    }

    // 4. Fetch orders from Conta Azul no período estipulado
    const importResult = await caService.importOrders(startDateStr, endDateStr);
    console.log(`[CronSync] Importação concluída com sucesso:`, importResult);

    // 5. Limpeza de logs antigos: apenas no modo FULL para evitar overhead contínuo no Postgres
    if (mode === 'full') {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { getDbClient } = await import('@/services/supabaseClient');
        await getDbClient()
          .from('conta_azul_integration_logs')
          .delete()
          .lt('created_at', sevenDaysAgo);
      } catch (cleanErr) {
        console.warn('[CronSync] Aviso na limpeza de logs antigos:', cleanErr);
      }

      // 6. Enviar relatório diário por e-mail: APENAS no modo FULL
      try {
        await sendDailyMorningReport({
          isHealthy: true,
          latencyMs: health.latencyMs,
          syncQueuePending: (queueResult as any)?.pending ?? queueResult?.failures ?? 0,
          importResult
        });
        console.log('[CronSync] Relatório matinal enviado por e-mail com sucesso.');
      } catch (emailErr) {
        console.warn('[CronSync] Falha ao enviar e-mail de relatório matinal:', emailErr);
      }
    }

    return { queueResult, productResult, importResult, mode };
  } catch (error: any) {
    console.error(`[CronSync] Erro durante a sincronização [MODO: ${mode}]:`, error);
    
    // Notifica por e-mail sobre falha caso seja o cron diário ou erro crítico
    if (mode === 'full') {
      try {
        await sendDailyMorningReport({
          isHealthy: false,
          latencyMs: health.latencyMs,
          error: error?.message || 'Falha desconhecida durante a execução do cron diário'
        });
      } catch (emailErr) {
        console.error('[CronSync] Erro secundário ao tentar avisar falha por e-mail:', emailErr);
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
      { error: 'Não autorizado. Forneça o cabeçalho Authorization: Bearer <CRON_SECRET>.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const isSync = searchParams.get('sync') === 'true';
  const mode = (searchParams.get('mode') || 'incremental') as 'incremental' | 'full';
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Janela de busca padrão:
  // - Incremental (15 min): Janela móvel retrospectiva de 4 horas
  // - Full (Diário): Janela padrão de 24 horas (desde ontem)
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const fourHoursAgoStr = fourHoursAgo.toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const defaultStart = mode === 'incremental' ? fourHoursAgoStr : yesterdayStr;
  const MIN_SYNC_DATE = '2026-09-01';
  const rawStartDate = searchParams.get('startDate') || defaultStart;
  const startDateStr = rawStartDate < MIN_SYNC_DATE ? MIN_SYNC_DATE : rawStartDate;
  const endDateStr = searchParams.get('endDate') || todayStr;

  // Se chamado de forma síncrona explícita (ex: teste ou UI manual que queira aguardar retorno completo)
  if (isSync) {
    try {
      const syncOutput = await performSync(tenantId, startDateStr, endDateStr, mode);
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: `Sync completed successfully (${mode})`,
        ...syncOutput
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Falha ao processar a sincronização.' },
        { status: 500 }
      );
    }
  }

  // Execução padrão em segundo plano via after() para resposta instantânea ao disparador
  after(async () => {
    try {
      await performSync(tenantId, startDateStr, endDateStr, mode);
    } catch (err: any) {
      console.error(`[CronSync After Hook] Falha [${mode}]:`, err);
      if (mode === 'full') {
        await sendDatabaseDownAlert({
          error: err?.message || 'Falha na execução em background do cron diário',
          source: 'Cron Diário (/api/sync/cron)'
        });
      }
    }
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: `Sincronização iniciada com sucesso em segundo plano [Modo: ${mode}]`,
    mode,
    range: {
      startDate: startDateStr,
      endDate: endDateStr
    }
  });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
