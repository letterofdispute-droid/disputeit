import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageWithGoogle, imageResultToRawBuffer, shouldBailOut } from "../_shared/googleImageGen.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

async function generateAndUpload(
  supabase: any,
  geminiKey: string,
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
    middle1: `Generate a REALISTIC PHOTOGRAPH showing a detailed scene related to: "${post.title}"
CRITICAL: Must be a REALISTIC PHOTOGRAPH with real people or real environments.
Style: ${style}
16:9 aspect ratio, professional quality. No text overlays.`,
    middle2: `Generate a REALISTIC PHOTOGRAPH showing a supporting perspective on: "${post.title}"
CRITICAL: Must be a REALISTIC PHOTOGRAPH, NOT a diagram or illustration.
Style: ${style}
16:9 aspect ratio, professional quality. No text overlays.`,
  };

  console.log(`[BACKFILL] Generating ${imageType} for: ${post.slug}`);

  const result = await generateImageWithGoogle(prompts[imageType], geminiKey);
  const { buffer, extension } = imageResultToRawBuffer(result);

  console.log(`[BACKFILL] Generated ${imageType} for ${post.slug} (${(buffer.byteLength / 1024).toFixed(0)}KB)`);

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

  const alt = post.title.replace(/['"]/g, '').substring(0, 125);
  console.log(`[BACKFILL] Upload complete: ${imageType} -> ${urlData.publicUrl}`);
  return { url: urlData.publicUrl, alt };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'status';
    const jobId = body.jobId || null;

    // ── STATUS MODE ──
    if (mode === 'status') {
      // Count actually missing images (placeholder-aware)
      const [{ count: mFeatured }, { count: mMiddle1 }, { count: mMiddle2 }] = await Promise.all([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .eq('status', 'published').is('featured_image_url', null),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .eq('status', 'published').is('middle_image_1_url', null)
          .like('content', '%MIDDLE_IMAGE_1%'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .eq('status', 'published').is('middle_image_2_url', null)
          .like('content', '%MIDDLE_IMAGE_2%'),
      ]);

      // Get latest active job if any
      const { data: activeJob } = await supabase
        .from('backfill_jobs')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({
        missing_featured: mFeatured || 0,
        missing_middle1: mMiddle1 || 0,
        missing_middle2: mMiddle2 || 0,
        total_missing: (mFeatured || 0) + (mMiddle1 || 0) + (mMiddle2 || 0),
        job: activeJob || null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── START MODE ──
    if (mode === 'start') {
      if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Count total missing images for the job
      const [{ count: mFeatured }, { count: mMiddle1 }, { count: mMiddle2 }] = await Promise.all([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .eq('status', 'published').is('featured_image_url', null),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .eq('status', 'published').is('middle_image_1_url', null)
          .like('content', '%MIDDLE_IMAGE_1%'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .eq('status', 'published').is('middle_image_2_url', null)
          .like('content', '%MIDDLE_IMAGE_2%'),
      ]);

      const totalMissing = (mFeatured || 0) + (mMiddle1 || 0) + (mMiddle2 || 0);

      if (totalMissing === 0) {
        return new Response(JSON.stringify({ status: 'complete', message: 'All articles have images' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create job row
      const { data: job, error: jobError } = await supabase
        .from('backfill_jobs')
        .insert({ status: 'processing', total_images: totalMissing })
        .select()
        .single();

      if (jobError) throw jobError;

      console.log(`[BACKFILL] Created job ${job.id} with ${totalMissing} total images`);

      // Fire-and-forget: trigger the processing chain
      fetch(`${supabaseUrl}/functions/v1/backfill-blog-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ mode: 'process', jobId: job.id }),
      }).catch(err => console.error('[BACKFILL] Chain trigger error:', err));

      return new Response(JSON.stringify({ status: 'processing', jobId: job.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── PROCESS MODE (internal, self-chaining) ──
    if (mode === 'process') {
      if (!geminiKey || !jobId) {
        return new Response(JSON.stringify({ error: 'Missing geminiKey or jobId' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check job still active
      const { data: job } = await supabase
        .from('backfill_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!job || job.status !== 'processing') {
        console.log(`[BACKFILL] Job ${jobId} not active (status: ${job?.status}), stopping`);
        return new Response(JSON.stringify({ status: 'stopped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch 1 post that ACTUALLY needs images (placeholder-aware query)
      const { data: posts, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, featured_image_url, middle_image_1_url, middle_image_2_url')
        .eq('status', 'published')
        .or('featured_image_url.is.null,middle_image_1_url.is.null,middle_image_2_url.is.null')
        .order('created_at', { ascending: false })
        .limit(10); // fetch 10, filter in code for placeholder awareness

      if (fetchError) throw fetchError;

      // Filter to posts that actually need images
      const post = posts?.find(p => {
        const content = p.content || '';
        const needsFeatured = !p.featured_image_url;
        const needsMiddle1 = !p.middle_image_1_url && content.includes('MIDDLE_IMAGE_1');
        const needsMiddle2 = !p.middle_image_2_url && content.includes('MIDDLE_IMAGE_2');
        return needsFeatured || needsMiddle1 || needsMiddle2;
      });

      if (!post) {
        // No more posts need images — mark complete
        console.log(`[BACKFILL] No more posts need images, marking job ${jobId} complete`);
        await supabase.from('backfill_jobs').update({
          status: 'complete', updated_at: new Date().toISOString(),
        }).eq('id', jobId);

        return new Response(JSON.stringify({ status: 'complete' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const content = post.content || '';
      const needsFeatured = !post.featured_image_url;
      const needsMiddle1 = !post.middle_image_1_url && content.includes('MIDDLE_IMAGE_1');
      const needsMiddle2 = !post.middle_image_2_url && content.includes('MIDDLE_IMAGE_2');

      console.log(`[BACKFILL] Processing post: ${post.slug}, needs: featured=${needsFeatured}, mid1=${needsMiddle1}, mid2=${needsMiddle2}`);

      let imagesGenerated = 0;
      let imagesFailed = 0;
      let bailed = false;

      try {
        const update: Record<string, string | null> = {};

        if (needsFeatured) {
          try {
            const result = await generateAndUpload(supabase, geminiKey, post, 'featured');
            if (result) { update.featured_image_url = result.url; update.featured_image_alt = result.alt; imagesGenerated++; }
            else { imagesFailed++; }
          } catch (err) {
            if (shouldBailOut(err)) throw err;
            console.error(`[BACKFILL] Featured failed for ${post.slug}:`, (err as any).message);
            imagesFailed++;
          }
          if (needsMiddle1 || needsMiddle2) await new Promise(r => setTimeout(r, DELAY_BETWEEN_IMAGES_MS));
        }

        if (needsMiddle1 && !bailed) {
          try {
            const result = await generateAndUpload(supabase, geminiKey, post, 'middle1');
            if (result) { update.middle_image_1_url = result.url; update.middle_image_1_alt = result.alt; imagesGenerated++; }
            else { imagesFailed++; }
          } catch (err) {
            if (shouldBailOut(err)) throw err;
            console.error(`[BACKFILL] Middle1 failed for ${post.slug}:`, (err as any).message);
            imagesFailed++;
          }
          if (needsMiddle2) await new Promise(r => setTimeout(r, DELAY_BETWEEN_IMAGES_MS));
        }

        if (needsMiddle2 && !bailed) {
          try {
            const result = await generateAndUpload(supabase, geminiKey, post, 'middle2');
            if (result) { update.middle_image_2_url = result.url; update.middle_image_2_alt = result.alt; imagesGenerated++; }
            else { imagesFailed++; }
          } catch (err) {
            if (shouldBailOut(err)) throw err;
            console.error(`[BACKFILL] Middle2 failed for ${post.slug}:`, (err as any).message);
            imagesFailed++;
          }
        }

        // Update blog post
        if (Object.keys(update).length > 0) {
          await supabase.from('blog_posts').update(update).eq('id', post.id);
        }

        // Update job progress atomically
        await supabase.rpc('increment_backfill_progress', {
          p_job_id: jobId,
          p_processed: imagesGenerated,
          p_failed: imagesFailed,
          p_last_slug: post.slug,
        });

        console.log(`[BACKFILL] Batch done: ${imagesGenerated} generated, ${imagesFailed} failed for ${post.slug}`);

      } catch (err) {
        if (shouldBailOut(err)) {
          console.error(`[BACKFILL] Bail out: ${(err as any).message}`);
          await supabase.from('backfill_jobs').update({
            status: 'paused',
            last_error: (err as any).message,
            updated_at: new Date().toISOString(),
          }).eq('id', jobId);

          return new Response(JSON.stringify({ status: 'paused', reason: (err as any).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error(`[BACKFILL] Error processing ${post.slug}:`, err);
        await supabase.rpc('increment_backfill_progress', {
          p_job_id: jobId, p_processed: imagesGenerated, p_failed: imagesFailed + 1,
          p_last_slug: post.slug,
        });
        await supabase.from('backfill_jobs').update({
          last_error: (err as any).message,
          updated_at: new Date().toISOString(),
        }).eq('id', jobId);
      }

      // Fire-and-forget self-chain for next post
      console.log(`[BACKFILL] Chain triggered for next batch, job=${jobId}`);
      fetch(`${supabaseUrl}/functions/v1/backfill-blog-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ mode: 'process', jobId }),
      }).catch(err => console.error('[BACKFILL] Chain error:', err));

      return new Response(JSON.stringify({ status: 'processing', imagesGenerated, imagesFailed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BACKFILL] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
