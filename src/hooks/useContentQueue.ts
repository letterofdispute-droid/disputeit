import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  started_at: string | null;
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
  currentBatch?: number;
  totalBatches?: number;
}

// Stale detection threshold: 10 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

export function useContentQueue(planId?: string, categoryId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

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
      } else {
        query = query.limit(1000);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (categoryId && data) {
        return data.filter((item: any) => 
          item.content_plans?.category_id === categoryId
        ) as ContentQueueItem[];
      }

      return data as ContentQueueItem[];
    },
  });

  // Poll for active job progress
  const { data: activeJob } = useQuery({
    queryKey: ['generation-job', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const { data, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', activeJobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeJobId,
    refetchInterval: activeJobId ? 4000 : false,
  });

  // When active job completes, show toast and clean up
  useEffect(() => {
    if (!activeJob || !activeJobId) return;
    
    if (activeJob.status === 'completed') {
      setActiveJobId(null);
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      
      if (activeJob.bail_reason) {
        const reason = activeJob.bail_reason === 'CREDIT_EXHAUSTED' 
          ? 'AI credits exhausted' 
          : 'Rate limit hit';
        toast({
          title: 'Generation paused',
          description: `${reason} after ${activeJob.succeeded_items} articles. ${activeJob.failed_items} failed. Top up your API credits, then retry failed items.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Batch generation complete',
          description: `Generated ${activeJob.succeeded_items} articles, ${activeJob.failed_items} failed.`,
          variant: activeJob.failed_items > 0 ? 'destructive' : 'default',
        });
      }
    }
  }, [activeJob?.status, activeJobId]);

  // Also poll queue items while job is active
  useEffect(() => {
    if (!activeJobId) return;
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeJobId, refetch]);

  // Dynamic polling for generating items (handles page reload during active job)
  const hasGeneratingItems = queueItems?.some(item => item.status === 'generating');
  
  useEffect(() => {
    if (!hasGeneratingItems || activeJobId) return;
    const interval = setInterval(() => { refetch(); }, 5000);
    return () => clearInterval(interval);
  }, [hasGeneratingItems, activeJobId, refetch]);

  // Check for active jobs on mount (handles page reload)
  useEffect(() => {
    const checkActiveJob = async () => {
      const { data } = await supabase
        .from('generation_jobs')
        .select('id')
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setActiveJobId(data[0].id);
      }
    };
    checkActiveJob();
  }, []);

  // Bulk generate — sends ONE call, backend self-chains
  const bulkGenerateMutation = useMutation({
    mutationFn: async (params: BulkGenerateParams) => {
      const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
        body: params,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      
      return data as { success: boolean; jobId: string };
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setActiveJobId(data.jobId);
        toast({
          title: 'Generation started',
          description: 'Processing in the background. You can close this tab — it will continue running.',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
    },
    onError: (error) => {
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
      // Reset status to 'queued' first
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({ status: 'queued', error_message: null })
        .in('id', ids);
      
      if (updateError) throw updateError;

      // Then trigger generation via the same self-chaining mechanism
      const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
        body: { queueItemIds: ids },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Retry failed');
      
      return data as { success: boolean; jobId: string };
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setActiveJobId(data.jobId);
        toast({
          title: 'Retry started',
          description: 'Retrying failed items in the background.',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
    },
    onError: (error) => {
      toast({
        title: 'Retry failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Get stale generating items
  const getStaleGeneratingItems = useCallback(() => {
    if (!queueItems) return [];
    const thresholdTime = new Date(Date.now() - STALE_THRESHOLD_MS);
    return queueItems.filter(item => 
      item.status === 'generating' && 
      new Date(item.started_at || item.created_at) < thresholdTime
    );
  }, [queueItems]);

  // Reset stale items
  const resetStaleMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('content_queue')
        .update({ status: 'failed', error_message: 'Generation timed out - manually reset' })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      toast({ title: 'Stale items reset', description: 'Items marked as failed. You can now retry them.' });
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

  // Compute generation progress from active job
  const generationProgress: GenerationProgress | null = activeJob && activeJob.status === 'processing'
    ? {
        current: (activeJob.succeeded_items || 0) + (activeJob.failed_items || 0),
        total: activeJob.total_items || 0,
      }
    : null;

  return {
    queueItems,
    isLoading,
    error,
    refetch,
    bulkGenerate: bulkGenerateMutation.mutate,
    isBulkGenerating: bulkGenerateMutation.isPending || (!!activeJobId && activeJob?.status === 'processing'),
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
    activeJobId,
  };
}
