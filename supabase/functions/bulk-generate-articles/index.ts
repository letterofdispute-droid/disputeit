import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SITE_CONFIG, CATEGORIES } from "../_shared/siteContext.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkGenerateRequest {
  planId?: string;
  categoryId?: string;
  queueItemIds?: string[];
  batchSize?: number;
  tone?: string;
  wordCount?: number;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  expert_professional: "Write in an authoritative, knowledgeable tone with professional polish.",
  informative_engaging: "Write in a clear, educational style that makes complex topics accessible.",
  casual_honest: "Write in a relaxed, conversational tone like giving advice to a friend.",
  empathetic_supportive: "Write with understanding and compassion for the reader's frustrations.",
  action_oriented: "Write in a direct, practical style focused on clear next steps.",
};

// Build category context for the AI
const CATEGORY_CONTEXT = CATEGORIES.map(c => `- ${c.name}: ${c.description}`).join('\n');

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
    
    // Use service role for database operations
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

    const { 
      planId, 
      categoryId, 
      queueItemIds,
      batchSize = 5, 
      tone = 'expert_professional',
      wordCount = 1500,
    } = await req.json() as BulkGenerateRequest;

    // Build query for queue items
    let query = supabaseAdmin
      .from('content_queue')
      .select(`
        *,
        content_plans!inner(
          template_slug,
          template_name,
          category_id,
          subcategory_slug
        )
      `)
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .limit(batchSize);

    if (queueItemIds && queueItemIds.length > 0) {
      query = query.in('id', queueItemIds);
    } else if (planId) {
      query = query.eq('plan_id', planId);
    } else if (categoryId) {
      query = query.eq('content_plans.category_id', categoryId);
    }

    const { data: queueItems, error: queueError } = await query;

    if (queueError) {
      throw new Error(`Failed to fetch queue items: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No queued items to process',
        processed: 0,
        results: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${queueItems.length} queue items`);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const results: Array<{ queueId: string; success: boolean; blogPostId?: string; error?: string }> = [];
    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.expert_professional;

    for (const item of queueItems) {
      try {
        // Mark as generating
        await supabaseAdmin
          .from('content_queue')
          .update({ status: 'generating' })
          .eq('id', item.id);

        const plan = item.content_plans;
        
        // Find relevant category info
        const categoryInfo = CATEGORIES.find(c => c.id === plan.category_id);
        
        // Randomly decide on 1 or 2 middle images
        const useTwoMiddleImages = Math.random() < 0.5;
        const middleImageInstructions = useTwoMiddleImages
          ? `7. Include TWO image placeholders:
   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 33% through the content
   - Insert {{MIDDLE_IMAGE_2}} on its own line at approximately 66% through the content`
          : `7. Include ONE image placeholder:
   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 45% through the content`;
        
        const systemPrompt = `You are an expert SEO content writer for Letter Of Dispute (${SITE_CONFIG.url}), 
a UK platform specializing in consumer rights, dispute resolution, and complaint letters.

ABOUT LETTER OF DISPUTE:
We provide ${SITE_CONFIG.templateCount} professionally written dispute letter templates across ${SITE_CONFIG.categoryCount} categories:
${CATEGORY_CONTEXT}

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON - no markdown, no code blocks
2. The "content" field must contain semantic HTML (NOT markdown)
3. Use these HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>
4. NEVER use <h1> tags
5. NEVER include "Conclusion", "FAQ", "TL;DR" sections
6. Use British English spelling throughout
${middleImageInstructions}

CONTENT REQUIREMENTS:
- Write approximately ${wordCount} words
- ${toneInstruction}
- Naturally incorporate the provided keywords 2-3+ times each
- Write for UK readers seeking help with disputes and complaints
- Include actionable advice and practical steps
- Reference Letter Of Dispute (${SITE_CONFIG.url}) as a helpful resource where appropriate
${categoryInfo ? `- This article relates to our ${categoryInfo.name} category` : ''}

SEO REQUIREMENTS:
- seo_title: 50-60 characters with primary keyword
- seo_description: 150-160 characters
- excerpt: 150-200 characters`;

        const userPrompt = `Generate a ${item.article_type} article:

Title: "${item.suggested_title}"
Template Context: ${plan.template_name}
Category: ${plan.category_id}
${plan.subcategory_slug ? `Subcategory: ${plan.subcategory_slug}` : ''}
Keywords: ${item.suggested_keywords?.join(', ') || 'consumer rights, dispute letter'}

Respond with ONLY this JSON:
{
  "title": "${item.suggested_title}",
  "seo_title": "SEO title here",
  "seo_description": "Meta description here",
  "excerpt": "Blog listing excerpt here",
  "content": "<h2>First Section</h2><p>Content...</p>{{MIDDLE_IMAGE_1}}<h2>Second Section</h2><p>More...</p>",
  "suggested_tags": ["tag1", "tag2", "tag3"]
}`;

        console.log(`Generating article: ${item.suggested_title}`);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

        // Generate slug from title
        const slug = parsedContent.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 80);

        // Calculate read time
        const textContent = parsedContent.content.replace(/<[^>]*>/g, ' ').trim();
        const words = textContent.split(/\s+/).filter(Boolean).length;
        const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

        // Create blog post
        const { data: blogPost, error: postError } = await supabaseAdmin
          .from('blog_posts')
          .insert({
            title: parsedContent.title,
            slug: slug,
            content: parsedContent.content,
            excerpt: parsedContent.excerpt,
            meta_title: parsedContent.seo_title,
            meta_description: parsedContent.seo_description,
            category: plan.category_id.charAt(0).toUpperCase() + plan.category_id.slice(1),
            category_slug: plan.category_id,
            tags: parsedContent.suggested_tags?.slice(0, 3) || [],
            read_time: readTime,
            status: 'draft',
            related_templates: [plan.template_slug],
            content_plan_id: item.plan_id,
            article_type: item.article_type,
          })
          .select()
          .single();

        if (postError) {
          throw new Error(`Failed to create blog post: ${postError.message}`);
        }

        // Update queue item
        await supabaseAdmin
          .from('content_queue')
          .update({ 
            status: 'generated',
            blog_post_id: blogPost.id,
            generated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        results.push({ queueId: item.id, success: true, blogPostId: blogPost.id });
        console.log(`Successfully generated: ${blogPost.title}`);

        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to generate article for queue item ${item.id}:`, error);
        
        await supabaseAdmin
          .from('content_queue')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', item.id);

        results.push({ 
          queueId: item.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-generate-articles:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
