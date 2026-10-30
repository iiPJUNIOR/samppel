import { NextRequest, NextResponse } from 'next/server';
import {
  OWNER_MONITORING_EMAIL,
  requireMonitoringOwner,
  supabaseAdmin,
} from '@/lib/serverAuth';
import { sendMonitoringAnomalyAlert } from '@/services/emailService';

export const dynamic = 'force-dynamic';

const DEFAULT_TENANT_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
const SUPABASE_PAT_EXPIRATION_ISO = '2027-01-04T00:00:00-03:00';
const CACHE_TTL_MS = 60 * 1000; // 60s de cache em memoria para zero auto-consumo

const FREE_DB_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB
const PRO_DB_LIMIT_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB
const FREE_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const PRO_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB

const SQL_MAINTENANCE_ACTIONS = new Set([
  'PURGE_LOGS_OLDER_THAN',
  'PURGE_LOGS_SUCCESS_ONLY',
  'PURGE_LOGS_ERRORS_OLDER_THAN',
  'CLEAN_SYNC_QUEUE_COMPLETED',
  'UNLOCK_STUCK_SYNC_QUEUE',
  'RETRY_FAILED_SYNC_QUEUE',
  'CLEAR_FAILED_SYNC_QUEUE',
  'RESET_QUERY_BASELINE',
  'TERMINATE_IDLE_TRANSACTIONS',
  'RUN_ANALYZE_CORE_TABLES',
  'RESET_OAUTH_CIRCUIT_BREAKER',
]);

let telemetryMemoryCache: { timestamp: number; payload: any } | null = null;

export interface MonitoringDiagnostic {
  id: string;
  severity: 'CRITICO' | 'ATENCAO' | 'INFO';
  category: 'CONSULTAS_N1' | 'INTEGRACAO_CA' | 'ARMAZENAMENTO' | 'CONEXOES' | 'SEGURANCA' | 'NEGOCIO';
  title: string;
  description: string;
  metric: string;
  actionKey?: string;
  actionLabel?: string;
  retentionHours?: number;
  linkPath?: string;
  linkLabel?: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx >= 2 ? 2 : 0)} ${units[idx]}`;
}

function buildIntelligence(raw: any) {
  const diagnostics: MonitoringDiagnostic[] = [];
  let score = 100;

  const db = raw?.database || {};
  const queries = raw?.queries || {};
  const tables = raw?.tables || {};
  const integration = raw?.integration || {};
  const governance = raw?.governance || {};
  const history = Array.isArray(raw?.history) ? raw.history : [];

  const dbSizeBytes = Number(db.db_size_bytes || 0);
  const storageBytes = Number(db.storage_bytes || 0);
  const maxConnections = Math.max(Number(db.max_connections || 60), 1);
  const totalConnections = Number(db.total_connections || 0);
  const connPct = Math.round((totalConnections / maxConnections) * 1000) / 10;
  const stuckIdleTx5m = Number(db.stuck_idle_in_tx_5m || 0);
  const cacheHitRatio = Number(db.cache_hit_ratio ?? 100);

  // 1. Detector N+1 e Volume de Chamadas SQL
  const topByCalls = Array.isArray(queries.top_by_calls) ? queries.top_by_calls : [];
  const hasBaseline = Boolean(queries.baseline_reset_at);
  const topQuery = topByCalls[0];
  if (topQuery) {
    const activeCalls = Number(topQuery.calls_since_baseline ?? topQuery.raw_calls ?? 0);
    if (activeCalls >= 100_000) {
      const isHistoricalBeforeReset = !hasBaseline;
      score -= isHistoricalBeforeReset ? 12 : 28;
      diagnostics.push({
        id: 'n1-high-calls',
        severity: isHistoricalBeforeReset ? 'ATENCAO' : 'CRITICO',
        category: 'CONSULTAS_N1',
        title: isHistoricalBeforeReset
          ? 'Historico Acumulado de Tempestade N+1 Detectado no pg_stat_statements'
          : 'Alerta Anti-N+1 Ativo: Volume Excessivo de Chamadas em Consulta Unica',
        description: isHistoricalBeforeReset
          ? `O contador acumulado do Postgres registra ${activeCalls.toLocaleString('pt-BR')} execucoes na consulta lider (${String(topQuery.query_preview || '').slice(0, 95)}...). Redefina a linha de base para monitorar apenas o trafego novo pos-correcao.`
          : `Desde o ultimo reset de linha de base, uma unica query executou ${activeCalls.toLocaleString('pt-BR')} vezes. Inspecione imediatamente para evitar consumo de CPU e Egress.`,
        metric: `${activeCalls.toLocaleString('pt-BR')} chamadas`,
        actionKey: 'RESET_QUERY_BASELINE',
        actionLabel: 'Resetar Linha de Base Agora',
      });
    } else if (activeCalls >= 25_000) {
      score -= 8;
      diagnostics.push({
        id: 'n1-moderate-calls',
        severity: 'ATENCAO',
        category: 'CONSULTAS_N1',
        title: 'Consulta de Alta Frequencia em Observacao',
        description: `A consulta lider acumulou ${activeCalls.toLocaleString('pt-BR')} chamadas (${String(topQuery.query_preview || '').slice(0, 90)}...). Acompanhe a taxa por minuto.`,
        metric: `${activeCalls.toLocaleString('pt-BR')} chamadas`,
      });
    }
  }

  // 2. Conta Azul OAuth, END_TRIAL e Circuit Breaker
  const caConfig = integration.ca_config || {};
  const cronCircuit = integration.cron_and_circuit || {};
  const logs = integration.logs || {};
  const groupedErrors = Array.isArray(logs.grouped_errors) ? logs.grouped_errors : [];

  const recentEndTrialError = groupedErrors.find((e: any) =>
    String(e.error_summary || '').toUpperCase().includes('END_TRIAL')
  );
  const recentRefreshError = groupedErrors.find((e: any) =>
    String(e.error_summary || '').toLowerCase().includes('falha ao atualizar token')
  );

  if (cronCircuit.is_circuit_open) {
    score -= 18;
    diagnostics.push({
      id: 'ca-circuit-open',
      severity: 'CRITICO',
      category: 'INTEGRACAO_CA',
      title: 'Circuit Breaker Ativo: Sincronizacao Automatica Conta Azul Pausada',
      description: `O disjuntor automatico bloqueou novos crons ate ${new Date(cronCircuit.oauth_circuit_open_until).toLocaleString('pt-BR')} apos ${cronCircuit.oauth_consecutive_failures} falhas seguidas (${String(cronCircuit.oauth_last_failure_reason || 'Erro OAuth').slice(0, 120)}).`,
      metric: `${cronCircuit.oauth_consecutive_failures} falhas seguidas`,
      actionKey: 'RESET_OAUTH_CIRCUIT_BREAKER',
      actionLabel: 'Reiniciar Circuit Breaker',
      linkPath: '/configuracoes',
      linkLabel: 'Reconectar Conta Azul',
    });
  } else if (recentEndTrialError) {
    score -= 16;
    diagnostics.push({
      id: 'ca-end-trial',
      severity: 'CRITICO',
      category: 'INTEGRACAO_CA',
      title: 'Conta Azul Conectada em Conta de Teste Expirada (END_TRIAL)',
      description:
        'A sessao OAuth atual autenticou na conta de teste de desenvolvedor (@devportal.com) cujo trial de 30 dias expirou. Abra uma aba anonima ou faca logoff do Conta Azul e reconecte usando o login comercial oficial da Samppel.',
      metric: 'Status: END_TRIAL',
      linkPath: '/configuracoes',
      linkLabel: 'Ir para Integracao Conta Azul',
    });
  } else if (!caConfig.configured || caConfig.is_token_expired) {
    score -= 12;
    diagnostics.push({
      id: 'ca-token-expired',
      severity: 'ATENCAO',
      category: 'INTEGRACAO_CA',
      title: !caConfig.configured
        ? 'Credenciais Conta Azul Nao Configuradas'
        : 'Access Token Conta Azul Expirado ou Aguardando Renovacao',
      description: recentRefreshError
        ? 'O token expirou e houve falha recente na renovacao automatica (OAUTH_TOKEN_REFRESH). Verifique a conexao OAuth2.'
        : 'O access_token salvo ja passou do horario de expiracao e sera renovado na proxima chamada valida.',
      metric: caConfig.expires_at
        ? `Expirou em ${new Date(caConfig.expires_at).toLocaleString('pt-BR')}`
        : 'Sem token ativo',
      linkPath: '/configuracoes',
      linkLabel: 'Verificar Credenciais',
    });
  }

  // 3. Duplicidade de Crons e Flood de Logs de Erro
  const blockedCrons = Number(cronCircuit.duplicate_cron_blocked_count || 0);
  if (blockedCrons > 0) {
    diagnostics.push({
      id: 'duplicate-crons-blocked',
      severity: 'INFO',
      category: 'INTEGRACAO_CA',
      title: 'Trava Anti-Duplicidade Interceptou Agendadores Concorrentes',
      description: `Dois agendadores externos estao acionando /api/sync/cron em paralelo. A trava de 12 minutos ja evitou ${blockedCrons} execucao(oes) duplicada(s). Ultima origem bloqueada: ${cronCircuit.last_blocked_cron_source || 'Externo'}.`,
      metric: `${blockedCrons} bloqueio(s)`,
    });
  }

  const last1hError = Number(logs.last_1h_error || 0);
  const last24hError = Number(logs.last_24h_error || 0);
  if (last1hError >= 6 || last24hError >= 30) {
    score -= 10;
    diagnostics.push({
      id: 'ca-error-rate',
      severity: last1hError >= 10 ? 'CRITICO' : 'ATENCAO',
      category: 'INTEGRACAO_CA',
      title: 'Volume Elevado de Erros nos Logs de Integracao',
      description: `Foram registrados ${last1hError} erros na ultima hora e ${last24hError} erros nas ultimas 24 horas em conta_azul_integration_logs.`,
      metric: `${last24hError} erros / 24h`,
      actionKey: 'PURGE_LOGS_ERRORS_OLDER_THAN',
      actionLabel: 'Limpar Erros > 48h',
      retentionHours: 48,
    });
  }

  // 4. Tamanho da Tabela de Logs e Fila Outbox (sync_queue)
  const logsTotalCount = Number(logs.total_count || 0);
  const logsTotalBytes = Number(logs.total_bytes || 0);
  if (logsTotalCount > 1500 || logsTotalBytes > 1.5 * 1024 * 1024) {
    score -= 6;
    diagnostics.push({
      id: 'logs-table-volume',
      severity: 'ATENCAO',
      category: 'ARMAZENAMENTO',
      title: 'Acumulo de Registros em conta_azul_integration_logs',
      description: `A tabela de logs acumula ${logsTotalCount.toLocaleString('pt-BR')} linhas (${logs.total_size_pretty || formatBytes(logsTotalBytes)}). Expurgar historico antigo mantem os indices leves e reduz leituras em disco.`,
      metric: `${logsTotalCount.toLocaleString('pt-BR')} linhas (${logs.total_size_pretty || formatBytes(logsTotalBytes)})`,
      actionKey: 'PURGE_LOGS_OLDER_THAN',
      actionLabel: 'Expurgar Logs > 48h',
      retentionHours: 48,
    });
  }

  const syncQueue = integration.sync_queue || {};
  const syncProcessing = Number(syncQueue.processing || 0);
  const syncStuck = Number(syncQueue.stuck_processing_15m || 0);
  const syncFailed = Number(syncQueue.failed || 0);
  const syncCompleted = Number(syncQueue.completed || 0);

  if (syncStuck > 0 || syncProcessing > 0) {
    score -= syncStuck > 0 ? 10 : 4;
    diagnostics.push({
      id: 'sync-queue-stuck',
      severity: syncStuck > 0 ? 'ATENCAO' : 'INFO',
      category: 'INTEGRACAO_CA',
      title:
        syncStuck > 0
          ? 'Item Travado em PROCESSING na Fila Outbox (sync_queue)'
          : 'Item em Processamento na Fila Outbox',
      description:
        syncStuck > 0
          ? `Ha ${syncStuck} registro(s) preso(s) no status PROCESSING ha mais de 15 minutos, indicando interrupcao anterior de worker.`
          : `Ha ${syncProcessing} registro(s) atualmente com status PROCESSING.`,
      metric: `${syncProcessing} PROCESSING`,
      actionKey: 'UNLOCK_STUCK_SYNC_QUEUE',
      actionLabel: 'Destravar Fila PROCESSING',
    });
  }

  if (syncFailed > 0) {
    score -= Math.min(10, Math.ceil(syncFailed / 20) * 3);
    diagnostics.push({
      id: 'sync-queue-failed',
      severity: 'ATENCAO',
      category: 'INTEGRACAO_CA',
      title: 'Registros com Falha Permanente na Fila sync_queue',
      description: `Existem ${syncFailed} itens com status FAILED na fila de sincronizacao reversa. Voce pode limpar falhas antigas ou reagendar nova tentativa apos reconectar o Conta Azul.`,
      metric: `${syncFailed} FAILED`,
      actionKey: 'CLEAR_FAILED_SYNC_QUEUE',
      actionLabel: 'Limpar Falhas > 7 Dias',
      retentionHours: 168,
    });
  }

  if (syncCompleted > 500) {
    score -= 4;
    diagnostics.push({
      id: 'sync-queue-completed-bloat',
      severity: 'INFO',
      category: 'ARMAZENAMENTO',
      title: 'Historico Concluido Acumulado na sync_queue',
      description: `A fila mantem ${syncCompleted.toLocaleString('pt-BR')} itens ja concluidos (COMPLETED). A limpeza reduz dead tuples e acelera a leitura de itens PENDING.`,
      metric: `${syncCompleted.toLocaleString('pt-BR')} COMPLETED`,
      actionKey: 'CLEAN_SYNC_QUEUE_COMPLETED',
      actionLabel: 'Expurgar Concluidos > 48h',
      retentionHours: 48,
    });
  }

  // 5. Bloat de Tabelas, Seq Scans e Cache Hit Ratio
  const tableStats = Array.isArray(tables.table_stats) ? tables.table_stats : [];
  const bloatedTables = tableStats.filter(
    (t: any) => Number(t.total_bytes || 0) > 250_000 && Number(t.bloat_pct || 0) >= 25
  );
  if (bloatedTables.length > 0) {
    score -= 5;
    const names = bloatedTables
      .slice(0, 3)
      .map((t: any) => `${t.table_name} (${t.bloat_pct}%)`)
      .join(', ');
    diagnostics.push({
      id: 'table-bloat',
      severity: 'ATENCAO',
      category: 'ARMAZENAMENTO',
      title: 'Taxa de Linhas Mortas (Dead Tuples / Bloat) Acima de 25%',
      description: `Tabelas com alta rotatividade aguardando reciclagem do Autovacuum/Analyze: ${names}. Atualizar estatisticas ajuda o planejador de indices do Postgres.`,
      metric: `${bloatedTables.length} tabela(s)`,
      actionKey: 'RUN_ANALYZE_CORE_TABLES',
      actionLabel: 'Executar ANALYZE nas Tabelas',
    });
  }

  if (cacheHitRatio < 97) {
    score -= cacheHitRatio < 90 ? 15 : 7;
    diagnostics.push({
      id: 'low-cache-hit',
      severity: cacheHitRatio < 90 ? 'CRITICO' : 'ATENCAO',
      category: 'ARMAZENAMENTO',
      title: 'Eficiencia de Cache em RAM (Buffer Cache Hit) Abaixo do Ideal',
      description: `O Cache Hit Ratio esta em ${cacheHitRatio}%. Valores abaixo de 98% indicam leituras fisicas em disco por falta de indice ou varreduras sequenciais.`,
      metric: `${cacheHitRatio}% Hit Ratio`,
      actionKey: 'RUN_ANALYZE_CORE_TABLES',
      actionLabel: 'Otimizar Estatisticas (ANALYZE)',
    });
  }

  // 6. Conexoes e Transacoes Zumbis
  if (stuckIdleTx5m > 0) {
    score -= 15;
    diagnostics.push({
      id: 'zombie-idle-tx',
      severity: 'CRITICO',
      category: 'CONEXOES',
      title: 'Conexoes Zumbis (Idle in Transaction > 5 min) Detectadas',
      description: `Existem ${stuckIdleTx5m} sessao(oes) travada(s) segurando locks e impedindo o Autovacuum de limpar espaco morto.`,
      metric: `${stuckIdleTx5m} sessao(oes) travada(s)`,
      actionKey: 'TERMINATE_IDLE_TRANSACTIONS',
      actionLabel: 'Encerrar Transacoes Zumbis',
    });
  }

  if (connPct >= 70) {
    score -= connPct >= 85 ? 18 : 8;
    diagnostics.push({
      id: 'high-connections',
      severity: connPct >= 85 ? 'CRITICO' : 'ATENCAO',
      category: 'CONEXOES',
      title: 'Ocupacao Elevada do Pool de Conexoes Postgres',
      description: `O banco esta utilizando ${totalConnections} de ${maxConnections} conexoes simultaneas (${connPct}%). Evite conexoes TCP diretas fora do pooler Supavisor.`,
      metric: `${totalConnections}/${maxConnections} (${connPct}%)`,
    });
  }

  // 7. Governanca, Seguranca, RLS, Variaveis e PAT Supabase
  const patExpiresMs = new Date(SUPABASE_PAT_EXPIRATION_ISO).getTime();
  const patDaysRemaining = Math.ceil((patExpiresMs - Date.now()) / (24 * 60 * 60 * 1000));
  if (patDaysRemaining <= 45) {
    score -= patDaysRemaining <= 14 ? 15 : 6;
    diagnostics.push({
      id: 'supabase-pat-expiring',
      severity: patDaysRemaining <= 14 ? 'CRITICO' : 'ATENCAO',
      category: 'SEGURANCA',
      title: 'Expiracao Proxima do Personal Access Token (PAT) Supabase',
      description: `O token administrativo do projeto Samppel expira em 04/01/2027 (${patDaysRemaining} dias restantes). Gere e atualize um novo PAT preventivamente.`,
      metric: `${patDaysRemaining} dias restantes`,
    });
  }

  const tablesWithoutRls = Number(tables.public_tables_without_rls || 0);
  if (tablesWithoutRls > 0) {
    score -= 20;
    diagnostics.push({
      id: 'public-tables-no-rls',
      severity: 'CRITICO',
      category: 'SEGURANCA',
      title: 'Tabelas Publicas sem Row Level Security (RLS)',
      description: `Foram detectadas ${tablesWithoutRls} tabela(s) no schema public sem RLS habilitado.`,
      metric: `${tablesWithoutRls} tabela(s) exposta(s)`,
    });
  }

  if (!process.env.CRON_SECRET) {
    score -= 6;
    diagnostics.push({
      id: 'missing-cron-secret',
      severity: 'ATENCAO',
      category: 'SEGURANCA',
      title: 'Variavel CRON_SECRET Ausente no Ambiente Atual',
      description:
        'Sem CRON_SECRET definido no ambiente, o endpoint /api/sync/cron opera em modo de compatibilidade legada. Verifique se esta ativo na Vercel.',
      metric: 'CRON_SECRET ausente',
    });
  }

  // 8. Integridade de Dados de Negocio (Sanity Checks)
  const sanity = governance.business_sanity || {};
  const sanityIssues: string[] = [];
  if (Number(sanity.orphan_orders_without_items || 0) > 0) {
    sanityIssues.push(`${sanity.orphan_orders_without_items} pedido(s) sem itens`);
  }
  if (Number(sanity.items_without_stage || 0) > 0) {
    sanityIssues.push(`${sanity.items_without_stage} item(ns) sem etapa Kanban`);
  }
  if (Number(sanity.negative_stock_credits || 0) > 0) {
    sanityIssues.push(`${sanity.negative_stock_credits} saldo(s) de credito negativo(s)`);
  }
  if (Number(sanity.orders_without_customer || 0) > 0) {
    sanityIssues.push(`${sanity.orders_without_customer} pedido(s) sem cliente vinculado`);
  }
  if (Number(sanity.duplicate_clean_documents || 0) > 0) {
    sanityIssues.push(`${sanity.duplicate_clean_documents} CPF/CNPJ duplicado(s) em clientes`);
  }

  if (sanityIssues.length > 0) {
    score -= Math.min(12, sanityIssues.length * 4);
    diagnostics.push({
      id: 'business-sanity-anomalies',
      severity: 'ATENCAO',
      category: 'NEGOCIO',
      title: 'Inconsistencias de Integridade em Dados Operacionais',
      description: `A auditoria automatica encontrou: ${sanityIssues.join('; ')}. Revise na aba Seguranca, Sessoes & Integridade.`,
      metric: `${sanityIssues.length} alerta(s) de dados`,
    });
  }

  // 9. Projecoes de Velocidade e Cotas de Disco
  let callsPerMin = 0;
  let rowsPerMin = 0;
  let dbGrowthBytesPerDay = 0;

  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    const elapsedMin = Math.max(
      (new Date(curr.captured_at).getTime() - new Date(prev.captured_at).getTime()) / 60000,
      0.5
    );
    const deltaCalls = Number(curr.total_query_calls || 0) - Number(prev.total_query_calls || 0);
    const deltaRows = Number(curr.total_rows_returned || 0) - Number(prev.total_rows_returned || 0);
    if (deltaCalls >= 0) callsPerMin = Math.round((deltaCalls / elapsedMin) * 10) / 10;
    if (deltaRows >= 0) rowsPerMin = Math.round((deltaRows / elapsedMin) * 10) / 10;

    const first = history[0];
    const totalSpanDays =
      (new Date(curr.captured_at).getTime() - new Date(first.captured_at).getTime()) /
      (24 * 60 * 60 * 1000);
    if (totalSpanDays >= 0.02) {
      const deltaBytes = Number(curr.db_size_bytes || 0) - Number(first.db_size_bytes || 0);
      dbGrowthBytesPerDay = Math.round(deltaBytes / totalSpanDays);
    }
  }

  const freeDbPct = Math.round((dbSizeBytes / FREE_DB_LIMIT_BYTES) * 10000) / 100;
  const proDbPct = Math.round((dbSizeBytes / PRO_DB_LIMIT_BYTES) * 10000) / 100;
  const freeStoragePct = Math.round((storageBytes / FREE_STORAGE_LIMIT_BYTES) * 10000) / 100;
  const proStoragePct = Math.round((storageBytes / PRO_STORAGE_LIMIT_BYTES) * 10000) / 100;

  if (freeDbPct >= 80) {
    score -= freeDbPct >= 92 ? 20 : 10;
    diagnostics.unshift({
      id: 'quota-free-db-risk',
      severity: freeDbPct >= 92 ? 'CRITICO' : 'ATENCAO',
      category: 'ARMAZENAMENTO',
      title: 'Consumo de Disco Proximo do Teto do Plano Free (500 MB)',
      description: `O banco atingiu ${formatBytes(dbSizeBytes)} (${freeDbPct}% de 500 MB). Execute limpeza imediata de logs e filas concluidas caso opere no plano Free.`,
      metric: `${freeDbPct}% de 500 MB`,
      actionKey: 'PURGE_LOGS_OLDER_THAN',
      actionLabel: 'Liberar Espaco em Logs',
      retentionHours: 24,
    });
  }

  const estimatedDaysToFreeLimit =
    dbGrowthBytesPerDay > 1024 * 100 && dbSizeBytes < FREE_DB_LIMIT_BYTES
      ? Math.max(1, Math.round((FREE_DB_LIMIT_BYTES - dbSizeBytes) / dbGrowthBytesPerDay))
      : null;

  const estimatedDaysToProLimit =
    dbGrowthBytesPerDay > 1024 * 100 && dbSizeBytes < PRO_DB_LIMIT_BYTES
      ? Math.max(1, Math.round((PRO_DB_LIMIT_BYTES - dbSizeBytes) / dbGrowthBytesPerDay))
      : null;

  const clampedScore = Math.max(0, Math.min(100, score));
  const severityOrder = { CRITICO: 0, ATENCAO: 1, INFO: 2 };
  diagnostics.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const hasCritical = diagnostics.some((d) => d.severity === 'CRITICO');
  const healthStatus: 'SAUDAVEL' | 'ATENCAO' | 'CRITICO' =
    hasCritical || clampedScore < 60
      ? 'CRITICO'
      : clampedScore < 85 || diagnostics.some((d) => d.severity === 'ATENCAO')
      ? 'ATENCAO'
      : 'SAUDAVEL';

  return {
    healthScore: clampedScore,
    healthStatus,
    diagnostics,
    velocity: {
      callsPerMin,
      rowsPerMin,
      dbGrowthBytesPerDay,
      dbGrowthPrettyPerDay:
        dbGrowthBytesPerDay === 0
          ? 'Estavel'
          : `${dbGrowthBytesPerDay > 0 ? '+' : '-'}${formatBytes(Math.abs(dbGrowthBytesPerDay))}/dia`,
      estimatedDaysToFreeLimit,
      estimatedDaysToProLimit,
    },
    quotas: {
      free: {
        dbLimitBytes: FREE_DB_LIMIT_BYTES,
        dbLimitPretty: '500 MB',
        dbUsedPct: freeDbPct,
        storageLimitBytes: FREE_STORAGE_LIMIT_BYTES,
        storageLimitPretty: '1 GB',
        storageUsedPct: freeStoragePct,
      },
      pro: {
        dbLimitBytes: PRO_DB_LIMIT_BYTES,
        dbLimitPretty: '8 GB',
        dbUsedPct: proDbPct,
        storageLimitBytes: PRO_STORAGE_LIMIT_BYTES,
        storageLimitPretty: '100 GB',
        storageUsedPct: proStoragePct,
      },
      connections: {
        used: totalConnections,
        max: maxConnections,
        usedPct: connPct,
      },
    },
    environment: {
      ownerEmail: OWNER_MONITORING_EMAIL,
      supabaseProjectRef: 'cywbfcrtuawsgtbsjnnb',
      region: 'sa-east-1 (Sao Paulo)',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://portalsamppel.vercel.app',
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      patExpiresAt: '2027-01-04',
      patDaysRemaining,
    },
  };
}

async function checkContaAzulCognitoApp(tenantId: string) {
  if (!supabaseAdmin) {
    return { ok: false, status: 0, detail: 'Supabase Admin nao inicializado.' };
  }

  const { data: cfg } = await supabaseAdmin
    .from('conta_azul_config')
    .select('client_id, client_secret')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const clientId = cfg?.client_id?.trim();
  const clientSecret = cfg?.client_secret?.trim();
  if (!clientId || !clientSecret) {
    return {
      ok: false,
      status: 0,
      detail: 'client_id ou client_secret ausentes em conta_azul_config.',
    };
  }

  const canonicalRedirect = 'https://portalsamppel.vercel.app/api/auth/conta-azul/callback';
  const tokenEndpoint = 'https://api-v2.contaazul.com/oauth/token';

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'diagnostic_probe_only',
        redirect_uri: canonicalRedirect,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      cache: 'no-store',
    });

    const text = await res.text().catch(() => '');
    const isClientRejected =
      res.status === 401 ||
      text.includes('"invalid_client"') ||
      text.includes('Invalid client authentication');

    if (isClientRejected) {
      return {
        ok: false,
        status: res.status,
        redirectUriChecked: canonicalRedirect,
        detail: `O gateway OAuth v2 da Conta Azul rejeitou o par client_id/client_secret (HTTP ${res.status}). Verifique as credenciais no Portal do Desenvolvedor.`,
      };
    }

    return {
      ok: true,
      status: res.status,
      redirectUriChecked: canonicalRedirect,
      detail: `Par client_id/client_secret reconhecido pelo gateway OAuth v2 (${tokenEndpoint}) para ${canonicalRedirect}.`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      redirectUriChecked: canonicalRedirect,
      detail: `Falha de rede ao testar gateway OAuth v2 Conta Azul: ${err?.message || 'Erro desconhecido'}`,
    };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireMonitoringOwner(request);
  if (!auth.authorized) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY ausente no servidor.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  if (
    !force &&
    telemetryMemoryCache &&
    Date.now() - telemetryMemoryCache.timestamp < CACHE_TTL_MS
  ) {
    return NextResponse.json({
      ...telemetryMemoryCache.payload,
      cached: true,
      cacheAgeSec: Math.round((Date.now() - telemetryMemoryCache.timestamp) / 1000),
    });
  }

  const startMs = Date.now();
  const { data: rawTelemetry, error } = await supabaseAdmin.rpc(
    'get_system_monitoring_telemetry',
    { p_tenant_id: DEFAULT_TENANT_ID }
  );
  const rpcLatencyMs = Date.now() - startMs;

  if (error || !rawTelemetry) {
    console.error('[AdminMonitoring] Erro ao executar get_system_monitoring_telemetry:', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Falha ao coletar telemetria consolidada do banco. Verifique se a migration foi aplicada.',
      },
      { status: 500 }
    );
  }

  const intelligence = buildIntelligence(rawTelemetry);
  const payload = {
    success: true,
    cached: false,
    cacheAgeSec: 0,
    rpcLatencyMs,
    telemetry: rawTelemetry,
    intelligence,
  };

  telemetryMemoryCache = {
    timestamp: Date.now(),
    payload,
  };

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const auth = await requireMonitoringOwner(request);
  if (!auth.authorized) {
    return auth.response;
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY ausente no servidor.' },
      { status: 500 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo JSON invalido.' }, { status: 400 });
  }

  const action = String(body?.action || '').trim();
  const retentionHours =
    body?.retentionHours !== undefined && body?.retentionHours !== null
      ? Number(body.retentionHours)
      : 48;

  if (!action) {
    return NextResponse.json({ error: 'Parametro action obrigatorio.' }, { status: 400 });
  }

  try {
    if (action === 'RECORD_MANUAL_SNAPSHOT') {
      const { data, error } = await supabaseAdmin.rpc('record_monitoring_snapshot', {
        p_source: 'manual',
      });
      if (error) throw error;
      telemetryMemoryCache = null;
      return NextResponse.json({
        success: true,
        action,
        message: 'Novo snapshot de serie temporal gravado com sucesso.',
        result: data,
      });
    }

    if (action === 'CHECK_COGNITO_APP') {
      const checkResult = await checkContaAzulCognitoApp(DEFAULT_TENANT_ID);
      return NextResponse.json({
        success: true,
        action,
        cognitoCheck: checkResult,
        message: checkResult.detail,
      });
    }

    if (action === 'SEND_EXECUTIVE_EMAIL') {
      const { data: rawTelemetry, error } = await supabaseAdmin.rpc(
        'get_system_monitoring_telemetry',
        { p_tenant_id: DEFAULT_TENANT_ID }
      );
      if (error || !rawTelemetry) {
        throw new Error(error?.message || 'Falha ao coletar telemetria para envio do relatorio.');
      }
      const intel = buildIntelligence(rawTelemetry);
      const db = rawTelemetry.database || {};
      const logs = rawTelemetry.integration?.logs || {};
      const sq = rawTelemetry.integration?.sync_queue || {};

      const emailRes = await sendMonitoringAnomalyAlert({
        title: `Resumo Executivo de Saude (Score ${intel.healthScore}/100 - ${intel.healthStatus})`,
        severity: intel.healthStatus === 'CRITICO' ? 'CRITICO' : 'ATENCAO',
        category: 'Diagnostico Sob Demanda - Central de Monitoramento',
        description:
          intel.diagnostics.length > 0
            ? `Diagnostico principal: ${intel.diagnostics[0].title} — ${intel.diagnostics[0].description}`
            : 'Todos os subsistemas auditados operam dentro dos parametros normais de seguranca e performance.',
        recommendedAction:
          intel.diagnostics.length > 0
            ? `Existem ${intel.diagnostics.length} apontamento(s) ativo(s) na Central de Monitoramento (/monitoramento).`
            : 'Nenhuma intervencao corretiva necessaria no momento.',
        metrics: {
          'Score de Saude': `${intel.healthScore}/100 (${intel.healthStatus})`,
          'Tamanho do Banco': `${db.db_size_pretty || 'N/A'} (${intel.quotas.free.dbUsedPct}% Free / ${intel.quotas.pro.dbUsedPct}% Pro)`,
          'Conexoes Ativas / Pool': `${db.total_connections || 0} / ${db.max_connections || 60} (Cache Hit: ${db.cache_hit_ratio || 100}%)`,
          'Fila sync_queue': `${sq.pending || 0} pendentes | ${sq.processing || 0} proc | ${sq.failed || 0} falhas`,
          'Logs Conta Azul (24h)': `${logs.last_24h_success || 0} sucessos | ${logs.last_24h_error || 0} erros`,
          'Validade PAT Supabase': `04/01/2027 (${intel.environment.patDaysRemaining} dias)`,
        },
      });

      if (!emailRes.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Falha ao disparar e-mail via Resend. Verifique se RESEND_API_KEY esta configurada.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action,
        message: `Resumo executivo enviado com sucesso para ${OWNER_MONITORING_EMAIL}.`,
      });
    }

    if (!SQL_MAINTENANCE_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: `Acao de manutencao nao suportada: ${action}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('execute_monitoring_maintenance', {
      p_action: action,
      p_retention_hours: Number.isFinite(retentionHours) ? Math.max(0, Math.floor(retentionHours)) : 48,
      p_tenant_id: DEFAULT_TENANT_ID,
    });

    if (error) {
      throw error;
    }

    telemetryMemoryCache = null;

    return NextResponse.json({
      success: true,
      action,
      affected: data?.affected ?? 0,
      message: data?.message || 'Operacao de manutencao concluida.',
      executedAt: data?.executed_at || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(`[AdminMonitoring] Erro na acao ${action}:`, err);
    return NextResponse.json(
      { error: err?.message || 'Falha ao executar operacao de manutencao.' },
      { status: 500 }
    );
  }
}
