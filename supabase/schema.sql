-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. PROFILES (Users and roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    tenant_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Comercial', 'Produção', 'Financeiro')),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(18), -- CPF or CNPJ
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. ORDERS (Pedidos/Vendas)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    order_number SERIAL,
    pv_number VARCHAR(100), -- Pedido de Venda (Conta Azul)
    op_number VARCHAR(100), -- Ordem de Produção (Fábrica)
    art_name VARCHAR(255), -- Nome da arte / identificação visual
    seller_name VARCHAR(255) NOT NULL, -- Vendedora
    measure VARCHAR(100) NOT NULL, -- Medida
    print_run INTEGER NOT NULL DEFAULT 0, -- Tiragem
    boxes_count INTEGER NOT NULL DEFAULT 0, -- Quantidade de caixas/pacotes
    packaging_type VARCHAR(50) NOT NULL DEFAULT 'CAIXA' CHECK (packaging_type IN ('CAIXA', 'PACOTE')), -- Tipo de embalagem
    freight_value DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Frete
    shipping_type VARCHAR(50) NOT NULL DEFAULT 'RETIRADA' CHECK (shipping_type IN ('RETIRADA', 'ENTREGA_PROPRIA', 'TRANSPORTADORA')), -- Tipo de frete
    
    first_payment_date DATE, -- Data do primeiro pagamento
    installments_total INTEGER NOT NULL DEFAULT 1, -- Total de parcelas
    installments_paid INTEGER NOT NULL DEFAULT 0, -- Parcelas pagas
    production_start_date DATE, -- Data inicial da produção (liberada)
    over_short_quantity INTEGER NOT NULL DEFAULT 0, -- Diferença de tiragem (Cortesia / Falta)
    
    status VARCHAR(50) NOT NULL CHECK (
        status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado')
    ),
    production_sector VARCHAR(100) NOT NULL CHECK (
        production_sector IN ('Impressão', 'Corte e Vinco', 'Colagem', 'Manuseio', 'Expedição', 'Concluído', 'Estoque')
    ),
    physical_location VARCHAR(100), -- Localização física exata
    
    notes TEXT, -- Observação
    internal_notes TEXT, -- Anotações internas
    order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. STOCK TRANSACTIONS
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- positive = input, negative = output
    type VARCHAR(50) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'PEDIDO')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. FINANCIAL TRANSACTIONS (Reconciliação financeira básica)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('RECEITA', 'DESPESA')),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDENTE', 'CONCILIADO', 'CANCELADO')),
    description TEXT,
    due_date DATE NOT NULL,
    payment_date DATE,
    conta_azul_id VARCHAR(100), -- Integration ID
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. CONTA AZUL CONFIG (OAuth 2.0 Credentials per Tenant)
CREATE TABLE IF NOT EXISTS conta_azul_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. CONTA AZUL INTEGRATION LOGS
CREATE TABLE IF NOT EXISTS conta_azul_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- e.g., 'SYNC_CUSTOMER', 'OAUTH_REFRESH'
    status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'ERROR', 'PENDING_RETRY')),
    payload JSONB,
    response JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. SYNC QUEUE (Automatic background sync queue)
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('CUSTOMER', 'SUPPLIER', 'PRODUCT', 'ORDER', 'FINANCIAL')),
    entity_id UUID NOT NULL, -- Local database reference ID
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'FAILED', 'COMPLETED')),
    last_error TEXT,
    next_retry_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sector ON orders(production_sector);
CREATE INDEX IF NOT EXISTS idx_financial_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_retry ON sync_queue(status, next_retry_at);

-- Set up trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conta_azul_config_modtime
    BEFORE UPDATE ON conta_azul_config
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sync_queue_modtime
    BEFORE UPDATE ON sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- SEED DATA FOR DEMONSTRATION & MVP OPERATION
-- Insert Default Tenant
INSERT INTO companies (id, name, cnpj) 
VALUES ('d3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Samppel Embalagens Ltda', '12.345.678/0001-90')
ON CONFLICT (cnpj) DO NOTHING;

-- Insert Mock Customers
INSERT INTO customers (id, tenant_id, name, document, email, phone, address) VALUES
('c00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Chocolate Gourmet Brasil', '22.333.444/0001-55', 'contato@chocobrasil.com.br', '(11) 98765-4321', 'Av. Paulista, 1000 - São Paulo/SP'),
('c00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Cosméticos Florescer Ltda', '33.444.555/0001-66', 'suporte@florescer.com.br', '(21) 97654-3210', 'Rua das Flores, 45 - Rio de Janeiro/RJ'),
('c00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Boutique do Café Especial', '44.555.666/0001-77', 'financeiro@boutiquecafe.com', '(31) 3456-7890', 'Praça da Liberdade, 300 - Belo Horizonte/MG')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Suppliers
INSERT INTO suppliers (id, tenant_id, name, document, email, phone, address) VALUES
('500184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Papelaria Klabin Distribuidora', '11.111.111/0001-11', 'vendas@klabin.com.br', '(11) 3003-1234', 'Rodovia Dutra, Km 200 - Guarulhos/SP'),
('500284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Tintas Especiais Dupont', '22.222.222/0001-22', 'tintas@dupont.com', '(19) 3876-5432', 'Distrito Industrial - Campinas/SP')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Products
INSERT INTO products (id, tenant_id, name, sku, description, price, stock_quantity) VALUES
('800184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Caixa Kraft para Bombom (P)', 'KRAFT-BOM-P', 'Caixa em papel kraft para 6 bombons com berço', 2.50, 1500),
('800284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Sacola Duplex Branca Premium (M)', 'SAC-DUP-M', 'Sacola em papel duplex com alça de cordão', 4.80, 800),
('800384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Caixa Correio E-commerce (G)', 'CX-CORR-G', 'Caixa de papelão onda B para envios postais', 3.90, 2500)
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Orders (Pedidos)
INSERT INTO orders (id, tenant_id, customer_id, product_id, seller_name, measure, print_run, boxes_count, freight_value, status, production_sector, notes, internal_notes, order_date) VALUES
-- Order 1: A produzir, na Impressão
('a00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', '800184c8-3e4b-4b14-87cf-45ef42d17c01', 'Mariana Souza', '15x10x5 cm', 5000, 10, 150.00, 'A produzir', 'Impressão', 'Cliente solicitou pressa. Logo centralizada na tampa.', 'Confirmado pagamento da primeira parcela por boleto.', now() - interval '3 days'),
-- Order 2: Em revisão, no Corte e Vinco
('a00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00284c8-3e4b-4b14-87cf-45ef42d17c02', '800284c8-3e4b-4b14-87cf-45ef42d17c02', 'Camila Neves', '25x30x10 cm', 2000, 4, 80.00, 'Em revisão', 'Corte e Vinco', 'Acabamento com verniz localizado.', 'Aguardando aprovação do layout final de faca pelo cliente.', now() - interval '2 days'),
-- Order 3: Expedição, no setor de Expedição
('a00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', '800384c8-3e4b-4b14-87cf-45ef42d17c03', 'Mariana Souza', '30x20x15 cm', 1000, 2, 60.00, 'Expedição', 'Expedição', 'Coleta pela transportadora Braspress.', 'Nota fiscal já gerada e anexada ao pacote.', now() - interval '1 days'),
-- Order 4: Pago / Entregue, concluído
('a00484c8-3e4b-4b14-87cf-45ef42d17c04', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00184c8-3e4b-4b14-87cf-45ef42d17c01', '800284c8-3e4b-4b14-87cf-45ef42d17c02', 'Camila Neves', '20x20x8 cm', 3000, 6, 120.00, 'Pago', 'Concluído', 'Sem observações.', 'Entregue com sucesso no dia 15/06.', now() - interval '5 days'),
-- Order 5: Atrasado, na Colagem
('a00584c8-3e4b-4b14-87cf-45ef42d17c05', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'c00384c8-3e4b-4b14-87cf-45ef42d17c03', '800184c8-3e4b-4b14-87cf-45ef42d17c01', 'Mariana Souza', '15x10x5 cm', 10000, 20, 250.00, 'Atrasado', 'Colagem', 'Urgente! Atraso devido a problema na máquina coladeira.', 'Cliente cobrou posicionamento hoje cedo.', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Financial Transactions
INSERT INTO financial_transactions (id, tenant_id, order_id, type, amount, status, description, due_date, payment_date) VALUES
-- Revenue for Order 1 (Pendente)
('f00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'a00184c8-3e4b-4b14-87cf-45ef42d17c01', 'RECEITA', 12650.00, 'PENDENTE', 'Venda Chocolate Gourmet Brasil #1', CURRENT_DATE + 5, NULL),
-- Revenue for Order 3 (Conciliado)
('f00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'a00384c8-3e4b-4b14-87cf-45ef42d17c03', 'RECEITA', 3960.00, 'CONCILIADO', 'Venda Boutique do Café #3', CURRENT_DATE - 1, CURRENT_DATE - 1),
-- Revenue for Order 4 (Conciliado)
('f00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'a00484c8-3e4b-4b14-87cf-45ef42d17c04', 'RECEITA', 14520.00, 'CONCILIADO', 'Venda Chocolate Gourmet Brasil #4', CURRENT_DATE - 5, CURRENT_DATE - 5),
-- Expense (Despesa) for raw material
('f00484c8-3e4b-4b14-87cf-45ef42d17c04', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', NULL, 'DESPESA', 4500.00, 'CONCILIADO', 'Compra de Papel Kraft - Klabin', CURRENT_DATE - 2, CURRENT_DATE - 2),
-- Expense (Despesa) for tintas (Pendente)
('f00584c8-3e4b-4b14-87cf-45ef42d17c05', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', NULL, 'DESPESA', 1200.00, 'PENDENTE', 'Compra de Tintas Especiais - Dupont', CURRENT_DATE + 10, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Profiles
-- Set up pre-created mock profiles matching the roles for testing logins easily
-- We'll allow user auth table mock or manual logins inside the app using a mockup selection
-- so the demo can run without needing active user registration on first run
INSERT INTO profiles (id, tenant_id, full_name, role, email) VALUES
('e00184c8-3e4b-4b14-87cf-45ef42d17c01', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Ana Silva (Admin)', 'Administrador', 'admin@samppel.com.br'),
('e00284c8-3e4b-4b14-87cf-45ef42d17c02', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Mariana Souza (Vendas)', 'Comercial', 'comercial@samppel.com.br'),
('e00384c8-3e4b-4b14-87cf-45ef42d17c03', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Carlos Mendes (Fábrica)', 'Produção', 'producao@samppel.com.br'),
('e00484c8-3e4b-4b14-87cf-45ef42d17c04', 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 'Beatriz Lima (Financeiro)', 'Financeiro', 'financeiro@samppel.com.br')
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Integration Log
INSERT INTO conta_azul_integration_logs (id, tenant_id, action, status, payload, response) VALUES
(
  '100184c8-3e4b-4b14-87cf-45ef42d17c01', 
  'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 
  'OAUTH_REFRESH', 
  'SUCCESS', 
  '{"client_id": "test_client_id"}'::jsonb, 
  '{"message": "Token refreshed successfully", "expires_in": 3600}'::jsonb
);

-- Insert Mock Sync Queue Item
INSERT INTO sync_queue (id, tenant_id, entity_type, entity_id, action, retry_count, max_retries, status) VALUES
(
  '900184c8-3e4b-4b14-87cf-45ef42d17c01', 
  'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', 
  'ORDER', 
  'a00184c8-3e4b-4b14-87cf-45ef42d17c01', 
  'CREATE', 
  0, 
  5, 
  'PENDING'
);
