import { NextRequest, NextResponse } from 'next/server';
import { ContaAzulService } from '@/services/conta_azul';
import { getContaAzulConfig } from '@/services/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // O estado pode representar o tenant_id ou validação de sessão
  const error = searchParams.get('error');

  const appUrl = request.nextUrl.origin;
  const tenantId = state || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

  if (error) {
    console.error('Conta Azul OAuth error query param:', error);
    return NextResponse.redirect(`${appUrl}/configuracoes?error=${encodeURIComponent('Acesso negado pelo Conta Azul: ' + error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/configuracoes?error=${encodeURIComponent('Código de autorização não recebido.')}`);
  }

  try {
    // Obtém o client_id e client_secret registrados de forma segura a partir do banco de dados ou do ambiente
    const { data: config } = await getContaAzulConfig(tenantId);
    
    // Retorno para variáveis de ambiente caso a configuração do banco de dados esteja vazia
    const clientId = config?.client_id || process.env.CONTA_AZUL_CLIENT_ID || '';
    const clientSecret = config?.client_secret || process.env.CONTA_AZUL_CLIENT_SECRET || '';
    const redirectUri = process.env.CONTA_AZUL_REDIRECT_URI || `${appUrl}/api/auth/conta-azul/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('As credenciais client_id e client_secret não foram configuradas no sistema.');
    }

    // Troca o código por tokens no servidor backend
    const service = new ContaAzulService(tenantId);
    await service.exchangeCode(code, clientId, clientSecret, redirectUri);

    // Redireciona o usuário para a página de configurações com indicador de sucesso
    return NextResponse.redirect(`${appUrl}/configuracoes?success=true`);
  } catch (err: any) {
    console.error('Error during Conta Azul OAuth exchange:', err);
    return NextResponse.redirect(
      `${appUrl}/configuracoes?error=${encodeURIComponent(err.message || 'Falha na troca de código de autorização')}`
    );
  }
}
