-- Create company_posts table for company publications
CREATE TABLE public.company_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_post_likes table
CREATE TABLE public.company_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create company_post_comments table
CREATE TABLE public.company_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.company_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for company_posts
CREATE POLICY "Company posts are viewable by everyone" 
ON public.company_posts FOR SELECT 
USING (true);

CREATE POLICY "Company owners can create posts" 
ON public.company_posts FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = company_posts.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Company owners can update their posts" 
ON public.company_posts FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = company_posts.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Company owners can delete their posts" 
ON public.company_posts FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = company_posts.company_id 
  AND companies.user_id = auth.uid()
));

-- Policies for company_post_likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.company_post_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like posts" 
ON public.company_post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
ON public.company_post_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for company_post_comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.company_post_comments FOR SELECT 
USING (true);

CREATE POLICY "Users can comment on posts" 
ON public.company_post_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" 
ON public.company_post_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for company posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_post_comments;