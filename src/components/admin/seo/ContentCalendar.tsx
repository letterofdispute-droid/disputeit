import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  created_at: string;
  published_at: string | null;
  status: string;
}

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch blog posts for the current month
  const { data: posts } = useQuery({
    queryKey: ['calendar-posts', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, created_at, published_at, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group posts by day
  const postsByDay = useMemo(() => {
    const grouped: Record<string, BlogPost[]> = {};
    posts?.forEach(post => {
      const day = format(new Date(post.created_at), 'yyyy-MM-dd');
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(post);
    });
    return grouped;
  }, [posts]);

  // Get day of week headers
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate offset for first day of month
  const firstDayOffset = useMemo(() => {
    const firstDay = startOfMonth(currentMonth).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Content Calendar
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-28 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div 
              key={day} 
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 p-1 bg-muted/30 rounded" />
          ))}

          {/* Day cells */}
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDay[dayKey] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={`min-h-24 p-1 rounded border ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5">
                      {dayPosts.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className={`text-xs truncate p-0.5 rounded ${
                        post.status === 'published' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                      title={post.title}
                    >
                      {post.title}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            <span className="text-muted-foreground">Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-secondary border border-border" />
            <span className="text-muted-foreground">Draft</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
