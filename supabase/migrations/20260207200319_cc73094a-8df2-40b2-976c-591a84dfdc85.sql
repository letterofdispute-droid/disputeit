-- Fix critical security vulnerability: Add admin authorization check to make_user_admin function
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- SECURITY CHECK: Only allow admins to make other users admin
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN 'Error: Only admins can grant admin privileges';
  END IF;

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
$function$;