import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Batch size for bulk processing
const BATCH_SIZE = 5;

interface EmbeddingRequest {
  content_type: "blog_post" | "template" | "category_guide";
  content_id?: string;
  slug?: string;
  batch_size?: number;
  process_pending?: boolean;
  // Bulk processing params
  bulk?: boolean;
  category_filter?: string;
  // Continuation params
  jobId?: string;
  authToken?: string;
  // Retry params
  retryJobId?: string;
  // Force re-embed (ignore hash)
  forceReembed?: boolean;
}

interface ContentData {
  id: string;
  slug: string;
  title: string;
  content?: string;
  category_id: string;
  subcategory_slug?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  article_type?: string;
  article_role: "super-pillar" | "pillar" | "cluster";
}

// Extract text content for embedding
function extractEmbeddingText(data: ContentData, rawContent?: string): string {
  const parts: string[] = [];
  
  parts.push(data.title);
  
  if (data.primary_keyword) {
    parts.push(`Primary topic: ${data.primary_keyword}`);
  }
  
  if (data.secondary_keywords?.length) {
    parts.push(`Related topics: ${data.secondary_keywords.join(", ")}`);
  }
  
  if (rawContent) {
    const textContent = rawContent
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    
    const truncatedContent = textContent.slice(0, 6000);
    parts.push(truncatedContent);
  }
  
  parts.push(`Category: ${data.category_id}`);
  if (data.subcategory_slug) {
    parts.push(`Subcategory: ${data.subcategory_slug}`);
  }
  
  if (data.article_type) {
    parts.push(`Article type: ${data.article_type}`);
  }
  
  return parts.join("\n\n");
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// Calculate content hash for change detection
function calculateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ── Anchor text quality constants ──
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','to','of','in',
  'for','on','with','at','by','from','and','or','but','not','your',
  'you','my','our','how','what','when','why','this','that','it','its',
  'do','does','did','has','have','had','can','could','will','would',
  'should','shall','may','might','about','into','through','during',
  'before','after','just','also','very','here','there','then','than',
  'these','those','such','only','one','so','if','all','no','get',
]);

const GENERIC_STARTERS = [
  'how to handle','how to write','how to dispute','how to file',
  'how to get','how to deal','how to respond','how to challenge',
  'what to do about','what to do when','what to do if',
  'what happens when','what happens if',
  'a guide to','your complete','everything you need',
  'the ultimate','a comprehensive','understanding your',
  'here is how','here is why','tips for','steps to',
  'from ','when your','when a','when the',
];

function isStopWordHeavy(phrase: string): boolean {
  const words = phrase.toLowerCase().split(/\s+/);
  if (words.length === 0) return true;
  const stopCount = words.filter(w => STOP_WORDS.has(w)).length;
  return stopCount / words.length > 0.5;
}

// Generate anchor text variants — NO headings, NO full titles
function generateAnchorVariants(
  title: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[],
): string[] {
  const variants: string[] = [];

  // 1. Primary keyword (best anchor candidate)
  if (primaryKeyword) {
    const words = primaryKeyword.split(/\s+/);
    if (words.length >= 2 && words.length <= 6 && !isStopWordHeavy(primaryKeyword)) {
      variants.push(primaryKeyword);
    }
  }

  // 2. Secondary keywords (2-6 words, non-stop-word-heavy)
  if (secondaryKeywords?.length) {
    for (const kw of secondaryKeywords.slice(0, 4)) {
      const words = kw.split(/\s+/);
      if (words.length >= 2 && words.length <= 6 && !isStopWordHeavy(kw)) {
        variants.push(kw);
      }
    }
  }

  // 3. Extract meaningful segments from the title (NOT headings)
  let cleaned = title;
  // Strip "From 'X' to 'Y': " patterns
  cleaned = cleaned.replace(/^From\s+['"].+?['"]\s+to\s+['"].+?['"]\s*[:–—-]\s*/i, '');
  // Strip generic starters
  for (const starter of GENERIC_STARTERS) {
    if (cleaned.toLowerCase().startsWith(starter)) {
      cleaned = cleaned.slice(starter.length).trim();
      break;
    }
  }

  const segments = cleaned.split(/[-–—:|,;]/)
    .map(s => s.trim().replace(/[.!?'"]+$/g, '').trim())
    .filter(s => {
      const words = s.split(/\s+/);
      return words.length >= 2 && words.length <= 6 && !isStopWordHeavy(s) && s !== title;
    });
  variants.push(...segments);

  // Deduplicate, filter length, never include full title, cap at 8
  return [...new Set(
    variants
      .filter(v => v && v.length >= 8 && v.length <= 60 && v !== title)
      .map(v => v.replace(/[.!?]+$/, '').trim())
  )].slice(0, 8);
}

/**
 * Self-invoke to continue processing the next batch
 */
async function invokeSelf(jobId: string, authToken: string): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const functionUrl = `${supabaseUrl}/functions/v1/generate-embeddings`;
  
  try {
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId, authToken }),
    }).catch(err => {
      console.error(`[EMBEDDINGS] Failed to self-invoke for job ${jobId}:`, err);
    });
    
    console.log(`[EMBEDDINGS] Self-invoked for job ${jobId}`);
  } catch (error) {
    console.error(`[EMBEDDINGS] Error initiating self-invoke:`, error);
  }
}

/**
 * Process next batch for a bulk job
 */
async function processNextBatch(
  supabase: ReturnType<typeof createClient>,
  openaiKey: string,
  jobId: string,
  authToken: string
): Promise<{ complete: boolean; processed: number; failed: number }> {
  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('embedding_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    console.error(`[EMBEDDINGS] Job not found: ${jobId}`);
    return { complete: true, processed: 0, failed: 0 };
  }

  if (job.status !== 'processing') {
    console.log(`[EMBEDDINGS] Job ${jobId} is ${job.status}, stopping`);
    return { complete: true, processed: 0, failed: 0 };
  }

  // Get articles using offset-based pagination (avoids URL length overflow)
  const offset = job.processed_items + job.failed_items;
  
  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, content, category_slug, primary_keyword, secondary_keywords, article_type')
    .eq('status', 'published')
    .order('id', { ascending: true });

  if (job.category_filter) {
    query = query.eq('category_slug', job.category_filter);
  }

  const { data: posts, error: postsError } = await query.range(offset, offset + BATCH_SIZE - 1);

  if (postsError) {
    console.error(`[EMBEDDINGS] Failed to fetch posts:`, postsError);
    await supabase
      .from('embedding_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_messages: { _fetch: postsError.message },
      })
      .eq('id', jobId);
    return { complete: true, processed: 0, failed: 0 };
  }

  if (!posts || posts.length === 0) {
    // No more posts to process - mark complete
    await supabase
      .from('embedding_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    console.log(`[EMBEDDINGS] Job ${jobId} completed`);
    return { complete: true, processed: 0, failed: 0 };
  }

  console.log(`[EMBEDDINGS] Processing batch of ${posts.length} for job ${jobId}`);

  let batchProcessed = 0;
  let batchFailed = 0;
  const newFailedIds: string[] = [];
  const errorMessages: Record<string, string> = {};

  for (const post of posts) {
    try {
      // Determine article role
      let articleRole: "super-pillar" | "pillar" | "cluster" = "cluster";
      if (post.article_type === "pillar") {
        articleRole = "pillar";
      } else if (post.article_type === "category-guide" || post.article_type === "category_guide") {
        articleRole = "super-pillar";
      }

      // Check if embedding exists
      const { data: existing } = await supabase
        .from("article_embeddings")
        .select("id, content_hash")
        .eq("content_id", post.id)
        .eq("content_type", "article")
        .single();

      const embeddingText = extractEmbeddingText({
        id: post.id,
        slug: post.slug,
        title: post.title,
        category_id: post.category_slug,
        primary_keyword: post.primary_keyword,
        secondary_keywords: post.secondary_keywords,
        article_type: post.article_type,
        article_role: articleRole,
      }, post.content);

      const newHash = calculateContentHash(embeddingText);

      // Skip if unchanged
      if (existing?.content_hash === newHash) {
        console.log(`[EMBEDDINGS] Skipping unchanged: ${post.slug}`);
        batchProcessed++;
        continue;
      }

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText, openaiKey);
      const anchorVariants = generateAnchorVariants(
        post.title,
        post.primary_keyword,
        post.secondary_keywords
      );

      const headingsMatch = post.content?.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
      const headingsText = headingsMatch
        .map((h: string) => h.replace(/<[^>]+>/g, ""))
        .join(" | ")
        .slice(0, 500);

      const embeddingData = {
        content_type: "article",
        content_id: post.id,
        slug: post.slug,
        title: post.title,
        category_id: post.category_slug,
        subcategory_slug: null,
        article_role: articleRole,
        article_type: post.article_type,
        primary_keyword: post.primary_keyword,
        secondary_keywords: post.secondary_keywords,
        anchor_variants: anchorVariants,
        headings_text: headingsText,
        embedding: JSON.stringify(embedding),
        embedding_status: "completed",
        content_hash: newHash,
        last_embedded_at: new Date().toISOString(),
        error_message: null,
      };

      if (existing) {
        await supabase
          .from("article_embeddings")
          .update(embeddingData)
          .eq("id", existing.id);
      } else {
        await supabase.from("article_embeddings").insert(embeddingData);
      }

      // Update blog_posts hash
      await supabase
        .from("blog_posts")
        .update({ content_hash: newHash })
        .eq("id", post.id);

      batchProcessed++;
      console.log(`[EMBEDDINGS] Generated: ${post.slug}`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[EMBEDDINGS] Failed ${post.slug}:`, errorMsg);
      newFailedIds.push(post.id);
      errorMessages[post.slug] = errorMsg;
      batchFailed++;
    }
  }

  // Update job progress atomically
  const updatedProcessedItems = job.processed_items + batchProcessed;
  const existingFailedIds = job.failed_ids || [];
  const updatedFailedIds = [...existingFailedIds, ...newFailedIds];
  const updatedErrors = { ...(job.error_messages || {}), ...errorMessages };

  await supabase
    .from('embedding_jobs')
    .update({
      processed_items: updatedProcessedItems,
      failed_items: updatedFailedIds.length,
      failed_ids: updatedFailedIds,
      error_messages: updatedErrors,
    })
    .eq('id', jobId);

  // Check if more to process
  const totalHandled = updatedProcessedItems + updatedFailedIds.length;
  const complete = totalHandled >= job.total_items;

  if (complete) {
    await supabase
      .from('embedding_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    console.log(`[EMBEDDINGS] Job ${jobId} completed. Processed: ${updatedProcessedItems}, Failed: ${updatedFailedIds.length}`);
  } else {
    // Continue with next batch
    invokeSelf(jobId, authToken);
  }

  return { complete, processed: batchProcessed, failed: batchFailed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const body: EmbeddingRequest = await req.json();
    const authToken = req.headers.get('Authorization') || '';

    // Handle continuation request
    if (body.jobId) {
      console.log(`[EMBEDDINGS] Continuing job ${body.jobId}`);
      const result = await processNextBatch(supabase, OPENAI_API_KEY, body.jobId, body.authToken || authToken);
      return new Response(JSON.stringify({
        success: true,
        ...result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle retry failed articles from a previous job
    if (body.retryJobId) {
      console.log(`[EMBEDDINGS] Retrying failed items from job ${body.retryJobId}`);
      
      const { data: oldJob, error: oldJobError } = await supabase
        .from('embedding_jobs')
        .select('*')
        .eq('id', body.retryJobId)
        .single();
      
      if (oldJobError || !oldJob) {
        throw new Error(`Could not find job ${body.retryJobId}`);
      }
      
      const failedIds = oldJob.failed_ids || [];
      if (failedIds.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No failed items to retry',
          jobId: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Create new job for retry
      const { data: job, error: jobError } = await supabase
        .from('embedding_jobs')
        .insert({
          content_type: oldJob.content_type,
          category_filter: oldJob.category_filter,
          total_items: failedIds.length,
          status: 'processing',
        })
        .select()
        .single();
      
      if (jobError) throw jobError;
      
      console.log(`[EMBEDDINGS] Created retry job ${job.id} for ${failedIds.length} failed items`);
      
      // Process failed items
      let processed = 0;
      let failed = 0;
      const newProcessedIds: string[] = [];
      const newFailedIds: string[] = [];
      const errorMessages: Record<string, string> = {};
      
      for (const postId of failedIds.slice(0, BATCH_SIZE)) {
        const { data: post, error: postError } = await supabase
          .from('blog_posts')
          .select('id, slug, title, content, category_slug, primary_keyword, secondary_keywords, article_type')
          .eq('id', postId)
          .single();
        
        if (postError || !post) {
          newFailedIds.push(postId);
          errorMessages[postId] = 'Post not found';
          failed++;
          continue;
        }
        
        try {
          let articleRole: "super-pillar" | "pillar" | "cluster" = "cluster";
          if (post.article_type === "pillar") articleRole = "pillar";
          else if (post.article_type === "category-guide" || post.article_type === "category_guide") articleRole = "super-pillar";
          
          const embeddingText = extractEmbeddingText({
            id: post.id,
            slug: post.slug,
            title: post.title,
            category_id: post.category_slug,
            primary_keyword: post.primary_keyword,
            secondary_keywords: post.secondary_keywords,
            article_type: post.article_type,
            article_role: articleRole,
          }, post.content);
          
          const newHash = calculateContentHash(embeddingText);
          const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
          const anchorVariants = generateAnchorVariants(post.title, post.primary_keyword, post.secondary_keywords);
          
          const headingsMatch = post.content?.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
          const headingsText = headingsMatch.map((h: string) => h.replace(/<[^>]+>/g, "")).join(" | ").slice(0, 500);
          
          const embeddingData = {
            content_type: "article",
            content_id: post.id,
            slug: post.slug,
            title: post.title,
            category_id: post.category_slug,
            article_role: articleRole,
            article_type: post.article_type,
            primary_keyword: post.primary_keyword,
            secondary_keywords: post.secondary_keywords,
            anchor_variants: anchorVariants,
            headings_text: headingsText,
            embedding: JSON.stringify(embedding),
            embedding_status: "completed",
            content_hash: newHash,
            last_embedded_at: new Date().toISOString(),
            error_message: null,
          };
          
          const { data: existing } = await supabase
            .from("article_embeddings")
            .select("id")
            .eq("content_id", post.id)
            .single();
          
          if (existing) {
            await supabase.from("article_embeddings").update(embeddingData).eq("id", existing.id);
          } else {
            await supabase.from("article_embeddings").insert(embeddingData);
          }
          
          newProcessedIds.push(post.id);
          processed++;
          console.log(`[EMBEDDINGS] Retry success: ${post.slug}`);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`[EMBEDDINGS] Retry failed ${post.slug}:`, errorMsg);
          newFailedIds.push(post.id);
          errorMessages[post.slug] = errorMsg;
          failed++;
        }
      }
      
      // Update new job
      const remainingFailed = failedIds.slice(BATCH_SIZE);
      const allFailedIds = [...newFailedIds, ...remainingFailed];
      const complete = allFailedIds.length === 0 && failedIds.length <= BATCH_SIZE;
      
      await supabase
        .from('embedding_jobs')
        .update({
          processed_items: newProcessedIds.length,
          failed_items: allFailedIds.length,
          processed_ids: newProcessedIds,
          failed_ids: allFailedIds,
          error_messages: errorMessages,
          status: complete ? 'completed' : 'processing',
          completed_at: complete ? new Date().toISOString() : null,
        })
        .eq('id', job.id);
      
      // Continue if more to process
      if (!complete && remainingFailed.length > 0) {
        invokeSelf(job.id, authToken);
      }
      
      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        totalItems: failedIds.length,
        processed,
        failed,
        message: `Retrying ${failedIds.length} failed items`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle force re-embed (ignore content hash)
    if (body.forceReembed) {
      console.log(`[EMBEDDINGS] Force re-embed, category: ${body.category_filter || 'all'}`);
      
      // Reset embedding status to pending
      let resetQuery = supabase
        .from('article_embeddings')
        .update({ embedding_status: 'pending', content_hash: null })
        .eq('content_type', 'article');
      
      if (body.category_filter) {
        resetQuery = resetQuery.eq('category_id', body.category_filter);
      }
      
      await resetQuery;
      
      // Now trigger normal bulk processing
      body.bulk = true;
    }

    // Handle bulk processing request
    if (body.bulk) {
      console.log(`[EMBEDDINGS] Starting bulk job, category: ${body.category_filter || 'all'}`);

      // Count total articles to process
      let countQuery = supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      if (body.category_filter) {
        countQuery = countQuery.eq('category_slug', body.category_filter);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      if (!count || count === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No published articles to process',
          jobId: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('embedding_jobs')
        .insert({
          content_type: body.content_type || 'blog_post',
          category_filter: body.category_filter || null,
          total_items: count,
          status: 'processing',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      console.log(`[EMBEDDINGS] Created job ${job.id} for ${count} articles`);

      // Start processing first batch
      const result = await processNextBatch(supabase, OPENAI_API_KEY, job.id, authToken);

      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        totalItems: count,
        message: `Started bulk embedding job for ${count} articles`,
        ...result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Original single-item processing logic
    const { content_type, content_id, slug, batch_size = 10, process_pending = false } = body;

    const results: { processed: number; failed: number; skipped: number; created: number; updated: number; errors: string[] } = {
      processed: 0,
      failed: 0,
      skipped: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    // Process pending embeddings in batch
    if (process_pending) {
      const { data: pendingItems, error: pendingError } = await supabase
        .from("article_embeddings")
        .select("*")
        .eq("embedding_status", "pending")
        .limit(batch_size);

      if (pendingError) throw pendingError;

      for (const item of pendingItems || []) {
        try {
          await supabase
            .from("article_embeddings")
            .update({ embedding_status: "processing" })
            .eq("id", item.id);

          let rawContent = "";
          if (item.content_type === "article" && item.content_id) {
            const { data: post } = await supabase
              .from("blog_posts")
              .select("content")
              .eq("id", item.content_id)
              .single();
            rawContent = post?.content || "";
          }

          const embeddingText = extractEmbeddingText({
            id: item.id,
            slug: item.slug,
            title: item.title,
            category_id: item.category_id,
            subcategory_slug: item.subcategory_slug,
            primary_keyword: item.primary_keyword,
            secondary_keywords: item.secondary_keywords,
            article_type: item.article_type,
            article_role: item.article_role,
          }, rawContent);

          const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
          const contentHash = calculateContentHash(embeddingText);
          const anchorVariants = generateAnchorVariants(
            item.title,
            item.primary_keyword,
            item.secondary_keywords
          );

          await supabase
            .from("article_embeddings")
            .update({
              embedding: JSON.stringify(embedding),
              embedding_status: "completed",
              content_hash: contentHash,
              anchor_variants: anchorVariants,
              last_embedded_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", item.id);

          results.processed++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          results.errors.push(`${item.slug}: ${errorMsg}`);
          results.failed++;

          await supabase
            .from("article_embeddings")
            .update({
              embedding_status: "failed",
              error_message: errorMsg,
            })
            .eq("id", item.id);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Processed ${results.processed} embeddings, ${results.failed} failed`,
        ...results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process a specific blog post
    if (content_type === "blog_post") {
      let query = supabase.from("blog_posts").select("*");
      if (content_id) {
        query = query.eq("id", content_id);
      } else if (slug) {
        query = query.eq("slug", slug);
      } else {
        throw new Error("Either content_id or slug is required for blog_post");
      }

      const { data: post, error: postError } = await query.single();
      if (postError) throw postError;

      let articleRole: "super-pillar" | "pillar" | "cluster" = "cluster";
      if (post.article_type === "pillar") {
        articleRole = "pillar";
      } else if (post.article_type === "category-guide" || post.article_type === "category_guide") {
        articleRole = "super-pillar";
      }

      const { data: existing } = await supabase
        .from("article_embeddings")
        .select("id, content_hash")
        .eq("content_id", post.id)
        .eq("content_type", "article")
        .single();

      const embeddingText = extractEmbeddingText({
        id: post.id,
        slug: post.slug,
        title: post.title,
        category_id: post.category_slug,
        primary_keyword: post.primary_keyword,
        secondary_keywords: post.secondary_keywords,
        article_type: post.article_type,
        article_role: articleRole,
      }, post.content);

      const newHash = calculateContentHash(embeddingText);

      if (existing?.content_hash === newHash) {
        return new Response(JSON.stringify({
          success: true,
          message: "Content unchanged, skipping embedding generation",
          skipped: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
      const anchorVariants = generateAnchorVariants(
        post.title,
        post.primary_keyword,
        post.secondary_keywords
      );

      const headingsMatch = post.content?.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
      const headingsText = headingsMatch
        .map((h: string) => h.replace(/<[^>]+>/g, ""))
        .join(" | ")
        .slice(0, 500);

      const embeddingData = {
        content_type: "article",
        content_id: post.id,
        slug: post.slug,
        title: post.title,
        category_id: post.category_slug,
        subcategory_slug: null,
        article_role: articleRole,
        article_type: post.article_type,
        primary_keyword: post.primary_keyword,
        secondary_keywords: post.secondary_keywords,
        anchor_variants: anchorVariants,
        headings_text: headingsText,
        embedding: JSON.stringify(embedding),
        embedding_status: "completed",
        content_hash: newHash,
        last_embedded_at: new Date().toISOString(),
        error_message: null,
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("article_embeddings")
          .update(embeddingData)
          .eq("id", existing.id);
        if (updateError) throw updateError;
        results.updated++;
      } else {
        const { error: insertError } = await supabase
          .from("article_embeddings")
          .insert(embeddingData);
        if (insertError) throw insertError;
        results.created++;
      }

      await supabase
        .from("blog_posts")
        .update({ content_hash: newHash })
        .eq("id", post.id);

      return new Response(JSON.stringify({
        success: true,
        message: `Generated embedding for blog post: ${post.slug}`,
        article_role: articleRole,
        ...results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Template embedding
    if (content_type === "template") {
      if (!slug) throw new Error("slug is required for template embedding");

      const templateData = body as EmbeddingRequest & {
        title: string;
        category_id: string;
        subcategory_slug?: string;
        description?: string;
        keywords?: string[];
      };

      if (!templateData.title || !templateData.category_id) {
        throw new Error("title and category_id are required for template embedding");
      }

      const embeddingText = extractEmbeddingText({
        id: slug,
        slug: slug,
        title: templateData.title,
        category_id: templateData.category_id,
        subcategory_slug: templateData.subcategory_slug,
        primary_keyword: templateData.keywords?.[0],
        secondary_keywords: templateData.keywords?.slice(1),
        article_role: "pillar",
      }, templateData.description);

      const newHash = calculateContentHash(embeddingText);

      const { data: existing } = await supabase
        .from("article_embeddings")
        .select("id, content_hash")
        .eq("slug", slug)
        .eq("content_type", "template")
        .single();

      if (existing?.content_hash === newHash) {
        return new Response(JSON.stringify({
          success: true,
          message: "Template content unchanged",
          skipped: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
      const anchorVariants = generateAnchorVariants(
        templateData.title,
        templateData.keywords?.[0],
        templateData.keywords?.slice(1)
      );

      const embeddingData = {
        content_type: "template",
        slug: slug,
        title: templateData.title,
        category_id: templateData.category_id,
        subcategory_slug: templateData.subcategory_slug,
        article_role: "pillar",
        primary_keyword: templateData.keywords?.[0],
        secondary_keywords: templateData.keywords?.slice(1),
        anchor_variants: anchorVariants,
        embedding: JSON.stringify(embedding),
        embedding_status: "completed",
        content_hash: newHash,
        last_embedded_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from("article_embeddings")
          .update(embeddingData)
          .eq("id", existing.id);
      } else {
        await supabase.from("article_embeddings").insert(embeddingData);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Generated embedding for template: ${slug}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Category guide embedding
    if (content_type === "category_guide") {
      if (!slug) throw new Error("slug (category_id) is required for category_guide embedding");

      const guideData = body as EmbeddingRequest & {
        title: string;
        description?: string;
        keywords?: string[];
      };

      if (!guideData.title) {
        throw new Error("title is required for category_guide embedding");
      }

      const embeddingText = extractEmbeddingText({
        id: slug,
        slug: slug,
        title: guideData.title,
        category_id: slug,
        primary_keyword: guideData.keywords?.[0],
        secondary_keywords: guideData.keywords?.slice(1),
        article_role: "super-pillar",
      }, guideData.description);

      const newHash = calculateContentHash(embeddingText);

      const { data: existing } = await supabase
        .from("article_embeddings")
        .select("id, content_hash")
        .eq("slug", slug)
        .eq("content_type", "guide")
        .single();

      if (existing?.content_hash === newHash) {
        return new Response(JSON.stringify({
          success: true,
          message: "Category guide unchanged",
          skipped: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
      const anchorVariants = generateAnchorVariants(
        guideData.title,
        guideData.keywords?.[0],
        guideData.keywords?.slice(1)
      );

      const embeddingData = {
        content_type: "guide",
        slug: slug,
        title: guideData.title,
        category_id: slug,
        article_role: "super-pillar",
        primary_keyword: guideData.keywords?.[0],
        secondary_keywords: guideData.keywords?.slice(1),
        anchor_variants: anchorVariants,
        embedding: JSON.stringify(embedding),
        embedding_status: "completed",
        content_hash: newHash,
        last_embedded_at: new Date().toISOString(),
        max_inbound: 20,
      };

      if (existing) {
        await supabase
          .from("article_embeddings")
          .update(embeddingData)
          .eq("id", existing.id);
      } else {
        await supabase.from("article_embeddings").insert(embeddingData);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Generated embedding for category guide: ${slug}`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unsupported content_type: ${content_type}`);

  } catch (error) {
    console.error("generate-embeddings error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
