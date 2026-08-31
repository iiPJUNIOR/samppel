import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';
import { supabase, supabaseAdmin } from '@/services/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('CONTA AZUL WEBHOOK RECEIVED:', JSON.stringify(body, null, 2));

    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) {
      console.error('Supabase client not initialized');
      return NextResponse.json({ success: false, error: 'Database client not initialized' }, { status: 500 });
    }

    // A Conta Azul envia um webhook com a estrutura:
    // { "event": "venda.criada", "entity": "venda", "entity_id": "..." }
    const saleId = body.entity_id || body.id || body.venda_id;
    const event = body.event || 'unknown';

    if (!saleId) {
      console.warn('Webhook received without entity_id / saleId:', body);
      return NextResponse.json({ success: false, message: 'entity_id not provided' }, { status: 400 });
    }

    const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'; // Tenant ID default do Samppel
    const service = new ContaAzulService(tenantId);

    // Salvamos um log da notificação recebida
    try {
      await dbClient.from('conta_azul_integration_logs').insert([{
        tenant_id: tenantId,
        action: `WEBHOOK_${event.toUpperCase()}`,
        status: 'SUCCESS',
        payload: body,
        response: { message: 'Webhook received. Starting single order sync.' }
      }]);
    } catch (logErr) {
      console.error('Error logging webhook receipt:', logErr);
    }

    // Executamos a importação do pedido
    try {
      console.log(`Starting real-time sync for sale ${saleId}...`);
      const result = await service.importSingleOrder(saleId);
      console.log(`Real-time sync completed for sale ${saleId}:`, result);
      
      // Log do sucesso da importação
      await dbClient.from('conta_azul_integration_logs').insert([{
        tenant_id: tenantId,
        action: `SYNC_SINGLE_ORDER_${saleId}`,
        status: 'SUCCESS',
        payload: { saleId },
        response: result
      }]);
    } catch (syncErr: any) {
      console.error(`Error during single order sync for sale ${saleId}:`, syncErr);
      // Log do erro da importação
      await dbClient.from('conta_azul_integration_logs').insert([{
        tenant_id: tenantId,
        action: `SYNC_SINGLE_ORDER_${saleId}`,
        status: 'ERROR',
        payload: { saleId },
        error_message: syncErr.message || 'Error syncing single order'
      }]);
    }

    // Retorna com sucesso para a Conta Azul
    return NextResponse.json({ success: true, message: 'Notification processed successfully' });
  } catch (err: any) {
    console.error('CRITICAL WEBHOOK ERROR:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
