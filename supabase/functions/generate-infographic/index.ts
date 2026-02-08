import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Article types that benefit from infographics
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
  // Try to find "vs" or "or" in title to identify comparison sides
  const vsMatch = title.match(/(.+?)\s+(?:vs\.?|versus|or)\s+(.+)/i);
  let leftLabel = 'Option A';
  let rightLabel = 'Option B';
  
  if (vsMatch) {
    leftLabel = vsMatch[1].trim().substring(0, 30);
    rightLabel = vsMatch[2].trim().substring(0, 30);
  }

  // Extract pros/cons or comparison points from H2/H3 headers
  const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
  const items = headers
    .map(h => h.replace(/<[^>]*>/g, '').trim())
    .filter(h => h.length > 5 && h.length < 60)
    .slice(0, 6);

  if (items.length < 2) {
    return null;
  }

  // Split items between left and right columns
  const midpoint = Math.ceil(items.length / 2);
  return {
    type: 'comparison',
    items,
    leftColumn: items.slice(0, midpoint),
    rightColumn: items.slice(midpoint),
    leftLabel,
    rightLabel,
  };
}

function extractChecklistItems(content: string): ExtractedData | null {
  // Extract list items from <li> tags
  const listItems = content.match(/<li[^>]*>([^<]+(?:<[^/][^>]*>[^<]+<\/[^>]+>)*[^<]*)<\/li>/gi) || [];
  
  let items = listItems
    .map(li => li.replace(/<[^>]*>/g, '').trim())
    .filter(item => item.length > 5 && item.length < 80)
    .slice(0, 8);

  // Fallback: extract from numbered headers
  if (items.length < 3) {
    const numberedHeaders = content.match(/<h[23][^>]*>\d+[.):]\s*([^<]+)<\/h[23]>/gi) || [];
    items = numberedHeaders
      .map(h => h.replace(/<[^>]*>/g, '').replace(/^\d+[.):]\s*/, '').trim())
      .filter(h => h.length > 5 && h.length < 80)
      .slice(0, 8);
  }

  if (items.length < 3) {
    return null;
  }

  return {
    type: 'checklist',
    items,
  };
}

function extractProcessSteps(content: string): ExtractedData | null {
  // Extract H2 headers as process steps
  const headers = content.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
  
  let items = headers
    .map(h => h.replace(/<[^>]*>/g, '').trim())
    // Remove common non-step headers
    .filter(h => 
      h.length > 5 && 
      h.length < 60 &&
      !h.toLowerCase().includes('conclusion') &&
      !h.toLowerCase().includes('summary') &&
      !h.toLowerCase().includes('introduction')
    )
    .slice(0, 7);

  if (items.length < 3) {
    return null;
  }

  // Add step numbers if not present
  items = items.map((item, i) => {
    if (/^(step\s+)?\d+/i.test(item)) {
      return item;
    }
    return `Step ${i + 1}: ${item}`;
  });

  return {
    type: 'how-to',
    items,
  };
}

function extractMistakesList(content: string): ExtractedData | null {
  // Look for headers containing mistake-related words
  const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
  
  let items = headers
    .map(h => h.replace(/<[^>]*>/g, '').trim())
    .filter(h => h.length > 5 && h.length < 70)
    .slice(0, 6);

  // Format as mistake warnings
  items = items.map(item => {
    // Remove numbering if present
    const cleaned = item.replace(/^\d+[.):]\s*/, '').trim();
    // Add warning emoji/symbol conceptually (for the AI prompt)
    return cleaned;
  });

  if (items.length < 3) {
    return null;
  }

  return {
    type: 'mistakes',
    items,
  };
}

function extractRightsInfo(content: string, title: string): ExtractedData | null {
  // Extract key rights or timeline items
  const listItems = content.match(/<li[^>]*>([^<]+(?:<[^/][^>]*>[^<]+<\/[^>]+>)*[^<]*)<\/li>/gi) || [];
  
  let items = listItems
    .map(li => li.replace(/<[^>]*>/g, '').trim())
    .filter(item => 
      item.length > 5 && 
      item.length < 80 &&
      (
        item.toLowerCase().includes('right') ||
        item.toLowerCase().includes('day') ||
        item.toLowerCase().includes('must') ||
        item.toLowerCase().includes('entitled') ||
        item.toLowerCase().includes('can')
      )
    )
    .slice(0, 6);

  // Fallback to headers
  if (items.length < 3) {
    const headers = content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
    items = headers
      .map(h => h.replace(/<[^>]*>/g, '').trim())
      .filter(h => h.length > 5 && h.length < 60)
      .slice(0, 6);
  }

  if (items.length < 3) {
    return null;
  }

  return {
    type: 'rights',
    items,
  };
}

// Main extraction dispatcher
function extractInfographicData(content: string, articleType: string, title: string): ExtractedData | null {
  switch (articleType) {
    case 'comparison':
      return extractComparisonPoints(content, title);
    case 'checklist':
      return extractChecklistItems(content);
    case 'how-to':
      return extractProcessSteps(content);
    case 'mistakes':
      return extractMistakesList(content);
    case 'rights':
      return extractRightsInfo(content, title);
    default:
      return null;
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
      return `Generate a COMPARISON INFOGRAPHIC with two columns:

LEFT SIDE (labeled "${data.leftLabel}"):
${data.leftColumn?.map((item, i) => `${i + 1}. ${item}`).join('\n')}

RIGHT SIDE (labeled "${data.rightLabel}"):
${data.rightColumn?.map((item, i) => `${i + 1}. ${item}`).join('\n')}

STYLE:
- Side-by-side layout with clear dividing line
- Use contrasting colors (blue vs orange or green vs red)
- Each point has a small icon
- "VS" badge in the center
${baseStyle}`;

    case 'checklist':
      return `Generate a VISUAL CHECKLIST INFOGRAPHIC:

ITEMS TO INCLUDE (with checkboxes):
${data.items.map((item, i) => `☐ ${item}`).join('\n')}

STYLE:
- Clean checkbox or bullet point layout
- Green checkmarks or empty boxes
- Numbered 1-${data.items.length}
- Each item on its own row
- Professional icons next to each item
${baseStyle}`;

    case 'how-to':
      return `Generate a STEP-BY-STEP PROCESS INFOGRAPHIC:

STEPS (show as a flowing process):
${data.items.map(item => `→ ${item}`).join('\n')}

STYLE:
- Horizontal or vertical flowchart design
- Arrows or connectors between steps
- Each step in a box or circle
- Numbered steps (1, 2, 3...)
- Gradient color progression from start to finish
- Small icons representing each step
${baseStyle}`;

    case 'mistakes':
      return `Generate a WARNING INFOGRAPHIC showing common mistakes:

MISTAKES TO AVOID:
${data.items.map((item, i) => `✗ ${item}`).join('\n')}

STYLE:
- Red X marks or warning symbols for each mistake
- Alert/warning theme with red and orange accents
- Each mistake in a separate block
- Warning triangle icon at top
- Clear "DON'T DO THIS" visual language
${baseStyle}`;

    case 'rights':
      return `Generate a RIGHTS/TIMELINE INFOGRAPHIC:

KEY RIGHTS/POINTS:
${data.items.map((item, i) => `• ${item}`).join('\n')}

STYLE:
- Timeline or hierarchy layout
- Shield or gavel icon theme (legal/rights)
- Blue and gold professional colors
- Each right in a badge or card
- Legal/official aesthetic
${baseStyle}`;

    default:
      return `Generate a professional infographic for: ${title}
${baseStyle}`;
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { title, articleType, content, storagePath } = await req.json() as InfographicRequest;

    if (!title || !articleType || !content || !storagePath) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this article type supports infographics
    if (!INFOGRAPHIC_TYPES.includes(articleType as InfographicType)) {
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Article type does not support infographics',
        usePhoto: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract structured data from content
    const extractedData = extractInfographicData(content, articleType, title);
    
    if (!extractedData || extractedData.items.length < 3) {
      console.log(`[INFOGRAPHIC] Not enough data extracted for "${title}"`);
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Not enough structured data in content',
        usePhoto: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[INFOGRAPHIC] Generating ${articleType} infographic for: "${title}"`);
    console.log(`[INFOGRAPHIC] Extracted ${extractedData.items.length} items`);

    // Build the infographic prompt
    const prompt = buildInfographicPrompt(title, extractedData);

    // Generate infographic using Gemini
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[INFOGRAPHIC] Generation failed:', response.status, errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image generation failed',
        usePhoto: true,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Extract image from response
    const message = data.choices[0]?.message;
    let base64Data: string | null = null;
    
    // Format 1: images array
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const imagePart = message.images.find((part: any) => part.type === 'image_url');
      if (imagePart?.image_url?.url) {
        base64Data = imagePart.image_url.url;
      }
    }
    
    // Format 2: content array
    if (!base64Data && message?.content && Array.isArray(message.content)) {
      const imagePart = message.content.find((part: any) => part.type === 'image_url');
      if (imagePart?.image_url?.url) {
        base64Data = imagePart.image_url.url;
      }
    }

    if (!base64Data) {
      console.error('[INFOGRAPHIC] No image in response');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No image generated',
        usePhoto: true,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract base64 data and upload
    const base64Match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    let imageBuffer: Uint8Array;
    let imageExtension = 'png';
    
    if (base64Match) {
      imageExtension = base64Match[1];
      const base64String = base64Match[2];
      imageBuffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    } else {
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    }

    // Upload to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(`${storagePath}.${imageExtension}`, imageBuffer, {
        contentType: `image/${imageExtension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('[INFOGRAPHIC] Upload error:', uploadError.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Upload failed',
        usePhoto: true,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(`${storagePath}.${imageExtension}`);

    // Generate descriptive alt text
    const altText = `Infographic: ${title.substring(0, 80)} - ${extractedData.type} visualization with ${extractedData.items.length} key points`;

    console.log(`[INFOGRAPHIC] Success: ${urlData.publicUrl}`);

    return new Response(JSON.stringify({
      success: true,
      url: urlData.publicUrl,
      altText: altText.substring(0, 125),
      type: extractedData.type,
      itemCount: extractedData.items.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[INFOGRAPHIC] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      usePhoto: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
