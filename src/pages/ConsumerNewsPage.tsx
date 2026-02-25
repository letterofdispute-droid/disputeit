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
  Shield, ArrowRight, Clock, Wifi, TrendingUp, FileText
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

// Inline SVG agency seal badges
function FTCBadge() {
  return (
    <svg viewBox="0 0 48 20" className="h-5 w-auto" aria-label="FTC">
      <rect width="48" height="20" rx="10" fill="hsl(217 91% 28%)" />
      <text x="24" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="700" letterSpacing="0.5">FTC</text>
    </svg>
  );
}

function CFPBBadge() {
  return (
    <svg viewBox="0 0 56 20" className="h-5 w-auto" aria-label="CFPB">
      <rect width="56" height="20" rx="10" fill="hsl(152 57% 30%)" />
      <text x="28" y="14" textAnchor="middle" fontSize="7.5" fill="white" fontWeight="700" letterSpacing="0.3">CFPB</text>
    </svg>
  );
}

function NHTSABadge() {
  return (
    <svg viewBox="0 0 64 20" className="h-5 w-auto" aria-label="NHTSA">
      <rect width="64" height="20" rx="10" fill="hsl(27 96% 40%)" />
      <text x="32" y="14" textAnchor="middle" fontSize="7.5" fill="white" fontWeight="700" letterSpacing="0.3">NHTSA</text>
    </svg>
  );
}

const SOURCE_CONFIG: Record<string, {
  label: string;
  Badge: React.FC;
  accentColor: string;
  borderColor: string;
  description: string;
  fullName: string;
}> = {
  ftc:   {
    label: 'FTC',
    Badge: FTCBadge,
    accentColor: 'border-l-blue-700',
    borderColor: 'border-blue-200 dark:border-blue-900',
    description: 'Federal Trade Commission',
    fullName: 'Federal Trade Commission: Enforces laws against deceptive business practices, fraud, and anticompetitive behavior.',
  },
  cfpb:  {
    label: 'CFPB',
    Badge: CFPBBadge,
    accentColor: 'border-l-green-700',
    borderColor: 'border-green-200 dark:border-green-900',
    description: 'Consumer Financial Protection Bureau',
    fullName: 'Consumer Financial Protection Bureau: Oversees banks, lenders, and financial services companies for consumer harm.',
  },
  nhtsa: {
    label: 'NHTSA',
    Badge: NHTSABadge,
    accentColor: 'border-l-orange-600',
    borderColor: 'border-orange-200 dark:border-orange-900',
    description: 'Vehicle Safety Recalls',
    fullName: 'National Highway Traffic Safety Administration: Issues vehicle safety recalls and investigates defects.',
  },
};

const CATEGORY_TO_TEMPLATE: Record<string, string> = {
  financial: '/templates/financial',
  vehicle: '/templates/vehicle',
  insurance: '/templates/insurance',
  housing: '/templates/housing',
  ecommerce: '/templates/ecommerce',
  refunds: '/templates/refunds',
};

const IMPACT_KEYWORDS = ['action', 'ban', 'recall', 'fine', 'penalty', 'lawsuit', 'settlement', 'enforcement', 'warning', 'fraud', 'scam', 'deceptive', 'illegal'];

function getImpactLevel(title: string): 'high' | 'medium' {
  const lower = title.toLowerCase();
  return IMPACT_KEYWORDS.some(kw => lower.includes(kw)) ? 'high' : 'medium';
}

export default function ConsumerNewsPage() {
  const [activeSource, setActiveSource] = useState<NewsSource>('all');

  const { data: newsItems, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['consumer-news', activeSource],
    queryFn: async () => {
      let query = supabase
        .from('consumer_news_cache')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(30);

      if (activeSource !== 'all') {
        query = query.eq('source', activeSource);
      }

      const { data: cached, error: cacheError } = await query;

      if (!cacheError && cached && cached.length > 0) {
        const mostRecent = cached[0];
        const fetchedAt = new Date(mostRecent.fetched_at);
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        if (fetchedAt > sixHoursAgo) {
          return cached as NewsItem[];
        }
      }

      const { data: fresh, error: fetchError } = await supabase.functions.invoke('fetch-consumer-news', {
        body: { source: activeSource }
      });

      if (fetchError) {
        if (cached && cached.length > 0) return cached as NewsItem[];
        throw fetchError;
      }

      return (fresh?.items || []) as NewsItem[];
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Consumer News Hub', url: 'https://letterofdispute.com/consumer-news' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Consumer News Hub | FTC &amp; CFPB Alerts | Letter of Dispute"
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
      <section className="relative bg-primary py-14 md:py-18 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-primary/90" />
        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-5">
                <Wifi className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-sm text-primary-foreground/80">Live from Official Government Sources</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4 leading-tight">
                Consumer Rights News Hub
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-xl leading-relaxed">
                Latest enforcement actions, consumer alerts, and safety recalls from the FTC, CFPB, and NHTSA - the agencies that protect your rights.
              </p>
            </div>
            {/* Agency seal SVG illustration */}
            <div className="hidden md:flex items-center justify-center gap-8">
              {[
                { color: 'hsl(217 91% 28%)', label: 'FTC', sub: 'Federal Trade Commission' },
                { color: 'hsl(152 57% 30%)', label: 'CFPB', sub: 'Consumer Financial Protection' },
                { color: 'hsl(27 96% 40%)', label: 'NHTSA', sub: 'Vehicle Safety' },
              ].map((a) => (
                <div key={a.label} className="text-center">
                  <svg viewBox="0 0 72 72" className="w-16 h-16 mx-auto mb-2">
                    <circle cx="36" cy="36" r="34" fill={a.color} opacity="0.15" stroke={a.color} strokeWidth="2" />
                    <circle cx="36" cy="36" r="28" fill={a.color} opacity="0.08" stroke={a.color} strokeWidth="1" strokeDasharray="4 2" />
                    <text x="36" y="40" textAnchor="middle" fontSize="11" fill="white" fontWeight="800">{a.label}</text>
                  </svg>
                  <p className="text-xs text-primary-foreground/70">{a.sub}</p>
                </div>
              ))}
            </div>
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
                {source === 'all' ? 'All Sources' : (
                  <span className="flex items-center gap-1.5">
                    {source.toUpperCase()}
                    <span className="opacity-70 text-xs hidden sm:inline">- {SOURCE_CONFIG[source].description}</span>
                  </span>
                )}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}
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
                  const srcKey = item.source.toLowerCase();
                  const sourceConfig = SOURCE_CONFIG[srcKey] || SOURCE_CONFIG.ftc;
                  const SourceBadge = sourceConfig.Badge;
                  const impact = getImpactLevel(item.title);

                  return (
                    <Card key={item.id}
                      className={`border-l-4 hover:shadow-md transition-shadow ${sourceConfig.accentColor}`}
                    >
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SourceBadge />
                            {item.published_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                              </span>
                            )}
                            <Badge
                              className={impact === 'high'
                                ? 'bg-destructive/10 text-destructive border-destructive/20 border text-xs'
                                : 'bg-muted text-muted-foreground border border-border text-xs'
                              }
                            >
                              {impact === 'high' ? '🔴 High Impact' : '🟡 Medium Impact'}
                            </Badge>
                          </div>
                          {item.category_tags && item.category_tags.length > 0 && (
                            CATEGORY_TO_TEMPLATE[item.category_tags[0]] ? (
                              <Link to={CATEGORY_TO_TEMPLATE[item.category_tags[0]]}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {item.category_tags[0]} templates →
                              </Link>
                            ) : (
                              <Badge variant="outline" className="text-xs">{item.category_tags[0]}</Badge>
                            )
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground leading-snug mb-2">{item.title}</h3>
                        {item.excerpt && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">{item.excerpt}</p>
                        )}
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Read on {item.source.toUpperCase()}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Why This Matters */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Why This Matters for You
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    When the <strong className="text-foreground">FTC or CFPB</strong> takes enforcement action against a company, it often means:
                  </p>
                  <ul className="space-y-2">
                    {[
                      'The practice was confirmed as illegal',
                      'The company may be required to offer refunds',
                      'Now is the best time to dispute if you were affected',
                    ].map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="accent" size="sm" className="w-full gap-2 mt-2">
                    <Link to="/templates">
                      <FileText className="h-4 w-4" />
                      Start a Dispute Letter
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* About the Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">About These Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(SOURCE_CONFIG).map(([key, config]) => {
                    const B = config.Badge;
                    return (
                      <div key={key} className="flex items-start gap-3">
                        <B />
                        <p className="text-xs text-muted-foreground leading-relaxed">{config.fullName}</p>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    All news is pulled directly from official .gov RSS feeds and updated automatically every 6 hours.
                  </p>
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
