-- Add avatar_url column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update trigger to handle OAuth names and avatar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 2)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing OAuth users with missing names/avatars
UPDATE public.profiles p
SET 
  first_name = COALESCE(p.first_name, split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ' ', 1)),
  last_name = COALESCE(p.last_name, split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ' ', 2)),
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture', u.raw_user_meta_data->>'avatar_url')
FROM auth.users u
WHERE p.user_id = u.id
  AND (
    p.first_name IS NULL 
    OR p.avatar_url IS NULL
  )
  AND (
    u.raw_user_meta_data->>'full_name' IS NOT NULL 
    OR u.raw_user_meta_data->>'name' IS NOT NULL
    OR u.raw_user_meta_data->>'picture' IS NOT NULL
  );