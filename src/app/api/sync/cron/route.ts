import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { SyncQueueService } from '@/services/sync_queue';
import { ContaAzulService } from '@/services/conta_azul';

export const maxDuration = 300; // 5 minutos de timeout na Vercel (Pro)
export const dynamic = 'force-dynamic';

async function performSync(tenantId: string, startDateStr: string, endDateStr: string) {
  console.log(`[CronSync] Iniciando sincronização para o tenant ${tenantId} (${startDateStr} até ${endDateStr})...`);
  try {
    // 1. Process outbox sync queue
    const queueService = new SyncQueueService(tenantId);
    const queueResult = await queueService.processQueue();
    console.log(`[CronSync] Fila processada:`, queueResult);

    // 2. Sincronizar catálogo de produtos do Conta Azul
    const caService = new ContaAzulService(tenantId);
    const productResult = await caService.importProducts().catch(err => {
      console.error('[CronSync] Erro ao sincronizar catálogo de produtos:', err);
      return { imported: 0, updated: 0, total: 0 };
    });
    console.log(`[CronSync] Catálogo de produtos sincronizado:`, productResult);

    // 3. Fetch new orders from Conta Azul
    const importResult = await caService.importOrders(startDateStr, endDateStr);
    console.log(`[CronSync] Importação concluída com sucesso:`, importResult);
    return { queueResult, productResult, importResult };
  } catch (error: any) {
    console.error('[CronSync] Erro durante a sincronização:', error);
    throw error;
  }
}

// Handles GET (cron call) and POST (manual UI trigger)
async function handleSync(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const isSync = searchParams.get('sync') === 'true';
  
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000); // Janela de 24 horas
  const MIN_SYNC_DATE = '2026-09-01';
  const rawStartDate = searchParams.get('startDate') || yesterday.toISOString().split('T')[0];
  const startDateStr = rawStartDate < MIN_SYNC_DATE ? MIN_SYNC_DATE : rawStartDate;
  const endDateStr = searchParams.get('endDate') || today.toISOString().split('T')[0];

  // Se chamado de forma síncrona explícita (ex: teste ou UI manual que queira aguardar retorno completo)
  if (isSync) {
    try {
      const { queueResult, importResult } = await performSync(tenantId, startDateStr, endDateStr);
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Sync completed successfully (synchronous)',
        queue: queueResult,
        import: importResult
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Falha ao processar a sincronização.' },
        { status: 500 }
      );
    }
  }

  // Execução padrão via Cron: responde instantaneamente com HTTP 200 para evitar timeout no serviço chamador (ex: cron-job.org)
  // e continua a execução da sincronização em background context seguro no servidor Next.js
  after(async () => {
    try {
      await performSync(tenantId, startDateStr, endDateStr);
    } catch (err) {
      console.error('[CronSync After Hook] Falha:', err);
    }
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'Sincronização iniciada com sucesso em segundo plano',
    mode: 'async_background',
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
