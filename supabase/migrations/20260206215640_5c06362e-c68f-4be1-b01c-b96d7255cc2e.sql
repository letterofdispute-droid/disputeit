-- Add refund columns to letter_purchases
ALTER TABLE public.letter_purchases 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Create refund_logs table for audit trail
CREATE TABLE public.refund_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.letter_purchases(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  reason TEXT,
  stripe_refund_id TEXT,
  processed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refund_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view refund logs
CREATE POLICY "Admins can view refund logs"
ON public.refund_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Only admins can create refund logs
CREATE POLICY "Admins can create refund logs"
ON public.refund_logs
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_refund_logs_purchase_id ON public.refund_logs(purchase_id);
CREATE INDEX idx_letter_purchases_status ON public.letter_purchases(status);
CREATE INDEX idx_letter_purchases_created_at ON public.letter_purchases(created_at DESC);