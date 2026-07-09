-- Migração de Banco de Dados para Itens de Pedido no Kanban de Produção

-- 1. TABELA DE ITENS DE PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Permite nulo para serviços avulsos (refile, cartão de fundo, etc.)
    
    item_type VARCHAR(50) NOT NULL DEFAULT 'PRODUTO' CHECK (item_type IN ('PRODUTO', 'SERVICO')),
    name VARCHAR(255) NOT NULL, -- Nome do item (ex: "Caixa Kraft", "Serviço de Refile")
    item_index INTEGER NOT NULL, -- Índice sequencial gerado por Trigger (1, 2, 3...)
    friendly_id VARCHAR(150), -- Código amigável gerado por Trigger (ex: "PV-1001/1")
    
    measure VARCHAR(100), -- Medida
    print_run INTEGER NOT NULL DEFAULT 0, -- Tiragem
    boxes_count INTEGER NOT NULL DEFAULT 0, -- Quantidade de caixas/pacotes
    packaging_type VARCHAR(50) NOT NULL DEFAULT 'CAIXA' CHECK (packaging_type IN ('CAIXA', 'PACOTE')),
    over_short_quantity INTEGER NOT NULL DEFAULT 0, -- Sobra/Falta de tiragem
    
    status VARCHAR(50) NOT NULL DEFAULT 'A produzir' CHECK (
        status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado', 'Estoque')
    ),
    production_sector VARCHAR(100) NOT NULL DEFAULT 'Impressão' CHECK (
        production_sector IN ('Impressão', 'Corte e Vinco', 'Colagem', 'Manuseio', 'Expedição', 'Concluído', 'Estoque')
    ),
    stage_id UUID REFERENCES order_stages(id) ON DELETE SET NULL, -- Etapa do Kanban
    physical_location VARCHAR(100), -- Localização física do item
    
    notes TEXT, -- Observações específicas do item
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_stage ON order_items(stage_id);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (Seguindo o padrão de inquilinos da aplicação)
DROP POLICY IF EXISTS "Leitura de Itens por Tenant" ON order_items;
CREATE POLICY "Leitura de Itens por Tenant" ON order_items
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insercao de Itens por Tenant" ON order_items;
CREATE POLICY "Insercao de Itens por Tenant" ON order_items
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Itens por Tenant" ON order_items;
CREATE POLICY "Modificacao de Itens por Tenant" ON order_items
    FOR UPDATE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Remocao de Itens por Tenant" ON order_items;
CREATE POLICY "Remocao de Itens por Tenant" ON order_items
    FOR DELETE TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. TRIGGER DE MODTIME (UPDATED_AT)
DROP TRIGGER IF EXISTS update_order_items_modtime ON order_items;
CREATE TRIGGER update_order_items_modtime
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 6. TRIGGERS PARA CALCULAR ITEM_INDEX E FRIENDLY_ID AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION trg_set_order_item_details()
RETURNS TRIGGER AS $$
DECLARE
    next_idx INTEGER;
    parent_pv VARCHAR;
    parent_num INTEGER;
BEGIN
    -- Encontrar o próximo índice sequencial para o mesmo pedido
    SELECT COALESCE(MAX(item_index), 0) + 1
    INTO next_idx
    FROM order_items
    WHERE order_id = NEW.order_id;
    
    NEW.item_index := next_idx;
    
    -- Encontrar o número ou código PV do pedido pai
    SELECT pv_number, order_number
    INTO parent_pv, parent_num
    FROM orders
    WHERE id = NEW.order_id;
    
    -- Formar o friendly_id
    NEW.friendly_id := COALESCE(parent_pv, 'PV-' || parent_num) || '/' || next_idx;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_items_before_insert ON order_items;
CREATE TRIGGER order_items_before_insert
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_order_item_details();

-- 7. TRIGGER PARA ATUALIZAR FRIENDLY_ID QUANDO O PEDIDO PAI ALTERAR O CODIGO PV
CREATE OR REPLACE FUNCTION trg_update_order_items_friendly_id()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.pv_number IS DISTINCT FROM NEW.pv_number) OR (OLD.order_number IS DISTINCT FROM NEW.order_number) THEN
        UPDATE order_items
        SET friendly_id = COALESCE(NEW.pv_number, 'PV-' || NEW.order_number) || '/' || item_index
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_after_update_pv ON orders;
CREATE TRIGGER orders_after_update_pv
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_order_items_friendly_id();
