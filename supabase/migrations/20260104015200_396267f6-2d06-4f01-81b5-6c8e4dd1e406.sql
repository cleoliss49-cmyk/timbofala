-- Create table for tracking profile views
CREATE TABLE IF NOT EXISTS public.paquera_profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID NOT NULL REFERENCES public.paquera_profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES public.paquera_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, viewed_id)
);

-- Enable RLS
ALTER TABLE public.paquera_profile_views ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own views"
ON public.paquera_profile_views
FOR SELECT
USING (
  viewer_id IN (SELECT id FROM paquera_profiles WHERE user_id = auth.uid())
  OR viewed_id IN (SELECT id FROM paquera_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create views"
ON public.paquera_profile_views
FOR INSERT
WITH CHECK (
  viewer_id IN (SELECT id FROM paquera_profiles WHERE user_id = auth.uid())
);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.paquera_profile_views;