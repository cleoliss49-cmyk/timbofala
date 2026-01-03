-- Corrigir avisos de segurança

-- 1. Dropar a view SECURITY DEFINER e recriar como view normal
DROP VIEW IF EXISTS public.business_commission_summary;

-- 2. Recriar a view SEM security definer (view normal)
-- Usará as permissões do usuário que está consultando
CREATE VIEW public.business_commission_summary AS
SELECT 
  bp.id as business_id,
  bp.business_name,
  bp.logo_url,
  bp.slug,
  COALESCE(SUM(pc.commission_amount), 0) as total_commission,
  COALESCE(SUM(pc.total_sales), 0) as total_sales,
  COALESCE((
    SELECT SUM(cp.amount) 
    FROM commission_payments cp 
    WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
  ), 0) as total_paid,
  COALESCE(SUM(pc.commission_amount), 0) - COALESCE((
    SELECT SUM(cp.amount) 
    FROM commission_payments cp 
    WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
  ), 0) as current_balance,
  MAX(pc.receipt_url) as last_receipt_url,
  MAX(pc.receipt_uploaded_at) as last_receipt_at,
  CASE 
    WHEN COALESCE(SUM(pc.commission_amount), 0) - COALESCE((
      SELECT SUM(cp.amount) 
      FROM commission_payments cp 
      WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
    ), 0) <= 0 THEN 'paid'
    WHEN EXISTS (SELECT 1 FROM platform_commissions WHERE business_id = bp.id AND status = 'awaiting_confirmation') THEN 'awaiting_confirmation'
    ELSE 'pending'
  END as balance_status
FROM business_profiles bp
LEFT JOIN platform_commissions pc ON pc.business_id = bp.id
WHERE bp.is_active = true
GROUP BY bp.id, bp.business_name, bp.logo_url, bp.slug;

-- 3. Grant acesso na view para authenticated users (RLS das tabelas base vai aplicar)
GRANT SELECT ON public.business_commission_summary TO authenticated;