import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SITE_CONFIG, CATEGORIES, WRITING_STYLE_GUIDELINES } from "../_shared/siteContext.ts";
import { validateContent, getViolationSummary, validateTitle, BANNED_TITLE_STARTERS } from "../_shared/contentValidator.ts";
import { generateImageWithGoogle, imageResultToBuffer, isGoogleImageError, shouldBailOut } from "../_shared/googleImageGen.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

// Article types that benefit from infographics instead of photos
const INFOGRAPHIC_ARTICLE_TYPES = ['comparison', 'checklist', 'how-to', 'mistakes', 'rights'] as const;

interface BulkGenerateRequest {
  planId?: string;
  categoryId?: string;
  queueItemIds?: string[];
  batchSize?: number;
  tone?: string;
  wordCount?: number;
  // New: server-side job support
  jobId?: string;
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

// Author personas for random assignment
const AUTHOR_PERSONAS: Array<{ name: string; specialties: string[] }> = [
  { name: 'Rachel Simmons', specialties: ['vehicle', 'damaged-goods'] },
  { name: 'Dana Whitfield', specialties: ['refunds', 'ecommerce', 'damaged-goods'] },
  { name: 'Keisha Morgan', specialties: ['insurance', 'healthcare', 'financial'] },
  { name: 'Tanya Reeves', specialties: ['damaged-goods', 'housing', 'insurance'] },
  { name: 'Jill Kowalski', specialties: ['housing', 'hoa'] },
  { name: 'Monica Alvarez', specialties: ['refunds', 'ecommerce', 'utilities'] },
  { name: 'Brianna Cole', specialties: ['financial', 'ecommerce'] },
  { name: 'Stephanie Novak', specialties: ['travel'] },
  { name: 'Marcus Jennings', specialties: ['contractors'] },
  { name: 'Tyler Brooks', specialties: ['employment'] },
  { name: 'Derek Lawson', specialties: ['financial'] },
  { name: 'Brian Castellano', specialties: ['contractors', 'housing'] },
  { name: 'Jason Okafor', specialties: ['ecommerce', 'refunds'] },
  { name: 'Kevin Marsh', specialties: ['insurance', 'housing'] },
  { name: 'Ryan Gallagher', specialties: ['hoa', 'housing'] },
  { name: 'Andre Washington', specialties: ['utilities', 'financial'] },
];

function getAuthorForCategory(categoryId: string): string {
  const matching = AUTHOR_PERSONAS.filter(a => a.specialties.includes(categoryId));
  if (matching.length > 0) {
    return matching[Math.floor(Math.random() * matching.length)].name;
  }
  return AUTHOR_PERSONAS[Math.floor(Math.random() * AUTHOR_PERSONAS.length)].name;
}

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
    
    if (error.code === '23505' && error.message.includes('slug')) {
      attempt++;
      slug = `${postData.slug}-${attempt}`;
      console.log(`[SLUG_RETRY] Collision detected, trying: ${slug}`);
      continue;
    }
    
    return { data: null, error };
  }
  
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
// JSON PARSING HELPERS
// ============================================

function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  return cleaned;
}

function fixControlCharacters(json: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const code = char.charCodeAt(0);
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      if (code === 0x0A) { result += '\\n'; continue; }
      if (code === 0x0D) { result += '\\r'; continue; }
      if (code === 0x09) { result += '\\t'; continue; }
      if (code < 0x20) { continue; }
    }
    
    result += char;
  }
  
  return result;
}

function fixHtmlQuotes(json: string): string {
  try {
    return json.replace(
      /("content"\s*:\s*")([^]*?)("(?:\s*[,}]))/g,
      (match, prefix, content, suffix) => {
        if (!content.includes('<')) {
          return match;
        }
        const fixed = content.replace(/(?<!\\)"/g, (q: string, offset: number, str: string) => {
          const beforeQuote = str.substring(Math.max(0, offset - 5), offset);
          if (beforeQuote.match(/[}\]]\s*$/)) {
            return q;
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
  
  let sanitized = sanitizeJsonString(content);
  
  try {
    const result = JSON.parse(sanitized);
    console.log('[JSON_PARSE] Direct parse succeeded');
    return result;
  } catch (firstError) {
    console.log('[JSON_PARSE] Attempt 1 failed:', (firstError as Error).message);
    
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[JSON_PARSE] No JSON object found in response');
      throw new Error('No JSON object found in AI response');
    }
    
    let extracted = jsonMatch[0];
    console.log('[JSON_PARSE] Extracted JSON length:', extracted.length);
    
    let fixedStr = fixControlCharacters(extracted);
    
    try {
      const result = JSON.parse(fixedStr);
      console.log('[JSON_PARSE] Attempt 2 succeeded (after state-machine fix)');
      return result;
    } catch (secondError) {
      console.log('[JSON_PARSE] Attempt 2 failed:', (secondError as Error).message);
      
      fixedStr = fixHtmlQuotes(fixedStr);
      
      try {
        const result = JSON.parse(fixedStr);
        console.log('[JSON_PARSE] Attempt 3 succeeded (after HTML quote fix)');
        return result;
      } catch (thirdError) {
        console.log('[JSON_PARSE] Attempt 3 failed:', (thirdError as Error).message);
        
        fixedStr = fixedStr
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
          .replace(/:\s*'([^']*)'/g, ':"$1"');
        
        try {
          const result = JSON.parse(fixedStr);
          console.log('[JSON_PARSE] Attempt 4 succeeded (after syntax fix)');
          return result;
        } catch (fourthError) {
          console.error('[JSON_PARSE] All attempts failed');
          throw new Error(`Failed to parse AI response: ${(firstError as Error).message}`);
        }
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
        return altText.replace(/['"]/g, '').substring(0, 125);
      }
    }
  } catch (e) {
    console.log('Alt text generation failed, using title:', e);
  }
  return articleTitle.replace(/['"]/g, '').substring(0, 100);
}

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
    
    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      return { url: null, altText: null };
    }

    const result = await generateImageWithGoogle(imagePrompt, geminiKey);
    const { buffer, extension } = imageResultToBuffer(result);

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}.${extension}`, buffer, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return { url: null, altText: null };
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.${extension}`);

    const altText = await generateSEOAltText(apiKey, title, context);

    console.log(`AI image uploaded: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, altText };
  } catch (error) {
    if (isGoogleImageError(error)) {
      console.error(`AI image error (${error.category}): ${error.message}`);
      throw error;
    }
    console.error('Error generating AI image:', error);
    return { url: null, altText: null };
  }
}

function getImageStyles(): { featured: StyleVariant; middle1: StyleVariant; middle2: StyleVariant } {
  const shuffled = [...STYLE_VARIANTS].sort(() => Math.random() - 0.5);
  return {
    featured: shuffled[0],
    middle1: shuffled[1],
    middle2: shuffled[2],
  };
}

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

    const cleanQuery = searchQuery
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 4)
      .join(' ');

    const randomOffset = Math.floor(Math.random() * 20);
    const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&per_page=30&safesearch=true`;
    
    console.log(`Pixabay fallback for: "${cleanQuery}"`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.hits?.length) {
      console.log(`No Pixabay results for: "${cleanQuery}"`);
      return { url: null, altText: null };
    }
    
    const randomIndex = Math.min(randomOffset, data.hits.length - 1);
    const hit = data.hits[randomIndex];
    
    console.log(`Selected Pixabay image: ${hit.id}`);
    
    const imageResponse = await fetch(hit.largeImageURL);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return { url: null, altText: null };
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
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
    
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.jpg`);
    
    const altText = await generateSEOAltText(apiKey, articleTitle, cleanQuery);
    
    console.log(`Pixabay fallback uploaded: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, altText };
  } catch (error) {
    console.error('Error fetching Pixabay fallback:', error);
    return { url: null, altText: null };
  }
}

async function generateInfographic(
  supabase: SupabaseClient,
  apiKey: string,
  title: string,
  articleType: string,
  content: string,
  storagePath: string
): Promise<{ url: string | null; altText: string | null; isInfographic: boolean }> {
  try {
    console.log(`[INFOGRAPHIC] Attempting infographic for "${title}" (type: ${articleType})`);
    
    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) {
      console.log('[INFOGRAPHIC] GOOGLE_GEMINI_API_KEY not configured, will fallback to photo');
      return { url: null, altText: null, isInfographic: false };
    }

    const result = await generateImageWithGoogle(
      buildInfographicPrompt(title, articleType, content),
      geminiKey
    );
    const { buffer, extension } = imageResultToBuffer(result);

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`${storagePath}-infographic.${extension}`, buffer, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[INFOGRAPHIC] Upload error:', uploadError.message);
      return { url: null, altText: null, isInfographic: false };
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}-infographic.${extension}`);

    const altText = `Infographic: ${title.substring(0, 80)} - visual guide with key points`;
    console.log(`[INFOGRAPHIC] Success: ${urlData.publicUrl}`);
    
    return { url: urlData.publicUrl, altText: altText.substring(0, 125), isInfographic: true };
  } catch (error) {
    if (isGoogleImageError(error)) {
      console.error(`[INFOGRAPHIC] Error (${error.category}): ${error.message}`);
      throw error;
    }
    console.error('[INFOGRAPHIC] Error:', error);
    return { url: null, altText: null, isInfographic: false };
  }
}

function buildInfographicPrompt(title: string, articleType: string, content: string): string {
  const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
  const items = headers
    .map(h => h.replace(/<[^>]*>/g, '').trim())
    .filter(h => h.length > 5 && h.length < 60 && !h.toLowerCase().includes('conclusion'))
    .slice(0, 6);

  const baseStyle = `
CRITICAL REQUIREMENTS:
- Create a CLEAN, PROFESSIONAL INFOGRAPHIC (NOT a photograph)
- Use MINIMAL text - rely on icons and visual hierarchy
- 16:9 horizontal aspect ratio
- White or light gray background
- Modern, flat design style with subtle gradients
- Use professional colors: blues, teals, and accent colors
- Include a short title at the top
- NO stock photos, NO realistic people, NO photographs
- Vector-style icons and shapes only
- All text must be in English`;

  const itemsList = items.length > 0 ? items.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'Key points from the article';

  switch (articleType) {
    case 'comparison':
      return `Generate a COMPARISON INFOGRAPHIC for: "${title}"\n\nKEY POINTS TO COMPARE:\n${itemsList}\n\nSTYLE: Side-by-side comparison chart, contrasting colors (blue vs orange), "VS" badge in center\n${baseStyle}`;
    case 'checklist':
      return `Generate a VISUAL CHECKLIST INFOGRAPHIC for: "${title}"\n\nCHECKLIST ITEMS:\n${itemsList}\n\nSTYLE: Clean checkbox layout with green checkmarks, numbered items, professional icons\n${baseStyle}`;
    case 'how-to':
      return `Generate a STEP-BY-STEP PROCESS INFOGRAPHIC for: "${title}"\n\nPROCESS STEPS:\n${itemsList}\n\nSTYLE: Horizontal flowchart with arrows between steps, numbered circles, gradient colors\n${baseStyle}`;
    case 'mistakes':
      return `Generate a WARNING INFOGRAPHIC for: "${title}"\n\nMISTAKES TO AVOID:\n${itemsList}\n\nSTYLE: Red X marks for each mistake, warning symbols, red and orange accents, alert theme\n${baseStyle}`;
    case 'rights':
      return `Generate a RIGHTS/LEGAL INFOGRAPHIC for: "${title}"\n\nKEY RIGHTS/POINTS:\n${itemsList}\n\nSTYLE: Shield or gavel icons, blue and gold colors, badges or cards for each right, professional legal aesthetic\n${baseStyle}`;
    default:
      return `Generate a professional infographic for: "${title}"\nKey points: ${itemsList}\n${baseStyle}`;
  }
}

// ============================================
// SINGLE ARTICLE GENERATION (extracted for reuse)
// ============================================

async function generateSingleArticle(
  supabaseAdmin: SupabaseClient,
  apiKey: string,
  item: any,
  tone: string,
  wordCount: number,
  existingDbTitles: string[]
): Promise<{ success: boolean; blogPostId?: string; error?: string; bailReason?: string }> {
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.expert_professional;
  
  try {
    // Mark as generating with started_at timestamp
    await supabaseAdmin
      .from('content_queue')
      .update({ status: 'generating', started_at: new Date().toISOString() })
      .eq('id', item.id);

    const plan = item.content_plans;
    const categoryInfo = CATEGORIES.find(c => c.id === plan.category_id);
    const blogCategory = mapToBlogCategory(plan.category_id);
    
    const useTwoMiddleImages = Math.random() < 0.5;
    const middleImageInstructions = useTwoMiddleImages
      ? `7. Include TWO image placeholders:\n   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 33% through the content\n   - Insert {{MIDDLE_IMAGE_2}} on its own line at approximately 66% through the content`
      : `7. Include ONE image placeholder:\n   - Insert {{MIDDLE_IMAGE_1}} on its own line at approximately 45% through the content`;
    
    const keywordList = item.suggested_keywords?.join(', ') || 'consumer rights, dispute letter';
    const keywordInstruction = item.suggested_keywords && item.suggested_keywords.length > 0
      ? `MANDATORY KEYWORDS - Each of these MUST appear 2-3 times in the article:\n${item.suggested_keywords.map((kw: string, i: number) => `   ${i + 1}. "${kw}"`).join('\n')}`
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
- Where content involves steps, tips, options, or enumerable items, present them as <ul> or <ol> lists instead of dense paragraphs. Lists improve readability and break up text.
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

    // For pillar articles, fetch sibling cluster articles to reference
    let pillarClusterContext = '';
    if (item.article_type === 'pillar' && item.plan_id) {
      const { data: siblingArticles } = await supabaseAdmin
        .from('content_queue')
        .select('suggested_title, suggested_keywords, article_type, blog_post_id')
        .eq('plan_id', item.plan_id)
        .neq('article_type', 'pillar');
      
      if (siblingArticles && siblingArticles.length > 0) {
        const publishedIds = siblingArticles
          .filter(s => s.blog_post_id)
          .map(s => s.blog_post_id!);
        
        let publishedPosts: Array<{ id: string; slug: string; title: string }> = [];
        if (publishedIds.length > 0) {
          const { data: posts } = await supabaseAdmin
            .from('blog_posts')
            .select('id, slug, title')
            .in('id', publishedIds);
          publishedPosts = posts || [];
        }

        pillarClusterContext = `\n\nPILLAR ARTICLE REQUIREMENTS:
This is a PILLAR article - a comprehensive hub page that covers the full topic and links to each cluster article below.
- Write 2,000-3,000 words covering all aspects of "${plan.template_name}"
- Include 6-8 major sections, each naturally referencing one or more cluster articles
- For each cluster article listed below, include a natural inline mention with the title
- The pillar should serve as the definitive resource that ties all these subtopics together

CLUSTER ARTICLES TO REFERENCE (include natural mentions of each):
${siblingArticles.map((s, i) => {
  const published = publishedPosts.find(p => p.id === s.blog_post_id);
  return `${i + 1}. "${s.suggested_title}" (${s.article_type})${published ? ` [slug: ${published.slug}]` : ''}`;
}).join('\n')}`;
      }
    }

    const userPrompt = `Generate a ${item.article_type} article:

Title: "${item.suggested_title}"
Template Context: ${plan.template_name}
Category: ${plan.category_id}
${plan.subcategory_slug ? `Subcategory: ${plan.subcategory_slug}` : ''}
Keywords: ${keywordList}
${pillarClusterContext}

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
      if (aiResponse.status === 402) {
        throw new Error('CREDIT_EXHAUSTED: AI credit balance exhausted. Add credits in workspace settings then retry.');
      }
      if (aiResponse.status === 429) {
        throw new Error('RATE_LIMITED: Rate limit exceeded. Wait a few minutes then retry with a smaller batch size.');
      }
      throw new Error(`AI_ERROR: AI service error (${aiResponse.status}). Please retry later.`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0]?.message?.content;
    
    const parsedContent = parseAIResponse(content);

    // Title validation
    const titleValidation = validateTitle(parsedContent.title, existingDbTitles);
    if (!titleValidation.isValid) {
      console.error('Title validation failed:', parsedContent.title, '-', titleValidation.reason);
      parsedContent.title = item.suggested_title;
    }

    const validationResult = validateContent(parsedContent.content);
    console.log(`Content validation for "${item.suggested_title}":`, getViolationSummary(validationResult));

    // Keyword remediation
    const keywordValidation = validateKeywordUsage(parsedContent.content, item.suggested_keywords || []);
    console.log(`Keyword coverage: ${keywordValidation.coverage.toFixed(0)}%`);
    
    if (keywordValidation.missing.length > 0) {
      console.log(`Triggering keyword remediation for ${keywordValidation.missing.length} missing keywords...`);
      parsedContent.content = await remediateKeywords(apiKey, parsedContent.content, keywordValidation.missing, parsedContent.title);
      const recheckValidation = validateKeywordUsage(parsedContent.content, item.suggested_keywords || []);
      console.log(`After remediation - Coverage: ${recheckValidation.coverage.toFixed(0)}%`);
    }

    // Generate slug
    const slug = parsedContent.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);

    const textContent = parsedContent.content.replace(/<[^>]*>/g, ' ').trim();
    const words = textContent.split(/\s+/).filter(Boolean).length;
    const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

    // === AI-GENERATED IMAGES ===
    const imageStyles = getImageStyles();
    
    const featuredContext = await extractVisualKeywords(apiKey, parsedContent.title, plan.category_id);
    let featuredResult: { url: string | null; altText: string | null } = { url: null, altText: null };
    
    // Try Gemini with retry on 429
    try {
      featuredResult = await generateAIImage(supabaseAdmin, apiKey, parsedContent.title, featuredContext, `articles/${slug}-featured`, imageStyles.featured);
    } catch (imgErr) {
      if (isGoogleImageError(imgErr) && imgErr.category === 'RATE_LIMITED') {
        console.log('[IMAGE_RETRY] Rate limited on featured image, waiting 10s and retrying...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          featuredResult = await generateAIImage(supabaseAdmin, apiKey, parsedContent.title, featuredContext, `articles/${slug}-featured`, imageStyles.featured);
        } catch (retryErr) {
          console.log('[IMAGE_RETRY] Retry also failed, falling back to Pixabay');
        }
      }
    }
    
    if (!featuredResult.url) {
      featuredResult = await fetchPixabayFallback(supabaseAdmin, apiKey, featuredContext, `articles/${slug}-featured`, parsedContent.title);
    }

    const hasMiddleImage1 = parsedContent.content.includes('{{MIDDLE_IMAGE_1}}');
    const hasMiddleImage2 = parsedContent.content.includes('{{MIDDLE_IMAGE_2}}');

    let middleImage1Result: { url: string | null; altText: string | null } = { url: null, altText: null };
    let middleImage2Result: { url: string | null; altText: string | null } = { url: null, altText: null };

    const useInfographic = INFOGRAPHIC_ARTICLE_TYPES.includes(item.article_type as any);
    
    if (hasMiddleImage1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (useInfographic) {
        const infographicResult = await generateInfographic(supabaseAdmin, apiKey, parsedContent.title, item.article_type, parsedContent.content, `articles/${slug}-middle1`);
        if (infographicResult.url) {
          middleImage1Result = { url: infographicResult.url, altText: infographicResult.altText };
        }
      }
      
      if (!middleImage1Result.url) {
        const middleContext1 = await extractVisualKeywords(apiKey, `${item.suggested_keywords?.[0] || plan.template_name} consumer help`, plan.category_id);
        middleImage1Result = await generateAIImage(supabaseAdmin, apiKey, parsedContent.title, middleContext1, `articles/${slug}-middle1`, imageStyles.middle1);
        if (!middleImage1Result.url) {
          middleImage1Result = await fetchPixabayFallback(supabaseAdmin, apiKey, middleContext1, `articles/${slug}-middle1`, parsedContent.title);
        }
      }
    }

    if (hasMiddleImage2) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const middleContext2 = await extractVisualKeywords(apiKey, `${item.suggested_keywords?.[1] || 'dispute resolution'} advice`, plan.category_id);
      middleImage2Result = await generateAIImage(supabaseAdmin, apiKey, parsedContent.title, middleContext2, `articles/${slug}-middle2`, imageStyles.middle2);
      if (!middleImage2Result.url) {
        middleImage2Result = await fetchPixabayFallback(supabaseAdmin, apiKey, middleContext2, `articles/${slug}-middle2`, parsedContent.title);
      }
    }

    // Insert blog post
    const { data: blogPost, error: postError } = await insertBlogPostWithRetry(supabaseAdmin, {
      title: parsedContent.title,
      slug,
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
      author: getAuthorForCategory(plan.category_id),
    });

    if (postError) {
      throw new Error(`Failed to create blog post: ${postError.message}`);
    }

    // Update queue item to generated
    await supabaseAdmin
      .from('content_queue')
      .update({ 
        status: 'generated',
        blog_post_id: blogPost.id,
        generated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    existingDbTitles.push(blogPost.title);
    logStep(item.suggested_title, 'SUCCESS', 'Article created', { blogPostId: blogPost.id });

    return { success: true, blogPostId: blogPost.id };

  } catch (error) {
    const rawErrorMsg = isGoogleImageError(error)
      ? error.message
      : (error instanceof Error ? error.message : 'Unknown error');
    
    // Check if this item was a retry (marked with RETRY_PENDING) — prefix error to prevent infinite retries
    const { data: currentItem } = await supabaseAdmin
      .from('content_queue')
      .select('error_message')
      .eq('id', item.id)
      .single();
    
    const isRetry = currentItem?.error_message === 'RETRY_PENDING';
    const errorMsg = isRetry ? `RETRY_FAILED: ${rawErrorMsg}` : rawErrorMsg;
    
    logStep(item.suggested_title, 'ERROR', errorMsg);
    
    await supabaseAdmin
      .from('content_queue')
      .update({ status: 'failed', error_message: errorMsg })
      .eq('id', item.id);

    // Detect bail-out errors
    if (errorMsg.startsWith('CREDIT_EXHAUSTED:') || errorMsg.startsWith('RATE_LIMITED:')) {
      return { 
        success: false, 
        error: errorMsg, 
        bailReason: errorMsg.startsWith('CREDIT_EXHAUSTED:') ? 'CREDIT_EXHAUSTED' : 'RATE_LIMITED' 
      };
    }

    return { success: false, error: errorMsg };
  }
}

// ============================================
// JOB HELPERS
// ============================================

async function updateJobProgress(
  supabaseAdmin: SupabaseClient,
  jobId: string,
  succeeded: number,
  failed: number,
  bailReason?: string
) {
  const update: any = {
    succeeded_items: succeeded,
    failed_items: failed,
    updated_at: new Date().toISOString(),
  };
  if (bailReason) {
    update.bail_reason = bailReason;
    update.status = 'failed';
    update.completed_at = new Date().toISOString();
  }
  await supabaseAdmin
    .from('generation_jobs')
    .update(update)
    .eq('id', jobId);
}

async function completeJob(
  supabaseAdmin: SupabaseClient,
  jobId: string,
  succeeded: number,
  failed: number
) {
  await supabaseAdmin
    .from('generation_jobs')
    .update({
      status: 'completed',
      succeeded_items: succeeded,
      failed_items: failed,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

// Helper to batch .in() updates to avoid URL-too-long errors
async function batchedInUpdate(
  supabase: SupabaseClient,
  table: string,
  updateData: any,
  ids: string[]
): Promise<void> {
  const CHUNK_SIZE = 100;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).update(updateData).in('id', chunk);
    if (error) throw error;
  }
}

// Helper to batch .in() queries to avoid URL-too-long errors (max ~100 IDs per chunk)
async function batchedInQuery(
  supabase: SupabaseClient,
  table: string,
  selectCols: string,
  ids: string[],
  extraFilters?: (q: any) => any,
  limit?: number
): Promise<any[]> {
  const CHUNK_SIZE = 100;
  const results: any[] = [];
  
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    let query = supabase.from(table).select(selectCols).in('id', chunk);
    if (extraFilters) query = extraFilters(query);
    if (limit && results.length >= limit) break;
    const { data, error } = await query;
    if (error) throw error;
    if (data) results.push(...data);
    if (limit && results.length >= limit) break;
  }
  
  return limit ? results.slice(0, limit) : results;
}

async function selfChainWithRetry(jobId: string): Promise<void> {
  const selfUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bulk-generate-articles`;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({ jobId });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[SELF_CHAIN] Attempt ${attempt} for job ${jobId}`);
      const response = await fetch(selfUrl, { method: 'POST', headers, body });
      if (response.ok) {
        console.log(`[SELF_CHAIN] Attempt ${attempt} succeeded for job ${jobId}`);
        return;
      }
      console.warn(`[SELF_CHAIN] Attempt ${attempt} got ${response.status} for job ${jobId}`);
    } catch (err) {
      console.error(`[SELF_CHAIN] Attempt ${attempt} failed for job ${jobId}:`, err);
    }
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.error(`[SELF_CHAIN] CRITICAL: selfChain failed after 2 attempts for job ${jobId}. pg_cron will auto-recover.`);
}

// ============================================
// MAIN REQUEST HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json() as BulkGenerateRequest;
    const { jobId } = body;

    // ============================================
    // PATH A: CONTINUATION CALL (has jobId)
    // ============================================
    if (jobId) {
      console.log(`[JOB_CONTINUE] Resuming job ${jobId}`);
      
      // Load job
      const { data: job, error: jobError } = await supabaseAdmin
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (jobError || !job) {
        console.error('[JOB_CONTINUE] Job not found:', jobError);
        return new Response(JSON.stringify({ error: 'Job not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if cancelled
      if (job.status === 'cancelled') {
        console.log(`[JOB_CONTINUE] Job ${jobId} was cancelled, stopping`);
        await supabaseAdmin
          .from('generation_jobs')
          .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', jobId);
        return new Response(JSON.stringify({ success: true, message: 'Job cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already completed/failed
      if (job.status !== 'processing') {
        console.log(`[JOB_CONTINUE] Job ${jobId} status is ${job.status}, not processing`);
        return new Response(JSON.stringify({ success: true, message: `Job status: ${job.status}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch next batch of queued items from this job's queue_item_ids (batched to avoid URL length limits)
      let nextItems: any[] | null = null;
      let nextError: any = null;
      try {
        nextItems = await batchedInQuery(
          supabaseAdmin, 'content_queue',
          `*, content_plans!inner(template_slug, template_name, category_id, subcategory_slug)`,
          job.queue_item_ids,
          (q: any) => q.eq('status', 'queued').order('priority', { ascending: false }),
          1
        );
      } catch (e) {
        nextError = e;
      }
      
      if (nextError) {
        console.error('[JOB_CONTINUE] Failed to fetch next items:', nextError);
        await completeJob(supabaseAdmin, jobId, job.succeeded_items, job.failed_items);
        return new Response(JSON.stringify({ error: nextError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // No more items to process
      if (!nextItems || nextItems.length === 0) {
        console.log(`[JOB_CONTINUE] No more queued items for job ${jobId}`);
        
        // Check for retryable failures (one-time retry)
        const failedItems = await batchedInQuery(
          supabaseAdmin, 'content_queue', 'id, error_message',
          job.queue_item_ids,
          (q: any) => q.eq('status', 'failed')
        );
        
        const retryableItems = (failedItems || []).filter(f => 
          f.error_message && 
          !f.error_message.startsWith('CREDIT_EXHAUSTED:') && 
          !f.error_message.startsWith('RATE_LIMITED:') &&
          !f.error_message.startsWith('RETRY_FAILED:')
        );

        if (retryableItems.length > 0 && !job.bail_reason) {
          console.log(`[JOB_RETRY] Found ${retryableItems.length} retryable items, starting retry pass`);
          
          // Reset retryable items to queued, but mark them as retries so failures get RETRY_FAILED: prefix
          const retryIds = retryableItems.map(f => f.id);
          await supabaseAdmin
            .from('content_queue')
            .update({ status: 'queued', error_message: 'RETRY_PENDING' })
            .in('id', retryIds);
          
          // Update job to reflect retry (reduce failed count since we're retrying)
          await supabaseAdmin
            .from('generation_jobs')
            .update({ 
              failed_items: Math.max(0, job.failed_items - retryableItems.length),
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId);
          
          // Self-chain to process retries
          await selfChainWithRetry(jobId);
          
          return new Response(JSON.stringify({ success: true, message: 'Starting retry pass' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // All done - complete the job
        // Re-count actual statuses for accuracy
        const finalItems = await batchedInQuery(
          supabaseAdmin, 'content_queue', 'status',
          job.queue_item_ids
        );
        
        // Guard: if any items are still generating (retry in-flight), self-chain to wait
        const stillGenerating = finalItems.filter(i => i.status === 'generating').length;
        if (stillGenerating > 0) {
          console.log(`[JOB_WAIT] ${stillGenerating} items still generating, self-chaining to wait`);
          await selfChainWithRetry(jobId);
          return new Response(JSON.stringify({ success: true, message: 'Waiting for in-flight items' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const finalSucceeded = finalItems.filter(i => i.status === 'generated').length;
        const finalFailed = finalItems.filter(i => i.status === 'failed').length;
        
        await completeJob(supabaseAdmin, jobId, finalSucceeded, finalFailed);
        console.log(`[JOB_COMPLETE] Job ${jobId} finished: ${finalSucceeded} succeeded, ${finalFailed} failed`);
        
        return new Response(JSON.stringify({ success: true, message: 'Job completed', succeeded: finalSucceeded, failed: finalFailed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Process this batch
      const apiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

      const { data: existingPosts } = await supabaseAdmin
        .from('blog_posts')
        .select('title')
        .limit(500);
      const existingDbTitles = existingPosts?.map(p => p.title) || [];

      let batchSucceeded = 0;
      let batchFailed = 0;
      let bailReason: string | null = null;
      let shouldContinue = true;

      try {
        for (const item of nextItems) {
          const result = await generateSingleArticle(supabaseAdmin, apiKey, item, 'expert_professional', 1500, existingDbTitles);
          
          if (result.success) {
            batchSucceeded++;
          } else {
            batchFailed++;
            if (result.bailReason) {
              bailReason = result.bailReason;
              shouldContinue = false;
              break;
            }
          }
        }
      } catch (unexpectedError) {
        // Catch any unexpected errors (DB timeouts, JSON crashes, etc.)
        console.error(`[JOB_CONTINUE] Unexpected error during batch processing:`, unexpectedError);
        batchFailed++;
        // Mark any items stuck in 'generating' as failed
        for (const item of nextItems) {
          await supabaseAdmin
            .from('content_queue')
            .update({ status: 'failed', error_message: 'Unexpected processing error: ' + (unexpectedError instanceof Error ? unexpectedError.message : 'Unknown') })
            .eq('id', item.id)
            .eq('status', 'generating');
        }
      } finally {
        // Update job progress regardless of success/failure
        const newSucceeded = job.succeeded_items + batchSucceeded;
        const newFailed = job.failed_items + batchFailed;

        if (!shouldContinue && bailReason) {
          // Bail out: mark remaining items as failed
          const remainingItems = await batchedInQuery(
            supabaseAdmin, 'content_queue', 'id',
            job.queue_item_ids,
            (q: any) => q.eq('status', 'queued')
          );
          
          if (remainingItems && remainingItems.length > 0) {
            const skipMsg = bailReason === 'CREDIT_EXHAUSTED'
               ? 'CREDIT_EXHAUSTED: Skipped - AI credits exhausted.'
               : 'RATE_LIMITED: Skipped - rate limit hit.';
             await batchedInUpdate(supabaseAdmin, 'content_queue',
               { status: 'failed', error_message: skipMsg },
               remainingItems.map(r => r.id)
             );
          }

          await updateJobProgress(supabaseAdmin, jobId, newSucceeded, newFailed + (remainingItems?.length || 0), bailReason);
          console.log(`[JOB_BAIL] Job ${jobId} bailed: ${bailReason}`);
        } else {
          // Update progress
          await updateJobProgress(supabaseAdmin, jobId, newSucceeded, newFailed);
          
          // Check if there are more items to process
          const moreItems = await batchedInQuery(
            supabaseAdmin, 'content_queue', 'id',
            job.queue_item_ids,
            (q: any) => q.eq('status', 'queued'),
            1
          );

          if (moreItems && moreItems.length > 0) {
            // Self-chain with retry for next batch
            await selfChainWithRetry(jobId);
          } else {
            // No more items - complete the job
            const finalItems = await batchedInQuery(
              supabaseAdmin, 'content_queue', 'status',
              job.queue_item_ids
            );
            
            // Guard: if any items are still generating (retry in-flight), self-chain to wait
            const stillGenerating = finalItems.filter(i => i.status === 'generating').length;
            if (stillGenerating > 0) {
              console.log(`[JOB_WAIT] ${stillGenerating} items still generating in finally, self-chaining`);
              await selfChainWithRetry(jobId);
            } else {
              const finalSucceeded = finalItems.filter(i => i.status === 'generated').length;
              const finalFailed = finalItems.filter(i => i.status === 'failed').length;
              await completeJob(supabaseAdmin, jobId, finalSucceeded, finalFailed);
              console.log(`[JOB_COMPLETE] Job ${jobId} finished: ${finalSucceeded} succeeded, ${finalFailed} failed`);
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Batch processed`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // PATH B: INITIAL CALL (no jobId)
    // ============================================
    
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

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is service role (continuation) or user token
    const isServiceRole = token === serviceRoleKey;
    
    if (!isServiceRole) {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const userId = claimsData.claims.sub;
      const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: userId });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Pre-clean stale generating items
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: staleItems } = await supabaseAdmin
      .from('content_queue')
      .update({ status: 'failed', error_message: 'Previous generation timed out' })
      .eq('status', 'generating')
      .lt('started_at', tenMinutesAgo)
      .select('id');
    
    if (staleItems && staleItems.length > 0) {
      console.log(`Cleaned up ${staleItems.length} stale generating items`);
    }

    const { 
      planId, 
      categoryId, 
      queueItemIds,
      tone = 'expert_professional',
      wordCount: requestedWordCount = 1500,
    } = body;
    
    const wordCount = Math.max(requestedWordCount, 1200);

    // Build query for ALL queued items matching the request
    let allQueueItems: any[] = [];

    if (queueItemIds && queueItemIds.length > 0) {
      // Use batched query to avoid URL-too-long errors with many IDs
      allQueueItems = await batchedInQuery(
        supabaseAdmin, 'content_queue',
        `*, content_plans!inner(template_slug, template_name, category_id, subcategory_slug)`,
        queueItemIds,
        (q: any) => q.eq('status', 'queued').order('priority', { ascending: false })
      );
    } else {
      let query = supabaseAdmin
        .from('content_queue')
        .select(`*, content_plans!inner(template_slug, template_name, category_id, subcategory_slug)`)
        .eq('status', 'queued')
        .order('priority', { ascending: false });

      if (planId) {
        query = query.eq('plan_id', planId);
      } else if (categoryId) {
        query = query.eq('content_plans.category_id', categoryId);
      }

      query = query.limit(2000);
      const { data, error: queueError } = await query;
      if (queueError) throw new Error(`Failed to fetch queue items: ${queueError.message}`);
      allQueueItems = data || [];
    }

    if (!allQueueItems || allQueueItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No queued items to process',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allIds = allQueueItems.map(i => i.id);
    console.log(`[JOB_START] Creating job for ${allIds.length} items`);

    // Create a generation_jobs row
    const { data: newJob, error: jobCreateError } = await supabaseAdmin
      .from('generation_jobs')
      .insert({
        queue_item_ids: allIds,
        total_items: allIds.length,
        status: 'processing',
      })
      .select()
      .single();

    if (jobCreateError || !newJob) {
      throw new Error(`Failed to create generation job: ${jobCreateError?.message}`);
    }

    console.log(`[JOB_START] Created job ${newJob.id} with ${allIds.length} items`);

    // Process first article (1 per invocation to avoid timeout)
    const firstBatch = allQueueItems.slice(0, 1);
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const { data: existingPosts } = await supabaseAdmin
      .from('blog_posts')
      .select('title')
      .limit(500);
    const existingDbTitles = existingPosts?.map(p => p.title) || [];

    let succeeded = 0;
    let failed = 0;
    let bailReason: string | null = null;

    for (const item of firstBatch) {
      const result = await generateSingleArticle(supabaseAdmin, apiKey, item, tone, wordCount, existingDbTitles);
      
      if (result.success) {
        succeeded++;
      } else {
        failed++;
        if (result.bailReason) {
          bailReason = result.bailReason;
          break;
        }
      }
    }

    // Update job progress
    if (bailReason) {
      // Mark remaining as failed
      const processedIds = firstBatch.map(i => i.id);
      const remainingIds = allIds.filter(id => !processedIds.includes(id));
      
      if (remainingIds.length > 0) {
        const skipMsg = bailReason === 'CREDIT_EXHAUSTED'
           ? 'CREDIT_EXHAUSTED: Skipped - AI credits exhausted.'
           : 'RATE_LIMITED: Skipped - rate limit hit.';
        await batchedInUpdate(supabaseAdmin, 'content_queue',
          { status: 'failed', error_message: skipMsg },
          remainingIds
        );
      }
      
      await updateJobProgress(supabaseAdmin, newJob.id, succeeded, failed + remainingIds.length, bailReason);
    } else {
      await updateJobProgress(supabaseAdmin, newJob.id, succeeded, failed);
      
      // Self-chain if there are more items
      if (allIds.length > 1) {
        await selfChainWithRetry(newJob.id);
      } else {
        // Small job - complete immediately
        await completeJob(supabaseAdmin, newJob.id, succeeded, failed);
      }
    }

    // Return jobId immediately so the client can poll
    return new Response(JSON.stringify({
      success: true,
      jobId: newJob.id,
      totalItems: allIds.length,
      message: `Job started. Processing ${allIds.length} items server-side.`,
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
