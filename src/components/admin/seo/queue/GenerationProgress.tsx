import { Loader2, Square, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GenerationJob } from '@/hooks/useGenerationJob';

interface GenerationProgressProps {
  job: GenerationJob;
  onStop: (jobId: string) => void;
  isStopping: boolean;
}

export default function GenerationProgress({ job, onStop, isStopping }: GenerationProgressProps) {
  const processed = job.succeeded_items + job.failed_items;
  const percentage = job.total_items > 0 ? Math.round((processed / job.total_items) * 100) : 0;
  const isRunning = job.status === 'processing';
  const isCompleted = job.status === 'completed';
  const isCancelled = job.status === 'cancelled';
  const isFailed = job.status === 'failed';

  const statusIcon = isRunning ? (
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
  ) : isCompleted ? (
    <CheckCircle2 className="h-5 w-5 text-green-600" />
  ) : isCancelled ? (
    <Square className="h-5 w-5 text-muted-foreground" />
  ) : (
    <XCircle className="h-5 w-5 text-destructive" />
  );

  const statusText = isRunning
    ? `Generating articles... (${processed} of ${job.total_items})`
    : isCompleted
    ? `Generation complete — ${job.succeeded_items} succeeded, ${job.failed_items} failed`
    : isCancelled
    ? `Generation stopped — ${job.succeeded_items} succeeded, ${job.failed_items} failed`
    : `Generation stopped — ${job.bail_reason === 'CREDIT_EXHAUSTED' ? 'AI credits exhausted' : job.bail_reason === 'RATE_LIMITED' ? 'Rate limit hit' : 'Error occurred'}`;

  const borderColor = isRunning ? 'border-primary/20' : isCompleted ? 'border-green-500/20' : 'border-destructive/20';
  const bgColor = isRunning ? 'bg-primary/5' : isCompleted ? 'bg-green-50 dark:bg-green-950/20' : 'bg-destructive/5';

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {statusIcon}
            <div className="flex flex-col">
              <span className="font-medium">{statusText}</span>
              {isRunning && (
                <span className="text-sm text-muted-foreground">
                  {job.succeeded_items} succeeded · {job.failed_items} failed
                </span>
              )}
            </div>
          </div>
          {isRunning && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onStop(job.id)}
              disabled={isStopping}
            >
              {isStopping ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Square className="h-4 w-4 mr-1" />}
              Stop
            </Button>
          )}
        </div>
        <Progress value={percentage} className="h-2" />
        {isRunning && (
          <p className="text-xs text-muted-foreground mt-2">
            Processing server-side — you can close this page and come back later.
          </p>
        )}
        {job.bail_reason && (
          <div className="flex items-center gap-2 mt-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              {job.bail_reason === 'CREDIT_EXHAUSTED' 
                ? 'AI credits exhausted. Top up credits then retry failed items.'
                : 'Rate limit hit. Wait a few minutes then retry failed items.'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
