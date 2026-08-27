-- Migração para remover a constraint de status nas tabelas order_items e orders.
-- Como o sistema permite criar etapas customizadas no Kanban, a validação no banco
-- restringe as nomenclaturas e impede a movimentação de cards para novas etapas.

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
