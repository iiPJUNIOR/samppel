import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ client_id: '', has_secret: false, is_connected: false });
  }

  try {
    const { data: config, error } = await supabaseAdmin
      .from('conta_azul_config')
      .select('*')
      .eq('tenant_id', defaultTenantId)
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
  if (!supabaseAdmin) {
    return NextResponse.json({ success: true }); // Sucesso simulado
  }

  try {
    const { client_id, client_secret } = await request.json();

    const { data: existing } = await supabaseAdmin
      .from('conta_azul_config')
      .select('id')
      .eq('tenant_id', defaultTenantId)
      .maybeSingle();

    const updates: any = { client_id };
    if (client_secret) {
      updates.client_secret = client_secret;
    }

    let error;
    if (existing) {
      const res = await supabaseAdmin
        .from('conta_azul_config')
        .update(updates)
        .eq('tenant_id', defaultTenantId);
      error = res.error;
    } else {
      const res = await supabaseAdmin
        .from('conta_azul_config')
        .insert([{ tenant_id: defaultTenantId, ...updates }]);
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
