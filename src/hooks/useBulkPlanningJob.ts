import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ValueTier } from '@/config/articleTypes';

export interface BulkPlanningJob {
  id: string;
  category_id: string;
  category_name: string;
  value_tier: string;
  total_templates: number;
  completed_templates: number;
  failed_templates: number;
  status: 'processing' | 'completed' | 'failed';
  template_slugs: string[];
  processed_slugs: string[];
  failed_slugs: string[];
  error_messages: Record<string, string>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface StartBulkPlanParams {
  categoryId: string;
  categoryName: string;
  valueTier: ValueTier;
  templates: Array<{
    slug: string;
    name: string;
    subcategorySlug?: string;
  }>;
}

export function useBulkPlanningJob(categoryId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active job for a category (polling enabled while processing)
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['bulk-planning-job', categoryId],
    queryFn: async (): Promise<BulkPlanningJob | null> => {
      if (!categoryId) return null;
      
      // Use raw SQL query via RPC or fetch from table directly
      const { data, error } = await supabase
        .from('bulk_planning_jobs')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bulk planning job:', error);
        throw error;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as any as BulkPlanningJob | null;
    },
    enabled: !!categoryId,
    refetchInterval: (query) => {
      const job = query.state.data as BulkPlanningJob | null;
      // Poll every 2 seconds while processing, stop when done
      return job?.status === 'processing' ? 2000 : false;
    },
  });

  // Fetch all active jobs (for global progress indicator)
  const { data: allActiveJobs } = useQuery({
    queryKey: ['bulk-planning-jobs-active'],
    queryFn: async (): Promise<BulkPlanningJob[]> => {
      const { data, error } = await supabase
        .from('bulk_planning_jobs')
        .select('*')
        .eq('status', 'processing')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []) as any as BulkPlanningJob[];
    },
    refetchInterval: (query) => {
      const jobs = query.state.data as BulkPlanningJob[] | undefined;
      // Poll while any jobs are active
      return jobs && jobs.length > 0 ? 2000 : 10000;
    },
  });

  // Start a new bulk planning job
  const startBulkPlanMutation = useMutation({
    mutationFn: async (params: StartBulkPlanParams) => {
      const { data, error } = await supabase.functions.invoke('bulk-plan-category', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to start bulk planning');
      return data as { success: boolean; jobId: string; status: string; total: number };
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Bulk planning started',
        description: `Planning ${variables.templates.length} templates in background...`,
      });
      // Invalidate to start polling
      queryClient.invalidateQueries({ queryKey: ['bulk-planning-job', variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['bulk-planning-jobs-active'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to start bulk planning',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Get progress percentage
  const getProgress = (job: BulkPlanningJob | null): number => {
    if (!job || job.total_templates === 0) return 0;
    return Math.round(((job.completed_templates + job.failed_templates) / job.total_templates) * 100);
  };

  // Check if job just completed (for triggering refresh)
  const isComplete = activeJob?.status === 'completed' || activeJob?.status === 'failed';
  const isProcessing = activeJob?.status === 'processing';

  return {
    activeJob,
    jobLoading,
    allActiveJobs,
    startBulkPlan: startBulkPlanMutation.mutate,
    startBulkPlanAsync: startBulkPlanMutation.mutateAsync,
    isStarting: startBulkPlanMutation.isPending,
    getProgress,
    isComplete,
    isProcessing,
    invalidateJobs: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-planning-job'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-planning-jobs-active'] });
      queryClient.invalidateQueries({ queryKey: ['content-plans'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['template-progress'] });
    },
  };
}
