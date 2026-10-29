-- Habilitar leitura de perfis para usuarios do mesmo Tenant
-- Permite que o historico de movimentacoes (stage e sector history) exiba o nome e cargo de quem realizou a acao

CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Leitura de Perfis do Mesmo Tenant" ON profiles;
CREATE POLICY "Leitura de Perfis do Mesmo Tenant"
ON profiles FOR SELECT TO authenticated
USING (tenant_id = get_auth_tenant_id());
