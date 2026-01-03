-- Add detailed address fields to business_orders
ALTER TABLE public.business_orders 
ADD COLUMN IF NOT EXISTS delivery_street text,
ADD COLUMN IF NOT EXISTS delivery_number text,
ADD COLUMN IF NOT EXISTS delivery_reference text;