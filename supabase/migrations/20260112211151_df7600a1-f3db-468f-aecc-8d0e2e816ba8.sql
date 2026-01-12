-- Create a function to promote a user to admin by email
-- This can be called from the SQL editor or via RPC for initial setup
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.profiles 
  SET is_admin = true, role = 'admin'
  WHERE email = user_email;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RETURN 'No user found with email: ' || user_email;
  ELSE
    RETURN 'User ' || user_email || ' is now an admin';
  END IF;
END;
$$;

-- Create policy to allow admins to update other users' admin status
CREATE POLICY "Admins can update user profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);