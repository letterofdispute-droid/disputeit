import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type BackfillStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'paused' | 'error';

interface MissingCounts {
  missing_featured: number;
  missing_middle1: number;
  missing_middle2: number;
  total_missing: number;
}

const ImageBackfillCard = () => {
  const [counts, setCounts] = useState<MissingCounts | null>(null);
  const [initialTotal, setInitialTotal] = useState<number | null>(null);
  const [status, setStatus] = useState<BackfillStatus>('idle');
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchStatus(); }, []);

  useEffect(() => {
    if (status !== 'processing') return;
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [status]);

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
      if (status === 'processing' && c.total_missing === 0) {
        setStatus('complete');
        toast({ title: 'Backfill complete', description: 'All articles now have images.' });
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  const startBackfill = async () => {
    setIsStarting(true);
    setInitialTotal(counts?.total_missing ?? 0);
    setStatus('processing');
    try {
      const { data, error } = await supabase.functions.invoke('backfill-blog-images', {
        body: { mode: 'start' },
      });
      if (error) throw error;
      if (data.bailed) {
        setStatus('paused');
        toast({ title: 'Backfill paused', description: 'Hit API rate limits. Try again later.', variant: 'destructive' });
      } else if (data.status === 'complete') {
        setStatus('complete');
        setCounts(prev => prev ? { ...prev, total_missing: 0 } : prev);
        toast({ title: 'Backfill complete', description: `Generated ${data.imagesGenerated} images.` });
      }
    } catch (err: any) {
      setStatus('error');
      toast({ title: 'Backfill error', description: err.message || 'Failed to start', variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };

  const progress = initialTotal && counts
    ? Math.round(((initialTotal - counts.total_missing) / initialTotal) * 100)
    : 0;

  if (!counts) return null;
  if (counts.total_missing === 0 && status !== 'processing') return null;

  // Count how many articles have at least one missing image
  const articleCount = Math.max(counts.missing_featured, counts.missing_middle1, counts.missing_middle2);

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-amber-600" />
          Missing Article Images
        </CardTitle>
        <CardDescription>
          {counts.total_missing.toLocaleString()} missing images across ~{articleCount.toLocaleString()} articles
          <span className="block text-xs mt-1">
            Featured: {counts.missing_featured} · Middle 1: {counts.missing_middle1} · Middle 2: {counts.missing_middle2}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'processing' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating images... {counts.total_missing.toLocaleString()} remaining
            </p>
          </div>
        )}

        {status === 'paused' && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Paused due to API rate limits. Retry later.
          </div>
        )}

        {status === 'complete' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            All articles now have images!
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
