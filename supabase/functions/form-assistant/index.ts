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
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fieldId, fieldLabel, fieldValue, category, templateTitle, context } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const expertise = categoryExpertise[category] || 'You are an expert in consumer dispute resolution.';

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
