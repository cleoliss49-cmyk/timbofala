-- Ensure Paquera likes create matches + notifications
-- Create trigger on paquera_likes to check mutual likes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_paquera_like_created'
  ) THEN
    CREATE TRIGGER on_paquera_like_created
    AFTER INSERT ON public.paquera_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_paquera_match();
  END IF;
END $$;

-- Enforce age range rules: minimum age cannot be below 18 and max must be >= min
CREATE OR REPLACE FUNCTION public.validate_paquera_age_range()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.age_range_min IS NULL THEN
    NEW.age_range_min := 18;
  END IF;

  IF NEW.age_range_max IS NULL THEN
    NEW.age_range_max := 99;
  END IF;

  IF NEW.age_range_min < 18 THEN
    RAISE EXCEPTION 'Idade mínima não pode ser menor que 18';
  END IF;

  IF NEW.age_range_max < 18 THEN
    RAISE EXCEPTION 'Idade máxima não pode ser menor que 18';
  END IF;

  IF NEW.age_range_max < NEW.age_range_min THEN
    RAISE EXCEPTION 'Idade máxima não pode ser menor que a idade mínima';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'validate_paquera_age_range_trigger'
  ) THEN
    CREATE TRIGGER validate_paquera_age_range_trigger
    BEFORE INSERT OR UPDATE ON public.paquera_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_paquera_age_range();
  END IF;
END $$;