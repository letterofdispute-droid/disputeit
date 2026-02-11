import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  page_path: string | null;
  session_id: string | null;
  user_id: string | null;
}

interface SiteSearchReportProps {
  events: AnalyticsEvent[];
  period: string;
}

interface SearchTermRow {
  term: string;
  searches: number;
  avgResults: number;
  zeroResultCount: number;
  locations: string[];
}

const SiteSearchReport = ({ events, period }: SiteSearchReportProps) => {
  const searchEvents = useMemo(
    () => events.filter(e => e.event_type === 'site_search'),
    [events]
  );

  // Top search terms
  const termRows = useMemo((): SearchTermRow[] => {
    const map: Record<string, { searches: number; totalResults: number; zeroCount: number; locations: Set<string> }> = {};

    searchEvents.forEach(e => {
      const data = e.event_data as any;
      const term = (data?.search_term || '').toLowerCase().trim();
      if (!term) return;

      if (!map[term]) map[term] = { searches: 0, totalResults: 0, zeroCount: 0, locations: new Set() };
      map[term].searches++;
      const count = data?.results_count ?? 0;
      map[term].totalResults += count;
      if (count === 0) map[term].zeroCount++;
      if (data?.search_location) map[term].locations.add(data.search_location);
    });

    return Object.entries(map)
      .map(([term, d]) => ({
        term,
        searches: d.searches,
        avgResults: d.searches > 0 ? Math.round(d.totalResults / d.searches) : 0,
        zeroResultCount: d.zeroCount,
        locations: Array.from(d.locations),
      }))
      .sort((a, b) => b.searches - a.searches);
  }, [searchEvents]);

  // Zero-result queries only
  const zeroResultTerms = useMemo(
    () => termRows.filter(t => t.zeroResultCount > 0).sort((a, b) => b.zeroResultCount - a.zeroResultCount),
    [termRows]
  );

  // Search volume over time
  const volumeChart = useMemo(() => {
    const daysAgo = parseInt(period);
    const days = eachDayOfInterval({ start: subDays(new Date(), daysAgo - 1), end: new Date() });
    const sampleInterval = Math.max(1, Math.ceil(days.length / 14));
    const sampled = days.filter((_, i) => i % sampleInterval === 0 || i === days.length - 1);

    return sampled.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySearches = searchEvents.filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') === dayStr);
      const zeroResults = daySearches.filter(e => (e.event_data as any)?.results_count === 0);
      return {
        label: format(day, 'MMM d'),
        searches: daySearches.length,
        zeroResults: zeroResults.length,
      };
    });
  }, [searchEvents, period]);

  // Summary metrics
  const totalSearches = searchEvents.length;
  const uniqueTerms = termRows.length;
  const totalZeroResult = zeroResultTerms.reduce((s, t) => s + t.zeroResultCount, 0);
  const zeroResultRate = totalSearches > 0 ? ((totalZeroResult / totalSearches) * 100).toFixed(1) : '0';

  if (totalSearches === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Search className="h-5 w-5" />
            Site Search Analytics
          </CardTitle>
          <CardDescription>Track what users are searching for on your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex items-center justify-center">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No search data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Search analytics will appear once users search on category pages</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalSearches}</div>
            <p className="text-xs text-muted-foreground">Last {period} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Terms</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{uniqueTerms}</div>
            <p className="text-xs text-muted-foreground">Distinct search queries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zero-Result Searches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalZeroResult}</div>
            <p className="text-xs text-muted-foreground">{zeroResultRate}% of all searches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Results/Search</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalSearches > 0
                ? Math.round(termRows.reduce((s, t) => s + t.avgResults * t.searches, 0) / totalSearches)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Templates returned per query</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Search Volume Over Time</CardTitle>
          <CardDescription>Daily searches and zero-result queries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="searches" name="Searches" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="zeroResults" name="Zero Results" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Top Terms & Zero-Result Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Search Terms
            </CardTitle>
            <CardDescription>Most popular queries ({termRows.length} unique terms)</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                  <TableHead className="text-right">Avg Results</TableHead>
                  <TableHead className="text-right">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termRows.slice(0, 25).map((row) => (
                  <TableRow key={row.term}>
                    <TableCell className="font-medium">
                      {row.term}
                      {row.zeroResultCount > 0 && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                          {row.zeroResultCount} zero
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.searches}</TableCell>
                    <TableCell className="text-right">{row.avgResults}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground truncate max-w-[120px]">
                      {row.locations[0] || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Zero-Result Queries */}
        <Card className={zeroResultTerms.length > 0 ? 'border-orange-500/20' : ''}>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Zero-Result Queries
            </CardTitle>
            <CardDescription>Searches that returned no templates - consider adding content for these</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {zeroResultTerms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No zero-result searches - great coverage!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Zero-Result Count</TableHead>
                    <TableHead className="text-right">Total Searches</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zeroResultTerms.slice(0, 25).map((row) => (
                    <TableRow key={row.term}>
                      <TableCell className="font-medium">{row.term}</TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">{row.zeroResultCount}</TableCell>
                      <TableCell className="text-right">{row.searches}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteSearchReport;
