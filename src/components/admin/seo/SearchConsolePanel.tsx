import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, TrendingUp, AlertTriangle, Search, Zap, Target, Copy, ArrowUpRight, ArrowDownRight, Minus, TrendingDown } from 'lucide-react';

interface GscRow {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  fetched_at: string;
}

interface Recommendation {
  uncoveredQueries?: Array<{
    query: string; impressions: number; clicks: number; position: number;
    suggestedVertical: string; suggestedArticleType: string; suggestedTitle: string; rationale: string;
  }>;
  quickWins?: Array<{
    query: string; page: string; impressions: number; clicks: number; ctr: number; position: number;
    suggestedMetaTitle: string; suggestedMetaDescription: string; rationale: string;
  }>;
  positionOpportunities?: Array<{
    query: string; page: string; position: number; impressions: number; action: string; rationale: string;
  }>;
  cannibalization?: Array<{
    query: string; pages: string[]; action: string; rationale: string;
  }>;
}

function PositionBadge({ position }: { position: number }) {
  if (position <= 3) return <Badge className="bg-green-500/10 text-green-700 border-green-200">{position.toFixed(1)}</Badge>;
  if (position <= 10) return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">{position.toFixed(1)}</Badge>;
  if (position <= 20) return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">{position.toFixed(1)}</Badge>;
  return <Badge variant="secondary">{position.toFixed(1)}</Badge>;
}

function CtrIndicator({ ctr }: { ctr: number }) {
  const pct = (ctr * 100).toFixed(1);
  if (ctr >= 0.05) return <span className="text-green-600 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{pct}%</span>;
  if (ctr >= 0.02) return <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" />{pct}%</span>;
  return <span className="text-red-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3" />{pct}%</span>;
}

export default function SearchConsolePanel() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Fetch cached GSC data
  const { data: gscData, isLoading: gscLoading } = useQuery({
    queryKey: ['gsc-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_performance_cache' as any)
        .select('*')
        .order('impressions', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as GscRow[];
    },
  });

  // Fetch GSC data from Google
  const fetchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-gsc-data');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'GSC Data Fetched', description: `${data.totalRows} queries imported (${data.dateRange.start} to ${data.dateRange.end})` });
      queryClient.invalidateQueries({ queryKey: ['gsc-data'] });
    },
    onError: (err: any) => {
      toast({ title: 'Fetch Failed', description: err.message, variant: 'destructive' });
    },
  });

  // Get AI recommendations
  const recommendationsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-recommendations');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.recommendations as Recommendation;
    },
    onError: (err: any) => {
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
    },
  });

  const lastFetched = gscData?.[0]?.fetched_at ? new Date(gscData[0].fetched_at).toLocaleDateString() : 'Never';
  const totalClicks = gscData?.reduce((s, r) => s + r.clicks, 0) ?? 0;
  const totalImpressions = gscData?.reduce((s, r) => s + r.impressions, 0) ?? 0;
  const avgPosition = gscData?.length ? (gscData.reduce((s, r) => s + r.position, 0) / gscData.length) : 0;
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const recs = recommendationsMutation.data;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Google Search Console</h2>
          <p className="text-sm text-muted-foreground">Last synced: {lastFetched}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${fetchMutation.isPending ? 'animate-spin' : ''}`} />
            {fetchMutation.isPending ? 'Fetching...' : 'Sync GSC Data'}
          </Button>
          <Button onClick={() => recommendationsMutation.mutate()} disabled={recommendationsMutation.isPending || !gscData?.length}>
            <Zap className={`h-4 w-4 mr-2 ${recommendationsMutation.isPending ? 'animate-pulse' : ''}`} />
            {recommendationsMutation.isPending ? 'Analyzing...' : 'AI Analysis'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Clicks</p>
          <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Impressions</p>
          <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Avg. CTR</p>
          <p className="text-2xl font-bold">{(avgCtr * 100).toFixed(1)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Avg. Position</p>
          <p className="text-2xl font-bold">{avgPosition.toFixed(1)}</p>
        </CardContent></Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview"><Search className="h-4 w-4 mr-1" />Queries</TabsTrigger>
          <TabsTrigger value="opportunities"><Target className="h-4 w-4 mr-1" />Opportunities</TabsTrigger>
          <TabsTrigger value="quickwins"><Zap className="h-4 w-4 mr-1" />Quick Wins</TabsTrigger>
          <TabsTrigger value="warnings"><AlertTriangle className="h-4 w-4 mr-1" />Warnings</TabsTrigger>
          <TabsTrigger value="declining"><TrendingDown className="h-4 w-4 mr-1" />Declining</TabsTrigger>
        </TabsList>

        {/* Queries Table */}
        <TabsContent value="overview">
          {gscLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading GSC data...</CardContent></Card>
          ) : !gscData?.length ? (
            <Card><CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No GSC data yet. Click "Sync GSC Data" to pull your search performance.</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Top Queries</CardTitle><CardDescription>{gscData.length} queries loaded</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gscData.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium max-w-[300px] truncate">{row.query}</TableCell>
                        <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right"><CtrIndicator ctr={row.ctr} /></TableCell>
                        <TableCell className="text-right"><PositionBadge position={row.position} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Opportunities (uncovered queries + position opportunities) */}
        <TabsContent value="opportunities">
          {!recs ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Run "AI Analysis" to discover content opportunities from your GSC data.
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {recs.uncoveredQueries?.length ? (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" />Uncovered Queries</CardTitle>
                    <CardDescription>Queries getting impressions but you have no dedicated content for</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {recs.uncoveredQueries.map((q, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">"{q.query}"</p>
                            <p className="text-sm text-muted-foreground">{q.impressions.toLocaleString()} impressions · Position {q.position.toFixed(1)}</p>
                          </div>
                          <Badge variant="outline">{q.suggestedVertical}</Badge>
                        </div>
                        <p className="text-sm"><strong>Suggested:</strong> {q.suggestedTitle}</p>
                        <p className="text-sm text-muted-foreground">{q.rationale}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {recs.positionOpportunities?.length ? (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" />Position Opportunities</CardTitle>
                    <CardDescription>Queries close to page 1 that could rank higher with more content</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {recs.positionOpportunities.map((q, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">"{q.query}" <PositionBadge position={q.position} /></p>
                          <span className="text-sm text-muted-foreground">{q.impressions.toLocaleString()} imp.</span>
                        </div>
                        <p className="text-sm"><strong>Action:</strong> {q.action}</p>
                        <p className="text-sm text-muted-foreground">{q.rationale}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </TabsContent>

        {/* Quick Wins */}
        <TabsContent value="quickwins">
          {!recs?.quickWins?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              {recs ? 'No quick wins found.' : 'Run "AI Analysis" to find quick wins.'}
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />Quick Wins — Improve Meta Tags</CardTitle>
                <CardDescription>Pages with high impressions but low CTR. Better titles can drive immediate traffic gains.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {recs.quickWins.map((q, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">"{q.query}"</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">{q.page}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{q.impressions.toLocaleString()} imp.</p>
                        <CtrIndicator ctr={q.ctr} />
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Title</Badge>
                        <span className="text-sm font-medium">{q.suggestedMetaTitle}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          navigator.clipboard.writeText(q.suggestedMetaTitle);
                          toast({ title: 'Copied!' });
                        }}><Copy className="h-3 w-3" /></Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Desc</Badge>
                        <span className="text-sm">{q.suggestedMetaDescription}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          navigator.clipboard.writeText(q.suggestedMetaDescription);
                          toast({ title: 'Copied!' });
                        }}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{q.rationale}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Warnings (Cannibalization) */}
        <TabsContent value="warnings">
          {!recs?.cannibalization?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              {recs ? 'No cannibalization issues found.' : 'Run "AI Analysis" to check for issues.'}
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Keyword Cannibalization</CardTitle>
                <CardDescription>Multiple pages competing for the same search query</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {recs.cannibalization.map((c, i) => (
                  <div key={i} className="border border-red-200 rounded-lg p-4 space-y-2">
                    <p className="font-medium">"{c.query}"</p>
                    <div className="space-y-1">
                      {c.pages.map((p, j) => (
                        <p key={j} className="text-sm text-muted-foreground truncate">• {p}</p>
                      ))}
                    </div>
                    <p className="text-sm"><strong>Action:</strong> {c.action}</p>
                    <p className="text-sm text-muted-foreground">{c.rationale}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Declining Queries */}
        <TabsContent value="declining">
          <DecliningQueriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DecliningQueriesTab() {
  const { data: declining, isLoading } = useQuery({
    queryKey: ['gsc-declining'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_declining_queries', { min_regression: 3 });
      if (error) throw error;
      return (data ?? []) as Array<{
        query: string; page: string; previous_position: number; current_position: number;
        position_delta: number; current_impressions: number; current_clicks: number;
      }>;
    },
  });

  if (isLoading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading declining queries...</CardContent></Card>;

  if (!declining?.length) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">No declining queries found (position regression &gt; 3 spots).</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" />Declining Queries</CardTitle>
        <CardDescription>{declining.length} queries losing ranking position</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Before</TableHead>
              <TableHead className="text-right">Now</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="hidden md:table-cell">Suggested Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {declining.slice(0, 30).map((row, i) => {
              const action = row.position_delta > 10 ? 'Update content' : row.current_position > 20 ? 'Add internal links' : 'Improve meta tags';
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium max-w-[250px] truncate">{row.query}</TableCell>
                  <TableCell className="text-right"><PositionBadge position={row.previous_position} /></TableCell>
                  <TableCell className="text-right"><PositionBadge position={row.current_position} /></TableCell>
                  <TableCell className="text-right text-red-500 font-medium">+{row.position_delta.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{row.current_impressions.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">{action}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
