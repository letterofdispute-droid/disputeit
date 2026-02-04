import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BlogPost {
  id: string;
  title: string;
  status: string;
  article_type: string | null;
  scheduled_at: string | null;
}

interface CalendarDayProps {
  day: Date;
  posts: BlogPost[];
  scheduledPosts: BlogPost[];
  isToday: boolean;
}

export default function CalendarDay({ day, posts, scheduledPosts, isToday }: CalendarDayProps) {
  const allPosts = [...posts, ...scheduledPosts];
  const hasScheduled = scheduledPosts.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'scheduled':
        return 'bg-accent/20 text-accent-foreground border-accent/30';
      case 'draft':
        return 'bg-secondary text-secondary-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div
      className={`min-h-24 p-1.5 rounded-lg border transition-colors ${
        isToday 
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
          : 'border-border hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-medium ${
          isToday ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {format(day, 'd')}
        </span>
        <div className="flex items-center gap-1">
          {posts.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 h-4">
              {posts.length}
            </Badge>
          )}
          {hasScheduled && (
            <Badge variant="outline" className="text-[10px] px-1 h-4 border-accent text-accent-foreground">
              {scheduledPosts.length} scheduled
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-0.5">
        <TooltipProvider>
          {allPosts.slice(0, 3).map(post => (
            <Tooltip key={post.id}>
              <TooltipTrigger asChild>
                <div
                  className={`text-xs truncate px-1.5 py-0.5 rounded border cursor-pointer transition-colors hover:opacity-80 ${getStatusColor(post.status)}`}
                >
                  {post.title}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{post.title}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {post.status}
                    </Badge>
                    {post.article_type && (
                      <span className="text-muted-foreground">{post.article_type}</span>
                    )}
                  </div>
                  {post.scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled: {format(new Date(post.scheduled_at), 'PPp')}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        
        {allPosts.length > 3 && (
          <div className="text-xs text-muted-foreground px-1">
            +{allPosts.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
