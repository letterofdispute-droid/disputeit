import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SuggestedImage {
  url: string;
  thumbnail_url: string;
  alt_text: string;
  photographer: string;
  photographer_url: string;
  source: 'pixabay';
  pixabay_id: number;
  relevance_score: number;
}

export function useImageSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<SuggestedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = async (topic: string, keywords?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('suggest-images', {
        body: { topic, keywords },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to search images');
      }

      setImages(data.images);
      
      if (data.images.length === 0) {
        toast({
          title: 'No images found',
          description: 'Try adjusting your topic or keywords',
        });
      }

      return data.images;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search images';
      setError(message);
      toast({
        title: 'Image search failed',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearImages = () => {
    setImages([]);
    setError(null);
  };

  return {
    search,
    isLoading,
    images,
    error,
    clearImages,
  };
}
