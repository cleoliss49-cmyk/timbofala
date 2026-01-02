
-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS relationship_status text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS sexual_orientation text,
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS show_relationship_status boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_birth_date boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_languages boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_education boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_profession boolean DEFAULT true;

-- Create paquera_profiles table (dating sub-profile)
CREATE TABLE public.paquera_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  photo_url text NOT NULL,
  gender text NOT NULL,
  looking_for_gender text NOT NULL,
  sexual_orientation text NOT NULL,
  hobbies text[],
  age_range_min integer DEFAULT 18,
  age_range_max integer DEFAULT 99,
  city text NOT NULL,
  bio text,
  is_active boolean DEFAULT true,
  accepted_terms boolean DEFAULT false,
  accepted_terms_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create paquera_likes table
CREATE TABLE public.paquera_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid REFERENCES public.paquera_profiles(id) ON DELETE CASCADE NOT NULL,
  liked_id uuid REFERENCES public.paquera_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(liker_id, liked_id)
);

-- Create paquera_matches table
CREATE TABLE public.paquera_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES public.paquera_profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES public.paquera_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.paquera_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquera_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquera_matches ENABLE ROW LEVEL SECURITY;

-- Paquera profiles policies
CREATE POLICY "Users can view active paquera profiles"
ON public.paquera_profiles FOR SELECT
USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own paquera profile"
ON public.paquera_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paquera profile"
ON public.paquera_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paquera profile"
ON public.paquera_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Paquera likes policies
CREATE POLICY "Users can view their own likes"
ON public.paquera_likes FOR SELECT
USING (
  liker_id IN (SELECT id FROM public.paquera_profiles WHERE user_id = auth.uid())
  OR liked_id IN (SELECT id FROM public.paquera_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create likes"
ON public.paquera_likes FOR INSERT
WITH CHECK (liker_id IN (SELECT id FROM public.paquera_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own likes"
ON public.paquera_likes FOR DELETE
USING (liker_id IN (SELECT id FROM public.paquera_profiles WHERE user_id = auth.uid()));

-- Paquera matches policies
CREATE POLICY "Users can view their own matches"
ON public.paquera_matches FOR SELECT
USING (
  user1_id IN (SELECT id FROM public.paquera_profiles WHERE user_id = auth.uid())
  OR user2_id IN (SELECT id FROM public.paquera_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "System can create matches"
ON public.paquera_matches FOR INSERT
WITH CHECK (true);

-- Function to check for mutual like and create match
CREATE OR REPLACE FUNCTION public.check_paquera_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_like_exists boolean;
  liker_user_id uuid;
  liked_user_id uuid;
BEGIN
  -- Check if there's a mutual like
  SELECT EXISTS (
    SELECT 1 FROM public.paquera_likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) INTO mutual_like_exists;
  
  IF mutual_like_exists THEN
    -- Get user IDs for notification
    SELECT user_id INTO liker_user_id FROM public.paquera_profiles WHERE id = NEW.liker_id;
    SELECT user_id INTO liked_user_id FROM public.paquera_profiles WHERE id = NEW.liked_id;
    
    -- Create match (order by id to ensure uniqueness)
    INSERT INTO public.paquera_matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT DO NOTHING;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, actor_id)
    VALUES 
      (liker_user_id, 'paquera_match', 'Vocês se curtiram! 💕', 'Você tem um novo match no Paquera!', liked_user_id),
      (liked_user_id, 'paquera_match', 'Vocês se curtiram! 💕', 'Você tem um novo match no Paquera!', liker_user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for match checking
CREATE TRIGGER on_paquera_like_created
AFTER INSERT ON public.paquera_likes
FOR EACH ROW
EXECUTE FUNCTION public.check_paquera_match();

-- Create paquera storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('paquera', 'paquera', true)
ON CONFLICT DO NOTHING;

-- Storage policies for paquera bucket
CREATE POLICY "Paquera images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'paquera');

CREATE POLICY "Users can upload their paquera photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'paquera' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their paquera photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'paquera' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their paquera photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'paquera' AND auth.uid()::text = (storage.foldername(name))[1]);
