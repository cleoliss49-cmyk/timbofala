-- Add gender column to profiles for filtering
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Create product_comments table for marketplace
CREATE TABLE IF NOT EXISTS public.product_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product comments are viewable by everyone"
ON public.product_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.product_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments"
ON public.product_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create product_likes table for marketplace
CREATE TABLE IF NOT EXISTS public.product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product likes are viewable by everyone"
ON public.product_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like products"
ON public.product_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike products"
ON public.product_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create audio_messages storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_messages', 'audio_messages', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for audio_messages
CREATE POLICY "Users can upload audio messages"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio_messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Audio messages are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio_messages');