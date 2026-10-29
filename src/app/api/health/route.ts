import { NextRequest, NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabaseHealth';
import { sendDatabaseDownAlert, sendDailyMorningReport, sendEmail } from '@/services/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testAlert = searchParams.get('testAlert') === 'true';
  const testDailyReport = searchParams.get('testDailyReport') === 'true';
  const forceAlert = searchParams.get('forceAlert') === 'true';

  // 1. Envio de e-mail de teste de alerta manual sob demanda
  if (testAlert) {
    const res = await sendEmail({
      to: 'junior.8350i@gmail.com',
      subject: '[TESTE DE NOTIFICAÇÃO] Monitor de Alerta Supabase - Portal Samppel',
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
          <h2 style="color: #38bdf8; margin-top: 0;">Teste de Notificação de Alerta Realizado com Sucesso</h2>
          <p>Este é um e-mail de teste para validar que o canal de alertas via Resend está 100% ativo e operacional.</p>
          <div style="background: #1e293b; padding: 12px; border-radius: 6px; font-size: 13px;">
            <strong>Destinatário:</strong> junior.8350i@gmail.com<br/>
            <strong>Remetente:</strong> sistema@samppel.com.br<br/>
            <strong>Status:</strong> OK<br/>
            <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            Caso o banco de dados Supabase venha a pausar ou cair, você receberá um alerta imediato neste formato.
          </p>
        </div>
      `
    });

    return NextResponse.json({
      success: res.success,
      message: res.success ? 'E-mail de teste disparado com sucesso para junior.8350i@gmail.com' : 'Falha ao enviar e-mail',
      details: res
    });
  }

  // 2. Envio de relatório matinal simulado sob demanda
  if (testDailyReport) {
    const health = await checkSupabaseHealth();
    const res = await sendDailyMorningReport({
      isHealthy: health.ok,
      latencyMs: health.latencyMs,
      syncQueuePending: 0,
      error: health.error
    });

    return NextResponse.json({
      success: res.success,
      message: 'Relatório diário matinal enviado para junior.8350i@gmail.com',
      details: res
    });
  }

  // 3. Execução padrão do Health Check & Keep-Alive
  const health = await checkSupabaseHealth({
    sendAlertIfDown: true,
    source: 'Endpoint /api/health (Monitor de Integridade & Keep-Alive)',
    forceAlert
  });

  const statusCode = health.ok ? 200 : 503;

  return NextResponse.json({
    status: health.status,
    healthy: health.ok,
    database: {
      provider: 'Supabase',
      projectId: 'cywbfcrtuawsgtbsjnnb',
      status: health.status,
      latencyMs: health.latencyMs,
      error: health.error || null
    },
    system: {
      service: 'Portal Samppel',
      patTokenExpiresAt: '2027-01-04',
      alertRecipient: 'junior.8350i@gmail.com',
      checkedAt: health.timestamp
    }
  }, { status: statusCode });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
