-- Fix existing SECURITY DEFINER views
DROP VIEW IF EXISTS public.business_commission_summary CASCADE;

CREATE VIEW public.business_commission_summary AS
SELECT 
  bp.id as business_id,
  bp.business_name,
  bp.slug,
  bp.logo_url,
  COALESCE(SUM(pc.total_sales), 0) as total_sales,
  COALESCE(SUM(pc.commission_amount), 0) as total_commission,
  COALESCE((
    SELECT SUM(cp.amount) 
    FROM public.commission_payments cp 
    WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
  ), 0) as total_paid,
  COALESCE(SUM(pc.commission_amount), 0) - COALESCE((
    SELECT SUM(cp.amount) 
    FROM public.commission_payments cp 
    WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
  ), 0) as current_balance,
  CASE 
    WHEN COALESCE(SUM(pc.commission_amount), 0) - COALESCE((
      SELECT SUM(cp.amount) 
      FROM public.commission_payments cp 
      WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
    ), 0) <= 0 THEN 'paid'
    WHEN EXISTS (SELECT 1 FROM public.platform_commissions pc2 WHERE pc2.business_id = bp.id AND pc2.status = 'awaiting_confirmation') THEN 'awaiting_confirmation'
    ELSE 'pending'
  END as balance_status,
  (SELECT receipt_url FROM public.platform_commissions pc3 WHERE pc3.business_id = bp.id AND pc3.receipt_url IS NOT NULL ORDER BY pc3.updated_at DESC LIMIT 1) as last_receipt_url,
  (SELECT receipt_uploaded_at FROM public.platform_commissions pc4 WHERE pc4.business_id = bp.id AND pc4.receipt_url IS NOT NULL ORDER BY pc4.updated_at DESC LIMIT 1) as last_receipt_at
FROM public.business_profiles bp
LEFT JOIN public.platform_commissions pc ON pc.business_id = bp.id
WHERE bp.is_active = true
GROUP BY bp.id, bp.business_name, bp.slug, bp.logo_url;

GRANT SELECT ON public.business_commission_summary TO authenticated;