
-- Step 1: Insert 10 new blog categories (matching template verticals)
INSERT INTO public.blog_categories (slug, name, description) VALUES
  ('insurance', 'Insurance Claims', 'Expert guides on appealing denied claims, disputing settlements, and navigating insurance disputes.'),
  ('healthcare', 'Healthcare & Medical Billing', 'Advice on disputing medical bills, insurance denials, coding errors, and provider complaints.'),
  ('utilities', 'Utilities & Telecommunications', 'Tips for resolving billing errors, service quality issues, and telecom contract disputes.'),
  ('vehicle', 'Vehicle & Auto', 'Guides for dealer complaints, warranty disputes, lemon law claims, and repair issues.'),
  ('employment', 'Employment & Workplace', 'Resources for addressing wage issues, workplace discrimination, and termination disputes.'),
  ('housing', 'Landlord & Housing', 'Practical advice for tenants on repairs, deposits, safety issues, and letting agent disputes.'),
  ('travel', 'Travel & Transportation', 'How to claim compensation for flight delays, lost baggage, and booking issues.'),
  ('financial', 'Financial Services', 'Guides on challenging bank fees, credit report errors, debt collection, and identity theft.'),
  ('ecommerce', 'E-commerce & Online Services', 'Help with seller disputes, account problems, data privacy requests, and online refunds.'),
  ('hoa', 'Neighbor & HOA Disputes', 'Advice on community issues, fee disputes, neighbor conflicts, and HOA governance.')
ON CONFLICT DO NOTHING;
