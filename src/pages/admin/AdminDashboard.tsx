import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, Users, TrendingUp, Eye, 
  ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalLetters: number;
  totalUsers: number;
  totalViews: number;
  letterChange: number;
  userChange: number;
  viewChange: number;
}

interface RecentActivity {
  type: 'letter' | 'user';
  message: string;
  time: string;
}

interface PopularTemplate {
  name: string;
  count: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalLetters: 0,
    totalUsers: 0,
    totalViews: 0,
    letterChange: 12,
    userChange: 8,
    viewChange: 23,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<PopularTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBackupDaysAgo, setLastBackupDaysAgo] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchBackupStatus();
  }, []);

  const fetchBackupStatus = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'last_backup_at')
        .maybeSingle();
      
      if (data?.value) {
        const lastBackup = new Date(data.value);
        const diffDays = Math.floor((Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
        setLastBackupDaysAgo(diffDays);
      } else {
        setLastBackupDaysAgo(999); // Never backed up
      }
    } catch {
      // Silently fail
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch total letters
      const { count: lettersCount } = await supabase
        .from('user_letters')
        .select('*', { count: 'exact', head: true });

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch blog post views
      const { data: postsData } = await supabase
        .from('blog_posts')
        .select('views');
      
      const totalViews = postsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;

      setStats({
        totalLetters: lettersCount || 0,
        totalUsers: usersCount || 0,
        totalViews: totalViews,
        letterChange: 12,
        userChange: 8,
        viewChange: 23,
      });

      // Fetch recent letters for activity
      const { data: recentLetters } = await supabase
        .from('user_letters')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and sort activities
      const activities: RecentActivity[] = [];
      
      recentLetters?.forEach(letter => {
        activities.push({
          type: 'letter',
          message: `New letter: ${letter.title}`,
          time: formatTimeAgo(new Date(letter.created_at)),
        });
      });

      recentUsers?.forEach(user => {
        activities.push({
          type: 'user',
          message: `New user: ${user.email || 'Anonymous'}`,
          time: formatTimeAgo(new Date(user.created_at)),
        });
      });

      // Sort by most recent
      activities.sort((a, b) => {
        const aTime = parseTimeAgo(a.time);
        const bTime = parseTimeAgo(b.time);
        return aTime - bTime;
      });

      setRecentActivity(activities.slice(0, 5));

      // Fetch popular templates
      const { data: templatesData } = await supabase
        .from('user_letters')
        .select('template_name');

      const templateCounts: Record<string, number> = {};
      templatesData?.forEach(letter => {
        templateCounts[letter.template_name] = (templateCounts[letter.template_name] || 0) + 1;
      });

      const sortedTemplates = Object.entries(templateCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setPopularTemplates(sortedTemplates.length > 0 ? sortedTemplates : [
        { name: 'Refund Request Letter', count: 0 },
        { name: 'Security Deposit Demand', count: 0 },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr === 'Just now') return 0;
    const match = timeStr.match(/(\d+)/);
    if (!match) return 0;
    const num = parseInt(match[1]);
    if (timeStr.includes('min')) return num;
    if (timeStr.includes('hour')) return num * 60;
    if (timeStr.includes('day')) return num * 1440;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statsDisplay = [
    {
      title: 'Total Letters',
      value: stats.totalLetters.toString(),
      change: `+${stats.letterChange}%`,
      trend: 'up' as const,
      icon: FileText,
    },
    {
      title: 'Active Users',
      value: stats.totalUsers.toString(),
      change: `+${stats.userChange}%`,
      trend: 'up' as const,
      icon: Users,
    },
    {
      title: 'Blog Views',
      value: stats.totalViews.toLocaleString(),
      change: `+${stats.viewChange}%`,
      trend: 'up' as const,
      icon: Eye,
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '-0.4%',
      trend: 'down' as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Backup Reminder Banner */}
      {lastBackupDaysAgo !== null && lastBackupDaysAgo >= 7 && (
        <Alert variant="destructive" className="mb-6 cursor-pointer" onClick={() => navigate('/admin/settings')}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backup Reminder</AlertTitle>
          <AlertDescription>
            {lastBackupDaysAgo >= 999
              ? "You've never exported a backup. Click here to go to Settings and export your data."
              : `It's been ${lastBackupDaysAgo} days since your last backup. Click here to export your data.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className={`flex items-center text-sm mt-1 ${
                  stat.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {stat.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Activity</CardTitle>
            <CardDescription>Latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'letter' ? 'bg-primary/10' : 'bg-accent/10'
                    }`}>
                      {activity.type === 'letter' ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <Users className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Popular Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Popular Templates</CardTitle>
            <CardDescription>Most used templates this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularTemplates.map((template, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground">{template.name}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {template.count} uses
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
