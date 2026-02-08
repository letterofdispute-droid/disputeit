import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmbeddingRequest {
  content_type: "blog_post" | "template" | "category_guide";
  content_id?: string;
  slug?: string;
  batch_size?: number;
  process_pending?: boolean;
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
  
  // Title is most important
  parts.push(data.title);
  
  // Primary keyword
  if (data.primary_keyword) {
    parts.push(`Primary topic: ${data.primary_keyword}`);
  }
  
  // Secondary keywords
  if (data.secondary_keywords?.length) {
    parts.push(`Related topics: ${data.secondary_keywords.join(", ")}`);
  }
  
  // Extract headings and key content from HTML
  if (rawContent) {
    // Remove HTML tags but preserve text structure
    const textContent = rawContent
      // Extract heading text
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n")
      // Extract paragraph text
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
      // Extract list items
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .trim();
    
    // Limit content to ~6000 chars for embedding (leaving room for title/keywords)
    const truncatedContent = textContent.slice(0, 6000);
    parts.push(truncatedContent);
  }
  
  // Category context
  parts.push(`Category: ${data.category_id}`);
  if (data.subcategory_slug) {
    parts.push(`Subcategory: ${data.subcategory_slug}`);
  }
  
  // Article type context
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

// Generate anchor text variants for the article
function generateAnchorVariants(title: string, primaryKeyword?: string, secondaryKeywords?: string[]): string[] {
  const variants: string[] = [];
  
  // Title-based anchors
  variants.push(title);
  if (title.length > 50) {
    // Shorter version
    const shortened = title.split(/[-–—:|]/).shift()?.trim();
    if (shortened && shortened.length > 10) {
      variants.push(shortened);
    }
  }
  
  // Keyword-based anchors
  if (primaryKeyword) {
    variants.push(primaryKeyword);
    variants.push(`${primaryKeyword} guide`);
    variants.push(`about ${primaryKeyword}`);
  }
  
  // Secondary keyword anchors
  if (secondaryKeywords?.length) {
    secondaryKeywords.slice(0, 3).forEach(kw => {
      variants.push(kw);
    });
  }
  
  // Dedupe and clean
  return [...new Set(variants.filter(v => v && v.length > 3))].slice(0, 8);
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
    const { content_type, content_id, slug, batch_size = 10, process_pending = false } = body;

    const results: { processed: number; failed: number; errors: string[] } = {
      processed: 0,
      failed: 0,
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
          // Mark as processing
          await supabase
            .from("article_embeddings")
            .update({ embedding_status: "processing" })
            .eq("id", item.id);

          // Get full content based on type
          let rawContent = "";
          // Get full content based on type - 'article' = blog posts
          if (item.content_type === "article" && item.content_id) {
            const { data: post } = await supabase
              .from("blog_posts")
              .select("content")
              .eq("id", item.content_id)
              .single();
            rawContent = post?.content || "";
          }

          // Generate embedding text
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

          // Generate embedding
          const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
          const contentHash = calculateContentHash(embeddingText);
          const anchorVariants = generateAnchorVariants(
            item.title,
            item.primary_keyword,
            item.secondary_keywords
          );

          // Update record - use JSON.stringify for pgvector compatibility
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

    // Process a specific content item - blog posts mapped to 'article'
    if (content_type === "blog_post") {
      // Get blog post data
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

      // Determine article role based on article_type
      let articleRole: "super-pillar" | "pillar" | "cluster" = "cluster";
      if (post.article_type === "pillar") {
        articleRole = "pillar";
      } else if (post.article_type === "category-guide" || post.article_type === "category_guide") {
        articleRole = "super-pillar";
      }

      // Check if embedding record exists (using article as content_type)
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

      // Skip if content hasn't changed
      if (existing?.content_hash === newHash) {
        return new Response(JSON.stringify({
          success: true,
          message: "Content unchanged, skipping embedding generation",
          skipped: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText, OPENAI_API_KEY);
      const anchorVariants = generateAnchorVariants(
        post.title,
        post.primary_keyword,
        post.secondary_keywords
      );

      // Extract headings for topic summary
      const headingsMatch = post.content?.match(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi) || [];
      const headingsText = headingsMatch
        .map((h: string) => h.replace(/<[^>]+>/g, ""))
        .join(" | ")
        .slice(0, 500);

      // Upsert embedding record - use 'article' for blog posts per DB constraint
      const embeddingData = {
        content_type: "article", // DB constraint: 'article', 'template', 'guide'
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
        if (updateError) {
          console.error("Update embedding error:", updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("article_embeddings")
          .insert(embeddingData);
        if (insertError) {
          console.error("Insert embedding error:", insertError);
          throw insertError;
        }
      }

      // Also update blog_posts content_hash
      await supabase
        .from("blog_posts")
        .update({ content_hash: newHash })
        .eq("id", post.id);

      return new Response(JSON.stringify({
        success: true,
        message: `Generated embedding for blog post: ${post.slug}`,
        article_role: articleRole,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle template embeddings (templates are stored in code, not DB)
    if (content_type === "template") {
      if (!slug) {
        throw new Error("slug is required for template embedding");
      }

      // For templates, we'll need to receive the data in the request
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
        article_role: "pillar", // Templates are Tier 1 (pillar) in hierarchy
      }, templateData.description);

      const newHash = calculateContentHash(embeddingText);

      // Check existing
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

    // Category guide embedding - maps to 'guide' content_type
    if (content_type === "category_guide") {
      if (!slug) {
        throw new Error("slug (category_id) is required for category_guide embedding");
      }

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
        article_role: "super-pillar", // Category guides are Tier 0
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
        content_type: "guide", // DB constraint: 'article', 'template', 'guide'
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
        max_inbound: 50, // Super-pillars can receive more links
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
