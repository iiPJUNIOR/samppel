-- Tabela de Registros de Faltas/Avarias no Manuseio e Produção
CREATE TABLE IF NOT EXISTS public.order_item_shortages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'::uuid,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_tenant_id ON public.order_item_shortages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_order_id ON public.order_item_shortages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_order_item_id ON public.order_item_shortages(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_shortages_status ON public.order_item_shortages(status);

ALTER TABLE public.order_item_shortages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_item_shortages'
      AND policyname = 'Enable all access for authenticated and anon users on order_item_shortages'
  ) THEN
    CREATE POLICY "Enable all access for authenticated and anon users on order_item_shortages"
      ON public.order_item_shortages
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
