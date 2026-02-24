import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateImageWithGoogle, imageResultToRawBuffer, isGoogleImageError, shouldBailOut } from "../_shared/googleImageGen.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All page definitions with their prompts
const PAGE_DEFINITIONS: Record<string, { title: string; prompt: string }> = {
  // Homepage
  homepage: {
    title: 'Homepage',
    prompt: 'A confident person writing a formal letter at a modern desk with documents and a laptop, warm natural lighting, professional stock photo quality. Consumer advocacy and dispute resolution theme. 16:9 landscape aspect ratio, 1200x630 pixels. No text overlays.',
  },
  // Static pages
  pricing: {
    title: 'Pricing',
    prompt: 'A clean, professional workspace with pricing documents, a calculator, and a laptop showing a pricing page. Warm tones, business-oriented. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  faq: {
    title: 'FAQ',
    prompt: 'A friendly customer service representative answering questions at a modern helpdesk, warm natural lighting. Professional stock photo quality. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  about: {
    title: 'About',
    prompt: 'A diverse team working together in a modern office on consumer rights documents. Collaborative, warm atmosphere. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  contact: {
    title: 'Contact',
    prompt: 'A person reaching out for help, hands typing on a laptop with a cup of coffee, warm inviting workspace. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'how-it-works': {
    title: 'How It Works',
    prompt: 'Step-by-step document preparation process shown on a clean desk with a laptop, printed letters, and organized papers. Professional, clear, methodical. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  deadlines: {
    title: 'Deadlines & Time Limits',
    prompt: 'A calendar, clock, and legal documents on a professional desk, conveying urgency and time management for consumer disputes. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'analyze-letter': {
    title: 'Letter Analyzer',
    prompt: 'A magnifying glass over a formal letter with highlighted sections and a checklist, analysis and review theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'consumer-news': {
    title: 'Consumer News',
    prompt: 'A newspaper with consumer rights headlines on a modern desk with a tablet showing news articles. Current events, information theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'do-i-have-a-case': {
    title: 'Do I Have a Case?',
    prompt: 'A person looking thoughtfully at documents with a question mark notepad, evaluating their consumer rights situation. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  // Small Claims
  'small-claims-hub': {
    title: 'Small Claims Court Guide',
    prompt: 'A small claims courtroom with wooden benches and an American flag, accessible and approachable legal setting. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'small-claims-cost-calculator': {
    title: 'Small Claims Cost Calculator',
    prompt: 'A calculator, legal filing documents, and coins/dollar bills on a professional desk, cost analysis for court filing. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'small-claims-demand-letter': {
    title: 'Demand Letter Cost',
    prompt: 'A formal demand letter with a seal being prepared on a professional desk, certified mail envelope nearby. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'small-claims-escalation': {
    title: 'Escalation Guide',
    prompt: 'An escalation staircase diagram concept with documents moving from letter to courtroom, showing progression. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  // State Rights
  'state-rights': {
    title: 'State Consumer Rights',
    prompt: 'A map of the United States with legal documents and a gavel, state-by-state consumer protection theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  // Category pages
  'category-refunds': {
    title: 'Refunds & Purchases',
    prompt: 'A person returning a product at a store counter with a receipt, consumer refund and purchase dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-housing': {
    title: 'Housing',
    prompt: 'An apartment building entrance with keys being handed over, tenant rights and housing dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-travel': {
    title: 'Travel',
    prompt: 'An airport departure board with a frustrated traveler looking at a delayed flight, travel dispute and compensation theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-damaged-goods': {
    title: 'Damaged Goods',
    prompt: 'A damaged package being opened with broken product inside, consumer complaint about product quality. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-utilities': {
    title: 'Utilities & Telecom',
    prompt: 'Utility bills and a smartphone on a desk, overcharging and telecom service dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-financial': {
    title: 'Financial',
    prompt: 'Bank statements, a credit card, and financial documents on a desk, banking and financial dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-insurance': {
    title: 'Insurance',
    prompt: 'An insurance policy document with a claim form being filled out, insurance dispute and claim denial theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-vehicle': {
    title: 'Vehicle',
    prompt: 'A car at a repair shop with a mechanic looking under the hood and an invoice, vehicle repair and dealer dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-healthcare': {
    title: 'Healthcare',
    prompt: 'Medical bills and insurance paperwork on a desk with a stethoscope, healthcare billing dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-employment': {
    title: 'Employment',
    prompt: 'A professional office setting with employment contract and paycheck documents, workplace rights and employment dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-ecommerce': {
    title: 'E-commerce',
    prompt: 'An online shopping screen with a package and return label, e-commerce dispute and online purchase complaint theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-hoa': {
    title: 'HOA & Property',
    prompt: 'A suburban neighborhood with HOA meeting documents and architectural review papers, homeowner association dispute theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
  'category-contractors': {
    title: 'Contractors',
    prompt: 'A construction site with blueprints and an unfinished renovation, contractor dispute and home improvement complaint theme. Professional stock photo. 16:9 landscape, 1200x630 pixels. No text overlays.',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pages, regenerate } = await req.json() as {
      pages?: string[];
      regenerate?: boolean;
    };

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which pages to generate
    let pageKeys = pages || Object.keys(PAGE_DEFINITIONS);

    // If not regenerating, filter out pages that already have images
    if (!regenerate) {
      const { data: existing } = await supabase
        .from('og_images')
        .select('page_key')
        .in('page_key', pageKeys);
      const existingKeys = new Set((existing || []).map((r: any) => r.page_key));
      pageKeys = pageKeys.filter(k => !existingKeys.has(k));
    }

    // Filter to valid keys
    pageKeys = pageKeys.filter(k => PAGE_DEFINITIONS[k]);

    if (pageKeys.length === 0) {
      return new Response(JSON.stringify({ message: 'All OG images already exist', generated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[OG] Generating ${pageKeys.length} OG images...`);

    const results: { key: string; url?: string; error?: string }[] = [];
    let bailedOut = false;

    for (const key of pageKeys) {
      if (bailedOut) {
        results.push({ key, error: 'Skipped (rate limited)' });
        continue;
      }

      const def = PAGE_DEFINITIONS[key];
      console.log(`[OG] Generating: ${key} (${def.title})`);

      try {
        const result = await generateImageWithGoogle(def.prompt, geminiKey);
        const { buffer, extension } = imageResultToRawBuffer(result);

        const fileName = `${key}.${extension}`;

        // Upload to og-images bucket
        const { error: uploadError } = await supabase.storage
          .from('og-images')
          .upload(fileName, buffer, {
            contentType: result.mimeType,
            upsert: true,
          });

        if (uploadError) {
          console.error(`[OG] Upload error for ${key}:`, uploadError);
          results.push({ key, error: uploadError.message });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('og-images')
          .getPublicUrl(fileName);

        // Upsert into og_images table
        const { error: dbError } = await supabase
          .from('og_images')
          .upsert({
            page_key: key,
            image_url: publicUrl,
            prompt_used: def.prompt,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'page_key' });

        if (dbError) {
          console.error(`[OG] DB error for ${key}:`, dbError);
        }

        results.push({ key, url: publicUrl });
        console.log(`[OG] ✅ ${key} → ${publicUrl}`);

        // Rate limit delay between generations (1 second)
        if (pageKeys.indexOf(key) < pageKeys.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`[OG] Error generating ${key}:`, err);
        if (shouldBailOut(err)) {
          bailedOut = true;
          results.push({ key, error: isGoogleImageError(err) ? err.message : 'Rate limited' });
        } else {
          results.push({ key, error: isGoogleImageError(err) ? err.message : String(err) });
        }
      }
    }

    const generated = results.filter(r => r.url).length;
    const failed = results.filter(r => r.error).length;

    return new Response(JSON.stringify({
      message: `Generated ${generated} OG images (${failed} failed)`,
      generated,
      failed,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[OG] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
