-- Migração para Gerenciamento de Equipes de Manuseio no Kanban

-- 1. Criar Tabela de Equipes de Manuseio
CREATE TABLE IF NOT EXISTS handling_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Habilitar RLS e criar política de segurança
ALTER TABLE handling_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY handling_teams_tenant_policy ON handling_teams
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

-- 3. Adicionar coluna handling_team_id na tabela order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS handling_team_id UUID REFERENCES handling_teams(id) ON DELETE SET NULL;
