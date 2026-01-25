-- Create letter_purchases table to track user purchases
CREATE TABLE public.letter_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  template_slug TEXT NOT NULL,
  template_name TEXT NOT NULL,
  letter_content TEXT NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('pdf-only', 'pdf-editable')),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  pdf_url TEXT,
  docx_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letter_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own purchases" 
ON public.letter_purchases 
FOR SELECT 
USING (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Anyone can insert purchases" 
ON public.letter_purchases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update purchases" 
ON public.letter_purchases 
FOR UPDATE 
USING (true);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases" 
ON public.letter_purchases 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_letter_purchases_updated_at
BEFORE UPDATE ON public.letter_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for generated letters
INSERT INTO storage.buckets (id, name, public) VALUES ('letters', 'letters', false);

-- Storage policies - users can only access their own letters
CREATE POLICY "Users can view their own letters"
ON storage.objects
FOR SELECT
USING (bucket_id = 'letters' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can insert letters"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'letters');