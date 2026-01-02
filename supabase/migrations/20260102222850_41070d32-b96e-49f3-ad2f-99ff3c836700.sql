-- Add PIX configuration and delivery zones to business_profiles
ALTER TABLE business_profiles 
  ADD COLUMN IF NOT EXISTS pix_key TEXT,
  ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS pix_holder_name TEXT;

-- Create delivery zones table for per-neighborhood pricing
CREATE TABLE IF NOT EXISTS business_delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Timbó',
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, neighborhood, city)
);

-- Enable RLS
ALTER TABLE business_delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage their delivery zones" 
ON business_delivery_zones 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM business_profiles 
  WHERE id = business_delivery_zones.business_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Delivery zones are viewable by everyone" 
ON business_delivery_zones 
FOR SELECT 
USING (is_active = true);

-- Add payment method to orders
ALTER TABLE business_orders 
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pix_code TEXT,
  ADD COLUMN IF NOT EXISTS customer_neighborhood TEXT;