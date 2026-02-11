import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Loader2, CheckCircle, Trash2, Zap, Search, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  status: string;
  total_files: number;
  total_size_bytes: number;
  oversized_files: number;
  oversized_size_bytes: number;
  processed: number;
  saved_bytes: number;
  deleted: number;
  freed_bytes: number;
  current_offset: number;
  errors: string[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const ACTIVE_STATUSES = ['pending', 'scanning', 'optimizing', 'cleaning'];

const ImageOptimizer = () => {
  const [job, setJob] = useState<Job | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const callFunction = useCallback(async (body: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-storage-images`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const data = await callFunction({ mode: 'status', jobId });
      setJob(data);
      if (!ACTIVE_STATUSES.includes(data.status)) {
        stopPolling();
      }
    } catch (err) {
      console.error('[ImageOptimizer] Poll error:', err);
    }
  }, [callFunction]);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    pollingRef.current = setInterval(() => pollStatus(jobId), 3000);
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // On mount, check for in-progress job
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        // Query for active jobs using the function status mode won't work without jobId,
        // so we query the table directly
        const { data } = await supabase
          .from('image_optimization_jobs')
          .select('*')
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setJob(data as unknown as Job);
          startPolling(data.id);
        }
      } catch (err) {
        console.error('[ImageOptimizer] Check existing error:', err);
      }
    };
    checkExisting();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const handleScan = async () => {
    setIsStarting(true);
    try {
      const { jobId } = await callFunction({ mode: 'scan' });
      // Initial poll
      const data = await callFunction({ mode: 'status', jobId });
      setJob(data);
      if (ACTIVE_STATUSES.includes(data.status)) {
        startPolling(jobId);
      }
    } catch (err: any) {
      toast({ title: 'Scan failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleOptimize = async () => {
    if (!job) return;
    try {
      await callFunction({ mode: 'optimize', jobId: job.id });
      startPolling(job.id);
      setJob(prev => prev ? { ...prev, status: 'optimizing' } : prev);
    } catch (err: any) {
      toast({ title: 'Optimize failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleCleanup = async () => {
    if (!job) return;
    try {
      await callFunction({ mode: 'cleanup', jobId: job.id });
      startPolling(job.id);
      setJob(prev => prev ? { ...prev, status: 'cleaning' } : prev);
    } catch (err: any) {
      toast({ title: 'Cleanup failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    try {
      await callFunction({ mode: 'cancel', jobId: job.id });
      setJob(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      stopPolling();
      toast({ title: 'Cancelling...', description: 'The current batch will finish, then the job stops.' });
    } catch (err: any) {
      toast({ title: 'Cancel failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setJob(null);
    stopPolling();
  };

  const progress = job && job.oversized_files > 0
    ? Math.round((job.processed / job.oversized_files) * 100)
    : 0;

  const isActive = job && ACTIVE_STATUSES.includes(job.status);
  const showStats = job && job.status !== 'pending';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Image Storage Optimizer
        </CardTitle>
        <CardDescription>
          Scan, compress, and clean up oversized images. Runs in background - you can close this tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {showStats && job && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-2xl font-bold">{job.total_files}</p>
              <p className="text-xs text-muted-foreground">Total Images</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-2xl font-bold">{formatBytes(job.total_size_bytes)}</p>
              <p className="text-xs text-muted-foreground">Total Size</p>
            </div>
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
              <p className="text-2xl font-bold text-destructive">{job.oversized_files}</p>
              <p className="text-xs text-muted-foreground">Oversized (&gt;500KB)</p>
            </div>
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
              <p className="text-2xl font-bold text-primary">{formatBytes(job.saved_bytes)}</p>
              <p className="text-xs text-muted-foreground">{job.status === 'optimizing' ? 'Saved So Far' : 'Total Saved'}</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {job && (job.status === 'optimizing' || job.status === 'cleaning') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{job.status === 'optimizing' ? 'Optimizing images...' : 'Cleaning up originals...'}</span>
              <span>
                {job.status === 'optimizing'
                  ? `${job.processed} / ${job.oversized_files} (${formatBytes(job.saved_bytes)} saved)`
                  : `${job.deleted} deleted (${formatBytes(job.freed_bytes)} freed)`
                }
              </span>
            </div>
            <Progress value={job.status === 'optimizing' ? progress : undefined} className="h-3" />
          </div>
        )}

        {/* Optimized result */}
        {job?.status === 'optimized' && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Optimization Complete</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Processed {job.processed} images, saved {formatBytes(job.saved_bytes)}.
                  Original files are still intact - use Cleanup to delete them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completed result */}
        {job?.status === 'completed' && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">All Done!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Optimized {job.processed} images (saved {formatBytes(job.saved_bytes)}).
                  Deleted {job.deleted} originals, freed {formatBytes(job.freed_bytes)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled */}
        {job?.status === 'cancelled' && (
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Job Cancelled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Processed {job.processed} images before stopping. Saved {formatBytes(job.saved_bytes)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {(!job || job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed') && (
            <Button onClick={job ? handleReset : handleScan} variant="outline" disabled={isStarting}>
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {job ? 'New Scan' : 'Scan Storage'}
            </Button>
          )}

          {job?.status === 'scanning' && (
            <Button disabled variant="outline">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </Button>
          )}

          {job?.status === 'scanned' && job.oversized_files > 0 && (
            <Button onClick={handleOptimize} variant="accent">
              <Zap className="h-4 w-4 mr-2" />
              Optimize {job.oversized_files} Images
            </Button>
          )}

          {job?.status === 'scanned' && job.oversized_files === 0 && (
            <p className="text-sm text-muted-foreground py-2">All images are already optimized! ✨</p>
          )}

          {job?.status === 'optimizing' && (
            <Button onClick={handleCancel} variant="destructive" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}

          {job?.status === 'optimized' && (
            <Button onClick={handleCleanup} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Originals & Reclaim Space
            </Button>
          )}

          {job?.status === 'cleaning' && (
            <Button disabled variant="destructive">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cleaning up...
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Images are resized to max 1200px width and converted to JPEG at 80% quality.
          Database references are updated automatically. Process runs server-side in background.
        </p>
      </CardContent>
    </Card>
  );
};

export default ImageOptimizer;
