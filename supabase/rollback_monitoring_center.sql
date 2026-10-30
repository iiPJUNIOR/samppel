-- =============================================================================
-- ROLLBACK COMPLETO: Central de Monitoramento, Telemetria e Governanca (MOD-16)
--Criado em: 2026-10-30
-- Seguranca: Remove apenas as funcoes, indices e tabelas adicionados pela
-- migration supabase_monitoring_center.sql, sem tocar em dados de negocio.
-- =============================================================================

DROP FUNCTION IF EXISTS public.execute_monitoring_maintenance(text, integer, uuid);
DROP FUNCTION IF EXISTS public.get_system_monitoring_telemetry(uuid);
DROP FUNCTION IF EXISTS public.record_monitoring_snapshot(text);

DROP INDEX IF EXISTS public.idx_ca_logs_tenant_created_at;
DROP INDEX IF EXISTS public.idx_sync_queue_tenant_status_created;
DROP INDEX IF EXISTS public.idx_monitoring_snapshots_captured_at;

DROP TABLE IF EXISTS public.system_monitoring_snapshots;
DROP TABLE IF EXISTS public.system_monitoring_state;
