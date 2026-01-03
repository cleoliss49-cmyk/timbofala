-- Allow customers to submit PIX receipts safely without broad UPDATE permissions

CREATE OR REPLACE FUNCTION public.submit_pix_receipt(
  _order_id uuid,
  _receipt_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.business_orders bo
  SET
    receipt_url = _receipt_url,
    receipt_uploaded_at = now(),
    payment_status = 'pending_confirmation',
    updated_at = now()
  WHERE
    bo.id = _order_id
    AND bo.customer_id = auth.uid()
    AND bo.payment_method = 'pix'
    AND bo.status NOT IN ('cancelled', 'rejected');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found_or_not_allowed';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_pix_receipt(uuid, text) TO authenticated;
