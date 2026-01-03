-- Add preparation/delivery time to business_profiles
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS estimated_prep_time_minutes integer DEFAULT 30;

COMMENT ON COLUMN public.business_profiles.estimated_prep_time_minutes IS 'Estimated preparation/delivery time in minutes';