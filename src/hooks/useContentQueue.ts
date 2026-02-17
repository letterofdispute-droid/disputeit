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
  error_message: string | null;
  created_at: string;
  parent_queue_id: string | null;
  pillar_link_anchor: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
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
  tone?: string;
  wordCount?: number;
}

export function useContentQueue(planId?: string, categoryId?: string, statusFilter?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch queue items with optional filtering
  const { data: queueItems, isLoading, error, refetch } = useQuery({
    queryKey: ['content-queue', planId, categoryId, statusFilter],
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
        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        // Server-side category filter via the joined content_plans
        if (categoryId) {
          query = query.eq('content_plans.category_id', categoryId);
        }
        query = query.limit(1000);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If categoryId is set, filter out items where the join didn't match
      if (categoryId && data) {
        return data.filter((item: any) => 
          item.content_plans?.category_id === categoryId
        ) as ContentQueueItem[];
      }

      return data as ContentQueueItem[];
    },
  });

  // Bulk generate: now just fires a single call and gets back a jobId
  const bulkGenerateMutation = useMutation({
    mutationFn: async (params: BulkGenerateParams) => {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
            body: params,
          });

          if (error) {
            const msg = error.message || 'Failed to send a request to the Edge Function';
            if (msg.includes('Failed to fetch') && attempt < 2) {
              await new Promise(r => setTimeout(r, 3000));
              continue;
            }
            throw new Error(msg);
          }
          if (!data?.success) throw new Error(data?.error || 'Failed to start generation');
          
          return data as { success: boolean; jobId: string; totalItems: number; message: string };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < 2 && lastError.message.includes('Failed to fetch')) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
        }
      }
      
      throw new Error(lastError?.message || 'Failed to connect to the server. The function may be busy - try again in a moment.');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generation-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast({
        title: 'Generation started',
        description: `Processing ${data.totalItems} articles server-side. You can close this page.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation failed to start',
        description: error instanceof Error ? error.message : 'Failed to connect. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Retry failed items: reset them to queued, then fire bulk generate
  const retryFailedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Reset failed items to queued
      const { error: updateError } = await supabase
        .from('content_queue')
        .update({ status: 'queued', error_message: null })
        .in('id', ids);
      
      if (updateError) throw updateError;

      // Fire bulk generate with these IDs
      const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
        body: { queueItemIds: ids },
      });

      if (error) throw new Error(error.message || 'Failed to start retry');
      if (!data?.success) throw new Error(data?.error || 'Failed to start retry');
      
      return data as { success: boolean; jobId: string; totalItems: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generation-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast({
        title: 'Retry started',
        description: `Retrying ${data.totalItems} articles server-side. You can close this page.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Retry failed to start',
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

  // Get failed item IDs from loaded items (for display)
  const getFailedIds = useCallback(() => {
    return queueItems?.filter(i => i.status === 'failed').map(i => i.id) || [];
  }, [queueItems]);

  // Fetch all failed IDs directly from DB (for retry/clear actions)
  const fetchAllFailedIds = useCallback(async () => {
    const { data, error } = await supabase
      .from('content_queue')
      .select('id')
      .eq('status', 'failed')
      .limit(2000);
    if (error) throw error;
    return data?.map(i => i.id) || [];
  }, []);

  // Fetch all queued IDs directly from DB (for "Generate All" action)
  const fetchAllQueuedIds = useCallback(async () => {
    const { data, error } = await supabase
      .from('content_queue')
      .select('id')
      .eq('status', 'queued')
      .limit(2000);
    if (error) throw error;
    return data?.map(i => i.id) || [];
  }, []);

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
    getFailedIds,
    fetchAllFailedIds,
    fetchAllQueuedIds,
  };
}
