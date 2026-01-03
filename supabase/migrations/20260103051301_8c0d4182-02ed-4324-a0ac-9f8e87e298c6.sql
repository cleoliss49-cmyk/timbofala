-- Drop and recreate view without SECURITY DEFINER
DROP VIEW IF EXISTS public.business_monthly_summary;

CREATE VIEW public.business_monthly_summary AS
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

-- Grant access
GRANT SELECT ON public.business_monthly_summary TO authenticated;