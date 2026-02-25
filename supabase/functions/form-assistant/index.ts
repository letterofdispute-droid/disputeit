// Form Assistant Edge Function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

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
  },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fieldId, fieldLabel, fieldValue, category, subcategory, templateSlug, templateTitle, context } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
