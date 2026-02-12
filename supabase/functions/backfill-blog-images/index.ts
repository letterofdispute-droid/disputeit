import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageWithGoogle, imageResultToBuffer, shouldBailOut } from "../_shared/googleImageGen.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 3;
const DELAY_BETWEEN_IMAGES_MS = 3000;

const STYLE_VARIANTS = ['warm', 'cool', 'neutral', 'dramatic'] as const;
const STYLE_GUIDES: Record<string, string> = {
  warm: 'warm golden lighting, earthy tones, inviting atmosphere, sunset colors',
  cool: 'cool blue tones, modern clean aesthetic, crisp lighting, professional',
  neutral: 'balanced natural colors, soft daylight, professional office setting',
  dramatic: 'high contrast, dynamic shadows, bold composition, striking visuals',
};

function pickStyle(): string {
  return STYLE_GUIDES[STYLE_VARIANTS[Math.floor(Math.random() * STYLE_VARIANTS.length)]];
}

async function generateSEOAltText(apiKey: string, title: string, imageType: string): Promise<string> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: `Generate SEO-optimized alt text for a ${imageType} blog image. 10-15 words max. Describe the likely scene. No "image of" or "photo of".` },
          { role: 'user', content: `Article: "${title}"` }
        ],
        temperature: 0.5,
        max_tokens: 50,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const alt = data.choices[0]?.message?.content?.trim();
      if (alt) return alt.replace(/['"]/g, '').substring(0, 125);
    }
  } catch (e) {
    console.log('[BACKFILL] Alt text gen failed:', e);
  }
  return title.replace(/['"]/g, '').substring(0, 100);
}

async function generateAndUpload(
  supabase: any,
  geminiKey: string,
  lovableKey: string,
  post: { id: string; title: string; slug: string },
  imageType: 'featured' | 'middle1' | 'middle2',
): Promise<{ url: string; alt: string } | null> {
  const style = pickStyle();
  const storagePath = `articles/${post.slug}-${imageType}`;

  const prompts: Record<string, string> = {
    featured: `Generate a REALISTIC PHOTOGRAPH for: "${post.title}"
CRITICAL: Must be a REALISTIC PHOTOGRAPH, NOT an illustration.
Professional stock photo quality, 16:9 aspect ratio.
Style: ${style}
Suitable for a consumer rights website. No text overlays.`,
    middle1: `Generate a REALISTIC PHOTOGRAPH showing a detailed scene or process related to: "${post.title}"
CRITICAL: Must be a REALISTIC PHOTOGRAPH with real people or real environments.
Show a specific moment, action, or detail relevant to the topic.
Style: ${style}
16:9 aspect ratio, professional quality. No text overlays.`,
    middle2: `Generate a REALISTIC PHOTOGRAPH showing a supporting perspective on: "${post.title}"
CRITICAL: Must be a REALISTIC PHOTOGRAPH, NOT a diagram or illustration.
Show an alternative angle, environment, or aspect of the topic.
Style: ${style}
16:9 aspect ratio, professional quality. No text overlays.`,
  };

  try {
    const result = await generateImageWithGoogle(prompts[imageType], geminiKey);
    const { buffer, extension } = await imageResultToBuffer(result);

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}.${extension}`, buffer, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`[BACKFILL] Upload error for ${post.slug} ${imageType}:`, uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.${extension}`);

    const alt = await generateSEOAltText(lovableKey, post.title, imageType);
    console.log(`[BACKFILL] ${imageType} success: ${post.slug}`);
    return { url: urlData.publicUrl, alt };
  } catch (err) {
    if (shouldBailOut(err)) throw err; // Re-throw bail errors
    console.log(`[BACKFILL] ${imageType} failed for ${post.slug}: ${(err as any).message}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;
    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'status';

    // STATUS mode
    if (mode === 'status') {
      const [{ count: mFeatured }, { count: mMiddle1 }, { count: mMiddle2 }] = await Promise.all([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published').is('featured_image_url', null),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published').is('middle_image_1_url', null),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published').is('middle_image_2_url', null),
      ]);

      return new Response(JSON.stringify({
        missing_featured: mFeatured || 0,
        missing_middle1: mMiddle1 || 0,
        missing_middle2: mMiddle2 || 0,
        total_missing: (mFeatured || 0) + (mMiddle1 || 0) + (mMiddle2 || 0),
        status: 'idle',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // START mode
    if (mode === 'start') {
      if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: posts, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category_slug, featured_image_url, middle_image_1_url, middle_image_2_url')
        .eq('status', 'published')
        .or('featured_image_url.is.null,middle_image_1_url.is.null,middle_image_2_url.is.null')
        .order('created_at', { ascending: false })
        .limit(BATCH_SIZE);

      if (fetchError) throw fetchError;

      if (!posts || posts.length === 0) {
        return new Response(JSON.stringify({
          processed: 0, remaining: 0, status: 'complete',
          message: 'All published articles have images',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Count total remaining articles (not images)
      const { count: totalRemaining } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .or('featured_image_url.is.null,middle_image_1_url.is.null,middle_image_2_url.is.null');

      let processed = 0;
      let imagesGenerated = 0;
      let bailed = false;

      for (const post of posts) {
        if (bailed) break;

        try {
          const update: Record<string, string | null> = {};

          // Generate each missing image with delay between
          if (!post.featured_image_url) {
            const result = await generateAndUpload(supabase, geminiKey, lovableKey, post, 'featured');
            if (result) { update.featured_image_url = result.url; update.featured_image_alt = result.alt; imagesGenerated++; }
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_IMAGES_MS));
          }

          if (!post.middle_image_1_url && !bailed) {
            const result = await generateAndUpload(supabase, geminiKey, lovableKey, post, 'middle1');
            if (result) { update.middle_image_1_url = result.url; update.middle_image_1_alt = result.alt; imagesGenerated++; }
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_IMAGES_MS));
          }

          if (!post.middle_image_2_url && !bailed) {
            const result = await generateAndUpload(supabase, geminiKey, lovableKey, post, 'middle2');
            if (result) { update.middle_image_2_url = result.url; update.middle_image_2_alt = result.alt; imagesGenerated++; }
          }

          // Update DB if any images were generated
          if (Object.keys(update).length > 0) {
            await supabase.from('blog_posts').update(update).eq('id', post.id);
          }
          processed++;
        } catch (err) {
          if (shouldBailOut(err)) {
            console.error(`[BACKFILL] Bail out: ${(err as any).message}`);
            bailed = true;
          } else {
            console.error(`[BACKFILL] Error processing ${post.slug}:`, err);
          }
        }
      }

      const remaining = (totalRemaining || 0) - processed;
      const hasMore = remaining > 0 && !bailed;

      // Self-chain if more to process
      if (hasMore) {
        try {
          const chainResponse = await fetch(`${supabaseUrl}/functions/v1/backfill-blog-images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            },
            body: JSON.stringify({ mode: 'start' }),
          });
          if (!chainResponse.ok && chainResponse.status !== 504) {
            console.error(`[BACKFILL] Chain call failed: ${chainResponse.status}`);
          }
        } catch (chainErr) {
          console.error('[BACKFILL] Chain error:', chainErr);
        }
      }

      return new Response(JSON.stringify({
        processed, imagesGenerated, remaining, bailed,
        status: hasMore ? 'processing' : (bailed ? 'paused' : 'complete'),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode. Use "status" or "start".' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BACKFILL] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
