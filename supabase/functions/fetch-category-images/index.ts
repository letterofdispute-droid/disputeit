import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface CategoryImage {
  id: string;
  category_id: string;
  context_key: string;
  image_url: string;
  thumbnail_url: string;
  large_url: string;
  pixabay_id: string;
  search_query: string;
  alt_text: string;
  expires_at: string;
}

// Generate SEO-friendly alt text
function generateAltText(categoryName: string, searchQuery: string, tags: string): string {
  // Use Pixabay tags if available, otherwise fall back to search query
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

Deno.serve(async (req) => {
  // Handle CORS preflight
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
      throw new Error(`Pixabay API error: ${pixabayResponse.status}`);
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

    // Try to download and self-host, but fall back to Pixabay URLs if storage times out
    let imageUrl = hit.largeImageURL;
    let thumbnailUrl = hit.previewURL;
    let selfHosted = false;

    try {
      console.log(`Downloading image from Pixabay...`);
      const imageBuffer = await downloadImage(hit.largeImageURL);
      
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
        console.warn("Storage upload failed, using Pixabay URLs as fallback:", uploadError.message);
      } else {
        // Upload thumbnail too
        try {
          const thumbnailBuffer = await downloadImage(hit.previewURL);
          await supabase.storage
            .from("blog-images")
            .upload(thumbnailPath, thumbnailBuffer, {
              contentType: "image/jpeg",
              upsert: true,
            });
        } catch (thumbErr) {
          console.warn("Thumbnail upload failed, using Pixabay thumbnail URL");
        }

        const { data: { publicUrl: storedImageUrl } } = supabase.storage
          .from("blog-images")
          .getPublicUrl(storagePath);
        const { data: { publicUrl: storedThumbUrl } } = supabase.storage
          .from("blog-images")
          .getPublicUrl(thumbnailPath);

        imageUrl = storedImageUrl;
        thumbnailUrl = storedThumbUrl;
        selfHosted = true;
      }
    } catch (storageErr) {
      console.warn("Image hosting failed, using Pixabay URLs as fallback:", storageErr);
    }

    // Cache expiry: 1 year if self-hosted, 20 hours if using Pixabay URLs
    const expiresAt = selfHosted
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();

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

    console.log(`Successfully processed image for ${categoryId}/${contextKey} (self-hosted: ${selfHosted})`);
    
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
