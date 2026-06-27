-- Migração para Expansão dos Tipos de Frete (shipping_type)

-- 1. Remover a restrição check de shipping_type existente
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_type_check;

-- 2. Adicionar a nova restrição expandida para incluir novos canais e transportadoras expressas
ALTER TABLE orders ADD CONSTRAINT orders_shipping_type_check CHECK (
    shipping_type IN ('RETIRADA', 'ENTREGA_PROPRIA', 'TRANSPORTADORA', 'LALAMOVE', 'MOTOBOY', 'TRANSPORTADORA_LONGA')
);
