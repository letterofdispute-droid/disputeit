import { useCallback } from 'react';
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

export interface LinkStatsFromDB {
  pending: number;
  approved: number;
  rejected: number;
  applied: number;
}

export function useLinkSuggestions(status?: string, categorySlug?: string, isScanRunning?: boolean) {
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
    refetchInterval: isScanRunning ? 10000 : false,
  });

  // Fetch accurate stats from DB (not limited by 200-row display cap)
  const { data: dbStats } = useQuery({
    queryKey: ['link-suggestions-stats'],
    queryFn: async (): Promise<LinkStatsFromDB> => {
      const statuses = ['pending', 'approved', 'rejected', 'applied'] as const;
      const results = await Promise.all(
        statuses.map(s =>
          supabase
            .from('link_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('status', s)
        )
      );
      return {
        pending: results[0].count || 0,
        approved: results[1].count || 0,
        rejected: results[2].count || 0,
        applied: results[3].count || 0,
      };
    },
    refetchInterval: isScanRunning ? 10000 : 30000,
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
        description: `Found ${data.totalSuggestions} link opportunities across ${data.scanned} articles`,
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

  // Update anchor text
  const updateAnchorMutation = useMutation({
    mutationFn: async ({ id, anchor_text }: { id: string; anchor_text: string }) => {
      const { error } = await supabase
        .from('link_suggestions')
        .update({ anchor_text })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({ title: 'Anchor text updated' });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({ 
        title: 'Suggestions updated',
        description: `${variables.ids.length} suggestions marked as ${variables.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
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
        description: `Applied ${data.applied} links${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
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

  // Bulk update all by status (server-side, no row limit)
  const bulkUpdateAllByStatusMutation = useMutation({
    mutationFn: async ({ currentStatus, newStatus, categorySlug }: { currentStatus: string; newStatus: string; categorySlug?: string }) => {
      const { data, error } = await supabase.rpc('bulk_update_link_status', {
        p_current_status: currentStatus,
        p_new_status: newStatus,
        p_category_slug: categorySlug || null,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count, variables) => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({
        title: 'Bulk update complete',
        description: `${count} suggestions marked as ${variables.newStatus}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Bulk update failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Delete suggestions
  const deleteSuggestionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('link_suggestions')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      toast({ title: 'Suggestions deleted' });
    },
  });

  // Bulk delete by status (server-side, no row limit)
  const bulkDeleteByStatusMutation = useMutation({
    mutationFn: async ({ status, categorySlug }: { status?: string; categorySlug?: string }) => {
      const { data, error } = await supabase.rpc('bulk_delete_link_suggestions', {
        p_status: status || null,
        p_category_slug: categorySlug || null,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['link-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['link-suggestions-stats'] });
      toast({
        title: 'Suggestions deleted',
        description: `${count} suggestions removed`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Get stats - use DB counts when available, fallback to array counts
  const getStats = useCallback(() => {
    if (dbStats) return dbStats;
    if (!suggestions) return { pending: 0, approved: 0, rejected: 0, applied: 0 };
    
    return {
      pending: suggestions.filter(s => s.status === 'pending').length,
      approved: suggestions.filter(s => s.status === 'approved').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      applied: suggestions.filter(s => s.status === 'applied').length,
    };
  }, [suggestions, dbStats]);

  // Get high-relevance pending IDs
  const getHighRelevanceIds = useCallback((threshold = 85) => {
    return suggestions?.filter(s => 
      s.status === 'pending' && (s.relevance_score || 0) >= threshold
    ).map(s => s.id) || [];
  }, [suggestions]);

  // Get approved IDs
  const getApprovedIds = useCallback(() => {
    return suggestions?.filter(s => s.status === 'approved').map(s => s.id) || [];
  }, [suggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refetch,
    scan: scanMutation.mutate,
    isScanning: scanMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    updateAnchor: updateAnchorMutation.mutate,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    applyLinks: applyLinksMutation.mutate,
    isApplyingLinks: applyLinksMutation.isPending,
    bulkUpdateAllByStatus: bulkUpdateAllByStatusMutation.mutate,
    isBulkUpdatingAll: bulkUpdateAllByStatusMutation.isPending,
    deleteSuggestions: deleteSuggestionsMutation.mutate,
    bulkDeleteByStatus: bulkDeleteByStatusMutation.mutate,
    isBulkDeleting: bulkDeleteByStatusMutation.isPending,
    getStats,
    getHighRelevanceIds,
    getApprovedIds,
  };
}
