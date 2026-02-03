import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageResult {
  url: string;
  thumbnail_url: string;
  alt_text: string;
  photographer: string;
  photographer_url: string;
  source: 'pixabay';
  pixabay_id: number;
  relevance_score: number;
}

interface PixabayHit {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
  userImageURL: string;
  pageURL: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords } = await req.json();

    if (!topic) {
      throw new Error('Topic is required');
    }

    const pixabayKey = Deno.env.get('PIXABAY_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!pixabayKey) {
      throw new Error('PIXABAY_API_KEY is not configured');
    }

    // Step 1: Use AI to extract visual keywords from topic
    let searchQuery = topic;
    
    if (lovableKey) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              {
                role: 'system',
                content: 'You extract visual keywords for stock photo searches. Return only 3-5 simple, visual keywords separated by spaces. No explanations, no punctuation, just keywords.'
              },
              {
                role: 'user',
                content: `Extract visual keywords for finding stock photos about: "${topic}"${keywords ? `. Related keywords: ${keywords}` : ''}`
              }
            ],
            temperature: 0.3,
            max_tokens: 50,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const extractedKeywords = aiData.choices[0]?.message?.content?.trim();
          if (extractedKeywords) {
            searchQuery = extractedKeywords;
          }
        }
      } catch (e) {
        console.log('AI keyword extraction failed, using topic directly:', e);
      }
    }

    // Truncate to 100 chars (Pixabay limit)
    searchQuery = searchQuery.substring(0, 100);
    console.log('Searching Pixabay for:', searchQuery);

    // Step 2: Search Pixabay
    const pixabayUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(searchQuery)}&image_type=photo&orientation=horizontal&per_page=12&safesearch=true`;
    
    const pixabayResponse = await fetch(pixabayUrl);
    
    if (!pixabayResponse.ok) {
      throw new Error(`Pixabay API error: ${pixabayResponse.status}`);
    }

    const pixabayData = await pixabayResponse.json();
    const hits: PixabayHit[] = pixabayData.hits || [];

    console.log('Pixabay returned', hits.length, 'images');

    // Step 3: Generate alt text and score relevance using AI
    const images: ImageResult[] = [];

    for (const hit of hits.slice(0, 6)) {
      let altText = `${topic} - professional stock photo`;
      let relevanceScore = 70;

      // Use AI to generate better alt text if available
      if (lovableKey) {
        try {
          const altResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: 'Generate SEO-optimized alt text for images. Return only the alt text, 10-15 words max. Be descriptive and include relevant keywords naturally.'
                },
                {
                  role: 'user',
                  content: `Generate alt text for a stock photo about "${topic}". The image has these tags: ${hit.tags}`
                }
              ],
              temperature: 0.5,
              max_tokens: 50,
            }),
          });

          if (altResponse.ok) {
            const altData = await altResponse.json();
            altText = altData.choices[0]?.message?.content?.trim() || altText;
          }
        } catch (e) {
          console.log('Alt text generation failed for image:', hit.id);
        }
      }

      // Simple relevance scoring based on tag matching
      const topicWords = topic.toLowerCase().split(/\s+/);
      const tagWords = hit.tags.toLowerCase().split(',').map(t => t.trim());
      const matchCount = topicWords.filter((word: string) => 
        tagWords.some((tag: string) => tag.includes(word) || word.includes(tag))
      ).length;
      relevanceScore = Math.min(100, 60 + (matchCount * 15));

      images.push({
        url: hit.largeImageURL,
        thumbnail_url: hit.webformatURL,
        alt_text: altText,
        photographer: hit.user,
        photographer_url: hit.pageURL,
        source: 'pixabay',
        pixabay_id: hit.id,
        relevance_score: relevanceScore,
      });
    }

    // Sort by relevance score
    images.sort((a, b) => b.relevance_score - a.relevance_score);

    return new Response(JSON.stringify({
      success: true,
      images,
      searchQuery,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      images: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
