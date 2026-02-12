import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type BackfillStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'paused' | 'error';

interface MissingCounts {
  missing_featured: number;
  missing_middle1: number;
  missing_middle2: number;
  total_missing: number;
}

interface BackfillJob {
  id: string;
  status: string;
  total_images: number;
  processed_images: number;
  failed_images: number;
  last_post_slug: string | null;
  last_error: string | null;
  updated_at: string;
}

const ImageBackfillCard = () => {
  const [counts, setCounts] = useState<MissingCounts | null>(null);
  const [job, setJob] = useState<BackfillJob | null>(null);
  const [status, setStatus] = useState<BackfillStatus>('idle');
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchStatus(); }, []);

  // Poll job progress from DB when processing
  useEffect(() => {
    if (status !== 'processing' || !job?.id) return;
    const interval = setInterval(pollJobProgress, 5000);
    return () => clearInterval(interval);
  }, [status, job?.id]);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backfill-blog-images', {
        body: { mode: 'status' },
      });
      if (error) throw error;
      const c: MissingCounts = {
        missing_featured: data.missing_featured || 0,
        missing_middle1: data.missing_middle1 || 0,
        missing_middle2: data.missing_middle2 || 0,
        total_missing: data.total_missing || 0,
      };
      setCounts(c);

      // Check if there's an active job
      if (data.job && (data.job.status === 'processing' || data.job.status === 'pending')) {
        setJob(data.job);
        setStatus('processing');
      } else if (data.job && data.job.status === 'paused') {
        setJob(data.job);
        setStatus('paused');
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  const pollJobProgress = async () => {
    if (!job?.id) return;
    try {
      const { data, error } = await supabase
        .from('backfill_jobs')
        .select('*')
        .eq('id', job.id)
        .single();

      if (error) throw error;
      if (!data) return;

      setJob(data as BackfillJob);

      if (data.status === 'complete') {
        setStatus('complete');
        toast({ title: 'Backfill complete', description: `Generated ${data.processed_images} images.` });
        fetchStatus(); // Refresh counts
      } else if (data.status === 'paused') {
        setStatus('paused');
        toast({ title: 'Backfill paused', description: data.last_error || 'Hit API rate limits.', variant: 'destructive' });
      } else if (data.status === 'failed') {
        setStatus('error');
        toast({ title: 'Backfill failed', description: data.last_error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Job poll error:', err);
    }
  };

  const startBackfill = async () => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-blog-images', {
        body: { mode: 'start' },
      });
      if (error) throw error;

      if (data.status === 'complete') {
        setStatus('complete');
        toast({ title: 'All done', description: 'All articles already have images.' });
      } else if (data.jobId) {
        setJob({ id: data.jobId, status: 'processing', total_images: counts?.total_missing || 0, processed_images: 0, failed_images: 0, last_post_slug: null, last_error: null, updated_at: new Date().toISOString() });
        setStatus('processing');
        toast({ title: 'Backfill started', description: `Processing ${counts?.total_missing || 0} images...` });
      }
    } catch (err: any) {
      setStatus('error');
      toast({ title: 'Backfill error', description: err.message || 'Failed to start', variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };

  const progress = job && job.total_images > 0
    ? Math.round(((job.processed_images + job.failed_images) / job.total_images) * 100)
    : 0;

  if (!counts) return null;
  if (counts.total_missing === 0 && status !== 'processing' && status !== 'complete') return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-amber-600" />
          Missing Article Images
        </CardTitle>
        <CardDescription>
          {counts.total_missing.toLocaleString()} missing images across published articles
          <span className="block text-xs mt-1">
            Featured: {counts.missing_featured} · Middle 1: {counts.missing_middle1} · Middle 2: {counts.missing_middle2}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'processing' && job && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing... {job.processed_images}/{job.total_images} images ({progress}%)
              </p>
              {job.last_post_slug && (
                <p className="truncate">Last: {job.last_post_slug}</p>
              )}
              {job.failed_images > 0 && (
                <p className="text-amber-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {job.failed_images} failed
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'paused' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Paused — {job?.last_error || 'API rate limits hit'}
            </div>
            {job && (
              <p className="text-xs text-muted-foreground">
                Progress: {job.processed_images}/{job.total_images} ({job.failed_images} failed)
              </p>
            )}
          </div>
        )}

        {status === 'complete' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Backfill complete! {job ? `${job.processed_images} images generated.` : 'All articles have images.'}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" />
              Error: {job?.last_error || 'Unknown error'}
            </div>
          </div>
        )}

        {(status === 'idle' || status === 'paused' || status === 'error') && (
          <Button onClick={startBackfill} disabled={isStarting} size="sm" variant="outline">
            {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
            {status === 'paused' ? 'Resume Backfill' : 'Generate Missing Images'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageBackfillCard;
