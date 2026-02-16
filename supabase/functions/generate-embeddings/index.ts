import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Only re-process if existing hash != new hash
function calculateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Extract keywords & anchor text candidates
function extractKeywords(content: string, title: string): { primary: string; secondary: string[] } {
  // Simple heuristic extraction: title words + first 2 headings
  const headings = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/g)?.map(h => h.replace(/<[^>]+>/g, '').trim()) || [];
  
  // Clean title
  let cleanedTitle = title;
  const separators = [' | ', ' - ', ' – ', ' : '];
  for (const sep of separators) {
    if (cleanedTitle.includes(sep)) {
      cleanedTitle = cleanedTitle.split(sep)[0];
      break;
    }
  }

  // Split title on separators, pick best segment as primary
  const titleSegments = cleanedTitle.split(/[-–:|,;]/)
    .map(s => s.trim().replace(/[.!?'"]+$/g, '').trim())
    .filter(s => {
      const words = s.split(/\s+/);
      return words.length >= 2 && words.length <= 6;
    });

  // Primary: best title segment (shortest meaningful one) or cleaned title
  const primary = titleSegments.sort((a, b) => a.split(/\s+/).length - b.split(/\s+/).length)[0]
    || cleanedTitle.split(/\s+/).slice(0, 5).join(' ');

  // Secondary: other title segments + heading-derived keywords (deduplicated)
  const seen = new Set<string>([primary.toLowerCase()]);
  const secondary: string[] = [];

  // Add remaining title segments
  for (const seg of titleSegments) {
    const lower = seg.toLowerCase();
    if (!seen.has(lower) && !isStopWordHeavy(seg)) {
      seen.add(lower);
      secondary.push(seg);
    }
  }

  // Add heading-derived keywords (2-5 word phrases from headings)
  for (const heading of headings.slice(0, 8)) {
    let cleaned = heading;
    for (const starter of GENERIC_STARTERS) {
      if (cleaned.toLowerCase().startsWith(starter)) {
        cleaned = cleaned.slice(starter.length).trim();
        break;
      }
    }
    const hSegments = cleaned.split(/[-–:|,;]/)
      .map(s => s.trim().replace(/[.!?'"]+$/g, '').trim())
      .filter(s => {
        const words = s.split(/\s+/);
        return words.length >= 2 && words.length <= 5 && !isStopWordHeavy(s);
      });
    for (const seg of hSegments) {
      const lower = seg.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        secondary.push(seg);
      }
    }
  }

  return { primary, secondary: secondary.slice(0, 6) };
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

// Generate anchor text variants - NO headings, NO full titles
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
  cleaned = cleaned.replace(/^From\s+['"].+?['"]\s+to\s+['"].+?['"]\s*[:–-]\s*/i, '');
  // Strip generic starters
  for (const starter of GENERIC_STARTERS) {
    if (cleaned.toLowerCase().startsWith(starter)) {
      cleaned = cleaned.slice(starter.length).trim();
      break;
    }
  }

  const segments = cleaned.split(/[-–:|,;]/)
    .map(s => s.trim().replace(/[.!?'"]+$/g, '').trim())
    .filter(s => {
      const words = s.split(/\s+/);
      return words.length >= 2 && words.length <= 6 && !isStopWordHeavy(s) && s !== title;
    });

  for (const seg of segments) {
    variants.push(seg);
  }

  // Deduplicate and limit
  return [...new Set(variants)].slice(0, 5);
}

// Embeddings helper
async function generateEmbedding(text: string, apiKey: string) {
  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);
  
  // Truncate to avoid token limits (approx 8000 chars ~ 2000 tokens)
  const input = text.replace(/\n/g, ' ').slice(0, 8000);

  const embeddingResponse = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input,
  });

  return embeddingResponse.data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // 1. Get next batch from queue OR un-embedded articles
    // Priority: Explicit queue items -> New/Updated articles -> Re-scan old articles
    let postsToProcess: any[] = [];
    
    // Check queue first
    const { data: queueItems } = await supabase
      .from('embedding_queue')
      .select('content_id, content_type')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(5);

    if (queueItems && queueItems.length > 0) {
      const ids = queueItems.map((q: any) => q.content_id);
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, content, slug, category_slug, primary_keyword, article_type, content_hash')
        .in('id', ids);
        
      if (posts) postsToProcess = posts;
      
      // Clean up queue
      await supabase.from('embedding_queue').delete().in('content_id', ids);
    } else {
      // Find articles without embeddings OR where content changed
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, content, slug, category_slug, primary_keyword, article_type, content_hash')
        .eq('status', 'published')
        .order('updated_at', { ascending: false }) // Process recently updated first
        .limit(10); // Batch size

      // Filter for those needing embedding (not perfect but good for background job)
      // Ideally we'd join on article_embeddings but Postgrest join limits apply
      // So we'll fetch embeddings for these IDs and filter in memory
      if (posts && posts.length > 0) {
        const ids = posts.map((p: any) => p.id);
        const { data: embeddings } = await supabase
          .from('article_embeddings')
          .select('content_id, content_hash')
          .in('content_id', ids);
          
        const existingMap = new Map(embeddings?.map((e: any) => [e.content_id, e]));
        
        postsToProcess = posts.filter((p: any) => {
          const existing = existingMap.get(p.id);
          // Process if no embedding exists OR content hash mismatch
          if (!existing) return true;
          // Calculate hash to check for changes
          const currentHash = calculateContentHash(p.title + p.content);
          return existing.content_hash !== currentHash;
        });
      }
    }

    console.log(`Processing ${postsToProcess.length} articles for embeddings...`);

    let successCount = 0;

    for (const post of postsToProcess) {
      try {
        // Extract keywords & anchor text
        const { primary, secondary } = extractKeywords(post.content, post.title);
        
        // Use manually set keyword if available, otherwise extracted one
        const primaryKeyword = post.primary_keyword || primary;
        const secondaryKeywords = secondary; // TODO: Merge with manual secondary keywords if column existed

        // Generate embedding text: Title + Description + Headings + Key Content
        const embeddingText = `Title: ${post.title}\nCategory: ${post.category_slug}\nKeywords: ${primaryKeyword}, ${secondaryKeywords.join(', ')}\n\n${post.content}`;
        
        // Generate anchor variants
        const anchorVariants = generateAnchorVariants(post.title, primaryKeyword, secondaryKeywords);

        // Determine article role (pillar vs cluster)
        // Simple heuristic: Long guides or "Ultimate Guide" in title = Pillar
        const isPillar = post.title.toLowerCase().includes('guide') && post.content.length > 8000; // ~1500 words
        const articleRole = isPillar ? 'pillar' : 'cluster';

        // Check if hash changed (double check to be safe before burning OpenAI credits)
        const { data: existing } = await supabase
          .from('article_embeddings')
          .select('content_hash')
          .eq('content_id', post.id)
          .maybeSingle();

        const newHash = calculateContentHash(embeddingText);

        // Skip if unchanged (but NOT if we just extracted keywords - force re-embed)
        if (existing?.content_hash === newHash && post.primary_keyword) {
          console.log(`[EMBEDDINGS] Skipping unchanged: ${post.slug}`);
          continue;
        }

        // Generate embedding
        const embedding = await generateEmbedding(embeddingText, openaiKey);

        // Upsert embedding
        const { error: upsertError } = await supabase
          .from('article_embeddings')
          .upsert({
            content_id: post.id,
            content_type: 'blog_post',
            slug: post.slug,
            title: post.title,
            category_id: post.category_slug,
            embedding,
            content_hash: newHash,
            primary_keyword: primaryKeyword,
            secondary_keywords: secondaryKeywords,
            anchor_variants: anchorVariants,
            article_role: articleRole,
            article_type: post.article_type || 'article',
            last_embedded_at: new Date().toISOString(),
            embedding_status: 'completed',
            updated_at: new Date().toISOString()
          }, { onConflict: 'content_id' });

        if (upsertError) {
          console.error(`Failed to upsert embedding for ${post.slug}:`, upsertError);
        } else {
          successCount++;
          // Also update the blog_post with the hash to keep them in sync
          await supabase.from('blog_posts').update({ content_hash: newHash }).eq('id', post.id);
        }

      } catch (err) {
        console.error(`Error processing ${post.slug}:`, err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: successCount, 
      total: postsToProcess.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Embedding error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
