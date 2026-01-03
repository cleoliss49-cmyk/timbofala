-- Stories/Status table (posts that disappear after 24 hours)
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Story views tracking
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Classified ads table
CREATE TABLE public.classifieds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'servicos', -- 'empregos', 'servicos', 'imoveis', 'pets', 'veiculos', 'outros'
  subcategory TEXT,
  price NUMERIC,
  price_type TEXT DEFAULT 'fixed', -- 'fixed', 'negotiable', 'free', 'hourly', 'monthly'
  location TEXT,
  neighborhood TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Classified images table for multiple images
CREATE TABLE public.classified_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classified_id UUID NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Classified favorites
CREATE TABLE public.classified_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classified_id UUID NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classified_id, user_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classifieds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_favorites ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Stories are viewable by everyone" ON public.stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can view story views" ON public.story_views
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_views.story_id AND stories.user_id = auth.uid())
  );

CREATE POLICY "Users can mark stories as viewed" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Classifieds policies
CREATE POLICY "Active classifieds are viewable by everyone" ON public.classifieds
  FOR SELECT USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own classifieds" ON public.classifieds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classifieds" ON public.classifieds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classifieds" ON public.classifieds
  FOR DELETE USING (auth.uid() = user_id);

-- Classified images policies
CREATE POLICY "Classified images are viewable by everyone" ON public.classified_images
  FOR SELECT USING (true);

CREATE POLICY "Users can add images to their classifieds" ON public.classified_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM classifieds WHERE classifieds.id = classified_images.classified_id AND classifieds.user_id = auth.uid())
  );

CREATE POLICY "Users can delete images from their classifieds" ON public.classified_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM classifieds WHERE classifieds.id = classified_images.classified_id AND classifieds.user_id = auth.uid())
  );

-- Classified favorites policies
CREATE POLICY "Users can view their own favorites" ON public.classified_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.classified_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.classified_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for stories
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for classifieds
INSERT INTO storage.buckets (id, name, public) VALUES ('classifieds', 'classifieds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stories
CREATE POLICY "Users can upload stories" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Stories are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Users can delete their stories" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for classifieds
CREATE POLICY "Users can upload classified images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'classifieds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Classified images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'classifieds');

CREATE POLICY "Users can delete their classified images" ON storage.objects
  FOR DELETE USING (bucket_id = 'classifieds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for performance
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_classifieds_category ON public.classifieds(category);
CREATE INDEX idx_classifieds_user_id ON public.classifieds(user_id);
CREATE INDEX idx_classifieds_is_active ON public.classifieds(is_active);
CREATE INDEX idx_classifieds_created_at ON public.classifieds(created_at DESC);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;

-- Function to auto-delete expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;