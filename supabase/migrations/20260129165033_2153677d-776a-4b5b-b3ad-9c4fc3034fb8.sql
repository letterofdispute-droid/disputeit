-- Drop the dangerously permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert purchases" ON public.letter_purchases;

-- Drop the dangerously permissive UPDATE policy
DROP POLICY IF EXISTS "Service role can update purchases" ON public.letter_purchases;

-- Create a secure INSERT policy - only authenticated users can insert their own records
-- Note: Service role (used by edge functions) bypasses RLS, so edge function inserts still work
CREATE POLICY "Authenticated users can insert own purchases"
ON public.letter_purchases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy needed for regular users - all updates go through edge functions using service role
-- Service role bypasses RLS, so the edge function updates will continue to work