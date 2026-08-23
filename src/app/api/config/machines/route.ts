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
      .from('production_machines')
      .select('*')
      .eq('tenant_id', defaultTenantId)
      .order('name', { ascending: true });

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
    const body = await request.json();
    const tenantId = body.tenant_id || defaultTenantId;
    const { name, sector, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome da máquina é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('production_machines')
      .insert([{
        tenant_id: tenantId,
        name: name.trim(),
        sector: sector || 'Impressão',
        status: status || 'ATIVO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, name, sector, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da máquina é obrigatório.' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (sector !== undefined) updates.sector = sector;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from('production_machines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da máquina é obrigatório.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('production_machines')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
