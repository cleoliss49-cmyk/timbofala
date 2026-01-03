-- Add payment methods columns to business_profiles
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS accepts_pix boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_card boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_cash boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.business_profiles.accepts_pix IS 'Whether business accepts PIX payments';
COMMENT ON COLUMN public.business_profiles.accepts_card IS 'Whether business accepts card payments (debit/credit) on delivery/pickup';
COMMENT ON COLUMN public.business_profiles.accepts_cash IS 'Whether business accepts cash on delivery/pickup';