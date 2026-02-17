import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAutoPublish() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch auto-publish settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['auto-publish-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['auto_publish_enabled', 'auto_publish_count']);

      if (error) throw error;
      
      const map: Record<string, string> = {};
      for (const row of (data || [])) {
        map[row.key] = row.value || '';
      }
      
      return {
        enabled: map.auto_publish_enabled === 'true',
        count: parseInt(map.auto_publish_count || '5', 10),
      };
    },
  });

  // Fetch recent publish jobs
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['daily-publish-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_publish_jobs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async ({ enabled, count }: { enabled: boolean; count: number }) => {
      const upserts = [
        { key: 'auto_publish_enabled', value: String(enabled) },
        { key: 'auto_publish_count', value: String(count) },
      ];

      for (const item of upserts) {
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .eq('key', item.key)
          .single();

        if (existing) {
          await supabase
            .from('site_settings')
            .update({ value: item.value })
            .eq('key', item.key);
        } else {
          await supabase
            .from('site_settings')
            .insert(item);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-publish-settings'] });
      toast({ title: 'Auto-publish settings saved' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    },
  });

  // Trigger manual publish
  const triggerPublish = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-auto-publish', { body: {} });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Publish failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-publish-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast({ title: `Published ${data.published} articles` });
    },
    onError: (error) => {
      toast({ title: 'Publish failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings,
    settingsLoading,
    recentJobs,
    jobsLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
    triggerPublish: triggerPublish.mutate,
    isPublishing: triggerPublish.isPending,
  };
}
