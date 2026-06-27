import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';

// Aciona a importacao de pedidos do Conta Azul para o banco de dados local
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  try {
    const service = new ContaAzulService(tenantId);
    const result = await service.importOrders();

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Erro na API de importacao de pedidos:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao importar pedidos.' },
      { status: 500 }
    );
  }
}
