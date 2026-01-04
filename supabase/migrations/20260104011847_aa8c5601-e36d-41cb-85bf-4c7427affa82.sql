
-- Fix: Update the increment_paquera_interaction function to properly handle new users
-- and ensure everyone starts in "free phase" (pending status, not active)

CREATE OR REPLACE FUNCTION public.increment_paquera_interaction(p_profile_id uuid)
 RETURNS TABLE(can_continue boolean, current_count integer, limit_reached boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription paquera_subscriptions%ROWTYPE;
  v_can_continue BOOLEAN;
  v_limit_reached BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Get or create subscription
  SELECT * INTO v_subscription
  FROM paquera_subscriptions
  WHERE paquera_profile_id = p_profile_id;
  
  IF NOT FOUND THEN
    -- Create new subscription in "pending" status (free phase - 10 interactions limit)
    INSERT INTO paquera_subscriptions (paquera_profile_id, user_id, status, interactions_count, interactions_limit)
    SELECT p_profile_id, pp.user_id, 'pending', 1, 10
    FROM paquera_profiles pp WHERE pp.id = p_profile_id
    RETURNING * INTO v_subscription;
    
    -- First interaction, can continue
    RETURN QUERY SELECT true, 1, false;
    RETURN;
  END IF;
  
  -- Check if subscription is PAID and active (not expired)
  IF v_subscription.status = 'active' AND v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at > now() THEN
    -- Premium user - unlimited interactions, just increment for stats
    UPDATE paquera_subscriptions
    SET interactions_count = interactions_count + 1, updated_at = now()
    WHERE id = v_subscription.id
    RETURNING interactions_count INTO v_new_count;
    
    RETURN QUERY SELECT true, v_new_count, false;
    RETURN;
  END IF;
  
  -- Free phase or expired users - check limit
  IF v_subscription.interactions_count >= v_subscription.interactions_limit THEN
    -- Limit reached, cannot continue
    RETURN QUERY SELECT false, v_subscription.interactions_count, true;
    RETURN;
  END IF;
  
  -- Increment count for free phase users
  UPDATE paquera_subscriptions
  SET interactions_count = interactions_count + 1, updated_at = now()
  WHERE id = v_subscription.id
  RETURNING interactions_count INTO v_new_count;
  
  v_limit_reached := v_new_count >= v_subscription.interactions_limit;
  v_can_continue := NOT v_limit_reached;
  
  RETURN QUERY SELECT v_can_continue, v_new_count, v_limit_reached;
END;
$function$;

-- Fix: Update check_paquera_access to properly classify users
CREATE OR REPLACE FUNCTION public.check_paquera_access(p_profile_id uuid)
 RETURNS TABLE(can_interact boolean, interactions_remaining integer, needs_payment boolean, subscription_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription paquera_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_subscription
  FROM paquera_subscriptions
  WHERE paquera_profile_id = p_profile_id;
  
  IF NOT FOUND THEN
    -- No subscription yet - free phase, can interact up to 10 times
    RETURN QUERY SELECT true, 10, false, 'free'::TEXT;
    RETURN;
  END IF;
  
  -- Check if PAID premium (has expires_at and is active and not expired)
  IF v_subscription.status = 'active' AND v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at > now() THEN
    -- Premium user - unlimited
    RETURN QUERY SELECT true, 999, false, 'premium'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at <= now() THEN
    -- Expired premium - needs renewal
    RETURN QUERY SELECT false, 0, true, 'expired'::TEXT;
    RETURN;
  END IF;
  
  -- Free phase user (pending status, no expires_at)
  IF v_subscription.interactions_count >= v_subscription.interactions_limit THEN
    -- Free limit reached - needs payment
    RETURN QUERY SELECT false, 0, true, 'paused'::TEXT;
    RETURN;
  END IF;
  
  -- Still in free phase with remaining interactions
  RETURN QUERY SELECT true, (v_subscription.interactions_limit - v_subscription.interactions_count)::INTEGER, false, 'free'::TEXT;
END;
$function$;

-- Fix Maisa's subscription to be in free phase (pending) since she hasn't paid
UPDATE paquera_subscriptions 
SET status = 'pending', expires_at = NULL
WHERE paquera_profile_id = '1e69796b-0cae-4097-ad7f-aabb9df9dd6d'
AND expires_at IS NULL;
