import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CalendarCheck, TrendingUp } from 'lucide-react';

interface BlogPost {
  id: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
}

interface CalendarStatsProps {
  posts: BlogPost[];
  monthLabel: string;
}

export default function CalendarStats({ posts, monthLabel }: CalendarStatsProps) {
  const stats = useMemo(() => {
    const published = posts.filter(p => p.status === 'published').length;
    const drafts = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.scheduled_at).length;
    
    // Calculate average posts per week (assuming 4 weeks per month)
    const avgPerWeek = posts.length > 0 ? (posts.length / 4).toFixed(1) : '0';

    return { published, drafts, scheduled, total: posts.length, avgPerWeek };
  }, [posts]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total in {monthLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xl font-bold">{stats.published}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-foreground" />
            <div>
              <p className="text-xl font-bold">{stats.scheduled}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{stats.avgPerWeek}</p>
              <p className="text-xs text-muted-foreground">Avg/Week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
