-- Migração para Adicionar Colunas de Saída, Retorno e Código de Manuseio
ALTER TABLE public.order_item_handling_teams 
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS return_date DATE,
ADD COLUMN IF NOT EXISTS return_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS handling_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Remover restrição de unicidade que impede múltiplos lançamentos para a mesma equipe
ALTER TABLE public.order_item_handling_teams 
DROP CONSTRAINT IF EXISTS order_item_handling_teams_order_item_id_handling_team_id_key;
