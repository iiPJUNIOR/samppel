import { NextRequest, NextResponse } from 'next/server';
import { SyncQueueService } from '@/services/sync_queue';

// Handles GET (cron call) and POST (manual UI trigger)
async function handleSync(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  // Security token check (optional for cron, e.g. Authorization header)
  // In production, you would check: request.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
  
  try {
    const queueService = new SyncQueueService(tenantId);
    const result = await queueService.processQueue();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
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
