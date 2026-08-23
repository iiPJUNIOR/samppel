-- Tabela de Registros de Faltas/Avarias no Manuseio e Produção
CREATE TABLE IF NOT EXISTS order_item_shortages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  shortage_quantity INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL, -- 'MANUSEIO_AVARIA', 'PRODUCAO_DEFECT', 'EXTRAVIO', 'DEFEITO_MATERIAL'
  notes TEXT,
  reported_by_operator_id UUID,
  reported_by_name VARCHAR(150),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'PENDENTE_EXPEDICAO', -- 'PENDENTE_EXPEDICAO', 'RESOLVIDO'
  resolution_type VARCHAR(50), -- 'DESCONTO_FATURA', 'REPOSICAO', 'ACEITE_PARCIAL'
  resolution_notes TEXT,
  resolved_by_operator_id UUID,
  resolved_by_name VARCHAR(150),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_order_id ON order_item_shortages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_order_item_id ON order_item_shortages(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_status ON order_item_shortages(status);
