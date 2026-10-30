import { NextRequest, NextResponse } from 'next/server';
import {
  OWNER_MONITORING_EMAIL,
  requireMonitoringOwner,
  supabaseAdmin,
} from '@/lib/serverAuth';
import {
  clearSupabasePlatformCache,
  fetchSupabasePlatformSnapshot,
  SupabasePlatformSnapshot,
} from '@/lib/supabasePlatformClient';
import { sendMonitoringAnomalyAlert } from '@/services/emailService';

export const dynamic = 'force-dynamic';

const DEFAULT_TENANT_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
const SUPABASE_PROJECT_REF = 'cywbfcrtuawsgtbsjnnb';
const DEFAULT_ORG_SLUG = 'mkvmhmshlztvcvueonya';
const SUPABASE_PAT_EXPIRATION_ISO = '2027-01-04T00:00:00-03:00';
const CACHE_TTL_MS = 60 * 1000; // 60s de cache em memoria para zero auto-consumo

const FREE_DB_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB
const PRO_DB_LIMIT_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB
const FREE_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const PRO_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB
const FREE_MAU_LIMIT = 50_000; // 50.000 MAU no Plano Free
const PRO_MAU_LIMIT = 100_000; // 100.000 MAU no Plano Pro
const FREE_EGRESS_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB Uncached (+ 5 GB Cached)
const PRO_EGRESS_LIMIT_BYTES = 250 * 1024 * 1024 * 1024; // 250 GB Uncached (+ 250 GB Cached)

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
  actionRequired: 'AGIR_AGORA' | 'PREVENTIVO' | 'NENHUMA';
  codeSolution: string;
  actionKey?: string;
  actionLabel?: string;
  retentionHours?: number;
  linkPath?: string;
  linkLabel?: string;
}

export interface FreeTierShieldPillar {
  id: string;
  guideKey:
    | 'pilar_db_disk'
    | 'pilar_storage_files'
    | 'pilar_egress_n1'
    | 'pilar_ram_connections'
    | 'pilar_serverless_loops';
  title: string;
  limitLabel: string;
  directionLabel: string;
  currentValue: string;
  headroomLabel: string;
  status: 'FOLGADO' | 'PREVENTIVO' | 'AGIR_AGORA';
  statusLabel: string;
  triggerRule: string;
  codeFix: string;
  actionKey?: string;
  actionLabel?: string;
  linkPath?: string;
  linkLabel?: string;
}

export interface DowngradeChecklistItem {
  id: string;
  title: string;
  sourceLabel: string;
  freeRequirement: string;
  currentValue: string;
  status: 'APROVADO' | 'ATENCAO' | 'BLOQUEADOR' | 'PENDENTE_API';
  statusLabel: string;
  guidance: string;
}

function formatDatePtBr(ymd: string): string {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

function buildIntelligence(raw: any, platform?: SupabasePlatformSnapshot) {
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
  const topActiveCalls = topQuery
    ? Number(topQuery.calls_since_baseline ?? topQuery.raw_calls ?? 0)
    : 0;

  if (topQuery) {
    if (topActiveCalls >= 100_000) {
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
          ? `O contador acumulado do Postgres registra ${topActiveCalls.toLocaleString('pt-BR')} execucoes na consulta lider (${String(topQuery.query_preview || '').slice(0, 95)}...). Redefina a linha de base para monitorar apenas o trafego novo pos-correcao.`
          : `Desde o ultimo reset de linha de base, uma unica query executou ${topActiveCalls.toLocaleString('pt-BR')} vezes. Inspecione imediatamente para evitar consumo de CPU e Egress.`,
        metric: `${topActiveCalls.toLocaleString('pt-BR')} chamadas`,
        actionRequired: isHistoricalBeforeReset ? 'PREVENTIVO' : 'AGIR_AGORA',
        codeSolution: isHistoricalBeforeReset
          ? 'Clique em "Resetar Linha de Base Agora" para zerar o historico antigo. Se voltar a subir rapido (> 1.000/min), troque chamadas dentro de loops por leitura unica em lote com .in("id", lista) no codigo.'
          : 'Localize a tabela exibida na query lider dentro de src/services/supabase_modules/, substitua loops de queries por 1 chamada bulk .in(), remova .select("*") e adicione cache/paginacao para proteger os 5 GB de Egress do Plano Free.',
        actionKey: 'RESET_QUERY_BASELINE',
        actionLabel: 'Resetar Linha de Base Agora',
      });
    } else if (topActiveCalls >= 25_000) {
      score -= 8;
      diagnostics.push({
        id: 'n1-moderate-calls',
        severity: 'ATENCAO',
        category: 'CONSULTAS_N1',
        title: 'Consulta de Alta Frequencia em Observacao',
        description: `A consulta lider acumulou ${topActiveCalls.toLocaleString('pt-BR')} chamadas (${String(topQuery.query_preview || '').slice(0, 90)}...). Acompanhe a taxa por minuto.`,
        metric: `${topActiveCalls.toLocaleString('pt-BR')} chamadas`,
        actionRequired: 'PREVENTIVO',
        codeSolution:
          'Confira na aba "Consultas & Detector N+1" quantas linhas essa query retorna. No codigo, selecione apenas as colunas usadas na tela (.select("id, name, ...")) e aplique .limit() ou cache de 60s.',
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
      actionRequired: 'AGIR_AGORA',
      codeSolution:
        'O Circuit Breaker no codigo ja salvou sua cota gratuita pausando tentativas repetidas. Reconecte a conta comercial ativa do Conta Azul em /configuracoes e depois clique em "Reiniciar Circuit Breaker".',
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
      actionRequired: 'AGIR_AGORA',
      codeSolution:
        'Faca logoff do painel sandbox @devportal.com no navegador e refaca a autorizacao OAuth2 em /configuracoes com o login comercial da Samppel para eliminar falhas de API e logs desnecessarios.',
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
      actionRequired: !caConfig.configured || recentRefreshError ? 'AGIR_AGORA' : 'NENHUMA',
      codeSolution:
        !caConfig.configured || recentRefreshError
          ? 'Acesse /configuracoes e clique em "Conectar com a Conta Azul" para gravar um novo refresh_token valido.'
          : 'Nenhuma acao manual necessaria: o codigo usa renovacao sob demanda (lazy refresh em getValidAccessToken) justamente para nao gastar cota renovando token de madrugada sem uso.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'A trava de 12 min no codigo ja impediu gasto no banco. Para economizar tambem a chamada serverless na Vercel, desative um dos dois agendadores (mantenha apenas GitHub Actions OU vercel.json).',
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
      actionRequired: last1hError >= 10 ? 'AGIR_AGORA' : 'PREVENTIVO',
      codeSolution:
        'Veja o erro agrupado na aba "Conta Azul, Crons & Filas", corrija a causa raiz e clique em "Limpar Erros > 48h" para nao acumular peso morto nos 500 MB do Plano Free.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Clique em "Expurgar Logs > 48h" ao lado e mantenha a limpeza automatica ativa no cron diario (?mode=full) para que os logs nunca ocupem os 500 MB gratuitos.',
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
      actionRequired: syncStuck > 0 ? 'PREVENTIVO' : 'NENHUMA',
      codeSolution:
        syncStuck > 0
          ? 'Clique em "Destravar Fila PROCESSING" e garanta timeout/try-finally nos workers de sincronizacao no codigo.'
          : 'Apenas informativo: um worker esta processando a fila neste momento.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Limpe falhas antigas em 1 clique. No codigo, evite reenfileirar erros HTTP 4xx permanentes (dados invalidos) para nao desperdiçar ciclos de banco e API.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Clique em "Expurgar Concluidos > 48h" para remover historico antigo da fila e manter o consumo de disco perto de zero.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Clique em "Executar ANALYZE nas Tabelas". No codigo, so execute UPDATE quando algum campo realmente tiver mudado (cada UPDATE identico gera espaco morto a toa no Postgres).',
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
      actionRequired: cacheHitRatio < 90 ? 'AGIR_AGORA' : 'PREVENTIVO',
      codeSolution:
        'Abra a aba "Armazenamento, Tabelas & Indices", veja qual tabela grande tem Eficiencia de Indice baixa (< 50%) e crie um CREATE INDEX SQL nas colunas de busca — isso devolve a velocidade em RAM sem pagar Compute Pro.',
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
      actionRequired: 'AGIR_AGORA',
      codeSolution:
        'Clique em "Encerrar Transacoes Zumbis" agora. No codigo, nunca mantenha uma transacao SQL aberta enquanto espera resposta de API externa lenta.',
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
      actionRequired: connPct >= 85 ? 'AGIR_AGORA' : 'PREVENTIVO',
      codeSolution:
        'Reutilize o cliente singleton em src/services/supabaseClient.ts, evite rajadas Promise.all com dezenas de queries e configure DATABASE_URL na porta 6543 (Supavisor Pooler gratuito).',
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
      actionRequired: patDaysRemaining <= 14 ? 'AGIR_AGORA' : 'PREVENTIVO',
      codeSolution:
        'Gere gratuitamente um novo Personal Access Token nas configuracoes da conta Supabase antes de 04/01/2027 e atualize no ambiente de desenvolvimento.',
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
      actionRequired: 'AGIR_AGORA',
      codeSolution:
        'Execute uma migration SQL com ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY; e crie politicas de acesso restritas por tenant_id e role.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Defina CRON_SECRET gratuitamente nas Environment Variables da Vercel e nos Secrets do GitHub Actions para bloquear disparos externos nao autorizados que gastariam sua cota.',
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
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Revise os contadores na aba "Seguranca, Sessoes & Integridade" e adicione validacao obrigatoria nos servicos TypeScript / constraints SQL para impedir novos registros incompletos.',
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

  const authStats = governance?.auth_stats || {};
  const mauCalendarMonth = Number(authStats.mau_calendar_month ?? 0);
  const mauRolling30d = Number(authStats.mau_rolling_30d ?? 0);
  const mauEffective = Math.max(mauCalendarMonth, mauRolling30d);

  const freeDbPct = Math.round((dbSizeBytes / FREE_DB_LIMIT_BYTES) * 10000) / 100;
  const proDbPct = Math.round((dbSizeBytes / PRO_DB_LIMIT_BYTES) * 10000) / 100;
  const freeStoragePct = Math.round((storageBytes / FREE_STORAGE_LIMIT_BYTES) * 10000) / 100;
  const proStoragePct = Math.round((storageBytes / PRO_STORAGE_LIMIT_BYTES) * 10000) / 100;
  const freeMauPct = Math.round((mauEffective / FREE_MAU_LIMIT) * 10000) / 100;
  const proMauPct = Math.round((mauEffective / PRO_MAU_LIMIT) * 10000) / 100;

  if (freeDbPct >= 80) {
    score -= freeDbPct >= 92 ? 20 : 10;
    diagnostics.unshift({
      id: 'quota-free-db-risk',
      severity: freeDbPct >= 92 ? 'CRITICO' : 'ATENCAO',
      category: 'ARMAZENAMENTO',
      title: 'Consumo de Disco Proximo do Teto do Plano Free (500 MB)',
      description: `O banco atingiu ${formatBytes(dbSizeBytes)} (${freeDbPct}% de 500 MB). Execute limpeza imediata de logs e filas concluidas caso opere no plano Free.`,
      metric: `${freeDbPct}% de 500 MB`,
      actionRequired: freeDbPct >= 90 ? 'AGIR_AGORA' : 'PREVENTIVO',
      codeSolution:
        '1) Clique em "Liberar Espaco em Logs" (24h) e limpe sync_queue COMPLETED; 2) Verifique a maior tabela na aba Armazenamento; 3) Reduza a janela de retencao automatica no codigo para manter o banco abaixo de 300 MB sem pagar o Pro.',
      actionKey: 'PURGE_LOGS_OLDER_THAN',
      actionLabel: 'Liberar Espaco em Logs',
      retentionHours: 24,
    });
  }

  // 9.B. Integracao Oficial com Supabase Management API v1 & Metrics API (Transicao Pro -> Free)
  const mgmt = platform?.managementApi;
  const vm = platform?.vmMetrics;
  const detectedPlan = mgmt?.detectedPlan || 'unknown';
  const orgSlug = mgmt?.organizationId || DEFAULT_ORG_SLUG;
  const orgName = mgmt?.organizationName || 'Samppel';
  const apiGateway = mgmt?.apiGatewayUsage;

  if (
    mgmt?.reachable &&
    detectedPlan === 'pro' &&
    mgmt.otherFreeOrgsActiveProjectsCount >= 2
  ) {
    const activeFreeNames = mgmt.freeOrgProjects
      .filter((p) => p.isActive)
      .slice(0, 4)
      .map((p) => `${p.projectName} (${p.orgName})`)
      .join(', ');
    diagnostics.push({
      id: 'downgrade-two-free-projects-limit',
      severity: 'ATENCAO',
      category: 'NEGOCIO',
      title: 'Atencao para o Downgrade Pro -> Free: Limite Global de 2 Projetos Free Ativos',
      description: `A API oficial da Supabase detectou que o Portal Samppel esta no Plano Pro, mas sua conta possui ${mgmt.otherFreeOrgsActiveProjectsCount} projeto(s) Free ativo(s) em outras organizacoes (${activeFreeNames}). A Supabase limita 2 projetos Free ativos somando todas as orgs onde voce e Owner/Admin.`,
      metric: `${mgmt.otherFreeOrgsActiveProjectsCount} Free ativos em outras orgs`,
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'No dia em que for fazer o downgrade do Portal Samppel para o Plano Free (1 a 2 dias antes de virar a fatura), pause projetos Free sem uso nas outras organizacoes ate sobrar pelo menos 1 vaga Free livre.',
    });
  }

  if (mgmt?.reachable && mgmt.extraPaidOrBlockingAddonsCount > 0) {
    const extraNames = mgmt.selectedAddons
      .filter((a) => a.isExtraPaidOrBlocksFree)
      .map((a) => `${a.name} (${a.priceDescription})`)
      .join(', ');
    score -= 8;
    diagnostics.push({
      id: 'active-paid-addons-blocking-free',
      severity: 'ATENCAO',
      category: 'NEGOCIO',
      title: 'Add-ons Pagos Ativos Detectados via API Oficial da Supabase',
      description: `O endpoint /billing/addons reportou add-on(s) alem do Compute Micro padrao: ${extraNames}. Esses recursos cobram por hora fora do Spend Cap e sao incompativeis com o Plano Free.`,
      metric: `${mgmt.extraPaidOrBlockingAddonsCount} add-on(s) extra(s)`,
      actionRequired: 'PREVENTIVO',
      codeSolution:
        'Desative Custom Domain, PITR, IPv4 ou Compute acima de Micro em Project Settings -> Add-ons antes de encerrar o ciclo Pro para voltar ao Free a custo zero.',
    });
  }

  // 10. Radar Explicito Anti-Upgrade Pro (5 Pilares Fisicos do Plano Free)
  const dbDiskStatus: FreeTierShieldPillar['status'] =
    freeDbPct >= 85 ? 'AGIR_AGORA' : freeDbPct >= 65 ? 'PREVENTIVO' : 'FOLGADO';
  const storageStatus: FreeTierShieldPillar['status'] =
    freeStoragePct >= 85 ? 'AGIR_AGORA' : freeStoragePct >= 65 ? 'PREVENTIVO' : 'FOLGADO';
  const egressStatus: FreeTierShieldPillar['status'] =
    (hasBaseline && topActiveCalls >= 100_000) || rowsPerMin >= 8_000
      ? 'AGIR_AGORA'
      : (!hasBaseline && topActiveCalls >= 100_000) ||
        (hasBaseline && topActiveCalls >= 25_000) ||
        rowsPerMin >= 2_500
      ? 'PREVENTIVO'
      : 'FOLGADO';
  const ramConnStatus: FreeTierShieldPillar['status'] =
    stuckIdleTx5m > 0 || connPct >= 85 || cacheHitRatio < 90
      ? 'AGIR_AGORA'
      : connPct >= 65 || cacheHitRatio < 97
      ? 'PREVENTIVO'
      : 'FOLGADO';
  const serverlessStatus: FreeTierShieldPillar['status'] =
    Boolean(cronCircuit.is_circuit_open) || Boolean(recentEndTrialError) || last1hError >= 10
      ? 'AGIR_AGORA'
      : last1hError >= 4 || syncStuck > 0 || syncFailed > 10
      ? 'PREVENTIVO'
      : 'FOLGADO';

  const statusToLabel = (s: FreeTierShieldPillar['status']) =>
    s === 'AGIR_AGORA'
      ? 'PRECISA AGIR AGORA'
      : s === 'PREVENTIVO'
      ? 'ACAO PREVENTIVA'
      : 'SEM ACAO AGORA (FOLGADO)';

  const apiGatewaySummaryText = apiGateway?.available
    ? ` | API 24h: ${apiGateway.totalRequests.toLocaleString('pt-BR')} reqs`
    : '';

  const freeTierPillars: FreeTierShieldPillar[] = [
    {
      id: 'db_disk',
      guideKey: 'pilar_db_disk',
      title: '1. Disco do Banco Postgres',
      limitLabel: 'Teto Free: 500 MB',
      directionLabel: 'Bom ser BAIXO (< 350 MB)',
      currentValue: `${db.db_size_pretty || formatBytes(dbSizeBytes)} (${freeDbPct}% Free | ${proDbPct}% Pro)`,
      headroomLabel: `${formatBytes(Math.max(0, FREE_DB_LIMIT_BYTES - dbSizeBytes))} livres de 500 MB`,
      status: dbDiskStatus,
      statusLabel: statusToLabel(dbDiskStatus),
      triggerRule: 'Agir apenas se passar de 325 MB (65% do Free)',
      codeFix:
        'Expurgar logs (>48h) e sync_queue concluida; no codigo, manter limpeza automatica no cron diario e nunca salvar arquivos/base64 em tabelas SQL.',
      actionKey: dbDiskStatus !== 'FOLGADO' ? 'PURGE_LOGS_OLDER_THAN' : undefined,
      actionLabel: dbDiskStatus !== 'FOLGADO' ? 'Limpar Logs > 48h' : undefined,
    },
    {
      id: 'storage_files',
      guideKey: 'pilar_storage_files',
      title: '2. Arquivos no Supabase Storage',
      limitLabel: 'Teto Free: 1 GB',
      directionLabel: 'Bom ser BAIXO (< 700 MB)',
      currentValue: `${formatBytes(storageBytes)} (${freeStoragePct}% Free | ${proStoragePct}% Pro)`,
      headroomLabel: `${formatBytes(Math.max(0, FREE_STORAGE_LIMIT_BYTES - storageBytes))} livres (${Number(db.storage_files_count || 0)} arquivo(s))`,
      status: storageStatus,
      statusLabel: statusToLabel(storageStatus),
      triggerRule: 'Agir apenas se passar de 650 MB (65% do Free)',
      codeFix:
        'Comprimir imagens para WebP/JPEG leve no navegador antes do upload, usar cacheControl: "31536000" e remover anexos de pedidos cancelados.',
    },
    {
      id: 'egress_n1',
      guideKey: 'pilar_egress_n1',
      title: '3. Trafego de Rede (Egress) & Anti-N+1',
      limitLabel: 'Teto Free: 5 GB/mes',
      directionLabel: 'Bom ser BAIXO (Poucas linhas/min)',
      currentValue: `${rowsPerMin.toLocaleString('pt-BR')} linhas/min | ${callsPerMin.toLocaleString('pt-BR')} queries/min${apiGatewaySummaryText}`,
      headroomLabel: hasBaseline
        ? `Query lider pos-reset: ${topActiveCalls.toLocaleString('pt-BR')} chamadas`
        : `Acumulado antes do reset: ${topActiveCalls.toLocaleString('pt-BR')} chamadas`,
      status: egressStatus,
      statusLabel:
        !hasBaseline && topActiveCalls >= 100_000
          ? 'ZERAR LINHA DE BASE'
          : statusToLabel(egressStatus),
      triggerRule: 'Agir se 1 query passar de 25 mil chamadas pos-reset ou > 2.500 linhas/min',
      codeFix:
        'Trocar .select("*") pelas colunas exatas, substituir loops por .in("id", lista) em lote, paginar tabelas (.range(0, 49)) e usar cache de 60s em rotas API.',
      actionKey: !hasBaseline && topActiveCalls >= 100_000 ? 'RESET_QUERY_BASELINE' : undefined,
      actionLabel:
        !hasBaseline && topActiveCalls >= 100_000 ? 'Resetar Baseline Agora' : undefined,
    },
    {
      id: 'ram_connections',
      guideKey: 'pilar_ram_connections',
      title: '4. Memoria RAM (Cache Hit) & Conexoes',
      limitLabel: 'Meta: >= 98% RAM | <= 60 Conexoes',
      directionLabel: 'RAM: ALTO | Conexoes: BAIXO',
      currentValue: `RAM ${cacheHitRatio}% | ${totalConnections}/${maxConnections} conexoes`,
      headroomLabel:
        stuckIdleTx5m > 0
          ? `${stuckIdleTx5m} transacao(oes) zumbi(s) travada(s) (> 5 min)`
          : `${Math.max(0, maxConnections - totalConnections)} vagas livres no pool (0 zumbis)`,
      status: ramConnStatus,
      statusLabel: statusToLabel(ramConnStatus),
      triggerRule: 'Agir se RAM < 97%, Conexoes > 42/60 ou Zumbis > 0',
      codeFix:
        'Criar indice SQL (CREATE INDEX) nas colunas filtradas para manter buscas 100% em RAM, rodar ANALYZE, usar cliente Supabase singleton e encerrar zumbis.',
      actionKey:
        stuckIdleTx5m > 0
          ? 'TERMINATE_IDLE_TRANSACTIONS'
          : cacheHitRatio < 97
          ? 'RUN_ANALYZE_CORE_TABLES'
          : undefined,
      actionLabel:
        stuckIdleTx5m > 0
          ? 'Encerrar Zumbis'
          : cacheHitRatio < 97
          ? 'Executar ANALYZE'
          : undefined,
    },
    {
      id: 'serverless_loops',
      guideKey: 'pilar_serverless_loops',
      title: '5. Automacao Serverless, Crons & OAuth',
      limitLabel: 'Meta: Zero Loops de Erro',
      directionLabel: 'Bom ser ZERO (0 falhas/loops)',
      currentValue: `${last24hError} erros/24h | Fila FAILED: ${syncFailed}`,
      headroomLabel: cronCircuit.is_circuit_open
        ? 'Circuit Breaker ABERTO (pausou crons para proteger cota)'
        : recentEndTrialError
        ? 'Sessao conectada em conta de teste END_TRIAL'
        : `Disjuntor fechado | ${blockedCrons} cron(s) duplicado(s) barrado(s)`,
      status: serverlessStatus,
      statusLabel: statusToLabel(serverlessStatus),
      triggerRule: 'Agir se Disjuntor abrir, erro END_TRIAL ou >= 4 erros/hora',
      codeFix:
        'Manter Circuit Breaker e trava de 12 min ativos no codigo, conectar apenas conta comercial Conta Azul e usar Page Visibility em qualquer atualizacao de tela.',
      actionKey: cronCircuit.is_circuit_open
        ? 'RESET_OAUTH_CIRCUIT_BREAKER'
        : syncStuck > 0
        ? 'UNLOCK_STUCK_SYNC_QUEUE'
        : undefined,
      actionLabel: cronCircuit.is_circuit_open
        ? 'Reiniciar Disjuntor'
        : syncStuck > 0
        ? 'Destravar Fila'
        : undefined,
      linkPath:
        cronCircuit.is_circuit_open || Boolean(recentEndTrialError)
          ? '/configuracoes'
          : undefined,
      linkLabel:
        cronCircuit.is_circuit_open || Boolean(recentEndTrialError)
          ? 'Reconectar Conta Azul'
          : undefined,
    },
  ];

  const safePillarsCount = freeTierPillars.filter((p) => p.status === 'FOLGADO').length;
  const hasUrgentPillar =
    freeTierPillars.some((p) => p.status === 'AGIR_AGORA') ||
    diagnostics.some((d) => d.actionRequired === 'AGIR_AGORA');
  const hasPreventivePillar =
    freeTierPillars.some((p) => p.status === 'PREVENTIVO') ||
    diagnostics.some((d) => d.actionRequired === 'PREVENTIVO');

  const overallVerdict: 'FOLGADO' | 'PREVENTIVO' | 'AGIR_AGORA' = hasUrgentPillar
    ? 'AGIR_AGORA'
    : hasPreventivePillar
    ? 'PREVENTIVO'
    : 'FOLGADO';

  const freeTierShield = {
    overallVerdict,
    safePillarsCount,
    totalPillarsCount: freeTierPillars.length,
    verdictBadgeLabel:
      overallVerdict === 'AGIR_AGORA'
        ? 'SIM — ACAO IMEDIATA RECOMENDADA'
        : overallVerdict === 'PREVENTIVO'
        ? 'SEM RISCO DE ESTOURO — AJUSTE PREVENTIVO'
        : 'NAO PRECISA AGIR AGORA — 100% FOLGADO NO FREE',
    headline:
      overallVerdict === 'AGIR_AGORA'
        ? 'Precisa agir agora: ha item ativo consumindo recursos ou bloqueando sincronizacao — resolva abaixo no codigo/1-clique sem precisar pagar o Pro.'
        : overallVerdict === 'PREVENTIVO'
        ? 'Nao ha risco de estourar o Plano Free agora, mas existe ajuste preventivo disponivel para manter tudo enxuto no codigo/banco.'
        : 'Voce NAO precisa tomar nenhuma acao agora. Todos os limites fisicos do Plano Free operam com ampla folga a custo zero.',
    subheadline: `${safePillarsCount} de ${freeTierPillars.length} pilares fisicos do Plano Free estao com margem folgada (Regua Dupla ativa: monitorando tetos do Free mesmo enquanto o Pro estiver vigente neste mes).`,
    pillars: freeTierPillars,
  };

  // 11. Checklist Automatico de Prontidao & Calendario para Downgrade Pro -> Free
  const billingCfg = governance?.billing_transition_config || {};
  const cycleRenewalDate: string | null =
    typeof billingCfg.cycle_renewal_date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(billingCfg.cycle_renewal_date)
      ? billingCfg.cycle_renewal_date
      : null;

  let daysUntilRenewal: number | null = null;
  let idealWindowStart: string | null = null;
  let idealWindowEnd: string | null = null;
  let cycleStatusBadge = 'DATA DO CICLO NAO INFORMADA';
  let cycleGuidanceMessage =
    'Informe ao lado a data de renovacao da sua fatura Pro (visivel em Organization -> Billing -> Upcoming Invoice). Como o downgrade na Supabase tem efeito imediato e nao estorna no cartao, a melhor janela para voltar ao Free e 1 a 2 dias antes da renovacao.';

  if (cycleRenewalDate) {
    const renewalMs = new Date(`${cycleRenewalDate}T00:00:00-03:00`).getTime();
    if (!Number.isNaN(renewalMs)) {
      const nowMidnightApprox = Date.now();
      daysUntilRenewal = Math.ceil((renewalMs - nowMidnightApprox) / (24 * 60 * 60 * 1000));
      const dStart = new Date(renewalMs - 2 * 24 * 60 * 60 * 1000);
      const dEnd = new Date(renewalMs - 1 * 24 * 60 * 60 * 1000);
      idealWindowStart = dStart.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      idealWindowEnd = dEnd.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      if (detectedPlan === 'free') {
        cycleStatusBadge = 'JA OPERANDO NO PLANO FREE';
        cycleGuidanceMessage =
          'A API oficial confirma que sua organizacao ja esta no Plano Free (custo zero). Mantenha os pilares verdes para nunca precisar voltar ao Pro.';
      } else if (daysUntilRenewal > 2) {
        cycleStatusBadge = `FALTAM ${daysUntilRenewal} DIAS PARA VIRAR O CICLO`;
        cycleGuidanceMessage = `Aproveite o Plano Pro ja pago neste mes. Janela ideal para clicar em Downgrade para Free: entre ${idealWindowStart} e ${idealWindowEnd} (1 a 2 dias antes de ${formatDatePtBr(cycleRenewalDate)} para nao gerar nova cobranca de US$ 25).`;
      } else if (daysUntilRenewal >= 0) {
        cycleStatusBadge =
          daysUntilRenewal === 0
            ? 'HOJE E O DIA DE VIRADA DO CICLO'
            : `JANELA IDEAL ABERTA (FALTA(M) ${daysUntilRenewal} DIA(S))`;
        cycleGuidanceMessage = `Momento ideal de acao! Confira se todos os 6 pre-requisitos abaixo estao aprovados e altere o plano para Free antes de ${formatDatePtBr(cycleRenewalDate)} para evitar renovacao automatica.`;
      } else {
        cycleStatusBadge = 'DATA DO CICLO ANTERIOR VENCIDA';
        cycleGuidanceMessage = `A data configurada (${formatDatePtBr(cycleRenewalDate)}) ja passou. Se ja voltou ao Free, sincronize a API; se renovou por mais um ciclo, atualize a nova data.`;
      }
    }
  } else if (detectedPlan === 'free') {
    cycleStatusBadge = 'JA OPERANDO NO PLANO FREE';
    cycleGuidanceMessage =
      'A API oficial confirma que sua organizacao ja opera no Plano Free sem mensalidade.';
  }

  const checklistStatusLabel = (s: DowngradeChecklistItem['status']) =>
    s === 'APROVADO'
      ? 'PRONTO PARA FREE'
      : s === 'ATENCAO'
      ? 'ATENCAO PREVENTIVA'
      : s === 'BLOQUEADOR'
      ? 'IMPEDE DOWNGRADE'
      : 'AGUARDANDO PAT API';

  const dbCheckStatus: DowngradeChecklistItem['status'] =
    dbSizeBytes > FREE_DB_LIMIT_BYTES
      ? 'BLOQUEADOR'
      : freeDbPct >= 75
      ? 'ATENCAO'
      : 'APROVADO';

  const storageCheckStatus: DowngradeChecklistItem['status'] =
    storageBytes > FREE_STORAGE_LIMIT_BYTES
      ? 'BLOQUEADOR'
      : freeStoragePct >= 75
      ? 'ATENCAO'
      : 'APROVADO';

  const mauCheckStatus: DowngradeChecklistItem['status'] =
    mauEffective > FREE_MAU_LIMIT
      ? 'BLOQUEADOR'
      : freeMauPct >= 75
      ? 'ATENCAO'
      : 'APROVADO';

  let addonsCheckStatus: DowngradeChecklistItem['status'] = 'PENDENTE_API';
  let addonsCurrentValue = 'Aguardando SUPABASE_ACCESS_TOKEN';
  let addonsGuidance =
    'Configure SUPABASE_ACCESS_TOKEN nas Environment Variables da Vercel para verificar automaticamente Compute e Add-ons via /v1/projects/{ref}/billing/addons.';

  if (mgmt?.reachable) {
    const activeInOrg = mgmt.activeProjectsInCurrentOrg || 1;
    if (mgmt.extraPaidOrBlockingAddonsCount === 0 && activeInOrg <= 2) {
      addonsCheckStatus = 'APROVADO';
      addonsCurrentValue = `Compute ${mgmt.computeSizeLabel || 'Micro Padrao'} | 0 add-ons extras | ${activeInOrg} projeto na org`;
      addonsGuidance =
        'Nenhum add-on pago extra (Custom Domain, PITR, IPv4, Read Replica) ativo. No downgrade, a instancia Micro reverte automaticamente para o tier gratuito.';
    } else {
      addonsCheckStatus = 'BLOQUEADOR';
      const extraList = mgmt.selectedAddons
        .filter((a) => a.isExtraPaidOrBlocksFree)
        .map((a) => a.name)
        .join(', ');
      addonsCurrentValue =
        activeInOrg > 2
          ? `${activeInOrg} projetos ativos nesta org (maximo 2 no Free)`
          : `${mgmt.extraPaidOrBlockingAddonsCount} add-on(s) extra(s): ${extraList}`;
      addonsGuidance =
        activeInOrg > 2
          ? 'Transfira ou pause projetos excedentes desta organizacao (o Free aceita ate 2 projetos ativos).'
          : 'Remova os add-ons pagos listados em Project Settings -> Add-ons antes de mudar para o Plano Free.';
    }
  }

  let freeSlotsCheckStatus: DowngradeChecklistItem['status'] = 'PENDENTE_API';
  let freeSlotsCurrentValue = 'Aguardando SUPABASE_ACCESS_TOKEN';
  let freeSlotsGuidance =
    'Configure SUPABASE_ACCESS_TOKEN na Vercel para auditar quantos projetos Free ativos sua conta possui em outras organizacoes.';

  if (mgmt?.reachable) {
    if (detectedPlan === 'free') {
      freeSlotsCheckStatus = 'APROVADO';
      freeSlotsCurrentValue = `Ja no Free (${mgmt.allFreeOrgsActiveProjectsCount} projeto(s) Free ativo(s) visiveis)`;
      freeSlotsGuidance = 'Organizacao atual ja esta enquadrada dentro do Plano Free.';
    } else {
      const neededSlots = mgmt.activeProjectsInCurrentOrg || 1;
      const otherFreeActive = mgmt.otherFreeOrgsActiveProjectsCount;
      if (otherFreeActive + neededSlots <= 2) {
        freeSlotsCheckStatus = 'APROVADO';
        freeSlotsCurrentValue = `${otherFreeActive} projeto(s) Free ativo(s) em outras orgs (cabe no limite de 2)`;
        freeSlotsGuidance =
          'Sua conta possui vaga livre no limite global de 2 projetos Free ativos para receber o Portal Samppel.';
      } else {
        freeSlotsCheckStatus = 'BLOQUEADOR';
        const names = mgmt.freeOrgProjects
          .filter((p) => p.isActive)
          .map((p) => `${p.projectName} [${p.orgName}]`)
          .join(', ');
        freeSlotsCurrentValue = `${otherFreeActive} Free ativos em outras orgs: ${names}`;
        freeSlotsGuidance =
          'A Supabase soma o limite de 2 projetos Free ativos em todas as orgs onde voce e Owner/Admin. Antes de clicar em Downgrade no Portal Samppel, pause projetos Free sem uso ate restar no maximo 1 ativo fora desta org.';
      }
    }
  }

  const egressCheckStatus: DowngradeChecklistItem['status'] =
    egressStatus === 'AGIR_AGORA'
      ? 'BLOQUEADOR'
      : egressStatus === 'PREVENTIVO'
      ? 'ATENCAO'
      : 'APROVADO';

  const stageMoves24h = Number(authStats.stage_moves_24h ?? 0);
  const vmTxSummary =
    vm?.available && vm.networkTxBytesTotal !== null
      ? ` | Rede VM acumulada: ${formatBytes(vm.networkTxBytesTotal)}`
      : '';

  const downgradeChecklist: DowngradeChecklistItem[] = [
    {
      id: 'db_size_500mb',
      title: '1. Disco do Banco <= 500 MB',
      sourceLabel: 'SQL Exato (pg_database_size)',
      freeRequirement: 'Maximo 500 MB (Ideal < 350 MB)',
      currentValue: `${db.db_size_pretty || formatBytes(dbSizeBytes)} (${freeDbPct}% do Free | ${proDbPct}% do Pro)`,
      status: dbCheckStatus,
      statusLabel: checklistStatusLabel(dbCheckStatus),
      guidance:
        dbCheckStatus === 'APROVADO'
          ? `Ampla folga: restam ${formatBytes(Math.max(0, FREE_DB_LIMIT_BYTES - dbSizeBytes))} livres dentro do teto gratuito de 500 MB.`
          : 'Execute limpeza de logs e filas concluidas na aba Manutencao antes do downgrade.',
    },
    {
      id: 'storage_1gb',
      title: '2. Arquivos Storage <= 1 GB',
      sourceLabel: 'SQL Exato (storage.objects)',
      freeRequirement: 'Maximo 1 GB (1.024 MB)',
      currentValue: `${formatBytes(storageBytes)} (${freeStoragePct}% do Free | ${Number(db.storage_files_count || 0)} arq.)`,
      status: storageCheckStatus,
      statusLabel: checklistStatusLabel(storageCheckStatus),
      guidance:
        storageCheckStatus === 'APROVADO'
          ? 'Consumo de Storage perfeitamente enquadrado na franquia gratuita de 1 GB.'
          : 'Remova arquivos antigos ou comprima imagens nos buckets antes de voltar ao Free.',
    },
    {
      id: 'mau_50k',
      title: '3. Usuarios Ativos (MAU) <= 50.000',
      sourceLabel: 'SQL Exato (auth.users 30d)',
      freeRequirement: 'Maximo 50.000 MAU/mes',
      currentValue: `${mauEffective.toLocaleString('pt-BR')} MAU (${freeMauPct}% do Free | ${Number(authStats.auth_users_count || 0)} contas)`,
      status: mauCheckStatus,
      statusLabel: checklistStatusLabel(mauCheckStatus),
      guidance:
        'Operacao corporativa interna usa menos de 0,1% da franquia gratuita de 50.000 usuarios mensais.',
    },
    {
      id: 'zero_paid_addons',
      title: '4. Zero Add-ons Pagos Incompativeis',
      sourceLabel: 'Management API (/billing/addons)',
      freeRequirement: '0 add-ons extras e <= 2 projetos na org',
      currentValue: addonsCurrentValue,
      status: addonsCheckStatus,
      statusLabel: checklistStatusLabel(addonsCheckStatus),
      guidance: addonsGuidance,
    },
    {
      id: 'two_free_projects_quota',
      title: '5. Vaga no Limite de 2 Projetos Free Ativos',
      sourceLabel: 'Management API (/organizations + /projects)',
      freeRequirement: 'Ate 2 projetos Free ativos por Owner/Admin',
      currentValue: freeSlotsCurrentValue,
      status: freeSlotsCheckStatus,
      statusLabel: checklistStatusLabel(freeSlotsCheckStatus),
      guidance: freeSlotsGuidance,
    },
    {
      id: 'egress_and_activity_free',
      title: '6. Ritmo de Egress (<= 5 GB) & Anti-Pausa 7d',
      sourceLabel: 'SQL + API Gateway + Metrics VM',
      freeRequirement: '5 GB Uncached + Atividade < 7 dias',
      currentValue: `${rowsPerMin.toLocaleString('pt-BR')} linhas/min${apiGatewaySummaryText}${vmTxSummary}`,
      status: egressCheckStatus,
      statusLabel: checklistStatusLabel(egressCheckStatus),
      guidance: `Gargalo N+1 eliminado e atividade diaria ativa (${stageMoves24h} mov. Kanban/24h + sync incremental), evitando pausa por inatividade de 7 dias no Free.`,
    },
  ];

  const approvedChecklistCount = downgradeChecklist.filter(
    (c) => c.status === 'APROVADO'
  ).length;
  const blockingChecklistCount = downgradeChecklist.filter(
    (c) => c.status === 'BLOQUEADOR'
  ).length;
  const pendingApiChecklistCount = downgradeChecklist.filter(
    (c) => c.status === 'PENDENTE_API'
  ).length;

  const planAndDowngradeReadiness = {
    detectedPlan,
    detectedPlanLabel:
      detectedPlan === 'pro'
        ? 'PRO ATIVO (API OFICIAL)'
        : detectedPlan === 'free'
        ? 'FREE ATIVO (API OFICIAL)'
        : detectedPlan === 'team'
        ? 'TEAM ATIVO (API OFICIAL)'
        : detectedPlan === 'enterprise'
        ? 'ENTERPRISE ATIVO (API OFICIAL)'
        : mgmt?.configured
        ? 'VERIFICANDO API...'
        : 'AGUARDANDO PAT NA VERCEL',
    targetPlan: 'free' as const,
    targetPlanLabel: 'RETORNO AO FREE (CUSTO ZERO)',
    organizationId: orgSlug,
    organizationName: orgName,
    projectName: mgmt?.projectName || 'Portal Samppel',
    projectStatus: mgmt?.projectStatus || 'ACTIVE_HEALTHY',
    computeSizeLabel: mgmt?.computeSizeLabel || null,
    selectedAddons: mgmt?.selectedAddons || [],
    extraPaidOrBlockingAddonsCount: mgmt?.extraPaidOrBlockingAddonsCount ?? 0,
    otherFreeOrgsActiveProjectsCount: mgmt?.otherFreeOrgsActiveProjectsCount ?? 0,
    freeOrgProjects: mgmt?.freeOrgProjects || [],
    apiGatewayUsage: apiGateway || null,
    vmMetrics: vm || null,
    managementApiConfigured: Boolean(mgmt?.configured),
    managementApiReachable: Boolean(mgmt?.reachable),
    managementApiReason: mgmt?.reason || null,
    platformCached: Boolean(platform?.cached),
    platformCacheAgeSec: platform?.cacheAgeSec ?? 0,
    platformCollectedAt: platform?.collectedAt || null,
    billingCycle: {
      cycleRenewalDate,
      daysUntilRenewal,
      idealWindowStart,
      idealWindowEnd,
      statusBadge: cycleStatusBadge,
      guidanceMessage: cycleGuidanceMessage,
      billingDashboardUrl: `https://supabase.com/dashboard/org/${orgSlug}/billing`,
      usageDashboardUrl: `https://supabase.com/dashboard/org/${orgSlug}/usage`,
      addonsDashboardUrl: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/addons`,
    },
    checklist: downgradeChecklist,
    approvedChecklistCount,
    totalChecklistCount: downgradeChecklist.length,
    blockingChecklistCount,
    pendingApiChecklistCount,
    readyForCleanDowngrade:
      blockingChecklistCount === 0 && pendingApiChecklistCount === 0,
  };

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
    freeTierShield,
    planAndDowngradeReadiness,
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
        mauLimit: FREE_MAU_LIMIT,
        mauLimitPretty: '50.000 MAU',
        mauUsed: mauEffective,
        mauUsedPct: freeMauPct,
        egressLimitBytes: FREE_EGRESS_LIMIT_BYTES,
        egressLimitPretty: '5 GB uncached + 5 GB cached',
      },
      pro: {
        dbLimitBytes: PRO_DB_LIMIT_BYTES,
        dbLimitPretty: '8 GB',
        dbUsedPct: proDbPct,
        storageLimitBytes: PRO_STORAGE_LIMIT_BYTES,
        storageLimitPretty: '100 GB',
        storageUsedPct: proStoragePct,
        mauLimit: PRO_MAU_LIMIT,
        mauLimitPretty: '100.000 MAU',
        mauUsed: mauEffective,
        mauUsedPct: proMauPct,
        egressLimitBytes: PRO_EGRESS_LIMIT_BYTES,
        egressLimitPretty: '250 GB uncached + 250 GB cached',
      },
      connections: {
        used: totalConnections,
        max: maxConnections,
        usedPct: connPct,
      },
    },
    environment: {
      ownerEmail: OWNER_MONITORING_EMAIL,
      supabaseProjectRef: SUPABASE_PROJECT_REF,
      supabaseOrganizationSlug: orgSlug,
      region: 'sa-east-1 (Sao Paulo)',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://portalsamppel.vercel.app',
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseAccessToken: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
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
  const forceApi = searchParams.get('forceApi') === 'true';

  if (
    !force &&
    !forceApi &&
    telemetryMemoryCache &&
    Date.now() - telemetryMemoryCache.timestamp < CACHE_TTL_MS
  ) {
    return NextResponse.json({
      ...telemetryMemoryCache.payload,
      cached: true,
      cacheAgeSec: Math.round((Date.now() - telemetryMemoryCache.timestamp) / 1000),
    });
  }

  const rpcStartMs = Date.now();
  const [rpcRes, platformSnapshot] = await Promise.all([
    (async () => {
      const res = await supabaseAdmin.rpc('get_system_monitoring_telemetry', {
        p_tenant_id: DEFAULT_TENANT_ID,
      });
      return { ...res, latencyMs: Date.now() - rpcStartMs };
    })(),
    fetchSupabasePlatformSnapshot({
      projectRef: SUPABASE_PROJECT_REF,
      force: forceApi,
    }),
  ]);

  const rawTelemetry = rpcRes.data;
  const error = rpcRes.error;
  const rpcLatencyMs = rpcRes.latencyMs;

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

  const intelligence = buildIntelligence(rawTelemetry, platformSnapshot);
  const payload = {
    success: true,
    cached: false,
    cacheAgeSec: 0,
    rpcLatencyMs,
    telemetry: rawTelemetry,
    platform: platformSnapshot,
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
    if (action === 'REFRESH_PLATFORM_API') {
      clearSupabasePlatformCache();
      telemetryMemoryCache = null;
      const freshPlatform = await fetchSupabasePlatformSnapshot({
        projectRef: SUPABASE_PROJECT_REF,
        force: true,
      });
      return NextResponse.json({
        success: true,
        action,
        message: freshPlatform.managementApi.reachable
          ? `API oficial da Supabase sincronizada (Plano detectado: ${freshPlatform.managementApi.detectedPlan.toUpperCase()}).`
          : freshPlatform.vmMetrics.available
          ? 'Metricas Prometheus da VM sincronizadas. Configure SUPABASE_ACCESS_TOKEN na Vercel para liberar Management API v1.'
          : 'Cache da API limpo. Verifique SUPABASE_ACCESS_TOKEN nas variaveis de ambiente da Vercel.',
      });
    }

    if (action === 'SET_BILLING_CYCLE_DATE') {
      const rawDate =
        body?.cycleRenewalDate === null || body?.cycleRenewalDate === undefined
          ? ''
          : String(body.cycleRenewalDate).trim();

      if (rawDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        return NextResponse.json(
          { error: 'Formato de data invalido. Utilize AAAA-MM-DD.' },
          { status: 400 }
        );
      }

      if (rawDate !== '') {
        const parsedMs = new Date(`${rawDate}T00:00:00-03:00`).getTime();
        if (Number.isNaN(parsedMs)) {
          return NextResponse.json(
            { error: 'Data de renovacao do ciclo invalida.' },
            { status: 400 }
          );
        }
      }

      const nextConfig = {
        cycle_renewal_date: rawDate || null,
        updated_at: new Date().toISOString(),
        updated_by: OWNER_MONITORING_EMAIL,
      };

      const { error: updateErr } = await supabaseAdmin
        .from('system_monitoring_state')
        .update({
          billing_transition_config: nextConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'global');

      if (updateErr) {
        throw updateErr;
      }

      telemetryMemoryCache = null;

      return NextResponse.json({
        success: true,
        action,
        cycleRenewalDate: rawDate || null,
        message: rawDate
          ? `Data de renovacao do ciclo Pro salva (${formatDatePtBr(rawDate)}). A janela ideal de downgrade foi calculada.`
          : 'Data de renovacao do ciclo Pro removida.',
      });
    }

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
      const [rpcRes, platformSnapshot] = await Promise.all([
        supabaseAdmin.rpc('get_system_monitoring_telemetry', {
          p_tenant_id: DEFAULT_TENANT_ID,
        }),
        fetchSupabasePlatformSnapshot({
          projectRef: SUPABASE_PROJECT_REF,
          force: false,
        }),
      ]);
      const rawTelemetry = rpcRes.data;
      const error = rpcRes.error;
      if (error || !rawTelemetry) {
        throw new Error(error?.message || 'Falha ao coletar telemetria para envio do relatorio.');
      }
      const intel = buildIntelligence(rawTelemetry, platformSnapshot);
      const db = rawTelemetry.database || {};
      const logs = rawTelemetry.integration?.logs || {};
      const sq = rawTelemetry.integration?.sync_queue || {};
      const pdr = intel.planAndDowngradeReadiness;

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
          'Plano Oficial (API)': `${pdr.detectedPlanLabel} | Prontidao Free: ${pdr.approvedChecklistCount}/${pdr.totalChecklistCount} aprovados`,
          'Tamanho do Banco': `${db.db_size_pretty || 'N/A'} (${intel.quotas.free.dbUsedPct}% Free / ${intel.quotas.pro.dbUsedPct}% Pro)`,
          'Usuarios Ativos (MAU)': `${intel.quotas.free.mauUsed} / 50.000 Free (${intel.quotas.free.mauUsedPct}%)`,
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
