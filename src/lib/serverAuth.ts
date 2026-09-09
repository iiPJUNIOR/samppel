import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Rate limiting simples em memória para PINs de operadores (máximo 5 falhas por operador a cada 5 minutos)
const pinAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkPinRateLimit(operatorId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = pinAttempts.get(operatorId);

  if (record && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function registerPinFailure(operatorId: string): void {
  const now = Date.now();
  const record = pinAttempts.get(operatorId) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 minutos de bloqueio
    record.count = 0;
  }

  pinAttempts.set(operatorId, record);
}

export function clearPinFailures(operatorId: string): void {
  pinAttempts.delete(operatorId);
}

/**
 * Extrai o token JWT da requisição (header Authorization: Bearer <token>)
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Valida se o chamador possui uma sessão ativa do Supabase Auth
 */
export async function getAuthenticatedUser(request: NextRequest) {
  if (!supabaseAdmin) {
    return { user: null, error: 'Serviço de autenticação não inicializado.' };
  }

  const token = extractBearerToken(request);
  if (!token) {
    return { user: null, error: 'Token de autenticação não fornecido.' };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: 'Sessão inválida ou expirada.' };
  }

  return { user, error: null };
}

/**
 * Exige que a requisição seja realizada por um usuário autenticado com perfil Administrador
 */
export async function requireAdmin(request: NextRequest): Promise<{ authorized: true; user: any; profile: any } | { authorized: false; response: NextResponse }> {
  const { user, error } = await getAuthenticatedUser(request);

  if (error || !user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: error || 'Não autorizado.' }, { status: 401 })
    };
  }

  const { data: profile, error: profileErr } = await supabaseAdmin!
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile || profile.role !== 'Administrador') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Acesso negado. Esta operação exige privilégios de Administrador.' }, { status: 403 })
    };
  }

  return { authorized: true, user, profile };
}

/**
 * Exige qualquer usuário autenticado ativo no sistema
 */
export async function requireAuth(request: NextRequest): Promise<{ authorized: true; user: any } | { authorized: false; response: NextResponse }> {
  const { user, error } = await getAuthenticatedUser(request);

  if (error || !user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: error || 'Autenticação necessária.' }, { status: 401 })
    };
  }

  return { authorized: true, user };
}

/**
 * Valida acesso para execução de rotinas automáticas (CRON_SECRET) ou sessão de usuário
 */
export async function requireCronOrAuth(request: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 1. Se possuir CRON_SECRET configurado e bater com o Bearer token
  if (cronSecret && authHeader) {
    const bearer = authHeader.replace('Bearer ', '').trim();
    if (bearer === cronSecret) {
      return { authorized: true, reason: 'CRON_SECRET' };
    }
  }

  // 2. Se for chamado com o segredo via query param (?secret=...)
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get('secret');
  if (cronSecret && secretParam === cronSecret) {
    return { authorized: true, reason: 'CRON_SECRET_PARAM' };
  }

  // 3. Fallback: sessão autenticada do Supabase Auth
  const { user } = await getAuthenticatedUser(request);
  if (user) {
    return { authorized: true, reason: 'USER_SESSION' };
  }

  // Se nenhum CRON_SECRET estiver configurado no ambiente, emite aviso mas permite apenas para evitar quebrar cron legado antes da configuração
  if (!cronSecret) {
    console.warn('[Security Notice] CRON_SECRET não está configurado nas variáveis de ambiente. Recomenda-se definir CRON_SECRET.');
    return { authorized: true, reason: 'LEGACY_UNSET_SECRET' };
  }

  return { authorized: false };
}
