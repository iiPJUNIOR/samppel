-- Script de politicas de Row Level Security (RLS) para o Supabase
-- Copie e execute este script no editor SQL do seu painel do Supabase.

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conta_azul_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conta_azul_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- 2. Limpar politicas antigas (evitar erros de duplicacao)
DROP POLICY IF EXISTS "Leitura de Companies" ON companies;
DROP POLICY IF EXISTS "Acesso proprio perfil em Profiles" ON profiles;
DROP POLICY IF EXISTS "Insercao de perfil proprio em Profiles" ON profiles;
DROP POLICY IF EXISTS "Acesso por Tenant em Customers" ON customers;
DROP POLICY IF EXISTS "Acesso por Tenant em Suppliers" ON suppliers;
DROP POLICY IF EXISTS "Acesso por Tenant em Products" ON products;
DROP POLICY IF EXISTS "Acesso por Tenant em Orders" ON orders;
DROP POLICY IF EXISTS "Acesso por Tenant em Stock Transactions" ON stock_transactions;
DROP POLICY IF EXISTS "Acesso por Tenant em Financial Transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Acesso por Tenant em Conta Azul Config" ON conta_azul_config;
DROP POLICY IF EXISTS "Acesso por Tenant em Integration Logs" ON conta_azul_integration_logs;
DROP POLICY IF EXISTS "Acesso por Tenant em Sync Queue" ON sync_queue;

-- 3. Definir novas politicas baseadas em autenticacao e Tenant ID

-- Companies: permite que qualquer usuario autenticado veja a empresa vinculada ao seu perfil
CREATE POLICY "Leitura de Companies" 
ON companies FOR SELECT TO authenticated
USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Profiles: permite que o usuario leia e atualize o proprio perfil
CREATE POLICY "Acesso proprio perfil em Profiles"
ON profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Customers: acesso apenas de clientes vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Customers"
ON customers FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Suppliers: acesso apenas de fornecedores vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Suppliers"
ON suppliers FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Products: acesso apenas de produtos vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Products"
ON products FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Orders: acesso apenas de pedidos vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Orders"
ON orders FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Stock Transactions: acesso apenas de movimentacoes vinculadas ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Stock Transactions"
ON stock_transactions FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Financial Transactions: acesso apenas de transacoes vinculadas ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Financial Transactions"
ON financial_transactions FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Conta Azul Config: acesso apenas de configuracoes vinculadas ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Conta Azul Config"
ON conta_azul_config FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Integration Logs: acesso apenas de logs vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Integration Logs"
ON conta_azul_integration_logs FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Sync Queue: acesso apenas de itens de fila vinculados ao tenant do usuario logado
CREATE POLICY "Acesso por Tenant em Sync Queue"
ON sync_queue FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Trigger de criacao automatica de perfis para novos usuarios do auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name, role, email)
  VALUES (
    new.id,
    'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0', -- ID padrao da empresa Samppel
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário Novo'),
    coalesce(new.raw_user_meta_data->>'role', 'Comercial'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para rodar apos insercao em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
