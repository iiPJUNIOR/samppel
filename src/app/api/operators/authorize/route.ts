import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCredential, hashCredential } from '@/lib/crypto';
import { supabaseAdmin, checkPinRateLimit, registerPinFailure, clearPinFailures } from '@/lib/serverAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultTenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { operatorId, authMethod, credential, newPin, targetStageId, currentStageId, tenantId } = body;

    if (!operatorId || !authMethod || !credential) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Proteção contra ataques de força bruta no PIN
    const rateCheck = checkPinRateLimit(operatorId);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        error: `Muitas tentativas consecutivas incorretas. Acesso bloqueado por segurança. Aguarde ${rateCheck.retryAfterSeconds}s.` 
      }, { status: 429 });
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
      // Para validar a senha do Supabase Auth, tentamos fazer sign-in temporário sem persistir sessão
      const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
      const { error: signInError } = await testClient.auth.signInWithPassword({
        email: operator.email,
        password: credential
      });
      isValid = !signInError;
    } else {
      return NextResponse.json({ error: 'Método de autenticação inválido.' }, { status: 400 });
    }

    if (!isValid) {
      registerPinFailure(operatorId);
      return NextResponse.json({ error: 'PIN ou Senha inválidos.' }, { status: 401 });
    }

    // Credencial correta: limpa histórico de falhas
    clearPinFailures(operatorId);

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

    // 5. Se o operador autenticou via Senha de Login e enviou novo PIN (ou ainda estava sem PIN na Produção), persiste o PIN agora
    let pinRegistered = false;
    if (authMethod === 'PASSWORD') {
      const trimmedNewPin = typeof newPin === 'string' ? newPin.trim() : '';
      if (!operator.pin && operator.role === 'Produção' && !trimmedNewPin) {
        return NextResponse.json({
          error: 'Informe um novo PIN numérico (4 a 6 dígitos) abaixo da senha para ativar seu PIN de fábrica.'
        }, { status: 400 });
      }
      if (trimmedNewPin) {
        if (!/^\d{4,6}$/.test(trimmedNewPin)) {
          return NextResponse.json({ error: 'O novo PIN deve conter de 4 a 6 dígitos numéricos.' }, { status: 400 });
        }
        const { error: pinUpdateErr } = await supabaseAdmin
          .from('profiles')
          .update({ pin: hashCredential(trimmedNewPin) })
          .eq('id', operator.id);

        if (pinUpdateErr) {
          return NextResponse.json({ error: 'Erro ao registrar novo PIN: ' + pinUpdateErr.message }, { status: 500 });
        }
        pinRegistered = true;
      }
    }

    return NextResponse.json({ 
      success: true, 
      pinRegistered,
      operator: { id: operator.id, name: operator.full_name } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
