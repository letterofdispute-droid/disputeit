import { Badge } from '@/components/ui/badge';

interface QueueStatsProps {
  stats: {
    queued: number;
    generating: number;
    generated: number;
    published: number;
    failed: number;
  };
}

export default function QueueStats({ stats }: QueueStatsProps) {
  return (
    <div className="flex items-center gap-4 text-sm flex-wrap">
      <span className="text-muted-foreground">
        Queued: <strong>{stats.queued}</strong>
      </span>
      <span className="text-muted-foreground">
        Generating: <strong>{stats.generating}</strong>
      </span>
      <span className="text-muted-foreground">
        Generated: <strong>{stats.generated}</strong>
      </span>
      <span className="text-muted-foreground">
        Published: <strong>{stats.published}</strong>
      </span>
      {stats.failed > 0 && (
        <Badge variant="destructive" className="text-xs">
          Failed: {stats.failed}
        </Badge>
      )}
    </div>
  );
}
