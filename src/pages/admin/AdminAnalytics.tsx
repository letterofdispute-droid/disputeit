import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, FileText, Eye, DollarSign } from 'lucide-react';

const chartData = [
  { month: 'Jul', letters: 186, users: 80, revenue: 4200 },
  { month: 'Aug', letters: 305, users: 120, revenue: 5100 },
  { month: 'Sep', letters: 237, users: 95, revenue: 4800 },
  { month: 'Oct', letters: 273, users: 110, revenue: 5500 },
  { month: 'Nov', letters: 209, users: 85, revenue: 4900 },
  { month: 'Dec', letters: 314, users: 140, revenue: 6200 },
];

const topCategories = [
  { name: 'Refunds & Purchases', value: 324, percent: 26 },
  { name: 'Landlord & Housing', value: 289, percent: 23 },
  { name: 'Travel & Transportation', value: 234, percent: 19 },
  { name: 'Financial Services', value: 189, percent: 15 },
  { name: 'Other', value: 198, percent: 17 },
];

const AdminAnalytics = () => {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your platform performance</p>
        </div>
        <Select defaultValue="30">
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
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$30,700</div>
            <div className="flex items-center text-sm text-success mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +18% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Letters Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1,524</div>
            <div className="flex items-center text-sm text-success mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% from last period
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
            <div className="text-3xl font-bold text-foreground">630</div>
            <div className="flex items-center text-sm text-success mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8% from last period
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
            <div className="text-3xl font-bold text-foreground">135.2K</div>
            <div className="flex items-center text-sm text-destructive mt-1">
              <TrendingDown className="h-4 w-4 mr-1" />
              -3% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Activity Overview</CardTitle>
            <CardDescription>Letters generated and new users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div 
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${data.letters / 3.5}px` }}
                    />
                    <div 
                      className="w-full bg-accent rounded-b"
                      style={{ height: `${data.users}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span className="text-sm text-muted-foreground">Letters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded" />
                <span className="text-sm text-muted-foreground">Users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Category Distribution</CardTitle>
            <CardDescription>Letters generated by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
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
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${category.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Conversion Funnel</CardTitle>
          <CardDescription>User journey from visit to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-[200px]">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full bg-primary/20 rounded-t relative" style={{ height: '180px' }}>
                <div className="absolute inset-x-0 bottom-0 bg-primary rounded-t" style={{ height: '180px' }} />
              </div>
              <div className="mt-2 text-center">
                <p className="text-2xl font-bold text-foreground">45.2K</p>
                <p className="text-sm text-muted-foreground">Visitors</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full bg-primary/20 rounded-t relative" style={{ height: '180px' }}>
                <div className="absolute inset-x-0 bottom-0 bg-primary rounded-t" style={{ height: '108px' }} />
              </div>
              <div className="mt-2 text-center">
                <p className="text-2xl font-bold text-foreground">27.1K</p>
                <p className="text-sm text-muted-foreground">Template Views</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full bg-primary/20 rounded-t relative" style={{ height: '180px' }}>
                <div className="absolute inset-x-0 bottom-0 bg-primary rounded-t" style={{ height: '54px' }} />
              </div>
              <div className="mt-2 text-center">
                <p className="text-2xl font-bold text-foreground">8.4K</p>
                <p className="text-sm text-muted-foreground">Letters Started</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full bg-primary/20 rounded-t relative" style={{ height: '180px' }}>
                <div className="absolute inset-x-0 bottom-0 bg-accent rounded-t" style={{ height: '27px' }} />
              </div>
              <div className="mt-2 text-center">
                <p className="text-2xl font-bold text-foreground">1.5K</p>
                <p className="text-sm text-muted-foreground">Purchases</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
