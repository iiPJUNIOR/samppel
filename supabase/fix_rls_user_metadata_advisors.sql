-- Correção para o aviso do Supabase Linter / Security Advisors:
-- "RLS references user metadata" nas tabelas de embalagem e setores de produção.
-- Substitui a leitura insegura de user_metadata pela consulta segura à tabela 'profiles'.

-- 1. Packaging Material Types
DROP POLICY IF EXISTS packaging_material_types_tenant_policy ON packaging_material_types;
CREATE POLICY packaging_material_types_tenant_policy ON packaging_material_types
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 2. Order Item Packaging
DROP POLICY IF EXISTS order_item_packaging_tenant_policy ON order_item_packaging;
CREATE POLICY order_item_packaging_tenant_policy ON order_item_packaging
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Packaging Settings
DROP POLICY IF EXISTS packaging_settings_tenant_policy ON packaging_settings;
CREATE POLICY packaging_settings_tenant_policy ON packaging_settings
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Production Sectors
DROP POLICY IF EXISTS production_sectors_tenant_policy ON production_sectors;
DROP POLICY IF EXISTS "Leitura de Setores por Tenant" ON production_sectors;
DROP POLICY IF EXISTS "Acesso por Tenant em Production Sectors" ON production_sectors;

CREATE POLICY "Acesso por Tenant em Production Sectors" ON production_sectors
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
