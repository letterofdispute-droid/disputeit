import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Newspaper, ExternalLink, RefreshCw, AlertTriangle,
  Shield, Building, Car, ArrowRight, Clock, Wifi
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type NewsSource = 'ftc' | 'cfpb' | 'nhtsa' | 'all';

interface NewsItem {
  id: string;
  source: string;
  title: string;
  excerpt: string | null;
  url: string;
  published_at: string | null;
  category_tags: string[] | null;
  fetched_at: string;
}

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  ftc:   { label: 'FTC', icon: Shield, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', description: 'Federal Trade Commission' },
  cfpb:  { label: 'CFPB', icon: Building, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', description: 'Consumer Financial Protection Bureau' },
  nhtsa: { label: 'NHTSA', icon: Car, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', description: 'Vehicle Safety Recalls' },
};

const CATEGORY_TO_TEMPLATE: Record<string, string> = {
  financial: '/templates/financial',
  vehicle: '/templates/vehicle',
  insurance: '/templates/insurance',
  housing: '/templates/housing',
  ecommerce: '/templates/ecommerce',
  refunds: '/templates/refunds',
};

export default function ConsumerNewsPage() {
  const [activeSource, setActiveSource] = useState<NewsSource>('all');

  const { data: newsItems, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['consumer-news', activeSource],
    queryFn: async () => {
      // First try to get cached news from DB
      let query = supabase
        .from('consumer_news_cache')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(30);

      if (activeSource !== 'all') {
        query = query.eq('source', activeSource);
      }

      const { data: cached, error: cacheError } = await query;

      // If we have recent cached data (< 6 hours old), use it
      if (!cacheError && cached && cached.length > 0) {
        const mostRecent = cached[0];
        const fetchedAt = new Date(mostRecent.fetched_at);
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        if (fetchedAt > sixHoursAgo) {
          return cached as NewsItem[];
        }
      }

      // Otherwise fetch fresh from edge function
      const { data: fresh, error: fetchError } = await supabase.functions.invoke('fetch-consumer-news', {
        body: { source: activeSource }
      });

      if (fetchError) {
        // Fall back to cached data if fetch fails
        if (cached && cached.length > 0) return cached as NewsItem[];
        throw fetchError;
      }

      return (fresh?.items || []) as NewsItem[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Consumer News Hub', url: 'https://letterofdispute.com/consumer-news' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Consumer News Hub — FTC & CFPB Alerts | Letter of Dispute"
        description="Stay current with the latest FTC enforcement actions, CFPB consumer alerts, and NHTSA vehicle recalls. Official government news that affects your consumer rights."
        canonicalPath="/consumer-news"
        breadcrumbs={breadcrumbs}
      />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Consumer News Hub</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Wifi className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">Live from Official Government Sources</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Consumer Rights News Hub
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Latest enforcement actions, consumer alerts, and safety recalls from the FTC, CFPB, and NHTSA — the agencies that protect your rights.
            </p>
          </div>
        </div>
      </section>

      {/* Source Filter */}
      <section className="bg-card border-b py-4">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Filter by source:</span>
            {(['all', 'ftc', 'cfpb', 'nhtsa'] as NewsSource[]).map((source) => (
              <button
                key={source}
                onClick={() => setActiveSource(source)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeSource === source
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {source === 'all' ? 'All Sources' : source.toUpperCase()}
                {source !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    — {SOURCE_CONFIG[source].description}
                  </span>
                )}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-auto gap-2 text-muted-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-10">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-5">
                      <Skeleton className="h-4 w-24 mb-3" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-4/5 mb-2" />
                      <Skeleton className="h-4 w-3/5" />
                    </CardContent>
                  </Card>
                ))
              ) : error ? (
                <Card className="border-destructive">
                  <CardContent className="pt-6 text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-destructive/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Could not load news</h3>
                    <p className="text-sm text-muted-foreground mb-4">Failed to fetch from government sources. Please try again.</p>
                    <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
                  </CardContent>
                </Card>
              ) : !newsItems || newsItems.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No news available</h3>
                    <p className="text-sm text-muted-foreground">Check back soon for the latest consumer protection news.</p>
                  </CardContent>
                </Card>
              ) : (
                newsItems.map((item) => {
                  const sourceConfig = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.ftc;
                  const SourceIcon = sourceConfig.icon;

                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sourceConfig.color}`}>
                              <SourceIcon className="h-3 w-3" />
                              {sourceConfig.label}
                            </span>
                            {item.published_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          {item.category_tags && item.category_tags.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.category_tags[0]}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground leading-snug mb-2">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                            {item.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Read on {item.source.toUpperCase()}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {item.category_tags && item.category_tags[0] && CATEGORY_TO_TEMPLATE[item.category_tags[0]] && (
                            <Link
                              to={CATEGORY_TO_TEMPLATE[item.category_tags[0]]}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Related templates →
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* About the Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">About These Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={key} className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    All news is pulled directly from official .gov RSS feeds and updated automatically.
                  </p>
                </CardContent>
              </Card>

              {/* Write a Letter CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-foreground mb-2">Affected by a violation?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use our AI-powered letters to assert your rights under the laws these agencies enforce.
                  </p>
                  <Button asChild variant="accent" size="sm" className="w-full gap-2">
                    <Link to="/templates">
                      Browse Letter Templates
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Free Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Free Consumer Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/state-rights" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    State Rights Lookup
                  </Link>
                  <Link to="/deadlines" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    Deadlines Calculator
                  </Link>
                  <Link to="/analyze-letter" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                    <Newspaper className="h-4 w-4 text-primary flex-shrink-0" />
                    Free Letter Analyzer
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
