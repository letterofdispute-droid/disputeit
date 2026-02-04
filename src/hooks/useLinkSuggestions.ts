import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LinkSuggestion {
  id: string;
  source_post_id: string;
  target_type: string;
  target_slug: string;
  target_title: string;
  anchor_text: string;
  context_snippet: string | null;
  insert_position: number | null;
  relevance_score: number | null;
  status: string;
  applied_at: string | null;
  created_at: string;
  blog_posts?: {
    title: string;
    slug: string;
    category_slug: string;
  };
}

export function useLinkSuggestions(status?: string, categorySlug?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch link suggestions
  const { data: suggestions, isLoading, error, refetch } = useQuery({
    queryKey: ['link-suggestions', status, categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('link_suggestions')
        .select(`
          *,
          blog_posts(title, slug, category_slug)
        `)
        .order('relevance_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.limit(200);
      
      if (error) throw error;

      // Filter by category if specified
      if (categorySlug && data) {
        return data.filter((item: any) => 
          item.blog_posts?.category_slug === categorySlug
        ) as LinkSuggestion[];
      }

      return data as LinkSuggestion[];
    },
  });

  // Scan for links
  const scanMutation = useMutation({
    mutationFn: async (params: { postId?: string; categorySlug?: string; minRelevance?: number }) => {
      const { data, error } = await supabase.functions.invoke('scan-for-links', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Scan failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({
        title: 'Scan complete',
        description: `Found ${data.totalSuggestions} link opportunities`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Scan failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Update suggestion status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('link_suggestions')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
    },
  });

  // Bulk update status
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('link_suggestions')
        .update({ status })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({ title: 'Suggestions updated' });
    },
  });

  // Apply links
  const applyLinksMutation = useMutation({
    mutationFn: async (params: { 
      suggestionIds?: string[]; 
      categorySlug?: string; 
      autoApproveThreshold?: number 
    }) => {
      const { data, error } = await supabase.functions.invoke('apply-links-bulk', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Apply failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Links applied',
        description: `Applied ${data.applied} links, ${data.failed} failed`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Apply failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Get stats
  const getStats = () => {
    if (!suggestions) return { pending: 0, approved: 0, rejected: 0, applied: 0 };
    
    return {
      pending: suggestions.filter(s => s.status === 'pending').length,
      approved: suggestions.filter(s => s.status === 'approved').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      applied: suggestions.filter(s => s.status === 'applied').length,
    };
  };

  return {
    suggestions,
    isLoading,
    error,
    refetch,
    scan: scanMutation.mutate,
    isScanning: scanMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    applyLinks: applyLinksMutation.mutate,
    isApplyingLinks: applyLinksMutation.isPending,
    getStats,
  };
}
