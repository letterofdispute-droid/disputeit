import { useMemo } from 'react';
import { FileText, Link2, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useContentPlans } from '@/hooks/useContentPlans';
import { useContentQueue } from '@/hooks/useContentQueue';
import { useLinkSuggestions } from '@/hooks/useLinkSuggestions';
import { allTemplates } from '@/data/allTemplates';

export default function CoverageStats() {
  const { plans } = useContentPlans();
  const { queueItems } = useContentQueue();
  const { suggestions } = useLinkSuggestions();

  const stats = useMemo(() => {
    const totalTemplates = allTemplates.length;
    const templatesWithPlans = plans?.length || 0;
    const templatesWithoutPlans = totalTemplates - templatesWithPlans;

    const articlesGenerated = queueItems?.filter(q => 
      q.status === 'generated' || q.status === 'published'
    ).length || 0;

    const articlesPublished = queueItems?.filter(q => 
      q.status === 'published'
    ).length || 0;

    const articlesQueued = queueItems?.filter(q => 
      q.status === 'queued'
    ).length || 0;

    const linksPending = suggestions?.filter(s => s.status === 'pending').length || 0;
    const linksApplied = suggestions?.filter(s => s.status === 'applied').length || 0;

    // Calculate average articles per template
    const avgArticlesPerTemplate = templatesWithPlans > 0 
      ? ((articlesGenerated + articlesQueued) / templatesWithPlans).toFixed(1)
      : '0';

    // Coverage percentage
    const coveragePercent = Math.round((templatesWithPlans / totalTemplates) * 100);

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
    };
  }, [plans, queueItems, suggestions]);

  const statCards = [
    {
      title: 'Template Coverage',
      value: `${stats.coveragePercent}%`,
      description: `${stats.templatesWithPlans} of ${stats.totalTemplates} templates`,
      icon: LayoutGrid,
      color: 'text-blue-500',
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
      description: 'Target: 8-10 per template',
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
