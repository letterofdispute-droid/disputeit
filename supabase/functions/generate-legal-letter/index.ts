import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateLegalLetterRequest {
  templateCategory: string;
  templateName: string;
  templateSlug: string;
  formData: Record<string, string>;
  jurisdiction: 'US' | 'UK' | 'EU' | 'generic';
  tone: 'neutral' | 'firm' | 'final';
}

/**
 * Legal Knowledge Database - Embedded for edge function
 */
const LEGAL_KNOWLEDGE: Record<string, {
  statutes: { name: string; citation: string; rights: string[] }[];
  agencies: { name: string; abbr: string; website: string }[];
  timeframes: { context: string; days: number }[];
  escalations: string[];
}> = {
  financial: {
    statutes: [
      { name: 'Fair Credit Reporting Act', citation: '15 U.S.C. § 1681', rights: ['Right to dispute inaccurate information', 'Right to free annual credit report', 'Right to sue for violations'] },
      { name: 'Fair Debt Collection Practices Act', citation: '15 U.S.C. § 1692', rights: ['Right to debt validation', 'Right to cease communication', 'Protection from harassment'] },
    ],
    agencies: [
      { name: 'Consumer Financial Protection Bureau', abbr: 'CFPB', website: 'consumerfinance.gov' },
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
    ],
    timeframes: [{ context: 'Credit bureau investigation', days: 30 }, { context: 'Debt validation response', days: 30 }],
    escalations: ['File CFPB complaint', 'Report to State Attorney General', 'Pursue legal action under FCRA'],
  },
  insurance: {
    statutes: [
      { name: 'State Insurance Code', citation: 'Varies by state', rights: ['Right to timely claim processing', 'Right to written denial explanation', 'Right to appeal'] },
    ],
    agencies: [
      { name: 'State Department of Insurance', abbr: 'DOI', website: 'naic.org' },
    ],
    timeframes: [{ context: 'Claim acknowledgment', days: 15 }, { context: 'Claim decision', days: 30 }],
    escalations: ['File complaint with State Insurance Commissioner', 'Request external review', 'Pursue bad faith claim'],
  },
  vehicle: {
    statutes: [
      { name: 'Magnuson-Moss Warranty Act', citation: '15 U.S.C. §§ 2301-2312', rights: ['Right to repair/replacement/refund', 'Right to sue for warranty violations', 'Right to attorney fee recovery'] },
      { name: 'State Lemon Law', citation: 'Varies by state', rights: ['Right to buyback after repeated repair failures', 'Right to replacement vehicle'] },
    ],
    agencies: [
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
      { name: 'National Highway Traffic Safety Administration', abbr: 'NHTSA', website: 'nhtsa.gov' },
    ],
    timeframes: [{ context: 'Warranty repair completion', days: 30 }, { context: 'Lemon law buyback response', days: 30 }],
    escalations: ['Invoke manufacturer dispute resolution', 'File State AG complaint', 'Pursue Lemon Law arbitration'],
  },
  housing: {
    statutes: [
      { name: 'Fair Housing Act', citation: '42 U.S.C. §§ 3601-3619', rights: ['Right to be free from discrimination', 'Right to reasonable accommodations'] },
      { name: 'State Landlord-Tenant Law', citation: 'Varies by state', rights: ['Right to habitable premises', 'Right to security deposit return', 'Right to repairs'] },
    ],
    agencies: [
      { name: 'Department of Housing and Urban Development', abbr: 'HUD', website: 'hud.gov' },
      { name: 'Local Housing Authority', abbr: 'LHA', website: 'varies' },
    ],
    timeframes: [{ context: 'Security deposit return', days: 30 }, { context: 'Emergency repairs', days: 3 }, { context: 'Non-emergency repairs', days: 14 }],
    escalations: ['File complaint with local code enforcement', 'Invoke repair-and-deduct', 'File small claims for deposit'],
  },
  refunds: {
    statutes: [
      { name: 'FTC Act Section 5', citation: '15 U.S.C. § 45', rights: ['Right to be free from deceptive practices'] },
      { name: 'Fair Credit Billing Act', citation: '15 U.S.C. § 1666', rights: ['Right to dispute billing errors', 'Right to withhold payment during dispute'] },
    ],
    agencies: [
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
      { name: 'State Attorney General', abbr: 'AG', website: 'naag.org' },
    ],
    timeframes: [{ context: 'Billing error acknowledgment', days: 30 }, { context: 'Refund processing', days: 7 }],
    escalations: ['File credit card chargeback', 'Report to FTC', 'File small claims suit'],
  },
  travel: {
    statutes: [
      { name: 'DOT Aviation Consumer Protection Regulations', citation: '14 CFR Part 259', rights: ['Right to refund for cancelled flights', 'Right to denied boarding compensation', 'Right to tarmac delay protocols'] },
    ],
    agencies: [
      { name: 'Department of Transportation', abbr: 'DOT', website: 'transportation.gov/airconsumer' },
    ],
    timeframes: [{ context: 'Flight refund (credit card)', days: 7 }, { context: 'Flight refund (cash)', days: 20 }],
    escalations: ['File DOT complaint', 'Dispute with credit card', 'Invoke Montreal Convention (international)'],
  },
  utilities: {
    statutes: [
      { name: 'Telecommunications Act', citation: '47 U.S.C. § 151', rights: ['Right to accurate billing', 'Right to service as advertised'] },
    ],
    agencies: [
      { name: 'Federal Communications Commission', abbr: 'FCC', website: 'fcc.gov' },
      { name: 'State Public Utility Commission', abbr: 'PUC', website: 'varies' },
    ],
    timeframes: [{ context: 'Billing dispute response', days: 30 }],
    escalations: ['File FCC complaint', 'File State PUC complaint', 'Report to State AG'],
  },
  employment: {
    statutes: [
      { name: 'Fair Labor Standards Act', citation: '29 U.S.C. § 201', rights: ['Right to minimum wage', 'Right to overtime pay', 'Right to recover back pay'] },
      { name: 'Title VII Civil Rights Act', citation: '42 U.S.C. § 2000e', rights: ['Right to be free from discrimination'] },
    ],
    agencies: [
      { name: 'Department of Labor', abbr: 'DOL', website: 'dol.gov' },
      { name: 'Equal Employment Opportunity Commission', abbr: 'EEOC', website: 'eeoc.gov' },
    ],
    timeframes: [{ context: 'Final paycheck', days: 14 }, { context: 'EEOC charge deadline', days: 180 }],
    escalations: ['File DOL wage complaint', 'File EEOC charge', 'Pursue private legal action'],
  },
  healthcare: {
    statutes: [
      { name: 'No Surprises Act', citation: 'Pub. L. 116-260', rights: ['Right to be free from surprise balance bills', 'Right to good faith cost estimate'] },
      { name: 'HIPAA', citation: '42 U.S.C. § 1320d', rights: ['Right to access medical records', 'Right to privacy'] },
    ],
    agencies: [
      { name: 'Centers for Medicare & Medicaid Services', abbr: 'CMS', website: 'cms.gov' },
      { name: 'State Department of Insurance', abbr: 'DOI', website: 'varies' },
    ],
    timeframes: [{ context: 'Appeal insurance denial', days: 60 }, { context: 'Dispute surprise bill', days: 30 }],
    escalations: ['File internal appeal', 'Request external review', 'Report to State Insurance Commissioner'],
  },
  ecommerce: {
    statutes: [
      { name: 'Electronic Fund Transfer Act', citation: '15 U.S.C. § 1693', rights: ['Right to dispute unauthorized transactions', 'Limited liability for fraud'] },
      { name: 'FTC Mail Order Rule', citation: '16 CFR Part 435', rights: ['Right to timely shipping or cancellation'] },
    ],
    agencies: [
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
    ],
    timeframes: [{ context: 'Ship within stated time or', days: 30 }, { context: 'EFT dispute', days: 60 }],
    escalations: ['File credit card dispute', 'Report to FTC', 'Use platform dispute resolution'],
  },
  hoa: {
    statutes: [
      { name: 'Fair Housing Act', citation: '42 U.S.C. §§ 3601-3619', rights: ['Right to be free from discriminatory enforcement'] },
      { name: 'State HOA Act', citation: 'Varies by state', rights: ['Right to open meetings', 'Right to financial disclosure', 'Right to dispute resolution'] },
    ],
    agencies: [
      { name: 'Department of Housing and Urban Development', abbr: 'HUD', website: 'hud.gov' },
      { name: 'State Real Estate Division', abbr: 'DRE', website: 'varies' },
    ],
    timeframes: [{ context: 'Fine appeal', days: 30 }, { context: 'Records request response', days: 30 }],
    escalations: ['Request formal hearing', 'File State complaint', 'Pursue mediation', 'File HUD complaint for discrimination'],
  },
  contractors: {
    statutes: [
      { name: 'State Home Improvement Act', citation: 'Varies by state', rights: ['Right to written contract', 'Right to rescission period', 'Right to lien waivers'] },
    ],
    agencies: [
      { name: 'State Contractor Licensing Board', abbr: 'CSLB', website: 'varies' },
      { name: 'State Attorney General', abbr: 'AG', website: 'naag.org' },
    ],
    timeframes: [{ context: 'Contract rescission (door-to-door)', days: 3 }, { context: 'Warranty claim', days: 365 }],
    escalations: ['Send written cure demand', 'File licensing board complaint', 'File bond claim', 'Pursue small claims'],
  },
  'damaged-goods': {
    statutes: [
      { name: 'Magnuson-Moss Warranty Act', citation: '15 U.S.C. §§ 2301-2312', rights: ['Right to repair/replacement/refund', 'Right to clear warranty terms'] },
      { name: 'UCC Implied Warranties', citation: 'Uniform Commercial Code', rights: ['Right to merchantable goods', 'Right to goods fit for purpose'] },
    ],
    agencies: [
      { name: 'Consumer Product Safety Commission', abbr: 'CPSC', website: 'cpsc.gov' },
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
    ],
    timeframes: [{ context: 'Reject defective goods', days: 30 }, { context: 'Warranty claim response', days: 30 }],
    escalations: ['Return within reasonable time', 'File chargeback', 'Report unsafe products to CPSC', 'File small claims'],
  },
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  neutral: `
TONE: Professional and Courteous
- Use polite but clear language
- Reference legal rights as context, not threats
- Request resolution as a reasonable expectation
- Closing: "I trust this matter can be resolved amicably"
`,
  firm: `
TONE: Firm and Direct
- Use assertive, unambiguous language
- Clearly state violations and legal basis
- Demand specific resolution with deadline
- Reference regulatory oversight
- Closing: "I expect prompt resolution of this matter"
`,
  final: `
TONE: Final Notice / Pre-Escalation
- State this is a final attempt at informal resolution
- Cite specific statutory violations with precision
- List concrete next steps if unresolved (regulatory complaints, legal action)
- Include explicit deadline
- Closing: "If I do not receive a satisfactory response by [deadline], I will be compelled to pursue all available remedies including [specific agencies/courts]"
`
};

/**
 * Build the legal expert system prompt
 */
function buildSystemPrompt(category: string, jurisdiction: string, tone: string): string {
  const knowledge = LEGAL_KNOWLEDGE[category] || LEGAL_KNOWLEDGE['refunds'];
  
  const statuteList = knowledge.statutes
    .map(s => `- ${s.name} (${s.citation}): ${s.rights.join('; ')}`)
    .join('\n');
  
  const agencyList = knowledge.agencies
    .map(a => `- ${a.name} (${a.abbr}) - ${a.website}`)
    .join('\n');
  
  const timeframeList = knowledge.timeframes
    .map(t => `- ${t.context}: ${t.days} days`)
    .join('\n');
  
  const escalationList = knowledge.escalations
    .map(e => `- ${e}`)
    .join('\n');

  return `You are an experienced consumer rights attorney drafting a formal dispute letter for a client.

JURISDICTION: ${jurisdiction}

APPLICABLE LEGAL FRAMEWORK:
${statuteList}

REGULATORY AGENCIES:
${agencyList}

KEY TIMEFRAMES:
${timeframeList}

ESCALATION PATHS:
${escalationList}

${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.firm}

LETTER STRUCTURE (you MUST follow this format):
1. RE: Line with clear subject and reference numbers
2. Opening paragraph establishing the dispute and legal basis
3. BACKGROUND section with chronological facts
4. LEGAL BASIS section citing specific statutes and violations
5. REQUESTED RESOLUTION section with numbered demands
6. NOTICE OF FURTHER ACTION section with deadline and escalation paths
7. Closing with signature block placeholder

WRITING RULES:
- Write in first person as the consumer
- Be factually precise - only reference facts provided by the user
- Cite specific statute sections when applicable
- Include specific deadlines (calculate from today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
- Reference regulatory complaint processes with specificity
- Use formal legal letter formatting
- DO NOT include placeholders like [Your Name] - leave space for signature block

CRITICAL RESTRICTIONS:
- NEVER provide legal advice or promise outcomes
- NEVER invent facts not provided by the user
- NEVER make threats without legal basis
- NEVER cite statutes outside the provided framework unless you are certain they apply
- NEVER guarantee success or specific results
- If user data is incomplete, write around it professionally

OUTPUT FORMAT:
Return ONLY the letter body text, starting with "Re:" line.
Do not include any preamble or explanation.`;
}

/**
 * Build the user prompt from form data
 */
function buildUserPrompt(templateName: string, formData: Record<string, string>): string {
  // Filter out empty values and format nicely
  const facts = Object.entries(formData)
    .filter(([_, value]) => value && value.trim())
    .map(([key, value]) => {
      // Convert camelCase to readable format
      const readableKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      return `${readableKey}: ${value}`;
    })
    .join('\n');

  return `Draft a formal dispute letter for the following matter:

TEMPLATE TYPE: ${templateName}

CLIENT'S FACTS:
${facts}

Generate a complete, professionally written dispute letter based on these facts. The letter should be ready to print and send.`;
}

/**
 * Validate AI output for safety
 */
function validateOutput(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for promises of outcomes
  const promisePatterns = [
    /you will win/i,
    /guaranteed/i,
    /I guarantee/i,
    /certain to succeed/i,
    /will definitely/i,
  ];
  
  for (const pattern of promisePatterns) {
    if (pattern.test(content)) {
      issues.push(`Contains promise language: ${pattern.source}`);
    }
  }
  
  // Check for inappropriate threats
  const threatPatterns = [
    /I will sue you personally/i,
    /criminal charges/i,
    /have you arrested/i,
    /destroy your/i,
  ];
  
  for (const pattern of threatPatterns) {
    if (pattern.test(content)) {
      issues.push(`Contains inappropriate threat: ${pattern.source}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: GenerateLegalLetterRequest = await req.json();
    const { templateCategory, templateName, formData, jurisdiction, tone } = body;

    if (!templateCategory || !templateName || !formData) {
      throw new Error("Missing required fields: templateCategory, templateName, formData");
    }

    console.log(`Generating legal letter for ${templateName} (${templateCategory}) - ${tone} tone, ${jurisdiction} jurisdiction`);

    const systemPrompt = buildSystemPrompt(templateCategory, jurisdiction, tone);
    const userPrompt = buildUserPrompt(templateName, formData);

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, professional output
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const letterContent = aiData.choices?.[0]?.message?.content;

    if (!letterContent) {
      throw new Error("AI returned empty content");
    }

    // Validate the output
    const validation = validateOutput(letterContent);
    if (!validation.valid) {
      console.warn("Letter validation issues:", validation.issues);
      // Don't block, just log - the letter is still usable
    }

    console.log(`Successfully generated letter (${letterContent.length} characters)`);

    return new Response(
      JSON.stringify({
        success: true,
        letterContent,
        metadata: {
          templateCategory,
          templateName,
          jurisdiction,
          tone,
          generatedAt: new Date().toISOString(),
          validationIssues: validation.issues,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating legal letter:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
