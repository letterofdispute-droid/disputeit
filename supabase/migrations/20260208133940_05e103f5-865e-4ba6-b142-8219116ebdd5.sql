-- Add evidence_photos column to letter_purchases table
ALTER TABLE letter_purchases 
ADD COLUMN IF NOT EXISTS evidence_photos JSONB DEFAULT '[]';