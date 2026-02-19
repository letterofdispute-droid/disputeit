import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { BLOG_WRITER_CONTEXT, SITE_CONFIG, CATEGORIES, WRITING_STYLE_GUIDELINES, buildStateRightsLinkingContext } from "../_shared/siteContext.ts";
import { validateContent, getViolationSummary, type ValidationResult } from "../_shared/contentValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  topic: string;
  keywords: string;
  wordCount: number;
  tone: string;
  categorySlug?: string;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  expert_professional: "Write in an authoritative, knowledgeable tone with professional polish. Use industry terminology appropriately and demonstrate expertise.",
  informative_engaging: "Write in a clear, educational style that makes complex topics accessible. Use examples and analogies to help readers understand.",
  casual_honest: "Write in a relaxed, conversational tone like you're giving advice to a friend. Be direct and straightforward.",
  empathetic_supportive: "Write with understanding and compassion. Acknowledge the reader's frustrations and provide reassurance alongside practical advice.",
  action_oriented: "Write in a direct, practical style focused on clear next steps. Use imperative language and numbered action items where appropriate."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, wordCount: requestedWordCount, tone, categorySlug } = await req.json() as GenerateRequest;

    if (!topic) {
      throw new Error('Topic is required');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.expert_professional;
    const keywordList = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
    const targetWordCount = Math.max(requestedWordCount || 1200, 1200);

    // Find relevant category for context
    const relevantCategory = categorySlug 
      ? CATEGORIES.find(c => c.id === categorySlug)
      : null;

    // Randomly decide on 1 or 2 middle images
    const useTwoMiddleImages = Math.random() < 0.5;
    const middleImageInstructions = useTwoMiddleImages
      ? `6. Include TWO image placeholders:
   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 33% through the content
   - Insert {{MIDDLE_IMAGE_2}} on its own line at approximately 66% through the content`
      : `6. Include ONE image placeholder:
   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 45% through the content`;

    const stateRightsContext = buildStateRightsLinkingContext(categorySlug || undefined);

    const systemPrompt = `${BLOG_WRITER_CONTEXT}

${WRITING_STYLE_GUIDELINES}

${stateRightsContext}

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON - no markdown, no code blocks, no explanations
2. The "content" field must contain semantic HTML (NOT markdown)
3. Use these HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>
4. NEVER use <h1> tags - the title is displayed separately
5. NEVER include "Conclusion", "FAQ", "TL;DR", "Summary" sections
6. NEVER use em dashes (—). Use regular hyphens (-) instead.
${middleImageInstructions}

CONTENT REQUIREMENTS:
- CRITICAL: Write MINIMUM ${targetWordCount} words. Articles under ${targetWordCount} words will be rejected.
- This is a LONG-FORM article - include 5-7 substantial sections with detailed explanations
- MANDATORY: Every article MUST contain at least 1-2 structured lists using \`<ul>\` or \`<ol>\` tags. Use numbered lists for sequential steps and bullet lists for tips, options, features, or criteria. Lists are MORE impactful than paragraphs - prefer them whenever presenting multiple items, requirements, rights, deadlines, or action steps.
- When the article topic involves evaluating a product, service, approach, or decision, include a clearly labeled Pros and Cons section using this structure: \`<h3>Pros</h3><ul><li>...</li></ul><h3>Cons</h3><ul><li>...</li></ul>\`. This applies to comparison articles, service reviews, method evaluations, and any "should you" type content.
- ${toneInstruction}
- Naturally incorporate the primary keywords 2-3+ times each throughout the article
- Generate and naturally use 10-15 LSI (Latent Semantic Indexing) keywords
- Write for US readers who need help with disputes and complaints
- Include actionable advice and practical steps
- Each section should have 150-250 words
${relevantCategory ? `- This article relates to our ${relevantCategory.name} category (${relevantCategory.description})` : ''}

SEO REQUIREMENTS:
- seo_title: 50-60 characters, include primary keyword near the beginning
- seo_description: 150-160 characters, compelling with primary keyword
- excerpt: 150-200 characters, engaging summary for blog listings`;

    const userPrompt = `Generate a complete blog article about: "${topic}"

${keywordList.length > 0 ? `Primary keywords to include: ${keywordList.join(', ')}` : ''}
${categorySlug ? `Category context: ${categorySlug}` : ''}

Respond with ONLY this JSON structure (no markdown code blocks):
{
  "title": "Article title here",
  "seo_title": "SEO optimized title (50-60 chars)",
  "seo_description": "Meta description (150-160 chars)",
  "excerpt": "Blog listing excerpt (150-200 chars)",
  "content": "<h2>First Section</h2><p>Content here...</p>{{MIDDLE_IMAGE_1}}<h2>Second Section</h2><p>More content...</p>",
  "suggested_category": "category-slug",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "lsi_keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    console.log('Generating blog content for topic:', topic);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response, handling potential markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanedContent);
      throw new Error('Failed to parse generated content');
    }

    // Count words in content
    const textContent = parsedContent.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').filter(Boolean).length;

    // Validate content for AI-typical phrases
    const validationResult = validateContent(parsedContent.content);
    console.log('Content validation:', getViolationSummary(validationResult));

    console.log('Generated content with', wordCount, 'words');

    return new Response(JSON.stringify({
      success: true,
      data: {
        title: parsedContent.title,
        seo_title: parsedContent.seo_title,
        seo_description: parsedContent.seo_description,
        excerpt: parsedContent.excerpt,
        content: parsedContent.content,
        suggested_category: parsedContent.suggested_category,
        suggested_tags: parsedContent.suggested_tags?.slice(0, 3) || [],
        lsi_keywords: parsedContent.lsi_keywords || [],
        word_count: wordCount,
        validation: validationResult,
      },
      model: data.model,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
