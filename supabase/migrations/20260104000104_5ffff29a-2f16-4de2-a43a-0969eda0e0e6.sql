-- Create paquera subscriptions table
CREATE TABLE public.paquera_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paquera_profile_id UUID NOT NULL REFERENCES public.paquera_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'blocked')),
  interactions_count INTEGER NOT NULL DEFAULT 0,
  interactions_limit INTEGER NOT NULL DEFAULT 10,
  receipt_url TEXT,
  receipt_uploaded_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paquera_profile_id)
);

-- Create paquera payment history table
CREATE TABLE public.paquera_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.paquera_subscriptions(id) ON DELETE CASCADE,
  paquera_profile_id UUID NOT NULL REFERENCES public.paquera_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_url TEXT NOT NULL,
  pix_identifier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paquera_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquera_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for paquera_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.paquera_subscriptions FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "System can create subscriptions"
ON public.paquera_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON public.paquera_subscriptions FOR UPDATE
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- RLS policies for paquera_payments
CREATE POLICY "Users can view their own payments"
ON public.paquera_payments FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create payments"
ON public.paquera_payments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update payments"
ON public.paquera_payments FOR UPDATE
USING (is_admin(auth.uid()));

-- Function to increment interaction count
CREATE OR REPLACE FUNCTION public.increment_paquera_interaction(p_profile_id UUID)
RETURNS TABLE(can_continue BOOLEAN, current_count INTEGER, limit_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription paquera_subscriptions%ROWTYPE;
  v_can_continue BOOLEAN;
  v_limit_reached BOOLEAN;
BEGIN
  -- Get or create subscription
  SELECT * INTO v_subscription
  FROM paquera_subscriptions
  WHERE paquera_profile_id = p_profile_id;
  
  IF NOT FOUND THEN
    -- Create new subscription
    INSERT INTO paquera_subscriptions (paquera_profile_id, user_id, status, interactions_count)
    SELECT p_profile_id, pp.user_id, 'active', 1
    FROM paquera_profiles pp WHERE pp.id = p_profile_id
    RETURNING * INTO v_subscription;
    
    RETURN QUERY SELECT true, 1, false;
    RETURN;
  END IF;
  
  -- Check if subscription is active and not expired
  IF v_subscription.status = 'active' AND (v_subscription.expires_at IS NULL OR v_subscription.expires_at > now()) THEN
    -- Increment count
    UPDATE paquera_subscriptions
    SET interactions_count = interactions_count + 1, updated_at = now()
    WHERE id = v_subscription.id
    RETURNING interactions_count INTO v_subscription.interactions_count;
    
    v_can_continue := true;
    v_limit_reached := false;
  ELSIF v_subscription.status = 'pending' OR v_subscription.status = 'expired' THEN
    -- Check if limit reached
    IF v_subscription.interactions_count >= v_subscription.interactions_limit THEN
      v_can_continue := false;
      v_limit_reached := true;
    ELSE
      -- Increment count
      UPDATE paquera_subscriptions
      SET interactions_count = interactions_count + 1, updated_at = now()
      WHERE id = v_subscription.id
      RETURNING interactions_count INTO v_subscription.interactions_count;
      
      v_limit_reached := v_subscription.interactions_count >= v_subscription.interactions_limit;
      v_can_continue := NOT v_limit_reached;
    END IF;
  ELSE
    v_can_continue := false;
    v_limit_reached := true;
  END IF;
  
  RETURN QUERY SELECT v_can_continue, v_subscription.interactions_count, v_limit_reached;
END;
$$;

-- Function to check if user can interact
CREATE OR REPLACE FUNCTION public.check_paquera_access(p_profile_id UUID)
RETURNS TABLE(can_interact BOOLEAN, interactions_remaining INTEGER, needs_payment BOOLEAN, subscription_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription paquera_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_subscription
  FROM paquera_subscriptions
  WHERE paquera_profile_id = p_profile_id;
  
  IF NOT FOUND THEN
    -- No subscription yet, can interact freely up to limit
    RETURN QUERY SELECT true, 10, false, 'new'::TEXT;
    RETURN;
  END IF;
  
  -- Check if active and not expired
  IF v_subscription.status = 'active' AND (v_subscription.expires_at IS NULL OR v_subscription.expires_at > now()) THEN
    RETURN QUERY SELECT true, 999, false, 'active'::TEXT;
  ELSIF v_subscription.interactions_count >= v_subscription.interactions_limit THEN
    RETURN QUERY SELECT false, 0, true, v_subscription.status;
  ELSE
    RETURN QUERY SELECT true, (v_subscription.interactions_limit - v_subscription.interactions_count)::INTEGER, false, v_subscription.status;
  END IF;
END;
$$;

-- Function to approve paquera payment (admin only)
CREATE OR REPLACE FUNCTION public.approve_paquera_payment(p_payment_id UUID, p_days INTEGER DEFAULT 30)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment paquera_payments%ROWTYPE;
BEGIN
  -- Check if admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  
  -- Get payment
  SELECT * INTO v_payment FROM paquera_payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_not_found';
  END IF;
  
  -- Update payment status
  UPDATE paquera_payments
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_payment_id;
  
  -- Update subscription
  UPDATE paquera_subscriptions
  SET 
    status = 'active',
    expires_at = now() + (p_days || ' days')::INTERVAL,
    approved_at = now(),
    approved_by = auth.uid(),
    interactions_count = 0,
    updated_at = now()
  WHERE paquera_profile_id = v_payment.paquera_profile_id;
  
  RETURN true;
END;
$$;

-- Function to reject paquera payment (admin only)
CREATE OR REPLACE FUNCTION public.reject_paquera_payment(p_payment_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  
  UPDATE paquera_payments
  SET status = 'rejected', rejection_reason = p_reason, reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_payment_id;
  
  RETURN FOUND;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_paquera_subscriptions_updated_at
BEFORE UPDATE ON public.paquera_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.paquera_subscriptions;