-- Drop existing receipts policies that might be conflicting
DROP POLICY IF EXISTS "Authenticated can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete receipts" ON storage.objects;

-- Create a simpler policy for uploads - any authenticated user can upload to receipts bucket
CREATE POLICY "Anyone authenticated can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- Create policy for updates
CREATE POLICY "Anyone authenticated can update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts');

-- Create policy for deletes  
CREATE POLICY "Anyone authenticated can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts');