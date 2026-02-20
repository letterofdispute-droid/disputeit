
-- Fix critical privilege escalation: restrict make_user_admin to existing admins only
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Only existing admins can promote others
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Prevent self-promotion abuse
  IF user_email = (SELECT email FROM profiles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Cannot modify your own admin status';
  END IF;

  UPDATE public.profiles 
  SET is_admin = true, role = 'admin'
  WHERE email = user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Log the action
  INSERT INTO analytics_events (event_type, user_id, event_data)
  VALUES ('admin_promotion', auth.uid(), jsonb_build_object('promoted_email', user_email));

  RETURN 'User ' || user_email || ' is now an admin';
END;
$$;
