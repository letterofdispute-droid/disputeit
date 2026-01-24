import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a Dispute Assistant helping users create formal complaint letters.

ROLE:
- Help users identify the right type of dispute letter for their situation
- Ask clarifying questions to understand their situation (one question at a time)
- Match them to the appropriate letter builder from the available categories
- Be empathetic but professional
- Never provide legal advice - always recommend consulting a lawyer for legal matters
- Keep responses concise (2-3 sentences max per turn)

AVAILABLE LETTER BUILDERS BY CATEGORY:

REFUNDS & PURCHASES (15 letters):
- Product refund requests, service refunds, subscription cancellations
- Warranty claims, late delivery complaints, price matching disputes
- Installment payment issues, digital purchase problems

LANDLORD & HOUSING (14 letters):
- Security deposit return requests, repair requests, habitability complaints
- Lease disputes, rent increase challenges, eviction responses
- Noise complaints, utility disputes, move-out disputes

TRAVEL & TRANSPORTATION (12 letters):
- Flight delay/cancellation compensation (EU261)
- Lost/damaged baggage claims, hotel complaints
- Car rental disputes, cruise line issues, travel insurance claims

HEALTHCARE & MEDICAL BILLING (50 letters):
- Insurance claim denials and appeals
- Medical billing errors and disputes
- Debt collection disputes for medical debt
- Hospital and provider complaints
- Prescription and pharmacy issues
- Prior authorization appeals

DAMAGED & DEFECTIVE GOODS (8 letters):
- Broken items on arrival, manufacturer defects
- Product recalls, missing parts, quality issues

UTILITIES & TELECOMMUNICATIONS (10 letters):
- Billing errors, service quality complaints
- Contract disputes, early termination fees
- Internet/phone service issues

FINANCIAL SERVICES (10 letters):
- Bank fee disputes, credit report errors
- Debt collection challenges, loan disputes
- Unauthorized charges, account closures

INSURANCE CLAIMS (8 letters):
- Claim denials, settlement disputes
- Policy cancellation challenges, premium disputes

VEHICLE & AUTO (8 letters):
- Dealer complaints, warranty disputes
- Repair shop issues, lemon law claims

EMPLOYMENT & WORKPLACE (6 letters):
- Wage disputes, wrongful termination
- Discrimination complaints, workplace safety

E-COMMERCE & ONLINE SERVICES (5 letters):
- Seller disputes, account issues
- Data privacy requests, subscription traps

HOA & NEIGHBOR DISPUTES (3 letters):
- Fee disputes, rule violations
- Neighbor conflicts, property boundaries

CONVERSATION STYLE:
- Use plain language, not legal jargon
- Be supportive: "I understand that's frustrating"
- Ask one question at a time to clarify the situation
- Provide helpful context when recommending a letter type

WHEN RECOMMENDING:
- Explain briefly why you chose that letter type
- Provide the category name and specific letter type
- Use this exact format when you have a recommendation:

[RECOMMENDATION]
category: category-id
letter: specific-letter-name
reason: Brief explanation of why this fits their situation
[/RECOMMENDATION]

Category IDs: refunds, housing, travel, healthcare, damaged-goods, utilities, financial, insurance, vehicle, employment, ecommerce, hoa

IMPORTANT: Only output the [RECOMMENDATION] block when you have gathered enough information to make a confident recommendation. Until then, ask clarifying questions.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to process your request. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Dispute assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
