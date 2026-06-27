-- ============================================================
-- MIGRAÇÃO PENDENTE: Tabelas opcionais do Kanban de Produção
-- Execute este SQL no Supabase Studio:
-- https://supabase.com/dashboard/project/cywbfcrtuawsgtbsjnnb/sql/new
-- ============================================================

-- 1. MÁQUINAS DE PRODUÇÃO
CREATE TABLE IF NOT EXISTS production_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'MANUTENCAO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE production_machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "production_machines_tenant_rls" ON production_machines;
CREATE POLICY "production_machines_tenant_rls" ON production_machines
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "production_machines_service_role" ON production_machines;
CREATE POLICY "production_machines_service_role" ON production_machines
    AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adicionar machine_id no order_items (se ainda não existir)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL;

-- 2. EQUIPES DE MANUSEIO
CREATE TABLE IF NOT EXISTS handling_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE handling_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handling_teams_tenant_rls" ON handling_teams;
CREATE POLICY "handling_teams_tenant_rls" ON handling_teams
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "handling_teams_service_role" ON handling_teams;
CREATE POLICY "handling_teams_service_role" ON handling_teams
    AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adicionar handling_team_id no order_items (se ainda não existir)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS handling_team_id UUID REFERENCES handling_teams(id) ON DELETE SET NULL;

-- 3. HISTÓRICO DE SETORES (para rastreio de tempo por máquina)
CREATE TABLE IF NOT EXISTS order_item_sector_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    sector VARCHAR(100) NOT NULL,
    machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL,
    entered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    exited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE order_item_sector_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sector_history_tenant_rls" ON order_item_sector_history;
CREATE POLICY "sector_history_tenant_rls" ON order_item_sector_history
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. ADICIONAR COLUNA position/sequence NA ORDER_STAGES SE NECESSÁRIO
-- (A tabela já tem 'sequence', mas o código fazia referência a 'position')
-- Nada a fazer — o código já foi corrigido para usar 'sequence'.

SELECT 'Migração de tabelas opcionais do Kanban concluída!' AS resultado;
