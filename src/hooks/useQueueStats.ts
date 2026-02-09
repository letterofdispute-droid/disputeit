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
      // Fetch queue statuses and actual published blog post count in parallel
      const [{ data, error }, { count: publishedCount, error: publishedError }] = await Promise.all([
        supabase.from('content_queue').select('status'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      ]);
      
      if (error) throw error;
      if (publishedError) throw publishedError;

      const stats: QueueStats = {
        queued: 0,
        generating: 0,
        generated: 0,
        published: publishedCount || 0,
        failed: 0,
        total: 0,
      };

      for (const item of data || []) {
        stats.total++;
        switch (item.status) {
          case 'queued': stats.queued++; break;
          case 'generating': stats.generating++; break;
          case 'generated': stats.generated++; break;
          case 'failed': stats.failed++; break;
        }
      }
      
      return stats;
    },
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 5000, // Poll every 5 seconds
  });
}
