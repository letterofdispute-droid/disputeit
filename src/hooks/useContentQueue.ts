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
  currentBatch?: number;
  totalBatches?: number;
}

// Maximum items per edge function call to prevent timeouts
const MAX_BATCH_SIZE = 3;

// Helper to chunk array into smaller arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
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
        // No limit for specific plan - need all items for accurate progress stats
      } else {
        // For global queue view, use higher limit with pagination support
        query = query.limit(1000);
      }

      const { data, error } = await query;
      
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

  // Helper to get a short failure reason from queue items for toast messages
  const getFailureHint = useCallback(() => {
    if (!queueItems) return '';
    const failed = queueItems.filter(i => i.status === 'failed');
    if (failed.length === 0) return '';
    const hasCredit = failed.some(i => i.error_message?.startsWith('CREDIT_EXHAUSTED:'));
    const hasRate = failed.some(i => i.error_message?.startsWith('RATE_LIMITED:'));
    if (hasCredit) return ' — AI credits exhausted';
    if (hasRate) return ' — rate limited';
    return '';
  }, [queueItems]);

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
  // Automatically chains multiple batches when processing more than MAX_BATCH_SIZE items
  const bulkGenerateMutation = useMutation({
    mutationFn: async (params: BulkGenerateParams) => {
      const itemIds = params.queueItemIds || [];
      const totalItems = itemIds.length;

      // Split into chunks of MAX_BATCH_SIZE to prevent edge function timeouts
      const chunks = chunkArray(itemIds, MAX_BATCH_SIZE);
      const totalBatches = chunks.length;
      
      let totalSucceeded = 0;
      let totalFailed = 0;
      let processedItems = 0;
      let bailReason: string | null = null;

      // Set initial progress
      setGenerationProgress({ 
        current: 0, 
        total: totalItems,
        currentBatch: 1,
        totalBatches
      });

      // Process each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Update progress for current batch
        setGenerationProgress({
          current: processedItems,
          total: totalItems,
          currentBatch: i + 1,
          totalBatches
        });

        console.log(`Processing batch ${i + 1}/${totalBatches} with ${chunk.length} items`);

        const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
          body: {
            ...params,
            queueItemIds: chunk,
            batchSize: chunk.length,
          },
        });

        if (error) {
          console.error(`Batch ${i + 1} failed:`, error);
          totalFailed += chunk.length;
        } else if (!data.success) {
          console.error(`Batch ${i + 1} returned error:`, data.error);
          totalFailed += chunk.length;
        } else {
          totalSucceeded += data.succeeded || 0;
          totalFailed += data.failed || 0;
          
          // Check for bail-out signal from edge function
          if (data.bailReason === 'CREDIT_EXHAUSTED' || data.bailReason === 'RATE_LIMITED') {
            bailReason = data.bailReason;
            processedItems += chunk.length;
            
            // Mark all remaining chunks as failed in DB
            const remainingIds = chunks.slice(i + 1).flat();
            if (remainingIds.length > 0) {
              const skipMsg = bailReason === 'CREDIT_EXHAUSTED' 
                ? 'CREDIT_EXHAUSTED: Skipped — AI credits exhausted.' 
                : 'RATE_LIMITED: Skipped — rate limit hit.';
              await supabase
                .from('content_queue')
                .update({ status: 'failed', error_message: skipMsg })
                .in('id', remainingIds);
              totalFailed += remainingIds.length;
            }
            
            console.log(`[BAIL_OUT] ${bailReason} — stopped after batch ${i + 1}/${totalBatches}, skipped ${remainingIds?.length || 0} remaining items`);
            break;
          }
        }

        processedItems += chunk.length;
        
        // Update progress after batch completes
        setGenerationProgress({
          current: processedItems,
          total: totalItems,
          currentBatch: i + 1,
          totalBatches
        });

        // Refetch queue to update UI between batches
        await queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      }
      
      return {
        success: true,
        succeeded: totalSucceeded,
        failed: totalFailed,
        totalBatches,
        bailReason,
      };
    },
    onSuccess: (data) => {
      setGenerationProgress(null);
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      
      if (data.bailReason) {
        const remaining = data.failed;
        const reason = data.bailReason === 'CREDIT_EXHAUSTED' 
          ? 'AI credits exhausted' 
          : 'Rate limit hit';
        toast({
          title: 'Generation paused',
          description: `${reason} after ${data.succeeded} articles. ${remaining} remaining items skipped. Top up your API credits, then retry failed items.`,
          variant: 'destructive',
        });
      } else {
        const batchInfo = data.totalBatches > 1 ? ` (${data.totalBatches} batches)` : '';
        const failureHint = data.failed > 0 ? getFailureHint() : '';
        toast({
          title: 'Batch generation complete',
          description: `Generated ${data.succeeded} articles, ${data.failed} failed${batchInfo}${failureHint}`,
          variant: data.failed > 0 ? 'destructive' : 'default',
        });
      }
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

  // Retry failed items - now uses chunked processing like bulkGenerate
  const retryFailedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log('[Retry] Starting retry for', ids.length, 'items');
      
      // First, reset status to 'queued' for failed items
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({ status: 'queued', error_message: null })
        .in('id', ids);
      
      if (updateError) {
        console.error('[Retry] Failed to reset items:', updateError);
        throw updateError;
      }
      
      console.log('[Retry] Items reset to queued, starting generation...');

      // Process in chunks like bulkGenerate does to prevent timeouts
      const chunks = chunkArray(ids, MAX_BATCH_SIZE);
      const totalBatches = chunks.length;
      let totalSucceeded = 0;
      let totalFailed = 0;
      let processedItems = 0;
      let bailReason: string | null = null;

      // Set initial progress
      setGenerationProgress({ 
        current: 0, 
        total: ids.length,
        currentBatch: 1,
        totalBatches
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        setGenerationProgress({
          current: processedItems,
          total: ids.length,
          currentBatch: i + 1,
          totalBatches
        });

        console.log(`[Retry] Processing batch ${i + 1}/${totalBatches} with ${chunk.length} items`);

        const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
          body: { queueItemIds: chunk, batchSize: chunk.length },
        });

        if (error) {
          console.error(`[Retry] Batch ${i + 1} invoke error:`, error);
          totalFailed += chunk.length;
        } else if (!data?.success) {
          console.error(`[Retry] Batch ${i + 1} returned error:`, data?.error);
          totalFailed += chunk.length;
        } else {
          console.log(`[Retry] Batch ${i + 1} completed: ${data.succeeded} succeeded, ${data.failed} failed`);
          totalSucceeded += data.succeeded || 0;
          totalFailed += data.failed || 0;
          
          // Check for bail-out signal
          if (data.bailReason === 'CREDIT_EXHAUSTED' || data.bailReason === 'RATE_LIMITED') {
            bailReason = data.bailReason;
            processedItems += chunk.length;
            
            const remainingIds = chunks.slice(i + 1).flat();
            if (remainingIds.length > 0) {
              const skipMsg = bailReason === 'CREDIT_EXHAUSTED' 
                ? 'CREDIT_EXHAUSTED: Skipped — AI credits exhausted.' 
                : 'RATE_LIMITED: Skipped — rate limit hit.';
              await supabase
                .from('content_queue')
                .update({ status: 'failed', error_message: skipMsg })
                .in('id', remainingIds);
              totalFailed += remainingIds.length;
            }
            
            console.log(`[Retry] [BAIL_OUT] ${bailReason} — stopped after batch ${i + 1}/${totalBatches}`);
            break;
          }
        }

        processedItems += chunk.length;
        
        setGenerationProgress({
          current: processedItems,
          total: ids.length,
          currentBatch: i + 1,
          totalBatches
        });

        await queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      }
      
      console.log(`[Retry] Complete: ${totalSucceeded} succeeded, ${totalFailed} failed`);
      return { 
        success: true,
        succeeded: totalSucceeded, 
        failed: totalFailed,
        totalBatches,
        bailReason,
      };
    },
    onSuccess: (data) => {
      setGenerationProgress(null);
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      
      if (data.bailReason) {
        const reason = data.bailReason === 'CREDIT_EXHAUSTED' 
          ? 'AI credits exhausted' 
          : 'Rate limit hit';
        toast({
          title: 'Retry paused',
          description: `${reason} after ${data.succeeded} articles. Remaining items skipped. Top up your API credits, then retry again.`,
          variant: 'destructive',
        });
      } else {
        const batchInfo = data.totalBatches > 1 ? ` (${data.totalBatches} batches)` : '';
        const failureHint = data.failed > 0 ? getFailureHint() : '';
        toast({
          title: 'Retry complete',
          description: `Retried ${data.succeeded} articles, ${data.failed} failed${batchInfo}${failureHint}`,
          variant: data.failed > 0 ? 'destructive' : 'default',
        });
      }
    },
    onError: (error) => {
      setGenerationProgress(null);
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
