import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import CalendarDay from './calendar/CalendarDay';
import CalendarStats from './calendar/CalendarStats';

interface BlogPost {
  id: string;
  title: string;
  created_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  status: string;
  article_type: string | null;
}

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch blog posts for the current month
  const { data: posts } = useQuery({
    queryKey: ['calendar-posts', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, created_at, published_at, scheduled_at, status, article_type')
        .or(`created_at.gte.${start.toISOString()},scheduled_at.gte.${start.toISOString()}`)
        .or(`created_at.lte.${end.toISOString()},scheduled_at.lte.${end.toISOString()}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Apply filters
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter(post => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      if (typeFilter !== 'all' && post.article_type !== typeFilter) return false;
      return true;
    });
  }, [posts, statusFilter, typeFilter]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group posts by day (both created_at and scheduled_at)
  const postsByDay = useMemo(() => {
    const createdByDay: Record<string, BlogPost[]> = {};
    const scheduledByDay: Record<string, BlogPost[]> = {};
    
    filteredPosts.forEach(post => {
      const createdDay = format(parseISO(post.created_at), 'yyyy-MM-dd');
      if (!createdByDay[createdDay]) createdByDay[createdDay] = [];
      createdByDay[createdDay].push(post);

      if (post.scheduled_at) {
        const scheduledDay = format(parseISO(post.scheduled_at), 'yyyy-MM-dd');
        if (scheduledDay !== createdDay) {
          if (!scheduledByDay[scheduledDay]) scheduledByDay[scheduledDay] = [];
          scheduledByDay[scheduledDay].push({ ...post, status: 'scheduled' });
        }
      }
    });
    
    return { createdByDay, scheduledByDay };
  }, [filteredPosts]);

  // Get day of week headers
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate offset for first day of month
  const firstDayOffset = useMemo(() => {
    const firstDay = startOfMonth(currentMonth).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Get unique article types for filter
  const articleTypes = useMemo(() => {
    const types = new Set(posts?.map(p => p.article_type).filter(Boolean) as string[]);
    return Array.from(types);
  }, [posts]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-2">
        <div className="flex flex-row items-center justify-between">
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
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {articleTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <CalendarStats posts={filteredPosts} monthLabel={format(currentMonth, 'MMMM')} />

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1">
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
            <div key={`empty-${i}`} className="min-h-24 p-1 bg-muted/30 rounded-lg" />
          ))}

          {/* Day cells */}
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDay.createdByDay[dayKey] || [];
            const scheduledPosts = postsByDay.scheduledByDay[dayKey] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <CalendarDay
                key={dayKey}
                day={day}
                posts={dayPosts}
                scheduledPosts={scheduledPosts}
                isToday={isToday}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            <span className="text-muted-foreground">Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-accent/20 border border-accent/30" />
            <span className="text-muted-foreground">Scheduled</span>
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
