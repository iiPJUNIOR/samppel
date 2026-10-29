/**
 * Serviço de Envio de E-mails via Resend API
 * Sem dependências externas, utilizando fetch nativo.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SENDER_EMAIL = process.env.RESEND_SENDER || 'Portal Samppel <sistema@samppel.com.br>';
const DEFAULT_RECIPIENT = process.env.ADMIN_ALERT_EMAIL || 'junior.8350i@gmail.com';
const SUPABASE_PROJECT_ID = 'cywbfcrtuawsgtbsjnnb';
const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`;

export interface SendEmailOptions {
  to?: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.error('[EmailService] Chave RESEND_API_KEY não configurada.');
    return { success: false, error: 'RESEND_API_KEY ausente' };
  }

  const recipients = Array.isArray(to) ? to : [to || DEFAULT_RECIPIENT];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: recipients,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ' ')
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[EmailService] Erro retornado pela Resend API:', data);
      return { success: false, error: data.message || 'Falha no envio via Resend' };
    }

    console.log('[EmailService] E-mail enviado com sucesso. ID:', data.id);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[EmailService] Exceção ao enviar e-mail:', error);
    return { success: false, error: error.message || 'Erro de rede' };
  }
}

/**
 * Envia alerta crítico de Supabase Pausado ou Inacessível
 */
export async function sendDatabaseDownAlert(details?: {
  error?: string;
  source?: string;
  timestamp?: string;
}) {
  const time = details?.timestamp || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const source = details?.source || 'Rotina Automática de Verificação / Cron Matinal';
  const errorMessage = details?.error || 'Não foi possível resolver o host ou estabelecer conexão com o Supabase.';

  const subject = '[ALERTA CRÍTICO] Banco de Dados Supabase Inacessível ou Pausado - Portal Samppel';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid #dc2626; overflow: hidden; }
    .header { background-color: #991b1b; padding: 20px 24px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 24px; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
    .badge { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-bottom: 16px; }
    .box { background-color: #0f172a; border-left: 4px solid #ef4444; padding: 14px; border-radius: 6px; margin: 16px 0; font-family: monospace; font-size: 12px; color: #fca5a5; word-break: break-all; }
    .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 20px 0 10px 0; text-align: center; }
    .footer { padding: 16px 24px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ALERTA: Supabase Pausado ou Inacessível</h1>
    </div>
    <div class="content">
      <div class="badge">STATUS: BANCO INACESSÍVEL</div>
      <p>O sistema do <strong>Portal Samppel</strong> tentou se conectar ao banco de dados Supabase e não obteve resposta.</p>
      
      <p><strong>Causa Mais Provável:</strong> O projeto no plano gratuito da Supabase foi pausado automaticamente por inatividade de 7 dias ou ocorreu uma indisponibilidade temporária.</p>

      <div class="box">
        <strong>Origem:</strong> ${source}<br/>
        <strong>Data/Hora:</strong> ${time}<br/>
        <strong>ID do Projeto Supabase:</strong> ${SUPABASE_PROJECT_ID}<br/>
        <strong>Detalhes do Erro:</strong><br/>
        ${errorMessage}
      </div>

      <p><strong>Ação Necessária:</strong> Acesse o console da Supabase pelo botão abaixo e reative o projeto (Restore Project) para restabelecer a operação e sincronizações:</p>

      <div style="text-align: center;">
        <a href="${SUPABASE_DASHBOARD_URL}" class="cta-button" target="_blank">Reativar Projeto no Supabase</a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
        Assim que reativado, a base restabelece em 1 a 2 minutos e a sincronização do Conta Azul voltará a funcionar normalmente.
      </p>
    </div>
    <div class="footer">
      Portal Samppel | Notificação Automática do Monitor de Integridade
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: DEFAULT_RECIPIENT,
    subject,
    html
  });
}

/**
 * Envia relatório matinal diário de saúde do sistema
 */
export async function sendDailyMorningReport(details: {
  isHealthy: boolean;
  latencyMs?: number;
  syncQueuePending?: number;
  importResult?: any;
  error?: string;
}) {
  const time = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const statusColor = details.isHealthy ? '#16a34a' : '#dc2626';
  const statusText = details.isHealthy ? 'SISTEMA OPERACIONAL (SAUDÁVEL)' : 'FALHA OU BANCO INACESSÍVEL';
  const subject = details.isHealthy 
    ? '[Status Diário] Portal Samppel - Banco Conectado e Sincronização Matinal OK'
    : '[ALERTA MATINAL] Portal Samppel - Falha na Sincronização ou Banco Inacessível';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; border: 1px solid ${statusColor}; overflow: hidden; }
    .header { background-color: ${details.isHealthy ? '#14532d' : '#7f1d1d'}; padding: 20px 24px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 24px; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
    .badge { display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; margin-bottom: 16px; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .metric-card { background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155; }
    .metric-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .metric-value { font-size: 16px; color: #f8fafc; font-weight: 700; margin-top: 4px; }
    .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; margin: 16px 0 8px 0; text-align: center; }
    .footer { padding: 16px 24px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Relatório Matinal de Integridade</h1>
    </div>
    <div class="content">
      <div class="badge">${statusText}</div>
      <p>Relatório automatizado matinal de testes e sincronização do <strong>Portal Samppel</strong>.</p>
      
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Banco Supabase</div>
          <div class="metric-value" style="color: ${details.isHealthy ? '#4ade80' : '#f87171'}">
            ${details.isHealthy ? 'Ativo e Saudável' : 'Inacessível / Pausado'}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Latência Supabase</div>
          <div class="metric-value">${details.latencyMs !== undefined ? `${details.latencyMs} ms` : 'N/A'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Fila Pendente</div>
          <div class="metric-value">${details.syncQueuePending ?? 0} itens</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Token PAT Supabase</div>
          <div class="metric-value" style="font-size: 13px;">Expira em 04/01/2027</div>
        </div>
      </div>

      ${details.error ? `
      <div style="background-color: #450a0a; border: 1px solid #ef4444; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 12px; color: #fca5a5;">
        <strong>Erro Identificado:</strong><br/>
        ${details.error}
      </div>
      ` : ''}

      ${!details.isHealthy ? `
      <div style="text-align: center;">
        <a href="${SUPABASE_DASHBOARD_URL}" class="cta-button" target="_blank">Acessar Console Supabase</a>
      </div>
      ` : `
      <p style="font-size: 13px; color: #94a3b8;">
        O keep-alive preventivo foi executado com sucesso e a contagem de inatividade de 7 dias da Supabase foi renovada.
      </p>
      `}
    </div>
    <div class="footer">
      Enviado em ${time} para ${DEFAULT_RECIPIENT} | Portal Samppel
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: DEFAULT_RECIPIENT,
    subject,
    html
  });
}
