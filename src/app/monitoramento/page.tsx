'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/apiFetch';
import styles from './monitoring.module.css';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  FileWarning,
  Filter,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  Unlock,
  Wrench,
  Zap,
} from 'lucide-react';

const OWNER_EMAIL = 'junior.8350i@gmail.com';

type TabKey =
  | 'overview'
  | 'queries'
  | 'storage'
  | 'integration'
  | 'governance'
  | 'maintenance';

type QuerySortMode = 'calls' | 'time' | 'latency';

interface ConfirmActionState {
  action: string;
  title: string;
  description: string;
  retentionHours?: number;
  danger?: boolean;
}

interface ActionExecutionEntry {
  at: string;
  action: string;
  ok: boolean;
  message: string;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'Nunca registrado';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('pt-BR');
}

function formatNumber(val: unknown): string {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('pt-BR');
}

function formatBytesClient(bytes: unknown): string {
  const b = Number(bytes ?? 0);
  if (!Number.isFinite(b) || b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let val = b;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx >= 2 ? 2 : 0)} ${units[idx]}`;
}

function SparklineChart({
  title,
  currentLabel,
  points,
  strokeVar = 'var(--primary)',
}: {
  title: string;
  currentLabel: string;
  points: number[];
  strokeVar?: string;
}) {
  const width = 280;
  const height = 64;
  const pad = 6;

  const pathData = useMemo(() => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) {
      const y = height / 2;
      return `M ${pad} ${y} L ${width - pad} ${y}`;
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const stepX = (width - pad * 2) / (points.length - 1);

    return points
      .map((val, i) => {
        const x = pad + i * stepX;
        const y = height - pad - ((val - min) / range) * (height - pad * 2);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <div className={styles.sparkChartBox}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiLabel}>{title}</span>
        <span className={styles.monoCell}>{currentLabel}</span>
      </div>
      {points.length === 0 ? (
        <div className={styles.metaText}>Aguardando serie de snapshots...</div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.sparkSvg}
          preserveAspectRatio="none"
          aria-label={title}
        >
          <path
            d={pathData}
            fill="none"
            stroke={strokeVar}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div className={styles.metaText}>
        {points.length} ponto(s) coletado(s) (janela automatica de 15 min)
      </div>
    </div>
  );
}

export default function MonitoramentoPage() {
  const { user } = useAuth();
  const isOwner = user?.email?.toLowerCase().trim() === OWNER_EMAIL;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [planTier, setPlanTier] = useState<'free' | 'pro'>('free');
  const [autoRefresh5m, setAutoRefresh5m] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const [queryMode, setQueryMode] = useState<QuerySortMode>('calls');
  const [querySearch, setQuerySearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [retentionHours, setRetentionHours] = useState<number>(48);

  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmActionState | null>(null);
  const [cognitoCheckResult, setCognitoCheckResult] = useState<any | null>(null);
  const [executionLog, setExecutionLog] = useState<ActionExecutionEntry[]>([]);

  const fetchTelemetry = useCallback(
    async (force = false) => {
      if (!isOwner) return;
      if (force) {
        setRefreshing(true);
      } else if (!data) {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await authenticatedFetch(
          `/api/admin/monitoring${force ? '?force=true' : ''}`,
          { method: 'GET', cache: 'no-store' }
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || `Falha HTTP ${res.status}`);
        }
        setData(json);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Erro ao carregar telemetria da Central de Monitoramento.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isOwner, data]
  );

  useEffect(() => {
    if (isOwner) {
      fetchTelemetry(false);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  // Auto-refresh opcional a cada 5 minutos, pausado automaticamente se a aba estiver em segundo plano
  useEffect(() => {
    if (!isOwner || !autoRefresh5m) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchTelemetry(true);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOwner, autoRefresh5m, fetchTelemetry]);

  const executeAction = async (action: string, customRetentionHours?: number) => {
    setActionBusy(action);
    setFeedback(null);
    setConfirmModal(null);

    try {
      const res = await authenticatedFetch('/api/admin/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          retentionHours:
            customRetentionHours !== undefined ? customRetentionHours : retentionHours,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error || `Falha HTTP ${res.status}`);
      }

      if (action === 'CHECK_COGNITO_APP' && json.cognitoCheck) {
        setCognitoCheckResult(json.cognitoCheck);
      }

      const msg = json.message || 'Operacao executada com sucesso.';
      const okStatus = action === 'CHECK_COGNITO_APP' ? Boolean(json.cognitoCheck?.ok) : true;

      setFeedback({ ok: okStatus, text: msg });
      setExecutionLog((prev) =>
        [
          {
            at: new Date().toLocaleTimeString('pt-BR'),
            action,
            ok: okStatus,
            message: msg,
          },
          ...prev,
        ].slice(0, 15)
      );

      if (action !== 'CHECK_COGNITO_APP' && action !== 'SEND_EXECUTIVE_EMAIL') {
        await fetchTelemetry(true);
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao executar acao de manutencao.';
      setFeedback({ ok: false, text: msg });
      setExecutionLog((prev) =>
        [
          {
            at: new Date().toLocaleTimeString('pt-BR'),
            action,
            ok: false,
            message: msg,
          },
          ...prev,
        ].slice(0, 15)
      );
    } finally {
      setActionBusy(null);
    }
  };

  const telemetry = data?.telemetry || {};
  const intel = data?.intelligence || {};
  const db = telemetry.database || {};
  const queries = telemetry.queries || {};
  const tables = telemetry.tables || {};
  const integration = telemetry.integration || {};
  const governance = telemetry.governance || {};
  const history: any[] = Array.isArray(telemetry.history) ? telemetry.history : [];
  const diagnostics: any[] = Array.isArray(intel.diagnostics) ? intel.diagnostics : [];

  const activeQuota = planTier === 'free' ? intel.quotas?.free : intel.quotas?.pro;
  const dbUsedPct = Number(activeQuota?.dbUsedPct ?? 0);
  const connUsedPct = Number(intel.quotas?.connections?.usedPct ?? 0);

  const queryRows = useMemo(() => {
    const rawList =
      queryMode === 'calls'
        ? queries.top_by_calls
        : queryMode === 'time'
        ? queries.top_by_total_time
        : queries.top_by_mean_latency;
    const arr = Array.isArray(rawList) ? rawList : [];
    const term = querySearch.trim().toLowerCase();
    if (!term) return arr;
    return arr.filter((q: any) =>
      String(q.query_preview || '').toLowerCase().includes(term)
    );
  }, [queries, queryMode, querySearch]);

  const filteredTables = useMemo(() => {
    const arr = Array.isArray(tables.table_stats) ? tables.table_stats : [];
    const term = tableSearch.trim().toLowerCase();
    if (!term) return arr;
    return arr.filter(
      (t: any) =>
        String(t.table_name || '').toLowerCase().includes(term) ||
        String(t.schemaname || '').toLowerCase().includes(term)
    );
  }, [tables, tableSearch]);

  const dbSizeSeries = useMemo(
    () => history.map((h) => Math.round((Number(h.db_size_bytes || 0) / (1024 * 1024)) * 100) / 100),
    [history]
  );
  const callsSeries = useMemo(
    () => history.map((h) => Number(h.total_query_calls || 0)),
    [history]
  );
  const connSeries = useMemo(
    () => history.map((h) => Number(h.active_connections || 0)),
    [history]
  );
  const errSeries = useMemo(
    () => history.map((h) => Number(h.logs_error_24h || 0)),
    [history]
  );

  if (!isOwner) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.cardPanel}>
          <div className={styles.sectionHeader}>
            <h1 className={styles.sectionTitle}>
              <ShieldAlert size={20} />
              <span>Acesso Exclusivo Restrito</span>
            </h1>
          </div>
          <p className={styles.pageSubtitle}>
            Esta central de telemetria e governanca de infraestrutura esta habilitada exclusivamente para o proprietario ({OWNER_EMAIL}).
          </p>
        </div>
      </div>
    );
  }

  const healthBadgeClass =
    intel.healthStatus === 'SAUDAVEL'
      ? styles.badgeSuccess
      : intel.healthStatus === 'CRITICO'
      ? styles.badgeDanger
      : styles.badgeWarning;

  return (
    <div className={styles.pageWrapper}>
      {/* ── CABECALHO PRINCIPAL ─────────────────────────────────────────── */}
      <header className={styles.headerBar}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.ownerPillRow}>
            <span className={`${styles.badge} ${styles.badgeInfo}`}>
              <Lock size={12} />
              <span>Acesso Exclusivo: {OWNER_EMAIL}</span>
            </span>
            <span className={`${styles.badge} ${styles.badgeNeutral}`}>
              Projeto: {intel.environment?.supabaseProjectRef || 'cywbfcrtuawsgtbsjnnb'}
            </span>
            {data && (
              <span className={styles.metaText}>
                RPC: {data.rpcLatencyMs ?? 0}ms |{' '}
                {data.cached ? `Cache (${data.cacheAgeSec}s)` : 'Coleta Direta'} |{' '}
                {formatDateTime(telemetry.collected_at)}
              </span>
            )}
          </div>
          <h1 className={styles.pageTitle}>
            <Activity size={23} />
            <span>Central de Monitoramento, Telemetria Anti-Estouro e Governanca</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Vigilancia preventiva de cotas Supabase, detector de tempestades N+1, eficiencia de indices, Circuit Breaker Conta Azul e resposta em 1 clique com auto-consumo zero.
          </p>
        </div>

        <div className={styles.headerControls}>
          <button
            type="button"
            onClick={() => setAutoRefresh5m((v) => !v)}
            className={autoRefresh5m ? styles.btnPrimary : styles.btnSecondary}
            title="Atualiza a cada 5 min apenas enquanto esta aba estiver visivel"
          >
            <Clock size={15} />
            <span>Auto 5m: {autoRefresh5m ? 'Ativo' : 'Pausado'}</span>
          </button>

          <button
            type="button"
            onClick={() => executeAction('RECORD_MANUAL_SNAPSHOT')}
            disabled={Boolean(actionBusy) || loading}
            className={styles.btnSecondary}
          >
            <Layers size={15} />
            <span>Gravar Snapshot</span>
          </button>

          <button
            type="button"
            onClick={() => executeAction('SEND_EXECUTIVE_EMAIL')}
            disabled={Boolean(actionBusy) || loading}
            className={styles.btnSecondary}
          >
            <Mail size={15} />
            <span>Enviar Resumo E-mail</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/cywbfcrtuawsgtbsjnnb/reports"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSecondary}
          >
            <span>Supabase Reports</span>
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={() => fetchTelemetry(true)}
            disabled={refreshing || loading}
            className={styles.btnPrimary}
          >
            <RefreshCw size={15} className={refreshing ? styles.spinIcon : ''} />
            <span>{refreshing ? 'Coletando...' : 'Atualizar Agora'}</span>
          </button>
        </div>
      </header>

      {/* ── FEEDBACK DE OPERACAO OU ERRO ────────────────────────────────── */}
      {feedback && (
        <div
          className={`${styles.feedbackBanner} ${
            feedback.ok ? styles.feedbackSuccess : styles.feedbackError
          }`}
        >
          <div className={styles.ownerPillRow}>
            {feedback.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className={styles.btnGhost}
          >
            Fechar
          </button>
        </div>
      )}

      {errorMsg && (
        <div className={`${styles.feedbackBanner} ${styles.feedbackError}`}>
          <div className={styles.ownerPillRow}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchTelemetry(true)}
            className={styles.btnSecondary}
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* ── NAVEGACAO POR ABAS ──────────────────────────────────────────── */}
      <nav className={styles.tabsBar} aria-label="Abas de Monitoramento">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
        >
          <Activity size={16} />
          <span>Visao Geral & Alertas</span>
          {diagnostics.length > 0 && (
            <span className={styles.tabCount}>{diagnostics.length}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queries')}
          className={`${styles.tabBtn} ${activeTab === 'queries' ? styles.tabBtnActive : ''}`}
        >
          <Zap size={16} />
          <span>Consultas & Detector N+1</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('storage')}
          className={`${styles.tabBtn} ${activeTab === 'storage' ? styles.tabBtnActive : ''}`}
        >
          <HardDrive size={16} />
          <span>Armazenamento, Tabelas & Indices</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integration')}
          className={`${styles.tabBtn} ${activeTab === 'integration' ? styles.tabBtnActive : ''}`}
        >
          <RefreshCw size={16} />
          <span>Conta Azul, Crons & Filas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('governance')}
          className={`${styles.tabBtn} ${activeTab === 'governance' ? styles.tabBtnActive : ''}`}
        >
          <ShieldCheck size={16} />
          <span>Seguranca, Sessoes & Integridade</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`${styles.tabBtn} ${activeTab === 'maintenance' ? styles.tabBtnActive : ''}`}
        >
          <Wrench size={16} />
          <span>Manutencao & Resposta Rapida</span>
        </button>
      </nav>

      {loading && !data ? (
        <div className={styles.cardPanel}>
          <div className={styles.emptyState}>
            Coletando telemetria consolidada do Postgres em chamada unica...
          </div>
        </div>
      ) : (
        <>
          {/* ================================================================
              ABA 1: VISAO GERAL & ALERTAS
              ================================================================ */}
          {activeTab === 'overview' && (
            <>
              <div className={styles.kpiGrid}>
                {/* KPI 1: Health Score */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Score de Saude Geral</span>
                    <span className={`${styles.badge} ${healthBadgeClass}`}>
                      {intel.healthStatus || 'ANALISANDO'}
                    </span>
                  </div>
                  <div className={styles.kpiValue}>{intel.healthScore ?? 100}/100</div>
                  <div className={styles.kpiSubtext}>
                    <span>{diagnostics.length} apontamento(s) ativo(s)</span>
                    <span>RLS exposto: {tables.public_tables_without_rls ?? 0}</span>
                  </div>
                </div>

                {/* KPI 2: Disco & Cota */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>
                      Disco Postgres ({planTier === 'free' ? 'Plano Free 500 MB' : 'Plano Pro 8 GB'})
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlanTier((p) => (p === 'free' ? 'pro' : 'free'))}
                      className={`${styles.btnSecondary} ${styles.btnSmall}`}
                    >
                      Simular {planTier === 'free' ? 'Pro' : 'Free'}
                    </button>
                  </div>
                  <div className={styles.kpiValue}>{db.db_size_pretty || '0 MB'}</div>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${
                        dbUsedPct >= 85
                          ? styles.fillDanger
                          : dbUsedPct >= 65
                          ? styles.fillWarning
                          : styles.fillPrimary
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, dbUsedPct))}%` }}
                    />
                  </div>
                  <div className={styles.kpiSubtext}>
                    <span>
                      {dbUsedPct}% de {activeQuota?.dbLimitPretty || '500 MB'}
                    </span>
                    <span>Tendencia: {intel.velocity?.dbGrowthPrettyPerDay || 'Estavel'}</span>
                  </div>
                </div>

                {/* KPI 3: Velocidade SQL / Anti-Egress */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Ritmo de Consultas & Linhas</span>
                    <Zap size={16} />
                  </div>
                  <div className={styles.kpiValue}>
                    {formatNumber(intel.velocity?.callsPerMin ?? 0)}/min
                  </div>
                  <div className={styles.kpiSubtext}>
                    <span>{formatNumber(intel.velocity?.rowsPerMin ?? 0)} linhas/min</span>
                    <span>
                      Desde reset: {formatNumber(queries.total_calls_since_baseline ?? 0)}
                    </span>
                  </div>
                </div>

                {/* KPI 4: Pool de Conexoes & RAM Cache */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Conexoes & Cache Hit RAM</span>
                    <Cpu size={16} />
                  </div>
                  <div className={styles.kpiValue}>
                    {db.total_connections ?? 0}/{db.max_connections ?? 60}
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${
                        connUsedPct >= 80
                          ? styles.fillDanger
                          : connUsedPct >= 60
                          ? styles.fillWarning
                          : styles.fillSuccess
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, connUsedPct))}%` }}
                    />
                  </div>
                  <div className={styles.kpiSubtext}>
                    <span>Buffer RAM: {db.cache_hit_ratio ?? 100}%</span>
                    <span>Zumbis (&gt;5m): {db.stuck_idle_in_tx_5m ?? 0}</span>
                  </div>
                </div>

                {/* KPI 5: Integracao Conta Azul & Filas */}
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Conta Azul, Crons & Outbox</span>
                    <span
                      className={`${styles.badge} ${
                        integration.cron_and_circuit?.is_circuit_open
                          ? styles.badgeDanger
                          : integration.ca_config?.is_token_expired
                          ? styles.badgeWarning
                          : styles.badgeSuccess
                      }`}
                    >
                      {integration.cron_and_circuit?.is_circuit_open
                        ? 'Circuit Aberto'
                        : integration.ca_config?.is_token_expired
                        ? 'Token Expirado'
                        : 'Token Ativo'}
                    </span>
                  </div>
                  <div className={styles.kpiValue}>
                    {formatNumber(integration.logs?.last_24h_error ?? 0)} erros/24h
                  </div>
                  <div className={styles.kpiSubtext}>
                    <span>
                      Fila: {integration.sync_queue?.pending ?? 0} pend |{' '}
                      {integration.sync_queue?.failed ?? 0} falhas
                    </span>
                    <span>
                      Crons dup bloqueados:{' '}
                      {integration.cron_and_circuit?.duplicate_cron_blocked_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* DIAGNOSTICOS PRIORIZADOS COM ACAO DIRETA EM 1 CLIQUE */}
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <ShieldAlert size={18} />
                      <span>Diagnosticos Preventivos e Acoes Recomendadas</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Motor de regras analisa em tempo real padroes de N+1, loops de erro OAuth/END_TRIAL, bloat em tabelas e riscos de cota antes de qualquer interrupcao.
                    </p>
                  </div>
                  {intel.velocity?.estimatedDaysToFreeLimit && (
                    <span className={`${styles.badge} ${styles.badgeWarning}`}>
                      Projecao Free 500 MB: ~{intel.velocity.estimatedDaysToFreeLimit} dias
                    </span>
                  )}
                </div>

                {diagnostics.length === 0 ? (
                  <div className={styles.emptyState}>
                    Todos os indicadores auditados operam em estado nominal. Nenhum gargalo ou anomalia detectado.
                  </div>
                ) : (
                  <div className={styles.diagnosticsList}>
                    {diagnostics.map((d: any) => {
                      const borderClass =
                        d.severity === 'CRITICO'
                          ? styles.diagCritical
                          : d.severity === 'ATENCAO'
                          ? styles.diagWarning
                          : styles.diagInfo;
                      const pillClass =
                        d.severity === 'CRITICO'
                          ? styles.badgeDanger
                          : d.severity === 'ATENCAO'
                          ? styles.badgeWarning
                          : styles.badgeInfo;

                      return (
                        <div key={d.id} className={`${styles.diagnosticItem} ${borderClass}`}>
                          <div className={styles.diagnosticBody}>
                            <div className={styles.diagnosticTopRow}>
                              <span className={`${styles.badge} ${pillClass}`}>{d.severity}</span>
                              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                {d.category}
                              </span>
                              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                                {d.metric}
                              </span>
                            </div>
                            <h3 className={styles.diagnosticTitle}>{d.title}</h3>
                            <p className={styles.diagnosticDesc}>{d.description}</p>
                          </div>

                          <div className={styles.diagnosticActions}>
                            {d.linkPath && (
                              <Link
                                href={d.linkPath}
                                className={`${styles.btnSecondary} ${styles.btnSmall}`}
                              >
                                <span>{d.linkLabel || 'Abrir Configuracao'}</span>
                                <ExternalLink size={13} />
                              </Link>
                            )}
                            {d.actionKey && (
                              <button
                                type="button"
                                disabled={Boolean(actionBusy)}
                                onClick={() =>
                                  setConfirmModal({
                                    action: d.actionKey,
                                    title: d.actionLabel || 'Executar Acao Corretiva',
                                    description: d.description,
                                    retentionHours: d.retentionHours,
                                  })
                                }
                                className={`${styles.btnPrimary} ${styles.btnSmall}`}
                              >
                                <Play size={13} />
                                <span>
                                  {actionBusy === d.actionKey
                                    ? 'Executando...'
                                    : d.actionLabel || 'Corrigir Agora'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* TENDENCIAS HISTORICAS (PURE SVG SPARKLINES) */}
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Activity size={18} />
                      <span>Serie Temporal de Telemetria (Snapshots Automaticos de 15 min)</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Historico leve armazenado localmente com retencao automatica de 30 dias (menos de 300 KB em disco).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => executeAction('RECORD_MANUAL_SNAPSHOT')}
                    disabled={Boolean(actionBusy)}
                    className={`${styles.btnSecondary} ${styles.btnSmall}`}
                  >
                    <Layers size={14} />
                    <span>Capturar Ponto Agora</span>
                  </button>
                </div>

                <div className={styles.twoColGrid}>
                  <SparklineChart
                    title="Evolucao de Disco do Banco (MB)"
                    currentLabel={db.db_size_pretty || '0 MB'}
                    points={dbSizeSeries}
                    strokeVar="var(--primary)"
                  />
                  <SparklineChart
                    title="Total Acumulado de Chamadas SQL"
                    currentLabel={formatNumber(queries.total_raw_calls ?? 0)}
                    points={callsSeries}
                    strokeVar="var(--info)"
                  />
                  <SparklineChart
                    title="Conexoes Ativas Simultaneas"
                    currentLabel={`${db.active_connections ?? 0} ativa(s)`}
                    points={connSeries}
                    strokeVar="var(--success)"
                  />
                  <SparklineChart
                    title="Erros Conta Azul (Janela Movel 24h)"
                    currentLabel={`${integration.logs?.last_24h_error ?? 0} erro(s)`}
                    points={errSeries}
                    strokeVar="var(--danger)"
                  />
                </div>
              </section>
            </>
          )}

          {/* ================================================================
              ABA 2: CONSULTAS & DETECTOR N+1
              ================================================================ */}
          {activeTab === 'queries' && (
            <section className={styles.cardPanel}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Zap size={18} />
                    <span>Raio-X do pg_stat_statements & Detector Anti-N+1</span>
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Identifica instantaneamente loops de consultas repetidas (como o incidente historico de 1,5 milhao de leituras em order_item_packaging) e gargalos de CPU/Egress.
                  </p>
                </div>

                <div className={styles.headerControls}>
                  <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                    Linha de Base:{' '}
                    {queries.baseline_reset_at
                      ? formatDateTime(queries.baseline_reset_at)
                      : 'Acumulado desde o boot do Postgres'}
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(actionBusy)}
                    onClick={() =>
                      setConfirmModal({
                        action: 'RESET_QUERY_BASELINE',
                        title: 'Redefinir Linha de Base de Consultas (pg_stat_statements)',
                        description:
                          'Isso zera os contadores relativos ("Desde Reset") para que voce monitore exclusivamente o comportamento novo do sistema a partir de agora, sem mascarar por chamadas historicas passadas.',
                      })
                    }
                    className={styles.btnPrimary}
                  >
                    <RotateCcw size={15} />
                    <span>Resetar Linha de Base Agora</span>
                  </button>
                </div>
              </div>

              <div className={styles.sectionHeader}>
                <div className={styles.headerControls}>
                  <button
                    type="button"
                    onClick={() => setQueryMode('calls')}
                    className={
                      queryMode === 'calls' ? styles.btnPrimary : styles.btnSecondary
                    }
                  >
                    Mais Chamadas (Detector N+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryMode('time')}
                    className={queryMode === 'time' ? styles.btnPrimary : styles.btnSecondary}
                  >
                    Maior Tempo Total (CPU)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryMode('latency')}
                    className={
                      queryMode === 'latency' ? styles.btnPrimary : styles.btnSecondary
                    }
                  >
                    Maior Latencia Media
                  </button>
                </div>

                <div className={styles.headerControls}>
                  <Search size={15} />
                  <input
                    type="text"
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    placeholder="Filtrar SQL ou tabela (ex: packaging, orders)..."
                    className={styles.inputControl}
                  />
                </div>
              </div>

              {!queries.enabled ? (
                <div className={styles.emptyState}>
                  A extensao pg_stat_statements nao esta habilitada neste banco.
                </div>
              ) : queryRows.length === 0 ? (
                <div className={styles.emptyState}>
                  Nenhuma consulta encontrada para o filtro informado.
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Risco N+1</th>
                        <th>Chamadas (Desde Reset)</th>
                        <th>Bruto Total</th>
                        <th>Linhas Retornadas</th>
                        <th>Tempo Total (ms)</th>
                        <th>Media / Pico (ms)</th>
                        <th>Consulta SQL Capturada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryRows.map((q: any, idx: number) => {
                        const callsSince = Number(q.calls_since_baseline ?? q.raw_calls ?? 0);
                        const risk =
                          callsSince >= 100_000
                            ? 'CRITICO'
                            : callsSince >= 15_000
                            ? 'ATENCAO'
                            : 'NORMAL';
                        const riskClass =
                          risk === 'CRITICO'
                            ? styles.badgeDanger
                            : risk === 'ATENCAO'
                            ? styles.badgeWarning
                            : styles.badgeSuccess;

                        return (
                          <tr key={`${q.qid || idx}-${idx}`}>
                            <td>
                              <span className={`${styles.badge} ${riskClass}`}>{risk}</span>
                            </td>
                            <td className={styles.monoCell}>
                              <strong>{formatNumber(callsSince)}</strong>
                            </td>
                            <td className={styles.monoCell}>{formatNumber(q.raw_calls)}</td>
                            <td className={styles.monoCell}>
                              {formatNumber(q.rows_since_baseline ?? q.raw_rows)}
                            </td>
                            <td className={styles.monoCell}>
                              {formatNumber(q.total_ms_since_baseline ?? q.raw_total_ms)} ms
                            </td>
                            <td className={styles.monoCell}>
                              {q.mean_ms} ms / {q.max_ms} ms
                            </td>
                            <td>
                              <div className={styles.codePreview}>{q.query_preview}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ================================================================
              ABA 3: ARMAZENAMENTO, TABELAS & INDICES
              ================================================================ */}
          {activeTab === 'storage' && (
            <>
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Tamanho Fisico Total Postgres</span>
                  <div className={styles.kpiValue}>{db.db_size_pretty || '0 MB'}</div>
                  <div className={styles.kpiSubtext}>
                    <span>{formatBytesClient(db.db_size_bytes)} exatos</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Supabase Storage (Arquivos/Buckets)</span>
                  <div className={styles.kpiValue}>
                    {formatBytesClient(db.storage_bytes || 0)}
                  </div>
                  <div className={styles.kpiSubtext}>
                    <span>{db.storage_files_count ?? 0} arquivo(s)</span>
                    <span>{db.storage_buckets_count ?? 0} bucket(s)</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Buffer Cache Hit (Tabelas / Indices)</span>
                  <div className={styles.kpiValue}>{db.cache_hit_ratio ?? 100}%</div>
                  <div className={styles.kpiSubtext}>
                    <span>Indices Hit: {db.index_hit_ratio ?? 100}%</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Indices Sem Uso (idx_scan = 0)</span>
                  <div className={styles.kpiValue}>
                    {Array.isArray(tables.unused_indexes) ? tables.unused_indexes.length : 0}
                  </div>
                  <div className={styles.kpiSubtext}>
                    <span>Candidatos a revisao de escrita</span>
                  </div>
                </div>
              </div>

              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Database size={18} />
                      <span>Anatomia das 25 Maiores Tabelas, Bloat & Uso de Indices</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Monitora ocupacao fisica, dead tuples (bloat aguardando VACUUM), proporcao de varreduras sequenciais (Seq Scan) vs indice e volume de escritas.
                    </p>
                  </div>

                  <div className={styles.headerControls}>
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Filtrar tabela..."
                      className={styles.inputControl}
                    />
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() => executeAction('RUN_ANALYZE_CORE_TABLES')}
                      className={styles.btnSecondary}
                    >
                      <Sliders size={15} />
                      <span>Atualizar Estatisticas (ANALYZE)</span>
                    </button>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Schema.Tabela</th>
                        <th>Tamanho Total</th>
                        <th>Dados / Indices</th>
                        <th>Linhas Vivas / Mortas</th>
                        <th>Bloat %</th>
                        <th>Eficiencia de Indice</th>
                        <th>Seq Scan / Idx Scan</th>
                        <th>Churn (INS / UPD / DEL)</th>
                        <th>Ultimo Autovacuum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTables.map((t: any) => {
                        const bloat = Number(t.bloat_pct || 0);
                        const idxPct = Number(t.idx_usage_pct ?? 100);
                        return (
                          <tr key={`${t.schemaname}.${t.table_name}`}>
                            <td className={styles.monoCell}>
                              <strong>
                                {t.schemaname}.{t.table_name}
                              </strong>
                            </td>
                            <td className={styles.monoCell}>{t.total_size}</td>
                            <td className={styles.monoCell}>
                              {formatBytesClient(t.table_bytes)} /{' '}
                              {formatBytesClient(t.index_bytes)}
                            </td>
                            <td className={styles.monoCell}>
                              {formatNumber(t.live_rows)} / {formatNumber(t.dead_rows)}
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  bloat >= 30
                                    ? styles.badgeDanger
                                    : bloat >= 15
                                    ? styles.badgeWarning
                                    : styles.badgeSuccess
                                }`}
                              >
                                {bloat}%
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  idxPct < 40 && Number(t.live_rows) > 100
                                    ? styles.badgeWarning
                                    : styles.badgeSuccess
                                }`}
                              >
                                {idxPct}%
                              </span>
                            </td>
                            <td className={styles.monoCell}>
                              {formatNumber(t.seq_scan)} / {formatNumber(t.idx_scan)}
                            </td>
                            <td className={styles.monoCell}>
                              +{formatNumber(t.inserts)} / ~{formatNumber(t.updates)} / -
                              {formatNumber(t.deletes)}
                            </td>
                            <td className={styles.monoCell}>
                              {t.last_autovacuum
                                ? formatDateTime(t.last_autovacuum)
                                : t.last_autoanalyze
                                ? `Analyze: ${formatDateTime(t.last_autoanalyze)}`
                                : 'Pendente'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {Array.isArray(tables.unused_indexes) && tables.unused_indexes.length > 0 && (
                <section className={styles.cardPanel}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Filter size={18} />
                      <span>Indices Secundarios Sem Leituras Registradas (idx_scan = 0)</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Indices nao-unicos no schema public que ainda nao foram utilizados pelo planejador de consultas (exclui chaves primarias, constraints UNIQUE e os novos indices recem-criados).
                    </p>
                  </div>
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Tabela</th>
                          <th>Nome do Indice</th>
                          <th>Tamanho Ocupado</th>
                          <th>Leituras (idx_scan)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tables.unused_indexes.map((ix: any) => (
                          <tr key={ix.index_name}>
                            <td className={styles.monoCell}>{ix.table_name}</td>
                            <td className={styles.monoCell}>
                              <strong>{ix.index_name}</strong>
                            </td>
                            <td className={styles.monoCell}>{ix.index_size}</td>
                            <td className={styles.monoCell}>{ix.idx_scan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ================================================================
              ABA 4: CONTA AZUL, CRONS & FILAS
              ================================================================ */}
          {activeTab === 'integration' && (
            <>
              <div className={styles.twoColGrid}>
                {/* Card 1: Status OAuth2 & Teste Cognito */}
                <section className={styles.cardPanel}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      <KeyRound size={18} />
                      <span>Credenciais OAuth2 & Validador Cognito Conta Azul</span>
                    </h2>
                    <span
                      className={`${styles.badge} ${
                        integration.ca_config?.is_token_expired
                          ? styles.badgeWarning
                          : styles.badgeSuccess
                      }`}
                    >
                      {integration.ca_config?.is_token_expired
                        ? 'Access Token Expirado'
                        : 'Access Token Valido'}
                    </span>
                  </div>

                  <div className={styles.kvList}>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Client ID Configurado</span>
                      <span className={styles.kvVal}>
                        {integration.ca_config?.client_id_preview || 'Nao configurado'}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Client Secret / Refresh Token</span>
                      <span className={styles.kvVal}>
                        {integration.ca_config?.has_secret ? 'Secret OK' : 'Sem Secret'} |{' '}
                        {integration.ca_config?.has_refresh_token ? 'Refresh OK' : 'Sem Refresh'}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Expiracao do Access Token</span>
                      <span className={styles.kvVal}>
                        {formatDateTime(integration.ca_config?.expires_at)}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Ultima Importacao de Pedidos OK</span>
                      <span className={styles.kvVal}>
                        {formatDateTime(integration.logs?.last_success_import_at)}
                      </span>
                    </div>
                  </div>

                  {cognitoCheckResult && (
                    <div
                      className={`${styles.feedbackBanner} ${
                        cognitoCheckResult.ok ? styles.feedbackSuccess : styles.feedbackError
                      }`}
                    >
                      <span>{cognitoCheckResult.detail}</span>
                    </div>
                  )}

                  <div className={styles.headerControls}>
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() => executeAction('CHECK_COGNITO_APP')}
                      className={styles.btnPrimary}
                    >
                      <ShieldCheck size={15} />
                      <span>
                        {actionBusy === 'CHECK_COGNITO_APP'
                          ? 'Testando Cognito...'
                          : 'Testar App no Cognito Conta Azul'}
                      </span>
                    </button>
                    <Link href="/configuracoes" className={styles.btnSecondary}>
                      <span>Abrir Integracao Conta Azul</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </section>

                {/* Card 2: Circuit Breaker & Cooldown de Crons */}
                <section className={styles.cardPanel}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      <ShieldAlert size={18} />
                      <span>Circuit Breaker & Trava Anti-Cron Duplicado (12 min)</span>
                    </h2>
                    <span
                      className={`${styles.badge} ${
                        integration.cron_and_circuit?.is_circuit_open
                          ? styles.badgeDanger
                          : styles.badgeSuccess
                      }`}
                    >
                      {integration.cron_and_circuit?.is_circuit_open
                        ? 'PAUSADO (ABERTO)'
                        : 'OPERACIONAL (FECHADO)'}
                    </span>
                  </div>

                  <div className={styles.kvList}>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Ultimo Cron Incremental (15m)</span>
                      <span className={styles.kvVal}>
                        {formatDateTime(integration.cron_and_circuit?.last_incremental_cron_at)}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Ultimo Cron Diario (Full + Limpeza)</span>
                      <span className={styles.kvVal}>
                        {formatDateTime(integration.cron_and_circuit?.last_full_cron_at)}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Ultima Origem Executada</span>
                      <span className={styles.kvVal}>
                        {integration.cron_and_circuit?.last_cron_source || 'Aguardando proximo ciclo'}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Crons Duplicados Bloqueados</span>
                      <span className={styles.kvVal}>
                        {formatNumber(
                          integration.cron_and_circuit?.duplicate_cron_blocked_count ?? 0
                        )}
                      </span>
                    </div>
                    <div className={styles.kvRow}>
                      <span className={styles.kvKey}>Falhas OAuth Consecutivas</span>
                      <span className={styles.kvVal}>
                        {integration.cron_and_circuit?.oauth_consecutive_failures ?? 0} / 3
                      </span>
                    </div>
                  </div>

                  <div className={styles.headerControls}>
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() => executeAction('RESET_OAUTH_CIRCUIT_BREAKER')}
                      className={styles.btnSecondary}
                    >
                      <RotateCcw size={15} />
                      <span>Reiniciar Circuit Breaker & Contador</span>
                    </button>
                  </div>
                </section>
              </div>

              {/* FILA OUTBOX (SYNC_QUEUE) */}
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Layers size={18} />
                      <span>Fila Outbox de Sincronizacao Reversa (sync_queue)</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Pendentes: {integration.sync_queue?.pending ?? 0} | Em Processamento:{' '}
                      {integration.sync_queue?.processing ?? 0} (Travados &gt;15m:{' '}
                      {integration.sync_queue?.stuck_processing_15m ?? 0}) | Falhas:{' '}
                      {integration.sync_queue?.failed ?? 0} | Concluidos:{' '}
                      {formatNumber(integration.sync_queue?.completed ?? 0)}
                    </p>
                  </div>

                  <div className={styles.headerControls}>
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() => executeAction('UNLOCK_STUCK_SYNC_QUEUE')}
                      className={`${styles.btnSecondary} ${styles.btnSmall}`}
                    >
                      <Unlock size={14} />
                      <span>Destravar PROCESSING</span>
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        setConfirmModal({
                          action: 'RETRY_FAILED_SYNC_QUEUE',
                          title: 'Reagendar Todos os Itens FAILED da sync_queue',
                          description:
                            'Todos os registros com status FAILED voltarao para PENDING com retry_count = 0 para reprocessamento no proximo ciclo.',
                        })
                      }
                      className={`${styles.btnSecondary} ${styles.btnSmall}`}
                    >
                      <RotateCcw size={14} />
                      <span>Reprocessar FAILED</span>
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        setConfirmModal({
                          action: 'CLEAN_SYNC_QUEUE_COMPLETED',
                          title: 'Expurgar Registros COMPLETED (> 48h)',
                          description:
                            'Remove da tabela sync_queue os registros ja concluidos ha mais de 48 horas, reduzindo o tamanho da fila.',
                          retentionHours: 48,
                        })
                      }
                      className={`${styles.btnPrimary} ${styles.btnSmall}`}
                    >
                      <Trash2 size={14} />
                      <span>Expurgar COMPLETED &gt; 48h</span>
                    </button>
                  </div>
                </div>

                {Array.isArray(integration.sync_queue?.recent_failures) &&
                integration.sync_queue.recent_failures.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Entidade</th>
                          <th>Acao</th>
                          <th>Tentativas</th>
                          <th>Atualizado Em</th>
                          <th>Ultimo Erro Registrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {integration.sync_queue.recent_failures.map((item: any) => (
                          <tr key={item.id}>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  item.status === 'FAILED'
                                    ? styles.badgeDanger
                                    : styles.badgeWarning
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className={styles.monoCell}>{item.entity_type}</td>
                            <td className={styles.monoCell}>{item.action}</td>
                            <td className={styles.monoCell}>
                              {item.retry_count}/{item.max_retries}
                            </td>
                            <td className={styles.monoCell}>
                              {formatDateTime(item.updated_at)}
                            </td>
                            <td>
                              <div className={styles.codePreview}>
                                {item.last_error || 'Sem mensagem'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    Nenhum item travado ou com falha na sync_queue.
                  </div>
                )}
              </section>

              {/* ERROS AGRUPADOS EM CONTA_AZUL_INTEGRATION_LOGS & AUDITORIA DE CRONS */}
              <div className={styles.twoColGrid}>
                <section className={styles.cardPanel}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>
                        <FileWarning size={18} />
                        <span>Erros Agrupados em Logs ({integration.logs?.total_size_pretty || '0 KB'})</span>
                      </h2>
                      <p className={styles.sectionSubtitle}>
                        Total: {formatNumber(integration.logs?.total_count ?? 0)} linhas (
                        {formatNumber(integration.logs?.total_errors ?? 0)} erros |{' '}
                        {formatNumber(integration.logs?.total_success ?? 0)} sucessos)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        setConfirmModal({
                          action: 'PURGE_LOGS_OLDER_THAN',
                          title: 'Expurgar Logs de Integracao (> 48h)',
                          description:
                            'Remove logs de integracao anteriores as ultimas 48 horas para liberar espaco e acelerar leituras.',
                          retentionHours: 48,
                        })
                      }
                      className={`${styles.btnSecondary} ${styles.btnSmall}`}
                    >
                      <Trash2 size={14} />
                      <span>Limpar &gt; 48h</span>
                    </button>
                  </div>

                  {Array.isArray(integration.logs?.grouped_errors) &&
                  integration.logs.grouped_errors.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Acao</th>
                            <th>Qtd</th>
                            <th>Ultima Ocorrencia</th>
                            <th>Resumo do Erro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {integration.logs.grouped_errors.map((ge: any, i: number) => (
                            <tr key={`${ge.action}-${i}`}>
                              <td className={styles.monoCell}>
                                <strong>{ge.action}</strong>
                              </td>
                              <td className={styles.monoCell}>
                                {formatNumber(ge.occurrences)}
                              </td>
                              <td className={styles.monoCell}>
                                {formatDateTime(ge.last_seen_at)}
                              </td>
                              <td>
                                <div className={styles.codePreview}>{ge.error_summary}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      Nenhum erro registrado em conta_azul_integration_logs.
                    </div>
                  )}
                </section>

                <section className={styles.cardPanel}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Clock size={18} />
                      <span>Auditoria de Disparos de Cron (/api/sync/cron)</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Ultimas 30 chamadas recebidas pelo endpoint automatico, identificando qual agendador disparou e quais duplicidades foram bloqueadas.
                    </p>
                  </div>

                  {Array.isArray(integration.cron_and_circuit?.recent_cron_events) &&
                  integration.cron_and_circuit.recent_cron_events.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Horario</th>
                            <th>Origem</th>
                            <th>Status</th>
                            <th>Detalhe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {integration.cron_and_circuit.recent_cron_events.map(
                            (ev: any, idx: number) => {
                              const badgeCls =
                                ev.status === 'EXECUTED'
                                  ? styles.badgeSuccess
                                  : ev.status?.startsWith('BLOCKED')
                                  ? styles.badgeWarning
                                  : styles.badgeDanger;
                              return (
                                <tr key={`${ev.at}-${idx}`}>
                                  <td className={styles.monoCell}>
                                    {formatDateTime(ev.at)}
                                  </td>
                                  <td>{ev.source}</td>
                                  <td>
                                    <span className={`${styles.badge} ${badgeCls}`}>
                                      {ev.status}
                                    </span>
                                  </td>
                                  <td>{ev.detail}</td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      Aguardando o proximo disparo automatico de /api/sync/cron para registrar a origem.
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ================================================================
              ABA 5: SEGURANCA, SESSOES & INTEGRIDADE
              ================================================================ */}
          {activeTab === 'governance' && (
            <div className={styles.threeColGrid}>
              {/* Card 1: Credenciais, Ambiente & Validade PAT */}
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <ShieldCheck size={18} />
                    <span>Governanca de Credenciais & Ambiente</span>
                  </h2>
                </div>

                <div className={styles.kvList}>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Validade PAT Supabase</span>
                    <span className={styles.kvVal}>
                      <span
                        className={`${styles.badge} ${
                          (intel.environment?.patDaysRemaining ?? 999) <= 45
                            ? styles.badgeWarning
                            : styles.badgeSuccess
                        }`}
                      >
                        04/01/2027 ({intel.environment?.patDaysRemaining ?? 0} dias)
                      </span>
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>SUPABASE_SERVICE_ROLE_KEY</span>
                    <span className={styles.kvVal}>
                      {intel.environment?.hasServiceRoleKey ? 'Configurada' : 'Ausente'}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>CRON_SECRET</span>
                    <span className={styles.kvVal}>
                      {intel.environment?.hasCronSecret ? 'Configurada' : 'Nao definida'}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>RESEND_API_KEY (Alertas E-mail)</span>
                    <span className={styles.kvVal}>
                      {intel.environment?.hasResendApiKey ? 'Configurada' : 'Nao definida'}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Tabelas Publicas sem RLS</span>
                    <span className={styles.kvVal}>
                      <span
                        className={`${styles.badge} ${
                          Number(tables.public_tables_without_rls || 0) === 0
                            ? styles.badgeSuccess
                            : styles.badgeDanger
                        }`}
                      >
                        {tables.public_tables_without_rls ?? 0} exposta(s)
                      </span>
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Regiao & Motor Postgres</span>
                    <span className={styles.kvVal}>
                      {intel.environment?.region || 'sa-east-1'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Card 2: Sessoes Auth, Refresh Tokens & Atividade Fabrica */}
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <Server size={18} />
                    <span>Sessoes Auth & Pool por Role</span>
                  </h2>
                </div>

                <div className={styles.kvList}>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Contas Auth / Perfis Ativos</span>
                    <span className={styles.kvVal}>
                      {governance.auth_stats?.auth_users_count ?? 0} /{' '}
                      {governance.auth_stats?.profiles_active_count ?? 0}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Sessoes Ativas no Supabase Auth</span>
                    <span className={styles.kvVal}>
                      {governance.auth_stats?.active_sessions_count ?? 0}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Tabela auth.refresh_tokens</span>
                    <span className={styles.kvVal}>
                      {formatNumber(governance.auth_stats?.refresh_tokens_count ?? 0)} (
                      {governance.auth_stats?.refresh_tokens_size || '0 KB'})
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Convites / Troca de Senha Pendente</span>
                    <span className={styles.kvVal}>
                      {governance.auth_stats?.profiles_forced_pwd_count ?? 0}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Movimentacoes Kanban (24h)</span>
                    <span className={styles.kvVal}>
                      {formatNumber(governance.auth_stats?.stage_moves_24h ?? 0)}
                    </span>
                  </div>
                </div>

                {Array.isArray(db.connections_by_role) && db.connections_by_role.length > 0 && (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Role Postgres</th>
                          <th>Estado</th>
                          <th>Qtd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {db.connections_by_role.map((c: any, idx: number) => (
                          <tr key={`${c.role_name}-${c.conn_state}-${idx}`}>
                            <td className={styles.monoCell}>{c.role_name}</td>
                            <td className={styles.monoCell}>{c.conn_state}</td>
                            <td className={styles.monoCell}>{c.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Card 3: Sanity Checks de Dados Operacionais */}
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <CheckCircle2 size={18} />
                    <span>Sanity Checks de Dados de Negocio</span>
                  </h2>
                </div>

                <div className={styles.kvList}>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Volume Base (Pedidos / Itens)</span>
                    <span className={styles.kvVal}>
                      {formatNumber(governance.business_sanity?.orders_total ?? 0)} /{' '}
                      {formatNumber(governance.business_sanity?.order_items_total ?? 0)}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Clientes / Produtos Cadastrados</span>
                    <span className={styles.kvVal}>
                      {formatNumber(governance.business_sanity?.customers_total ?? 0)} /{' '}
                      {formatNumber(governance.business_sanity?.products_total ?? 0)}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Pedidos Orfaos (Sem Itens)</span>
                    <span className={styles.kvVal}>
                      <span
                        className={`${styles.badge} ${
                          Number(governance.business_sanity?.orphan_orders_without_items || 0) ===
                          0
                            ? styles.badgeSuccess
                            : styles.badgeWarning
                        }`}
                      >
                        {governance.business_sanity?.orphan_orders_without_items ?? 0}
                      </span>
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Itens Sem Etapa Kanban (stage_id)</span>
                    <span className={styles.kvVal}>
                      <span
                        className={`${styles.badge} ${
                          Number(governance.business_sanity?.items_without_stage || 0) === 0
                            ? styles.badgeSuccess
                            : styles.badgeWarning
                        }`}
                      >
                        {governance.business_sanity?.items_without_stage ?? 0}
                      </span>
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Saldos de Credito Negativos</span>
                    <span className={styles.kvVal}>
                      <span
                        className={`${styles.badge} ${
                          Number(governance.business_sanity?.negative_stock_credits || 0) === 0
                            ? styles.badgeSuccess
                            : styles.badgeDanger
                        }`}
                      >
                        {governance.business_sanity?.negative_stock_credits ?? 0}
                      </span>
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>Pedidos Sem Cliente Vinculado</span>
                    <span className={styles.kvVal}>
                      {governance.business_sanity?.orders_without_customer ?? 0}
                    </span>
                  </div>
                  <div className={styles.kvRow}>
                    <span className={styles.kvKey}>CPF / CNPJ Duplicados em Clientes</span>
                    <span className={styles.kvVal}>
                      {governance.business_sanity?.duplicate_clean_documents ?? 0}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================================================================
              ABA 6: MANUTENCAO & RESPOSTA RAPIDA (PLAYBOOKS EM 1 CLIQUE)
              ================================================================ */}
          {activeTab === 'maintenance' && (
            <>
              <section className={styles.cardPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Wrench size={18} />
                      <span>Central de Playbooks Preventivos e Corretivos em 1 Clique</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Todas as operacoes rodam via RPC SECURITY DEFINER restrita ao service_role, sem expor comandos destrutivos ao cliente publico.
                    </p>
                  </div>

                  <div className={styles.headerControls}>
                    <span className={styles.kpiLabel}>Janela de Retencao para Limpezas:</span>
                    <select
                      value={retentionHours}
                      onChange={(e) => setRetentionHours(Number(e.target.value))}
                      className={styles.selectControl}
                    >
                      <option value={24}>Manter ultimas 24 horas</option>
                      <option value={48}>Manter ultimas 48 horas (Recomendado)</option>
                      <option value={168}>Manter ultimos 7 dias (168h)</option>
                      <option value={720}>Manter ultimos 30 dias (720h)</option>
                      <option value={0}>Limpeza Total (0h - Remover Tudo)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.playbookGrid}>
                  {/* Playbook 1 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Trash2 size={17} />
                        <span>Expurgar Logs de Integracao Antigos</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Remove logs (sucesso e erro) de conta_azul_integration_logs anteriores a janela selecionada. Atual: {formatNumber(integration.logs?.total_count ?? 0)} linhas ({integration.logs?.total_size_pretty || '0 KB'}).
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>Janela: &gt; {retentionHours}h</span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          setConfirmModal({
                            action: 'PURGE_LOGS_OLDER_THAN',
                            title: `Expurgar Logs Anteriores a ${retentionHours}h`,
                            description:
                              retentionHours === 0
                                ? 'Atencao: todos os registros de conta_azul_integration_logs serao apagados.'
                                : `Serao removidos os logs criados ha mais de ${retentionHours} horas.`,
                            retentionHours,
                            danger: retentionHours === 0,
                          })
                        }
                        className={styles.btnPrimary}
                      >
                        Executar Limpeza
                      </button>
                    </div>
                  </div>

                  {/* Playbook 2 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Filter size={17} />
                        <span>Limpar Apenas Logs de Sucesso</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Remove apenas logs de rotina com status SUCCESS anteriores a janela selecionada, preservando 100% dos registros de ERROR para auditoria.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>
                        Sucessos: {formatNumber(integration.logs?.total_success ?? 0)}
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          setConfirmModal({
                            action: 'PURGE_LOGS_SUCCESS_ONLY',
                            title: `Remover Logs SUCCESS (> ${retentionHours}h)`,
                            description:
                              'Todos os logs de erro permanecem intactos; apenas logs de sucesso fora da janela serao removidos.',
                            retentionHours,
                          })
                        }
                        className={styles.btnSecondary}
                      >
                        Limpar Sucessos
                      </button>
                    </div>
                  </div>

                  {/* Playbook 3 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <FileWarning size={17} />
                        <span>Expurgar Flood de Logs de Erro</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Util apos reconectar o OAuth Conta Azul para limpar milhares de erros repetidos de token/END_TRIAL acumulados nos dias anteriores.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>
                        Erros: {formatNumber(integration.logs?.total_errors ?? 0)}
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          setConfirmModal({
                            action: 'PURGE_LOGS_ERRORS_OLDER_THAN',
                            title: `Expurgar Logs ERROR (> ${retentionHours}h)`,
                            description: `Remove logs com status ERROR mais antigos que ${retentionHours} horas.`,
                            retentionHours,
                          })
                        }
                        className={styles.btnSecondary}
                      >
                        Limpar Erros
                      </button>
                    </div>
                  </div>

                  {/* Playbook 4 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Layers size={17} />
                        <span>Expurgar sync_queue Concluida (COMPLETED)</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Remove itens ja sincronizados e finalizados da tabela sync_queue, mantendo a fila enxuta. Atual: {formatNumber(integration.sync_queue?.completed ?? 0)} COMPLETED.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>Janela: &gt; {retentionHours}h</span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          setConfirmModal({
                            action: 'CLEAN_SYNC_QUEUE_COMPLETED',
                            title: `Expurgar sync_queue COMPLETED (> ${retentionHours}h)`,
                            description:
                              'Itens PENDING, PROCESSING e FAILED nao sao afetados.',
                            retentionHours,
                          })
                        }
                        className={styles.btnPrimary}
                      >
                        Limpar COMPLETED
                      </button>
                    </div>
                  </div>

                  {/* Playbook 5 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Unlock size={17} />
                        <span>Destravar Itens Presos em PROCESSING</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Devolve para PENDING qualquer item da sync_queue que tenha ficado preso em PROCESSING por queda de conexao ou timeout serverless.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>
                        Em PROCESSING: {integration.sync_queue?.processing ?? 0}
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() => executeAction('UNLOCK_STUCK_SYNC_QUEUE')}
                        className={styles.btnSecondary}
                      >
                        Destravar Agora
                      </button>
                    </div>
                  </div>

                  {/* Playbook 6 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Trash2 size={17} />
                        <span>Limpar Itens FAILED Antigos da sync_queue</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Descarta itens com falha permanente na sync_queue mais antigos que a janela selecionada ({retentionHours}h). Atual: {integration.sync_queue?.failed ?? 0} FAILED.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>Janela: &gt; {retentionHours}h</span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          setConfirmModal({
                            action: 'CLEAR_FAILED_SYNC_QUEUE',
                            title: `Remover Itens FAILED (> ${retentionHours}h) da sync_queue`,
                            description: `Remove permanentemente itens FAILED atualizados ha mais de ${retentionHours} horas.`,
                            retentionHours,
                            danger: retentionHours === 0,
                          })
                        }
                        className={styles.btnSecondary}
                      >
                        Limpar FAILED
                      </button>
                    </div>
                  </div>

                  {/* Playbook 7 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <RotateCcw size={17} />
                        <span>Resetar Linha de Base N+1 (pg_stat_statements)</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Redefine o marco zero de contagem de queries para validar correcoes de performance e detectar apenas anomalias novas.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>Recomendado pos-deploy</span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() => executeAction('RESET_QUERY_BASELINE')}
                        className={styles.btnPrimary}
                      >
                        Resetar Baseline
                      </button>
                    </div>
                  </div>

                  {/* Playbook 8 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Cpu size={17} />
                        <span>Encerrar Transacoes Zumbis (&gt; 5 min)</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Executa pg_terminate_backend nas conexoes presas em idle in transaction ha mais de 5 minutos, liberando locks e pool.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>
                        Travadas agora: {db.stuck_idle_in_tx_5m ?? 0}
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          setConfirmModal({
                            action: 'TERMINATE_IDLE_TRANSACTIONS',
                            title: 'Encerrar Conexoes Idle in Transaction (> 5 min)',
                            description:
                              'Apenas sessoes de aplicacao ociosas em transacao aberta ha mais de 5 minutos serao encerradas.',
                            danger: true,
                          })
                        }
                        className={styles.btnDanger}
                      >
                        Encerrar Zumbis
                      </button>
                    </div>
                  </div>

                  {/* Playbook 9 */}
                  <div className={styles.playbookCard}>
                    <div>
                      <h3 className={styles.playbookTitle}>
                        <Sliders size={17} />
                        <span>Recalibrar Planejador SQL (ANALYZE)</span>
                      </h3>
                      <p className={styles.playbookDesc}>
                        Executa ANALYZE nas 7 tabelas centrais (orders, order_items, customers, products, logs, sync_queue, financial_transactions) para priorizar Index Scans.
                      </p>
                    </div>
                    <div className={styles.playbookFooter}>
                      <span className={styles.metaText}>Zero lock de escrita</span>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() => executeAction('RUN_ANALYZE_CORE_TABLES')}
                        className={styles.btnSecondary}
                      >
                        Executar ANALYZE
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* HISTORICO DE EXECUCOES DESTA SESSAO */}
              <section className={styles.cardPanel}>
                <h2 className={styles.sectionTitle}>
                  <Clock size={18} />
                  <span>Registro de Operacoes Executadas Nesta Sessao</span>
                </h2>
                {executionLog.length === 0 ? (
                  <div className={styles.emptyState}>
                    Nenhuma acao manual disparada nesta sessao ainda.
                  </div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Horario</th>
                          <th>Acao</th>
                          <th>Resultado</th>
                          <th>Mensagem do Servidor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executionLog.map((entry, idx) => (
                          <tr key={`${entry.at}-${idx}`}>
                            <td className={styles.monoCell}>{entry.at}</td>
                            <td className={styles.monoCell}>
                              <strong>{entry.action}</strong>
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  entry.ok ? styles.badgeSuccess : styles.badgeDanger
                                }`}
                              >
                                {entry.ok ? 'SUCESSO' : 'FALHA'}
                              </span>
                            </td>
                            <td>{entry.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      {/* ── MODAL DE CONFIRMACAO DE PLAYBOOK ────────────────────────────── */}
      {confirmModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setConfirmModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              <AlertTriangle size={20} />
              <span>{confirmModal.title}</span>
            </h3>
            <p className={styles.modalDesc}>{confirmModal.description}</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  executeAction(confirmModal.action, confirmModal.retentionHours)
                }
                className={confirmModal.danger ? styles.btnDanger : styles.btnPrimary}
              >
                Confirmar e Executar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
