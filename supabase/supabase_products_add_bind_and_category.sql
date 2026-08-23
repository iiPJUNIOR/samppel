-- Migration para adicionar colunas faltantes na tabela products se necessário
ALTER TABLE products ADD COLUMN IF NOT EXISTS bind_to_first_item BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'LISAS';
