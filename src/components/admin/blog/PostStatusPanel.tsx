import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface PostStatusPanelProps {
  status: string;
  onStatusChange: (status: string) => void;
  isFeatured: boolean;
  onFeaturedChange: (featured: boolean) => void;
  scheduledAt: Date | null;
  onScheduledAtChange: (date: Date | null) => void;
}

const PostStatusPanel = ({
  status,
  onStatusChange,
  isFeatured,
  onFeaturedChange,
  scheduledAt,
  onScheduledAtChange,
}: PostStatusPanelProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Publish</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <RadioGroup value={status} onValueChange={onStatusChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft" className="text-sm font-normal cursor-pointer">
                Draft
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="published" id="published" />
              <Label htmlFor="published" className="text-sm font-normal cursor-pointer">
                Published
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <Label htmlFor="scheduled" className="text-sm font-normal cursor-pointer">
                Scheduled
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Scheduled Date */}
        {status === 'scheduled' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Publish Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-9 text-sm"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {scheduledAt ? format(scheduledAt, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={scheduledAt || undefined}
                  onSelect={(date) => onScheduledAtChange(date || null)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {scheduledAt && (
              <Input
                type="time"
                value={format(scheduledAt, 'HH:mm')}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const newDate = new Date(scheduledAt);
                  newDate.setHours(parseInt(hours), parseInt(minutes));
                  onScheduledAtChange(newDate);
                }}
                className="h-9 text-sm"
              />
            )}
          </div>
        )}

        {/* Featured Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Label htmlFor="featured" className="text-sm">Featured Post</Label>
          <Switch
            id="featured"
            checked={isFeatured}
            onCheckedChange={onFeaturedChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PostStatusPanel;
