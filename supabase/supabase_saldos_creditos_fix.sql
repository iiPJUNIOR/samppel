-- =============================================================================
-- MIGRATION: Higienizacao de Saldos & Creditos (MOD-06 / MOD-08)
-- Rollback disponivel via backup_20261030_pre_saldos_cleanup/rollback_saldos_cleanup.mjs
-- =============================================================================

BEGIN;

-- 1. Corrigir CHECK constraint de action_taken em order_balance_adjustments para suportar PENDENCIA_ENTREGA
ALTER TABLE public.order_balance_adjustments
  DROP CONSTRAINT IF EXISTS order_balance_adjustments_action_taken_check;

ALTER TABLE public.order_balance_adjustments
  ADD CONSTRAINT order_balance_adjustments_action_taken_check
  CHECK ((action_taken)::text = ANY (ARRAY[
    'GUARDAR_ESTOQUE_CLIENTE'::text,
    'CREDITO_PROXIMO_PEDIDO'::text,
    'PENDENCIA_ENTREGA'::text,
    'CANCELADO_DESCONTO'::text,
    'COBRADO_ADICIONAL'::text,
    'REPRODUCAO_PENDENTE'::text,
    'OUTRO'::text
  ]));

-- 2. Remover os 4 registros clones duplicados de customer_stock_credits (preservando PV-1777)
DELETE FROM public.customer_stock_credits
WHERE id IN (
  'db0b5174-8022-4cfb-ad5c-57c42f18fec3',
  '3a9188bd-06bc-41cd-98d4-7acab219b35d',
  '0c77b50f-71ea-4e9a-87d1-781a9ee5c4fc',
  '50534502-9cde-46da-9d68-339afb02d0c5'
);

-- 3. Corrigir PV-1832 (EMPORIO BETHAVILLE): vincular saldo ao item real SACOLA PARDA (423 un) em vez do CLICHE (422 un)
UPDATE public.order_balance_adjustments
SET action_taken = 'CREDITO_PROXIMO_PEDIDO',
    notes = 'Registrado na consolidação da Expedição (SOBRA) - item real SACOLA PARDA (+423 un)'
WHERE id = 'eda73f2f-2a1c-417d-ad99-f98ac61475b1';

UPDATE public.customer_stock_credits
SET product_id = 'a76f3137-ed24-497f-95b9-d735b0e7df04',
    original_quantity = 423,
    remaining_quantity = 423,
    source_adjustment_id = 'eda73f2f-2a1c-417d-ad99-f98ac61475b1',
    notes = 'Sobra real do item SACOLA PARDA PERSONALIZADA (10.423 produzidas / 10.000 contratadas)',
    updated_at = now()
WHERE id = '0ee8ded3-a300-41ee-b99d-9eca9c84846d';

DELETE FROM public.order_balance_adjustments
WHERE id = 'cbb5a412-cc8e-4842-8fb4-781c565a7032';

-- 4. Protecao anti-duplicidade em nivel de banco por ajuste de origem
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_stock_credits_unique_source_adj
  ON public.customer_stock_credits (source_adjustment_id)
  WHERE source_adjustment_id IS NOT NULL;

COMMIT;
