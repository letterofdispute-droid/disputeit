import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  onConfirm: (startDate: Date, batchSize: number, intervalDays: number) => void;
}

export default function ScheduleDialog({
  open,
  onOpenChange,
  itemCount,
  onConfirm,
}: ScheduleDialogProps) {
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
  const [batchSize, setBatchSize] = useState(5);
  const [intervalDays, setIntervalDays] = useState(2);

  const preview = useMemo(() => {
    if (!startDate || batchSize < 1 || intervalDays < 1) return [];
    const batches: { date: Date; count: number }[] = [];
    let remaining = itemCount;
    let currentDate = new Date(startDate);
    while (remaining > 0) {
      const count = Math.min(batchSize, remaining);
      batches.push({ date: new Date(currentDate), count });
      remaining -= count;
      currentDate = addDays(currentDate, intervalDays);
    }
    return batches;
  }, [startDate, batchSize, intervalDays, itemCount]);

  const totalDays = preview.length > 1
    ? Math.ceil((preview[preview.length - 1].date.getTime() - preview[0].date.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleConfirm = () => {
    onConfirm(startDate, batchSize, intervalDays);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Schedule Publishing
          </DialogTitle>
          <DialogDescription>
            Spread {itemCount} articles across a publishing cadence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Start Date */}
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Batch Size & Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sched-batch">Articles per batch</Label>
              <Input
                id="sched-batch"
                type="number"
                min={1}
                max={50}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sched-interval">Every N days</Label>
              <Input
                id="sched-interval"
                type="number"
                min={1}
                max={30}
                value={intervalDays}
                onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-1.5">
              <Label>Preview</Label>
              <ScrollArea className="h-40 rounded-md border p-3">
                <div className="space-y-1">
                  {preview.map((batch, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{format(batch.date, 'MMM d, yyyy')}</span>
                      <Badge variant="secondary" className="text-xs">
                        {batch.count} article{batch.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {itemCount} articles over {totalDays} days ({preview.length} batches)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!startDate || itemCount === 0}>
            Schedule {itemCount} Articles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
