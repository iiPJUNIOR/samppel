-- Migration: Adiciona colunas de carteira e permissões de vendedor na tabela public.profiles
-- Data: 2026-11-09

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_seller_name text,
  ADD COLUMN IF NOT EXISTS seller_access_mode text DEFAULT 'OWN',
  ADD COLUMN IF NOT EXISTS allowed_sellers text[] DEFAULT '{}'::text[];

UPDATE public.profiles
SET
  primary_seller_name = COALESCE(NULLIF(TRIM(primary_seller_name), ''), TRIM(full_name)),
  seller_access_mode = COALESCE(NULLIF(TRIM(seller_access_mode), ''), 'OWN'),
  allowed_sellers = CASE
    WHEN allowed_sellers IS NULL OR array_length(allowed_sellers, 1) IS NULL THEN ARRAY[TRIM(full_name)]
    ELSE allowed_sellers
  END
WHERE role IN ('Vendedor', 'Comercial')
  AND (primary_seller_name IS NULL OR seller_access_mode IS NULL);

