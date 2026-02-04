import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContentViolation {
  phrase: string;
  count: number;
  type: 'phrase' | 'pattern';
  severity: 'warning' | 'error';
}

export interface ValidationResult {
  isClean: boolean;
  violations: ContentViolation[];
  score: number;
}

export interface GeneratedContent {
  title: string;
  seo_title: string;
  seo_description: string;
  excerpt: string;
  content: string;
  suggested_category: string;
  suggested_tags: string[];
  lsi_keywords: string[];
  word_count: number;
  validation?: ValidationResult;
}

interface GenerateParams {
  topic: string;
  keywords: string;
  wordCount: number;
  tone: string;
  categorySlug?: string;
}

export function useGenerateBlogContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async (params: GenerateParams) => {
    setIsLoading(true);
    setError(null);
    setContent(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-blog-content', {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setContent(data.data);
      toast({
        title: 'Content generated!',
        description: `Generated ${data.data.word_count} words`,
      });

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content';
      setError(message);
      toast({
        title: 'Generation failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setContent(null);
    setError(null);
  };

  return {
    generate,
    isLoading,
    content,
    error,
    reset,
  };
}
