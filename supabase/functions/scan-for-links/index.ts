import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  postId?: string;
  categorySlug?: string;
  minRelevance?: number;
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

    const { postId, categorySlug, minRelevance = 70 } = await req.json() as ScanRequest;

    // Build query for posts to scan
    let postsQuery = supabaseAdmin
      .from('blog_posts')
      .select('id, title, content, category_slug, related_templates')
      .eq('status', 'draft'); // Only scan drafts that haven't been published

    if (postId) {
      postsQuery = postsQuery.eq('id', postId);
    } else if (categorySlug) {
      postsQuery = postsQuery.eq('category_slug', categorySlug);
    }

    const { data: posts, error: postsError } = await postsQuery.limit(20);

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No posts to scan',
        scanned: 0,
        suggestions: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all templates for linking opportunities
    // Note: Templates are in code, so we'll use content_plans as proxy
    const { data: plans } = await supabaseAdmin
      .from('content_plans')
      .select('template_slug, template_name, category_id');

    // Fetch other published articles for cross-linking
    const { data: otherArticles } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, slug, category_slug')
      .eq('status', 'published')
      .limit(100);

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    let totalSuggestions = 0;
    const results: Array<{ postId: string; suggestionsFound: number }> = [];

    for (const post of posts) {
      try {
        // Strip HTML for analysis
        const textContent = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        // Build context for AI
        const templateContext = plans?.map(p => ({
          slug: p.template_slug,
          name: p.template_name,
          category: p.category_id,
        })) || [];

        const articleContext = otherArticles?.filter(a => a.id !== post.id).map(a => ({
          slug: a.slug,
          title: a.title,
          category: a.category_slug,
        })) || [];

        const systemPrompt = `You are an SEO link strategist. Analyze article content and suggest internal linking opportunities.

RULES:
1. Find phrases that naturally relate to templates or other articles
2. Suggest anchor text that fits contextually
3. Prefer template links over article links
4. Don't suggest links for phrases already linked
5. Each suggestion needs: target type, target slug, anchor text, context snippet, relevance score (0-100)
6. Only suggest links with relevance score >= ${minRelevance}
7. Maximum 10 suggestions per article
8. Output valid JSON only`;

        const userPrompt = `Analyze this article for internal linking opportunities:

Article Title: "${post.title}"
Category: ${post.category_slug}

Content (first 2000 chars):
${textContent.substring(0, 2000)}

Available Templates to Link:
${templateContext.slice(0, 30).map(t => `- ${t.name} (${t.slug})`).join('\n')}

Available Articles to Link:
${articleContext.slice(0, 20).map(a => `- ${a.title} (${a.slug})`).join('\n')}

Return JSON:
{
  "suggestions": [
    {
      "target_type": "template|article|guide",
      "target_slug": "the-slug",
      "target_title": "Target Title",
      "anchor_text": "exact phrase to make a link",
      "context_snippet": "...surrounding text for context...",
      "relevance_score": 85
    }
  ]
}`;

        const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
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
            temperature: 0.5,
            max_tokens: 2000,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI Gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        let content = aiData.choices[0]?.message?.content;
        
        // Parse JSON
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

        const parsedContent = JSON.parse(cleanedContent);
        const suggestions = parsedContent.suggestions || [];

        // Filter and store suggestions
        const validSuggestions = suggestions
          .filter((s: any) => s.relevance_score >= minRelevance)
          .slice(0, 10);

        if (validSuggestions.length > 0) {
          // Find approximate insert positions in original content
          const suggestionsWithPositions = validSuggestions.map((s: any) => {
            const anchorLower = s.anchor_text.toLowerCase();
            const contentLower = post.content.toLowerCase();
            const position = contentLower.indexOf(anchorLower);
            return {
              source_post_id: post.id,
              target_type: s.target_type,
              target_slug: s.target_slug,
              target_title: s.target_title,
              anchor_text: s.anchor_text,
              context_snippet: s.context_snippet,
              insert_position: position >= 0 ? position : null,
              relevance_score: s.relevance_score,
              status: 'pending',
            };
          });

          const { error: insertError } = await supabaseAdmin
            .from('link_suggestions')
            .insert(suggestionsWithPositions);

          if (insertError) {
            console.error(`Failed to insert suggestions for ${post.id}:`, insertError);
          } else {
            totalSuggestions += validSuggestions.length;
          }
        }

        results.push({ postId: post.id, suggestionsFound: validSuggestions.length });
        console.log(`Scanned ${post.title}: ${validSuggestions.length} suggestions`);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to scan post ${post.id}:`, error);
        results.push({ postId: post.id, suggestionsFound: 0 });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scanned: posts.length,
      totalSuggestions,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scan-for-links:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
