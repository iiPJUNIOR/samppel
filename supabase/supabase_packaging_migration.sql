-- Migração: Tela de Embalagem — Tipos de Material e Volumes por Item de Pedido

-- 1. Tipos de material de embalagem configuráveis pelo Administrador
CREATE TABLE IF NOT EXISTS packaging_material_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(50) NOT NULL DEFAULT 'OUTRO' CHECK (category IN ('CAIXA', 'FUNDO', 'DIVISORIA', 'SACO', 'OUTRO')),
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Volumes de embalagem registrados por item de pedido
CREATE TABLE IF NOT EXISTS order_item_packaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    volume_index INTEGER NOT NULL DEFAULT 1,
    units_per_box INTEGER NOT NULL DEFAULT 0,
    box_count INTEGER NOT NULL DEFAULT 1,
    weight_kg NUMERIC(8,3),
    length_cm NUMERIC(8,2),
    width_cm NUMERIC(8,2),
    height_cm NUMERIC(8,2),
    packaging_material_type_id UUID REFERENCES packaging_material_types(id) ON DELETE SET NULL,
    associated_order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    notes TEXT,
    registered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Configurações de Embalagem por Inquilino (Tenant)
CREATE TABLE IF NOT EXISTS packaging_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    keywords TEXT NOT NULL DEFAULT 'caixa,fundo,divisoria,saco,embalagem,pacote',
    association_rule VARCHAR(100) NOT NULL DEFAULT 'FIRST_ITEM' CHECK (association_rule IN ('FIRST_ITEM', 'LARGEST_QUANTITY', 'MANUAL')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Habilitar RLS
ALTER TABLE packaging_material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_settings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS por tenant
CREATE POLICY packaging_material_types_tenant_policy ON packaging_material_types
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

CREATE POLICY order_item_packaging_tenant_policy ON order_item_packaging
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

CREATE POLICY packaging_settings_tenant_policy ON packaging_settings
    FOR ALL USING (tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'::uuid);

-- 6. Trigger de data de modificação para as novas tabelas
CREATE TRIGGER update_packaging_material_types_modtime
    BEFORE UPDATE ON packaging_material_types
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_order_item_packaging_modtime
    BEFORE UPDATE ON order_item_packaging
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_packaging_settings_modtime
    BEFORE UPDATE ON packaging_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

