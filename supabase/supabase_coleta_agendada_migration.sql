-- Migração para adicionar campos de Coleta Agendada na tabela orders:
-- invoice_number (Número da Nota Fiscal)
-- pickup_number (Número da Coleta / Código)
-- freight_quotation (Número ou valor da Cotação)
-- scheduled_date (Data de Agendamento da Coleta)
-- carrier_name (Nome da Transportadora)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS freight_quotation VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(150);
