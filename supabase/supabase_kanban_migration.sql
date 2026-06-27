-- Migração de Banco de Dados para Painel Kanban e Permissões de Etapas

-- 1. Tabela de Etapas de Produção (Colunas do Kanban)
CREATE TABLE IF NOT EXISTS order_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3b82f6',
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de Permissões de Etapa por Perfil de Usuário
CREATE TABLE IF NOT EXISTS profile_stage_permissions (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES order_stages(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, stage_id)
);

-- 3. Adicionar coluna de Etapa Atual na tabela de Pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL;

-- 4. Habilitar Row Level Security (RLS) nas novas tabelas
ALTER TABLE order_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_stage_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Limpar políticas antigas (evitar erros de duplicação)
DROP POLICY IF EXISTS "Leitura de Etapas por Tenant" ON order_stages;
DROP POLICY IF EXISTS "Modificacao de Etapas por Admin" ON order_stages;
DROP POLICY IF EXISTS "Leitura de Permissoes por Tenant" ON profile_stage_permissions;
DROP POLICY IF EXISTS "Modificacao de Permissoes por Admin" ON profile_stage_permissions;

-- 6. Criar políticas RLS para Etapas de Produção
CREATE POLICY "Leitura de Etapas por Tenant" ON order_stages
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Modificacao de Etapas por Admin" ON order_stages
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'Administrador'))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'Administrador'));

-- 7. Criar políticas RLS para Permissões de Etapa
CREATE POLICY "Leitura de Permissoes por Tenant" ON profile_stage_permissions
    FOR SELECT TO authenticated
    USING (profile_id IN (SELECT id FROM profiles WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Modificacao de Permissoes por Admin" ON profile_stage_permissions
    FOR ALL TO authenticated
    USING (profile_id IN (SELECT id FROM profiles WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'Administrador')));

-- 8. Inserir etapas padrão iniciais para o Tenant Samppel
INSERT INTO order_stages (id, tenant_id, name, color, sequence)
VALUES 
  ('e00184c8-3e4b-4b14-87cf-45ef42d17001', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'A produzir', '#94a3b8', 1),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17002', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Em produção', '#3b82f6', 2),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17003', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Manuseio', '#a855f7', 3),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17004', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Em revisão', '#eab308', 4),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17005', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Expedição', '#f97316', 5),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17006', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Concluído', '#10b981', 6),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17007', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Estoque', '#14b8a6', 7),
  ('e00184c8-3e4b-4b14-87cf-45ef42d17008', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Atrasado', '#ef4444', 8)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  sequence = EXCLUDED.sequence;

-- 9. Mapear e migrar os pedidos existentes para as novas etapas
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17001' WHERE status = 'A produzir' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17002' WHERE status = 'Em produção' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17003' WHERE status = 'Manuseio' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17004' WHERE status = 'Em revisão' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17005' WHERE status = 'Expedição' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17006' WHERE status IN ('Entregue', 'Faturado', 'Pago') AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17007' WHERE status = 'Estoque' AND stage_id IS NULL;
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17008' WHERE status = 'Atrasado' AND stage_id IS NULL;

-- Fallback para garantir que todos os registros possuam etapa
UPDATE orders SET stage_id = 'e00184c8-3e4b-4b14-87cf-45ef42d17001' WHERE stage_id IS NULL;
