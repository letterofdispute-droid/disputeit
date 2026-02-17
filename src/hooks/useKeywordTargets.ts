import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useKeywordTargets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch keyword stats per vertical
  const { data: verticalStats, isLoading } = useQuery({
    queryKey: ['keyword-targets-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keyword_targets' as any)
        .select('vertical, is_seed, used_in_queue_id');
      
      if (error) throw error;

      const stats: Record<string, VerticalStats> = {};
      for (const row of (data as any[] || [])) {
        if (!stats[row.vertical]) {
          stats[row.vertical] = { vertical: row.vertical, total: 0, seeds: 0, used: 0, unused: 0 };
        }
        stats[row.vertical].total++;
        if (row.is_seed) stats[row.vertical].seeds++;
        if (row.used_in_queue_id) stats[row.vertical].used++;
        else stats[row.vertical].unused++;
      }

      return Object.values(stats).sort((a, b) => a.vertical.localeCompare(b.vertical));
    },
  });

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

  // Plan from keywords
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
      queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast({ title: `Planned ${data.totalPlanned} articles from keywords` });
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
    isPlanning: planMutation.isPending,
    clearKeywords: clearMutation.mutate,
  };
}
