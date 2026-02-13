import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const ADMIN_EMAIL = "letterofdispute@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PixabayHit {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
}

interface PixabayResponse {
  hits: PixabayHit[];
  totalHits: number;
}

// Generate SEO-friendly alt text
function generateAltText(categoryName: string, searchQuery: string, tags: string): string {
  const descriptor = tags ? tags.split(',')[0].trim() : searchQuery;
  return `${categoryName} - ${descriptor} imagery`;
}

// Download image from URL and return as ArrayBuffer
async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  return await response.arrayBuffer();
}

// Send admin alert email when image hosting fails
async function sendAdminAlert(categoryId: string, contextKey: string, searchQuery: string, errorMessage: string): Promise<void> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured — cannot send admin alert");
      return;
    }

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: "Letter of Dispute <noreply@mail.letterofdispute.com>",
      to: [ADMIN_EMAIL],
      subject: `[Alert] Category image hosting failed: ${categoryId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Image Hosting Failure</h2>
          <p>The system failed to download and self-host a category image.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Category ID</td><td style="padding: 8px; border: 1px solid #ddd;">${categoryId}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Context Key</td><td style="padding: 8px; border: 1px solid #ddd;">${contextKey}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Search Query</td><td style="padding: 8px; border: 1px solid #ddd;">${searchQuery}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Error</td><td style="padding: 8px; border: 1px solid #ddd; color: #dc2626;">${errorMessage}</td></tr>
          </table>
          <p style="color: #666; font-size: 12px;">The frontend will display a gradient fallback for this category. No Pixabay URLs were served.</p>
        </div>
      `,
    });
    console.log(`Admin alert email sent for ${categoryId}/${contextKey}`);
  } catch (emailErr) {
    console.error("Failed to send admin alert email:", emailErr);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoryId, categoryName, contextKey = "default", searchQuery, forceRefresh = false } = await req.json();

    if (!categoryId || !searchQuery) {
      return new Response(
        JSON.stringify({ error: "categoryId and searchQuery are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pixabayApiKey = Deno.env.get("PIXABAY_API_KEY");

    if (!pixabayApiKey) {
      return new Response(
        JSON.stringify({ error: "PIXABAY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for cached image (not expired)
    if (!forceRefresh) {
      const { data: cachedImages, error: cacheError } = await supabase
        .from("category_images")
        .select("*")
        .eq("category_id", categoryId)
        .eq("context_key", contextKey)
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (!cacheError && cachedImages && cachedImages.length > 0) {
        console.log(`Cache hit for ${categoryId}/${contextKey}`);
        return new Response(
          JSON.stringify({ image: cachedImages[0], cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from Pixabay API
    console.log(`Fetching from Pixabay for: ${searchQuery}`);
    const pixabayUrl = new URL("https://pixabay.com/api/");
    pixabayUrl.searchParams.set("key", pixabayApiKey);
    pixabayUrl.searchParams.set("q", searchQuery);
    pixabayUrl.searchParams.set("image_type", "photo");
    pixabayUrl.searchParams.set("orientation", "horizontal");
    pixabayUrl.searchParams.set("safesearch", "true");
    pixabayUrl.searchParams.set("per_page", "5");
    pixabayUrl.searchParams.set("min_width", "1280");

    const pixabayResponse = await fetch(pixabayUrl.toString());
    
    if (!pixabayResponse.ok) {
      const errMsg = `Pixabay API error: ${pixabayResponse.status}`;
      await sendAdminAlert(categoryId, contextKey, searchQuery, errMsg);
      return new Response(
        JSON.stringify({ image: null, error: errMsg, notified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pixabayData: PixabayResponse = await pixabayResponse.json();

    if (!pixabayData.hits || pixabayData.hits.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images found", image: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick first result
    const hit = pixabayData.hits[0];
    
    // Generate alt text
    const displayName = categoryName || categoryId.split('-').map((w: string) => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    const altText = generateAltText(displayName, searchQuery, hit.tags);

    // Download and self-host — NO fallback to Pixabay URLs
    console.log(`Downloading image from Pixabay...`);
    let imageBuffer: ArrayBuffer;
    try {
      imageBuffer = await downloadImage(hit.largeImageURL);
    } catch (downloadErr) {
      const errMsg = `Image download failed: ${downloadErr instanceof Error ? downloadErr.message : String(downloadErr)}`;
      console.error(errMsg);
      await sendAdminAlert(categoryId, contextKey, searchQuery, errMsg);
      return new Response(
        JSON.stringify({ image: null, error: "Image hosting failed", notified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storagePath = `categories/${categoryId}/${contextKey}.jpg`;
    const thumbnailPath = `categories/${categoryId}/${contextKey}-thumb.jpg`;

    console.log(`Uploading to storage: ${storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      const errMsg = `Storage upload failed: ${uploadError.message}`;
      console.error(errMsg);
      await sendAdminAlert(categoryId, contextKey, searchQuery, errMsg);
      return new Response(
        JSON.stringify({ image: null, error: "Image hosting failed", notified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload thumbnail (non-fatal if it fails)
    try {
      const thumbnailBuffer = await downloadImage(hit.previewURL);
      await supabase.storage
        .from("blog-images")
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
    } catch (thumbErr) {
      console.warn("Thumbnail upload failed, main image still hosted successfully");
    }

    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(storagePath);
    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(thumbnailPath);

    // All self-hosted images get 1-year cache
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Delete old cached images for this category/context
    try {
      await supabase
        .from("category_images")
        .delete()
        .eq("category_id", categoryId)
        .eq("context_key", contextKey);
    } catch (delErr) {
      console.warn("Failed to delete old cache entry:", delErr);
    }

    // Insert new cached image
    const newImage = {
      category_id: categoryId,
      context_key: contextKey,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      large_url: imageUrl,
      pixabay_id: String(hit.id),
      search_query: searchQuery,
      alt_text: altText,
      expires_at: expiresAt,
    };

    const { data: insertedImage, error: insertError } = await supabase
      .from("category_images")
      .insert(newImage)
      .select()
      .single();

    if (insertError) {
      console.warn("Cache insert failed, returning image without caching:", insertError.message);
      return new Response(
        JSON.stringify({ image: newImage, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully self-hosted image for ${categoryId}/${contextKey}`);
    
    return new Response(
      JSON.stringify({ image: insertedImage, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
