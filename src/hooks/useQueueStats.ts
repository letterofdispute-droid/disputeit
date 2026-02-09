import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QueueStats {
  queued: number;
  generating: number;
  generated: number;
  published: number;
  failed: number;
  total: number;
  activeJob: {
    id: string;
    succeeded: number;
    failed: number;
    total: number;
  } | null;
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
      const [queued, generating, generated, failed, publishedResult, activeJobResult] = await Promise.all([
        countByStatus('queued'),
        countByStatus('generating'),
        countByStatus('generated'),
        countByStatus('failed'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('generation_jobs').select('id, succeeded_items, failed_items, total_items').eq('status', 'processing').order('created_at', { ascending: false }).limit(1),
      ]);

      if (publishedResult.error) throw publishedResult.error;

      let activeJob: QueueStats['activeJob'] = null;
      if (activeJobResult.data && activeJobResult.data.length > 0) {
        const job = activeJobResult.data[0];
        activeJob = {
          id: job.id,
          succeeded: job.succeeded_items,
          failed: job.failed_items,
          total: job.total_items,
        };
      }

      const stats: QueueStats = {
        queued,
        generating,
        generated,
        published: publishedResult.count || 0,
        failed,
        total: queued + generating + generated + failed,
        activeJob,
      };

      return stats;
    },
    staleTime: 10000,
    refetchInterval: 5000,
  });
}
