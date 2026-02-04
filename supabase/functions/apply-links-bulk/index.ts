import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplyLinksRequest {
  suggestionIds?: string[];
  categorySlug?: string;
  autoApproveThreshold?: number;
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

    const { suggestionIds, categorySlug, autoApproveThreshold } = await req.json() as ApplyLinksRequest;

    // Auto-approve high-relevance suggestions if threshold provided
    if (autoApproveThreshold && autoApproveThreshold > 0) {
      await supabaseAdmin
        .from('link_suggestions')
        .update({ status: 'approved' })
        .eq('status', 'pending')
        .gte('relevance_score', autoApproveThreshold);
    }

    // Build query for approved suggestions
    let query = supabaseAdmin
      .from('link_suggestions')
      .select(`
        *,
        blog_posts!inner(id, content, slug, category_slug)
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
        // Get current post content
        const { data: post, error: postError } = await supabaseAdmin
          .from('blog_posts')
          .select('content')
          .eq('id', postId)
          .single();

        if (postError || !post) {
          throw new Error(`Post not found: ${postId}`);
        }

        let updatedContent = post.content;

        // Sort suggestions by insert position (descending) to avoid position shifts
        const sortedSuggestions = postSuggestions
          .filter(s => s.insert_position !== null)
          .sort((a, b) => (b.insert_position || 0) - (a.insert_position || 0));

        for (const suggestion of sortedSuggestions) {
          try {
            // Build the target URL based on type
            let targetUrl: string;
            switch (suggestion.target_type) {
              case 'template':
                // Templates use hierarchical URLs
                targetUrl = `/templates/${suggestion.target_slug}`;
                break;
              case 'article':
                targetUrl = `/articles/${suggestion.blog_posts?.category_slug || 'general'}/${suggestion.target_slug}`;
                break;
              case 'guide':
                targetUrl = `/guides/${suggestion.target_slug}`;
                break;
              default:
                targetUrl = `/${suggestion.target_slug}`;
            }

            // Find and replace the anchor text with a link
            // Use case-insensitive search but preserve original case
            const anchorRegex = new RegExp(
              `(?<!<a[^>]*>)\\b(${escapeRegExp(suggestion.anchor_text)})\\b(?![^<]*<\\/a>)`,
              'i'
            );

            if (anchorRegex.test(updatedContent)) {
              updatedContent = updatedContent.replace(
                anchorRegex,
                `<a href="${targetUrl}" title="${suggestion.target_title}">$1</a>`
              );

              // Mark suggestion as applied
              await supabaseAdmin
                .from('link_suggestions')
                .update({ 
                  status: 'applied',
                  applied_at: new Date().toISOString(),
                })
                .eq('id', suggestion.id);

              appliedCount++;
              results.push({ suggestionId: suggestion.id, success: true });
            } else {
              // Anchor text not found - might already be linked or text changed
              results.push({ 
                suggestionId: suggestion.id, 
                success: false, 
                error: 'Anchor text not found in content' 
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

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
