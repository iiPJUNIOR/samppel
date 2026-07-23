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
    const { userId, email, password, accessToken, pin } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'A nova senha é obrigatória.' }, { status: 400 });
    }

    let targetUserId = userId;
    let targetEmail = email;

    // Se recebemos um accessToken (do hash da URL do convite), tenta obter o usuário pelo token
    if (!targetUserId && accessToken) {
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
        if (userData?.user) {
          targetUserId = userData.user.id;
          targetEmail = userData.user.email;
        }
      } catch (e) {
        console.warn('Aviso ao obter usuário pelo accessToken:', e);
      }
    }

    // Se ainda não veio o userId mas veio o email, buscar o ID do usuário no Supabase Auth
    if (!targetUserId && targetEmail) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const matched = (usersData?.users || []).find(u => u.email?.toLowerCase() === String(targetEmail).toLowerCase());
      if (matched) {
        targetUserId = matched.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Não foi possível identificar o usuário para atualização da senha. O link do convite pode ser inválido ou ter sido desativado.' }, { status: 400 });
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

    // 2. Remove a exigência de troca de senha no perfil Postgres e salva o PIN se fornecido
    const profileUpdates: any = {
      force_password_change: false
    };

    if (pin) {
      const { hashCredential } = await import('@/lib/crypto');
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json({ error: 'O PIN deve conter de 4 a 6 dígitos numéricos.' }, { status: 400 });
      }
      profileUpdates.pin = hashCredential(pin);
    }

    await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', targetUserId);

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso no servidor!' });
  } catch (err: any) {
    console.error('Erro no endpoint set-invited-password:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
