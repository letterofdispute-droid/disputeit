import { useQuery } from '@tanstack/react-query';
import { Users, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TemplateSocialProofProps {
  templateSlug: string;
  variant?: 'light' | 'dark';
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString();
}

const TemplateSocialProof = ({ templateSlug, variant = 'dark' }: TemplateSocialProofProps) => {
  const { data: stats } = useQuery({
    queryKey: ['template-stats', templateSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_stats' as any)
        .select('usage_count, satisfaction_score, total_votes')
        .eq('template_slug', templateSlug)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { usage_count: number; satisfaction_score: number; total_votes: number } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!stats) return null;

  const isDark = variant === 'dark';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-4 text-sm ${isDark ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="font-medium">{formatCount(stats.usage_count)}</span> letters created
            </span>
            <span className={`w-px h-4 ${isDark ? 'bg-primary-foreground/30' : 'bg-border'}`} />
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-medium">{Math.round(stats.satisfaction_score)}%</span> satisfaction
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          <p className="text-xs">Based on feedback from verified purchasers. Only users who complete a purchase can submit a rating.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TemplateSocialProof;
