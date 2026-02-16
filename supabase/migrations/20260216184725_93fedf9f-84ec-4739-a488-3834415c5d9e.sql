
-- 1. Create template_stats table
CREATE TABLE public.template_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  satisfaction_score NUMERIC(5,2) NOT NULL DEFAULT 95.0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  positive_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.template_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view template stats"
  ON public.template_stats FOR SELECT USING (true);

CREATE POLICY "Service role can manage template stats"
  ON public.template_stats FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage template stats"
  ON public.template_stats FOR ALL
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_template_stats_updated_at
  BEFORE UPDATE ON public.template_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed data using DO block
DO $$
DECLARE
  slugs TEXT[] := ARRAY[
    'store-return-refund','online-purchase-refund','defective-product-refund','subscription-cancellation-refund',
    'partial-refund-dispute','double-charge-dispute','price-match-refund','gift-card-refund',
    'restocking-fee-dispute','late-delivery-refund','wrong-item-refund','service-not-rendered-refund',
    'membership-cancellation-refund','event-cancellation-refund','digital-purchase-refund',
    'prepaid-service-refund','layaway-cancellation-refund','seasonal-item-return',
    'loyalty-reward-dispute','price-adjustment-request','food-delivery-refund','grocery-delivery-refund',
    'app-purchase-refund','streaming-service-refund','fitness-membership-refund',
    'professional-service-refund','catering-service-refund','photography-service-refund',
    'event-planning-refund','beauty-service-refund',
    'billing-dispute-overcharge','billing-dispute-unauthorized','billing-dispute-recurring',
    'billing-dispute-hidden-fees','billing-dispute-service-not-received',
    'landlord-repair-demand','rent-deposit-return','landlord-noise-complaint','rent-increase-dispute',
    'mold-remediation-request','landlord-harassment-complaint','lease-early-termination',
    'property-damage-dispute','utility-billing-dispute','pest-control-demand',
    'letting-agent-complaint','letting-agent-fee-dispute','letting-agent-deposit-dispute',
    'letting-agent-repair-failure','letting-agent-communication',
    'neighbor-noise-complaint','neighbor-boundary-dispute','neighbor-property-damage',
    'neighbor-tree-dispute','neighbor-parking-dispute',
    'fire-safety-violation','gas-safety-certificate','electrical-safety-complaint',
    'building-code-violation','accessibility-compliance',
    'section-21-dispute','section-8-notice-dispute','unfair-eviction-defense',
    'tenancy-agreement-breach','subletting-dispute',
    'flight-delay-eu261','flight-cancellation-refund','lost-luggage-claim',
    'hotel-refund-request','car-rental-dispute','cruise-complaint',
    'travel-insurance-claim','travel-agency-complaint','airline-overbooking',
    'tour-operator-complaint','vacation-rental-complaint','airport-service-complaint',
    'damaged-delivery-claim','wrong-item-received','missing-parts-complaint',
    'product-quality-complaint','product-safety-complaint',
    'warranty-repair-request','extended-warranty-claim','manufacturer-warranty-dispute',
    'warranty-denial-appeal','warranty-service-delay',
    'return-policy-dispute','return-shipping-cost-dispute','exchange-request',
    'store-credit-dispute','restocking-fee-challenge',
    'product-misrepresentation','false-advertising-complaint','counterfeit-product-complaint',
    'misleading-description-dispute','product-recall-compensation',
    'defective-electronics-complaint','defective-appliance-complaint','defective-furniture-complaint',
    'defective-vehicle-part-complaint','defective-clothing-complaint',
    'electric-bill-dispute','gas-bill-overcharge','water-bill-dispute',
    'estimated-bill-challenge','meter-reading-dispute',
    'internet-service-complaint','mobile-phone-bill-dispute','cable-tv-complaint',
    'landline-service-complaint','bundled-service-dispute',
    'mobile-contract-dispute','broadband-contract-dispute','early-termination-fee-dispute',
    'contract-auto-renewal-dispute','upgrade-promise-dispute',
    'internet-speed-complaint','network-coverage-complaint','service-outage-complaint',
    'roaming-charge-dispute','data-throttling-complaint',
    'water-quality-complaint','water-pressure-complaint','sewage-complaint',
    'water-meter-dispute','water-service-interruption',
    'credit-report-dispute','unauthorized-charge-dispute','bank-fee-dispute',
    'credit-card-dispute','debt-collection-dispute',
    'bank-account-error','bank-fee-reversal','bank-closure-dispute',
    'wire-transfer-dispute','atm-dispute',
    'investment-fraud-complaint','broker-complaint','financial-advisor-complaint',
    'investment-loss-dispute','securities-complaint',
    'loan-modification-request','predatory-lending-complaint','student-loan-dispute',
    'auto-loan-dispute','personal-loan-dispute',
    'scam-report-letter','identity-theft-dispute','phishing-scam-report',
    'wire-fraud-complaint','romance-scam-report',
    'auto-insurance-claim-dispute','auto-insurance-rate-increase','auto-insurance-denial-appeal',
    'auto-insurance-totaled-vehicle','auto-insurance-rental-coverage',
    'health-insurance-claim-denial','health-insurance-appeal','health-insurance-billing-dispute',
    'health-insurance-coverage-dispute','health-insurance-preauthorization',
    'home-insurance-claim-dispute','home-insurance-denial-appeal','home-insurance-underpayment',
    'home-insurance-rate-increase','home-insurance-coverage-dispute',
    'life-insurance-claim-dispute','life-insurance-beneficiary-dispute','life-insurance-policy-dispute',
    'life-insurance-premium-increase','life-insurance-cancellation',
    'travel-insurance-claim-dispute','pet-insurance-claim-dispute','business-insurance-dispute',
    'disability-insurance-dispute','renters-insurance-dispute',
    'insurance-bad-faith-complaint','insurance-adjuster-complaint','insurance-delay-complaint',
    'insurance-deductible-dispute','insurance-subrogation-dispute',
    'vehicle-warranty-claim','lemon-law-demand','vehicle-recall-compensation',
    'extended-vehicle-warranty-dispute','powertrain-warranty-claim',
    'auto-repair-complaint','mechanic-overcharge-dispute','repair-quality-complaint',
    'unauthorized-repair-charge','repair-delay-complaint',
    'dealer-misrepresentation','dealer-add-on-dispute','dealer-financing-dispute',
    'used-car-complaint','dealer-service-complaint',
    'auto-finance-dispute','vehicle-lease-dispute','gap-insurance-dispute',
    'auto-loan-payoff-dispute','repossession-dispute',
    'parking-ticket-dispute','towing-dispute','traffic-camera-dispute',
    'toll-charge-dispute','parking-damage-claim',
    'vehicle-title-dispute','vehicle-registration-dispute','vehicle-inspection-dispute',
    'salvage-title-dispute','vehicle-emissions-dispute',
    'medical-bill-dispute','surprise-billing-complaint','insurance-coding-dispute',
    'out-of-network-billing-dispute','emergency-room-bill-dispute',
    'medical-records-request','hipaa-violation-complaint','patient-rights-complaint',
    'medical-malpractice-complaint','pharmacy-error-complaint',
    'dental-billing-dispute','dental-treatment-complaint','dental-insurance-dispute',
    'dental-malpractice-complaint','orthodontic-dispute',
    'hospital-billing-dispute','hospital-complaint','hospital-discharge-dispute',
    'hospital-quality-complaint','hospital-financial-assistance',
    'mental-health-coverage-dispute','mental-health-parity-complaint','therapy-billing-dispute',
    'substance-abuse-coverage-dispute','telehealth-billing-dispute',
    'wrongful-termination-complaint','severance-negotiation','unemployment-benefits-appeal',
    'employment-reference-dispute','non-compete-dispute',
    'unpaid-wages-complaint','overtime-dispute','commission-dispute',
    'minimum-wage-complaint','pay-stub-dispute',
    'workplace-discrimination-complaint','harassment-complaint','hostile-work-environment',
    'retaliation-complaint','accommodation-request',
    'fmla-violation-complaint','health-insurance-dispute-employer','retirement-benefit-dispute',
    'workers-comp-dispute','cobra-coverage-dispute',
    'employment-contract-dispute','offer-letter-dispute','work-schedule-dispute',
    'remote-work-dispute','performance-review-dispute',
    'amazon-refund-dispute','ebay-buyer-complaint','etsy-order-dispute',
    'walmart-online-complaint','marketplace-seller-complaint',
    'ecommerce-delivery-complaint','ecommerce-lost-package','ecommerce-wrong-address',
    'ecommerce-shipping-damage','ecommerce-delivery-delay',
    'ecommerce-payment-dispute','ecommerce-unauthorized-charge','ecommerce-refund-delay',
    'ecommerce-chargeback-dispute','ecommerce-gift-card-dispute',
    'ecommerce-subscription-cancel','ecommerce-auto-renewal-dispute','ecommerce-free-trial-dispute',
    'ecommerce-membership-dispute','ecommerce-recurring-charge',
    'ecommerce-data-breach','ecommerce-privacy-complaint','ecommerce-account-hacked',
    'ecommerce-unwanted-marketing','ecommerce-data-deletion',
    'hoa-fee-dispute','hoa-special-assessment-dispute','hoa-late-fee-dispute',
    'hoa-budget-transparency','hoa-reserve-fund-dispute',
    'hoa-rule-violation-appeal','hoa-parking-violation-dispute','hoa-pet-violation-dispute',
    'hoa-architectural-violation','hoa-noise-violation-dispute',
    'hoa-maintenance-request','hoa-common-area-repair','hoa-landscaping-dispute',
    'hoa-amenity-access-dispute','hoa-pest-control-request',
    'hoa-board-complaint','hoa-meeting-participation','hoa-election-dispute',
    'hoa-disclosure-request','hoa-conflict-of-interest',
    'hoa-neighbor-complaint','hoa-noise-complaint','hoa-property-boundary-dispute',
    'hoa-nuisance-complaint','hoa-mediation-request',
    'general-contractor-complaint','general-contractor-delay','general-contractor-quality',
    'general-contractor-overcharge','general-contractor-incomplete-work',
    'plumber-complaint','plumber-overcharge','plumber-warranty-claim',
    'plumber-damage-complaint','plumber-licensing-dispute',
    'electrician-complaint','electrician-overcharge','electrician-safety-complaint',
    'electrician-warranty-claim','electrician-code-violation',
    'hvac-repair-complaint','hvac-installation-dispute','hvac-warranty-claim',
    'hvac-overcharge-dispute','hvac-maintenance-complaint',
    'roofer-complaint','roofer-warranty-claim','roofer-quality-dispute',
    'roofer-overcharge','roofer-damage-complaint',
    'painter-complaint','painter-quality-dispute','painter-overcharge',
    'flooring-complaint','flooring-quality-dispute',
    'kitchen-remodel-complaint','bathroom-remodel-complaint','kitchen-contractor-delay',
    'bathroom-contractor-overcharge','countertop-installation-dispute',
    'landscaper-complaint','landscaper-overcharge','landscaper-damage-claim',
    'tree-service-complaint','irrigation-system-dispute',
    'window-installer-complaint','door-installer-complaint','window-quality-dispute',
    'door-warranty-claim','window-installer-damage',
    'pool-contractor-complaint','solar-installer-complaint','fence-contractor-complaint',
    'concrete-contractor-complaint','pest-control-dispute'
  ];
  s TEXT;
  base_usage INTEGER;
  usage_val INTEGER;
  score_val NUMERIC;
  votes_val INTEGER;
  h INTEGER;
BEGIN
  FOREACH s IN ARRAY slugs LOOP
    h := abs(hashtext(s));
    
    -- Category-based usage ranges
    IF s LIKE '%refund%' OR s LIKE 'store-%' OR s LIKE 'online-%' OR s LIKE 'subscription-%' 
       OR s LIKE 'digital-%' OR s LIKE 'billing-dispute-%' OR s LIKE 'double-charge%'
       OR s LIKE 'price-%' OR s LIKE 'gift-%' OR s LIKE 'membership-%' OR s LIKE 'food-%'
       OR s LIKE 'grocery-%' OR s LIKE 'app-%' OR s LIKE 'streaming-%' OR s LIKE 'fitness-%'
       OR s LIKE 'beauty-%' OR s LIKE 'catering-%' OR s LIKE 'photography-%'
       OR s LIKE 'event-planning-%' OR s LIKE 'professional-service%'
       OR s LIKE 'loyalty-%' OR s LIKE 'seasonal-%' OR s LIKE 'layaway-%'
       OR s LIKE 'prepaid-%' OR s LIKE 'late-delivery%' OR s LIKE 'wrong-item%' THEN
      base_usage := 800;
    ELSIF s LIKE 'amazon-%' OR s LIKE 'ebay-%' OR s LIKE 'etsy-%' OR s LIKE 'walmart-%'
       OR s LIKE 'marketplace-%' OR s LIKE 'ecommerce-%' THEN
      base_usage := 900;
    ELSIF s LIKE 'flight-%' OR s LIKE 'hotel-%' OR s LIKE 'car-rental%' OR s LIKE 'cruise-%'
       OR s LIKE 'travel-%' OR s LIKE 'airline-%' OR s LIKE 'tour-%' OR s LIKE 'vacation-%'
       OR s LIKE 'airport-%' OR s LIKE 'lost-luggage%' THEN
      base_usage := 700;
    ELSIF s LIKE 'credit-%' OR s LIKE 'bank-%' OR s LIKE 'debt-%' OR s LIKE 'unauthorized-charge%'
       OR s LIKE 'investment-%' OR s LIKE 'broker-%' OR s LIKE 'loan-%' OR s LIKE 'scam-%'
       OR s LIKE 'identity-%' OR s LIKE 'phishing-%' OR s LIKE 'wire-%' OR s LIKE 'romance-%'
       OR s LIKE 'securities-%' OR s LIKE 'predatory-%' OR s LIKE 'personal-loan%' THEN
      base_usage := 750;
    ELSIF s LIKE 'landlord-%' OR s LIKE 'rent-%' OR s LIKE 'lease-%' OR s LIKE 'tenant%'
       OR s LIKE 'mold-%' OR s LIKE 'property-%' OR s LIKE 'letting-%' OR s LIKE 'neighbor-%'
       OR s LIKE 'fire-%' OR s LIKE 'gas-safety%' OR s LIKE 'electrical-safety%'
       OR s LIKE 'building-%' OR s LIKE 'accessibility-%' OR s LIKE 'section-%'
       OR s LIKE 'unfair-eviction%' OR s LIKE 'subletting-%' OR s LIKE 'pest-control-demand%' THEN
      base_usage := 600;
    ELSIF s LIKE 'auto-insurance%' OR s LIKE 'health-insurance%' OR s LIKE 'home-insurance%'
       OR s LIKE 'life-insurance%' OR s LIKE 'insurance-%' OR s LIKE 'pet-insurance%'
       OR s LIKE 'business-insurance%' OR s LIKE 'disability-%' OR s LIKE 'renters-%' THEN
      base_usage := 500;
    ELSIF s LIKE 'vehicle-%' OR s LIKE 'lemon-%' OR s LIKE 'auto-%' OR s LIKE 'mechanic-%'
       OR s LIKE 'dealer-%' OR s LIKE 'used-car%' OR s LIKE 'parking-%' OR s LIKE 'towing-%'
       OR s LIKE 'traffic-%' OR s LIKE 'toll-%' OR s LIKE 'gap-%' OR s LIKE 'repossession-%'
       OR s LIKE 'salvage-%' OR s LIKE 'powertrain-%' THEN
      base_usage := 550;
    ELSIF s LIKE 'hoa-%' THEN
      base_usage := 300;
    ELSIF s LIKE 'general-contractor%' OR s LIKE 'plumb%' OR s LIKE 'electric%' OR s LIKE 'hvac-%'
       OR s LIKE 'roof%' OR s LIKE 'paint%' OR s LIKE 'floor%' OR s LIKE 'kitchen-%'
       OR s LIKE 'bathroom-%' OR s LIKE 'landscap%' OR s LIKE 'window-%' OR s LIKE 'door-%'
       OR s LIKE 'pool-%' OR s LIKE 'solar-%' OR s LIKE 'fence-%' OR s LIKE 'concrete-%'
       OR s LIKE 'tree-%' OR s LIKE 'irrigation-%' OR s LIKE 'countertop-%' THEN
      base_usage := 350;
    ELSE
      base_usage := 400;
    END IF;

    usage_val := base_usage + (h % 1500);
    score_val := 94.0 + ((h % 500)::NUMERIC / 100.0);
    votes_val := GREATEST(20, (usage_val * (15 + (h % 11))) / 100);

    INSERT INTO public.template_stats (template_slug, usage_count, satisfaction_score, total_votes, positive_votes)
    VALUES (s, usage_val, score_val, votes_val, ROUND(votes_val * score_val / 100)::INTEGER)
    ON CONFLICT (template_slug) DO NOTHING;
  END LOOP;
END $$;

-- 3. Add feedback_vote column to letter_purchases
ALTER TABLE public.letter_purchases ADD COLUMN IF NOT EXISTS feedback_vote TEXT;

-- 4. Create submit_template_vote RPC
CREATE OR REPLACE FUNCTION public.submit_template_vote(p_slug TEXT, p_positive BOOLEAN, p_purchase_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_vote TEXT;
BEGIN
  SELECT feedback_vote INTO existing_vote
  FROM letter_purchases
  WHERE id = p_purchase_id AND status = 'completed';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase not found');
  END IF;

  IF existing_vote IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already voted');
  END IF;

  UPDATE template_stats SET
    total_votes = total_votes + 1,
    positive_votes = positive_votes + CASE WHEN p_positive THEN 1 ELSE 0 END,
    satisfaction_score = ROUND(
      ((positive_votes + CASE WHEN p_positive THEN 1 ELSE 0 END)::NUMERIC / 
       (total_votes + 1)::NUMERIC) * 100, 2
    )
  WHERE template_slug = p_slug;

  UPDATE letter_purchases SET
    feedback_vote = CASE WHEN p_positive THEN 'positive' ELSE 'negative' END
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
