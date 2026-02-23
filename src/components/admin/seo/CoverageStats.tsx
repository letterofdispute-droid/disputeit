import { useMemo } from 'react';
import { FileText, Link2, CheckCircle2, LayoutGrid, TrendingUp, Search, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useContentPlans } from '@/hooks/useContentPlans';
import { useSEOMetrics } from '@/hooks/useSEOMetrics';
import { allTemplates } from '@/data/allTemplates';
import { VALUE_TIERS, ValueTier } from '@/config/articleTypes';
import { formatDistanceToNow } from 'date-fns';

export default function CoverageStats() {
  const { plans } = useContentPlans();
  const { data: metrics } = useSEOMetrics();

  const stats = useMemo(() => {
    const totalTemplates = allTemplates.length;
    const templateSlugs = new Set(allTemplates.map((t) => t.slug));
    const templatePlans = plans?.filter((p) => templateSlugs.has(p.template_slug)) || [];
    const templatesWithPlans = templatePlans.length;

    const articlesGenerated = (metrics?.generated || 0) + (metrics?.queuePublished || 0);
    const articlesPublished = metrics?.publishedArticles || 0;
    const articlesQueued = metrics?.queued || 0;

    const linksPending = metrics?.linksPending || 0;
    const linksApplied = metrics?.linksApplied || 0;

    const tierCounts = {
      high: templatePlans.filter((p) => p.value_tier === 'high').length,
      medium: templatePlans.filter((p) => p.value_tier === 'medium').length,
      longtail: templatePlans.filter((p) => p.value_tier === 'longtail').length
    };

    const avgArticlesPerTemplate = templatesWithPlans > 0 ?
      ((articlesGenerated + articlesQueued) / templatesWithPlans).toFixed(1) : '0';

    const coveragePercent = Math.round(templatesWithPlans / totalTemplates * 100);

    const tierDistribution = Object.entries(tierCounts)
      .filter(([_, count]) => count > 0)
      .map(([tier, count]) => `${count} ${VALUE_TIERS[tier as ValueTier].name.toLowerCase()}`)
      .join(' • ');

    return {
      totalTemplates,
      templatesWithPlans,
      articlesGenerated,
      articlesPublished,
      articlesQueued,
      linksPending,
      linksApplied,
      avgArticlesPerTemplate,
      coveragePercent,
      tierDistribution,
      totalKeywords: metrics?.totalKeywords || 0,
      unusedKeywords: metrics?.unusedKeywords || 0,
      gscLastSync: metrics?.gscLastSync,
      gscTotalQueries: metrics?.gscTotalQueries || 0,
    };
  }, [plans, metrics]);

  const statCards = [
    {
      title: 'Template Coverage',
      value: `${stats.coveragePercent}%`,
      description: `${stats.templatesWithPlans} of ${stats.totalTemplates} templates`,
      icon: LayoutGrid,
      color: 'text-blue-500'
    },
    {
      title: 'Tier Distribution',
      value: stats.templatesWithPlans.toString(),
      description: stats.tierDistribution || 'No plans yet',
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    {
      title: 'Articles Published',
      value: stats.articlesPublished.toString(),
      description: `${stats.articlesQueued} queued • ${stats.articlesGenerated} generated`,
      icon: FileText,
      color: 'text-green-500'
    },
    {
      title: 'Internal Links',
      value: stats.linksApplied.toLocaleString(),
      description: `${stats.linksPending.toLocaleString()} pending review`,
      icon: Link2,
      color: 'text-orange-500'
    },
    {
      title: 'Keyword Pipeline',
      value: stats.unusedKeywords.toLocaleString(),
      description: `${stats.totalKeywords.toLocaleString()} total • ${stats.unusedKeywords} ready`,
      icon: Key,
      color: 'text-purple-500'
    },
    {
      title: 'GSC Queries',
      value: stats.gscTotalQueries.toLocaleString(),
      description: stats.gscLastSync
        ? `Synced ${formatDistanceToNow(new Date(stats.gscLastSync), { addSuffix: true })}`
        : 'Not synced yet',
      icon: Search,
      color: 'text-cyan-500'
    },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-3 sm:gap-4 sm:grid sm:grid-cols-3 min-w-[600px] sm:min-w-0">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="min-w-[160px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold mt-1 sm:text-2xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full bg-muted ${stat.color} shrink-0`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
