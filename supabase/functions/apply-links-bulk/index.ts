import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ApplyLinksRequest {
  suggestionIds?: string[];
  categorySlug?: string;
  autoApproveThreshold?: number;
  maxOutboundPerArticle?: number;
}

// ── Smart Link Insertion Helpers ──

interface Paragraph {
  index: number;
  html: string;
  textLower: string;
  linkCount: number;
}

/** Parse HTML content into paragraph blocks */
function parseParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const regex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(content)) !== null) {
    const html = match[0];
    const inner = match[1];
    // Strip tags for text scoring
    const textLower = inner.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').toLowerCase();
    // Count existing links
    const linkCount = (inner.match(/<a\s/gi) || []).length;
    paragraphs.push({ index: idx++, html, textLower, linkCount });
  }
  return paragraphs;
}

/** Score a paragraph for relevance to target keywords */
function scoreParagraph(
  para: Paragraph,
  targetWords: string[],
  totalParagraphs: number,
): number {
  if (para.textLower.trim().length < 40) return -1; // Skip very short paragraphs
  // Skip first and last paragraphs (intro/conclusion)
  if (para.index === 0 || para.index === totalParagraphs - 1) return -1;
  // Penalize paragraphs with 2+ existing links
  if (para.linkCount >= 2) return -1;

  let score = 0;
  for (const word of targetWords) {
    if (word.length < 3) continue;
    // Count occurrences of keyword word in paragraph text
    const wordRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    const matches = para.textLower.match(wordRegex);
    if (matches) score += matches.length;
  }

  // Light penalty for already having 1 link
  if (para.linkCount === 1) score *= 0.7;

  return score;
}

/** Extract target keyword words from primary + secondary keywords */
function getTargetWords(primaryKeyword: string | null, secondaryKeywords: string[] | null): string[] {
  const words = new Set<string>();
  if (primaryKeyword) {
    for (const w of primaryKeyword.toLowerCase().split(/\s+/)) {
      if (w.length >= 3) words.add(w);
    }
  }
  if (secondaryKeywords) {
    for (const kw of secondaryKeywords) {
      for (const w of kw.toLowerCase().split(/\s+/)) {
        if (w.length >= 3) words.add(w);
      }
    }
  }
  // Filter out very common stop words
  const stopWords = new Set(['the', 'and', 'for', 'with', 'your', 'that', 'this', 'from', 'have', 'has', 'are', 'was', 'were', 'been', 'will', 'can', 'how', 'what', 'when', 'where', 'which', 'who', 'why', 'not', 'but', 'all', 'also', 'than', 'them', 'then', 'its', 'into', 'about', 'more', 'some', 'may', 'our', 'out', 'you']);
  return [...words].filter(w => !stopWords.has(w));
}

/**
 * Try to find a natural phrase (2-5 words) in the paragraph that contains 
 * at least one target keyword word, and wrap it as a link.
 * Returns the modified paragraph HTML or null if no match found.
 */
function tryNaturalPhraseMatch(
  paraHtml: string,
  targetWords: string[],
  targetUrl: string,
  targetTitle: string,
): string | null {
  // Get the inner content of the <p> tag
  const innerMatch = paraHtml.match(/^(<p[^>]*>)([\s\S]*?)(<\/p>)$/i);
  if (!innerMatch) return null;
  const [, openTag, inner, closeTag] = innerMatch;

  // Don't match inside existing <a> tags
  // Split content by <a>...</a> segments and only search in text segments
  const segments = inner.split(/(<a\s[\s\S]*?<\/a>)/gi);
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Skip <a> tag segments
    if (seg.match(/^<a\s/i)) continue;
    // Skip segments that are just HTML tags
    if (seg.match(/^<[^>]+>$/)) continue;
    
    const plainText = seg.replace(/<[^>]+>/g, '');
    if (plainText.trim().length < 5) continue;

    // Try to find a 2-5 word phrase containing a target keyword
    for (const targetWord of targetWords) {
      // Build regex to find the target word within a natural phrase context
      // Match 0-2 words before + target word + 0-2 words after
      const phraseRegex = new RegExp(
        `(?<![<\\/a-zA-Z])` + // not inside a tag
        `((?:[a-zA-Z'-]+\\s+){0,2})` + // 0-2 words before
        `(${escapeRegExp(targetWord)}(?:s|ed|ing|tion|ment|er|ly)?)` + // target word with optional suffix
        `((?:\\s+[a-zA-Z'-]+){0,2})` + // 0-2 words after
        `(?![^<]*>)`, // not inside a tag
        'i'
      );
      
      const phraseMatch = plainText.match(phraseRegex);
      if (!phraseMatch) continue;
      
      const fullPhrase = (phraseMatch[1] + phraseMatch[2] + phraseMatch[3]).trim();
      // Require at least 2 words for a natural-looking anchor
      const wordCount = fullPhrase.split(/\s+/).length;
      if (wordCount < 2 || wordCount > 5) continue;
      // Don't use phrases that are too short
      if (fullPhrase.length < 5) continue;
      
      // Now replace the first occurrence of this phrase in the segment
      const escPhrase = escapeRegExp(fullPhrase);
      const replaceRegex = new RegExp(`(?<!<a[^>]*>)\\b(${escPhrase})\\b(?![^<]*<\\/a>)`, 'i');
      
      if (replaceRegex.test(seg)) {
        segments[i] = seg.replace(
          replaceRegex,
          `<a href="${targetUrl}" title="${escapeHtml(targetTitle)}">$1</a>`
        );
        return openTag + segments.join('') + closeTag;
      }
    }
  }
  
  return null;
}

/**
 * AI-generated contextual sentence for natural link insertion.
 * Calls Lovable AI (Gemini Flash Lite) to write ONE sentence that continues
 * the paragraph naturally and contains a short anchor phrase for linking.
 */
async function generateContextualSentence(
  paragraphText: string,
  targetTitle: string,
  targetKeywords: string[],
  targetUrl: string,
): Promise<{ sentence: string; anchorPhrase: string } | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not configured, skipping AI sentence generation');
    return null;
  }

  // Strip HTML for clean context
  const cleanText = paragraphText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanText.length < 30) return null;

  const keywordList = targetKeywords.filter(k => k && k.length > 0).join(', ');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are an SEO content editor. Your job is to write ONE sentence that naturally continues a given paragraph. The sentence must:
- Feel like the original author wrote it — same tone, same topic flow
- Contain a short phrase (2-5 words) related to the target topic that works as anchor text
- NOT use generic phrases like "learn more", "check out", "see our guide", "for more details", "explore our", "read about"
- Be informative and add value to the paragraph
- Flow seamlessly from the last sentence

Return ONLY valid JSON: {"sentence": "your sentence here", "anchorPhrase": "the 2-5 word phrase"}
The anchorPhrase MUST appear exactly as-is within the sentence.`,
          },
          {
            role: 'user',
            content: `Paragraph context: "${cleanText}"

Target article title: "${targetTitle}"
Target keywords: ${keywordList}

Write one natural continuation sentence containing anchor text related to the target topic.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.warn(`AI gateway returned ${status} for contextual sentence`);
      if (status === 429 || status === 402) {
        // Rate limited or out of credits — don't retry
        return null;
      }
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    if (!parsed.sentence || !parsed.anchorPhrase) return null;

    // Validate anchor phrase exists in sentence
    if (!parsed.sentence.includes(parsed.anchorPhrase)) {
      console.warn('AI anchor phrase not found in sentence, skipping');
      return null;
    }

    // Validate anchor phrase length (2-5 words)
    const wordCount = parsed.anchorPhrase.trim().split(/\s+/).length;
    if (wordCount < 2 || wordCount > 6) return null;

    return { sentence: parsed.sentence, anchorPhrase: parsed.anchorPhrase };
  } catch (error) {
    console.warn('AI contextual sentence generation failed:', error);
    return null;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Smart contextual link insertion:
 * 1. Parse paragraphs, score by keyword relevance
 * 2. Try natural phrase match in best paragraph
 * 3. Fallback: append bridge sentence
 */
async function insertLinkContextually(
  content: string,
  suggestion: { id: string; anchor_text: string; target_title: string },
  targetUrl: string,
  targetPrimaryKeyword: string | null,
  targetSecondaryKeywords: string[] | null,
): Promise<string | null> {
  const paragraphs = parseParagraphs(content);
  if (paragraphs.length < 3) return null; // Too short to safely link

  // Check if this target URL is already linked
  if (content.includes(`href="${targetUrl}"`)) return null;

  const targetWords = getTargetWords(targetPrimaryKeyword, targetSecondaryKeywords);
  if (targetWords.length === 0) return null;

  // Score paragraphs
  const scored = paragraphs
    .map(p => ({ para: p, score: scoreParagraph(p, targetWords, paragraphs.length) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  // Try natural phrase match in top 3 scoring paragraphs
  for (const { para } of scored.slice(0, 3)) {
    const modified = tryNaturalPhraseMatch(para.html, targetWords, targetUrl, suggestion.target_title);
    if (modified) {
      return content.replace(para.html, modified);
    }
  }

  // Fallback: AI-generated contextual sentence
  const bestPara = scored[0].para;
  const allKeywords = [
    ...(targetPrimaryKeyword ? [targetPrimaryKeyword] : []),
    ...(targetSecondaryKeywords || []),
  ];

  const aiResult = await generateContextualSentence(
    bestPara.html,
    suggestion.target_title,
    allKeywords,
    targetUrl,
  );

  if (aiResult) {
    // Wrap the anchor phrase in a link within the AI sentence
    const linkedSentence = aiResult.sentence.replace(
      aiResult.anchorPhrase,
      `<a href="${targetUrl}" title="${escapeHtml(suggestion.target_title)}">${aiResult.anchorPhrase}</a>`,
    );
    const modifiedPara = bestPara.html.replace(/<\/p>$/i, ` ${linkedSentence}</p>`);
    return content.replace(bestPara.html, modifiedPara);
  }

  return null; // No AI result — skip rather than insert generic text
}

// ── Build target URL from suggestion ──

function buildTargetUrl(suggestion: { target_type: string; target_slug: string }, categorySlug?: string): string {
  switch (suggestion.target_type) {
    case 'template':
      return `/templates/${suggestion.target_slug}`;
    case 'article':
      return `/articles/${categorySlug || 'general'}/${suggestion.target_slug}`;
    case 'guide':
      return `/guides/${suggestion.target_slug}`;
    default:
      return `/${suggestion.target_slug}`;
  }
}

// ── Main handler ──

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
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const userId = claims.claims.sub as string;
    const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { suggestionIds, categorySlug, autoApproveThreshold, maxOutboundPerArticle } = await req.json() as ApplyLinksRequest;
    const MAX_OUTBOUND = maxOutboundPerArticle || 8;

    // Auto-approve high-relevance suggestions if threshold provided
    if (autoApproveThreshold && autoApproveThreshold > 0) {
      await supabaseAdmin
        .from('link_suggestions')
        .update({ status: 'approved' })
        .eq('status', 'pending')
        .gte('relevance_score', autoApproveThreshold);
    }

    // Build query for approved suggestions — fetch target embedding data too
    let query = supabaseAdmin
      .from('link_suggestions')
      .select(`
        *,
        blog_posts!inner(id, content, slug, category_slug),
        article_embeddings:target_embedding_id(primary_keyword, secondary_keywords)
      `)
      .eq('status', 'approved');

    if (suggestionIds && suggestionIds.length > 0) {
      query = query.in('id', suggestionIds);
    } else if (categorySlug) {
      query = query.eq('blog_posts.category_slug', categorySlug);
    }

    const { data: suggestions, error: suggestionsError } = await query.limit(100);

    if (suggestionsError) {
      throw new Error(`Failed to fetch suggestions: ${suggestionsError.message}`);
    }

    if (!suggestions || suggestions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No approved suggestions to apply',
        applied: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group suggestions by post
    const suggestionsByPost = new Map<string, typeof suggestions>();
    for (const suggestion of suggestions) {
      const postId = suggestion.source_post_id;
      if (!suggestionsByPost.has(postId)) {
        suggestionsByPost.set(postId, []);
      }
      suggestionsByPost.get(postId)!.push(suggestion);
    }

    let appliedCount = 0;
    let failedCount = 0;
    const results: Array<{ suggestionId: string; success: boolean; error?: string }> = [];

    // Process each post
    for (const [postId, postSuggestions] of suggestionsByPost) {
      try {
        // ── OUTBOUND CAP ENFORCEMENT ──
        const { count: alreadyApplied } = await supabaseAdmin
          .from('link_suggestions')
          .select('id', { count: 'exact', head: true })
          .eq('source_post_id', postId)
          .eq('status', 'applied');

        const remainingSlots = MAX_OUTBOUND - (alreadyApplied || 0);

        if (remainingSlots <= 0) {
          for (const s of postSuggestions) {
            await supabaseAdmin
              .from('link_suggestions')
              .update({ status: 'rejected', hierarchy_violation: 'Outbound cap reached' })
              .eq('id', s.id);
            results.push({ suggestionId: s.id, success: false, error: 'Outbound cap reached' });
            failedCount++;
          }
          continue;
        }

        const { data: post, error: postError } = await supabaseAdmin
          .from('blog_posts')
          .select('content, article_type, content_plan_id')
          .eq('id', postId)
          .single();

        if (postError || !post) {
          throw new Error(`Post not found: ${postId}`);
        }

        let updatedContent = post.content;

        // Sort suggestions by relevance (highest first), then cap to remaining slots
        const sortedSuggestions = postSuggestions
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

        const cappedSuggestions = sortedSuggestions.slice(0, remainingSlots);
        const excessSuggestions = sortedSuggestions.slice(remainingSlots);

        for (const s of excessSuggestions) {
          await supabaseAdmin
            .from('link_suggestions')
            .update({ status: 'rejected', hierarchy_violation: 'Outbound cap reached' })
            .eq('id', s.id);
          results.push({ suggestionId: s.id, success: false, error: 'Outbound cap reached' });
          failedCount++;
        }

        // Process each suggestion with smart contextual insertion
        for (const suggestion of cappedSuggestions) {
          try {
            const targetUrl = buildTargetUrl(suggestion, suggestion.blog_posts?.category_slug);

            // Get target keywords from the joined embedding data
            const targetEmbed = (suggestion as any).article_embeddings;
            const targetPrimaryKeyword = targetEmbed?.primary_keyword || null;
            const targetSecondaryKeywords = targetEmbed?.secondary_keywords || null;

            const result = await insertLinkContextually(
              updatedContent,
              suggestion,
              targetUrl,
              targetPrimaryKeyword,
              targetSecondaryKeywords,
            );

            if (result) {
              updatedContent = result;

              await supabaseAdmin
                .from('link_suggestions')
                .update({ 
                  status: 'applied',
                  applied_at: new Date().toISOString(),
                })
                .eq('id', suggestion.id);

              // Update inbound/outbound counters
              await supabaseAdmin.rpc('increment_link_counters', {
                p_source_post_id: postId,
                p_target_embedding_id: suggestion.target_embedding_id,
              }).catch(err => console.warn(`Counter update failed for ${suggestion.id}:`, err));

              appliedCount++;
              results.push({ suggestionId: suggestion.id, success: true });
            } else {
              results.push({ 
                suggestionId: suggestion.id, 
                success: false, 
                error: 'No suitable paragraph found for link insertion' 
              });
              failedCount++;
            }

          } catch (error) {
            console.error(`Failed to apply suggestion ${suggestion.id}:`, error);
            results.push({ 
              suggestionId: suggestion.id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            failedCount++;
          }
        }

        // === PILLAR-AWARE LINKING ===
        if (post.article_type === 'pillar' && post.content_plan_id) {
          const { data: plan } = await supabaseAdmin
            .from('content_plans')
            .select('template_slug, template_name')
            .eq('id', post.content_plan_id)
            .single();

          if (plan) {
            const templateUrl = `/templates/${plan.template_slug}`;
            const templateLinkHtml = `<p class="cta-link"><strong>Ready to take action?</strong> Use our <a href="${templateUrl}" title="${plan.template_name}">${plan.template_name}</a> template to create your dispute letter now.</p>`;
            
            if (!updatedContent.includes(templateUrl)) {
              updatedContent = updatedContent.replace(
                /(<\/[^>]+>)\s*$/,
                `${templateLinkHtml}$1`
              );
            }
          }
        }

        // Update the post content
        if (updatedContent !== post.content) {
          await supabaseAdmin
            .from('blog_posts')
            .update({ content: updatedContent })
            .eq('id', postId);
        }

      } catch (error) {
        console.error(`Failed to process post ${postId}:`, error);
        for (const s of postSuggestions) {
          results.push({ 
            suggestionId: s.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          failedCount++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      applied: appliedCount,
      failed: failedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in apply-links-bulk:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
