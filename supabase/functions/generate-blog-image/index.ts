import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, style } = await req.json();

    if (!title) {
      throw new Error('Title is required');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate image prompt - explicitly request realistic photography
    const imageStyle = style || 'modern, professional, clean';
    const imagePrompt = `Generate a REALISTIC PHOTOGRAPH for a blog article titled "${title}". ${excerpt ? `The article is about: ${excerpt}.` : ''} 

CRITICAL REQUIREMENTS:
- Must be a REALISTIC PHOTOGRAPH, NOT an illustration, NOT clipart, NOT a vector graphic, NOT a cartoon, NOT an icon
- Should look like a professional stock photo taken with a real camera
- Include real people, real objects, or real environments relevant to the topic
- Professional lighting, natural colors, photorealistic quality
- Style: ${imageStyle}, suitable for a consumer rights and legal advice website
- No text overlays in the image
- 16:9 aspect ratio, high resolution, professional stock photo quality

Think: What would a professional stock photographer capture for this topic?`;

    console.log('Generating image with prompt:', imagePrompt);

    // Call AI Gateway for image generation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: imagePrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

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
      console.error('No image URL in response:', JSON.stringify(data));
      throw new Error('No image generated - check response format');
    }
    
    // Extract the actual base64 data (remove data:image/...;base64, prefix if present)
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

    // Generate unique filename
    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const fileName = `${slug}-${timestamp}.${imageExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: `image/${imageExtension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(JSON.stringify({ 
      imageUrl: publicUrl,
      fileName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-blog-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
