-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message', 'mention')),
  title TEXT NOT NULL,
  message TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification on like
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  actor_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get actor username
  SELECT username INTO actor_username FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, actor_id, post_id)
  VALUES (
    post_owner_id,
    'like',
    'Nova curtida',
    actor_username || ' curtiu sua publicação',
    NEW.user_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for reactions
CREATE TRIGGER on_reaction_created
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  actor_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get actor username
  SELECT username INTO actor_username FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, actor_id, post_id)
  VALUES (
    post_owner_id,
    'comment',
    'Novo comentário',
    actor_username || ' comentou na sua publicação',
    NEW.user_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_username TEXT;
BEGIN
  -- Get actor username
  SELECT username INTO actor_username FROM public.profiles WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, actor_id)
  VALUES (
    NEW.following_id,
    'follow',
    'Novo seguidor',
    actor_username || ' começou a seguir você',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for follows
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- Function to create notification on message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_username TEXT;
BEGIN
  -- Get actor username
  SELECT username INTO actor_username FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, actor_id)
  VALUES (
    NEW.receiver_id,
    'message',
    'Nova mensagem',
    actor_username || ' enviou uma mensagem',
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for messages
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_message();

-- Update handle_new_user to auto-follow TimboFalaOficial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  official_profile_id UUID;
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
  
  -- Auto-follow TimboFalaOficial
  SELECT id INTO official_profile_id FROM public.profiles WHERE username = 'TimboFalaOficial' LIMIT 1;
  
  IF official_profile_id IS NOT NULL AND official_profile_id != NEW.id THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, official_profile_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;