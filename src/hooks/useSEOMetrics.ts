import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SEOMetrics {
  publishedArticles: number;
  totalArticles: number;
  queued: number;
  generating: number;
  generated: number;
  queuePublished: number;
  failed: number;
  linksApplied: number;
  linksPending: number;
  linksApproved: number;
  totalKeywords: number;
  unusedKeywords: number;
  gscLastSync: string | null;
  gscTotalQueries: number;
}

export function useSEOMetrics() {
  return useQuery({
    queryKey: ['seo-metrics'],
    queryFn: async (): Promise<SEOMetrics> => {
      const { data, error } = await supabase.rpc('get_seo_metrics' as any);
      if (error) throw error;
      const d = data as any;
      return {
        publishedArticles: Number(d.publishedArticles) || 0,
        totalArticles: Number(d.totalArticles) || 0,
        queued: Number(d.queued) || 0,
        generating: Number(d.generating) || 0,
        generated: Number(d.generated) || 0,
        queuePublished: Number(d.queuePublished) || 0,
        failed: Number(d.failed) || 0,
        linksApplied: Number(d.linksApplied) || 0,
        linksPending: Number(d.linksPending) || 0,
        linksApproved: Number(d.linksApproved) || 0,
        totalKeywords: Number(d.totalKeywords) || 0,
        unusedKeywords: Number(d.unusedKeywords) || 0,
        gscLastSync: d.gscLastSync || null,
        gscTotalQueries: Number(d.gscTotalQueries) || 0,
      };
    },
    staleTime: 30000,
  });
}
