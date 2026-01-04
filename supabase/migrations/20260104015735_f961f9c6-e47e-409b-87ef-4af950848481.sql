-- Allow paquera_match notifications
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'like'::text,
        'comment'::text,
        'follow'::text,
        'message'::text,
        'mention'::text,
        'paquera_match'::text
      ]
    )
  );