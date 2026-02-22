import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Eye, FileText, Link2 } from 'lucide-react';
import GapAnalysis from './GapAnalysis';

interface PostPerformance {
  id: string;
  title: string;
  slug: string;
  views: number;
  status: string;
  article_type: string | null;
  published_at: string | null;
  related_templates: string[] | null;
}

export default function ContentPerformance() {
  const { data: posts } = useQuery({
    queryKey: ['seo-content-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, views, status, article_type, published_at, related_templates')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PostPerformance[];
    },
  });

  const { data: linkStats } = useQuery({
    queryKey: ['seo-link-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_suggestions')
        .select('status');

      if (error) throw error;
      
      const applied = data?.filter(l => l.status === 'applied').length || 0;
      const pending = data?.filter(l => l.status === 'pending').length || 0;
      const approved = data?.filter(l => l.status === 'approved').length || 0;
      
      return { applied, pending, approved, total: data?.length || 0 };
    },
  });

  const metrics = useMemo(() => {
    if (!posts) return null;

    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;
    const withTemplates = posts.filter(p => p.related_templates && p.related_templates.length > 0).length;
    const templateLinkRate = posts.length > 0 ? Math.round((withTemplates / posts.length) * 100) : 0;

    // Group by article type
    const byType: Record<string, { count: number; views: number }> = {};
    posts.forEach(p => {
      const type = p.article_type || 'general';
      if (!byType[type]) byType[type] = { count: 0, views: 0 };
      byType[type].count++;
      byType[type].views += p.views || 0;
    });

    return {
      totalViews,
      avgViews,
      withTemplates,
      templateLinkRate,
      byType,
      topPosts: posts.slice(0, 5),
    };
  }, [posts]);

  const typeLabels: Record<string, string> = {
    'how-to': 'How-To Guides',
    'mistakes': 'Mistakes to Avoid',
    'sample': 'Sample Letters',
    'rights': 'Rights Explainers',
    'comparison': 'Comparisons',
    'checklist': 'Checklists',
    'general': 'General',
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalViews.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Across all published articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Views/Article
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgViews.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Per published article</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Template Link Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.templateLinkRate || 0}%</div>
            <p className="text-xs text-muted-foreground">{metrics?.withTemplates || 0} articles linked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Internal Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkStats?.applied || 0}</div>
            <p className="text-xs text-muted-foreground">{linkStats?.pending || 0} pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performing Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Articles</CardTitle>
            <CardDescription>By total views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.article_type && (
                        <Badge variant="secondary" className="text-xs">
                          {typeLabels[post.article_type] || post.article_type}
                        </Badge>
                      )}
                      {post.related_templates && post.related_templates.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {post.related_templates.length} templates
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{post.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
              {(!metrics?.topPosts || metrics.topPosts.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No published articles yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance by Article Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Article Type</CardTitle>
            <CardDescription>Views distribution across content types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.byType && Object.entries(metrics.byType)
                .sort((a, b) => b[1].views - a[1].views)
                .map(([type, stats]) => {
                  const maxViews = Math.max(...Object.values(metrics.byType).map(s => s.views));
                  const percent = maxViews > 0 ? (stats.views / maxViews) * 100 : 0;
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {typeLabels[type] || type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {stats.count} articles • {stats.views.toLocaleString()} views
                        </span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  );
                })}
              {!metrics?.byType || Object.keys(metrics.byType).length === 0 && (
                <p className="text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link Intelligence Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Internal Linking Health</CardTitle>
          <CardDescription>Status of AI-suggested internal links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-primary">{linkStats?.applied || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Links Applied</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-accent-foreground">{linkStats?.approved || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Approved (Pending Apply)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-muted-foreground">{linkStats?.pending || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Awaiting Review</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Gap Analysis */}
      <GapAnalysis />
    </div>
  );
}
