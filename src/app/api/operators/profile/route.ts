import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashCredential, verifyCredential } from '@/lib/crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { operatorId, currentCredential, authMethod, name, newPin, newPassword, tenantId } = body;

    if (!operatorId || !currentCredential || !authMethod) {
      return NextResponse.json({ error: 'Operador e credencial atual são obrigatórios.' }, { status: 400 });
    }

    const tId = tenantId || defaultTenantId;

    // 1. Validar credenciais atuais
    const { data: operator, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', operatorId)
      .eq('tenant_id', tId)
      .single();

    if (error || !operator) {
      return NextResponse.json({ error: 'Operador não encontrado.' }, { status: 404 });
    }

    let isCurrentValid = false;
    if (authMethod === 'PIN') {
      if (!operator.pin) {
        return NextResponse.json({ error: 'Nenhum PIN cadastrado para verificação.' }, { status: 400 });
      }
      isCurrentValid = verifyCredential(currentCredential, operator.pin);
    } else {
      // Validar senha atual via login temporário
      const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
      const { error: signInError } = await testClient.auth.signInWithPassword({
        email: operator.email,
        password: currentCredential
      });
      isCurrentValid = !signInError;
    }

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Senha ou PIN atual incorreto.' }, { status: 401 });
    }

    // 2. Executar atualizações no Auth se necessário
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'A nova senha deve conter no mínimo 6 caracteres.' }, { status: 400 });
      }
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(operatorId, {
        password: newPassword
      });
      if (authUpdateError) throw authUpdateError;
    }

    // 3. Preparar e executar atualizações no profile
    const profileUpdates: any = {
      force_password_change: false
    };
    if (name && name.trim()) {
      profileUpdates.full_name = name.trim();
    }
    if (newPin) {
      if (!/^\d{4,6}$/.test(newPin)) {
        return NextResponse.json({ error: 'O novo PIN deve conter de 4 a 6 dígitos numéricos.' }, { status: 400 });
      }
      profileUpdates.pin = hashCredential(newPin);
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', operatorId);

      if (profileUpdateError) throw profileUpdateError;
    }

    // Retorna os dados atualizados
    const { data: updatedOp } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, status')
      .eq('id', operatorId)
      .single();

    if (!updatedOp) {
      throw new Error('Não foi possível carregar os dados atualizados do perfil.');
    }

    return NextResponse.json({ 
      success: true, 
      operator: {
        id: updatedOp.id,
        name: updatedOp.full_name,
        email: updatedOp.email,
        status: updatedOp.status
      } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
