
-- Fix search_path on the normalize_category_id function
CREATE OR REPLACE FUNCTION public.normalize_category_id()
RETURNS TRIGGER
SET search_path = ''
AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := lower(regexp_replace(regexp_replace(NEW.category_id, '[^a-zA-Z0-9-]', '-', 'g'), '-+', '-', 'g'));
  normalized := trim(BOTH '-' FROM normalized);
  
  normalized := CASE normalized
    WHEN 'contractors-home-improvement' THEN 'contractors'
    WHEN 'damaged--goods' THEN 'damaged-goods'
    WHEN 'hoa--property' THEN 'hoa'
    WHEN 'hoa-property' THEN 'hoa'
    WHEN 'neighbor-hoa-disputes' THEN 'hoa'
    WHEN 'landlord-housing' THEN 'housing'
    WHEN 'landlord--housing' THEN 'housing'
    WHEN 'financial-services' THEN 'financial'
    WHEN 'insurance-claims' THEN 'insurance'
    WHEN 'vehicle-auto' THEN 'vehicle'
    WHEN 'vehicle--auto' THEN 'vehicle'
    WHEN 'employment-workplace' THEN 'employment'
    WHEN 'employment--workplace' THEN 'employment'
    WHEN 'utilities-telecommunications' THEN 'utilities'
    WHEN 'utilities--telecommunications' THEN 'utilities'
    WHEN 'e-commerce' THEN 'ecommerce'
    WHEN 'e-commerce-online-services' THEN 'ecommerce'
    WHEN 'healthcare-medical' THEN 'healthcare'
    WHEN 'healthcare-medical-billing' THEN 'healthcare'
    WHEN 'travel-transportation' THEN 'travel'
    WHEN 'travel--transportation' THEN 'travel'
    ELSE normalized
  END;

  NEW.category_id := normalized;
  
  IF TG_TABLE_NAME = 'content_plans' AND NEW.subcategory_slug IS NULL THEN
    NEW.subcategory_slug := 'general';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
