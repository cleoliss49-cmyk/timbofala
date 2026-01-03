-- Add targeting and duration fields to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS target_audience text NOT NULL DEFAULT 'all',
ADD COLUMN IF NOT EXISTS duration_hours integer NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS title text;

-- Create story_views table to track real views
CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  user_gender text,
  user_city text,
  UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_views
CREATE POLICY "Anyone can view story view counts"
ON public.story_views
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can register views"
ON public.story_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update stories RLS to ensure only admin can create
DROP POLICY IF EXISTS "Users can create stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their stories" ON public.stories;
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;

-- Only admin can create stories
CREATE POLICY "Only admin can create stories"
ON public.stories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);

-- Only admin can delete stories
CREATE POLICY "Only admin can delete stories"
ON public.stories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);

-- Stories are viewable based on target audience
CREATE POLICY "Stories viewable based on audience"
ON public.stories
FOR SELECT
USING (
  expires_at > now() AND (
    target_audience = 'all' OR
    (target_audience = 'women' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND gender = 'female'
    )) OR
    (target_audience = 'men' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND gender = 'male'
    )) OR
    user_id = auth.uid()
  )
);

-- Enable realtime for story_views
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);