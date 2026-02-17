import { useState } from 'react';
import { Clock, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAutoPublish } from '@/hooks/useAutoPublish';
import { format } from 'date-fns';

export default function AutoPublishSettings() {
  const { settings, settingsLoading, recentJobs, updateSettings, isUpdating, triggerPublish, isPublishing } = useAutoPublish();
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);

  const enabled = localEnabled ?? settings?.enabled ?? false;
  const count = localCount ?? settings?.count ?? 5;
  const hasChanges = localEnabled !== null || localCount !== null;

  const handleSave = () => {
    updateSettings({ enabled, count });
    setLocalEnabled(null);
    setLocalCount(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Daily Auto-Publish
        </CardTitle>
        <CardDescription>
          Automatically publish generated draft articles on a daily schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle + Count */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={enabled}
              onCheckedChange={(v) => setLocalEnabled(v)}
              disabled={settingsLoading}
            />
            <Label>Enable daily auto-publish</Label>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="publish-count">Articles per day:</Label>
            <Input
              id="publish-count"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setLocalCount(parseInt(e.target.value, 10) || 5)}
              className="w-20"
              disabled={settingsLoading}
            />
          </div>

          {hasChanges && (
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          )}
        </div>

        {/* Manual trigger */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => triggerPublish()}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />Publish Now</>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Manually trigger a publish cycle
          </span>
        </div>

        {/* Recent jobs */}
        {recentJobs && recentJobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Publish Jobs</h4>
            <div className="space-y-1">
              {recentJobs.slice(0, 5).map((job: any) => (
                <div key={job.id} className="flex items-center justify-between text-sm p-2 rounded border bg-muted/20">
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{job.published_count} published</Badge>
                    {job.failed_count > 0 && (
                      <Badge variant="destructive">{job.failed_count} failed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
