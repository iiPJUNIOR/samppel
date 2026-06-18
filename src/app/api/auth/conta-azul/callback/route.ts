import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';
import { getContaAzulConfig } from '@/services/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // State can represent the tenant_id or session validation
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const tenantId = state || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  if (error) {
    console.error('Conta Azul OAuth error query param:', error);
    return NextResponse.redirect(`${appUrl}/configuracoes?error=${encodeURIComponent('Acesso negado pelo Conta Azul: ' + error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/configuracoes?error=${encodeURIComponent('Código de autorização não recebido.')}`);
  }

  try {
    // Retrieve registered client_id and client_secret securely from database or environment
    const { data: config } = await getContaAzulConfig(tenantId);
    
    // Fall back to environment variables if database configuration is empty
    const clientId = config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const clientSecret = config?.client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '';
    const redirectUri = process.env.CONTA_AZUL_REDIRECT_URI || `${appUrl}/api/auth/conta-azul/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('As credenciais client_id e client_secret não foram configuradas no sistema.');
    }

    // Exchange code for tokens on backend server
    const service = new ContaAzulService(tenantId);
    await service.exchangeCode(code, clientId, clientSecret, redirectUri);

    // Redirect user to configuration page with success indicator
    return NextResponse.redirect(`${appUrl}/configuracoes?success=true`);
  } catch (err: any) {
    console.error('Error during Conta Azul OAuth exchange:', err);
    return NextResponse.redirect(
      `${appUrl}/configuracoes?error=${encodeURIComponent(err.message || 'Falha na troca de código de autorização')}`
    );
  }
}
