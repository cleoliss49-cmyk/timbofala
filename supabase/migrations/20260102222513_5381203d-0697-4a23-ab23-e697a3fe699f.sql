-- Temporarily disable the unfollow trigger to clean up data
DROP TRIGGER IF EXISTS prevent_unfollow_admin_trigger ON follows;

-- Now delete all follows
DELETE FROM follows;

-- Delete profiles (except admin)
DELETE FROM profiles WHERE id != '53902adf-ee5f-41c3-81d7-68f7ecc3f31c';

-- Recreate the trigger
CREATE TRIGGER prevent_unfollow_admin_trigger
  BEFORE DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unfollow_admin();