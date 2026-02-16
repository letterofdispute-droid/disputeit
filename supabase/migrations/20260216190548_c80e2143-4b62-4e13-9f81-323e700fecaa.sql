
-- Add follow-up tracking columns to letter_purchases
ALTER TABLE public.letter_purchases
ADD COLUMN follow_up_due_at timestamp with time zone DEFAULT NULL,
ADD COLUMN follow_up_sent_at timestamp with time zone DEFAULT NULL,
ADD COLUMN resolution_status text DEFAULT NULL; -- 'resolved', 'unresolved', 'escalated'

-- Set follow_up_due_at for all existing completed purchases that haven't been followed up
UPDATE public.letter_purchases
SET follow_up_due_at = created_at + INTERVAL '14 days'
WHERE status = 'completed'
  AND follow_up_due_at IS NULL
  AND follow_up_sent_at IS NULL;

-- Index for efficient querying of due follow-ups
CREATE INDEX idx_letter_purchases_follow_up_due
ON public.letter_purchases (follow_up_due_at)
WHERE follow_up_due_at IS NOT NULL
  AND follow_up_sent_at IS NULL
  AND status = 'completed';
