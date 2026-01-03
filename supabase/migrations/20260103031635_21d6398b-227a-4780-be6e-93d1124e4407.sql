-- Table to track monthly platform commissions for each business
CREATE TABLE public.platform_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2025-01" for January 2025
  total_sales NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0, -- 7% of total_sales
  commission_rate NUMERIC NOT NULL DEFAULT 0.07, -- 7%
  status TEXT NOT NULL DEFAULT 'pending', -- pending, awaiting_confirmation, paid
  receipt_url TEXT,
  receipt_uploaded_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  confirmed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, month_year)
);

-- Add platform terms acceptance to business_profiles
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS accepted_platform_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_platform_terms_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- Business owners can view their own commissions
CREATE POLICY "Business owners can view their commissions"
ON public.platform_commissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = platform_commissions.business_id
    AND business_profiles.user_id = auth.uid()
  )
);

-- Business owners can update their commissions (for uploading receipt)
CREATE POLICY "Business owners can update their commissions"
ON public.platform_commissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE business_profiles.id = platform_commissions.business_id
    AND business_profiles.user_id = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all commissions"
ON public.platform_commissions
FOR ALL
USING (is_admin(auth.uid()));

-- System can insert commissions (triggered by orders)
CREATE POLICY "System can insert commissions"
ON public.platform_commissions
FOR INSERT
WITH CHECK (true);

-- Function to update commission when order is completed
CREATE OR REPLACE FUNCTION public.update_platform_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month TEXT;
  order_total NUMERIC;
BEGIN
  -- Only process when order status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    current_month := TO_CHAR(NEW.created_at, 'YYYY-MM');
    order_total := NEW.total;
    
    -- Insert or update the commission record for this month
    INSERT INTO public.platform_commissions (business_id, month_year, total_sales, commission_amount)
    VALUES (NEW.business_id, current_month, order_total, order_total * 0.07)
    ON CONFLICT (business_id, month_year)
    DO UPDATE SET
      total_sales = platform_commissions.total_sales + order_total,
      commission_amount = (platform_commissions.total_sales + order_total) * 0.07,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update commission on order delivery
CREATE TRIGGER on_order_delivered_update_commission
AFTER UPDATE ON public.business_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_commission();

-- Also trigger on insert for delivered orders
CREATE TRIGGER on_order_insert_update_commission
AFTER INSERT ON public.business_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_commission();

-- Enable realtime for commissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_commissions;