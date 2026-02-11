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
import { Users, FileText, Eye, DollarSign, Loader2, TrendingUp, ShoppingCart, Percent, Filter } from 'lucide-react';
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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#22c55e', '#f59e0b', '#ef4444'];

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
      // Fetch analytics events
      const { data: eventsData, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch purchases for revenue analytics
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('letter_purchases')
        .select('id, amount_cents, purchase_type, template_slug, status, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (!purchasesError) {
        setPurchases(purchasesData || []);
      }

      // Fetch user count
      const { count: profileCount, error: profileError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      if (!profileError) {
        setUserCount(profileCount || 0);
      }

      // Fetch letter count
      const { count: lettersCount, error: lettersError } = await supabase
        .from('user_letters')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      if (!lettersError) {
        setLetterCount(lettersCount || 0);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics from events
  const metrics = useMemo(() => {
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    const templateViews = events.filter(e => e.event_type === 'template_view').length;
    const lettersGenerated = events.filter(e => e.event_type === 'letter_generated').length;
    const signups = events.filter(e => e.event_type === 'user_signup').length;

    return {
      pageViews,
      templateViews,
      lettersGenerated: letterCount || lettersGenerated,
      signups: userCount || signups,
    };
  }, [events, letterCount, userCount]);

  // Calculate revenue metrics
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

  // Revenue over time chart data
  const revenueChartData = useMemo(() => {
    const daysAgo = parseInt(period);
    const days = eachDayOfInterval({
      start: subDays(new Date(), daysAgo - 1),
      end: new Date(),
    });

    // Sample points for chart readability
    const sampleInterval = Math.ceil(days.length / 14);
    const sampledDays = days.filter((_, index) => index % sampleInterval === 0 || index === days.length - 1);

    return sampledDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayPurchases = purchases.filter(p => 
        format(parseISO(p.created_at), 'yyyy-MM-dd') === dayStr && p.status === 'completed'
      );

      const revenue = dayPurchases.reduce((sum, p) => sum + p.amount_cents, 0) / 100;

      return {
        date: dayStr,
        label: format(day, 'MMM d'),
        revenue,
        orders: dayPurchases.length,
      };
    });
  }, [purchases, period]);

  // Purchase type breakdown
  const purchaseTypeData = useMemo(() => {
    const completedPurchases = purchases.filter(p => p.status === 'completed' && p.amount_cents > 0);
    const creditRedemptions = purchases.filter(p => p.status === 'completed' && p.amount_cents === 0);
    const pdfOnly = completedPurchases.filter(p => p.purchase_type === 'pdf_only' || p.purchase_type === 'pdf-only');
    const pdfEdit = completedPurchases.filter(p => p.purchase_type === 'pdf_edit' || p.purchase_type === 'pdf-editable');

    const pdfOnlyRevenue = pdfOnly.reduce((sum, p) => sum + p.amount_cents, 0);
    const pdfEditRevenue = pdfEdit.reduce((sum, p) => sum + p.amount_cents, 0);

    return [
      { name: 'PDF Only', value: pdfOnlyRevenue / 100, count: pdfOnly.length },
      { name: 'PDF + Edit', value: pdfEditRevenue / 100, count: pdfEdit.length },
      { name: 'Credit Redemptions', value: 0, count: creditRedemptions.length },
    ];
  }, [purchases]);

  // Top templates by revenue
  const topTemplates = useMemo(() => {
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    const templateMap: Record<string, { revenue: number; count: number }> = {};

    completedPurchases.forEach(p => {
      const slug = p.template_slug;
      if (!templateMap[slug]) {
        templateMap[slug] = { revenue: 0, count: 0 };
      }
      templateMap[slug].revenue += p.amount_cents;
      templateMap[slug].count += 1;
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

  // Calculate activity chart data
  const chartData = useMemo(() => {
    const daysAgo = parseInt(period);
    const days = eachDayOfInterval({
      start: subDays(new Date(), daysAgo - 1),
      end: new Date(),
    });

    const sampleInterval = Math.ceil(days.length / 7);
    const sampledDays = days.filter((_, index) => index % sampleInterval === 0 || index === days.length - 1);

    return sampledDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEvents = events.filter(e => 
        format(parseISO(e.created_at), 'yyyy-MM-dd') === dayStr
      );

      return {
        date: dayStr,
        label: format(day, 'MMM d'),
        pageViews: dayEvents.filter(e => e.event_type === 'page_view').length,
        lettersGenerated: dayEvents.filter(e => e.event_type === 'letter_generated').length,
        templateViews: dayEvents.filter(e => e.event_type === 'template_view').length,
        signups: dayEvents.filter(e => e.event_type === 'user_signup').length,
      };
    });
  }, [events, period]);

  // Calculate category distribution
  const categoryData = useMemo((): CategoryData[] => {
    const categoryEvents = events.filter(e => 
      e.event_type === 'template_view' || e.event_type === 'letter_generated'
    );

    const categoryMap: Record<string, number> = {};
    categoryEvents.forEach(e => {
      const category = (e.event_data as any)?.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0) || 1;
    
    const categories = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        percent: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    if (categories.length === 0) {
      return [{ name: 'No data yet', value: 0, percent: 0 }];
    }

    return categories;
  }, [events]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.pageViews, d.templateViews))) || 1;

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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(revenueMetrics.totalRevenue / 100)}
                </div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {revenueMetrics.orderCount}
                </div>
                <p className="text-xs text-muted-foreground">Completed purchases</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Order Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(revenueMetrics.averageOrderValue / 100)}
                </div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {revenueMetrics.conversionRate.toFixed(2)}%
                </div>
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
                    <XAxis 
                      dataKey="label" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Type & Top Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchase Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Purchase Type Breakdown</CardTitle>
                <CardDescription>Revenue by product type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={purchaseTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${formatCurrency(value)}`}
                      >
                        {purchaseTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${formatCurrency(value)} (${props.payload.count} orders)`,
                          props.payload.name
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Templates */}
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
                          <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                            {template.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(template.revenue)} ({template.count})
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ 
                              width: `${(template.revenue / (topTemplates[0]?.revenue || 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sales data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Refunds Summary */}
          {revenueMetrics.refundedAmount > 0 && (
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Refunded Amount</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(revenueMetrics.refundedAmount / 100)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(revenueMetrics.netRevenue / 100)}
                    </p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Letters Generated
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.lettersGenerated.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.signups.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Template Views
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.templateViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Page Views
                </CardTitle>
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
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Activity Overview</CardTitle>
                <CardDescription>Page views and template views over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col gap-1">
                        <div 
                          className="w-full bg-primary rounded-t transition-all"
                          style={{ height: `${Math.max((data.pageViews / maxChartValue) * 200, 4)}px` }}
                        />
                        <div 
                          className="w-full bg-accent rounded-b transition-all"
                          style={{ height: `${Math.max((data.templateViews / maxChartValue) * 100, 2)}px` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{data.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded" />
                    <span className="text-sm text-muted-foreground">Page Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent rounded" />
                    <span className="text-sm text-muted-foreground">Template Views</span>
                  </div>
                </div>
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
                        <span className="text-sm font-medium text-foreground">
                          {category.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {category.value} ({category.percent}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${category.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Activity Funnel</CardTitle>
              <CardDescription>User journey from page view to letter generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4 h-[200px]">
                <FunnelStep 
                  value={metrics.pageViews} 
                  label="Page Views" 
                  maxValue={metrics.pageViews || 1}
                  color="bg-primary"
                />
                <FunnelStep 
                  value={metrics.templateViews} 
                  label="Template Views" 
                  maxValue={metrics.pageViews || 1}
                  color="bg-primary"
                />
                <FunnelStep 
                  value={metrics.signups} 
                  label="Sign Ups" 
                  maxValue={metrics.pageViews || 1}
                  color="bg-primary"
                />
                <FunnelStep 
                  value={metrics.lettersGenerated} 
                  label="Letters Generated" 
                  maxValue={metrics.pageViews || 1}
                  color="bg-accent"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Full Funnel Tab Component
const FunnelTab = ({ 
  events, 
  purchases, 
  period,
  formatCurrency 
}: { 
  events: AnalyticsEvent[];
  purchases: Purchase[];
  period: string;
  formatCurrency: (v: number) => string;
}) => {
  const funnelData = useMemo(() => {
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    const templateViews = events.filter(e => e.event_type === 'template_view').length;
    const formStarts = events.filter(e => e.event_type === 'form_started').length;
    const formCompletes = events.filter(e => e.event_type === 'form_completed').length;
    const checkoutStarts = events.filter(e => e.event_type === 'checkout_initiated').length;
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    const paidPurchases = completedPurchases.filter(p => p.amount_cents > 0);
    const creditRedemptions = completedPurchases.filter(p => p.amount_cents === 0);

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

  // Top landing pages
  const topPages = useMemo(() => {
    const pageMap: Record<string, number> = {};
    events
      .filter(e => e.event_type === 'page_view')
      .forEach(e => {
        const path = e.page_path || '/';
        pageMap[path] = (pageMap[path] || 0) + 1;
      });
    return Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
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
        views,
        purchases: purchaseMap[slug] || 0,
        rate: views > 0 ? ((purchaseMap[slug] || 0) / views * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8);
  }, [events, purchases]);

  // Geographic breakdown from locale
  const geoData = useMemo(() => {
    const localeMap: Record<string, number> = {};
    events.forEach(e => {
      const locale = (e.event_data as any)?.locale;
      if (locale) {
        const lang = locale.split('-')[0].toUpperCase();
        localeMap[lang] = (localeMap[lang] || 0) + 1;
      }
    });
    return Object.entries(localeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lang, count]) => ({ lang, count }));
  }, [events]);

  const maxPageCount = topPages[0]?.count || 1;

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
            Full user journey — last {period} days. Drop-off % shown between stages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => (
              <div key={step.label}>
                {step.dropoff !== null && (
                  <div className="text-xs text-destructive/70 text-center mb-1">
                    ↓ {step.dropoff}% drop-off
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium text-right text-foreground shrink-0">
                    {step.label}
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                    <div 
                      className={`h-full ${step.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(step.percent, 2)}%` }}
                    />
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">({step.percent.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Landing Pages */}
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
                      <span className="text-sm font-medium text-foreground truncate max-w-[70%]">
                        {page.path}
                      </span>
                      <span className="text-sm text-muted-foreground">{page.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(page.count / maxPageCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No page view data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Template Conversion Rates */}
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
                      <span className="text-sm font-medium text-foreground truncate max-w-[55%]">
                        {t.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.purchases}/{t.views} = <span className="font-bold text-foreground">{t.rate.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.max(t.rate, 1)}%` }}
                      />
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
      {geoData.length > 0 && (
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
      )}
    </>
  );
};

const FunnelStep = ({ 
  value, 
  label, 
  maxValue,
  color 
}: { 
  value: number; 
  label: string; 
  maxValue: number;
  color: string;
}) => {
  const height = Math.max((value / maxValue) * 180, 10);
  
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full bg-muted rounded-t relative" style={{ height: '180px' }}>
        <div 
          className={`absolute inset-x-0 bottom-0 ${color} rounded-t transition-all`} 
          style={{ height: `${height}px` }} 
        />
      </div>
      <div className="mt-2 text-center">
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default AdminAnalytics;
