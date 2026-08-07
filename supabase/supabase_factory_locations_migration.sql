-- Migração para Tabela de Localizações Físicas na Fábrica

CREATE TABLE IF NOT EXISTS factory_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE factory_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de Localizacoes por Tenant" ON factory_locations;
CREATE POLICY "Leitura de Localizacoes por Tenant" ON factory_locations
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Localizacoes por Tenant" ON factory_locations;
CREATE POLICY "Modificacao de Localizacoes por Tenant" ON factory_locations
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Inserir localizações padrão iniciais para o Tenant Samppel
INSERT INTO factory_locations (tenant_id, name, status)
VALUES 
  ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Salão', 'ATIVO'),
  ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Pátio', 'ATIVO'),
  ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Máquina Flexo 1', 'ATIVO'),
  ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Máquina Coladeira 2', 'ATIVO'),
  ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Prateleira A1', 'ATIVO'),
  ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Depósito de Materiais', 'ATIVO')
ON CONFLICT DO NOTHING;
