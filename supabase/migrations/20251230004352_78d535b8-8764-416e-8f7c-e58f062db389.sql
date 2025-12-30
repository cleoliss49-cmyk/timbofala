-- Admin roles enum
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'moderator', 'viewer');

-- Admin users table (separate from regular users)
CREATE TABLE public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'moderator',
    can_delete_posts BOOLEAN NOT NULL DEFAULT true,
    can_delete_users BOOLEAN NOT NULL DEFAULT false,
    can_manage_admins BOOLEAN NOT NULL DEFAULT false,
    can_pin_posts BOOLEAN NOT NULL DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Pinned posts table
CREATE TABLE public.pinned_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL,
    pin_location TEXT NOT NULL DEFAULT 'feed', -- feed, marketplace, auction
    duration_hours INTEGER NOT NULL DEFAULT 24,
    impressions INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pinned_posts ENABLE ROW LEVEL SECURITY;

-- User impressions for pinned posts (track who saw it)
CREATE TABLE public.pinned_post_impressions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pinned_post_id UUID NOT NULL REFERENCES public.pinned_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pinned_post_id, user_id)
);

ALTER TABLE public.pinned_post_impressions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = _user_id
    )
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = _user_id AND role = 'super_admin'
    )
$$;

-- RLS policies for admin_users
CREATE POLICY "Super admins can view all admin users" ON public.admin_users
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can insert admin users" ON public.admin_users
    FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update admin users" ON public.admin_users
    FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete admin users" ON public.admin_users
    FOR DELETE USING (public.is_super_admin(auth.uid()));

-- RLS policies for pinned_posts
CREATE POLICY "Admins can view pinned posts" ON public.pinned_posts
    FOR SELECT USING (public.is_admin(auth.uid()) OR ends_at > now());

CREATE POLICY "Admins can create pinned posts" ON public.pinned_posts
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete pinned posts" ON public.pinned_posts
    FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS policies for impressions
CREATE POLICY "Users can view their impressions" ON public.pinned_post_impressions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create impressions" ON public.pinned_post_impressions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their impressions" ON public.pinned_post_impressions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can delete any post (update reports table to track admin action)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_by UUID;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS action_taken TEXT;

-- Trigger to update admin_users updated_at
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();