import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BulkPlanningJob } from '@/hooks/useBulkPlanningJob';

interface BulkPlanningProgressProps {
  job: BulkPlanningJob;
  onDismiss?: () => void;
}

export default function BulkPlanningProgress({ job, onDismiss }: BulkPlanningProgressProps) {
  const totalProcessed = job.completed_templates + job.failed_templates;
  const progress = job.total_templates > 0 
    ? Math.round((totalProcessed / job.total_templates) * 100) 
    : 0;
  
  const isComplete = job.status === 'completed' || job.status === 'failed';
  const hasFailures = job.failed_templates > 0;

  // Get current template being processed
  const currentTemplateIndex = totalProcessed;
  const currentTemplate = currentTemplateIndex < job.template_slugs.length
    ? job.template_slugs[currentTemplateIndex]
    : null;

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
                <Badge variant="destructive" className="text-xs">
                  {job.failed_templates} failed
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dismiss Button (only when complete) */}
      {isComplete && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
