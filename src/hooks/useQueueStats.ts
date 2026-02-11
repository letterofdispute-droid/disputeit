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
      // Use head:true + count:'exact' for each status to avoid 1000-row limit
      const [queued, generating, generated, failed, published] = await Promise.all([
        supabase.from('content_queue').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
        supabase.from('content_queue').select('*', { count: 'exact', head: true }).eq('status', 'generating'),
        supabase.from('content_queue').select('*', { count: 'exact', head: true }).eq('status', 'generated'),
        supabase.from('content_queue').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      ]);

      if (queued.error) throw queued.error;

      const stats: QueueStats = {
        queued: queued.count || 0,
        generating: generating.count || 0,
        generated: generated.count || 0,
        published: published.count || 0,
        failed: failed.count || 0,
        total: (queued.count || 0) + (generating.count || 0) + (generated.count || 0) + (failed.count || 0),
      };

      return stats;
    },
    staleTime: 10000,
    refetchInterval: 5000,
  });
}
