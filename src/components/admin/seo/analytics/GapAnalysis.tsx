import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { allTemplates } from '@/data/allTemplates';
import { templateCategories } from '@/data/templateCategories';
import { useTemplateProgress } from '@/hooks/useTemplateProgress';
import { AlertTriangle, CheckCircle2, Target, TrendingUp, FileText } from 'lucide-react';

interface ContentPlan {
  id: string;
  template_slug: string;
  template_name: string;
  category_id: string;
  value_tier: string;
  target_article_count: number;
}

interface BlogPost {
  id: string;
  related_templates: string[] | null;
}

export default function GapAnalysis() {
  const { data: contentPlans } = useQuery({
    queryKey: ['gap-content-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_plans')
        .select('*');
      if (error) throw error;
      return data as ContentPlan[];
    },
  });

  // Use server-side aggregation via RPC (bypasses 1000-row limit)
  const { data: templateProgress } = useTemplateProgress();

  const { data: blogPosts } = useQuery({
    queryKey: ['gap-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, related_templates')
        .eq('status', 'published');
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const analysis = useMemo(() => {
    const plansBySlug = new Map(contentPlans?.map(p => [p.template_slug, p]) || []);

    // Count articles per template from blog_posts
    const articlesByTemplate = new Map<string, number>();
    blogPosts?.forEach(post => {
      post.related_templates?.forEach(slug => {
        articlesByTemplate.set(slug, (articlesByTemplate.get(slug) || 0) + 1);
      });
    });

    // Analyze by category
    const categoryGaps: Record<string, {
      total: number;
      withPlan: number;
      fullyConvered: number;
      partialCoverage: number;
      noCoverage: number;
      highValue: number;
      highValueCovered: number;
    }> = {};

    // Initialize categories
    templateCategories.forEach(cat => {
      categoryGaps[cat.id] = {
        total: 0,
        withPlan: 0,
        fullyConvered: 0,
        partialCoverage: 0,
        noCoverage: 0,
        highValue: 0,
        highValueCovered: 0,
      };
    });

    // Uncovered high-value templates
    const uncoveredHighValue: Array<{
      slug: string;
      name: string;
      category: string;
      articleCount: number;
    }> = [];

    // Process all templates
    allTemplates.forEach(template => {
      const catId = template.category;
      if (!categoryGaps[catId]) {
        categoryGaps[catId] = {
          total: 0,
          withPlan: 0,
          fullyConvered: 0,
          partialCoverage: 0,
          noCoverage: 0,
          highValue: 0,
          highValueCovered: 0,
        };
      }

      categoryGaps[catId].total++;

      const plan = plansBySlug.get(template.slug);
      const articleCount = articlesByTemplate.get(template.slug) || 0;

      if (plan) {
        categoryGaps[catId].withPlan++;
        // Use server-side aggregated progress from RPC
        const progress = templateProgress?.[template.slug];
        const totalProgress = progress?.generated || 0;
        
        if (totalProgress >= plan.target_article_count) {
          categoryGaps[catId].fullyConvered++;
        } else if (totalProgress > 0) {
          categoryGaps[catId].partialCoverage++;
        }

        if (plan.value_tier === 'high') {
          categoryGaps[catId].highValue++;
          if (totalProgress >= plan.target_article_count * 0.5) {
            categoryGaps[catId].highValueCovered++;
          }
        }
      } else {
        categoryGaps[catId].noCoverage++;
        
        // Check if this might be a high-value template (heuristic based on title)
        const isLikelyHighValue = template.title.toLowerCase().includes('refund') ||
          template.title.toLowerCase().includes('cancel') ||
          template.title.toLowerCase().includes('dispute') ||
          template.title.toLowerCase().includes('complaint');

        if (isLikelyHighValue && articleCount < 3) {
          uncoveredHighValue.push({
            slug: template.slug,
            name: template.title,
            category: catId,
            articleCount,
          });
        }
      }
    });

    // Calculate overall stats
    const totalTemplates = allTemplates.length;
    const templatesWithPlans = contentPlans?.length || 0;
    const coveragePercent = totalTemplates > 0 ? Math.round((templatesWithPlans / totalTemplates) * 100) : 0;

    return {
      categoryGaps,
      uncoveredHighValue: uncoveredHighValue.slice(0, 10),
      totalTemplates,
      templatesWithPlans,
      coveragePercent,
    };
  }, [contentPlans, templateProgress, blogPosts]);

  const getCategoryName = (id: string) => {
    return templateCategories.find(c => c.id === id)?.name || id;
  };

  const getHealthColor = (percent: number) => {
    if (percent >= 70) return 'text-primary';
    if (percent >= 40) return 'text-accent-foreground';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Content Plan Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.coveragePercent}%</div>
            <p className="text-sm text-muted-foreground">
              {analysis.templatesWithPlans} of {analysis.totalTemplates} templates
            </p>
            <Progress value={analysis.coveragePercent} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Uncovered Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {analysis.totalTemplates - analysis.templatesWithPlans}
            </div>
            <p className="text-sm text-muted-foreground">
              Templates without content plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              High-Value Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-foreground">
              {analysis.uncoveredHighValue.length}
            </div>
            <p className="text-sm text-muted-foreground">
              High-potential templates need content
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coverage by Category</CardTitle>
            <CardDescription>Content plan coverage across template categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(analysis.categoryGaps)
                .filter(([, stats]) => stats.total > 0)
                .sort((a, b) => {
                  const aPercent = a[1].total > 0 ? (a[1].withPlan / a[1].total) : 0;
                  const bPercent = b[1].total > 0 ? (b[1].withPlan / b[1].total) : 0;
                  return aPercent - bPercent; // Show lowest coverage first
                })
                .map(([categoryId, stats]) => {
                  const coveragePercent = stats.total > 0 
                    ? Math.round((stats.withPlan / stats.total) * 100) 
                    : 0;
                  
                  return (
                    <div key={categoryId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getCategoryName(categoryId)}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={coveragePercent >= 50 ? 'default' : 'secondary'}>
                            {stats.withPlan}/{stats.total}
                          </Badge>
                          <span className={`text-sm font-semibold ${getHealthColor(coveragePercent)}`}>
                            {coveragePercent}%
                          </span>
                        </div>
                      </div>
                      <Progress value={coveragePercent} className="h-2" />
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {stats.fullyConvered > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            {stats.fullyConvered} complete
                          </span>
                        )}
                        {stats.partialCoverage > 0 && (
                          <span>{stats.partialCoverage} in progress</span>
                        )}
                        {stats.noCoverage > 0 && (
                          <span className="text-destructive">{stats.noCoverage} uncovered</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent-foreground" />
              Priority Content Gaps
            </CardTitle>
            <CardDescription>
              High-potential templates that need content clusters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {analysis.uncoveredHighValue.map(template => (
                <div 
                  key={template.slug}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{template.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(template.category)}
                      </Badge>
                      {template.articleCount > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {template.articleCount} articles
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Create Plan
                  </Button>
                </div>
              ))}
              {analysis.uncoveredHighValue.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p>All high-value templates have content plans!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Strategy Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">🎯 Quick Wins</h4>
              <p className="text-sm text-muted-foreground">
                Focus on templates in the Refunds and Insurance categories first - 
                they have high search volume and conversion potential.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">📈 Growth Opportunity</h4>
              <p className="text-sm text-muted-foreground">
                Create "How-To" and "Sample Letter" articles for every template - 
                these article types drive the most organic traffic.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">🔗 Link Building</h4>
              <p className="text-sm text-muted-foreground">
                Ensure every article links to at least 2 related templates and 
                1 other article to maximize internal PageRank flow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
