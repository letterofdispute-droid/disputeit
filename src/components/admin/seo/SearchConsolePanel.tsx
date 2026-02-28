import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, Search, Zap, Target, AlertTriangle, TrendingDown, Trash2 } from 'lucide-react';
import { PositionBadge, CtrIndicator } from './gsc/GscBadges';
import type { GscRow, Recommendation } from './gsc/types';
import OpportunitiesTab from './gsc/OpportunitiesTab';
import QuickWinsTab from './gsc/QuickWinsTab';
import WarningsTab from './gsc/WarningsTab';
import DecliningTab from './gsc/DecliningTab';

export default function SearchConsolePanel() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('overview');

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

  const { data: indexStatus } = useQuery({
    queryKey: ['gsc-index-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_index_status' as any)
        .select('*')
        .eq('id', 'singleton')
        .maybeSingle() as { data: any; error: any };
      if (error) throw error;
      return data as { submitted_count: number; indexed_count: number; fetched_at: string } | null;
    },
  });

  const { data: cachedRecs } = useQuery({
    queryKey: ['gsc-recommendations-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_recommendations_cache' as any)
        .select('recommendations, updated_at')
        .eq('id', 'singleton')
        .maybeSingle() as { data: any; error: any };
      if (error) throw error;
      return data ? { recommendations: data.recommendations as Recommendation, updated_at: data.updated_at as string } : null;
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['gsc-index-status'] });
    },
    onError: (err: any) => toast({ title: 'Fetch Failed', description: err.message, variant: 'destructive' }),
  });

  const recommendationsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-recommendations');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.recommendations as Recommendation;
    },
    onSuccess: async (recsData) => {
      // Persist to cache
      await supabase
        .from('gsc_recommendations_cache' as any)
        .upsert({ id: 'singleton', recommendations: recsData as any, updated_at: new Date().toISOString() } as any);
      queryClient.invalidateQueries({ queryKey: ['gsc-recommendations-cache'] });

      const counts = [
        recsData.uncoveredQueries?.length && `${recsData.uncoveredQueries.length} uncovered queries`,
        recsData.quickWins?.length && `${recsData.quickWins.length} quick wins`,
        recsData.positionOpportunities?.length && `${recsData.positionOpportunities.length} position opportunities`,
        recsData.cannibalization?.length && `${recsData.cannibalization.length} cannibalization warnings`,
      ].filter(Boolean);
      toast({
        title: 'AI Analysis Complete',
        description: counts.length ? `Found ${counts.join(', ')}.` : 'No actionable findings.',
      });
      setActiveSubTab('opportunities');
    },
    onError: (err: any) => toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('gsc_recommendations_cache' as any)
        .delete()
        .eq('id', 'singleton');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gsc-recommendations-cache'] });
      setActiveSubTab('overview');
      toast({ title: 'Analysis Cleared', description: 'Ready for a fresh scan.' });
    },
    onError: (err: any) => toast({ title: 'Clear Failed', description: err.message, variant: 'destructive' }),
  });

  const lastFetched = gscData?.[0]?.fetched_at ? new Date(gscData[0].fetched_at).toLocaleDateString() : 'Never';
  const totalClicks = gscData?.reduce((s, r) => s + r.clicks, 0) ?? 0;
  const totalImpressions = gscData?.reduce((s, r) => s + r.impressions, 0) ?? 0;
  const avgPosition = gscData?.length ? (gscData.reduce((s, r) => s + r.position, 0) / gscData.length) : 0;
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const recs = cachedRecs?.recommendations ?? undefined;
  const analysisDate = cachedRecs?.updated_at ? new Date(cachedRecs.updated_at).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Google Search Console</h2>
          <p className="text-sm text-muted-foreground">Last synced: {lastFetched}{analysisDate && ` · Analysis: ${analysisDate}`}</p>
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
          {recs && (
            <>
              <span className="text-xs text-muted-foreground self-center hidden sm:inline">
                Analyzed {analysisDate}
              </span>
              <Button onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending} variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                {clearMutation.isPending ? 'Clearing...' : 'Clear Analysis'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Indexed Pages</p>
          <p className="text-2xl font-bold">{indexStatus?.indexed_count?.toLocaleString() ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Index Coverage</p>
          <p className="text-2xl font-bold">
            {indexStatus && indexStatus.submitted_count > 0
              ? `${((indexStatus.indexed_count / indexStatus.submitted_count) * 100).toFixed(1)}%`
              : '—'}
          </p>
        </CardContent></Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview"><Search className="h-4 w-4 mr-1" />Queries</TabsTrigger>
          <TabsTrigger value="opportunities"><Target className="h-4 w-4 mr-1" />Opportunities</TabsTrigger>
          <TabsTrigger value="quickwins"><Zap className="h-4 w-4 mr-1" />Quick Wins</TabsTrigger>
          <TabsTrigger value="warnings"><AlertTriangle className="h-4 w-4 mr-1" />Warnings</TabsTrigger>
          <TabsTrigger value="declining"><TrendingDown className="h-4 w-4 mr-1" />Declining</TabsTrigger>
        </TabsList>

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

        <TabsContent value="opportunities"><OpportunitiesTab recs={recs} /></TabsContent>
        <TabsContent value="quickwins"><QuickWinsTab recs={recs} /></TabsContent>
        <TabsContent value="warnings"><WarningsTab recs={recs} /></TabsContent>
        <TabsContent value="declining"><DecliningTab /></TabsContent>
      </Tabs>
    </div>
  );
}
