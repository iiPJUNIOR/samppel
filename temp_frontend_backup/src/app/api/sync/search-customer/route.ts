import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const document = searchParams.get('document') || '';
  const name = searchParams.get('name') || '';

  if (!document && !name) {
    return NextResponse.json({ success: false, error: 'Forneça o documento (CNPJ/CPF) ou nome para busca.' }, { status: 400 });
  }

  const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  const service = new ContaAzulService(tenantId);

  try {
    const customerData = await service.findPessoaOnContaAzul({
      documento: document || undefined,
      busca: name || undefined
    });

    if (!customerData) {
      return NextResponse.json({ success: true, found: false, message: 'Nenhum cliente encontrado no Conta Azul com esses dados.' });
    }

    return NextResponse.json({
      success: true,
      found: true,
      customer: customerData
    });
  } catch (err: any) {
    console.error('Error searching customer on Conta Azul:', err);
    return NextResponse.json({ success: false, error: err.message || 'Erro ao buscar cliente no Conta Azul.' }, { status: 500 });
  }
}
