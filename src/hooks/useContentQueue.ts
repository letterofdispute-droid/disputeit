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

export function useContentQueue(planId?: string, categoryId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

  // Bulk generate articles
  const bulkGenerateMutation = useMutation({
    mutationFn: async (params: BulkGenerateParams) => {
      const { data, error } = await supabase.functions.invoke('bulk-generate-articles', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate articles');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Batch generation complete',
        description: `Generated ${data.succeeded} articles, ${data.failed} failed`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation failed',
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
  const getStats = () => {
    if (!queueItems) return { queued: 0, generating: 0, generated: 0, published: 0, failed: 0 };
    
    return {
      queued: queueItems.filter(i => i.status === 'queued').length,
      generating: queueItems.filter(i => i.status === 'generating').length,
      generated: queueItems.filter(i => i.status === 'generated').length,
      published: queueItems.filter(i => i.status === 'published').length,
      failed: queueItems.filter(i => i.status === 'failed').length,
    };
  };

  return {
    queueItems,
    isLoading,
    error,
    refetch,
    bulkGenerate: bulkGenerateMutation.mutate,
    isBulkGenerating: bulkGenerateMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    deleteItems: deleteItemsMutation.mutate,
    getStats,
  };
}
