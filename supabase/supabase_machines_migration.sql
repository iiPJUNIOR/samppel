-- Migração para Rastreamento de Máquinas e Tempos por Setor (auditoria)

-- 1. Criar Tabela de Máquinas de Produção
CREATE TABLE IF NOT EXISTS production_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL, -- Impressão, Corte e Vinco, Colagem, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'MANUTENCAO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Criar Tabela de Histórico de Setores de Produção
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

-- 3. Habilitar RLS nas tabelas
ALTER TABLE production_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_sector_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS padrão por tenant_id
CREATE POLICY production_machines_tenant_policy ON production_machines
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

CREATE POLICY order_item_sector_history_tenant_policy ON order_item_sector_history
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

-- 5. Adicionar coluna machine_id na tabela order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES production_machines(id) ON DELETE SET NULL;
