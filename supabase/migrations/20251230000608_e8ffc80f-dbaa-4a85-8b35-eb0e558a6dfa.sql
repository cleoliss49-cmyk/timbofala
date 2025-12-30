-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll votes table (anonymous - only tracks if user voted, not which option)
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id) -- User can only vote once per poll
);

-- Create auctions table
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  min_bid NUMERIC NOT NULL,
  bid_increment_percent INTEGER NOT NULL DEFAULT 5, -- 5%, 10%, etc.
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'sold'
  winner_id UUID,
  winning_bid NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auction bids table
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user mentions table
CREATE TABLE public.mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls via posts" ON public.polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their polls" ON public.polls FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Poll options policies
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Users can create poll options" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p 
    JOIN public.posts pt ON p.post_id = pt.id 
    WHERE p.id = poll_id AND pt.user_id = auth.uid()
  )
);

-- Poll votes policies (anonymous - users can see vote counts but not who voted for what)
CREATE POLICY "Users can see their own votes" ON public.poll_votes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can vote on polls" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auctions policies
CREATE POLICY "Auctions are viewable by everyone" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Users can create auctions via posts" ON public.auctions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their auctions" ON public.auctions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Auction bids policies
CREATE POLICY "Auction owner can see all bids" ON public.auction_bids FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.auctions a 
    JOIN public.posts p ON a.post_id = p.id 
    WHERE a.id = auction_id AND p.user_id = auth.uid()
  ) OR user_id = auth.uid()
);
CREATE POLICY "Users can place bids" ON public.auction_bids FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mentions policies
CREATE POLICY "Mentions are viewable by everyone" ON public.mentions FOR SELECT USING (true);
CREATE POLICY "Users can create mentions via posts" ON public.mentions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Create trigger for auction updated_at
CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create notification trigger for mentions
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actor_username TEXT;
BEGIN
  -- Don't notify if user mentions themselves
  IF NEW.mentioned_user_id = (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;
  
  -- Get actor username
  SELECT username INTO actor_username FROM public.profiles WHERE id = (SELECT user_id FROM public.posts WHERE id = NEW.post_id);
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, actor_id, post_id)
  VALUES (
    NEW.mentioned_user_id,
    'mention',
    'Você foi mencionado',
    actor_username || ' mencionou você em uma publicação',
    (SELECT user_id FROM public.posts WHERE id = NEW.post_id),
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mention_created
  AFTER INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mention();