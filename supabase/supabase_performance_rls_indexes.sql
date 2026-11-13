-- =============================================================================
-- MIGRATION: Otimizacao de Performance RLS (InitPlan), Indices de FK e Telemetria
-- Data: 13/11/2026
-- Objetivo:
--   1. Eliminar os 42 alertas auth_rls_initplan (4,15M de varreduras em profiles)
--   2. Eliminar os 9 alertas multiple_permissive_policies sem alterar permissoes
--   3. Remover os 2 indices identicos duplicados (orders / order_items)
--   4. Criar indices nas Foreign Keys de alta rotatividade + indice composto para
--      Scroll Infinito das etapas historicas (Concluido / CANCELADOS)
--   5. Reduzir auto-consumo de CPU de record_monitoring_snapshot (janela de 60m)
-- =============================================================================

-- 1. Funcoes auxiliares STABLE SECURITY DEFINER com search_path fixo
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_auth_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND (role)::text = 'Administrador'::text
  );
$$;

-- 2. Atualizacao Cirurgica das Politicas RLS (InitPlan + Unificacao de Duplicadas)

-- companies
DROP POLICY IF EXISTS "Leitura de Companies" ON public.companies;
CREATE POLICY "Leitura de Companies"
  ON public.companies FOR SELECT TO authenticated
  USING (id = (SELECT public.get_auth_tenant_id()));

-- conta_azul_config
DROP POLICY IF EXISTS "Acesso por Tenant em Conta Azul Config" ON public.conta_azul_config;
CREATE POLICY "Acesso por Tenant em Conta Azul Config"
  ON public.conta_azul_config FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- conta_azul_integration_logs
DROP POLICY IF EXISTS "Acesso por Tenant em Integration Logs" ON public.conta_azul_integration_logs;
CREATE POLICY "Acesso por Tenant em Integration Logs"
  ON public.conta_azul_integration_logs FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- customer_product_stock (unifica SELECT redundante dentro de FOR ALL)
DROP POLICY IF EXISTS "Leitura de Estoque Personalizado por Tenant" ON public.customer_product_stock;
DROP POLICY IF EXISTS "Modificacao de Estoque Personalizado por Tenant" ON public.customer_product_stock;
CREATE POLICY "Modificacao de Estoque Personalizado por Tenant"
  ON public.customer_product_stock FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- customer_stock_credits (unifica SELECT redundante dentro de FOR ALL)
DROP POLICY IF EXISTS "Leitura de Creditos por Tenant" ON public.customer_stock_credits;
DROP POLICY IF EXISTS "Modificacao de Creditos por Tenant" ON public.customer_stock_credits;
CREATE POLICY "Modificacao de Creditos por Tenant"
  ON public.customer_stock_credits FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- customers
DROP POLICY IF EXISTS "Acesso por Tenant em Customers" ON public.customers;
CREATE POLICY "Acesso por Tenant em Customers"
  ON public.customers FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- factory_locations (unifica SELECT redundante dentro de FOR ALL)
DROP POLICY IF EXISTS "Leitura de Localizacoes por Tenant" ON public.factory_locations;
DROP POLICY IF EXISTS "Modificacao de Localizacoes por Tenant" ON public.factory_locations;
CREATE POLICY "Modificacao de Localizacoes por Tenant"
  ON public.factory_locations FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- financial_transactions
DROP POLICY IF EXISTS "Acesso por Tenant em Financial Transactions" ON public.financial_transactions;
CREATE POLICY "Acesso por Tenant em Financial Transactions"
  ON public.financial_transactions FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- handling_teams
DROP POLICY IF EXISTS "handling_teams_tenant_rls" ON public.handling_teams;
CREATE POLICY "handling_teams_tenant_rls"
  ON public.handling_teams FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_balance_adjustments
DROP POLICY IF EXISTS "Insercao de Ajustes por Tenant" ON public.order_balance_adjustments;
CREATE POLICY "Insercao de Ajustes por Tenant"
  ON public.order_balance_adjustments FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

DROP POLICY IF EXISTS "Leitura de Ajustes por Tenant" ON public.order_balance_adjustments;
CREATE POLICY "Leitura de Ajustes por Tenant"
  ON public.order_balance_adjustments FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_item_handling_teams (unifica SELECT redundante dentro de FOR ALL)
DROP POLICY IF EXISTS "Leitura de Equipes de Item por Tenant" ON public.order_item_handling_teams;
DROP POLICY IF EXISTS "Modificacao de Equipes de Item por Tenant" ON public.order_item_handling_teams;
CREATE POLICY "Modificacao de Equipes de Item por Tenant"
  ON public.order_item_handling_teams FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_item_notes_history
DROP POLICY IF EXISTS "notes_history_tenant_rls" ON public.order_item_notes_history;
CREATE POLICY "notes_history_tenant_rls"
  ON public.order_item_notes_history FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_item_packaging
DROP POLICY IF EXISTS "order_item_packaging_tenant_policy" ON public.order_item_packaging;
CREATE POLICY "order_item_packaging_tenant_policy"
  ON public.order_item_packaging FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_item_sector_history
DROP POLICY IF EXISTS "sector_history_tenant_rls" ON public.order_item_sector_history;
CREATE POLICY "sector_history_tenant_rls"
  ON public.order_item_sector_history FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_item_stage_history
DROP POLICY IF EXISTS "Leitura de Historico por Tenant" ON public.order_item_stage_history;
CREATE POLICY "Leitura de Historico por Tenant"
  ON public.order_item_stage_history FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_items
DROP POLICY IF EXISTS "Insercao de Itens por Tenant" ON public.order_items;
CREATE POLICY "Insercao de Itens por Tenant"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

DROP POLICY IF EXISTS "Leitura de Itens por Tenant" ON public.order_items;
CREATE POLICY "Leitura de Itens por Tenant"
  ON public.order_items FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()));

DROP POLICY IF EXISTS "Modificacao de Itens por Tenant" ON public.order_items;
CREATE POLICY "Modificacao de Itens por Tenant"
  ON public.order_items FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

DROP POLICY IF EXISTS "Remocao de Itens por Tenant" ON public.order_items;
CREATE POLICY "Remocao de Itens por Tenant"
  ON public.order_items FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_shipping_volumes (unifica SELECT redundante dentro de FOR ALL)
DROP POLICY IF EXISTS "Leitura de Volumes de Expedicao por Tenant" ON public.order_shipping_volumes;
DROP POLICY IF EXISTS "Modificacao de Volumes de Expedicao por Tenant" ON public.order_shipping_volumes;
CREATE POLICY "Modificacao de Volumes de Expedicao por Tenant"
  ON public.order_shipping_volumes FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- order_stages (separa SELECT de INSERT/UPDATE/DELETE por Admin para eliminar sobreposicao)
DROP POLICY IF EXISTS "Leitura de Etapas por Tenant" ON public.order_stages;
DROP POLICY IF EXISTS "Modificacao de Etapas por Admin" ON public.order_stages;
DROP POLICY IF EXISTS "Insercao de Etapas por Admin" ON public.order_stages;
DROP POLICY IF EXISTS "Atualizacao de Etapas por Admin" ON public.order_stages;
DROP POLICY IF EXISTS "Remocao de Etapas por Admin" ON public.order_stages;

CREATE POLICY "Leitura de Etapas por Tenant"
  ON public.order_stages FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()));

CREATE POLICY "Insercao de Etapas por Admin"
  ON public.order_stages FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()) AND (SELECT public.is_auth_admin()));

CREATE POLICY "Atualizacao de Etapas por Admin"
  ON public.order_stages FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()) AND (SELECT public.is_auth_admin()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()) AND (SELECT public.is_auth_admin()));

CREATE POLICY "Remocao de Etapas por Admin"
  ON public.order_stages FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()) AND (SELECT public.is_auth_admin()));

-- orders
DROP POLICY IF EXISTS "Acesso por Tenant em Orders" ON public.orders;
CREATE POLICY "Acesso por Tenant em Orders"
  ON public.orders FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- packaging_material_types
DROP POLICY IF EXISTS "packaging_material_types_tenant_policy" ON public.packaging_material_types;
CREATE POLICY "packaging_material_types_tenant_policy"
  ON public.packaging_material_types FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- packaging_settings
DROP POLICY IF EXISTS "packaging_settings_tenant_policy" ON public.packaging_settings;
CREATE POLICY "packaging_settings_tenant_policy"
  ON public.packaging_settings FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- production_machines
DROP POLICY IF EXISTS "production_machines_tenant_rls" ON public.production_machines;
CREATE POLICY "production_machines_tenant_rls"
  ON public.production_machines FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- production_sectors
DROP POLICY IF EXISTS "Acesso por Tenant em Production Sectors" ON public.production_sectors;
CREATE POLICY "Acesso por Tenant em Production Sectors"
  ON public.production_sectors FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- products
DROP POLICY IF EXISTS "Acesso por Tenant em Products" ON public.products;
CREATE POLICY "Acesso por Tenant em Products"
  ON public.products FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- profile_stage_permissions (separa SELECT de escritas Admin para eliminar sobreposicao)
DROP POLICY IF EXISTS "Leitura de Permissoes por Tenant" ON public.profile_stage_permissions;
DROP POLICY IF EXISTS "Modificacao de Permissoes por Admin" ON public.profile_stage_permissions;
DROP POLICY IF EXISTS "Insercao de Permissoes por Admin" ON public.profile_stage_permissions;
DROP POLICY IF EXISTS "Atualizacao de Permissoes por Admin" ON public.profile_stage_permissions;
DROP POLICY IF EXISTS "Remocao de Permissoes por Admin" ON public.profile_stage_permissions;

CREATE POLICY "Leitura de Permissoes por Tenant"
  ON public.profile_stage_permissions FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.tenant_id = (SELECT public.get_auth_tenant_id())
    )
  );

CREATE POLICY "Insercao de Permissoes por Admin"
  ON public.profile_stage_permissions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_auth_admin()) AND
    profile_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.tenant_id = (SELECT public.get_auth_tenant_id())
    )
  );

CREATE POLICY "Atualizacao de Permissoes por Admin"
  ON public.profile_stage_permissions FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_auth_admin()) AND
    profile_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.tenant_id = (SELECT public.get_auth_tenant_id())
    )
  )
  WITH CHECK (
    (SELECT public.is_auth_admin()) AND
    profile_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.tenant_id = (SELECT public.get_auth_tenant_id())
    )
  );

CREATE POLICY "Remocao de Permissoes por Admin"
  ON public.profile_stage_permissions FOR DELETE TO authenticated
  USING (
    (SELECT public.is_auth_admin()) AND
    profile_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.tenant_id = (SELECT public.get_auth_tenant_id())
    )
  );

-- profiles (separa SELECT de INSERT/UPDATE/DELETE proprio perfil)
DROP POLICY IF EXISTS "Acesso proprio perfil em Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leitura de Perfis do Mesmo Tenant" ON public.profiles;
DROP POLICY IF EXISTS "Insercao proprio perfil em Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Atualizacao proprio perfil em Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Remocao proprio perfil em Profiles" ON public.profiles;

CREATE POLICY "Leitura de Perfis do Mesmo Tenant"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR tenant_id = (SELECT public.get_auth_tenant_id())
  );

CREATE POLICY "Insercao proprio perfil em Profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Atualizacao proprio perfil em Profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Remocao proprio perfil em Profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (id = (SELECT auth.uid()));

-- shipping_types_config (unifica SELECT redundante dentro de FOR ALL)
DROP POLICY IF EXISTS "Leitura de Tipos de Frete por Tenant" ON public.shipping_types_config;
DROP POLICY IF EXISTS "Modificacao de Tipos de Frete por Tenant" ON public.shipping_types_config;
CREATE POLICY "Modificacao de Tipos de Frete por Tenant"
  ON public.shipping_types_config FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- stock_transactions
DROP POLICY IF EXISTS "Acesso por Tenant em Stock Transactions" ON public.stock_transactions;
CREATE POLICY "Acesso por Tenant em Stock Transactions"
  ON public.stock_transactions FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- suppliers
DROP POLICY IF EXISTS "Acesso por Tenant em Suppliers" ON public.suppliers;
CREATE POLICY "Acesso por Tenant em Suppliers"
  ON public.suppliers FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- sync_queue
DROP POLICY IF EXISTS "Acesso por Tenant em Sync Queue" ON public.sync_queue;
CREATE POLICY "Acesso por Tenant em Sync Queue"
  ON public.sync_queue FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.get_auth_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_auth_tenant_id()));

-- 3. Remocao dos 2 Indices Duplicados Identicos
DROP INDEX IF EXISTS public.idx_order_items_order;
DROP INDEX IF EXISTS public.idx_orders_customer;

-- 4. Criacao de Indices para FKs Criticas + Indice Composto de Scroll Infinito
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_stage_updated
  ON public.order_items (tenant_id, stage_id, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_order_item_handling_teams_item
  ON public.order_item_handling_teams (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_handling_teams_tenant
  ON public.order_item_handling_teams (tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_item_handling_teams_team
  ON public.order_item_handling_teams (handling_team_id);

CREATE INDEX IF NOT EXISTS idx_order_item_sector_history_item
  ON public.order_item_sector_history (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_sector_history_tenant
  ON public.order_item_sector_history (tenant_id);

CREATE INDEX IF NOT EXISTS idx_order_item_packaging_item
  ON public.order_item_packaging (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_packaging_tenant
  ON public.order_item_packaging (tenant_id);

CREATE INDEX IF NOT EXISTS idx_order_item_notes_history_item
  ON public.order_item_notes_history (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_notes_history_tenant
  ON public.order_item_notes_history (tenant_id);

CREATE INDEX IF NOT EXISTS idx_order_shipping_volumes_order
  ON public.order_shipping_volumes (order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipping_volumes_tenant
  ON public.order_shipping_volumes (tenant_id);

CREATE INDEX IF NOT EXISTS idx_profile_stage_permissions_stage
  ON public.profile_stage_permissions (stage_id);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id
  ON public.profiles (tenant_id);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_tenant_created
  ON public.stock_transactions (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_item_stage_history_tenant
  ON public.order_item_stage_history (tenant_id);

-- 5. Otimizacao de record_monitoring_snapshot (Cooldown automatico de 60 minutos)
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
    IF p_source <> 'manual' AND v_last_snap.captured_at > (now() - interval '60 minutes') THEN
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

  -- Estimativa instantanea via catalogo para total de logs + indice para erros de 24h
  SELECT greatest(coalesce(c.reltuples::bigint, 0), 0)::int
  INTO v_logs_total
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'conta_azul_integration_logs';

  SELECT count(*)
  INTO v_logs_err_24h
  FROM public.conta_azul_integration_logs
  WHERE status = 'ERROR' AND created_at >= now() - interval '24 hours';

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

-- 6. Restricao de execucao das funcoes auxiliares apenas para authenticated e service_role
REVOKE EXECUTE ON FUNCTION public.get_auth_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_auth_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_auth_admin() TO authenticated, service_role;
