
-- Step 1: Normalize all legacy category_id values in content_plans
UPDATE public.content_plans SET category_id = 
  CASE
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('contractors', 'contractors-home-improvement') THEN 'contractors'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('damaged-goods', 'damaged--goods') THEN 'damaged-goods'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('hoa', 'hoa--property', 'neighbor-hoa-disputes', 'hoa-property') THEN 'hoa'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('housing', 'landlord-housing', 'landlord--housing') THEN 'housing'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('financial', 'financial-services') THEN 'financial'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('insurance', 'insurance-claims') THEN 'insurance'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('vehicle', 'vehicle-auto', 'vehicle--auto') THEN 'vehicle'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('employment', 'employment-workplace', 'employment--workplace') THEN 'employment'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('utilities', 'utilities-telecommunications', 'utilities--telecommunications') THEN 'utilities'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('ecommerce', 'e-commerce', 'e-commerce-online-services') THEN 'ecommerce'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('healthcare', 'healthcare-medical', 'healthcare-medical-billing') THEN 'healthcare'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('travel', 'travel-transportation', 'travel--transportation') THEN 'travel'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('refunds') THEN 'refunds'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('mortgage') THEN 'mortgage'
    ELSE lower(regexp_replace(regexp_replace(category_id, '[^a-zA-Z0-9-]', '-', 'g'), '-+', '-', 'g'))
  END
WHERE category_id ~ '[A-Z ]|&';

-- Step 2: Backfill subcategory_slug where null
UPDATE public.content_plans SET subcategory_slug = 'general' WHERE subcategory_slug IS NULL;

-- Step 3: Also normalize article_embeddings category_id for consistency
UPDATE public.article_embeddings SET category_id = 
  CASE
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('contractors', 'contractors-home-improvement') THEN 'contractors'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('damaged-goods', 'damaged--goods') THEN 'damaged-goods'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('hoa', 'hoa--property', 'neighbor-hoa-disputes', 'hoa-property') THEN 'hoa'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('housing', 'landlord-housing', 'landlord--housing') THEN 'housing'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('financial', 'financial-services') THEN 'financial'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('insurance', 'insurance-claims') THEN 'insurance'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('vehicle', 'vehicle-auto', 'vehicle--auto') THEN 'vehicle'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('employment', 'employment-workplace', 'employment--workplace') THEN 'employment'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('utilities', 'utilities-telecommunications', 'utilities--telecommunications') THEN 'utilities'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('ecommerce', 'e-commerce', 'e-commerce-online-services') THEN 'ecommerce'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('healthcare', 'healthcare-medical', 'healthcare-medical-billing') THEN 'healthcare'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('travel', 'travel-transportation', 'travel--transportation') THEN 'travel'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('refunds') THEN 'refunds'
    WHEN lower(replace(replace(category_id, ' ', '-'), '&', '')) IN ('mortgage') THEN 'mortgage'
    ELSE lower(regexp_replace(regexp_replace(category_id, '[^a-zA-Z0-9-]', '-', 'g'), '-+', '-', 'g'))
  END
WHERE category_id ~ '[A-Z ]|&';

-- Step 4: Create trigger to normalize category_id on insert/update
CREATE OR REPLACE FUNCTION normalize_category_id()
RETURNS TRIGGER AS $$
DECLARE
  valid_ids TEXT[] := ARRAY['refunds','housing','travel','damaged-goods','utilities','financial','insurance','vehicle','healthcare','employment','ecommerce','hoa','contractors','mortgage'];
  normalized TEXT;
BEGIN
  -- Normalize: lowercase, replace spaces/& with hyphens, collapse multiple hyphens
  normalized := lower(regexp_replace(regexp_replace(NEW.category_id, '[^a-zA-Z0-9-]', '-', 'g'), '-+', '-', 'g'));
  normalized := trim(BOTH '-' FROM normalized);
  
  -- Map known aliases
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
  
  -- Backfill subcategory_slug if null
  IF TG_TABLE_NAME = 'content_plans' AND NEW.subcategory_slug IS NULL THEN
    NEW.subcategory_slug := 'general';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to content_plans
DROP TRIGGER IF EXISTS trg_normalize_category_id_content_plans ON public.content_plans;
CREATE TRIGGER trg_normalize_category_id_content_plans
  BEFORE INSERT OR UPDATE OF category_id ON public.content_plans
  FOR EACH ROW EXECUTE FUNCTION normalize_category_id();

-- Apply trigger to article_embeddings  
DROP TRIGGER IF EXISTS trg_normalize_category_id_article_embeddings ON public.article_embeddings;
CREATE TRIGGER trg_normalize_category_id_article_embeddings
  BEFORE INSERT OR UPDATE OF category_id ON public.article_embeddings
  FOR EACH ROW EXECUTE FUNCTION normalize_category_id();
