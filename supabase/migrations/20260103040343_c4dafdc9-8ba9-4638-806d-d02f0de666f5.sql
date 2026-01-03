-- Add partial payment support to platform commissions
ALTER TABLE public.platform_commissions
ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0;

-- Backfill existing data (keep behavior: paid = fully paid)
UPDATE public.platform_commissions
SET
  paid_amount = CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END,
  balance = commission_amount - CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END
WHERE true;

-- Storage policies for receipts bucket
-- Allow public viewing of receipts
CREATE POLICY "Public can view receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'receipts');

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own receipts
CREATE POLICY "Authenticated can update receipts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own receipts
CREATE POLICY "Authenticated can delete receipts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');