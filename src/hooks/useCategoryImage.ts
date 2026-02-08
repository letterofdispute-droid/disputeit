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
  fallbackGradient: string | null;
}

// Fallback gradients for each category when images fail to load
const FALLBACK_GRADIENTS: Record<string, string> = {
  'refunds': 'from-amber-600 to-orange-700',
  'housing': 'from-blue-600 to-indigo-700',
  'damaged-goods': 'from-red-600 to-rose-700',
  'utilities': 'from-emerald-600 to-teal-700',
  'vehicle': 'from-slate-600 to-zinc-700',
  'financial': 'from-green-600 to-emerald-700',
  'travel': 'from-sky-600 to-blue-700',
  'insurance': 'from-purple-600 to-violet-700',
  'employment': 'from-indigo-600 to-purple-700',
  'ecommerce': 'from-orange-600 to-amber-700',
  'contractors': 'from-yellow-600 to-orange-700',
  'hoa': 'from-lime-600 to-green-700',
  'healthcare': 'from-pink-600 to-rose-700',
};

// In-memory cache to prevent duplicate fetches during same session
const imageCache = new Map<string, CategoryImage>();

export function useCategoryImage(
  categoryId: string | undefined,
  searchQuery: string | undefined,
  contextKey: string = 'default',
  categoryName?: string
): UseCategoryImageResult {
  const [image, setImage] = useState<CategoryImage | null>(null);
  // Initialize loading state based on whether we have valid params and no cached image
  const [isLoading, setIsLoading] = useState(() => {
    if (categoryId && searchQuery) {
      const cacheKey = `${categoryId}-${contextKey}`;
      return !imageCache.has(cacheKey);
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);
  const [fallbackGradient, setFallbackGradient] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId || !searchQuery) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `${categoryId}-${contextKey}`;

    // Check in-memory cache first - if found, no loading needed
    if (imageCache.has(cacheKey)) {
      setImage(imageCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // Ensure loading state is true before fetching
    setIsLoading(true);

    const fetchImage = async () => {
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch image';
        setError(errorMessage);
        // Set fallback gradient when fetch fails
        if (categoryId) {
          setFallbackGradient(FALLBACK_GRADIENTS[categoryId] || 'from-gray-600 to-gray-800');
        }
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
    fallbackGradient,
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
