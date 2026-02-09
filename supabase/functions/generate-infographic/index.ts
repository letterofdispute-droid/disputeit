import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageWithGoogle, imageResultToBuffer, isGoogleImageError } from "../_shared/googleImageGen.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const INFOGRAPHIC_TYPES = ['comparison', 'checklist', 'how-to', 'mistakes', 'rights'] as const;
type InfographicType = typeof INFOGRAPHIC_TYPES[number];

interface InfographicRequest {
  title: string;
  articleType: string;
  content: string;
  storagePath: string;
}

interface ExtractedData {
  type: InfographicType;
  items: string[];
  leftColumn?: string[];
  rightColumn?: string[];
  leftLabel?: string;
  rightLabel?: string;
}

// ============================================
// DATA EXTRACTION FROM CONTENT
// ============================================

function extractComparisonPoints(content: string, title: string): ExtractedData | null {
  const vsMatch = title.match(/(.+?)\s+(?:vs\.?|versus|or)\s+(.+)/i);
  let leftLabel = 'Option A';
  let rightLabel = 'Option B';
  if (vsMatch) {
    leftLabel = vsMatch[1].trim().substring(0, 30);
    rightLabel = vsMatch[2].trim().substring(0, 30);
  }
  const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
  const items = headers.map(h => h.replace(/<[^>]*>/g, '').trim()).filter(h => h.length > 5 && h.length < 60).slice(0, 6);
  if (items.length < 2) return null;
  const midpoint = Math.ceil(items.length / 2);
  return { type: 'comparison', items, leftColumn: items.slice(0, midpoint), rightColumn: items.slice(midpoint), leftLabel, rightLabel };
}

function extractChecklistItems(content: string): ExtractedData | null {
  const listItems = content.match(/<li[^>]*>([^<]+(?:<[^/][^>]*>[^<]+<\/[^>]+>)*[^<]*)<\/li>/gi) || [];
  let items = listItems.map(li => li.replace(/<[^>]*>/g, '').trim()).filter(item => item.length > 5 && item.length < 80).slice(0, 8);
  if (items.length < 3) {
    const numberedHeaders = content.match(/<h[23][^>]*>\d+[.):]\s*([^<]+)<\/h[23]>/gi) || [];
    items = numberedHeaders.map(h => h.replace(/<[^>]*>/g, '').replace(/^\d+[.):]\s*/, '').trim()).filter(h => h.length > 5 && h.length < 80).slice(0, 8);
  }
  if (items.length < 3) return null;
  return { type: 'checklist', items };
}

function extractProcessSteps(content: string): ExtractedData | null {
  const headers = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
  let items = headers.map(h => h.replace(/<[^>]*>/g, '').trim()).filter(h => h.length > 5 && h.length < 60 && !h.toLowerCase().includes('conclusion') && !h.toLowerCase().includes('summary') && !h.toLowerCase().includes('introduction')).slice(0, 7);
  if (items.length < 3) return null;
  items = items.map((item, i) => /^(step\s+)?\d+/i.test(item) ? item : `Step ${i + 1}: ${item}`);
  return { type: 'how-to', items };
}

function extractMistakesList(content: string): ExtractedData | null {
  const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
  let items = headers.map(h => h.replace(/<[^>]*>/g, '').trim()).filter(h => h.length > 5 && h.length < 70).slice(0, 6);
  items = items.map(item => item.replace(/^\d+[.):]\s*/, '').trim());
  if (items.length < 3) return null;
  return { type: 'mistakes', items };
}

function extractRightsInfo(content: string): ExtractedData | null {
  const listItems = content.match(/<li[^>]*>([^<]+(?:<[^/][^>]*>[^<]+<\/[^>]+>)*[^<]*)<\/li>/gi) || [];
  let items = listItems.map(li => li.replace(/<[^>]*>/g, '').trim()).filter(item => item.length > 5 && item.length < 80 && (item.toLowerCase().includes('right') || item.toLowerCase().includes('day') || item.toLowerCase().includes('must') || item.toLowerCase().includes('entitled') || item.toLowerCase().includes('can'))).slice(0, 6);
  if (items.length < 3) {
    const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
    items = headers.map(h => h.replace(/<[^>]*>/g, '').trim()).filter(h => h.length > 5 && h.length < 60).slice(0, 6);
  }
  if (items.length < 3) return null;
  return { type: 'rights', items };
}

function extractInfographicData(content: string, articleType: string, title: string): ExtractedData | null {
  switch (articleType) {
    case 'comparison': return extractComparisonPoints(content, title);
    case 'checklist': return extractChecklistItems(content);
    case 'how-to': return extractProcessSteps(content);
    case 'mistakes': return extractMistakesList(content);
    case 'rights': return extractRightsInfo(content);
    default: return null;
  }
}

// ============================================
// INFOGRAPHIC PROMPT BUILDERS
// ============================================

function buildInfographicPrompt(title: string, data: ExtractedData): string {
  const baseStyle = `
CRITICAL REQUIREMENTS:
- Create a CLEAN, PROFESSIONAL INFOGRAPHIC (NOT a photograph)
- Use MINIMAL text - rely on icons and visual hierarchy
- 16:9 horizontal aspect ratio
- White or light gray background
- Modern, flat design style with subtle gradients
- Use professional colors: blues, teals, and accent colors
- Include a short title at the top: "${title.substring(0, 50)}"
- NO stock photos, NO realistic people, NO photographs
- Vector-style icons and shapes only
- All text must be in English`;

  switch (data.type) {
    case 'comparison':
      return `Generate a COMPARISON INFOGRAPHIC with two columns:\nLEFT SIDE (labeled "${data.leftLabel}"):\n${data.leftColumn?.map((item, i) => `${i + 1}. ${item}`).join('\n')}\nRIGHT SIDE (labeled "${data.rightLabel}"):\n${data.rightColumn?.map((item, i) => `${i + 1}. ${item}`).join('\n')}\nSTYLE: Side-by-side layout, contrasting colors, "VS" badge in center\n${baseStyle}`;
    case 'checklist':
      return `Generate a VISUAL CHECKLIST INFOGRAPHIC:\nITEMS:\n${data.items.map(item => `☐ ${item}`).join('\n')}\nSTYLE: Clean checkbox layout, green checkmarks, numbered, professional icons\n${baseStyle}`;
    case 'how-to':
      return `Generate a STEP-BY-STEP PROCESS INFOGRAPHIC:\nSTEPS:\n${data.items.map(item => `→ ${item}`).join('\n')}\nSTYLE: Flowchart design, arrows between steps, numbered circles, gradient colors\n${baseStyle}`;
    case 'mistakes':
      return `Generate a WARNING INFOGRAPHIC:\nMISTAKES TO AVOID:\n${data.items.map(item => `✗ ${item}`).join('\n')}\nSTYLE: Red X marks, warning symbols, red and orange accents\n${baseStyle}`;
    case 'rights':
      return `Generate a RIGHTS/TIMELINE INFOGRAPHIC:\nKEY RIGHTS:\n${data.items.map(item => `• ${item}`).join('\n')}\nSTYLE: Shield/gavel icons, blue and gold colors, badges for each right\n${baseStyle}`;
    default:
      return `Generate a professional infographic for: ${title}\n${baseStyle}`;
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { title, articleType, content, storagePath } = await req.json() as InfographicRequest;

    if (!title || !articleType || !content || !storagePath) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!INFOGRAPHIC_TYPES.includes(articleType as InfographicType)) {
      return new Response(JSON.stringify({ success: false, reason: 'Article type does not support infographics', usePhoto: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const extractedData = extractInfographicData(content, articleType, title);
    if (!extractedData || extractedData.items.length < 3) {
      console.log(`[INFOGRAPHIC] Not enough data extracted for "${title}"`);
      return new Response(JSON.stringify({ success: false, reason: 'Not enough structured data in content', usePhoto: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[INFOGRAPHIC] Generating ${articleType} infographic for: "${title}" (${extractedData.items.length} items)`);

    const prompt = buildInfographicPrompt(title, extractedData);

    const result = await generateImageWithGoogle(prompt, geminiKey);
    const { buffer, extension } = imageResultToBuffer(result);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(`${storagePath}.${extension}`, buffer, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[INFOGRAPHIC] Upload error:', uploadError.message);
      return new Response(JSON.stringify({ success: false, error: 'Upload failed', usePhoto: true }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.${extension}`);

    const altText = `Infographic: ${title.substring(0, 80)} - ${extractedData.type} visualization with ${extractedData.items.length} key points`;
    console.log(`[INFOGRAPHIC] Success: ${urlData.publicUrl}`);

    return new Response(JSON.stringify({
      success: true,
      url: urlData.publicUrl,
      altText: altText.substring(0, 125),
      type: extractedData.type,
      itemCount: extractedData.items.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[INFOGRAPHIC] Error:', error);
    
    if (isGoogleImageError(error)) {
      return new Response(JSON.stringify({ success: false, error: error.message, usePhoto: true }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error', usePhoto: true }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
