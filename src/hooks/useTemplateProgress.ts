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
      const { data, error } = await supabase.rpc('get_template_progress');
      
      if (error) throw error;

      const progress: Record<string, TemplateProgress> = {};
      
      for (const row of data || []) {
        progress[row.template_slug] = {
          generated: Number(row.generated),
          total: Number(row.total),
        };
      }
      
      return progress;
    },
    staleTime: 30000,
  });
}
