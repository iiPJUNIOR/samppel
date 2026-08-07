-- Migração para Divisão de Equipes de Manuseio por Item (Múltiplas Equipes e Quantidades)

CREATE TABLE IF NOT EXISTS order_item_handling_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    handling_team_id UUID NOT NULL REFERENCES handling_teams(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE order_item_handling_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de Equipes de Item por Tenant" ON order_item_handling_teams;
CREATE POLICY "Leitura de Equipes de Item por Tenant" ON order_item_handling_teams
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Equipes de Item por Tenant" ON order_item_handling_teams;
CREATE POLICY "Modificacao de Equipes de Item por Tenant" ON order_item_handling_teams
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
