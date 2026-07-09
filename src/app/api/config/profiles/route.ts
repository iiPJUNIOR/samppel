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
    return NextResponse.json({ data: [], error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, profile_stage_permissions(stage_id, can_enter, can_exit)')
      .eq('tenant_id', defaultTenantId)
      .order('full_name');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  try {
    const { profileId, stageId, canEnter, canExit } = await request.json();

    if (!profileId || !stageId) {
      return NextResponse.json({ error: 'Parâmetros profileId e stageId são obrigatórios.' }, { status: 400 });
    }

    if (!canEnter && !canExit) {
      const { error } = await supabaseAdmin
        .from('profile_stage_permissions')
        .delete()
        .eq('profile_id', profileId)
        .eq('stage_id', stageId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('profile_stage_permissions')
      .upsert({
        profile_id: profileId,
        stage_id: stageId,
        can_enter: canEnter,
        can_exit: canExit
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
