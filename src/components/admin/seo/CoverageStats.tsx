import { useMemo } from 'react';
import { FileText, Link2, CheckCircle2, LayoutGrid, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useContentPlans } from '@/hooks/useContentPlans';
import { useQueueStats } from '@/hooks/useQueueStats';
import { useLinkSuggestions } from '@/hooks/useLinkSuggestions';
import { allTemplates } from '@/data/allTemplates';
import { VALUE_TIERS, ValueTier } from '@/config/articleTypes';

export default function CoverageStats() {
  const { plans } = useContentPlans();
  const { data: queueStats } = useQueueStats();
  const { suggestions } = useLinkSuggestions();

  const stats = useMemo(() => {
    const totalTemplates = allTemplates.length;
    const templatesWithPlans = plans?.length || 0;
    const templatesWithoutPlans = totalTemplates - templatesWithPlans;

    const articlesGenerated = (queueStats?.generated || 0) + (queueStats?.published || 0);
    const articlesPublished = queueStats?.blogPublished || 0;
    const articlesQueued = queueStats?.queued || 0;

    const linksPending = suggestions?.filter(s => s.status === 'pending').length || 0;
    const linksApplied = suggestions?.filter(s => s.status === 'applied').length || 0;

    // Calculate tier distribution
    const tierCounts = {
      high: plans?.filter(p => p.value_tier === 'high').length || 0,
      medium: plans?.filter(p => p.value_tier === 'medium').length || 0,
      longtail: plans?.filter(p => p.value_tier === 'longtail').length || 0,
    };

    // Calculate average articles per template
    const avgArticlesPerTemplate = templatesWithPlans > 0 
      ? ((articlesGenerated + articlesQueued) / templatesWithPlans).toFixed(1)
      : '0';

    // Coverage percentage
    const coveragePercent = Math.round((templatesWithPlans / totalTemplates) * 100);

    // Format tier distribution string
    const tierDistribution = Object.entries(tierCounts)
      .filter(([_, count]) => count > 0)
      .map(([tier, count]) => `${count} ${VALUE_TIERS[tier as ValueTier].name.toLowerCase()}`)
      .join(' • ');

    return {
      totalTemplates,
      templatesWithPlans,
      templatesWithoutPlans,
      articlesGenerated,
      articlesPublished,
      articlesQueued,
      linksPending,
      linksApplied,
      avgArticlesPerTemplate,
      coveragePercent,
      tierCounts,
      tierDistribution,
    };
  }, [plans, queueStats, suggestions]);

  const statCards = [
    {
      title: 'Template Coverage',
      value: `${stats.coveragePercent}%`,
      description: `${stats.templatesWithPlans} of ${stats.totalTemplates} templates`,
      icon: LayoutGrid,
      color: 'text-blue-500',
    },
    {
      title: 'Tier Distribution',
      value: stats.templatesWithPlans.toString(),
      description: stats.tierDistribution || 'No plans yet',
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
    {
      title: 'Articles Generated',
      value: stats.articlesGenerated.toString(),
      description: `${stats.articlesQueued} queued • ${stats.articlesPublished} published`,
      icon: FileText,
      color: 'text-green-500',
    },
    {
      title: 'Avg Articles/Template',
      value: stats.avgArticlesPerTemplate,
      description: 'Target: 5-10 per template',
      icon: CheckCircle2,
      color: 'text-purple-500',
    },
    {
      title: 'Internal Links',
      value: stats.linksApplied.toString(),
      description: `${stats.linksPending} pending review`,
      icon: Link2,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={index === statCards.length - 1 ? 'col-span-2 lg:col-span-1' : ''}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-full bg-muted ${stat.color} shrink-0`}>
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
