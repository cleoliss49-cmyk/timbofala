
-- Create user_bans table for temporary bans
CREATE TABLE public.user_bans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    banned_by UUID NOT NULL,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Only admins can manage bans
CREATE POLICY "Admins can view all bans"
ON public.user_bans
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create bans"
ON public.user_bans
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update bans"
ON public.user_bans
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete bans"
ON public.user_bans
FOR DELETE
USING (is_admin(auth.uid()));

-- Users can check their own ban status
CREATE POLICY "Users can view their own bans"
ON public.user_bans
FOR SELECT
USING (auth.uid() = user_id);

-- Function to check if user is currently banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_bans 
        WHERE user_id = _user_id 
        AND is_active = true 
        AND expires_at > now()
    )
$$;

-- Function to get user's active ban info
CREATE OR REPLACE FUNCTION public.get_user_ban_info(_user_id uuid)
RETURNS TABLE(reason text, expires_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT reason, expires_at FROM public.user_bans 
    WHERE user_id = _user_id 
    AND is_active = true 
    AND expires_at > now()
    ORDER BY expires_at DESC
    LIMIT 1
$$;

-- Add index for performance
CREATE INDEX idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX idx_user_bans_expires_at ON public.user_bans(expires_at);

-- Enable realtime for pinned_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_posts;
