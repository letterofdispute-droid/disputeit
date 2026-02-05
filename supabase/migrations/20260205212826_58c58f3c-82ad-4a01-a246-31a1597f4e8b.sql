-- Add editing access columns to letter_purchases
ALTER TABLE public.letter_purchases
ADD COLUMN IF NOT EXISTS edit_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_edited_content text,
ADD COLUMN IF NOT EXISTS last_edited_at timestamp with time zone;

-- For existing pdf-editable purchases, grant 30-day access from now
UPDATE public.letter_purchases
SET edit_expires_at = NOW() + INTERVAL '30 days'
WHERE purchase_type = 'pdf-editable'
  AND edit_expires_at IS NULL;

-- Add RLS policy for users to update their own letters for editing
CREATE POLICY "Users can update their own letters for editing"
ON public.letter_purchases
FOR UPDATE
USING (auth.uid() = user_id OR email = auth.email())
WITH CHECK (auth.uid() = user_id OR email = auth.email());