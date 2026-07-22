import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  try {
    const { userId, email, password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'A nova senha é obrigatória.' }, { status: 400 });
    }

    let targetUserId = userId;

    // Se não veio o userId mas veio o email, buscar o ID do usuário no Supabase Auth
    if (!targetUserId && email) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const matched = (usersData?.users || []).find(u => u.email?.toLowerCase() === String(email).toLowerCase());
      if (matched) {
        targetUserId = matched.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário para atualização da senha.' }, { status: 400 });
    }

    // 1. Atualiza a senha no Supabase Auth via Admin API (imune a falhas de Auth Session client-side)
    const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: password,
      email_confirm: true
    });

    if (updateAuthErr) {
      console.error('Erro ao atualizar senha no Supabase Auth Admin:', updateAuthErr);
      return NextResponse.json({ error: updateAuthErr.message }, { status: 500 });
    }

    // 2. Remove a exigência de troca de senha no perfil Postgres
    await supabaseAdmin
      .from('profiles')
      .update({ force_password_change: false })
      .eq('id', targetUserId);

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso no servidor!' });
  } catch (err: any) {
    console.error('Erro no endpoint set-invited-password:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
