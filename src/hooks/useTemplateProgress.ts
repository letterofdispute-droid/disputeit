import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateProgress {
  generated: number;
  total: number;
}

export function useTemplateProgress() {
  return useQuery({
    queryKey: ['template-progress'],
    queryFn: async () => {
      // Fetch all queue items with their plan info (no limit)
      const { data, error } = await supabase
        .from('content_queue')
        .select('plan_id, status, content_plans!inner(template_slug)');
      
      if (error) throw error;

      // Aggregate by template slug
      const progress: Record<string, TemplateProgress> = {};
      
      for (const item of data || []) {
        const templateSlug = (item.content_plans as any)?.template_slug;
        if (!templateSlug) continue;
        
        if (!progress[templateSlug]) {
          progress[templateSlug] = { generated: 0, total: 0 };
        }
        
        progress[templateSlug].total++;
        
        if (item.status === 'generated' || item.status === 'published') {
          progress[templateSlug].generated++;
        }
      }
      
      return progress;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
