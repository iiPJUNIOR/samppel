import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, supabaseAdmin } from '@/lib/serverAuth';

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Servico administrativo do Supabase indisponivel (SUPABASE_SERVICE_ROLE_KEY ausente).' },
      { status: 500 }
    );
  }

  try {
    const tenantId = auth.profile?.tenant_id || defaultTenantId;
    const { data: config, error } = await supabaseAdmin
      .from('conta_azul_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;

    const isConnected = !!config?.access_token && new Date(config.expires_at).getTime() > Date.now();
    const client_id = config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const has_secret = !!config?.client_secret || !!process.env.CONTA_AZUL_CLIENT_SECRET;

    return NextResponse.json({
      client_id,
      has_secret,
      is_connected: isConnected,
      expires_at: config?.expires_at || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Servico administrativo do Supabase indisponivel (SUPABASE_SERVICE_ROLE_KEY ausente).' },
      { status: 500 }
    );
  }

  try {
    const tenantId = auth.profile?.tenant_id || defaultTenantId;
    const { client_id, client_secret } = await request.json();

    const { data: existing } = await supabaseAdmin
      .from('conta_azul_config')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const updates: any = {
      client_id: typeof client_id === 'string' ? client_id.trim() : client_id,
      updated_at: new Date().toISOString()
    };
    if (client_secret) {
      updates.client_secret = typeof client_secret === 'string' ? client_secret.trim() : client_secret;
    }

    let error;
    if (existing) {
      const res = await supabaseAdmin
        .from('conta_azul_config')
        .update(updates)
        .eq('tenant_id', tenantId);
      error = res.error;
    } else {
      const res = await supabaseAdmin
        .from('conta_azul_config')
        .insert([{ tenant_id: tenantId, ...updates }]);
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
