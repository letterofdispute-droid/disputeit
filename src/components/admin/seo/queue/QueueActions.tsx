import { Loader2, Trash2, Play, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  return (
    <div className="flex items-center gap-2">
      {/* Batch Size Settings */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-1" />
            Batch: {batchSize}
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
            <RotateCcw className="h-4 w-4 mr-1" />
            Retry Failed ({failedCount})
          </Button>
          <Button variant="outline" size="sm" onClick={onClearFailed}>
            Clear Failed
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete ({selectedCount})
      </Button>
      
      <Button
        size="sm"
        onClick={onGenerateSelected}
        disabled={selectedCount === 0 || isBulkGenerating}
      >
        {isBulkGenerating ? (
          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
        ) : (
          <><Play className="h-4 w-4 mr-1" /> Generate ({selectedCount})</>
        )}
      </Button>
    </div>
  );
}
