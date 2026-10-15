-- Migration: Unique constraint on clean customer document per tenant
-- Prevents duplicate customers with the same CPF or CNPJ regardless of formatting (dots, slashes, hyphens)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_clean_doc 
ON customers (tenant_id, regexp_replace(document, '\D', '', 'g')) 
WHERE document IS NOT NULL AND document != '';
