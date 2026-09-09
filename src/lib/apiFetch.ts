import { supabase } from '@/services/supabase';

/**
 * Wrapper de fetch que injeta automaticamente o token JWT da sessão ativa do Supabase
 * no cabeçalho Authorization: Bearer <token>
 */
export async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }
    } catch (e) {
      console.warn('Não foi possível obter sessão para o authenticatedFetch:', e);
    }
  }

  return fetch(url, {
    ...init,
    headers
  });
}
