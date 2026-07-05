import { NextRequest } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: string, progress: number) => {
        controller.enqueue(encoder.encode(JSON.stringify({ step, progress }) + '\n'));
      };

      try {
        const service = new ContaAzulService(tenantId);
        const result = await service.importCustomers(sendProgress);
        controller.enqueue(encoder.encode(JSON.stringify({ success: true, ...result }) + '\n'));
      } catch (err: any) {
        console.error('Erro na API de importacao de clientes:', err);
        controller.enqueue(encoder.encode(JSON.stringify({ success: false, error: err.message || 'Erro ao importar clientes.' }) + '\n'));
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
