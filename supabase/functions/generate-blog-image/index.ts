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

    // Generate image prompt
    const imageStyle = style || 'modern, professional, clean';
    const imagePrompt = `Create a professional blog header image for an article titled "${title}". ${excerpt ? `The article is about: ${excerpt}.` : ''} Style: ${imageStyle}, suitable for a consumer rights and legal advice website. The image should be visually appealing with subtle gradients or abstract elements. No text in the image. 16:9 aspect ratio, high quality.`;

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

    // Extract image from response
    const content = data.choices[0]?.message?.content;
    
    if (!content || !Array.isArray(content)) {
      console.error('Unexpected response format:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    // Find the image part in the response
    const imagePart = content.find((part: any) => part.type === 'image_url');
    if (!imagePart?.image_url?.url) {
      console.error('No image URL in response:', JSON.stringify(content));
      throw new Error('No image URL in response');
    }

    const base64Data = imagePart.image_url.url;
    
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
