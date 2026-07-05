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

    // 2. Fetch new orders from Conta Azul (last 48 hours for speed and safety)
    let importResult: any = null;
    try {
      const caService = new ContaAzulService(tenantId);
      const today = new Date();
      const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      
      const startDateStr = yesterday.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      importResult = await caService.importOrders(startDateStr, endDateStr);
    } catch (importErr: any) {
      console.error('Error executing auto order import during cron:', importErr);
      importResult = { success: false, error: importErr.message };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      queue: queueResult,
      import: importResult
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
