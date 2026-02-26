import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 20;

// ── Self-chain helper ──

async function selfChainWithRetry(body: object): Promise<void> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/apply-links-bulk`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    apikey: Deno.env.get('SUPABASE_ANON_KEY')!,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok || res.status === 504) return; // 504 = still running, that's fine
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
    }
  }
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
    const textLower = inner.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').toLowerCase();
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
  if (para.textLower.trim().length < 40) return -1;
  if (para.index === 0 || para.index === totalParagraphs - 1) return -1;
  if (para.linkCount >= 2) return -1;

  let score = 0;
  for (const word of targetWords) {
    if (word.length < 3) continue;
    const wordRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    const matches = para.textLower.match(wordRegex);
    if (matches) score += matches.length;
  }

  if (para.linkCount === 1) score *= 0.7;
  return score;
}

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
  const stopWords = new Set(['the', 'and', 'for', 'with', 'your', 'that', 'this', 'from', 'have', 'has', 'are', 'was', 'were', 'been', 'will', 'can', 'how', 'what', 'when', 'where', 'which', 'who', 'why', 'not', 'but', 'all', 'also', 'than', 'them', 'then', 'its', 'into', 'about', 'more', 'some', 'may', 'our', 'out', 'you']);
  return [...words].filter(w => !stopWords.has(w));
}

function tryNaturalPhraseMatch(
  paraHtml: string,
  targetWords: string[],
  targetUrl: string,
  targetTitle: string,
): string | null {
  const innerMatch = paraHtml.match(/^(<p[^>]*>)([\s\S]*?)(<\/p>)$/i);
  if (!innerMatch) return null;
  const [, openTag, inner, closeTag] = innerMatch;

  const segments = inner.split(/(<a\s[\s\S]*?<\/a>)/gi);
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.match(/^<a\s/i)) continue;
    if (seg.match(/^<[^>]+>$/)) continue;
    
    const plainText = seg.replace(/<[^>]+>/g, '');
    if (plainText.trim().length < 5) continue;

    for (const targetWord of targetWords) {
      const phraseRegex = new RegExp(
        `(?<![<\\/a-zA-Z])` +
        `((?:[a-zA-Z'-]+\\s+){0,2})` +
        `(${escapeRegExp(targetWord)}(?:s|ed|ing|tion|ment|er|ly)?)` +
        `((?:\\s+[a-zA-Z'-]+){0,2})` +
        `(?![^<]*>)`,
        'i'
      );
      
      const phraseMatch = plainText.match(phraseRegex);
      if (!phraseMatch) continue;
      
      const fullPhrase = (phraseMatch[1] + phraseMatch[2] + phraseMatch[3]).trim();
      const wordCount = fullPhrase.split(/\s+/).length;
      if (wordCount < 2 || wordCount > 5) continue;
      if (fullPhrase.length < 5) continue;
      
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

async function generateContextualSentence(
  paragraphText: string,
  targetTitle: string,
  targetKeywords: string[],
  targetUrl: string,
): Promise<{ sentence: string; anchorPhrase: string } | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return null;

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
- Feel like the original author wrote it - same tone, same topic flow
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

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    if (!parsed.sentence || !parsed.anchorPhrase) return null;
    if (!parsed.sentence.includes(parsed.anchorPhrase)) return null;

    const wordCount = parsed.anchorPhrase.trim().split(/\s+/).length;
    if (wordCount < 2 || wordCount > 6) return null;

    return { sentence: parsed.sentence, anchorPhrase: parsed.anchorPhrase };
  } catch {
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
 * Insert a pre-generated sentence containing a linked anchor into the best paragraph.
 */
function insertGeneratedSentence(
  content: string,
  targetUrl: string,
  targetTitle: string,
  anchorText: string,
  generatedSentence: string,
): string | null {
  const paragraphs = parseParagraphs(content);
  if (paragraphs.length < 3) return null;
  if (content.includes(`href="${targetUrl}"`)) return null;

  // Find a suitable paragraph (not first, not last, not too many links)
  const eligible = paragraphs.filter(p =>
    p.index > 0 &&
    p.index < paragraphs.length - 1 &&
    p.linkCount < 2 &&
    p.textLower.trim().length >= 40
  );

  if (eligible.length === 0) {
    // Relax: allow first or last paragraph as last resort
    const relaxed = paragraphs.filter(p =>
      p.linkCount < 2 &&
      p.textLower.trim().length >= 40
    );
    if (relaxed.length === 0) return null;
    const midIndex = Math.floor(relaxed.length / 2);
    const bestPara = relaxed[midIndex];
    const linkedSentence = generatedSentence.replace(
      anchorText,
      `<a href="${targetUrl}" title="${escapeHtml(targetTitle)}">${anchorText}</a>`,
    );
    const modifiedPara = bestPara.html.replace(/<\/p>$/i, ` ${linkedSentence}</p>`);
    return content.replace(bestPara.html, modifiedPara);
  }

  // Pick a paragraph in the middle-ish area
  const midIndex = Math.floor(eligible.length / 2);
  const bestPara = eligible[midIndex];

  // Build the linked sentence
  const linkedSentence = generatedSentence.replace(
    anchorText,
    `<a href="${targetUrl}" title="${escapeHtml(targetTitle)}">${anchorText}</a>`,
  );

  const modifiedPara = bestPara.html.replace(/<\/p>$/i, ` ${linkedSentence}</p>`);
  return content.replace(bestPara.html, modifiedPara);
}

async function insertLinkContextually(
  content: string,
  suggestion: { id: string; anchor_text: string; target_title: string; generated_sentence?: string | null },
  targetUrl: string,
  targetPrimaryKeyword: string | null,
  targetSecondaryKeywords: string[] | null,
): Promise<string | null> {
  console.log(`[INSERT] Suggestion ${suggestion.id}: entering insertLinkContextually`);

  // If link already exists, mark as already applied
  if (content.includes(`href="${targetUrl}"`)) {
    console.log(`[INSERT] Suggestion ${suggestion.id}: URL already in article, marking as applied`);
    return 'ALREADY_EXISTS';
  }

  // If we have a pre-generated sentence from discovery, use it directly
  if (suggestion.generated_sentence) {
    console.log(`[INSERT] Suggestion ${suggestion.id}: using pre-generated sentence`);
    const result = insertGeneratedSentence(
      content,
      targetUrl,
      suggestion.target_title,
      suggestion.anchor_text,
      suggestion.generated_sentence,
    );
    if (result) return result;
    console.log(`[INSERT] Suggestion ${suggestion.id}: pre-generated sentence insertion failed, falling through to fallback`);
  }

  // Otherwise, try phrase-matching logic first
  const paragraphs = parseParagraphs(content);
  console.log(`[INSERT] Suggestion ${suggestion.id}: ${paragraphs.length} paragraphs found`);

  const targetWords = getTargetWords(targetPrimaryKeyword, targetSecondaryKeywords);
  console.log(`[INSERT] Suggestion ${suggestion.id}: ${targetWords.length} target words`);

  // Try phrase-matching and AI generation only if we have enough paragraphs and keywords
  if (paragraphs.length >= 3 && targetWords.length > 0) {
    const scored = paragraphs
      .map(p => ({ para: p, score: scoreParagraph(p, targetWords, paragraphs.length) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log(`[INSERT] Suggestion ${suggestion.id}: ${scored.length} scored paragraphs`);

    if (scored.length > 0) {
      for (const { para } of scored.slice(0, 3)) {
        const modified = tryNaturalPhraseMatch(para.html, targetWords, targetUrl, suggestion.target_title);
        if (modified) {
          console.log(`[INSERT] Suggestion ${suggestion.id}: phrase match SUCCESS`);
          return content.replace(para.html, modified);
        }
      }

      // Fallback: AI-generated sentence
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
        console.log(`[INSERT] Suggestion ${suggestion.id}: AI sentence SUCCESS`);
        const linkedSentence = aiResult.sentence.replace(
          aiResult.anchorPhrase,
          `<a href="${targetUrl}" title="${escapeHtml(suggestion.target_title)}">${aiResult.anchorPhrase}</a>`,
        );
        const modifiedPara = bestPara.html.replace(/<\/p>$/i, ` ${linkedSentence}</p>`);
        return content.replace(bestPara.html, modifiedPara);
      }
    }
  }

  // Final fallback: create a simple linking sentence and append to a suitable paragraph
  const allParas = paragraphs.length > 0 ? paragraphs : parseParagraphs(content);
  const fallbackEligible = allParas.filter(p =>
    p.index > 0 &&
    p.index < allParas.length - 1 &&
    p.linkCount < 2 &&
    p.textLower.trim().length >= 40
  );

  const eligibleForFallback = fallbackEligible.length > 0
    ? fallbackEligible
    : allParas.filter(p => p.linkCount < 2 && p.textLower.trim().length >= 40);

  console.log(`[INSERT] Suggestion ${suggestion.id}: fallback eligible=${fallbackEligible.length}, relaxed=${eligibleForFallback.length}`);

  if (eligibleForFallback.length > 0) {
    const midIdx = Math.floor(eligibleForFallback.length / 2);
    const para = eligibleForFallback[midIdx];
    const linkHtml = `<a href="${targetUrl}" title="${escapeHtml(suggestion.target_title)}">${suggestion.anchor_text}</a>`;
    const sentence = `For further guidance, see our resource on ${linkHtml}.`;
    const modifiedPara = para.html.replace(/<\/p>$/i, ` ${sentence}</p>`);
    console.log(`[INSERT] Suggestion ${suggestion.id}: fallback sentence SUCCESS`);
    return content.replace(para.html, modifiedPara);
  }

  console.log(`[INSERT] Suggestion ${suggestion.id}: ALL paths exhausted, 0 eligible paragraphs`);
  return null;
}

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

// ── Process a single batch of approved suggestions ──

async function processBatch(
  supabaseAdmin: any,
  maxOutbound: number,
): Promise<{ applied: number; failed: number; processed: number }> {
  // Fetch next batch of approved suggestions
  const { data: suggestions, error: suggestionsError } = await supabaseAdmin
    .from('link_suggestions')
    .select(`
      *,
      blog_posts!inner(id, content, slug, category_slug, article_type, content_plan_id),
      article_embeddings:target_embedding_id(primary_keyword, secondary_keywords, category_id)
    `)
    .eq('status', 'approved')
    .order('relevance_score', { ascending: false })
    .limit(BATCH_SIZE);

  if (suggestionsError) throw new Error(`Failed to fetch suggestions: ${suggestionsError.message}`);
  if (!suggestions || suggestions.length === 0) return { applied: 0, failed: 0, processed: 0 };

  // Group by post
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

  for (const [postId, postSuggestions] of suggestionsByPost) {
    try {
      // Use outbound_count from article_embeddings (actual HTML links, kept accurate by reconcile_link_counts)
      // This avoids ghost-capping from stale 'applied' suggestion rows that diverge from real link counts
      const { data: sourceEmbed } = await supabaseAdmin
        .from('article_embeddings')
        .select('outbound_count')
        .eq('content_id', postId)
        .single();

      const currentOutbound = sourceEmbed?.outbound_count ?? 0;
      const remainingSlots = maxOutbound - currentOutbound;

      if (remainingSlots <= 0) {
        for (const s of postSuggestions) {
          await supabaseAdmin
            .from('link_suggestions')
            .update({ status: 'rejected', hierarchy_violation: 'Outbound cap reached' })
            .eq('id', s.id);
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
        for (const s of postSuggestions) {
          await supabaseAdmin
            .from('link_suggestions')
            .update({ status: 'rejected', hierarchy_violation: 'Post not found' })
            .eq('id', s.id);
          failedCount++;
        }
        continue;
      }

      let updatedContent = post.content;

      const sortedSuggestions = postSuggestions
        .sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0));

      const cappedSuggestions = sortedSuggestions.slice(0, remainingSlots);
      const excessSuggestions = sortedSuggestions.slice(remainingSlots);

      for (const s of excessSuggestions) {
        await supabaseAdmin
          .from('link_suggestions')
          .update({ status: 'rejected', hierarchy_violation: 'Outbound cap reached' })
          .eq('id', s.id);
        failedCount++;
      }

      for (const suggestion of cappedSuggestions) {
        try {
          const targetEmbed = (suggestion as any).article_embeddings;
          const targetCategorySlug = targetEmbed?.category_id || suggestion.blog_posts?.category_slug || 'general';
          const targetUrl = buildTargetUrl(suggestion, targetCategorySlug);
          const targetPrimaryKeyword = targetEmbed?.primary_keyword || null;
          const targetSecondaryKeywords = targetEmbed?.secondary_keywords || null;

          const result = await insertLinkContextually(
            updatedContent,
            suggestion,
            targetUrl,
            targetPrimaryKeyword,
            targetSecondaryKeywords,
          );

          if (result === 'ALREADY_EXISTS') {
            // Link already in article - mark as applied (no content change needed)
            await supabaseAdmin
              .from('link_suggestions')
              .update({ status: 'applied', applied_at: new Date().toISOString() })
              .eq('id', suggestion.id);
            console.log(`[BATCH] Suggestion ${suggestion.id}: already exists, marked applied`);
            appliedCount++;
          } else if (result) {
            updatedContent = result;
            await supabaseAdmin
              .from('link_suggestions')
              .update({ status: 'applied', applied_at: new Date().toISOString() })
              .eq('id', suggestion.id);

            try {
              await supabaseAdmin.rpc('increment_link_counters', {
                p_source_post_id: postId,
                p_target_embedding_id: suggestion.target_embedding_id,
              });
            } catch (counterErr: any) {
              console.warn(`Counter update failed for ${suggestion.id}:`, counterErr);
            }

            appliedCount++;
          } else {
            await supabaseAdmin
              .from('link_suggestions')
              .update({ status: 'rejected', hierarchy_violation: 'Could not find suitable insertion point' })
              .eq('id', suggestion.id);
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to apply suggestion ${suggestion.id}:`, error);
            try {
              await supabaseAdmin
                .from('link_suggestions')
                .update({ status: 'rejected', hierarchy_violation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
                .eq('id', suggestion.id);
            } catch (_) {
              // ignore
            }
          failedCount++;
        }
      }

      // Pillar-aware linking
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

      if (updatedContent !== post.content) {
        const { error: updateError } = await supabaseAdmin
          .from('blog_posts')
          .update({ content: updatedContent })
          .eq('id', postId);

        if (updateError) {
          console.error(`Failed to save content for ${postId}:`, updateError);
          // Revert applied statuses so they can be retried
          for (const s of cappedSuggestions) {
            await supabaseAdmin
              .from('link_suggestions')
              .update({ status: 'approved', applied_at: null })
              .eq('id', s.id)
              .eq('status', 'applied');
          }
          failedCount += cappedSuggestions.length;
          appliedCount = Math.max(0, appliedCount - cappedSuggestions.length);
        }
      }
    } catch (error) {
      console.error(`Failed to process post ${postId}:`, error);
      failedCount += postSuggestions.length;
    }
  }

  return { applied: appliedCount, failed: failedCount, processed: suggestions.length };
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { jobId, maxOutboundPerArticle } = body;
    const MAX_OUTBOUND = maxOutboundPerArticle || 8;

    // ── Chained call: continue processing ──
    if (jobId) {
      console.log(`[APPLY] Resuming job ${jobId}`);

      // Check job status
      const { data: job } = await supabaseAdmin
        .from('semantic_scan_jobs')
        .select('status')
        .eq('id', jobId)
        .single();

      if (!job || job.status !== 'processing') {
        console.log(`[APPLY] Job ${jobId} is ${job?.status || 'not found'}, stopping`);
        return new Response(JSON.stringify({ success: true, message: 'Job stopped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const result = await processBatch(supabaseAdmin, MAX_OUTBOUND);

        // Update progress atomically
        await supabaseAdmin.rpc('increment_scan_progress', {
          p_job_id: jobId,
          p_processed: result.applied + result.failed,
          p_suggestions: result.applied,
        });

        if (result.processed === 0) {
          // No more approved suggestions - complete the job
          await supabaseAdmin
            .from('semantic_scan_jobs')
            .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', jobId);
          
          console.log(`[APPLY] Job ${jobId} completed — reconciling link counts...`);
          
          // Critical: reconcile inbound/outbound counts so orphan detection is accurate
          try {
            const { data: reconcileResult, error: reconcileError } = await supabaseAdmin.rpc('reconcile_link_counts');
            if (reconcileError) {
              console.error(`[APPLY] Reconcile failed:`, reconcileError.message);
            } else {
              console.log(`[APPLY] Reconcile complete:`, reconcileResult);
            }
          } catch (e) {
            console.error(`[APPLY] Reconcile threw:`, e);
          }
        }
      } finally {
        // Check if there's more work
        const { count: remaining } = await supabaseAdmin
          .from('link_suggestions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved');

        const { data: freshJob } = await supabaseAdmin
          .from('semantic_scan_jobs')
          .select('status')
          .eq('id', jobId)
          .single();

        if ((remaining || 0) > 0 && freshJob?.status === 'processing') {
          await selfChainWithRetry({ jobId, maxOutboundPerArticle });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── First call: verify admin, create job, return immediately ──

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

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

    // Cancel any stuck apply jobs before starting a new one
    const { data: stuckJobs } = await supabaseAdmin
      .from('semantic_scan_jobs')
      .select('id')
      .eq('category_filter', '__apply_links__')
      .eq('status', 'processing');

    for (const stuckJob of (stuckJobs || [])) {
      await supabaseAdmin
        .from('semantic_scan_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', stuckJob.id);
      console.log(`[APPLY] Cancelled stuck job ${stuckJob.id}`);
    }

    // Count all approved suggestions
    const { count: approvedCount } = await supabaseAdmin
      .from('link_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    if (!approvedCount || approvedCount === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No approved suggestions to apply',
        applied: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a tracking job
    const { data: newJob, error: jobError } = await supabaseAdmin
      .from('semantic_scan_jobs')
      .insert({
        status: 'processing',
        total_items: approvedCount,
        processed_items: 0,
        total_suggestions: 0,
        similarity_threshold: 0,
        category_filter: '__apply_links__',
      })
      .select()
      .single();

    if (jobError || !newJob) {
      throw new Error(`Failed to create apply job: ${jobError?.message}`);
    }

    console.log(`[APPLY] Created job ${newJob.id} for ${approvedCount} approved suggestions`);

    // Fire-and-forget the first batch
    await selfChainWithRetry({ jobId: newJob.id, maxOutboundPerArticle });

    return new Response(JSON.stringify({
      success: true,
      jobId: newJob.id,
      totalItems: approvedCount,
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
