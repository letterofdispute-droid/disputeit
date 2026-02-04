import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SITE_CONFIG, CATEGORIES, WRITING_STYLE_GUIDELINES } from "../_shared/siteContext.ts";
import { validateContent, getViolationSummary } from "../_shared/contentValidator.ts";

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

// Map template categories to blog categories
const CATEGORY_MAP: Record<string, { slug: string; name: string }> = {
  'refunds': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'damaged-goods': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'ecommerce': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'housing': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'hoa': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'contractors': { slug: 'contractors', name: 'Contractors' },
  'financial': { slug: 'legal-tips', name: 'Legal Tips' },
  'insurance': { slug: 'legal-tips', name: 'Legal Tips' },
  'employment': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'travel': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'vehicle': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'utilities': { slug: 'complaint-guides', name: 'Complaint Guides' },
  'healthcare': { slug: 'consumer-rights', name: 'Consumer Rights' },
};

function mapToBlogCategory(templateCategory: string): { slug: string; name: string } {
  return CATEGORY_MAP[templateCategory] || { slug: 'consumer-rights', name: 'Consumer Rights' };
}

// Build category context for the AI
const CATEGORY_CONTEXT = CATEGORIES.map(c => `- ${c.name}: ${c.description}`).join('\n');

// Generate SEO-friendly alt text for an image
function generateAltText(searchQuery: string, articleTitle: string): string {
  const cleanTitle = articleTitle.replace(/['"]/g, '').substring(0, 60);
  return `${cleanTitle} - ${searchQuery}`.substring(0, 125);
}

// Extract visual keywords from article title/category using AI
async function extractVisualKeywords(
  apiKey: string,
  title: string,
  category: string
): Promise<string> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `Extract 3-4 visual keywords for a stock photo search.
Focus on photographable scenes: people, objects, settings.

Examples:
- "How to Write a Credit Card Dispute Letter" → "person typing letter computer frustrated"
- "Landlord Repair Complaint Guide" → "broken appliance apartment maintenance worker"
- "Insurance Claim Denial Appeal" → "person phone documents stressed paperwork"
- "Product Refund Request Tips" → "customer service desk returning package"

Return ONLY keywords, no punctuation, no explanation.`
          },
          {
            role: 'user',
            content: `Article: "${title}" (Category: ${category})`
          }
        ],
        temperature: 0.3,
        max_tokens: 30,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const keywords = data.choices[0]?.message?.content?.trim();
      if (keywords) {
        console.log(`Extracted visual keywords for "${title}": ${keywords}`);
        return keywords;
      }
    }
  } catch (e) {
    console.log('Visual keyword extraction failed, using title:', e);
  }
  return title;
}

// Use AI vision to analyze candidate images and pick the best one for the topic
async function selectBestImageWithVision(
  apiKey: string,
  candidates: Array<{ url: string; largeUrl: string; tags: string; id: number }>,
  articleTitle: string,
  category: string
): Promise<{ url: string; id: number } | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return { url: candidates[0].largeUrl, id: candidates[0].id };

  try {
    // Prepare image descriptions for the vision model
    const imageDescriptions = candidates.map((c, i) => 
      `Image ${i + 1}: Tags: ${c.tags}`
    ).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an image selector for a consumer rights blog. 
Pick the BEST image for an article's featured image.

Consider:
1. Relevance to the article topic
2. Professional appearance suitable for a blog header
3. Human elements (people in relevant situations are engaging)
4. Avoid generic/abstract images when specific ones are available

Respond with ONLY the image number (1, 2, 3, etc.) - nothing else.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Article: "${articleTitle}" (Category: ${category})\n\nCandidate images:\n${imageDescriptions}\n\nWhich image number is best for this article's featured image?`
              },
              ...candidates.slice(0, 5).map(c => ({
                type: 'image_url',
                image_url: { url: c.url }
              }))
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const choice = data.choices[0]?.message?.content?.trim();
      const imageIndex = parseInt(choice, 10) - 1;
      
      if (!isNaN(imageIndex) && imageIndex >= 0 && imageIndex < candidates.length) {
        console.log(`Vision AI selected image ${imageIndex + 1} for "${articleTitle}"`);
        return { url: candidates[imageIndex].largeUrl, id: candidates[imageIndex].id };
      }
    }
  } catch (e) {
    console.log('Vision analysis failed, using first candidate:', e);
  }
  
  // Fallback to first candidate
  return { url: candidates[0].largeUrl, id: candidates[0].id };
}

// Fetch image from Pixabay with vision analysis for featured images
async function fetchAndUploadFeaturedImage(
  supabase: SupabaseClient,
  apiKey: string,
  searchQuery: string,
  storagePath: string,
  articleTitle: string,
  category: string
): Promise<{ url: string | null; altText: string | null }> {
  try {
    const pixabayKey = Deno.env.get('PIXABAY_API_KEY');
    if (!pixabayKey) {
      console.log('PIXABAY_API_KEY not configured, skipping image');
      return { url: null, altText: null };
    }

    // Clean and prepare search query
    const cleanQuery = searchQuery
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 4)
      .join(' ');

    // Search Pixabay for multiple candidates
    const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true`;
    
    console.log(`Searching Pixabay for featured image: "${cleanQuery}"`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.hits?.length) {
      console.log(`No Pixabay results for: "${cleanQuery}"`);
      return { url: null, altText: null };
    }

    // Prepare candidates for vision analysis
    const candidates = data.hits.slice(0, 5).map((hit: any) => ({
      url: hit.webformatURL, // Use smaller thumbnail for vision analysis
      largeUrl: hit.largeImageURL,
      tags: hit.tags,
      id: hit.id
    }));

    // Use vision AI to pick the best image
    const selected = await selectBestImageWithVision(
      apiKey,
      candidates,
      articleTitle,
      category
    );

    if (!selected) {
      return { url: null, altText: null };
    }

    console.log(`Vision selected Pixabay image: ${selected.id}`);
    
    // Download the selected image
    const imageResponse = await fetch(selected.url);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return { url: null, altText: null };
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}.jpg`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`Upload error: ${uploadError.message}`);
      return { url: null, altText: null };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.jpg`);
    
    const altText = generateAltText(cleanQuery, articleTitle);
    
    console.log(`Uploaded featured image to: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, altText };
  } catch (error) {
    console.error('Error fetching/uploading featured image:', error);
    return { url: null, altText: null };
  }
}

// Fetch image from Pixabay, download, and upload to Supabase storage (for middle images - no vision)
async function fetchAndUploadImage(
  supabase: SupabaseClient,
  searchQuery: string,
  storagePath: string,
  articleTitle: string
): Promise<{ url: string | null; altText: string | null }> {
  try {
    const pixabayKey = Deno.env.get('PIXABAY_API_KEY');
    if (!pixabayKey) {
      console.log('PIXABAY_API_KEY not configured, skipping image');
      return { url: null, altText: null };
    }

    // Clean and prepare search query
    const cleanQuery = searchQuery
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 4)
      .join(' ');

    // Search Pixabay with random offset for variety
    const randomOffset = Math.floor(Math.random() * 20);
    const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&per_page=30&safesearch=true`;
    
    console.log(`Searching Pixabay for: "${cleanQuery}"`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.hits?.length) {
      console.log(`No Pixabay results for: "${cleanQuery}"`);
      return { url: null, altText: null };
    }
    
    // Pick random image from results for variety
    const randomIndex = Math.min(randomOffset, data.hits.length - 1);
    const hit = data.hits[randomIndex];
    
    console.log(`Selected Pixabay image: ${hit.id}`);
    
    // Download the image
    const imageResponse = await fetch(hit.largeImageURL);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return { url: null, altText: null };
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}.jpg`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`Upload error: ${uploadError.message}`);
      return { url: null, altText: null };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.jpg`);
    
    const altText = generateAltText(cleanQuery, articleTitle);
    
    console.log(`Uploaded image to: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, altText };
  } catch (error) {
    console.error('Error fetching/uploading image:', error);
    return { url: null, altText: null };
  }
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
    
    // Use service role for database and storage operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claims?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const userId = claims.user.id;
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
        
        // Map to blog category
        const blogCategory = mapToBlogCategory(plan.category_id);
        
        // Randomly decide on 1 or 2 middle images
        const useTwoMiddleImages = Math.random() < 0.5;
        const middleImageInstructions = useTwoMiddleImages
          ? `7. Include TWO image placeholders:
   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 33% through the content
   - Insert {{MIDDLE_IMAGE_2}} on its own line at approximately 66% through the content`
          : `7. Include ONE image placeholder:
   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 45% through the content`;
        
        const systemPrompt = `You are an expert SEO content writer for Letter Of Dispute (${SITE_CONFIG.url}), 
a US platform specializing in consumer rights, dispute resolution, and complaint letters.

${WRITING_STYLE_GUIDELINES}

ABOUT LETTER OF DISPUTE:
We provide ${SITE_CONFIG.templateCount} professionally written dispute letter templates across ${SITE_CONFIG.categoryCount} categories:
${CATEGORY_CONTEXT}

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON - no markdown, no code blocks
2. The "content" field must contain semantic HTML (NOT markdown)
3. Use these HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>
4. NEVER use <h1> tags
5. NEVER include "Conclusion", "FAQ", "TL;DR" sections
6. Use American English spelling throughout
${middleImageInstructions}

CONTENT REQUIREMENTS:
- Write approximately ${wordCount} words
- ${toneInstruction}
- Naturally incorporate the provided keywords 2-3+ times each
- Write for US readers seeking help with disputes and complaints
- Include actionable advice and practical steps
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

        // Validate content for AI-typical phrases
        const validationResult = validateContent(parsedContent.content);
        console.log(`Content validation for "${item.suggested_title}":`, getViolationSummary(validationResult));

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

        // === AUTO-FETCH IMAGES WITH AI VISION FOR FEATURED IMAGE ===
        console.log(`Fetching images for: ${parsedContent.title}`);
        
        // 1. Featured image - use AI vision analysis to pick the best one
        const featuredSearchTerm = await extractVisualKeywords(
          apiKey,
          parsedContent.title,
          plan.category_id
        );
        const { url: featuredImageUrl } = await fetchAndUploadFeaturedImage(
          supabaseAdmin,
          apiKey,
          featuredSearchTerm,
          `articles/${slug}-featured`,
          parsedContent.title,
          plan.category_id
        );

        // 2. Check for middle image placeholders and fetch if needed
        const hasMiddleImage1 = parsedContent.content.includes('{{MIDDLE_IMAGE_1}}');
        const hasMiddleImage2 = parsedContent.content.includes('{{MIDDLE_IMAGE_2}}');

        let middleImage1Url: string | null = null;
        let middleImage2Url: string | null = null;

        if (hasMiddleImage1) {
          // Use AI to extract visual keywords for middle image
          const middleSearchTerm1 = await extractVisualKeywords(
            apiKey,
            `${item.suggested_keywords?.[0] || plan.template_name} consumer help`,
            plan.category_id
          );
          const { url } = await fetchAndUploadImage(
            supabaseAdmin,
            middleSearchTerm1,
            `articles/${slug}-middle1`,
            parsedContent.title
          );
          middleImage1Url = url;
        }

        if (hasMiddleImage2) {
          // Use different keywords for second middle image
          const middleSearchTerm2 = await extractVisualKeywords(
            apiKey,
            `${item.suggested_keywords?.[1] || 'dispute resolution'} advice`,
            plan.category_id
          );
          const { url } = await fetchAndUploadImage(
            supabaseAdmin,
            middleSearchTerm2,
            `articles/${slug}-middle2`,
            parsedContent.title
          );
          middleImage2Url = url;
        }

        // Create blog post with images and correct blog category
        const { data: blogPost, error: postError } = await supabaseAdmin
          .from('blog_posts')
          .insert({
            title: parsedContent.title,
            slug: slug,
            content: parsedContent.content,
            excerpt: parsedContent.excerpt,
            meta_title: parsedContent.seo_title,
            meta_description: parsedContent.seo_description,
            category: blogCategory.name,
            category_slug: blogCategory.slug,
            tags: parsedContent.suggested_tags?.slice(0, 3) || [],
            read_time: readTime,
            status: 'draft',
            featured_image_url: featuredImageUrl,
            middle_image_1_url: middleImage1Url,
            middle_image_2_url: middleImage2Url,
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
        console.log(`Successfully generated: ${blogPost.title} (with ${featuredImageUrl ? 'featured' : 'no featured'} image)`);

        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));

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
