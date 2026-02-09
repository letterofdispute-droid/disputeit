import { useState } from 'react';
import { Loader2, Square } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GenerationProgressProps {
  current: number;
  total: number;
  currentTitle?: string;
  currentBatch?: number;
  totalBatches?: number;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export default function GenerationProgress({ 
  current, 
  total, 
  currentTitle,
  onCancel,
  isCancelling,
}: GenerationProgressProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">
                Generating articles... ({current} of {total})
              </span>
            </div>
            {onCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={isCancelling}
              >
                <Square className="h-3.5 w-3.5 mr-1.5" />
                {isCancelling ? 'Stopping…' : 'Stop'}
              </Button>
            )}
          </div>
          <Progress value={percentage} className="h-2" />
          {currentTitle && (
            <p className="text-sm text-muted-foreground mt-2 truncate">
              Current: {currentTitle}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Processing runs on the server — you can close this tab and come back later.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop generation?</AlertDialogTitle>
            <AlertDialogDescription>
              The current batch (up to 3 articles) will finish, but no new batches will start. Remaining items will stay in the queue so you can resume later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue generating</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onCancel?.();
                setShowConfirm(false);
              }}
            >
              Stop after current batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
