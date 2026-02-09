import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageWithGoogle, imageResultToBuffer, isGoogleImageError } from "../_shared/googleImageGen.ts";

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

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log('Generating image with Google Gemini for:', title);

    const result = await generateImageWithGoogle(imagePrompt, geminiKey);
    const { buffer, extension } = imageResultToBuffer(result);

    // Generate unique filename
    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const fileName = `${slug}-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, buffer, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

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
    
    // Return categorized errors with proper HTTP status
    if (isGoogleImageError(error)) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
