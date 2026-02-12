import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type BackfillStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'paused' | 'error';

const ImageBackfillCard = () => {
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [initialCount, setInitialCount] = useState<number | null>(null);
  const [status, setStatus] = useState<BackfillStatus>('idle');
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  // Poll while processing
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
      
      const missing = data.missing_featured || 0;
      setMissingCount(missing);
      
      if (status === 'processing' && missing === 0) {
        setStatus('complete');
        toast({ title: 'Backfill complete', description: 'All articles now have featured images.' });
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  const startBackfill = async () => {
    setIsStarting(true);
    setInitialCount(missingCount);
    setStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('backfill-blog-images', {
        body: { mode: 'start' },
      });
      if (error) throw error;

      if (data.bailed) {
        setStatus('paused');
        toast({
          title: 'Backfill paused',
          description: 'Hit API rate limits. Try again later.',
          variant: 'destructive',
        });
      } else if (data.status === 'complete') {
        setStatus('complete');
        setMissingCount(0);
        toast({ title: 'Backfill complete', description: `Generated images for ${data.processed} articles.` });
      }
      // If 'processing', the self-chain is running and we poll
    } catch (err: any) {
      setStatus('error');
      toast({
        title: 'Backfill error',
        description: err.message || 'Failed to start backfill',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const progress = initialCount && missingCount !== null
    ? Math.round(((initialCount - missingCount) / initialCount) * 100)
    : 0;

  if (missingCount === null) return null;
  if (missingCount === 0 && status !== 'processing') return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-amber-600" />
          Missing Featured Images
        </CardTitle>
        <CardDescription>
          {missingCount} published article{missingCount !== 1 ? 's' : ''} without featured images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'processing' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating images... {missingCount} remaining
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
          <Button
            onClick={startBackfill}
            disabled={isStarting}
            size="sm"
            variant="outline"
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            {status === 'paused' ? 'Resume Backfill' : 'Generate Missing Images'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageBackfillCard;
