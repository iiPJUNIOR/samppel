-- Migração para Tabela de Volumes de Expedição Consolidados por Pedido (Opção A)

CREATE TABLE IF NOT EXISTS order_shipping_volumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    volume_number INTEGER NOT NULL DEFAULT 1,
    weight_kg DECIMAL(10,3),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    length_cm DECIMAL(10,2),
    packaging_type_id UUID REFERENCES packaging_material_types(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE order_shipping_volumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de Volumes de Expedicao por Tenant" ON order_shipping_volumes;
CREATE POLICY "Leitura de Volumes de Expedicao por Tenant" ON order_shipping_volumes
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Volumes de Expedicao por Tenant" ON order_shipping_volumes;
CREATE POLICY "Modificacao de Volumes de Expedicao por Tenant" ON order_shipping_volumes
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
