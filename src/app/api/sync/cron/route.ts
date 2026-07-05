import { NextRequest, NextResponse } from 'next/server';
import { SyncQueueService } from '@/services/sync_queue';
import { ContaAzulService } from '@/services/conta_azul';

// Handles GET (cron call) and POST (manual UI trigger)
async function handleSync(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  try {
    // 1. Process outbox sync queue
    const queueService = new SyncQueueService(tenantId);
    const queueResult = await queueService.processQueue();

    // 2. Fetch new orders from Conta Azul (run in background using setTimeout)
    const caService = new ContaAzulService(tenantId);
    const today = new Date();
    const yesterday = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    const startDateStr = searchParams.get('startDate') || yesterday.toISOString().split('T')[0];
    const endDateStr = searchParams.get('endDate') || today.toISOString().split('T')[0];
    
    // We do NOT await the promise here. We delegate it to setTimeout to run in background.
    setTimeout(() => {
      console.log(`Starting background cron sync for dates ${startDateStr} to ${endDateStr}...`);
      caService.importOrders(startDateStr, endDateStr)
        .then((res) => {
          console.log(`Background cron sync completed successfully for dates ${startDateStr} to ${endDateStr}:`, res);
        })
        .catch((err) => {
          console.error(`Background cron sync failed for dates ${startDateStr} to ${endDateStr}:`, err);
        });
    }, 50);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Background sync triggered successfully',
      queue: queueResult
    });
  } catch (error: any) {
    console.error('Error running background sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao processar a fila de sincronização.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
