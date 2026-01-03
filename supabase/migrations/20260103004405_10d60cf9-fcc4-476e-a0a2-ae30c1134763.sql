-- Create receipts bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for receipts bucket
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Everyone can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add receipt columns to business_orders if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'business_orders' AND column_name = 'receipt_url') THEN
    ALTER TABLE public.business_orders ADD COLUMN receipt_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'business_orders' AND column_name = 'receipt_uploaded_at') THEN
    ALTER TABLE public.business_orders ADD COLUMN receipt_uploaded_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'business_orders' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.business_orders ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;