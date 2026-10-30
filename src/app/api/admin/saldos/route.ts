import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, supabaseAdmin } from '@/lib/serverAuth';

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Servico administrativo do Supabase indisponivel.' },
      { status: 500 }
    );
  }

  try {
    const tenantId = auth.profile?.tenant_id || defaultTenantId;
    const adminName = auth.profile?.full_name || auth.user?.email || 'Administrador';
    const body = await request.json();
    const { action, creditId, reason } = body || {};

    if (!creditId || typeof creditId !== 'string') {
      return NextResponse.json({ error: 'ID do saldo nao informado.' }, { status: 400 });
    }

    if (action !== 'CANCEL' && action !== 'DELETE') {
      return NextResponse.json({ error: 'Acao invalida. Use CANCEL ou DELETE.' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('customer_stock_credits')
      .select('id, notes, status')
      .eq('id', creditId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Registro de saldo nao encontrado.' }, { status: 404 });
    }

    if (action === 'CANCEL') {
      const dateStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const cleanReason = typeof reason === 'string' && reason.trim() ? `: ${reason.trim()}` : '';
      const auditTag = `[Cancelado por ${adminName} em ${dateStr}${cleanReason}]`;
      const updatedNotes = existing.notes ? `${existing.notes} | ${auditTag}` : auditTag;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('customer_stock_credits')
        .update({
          status: 'CANCELADO',
          remaining_quantity: 0,
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', creditId)
        .eq('tenant_id', tenantId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Saldo cancelado com sucesso e mantido no historico auditavel.',
        data: updated
      });
    }

    // action === 'DELETE'
    const { error: deleteError } = await supabaseAdmin
      .from('customer_stock_credits')
      .delete()
      .eq('id', creditId)
      .eq('tenant_id', tenantId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Registro de saldo excluido permanentemente.'
    });
  } catch (err: any) {
    console.error('[API Admin Saldos] Erro ao gerenciar saldo:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao processar saldo.' },
      { status: 500 }
    );
  }
}
