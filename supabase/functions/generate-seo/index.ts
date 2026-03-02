import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, excerpt } = await req.json();

    if (!title && !content) {
      throw new Error('Title or content is required');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are an SEO expert. Based on the following blog post, generate optimized SEO metadata.

Title: ${title || 'Untitled'}
${excerpt ? `Excerpt: ${excerpt}` : ''}
Content: ${content ? content.substring(0, 2000) : 'No content provided'}

Generate the following in JSON format:
1. "metaTitle": An SEO-optimized meta title (max 60 characters, include main keyword early)
2. "metaDescription": A compelling meta description (max 155 characters, include call-to-action)
3. "suggestedTags": An array of 5-7 relevant tags (lowercase, single or two words each)
4. "suggestedExcerpt": A brief excerpt/summary (max 200 characters)

BANNED WORDS (never use): navigating, navigate, elevate, elevating, delve, leverage, seamless, robust, comprehensive, cutting-edge, empower, unlock, unleash, streamline, optimize, foster, facilitate, paramount, pivotal, groundbreaking, revolutionary, game-changer, vital, crucial, essential, landscape, realm, enhance, enhancing, spearhead, holistic, synergy, paradigm, effortlessly, utilize, dive into, deep dive.
Write like a direct, no-nonsense human copywriter. Plain, concrete language only.

Focus on: clarity, relevant keywords, and click-worthiness. Make it compelling for search results.

Return ONLY valid JSON, no markdown code blocks.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert that generates optimized metadata for blog posts. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let seoData;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      seoData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify(seoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-seo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
