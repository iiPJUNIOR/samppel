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
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || defaultTenantId;

    // Busca os usuários do Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // Filtra apenas os usuários convidados que pertencem ao tenantId atual
    const invitedUsers = (authData?.users || []).filter(u => {
      const uTenant = u.user_metadata?.tenant_id || defaultTenantId;
      // Usuário convidado possui data de convite e ainda não confirmou o e-mail
      return uTenant === tenantId && u.invited_at && (!u.confirmed_at && !u.email_confirmed_at);
    }).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || u.email?.split('@')[0],
      role: u.user_metadata?.role || 'Vendedor',
      status: 'CONVIDADO',
      created_at: u.invited_at || u.created_at
    }));

    return NextResponse.json({ data: invitedUsers });
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
    const { email, full_name, role, tenantId } = body;

    if (!email) {
      return NextResponse.json({ error: 'O e-mail é obrigatório.' }, { status: 400 });
    }

    const validRoles = ['Administrador', 'Produção', 'Fábrica', 'Vendedor'];
    const selectedRole = validRoles.includes(role) ? role : 'Vendedor';
    const tId = tenantId || defaultTenantId;
    const name = full_name || email.split('@')[0];

    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const origin = request.headers.get('origin') || (host ? `${protocol}://${host}` : null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'https://portalsamppel.vercel.app';
    const redirectTo = `${appUrl}/redefinir-senha?invite=true`;


    // 1. Envia o convite por e-mail via Supabase Auth Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: name,
        role: selectedRole,
        tenant_id: tId
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Não foi possível gerar o convite para o usuário.');
    }

    // 2. Garante registro no banco com status 'ATIVO' (respeitando a constraint Postgres do profiles)
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        tenant_id: tId,
        full_name: name,
        role: selectedRole,
        email: email,
        status: 'ATIVO',
        force_password_change: true,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      message: 'Convite enviado com sucesso!',
      data: {
        user: authData.user,
        profile: {
          id: authData.user.id,
          full_name: name,
          email,
          role: selectedRole,
          status: 'CONVIDADO',
          created_at: new Date().toISOString()
        }
      }
    });
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
    const { id, email, full_name, role, tenantId } = body;

    if (!email) {
      return NextResponse.json({ error: 'O e-mail é obrigatório.' }, { status: 400 });
    }

    const tId = tenantId || defaultTenantId;
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const origin = request.headers.get('origin') || (host ? `${protocol}://${host}` : null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'https://portalsamppel.vercel.app';
    const redirectTo = `${appUrl}/redefinir-senha?invite=true`;


    // Se o usuário já existia em estado pendente, removemos o registro anterior para renovar a chave/token de convite limpo
    if (id) {
      await supabaseAdmin.from('profiles').delete().eq('id', id);
      await supabaseAdmin.auth.admin.deleteUser(id);
    } else {
      // Procura se existe usuário pendente com esse email
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = (usersData?.users || []).find(u => u.email === email);
      if (existingUser && !existingUser.confirmed_at) {
        await supabaseAdmin.from('profiles').delete().eq('id', existingUser.id);
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      }
    }

    // Re-envia o convite renovando totalmente o link e o e-mail de convite
    const validRoles = ['Administrador', 'Produção', 'Fábrica', 'Vendedor'];
    const selectedRole = validRoles.includes(role) ? role : 'Vendedor';
    const name = full_name || email.split('@')[0];

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: name,
        role: selectedRole,
        tenant_id: tId
      }
    });

    if (authError) throw authError;

    // Atualiza o perfil correspondente
    if (authData?.user) {
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          tenant_id: tId,
          full_name: name,
          role: selectedRole,
          email: email,
          status: 'ATIVO',
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({ message: 'Convite renovado e reenviado com sucesso!' });
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
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    // 1. Remove da tabela profiles
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 2. Remove do Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) console.warn('Aviso ao remover auth user:', authError.message);

    return NextResponse.json({ message: 'Convite cancelado com sucesso.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
