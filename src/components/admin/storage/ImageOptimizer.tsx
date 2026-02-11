import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Loader2, CheckCircle, Trash2, Zap, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  totalFiles: number;
  totalSizeBytes: number;
  oversizedFiles: number;
  oversizedSizeBytes: number;
  estimatedSavingsBytes: number;
}

interface OptimizeResult {
  processed: number;
  totalSavedBytes: number;
  hasMore: boolean;
  nextOffset: number;
  totalOversized: number;
  errors: string[];
}

type Phase = 'idle' | 'scanning' | 'scanned' | 'optimizing' | 'optimized' | 'cleaning' | 'cleaned';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const ImageOptimizer = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalOversized, setTotalOversized] = useState(0);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; freedBytes: number } | null>(null);
  const { toast } = useToast();

  const callFunction = async (body: object) => {
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
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }
    return response.json();
  };

  const handleScan = async () => {
    setPhase('scanning');
    try {
      const result: ScanResult = await callFunction({ mode: 'scan' });
      setScanResult(result);
      setTotalOversized(result.oversizedFiles);
      setPhase('scanned');
    } catch (err: any) {
      toast({ title: 'Scan failed', description: err.message, variant: 'destructive' });
      setPhase('idle');
    }
  };

  const handleOptimize = async () => {
    setPhase('optimizing');
    setTotalProcessed(0);
    setTotalSaved(0);
    let offset = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const result: OptimizeResult = await callFunction({ mode: 'optimize', offset });
        setTotalProcessed(prev => prev + result.processed);
        setTotalSaved(prev => prev + result.totalSavedBytes);
        setTotalOversized(result.totalOversized);
        hasMore = result.hasMore;
        offset = result.nextOffset;

        if (result.errors.length > 0) {
          console.warn('[ImageOptimizer] Batch errors:', result.errors);
        }
      }
      setPhase('optimized');
      toast({ title: 'Optimization complete', description: `Saved ${formatBytes(totalSaved)}` });
    } catch (err: any) {
      toast({ title: 'Optimization error', description: err.message, variant: 'destructive' });
      setPhase('scanned');
    }
  };

  const handleCleanup = async () => {
    setPhase('cleaning');
    try {
      const result = await callFunction({ mode: 'cleanup' });
      setCleanupResult(result);
      setPhase('cleaned');
      toast({ title: 'Cleanup complete', description: `Freed ${formatBytes(result.freedBytes)}` });
    } catch (err: any) {
      toast({ title: 'Cleanup failed', description: err.message, variant: 'destructive' });
      setPhase('optimized');
    }
  };

  const progress = totalOversized > 0 ? Math.round((totalProcessed / totalOversized) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Image Storage Optimizer
        </CardTitle>
        <CardDescription>
          Scan, compress, and clean up oversized AI-generated images to reclaim storage space
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {scanResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-2xl font-bold">{scanResult.totalFiles}</p>
              <p className="text-xs text-muted-foreground">Total Images</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-2xl font-bold">{formatBytes(scanResult.totalSizeBytes)}</p>
              <p className="text-xs text-muted-foreground">Total Size</p>
            </div>
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
              <p className="text-2xl font-bold text-destructive">{scanResult.oversizedFiles}</p>
              <p className="text-xs text-muted-foreground">Oversized (&gt;500KB)</p>
            </div>
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
              <p className="text-2xl font-bold text-primary">~{formatBytes(scanResult.estimatedSavingsBytes)}</p>
              <p className="text-xs text-muted-foreground">Est. Savings</p>
            </div>
          </div>
        )}

        {/* Progress bar during optimization */}
        {phase === 'optimizing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Optimizing images...</span>
              <span>{totalProcessed} / {totalOversized} ({formatBytes(totalSaved)} saved)</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}

        {/* Optimization results */}
        {phase === 'optimized' && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Optimization Complete</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Processed {totalProcessed} images, saved {formatBytes(totalSaved)}.
                  Original files are still intact — use Cleanup to delete them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cleanup results */}
        {phase === 'cleaned' && cleanupResult && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Cleanup Complete</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deleted {cleanupResult.deleted} originals, freed {formatBytes(cleanupResult.freedBytes)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {(phase === 'idle' || phase === 'cleaned') && (
            <Button onClick={handleScan} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Scan Storage
            </Button>
          )}

          {phase === 'scanning' && (
            <Button disabled variant="outline">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </Button>
          )}

          {phase === 'scanned' && scanResult && scanResult.oversizedFiles > 0 && (
            <Button onClick={handleOptimize} variant="accent">
              <Zap className="h-4 w-4 mr-2" />
              Optimize {scanResult.oversizedFiles} Images
            </Button>
          )}

          {phase === 'scanned' && scanResult && scanResult.oversizedFiles === 0 && (
            <p className="text-sm text-muted-foreground py-2">All images are already optimized! ✨</p>
          )}

          {phase === 'optimizing' && (
            <Button disabled variant="accent">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </Button>
          )}

          {phase === 'optimized' && (
            <Button onClick={handleCleanup} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Originals & Reclaim Space
            </Button>
          )}

          {phase === 'cleaning' && (
            <Button disabled variant="destructive">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Cleaning up...
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Images are resized to max 1200px width and converted to JPEG at 80% quality.
          Database references are updated automatically.
        </p>
      </CardContent>
    </Card>
  );
};

export default ImageOptimizer;
