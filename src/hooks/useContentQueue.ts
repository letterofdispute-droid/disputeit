import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useIsFetching } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContentQueueItem {
  id: string;
  plan_id: string;
  article_type: string;
  suggested_title: string;
  suggested_keywords: string[];
  priority: number;
  status: string;
  blog_post_id: string | null;
  generated_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  content_plans?: {
    template_slug: string;
    template_name: string;
    category_id: string;
  };
}

interface BulkGenerateParams {
  planId?: string;
  categoryId?: string;
  queueItemIds?: string[];
  batchSize?: number;
  tone?: string;
  wordCount?: number;
}

interface GenerationProgress {
  current: number;
  total: number;
  currentTitle?: string;
}

export function useContentQueue(planId?: string, categoryId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  // Stale detection threshold: 10 minutes
  const STALE_THRESHOLD_MS = 10 * 60 * 1000;

  // Fetch queue items with optional filtering
  const { data: queueItems, isLoading, error, refetch } = useQuery({
    queryKey: ['content-queue', planId, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('content_queue')
        .select(`
          *,
          content_plans(template_slug, template_name, category_id)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (planId) {
        query = query.eq('plan_id', planId);
      }

      const { data, error } = await query.limit(200);
      
      if (error) throw error;

      // Filter by category if specified (after join)
      if (categoryId && data) {
        return data.filter((item: any) => 
          item.content_plans?.category_id === categoryId
        ) as ContentQueueItem[];
      }

      return data as ContentQueueItem[];
    },
    // Poll while generating or when there are generating items for real-time updates
    refetchInterval: () => {
      // Always poll if we have active generation
      if (generationProgress) return 3000;
      // Also poll if there are items in generating state (handles edge function timeouts)
      return false; // Will be set dynamically via effect
    },
  });

  // Dynamic polling for generating items
  const hasGeneratingItems = queueItems?.some(item => item.status === 'generating');

  // Re-run query periodically when there are generating items
  useEffect(() => {
    if (!hasGeneratingItems && !generationProgress) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [hasGeneratingItems, generationProgress, refetch]);

  // Get stale generating items (stuck for more than 10 minutes)
  const getStaleGeneratingItems = useCallback(() => {
    if (!queueItems) return [];
    const thresholdTime = new Date(Date.now() - STALE_THRESHOLD_MS);
    
    return queueItems.filter(item => 
      item.status === 'generating' && 
      new Date(item.created_at) < thresholdTime
    );
  }, [queueItems]);

  // Reset stale items mutation
  const resetStaleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('content_queue')
        .update({ 
          status: 'failed', 
          error_message: 'Generation timed out - manually reset' 
        })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      toast({ 
        title: 'Stale items reset', 
        description: 'Items marked as failed. You can now retry them.' 
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to reset items',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Bulk generate articles with progress tracking
  const bulkGenerateMutation = useMutation({
    mutationFn: async (params: BulkGenerateParams) => {
      const itemIds = params.queueItemIds || [];
      const total = itemIds.length;
      
      // Set initial progress
      setGenerationProgress({ current: 0, total });

      const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate articles');
      
      return data;
    },
    onSuccess: (data) => {
      setGenerationProgress(null);
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Batch generation complete',
        description: `Generated ${data.succeeded} articles, ${data.failed} failed`,
      });
    },
    onError: (error) => {
      setGenerationProgress(null);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Retry failed items
  const retryFailedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // First, reset status to 'queued' for failed items
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({ status: 'queued', error_message: null })
        .in('id', ids);
      
      if (updateError) throw updateError;

      // Then trigger bulk generation
      const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
        body: { queueItemIds: ids, batchSize: ids.length },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to retry articles');
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Retry complete',
        description: `Retried ${data.succeeded} articles, ${data.failed} failed`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Update queue item status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('content_queue')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
    },
  });

  // Delete queue items
  const deleteItemsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('content_queue')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      toast({ title: 'Items deleted' });
    },
  });

  // Get stats
  const getStats = useCallback(() => {
    if (!queueItems) return { queued: 0, generating: 0, generated: 0, published: 0, failed: 0 };
    
    return {
      queued: queueItems.filter(i => i.status === 'queued').length,
      generating: queueItems.filter(i => i.status === 'generating').length,
      generated: queueItems.filter(i => i.status === 'generated').length,
      published: queueItems.filter(i => i.status === 'published').length,
      failed: queueItems.filter(i => i.status === 'failed').length,
    };
  }, [queueItems]);

  // Get failed item IDs
  const getFailedIds = useCallback(() => {
    return queueItems?.filter(i => i.status === 'failed').map(i => i.id) || [];
  }, [queueItems]);

  return {
    queueItems,
    isLoading,
    error,
    refetch,
    bulkGenerate: bulkGenerateMutation.mutate,
    isBulkGenerating: bulkGenerateMutation.isPending,
    retryFailed: retryFailedMutation.mutate,
    isRetrying: retryFailedMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    deleteItems: deleteItemsMutation.mutate,
    getStats,
    getFailedIds,
    generationProgress,
    getStaleGeneratingItems,
    resetStaleItems: resetStaleMutation.mutate,
    isResettingStale: resetStaleMutation.isPending,
    hasGeneratingItems,
  };
}
