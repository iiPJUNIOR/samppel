-- 1. Criar tabela de histórico de transições de etapa
CREATE TABLE IF NOT EXISTS order_item_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL,
    to_stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL,
    changed_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Ativar RLS
ALTER TABLE order_item_stage_history ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Leitura de Historico por Tenant" ON order_item_stage_history;

-- 4. Criar política de Tenant RLS
CREATE POLICY "Leitura de Historico por Tenant" ON order_item_stage_history
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. Trigger do Postgres para gravação automática ao mudar stage_id no order_items
CREATE OR REPLACE FUNCTION trg_log_order_item_stage_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Só disparar se o stage_id foi alterado
    IF (OLD.stage_id IS DISTINCT FROM NEW.stage_id) THEN
        INSERT INTO order_item_stage_history (
            tenant_id,
            order_item_id,
            from_stage_id,
            to_stage_id,
            changed_by_profile_id,
            changed_at
        ) VALUES (
            NEW.tenant_id,
            NEW.id,
            OLD.stage_id,
            NEW.stage_id,
            current_user_id,
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar trigger antigo se existir
DROP TRIGGER IF EXISTS trg_order_items_stage_change ON order_items;

CREATE TRIGGER trg_order_items_stage_change
    AFTER UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_log_order_item_stage_change();

-- 6. Retroalimentar o histórico com dados existentes (se houver stage_id, criar entrada inicial)
INSERT INTO order_item_stage_history (tenant_id, order_item_id, to_stage_id, changed_at)
SELECT tenant_id, id, stage_id, created_at
FROM order_items
WHERE stage_id IS NOT NULL
ON CONFLICT DO NOTHING;

SELECT 'Migração de histórico de etapas concluída com sucesso!' AS resultado;
