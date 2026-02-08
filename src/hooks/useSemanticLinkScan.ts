import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export interface EmbeddingJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  content_type: string;
  category_filter: string | null;
  total_items: number;
  processed_items: number;
  failed_items: number;
  skipped_items: number;
  error_messages: Record<string, string>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useSemanticLinkScan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastScanResults, setLastScanResults] = useState<ScanResult[]>([]);

  // Fetch active embedding job (with polling while processing)
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['embedding-job-active'],
    queryFn: async (): Promise<EmbeddingJob | null> => {
      const { data, error } = await supabase
        .from('embedding_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EmbeddingJob | null;
    },
    refetchInterval: (query) => {
      const job = query.state.data as EmbeddingJob | null;
      return job?.status === 'processing' ? 2000 : false;
    },
  });

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

  // Start bulk embedding job
  const bulkEmbeddingMutation = useMutation({
    mutationFn: async (params: {
      category_filter?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          bulk: true,
          content_type: 'blog_post',
          ...params,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Bulk embedding failed');
      return data as { success: boolean; jobId: string; totalItems: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['embedding-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Bulk embedding started',
        description: `Processing ${data.totalItems} articles in background...`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Bulk embedding failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Generate single embedding
  const generateEmbeddingMutation = useMutation({
    mutationFn: async (params: {
      postId?: string;
      categorySlug?: string;
      batchSize?: number;
      contentType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          content_type: params.contentType || 'blog_post',
          content_id: params.postId,
          batch_size: params.batchSize || 5,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Embedding generation failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embedding-stats'] });
      toast({
        title: 'Embedding generated',
        description: 'Article embedding created successfully',
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

    return {
      total: data.length,
      completed: data.filter(e => e.embedding_status === 'completed').length,
      pending: data.filter(e => e.embedding_status === 'pending').length,
      failed: data.filter(e => e.embedding_status === 'failed').length,
    };
  }, []);

  // Get job progress percentage
  const getJobProgress = useCallback((job: EmbeddingJob | null): number => {
    if (!job || job.total_items === 0) return 0;
    return Math.round(((job.processed_items + job.failed_items) / job.total_items) * 100);
  }, []);

  // Cancel a stuck job
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('embedding_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_messages: { _cancelled: 'Job cancelled by user' },
        })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embedding-job-active'] });
      toast({
        title: 'Job cancelled',
        description: 'The embedding job has been cancelled',
      });
    },
  });

  return {
    // Semantic scan
    semanticScan: scanMutation.mutate,
    isSemanticScanning: scanMutation.isPending,
    lastScanResults,
    
    // Bulk embedding
    startBulkEmbedding: bulkEmbeddingMutation.mutate,
    isStartingBulk: bulkEmbeddingMutation.isPending,
    
    // Single embedding
    generateEmbedding: generateEmbeddingMutation.mutate,
    isGeneratingEmbedding: generateEmbeddingMutation.isPending,
    
    // Job tracking
    activeJob,
    jobLoading,
    getJobProgress,
    cancelJob: cancelJobMutation.mutate,
    isCancelling: cancelJobMutation.isPending,
    
    // Stats
    fetchEmbeddingStats,
  };
}
