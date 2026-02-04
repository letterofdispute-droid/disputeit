import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryImage {
  id: string;
  category_id: string;
  context_key: string;
  image_url: string;
  thumbnail_url: string;
  large_url: string;
  pixabay_id: string;
  search_query: string;
  alt_text?: string;
  expires_at: string;
}

interface UseCategoryImageResult {
  imageUrl: string | null;
  thumbnailUrl: string | null;
  largeUrl: string | null;
  altText: string | null;
  isLoading: boolean;
  error: string | null;
}

// In-memory cache to prevent duplicate fetches during same session
const imageCache = new Map<string, CategoryImage>();

export function useCategoryImage(
  categoryId: string | undefined,
  searchQuery: string | undefined,
  contextKey: string = 'default',
  categoryName?: string
): UseCategoryImageResult {
  const [image, setImage] = useState<CategoryImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId || !searchQuery) {
      return;
    }

    const cacheKey = `${categoryId}-${contextKey}`;

    // Check in-memory cache first
    if (imageCache.has(cacheKey)) {
      setImage(imageCache.get(cacheKey)!);
      return;
    }

    const fetchImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First check Supabase cache directly
        const { data: cachedImages } = await supabase
          .from('category_images')
          .select('*')
          .eq('category_id', categoryId)
          .eq('context_key', contextKey)
          .gt('expires_at', new Date().toISOString())
          .limit(1);

        if (cachedImages && cachedImages.length > 0) {
          const cachedImage = cachedImages[0] as CategoryImage;
          imageCache.set(cacheKey, cachedImage);
          setImage(cachedImage);
          setIsLoading(false);
          return;
        }

        // Fetch from edge function if not cached (downloads & self-hosts the image)
        const { data, error: fetchError } = await supabase.functions.invoke(
          'fetch-category-images',
          {
            body: { categoryId, categoryName, contextKey, searchQuery },
          }
        );

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (data?.image) {
          imageCache.set(cacheKey, data.image);
          setImage(data.image);
        } else if (data?.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error('Error fetching category image:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch image');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [categoryId, searchQuery, contextKey, categoryName]);

  return {
    imageUrl: image?.image_url || null,
    thumbnailUrl: image?.thumbnail_url || null,
    largeUrl: image?.large_url || null,
    altText: image?.alt_text || null,
    isLoading,
    error,
  };
}

// Utility to preload images for all categories
export async function preloadCategoryImages(
  categories: Array<{ id: string; name: string; imageKeywords: string[] }>
): Promise<void> {
  const promises = categories.map(async (category) => {
    const searchQuery = category.imageKeywords[0];
    const cacheKey = `${category.id}-default`;

    if (imageCache.has(cacheKey)) {
      return;
    }

    try {
      const { data: cachedImages } = await supabase
        .from('category_images')
        .select('*')
        .eq('category_id', category.id)
        .eq('context_key', 'default')
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (cachedImages && cachedImages.length > 0) {
        imageCache.set(cacheKey, cachedImages[0] as CategoryImage);
      }
    } catch (err) {
      console.error(`Error preloading image for ${category.id}:`, err);
    }
  });

  await Promise.all(promises);
}
