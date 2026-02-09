import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

interface ScanRequest {
  postId?: string;
  categorySlug?: string;
  batchSize?: number;
  similarityThreshold?: number;
  maxLinksPerArticle?: number;
  includeBidirectional?: boolean;
}

interface SemanticMatch {
  id: string;
  content_type: string;
  slug: string;
  title: string;
  category_id: string;
  subcategory_slug: string | null;
  article_role: string;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  inbound_count: number;
  max_inbound: number;
  similarity: number;
  hierarchy_valid: boolean;
  hierarchy_note: string | null;
}

interface ArticleEmbedding {
  id: string;
  content_id: string | null;
  slug: string;
  title: string;
  category_id: string;
  article_role: string;
  embedding: string;
  anchor_variants: string[] | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { 
      postId, 
      categorySlug, 
      batchSize = 10,
      similarityThreshold = 0.75,
      maxLinksPerArticle = 5,
      includeBidirectional = true,
    } = await req.json() as ScanRequest;

    console.log('[SEMANTIC-SCAN] Starting scan', { postId, categorySlug, batchSize, similarityThreshold });

    // Build query to find articles with embeddings that need scanning
    let query = supabaseAdmin
      .from('article_embeddings')
      .select('id, content_id, slug, title, category_id, article_role, embedding, anchor_variants, primary_keyword, secondary_keywords')
      .eq('embedding_status', 'completed')
      .not('embedding', 'is', null);

    if (postId) {
      // Scan specific post - find its embedding by content_id
      query = query.eq('content_id', postId);
    } else if (categorySlug) {
      query = query.eq('category_id', categorySlug);
    }

    // Prioritize articles that haven't been scanned recently
    query = query
      .or('next_scan_due_at.is.null,next_scan_due_at.lte.now()')
      .order('next_scan_due_at', { ascending: true, nullsFirst: true })
      .limit(batchSize);

    const { data: sourceArticles, error: articlesError } = await query;

    if (articlesError) {
      console.error('[SEMANTIC-SCAN] Failed to fetch articles:', articlesError);
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    if (!sourceArticles || sourceArticles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No articles ready for semantic scanning',
        scanned: 0,
        suggestions: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[SEMANTIC-SCAN] Found ${sourceArticles.length} articles to scan`);

    let totalSuggestions = 0;
    const results: Array<{ articleId: string; title: string; suggestionsFound: number }> = [];

    for (const source of sourceArticles as ArticleEmbedding[]) {
      try {
        console.log(`[SEMANTIC-SCAN] Processing: ${source.title}`);

        // Call the match_semantic_links function to find similar articles
        const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_semantic_links', {
          query_embedding: source.embedding,
          source_category: source.category_id,
          source_role: source.article_role,
          similarity_threshold: similarityThreshold,
          max_results: 30,
        });

        if (matchError) {
          console.error(`[SEMANTIC-SCAN] Match error for ${source.title}:`, matchError);
          continue;
        }

        if (!matches || matches.length === 0) {
          console.log(`[SEMANTIC-SCAN] No matches found for ${source.title}`);
          // Update scan timestamp even if no matches
          await supabaseAdmin
            .from('article_embeddings')
            .update({ next_scan_due_at: getNextScanDate() })
            .eq('id', source.id);
          results.push({ articleId: source.id, title: source.title, suggestionsFound: 0 });
          continue;
        }

        // Filter out self-links
        const validMatches = (matches as SemanticMatch[]).filter(m => 
          m.id !== source.id && m.slug !== source.slug
        );

        console.log(`[SEMANTIC-SCAN] Found ${validMatches.length} valid matches for ${source.title}`);

        // Check for existing suggestions to avoid duplicates
        const { data: existingSuggestions } = await supabaseAdmin
          .from('link_suggestions')
          .select('target_slug')
          .eq('source_post_id', source.content_id || source.id);

        const existingSlugs = new Set(existingSuggestions?.map(s => s.target_slug) || []);

        // Generate link suggestions for top matches
        const newSuggestions = [];
        for (const match of validMatches.slice(0, maxLinksPerArticle)) {
          // Skip if already suggested
          if (existingSlugs.has(match.slug)) {
            continue;
          }

          // Skip if target has reached max inbound links
          if (match.inbound_count >= match.max_inbound) {
            console.log(`[SEMANTIC-SCAN] Skipping ${match.slug} - max inbound reached`);
            continue;
          }

          // Get target's anchor variants for smart anchor selection
          const { data: targetEmbedding } = await supabaseAdmin
            .from('article_embeddings')
            .select('anchor_variants, primary_keyword')
            .eq('id', match.id)
            .single();

          // Select best anchor text
          const anchorText = selectAnchorText(
            targetEmbedding?.anchor_variants || [],
            targetEmbedding?.primary_keyword || match.primary_keyword,
            match.title,
            source.primary_keyword
          );

          // Calculate keyword overlap score
          const keywordOverlap = calculateKeywordOverlap(
            source.secondary_keywords || [],
            match.secondary_keywords || []
          );

          // Build URL based on content type
          const targetUrl = buildTargetUrl(match.content_type, match.slug, match.category_id);

          newSuggestions.push({
            source_post_id: source.content_id || source.id,
            target_type: match.content_type,
            target_slug: match.slug,
            target_title: match.title,
            target_embedding_id: match.id,
            anchor_text: anchorText,
            anchor_source: 'semantic',
            semantic_score: match.similarity,
            keyword_overlap_score: keywordOverlap,
            relevance_score: Math.round((match.similarity * 0.7 + keywordOverlap * 0.3) * 100),
            hierarchy_valid: match.hierarchy_valid,
            hierarchy_violation: match.hierarchy_note,
            status: 'pending',
          });
        }

        if (newSuggestions.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('link_suggestions')
            .insert(newSuggestions);

          if (insertError) {
            console.error(`[SEMANTIC-SCAN] Failed to insert suggestions for ${source.title}:`, insertError);
          } else {
            totalSuggestions += newSuggestions.length;
            console.log(`[SEMANTIC-SCAN] Created ${newSuggestions.length} outbound suggestions for ${source.title}`);
          }
        }

        // BIDIRECTIONAL: Find existing articles that should link TO this source article
        let inboundSuggestions = 0;
        if (includeBidirectional && source.content_id) {
          const sourceEmbedding = typeof source.embedding === 'string' 
            ? JSON.parse(source.embedding) 
            : source.embedding;

          // Get all other embeddings to check for inbound links
          const { data: otherEmbeddings } = await supabaseAdmin
            .from('article_embeddings')
            .select('id, content_id, slug, title, embedding, category_id, primary_keyword, article_role')
            .eq('embedding_status', 'completed')
            .not('embedding', 'is', null)
            .neq('id', source.id);

          if (otherEmbeddings) {
            for (const candidate of otherEmbeddings) {
              if (!candidate.content_id || !candidate.embedding) continue;

              // Check if reverse suggestion already exists
              const { data: existingReverse } = await supabaseAdmin
                .from('link_suggestions')
                .select('id')
                .eq('source_post_id', candidate.content_id)
                .eq('target_slug', source.slug)
                .maybeSingle();

              if (existingReverse) continue;

              try {
                const candidateEmbedding = typeof candidate.embedding === 'string'
                  ? JSON.parse(candidate.embedding)
                  : candidate.embedding;

                // Calculate similarity
                const similarity = cosineSimilarity(candidateEmbedding, sourceEmbedding);

                if (similarity > similarityThreshold) {
                  const { error: reverseInsertError } = await supabaseAdmin
                    .from('link_suggestions')
                    .insert({
                      source_post_id: candidate.content_id,
                      target_type: source.content_type || 'article',
                      target_slug: source.slug,
                      target_title: source.title,
                      target_embedding_id: source.id,
                      anchor_text: source.primary_keyword || source.title.slice(0, 50),
                      anchor_source: 'semantic-reverse',
                      semantic_score: similarity,
                      relevance_score: Math.round(similarity * 100),
                      hierarchy_valid: true,
                      status: 'pending',
                    });

                  if (!reverseInsertError) {
                    inboundSuggestions++;
                    totalSuggestions++;
                  }
                }
              } catch (e) {
                // Skip invalid embeddings
              }
            }
          }

          if (inboundSuggestions > 0) {
            console.log(`[SEMANTIC-SCAN] Created ${inboundSuggestions} inbound suggestions for ${source.title}`);
          }
        }

        // Update the scan timestamp
        await supabaseAdmin
          .from('article_embeddings')
          .update({ next_scan_due_at: getNextScanDate() })
          .eq('id', source.id);

        results.push({ 
          articleId: source.id, 
          title: source.title, 
          suggestionsFound: newSuggestions.length + inboundSuggestions,
        });

      } catch (error) {
        console.error(`[SEMANTIC-SCAN] Error processing ${source.title}:`, error);
        results.push({ articleId: source.id, title: source.title, suggestionsFound: 0 });
      }
    }

    console.log(`[SEMANTIC-SCAN] Complete. Scanned: ${sourceArticles.length}, Suggestions: ${totalSuggestions}`);

    return new Response(JSON.stringify({
      success: true,
      scanned: sourceArticles.length,
      totalSuggestions,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SEMANTIC-SCAN] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Select the best anchor text for a link
 */
function selectAnchorText(
  anchorVariants: string[],
  primaryKeyword: string | null,
  title: string,
  sourceKeyword: string | null
): string {
  // Priority 1: Use anchor variant that doesn't overlap with source keyword
  if (anchorVariants.length > 0 && sourceKeyword) {
    const sourceWords = new Set(sourceKeyword.toLowerCase().split(/\s+/));
    const nonOverlapping = anchorVariants.find(anchor => {
      const anchorWords = anchor.toLowerCase().split(/\s+/);
      return !anchorWords.some(word => sourceWords.has(word));
    });
    if (nonOverlapping) return nonOverlapping;
  }

  // Priority 2: First anchor variant
  if (anchorVariants.length > 0) {
    return anchorVariants[0];
  }

  // Priority 3: Primary keyword
  if (primaryKeyword) {
    return primaryKeyword;
  }

  // Priority 4: Shortened title
  const words = title.split(/\s+/);
  if (words.length > 6) {
    return words.slice(0, 5).join(' ') + '...';
  }
  return title;
}

/**
 * Calculate keyword overlap between two keyword arrays (Jaccard similarity)
 */
function calculateKeywordOverlap(keywordsA: string[], keywordsB: string[]): number {
  if (!keywordsA.length || !keywordsB.length) return 0;
  
  const setA = new Set(keywordsA.map(k => k.toLowerCase()));
  const setB = new Set(keywordsB.map(k => k.toLowerCase()));
  
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
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
 * Build the target URL based on content type
 */
function buildTargetUrl(contentType: string, slug: string, categoryId: string): string {
  switch (contentType) {
    case 'template':
      return `/letter/${slug}`;
    case 'article':
      return `/articles/${slug}`;
    case 'guide':
      return `/guides/${categoryId}`;
    default:
      return `/${slug}`;
  }
}

/**
 * Calculate next scan date (7 days from now)
 */
function getNextScanDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}
