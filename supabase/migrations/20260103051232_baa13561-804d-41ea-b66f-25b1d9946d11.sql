-- Add reference_month to commission_payments for better organization
ALTER TABLE public.commission_payments 
ADD COLUMN IF NOT EXISTS reference_month TEXT;

-- Add receipt timestamp to commission_payments for receipt history tracking
ALTER TABLE public.commission_payments 
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries by month
CREATE INDEX IF NOT EXISTS idx_commission_payments_business_month 
ON public.commission_payments(business_id, reference_month);

-- Create index for faster queries on platform_commissions
CREATE INDEX IF NOT EXISTS idx_platform_commissions_business_month 
ON public.platform_commissions(business_id, month_year);

-- Create a receipts table to store ALL receipts sent by merchants (never overwritten)
CREATE TABLE IF NOT EXISTS public.commission_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  receipt_url TEXT NOT NULL,
  reference_month TEXT,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  rejection_reason TEXT,
  amount_claimed NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for commission_receipts
CREATE POLICY "Business owners can upload receipts"
ON public.commission_receipts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE id = business_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can view their receipts"
ON public.commission_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE id = business_id AND user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Admins can update receipts"
ON public.commission_receipts
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete receipts"
ON public.commission_receipts
FOR DELETE
USING (is_admin(auth.uid()));

-- Enable realtime for commission_receipts
ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_receipts;

-- Create a view for monthly business report
CREATE OR REPLACE VIEW public.business_monthly_summary AS
SELECT 
  bp.id as business_id,
  bp.business_name,
  bp.slug,
  bp.logo_url,
  pc.month_year,
  pc.total_sales,
  pc.commission_amount,
  pc.status as commission_status,
  COALESCE(
    (SELECT SUM(cp.amount) FROM public.commission_payments cp 
     WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL 
     AND (cp.reference_month = pc.month_year OR cp.reference_month IS NULL)),
    0
  ) as paid_for_month,
  (SELECT COUNT(*) FROM public.commission_receipts cr 
   WHERE cr.business_id = bp.id AND cr.reference_month = pc.month_year) as receipts_count
FROM public.business_profiles bp
JOIN public.platform_commissions pc ON pc.business_id = bp.id
WHERE bp.is_active = true
ORDER BY bp.business_name, pc.month_year DESC;

-- Grant access to authenticated users
GRANT SELECT ON public.business_monthly_summary TO authenticated;