-- Migração para Expansão de Papéis de Usuários (Profiles.role)

-- 1. Remover a restrição check existente de role na tabela profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Adicionar a nova restrição expandida para incluir Estoque e Expedição
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (
    role IN ('Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição')
);
