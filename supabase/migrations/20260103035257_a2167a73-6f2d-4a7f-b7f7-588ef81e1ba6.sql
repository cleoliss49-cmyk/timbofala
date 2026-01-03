-- Prevent double-charging commissions per order
CREATE TABLE IF NOT EXISTS public.platform_commission_charges (
  order_id uuid PRIMARY KEY,
  business_id uuid NOT NULL,
  month_year text NOT NULL,
  total numeric NOT NULL,
  charged_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_commission_charges ENABLE ROW LEVEL SECURITY;

-- Only admins can view this audit table
DO $$ BEGIN
  CREATE POLICY "Admins can view commission charges"
  ON public.platform_commission_charges
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Replace commission trigger function to be idempotent per order
CREATE OR REPLACE FUNCTION public.update_platform_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
$function$;

-- Admin visibility for orders and items (needed for admin commissions panel)
DO $$ BEGIN
  CREATE POLICY "Admins can view all business orders"
  ON public.business_orders
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all business order items"
  ON public.business_order_items
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable realtime changefeed for admin/business dashboards
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.business_orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_commissions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.business_order_items;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;