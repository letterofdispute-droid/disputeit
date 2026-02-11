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
import { Users, FileText, Eye, DollarSign, Loader2, TrendingUp, ShoppingCart, Percent, Filter, Route, MapPin, Globe } from 'lucide-react';
import ExportButton from '@/components/admin/export/ExportButton';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns';
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

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [letterCount, setLetterCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
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
          <FunnelTab events={events} purchases={purchases} period={period} formatCurrency={formatCurrency} />
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
                  <p className="text-sm text-muted-foreground">No funnel data yet — activity will appear as events are tracked</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Funnel Tab ─────────────────────────────────────────────────────────────────
const FunnelTab = ({ 
  events, purchases, period, formatCurrency 
}: { 
  events: AnalyticsEvent[];
  purchases: Purchase[];
  period: string;
  formatCurrency: (v: number) => string;
}) => {
  // Conversion funnel
  const funnelData = useMemo(() => {
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
      dropoff: i === 0 ? null : steps[i - 1].value > 0 
        ? ((1 - s.value / steps[i - 1].value) * 100).toFixed(1) 
        : null,
    }));
  }, [events, purchases]);

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

  const maxPageCount = topPages[0]?.count || 1;
  const hasEvents = events.length > 0;
  const hasAttribution = attributionData.firstTouch.length > 0 || attributionData.lastTouch.length > 0;

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
          <CardDescription>Full user journey — last {period} days. Drop-off % shown between stages.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasEvents ? (
            <div className="space-y-3">
              {funnelData.map((step, i) => (
                <div key={step.label}>
                  {step.dropoff !== null && (
                    <div className="text-xs text-destructive/70 text-center mb-1">↓ {step.dropoff}% drop-off</div>
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
          ) : (
            <div className="h-[150px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No funnel data yet — events will populate as users interact</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Explorer + Top Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Explorer */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Route className="h-5 w-5" />
              Session Explorer
            </CardTitle>
            <CardDescription>Recent user sessions — entry → exit path</CardDescription>
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
                <p className="text-xs text-muted-foreground mt-1">Attribution tracking is now active — data will appear with new visits</p>
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
