-- Migração para Rastreabilidade de Estoque Personalizado de Clientes, Sobras/Faltas e Créditos

-- 1. TABELA DE ESTOQUE PERSONALIZADO (customer_product_stock)
CREATE TABLE IF NOT EXISTS customer_product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE (customer_id, product_id)
);

-- 2. TABELA DE AJUSTES DE SALDO DE PEDIDOS (order_balance_adjustments)
CREATE TABLE IF NOT EXISTS order_balance_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    ordered_quantity INTEGER NOT NULL CHECK (ordered_quantity >= 0),
    produced_quantity INTEGER NOT NULL CHECK (produced_quantity >= 0),
    difference_quantity INTEGER NOT NULL, -- positive = sobra, negative = falta (produced - ordered)
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('SOBRA', 'FALTA')),
    action_taken VARCHAR(50) NOT NULL CHECK (action_taken IN (
        'GUARDAR_ESTOQUE_CLIENTE', 
        'CREDITO_PROXIMO_PEDIDO', 
        'CANCELADO_DESCONTO', 
        'COBRADO_ADICIONAL', 
        'REPRODUCAO_PENDENTE', 
        'OUTRO'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. TABELA DE CRÉDITOS E PENDÊNCIAS DE CLIENTES (customer_stock_credits)
CREATE TABLE IF NOT EXISTS customer_stock_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN ('CORTESIA_SOBRA', 'PENDENCIA_ENTREGA')),
    original_quantity INTEGER NOT NULL CHECK (original_quantity >= 0),
    remaining_quantity INTEGER NOT NULL DEFAULT 0 CHECK (remaining_quantity >= 0),
    source_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    source_adjustment_id UUID REFERENCES order_balance_adjustments(id) ON DELETE SET NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'UTILIZADO', 'EXPIRADO', 'CANCELADO')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cust_prod_stock_tenant ON customer_product_stock(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cust_prod_stock_cust_prod ON customer_product_stock(customer_id, product_id);

CREATE INDEX IF NOT EXISTS idx_order_bal_adj_tenant ON order_balance_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_bal_adj_order ON order_balance_adjustments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_bal_adj_item ON order_balance_adjustments(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_bal_adj_cust ON order_balance_adjustments(customer_id);

CREATE INDEX IF NOT EXISTS idx_cust_stock_cred_tenant ON customer_stock_credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cust_stock_cred_cust ON customer_stock_credits(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_stock_cred_status ON customer_stock_credits(status);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE customer_product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_balance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_stock_credits ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA customer_product_stock
DROP POLICY IF EXISTS "Leitura de Estoque Personalizado por Tenant" ON customer_product_stock;
CREATE POLICY "Leitura de Estoque Personalizado por Tenant" ON customer_product_stock
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Estoque Personalizado por Tenant" ON customer_product_stock;
CREATE POLICY "Modificacao de Estoque Personalizado por Tenant" ON customer_product_stock
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. POLÍTICAS RLS PARA order_balance_adjustments
DROP POLICY IF EXISTS "Leitura de Ajustes por Tenant" ON order_balance_adjustments;
CREATE POLICY "Leitura de Ajustes por Tenant" ON order_balance_adjustments
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Insercao de Ajustes por Tenant" ON order_balance_adjustments;
CREATE POLICY "Insercao de Ajustes por Tenant" ON order_balance_adjustments
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 8. POLÍTICAS RLS PARA customer_stock_credits
DROP POLICY IF EXISTS "Leitura de Creditos por Tenant" ON customer_stock_credits;
CREATE POLICY "Leitura de Creditos por Tenant" ON customer_stock_credits
    FOR SELECT TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Modificacao de Creditos por Tenant" ON customer_stock_credits;
CREATE POLICY "Modificacao de Creditos por Tenant" ON customer_stock_credits
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 9. TRIGGERS DE MODTIME (UPDATED_AT)
DROP TRIGGER IF EXISTS update_cust_prod_stock_modtime ON customer_product_stock;
CREATE TRIGGER update_cust_prod_stock_modtime
    BEFORE UPDATE ON customer_product_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_cust_stock_cred_modtime ON customer_stock_credits;
CREATE TRIGGER update_cust_stock_cred_modtime
    BEFORE UPDATE ON customer_stock_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
