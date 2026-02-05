-- Add subscription tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.subscription_status IS 'Subscription status: none, active, canceled, past_due';
COMMENT ON COLUMN public.profiles.subscription_end IS 'When the current subscription period ends';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription ID for managing the subscription';