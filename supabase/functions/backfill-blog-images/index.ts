import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageWithGoogle, imageResultToBuffer, isGoogleImageError, shouldBailOut } from "../_shared/googleImageGen.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 5;
const DELAY_BETWEEN_IMAGES_MS = 3000;

// Style variants for diversity
const STYLE_VARIANTS = ['warm', 'cool', 'neutral', 'dramatic'] as const;
const STYLE_GUIDES: Record<string, string> = {
  warm: 'warm golden lighting, earthy tones, inviting atmosphere, sunset colors',
  cool: 'cool blue tones, modern clean aesthetic, crisp lighting, professional',
  neutral: 'balanced natural colors, soft daylight, professional office setting',
  dramatic: 'high contrast, dynamic shadows, bold composition, striking visuals',
};

async function generateSEOAltText(apiKey: string, title: string): Promise<string> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `Generate SEO-optimized alt text for a blog image. 10-15 words max. Describe the likely scene. No "image of" or "photo of".`
          },
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

async function fetchPixabayFallback(
  supabase: any,
  title: string,
  storagePath: string
): Promise<{ url: string | null; altText: string | null }> {
  const pixabayKey = Deno.env.get('PIXABAY_API_KEY');
  if (!pixabayKey) return { url: null, altText: null };

  try {
    const cleanQuery = title
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter((w: string) => w.length > 2)
      .slice(0, 4)
      .join(' ');

    const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&per_page=20&safesearch=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.hits?.length) return { url: null, altText: null };

    const hit = data.hits[Math.floor(Math.random() * Math.min(data.hits.length, 10))];
    const imageResponse = await fetch(hit.largeImageURL);
    if (!imageResponse.ok) return { url: null, altText: null };

    const imageBuffer = await imageResponse.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}.jpg`, imageBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) return { url: null, altText: null };

    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(`${storagePath}.jpg`);
    return { url: urlData.publicUrl, altText: title.substring(0, 100) };
  } catch (e) {
    console.error('[BACKFILL] Pixabay fallback error:', e);
    return { url: null, altText: null };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'status';

    // STATUS mode: return count of missing images
    if (mode === 'status') {
      const { count: missingFeatured } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .is('featured_image_url', null);

      return new Response(JSON.stringify({
        missing_featured: missingFeatured || 0,
        status: 'idle',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // START mode: process a batch
    if (mode === 'start') {
      const { data: posts, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category_slug')
        .eq('status', 'published')
        .is('featured_image_url', null)
        .order('created_at', { ascending: false })
        .limit(BATCH_SIZE);

      if (fetchError) throw fetchError;

      if (!posts || posts.length === 0) {
        return new Response(JSON.stringify({
          processed: 0,
          remaining: 0,
          status: 'complete',
          message: 'All published articles have images',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Count total remaining
      const { count: totalRemaining } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .is('featured_image_url', null);

      let processed = 0;
      let failed = 0;
      let bailed = false;

      for (const post of posts) {
        if (bailed) break;

        try {
          const styleVariant = STYLE_VARIANTS[Math.floor(Math.random() * STYLE_VARIANTS.length)];
          const styleGuide = STYLE_GUIDES[styleVariant];
          const storagePath = `articles/${post.slug}-featured`;

          let imageUrl: string | null = null;
          let altText: string | null = null;

          // Try Gemini first
          if (geminiKey) {
            try {
              const prompt = `Generate a REALISTIC PHOTOGRAPH for: "${post.title}"
CRITICAL: Must be a REALISTIC PHOTOGRAPH, NOT an illustration.
Professional stock photo quality, 16:9 aspect ratio.
Style: ${styleGuide}
Suitable for a consumer rights website. No text overlays.`;

              const result = await generateImageWithGoogle(prompt, geminiKey);
              const { buffer, extension } = await imageResultToBuffer(result);

              const { error: uploadError } = await supabase.storage
                .from('blog-images')
                .upload(`${storagePath}.${extension}`, buffer, {
                  contentType: result.mimeType,
                  upsert: true,
                });

              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from('blog-images')
                  .getPublicUrl(`${storagePath}.${extension}`);
                imageUrl = urlData.publicUrl;
                altText = await generateSEOAltText(apiKey, post.title);
                console.log(`[BACKFILL] Gemini success: ${post.slug}`);
              }
            } catch (imgErr) {
              if (shouldBailOut(imgErr)) {
                console.error(`[BACKFILL] Bail out: ${(imgErr as any).message}`);
                bailed = true;
              } else {
                console.log(`[BACKFILL] Gemini failed for ${post.slug}, trying Pixabay`);
              }
            }
          }

          // Pixabay fallback
          if (!imageUrl && !bailed) {
            const fallback = await fetchPixabayFallback(supabase, post.title, storagePath);
            imageUrl = fallback.url;
            altText = fallback.altText;
            if (imageUrl) console.log(`[BACKFILL] Pixabay success: ${post.slug}`);
          }

          if (imageUrl) {
            await supabase
              .from('blog_posts')
              .update({ featured_image_url: imageUrl, featured_image_alt: altText })
              .eq('id', post.id);
            processed++;
          } else {
            failed++;
          }

          // Rate limit delay between images
          if (!bailed) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_IMAGES_MS));
          }
        } catch (err) {
          console.error(`[BACKFILL] Error processing ${post.slug}:`, err);
          failed++;
        }
      }

      const remaining = (totalRemaining || 0) - processed;
      const hasMore = remaining > 0 && !bailed;

      // Self-chain if more to process
      if (hasMore) {
        try {
          const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
          const chainResponse = await fetch(`${supabaseUrl}/functions/v1/backfill-blog-images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': anonKey,
            },
            body: JSON.stringify({ mode: 'start' }),
          });
          // Treat 504 as success (chained call is processing)
          if (!chainResponse.ok && chainResponse.status !== 504) {
            console.error(`[BACKFILL] Chain call failed: ${chainResponse.status}`);
          }
        } catch (chainErr) {
          console.error('[BACKFILL] Chain error:', chainErr);
        }
      }

      return new Response(JSON.stringify({
        processed,
        failed,
        remaining,
        bailed,
        status: hasMore ? 'processing' : (bailed ? 'paused' : 'complete'),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode. Use "status" or "start".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BACKFILL] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
