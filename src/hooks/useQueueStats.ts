import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QueueStats {
  queued: number;
  generating: number;
  generated: number;
  published: number;
  failed: number;
  total: number;
}

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      // Fetch only status column for all items (no limit)
      const { data, error } = await supabase
        .from('content_queue')
        .select('status');
      
      if (error) throw error;

      const stats: QueueStats = {
        queued: 0,
        generating: 0,
        generated: 0,
        published: 0,
        failed: 0,
        total: 0,
      };

      for (const item of data || []) {
        stats.total++;
        switch (item.status) {
          case 'queued': stats.queued++; break;
          case 'generating': stats.generating++; break;
          case 'generated': stats.generated++; break;
          case 'published': stats.published++; break;
          case 'failed': stats.failed++; break;
        }
      }
      
      return stats;
    },
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 5000, // Poll every 5 seconds
  });
}
