import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';

interface KeywordTarget {
  id: string;
  vertical: string;
  keyword: string;
  is_seed: boolean;
  column_group: string | null;
  priority: number;
  used_in_queue_id: string | null;
  created_at: string;
}

interface VerticalStats {
  vertical: string;
  total: number;
  seeds: number;
  used: number;
  unused: number;
}

interface PlanningJob {
  id: string;
  status: string;
  verticals: string[];
  current_vertical_index: number;
  completed_verticals: string[];
  failed_verticals: string[];
  total_planned: number;
  vertical_results: Record<string, any>;
  created_at: string;
}

export function useKeywordTargets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planningJobId, setPlanningJobId] = useState<string | null>(null);

  // Fetch keyword stats per vertical via server-side aggregation (no row limit)
  const { data: verticalStats, isLoading } = useQuery({
    queryKey: ['keyword-targets-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_keyword_stats' as any);
      if (error) throw error;
      return (data as any[] || []).map((row: any) => ({
        vertical: row.vertical,
        total: Number(row.total),
        seeds: Number(row.seeds),
        used: Number(row.used),
        unused: Number(row.unused),
      })) as VerticalStats[];
    },
  });

  // Poll planning job progress
  const { data: planningJob } = useQuery({
    queryKey: ['keyword-planning-job', planningJobId],
    queryFn: async () => {
      if (!planningJobId) return null;
      const { data, error } = await supabase
        .from('keyword_planning_jobs' as any)
        .select('*')
        .eq('id', planningJobId)
        .single();
      if (error) throw error;
      return data as unknown as PlanningJob;
    },
    enabled: !!planningJobId,
    refetchInterval: planningJobId ? 3000 : false,
  });

  // Auto-stop polling when job completes
  useEffect(() => {
    if (planningJob && (planningJob.status === 'completed' || planningJob.status === 'failed')) {
      queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });

      if (planningJob.status === 'completed') {
        toast({
          title: `Planned ${planningJob.total_planned} articles from ${planningJob.completed_verticals.length} verticals`,
          description: planningJob.failed_verticals.length > 0
            ? `${planningJob.failed_verticals.length} verticals had errors`
            : undefined,
        });
      } else {
        toast({ title: 'Planning failed', variant: 'destructive' });
      }

      // Keep polling for a bit then stop
      setTimeout(() => setPlanningJobId(null), 2000);
    }
  }, [planningJob?.status]);

  // Check for any active planning job on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('keyword_planning_jobs' as any)
        .select('id')
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && (data as any[]).length > 0) {
        setPlanningJobId((data as any[])[0].id);
      }
    })();
  }, []);

  // Import keywords via edge function
  const importMutation = useMutation({
    mutationFn: async (sheets: { vertical: string; keywords: { keyword: string; isSeed: boolean; columnGroup: string }[] }[]) => {
      const { data, error } = await supabase.functions.invoke('import-keywords', {
        body: { sheets, clearExisting: true },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Import failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] });
      toast({ title: `Imported ${data.totalImported} keywords (${data.totalSeeds} seeds)` });
    },
    onError: (error) => {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    },
  });

  // Plan from keywords - now creates a tracked job
  const planMutation = useMutation({
    mutationFn: async (params: { vertical?: string; allVerticals?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('plan-from-keywords', {
        body: params,
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Planning failed');
      return data;
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setPlanningJobId(data.jobId);
      }
      queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] });
    },
    onError: (error) => {
      toast({ title: 'Planning failed', description: error.message, variant: 'destructive' });
    },
  });

  // Clear keywords for a vertical
  const clearMutation = useMutation({
    mutationFn: async (vertical: string) => {
      const { error } = await supabase
        .from('keyword_targets' as any)
        .delete()
        .eq('vertical', vertical)
        .is('used_in_queue_id', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] });
      toast({ title: 'Keywords cleared' });
    },
  });

  return {
    verticalStats,
    isLoading,
    importKeywords: importMutation.mutate,
    isImporting: importMutation.isPending,
    planFromKeywords: planMutation.mutate,
    isPlanning: planMutation.isPending || (!!planningJobId && planningJob?.status === 'processing'),
    clearKeywords: clearMutation.mutate,
    planningJob: planningJobId ? planningJob : null,
  };
}
