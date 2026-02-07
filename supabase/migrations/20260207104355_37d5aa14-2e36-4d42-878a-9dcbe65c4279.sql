-- Create user_credits table for goodwill credits system
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  granted_by uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  used_at timestamp with time zone,
  purchase_id uuid REFERENCES public.letter_purchases(id),
  reason text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired'))
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create trigger function to enforce max 2 active credits per user
CREATE OR REPLACE FUNCTION public.check_user_credit_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Count active (non-expired, non-used) credits for this user
  SELECT COUNT(*) INTO active_count
  FROM public.user_credits
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND expires_at > NOW();
  
  -- Reject if user already has 2 or more active credits
  IF active_count >= 2 THEN
    RAISE EXCEPTION 'User cannot have more than 2 active credits';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create BEFORE INSERT trigger
CREATE TRIGGER enforce_credit_limit
  BEFORE INSERT ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_credit_limit();

-- RLS Policies

-- Admins can INSERT credits (grant)
CREATE POLICY "Admins can grant credits"
ON public.user_credits
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can SELECT all credits
CREATE POLICY "Admins can view all credits"
ON public.user_credits
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Users can SELECT their own credits
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can update credits (for redemption via edge function)
CREATE POLICY "Service role can update credits"
ON public.user_credits
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');