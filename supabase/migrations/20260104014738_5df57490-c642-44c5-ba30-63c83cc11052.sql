
-- Ensure the increment function can create subscriptions properly
-- The function is SECURITY DEFINER so it should bypass RLS, but let's make sure

-- Update the INSERT policy to be more permissive for the system
DROP POLICY IF EXISTS "System can create subscriptions" ON public.paquera_subscriptions;

CREATE POLICY "System can create subscriptions"
ON public.paquera_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM paquera_profiles pp 
    WHERE pp.id = paquera_profile_id AND pp.user_id = auth.uid()
  )
);
