import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

// Batch size for processing
const BATCH_SIZE = 5;

interface QueueItem {
  id: string;
  content_type: string;
  content_id: string;
  trigger_source: string;
  priority: number;
  created_at: string;
}

interface ProcessRequest {
  limit?: number;
  triggerBidirectionalScan?: boolean;
}

/**
 * Extract text content for embedding
 */
function extractEmbeddingText(data: {
  title: string;
  content?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  category_id: string;
  article_type?: string;
}): string {
  const parts: string[] = [];
  
  parts.push(data.title);
  
  if (data.primary_keyword) {
    parts.push(`Primary topic: ${data.primary_keyword}`);
  }
  
  if (data.secondary_keywords?.length) {
    parts.push(`Related topics: ${data.secondary_keywords.join(", ")}`);
  }
  
  if (data.content) {
    const textContent = data.content
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    
    parts.push(textContent.slice(0, 6000));
  }
  
  parts.push(`Category: ${data.category_id}`);
  if (data.article_type) {
    parts.push(`Article type: ${data.article_type}`);
  }
  
  return parts.join("\n\n");
}

/**
 * Generate embedding using OpenAI
 */
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

/**
 * Calculate content hash for change detection
 */
function calculateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate anchor text variants for the article
 */
function generateAnchorVariants(title: string, primaryKeyword?: string, secondaryKeywords?: string[]): string[] {
  const variants: string[] = [];
  
  variants.push(title);
  if (title.length > 50) {
    const shortened = title.split(/[-–—:|]/).shift()?.trim();
    if (shortened && shortened.length > 10) {
      variants.push(shortened);
    }
  }
  
  if (primaryKeyword) {
    variants.push(primaryKeyword);
    variants.push(`${primaryKeyword} guide`);
  }
  
  if (secondaryKeywords?.length) {
    secondaryKeywords.slice(0, 3).forEach(kw => variants.push(kw));
  }
  
  return [...new Set(variants.filter(v => v && v.length > 3))].slice(0, 8);
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Perform bidirectional link discovery for a newly embedded article
 */
async function performBidirectionalScan(
  supabase: ReturnType<typeof createClient>,
  articleId: string,
  articleSlug: string,
  articleTitle: string,
  newEmbedding: number[],
  categoryId: string,
  similarityThreshold: number = 0.75,
  maxLinksPerArticle: number = 5
): Promise<{ outbound: number; inbound: number }> {
  console.log(`[BIDIRECTIONAL] Starting scan for: ${articleSlug}`);
  
  let outboundCreated = 0;
  let inboundCreated = 0;
  
  // Step 1: Find articles this NEW article should link TO (outbound)
  const { data: outboundMatches, error: outboundError } = await supabase.rpc('match_semantic_links', {
    query_embedding: JSON.stringify(newEmbedding),
    source_category: categoryId,
    source_role: 'cluster',
    similarity_threshold: similarityThreshold,
    max_results: 30,
  });

  if (!outboundError && outboundMatches) {
    const validOutbound = outboundMatches.filter((m: any) => m.slug !== articleSlug);
    
    for (const match of validOutbound.slice(0, maxLinksPerArticle)) {
      const { error: insertError } = await supabase
        .from('link_suggestions')
        .insert({
          source_post_id: articleId,
          target_type: match.content_type,
          target_slug: match.slug,
          target_title: match.title,
          target_embedding_id: match.id,
          anchor_text: match.primary_keyword || match.title.slice(0, 50),
          anchor_source: 'semantic-auto',
          semantic_score: match.similarity,
          relevance_score: Math.round(match.similarity * 100),
          hierarchy_valid: match.hierarchy_valid,
          hierarchy_violation: match.hierarchy_note,
          status: 'pending',
        })
        .select()
        .single();

      if (!insertError) {
        outboundCreated++;
      }
    }
  }

  // Step 2: Find EXISTING articles that should link TO this new article (inbound)
  const { data: allEmbeddings, error: embeddingsError } = await supabase
    .from('article_embeddings')
    .select('id, content_id, slug, title, embedding, category_id, primary_keyword, inbound_count, max_inbound')
    .eq('embedding_status', 'completed')
    .not('embedding', 'is', null)
    .neq('slug', articleSlug);

  if (!embeddingsError && allEmbeddings) {
    const inboundCandidates: Array<{
      id: string;
      content_id: string;
      slug: string;
      title: string;
      similarity: number;
      primary_keyword: string | null;
    }> = [];

    for (const candidate of allEmbeddings) {
      if (!candidate.embedding || !candidate.content_id) continue;
      
      // Skip if new article has reached max inbound
      // (Note: we're checking if this candidate CAN link to us)
      
      try {
        const candidateEmbedding = typeof candidate.embedding === 'string' 
          ? JSON.parse(candidate.embedding) 
          : candidate.embedding;
        
        const similarity = cosineSimilarity(candidateEmbedding, newEmbedding);
        
        if (similarity > similarityThreshold) {
          inboundCandidates.push({
            id: candidate.id,
            content_id: candidate.content_id,
            slug: candidate.slug,
            title: candidate.title,
            similarity,
            primary_keyword: candidate.primary_keyword,
          });
        }
      } catch (e) {
        // Skip invalid embeddings
      }
    }

    // Sort by similarity and take top matches
    inboundCandidates.sort((a, b) => b.similarity - a.similarity);

    for (const candidate of inboundCandidates.slice(0, maxLinksPerArticle)) {
      // Check if suggestion already exists
      const { data: existing } = await supabase
        .from('link_suggestions')
        .select('id')
        .eq('source_post_id', candidate.content_id)
        .eq('target_slug', articleSlug)
        .maybeSingle();

      if (existing) continue;

      const { error: insertError } = await supabase
        .from('link_suggestions')
        .insert({
          source_post_id: candidate.content_id,
          target_type: 'article',
          target_slug: articleSlug,
          target_title: articleTitle,
          anchor_text: articleTitle.slice(0, 50),
          anchor_source: 'semantic-reverse',
          semantic_score: candidate.similarity,
          relevance_score: Math.round(candidate.similarity * 100),
          hierarchy_valid: true,
          status: 'pending',
        });

      if (!insertError) {
        inboundCreated++;
      }
    }
  }

  console.log(`[BIDIRECTIONAL] Completed for ${articleSlug}: ${outboundCreated} outbound, ${inboundCreated} inbound`);
  return { outbound: outboundCreated, inbound: inboundCreated };
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
    
    const body: ProcessRequest = await req.json().catch(() => ({}));
    const limit = body.limit || BATCH_SIZE;
    const triggerBidirectionalScan = body.triggerBidirectionalScan !== false;

    // Fetch pending queue items (highest priority first)
    const { data: queueItems, error: fetchError } = await supabase
      .from('embedding_queue')
      .select('*')
      .is('processed_at', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No items in queue',
        processed: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[QUEUE] Processing ${queueItems.length} items`);

    let processed = 0;
    let failed = 0;
    let linksCreated = 0;
    const results: Array<{ id: string; slug: string; status: string; links?: number }> = [];

    for (const item of queueItems as QueueItem[]) {
      try {
        if (item.content_type !== 'blog_post') {
          // Mark as processed - unsupported type
          await supabase
            .from('embedding_queue')
            .update({ processed_at: new Date().toISOString(), error_message: 'Unsupported content type' })
            .eq('id', item.id);
          continue;
        }

        // Fetch the blog post
        const { data: post, error: postError } = await supabase
          .from('blog_posts')
          .select('id, slug, title, content, category_slug, primary_keyword, secondary_keywords, article_type, content_hash')
          .eq('id', item.content_id)
          .single();

        if (postError || !post) {
          await supabase
            .from('embedding_queue')
            .update({ processed_at: new Date().toISOString(), error_message: 'Post not found' })
            .eq('id', item.id);
          failed++;
          continue;
        }

        // Check existing embedding
        const { data: existing } = await supabase
          .from('article_embeddings')
          .select('id, content_hash')
          .eq('content_id', post.id)
          .eq('content_type', 'article')
          .single();

        // Prepare embedding text
        const embeddingText = extractEmbeddingText({
          title: post.title,
          content: post.content,
          primary_keyword: post.primary_keyword,
          secondary_keywords: post.secondary_keywords,
          category_id: post.category_slug,
          article_type: post.article_type,
        });

        const newHash = calculateContentHash(embeddingText);

        // Skip if unchanged (unless this is a publish trigger which should always process)
        if (existing?.content_hash === newHash && item.trigger_source !== 'publish') {
          console.log(`[QUEUE] Skipping unchanged: ${post.slug}`);
          await supabase
            .from('embedding_queue')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', item.id);
          processed++;
          results.push({ id: item.id, slug: post.slug, status: 'skipped-unchanged' });
          continue;
        }

        // Generate embedding
        const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);

        // Determine article role
        let articleRole: "super-pillar" | "pillar" | "cluster" = "cluster";
        if (post.article_type === "pillar") articleRole = "pillar";
        else if (post.article_type === "category-guide" || post.article_type === "category_guide") articleRole = "super-pillar";

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

        // Upsert embedding
        if (existing) {
          await supabase
            .from('article_embeddings')
            .update(embeddingData)
            .eq('id', existing.id);
        } else {
          await supabase.from('article_embeddings').insert(embeddingData);
        }

        // Update blog_posts hash
        await supabase
          .from('blog_posts')
          .update({ content_hash: newHash })
          .eq('id', post.id);

        // Perform bidirectional link scan if enabled
        let linkCount = 0;
        if (triggerBidirectionalScan) {
          const scanResult = await performBidirectionalScan(
            supabase,
            post.id,
            post.slug,
            post.title,
            embedding,
            post.category_slug
          );
          linkCount = scanResult.outbound + scanResult.inbound;
          linksCreated += linkCount;
        }

        // Mark queue item as processed
        await supabase
          .from('embedding_queue')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', item.id);

        processed++;
        results.push({ id: item.id, slug: post.slug, status: 'success', links: linkCount });
        console.log(`[QUEUE] Processed: ${post.slug} (${linkCount} links created)`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[QUEUE] Failed item ${item.id}:`, errorMsg);
        
        await supabase
          .from('embedding_queue')
          .update({ 
            processed_at: new Date().toISOString(),
            error_message: errorMsg,
          })
          .eq('id', item.id);
        
        failed++;
        results.push({ id: item.id, slug: item.content_id, status: 'failed' });
      }
    }

    console.log(`[QUEUE] Complete. Processed: ${processed}, Failed: ${failed}, Links created: ${linksCreated}`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      failed,
      linksCreated,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[QUEUE] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
