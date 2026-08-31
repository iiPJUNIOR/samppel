import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCredential } from '@/lib/crypto';

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
    const { operatorId, authMethod, credential, targetStageId, currentStageId, tenantId } = body;

    if (!operatorId || !authMethod || !credential) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const tId = tenantId || defaultTenantId;

    // Busca o perfil correspondente na tabela profiles
    const { data: operator, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', operatorId)
      .eq('tenant_id', tId)
      .single();

    if (error || !operator) {
      return NextResponse.json({ error: 'Operador não encontrado.' }, { status: 404 });
    }

    if (operator.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Este operador está desativado.' }, { status: 403 });
    }

    if (operator.force_password_change) {
      return NextResponse.json({ 
        error: 'FORCE_PASSWORD_CHANGE', 
        message: 'Troca de senha obrigatória!' 
      }, { status: 400 });
    }

    let isValid = false;
    if (authMethod === 'PIN') {
      if (!operator.pin) {
        return NextResponse.json({ error: 'Este operador não possui PIN cadastrado.' }, { status: 400 });
      }
      isValid = verifyCredential(credential, operator.pin);
    } else if (authMethod === 'PASSWORD') {
      // Para validar a senha do Supabase Auth, tentamos fazer sign-in temporário
      const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
      const { error: signInError } = await testClient.auth.signInWithPassword({
        email: operator.email,
        password: credential
      });
      isValid = !signInError;
    } else {
      return NextResponse.json({ error: 'Método de autenticação inválido.' }, { status: 400 });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'PIN ou Senha inválidos.' }, { status: 401 });
    }

    // 4. Validar permissões de etapa no banco para este operador se for movimentação Kanban
    // Se o operador for um Administrador, ele tem permissão total por padrão
    if (operator.role !== 'Administrador') {
      if (targetStageId) {
        const { data: perm } = await supabaseAdmin
          .from('profile_stage_permissions')
          .select('can_enter')
          .eq('profile_id', operatorId)
          .eq('stage_id', targetStageId)
          .maybeSingle();

        if (!perm || !perm.can_enter) {
          return NextResponse.json({ error: 'Você não tem liberação para colocar itens nesta etapa.' }, { status: 403 });
        }
      }

      if (currentStageId) {
        const { data: perm } = await supabaseAdmin
          .from('profile_stage_permissions')
          .select('can_exit')
          .eq('profile_id', operatorId)
          .eq('stage_id', currentStageId)
          .maybeSingle();

        if (!perm || !perm.can_exit) {
          return NextResponse.json({ error: 'Você não tem liberação para retirar itens desta etapa.' }, { status: 403 });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      operator: { id: operator.id, name: operator.full_name } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
