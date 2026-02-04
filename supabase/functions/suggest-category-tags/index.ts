import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, excerpt, availableCategories } = await req.json();

    if (!title) {
      throw new Error('Title is required');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Truncate content to first 1500 chars for analysis
    const truncatedContent = content ? content.substring(0, 1500) : '';
    
    // Format categories for AI prompt
    const categoriesList = availableCategories?.map((c: { slug: string; name: string }) => 
      `- "${c.slug}": ${c.name}`
    ).join('\n') || '';

    const systemPrompt = `You are an expert content categorizer for a consumer rights and dispute letter website. Your job is to:
1. Analyze the article title and content
2. Select the MOST appropriate category from the available options
3. Generate exactly 2 highly specific, relevant tags

Categories must match one of the provided slugs exactly. Tags should be:
- Specific to the content (not generic like "tips" or "advice")
- Relevant to consumer rights, disputes, or complaints
- 2-4 words each, lowercase

Return a JSON object with this exact structure:
{
  "suggestedCategory": "category-slug",
  "suggestedTags": ["specific-tag-one", "specific-tag-two"],
  "confidence": 85
}`;

    const userPrompt = `Analyze this article and categorize it:

TITLE: ${title}

EXCERPT: ${excerpt || 'No excerpt provided'}

CONTENT PREVIEW: ${truncatedContent}

AVAILABLE CATEGORIES:
${categoriesList}

Return the JSON response with category slug, 2 tags, and confidence score.`;

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
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content?.trim();

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = aiContent;
    const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    // Validate category exists in available categories
    const validCategory = availableCategories?.find(
      (c: { slug: string }) => c.slug === result.suggestedCategory
    );

    if (!validCategory && availableCategories?.length > 0) {
      // Fall back to first category if AI returned invalid one
      result.suggestedCategory = availableCategories[0].slug;
      result.confidence = Math.max(0, result.confidence - 20);
    }

    // Ensure tags are lowercase and clean
    result.suggestedTags = (result.suggestedTags || [])
      .slice(0, 2)
      .map((tag: string) => tag.toLowerCase().trim());

    console.log('Suggested category:', result.suggestedCategory);
    console.log('Suggested tags:', result.suggestedTags);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-category-tags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
