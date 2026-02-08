import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScanResult {
  articleId: string;
  title: string;
  suggestionsFound: number;
}

export interface SemanticScanResponse {
  success: boolean;
  scanned: number;
  totalSuggestions: number;
  results: ScanResult[];
  error?: string;
}

export interface EmbeddingStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

export function useSemanticLinkScan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastScanResults, setLastScanResults] = useState<ScanResult[]>([]);

  // Semantic scan mutation
  const scanMutation = useMutation({
    mutationFn: async (params: { 
      postId?: string; 
      categorySlug?: string; 
      batchSize?: number;
      similarityThreshold?: number;
      maxLinksPerArticle?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('scan-for-semantic-links', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Semantic scan failed');
      return data as SemanticScanResponse;
    },
    onSuccess: (data) => {
      setLastScanResults(data.results);
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({
        title: 'Semantic scan complete',
        description: `Found ${data.totalSuggestions} link opportunities across ${data.scanned} articles`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Semantic scan failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Generate embeddings mutation
  const generateEmbeddingsMutation = useMutation({
    mutationFn: async (params: {
      postId?: string;
      categorySlug?: string;
      batchSize?: number;
      contentType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Embedding generation failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Embeddings generated',
        description: `Processed ${data.processed} articles (${data.created} new, ${data.updated} updated, ${data.skipped} skipped)`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Embedding generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Fetch embedding stats
  const fetchEmbeddingStats = useCallback(async (): Promise<EmbeddingStats> => {
    const { data, error } = await supabase
      .from('article_embeddings')
      .select('embedding_status');

    if (error) {
      console.error('Failed to fetch embedding stats:', error);
      return { total: 0, completed: 0, pending: 0, failed: 0 };
    }

    const stats = {
      total: data.length,
      completed: data.filter(e => e.embedding_status === 'completed').length,
      pending: data.filter(e => e.embedding_status === 'pending').length,
      failed: data.filter(e => e.embedding_status === 'failed').length,
    };

    return stats;
  }, []);

  return {
    // Semantic scan
    semanticScan: scanMutation.mutate,
    isSemanticScanning: scanMutation.isPending,
    lastScanResults,
    
    // Embedding generation
    generateEmbeddings: generateEmbeddingsMutation.mutate,
    isGeneratingEmbeddings: generateEmbeddingsMutation.isPending,
    
    // Stats
    fetchEmbeddingStats,
  };
}
