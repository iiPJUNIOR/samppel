-- Migração para adicionar campos de Coleta Agendada na tabela orders:
-- invoice_number (Número da Nota Fiscal)
-- pickup_number (Número da Coleta / Código)
-- freight_quotation (Número ou valor da Cotação)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS freight_quotation VARCHAR(100);
