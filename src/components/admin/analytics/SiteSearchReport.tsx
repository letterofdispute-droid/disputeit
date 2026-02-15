import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, TrendingUp, BarChart3, MousePointerClick, LogOut as ExitIcon, Monitor } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

const SiteSearchReport = ({ events, period }: SiteSearchReportProps) => {
  const searchEvents = useMemo(() => events.filter(e => e.event_type === 'site_search'), [events]);
  const clickEvents = useMemo(() => events.filter(e => e.event_type === 'search_click'), [events]);
  const exitEvents = useMemo(() => events.filter(e => e.event_type === 'search_exit'), [events]);

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
      return { label: format(day, 'MMM d'), searches: daySearches.length, zeroResults: zeroResults.length };
    });
  }, [searchEvents, period]);

  // Click-through metrics
  const totalSearches = searchEvents.length;
  const totalClicks = clickEvents.length;
  const totalExits = exitEvents.length;
  const uniqueTerms = termRows.length;
  const totalZeroResult = zeroResultTerms.reduce((s, t) => s + t.zeroResultCount, 0);
  const zeroResultRate = totalSearches > 0 ? ((totalZeroResult / totalSearches) * 100).toFixed(1) : '0';
  const ctr = totalSearches > 0 ? ((totalClicks / totalSearches) * 100).toFixed(1) : '0';
  const abandonmentRate = totalSearches > 0 ? ((totalExits / totalSearches) * 100).toFixed(1) : '0';
  const avgTimeToClick = useMemo(() => {
    const times = clickEvents.map(e => (e.event_data as any)?.time_to_click_ms).filter(Boolean);
    if (times.length === 0) return 0;
    return Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length / 1000 * 10) / 10;
  }, [clickEvents]);

  // Result type breakdown (pie)
  const resultTypePie = useMemo(() => {
    const counts: Record<string, number> = { template: 0, article: 0, category: 0 };
    clickEvents.forEach(e => {
      const type = (e.event_data as any)?.result_type;
      if (type && counts[type] !== undefined) counts[type]++;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [clickEvents]);

  // Trigger source breakdown (pie)
  const triggerPie = useMemo(() => {
    const counts: Record<string, number> = {};
    searchEvents.forEach(e => {
      const src = (e.event_data as any)?.trigger_source || 'unknown';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [searchEvents]);

  // Top clicked results
  const topClicked = useMemo(() => {
    const map: Record<string, { title: string; type: string; slug: string; clicks: number }> = {};
    clickEvents.forEach(e => {
      const d = e.event_data as any;
      const key = `${d?.result_type}-${d?.result_slug}`;
      if (!map[key]) map[key] = { title: d?.result_title || d?.result_slug, type: d?.result_type, slug: d?.result_slug, clicks: 0 };
      map[key].clicks++;
    });
    return Object.values(map).sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  }, [clickEvents]);

  if (totalSearches === 0 && totalClicks === 0) {
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
              <p className="text-xs text-muted-foreground mt-1">Search analytics will appear once users search on the site</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard label="Total Searches" value={totalSearches} sub={`Last ${period} days`} icon={<Search className="h-4 w-4 text-muted-foreground" />} />
        <SummaryCard label="Unique Terms" value={uniqueTerms} sub="Distinct queries" icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} />
        <SummaryCard label="Click-Through Rate" value={`${ctr}%`} sub={`${totalClicks} clicks`} icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />} />
        <SummaryCard label="Avg Time to Click" value={`${avgTimeToClick}s`} sub="Search → click" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
        <SummaryCard label="Zero-Result Rate" value={`${zeroResultRate}%`} sub={`${totalZeroResult} queries`} icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} />
        <SummaryCard label="Abandonment Rate" value={`${abandonmentRate}%`} sub={`${totalExits} exits`} icon={<ExitIcon className="h-4 w-4 text-muted-foreground" />} />
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
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="searches" name="Searches" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="zeroResults" name="Zero Results" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {resultTypePie.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Clicked Result Types</CardTitle>
              <CardDescription>Templates vs articles vs categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={resultTypePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {resultTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {triggerPie.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Search Trigger Source
              </CardTitle>
              <CardDescription>How users open search (header, hero, keyboard)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={triggerPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {triggerPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Three-column: Top Terms, Top Clicked, Zero-Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Search Terms
            </CardTitle>
            <CardDescription>{termRows.length} unique terms</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                  <TableHead className="text-right">Avg Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termRows.slice(0, 20).map(row => (
                  <TableRow key={row.term}>
                    <TableCell className="font-medium">
                      {row.term}
                      {row.zeroResultCount > 0 && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">{row.zeroResultCount} zero</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.searches}</TableCell>
                    <TableCell className="text-right">{row.avgResults}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Clicked Results */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <MousePointerClick className="h-5 w-5" />
              Top Clicked Results
            </CardTitle>
            <CardDescription>Most selected search results</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {topClicked.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No click data yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClicked.map(row => (
                    <TableRow key={`${row.type}-${row.slug}`}>
                      <TableCell>
                        <span className="font-medium block truncate max-w-[180px]">{row.title}</span>
                        <Badge variant="outline" className="text-[10px] mt-1">{row.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{row.clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Zero-Result Queries */}
        <Card className={zeroResultTerms.length > 0 ? 'border-orange-500/20' : ''}>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Zero-Result Queries
            </CardTitle>
            <CardDescription>Consider adding content for these</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {zeroResultTerms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No zero-result searches — great coverage!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zeroResultTerms.slice(0, 20).map(row => (
                    <TableRow key={row.term}>
                      <TableCell className="font-medium">{row.term}</TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">{row.zeroResultCount}</TableCell>
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

// Small reusable summary card
const SummaryCard = ({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </CardContent>
  </Card>
);

export default SiteSearchReport;
