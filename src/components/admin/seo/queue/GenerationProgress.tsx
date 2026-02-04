import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface GenerationProgressProps {
  current: number;
  total: number;
  currentTitle?: string;
}

export default function GenerationProgress({ current, total, currentTitle }: GenerationProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-medium">
            Generating articles... ({current} of {total})
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        {currentTitle && (
          <p className="text-sm text-muted-foreground mt-2 truncate">
            Current: {currentTitle}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          This may take several minutes. You can leave this page and come back.
        </p>
      </CardContent>
    </Card>
  );
}
