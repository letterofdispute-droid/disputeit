import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, Eye, DollarSign, Loader2, TrendingUp, ShoppingCart, Percent, Filter, Route, MapPin, Globe, Megaphone, ArrowUpRight, ArrowDownRight, Minus, GitCompareArrows, Search } from 'lucide-react';
import SiteSearchReport from '@/components/admin/analytics/SiteSearchReport';
import ExportButton from '@/components/admin/export/ExportButton';
import UTMLinkBuilder from '@/components/admin/analytics/UTMLinkBuilder';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  page_path: string | null;
  session_id: string | null;
  user_id: string | null;
}

interface Purchase {
  id: string;
  amount_cents: number;
  purchase_type: string;
  template_slug: string;
  status: string;
  created_at: string;
}

interface DayData {
  date: string;
  label: string;
  pageViews: number;
  lettersGenerated: number;
  templateViews: number;
  signups: number;
}

interface CategoryData {
  name: string;
  value: number;
  percent: number;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Campaign Performance component
const CampaignPerformance = ({ events, purchases, formatCurrency }: { events: AnalyticsEvent[]; purchases: Purchase[]; formatCurrency: (v: number) => string }) => {
  const campaignData = useMemo(() => {
    // Build a map of session_id -> campaign name (from first/last touch UTM data)
    const sessionCampaigns: Record<string, string> = {};
    const campaignStats: Record<string, { clicks: number; sessions: Set<string>; conversions: number; revenue: number }> = {};

    events.forEach(e => {
      const data = e.event_data as any;
      const campaign = data?.last_touch?.campaign || data?.first_touch?.campaign;
      if (!campaign) return;

      if (e.session_id) {
        sessionCampaigns[e.session_id] = campaign;
      }

      if (!campaignStats[campaign]) {
        campaignStats[campaign] = { clicks: 0, sessions: new Set(), conversions: 0, revenue: 0 };
      }

      if (e.event_type === 'page_view') {
        campaignStats[campaign].clicks++;
      }
      if (e.session_id) {
        campaignStats[campaign].sessions.add(e.session_id);
      }
    });

    // Match conversions: checkout_completed events with a campaign
    events.filter(e => e.event_type === 'checkout_completed').forEach(e => {
      const data = e.event_data as any;
      const campaign = data?.last_touch?.campaign || data?.first_touch?.campaign;
      if (campaign && campaignStats[campaign]) {
        campaignStats[campaign].conversions++;
        campaignStats[campaign].revenue += (data?.amount || 0);
      }
    });

    // Also attribute purchases to campaigns via session matching
    const purchaseSessions = events.filter(e => e.event_type === 'checkout_completed');
    purchaseSessions.forEach(e => {
      if (e.session_id && sessionCampaigns[e.session_id]) {
        const campaign = sessionCampaigns[e.session_id];
        const data = e.event_data as any;
        // Only count if not already counted above
        if (!data?.last_touch?.campaign && !data?.first_touch?.campaign) {
          if (campaignStats[campaign]) {
            campaignStats[campaign].conversions++;
          }
        }
      }
    });

    return Object.entries(campaignStats)
      .map(([name, stats]) => ({
        name,
        clicks: stats.clicks,
        sessions: stats.sessions.size,
        conversions: stats.conversions,
        revenue: stats.revenue,
        conversionRate: stats.sessions.size > 0 ? (stats.conversions / stats.sessions.size) * 100 : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [events]);

  if (campaignData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>Track clicks, conversions and revenue per UTM campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] flex items-center justify-center">
            <div className="text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No campaign data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a campaign link below and share it to start tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Campaign Performance
        </CardTitle>
        <CardDescription>Clicks, conversions and revenue per UTM campaign</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Page Views</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">Conv. Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignData.map((campaign) => (
              <TableRow key={campaign.name}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell className="text-right">{campaign.sessions}</TableCell>
                <TableCell className="text-right">{campaign.clicks}</TableCell>
                <TableCell className="text-right">{campaign.conversions}</TableCell>
                <TableCell className="text-right">{campaign.conversionRate.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.revenue / 100)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [letterCount, setLetterCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparisonEvents, setComparisonEvents] = useState<AnalyticsEvent[]>([]);
  const [comparisonPurchases, setComparisonPurchases] = useState<Purchase[]>([]);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  // Fetch comparison period data (the previous equivalent period)
  useEffect(() => {
    if (!compareEnabled) {
      setComparisonEvents([]);
      setComparisonPurchases([]);
      return;
    }
    const fetchComparison = async () => {
      setIsComparisonLoading(true);
      const daysAgo = parseInt(period);
      const compEnd = startOfDay(subDays(new Date(), daysAgo));
      const compStart = startOfDay(subDays(new Date(), daysAgo * 2));

      try {
        const [eventsRes, purchasesRes] = await Promise.all([
          supabase.from('analytics_events').select('*')
            .gte('created_at', compStart.toISOString())
            .lt('created_at', compEnd.toISOString())
            .order('created_at', { ascending: false }),
          supabase.from('letter_purchases')
            .select('id, amount_cents, purchase_type, template_slug, status, created_at')
            .gte('created_at', compStart.toISOString())
            .lt('created_at', compEnd.toISOString())
            .order('created_at', { ascending: false }),
        ]);
        setComparisonEvents(eventsRes.data || []);
        setComparisonPurchases(purchasesRes.data || []);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setIsComparisonLoading(false);
      }
    };
    fetchComparison();
  }, [compareEnabled, period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const daysAgo = parseInt(period);
    const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();

    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      const { data: purchasesData, error: purchasesError } = await supabase
        .from('letter_purchases')
        .select('id, amount_cents, purchase_type, template_slug, status, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (!purchasesError) setPurchases(purchasesData || []);

      const { count: profileCount, error: profileError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      if (!profileError) setUserCount(profileCount || 0);

      const { count: lettersCount, error: lettersError } = await supabase
        .from('user_letters')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      if (!lettersError) setLetterCount(lettersCount || 0);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use analytics_events consistently; only fall back to DB counts when events are empty
  const metrics = useMemo(() => {
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    const templateViews = events.filter(e => e.event_type === 'template_view').length;
    const lettersGenerated = events.filter(e => e.event_type === 'letter_generated').length;
    const signups = events.filter(e => e.event_type === 'user_signup').length;

    return {
      pageViews,
      templateViews,
      lettersGenerated: lettersGenerated || letterCount,
      signups: signups || userCount,
      // Track source for display
      signupsSource: signups > 0 ? 'events' : 'profiles',
      lettersSource: lettersGenerated > 0 ? 'events' : 'db',
    };
  }, [events, letterCount, userCount]);

  const revenueMetrics = useMemo(() => {
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    const paidPurchases = completedPurchases.filter(p => p.amount_cents > 0);
    const creditRedemptions = completedPurchases.filter(p => p.amount_cents === 0);
    const refundedPurchases = purchases.filter(p => p.status === 'refunded');
    
    const totalRevenue = paidPurchases.reduce((sum, p) => sum + p.amount_cents, 0);
    const refundedAmount = refundedPurchases.reduce((sum, p) => sum + p.amount_cents, 0);
    const netRevenue = totalRevenue - refundedAmount;
    const paidOrderCount = paidPurchases.length;
    const averageOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;
    
    const conversionRate = metrics.templateViews > 0 
      ? (completedPurchases.length / metrics.templateViews) * 100 
      : 0;

    return {
      totalRevenue,
      netRevenue,
      refundedAmount,
      orderCount: paidOrderCount,
      creditRedemptions: creditRedemptions.length,
      averageOrderValue,
      conversionRate,
    };
  }, [purchases, metrics.templateViews]);

  const revenueChartData = useMemo(() => {
    const daysAgo = parseInt(period);
    const days = eachDayOfInterval({
      start: subDays(new Date(), daysAgo - 1),
      end: new Date(),
    });

    const sampleInterval = Math.ceil(days.length / 14);
    const sampledDays = days.filter((_, index) => index % sampleInterval === 0 || index === days.length - 1);

    return sampledDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayPurchases = purchases.filter(p => 
        format(parseISO(p.created_at), 'yyyy-MM-dd') === dayStr && p.status === 'completed'
      );
      const revenue = dayPurchases.reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      return { date: dayStr, label: format(day, 'MMM d'), revenue, orders: dayPurchases.length };
    });
  }, [purchases, period]);

  const purchaseTypeData = useMemo(() => {
    const completedPurchases = purchases.filter(p => p.status === 'completed' && p.amount_cents > 0);
    const creditRedemptions = purchases.filter(p => p.status === 'completed' && p.amount_cents === 0);
    const pdfOnly = completedPurchases.filter(p => p.purchase_type === 'pdf_only' || p.purchase_type === 'pdf-only');
    const pdfEdit = completedPurchases.filter(p => p.purchase_type === 'pdf_edit' || p.purchase_type === 'pdf-editable');

    return [
      { name: 'PDF Only', value: pdfOnly.reduce((s, p) => s + p.amount_cents, 0) / 100, count: pdfOnly.length },
      { name: 'PDF + Edit', value: pdfEdit.reduce((s, p) => s + p.amount_cents, 0) / 100, count: pdfEdit.length },
      { name: 'Credit Redemptions', value: 0, count: creditRedemptions.length },
    ];
  }, [purchases]);

  const topTemplates = useMemo(() => {
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    const templateMap: Record<string, { revenue: number; count: number }> = {};
    completedPurchases.forEach(p => {
      if (!templateMap[p.template_slug]) templateMap[p.template_slug] = { revenue: 0, count: 0 };
      templateMap[p.template_slug].revenue += p.amount_cents;
      templateMap[p.template_slug].count += 1;
    });
    return Object.entries(templateMap)
      .map(([slug, data]) => ({
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        revenue: data.revenue / 100,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [purchases]);

  // Activity chart data using Recharts BarChart
  const chartData = useMemo(() => {
    const daysAgo = parseInt(period);
    const days = eachDayOfInterval({
      start: subDays(new Date(), daysAgo - 1),
      end: new Date(),
    });
    const sampleInterval = Math.ceil(days.length / 10);
    const sampledDays = days.filter((_, index) => index % sampleInterval === 0 || index === days.length - 1);

    return sampledDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEvents = events.filter(e => format(parseISO(e.created_at), 'yyyy-MM-dd') === dayStr);
      return {
        date: dayStr,
        label: format(day, 'MMM d'),
        'Page Views': dayEvents.filter(e => e.event_type === 'page_view').length,
        'Template Views': dayEvents.filter(e => e.event_type === 'template_view').length,
      };
    });
  }, [events, period]);

  const categoryData = useMemo((): CategoryData[] => {
    const categoryEvents = events.filter(e => e.event_type === 'template_view' || e.event_type === 'letter_generated');
    const categoryMap: Record<string, number> = {};
    categoryEvents.forEach(e => {
      const category = (e.event_data as any)?.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0) || 1;
    const categories = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value, percent: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return categories.length > 0 ? categories : [{ name: 'No data yet', value: 0, percent: 0 }];
  }, [events]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const hasActivityData = events.length > 0;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your platform performance & revenue</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportButton exportType="analytics" showDatePicker label="Export" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1">
            <Search className="h-3 w-3" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(revenueMetrics.totalRevenue / 100)}</div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{revenueMetrics.orderCount}</div>
                <p className="text-xs text-muted-foreground">Completed purchases</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(revenueMetrics.averageOrderValue / 100)}</div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{revenueMetrics.conversionRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">Views → Purchases</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Revenue Over Time</CardTitle>
              <CardDescription>Daily revenue for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Type & Top Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Purchase Type Breakdown</CardTitle>
                <CardDescription>Revenue by product type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={purchaseTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ value }) => `${formatCurrency(value)}`}>
                        {purchaseTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _: string, props: any) => [`${formatCurrency(value)} (${props.payload.count} orders)`, props.payload.name]}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Top Templates by Revenue</CardTitle>
                <CardDescription>Best performing templates</CardDescription>
              </CardHeader>
              <CardContent>
                {topTemplates.length > 0 ? (
                  <div className="space-y-4">
                    {topTemplates.map((template, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate max-w-[60%]">{template.name}</span>
                          <span className="text-sm text-muted-foreground">{formatCurrency(template.revenue)} ({template.count})</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(template.revenue / (topTemplates[0]?.revenue || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {revenueMetrics.refundedAmount > 0 && (
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Refunded Amount</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(revenueMetrics.refundedAmount / 100)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(revenueMetrics.netRevenue / 100)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          {/* Compare Toggle */}
          <div className="flex items-center gap-3">
            <Switch id="compare-toggle" checked={compareEnabled} onCheckedChange={setCompareEnabled} />
            <Label htmlFor="compare-toggle" className="text-sm font-medium cursor-pointer">
              Compare with previous {period} days
            </Label>
            {isComparisonLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <FunnelTab
            events={events}
            purchases={purchases}
            period={period}
            formatCurrency={formatCurrency}
            comparisonEvents={compareEnabled ? comparisonEvents : undefined}
            comparisonPurchases={compareEnabled ? comparisonPurchases : undefined}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Letters Generated</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.lettersGenerated.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Last {period} days{metrics.lettersSource === 'db' ? ' (from records)' : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.signups.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Last {period} days{metrics.signupsSource === 'profiles' ? ' (from profiles)' : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Template Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.templateViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.pageViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart - now using Recharts BarChart */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Activity Overview</CardTitle>
                <CardDescription>Page views and template views over time</CardDescription>
              </CardHeader>
              <CardContent>
                {hasActivityData ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Bar dataKey="Page Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Template Views" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No activity data yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Events will appear as users interact with the site</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Category Distribution</CardTitle>
                <CardDescription>Activity by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{category.name}</span>
                        <span className="text-sm text-muted-foreground">{category.value} ({category.percent}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${category.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Funnel - fixed to not mix data sources */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Activity Funnel</CardTitle>
              <CardDescription>User journey from page view to letter generation</CardDescription>
            </CardHeader>
            <CardContent>
              {hasActivityData ? (
                <div className="space-y-3">
                  {[
                    { label: 'Page Views', value: metrics.pageViews, color: 'bg-muted-foreground/30' },
                    { label: 'Template Views', value: metrics.templateViews, color: 'bg-primary/60' },
                    { label: 'Letters Generated', value: metrics.lettersGenerated, color: 'bg-primary' },
                  ].map((step, i, arr) => {
                    const maxVal = arr[0].value || 1;
                    const percent = (step.value / maxVal) * 100;
                    return (
                      <div key={step.label}>
                        <div className="flex items-center gap-4">
                          <div className="w-36 text-sm font-medium text-right text-foreground shrink-0">{step.label}</div>
                          <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                            <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(percent, 2)}%` }} />
                          </div>
                          <div className="w-16 text-right shrink-0">
                            <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No funnel data yet - activity will appear as events are tracked</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          {/* Campaign Performance Table */}
          <CampaignPerformance events={events} purchases={purchases} formatCurrency={formatCurrency} />
          <UTMLinkBuilder />
        </TabsContent>

        {/* Site Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <SiteSearchReport events={events} period={period} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Helper: compute funnel steps from events + purchases ──────────────────
const computeFunnelSteps = (events: AnalyticsEvent[], purchases: Purchase[]) => {
  const pageViews = events.filter(e => e.event_type === 'page_view').length;
  const templateViews = events.filter(e => e.event_type === 'template_view').length;
  const formStarts = events.filter(e => e.event_type === 'form_started').length;
  const formCompletes = events.filter(e => e.event_type === 'form_completed').length;
  const checkoutStarts = events.filter(e => e.event_type === 'checkout_initiated').length;
  const paidPurchases = purchases.filter(p => p.status === 'completed' && p.amount_cents > 0);

  const steps = [
    { label: 'Page Views', value: pageViews, color: 'bg-muted-foreground/30' },
    { label: 'Template Views', value: templateViews, color: 'bg-primary/40' },
    { label: 'Form Started', value: formStarts, color: 'bg-primary/60' },
    { label: 'Form Completed', value: formCompletes, color: 'bg-primary/80' },
    { label: 'Checkout Opened', value: checkoutStarts, color: 'bg-primary' },
    { label: 'Paid Orders', value: paidPurchases.length, color: 'bg-accent' },
  ];

  const maxVal = steps[0].value || 1;
  return steps.map((s, i) => ({
    ...s,
    percent: i === 0 ? 100 : ((s.value / maxVal) * 100),
    dropoffRate: i === 0 ? null : steps[i - 1].value > 0
      ? parseFloat(((1 - s.value / steps[i - 1].value) * 100).toFixed(1))
      : null,
    dropoffLabel: i === 0 ? null : `${steps[i - 1].label} → ${s.label}`,
    retained: i === 0 ? null : steps[i - 1].value > 0
      ? parseFloat(((s.value / steps[i - 1].value) * 100).toFixed(1))
      : null,
  }));
};

// ─── Funnel Tab ─────────────────────────────────────────────────────────────────
const FunnelTab = ({ 
  events, purchases, period, formatCurrency, comparisonEvents, comparisonPurchases
}: { 
  events: AnalyticsEvent[];
  purchases: Purchase[];
  period: string;
  formatCurrency: (v: number) => string;
  comparisonEvents?: AnalyticsEvent[];
  comparisonPurchases?: Purchase[];
}) => {
  const hasComparison = !!comparisonEvents && !!comparisonPurchases;
  // Conversion funnel
  const funnelData = useMemo(() => computeFunnelSteps(events, purchases), [events, purchases]);
  const comparisonFunnelData = useMemo(() => 
    hasComparison ? computeFunnelSteps(comparisonEvents!, comparisonPurchases!) : null,
    [hasComparison, comparisonEvents, comparisonPurchases]
  );

  // Session Explorer: group events by session_id
  const sessionPaths = useMemo(() => {
    const sessionMap: Record<string, AnalyticsEvent[]> = {};
    events.forEach(e => {
      const sid = e.session_id;
      if (!sid) return;
      if (!sessionMap[sid]) sessionMap[sid] = [];
      sessionMap[sid].push(e);
    });

    return Object.entries(sessionMap)
      .map(([sessionId, sessionEvents]) => {
        const sorted = [...sessionEvents].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const entryPage = sorted[0]?.page_path || '/';
        const exitPage = sorted[sorted.length - 1]?.page_path || '/';
        const hasPurchase = sorted.some(e => e.event_type === 'checkout_completed');
        const duration = sorted.length > 1 
          ? Math.round((new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime()) / 1000)
          : 0;
        
        return {
          sessionId: sessionId.slice(0, 8),
          entryPage,
          exitPage,
          eventCount: sorted.length,
          hasPurchase,
          duration,
          timestamp: sorted[0].created_at,
          events: sorted,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [events]);

  // Top user paths (sequences of page views per session)
  const topPaths = useMemo(() => {
    const sessionMap: Record<string, string[]> = {};
    events
      .filter(e => e.event_type === 'page_view')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach(e => {
        if (!e.session_id) return;
        if (!sessionMap[e.session_id]) sessionMap[e.session_id] = [];
        const path = e.page_path || '/';
        // Avoid consecutive duplicates
        const arr = sessionMap[e.session_id];
        if (arr[arr.length - 1] !== path) arr.push(path);
      });

    // Truncate paths to max 5 steps for readability
    const pathCountMap: Record<string, number> = {};
    Object.values(sessionMap).forEach(pages => {
      const truncated = pages.slice(0, 5);
      const key = truncated.join(' → ');
      pathCountMap[key] = (pathCountMap[key] || 0) + 1;
    });

    return Object.entries(pathCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, count }));
  }, [events]);

  // Attribution data
  const attributionData = useMemo(() => {
    const firstTouchMap: Record<string, number> = {};
    const lastTouchMap: Record<string, number> = {};
    const sessionsWithAttribution = new Set<string>();

    events.forEach(e => {
      const data = e.event_data as any;
      if (!data) return;

      const ft = data.first_touch?.channel;
      const lt = data.last_touch?.channel;
      const sid = e.session_id;

      // Count unique sessions per channel
      if (ft && sid && !sessionsWithAttribution.has(`ft-${sid}`)) {
        firstTouchMap[ft] = (firstTouchMap[ft] || 0) + 1;
        sessionsWithAttribution.add(`ft-${sid}`);
      }
      if (lt && sid && !sessionsWithAttribution.has(`lt-${sid}`)) {
        lastTouchMap[lt] = (lastTouchMap[lt] || 0) + 1;
        sessionsWithAttribution.add(`lt-${sid}`);
      }
    });

    const toChartData = (map: Record<string, number>) =>
      Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
      firstTouch: toChartData(firstTouchMap),
      lastTouch: toChartData(lastTouchMap),
    };
  }, [events]);

  // Attribution table (combined view)
  const attributionTable = useMemo(() => {
    const channels = new Set<string>();
    attributionData.firstTouch.forEach(d => channels.add(d.name));
    attributionData.lastTouch.forEach(d => channels.add(d.name));

    const ftMap = Object.fromEntries(attributionData.firstTouch.map(d => [d.name, d.value]));
    const ltMap = Object.fromEntries(attributionData.lastTouch.map(d => [d.name, d.value]));

    return Array.from(channels).map(channel => ({
      channel,
      firstTouch: ftMap[channel] || 0,
      lastTouch: ltMap[channel] || 0,
    })).sort((a, b) => b.firstTouch - a.firstTouch);
  }, [attributionData]);

  // Top landing pages
  const topPages = useMemo(() => {
    const pageMap: Record<string, number> = {};
    events.filter(e => e.event_type === 'page_view').forEach(e => {
      const path = e.page_path || '/';
      pageMap[path] = (pageMap[path] || 0) + 1;
    });
    return Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }));
  }, [events]);

  // Template conversion rates
  const templateConversions = useMemo(() => {
    const viewMap: Record<string, number> = {};
    const purchaseMap: Record<string, number> = {};
    events.filter(e => e.event_type === 'template_view').forEach(e => {
      const slug = (e.event_data as any)?.templateSlug || 'unknown';
      viewMap[slug] = (viewMap[slug] || 0) + 1;
    });
    purchases.filter(p => p.status === 'completed').forEach(p => {
      purchaseMap[p.template_slug] = (purchaseMap[p.template_slug] || 0) + 1;
    });
    return Object.entries(viewMap)
      .map(([slug, views]) => ({
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        views, purchases: purchaseMap[slug] || 0,
        rate: views > 0 ? ((purchaseMap[slug] || 0) / views * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8);
  }, [events, purchases]);

  // Conversion-specific attribution: first-touch & last-touch for sessions that led to a purchase
  const conversionAttribution = useMemo(() => {
    // Find session IDs that have a checkout_completed event
    const convertedSessionIds = new Set<string>();
    events.forEach(e => {
      if (e.event_type === 'checkout_completed' && e.session_id) {
        convertedSessionIds.add(e.session_id);
      }
    });

    // Build per-conversion detail rows
    const conversionDetails: Array<{
      sessionId: string;
      template: string;
      amount: number;
      date: string;
      firstTouch: { channel: string; source: string | null; medium: string | null; campaign: string | null };
      lastTouch: { channel: string; source: string | null; medium: string | null; campaign: string | null };
    }> = [];

    // For each converted session, find attribution from the earliest event in that session
    const sessionFirstEvent: Record<string, AnalyticsEvent> = {};
    const sessionLastEvent: Record<string, AnalyticsEvent> = {};
    const sessionCheckout: Record<string, AnalyticsEvent> = {};

    events.forEach(e => {
      if (!e.session_id || !convertedSessionIds.has(e.session_id)) return;
      const sid = e.session_id;
      if (!sessionFirstEvent[sid] || new Date(e.created_at) < new Date(sessionFirstEvent[sid].created_at)) {
        sessionFirstEvent[sid] = e;
      }
      if (!sessionLastEvent[sid] || new Date(e.created_at) > new Date(sessionLastEvent[sid].created_at)) {
        sessionLastEvent[sid] = e;
      }
      if (e.event_type === 'checkout_completed') {
        sessionCheckout[sid] = e;
      }
    });

    convertedSessionIds.forEach(sid => {
      const firstEvt = sessionFirstEvent[sid];
      const checkoutEvt = sessionCheckout[sid];
      if (!firstEvt || !checkoutEvt) return;

      const firstData = firstEvt.event_data as any;
      const checkoutData = checkoutEvt.event_data as any;

      const ft = firstData?.first_touch || { channel: 'Direct', source: null, medium: null, campaign: null };
      const lt = firstData?.last_touch || checkoutData?.last_touch || { channel: 'Direct', source: null, medium: null, campaign: null };

      conversionDetails.push({
        sessionId: sid.slice(0, 8),
        template: (checkoutData?.templateSlug || '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        amount: (checkoutData?.amount || 0),
        date: checkoutEvt.created_at,
        firstTouch: ft,
        lastTouch: lt,
      });
    });

    conversionDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Summary: aggregate first-touch and last-touch channels for conversions only
    const ftChannels: Record<string, { count: number; revenue: number }> = {};
    const ltChannels: Record<string, { count: number; revenue: number }> = {};

    conversionDetails.forEach(c => {
      const ftCh = c.firstTouch.channel || 'Direct';
      const ltCh = c.lastTouch.channel || 'Direct';
      if (!ftChannels[ftCh]) ftChannels[ftCh] = { count: 0, revenue: 0 };
      ftChannels[ftCh].count++;
      ftChannels[ftCh].revenue += c.amount;
      if (!ltChannels[ltCh]) ltChannels[ltCh] = { count: 0, revenue: 0 };
      ltChannels[ltCh].count++;
      ltChannels[ltCh].revenue += c.amount;
    });

    const allChannels = new Set([...Object.keys(ftChannels), ...Object.keys(ltChannels)]);
    const summaryTable = Array.from(allChannels).map(ch => ({
      channel: ch,
      ftConversions: ftChannels[ch]?.count || 0,
      ftRevenue: ftChannels[ch]?.revenue || 0,
      ltConversions: ltChannels[ch]?.count || 0,
      ltRevenue: ltChannels[ch]?.revenue || 0,
    })).sort((a, b) => b.ftRevenue - a.ftRevenue);

    return { details: conversionDetails.slice(0, 20), summary: summaryTable };
  }, [events]);

  const maxPageCount = topPages[0]?.count || 1;
  const hasEvents = events.length > 0;
  const hasAttribution = attributionData.firstTouch.length > 0 || attributionData.lastTouch.length > 0;
  const hasConversionAttribution = conversionAttribution.details.length > 0;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      {/* Visual Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            Full user journey - last {period} days. Drop-off % shown between stages.
            {hasComparison && ' Compared with previous period.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasEvents ? (
            hasComparison && comparisonFunnelData ? (
              /* ── Comparison Table View ── */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Drop-off</TableHead>
                    <TableHead className="text-right">Prev Drop-off</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnelData.map((step, i) => {
                    const prev = comparisonFunnelData[i];
                    const diff = prev ? step.value - prev.value : 0;
                    const diffPercent = prev && prev.value > 0 ? ((diff / prev.value) * 100) : null;
                    const dropoffDelta = step.dropoffRate !== null && prev?.dropoffRate !== null && prev?.dropoffRate !== undefined
                      ? step.dropoffRate - prev.dropoffRate : null;
                    return (
                      <TableRow key={step.label}>
                        <TableCell className="font-medium">{step.label}</TableCell>
                        <TableCell className="text-right font-bold">{step.value.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{prev?.value?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {diff > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : diff < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                            {diffPercent !== null ? `${Math.abs(diffPercent).toFixed(1)}%` : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {step.dropoffRate !== null ? (
                            <span className="text-xs text-destructive/70">{step.dropoffRate}%</span>
                           ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {prev?.dropoffRate !== null && prev?.dropoffRate !== undefined ? (
                            <span className="text-xs text-muted-foreground">
                              {prev.dropoffRate}%
                              {dropoffDelta !== null && dropoffDelta !== 0 && (
                                <span className={`ml-1 ${dropoffDelta < 0 ? 'text-green-600' : 'text-destructive'}`}>
                                  ({dropoffDelta > 0 ? '+' : ''}{dropoffDelta.toFixed(1)}pp)
                                </span>
                              )}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              /* ── Standard Bar View ── */
              <div className="space-y-3">
                {funnelData.map((step, i) => (
                  <div key={step.label}>
                    {step.dropoffRate !== null && (
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="text-xs text-destructive/70">↓ {step.dropoffRate}% drop-off</div>
                        <div className="text-xs text-muted-foreground">({step.retained}% retained)</div>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-36 text-sm font-medium text-right text-foreground shrink-0">{step.label}</div>
                      <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                        <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(step.percent, 2)}%` }} />
                      </div>
                      <div className="w-20 text-right shrink-0">
                        <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">({step.percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-[150px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No funnel data yet - events will populate as users interact</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drop-off Bottlenecks */}
      {hasEvents && funnelData.filter(s => s.dropoffRate !== null && s.dropoffRate > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Drop-off Bottlenecks
            </CardTitle>
            <CardDescription>Stages with the highest user abandonment - focus optimization here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {funnelData
                .filter(s => s.dropoffRate !== null && s.dropoffRate > 0)
                .sort((a, b) => (b.dropoffRate || 0) - (a.dropoffRate || 0))
                .map((step) => (
                  <div key={step.label} className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-1">{step.dropoffLabel}</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${(step.dropoffRate || 0) > 70 ? 'text-destructive' : (step.dropoffRate || 0) > 40 ? 'text-amber-500' : 'text-foreground'}`}>
                        {step.dropoffRate}%
                      </span>
                      <span className="text-xs text-muted-foreground">lost</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${(step.dropoffRate || 0) > 70 ? 'bg-destructive' : (step.dropoffRate || 0) > 40 ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${step.dropoffRate}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Explorer + Top Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Explorer */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Route className="h-5 w-5" />
              Session Explorer
            </CardTitle>
            <CardDescription>Recent user sessions - entry → exit path</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionPaths.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sessionPaths.map((session, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">#{session.sessionId}</span>
                      <div className="flex items-center gap-2">
                        {session.hasPurchase && (
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">💰 Converted</span>
                        )}
                        <span className="text-xs text-muted-foreground">{session.eventCount} events · {formatDuration(session.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-foreground truncate max-w-[40%]">{session.entryPage}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground truncate max-w-[40%]">{session.exitPage}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(session.timestamp), 'MMM d, h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No session data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top User Paths */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top User Paths
            </CardTitle>
            <CardDescription>Most common navigation sequences</CardDescription>
          </CardHeader>
          <CardContent>
            {topPaths.length > 0 ? (
              <div className="space-y-3">
                {topPaths.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground break-words">{p.path}</div>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{p.count}×</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No path data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attribution Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Traffic Attribution
          </CardTitle>
          <CardDescription>First-touch (how they discovered you) vs last-touch (what drove action)</CardDescription>
        </CardHeader>
        <CardContent>
          {hasAttribution ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* First Touch Pie */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 text-center">First Touch</h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attributionData.firstTouch} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {attributionData.firstTouch.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Last Touch Pie */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 text-center">Last Touch</h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attributionData.lastTouch} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {attributionData.lastTouch.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Attribution Table */}
              {attributionTable.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">First Touch Sessions</TableHead>
                      <TableHead className="text-right">Last Touch Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributionTable.map((row) => (
                      <TableRow key={row.channel}>
                        <TableCell className="font-medium">{row.channel}</TableCell>
                        <TableCell className="text-right">{row.firstTouch}</TableCell>
                        <TableCell className="text-right">{row.lastTouch}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No attribution data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Attribution tracking is now active - data will appear with new visits</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Attribution - per-purchase first & last touch */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5" />
            Conversion Attribution
          </CardTitle>
          <CardDescription>First-touch & last-touch channels for sessions that resulted in a purchase</CardDescription>
        </CardHeader>
        <CardContent>
          {hasConversionAttribution ? (
            <div className="space-y-6">
              {/* Summary Table */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Channel Summary</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">First Touch Conversions</TableHead>
                      <TableHead className="text-right">FT Revenue</TableHead>
                      <TableHead className="text-right">Last Touch Conversions</TableHead>
                      <TableHead className="text-right">LT Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionAttribution.summary.map((row) => (
                      <TableRow key={row.channel}>
                        <TableCell className="font-medium">{row.channel}</TableCell>
                        <TableCell className="text-right">{row.ftConversions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.ftRevenue / 100)}</TableCell>
                        <TableCell className="text-right">{row.ltConversions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.ltRevenue / 100)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Per-Conversion Detail */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Recent Conversions</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>First Touch</TableHead>
                        <TableHead>Last Touch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversionAttribution.details.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseISO(c.date), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">{c.template || '-'}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(c.amount / 100)}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{c.firstTouch.channel}</div>
                            {c.firstTouch.source && (
                              <div className="text-xs text-muted-foreground">
                                {c.firstTouch.source}
                                {c.firstTouch.campaign && <> · {c.firstTouch.campaign}</>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{c.lastTouch.channel}</div>
                            {c.lastTouch.source && (
                              <div className="text-xs text-muted-foreground">
                                {c.lastTouch.source}
                                {c.lastTouch.campaign && <> · {c.lastTouch.campaign}</>}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <GitCompareArrows className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No conversion attribution data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Attribution will appear when purchases are tracked via analytics events</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing sections: Top Pages + Template Conversions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Top Landing Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((page, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate max-w-[70%]">{page.path}</span>
                      <span className="text-sm text-muted-foreground">{page.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(page.count / maxPageCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No page view data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Template Conversion Rates</CardTitle>
            <CardDescription>Views → Purchases by template</CardDescription>
          </CardHeader>
          <CardContent>
            {templateConversions.length > 0 ? (
              <div className="space-y-3">
                {templateConversions.map((t, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate max-w-[55%]">{t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.purchases}/{t.views} = <span className="font-bold text-foreground">{t.rate.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max(t.rate, 1)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No conversion data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic Breakdown */}
      {(() => {
        const localeMap: Record<string, number> = {};
        events.forEach(e => {
          const locale = (e.event_data as any)?.locale;
          if (locale) {
            const lang = locale.split('-')[0].toUpperCase();
            localeMap[lang] = (localeMap[lang] || 0) + 1;
          }
        });
        const geoData = Object.entries(localeMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([lang, count]) => ({ lang, count }));

        return geoData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Geographic Breakdown</CardTitle>
              <CardDescription>Visitor language distribution (from browser locale)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {geoData.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                    <span className="text-sm font-bold text-foreground">{g.lang}</span>
                    <span className="text-xs text-muted-foreground">{g.count.toLocaleString()} events</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}
    </>
  );
};

export default AdminAnalytics;
