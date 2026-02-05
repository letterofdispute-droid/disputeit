import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SITE_CONFIG, CATEGORIES, WRITING_STYLE_GUIDELINES } from "../_shared/siteContext.ts";
import { validateContent, getViolationSummary, validateTitle, BANNED_TITLE_STARTERS } from "../_shared/contentValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Style variants for image diversity
const STYLE_VARIANTS = ['warm', 'cool', 'neutral', 'dramatic'] as const;
type StyleVariant = typeof STYLE_VARIANTS[number];

const STYLE_GUIDES: Record<StyleVariant, string> = {
  warm: 'warm golden lighting, earthy tones, inviting atmosphere, sunset colors',
  cool: 'cool blue tones, modern clean aesthetic, crisp lighting, professional',
  neutral: 'balanced natural colors, soft daylight, professional office setting',
  dramatic: 'high contrast, dynamic shadows, bold composition, striking visuals'
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

// ============================================
// STRUCTURED LOGGING HELPER
// ============================================

function logStep(title: string, step: string, message: string, data?: any) {
  const shortTitle = title.substring(0, 40);
  const logLine = `[ARTICLE:${shortTitle}] [${step}] ${message}`;
  if (data) {
    console.log(logLine, JSON.stringify(data).substring(0, 200));
  } else {
    console.log(logLine);
  }
}

// ============================================
// UNIQUE SLUG GENERATION (Collision Handling)
// ============================================

// INSERT with retry for slug collisions (atomic approach - no TOCTOU race condition)
async function insertBlogPostWithRetry(
  supabase: SupabaseClient,
  postData: any,
  maxRetries = 5
): Promise<{ data: any; error: any }> {
  let slug = postData.slug;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ ...postData, slug })
      .select()
      .single();
    
    if (!error) {
      console.log(`[SLUG_INSERT] Success with slug: ${slug}${attempt > 0 ? ` (attempt ${attempt})` : ''}`);
      return { data, error: null };
    }
    
    // Check if it's a slug collision (unique constraint violation)
    if (error.code === '23505' && error.message.includes('slug')) {
      attempt++;
      slug = `${postData.slug}-${attempt}`;
      console.log(`[SLUG_RETRY] Collision detected, trying: ${slug}`);
      continue;
    }
    
    // Other error - return immediately
    return { data: null, error };
  }
  
  // Final fallback with timestamp
  const finalSlug = `${postData.slug}-${Date.now()}`;
  console.log(`[SLUG_RETRY] Max attempts reached, using timestamp: ${finalSlug}`);
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({ ...postData, slug: finalSlug })
    .select()
    .single();
  
  return { data, error };
}

// ============================================
// JSON PARSING HELPERS (Bulletproof AI response handling)
// ============================================

function sanitizeJsonString(raw: string): string {
  // Step 1: Remove markdown code blocks
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  
  // Step 2: Fix trailing commas (common AI mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  return cleaned;
}

// State-machine approach for proper escape handling
function fixControlCharacters(json: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const code = char.charCodeAt(0);
    
    // If previous char was backslash, this is an escape sequence - pass through
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    // Backslash starts an escape sequence
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    // Toggle string state on unescaped quotes
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    // Only escape control characters INSIDE strings
    if (inString) {
      if (code === 0x0A) { result += '\\n'; continue; } // Raw newline
      if (code === 0x0D) { result += '\\r'; continue; } // Carriage return
      if (code === 0x09) { result += '\\t'; continue; } // Tab
      if (code < 0x20) { continue; } // Strip other control chars
    }
    
    result += char;
  }
  
  return result;
}

// Fix unescaped quotes inside HTML content (AI sometimes outputs "quoted words" instead of \"quoted words\")
function fixHtmlQuotes(json: string): string {
  // This is a targeted fix for the content field specifically
  // We need to be careful not to break valid JSON structure
  try {
    // Find content field and fix internal unescaped quotes
    // Pattern: "content": "...<html with unescaped quotes>..."
    return json.replace(
      /("content"\s*:\s*")([^]*?)("(?:\s*[,}]))/g,
      (match, prefix, content, suffix) => {
        // Check if content has potential HTML with unescaped quotes
        // Only fix quotes that appear to be inside HTML attributes or text
        if (!content.includes('<')) {
          return match; // Not HTML, don't modify
        }
        
        // Escape quotes that aren't already escaped
        // This regex matches " that isn't preceded by \
        const fixed = content.replace(/(?<!\\)"/g, (q: string, offset: number, str: string) => {
          // Don't escape if it looks like a string delimiter
          // Check if this quote could be ending the JSON string
          const beforeQuote = str.substring(Math.max(0, offset - 5), offset);
          if (beforeQuote.match(/[}\]]\s*$/)) {
            return q; // Likely a real JSON delimiter
          }
          return '\\"';
        });
        
        return prefix + fixed + suffix;
      }
    );
  } catch (e) {
    console.log('[JSON_FIX] fixHtmlQuotes failed, returning original');
    return json;
  }
}

function parseAIResponse(content: string): any {
  if (!content) {
    throw new Error('Empty AI response');
  }
  
  console.log('[JSON_PARSE] Response length:', content.length);
  console.log('[JSON_PARSE] Preview:', content.substring(0, 300));
  
  // Step 1: Remove markdown code blocks and fix trailing commas
  let sanitized = sanitizeJsonString(content);
  
  // Step 2: Try direct parse first (most responses are valid)
  try {
    const result = JSON.parse(sanitized);
    console.log('[JSON_PARSE] Direct parse succeeded');
    return result;
  } catch (firstError) {
    console.log('[JSON_PARSE] Attempt 1 failed:', (firstError as Error).message);
    
    // Step 3: Try extracting JSON object
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[JSON_PARSE] No JSON object found in response');
      throw new Error('No JSON object found in AI response');
    }
    
    let extracted = jsonMatch[0];
    console.log('[JSON_PARSE] Extracted JSON length:', extracted.length);
    
    // Step 4: Apply state-machine control character fix
    let fixedStr = fixControlCharacters(extracted);
    
    try {
      const result = JSON.parse(fixedStr);
      console.log('[JSON_PARSE] Attempt 2 succeeded (after state-machine fix)');
      return result;
    } catch (secondError) {
      console.log('[JSON_PARSE] Attempt 2 failed:', (secondError as Error).message);
      
      // Step 5: Try fixing HTML quotes
      fixedStr = fixHtmlQuotes(fixedStr);
      
      try {
        const result = JSON.parse(fixedStr);
        console.log('[JSON_PARSE] Attempt 3 succeeded (after HTML quote fix)');
        return result;
      } catch (thirdError) {
        console.log('[JSON_PARSE] Attempt 3 failed:', (thirdError as Error).message);
        
        // Step 6: Last resort - fix common JSON syntax issues
        fixedStr = fixedStr
          .replace(/,\s*([\]}])/g, '$1')           // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
          .replace(/:\s*'([^']*)'/g, ':"$1"');     // Single to double quotes
        
        try {
          const result = JSON.parse(fixedStr);
          console.log('[JSON_PARSE] Attempt 4 succeeded (after syntax fix)');
          return result;
        } catch (fourthError) {
          console.error('[JSON_PARSE] All attempts failed');
          console.error('[JSON_PARSE] Error position hint:', (firstError as Error).message);
          console.error('[JSON_PARSE] Content around error:', fixedStr.substring(0, 500));
          throw new Error(`Failed to parse AI response: ${(firstError as Error).message}`);
        }
      }
  }
}

// ============================================
// KEYWORD VALIDATION & REMEDIATION
// ============================================

function validateKeywordUsage(content: string, keywords: string[]): {
  found: string[];
  missing: string[];
  coverage: number;
} {
  if (!keywords || keywords.length === 0) {
    return { found: [], missing: [], coverage: 100 };
  }
  
  const lowerContent = content.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    // Check for whole word or phrase match
    if (lowerContent.includes(keywordLower)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  }
  
  return {
    found,
    missing,
    coverage: keywords.length > 0 ? (found.length / keywords.length) * 100 : 100
  };
}

async function remediateKeywords(
  apiKey: string,
  existingContent: string,
  missingKeywords: string[],
  articleTitle: string
): Promise<string> {
  console.log(`Remediating content to add ${missingKeywords.length} missing keywords: ${missingKeywords.join(', ')}`);
  
  const prompt = `You are editing an existing article to naturally incorporate missing keywords.

ARTICLE TITLE: "${articleTitle}"

MISSING KEYWORDS TO ADD (each must appear at least once): ${missingKeywords.join(', ')}

EXISTING HTML CONTENT:
${existingContent}

INSTRUCTIONS:
1. Naturally weave each missing keyword into the content - they MUST appear in the output
2. You can either modify existing paragraphs or add 1-2 new paragraphs where appropriate
3. Each keyword should appear at least once, preferably 2-3 times
4. Maintain the same tone, style, and HTML structure
5. Keep all existing {{MIDDLE_IMAGE_1}} and {{MIDDLE_IMAGE_2}} placeholders intact
6. Return ONLY the updated HTML content - no explanations, no markdown code blocks
7. Use American English spelling

OUTPUT: Updated HTML content with all keywords integrated`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      console.log('Keyword remediation API call failed, using original content');
      return existingContent;
    }

    const data = await response.json();
    let updatedContent = data.choices[0]?.message?.content || existingContent;
    
    // Clean markdown if present
    if (updatedContent.startsWith('```html')) {
      updatedContent = updatedContent.slice(7);
    } else if (updatedContent.startsWith('```')) {
      updatedContent = updatedContent.slice(3);
    }
    if (updatedContent.endsWith('```')) {
      updatedContent = updatedContent.slice(0, -3);
    }
    
    return updatedContent.trim();
  } catch (error) {
    console.error('Keyword remediation error:', error);
    return existingContent;
  }
}

// ============================================
// IMAGE GENERATION HELPERS
// ============================================

// Generate SEO-optimized alt text using AI
async function generateSEOAltText(
  apiKey: string,
  articleTitle: string,
  imageContext: string
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
            content: `Generate SEO-optimized alt text for a blog image.
Rules:
- 10-15 words maximum
- Describe the likely scene based on the article topic
- Naturally incorporate keywords for SEO
- Be specific and descriptive
- No phrases like "image of" or "photo of"
Example: "Frustrated homeowner reviewing contractor documents at kitchen table"`
          },
          {
            role: 'user',
            content: `Article: "${articleTitle}"\nImage context: ${imageContext}`
          }
        ],
        temperature: 0.5,
        max_tokens: 50,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const altText = data.choices[0]?.message?.content?.trim();
      if (altText) {
        // Clean and truncate alt text
        return altText.replace(/['"]/g, '').substring(0, 125);
      }
    }
  } catch (e) {
    console.log('Alt text generation failed, using title:', e);
  }
  return articleTitle.replace(/['"]/g, '').substring(0, 100);
}

// Generate AI image using Gemini
async function generateAIImage(
  supabase: SupabaseClient,
  apiKey: string,
  title: string,
  context: string,
  storagePath: string,
  styleVariant: StyleVariant
): Promise<{ url: string | null; altText: string | null }> {
  const styleGuide = STYLE_GUIDES[styleVariant];
  
  const imagePrompt = `Generate a REALISTIC PHOTOGRAPH for: "${title}"
Context: ${context}

CRITICAL REQUIREMENTS:
- Must be a REALISTIC PHOTOGRAPH taken with a professional camera
- NOT an illustration, clipart, vector graphic, cartoon, or icon
- Include real people, objects, or environments relevant to the topic
- Professional stock photo quality, 16:9 aspect ratio
- Style: ${styleGuide}
- Suitable for a consumer rights and legal advice website
- No text overlays in the image

Think: What would a professional stock photographer capture for this topic?`;

  try {
    console.log(`Generating AI image for: ${title} (style: ${styleVariant})`);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: imagePrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI image generation failed:', response.status, errorText);
      return { url: null, altText: null };
    }

    const data = await response.json();
    
    // Extract image from response - handle both formats
    const message = data.choices[0]?.message;
    let base64Data: string | null = null;
    
    // Format 1: images array (newer format)
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const imagePart = message.images.find((part: any) => part.type === 'image_url');
      if (imagePart?.image_url?.url) {
        base64Data = imagePart.image_url.url;
      }
    }
    
    // Format 2: content array (older format)
    if (!base64Data && message?.content && Array.isArray(message.content)) {
      const imagePart = message.content.find((part: any) => part.type === 'image_url');
      if (imagePart?.image_url?.url) {
        base64Data = imagePart.image_url.url;
      }
    }

    if (!base64Data) {
      console.error('No image in AI response');
      return { url: null, altText: null };
    }
    
    // Extract the actual base64 data
    const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    let imageBuffer: Uint8Array;
    let imageExtension = 'png';
    
    if (base64Match) {
      imageExtension = base64Match[1];
      const base64String = base64Match[2];
      imageBuffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    } else {
      // Assume raw base64
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}.${imageExtension}`, imageBuffer, {
        contentType: `image/${imageExtension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return { url: null, altText: null };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.${imageExtension}`);

    // Generate SEO alt text
    const altText = await generateSEOAltText(apiKey, title, context);

    console.log(`AI image uploaded: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, altText };
  } catch (error) {
    console.error('Error generating AI image:', error);
    return { url: null, altText: null };
  }
}

// Shuffle and get unique styles for an article's images
function getImageStyles(): { featured: StyleVariant; middle1: StyleVariant; middle2: StyleVariant } {
  const shuffled = [...STYLE_VARIANTS].sort(() => Math.random() - 0.5);
  return {
    featured: shuffled[0],
    middle1: shuffled[1],
    middle2: shuffled[2],
  };
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

// Fetch image from Pixabay as fallback
async function fetchPixabayFallback(
  supabase: SupabaseClient,
  apiKey: string,
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
    
    console.log(`Pixabay fallback for: "${cleanQuery}"`);
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
    
    // Download the selected image
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
    
    // Generate SEO alt text
    const altText = await generateSEOAltText(apiKey, articleTitle, cleanQuery);
    
    console.log(`Pixabay fallback uploaded: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, altText };
  } catch (error) {
    console.error('Error fetching Pixabay fallback:', error);
    return { url: null, altText: null };
  }
}

// ============================================
// MAIN REQUEST HANDLER
// ============================================

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

    // Pre-clean stale generating items (stuck for more than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: staleItems, error: staleError } = await supabaseAdmin
      .from('content_queue')
      .update({ 
        status: 'failed', 
        error_message: 'Previous generation timed out' 
      })
      .eq('status', 'generating')
      .lt('created_at', tenMinutesAgo)
      .select('id');
    
    if (!staleError && staleItems && staleItems.length > 0) {
      console.log(`Cleaned up ${staleItems.length} stale generating items`);
    }

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
      batchSize = 3, // Reduced from 5 to prevent timeouts
      tone = 'expert_professional',
      wordCount: requestedWordCount = 1500,
    } = await req.json() as BulkGenerateRequest;
    
    // ENFORCE MINIMUM 1200 WORDS - this is a hard requirement
    const wordCount = Math.max(requestedWordCount, 1200);

    // Enforce maximum batch size to prevent edge function timeouts
    const maxBatchSize = 3;
    const effectiveBatchSize = Math.min(batchSize, maxBatchSize);

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
      .limit(effectiveBatchSize);

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

    // Fetch existing titles for final validation
    const { data: existingPosts } = await supabaseAdmin
      .from('blog_posts')
      .select('title')
      .limit(500);

    const existingDbTitles = existingPosts?.map(p => p.title) || [];
    console.log(`Loaded ${existingDbTitles.length} existing titles for validation`);

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
        
        // Build keyword instruction with explicit requirement
        const keywordList = item.suggested_keywords?.join(', ') || 'consumer rights, dispute letter';
        const keywordInstruction = item.suggested_keywords && item.suggested_keywords.length > 0
          ? `MANDATORY KEYWORDS - Each of these MUST appear 2-3 times in the article:
${item.suggested_keywords.map((kw: string, i: number) => `   ${i + 1}. "${kw}"`).join('\n')}`
          : `- Naturally incorporate consumer rights and dispute-related terms`;
        
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
- CRITICAL: Write MINIMUM ${wordCount} words. Articles under ${wordCount} words will be rejected.
- This is a LONG-FORM article - include 5-7 substantial sections with detailed explanations
- ${toneInstruction}
${keywordInstruction}
- Write for US readers seeking help with disputes and complaints
- Include actionable advice and practical steps
- Each section should have 150-250 words
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
Keywords: ${keywordList}

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
            max_tokens: 8000,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI Gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        let content = aiData.choices[0]?.message?.content;
        
        // Use robust JSON parsing
        const parsedContent = parseAIResponse(content);

        // === TITLE VALIDATION GATE ===
        // Ensure the AI hasn't drifted back to banned patterns
        const titleValidation = validateTitle(parsedContent.title, existingDbTitles);
        if (!titleValidation.isValid) {
          console.error('Title validation failed:', parsedContent.title, '-', titleValidation.reason);
          // Use the suggested title from queue instead
          console.log('Falling back to suggested title:', item.suggested_title);
          parsedContent.title = item.suggested_title;
        }

        // Validate content for AI-typical phrases
        const validationResult = validateContent(parsedContent.content);
        console.log(`Content validation for "${item.suggested_title}":`, getViolationSummary(validationResult));

        // === KEYWORD VALIDATION & REMEDIATION ===
        const keywordValidation = validateKeywordUsage(
          parsedContent.content,
          item.suggested_keywords || []
        );
        
        console.log(`Keyword coverage: ${keywordValidation.coverage.toFixed(0)}%`);
        if (keywordValidation.found.length > 0) {
          console.log(`Keywords found: ${keywordValidation.found.join(', ')}`);
        }
        if (keywordValidation.missing.length > 0) {
          console.log(`Keywords missing: ${keywordValidation.missing.join(', ')}`);
        }
        
        // If keywords are missing, trigger remediation
        if (keywordValidation.missing.length > 0) {
          console.log(`Triggering keyword remediation for ${keywordValidation.missing.length} missing keywords...`);
          parsedContent.content = await remediateKeywords(
            apiKey,
            parsedContent.content,
            keywordValidation.missing,
            parsedContent.title
          );
          
          // Re-validate after remediation
          const recheckValidation = validateKeywordUsage(parsedContent.content, item.suggested_keywords || []);
          console.log(`After remediation - Coverage: ${recheckValidation.coverage.toFixed(0)}%, Still missing: ${recheckValidation.missing.join(', ') || 'none'}`);
        }

        // Generate base slug from title (collision handling happens at INSERT time)
        logStep(item.suggested_title, 'SLUG', 'Generating base slug');
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
        logStep(item.suggested_title, 'METRICS', `Word count: ${words}, Read time: ${readTime}`);

        // === AI-GENERATED IMAGES WITH STYLE DIVERSITY ===
        logStep(item.suggested_title, 'IMAGE_START', 'Starting image generation');
        const imageStyles = getImageStyles();
        
        // 1. Featured image - AI generation with fallback
        const featuredContext = await extractVisualKeywords(
          apiKey,
          parsedContent.title,
          plan.category_id
        );
        let featuredResult = await generateAIImage(
          supabaseAdmin,
          apiKey,
          parsedContent.title,
          featuredContext,
          `articles/${slug}-featured`,
          imageStyles.featured
        );
        
        // Pixabay fallback if AI generation fails
        if (!featuredResult.url) {
          logStep(item.suggested_title, 'IMAGE_FALLBACK', 'Featured image AI failed, using Pixabay');
          featuredResult = await fetchPixabayFallback(
            supabaseAdmin,
            apiKey,
            featuredContext,
            `articles/${slug}-featured`,
            parsedContent.title
          );
        }
        logStep(item.suggested_title, 'IMAGE_FEATURED', featuredResult.url ? 'Featured image ready' : 'No featured image');

        // 2. Check for middle image placeholders and fetch if needed
        const hasMiddleImage1 = parsedContent.content.includes('{{MIDDLE_IMAGE_1}}');
        const hasMiddleImage2 = parsedContent.content.includes('{{MIDDLE_IMAGE_2}}');

        let middleImage1Result: { url: string | null; altText: string | null } = { url: null, altText: null };
        let middleImage2Result: { url: string | null; altText: string | null } = { url: null, altText: null };

        if (hasMiddleImage1) {
          logStep(item.suggested_title, 'IMAGE_MIDDLE1', 'Generating middle image 1');
          // Wait before generating next image to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const middleContext1 = await extractVisualKeywords(
            apiKey,
            `${item.suggested_keywords?.[0] || plan.template_name} consumer help`,
            plan.category_id
          );
          middleImage1Result = await generateAIImage(
            supabaseAdmin,
            apiKey,
            parsedContent.title,
            middleContext1,
            `articles/${slug}-middle1`,
            imageStyles.middle1
          );
          
          // Pixabay fallback
          if (!middleImage1Result.url) {
            logStep(item.suggested_title, 'IMAGE_FALLBACK', 'Middle image 1 AI failed, using Pixabay');
            middleImage1Result = await fetchPixabayFallback(
              supabaseAdmin,
              apiKey,
              middleContext1,
              `articles/${slug}-middle1`,
              parsedContent.title
            );
          }
        }

        if (hasMiddleImage2) {
          logStep(item.suggested_title, 'IMAGE_MIDDLE2', 'Generating middle image 2');
          // Wait before generating next image to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const middleContext2 = await extractVisualKeywords(
            apiKey,
            `${item.suggested_keywords?.[1] || 'dispute resolution'} advice`,
            plan.category_id
          );
          middleImage2Result = await generateAIImage(
            supabaseAdmin,
            apiKey,
            parsedContent.title,
            middleContext2,
            `articles/${slug}-middle2`,
            imageStyles.middle2
          );
          
          // Pixabay fallback
          if (!middleImage2Result.url) {
            logStep(item.suggested_title, 'IMAGE_FALLBACK', 'Middle image 2 AI failed, using Pixabay');
            middleImage2Result = await fetchPixabayFallback(
              supabaseAdmin,
              apiKey,
              middleContext2,
              `articles/${slug}-middle2`,
              parsedContent.title
            );
          }
        }

        // Create blog post with images and correct blog category (with slug collision retry)
        logStep(item.suggested_title, 'DB_INSERT', 'Inserting blog post with retry', { slug, category: blogCategory.slug });
        const { data: blogPost, error: postError } = await insertBlogPostWithRetry(
          supabaseAdmin,
          {
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
            featured_image_url: featuredResult.url,
            featured_image_alt: featuredResult.altText,
            middle_image_1_url: middleImage1Result.url,
            middle_image_1_alt: middleImage1Result.altText,
            middle_image_2_url: middleImage2Result.url,
            middle_image_2_alt: middleImage2Result.altText,
            related_templates: [plan.template_slug],
            content_plan_id: item.plan_id,
            article_type: item.article_type,
          }
        );

        if (postError) {
          logStep(item.suggested_title, 'DB_ERROR', postError.message, { code: postError.code, slug });
          throw new Error(`Failed to create blog post: ${postError.message}`);
        }

        // Update queue item
        logStep(item.suggested_title, 'QUEUE_UPDATE', 'Marking queue item as generated');
        await supabaseAdmin
          .from('content_queue')
          .update({ 
            status: 'generated',
            blog_post_id: blogPost.id,
            generated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        results.push({ queueId: item.id, success: true, blogPostId: blogPost.id });
        logStep(item.suggested_title, 'SUCCESS', 'Article created successfully', { blogPostId: blogPost.id, slug });

        // Add newly created title to existing titles list to prevent duplicates in same batch
        existingDbTitles.push(blogPost.title);

        // Longer delay between articles for sequential processing
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logStep(item.suggested_title, 'ERROR', errorMsg);
        console.error(`[ARTICLE:${item.suggested_title.substring(0, 40)}] Full error:`, error);
        
        await supabaseAdmin
          .from('content_queue')
          .update({ 
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', item.id);

        results.push({ 
          queueId: item.id, 
          success: false, 
          error: errorMsg 
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
