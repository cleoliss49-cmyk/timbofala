
-- Update the handle_new_user function to auto-follow @admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  admin_profile_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, username, full_name, neighborhood, city, accepted_terms)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'neighborhood',
    COALESCE(NEW.raw_user_meta_data ->> 'city', 'Timbó'),
    (NEW.raw_user_meta_data ->> 'accepted_terms')::boolean
  );
  
  -- Auto-follow @admin (mandatory)
  SELECT id INTO admin_profile_id FROM public.profiles WHERE username = 'admin' LIMIT 1;
  
  IF admin_profile_id IS NOT NULL AND admin_profile_id != NEW.id THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, admin_profile_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create call_sessions table for voice/video calls
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    call_type TEXT NOT NULL DEFAULT 'voice', -- 'voice' or 'video'
    status TEXT NOT NULL DEFAULT 'calling', -- 'calling', 'active', 'ended', 'rejected', 'missed'
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for call_sessions
CREATE POLICY "Users can view their own calls"
ON public.call_sessions
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls"
ON public.call_sessions
FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Participants can update calls"
ON public.call_sessions
FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Enable realtime for call_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;

-- Function to check if user is trying to unfollow admin
CREATE OR REPLACE FUNCTION public.prevent_unfollow_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.profiles WHERE username = 'admin' LIMIT 1;
  
  IF admin_id IS NOT NULL AND OLD.following_id = admin_id THEN
    RAISE EXCEPTION 'Não é possível deixar de seguir o perfil oficial @admin';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger to prevent unfollowing admin
DROP TRIGGER IF EXISTS prevent_unfollow_admin_trigger ON public.follows;
CREATE TRIGGER prevent_unfollow_admin_trigger
BEFORE DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unfollow_admin();
