import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerateLegalLetterParams {
  templateCategory: string;
  templateName: string;
  templateSlug: string;
  formData: Record<string, string>;
  jurisdiction: 'US' | 'UK' | 'EU' | 'generic';
  tone: 'neutral' | 'firm' | 'final';
}

export interface GenerateLegalLetterResult {
  letterContent: string;
  metadata: {
    templateCategory: string;
    templateName: string;
    jurisdiction: string;
    tone: string;
    generatedAt: string;
    validationIssues: string[];
  };
}

export function useGenerateLegalLetter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateLetter = useCallback(async (params: GenerateLegalLetterParams): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-legal-letter', {
        body: params,
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to generate letter');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.letterContent) {
        throw new Error('No letter content received');
      }

      // Log any validation issues for monitoring
      if (data.metadata?.validationIssues?.length > 0) {
        console.warn('Letter validation issues:', data.metadata.validationIssues);
      }

      setGeneratedContent(data.letterContent);
      return data.letterContent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate letter';
      setError(message);
      
      // Show appropriate error message
      if (message.includes('Rate limit')) {
        toast({
          title: 'Please wait',
          description: 'Too many requests. Please try again in a moment.',
          variant: 'destructive',
        });
      } else if (message.includes('quota')) {
        toast({
          title: 'Service unavailable',
          description: 'Letter generation is temporarily unavailable. Please try again later.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Generation failed',
          description: 'Unable to generate letter. Please try again.',
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setGeneratedContent(null);
    setError(null);
  }, []);

  return {
    generateLetter,
    isGenerating,
    generatedContent,
    error,
    reset,
  };
}
