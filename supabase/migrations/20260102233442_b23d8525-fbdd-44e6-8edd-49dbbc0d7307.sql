-- Create order_messages table for order-specific chat (auto-deleted when order is completed)
CREATE TABLE public.order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.business_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_from_business BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Order participants can view messages"
ON public.order_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_orders bo
    WHERE bo.id = order_messages.order_id
    AND (bo.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.business_profiles bp
      WHERE bp.id = bo.business_id AND bp.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Order participants can send messages"
ON public.order_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.business_orders bo
    WHERE bo.id = order_messages.order_id
    AND (bo.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.business_profiles bp
      WHERE bp.id = bo.business_id AND bp.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.order_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_orders bo
    WHERE bo.id = order_messages.order_id
    AND (bo.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.business_profiles bp
      WHERE bp.id = bo.business_id AND bp.user_id = auth.uid()
    ))
  )
);

-- Create function to auto-delete messages when order is completed
CREATE OR REPLACE FUNCTION delete_order_messages_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('delivered', 'cancelled') AND OLD.status NOT IN ('delivered', 'cancelled') THEN
    DELETE FROM public.order_messages WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to delete messages when order is completed
CREATE TRIGGER on_order_complete_delete_messages
  AFTER UPDATE ON public.business_orders
  FOR EACH ROW
  EXECUTE FUNCTION delete_order_messages_on_complete();

-- Add opening_hours column to business_profiles if not exists
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Add index for faster message queries
CREATE INDEX idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX idx_order_messages_created_at ON public.order_messages(created_at);

-- Enable realtime for order messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;