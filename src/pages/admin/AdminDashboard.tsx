import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, Users, TrendingUp, Eye, 
  ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

const stats = [
  {
    title: 'Total Letters',
    value: '1,234',
    change: '+12%',
    trend: 'up',
    icon: FileText,
  },
  {
    title: 'Active Users',
    value: '892',
    change: '+8%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Page Views',
    value: '45.2K',
    change: '+23%',
    trend: 'up',
    icon: Eye,
  },
  {
    title: 'Conversion Rate',
    value: '3.2%',
    change: '-0.4%',
    trend: 'down',
    icon: TrendingUp,
  },
];

const recentActivity = [
  { type: 'letter', message: 'New letter generated: Refund Request', time: '2 min ago' },
  { type: 'user', message: 'New user registered: john@example.com', time: '15 min ago' },
  { type: 'letter', message: 'New letter generated: Security Deposit Demand', time: '32 min ago' },
  { type: 'user', message: 'New user registered: sarah@example.com', time: '1 hour ago' },
  { type: 'letter', message: 'New letter generated: Flight Compensation', time: '2 hours ago' },
];

const popularTemplates = [
  { name: 'Refund Request Letter', count: 234 },
  { name: 'Security Deposit Demand', count: 189 },
  { name: 'EU261 Flight Compensation', count: 156 },
  { name: 'Landlord Repair Request', count: 143 },
  { name: 'Credit Report Dispute', count: 98 },
];

const AdminDashboard = () => {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
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
