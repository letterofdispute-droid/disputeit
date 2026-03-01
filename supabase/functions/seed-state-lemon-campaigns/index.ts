import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// All 50 states with their lemon law statute names
const STATES: { code: string; name: string; statute: string }[] = [
  { code: "AL", name: "Alabama", statute: "Alabama Lemon Law" },
  { code: "AK", name: "Alaska", statute: "Alaska Lemon Law" },
  { code: "AZ", name: "Arizona", statute: "Arizona Lemon Law" },
  { code: "AR", name: "Arkansas", statute: "Arkansas New Motor Vehicle Quality Assurance Act" },
  { code: "CA", name: "California", statute: "Song-Beverly Consumer Warranty Act" },
  { code: "CO", name: "Colorado", statute: "Colorado Automotive Defect Law" },
  { code: "CT", name: "Connecticut", statute: "Connecticut Lemon Law" },
  { code: "DE", name: "Delaware", statute: "Delaware Lemon Law" },
  { code: "FL", name: "Florida", statute: "Florida Motor Vehicle Warranty Enforcement Act" },
  { code: "GA", name: "Georgia", statute: "Georgia Lemon Law" },
  { code: "HI", name: "Hawaii", statute: "Hawaii Lemon Law" },
  { code: "ID", name: "Idaho", statute: "Idaho Lemon Law" },
  { code: "IL", name: "Illinois", statute: "Illinois New Vehicle Buyer Protection Act" },
  // Indiana skipped - already has published articles
  { code: "IA", name: "Iowa", statute: "Iowa Lemon Law" },
  { code: "KS", name: "Kansas", statute: "Kansas Consumer Protection Act (Lemon Law)" },
  { code: "KY", name: "Kentucky", statute: "Kentucky Motor Vehicle Warranty Act" },
  { code: "LA", name: "Louisiana", statute: "Louisiana Lemon Law" },
  { code: "ME", name: "Maine", statute: "Maine Lemon Law" },
  { code: "MD", name: "Maryland", statute: "Maryland Automobile Warranty Enforcement Act" },
  { code: "MA", name: "Massachusetts", statute: "Massachusetts Lemon Aid Law" },
  { code: "MI", name: "Michigan", statute: "Michigan Lemon Law" },
  { code: "MN", name: "Minnesota", statute: "Minnesota Motor Vehicle Warranty Law" },
  { code: "MS", name: "Mississippi", statute: "Mississippi Motor Vehicle Warranty Enforcement Act" },
  { code: "MO", name: "Missouri", statute: "Missouri Merchandising Practices Act (Lemon Law)" },
  { code: "MT", name: "Montana", statute: "Montana Lemon Law" },
  { code: "NE", name: "Nebraska", statute: "Nebraska Motor Vehicle Warranty Act" },
  { code: "NV", name: "Nevada", statute: "Nevada Motor Vehicle Warranty Act" },
  { code: "NH", name: "New Hampshire", statute: "New Hampshire Lemon Law" },
  { code: "NJ", name: "New Jersey", statute: "New Jersey Lemon Law" },
  { code: "NM", name: "New Mexico", statute: "New Mexico Motor Vehicle Quality Assurance Act" },
  { code: "NY", name: "New York", statute: "New York Lemon Law" },
  { code: "NC", name: "North Carolina", statute: "North Carolina New Vehicle Warranties Act" },
  { code: "ND", name: "North Dakota", statute: "North Dakota Lemon Law" },
  { code: "OH", name: "Ohio", statute: "Ohio Lemon Law" },
  { code: "OK", name: "Oklahoma", statute: "Oklahoma Motor Vehicle Lemon Law" },
  { code: "OR", name: "Oregon", statute: "Oregon Lemon Law" },
  { code: "PA", name: "Pennsylvania", statute: "Pennsylvania Automobile Lemon Law" },
  { code: "RI", name: "Rhode Island", statute: "Rhode Island Lemon Law" },
  { code: "SC", name: "South Carolina", statute: "South Carolina Lemon Law" },
  { code: "SD", name: "South Dakota", statute: "South Dakota Motor Vehicle Lemon Law" },
  { code: "TN", name: "Tennessee", statute: "Tennessee Motor Vehicle Warranty Act" },
  { code: "TX", name: "Texas", statute: "Texas Lemon Law (DTPA)" },
  { code: "UT", name: "Utah", statute: "Utah New Motor Vehicle Warranties Act" },
  { code: "VT", name: "Vermont", statute: "Vermont Lemon Law" },
  { code: "VA", name: "Virginia", statute: "Virginia Motor Vehicle Warranty Enforcement Act" },
  { code: "WA", name: "Washington", statute: "Washington Lemon Law" },
  { code: "WV", name: "West Virginia", statute: "West Virginia Lemon Law" },
  { code: "WI", name: "Wisconsin", statute: "Wisconsin Lemon Law" },
  { code: "WY", name: "Wyoming", statute: "Wyoming Lemon Law" },
];

// 12 cluster angle templates - each state gets 5 randomly selected
interface ClusterAngle {
  id: string;
  articleType: string;
  titleTemplate: string; // {state}, {statute} placeholders
  keywordsTemplate: string[]; // {state}, {stateAdj} placeholders
}

const CLUSTER_ANGLES: ClusterAngle[] = [
  {
    id: "file-claim",
    articleType: "how-to",
    titleTemplate: "How to File a {state} Lemon Law Claim: Step-by-Step Process",
    keywordsTemplate: [
      "{state} lemon law claim",
      "file lemon law {state}",
      "how to file {stateAdj} lemon law",
      "{state} lemon law process",
    ],
  },
  {
    id: "mistakes",
    articleType: "mistakes",
    titleTemplate: "Costly Mistakes {state} Drivers Make with Lemon Law Claims",
    keywordsTemplate: [
      "{state} lemon law mistakes",
      "lemon law errors {state}",
      "{stateAdj} lemon law denied",
      "why {state} lemon law claims fail",
    ],
  },
  {
    id: "used-cars",
    articleType: "faq",
    titleTemplate: "Does {state}'s Lemon Law Cover Used Cars and Private Sales?",
    keywordsTemplate: [
      "{state} lemon law used cars",
      "{stateAdj} used car lemon law",
      "does lemon law apply to used cars {state}",
      "{state} private sale lemon law",
    ],
  },
  {
    id: "statute-provisions",
    articleType: "rights",
    titleTemplate: "{statute}: Key Provisions and What They Mean for You",
    keywordsTemplate: [
      "{statute}",
      "{state} lemon law rights",
      "{stateAdj} lemon law provisions",
      "{state} consumer protection vehicle",
    ],
  },
  {
    id: "manufacturer-vs-dealer",
    articleType: "comparison",
    titleTemplate: "{state} Lemon Law: Manufacturer vs Dealer Obligations Explained",
    keywordsTemplate: [
      "{state} lemon law manufacturer responsibility",
      "dealer vs manufacturer {state} lemon law",
      "{stateAdj} vehicle warranty obligations",
      "who pays {state} lemon law",
    ],
  },
  {
    id: "timeline-deadlines",
    articleType: "checklist",
    titleTemplate: "{state} Lemon Law Timeline: Deadlines and Key Dates You Must Know",
    keywordsTemplate: [
      "{state} lemon law deadline",
      "{stateAdj} lemon law time limit",
      "how long to file lemon law {state}",
      "{state} lemon law statute of limitations",
    ],
  },
  {
    id: "arbitration",
    articleType: "how-to",
    titleTemplate: "Navigating Lemon Law Arbitration in {state}: What to Expect",
    keywordsTemplate: [
      "{state} lemon law arbitration",
      "{stateAdj} lemon law mediation",
      "arbitration process {state} lemon law",
      "{state} vehicle dispute resolution",
    ],
  },
  {
    id: "attorney-selection",
    articleType: "how-to",
    titleTemplate: "Finding the Right Lemon Law Attorney in {state}: A Practical Guide",
    keywordsTemplate: [
      "{state} lemon law attorney",
      "lemon law lawyer {state}",
      "best lemon law attorney {state}",
      "{stateAdj} lemon law legal help",
    ],
  },
  {
    id: "documentation",
    articleType: "checklist",
    titleTemplate: "Essential Documentation for Your {state} Lemon Law Case",
    keywordsTemplate: [
      "{state} lemon law evidence",
      "{stateAdj} lemon law documentation",
      "what to document lemon law {state}",
      "{state} lemon law records needed",
    ],
  },
  {
    id: "buyback-vs-replacement",
    articleType: "comparison",
    titleTemplate: "Lemon Law Buyback vs Replacement in {state}: Which Is Better?",
    keywordsTemplate: [
      "{state} lemon law buyback",
      "{stateAdj} lemon law replacement",
      "lemon law refund vs new car {state}",
      "{state} vehicle buyback options",
    ],
  },
  {
    id: "federal-vs-state",
    articleType: "comparison",
    titleTemplate: "Federal vs {state} Lemon Law: Which Gives You Stronger Protection?",
    keywordsTemplate: [
      "federal vs {state} lemon law",
      "{stateAdj} lemon law vs magnuson moss",
      "federal lemon law {state}",
      "{state} vs federal vehicle warranty",
    ],
  },
  {
    id: "case-outcomes",
    articleType: "case-study",
    titleTemplate: "Real {state} Lemon Law Cases: Outcomes and Lessons Learned",
    keywordsTemplate: [
      "{state} lemon law cases",
      "{stateAdj} lemon law success stories",
      "lemon law settlements {state}",
      "{state} lemon law case results",
    ],
  },
];

// Deterministic shuffle using state code as seed
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Get state adjective form (e.g., "California" -> "California", "New York" -> "New York")
function getStateAdj(name: string): string {
  // Most state names work as adjectives directly
  return name;
}

function fillTemplate(template: string, state: typeof STATES[0]): string {
  return template
    .replace(/\{state\}/g, state.name)
    .replace(/\{statute\}/g, state.statute)
    .replace(/\{stateAdj\}/g, getStateAdj(state.name));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: { state: string; planId: string; queueCount: number }[] = [];
    const errors: { state: string; error: string }[] = [];

    for (const state of STATES) {
      try {
        // Create content_plan for this state
        const templateSlug = `lemon-law-${state.name.toLowerCase().replace(/\s+/g, "-")}`;
        const templateName = `${state.name} Lemon Law`;

        // Check if plan already exists
        const { data: existingPlan } = await supabase
          .from("content_plans")
          .select("id")
          .eq("template_slug", templateSlug)
          .maybeSingle();

        if (existingPlan) {
          console.log(`Plan already exists for ${state.name}, skipping`);
          continue;
        }

        const { data: plan, error: planError } = await supabase
          .from("content_plans")
          .insert({
            template_slug: templateSlug,
            template_name: templateName,
            category_id: "vehicle",
            subcategory_slug: "lemon-law",
            value_tier: "medium",
            target_article_count: 6,
          })
          .select("id")
          .single();

        if (planError) throw planError;

        // Create pillar article
        const pillarTitle = `${state.name} Lemon Law: Your Complete Guide to Vehicle Owner Rights`;
        const pillarKeywords = [
          `${state.name} lemon law`,
          `${state.name} lemon law rights`,
          `${state.statute}`,
          `lemon law ${state.name}`,
          `${state.name} vehicle warranty`,
        ];

        const queueItems: any[] = [
          {
            plan_id: plan.id,
            article_type: "pillar",
            suggested_title: pillarTitle,
            suggested_keywords: pillarKeywords,
            primary_keyword: `${state.name} lemon law`,
            secondary_keywords: pillarKeywords.slice(1),
            priority: 100,
            status: "queued",
          },
        ];

        // Select 5 cluster angles deterministically
        const shuffled = seededShuffle(CLUSTER_ANGLES, state.code);
        const selected = shuffled.slice(0, 5);

        for (let i = 0; i < selected.length; i++) {
          const angle = selected[i];
          const title = fillTemplate(angle.titleTemplate, state);
          const keywords = angle.keywordsTemplate.map((k) =>
            fillTemplate(k, state)
          );

          queueItems.push({
            plan_id: plan.id,
            article_type: angle.articleType,
            suggested_title: title,
            suggested_keywords: keywords,
            primary_keyword: keywords[0],
            secondary_keywords: keywords.slice(1),
            priority: 80 - i * 5, // 80, 75, 70, 65, 60
            status: "queued",
          });
        }

        const { error: queueError } = await supabase
          .from("content_queue")
          .insert(queueItems);

        if (queueError) throw queueError;

        results.push({
          state: state.name,
          planId: plan.id,
          queueCount: queueItems.length,
        });

        console.log(`✓ ${state.name}: ${queueItems.length} articles queued`);
      } catch (err: any) {
        console.error(`✗ ${state.name}: ${err.message}`);
        errors.push({ state: state.name, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        seeded: results.length,
        totalArticles: results.reduce((s, r) => s + r.queueCount, 0),
        errors: errors.length,
        errorDetails: errors,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
