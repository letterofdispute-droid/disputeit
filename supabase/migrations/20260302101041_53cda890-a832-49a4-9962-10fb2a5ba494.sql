
-- 1. Add page_group column
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS page_group text;

-- 2. Add unique constraint on slug
ALTER TABLE public.pages ADD CONSTRAINT pages_slug_unique UNIQUE (slug);

-- 3. Update existing pages with page_group values
UPDATE public.pages SET page_group = 'static' WHERE slug IN ('/', 'how-it-works', 'pricing', 'faq', 'about', 'contact', 'templates', 'articles', 'guides');
UPDATE public.pages SET page_group = 'legal' WHERE slug IN ('terms', 'privacy', 'disclaimer', 'cookie-policy');
UPDATE public.pages SET page_group = 'tool' WHERE slug IN ('state-rights', 'deadlines', 'consumer-news', 'analyze-letter', 'do-i-have-a-case');
UPDATE public.pages SET page_group = 'tool' WHERE slug IN ('small-claims', 'small-claims/cost-calculator', 'small-claims/demand-letter-cost', 'small-claims/escalation-guide', 'small-claims/statement-generator');

-- 4. Group A — Template category pages (14 rows)
INSERT INTO public.pages (title, slug, status, page_type, page_group, sort_order) VALUES
  ('Refunds & Purchases Templates', 'templates/refunds', 'published', 'system', 'template', 100),
  ('Landlord & Housing Templates', 'templates/housing', 'published', 'system', 'template', 101),
  ('Travel & Transportation Templates', 'templates/travel', 'published', 'system', 'template', 102),
  ('Damaged & Defective Goods Templates', 'templates/damaged-goods', 'published', 'system', 'template', 103),
  ('Utilities & Telecommunications Templates', 'templates/utilities', 'published', 'system', 'template', 104),
  ('Financial Services Templates', 'templates/financial', 'published', 'system', 'template', 105),
  ('Insurance Claims Templates', 'templates/insurance', 'published', 'system', 'template', 106),
  ('Vehicle & Auto Templates', 'templates/vehicle', 'published', 'system', 'template', 107),
  ('Healthcare & Medical Billing Templates', 'templates/healthcare', 'published', 'system', 'template', 108),
  ('Employment & Workplace Templates', 'templates/employment', 'published', 'system', 'template', 109),
  ('E-commerce & Online Services Templates', 'templates/ecommerce', 'published', 'system', 'template', 110),
  ('Neighbor & HOA Disputes Templates', 'templates/hoa', 'published', 'system', 'template', 111),
  ('Contractors & Home Improvement Templates', 'templates/contractors', 'published', 'system', 'template', 112),
  ('Real Estate & Mortgages Templates', 'templates/mortgage', 'published', 'system', 'template', 113)
ON CONFLICT (slug) DO NOTHING;

-- 5. Group B — Guide category pages (14 rows)
INSERT INTO public.pages (title, slug, status, page_type, page_group, sort_order) VALUES
  ('Refunds & Purchases Guide', 'guides/refunds', 'published', 'system', 'guide', 200),
  ('Landlord & Housing Guide', 'guides/housing', 'published', 'system', 'guide', 201),
  ('Travel & Transportation Guide', 'guides/travel', 'published', 'system', 'guide', 202),
  ('Damaged & Defective Goods Guide', 'guides/damaged-goods', 'published', 'system', 'guide', 203),
  ('Utilities & Telecommunications Guide', 'guides/utilities', 'published', 'system', 'guide', 204),
  ('Financial Services Guide', 'guides/financial', 'published', 'system', 'guide', 205),
  ('Insurance Claims Guide', 'guides/insurance', 'published', 'system', 'guide', 206),
  ('Vehicle & Auto Guide', 'guides/vehicle', 'published', 'system', 'guide', 207),
  ('Healthcare & Medical Billing Guide', 'guides/healthcare', 'published', 'system', 'guide', 208),
  ('Employment & Workplace Guide', 'guides/employment', 'published', 'system', 'guide', 209),
  ('E-commerce & Online Services Guide', 'guides/ecommerce', 'published', 'system', 'guide', 210),
  ('Neighbor & HOA Disputes Guide', 'guides/hoa', 'published', 'system', 'guide', 211),
  ('Contractors & Home Improvement Guide', 'guides/contractors', 'published', 'system', 'guide', 212),
  ('Real Estate & Mortgages Guide', 'guides/mortgage', 'published', 'system', 'guide', 213)
ON CONFLICT (slug) DO NOTHING;

-- 6. Group C — State rights hubs (51 rows)
INSERT INTO public.pages (title, slug, status, page_type, page_group, sort_order) VALUES
  ('Alabama Consumer Rights', 'state-rights/alabama', 'published', 'system', 'state-rights', 300),
  ('Alaska Consumer Rights', 'state-rights/alaska', 'published', 'system', 'state-rights', 300),
  ('Arizona Consumer Rights', 'state-rights/arizona', 'published', 'system', 'state-rights', 300),
  ('Arkansas Consumer Rights', 'state-rights/arkansas', 'published', 'system', 'state-rights', 300),
  ('California Consumer Rights', 'state-rights/california', 'published', 'system', 'state-rights', 300),
  ('Colorado Consumer Rights', 'state-rights/colorado', 'published', 'system', 'state-rights', 300),
  ('Connecticut Consumer Rights', 'state-rights/connecticut', 'published', 'system', 'state-rights', 300),
  ('Delaware Consumer Rights', 'state-rights/delaware', 'published', 'system', 'state-rights', 300),
  ('Florida Consumer Rights', 'state-rights/florida', 'published', 'system', 'state-rights', 300),
  ('Georgia Consumer Rights', 'state-rights/georgia', 'published', 'system', 'state-rights', 300),
  ('Hawaii Consumer Rights', 'state-rights/hawaii', 'published', 'system', 'state-rights', 300),
  ('Idaho Consumer Rights', 'state-rights/idaho', 'published', 'system', 'state-rights', 300),
  ('Illinois Consumer Rights', 'state-rights/illinois', 'published', 'system', 'state-rights', 300),
  ('Indiana Consumer Rights', 'state-rights/indiana', 'published', 'system', 'state-rights', 300),
  ('Iowa Consumer Rights', 'state-rights/iowa', 'published', 'system', 'state-rights', 300),
  ('Kansas Consumer Rights', 'state-rights/kansas', 'published', 'system', 'state-rights', 300),
  ('Kentucky Consumer Rights', 'state-rights/kentucky', 'published', 'system', 'state-rights', 300),
  ('Louisiana Consumer Rights', 'state-rights/louisiana', 'published', 'system', 'state-rights', 300),
  ('Maine Consumer Rights', 'state-rights/maine', 'published', 'system', 'state-rights', 300),
  ('Maryland Consumer Rights', 'state-rights/maryland', 'published', 'system', 'state-rights', 300),
  ('Massachusetts Consumer Rights', 'state-rights/massachusetts', 'published', 'system', 'state-rights', 300),
  ('Michigan Consumer Rights', 'state-rights/michigan', 'published', 'system', 'state-rights', 300),
  ('Minnesota Consumer Rights', 'state-rights/minnesota', 'published', 'system', 'state-rights', 300),
  ('Mississippi Consumer Rights', 'state-rights/mississippi', 'published', 'system', 'state-rights', 300),
  ('Missouri Consumer Rights', 'state-rights/missouri', 'published', 'system', 'state-rights', 300),
  ('Montana Consumer Rights', 'state-rights/montana', 'published', 'system', 'state-rights', 300),
  ('Nebraska Consumer Rights', 'state-rights/nebraska', 'published', 'system', 'state-rights', 300),
  ('Nevada Consumer Rights', 'state-rights/nevada', 'published', 'system', 'state-rights', 300),
  ('New Hampshire Consumer Rights', 'state-rights/new-hampshire', 'published', 'system', 'state-rights', 300),
  ('New Jersey Consumer Rights', 'state-rights/new-jersey', 'published', 'system', 'state-rights', 300),
  ('New Mexico Consumer Rights', 'state-rights/new-mexico', 'published', 'system', 'state-rights', 300),
  ('New York Consumer Rights', 'state-rights/new-york', 'published', 'system', 'state-rights', 300),
  ('North Carolina Consumer Rights', 'state-rights/north-carolina', 'published', 'system', 'state-rights', 300),
  ('North Dakota Consumer Rights', 'state-rights/north-dakota', 'published', 'system', 'state-rights', 300),
  ('Ohio Consumer Rights', 'state-rights/ohio', 'published', 'system', 'state-rights', 300),
  ('Oklahoma Consumer Rights', 'state-rights/oklahoma', 'published', 'system', 'state-rights', 300),
  ('Oregon Consumer Rights', 'state-rights/oregon', 'published', 'system', 'state-rights', 300),
  ('Pennsylvania Consumer Rights', 'state-rights/pennsylvania', 'published', 'system', 'state-rights', 300),
  ('Rhode Island Consumer Rights', 'state-rights/rhode-island', 'published', 'system', 'state-rights', 300),
  ('South Carolina Consumer Rights', 'state-rights/south-carolina', 'published', 'system', 'state-rights', 300),
  ('South Dakota Consumer Rights', 'state-rights/south-dakota', 'published', 'system', 'state-rights', 300),
  ('Tennessee Consumer Rights', 'state-rights/tennessee', 'published', 'system', 'state-rights', 300),
  ('Texas Consumer Rights', 'state-rights/texas', 'published', 'system', 'state-rights', 300),
  ('Utah Consumer Rights', 'state-rights/utah', 'published', 'system', 'state-rights', 300),
  ('Vermont Consumer Rights', 'state-rights/vermont', 'published', 'system', 'state-rights', 300),
  ('Virginia Consumer Rights', 'state-rights/virginia', 'published', 'system', 'state-rights', 300),
  ('Washington Consumer Rights', 'state-rights/washington', 'published', 'system', 'state-rights', 300),
  ('West Virginia Consumer Rights', 'state-rights/west-virginia', 'published', 'system', 'state-rights', 300),
  ('Wisconsin Consumer Rights', 'state-rights/wisconsin', 'published', 'system', 'state-rights', 300),
  ('Wyoming Consumer Rights', 'state-rights/wyoming', 'published', 'system', 'state-rights', 300),
  ('District of Columbia Consumer Rights', 'state-rights/district-of-columbia', 'published', 'system', 'state-rights', 300)
ON CONFLICT (slug) DO NOTHING;

-- 7. Group D — State rights category pages (51 states × 13 categories = 663 rows)
-- Using a cross join approach
INSERT INTO public.pages (title, slug, status, page_type, page_group, sort_order)
SELECT 
  s.state_name || ' ' || c.cat_label || ' Rights' as title,
  'state-rights/' || s.state_slug || '/' || c.cat_key as slug,
  'published' as status,
  'system' as page_type,
  'state-rights' as page_group,
  400 as sort_order
FROM (VALUES
  ('alabama', 'Alabama'), ('alaska', 'Alaska'), ('arizona', 'Arizona'), ('arkansas', 'Arkansas'),
  ('california', 'California'), ('colorado', 'Colorado'), ('connecticut', 'Connecticut'), ('delaware', 'Delaware'),
  ('florida', 'Florida'), ('georgia', 'Georgia'), ('hawaii', 'Hawaii'), ('idaho', 'Idaho'),
  ('illinois', 'Illinois'), ('indiana', 'Indiana'), ('iowa', 'Iowa'), ('kansas', 'Kansas'),
  ('kentucky', 'Kentucky'), ('louisiana', 'Louisiana'), ('maine', 'Maine'), ('maryland', 'Maryland'),
  ('massachusetts', 'Massachusetts'), ('michigan', 'Michigan'), ('minnesota', 'Minnesota'), ('mississippi', 'Mississippi'),
  ('missouri', 'Missouri'), ('montana', 'Montana'), ('nebraska', 'Nebraska'), ('nevada', 'Nevada'),
  ('new-hampshire', 'New Hampshire'), ('new-jersey', 'New Jersey'), ('new-mexico', 'New Mexico'), ('new-york', 'New York'),
  ('north-carolina', 'North Carolina'), ('north-dakota', 'North Dakota'), ('ohio', 'Ohio'), ('oklahoma', 'Oklahoma'),
  ('oregon', 'Oregon'), ('pennsylvania', 'Pennsylvania'), ('rhode-island', 'Rhode Island'), ('south-carolina', 'South Carolina'),
  ('south-dakota', 'South Dakota'), ('tennessee', 'Tennessee'), ('texas', 'Texas'), ('utah', 'Utah'),
  ('vermont', 'Vermont'), ('virginia', 'Virginia'), ('washington', 'Washington'), ('west-virginia', 'West Virginia'),
  ('wisconsin', 'Wisconsin'), ('wyoming', 'Wyoming'), ('district-of-columbia', 'District of Columbia')
) AS s(state_slug, state_name)
CROSS JOIN (VALUES
  ('vehicle', 'Vehicle'), ('housing', 'Housing'), ('insurance', 'Insurance'), ('financial', 'Financial'),
  ('contractors', 'Contractors'), ('damaged-goods', 'Damaged Goods'), ('refunds', 'Refunds'),
  ('travel', 'Travel'), ('utilities', 'Utilities'), ('employment', 'Employment'),
  ('ecommerce', 'E-Commerce'), ('hoa', 'HOA'), ('healthcare', 'Healthcare')
) AS c(cat_key, cat_label)
ON CONFLICT (slug) DO NOTHING;

-- 8. Group E — Small claims state pages (51 rows)
INSERT INTO public.pages (title, slug, status, page_type, page_group, sort_order) VALUES
  ('Alabama Small Claims Court', 'small-claims/alabama', 'published', 'system', 'small-claims', 500),
  ('Alaska Small Claims Court', 'small-claims/alaska', 'published', 'system', 'small-claims', 500),
  ('Arizona Small Claims Court', 'small-claims/arizona', 'published', 'system', 'small-claims', 500),
  ('Arkansas Small Claims Court', 'small-claims/arkansas', 'published', 'system', 'small-claims', 500),
  ('California Small Claims Court', 'small-claims/california', 'published', 'system', 'small-claims', 500),
  ('Colorado Small Claims Court', 'small-claims/colorado', 'published', 'system', 'small-claims', 500),
  ('Connecticut Small Claims Court', 'small-claims/connecticut', 'published', 'system', 'small-claims', 500),
  ('Delaware Small Claims Court', 'small-claims/delaware', 'published', 'system', 'small-claims', 500),
  ('Florida Small Claims Court', 'small-claims/florida', 'published', 'system', 'small-claims', 500),
  ('Georgia Small Claims Court', 'small-claims/georgia', 'published', 'system', 'small-claims', 500),
  ('Hawaii Small Claims Court', 'small-claims/hawaii', 'published', 'system', 'small-claims', 500),
  ('Idaho Small Claims Court', 'small-claims/idaho', 'published', 'system', 'small-claims', 500),
  ('Illinois Small Claims Court', 'small-claims/illinois', 'published', 'system', 'small-claims', 500),
  ('Indiana Small Claims Court', 'small-claims/indiana', 'published', 'system', 'small-claims', 500),
  ('Iowa Small Claims Court', 'small-claims/iowa', 'published', 'system', 'small-claims', 500),
  ('Kansas Small Claims Court', 'small-claims/kansas', 'published', 'system', 'small-claims', 500),
  ('Kentucky Small Claims Court', 'small-claims/kentucky', 'published', 'system', 'small-claims', 500),
  ('Louisiana Small Claims Court', 'small-claims/louisiana', 'published', 'system', 'small-claims', 500),
  ('Maine Small Claims Court', 'small-claims/maine', 'published', 'system', 'small-claims', 500),
  ('Maryland Small Claims Court', 'small-claims/maryland', 'published', 'system', 'small-claims', 500),
  ('Massachusetts Small Claims Court', 'small-claims/massachusetts', 'published', 'system', 'small-claims', 500),
  ('Michigan Small Claims Court', 'small-claims/michigan', 'published', 'system', 'small-claims', 500),
  ('Minnesota Small Claims Court', 'small-claims/minnesota', 'published', 'system', 'small-claims', 500),
  ('Mississippi Small Claims Court', 'small-claims/mississippi', 'published', 'system', 'small-claims', 500),
  ('Missouri Small Claims Court', 'small-claims/missouri', 'published', 'system', 'small-claims', 500),
  ('Montana Small Claims Court', 'small-claims/montana', 'published', 'system', 'small-claims', 500),
  ('Nebraska Small Claims Court', 'small-claims/nebraska', 'published', 'system', 'small-claims', 500),
  ('Nevada Small Claims Court', 'small-claims/nevada', 'published', 'system', 'small-claims', 500),
  ('New Hampshire Small Claims Court', 'small-claims/new-hampshire', 'published', 'system', 'small-claims', 500),
  ('New Jersey Small Claims Court', 'small-claims/new-jersey', 'published', 'system', 'small-claims', 500),
  ('New Mexico Small Claims Court', 'small-claims/new-mexico', 'published', 'system', 'small-claims', 500),
  ('New York Small Claims Court', 'small-claims/new-york', 'published', 'system', 'small-claims', 500),
  ('North Carolina Small Claims Court', 'small-claims/north-carolina', 'published', 'system', 'small-claims', 500),
  ('North Dakota Small Claims Court', 'small-claims/north-dakota', 'published', 'system', 'small-claims', 500),
  ('Ohio Small Claims Court', 'small-claims/ohio', 'published', 'system', 'small-claims', 500),
  ('Oklahoma Small Claims Court', 'small-claims/oklahoma', 'published', 'system', 'small-claims', 500),
  ('Oregon Small Claims Court', 'small-claims/oregon', 'published', 'system', 'small-claims', 500),
  ('Pennsylvania Small Claims Court', 'small-claims/pennsylvania', 'published', 'system', 'small-claims', 500),
  ('Rhode Island Small Claims Court', 'small-claims/rhode-island', 'published', 'system', 'small-claims', 500),
  ('South Carolina Small Claims Court', 'small-claims/south-carolina', 'published', 'system', 'small-claims', 500),
  ('South Dakota Small Claims Court', 'small-claims/south-dakota', 'published', 'system', 'small-claims', 500),
  ('Tennessee Small Claims Court', 'small-claims/tennessee', 'published', 'system', 'small-claims', 500),
  ('Texas Small Claims Court', 'small-claims/texas', 'published', 'system', 'small-claims', 500),
  ('Utah Small Claims Court', 'small-claims/utah', 'published', 'system', 'small-claims', 500),
  ('Vermont Small Claims Court', 'small-claims/vermont', 'published', 'system', 'small-claims', 500),
  ('Virginia Small Claims Court', 'small-claims/virginia', 'published', 'system', 'small-claims', 500),
  ('Washington Small Claims Court', 'small-claims/washington', 'published', 'system', 'small-claims', 500),
  ('West Virginia Small Claims Court', 'small-claims/west-virginia', 'published', 'system', 'small-claims', 500),
  ('Wisconsin Small Claims Court', 'small-claims/wisconsin', 'published', 'system', 'small-claims', 500),
  ('Wyoming Small Claims Court', 'small-claims/wyoming', 'published', 'system', 'small-claims', 500),
  ('District of Columbia Small Claims Court', 'small-claims/district-of-columbia', 'published', 'system', 'small-claims', 500)
ON CONFLICT (slug) DO NOTHING;

-- 9. Group F — Subcategory pages
INSERT INTO public.pages (title, slug, status, page_type, page_group, sort_order) VALUES
  -- Contractors subcategories
  ('General Contractor Templates', 'templates/contractors/general', 'published', 'system', 'template', 150),
  ('Plumbing Templates', 'templates/contractors/plumbing', 'published', 'system', 'template', 150),
  ('Electrical Templates', 'templates/contractors/electrical', 'published', 'system', 'template', 150),
  ('Roofing Templates', 'templates/contractors/roofing', 'published', 'system', 'template', 150),
  ('HVAC Templates', 'templates/contractors/hvac', 'published', 'system', 'template', 150),
  ('Landscaping Templates', 'templates/contractors/landscaping', 'published', 'system', 'template', 150),
  ('Flooring & Painting Templates', 'templates/contractors/flooring-painting', 'published', 'system', 'template', 150),
  ('Kitchen & Bath Templates', 'templates/contractors/kitchen-bath', 'published', 'system', 'template', 150),
  ('Windows & Doors Templates', 'templates/contractors/windows-doors', 'published', 'system', 'template', 150),
  ('Specialty Services Templates', 'templates/contractors/specialty', 'published', 'system', 'template', 150),
  -- Healthcare subcategories
  ('Insurance Claims Templates', 'templates/healthcare/insurance-claims', 'published', 'system', 'template', 150),
  ('Medical Billing Templates', 'templates/healthcare/billing', 'published', 'system', 'template', 150),
  ('Debt Collection Templates', 'templates/healthcare/debt-collection', 'published', 'system', 'template', 150),
  ('Provider Complaints Templates', 'templates/healthcare/provider', 'published', 'system', 'template', 150),
  ('Pharmacy Issues Templates', 'templates/healthcare/pharmacy', 'published', 'system', 'template', 150),
  ('Privacy & Records Templates', 'templates/healthcare/privacy-records', 'published', 'system', 'template', 150),
  -- Insurance subcategories
  ('Auto Insurance Templates', 'templates/insurance/auto', 'published', 'system', 'template', 150),
  ('Home Insurance Templates', 'templates/insurance/home', 'published', 'system', 'template', 150),
  ('Health Insurance Templates', 'templates/insurance/health', 'published', 'system', 'template', 150),
  ('Life Insurance Templates', 'templates/insurance/life', 'published', 'system', 'template', 150),
  ('Travel Insurance Templates', 'templates/insurance/travel', 'published', 'system', 'template', 150),
  ('Pet Insurance Templates', 'templates/insurance/pet', 'published', 'system', 'template', 150),
  ('Business Insurance Templates', 'templates/insurance/business', 'published', 'system', 'template', 150),
  -- Housing subcategories
  ('Repair & Maintenance Templates', 'templates/housing/repairs', 'published', 'system', 'template', 150),
  ('Deposits & Move-Out Templates', 'templates/housing/deposits', 'published', 'system', 'template', 150),
  ('Tenancy Disputes Templates', 'templates/housing/tenancy', 'published', 'system', 'template', 150),
  ('Neighbor Issues Templates', 'templates/housing/neighbor', 'published', 'system', 'template', 150),
  ('Letting Agents Templates', 'templates/housing/letting-agents', 'published', 'system', 'template', 150),
  ('Safety & Compliance Templates', 'templates/housing/safety', 'published', 'system', 'template', 150),
  -- Travel subcategories
  ('Flights Templates', 'templates/travel/flights', 'published', 'system', 'template', 150),
  ('Hotels Templates', 'templates/travel/hotels', 'published', 'system', 'template', 150),
  ('Cruises Templates', 'templates/travel/cruises', 'published', 'system', 'template', 150),
  ('Car Rentals Templates', 'templates/travel/car-rentals', 'published', 'system', 'template', 150),
  ('Tours & Packages Templates', 'templates/travel/tours', 'published', 'system', 'template', 150),
  ('Rail & Bus Templates', 'templates/travel/rail-bus', 'published', 'system', 'template', 150),
  -- Employment subcategories
  ('Wages & Pay Templates', 'templates/employment/wages', 'published', 'system', 'template', 150),
  ('Termination Templates', 'templates/employment/termination', 'published', 'system', 'template', 150),
  ('Sexual Harassment Templates', 'templates/employment/sexual-harassment', 'published', 'system', 'template', 150),
  ('Workplace Mobbing Templates', 'templates/employment/mobbing', 'published', 'system', 'template', 150),
  ('Retaliation & Leave Templates', 'templates/employment/retaliation', 'published', 'system', 'template', 150),
  ('Hostile Work Environment Templates', 'templates/employment/hostile-environment', 'published', 'system', 'template', 150),
  ('Discrimination Templates', 'templates/employment/discrimination', 'published', 'system', 'template', 150),
  ('Benefits Templates', 'templates/employment/benefits', 'published', 'system', 'template', 150),
  ('Workplace Conditions Templates', 'templates/employment/workplace', 'published', 'system', 'template', 150),
  -- Utilities subcategories
  ('Energy Templates', 'templates/utilities/energy', 'published', 'system', 'template', 150),
  ('Water Templates', 'templates/utilities/water', 'published', 'system', 'template', 150),
  ('Internet Templates', 'templates/utilities/internet', 'published', 'system', 'template', 150),
  ('Phone & Mobile Templates', 'templates/utilities/phone', 'published', 'system', 'template', 150),
  ('TV & Cable Templates', 'templates/utilities/tv-cable', 'published', 'system', 'template', 150),
  -- Financial subcategories
  ('Banking Templates', 'templates/financial/banking', 'published', 'system', 'template', 150),
  ('Credit Cards Templates', 'templates/financial/credit-cards', 'published', 'system', 'template', 150),
  ('Loans Templates', 'templates/financial/loans', 'published', 'system', 'template', 150),
  ('Credit Reporting Templates', 'templates/financial/credit-reporting', 'published', 'system', 'template', 150),
  ('Debt Collection Financial Templates', 'templates/financial/debt-collection', 'published', 'system', 'template', 150),
  ('Identity Theft Templates', 'templates/financial/identity-theft', 'published', 'system', 'template', 150),
  ('Investments Templates', 'templates/financial/investments', 'published', 'system', 'template', 150),
  ('Fraud & Scams Templates', 'templates/financial/fraud', 'published', 'system', 'template', 150),
  -- Refunds subcategories
  ('Refunds Templates', 'templates/refunds/refunds', 'published', 'system', 'template', 150),
  ('Warranty Templates', 'templates/refunds/warranty', 'published', 'system', 'template', 150),
  ('Subscriptions Templates', 'templates/refunds/subscriptions', 'published', 'system', 'template', 150),
  ('Delivery Issues Templates', 'templates/refunds/delivery', 'published', 'system', 'template', 150),
  ('Service Complaints Templates', 'templates/refunds/service', 'published', 'system', 'template', 150),
  -- Damaged Goods subcategories
  ('Delivery Damage Templates', 'templates/damaged-goods/delivery-damage', 'published', 'system', 'template', 150),
  ('Defective Products Templates', 'templates/damaged-goods/defective', 'published', 'system', 'template', 150),
  ('Misrepresentation Templates', 'templates/damaged-goods/misrepresentation', 'published', 'system', 'template', 150),
  ('Warranty & Repair Templates', 'templates/damaged-goods/warranty-repair', 'published', 'system', 'template', 150),
  -- Vehicle subcategories
  ('Dealer Disputes Templates', 'templates/vehicle/dealer', 'published', 'system', 'template', 150),
  ('Repair & Service Templates', 'templates/vehicle/repair', 'published', 'system', 'template', 150),
  ('Warranty & Lemon Law Templates', 'templates/vehicle/warranty-lemon', 'published', 'system', 'template', 150),
  ('Finance & Lease Templates', 'templates/vehicle/finance', 'published', 'system', 'template', 150),
  ('Parking & Traffic Templates', 'templates/vehicle/parking', 'published', 'system', 'template', 150),
  -- E-commerce subcategories
  ('E-commerce Refunds & Returns Templates', 'templates/ecommerce/refunds', 'published', 'system', 'template', 150),
  ('E-commerce Delivery Issues Templates', 'templates/ecommerce/delivery', 'published', 'system', 'template', 150),
  ('Marketplace Disputes Templates', 'templates/ecommerce/marketplace', 'published', 'system', 'template', 150),
  ('E-commerce Subscriptions Templates', 'templates/ecommerce/subscriptions', 'published', 'system', 'template', 150),
  ('Privacy & Data Templates', 'templates/ecommerce/privacy', 'published', 'system', 'template', 150),
  ('Consumer Protection Templates', 'templates/ecommerce/consumer-protection', 'published', 'system', 'template', 150),
  -- HOA subcategories
  ('Fees & Assessments Templates', 'templates/hoa/fees', 'published', 'system', 'template', 150),
  ('Violations & Fines Templates', 'templates/hoa/violations', 'published', 'system', 'template', 150),
  ('HOA Maintenance Templates', 'templates/hoa/maintenance', 'published', 'system', 'template', 150),
  ('HOA Neighbor Disputes Templates', 'templates/hoa/neighbor', 'published', 'system', 'template', 150),
  ('Governance Templates', 'templates/hoa/governance', 'published', 'system', 'template', 150),
  -- Mortgage subcategories
  ('Payment Issues Templates', 'templates/mortgage/payment-issues', 'published', 'system', 'template', 150),
  ('Escrow Templates', 'templates/mortgage/escrow', 'published', 'system', 'template', 150),
  ('PMI Templates', 'templates/mortgage/pmi', 'published', 'system', 'template', 150),
  ('Foreclosure & Modification Templates', 'templates/mortgage/foreclosure', 'published', 'system', 'template', 150),
  ('Closing & Payoff Templates', 'templates/mortgage/closing', 'published', 'system', 'template', 150),
  ('Force-Placed Insurance Templates', 'templates/mortgage/force-placed-insurance', 'published', 'system', 'template', 150),
  ('Inherited Property Templates', 'templates/mortgage/inherited', 'published', 'system', 'template', 150)
ON CONFLICT (slug) DO NOTHING;
