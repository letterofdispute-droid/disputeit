import { Loader2, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BulkPlanningJob } from '@/hooks/useBulkPlanningJob';

interface BulkPlanningProgressProps {
  job: BulkPlanningJob;
  onDismiss?: () => void;
  onRetryFailed?: () => void;
  isRetrying?: boolean;
}

export default function BulkPlanningProgress({ 
  job, 
  onDismiss, 
  onRetryFailed,
  isRetrying 
}: BulkPlanningProgressProps) {
  const totalProcessed = job.completed_templates + job.failed_templates;
  const progress = job.total_templates > 0 
    ? Math.round((totalProcessed / job.total_templates) * 100) 
    : 0;
  
  const isComplete = job.status === 'completed' || job.status === 'failed';
  const hasFailures = job.failed_templates > 0;
  const canRetry = isComplete && hasFailures && !isRetrying;

  // Get current template being processed
  const currentTemplateIndex = totalProcessed;
  const currentTemplate = currentTemplateIndex < job.template_slugs.length
    ? job.template_slugs[currentTemplateIndex]
    : null;

  // Build failure tooltip content
  const failureTooltip = hasFailures && job.failed_slugs.length > 0
    ? job.failed_slugs.slice(0, 5).map(slug => {
        const errorMsg = job.error_messages[slug];
        return `• ${slug.replace(/-/g, ' ')}${errorMsg ? `: ${errorMsg.slice(0, 50)}...` : ''}`;
      }).join('\n') + (job.failed_slugs.length > 5 ? `\n...and ${job.failed_slugs.length - 5} more` : '')
    : '';

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border">
      {/* Status Icon */}
      {job.status === 'processing' && (
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      )}
      {job.status === 'completed' && !hasFailures && (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      )}
      {job.status === 'completed' && hasFailures && (
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      {job.status === 'failed' && (
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
      )}

      {/* Progress Bar and Text */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {totalProcessed}/{job.total_templates}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {job.status === 'processing' && currentTemplate && (
            <span className="text-muted-foreground truncate">
              Planning: {currentTemplate.replace(/-/g, ' ')}
            </span>
          )}
          {isComplete && (
            <>
              <Badge variant={hasFailures ? 'secondary' : 'default'} className="text-xs">
                {job.completed_templates} planned
              </Badge>
              {hasFailures && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="text-xs cursor-help">
                      {job.failed_templates} failed
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <pre className="text-xs whitespace-pre-wrap">{failureTooltip}</pre>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Retry Failed Button */}
        {canRetry && onRetryFailed && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={onRetryFailed}
            disabled={isRetrying}
          >
            <RefreshCw className="h-3 w-3" />
            Retry {job.failed_templates}
          </Button>
        )}
        
        {/* Retrying indicator */}
        {isRetrying && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Retrying...
          </div>
        )}

        {/* Dismiss Button (only when complete and not retrying) */}
        {isComplete && onDismiss && !isRetrying && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
