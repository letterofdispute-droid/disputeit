import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface QueueStatsProps {
  stats: {
    queued: number;
    generating: number;
    generated: number;
    published: number;
    failed: number;
  };
  isRunning?: boolean;
  onResetStuck?: () => void;
  isResetting?: boolean;
}

export default function QueueStats({ stats, isRunning, onResetStuck, isResetting }: QueueStatsProps) {
  const hasOrphans = stats.generating > 0 && !isRunning;

  return (
    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
      <span className="text-muted-foreground">
        Queued: <strong>{stats.queued}</strong>
      </span>
      <span className={hasOrphans ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
        {hasOrphans && <AlertTriangle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
        Generating: <strong>{stats.generating}</strong>
        {hasOrphans && (
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-6 text-xs border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={onResetStuck}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting…' : 'Reset Stuck'}
          </Button>
        )}
      </span>
      <span className="text-muted-foreground">
        Generated: <strong>{stats.generated}</strong>
      </span>
      <span className="text-muted-foreground">
        Published: <strong>{stats.published}</strong>
      </span>
      {stats.failed > 0 && (
        <Badge variant="destructive" className="text-xs col-span-2 sm:col-span-1 w-fit">
          Failed: {stats.failed}
        </Badge>
      )}
    </div>
  );
}