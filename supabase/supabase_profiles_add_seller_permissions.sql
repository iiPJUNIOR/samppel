-- Migration para adicionar colunas de vínculo e permissões de vendedores na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_seller_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_access_mode TEXT DEFAULT 'OWN';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowed_sellers JSONB DEFAULT '[]'::jsonb;
