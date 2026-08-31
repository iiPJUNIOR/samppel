import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ContaAzulService } from '@/services/conta_azul';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase admin client not initialized.' }), { status: 500 });
  }

  try {
    const { orderId, orderNumber, tenantId: reqTenantId, userRole } = await request.json();
    const tenantId = reqTenantId || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

    if (!orderId && !orderNumber) {
      return new Response(JSON.stringify({ error: 'orderId ou orderNumber é obrigatório' }), { status: 400 });
    }

    let finalContaAzulId = '';

    if (orderId) {
      // Buscar o pedido para obter o conta_azul_id
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('id, conta_azul_id')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        return new Response(JSON.stringify({ error: 'Pedido não encontrado no banco local.' }), { status: 404 });
      }

      if (!order.conta_azul_id) {
        return new Response(JSON.stringify({ error: 'Este pedido não possui um ID do Conta Azul vinculado.' }), { status: 400 });
      }

      finalContaAzulId = order.conta_azul_id;
    } else if (orderNumber) {
      const cleanNumber = String(orderNumber).replace(/\D/g, '');
      if (!cleanNumber) {
        return new Response(JSON.stringify({ error: 'Número de pedido inválido.' }), { status: 400 });
      }

      // 1. Tentar ver se já temos esse pedido no banco local
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('conta_azul_id')
        .eq('tenant_id', tenantId)
        .or(`pv_number.eq.PV-${cleanNumber},pv_number.eq.${cleanNumber}`)
        .maybeSingle();

      if (existingOrder && existingOrder.conta_azul_id) {
        finalContaAzulId = existingOrder.conta_azul_id;
      } else {
        // Bloquear importação de novos pedidos para usuários de Produção ou Fábrica
        if (userRole === 'Produção' || userRole === 'Fábrica') {
          return new Response(JSON.stringify({ error: 'Operadores de Produção não têm permissão para importar novos pedidos.' }), { status: 403 });
        }

        // 2. Se não tem no banco local, buscar na API do Conta Azul pelo número
        try {
          const service = new ContaAzulService(tenantId);
          finalContaAzulId = await service.getSaleIdByNumber(cleanNumber);
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Pedido não encontrado no Conta Azul.' }), { status: 400 });
        }
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (step: string, progress: number) => {
          controller.enqueue(encoder.encode(JSON.stringify({ step, progress }) + '\n'));
        };

        try {
          const service = new ContaAzulService(tenantId);
          const result = await service.importSingleOrder(finalContaAzulId, sendProgress);
          controller.enqueue(encoder.encode(JSON.stringify({ success: true, result }) + '\n'));
        } catch (err: any) {
          console.error('Erro na API de importação individual:', err);
          controller.enqueue(encoder.encode(JSON.stringify({ success: false, error: err.message || 'Erro ao sincronizar pedido.' }) + '\n'));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro interno.' }), { status: 500 });
  }
}
