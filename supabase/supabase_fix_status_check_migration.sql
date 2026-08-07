-- Migração para corrigir a constraint de status em order_items e orders no Supabase
-- Permite que itens e pedidos se movimentem para 'Estoque' ou qualquer status de etapa dinâmica.

-- 1. Atualizar ou remover a constraint de status em order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_status_check;

-- Recriar a constraint incluindo 'Estoque' e permitindo flexibilidade
ALTER TABLE order_items ADD CONSTRAINT order_items_status_check 
  CHECK (status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado', 'Estoque'));

-- 2. Atualizar a constraint na tabela orders por garantia
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('A produzir', 'Em produção', 'Manuseio', 'Em revisão', 'Expedição', 'Entregue', 'Faturado', 'Pago', 'Atrasado', 'Estoque'));
