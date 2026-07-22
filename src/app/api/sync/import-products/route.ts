import { NextRequest } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  let userRole = '';
  try {
    const body = await request.json();
    userRole = body.userRole || '';
  } catch (e) {
    // Ignorar se a requisição não tiver body
  }

  if (userRole === 'Produção' || userRole === 'Fábrica') {
    return new Response(JSON.stringify({ error: 'Operadores de Produção não têm permissão para sincronizar produtos.' }), { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: string, progress: number) => {
        controller.enqueue(encoder.encode(JSON.stringify({ step, progress }) + '\n'));
      };

      try {
        const service = new ContaAzulService(tenantId);
        const result = await service.importProducts(sendProgress);
        controller.enqueue(encoder.encode(JSON.stringify({ success: true, ...result }) + '\n'));
      } catch (err: any) {
        console.error('Erro na API de importação de produtos:', err);
        controller.enqueue(encoder.encode(JSON.stringify({ success: false, error: err.message || 'Erro ao importar produtos.' }) + '\n'));
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
}
