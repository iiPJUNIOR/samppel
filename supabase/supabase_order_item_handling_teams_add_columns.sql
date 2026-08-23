ALTER TABLE public.order_item_handling_teams 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
