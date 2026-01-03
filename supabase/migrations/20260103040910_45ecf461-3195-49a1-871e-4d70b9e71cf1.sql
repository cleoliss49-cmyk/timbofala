-- Fix the trigger to also update the balance field
CREATE OR REPLACE FUNCTION public.update_platform_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_month TEXT;
  order_total NUMERIC;
BEGIN
  -- Only process when order status changes to 'delivered' for the first time
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    -- If we've already charged commission for this order, do nothing
    IF EXISTS (SELECT 1 FROM public.platform_commission_charges WHERE order_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    current_month := TO_CHAR(NEW.created_at, 'YYYY-MM');
    order_total := NEW.total;

    -- Record charge so we never count this order again (even if status flips)
    INSERT INTO public.platform_commission_charges (order_id, business_id, month_year, total)
    VALUES (NEW.id, NEW.business_id, current_month, order_total)
    ON CONFLICT (order_id) DO NOTHING;

    -- Insert or update the commission record for this month
    INSERT INTO public.platform_commissions (business_id, month_year, total_sales, commission_amount, balance)
    VALUES (NEW.business_id, current_month, order_total, order_total * 0.07, order_total * 0.07)
    ON CONFLICT (business_id, month_year)
    DO UPDATE SET
      total_sales = platform_commissions.total_sales + order_total,
      commission_amount = (platform_commissions.total_sales + order_total) * 0.07,
      balance = CASE 
        WHEN platform_commissions.status = 'paid' THEN 0
        ELSE (platform_commissions.total_sales + order_total) * 0.07 - platform_commissions.paid_amount
      END,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;