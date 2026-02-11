import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerationJob {
  id: string;
  queue_item_ids: string[];
  total_items: number;
  succeeded_items: number;
  failed_items: number;
  status: string;
  bail_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useGenerationJob() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Poll for active job
  const { data: activeJob, isLoading } = useQuery({
    queryKey: ['generation-job-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as GenerationJob | null;
    },
    refetchInterval: (query) => {
      // Poll every 3s while job is active, every 10s otherwise
      return query.state.data ? 3000 : 10000;
    },
  });

  // Fetch last completed job for summary display (only recent, within 1 hour)
  const { data: lastCompletedJob } = useQuery({
    queryKey: ['generation-job-last'],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .in('status', ['completed', 'failed', 'cancelled'])
        .gte('completed_at', oneHourAgo)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as GenerationJob | null;
    },
    staleTime: 10000,
  });

  // Stop a running job
  const stopJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('generation_jobs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-job-active'] });
      queryClient.invalidateQueries({ queryKey: ['generation-job-last'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast({ title: 'Stopping job...', description: 'The current batch will finish, then the job will stop.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to stop job', description: error.message, variant: 'destructive' });
    },
  });

  const isRunning = !!activeJob;
  const progress = activeJob ? {
    current: activeJob.succeeded_items + activeJob.failed_items,
    total: activeJob.total_items,
    succeeded: activeJob.succeeded_items,
    failed: activeJob.failed_items,
  } : null;

  return {
    activeJob,
    lastCompletedJob,
    isRunning,
    isLoading,
    progress,
    stopJob: stopJobMutation.mutate,
    isStopping: stopJobMutation.isPending,
  };
}
