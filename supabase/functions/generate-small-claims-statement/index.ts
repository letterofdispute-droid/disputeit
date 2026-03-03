import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stateCode, stateName, courtName, claimAmount, disputeType, description, remedy, defendantName, plaintiffName } = await req.json();

    if (!stateCode || !stateName || !claimAmount || !disputeType || !description || !defendantName || !plaintiffName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate inputs
    if (description.length > 2000 || defendantName.length > 100 || plaintiffName.length > 100) {
      return new Response(JSON.stringify({ error: 'Input exceeds maximum length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const disputeLabels: Record<string, string> = {
      'unpaid-debt': 'Unpaid Debt / Money Owed',
      'property-damage': 'Property Damage',
      'contract-breach': 'Breach of Contract',
      'security-deposit': 'Security Deposit Dispute',
      'defective-goods': 'Defective Product',
      'services-not-rendered': 'Services Not Rendered',
      'auto-repair': 'Auto Repair Dispute',
      'landlord-tenant': 'Landlord-Tenant Dispute',
    };

    const disputeLabel = disputeLabels[disputeType] || disputeType;

    const prompt = `You are a legal document drafting assistant. Generate a formal Small Claims Court Statement of Claim / Plaintiff's Statement based on the following information.

STATE: ${stateName} (${stateCode})
COURT: ${courtName}
PLAINTIFF: ${plaintiffName}
DEFENDANT: ${defendantName}
CLAIM AMOUNT: $${claimAmount.toLocaleString()}
DISPUTE TYPE: ${disputeLabel}
DESCRIPTION OF FACTS: ${description}
REQUESTED REMEDY: ${remedy}

Generate a properly formatted statement that includes:
1. A court header appropriate for ${courtName} in ${stateName}
2. Case caption with plaintiff and defendant names
3. Numbered factual allegations (based on the description provided)
4. A section citing the legal basis for the claim (reference relevant ${stateName} consumer protection statutes where applicable)
5. A prayer for relief requesting the stated remedy plus court costs and filing fees
6. A signature block for the plaintiff

Format it as a clean, professional legal document. Use plain language appropriate for a pro se (self-represented) litigant. Do NOT fabricate facts — only use what was provided. Do NOT include a case number (leave it as "Case No.: ___________").

Output ONLY the statement text — no markdown, no explanations, no commentary.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GOOGLE_GEMINI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', errText);
      throw new Error('Failed to generate statement');
    }

    const data = await response.json();
    const statement = data.choices?.[0]?.message?.content?.trim();

    if (!statement) {
      throw new Error('Empty response from AI');
    }

    return new Response(JSON.stringify({ statement }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate statement' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
