import { useState } from 'react';
import { Loader2, Trash2, Play, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

interface QueueActionsProps {
  selectedCount: number;
  failedCount: number;
  isBulkGenerating: boolean;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  onGenerateSelected: () => void;
  onDeleteSelected: () => void;
  onClearFailed: () => void;
  onRetryFailed: () => void;
}

export default function QueueActions({
  selectedCount,
  failedCount,
  isBulkGenerating,
  batchSize,
  onBatchSizeChange,
  onGenerateSelected,
  onDeleteSelected,
  onClearFailed,
  onRetryFailed,
}: QueueActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearFailedDialog, setShowClearFailedDialog] = useState(false);

  const handleConfirmDelete = () => {
    onDeleteSelected();
    setShowDeleteDialog(false);
  };

  const handleConfirmClearFailed = () => {
    onClearFailed();
    setShowClearFailedDialog(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {/* Batch Size Settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Batch: {batchSize}</span>
              <span className="sm:hidden">{batchSize}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Input
                id="batch-size"
                type="number"
                min={1}
                max={20}
                value={batchSize}
                onChange={(e) => onBatchSizeChange(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
              />
              <p className="text-xs text-muted-foreground">
                Number of articles to generate per batch (1-20)
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {failedCount > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onRetryFailed}>
              <RotateCcw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Retry Failed ({failedCount})</span>
              <span className="sm:hidden">{failedCount}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowClearFailedDialog(true)}>
              <span className="hidden sm:inline">Clear Failed</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={selectedCount === 0}
        >
          <Trash2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Delete ({selectedCount})</span>
          <span className="sm:hidden">{selectedCount}</span>
        </Button>
        
        <Button
          size="sm"
          onClick={onGenerateSelected}
          disabled={selectedCount === 0 || isBulkGenerating}
        >
          {isBulkGenerating ? (
            <><Loader2 className="h-4 w-4 sm:mr-1 animate-spin" /><span className="hidden sm:inline">Generating...</span></>
          ) : (
            <><Play className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Generate ({selectedCount})</span><span className="sm:hidden">{selectedCount}</span></>
          )}
        </Button>
      </div>

      {/* Delete Selected Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Queue Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected queue items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Failed Confirmation */}
      <AlertDialog open={showClearFailedDialog} onOpenChange={setShowClearFailedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear {failedCount} Failed Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all {failedCount} failed queue items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearFailed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Failed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
