import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashCredential } from '@/lib/crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || defaultTenantId;

    // Busca da tabela principal profiles com papel 'Produção'
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, status, force_password_change, created_at, profile_stage_permissions(stage_id, can_enter, can_exit)')
      .eq('tenant_id', tenantId)
      .eq('role', 'Produção')
      .order('full_name', { ascending: true });

    if (error) throw error;

    // Adapta os nomes dos campos para o frontend (full_name -> name)
    const operators = (data || []).map((p: any) => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      status: p.status || 'ATIVO',
      force_password_change: !!p.force_password_change,
      profile_stage_permissions: p.profile_stage_permissions || [],
      created_at: p.created_at
    }));

    return NextResponse.json({ data: operators });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, email, pin, password, tenantId } = body;

    if (!name || !email || !pin || !password) {
      return NextResponse.json({ error: 'Nome, Email, PIN e Senha são obrigatórios.' }, { status: 400 });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: 'O PIN deve conter de 4 a 6 dígitos numéricos.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve conter no mínimo 6 caracteres.' }, { status: 400 });
    }

    const tId = tenantId || defaultTenantId;
    const pinHash = hashCredential(pin);

    // 1. Criar o usuário no Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: name,
        role: 'Produção',
        tenant_id: tId
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar credenciais de autenticação.');

    // 2. Criar ou atualizar o registro de perfil correspondente
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        tenant_id: tId,
        full_name: name,
        role: 'Produção',
        email,
        pin: pinHash,
        status: 'ATIVO'
      })
      .select('id, full_name, email, status, created_at')
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({ 
      data: {
        id: profileData.id,
        name: profileData.full_name,
        email: profileData.email,
        status: profileData.status,
        created_at: profileData.created_at
      } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, status, force_password_change, role, is_factory_account } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (force_password_change !== undefined) updates.force_password_change = force_password_change;
    if (role !== undefined) updates.role = role;
    if (is_factory_account !== undefined) updates.is_factory_account = is_factory_account;

    // Se estiver definido como conta de fábrica, reseta as outras contas do mesmo tenant
    if (is_factory_account === true) {
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('id', id)
        .single();
        
      if (currentProfile?.tenant_id) {
        await supabaseAdmin
          .from('profiles')
          .update({ is_factory_account: false })
          .eq('tenant_id', currentProfile.tenant_id);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, full_name, status, force_password_change, role, is_factory_account')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      data: {
        id: data.id,
        name: data.full_name,
        status: data.status,
        force_password_change: data.force_password_change,
        role: data.role,
        is_factory_account: data.is_factory_account
      } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
