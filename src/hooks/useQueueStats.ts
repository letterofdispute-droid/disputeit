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

async function countByStatus(status: string): Promise<number> {
  const { count, error } = await supabase
    .from('content_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);
  if (error) throw error;
  return count || 0;
}

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const [queued, generating, generated, failed, { count: publishedCount, error: publishedError }] = await Promise.all([
        countByStatus('queued'),
        countByStatus('generating'),
        countByStatus('generated'),
        countByStatus('failed'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      ]);

      if (publishedError) throw publishedError;

      const stats: QueueStats = {
        queued,
        generating,
        generated,
        published: publishedCount || 0,
        failed,
        total: queued + generating + generated + failed,
      };

      return stats;
    },
    staleTime: 10000,
    refetchInterval: 5000,
  });
}
