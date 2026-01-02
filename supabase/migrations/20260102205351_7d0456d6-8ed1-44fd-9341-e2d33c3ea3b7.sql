-- Create coupons table for business stores
CREATE TABLE public.business_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, code)
);

-- Enable RLS
ALTER TABLE public.business_coupons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Coupons are viewable by everyone" 
ON public.business_coupons 
FOR SELECT 
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Business owners can view all their coupons" 
ON public.business_coupons 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM business_profiles 
  WHERE business_profiles.id = business_coupons.business_id 
  AND business_profiles.user_id = auth.uid()
));

CREATE POLICY "Business owners can create coupons" 
ON public.business_coupons 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM business_profiles 
  WHERE business_profiles.id = business_coupons.business_id 
  AND business_profiles.user_id = auth.uid()
));

CREATE POLICY "Business owners can update their coupons" 
ON public.business_coupons 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM business_profiles 
  WHERE business_profiles.id = business_coupons.business_id 
  AND business_profiles.user_id = auth.uid()
));

CREATE POLICY "Business owners can delete their coupons" 
ON public.business_coupons 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM business_profiles 
  WHERE business_profiles.id = business_coupons.business_id 
  AND business_profiles.user_id = auth.uid()
));

-- Add coupon_id and discount to orders
ALTER TABLE public.business_orders 
ADD COLUMN coupon_id UUID REFERENCES public.business_coupons(id),
ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- Create trigger for updated_at
CREATE TRIGGER update_business_coupons_updated_at
BEFORE UPDATE ON public.business_coupons
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create coupon usage table to track per-user usage
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.business_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.business_orders(id),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- Enable RLS
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Policies for coupon usage
CREATE POLICY "Users can view their own coupon usage" 
ON public.coupon_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create coupon usage" 
ON public.coupon_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);