import { NextRequest, NextResponse } from 'next/server';
import { hashCredential } from '@/lib/crypto';
import { supabaseAdmin, requireAdmin, requireAuth, getAuthenticatedUser } from '@/lib/serverAuth';

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || defaultTenantId;

    // Busca da tabela principal profiles com todos os operadores e usuarios do tenant
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, pin, status, force_password_change, allowed_modules, can_delete_any_order, created_at, profile_stage_permissions(stage_id, can_enter, can_exit)')
      .eq('tenant_id', tenantId)
      .in('role', ['Produção', 'Fábrica', 'Administrador', 'Supervisão', 'Vendedor', 'Comercial', 'Financeiro', 'Estoque', 'Expedição'])
      .order('full_name', { ascending: true });

    if (error) throw error;

    // Adapta os nomes dos campos para o frontend (full_name -> name, has_pin booleano seguro)
    const operators = (data || []).map((p: any) => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      role: p.role,
      status: p.status || 'ATIVO',
      has_pin: !!p.pin,
      force_password_change: !!p.force_password_change,
      allowed_modules: p.allowed_modules || ['pedidos', 'produtos', 'financeiro', 'clientes', 'relatorios', 'dashboard'],
      can_delete_any_order: !!p.can_delete_any_order,
      profile_stage_permissions: p.profile_stage_permissions || [],
      created_at: p.created_at
    }));

    return NextResponse.json({ data: operators });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

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
    const { id, status, force_password_change, role, is_factory_account, pin, allowed_modules, can_delete_any_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (force_password_change !== undefined) updates.force_password_change = force_password_change;
    if (role !== undefined) updates.role = role;
    if (is_factory_account !== undefined) updates.is_factory_account = is_factory_account;
    if (allowed_modules !== undefined) {
      updates.allowed_modules = Array.isArray(allowed_modules) ? allowed_modules : [];
    }

    if (can_delete_any_order !== undefined) {
      // Validar que apenas junior.8350i@gmail.com pode alterar esta permissão
      const authUser = await getAuthenticatedUser(request);
      const requesterEmail = authUser.user?.email?.toLowerCase().trim();
      if (requesterEmail !== 'junior.8350i@gmail.com') {
        return NextResponse.json({ 
          error: 'Apenas junior.8350i@gmail.com possui autorização para conceder ou revogar a autonomia total de exclusão de pedidos.' 
        }, { status: 403 });
      }
      updates.can_delete_any_order = Boolean(can_delete_any_order);
    }

    if (pin !== undefined) {
      if (pin && typeof pin === 'string') {
        const trimmedPin = pin.trim();
        if (!/^\d{4,6}$/.test(trimmedPin)) {
          return NextResponse.json({ error: 'O PIN deve conter de 4 a 6 dígitos numéricos.' }, { status: 400 });
        }
        updates.pin = hashCredential(trimmedPin);
      } else {
        updates.pin = null;
      }
    }

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
      .select('id, full_name, status, force_password_change, role, is_factory_account, allowed_modules, can_delete_any_order')
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      data: {
        id: data.id,
        name: data.full_name,
        status: data.status,
        force_password_change: data.force_password_change,
        role: data.role,
        is_factory_account: data.is_factory_account,
        allowed_modules: data.allowed_modules || [],
        can_delete_any_order: !!data.can_delete_any_order
      } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
