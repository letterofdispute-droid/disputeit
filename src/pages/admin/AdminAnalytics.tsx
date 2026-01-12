import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, FileText, Eye, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  page_path: string | null;
  session_id: string | null;
  user_id: string | null;
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

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
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

  // Calculate chart data
  const chartData = useMemo(() => {
    const daysAgo = parseInt(period);
    const days = eachDayOfInterval({
      start: subDays(new Date(), daysAgo - 1),
      end: new Date(),
    });

    // Sample only 6-8 points for the chart
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

  // Max values for scaling charts
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.pageViews, d.templateViews))) || 1;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your platform performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Letters Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.lettersGenerated.toLocaleString()}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              Last {period} days
            </div>
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
            <div className="text-3xl font-bold text-foreground">{metrics.signups.toLocaleString()}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              Last {period} days
            </div>
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
            <div className="text-3xl font-bold text-foreground">{metrics.templateViews.toLocaleString()}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              Last {period} days
            </div>
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
            <div className="text-3xl font-bold text-foreground">{metrics.pageViews.toLocaleString()}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              Last {period} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      {/* Funnel - showing real data */}
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
    </div>
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
