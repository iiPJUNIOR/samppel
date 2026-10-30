-- =============================================================================
-- MIGRATION: Central de Monitoramento, Telemetria Anti-Estouro e Governanca
-- Modulo: MOD-16 (Acesso exclusivo via service_role para junior.8350i@gmail.com)
-- Rollback disponivel em: supabase/rollback_monitoring_center.sql
-- =============================================================================

-- 1. Tabela de Estado Persistente de Monitoramento, Cooldown de Cron e Circuit Breaker
CREATE TABLE IF NOT EXISTS public.system_monitoring_state (
  id text PRIMARY KEY DEFAULT 'global',
  last_incremental_cron_at timestamptz,
  last_full_cron_at timestamptz,
  last_cron_source text,
  last_blocked_cron_source text,
  last_blocked_cron_at timestamptz,
  duplicate_cron_blocked_count integer NOT NULL DEFAULT 0,
  oauth_consecutive_failures integer NOT NULL DEFAULT 0,
  oauth_last_failure_reason text,
  oauth_circuit_open_until timestamptz,
  last_anomaly_alert_at timestamptz,
  baseline_reset_at timestamptz,
  query_baseline jsonb NOT NULL DEFAULT '{}'::jsonb,
  recent_cron_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  billing_transition_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_monitoring_state
  ADD COLUMN IF NOT EXISTS billing_transition_config jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.system_monitoring_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only_monitoring_state" ON public.system_monitoring_state;
CREATE POLICY "service_role_only_monitoring_state"
  ON public.system_monitoring_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON TABLE public.system_monitoring_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.system_monitoring_state TO service_role;

INSERT INTO public.system_monitoring_state (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela Leve de Serie Temporal (Snapshots de 15 min com expurgo automatico de 30 dias)
CREATE TABLE IF NOT EXISTS public.system_monitoring_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'auto',
  db_size_bytes bigint NOT NULL DEFAULT 0,
  storage_bytes bigint NOT NULL DEFAULT 0,
  active_connections integer NOT NULL DEFAULT 0,
  idle_in_tx_connections integer NOT NULL DEFAULT 0,
  cache_hit_ratio numeric(6,2) NOT NULL DEFAULT 100.00,
  total_query_calls bigint NOT NULL DEFAULT 0,
  total_rows_returned bigint NOT NULL DEFAULT 0,
  top_query_calls bigint NOT NULL DEFAULT 0,
  top_query_preview text,
  logs_total_count integer NOT NULL DEFAULT 0,
  logs_error_24h integer NOT NULL DEFAULT 0,
  sync_pending_count integer NOT NULL DEFAULT 0,
  sync_failed_count integer NOT NULL DEFAULT 0,
  sync_processing_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_monitoring_snapshots_captured_at
  ON public.system_monitoring_snapshots (captured_at DESC);

ALTER TABLE public.system_monitoring_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only_monitoring_snapshots" ON public.system_monitoring_snapshots;
CREATE POLICY "service_role_only_monitoring_snapshots"
  ON public.system_monitoring_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON TABLE public.system_monitoring_snapshots FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.system_monitoring_snapshots TO service_role;

-- 3. Indices Anti-Seq-Scan para Tabelas de Alta Rotatividade (Logs e Fila de Sincronizacao)
CREATE INDEX IF NOT EXISTS idx_ca_logs_tenant_created_at
  ON public.conta_azul_integration_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_tenant_status_created
  ON public.sync_queue (tenant_id, status, created_at DESC);

-- 4. Funcao RPC: Gravar Snapshot Compacto de Telemetria
CREATE OR REPLACE FUNCTION public.record_monitoring_snapshot(
  p_source text DEFAULT 'auto'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_last_snap record;
  v_has_last boolean := false;
  v_db_size bigint;
  v_storage_bytes bigint;
  v_active_conn int;
  v_idle_tx_conn int;
  v_cache_hit numeric(6,2);
  v_total_calls bigint := 0;
  v_total_rows bigint := 0;
  v_top_calls bigint := 0;
  v_top_preview text := '';
  v_logs_total int := 0;
  v_logs_err_24h int := 0;
  v_sync_pending int := 0;
  v_sync_failed int := 0;
  v_sync_processing int := 0;
  v_pruned int := 0;
  v_delta_calls_per_min numeric := 0;
  v_elapsed_min numeric := 0;
BEGIN
  SELECT * INTO v_last_snap
  FROM public.system_monitoring_snapshots
  ORDER BY captured_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_has_last := true;
    IF p_source <> 'manual' AND v_last_snap.captured_at > (now() - interval '10 minutes') THEN
      RETURN jsonb_build_object(
        'recorded', false,
        'reason', 'RECENT_SNAPSHOT_EXISTS',
        'last_captured_at', v_last_snap.captured_at
      );
    END IF;
  END IF;

  SELECT pg_database_size(current_database()) INTO v_db_size;

  SELECT coalesce(sum((metadata->>'size')::bigint), 0)
  INTO v_storage_bytes
  FROM storage.objects;

  SELECT
    count(*) FILTER (WHERE state = 'active'),
    count(*) FILTER (WHERE state LIKE 'idle in transaction%')
  INTO v_active_conn, v_idle_tx_conn
  FROM pg_stat_activity;

  SELECT coalesce(
    round(
      sum(heap_blks_hit)::numeric /
      nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100,
      2
    ),
    100.00
  )
  INTO v_cache_hit
  FROM pg_statio_user_tables;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    SELECT
      coalesce(sum(calls), 0),
      coalesce(sum(rows), 0)
    INTO v_total_calls, v_total_rows
    FROM extensions.pg_stat_statements
    WHERE query NOT ILIKE '%pg_stat_statements%'
      AND query NOT ILIKE '%system_monitoring_%';

    SELECT
      coalesce(calls, 0),
      left(regexp_replace(query, '\s+', ' ', 'g'), 140)
    INTO v_top_calls, v_top_preview
    FROM extensions.pg_stat_statements
    WHERE query ILIKE '%public.%'
      AND query NOT ILIKE '%system_monitoring_%'
    ORDER BY calls DESC
    LIMIT 1;
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'ERROR' AND created_at >= now() - interval '24 hours')
  INTO v_logs_total, v_logs_err_24h
  FROM public.conta_azul_integration_logs;

  SELECT
    count(*) FILTER (WHERE status = 'PENDING'),
    count(*) FILTER (WHERE status = 'FAILED'),
    count(*) FILTER (WHERE status = 'PROCESSING')
  INTO v_sync_pending, v_sync_failed, v_sync_processing
  FROM public.sync_queue;

  INSERT INTO public.system_monitoring_snapshots (
    captured_at,
    source,
    db_size_bytes,
    storage_bytes,
    active_connections,
    idle_in_tx_connections,
    cache_hit_ratio,
    total_query_calls,
    total_rows_returned,
    top_query_calls,
    top_query_preview,
    logs_total_count,
    logs_error_24h,
    sync_pending_count,
    sync_failed_count,
    sync_processing_count
  ) VALUES (
    now(),
    coalesce(p_source, 'auto'),
    coalesce(v_db_size, 0),
    coalesce(v_storage_bytes, 0),
    coalesce(v_active_conn, 0),
    coalesce(v_idle_tx_conn, 0),
    coalesce(v_cache_hit, 100.00),
    coalesce(v_total_calls, 0),
    coalesce(v_total_rows, 0),
    coalesce(v_top_calls, 0),
    coalesce(v_top_preview, ''),
    coalesce(v_logs_total, 0),
    coalesce(v_logs_err_24h, 0),
    coalesce(v_sync_pending, 0),
    coalesce(v_sync_failed, 0),
    coalesce(v_sync_processing, 0)
  );

  -- Expurgar snapshots com mais de 30 dias para consumo de disco zero
  WITH deleted AS (
    DELETE FROM public.system_monitoring_snapshots
    WHERE captured_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT count(*) INTO v_pruned FROM deleted;

  IF v_has_last AND v_total_calls >= v_last_snap.total_query_calls THEN
    v_elapsed_min := greatest(extract(epoch FROM (now() - v_last_snap.captured_at)) / 60.0, 0.5);
    v_delta_calls_per_min := round(((v_total_calls - v_last_snap.total_query_calls)::numeric / v_elapsed_min), 2);
  END IF;

  RETURN jsonb_build_object(
    'recorded', true,
    'captured_at', now(),
    'pruned_old_snapshots', v_pruned,
    'delta_calls_per_min', v_delta_calls_per_min,
    'db_size_bytes', v_db_size
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_monitoring_snapshot(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_monitoring_snapshot(text) TO service_role;

-- 5. Funcao RPC Principal: Coleta Consolidada de Telemetria (1 Unica Requisicao)
CREATE OR REPLACE FUNCTION public.get_system_monitoring_telemetry(
  p_tenant_id uuid DEFAULT 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_state record;
  v_baseline jsonb := '{}'::jsonb;
  v_database jsonb;
  v_queries jsonb;
  v_tables jsonb;
  v_integration jsonb;
  v_governance jsonb;
  v_history jsonb;
  v_snap_count int;
BEGIN
  -- Garante ao menos 1 snapshot inicial ou atualiza se > 15 minutos
  SELECT count(*) INTO v_snap_count FROM public.system_monitoring_snapshots;
  IF v_snap_count = 0 THEN
    PERFORM public.record_monitoring_snapshot('initial');
  ELSE
    PERFORM public.record_monitoring_snapshot('telemetry_read');
  END IF;

  SELECT * INTO v_state FROM public.system_monitoring_state WHERE id = 'global';
  IF FOUND AND v_state.query_baseline IS NOT NULL THEN
    v_baseline := v_state.query_baseline;
  END IF;

  -- A. METRICAS DE BANCO, CONEXOES, CACHE E STORAGE
  SELECT jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'db_size_pretty', pg_size_pretty(pg_database_size(current_database())),
    'postgres_version', version(),
    'max_connections', (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
    'total_connections', (SELECT count(*) FROM pg_stat_activity),
    'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
    'idle_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'),
    'idle_in_tx_connections', (SELECT count(*) FROM pg_stat_activity WHERE state LIKE 'idle in transaction%'),
    'stuck_idle_in_tx_5m', (
      SELECT count(*)
      FROM pg_stat_activity
      WHERE state LIKE 'idle in transaction%'
        AND state_change < now() - interval '5 minutes'
        AND pid <> pg_backend_pid()
    ),
    'longest_active_query_sec', (
      SELECT coalesce(round(max(extract(epoch FROM (now() - query_start)))::numeric, 2), 0)
      FROM pg_stat_activity
      WHERE state = 'active' AND pid <> pg_backend_pid() AND query_start IS NOT NULL
    ),
    'connections_by_role', (
      SELECT coalesce(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT
          coalesce(usename, 'system') AS role_name,
          coalesce(state, 'background') AS conn_state,
          count(*) AS count
        FROM pg_stat_activity
        GROUP BY coalesce(usename, 'system'), coalesce(state, 'background')
        ORDER BY count(*) DESC
      ) c
    ),
    'cache_hit_ratio', (
      SELECT coalesce(
        round(sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2),
        100.00
      )
      FROM pg_statio_user_tables
    ),
    'index_hit_ratio', (
      SELECT coalesce(
        round(sum(idx_blks_hit)::numeric / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0) * 100, 2),
        100.00
      )
      FROM pg_statio_user_indexes
    ),
    'storage_bytes', (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects),
    'storage_files_count', (SELECT count(*) FROM storage.objects),
    'storage_buckets_count', (SELECT count(*) FROM storage.buckets)
  ) INTO v_database;

  -- B. DETECTOR ANTI-N+1 E RAIO-X DE CONSULTAS (pg_stat_statements com suporte a Baseline)
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    WITH app_queries AS (
      SELECT
        queryid::text AS qid,
        calls AS raw_calls,
        greatest(calls - coalesce((v_baseline -> (queryid::text) ->> 'calls')::bigint, 0), 0) AS calls_since_baseline,
        round(total_exec_time::numeric, 2) AS raw_total_ms,
        round(greatest(total_exec_time - coalesce((v_baseline -> (queryid::text) ->> 'total_ms')::double precision, 0), 0)::numeric, 2) AS total_ms_since_baseline,
        round(mean_exec_time::numeric, 2) AS mean_ms,
        round(max_exec_time::numeric, 2) AS max_ms,
        rows AS raw_rows,
        greatest(rows - coalesce((v_baseline -> (queryid::text) ->> 'rows')::bigint, 0), 0) AS rows_since_baseline,
        left(regexp_replace(query, '\s+', ' ', 'g'), 260) AS query_preview
      FROM extensions.pg_stat_statements
      WHERE query NOT ILIKE '%pg_stat_statements%'
        AND query NOT ILIKE '%system_monitoring_%'
        AND query NOT ILIKE '%get_system_monitoring_telemetry%'
        AND query NOT ILIKE 'SET client_%'
        AND query NOT ILIKE 'BEGIN ISOLATION LEVEL%'
        AND query NOT ILIKE 'COMMIT%'
        AND query NOT ILIKE 'ROLLBACK%'
        AND (
          query ILIKE '%public.%'
          OR query ILIKE '%orders%'
          OR query ILIKE '%customers%'
          OR query ILIKE '%products%'
          OR query ILIKE '%profiles%'
          OR query ILIKE '%sync_queue%'
          OR query ILIKE '%financial_transactions%'
        )
    )
    SELECT jsonb_build_object(
      'enabled', true,
      'baseline_reset_at', v_state.baseline_reset_at,
      'total_raw_calls', (SELECT coalesce(sum(raw_calls), 0) FROM app_queries),
      'total_calls_since_baseline', (SELECT coalesce(sum(calls_since_baseline), 0) FROM app_queries),
      'total_rows_since_baseline', (SELECT coalesce(sum(rows_since_baseline), 0) FROM app_queries),
      'top_by_calls', (
        SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb)
        FROM (
          SELECT * FROM app_queries
          WHERE calls_since_baseline > 0 OR raw_calls > 0
          ORDER BY calls_since_baseline DESC, raw_calls DESC
          LIMIT 20
        ) q
      ),
      'top_by_total_time', (
        SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb)
        FROM (
          SELECT * FROM app_queries
          WHERE total_ms_since_baseline > 0 OR raw_total_ms > 0
          ORDER BY total_ms_since_baseline DESC, raw_total_ms DESC
          LIMIT 15
        ) q
      ),
      'top_by_mean_latency', (
        SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb)
        FROM (
          SELECT * FROM app_queries
          WHERE raw_calls >= 5
          ORDER BY mean_ms DESC
          LIMIT 15
        ) q
      )
    ) INTO v_queries;
  ELSE
    v_queries := jsonb_build_object('enabled', false, 'top_by_calls', '[]'::jsonb, 'top_by_total_time', '[]'::jsonb, 'top_by_mean_latency', '[]'::jsonb);
  END IF;

  -- C. ANATOMIA DE TABELAS, BLOAT E EFICIENCIA DE INDICES
  SELECT jsonb_build_object(
    'table_stats', (
      SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          schemaname,
          relname AS table_name,
          pg_total_relation_size(relid) AS total_bytes,
          pg_relation_size(relid) AS table_bytes,
          pg_indexes_size(relid) AS index_bytes,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
          n_live_tup AS live_rows,
          n_dead_tup AS dead_rows,
          CASE
            WHEN (n_live_tup + n_dead_tup) > 0
              THEN round((n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric) * 100, 1)
            ELSE 0
          END AS bloat_pct,
          coalesce(seq_scan, 0) AS seq_scan,
          coalesce(seq_tup_read, 0) AS seq_tup_read,
          coalesce(idx_scan, 0) AS idx_scan,
          coalesce(idx_tup_fetch, 0) AS idx_tup_fetch,
          CASE
            WHEN (coalesce(seq_scan, 0) + coalesce(idx_scan, 0)) > 0
              THEN round((coalesce(idx_scan, 0)::numeric / (coalesce(seq_scan, 0) + coalesce(idx_scan, 0))::numeric) * 100, 1)
            ELSE 100
          END AS idx_usage_pct,
          coalesce(n_tup_ins, 0) AS inserts,
          coalesce(n_tup_upd, 0) AS updates,
          coalesce(n_tup_del, 0) AS deletes,
          last_autovacuum,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname IN ('public', 'auth')
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 25
      ) t
    ),
    'unused_indexes', (
      SELECT coalesce(jsonb_agg(row_to_json(i)), '[]'::jsonb)
      FROM (
        SELECT
          s.schemaname,
          s.relname AS table_name,
          s.indexrelname AS index_name,
          pg_relation_size(s.indexrelid) AS index_bytes,
          pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
          s.idx_scan
        FROM pg_stat_user_indexes s
        JOIN pg_index ix ON ix.indexrelid = s.indexrelid
        WHERE s.schemaname = 'public'
          AND s.idx_scan = 0
          AND NOT ix.indisprimary
          AND NOT ix.indisunique
          AND s.indexrelname NOT LIKE 'idx_monitoring_%'
          AND s.indexrelname NOT LIKE 'idx_ca_logs_%'
          AND s.indexrelname NOT LIKE 'idx_sync_queue_%'
        ORDER BY pg_relation_size(s.indexrelid) DESC
        LIMIT 25
      ) i
    ),
    'public_tables_without_rls', (
      SELECT count(*)
      FROM pg_tables
      WHERE schemaname = 'public'
        AND NOT rowsecurity
    )
  ) INTO v_tables;

  -- D. INTEGRACAO CONTA AZUL, CRONS, CIRCUIT BREAKER, FILA E LOGS
  SELECT jsonb_build_object(
    'ca_config', (
      SELECT coalesce(
        jsonb_build_object(
          'configured', (client_id IS NOT NULL AND client_id <> ''),
          'client_id_preview', CASE WHEN client_id IS NOT NULL AND length(client_id) > 8 THEN left(client_id, 6) || '...' || right(client_id, 4) ELSE coalesce(client_id, '') END,
          'has_secret', (client_secret IS NOT NULL AND client_secret <> ''),
          'has_access_token', (access_token IS NOT NULL AND access_token <> ''),
          'has_refresh_token', (refresh_token IS NOT NULL AND refresh_token <> ''),
          'expires_at', expires_at,
          'updated_at', updated_at,
          'is_token_expired', (expires_at IS NULL OR expires_at <= now())
        ),
        jsonb_build_object('configured', false, 'is_token_expired', true)
      )
      FROM public.conta_azul_config
      WHERE tenant_id = p_tenant_id
      LIMIT 1
    ),
    'cron_and_circuit', jsonb_build_object(
      'last_incremental_cron_at', v_state.last_incremental_cron_at,
      'last_full_cron_at', v_state.last_full_cron_at,
      'last_cron_source', v_state.last_cron_source,
      'last_blocked_cron_source', v_state.last_blocked_cron_source,
      'last_blocked_cron_at', v_state.last_blocked_cron_at,
      'duplicate_cron_blocked_count', coalesce(v_state.duplicate_cron_blocked_count, 0),
      'oauth_consecutive_failures', coalesce(v_state.oauth_consecutive_failures, 0),
      'oauth_last_failure_reason', v_state.oauth_last_failure_reason,
      'oauth_circuit_open_until', v_state.oauth_circuit_open_until,
      'is_circuit_open', (v_state.oauth_circuit_open_until IS NOT NULL AND v_state.oauth_circuit_open_until > now()),
      'recent_cron_events', coalesce(v_state.recent_cron_events, '[]'::jsonb)
    ),
    'sync_queue', jsonb_build_object(
      'pending', (SELECT count(*) FROM public.sync_queue WHERE tenant_id = p_tenant_id AND status = 'PENDING'),
      'processing', (SELECT count(*) FROM public.sync_queue WHERE tenant_id = p_tenant_id AND status = 'PROCESSING'),
      'failed', (SELECT count(*) FROM public.sync_queue WHERE tenant_id = p_tenant_id AND status = 'FAILED'),
      'completed', (SELECT count(*) FROM public.sync_queue WHERE tenant_id = p_tenant_id AND status = 'COMPLETED'),
      'stuck_processing_15m', (
        SELECT count(*)
        FROM public.sync_queue
        WHERE tenant_id = p_tenant_id
          AND status = 'PROCESSING'
          AND updated_at < now() - interval '15 minutes'
      ),
      'oldest_pending_at', (
        SELECT min(created_at)
        FROM public.sync_queue
        WHERE tenant_id = p_tenant_id AND status = 'PENDING'
      ),
      'recent_failures', (
        SELECT coalesce(jsonb_agg(row_to_json(f)), '[]'::jsonb)
        FROM (
          SELECT id, entity_type, entity_id, action, retry_count, max_retries, status, left(coalesce(last_error, ''), 220) AS last_error, updated_at
          FROM public.sync_queue
          WHERE tenant_id = p_tenant_id AND status IN ('FAILED', 'PROCESSING')
          ORDER BY updated_at DESC
          LIMIT 15
        ) f
      )
    ),
    'logs', jsonb_build_object(
      'total_count', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id),
      'total_bytes', pg_total_relation_size('public.conta_azul_integration_logs'::regclass),
      'total_size_pretty', pg_size_pretty(pg_total_relation_size('public.conta_azul_integration_logs'::regclass)),
      'last_1h_success', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id AND status = 'SUCCESS' AND created_at >= now() - interval '1 hour'),
      'last_1h_error', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id AND status = 'ERROR' AND created_at >= now() - interval '1 hour'),
      'last_24h_success', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id AND status = 'SUCCESS' AND created_at >= now() - interval '24 hours'),
      'last_24h_error', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id AND status = 'ERROR' AND created_at >= now() - interval '24 hours'),
      'total_errors', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id AND status = 'ERROR'),
      'total_success', (SELECT count(*) FROM public.conta_azul_integration_logs WHERE tenant_id = p_tenant_id AND status = 'SUCCESS'),
      'last_success_import_at', (
        SELECT max(created_at)
        FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id
          AND action = 'IMPORT_ORDERS'
          AND status = 'SUCCESS'
      ),
      'grouped_errors', (
        SELECT coalesce(jsonb_agg(row_to_json(ge)), '[]'::jsonb)
        FROM (
          SELECT
            action,
            left(coalesce(nullif(trim(error_message), ''), 'Erro sem mensagem detalhada'), 180) AS error_summary,
            count(*) AS occurrences,
            max(created_at) AS last_seen_at,
            min(created_at) AS first_seen_at
          FROM public.conta_azul_integration_logs
          WHERE tenant_id = p_tenant_id AND status = 'ERROR'
          GROUP BY action, left(coalesce(nullif(trim(error_message), ''), 'Erro sem mensagem detalhada'), 180)
          ORDER BY max(created_at) DESC, count(*) DESC
          LIMIT 12
        ) ge
      )
    )
  ) INTO v_integration;

  -- E. GOVERNANCA, SESSOES AUTH E INTEGRIDADE DE DADOS DE NEGOCIO (SANITY CHECKS)
  SELECT jsonb_build_object(
    'auth_stats', jsonb_build_object(
      'auth_users_count', (SELECT count(*) FROM auth.users),
      'mau_calendar_month', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= date_trunc('month', now())),
      'mau_rolling_30d', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '30 days'),
      'active_sessions_count', (SELECT count(*) FROM auth.sessions WHERE not_after IS NULL OR not_after > now()),
      'refresh_tokens_count', (SELECT count(*) FROM auth.refresh_tokens),
      'refresh_tokens_size', pg_size_pretty(pg_total_relation_size('auth.refresh_tokens'::regclass)),
      'profiles_active_count', (SELECT count(*) FROM public.profiles WHERE tenant_id = p_tenant_id AND coalesce(status, 'ATIVO') = 'ATIVO'),
      'profiles_forced_pwd_count', (SELECT count(*) FROM public.profiles WHERE tenant_id = p_tenant_id AND coalesce(force_password_change, false) = true),
      'stage_moves_24h', (SELECT count(*) FROM public.order_item_stage_history WHERE tenant_id = p_tenant_id AND created_at >= now() - interval '24 hours')
    ),
    'billing_transition_config', coalesce(v_state.billing_transition_config, '{}'::jsonb),
    'business_sanity', jsonb_build_object(
      'orders_total', (SELECT count(*) FROM public.orders WHERE tenant_id = p_tenant_id),
      'order_items_total', (SELECT count(*) FROM public.order_items WHERE tenant_id = p_tenant_id),
      'customers_total', (SELECT count(*) FROM public.customers WHERE tenant_id = p_tenant_id),
      'products_total', (SELECT count(*) FROM public.products WHERE tenant_id = p_tenant_id),
      'orphan_orders_without_items', (
        SELECT count(*)
        FROM public.orders o
        WHERE o.tenant_id = p_tenant_id
          AND NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id)
      ),
      'items_without_stage', (
        SELECT count(*)
        FROM public.order_items oi
        WHERE oi.tenant_id = p_tenant_id AND oi.stage_id IS NULL
      ),
      'negative_stock_credits', (
        SELECT count(*)
        FROM public.customer_stock_credits csc
        WHERE csc.tenant_id = p_tenant_id AND csc.remaining_quantity < 0
      ),
      'orders_without_customer', (
        SELECT count(*)
        FROM public.orders o
        WHERE o.tenant_id = p_tenant_id AND o.customer_id IS NULL
      ),
      'duplicate_clean_documents', (
        SELECT count(*)
        FROM (
          SELECT regexp_replace(coalesce(document, ''), '\D', '', 'g') AS clean_doc
          FROM public.customers
          WHERE tenant_id = p_tenant_id
            AND regexp_replace(coalesce(document, ''), '\D', '', 'g') <> ''
          GROUP BY regexp_replace(coalesce(document, ''), '\D', '', 'g')
          HAVING count(*) > 1
        ) dup
      )
    )
  ) INTO v_governance;

  -- F. SERIE HISTORICA DE SNAPSHOTS (ULTIMOS 96 PONTOS PARA TENDENCIAS E GRAFICOS)
  SELECT coalesce(jsonb_agg(row_to_json(h)), '[]'::jsonb)
  INTO v_history
  FROM (
    SELECT *
    FROM (
      SELECT
        captured_at,
        source,
        db_size_bytes,
        storage_bytes,
        active_connections,
        idle_in_tx_connections,
        cache_hit_ratio,
        total_query_calls,
        total_rows_returned,
        top_query_calls,
        top_query_preview,
        logs_total_count,
        logs_error_24h,
        sync_pending_count,
        sync_failed_count,
        sync_processing_count
      FROM public.system_monitoring_snapshots
      ORDER BY captured_at DESC
      LIMIT 96
    ) recent
    ORDER BY captured_at ASC
  ) h;

  RETURN jsonb_build_object(
    'collected_at', now(),
    'database', v_database,
    'queries', v_queries,
    'tables', v_tables,
    'integration', v_integration,
    'governance', v_governance,
    'history', v_history
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_system_monitoring_telemetry(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_monitoring_telemetry(uuid) TO service_role;

-- 6. Funcao RPC de Manutencao e Resposta Preventiva/Corretiva em 1 Clique
CREATE OR REPLACE FUNCTION public.execute_monitoring_maintenance(
  p_action text,
  p_retention_hours integer DEFAULT 48,
  p_tenant_id uuid DEFAULT 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_affected integer := 0;
  v_hours integer := greatest(coalesce(p_retention_hours, 0), 0);
  v_hw_reset_ok boolean := false;
  v_new_baseline jsonb := '{}'::jsonb;
  v_message text := '';
BEGIN
  IF p_action = 'PURGE_LOGS_OLDER_THAN' THEN
    IF v_hours = 0 THEN
      WITH d AS (
        DELETE FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
      v_message := format('%s registros de logs removidos integralmente.', v_affected);
    ELSE
      WITH d AS (
        DELETE FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id
          AND created_at < now() - make_interval(hours => v_hours)
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
      v_message := format('%s logs mais antigos que %s horas removidos.', v_affected, v_hours);
    END IF;

  ELSIF p_action = 'PURGE_LOGS_SUCCESS_ONLY' THEN
    IF v_hours = 0 THEN
      WITH d AS (
        DELETE FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id AND status = 'SUCCESS'
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    ELSE
      WITH d AS (
        DELETE FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id
          AND status = 'SUCCESS'
          AND created_at < now() - make_interval(hours => v_hours)
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    END IF;
    v_message := format('%s logs de sucesso removidos (erros preservados).', v_affected);

  ELSIF p_action = 'PURGE_LOGS_ERRORS_OLDER_THAN' THEN
    IF v_hours = 0 THEN
      WITH d AS (
        DELETE FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id AND status = 'ERROR'
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    ELSE
      WITH d AS (
        DELETE FROM public.conta_azul_integration_logs
        WHERE tenant_id = p_tenant_id
          AND status = 'ERROR'
          AND created_at < now() - make_interval(hours => v_hours)
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    END IF;
    v_message := format('%s logs de erro removidos.', v_affected);

  ELSIF p_action = 'CLEAN_SYNC_QUEUE_COMPLETED' THEN
    IF v_hours = 0 THEN
      WITH d AS (
        DELETE FROM public.sync_queue
        WHERE tenant_id = p_tenant_id AND status = 'COMPLETED'
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    ELSE
      WITH d AS (
        DELETE FROM public.sync_queue
        WHERE tenant_id = p_tenant_id
          AND status = 'COMPLETED'
          AND updated_at < now() - make_interval(hours => v_hours)
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    END IF;
    v_message := format('%s registros concluidos (COMPLETED) expurgados da sync_queue.', v_affected);

  ELSIF p_action = 'UNLOCK_STUCK_SYNC_QUEUE' THEN
    WITH u AS (
      UPDATE public.sync_queue
      SET status = 'PENDING',
          next_retry_at = now(),
          updated_at = now(),
          last_error = coalesce(last_error, '') || ' [Destravado manualmente na Central de Monitoramento]'
      WHERE tenant_id = p_tenant_id
        AND status = 'PROCESSING'
      RETURNING 1
    ) SELECT count(*) INTO v_affected FROM u;
    v_message := format('%s itens travados em PROCESSING recolocados em PENDING.', v_affected);

  ELSIF p_action = 'RETRY_FAILED_SYNC_QUEUE' THEN
    WITH u AS (
      UPDATE public.sync_queue
      SET status = 'PENDING',
          retry_count = 0,
          next_retry_at = now(),
          updated_at = now()
      WHERE tenant_id = p_tenant_id
        AND status = 'FAILED'
      RETURNING 1
    ) SELECT count(*) INTO v_affected FROM u;
    v_message := format('%s itens FAILED agendados para nova tentativa.', v_affected);

  ELSIF p_action = 'CLEAR_FAILED_SYNC_QUEUE' THEN
    IF v_hours = 0 THEN
      WITH d AS (
        DELETE FROM public.sync_queue
        WHERE tenant_id = p_tenant_id AND status = 'FAILED'
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    ELSE
      WITH d AS (
        DELETE FROM public.sync_queue
        WHERE tenant_id = p_tenant_id
          AND status = 'FAILED'
          AND updated_at < now() - make_interval(hours => v_hours)
        RETURNING 1
      ) SELECT count(*) INTO v_affected FROM d;
    END IF;
    v_message := format('%s itens FAILED removidos da sync_queue.', v_affected);

  ELSIF p_action = 'RESET_QUERY_BASELINE' THEN
    BEGIN
      PERFORM extensions.pg_stat_statements_reset(0::oid, 0::oid, 0::bigint, false);
      v_hw_reset_ok := true;
    EXCEPTION WHEN OTHERS THEN
      v_hw_reset_ok := false;
    END;

    IF NOT v_hw_reset_ok AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
      SELECT coalesce(
        jsonb_object_agg(
          queryid::text,
          jsonb_build_object('calls', calls, 'total_ms', total_exec_time, 'rows', rows)
        ),
        '{}'::jsonb
      )
      INTO v_new_baseline
      FROM extensions.pg_stat_statements
      WHERE query ILIKE '%public.%'
        OR query ILIKE '%orders%'
        OR query ILIKE '%customers%'
        OR query ILIKE '%products%'
        OR query ILIKE '%profiles%'
        OR query ILIKE '%sync_queue%'
        OR query ILIKE '%financial_transactions%';
    END IF;

    UPDATE public.system_monitoring_state
    SET baseline_reset_at = now(),
        query_baseline = CASE WHEN v_hw_reset_ok THEN '{}'::jsonb ELSE v_new_baseline END,
        updated_at = now()
    WHERE id = 'global';

    PERFORM public.record_monitoring_snapshot('manual');
    v_affected := 1;
    v_message := CASE
      WHEN v_hw_reset_ok THEN 'Estatisticas globais do pg_stat_statements zeradas com sucesso.'
      ELSE 'Linha de base virtual de consultas redefinida com sucesso (contadores desde o reset zerados).'
    END;

  ELSIF p_action = 'TERMINATE_IDLE_TRANSACTIONS' THEN
    SELECT count(*)
    INTO v_affected
    FROM (
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE state LIKE 'idle in transaction%'
        AND state_change < now() - interval '5 minutes'
        AND pid <> pg_backend_pid()
        AND coalesce(usename, '') NOT IN ('supabase_admin', 'replicator', 'supabase_storage_admin')
    ) term;
    v_message := format('%s conexoes ociosas em transacao encerradas.', v_affected);

  ELSIF p_action = 'RUN_ANALYZE_CORE_TABLES' THEN
    ANALYZE public.orders;
    ANALYZE public.order_items;
    ANALYZE public.customers;
    ANALYZE public.products;
    ANALYZE public.conta_azul_integration_logs;
    ANALYZE public.sync_queue;
    ANALYZE public.financial_transactions;
    v_affected := 7;
    v_message := 'Estatisticas do planejador Postgres (ANALYZE) atualizadas nas 7 tabelas criticas.';

  ELSIF p_action = 'RESET_OAUTH_CIRCUIT_BREAKER' THEN
    UPDATE public.system_monitoring_state
    SET oauth_consecutive_failures = 0,
        oauth_circuit_open_until = NULL,
        oauth_last_failure_reason = NULL,
        duplicate_cron_blocked_count = 0,
        updated_at = now()
    WHERE id = 'global';
    v_affected := 1;
    v_message := 'Circuit Breaker OAuth e contador de bloqueios de cron duplicado reiniciados.';

  ELSE
    RAISE EXCEPTION 'Acao de manutencao desconhecida: %', p_action;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'affected', v_affected,
    'message', v_message,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.execute_monitoring_maintenance(text, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_monitoring_maintenance(text, integer, uuid) TO service_role;
