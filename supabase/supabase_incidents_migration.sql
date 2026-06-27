-- Migração para Rastreamento de Incidentes Operacionais, de Transporte e Financeiros

-- 1. TABELA DE INCIDENTES (order_incidents)
CREATE TABLE IF NOT EXISTS order_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL, -- Opcional, vincula a um card específico
    
    category VARCHAR(50) NOT NULL CHECK (category IN ('PRODUCAO', 'TRANSPORTE', 'FINANCEIRO', 'CLIENTE', 'MANUSEIO', 'OUTRO')),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'EM_ANALISE', 'RESOLVIDO')),
    
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Usuário que abriu
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Usuário que resolveu
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_order_incidents_tenant ON order_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_incidents_order ON order_incidents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_incidents_item ON order_incidents(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_incidents_status ON order_incidents(status);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE order_incidents ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (Seguindo o padrão de inquilinos da aplicação)
DROP POLICY IF EXISTS "Leitura de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Leitura de Incidentes por Tenant" ON order_incidents
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insercao de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Insercao de Incidentes por Tenant" ON order_incidents
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Modificacao de Incidentes por Tenant" ON order_incidents
    FOR UPDATE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Remocao de Incidentes por Tenant" ON order_incidents;
CREATE POLICY "Remocao de Incidentes por Tenant" ON order_incidents
    FOR DELETE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. TRIGGER DE MODTIME (UPDATED_AT)
DROP TRIGGER IF EXISTS update_order_incidents_modtime ON order_incidents;
CREATE TRIGGER update_order_incidents_modtime
    BEFORE UPDATE ON order_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
