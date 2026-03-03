// Form Assistant Edge Function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Category-specific expertise for the AI
const categoryExpertise: Record<string, string> = {
  Travel: `You are an expert in travel dispute resolution. You understand:
- EU261/2004 compensation tiers (€250/€400/€600 based on distance)
- Montreal Convention liability limits for baggage
- Airline procedures for delays, cancellations, and lost luggage
- PIR reports, WorldTracer, and bag tag systems
- What qualifies as "extraordinary circumstances"`,
  
  Insurance: `You are an expert in insurance claim disputes. You understand:
- Policy terms, exclusions, and coverage limits
- Claims documentation requirements
- Common denial reasons and how to counter them
- Appeals processes and regulatory oversight
- Medical necessity arguments for health claims`,
  
  Housing: `You are an expert in tenant-landlord disputes. You understand:
- Landlord repair obligations and response times
- Implied warranty of habitability
- Deposit protection schemes and return procedures
- Notice requirements and proper documentation
- Housing code violations and enforcement`,
  
  Contractors: `You are an expert in construction and contractor disputes. You understand:
- Contract terms and change order requirements
- Building codes and permit requirements
- Licensing and insurance requirements
- Workmanship standards and remediation
- Lien laws and payment disputes`,
  
  Financial: `You are an expert in financial service disputes. You understand:
- FCRA, FDCPA, and banking regulations
- Credit report dispute procedures
- Unauthorized transaction liability rules
- Debt validation requirements
- Chargeback processes and timeframes`,
  
  Healthcare: `You are an expert in medical billing and healthcare disputes. You understand:
- Medical coding and billing practices
- Insurance EOB interpretation
- Medical necessity criteria
- HIPAA rights and access to records
- Hospital charity care policies`,
  
  Vehicle: `You are an expert in automotive disputes. You understand:
- Lemon law requirements by state
- Warranty coverage and exclusions
- Dealer disclosure obligations
- Repair authorization requirements
- Vehicle history and condition documentation`,
  
  'Real Estate & Mortgages': `You are an expert in mortgage servicing and real estate disputes. You understand:
- RESPA Qualified Written Request (QWR) procedures and servicer obligations
- Escrow account analysis, shortage calculations, and surplus disbursement
- PMI cancellation under the Homeowners Protection Act (80% LTV request, 78% automatic)
- Dual tracking prohibition under CFPB servicing rules
- Loss mitigation application and review timelines
- TILA disclosure requirements and rescission rights
- Force-placed insurance regulations and refund procedures
- Successor-in-interest notification rights under Regulation X
- Payoff statement accuracy requirements
- HELOC draw period and repayment disputes`,

  'E-commerce': `You are an expert in e-commerce and online marketplace disputes. You understand:
- FTC Mail Order Rule shipping and refund requirements
- Platform-specific dispute resolution (Amazon A-to-Z, eBay MBG, PayPal)
- Chargeback processes and Regulation E/Z protections
- Digital product refund policies
- GDPR and CCPA data deletion rights
- Dark pattern regulations and drip pricing complaints
- Subscription auto-renewal laws (state-specific)`,

  Employment: `You are an expert in employment and workplace disputes. You understand:
- Fair Labor Standards Act (FLSA) wage and overtime requirements
- Title VII discrimination and harassment protections
- FMLA leave rights and retaliation prohibitions
- OSHA workplace safety complaint procedures
- Wrongful termination and constructive dismissal claims
- Severance negotiation and non-compete enforceability
- State-specific wage payment timing requirements`,

  'HOA & Property': `You are an expert in homeowners association and property disputes. You understand:
- HOA governing documents (CC&Rs, bylaws, rules and regulations)
- Assessment and special assessment challenge procedures
- Architectural review board appeal processes
- Open meeting and financial disclosure requirements
- Fair Housing Act protections within HOA enforcement
- State HOA acts and dispute resolution procedures`,

  'Refunds & Purchases': `You are an expert in consumer purchase and refund disputes. You understand:
- FTC Act Section 5 unfair and deceptive practices
- Fair Credit Billing Act dispute procedures
- Magnuson-Moss Warranty Act consumer protections
- State consumer protection statutes (DTPA, 93A, etc.)
- Chargeback rights and timing requirements
- Small claims court procedures for consumer disputes`,

  'Damaged Goods': `You are an expert in product defect and damage disputes. You understand:
- UCC implied warranties of merchantability and fitness
- Magnuson-Moss Warranty Act full vs. limited warranty obligations
- Product liability theories (strict liability, negligence, breach of warranty)
- Shipping damage claim procedures (carrier liability vs. seller responsibility)
- Consumer Product Safety Commission reporting for unsafe products
- Rejection and revocation of acceptance under UCC`,
};

// Subcategory-level deep expertise (supplements category-level expertise)
const subcategoryExpertise: Record<string, Record<string, string>> = {
  Financial: {
    'credit-reporting': `Deep expertise in credit reporting disputes:
- FCRA 30-day investigation lifecycle and reinsertion rules (§ 1681i)
- Bureau-specific procedures: Experian online portal, TransUnion mail, Equifax dispute center
- Furnisher obligations under § 1681s-2(b) - must investigate upon CRA notification
- Mixed file disputes (similar names/SSNs) and identity confusion
- Obsolete information removal (7-year rule for negatives, 10 years for bankruptcies)
- Statutory damages: $100-$1,000 per willful violation`,
    'debt-collection': `Deep expertise in debt collection disputes:
- FDCPA validation timeline: 30 days from G-Notice to request validation (§ 1692g)
- 7-in-7 call harassment rule under Regulation F
- Time-barred debt revival rules (zombie debt) - varies by state SOL
- Cease and desist rights (§ 1692c) - collector must stop contact
- Third-party disclosure prohibitions
- Medical debt protections: no reporting until 365 days, paid medical debt removed`,
    'identity-theft': `Deep expertise in identity theft recovery:
- FTC Identity Theft Report process and extended fraud alerts (7 years)
- Credit freeze vs fraud alert differences and procedures
- IRS Form 14039 for tax identity theft
- FCRA § 605B: blocking fraudulent information with police report
- Free annual reports from each bureau during active dispute
- Account closure rights under Red Flags Rule`,
    banking: `Deep expertise in banking disputes:
- Regulation E: 60-day window for reporting unauthorized EFTs
- Provisional credit requirements (10 business days for investigation)
- Regulation CC: fund availability schedules
- Zelle/Venmo fraud: authorized vs unauthorized distinction
- NSF/overdraft fee reversal strategies
- Power of Attorney recognition requirements under state UCC`,
    'credit-cards': `Deep expertise in credit card disputes:
- Fair Credit Billing Act (FCBA): 60-day billing error dispute window
- Regulation Z chargeback rights and procedures
- APR increase notification requirements (45 days advance notice)
- Credit CARD Act protections: payment allocation, fee limits
- Promotional rate expiration disputes
- Credit limit reduction impact on utilization ratio`,
    investments: `Deep expertise in investment disputes:
- FINRA arbitration process and complaint procedures
- SEC complaint filing for securities fraud
- Suitability and fiduciary duty standards
- Churning, unauthorized trading, and excessive fee claims
- Pension transfer disputes and ERISA protections
- Trading platform error liability and best execution obligations`,
    fraud: `Deep expertise in fraud and scam recovery:
- Authorized Push Payment (APP) fraud recovery procedures
- Bank's duty of care in processing suspicious transactions
- Cryptocurrency scam reporting (FBI IC3, FTC, state AG)
- Account takeover fraud investigation timelines
- Recovery room/advance fee scam identification
- Regulation E protections for unauthorized electronic transfers`,
  },
  'Real Estate & Mortgages': {
    'payment-issues': `Deep expertise in mortgage payment disputes:
- RESPA QWR format requirements and certified mail procedures
- Payment waterfall rules (how servicers must apply payments)
- Late fee limitations and grace period requirements
- Suspense account disputes and partial payment handling
- Credit reporting protections during active QWR investigation`,
    escrow: `Deep expertise in escrow disputes:
- RESPA escrow cushion limit (2 months maximum)
- Annual escrow analysis requirements and timing
- Escrow shortage vs deficiency distinction
- Servicer obligation to pay tax and insurance on time
- Surplus refund requirements (within 30 days)`,
    pmi: `Deep expertise in PMI removal:
- HPA borrower-initiated cancellation at 80% original value LTV
- Automatic termination at 78% - no request needed
- Final termination at amortization midpoint
- Good payment history requirement (no 60-day lates in 24 months)
- New appraisal option for homes with substantial appreciation`,
    foreclosure: `Deep expertise in foreclosure defense:
- Dual tracking prohibition under Reg X § 1024.41
- Complete vs facially complete loss mitigation applications
- 37-day pre-sale protection for complete applications
- Modification denial appeal rights (14-day window)
- Single Point of Contact (SPOC) requirement
- Successor-in-interest protections for inherited properties`,
    closing: `Deep expertise in closing and payoff disputes:
- RESPA Section 4: Prohibition on kickbacks and unearned fees
- TILA-RESPA Integrated Disclosure (TRID) rule: Loan Estimate and Closing Disclosure timing
- Payoff statement accuracy: servicer must provide within 7 business days of request
- HELOC billing disputes and draw period terms
- Title insurance claim procedures for undisclosed liens
- Tolerance limits on closing cost changes between LE and CD`,
    'force-placed-insurance': `Deep expertise in force-placed insurance disputes:
- Servicer must send two notices before force-placing (Reg X § 1024.37)
- First notice 45+ days before charge; reminder 30+ days before charge
- Cost must be reasonable; lender-placed policies are typically 5-10x market rate
- Refund required within 15 days of borrower providing proof of coverage
- CFPB enforcement actions against kickback arrangements
- State insurance commissioner complaints for excessive premiums`,
    inherited: `Deep expertise in inherited property/successor-in-interest disputes:
- Garn-St Germain Act: prohibits due-on-sale enforcement for inheritance transfers
- Reg X successor-in-interest: servicer must confirm and provide loan info within 30 days
- Ability to assume mortgage without re-qualifying (for confirmed successors)
- CFPB rules on loss mitigation access for successors
- Probate documentation requirements vary by state
- Joint tenant vs tenants in common survivorship distinctions`,
  },
  Travel: {
    flights: `Deep expertise in airline flight disputes:
- DOT passenger protections: tarmac delay rules (3hrs domestic, 4hrs international)
- Denied boarding compensation: 200%-400% of one-way fare under 14 CFR 250
- Refund rules: airlines must refund within 7 days (credit card) or 20 days (cash/check)
- Automatic refund rule for significant delays and cancellations (2024 DOT final rule)
- Baggage fee refunds for significantly delayed checked bags
- Disability accommodation requirements under Air Carrier Access Act
- DOT complaint portal: airconsumer.dot.gov for enforcement action`,
    hotels: `Deep expertise in hotel and accommodation disputes:
- FTC Act Section 5: deceptive advertising of room conditions or amenities
- State consumer protection laws for bait-and-switch booking tactics
- Overbooking: hotel must arrange comparable accommodation at no extra cost
- Resort fee disclosure requirements (FTC enforcement actions)
- Platform-specific dispute procedures: Booking.com, Expedia, Airbnb resolution center
- Credit card chargeback rights for services not rendered (Reg Z)`,
    cruises: `Deep expertise in cruise line disputes:
- Maritime law (46 USC) and passenger vessel limitations
- Cruise line ticket contract forum-selection and time-bar clauses
- FMC complaint filing for unfair practices (Federal Maritime Commission)
- Onboard medical malpractice and personal injury claims
- Itinerary change and port-of-call cancellation compensation
- Communicable disease outbreak protocols and refund obligations`,
    'car-rentals': `Deep expertise in rental car disputes:
- Collision Damage Waiver (CDW) vs personal auto policy overlap
- Pre-existing damage documentation (walk-around photos, rental agreement notes)
- State laws on damage claim limitations (diminished value rules vary)
- Toll and traffic violation billing disputes and administrative fees
- Fuel charge disputes and refueling policy enforcement
- Credit card rental insurance benefits (secondary vs primary coverage)`,
    tours: `Deep expertise in tour and travel package disputes:
- FTC Mail Order Rule: refund required if service not provided as described
- Travel agent/tour operator bond and trust account protections
- Package travel regulations: operator liable for component failures
- Force majeure and cancellation policy enforceability
- State seller-of-travel registration and consumer fund access
- Credit card chargeback for services not delivered`,
    'rail-bus': `Deep expertise in rail and bus transportation disputes:
- Amtrak Guest Rewards and delay compensation policies
- ADA accessibility requirements for ground transportation
- State public utility commission complaints for bus/coach operators
- DOT intercity bus accessibility enforcement
- Greyhound/FlixBus refund and cancellation policies
- Common carrier duty of care and liability for lost luggage`,
  },
  Insurance: {
    auto: `Deep expertise in auto insurance disputes:
- State-specific mandatory minimum coverage requirements
- Diminished value claims (first-party vs third-party, varies by state)
- Total loss valuation disputes: comparable vehicle analysis, NADA/KBB references
- Unfair Claims Settlement Practices Act (state-specific model law)
- Appraisal clause invocation for disputed valuations
- Rental car coverage duration during repair delays
- State DOI complaint filing and investigation process`,
    home: `Deep expertise in homeowner's insurance disputes:
- Proof of loss filing deadlines (typically 60 days, varies by policy)
- Scope of loss disputes: policyholder's right to independent appraisal
- Appraisal clause: each party selects appraiser, umpire breaks ties
- Replacement Cost Value (RCV) vs Actual Cash Value (ACV) holdback release
- Concurrent causation doctrine for multi-peril claims
- State prompt payment statutes (penalties for late claim payment)
- Bad faith claim prerequisites and standards (varies by state)`,
    health: `Deep expertise in health insurance disputes:
- ACA essential health benefits and preventive care coverage mandates
- External review rights for denied claims (state or federal process)
- Surprise billing protections under No Surprises Act (2022)
- Mental health parity under MHPAEA (quantitative and non-quantitative limits)
- Network adequacy complaints and continuity of care during plan changes
- Prior authorization denial appeal: internal (2 levels) then external review
- CMS/state insurance commissioner complaint filing`,
    life: `Deep expertise in life insurance disputes:
- Contestability period: 2-year window for rescission based on misrepresentation
- Incontestability clause protections after 2 years
- Beneficiary designation disputes and interpleader actions
- Accidental death benefit (AD&D) exclusion challenges
- Delayed death benefit payment: state prompt payment penalties
- Conversion rights from group to individual policy upon job loss
- State guaranty association coverage limits for insolvent insurers`,
    travel: `Deep expertise in travel insurance disputes:
- "Cancel for Any Reason" (CFAR) vs standard cancellation coverage distinctions
- Pre-existing condition exclusion look-back periods (typically 60-180 days)
- Trip interruption vs trip cancellation benefit differences
- Medical evacuation coverage adequacy and coordination with primary insurance
- Baggage delay reimbursement documentation requirements
- State insurance commissioner complaints for denied travel claims
- Credit card travel insurance as secondary coverage coordination`,
  },
  Housing: {
    repairs: `Deep expertise in repair and maintenance disputes:
- Implied warranty of habitability: landlord's non-waivable duty (state-specific)
- Reasonable repair timelines: emergency (24hrs), urgent (3-7 days), routine (30 days)
- Rent withholding and repair-and-deduct remedies (state law prerequisites)
- Written notice requirements before exercising self-help remedies
- Retaliatory eviction protections (typically 6-12 months after complaint)
- Housing code enforcement: local building inspector complaint filing
- Constructive eviction claims for uninhabitable conditions`,
    deposits: `Deep expertise in security deposit disputes:
- State-specific return deadlines (14-60 days depending on jurisdiction)
- Itemized deduction statement requirements
- Normal wear and tear vs damage distinction
- Treble/double damages for wrongful withholding (many states)
- Deposit protection scheme requirements (some jurisdictions require separate account)
- Move-in/move-out inspection documentation best practices
- Small claims court procedures for deposit recovery`,
    tenancy: `Deep expertise in tenancy and lease disputes:
- Lease enforceability: unconscionable clause challenges
- Notice to quit requirements (varies by state: 30/60/90 days)
- Just cause eviction protections (rent-controlled jurisdictions)
- Constructive eviction elements and tenant remedies
- Illegal lockout and utility shutoff protections
- Subletting and assignment rights
- Rent increase limitations and notice requirements`,
    neighbor: `Deep expertise in neighbor dispute resolution:
- Local noise ordinance standards and enforcement procedures
- Nuisance law: private nuisance claims for unreasonable interference
- Quiet enjoyment covenant and landlord's duty to enforce against other tenants
- HOA/condo association complaint procedures for rule violations
- Mediation services through local dispute resolution centers
- Restraining order procedures for harassment situations`,
    'letting-agents': `Deep expertise in letting agent/property manager disputes:
- Fiduciary duty to property owner and fair dealing with tenants
- Fee disclosure requirements and prohibited fee regulations
- Property management licensing requirements (state-specific)
- Failure to maintain escrow accounts for tenant deposits
- State real estate commission complaint filing
- Breach of management agreement remedies
- Fair housing violation liability for discriminatory practices`,
    safety: `Deep expertise in housing safety and compliance disputes:
- Lead paint disclosure requirements (pre-1978 homes, EPA RRP Rule)
- Carbon monoxide and smoke detector mandates (state/local codes)
- Gas safety certificate requirements (annual inspection in many jurisdictions)
- Electrical safety compliance and landlord inspection obligations
- Mold remediation responsibilities and disclosure requirements
- Fire safety code compliance and egress requirements
- Habitability standards and code enforcement complaint procedures`,
  },
  Contractors: {
    general: `Deep expertise in general contractor disputes:
- State licensing board complaint filing and disciplinary actions
- Mechanic's lien rights and deadlines (preliminary notice requirements)
- Change order requirements: written authorization, cost documentation
- Substantial completion vs final completion distinctions
- Breach of contract damages: cost of completion vs diminution in value
- Home improvement contract requirements (state-specific: right to cancel, written estimates)
- Contractor bond claims and recovery fund procedures`,
    plumbing: `Deep expertise in plumbing contractor disputes:
- Plumbing license and permit requirements (local jurisdiction)
- Code compliance: IPC/UPC standards for materials and installation
- Warranty obligations for workmanship (typically 1-2 years) and materials
- Water damage liability from faulty installation
- Backflow prevention device requirements and testing
- Sewer line responsibility (property owner vs municipality)
- Emergency repair documentation and reasonable cost standards`,
    electrical: `Deep expertise in electrical contractor disputes:
- NEC (National Electrical Code) compliance requirements
- Electrical permit and inspection requirements (work without permit voids warranty)
- Licensed electrician requirements (journeyman vs master distinctions)
- Arc fault and ground fault protection requirements
- Panel upgrade and service entrance specifications
- Liability for fire damage from faulty wiring
- Utility company coordination requirements`,
    roofing: `Deep expertise in roofing contractor disputes:
- Manufacturer warranty vs contractor workmanship warranty distinctions
- Storm chaser/insurance fraud indicators and consumer protections
- Assignment of Benefits (AOB) restrictions (state-specific)
- Permit requirements and code compliance for re-roofing
- Warranty voiding conditions (improper ventilation, layering violations)
- Material specification disputes and substitution without consent
- Roof inspection documentation and leak source disputes`,
    hvac: `Deep expertise in HVAC contractor disputes:
- EPA Section 608 refrigerant handling certification requirements
- SEER rating misrepresentation and efficiency guarantee disputes
- Warranty registration and authorized dealer requirements
- Load calculation requirements (Manual J) for proper system sizing
- Ductwork design standards (Manual D) and airflow balancing
- Service agreement and maintenance contract disputes
- Permit and inspection requirements for equipment replacement`,
    specialty: `Deep expertise in specialty contractor disputes:
- Pool contractor licensing and bond requirements (separate from general)
- Fence setback and height regulations (local zoning codes)
- Foundation repair warranty standards (structural vs cosmetic)
- Solar panel system performance guarantees and interconnection disputes
- Pest control licensing and retreatment obligations
- Mold remediation certification and protocol compliance
- Demolition permit and environmental clearance requirements`,
  },
  Healthcare: {
    'insurance-claims': `Deep expertise in healthcare insurance claim disputes:
- ACA appeal rights: internal appeal within 180 days, then external review
- Utilization review and prior authorization denial procedures
- Emergency care coverage: prudent layperson standard (no prior auth required)
- Network vs out-of-network billing protections under No Surprises Act
- State external review processes and independent review organizations (IROs)
- CMS Medicare complaint and appeal procedures (5 levels)
- ERISA-governed plan appeal requirements and exhaustion doctrine`,
    billing: `Deep expertise in medical billing disputes:
- Right to itemized bill and explanation of charges
- CPT/ICD coding error identification (upcoding, unbundling, duplicate charges)
- Surprise billing protections: No Surprises Act independent dispute resolution
- Hospital price transparency requirements (machine-readable files)
- Charity care and financial assistance policy requirements (501(r))
- State balance billing prohibitions and patient liability limits
- Fair Debt Collection Practices Act protections for medical debt`,
    'debt-collection': `Deep expertise in medical debt collection disputes:
- Medical debt credit reporting delay: 365 days before appearing on credit report
- Paid medical debt removal from credit reports (Equifax, Experian, TransUnion policy)
- Debts under $500 excluded from credit reports (bureau voluntary policy)
- FDCPA validation rights: 30 days to request debt verification
- State medical debt protection laws (surprise bill dispute, payment plan rights)
- Hospital lien laws and limitations on collections during active disputes
- Nonprofit hospital 501(r) collection activity restrictions`,
    provider: `Deep expertise in healthcare provider complaint procedures:
- State medical board complaint filing for physician misconduct
- Joint Commission complaint process for accredited facilities
- CMS complaint filing for Medicare/Medicaid-certified facilities
- Informed consent requirements and documentation standards
- Patient rights under state patient bill of rights statutes
- Medical records access: HIPAA right to copies within 30 days
- State health department facility complaint procedures`,
    pharmacy: `Deep expertise in pharmacy and prescription disputes:
- State board of pharmacy complaint filing procedures
- Prescription error liability and pharmacist duty of care
- Generic substitution laws and patient consent requirements
- Prior authorization for medications: appeal rights and expedited review
- Step therapy (fail-first) override procedures
- Drug formulary change notification requirements
- Pharmacy benefit manager (PBM) complaint procedures`,
    'privacy-records': `Deep expertise in HIPAA and medical records disputes:
- HIPAA right to access: covered entity must provide within 30 days
- HIPAA right to amend: entity must respond within 60 days
- Accounting of disclosures request rights
- Breach notification requirements (60 days for covered entities)
- OCR complaint filing for HIPAA violations (180-day deadline)
- Psychotherapy notes: higher protection standard, separate authorization required
- State health privacy laws that exceed HIPAA protections`,
  },
  Vehicle: {
    dealer: `Deep expertise in vehicle dealer disputes:
- State dealer licensing and bonding requirements
- Federal odometer tampering law (49 USC § 32703) and state equivalents
- Buyer's Guide (FTC Used Car Rule) disclosure requirements
- Yo-yo financing / spot delivery scam protections
- Dealer rate markup disclosure and state caps
- As-is vs warranty sales and implied warranty disclaimers
- State attorney general and DMV dealer complaint procedures`,
    repair: `Deep expertise in vehicle repair disputes:
- Written estimate requirements before work begins (state-specific thresholds)
- Authorization requirements for work exceeding estimate (usually 10% or $100)
- Right to return replaced parts (must request in advance)
- Mechanic's lien rights and limitations
- State Bureau of Automotive Repair (BAR) complaint procedures
- ASE certification standards and repair facility licensing
- Warranty on repair work (parts and labor, typically 12 months/12,000 miles)`,
    'warranty-lemon': `Deep expertise in warranty and lemon law disputes:
- State lemon law: required repair attempts (typically 3-4 for same defect)
- Reasonable number of days out of service (usually 30 cumulative days)
- Manufacturer buyback calculation: purchase price minus reasonable use offset
- Magnuson-Moss Warranty Act: federal lemon law for repeated warranty failures
- Extended warranty / vehicle service contract dispute procedures
- Secret warranty (Technical Service Bulletin) identification
- BBB AUTO LINE and manufacturer arbitration programs`,
    finance: `Deep expertise in vehicle financing disputes:
- Truth in Lending Act (TILA): APR and finance charge disclosure requirements
- Dealer reserve / rate markup practices and state caps
- GAP insurance refund on early payoff (pro-rata calculation)
- Wrongful repossession: breach of peace and notice requirements
- Deficiency balance disputes after repossession sale
- Starter interrupt / GPS kill switch device notice requirements
- State motor vehicle finance company licensing and complaint procedures`,
    parking: `Deep expertise in parking and traffic disputes:
- Private parking lot enforcement limitations vs public enforcement
- Boot and tow notice and fee regulation (state/local)
- Traffic camera ticket challenges (calibration, signage, officer review)
- ADA accessible parking enforcement and complaints
- Municipal court and administrative hearing procedures for tickets
- Predatory towing complaints to state consumer protection office
- Parking meter malfunction documentation and dispute procedures`,
  },
  'Utilities & Telecom': {
    energy: `Deep expertise in energy utility disputes:
- State Public Utility Commission (PUC) complaint filing procedures
- Estimated billing disputes and meter testing rights (utility must test on request)
- Disconnection protections: notice requirements, winter moratorium rules
- Budget billing and payment arrangement requirements
- Deposit requirements and refund timelines
- Deregulated market: switching and slamming/cramming complaints
- Low-income assistance programs (LIHEAP, utility discount programs)`,
    water: `Deep expertise in water and sewer utility disputes:
- Abnormally high bill disputes: right to leak adjustment or meter test
- Water quality complaints: EPA Safe Drinking Water Act enforcement
- Sewer lateral responsibility (homeowner vs municipality)
- Combined sewer overflow complaints and EPA reporting
- Water service disconnection protections and payment plans
- State drinking water program complaint procedures
- Lead service line replacement responsibilities and notification requirements`,
    internet: `Deep expertise in internet service disputes:
- FCC complaint filing for broadband service issues
- Speed/performance shortfall claims (FCC Broadband Facts label requirements)
- Contract early termination fee disputes and state consumer protection
- Data cap and throttling disclosure requirements
- Equipment rental fee disputes and customer-owned modem rights
- Service outage credit policies and SLA enforcement
- ACP/Lifeline program eligibility and enrollment disputes`,
    phone: `Deep expertise in phone and mobile carrier disputes:
- FCC complaint filing for wireless service issues
- Cramming (unauthorized charges) and slamming (unauthorized carrier switch) protections
- Early termination fee regulations and device unlock requirements
- Robocall complaints under TCPA (Telephone Consumer Protection Act)
- Number porting disputes and carrier switching delays
- Billing error dispute procedures and account credit requirements
- Wireless coverage claim disputes and 14-day satisfaction guarantee policies`,
    'tv-cable': `Deep expertise in TV and cable service disputes:
- FCC cable television complaint procedures
- Cable Act: rate regulation and franchise authority complaints
- Channel lineup change notice requirements
- Equipment return and unreturned equipment fee disputes
- Promotional rate expiration and retroactive billing practices
- Bundled service cancellation and component pricing rights
- Local franchise authority complaint procedures for service quality`,
  },
  'E-commerce': {
    refunds: `Deep expertise in e-commerce refund and return disputes:
- FTC Mail Order Rule: seller must ship within stated time or offer refund
- Platform-specific return windows (Amazon 30 days, eBay 30 days)
- Restocking fee limitations and disclosure requirements
- Digital product refund policies and state consumer protection
- Credit card chargeback: 60-day window under FCBA for billing errors
- Debit card disputes under Regulation E (different protections than credit)
- State automatic refund laws for cancelled orders`,
    delivery: `Deep expertise in e-commerce delivery disputes:
- FTC Mail Order Rule: must deliver by promised date or provide delay notice
- Risk of loss: UCC rules on when title passes to buyer
- Carrier liability limitations (declared value vs actual value)
- Porch piracy: seller vs carrier vs buyer responsibility
- Signature confirmation disputes and proof of delivery challenges
- International shipping: customs delays and duty responsibility
- Amazon/marketplace guaranteed delivery date claims`,
    marketplace: `Deep expertise in marketplace platform disputes:
- Amazon A-to-Z Guarantee claim procedures and deadlines
- eBay Money Back Guarantee and case escalation process
- PayPal Purchase Protection and dispute resolution timeline
- Platform seller performance standards and buyer recourse
- Counterfeit product complaints and IP infringement reporting
- Marketplace facilitator sales tax collection issues
- Third-party seller identification and direct contact rights`,
    subscriptions: `Deep expertise in subscription and recurring charge disputes:
- ROSCA (Restore Online Shoppers' Confidence Act) requirements
- State auto-renewal laws: clear disclosure, easy cancellation (CA, NY, IL, etc.)
- FTC negative option rule: affirmative consent required for recurring charges
- Free trial conversion notice requirements
- Click-to-cancel rule (2024 FTC final rule)
- Dark pattern prohibitions in subscription enrollment
- Chargeback rights for unauthorized recurring charges`,
    privacy: `Deep expertise in e-commerce privacy and data disputes:
- CCPA/CPRA: right to know, delete, opt-out of sale (California residents)
- GDPR: right to erasure, data portability, access (EU data subjects)
- CAN-SPAM Act: commercial email opt-out requirements
- COPPA: children's online privacy protections (under 13)
- Data breach notification requirements (state-specific timelines)
- FTC Section 5 enforcement for deceptive privacy practices
- State biometric privacy laws (BIPA in Illinois, etc.)`,
    'consumer-protection': `Deep expertise in e-commerce consumer protection:
- FTC drip pricing enforcement and all-in pricing requirements
- Fake review and endorsement violations (FTC Endorsement Guides)
- Counterfeit product liability and platform safe harbors
- Platform account ban appeal procedures and due process
- Price discrimination and dynamic pricing disclosure
- State consumer protection statutes (UDAP) for online sellers
- BBB complaint filing and online dispute resolution platforms`,
  },
  Employment: {
    wages: `Deep expertise in wage and pay disputes:
- FLSA minimum wage and overtime (1.5x for 40+ hrs) requirements
- State wage theft laws and treble damages provisions
- Final paycheck timing requirements (vary by state: immediate to next payday)
- Commission and bonus dispute resolution under employment agreement
- Equal Pay Act: sex-based wage discrimination claims
- DOL Wage and Hour Division complaint filing
- State labor department wage claim procedures and penalties`,
    termination: `Deep expertise in wrongful termination disputes:
- At-will employment exceptions: public policy, implied contract, good faith
- WARN Act: 60-day advance notice for mass layoffs (100+ employees)
- Constructive discharge: intolerable conditions forcing resignation
- Severance agreement review: consideration, release scope, non-disparagement
- Unemployment benefits eligibility after termination
- EEOC charge filing: 180/300 day deadline depending on state
- Wrongful termination in violation of anti-retaliation statutes`,
    discrimination: `Deep expertise in employment discrimination disputes:
- Title VII protected classes: race, color, religion, sex, national origin
- ADA reasonable accommodation and interactive process requirements
- Age discrimination (ADEA): protections for workers 40+
- Pregnancy discrimination: PDA and PWFA accommodations
- EEOC charge filing procedures and right-to-sue letter timeline
- State civil rights agency dual-filing and work-sharing agreements
- Hostile work environment: severe or pervasive standard
- Sexual harassment: quid pro quo vs hostile environment`,
    benefits: `Deep expertise in employee benefits disputes:
- ERISA: fiduciary duty, plan document requirements, claims procedures
- COBRA continuation coverage: 60-day election, 18/36 month duration
- 401(k) contribution disputes and employer match vesting schedules
- Health insurance continuation and conversion rights
- PTO payout requirements (state-specific: use-it-or-lose-it restrictions)
- FMLA: 12 weeks unpaid leave, serious health condition certification
- Short-term disability claim denial appeals`,
    workplace: `Deep expertise in workplace conditions disputes:
- OSHA complaint filing: online, phone (1-800-321-OSHA), or in writing
- OSHA Section 11(c): anti-retaliation for safety complaints (30-day filing)
- Workers' compensation: exclusive remedy doctrine and exceptions
- Ergonomic injury claims and employer duty to provide safe workstation
- Workplace bullying: legal options when not based on protected class
- NIOSH Health Hazard Evaluation requests for workplace exposures
- State-specific workplace safety agencies and complaint procedures`,
    retaliation: `Deep expertise in workplace retaliation disputes:
- Title VII anti-retaliation: protected activity, adverse action, causal connection
- Whistleblower protections: SOX (90 days), Dodd-Frank (6 years), state laws
- FMLA retaliation: interference and retaliation as separate claims
- OSHA Section 11(c) anti-retaliation (30-day filing deadline)
- Workers' compensation retaliation protections (state-specific)
- Burden-shifting framework: McDonnell Douglas for circumstantial evidence
- Temporal proximity as evidence of retaliatory motive`,
  },
  'HOA & Property': {
    fees: `Deep expertise in HOA fee and assessment disputes:
- Governing document review: CC&Rs, bylaws, assessment authority limits
- Special assessment challenge procedures (member vote requirements)
- Late fee and interest rate limitations (state HOA statutes)
- Assessment lien priority and foreclosure procedures
- Reserve fund adequacy requirements and study mandates
- Audit and financial statement access rights
- Payment plan and hardship accommodation requests`,
    violations: `Deep expertise in HOA violation and fine disputes:
- Due process requirements: written notice, opportunity to be heard
- Selective enforcement defense (equal protection within community)
- Architectural review committee appeal procedures
- Fine schedule disclosure and escalation requirements
- Grandfathering and pre-existing condition defenses
- Reasonable rule standard: must be rationally related to community purpose
- State HOA fine limitations and collection restrictions`,
    maintenance: `Deep expertise in HOA maintenance disputes:
- Common area maintenance obligations under CC&Rs
- Individual lot/unit vs common area responsibility boundaries
- Deferred maintenance and reserve fund mismanagement claims
- Emergency repair authorization and assessment procedures
- Vendor selection and conflict of interest issues
- Insurance claim coordination for common area damage
- Owner self-help rights when HOA fails to maintain`,
    neighbor: `Deep expertise in property neighbor disputes:
- HOA rule enforcement request procedures
- Noise violation documentation and complaint filing
- Property boundary and encroachment disputes
- Tree and vegetation: overhanging branch trimming rights
- Parking violation enforcement and towing authorization
- Pet restriction enforcement and nuisance animal complaints
- Mediation as prerequisite before litigation (some CC&Rs require)`,
    governance: `Deep expertise in HOA governance disputes:
- Open meeting requirements (state HOA sunshine laws)
- Board election procedures and candidacy rights
- Proxy voting rules and quorum requirements
- Board member conflict of interest and fiduciary duty
- Record inspection rights (financial statements, meeting minutes, contracts)
- Recall and removal procedures for board members
- State HOA ombudsman or dispute resolution program filing`,
  },
  'Refunds & Purchases': {
    refunds: `Deep expertise in consumer refund disputes:
- FTC refund rule: sellers must refund within specified timeframes
- State consumer protection refund requirements
- Credit card chargeback: 60-day window, billing error vs quality dispute
- Cash vs credit refund obligations (state-specific)
- Restocking fee limitations and advance disclosure requirements
- Digital product and service refund rights
- Small claims court filing for refused refunds (state limits vary $2,500-$25,000)`,
    warranty: `Deep expertise in warranty disputes:
- Magnuson-Moss Warranty Act: full vs limited warranty obligations
- UCC implied warranty of merchantability (4-year statute of limitations)
- Warranty registration requirements and post-sale modifications
- Extended warranty / service contract cancellation and pro-rata refund
- Lemon law applicability to consumer products (some states)
- FTC Used Car Rule: Buyer's Guide requirements
- State warranty enforcement and attorney general complaints`,
    subscriptions: `Deep expertise in subscription and recurring billing disputes:
- ROSCA requirements: clear disclosure and express consent
- State auto-renewal laws and cancellation rights
- FTC negative option and click-to-cancel rules
- Unauthorized recurring charge dispute procedures
- Pro-rata refund rights upon mid-cycle cancellation
- Free trial conversion: affirmative consent requirements
- Credit card recurring charge dispute under Regulation Z`,
    delivery: `Deep expertise in delivery and shipping disputes:
- FTC Mail Order Rule: delivery by promised date or refund option
- UCC risk of loss: when title passes from seller to buyer
- Carrier liability for damage in transit (Carmack Amendment for interstate)
- Last-mile delivery disputes and proof of delivery challenges
- Missing package claims: seller vs carrier responsibility
- State consumer protection for non-delivery
- International shipping: customs, duties, and delay responsibilities`,
    service: `Deep expertise in service complaint resolution:
- Breach of contract for services not rendered as agreed
- State consumer protection statutes for unfair service practices
- Professional licensing board complaints (contractors, professionals)
- BBB complaint filing and response procedures
- State attorney general consumer protection division complaints
- Small claims court for service disputes
- Deceptive advertising claims under Lanham Act and state UDAP laws`,
  },
  'Damaged Goods': {
    'delivery-damage': `Deep expertise in delivery damage disputes:
- Carrier liability: Carmack Amendment (interstate), state law (intrastate)
- Concealed damage: report within 15 days of delivery for freight claims
- Seller responsibility under UCC: risk of loss for shipment vs destination contracts
- Photo documentation requirements at time of delivery
- Freight claim filing procedures and 9-month claim deadline
- Last-mile carrier vs seller liability for consumer deliveries
- Insurance claim coordination for high-value shipments`,
    defective: `Deep expertise in defective product disputes:
- UCC § 2-314: implied warranty of merchantability standards
- UCC § 2-315: implied warranty of fitness for particular purpose
- Product liability theories: strict liability, negligence, breach of warranty
- Buyer's right to reject (reasonable inspection period) or revoke acceptance
- CPSC complaint filing for unsafe consumer products
- State lemon law extensions to consumer products (some jurisdictions)
- Class action eligibility for widespread product defects`,
    misrepresentation: `Deep expertise in product misrepresentation disputes:
- FTC Act Section 5: deceptive advertising and marketing claims
- State UDAP statutes: unfair and deceptive acts and practices
- Product description accuracy requirements for online sales
- Counterfeit product liability: platform, seller, and manufacturer
- False advertising claims: Lanham Act (competitors) and state consumer law
- Bait-and-switch tactics: FTC Guides Against Deceptive Pricing
- Photo/listing accuracy requirements and material omissions`,
    'warranty-repair': `Deep expertise in warranty and repair disputes:
- Magnuson-Moss: manufacturer must provide remedy within reasonable time
- Implied warranty duration tie to express warranty (Magnuson-Moss)
- Right to choose between repair, replacement, or refund (for full warranties)
- Unauthorized repair and warranty voiding limitations (FTC right-to-repair)
- Service center delay and repeated repair attempt remedies
- Extended warranty claim denial appeal procedures
- State consumer protection for failure to honor warranty obligations`,
  },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fieldId, fieldLabel, fieldValue, category, subcategory, templateSlug, templateTitle, context } = await req.json();

    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    // Input validation
    if (!action || typeof action !== 'string' || !['suggest', 'analyze'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action. Must be "suggest" or "analyze"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (fieldLabel !== undefined && (typeof fieldLabel !== 'string' || fieldLabel.length > 200)) {
      return new Response(JSON.stringify({ error: 'fieldLabel must be a string under 200 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (fieldValue !== undefined && (typeof fieldValue !== 'string' || fieldValue.length > 10000)) {
      return new Response(JSON.stringify({ error: 'fieldValue must be a string under 10,000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (templateTitle !== undefined && (typeof templateTitle !== 'string' || templateTitle.length > 300)) {
      return new Response(JSON.stringify({ error: 'templateTitle must be a string under 300 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (category !== undefined && (typeof category !== 'string' || category.length > 100)) {
      return new Response(JSON.stringify({ error: 'category must be a string under 100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (context !== undefined) {
      const contextStr = JSON.stringify(context);
      if (contextStr.length > 50000) {
        return new Response(JSON.stringify({ error: 'context payload too large (max 50KB)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Build expertise: category-level + subcategory-level if available
    let expertise = categoryExpertise[category] || 'You are an expert in consumer dispute resolution.';
    const subExpertise = subcategory && subcategoryExpertise[category]?.[subcategory];
    if (subExpertise) {
      expertise += '\n\n' + subExpertise;
    }

    let systemPrompt = `${expertise}

You are helping a user fill out a formal dispute letter. Your role is to:
1. Review their input and suggest improvements
2. Point out missing information that could weaken their case
3. Help them phrase things more effectively for a formal complaint

IMPORTANT RULES:
- Never provide legal advice
- Be concise - one or two sentences max
- Be encouraging but specific
- Focus on practical improvements
- Suggest evidence they should reference if applicable`;

    let userPrompt = '';

    if (action === 'suggest') {
      userPrompt = `The user is writing a "${templateTitle}" letter in the ${category} category.

They just filled in the "${fieldLabel}" field with:
"${fieldValue}"

${context ? `Other fields they've completed: ${JSON.stringify(context)}` : ''}

Please provide a brief, helpful suggestion to improve this specific field. If the content is good, suggest what evidence or details they could add. If it's weak, suggest how to make it more effective. Keep your response to 1-2 sentences.`;
    } else if (action === 'analyze') {
      userPrompt = `The user is writing a "${templateTitle}" letter in the ${category} category.

Here are all the fields they've completed:
${JSON.stringify(context, null, 2)}

Please analyze the overall strength of their letter and provide:
1. A score from 1-100
2. Top 2-3 specific suggestions to make their case stronger
3. Any critical missing information

Respond in JSON format:
{
  "score": number,
  "level": "weak" | "moderate" | "strong",
  "suggestions": ["suggestion1", "suggestion2"],
  "missingInfo": ["missing1"] or null,
  "summary": "One sentence overall assessment"
}`;
    } else {
      throw new Error('Invalid action');
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOOGLE_GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable API error:', errorText);
      throw new Error(`Lovable API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    if (action === 'suggest') {
      return new Response(
        JSON.stringify({ suggestion: aiResponse.trim() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Parse JSON response for analysis
      try {
        const analysis = JSON.parse(aiResponse);
        return new Response(
          JSON.stringify(analysis),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch {
        // If not valid JSON, return as summary
        return new Response(
          JSON.stringify({ 
            score: 50, 
            level: 'moderate', 
            suggestions: [], 
            summary: aiResponse.trim() 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error: unknown) {
    console.error('Form assistant error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
