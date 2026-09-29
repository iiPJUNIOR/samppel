import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

const DEFAULT_TENANT_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const id = searchParams.get('id') || null;
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10), 1), 100);

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Serviço de banco de dados administrativo não configurado.' 
      }, { status: 500 });
    }

    // Executa a função RPC corporativa no PostgreSQL com unaccent, trigram e tokenização
    const { data, error } = await supabaseAdmin.rpc('search_customers_enterprise', {
      p_tenant_id: tenantId,
      p_query: q,
      p_customer_id: id,
      p_limit: limit
    });

    if (error) {
      console.error('Erro ao executar busca corporativa de clientes:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Erro ao buscar clientes.' 
      }, { status: 500 });
    }

    const customers = data || [];

    return NextResponse.json({
      success: true,
      data: customers,
      customer: id && customers.length > 0 ? customers[0] : null,
      total: customers.length
    });
  } catch (err: any) {
    console.error('Exceção inesperada na rota de busca de clientes:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Erro interno do servidor.' 
    }, { status: 500 });
  }
}
