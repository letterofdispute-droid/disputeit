import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle2, Search, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrokenLinkResult {
  postSlug: string;
  broken: number;
  fixed: number;
}

interface ScanSummary {
  postsScanned: number;
  postsWithIssues: number;
  totalBrokenLinks: number;
  totalFixed: number;
}

interface RestoreScanResult {
  totalChecked: number;
  totalAffected: number;
  needsRestore: number;
}

export default function BrokenLinkScanner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BrokenLinkResult[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [progress, setProgress] = useState({ offset: 0, total: 0 });
  const [slugsLoaded, setSlugsLoaded] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreScanResult | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  const runScan = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    setSlugsLoaded(0);

    let offset = 0;
    let allResults: BrokenLinkResult[] = [];
    let totalSummary: ScanSummary = {
      postsScanned: 0, postsWithIssues: 0,
      totalBrokenLinks: 0, totalFixed: 0,
    };
    let totalPosts = 1;
    const batchSize = 200;

    try {
      while (offset < totalPosts) {
        setProgress({ offset, total: totalPosts });

        const { data, error } = await supabase.functions.invoke('fix-broken-links', {
          body: { mode: 'scan', limit: batchSize, offset },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        totalPosts = data.pagination.totalPosts;
        if (data.slugsLoaded) setSlugsLoaded(data.slugsLoaded);

        totalSummary.postsScanned += data.summary.postsScanned;
        totalSummary.postsWithIssues += data.summary.postsWithIssues;
        totalSummary.totalBrokenLinks += data.summary.totalBrokenLinks;
        totalSummary.totalFixed += data.summary.totalFixed;

        const issueResults = data.results.filter((r: BrokenLinkResult) => r.broken > 0);
        allResults = [...allResults, ...issueResults];
        setResults([...allResults]);
        setSummary({ ...totalSummary });

        offset += batchSize;
      }

      if (totalSummary.totalFixed === 0) {
        toast.success('No broken URL patterns found!');
      } else {
        toast.info(`Found ${totalSummary.totalFixed} URL patterns to rewrite across ${totalSummary.postsWithIssues} articles.`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const scanForStrippedLinks = async () => {
    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('restore-stripped-links', {
        body: { mode: 'scan', batchSize: 500 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      setRestoreResult({
        totalChecked: data.totalChecked,
        totalAffected: data.totalAffected,
        needsRestore: data.needsRestore,
      });

      if (data.needsRestore === 0) {
        toast.success('All articles have healthy link density!');
      } else {
        toast.info(`Found ${data.needsRestore} articles with low link density that need restoration.`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const startRestore = async () => {
    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('restore-stripped-links', {
        body: { mode: 'restore', batchSize: 50, autoApproveThreshold: 70 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      toast.success(
        `Restoration started! Triggered scans for ${data.triggered} posts, auto-approved ${data.autoApproved} links. ${data.hasMore ? 'Processing continues in background.' : 'All done!'}`
      );
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const reconcileCounters = async () => {
    setIsReconciling(true);
    try {
      const { data, error } = await supabase.rpc('reconcile_link_counts');
      if (error) throw error;

      const result = data as any;
      toast.success(
        `Counters synced: ${result.inbound_updated} inbound + ${result.outbound_updated} outbound updated, ${result.ghosts_reset} ghost suggestions reset.`
      );
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsReconciling(false);
    }
  };

  const progressPercent = progress.total > 0 ? Math.min(100, Math.round((progress.offset / progress.total) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Link Scanner & Restoration
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Detect broken URL patterns (read-only scan). Use semantic pipeline to restore/add links.
              {slugsLoaded > 0 && <span className="text-foreground font-medium"> · {slugsLoaded.toLocaleString()} slugs loaded</span>}
            </CardDescription>
          </div>
          <Button
            onClick={runScan}
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            {isRunning ? `Scanning... ${progressPercent}%` : 'Scan URLs'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Safety notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Scanner is <strong>read-only</strong>. No content is modified. Links are managed via the semantic linking pipeline.</span>
        </div>

        {isRunning && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.offset} of ~{progress.total} posts processed
            </p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold">{summary.postsScanned}</p>
              <p className="text-[10px] text-muted-foreground">Scanned</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-destructive">{summary.postsWithIssues}</p>
              <p className="text-[10px] text-muted-foreground">With Issues</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-green-500">{summary.totalFixed}</p>
              <p className="text-[10px] text-muted-foreground">URL Rewrites</p>
            </div>
          </div>
        )}

        {summary && summary.totalFixed === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            All URL patterns are valid. No rewrites needed.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <h4 className="text-xs font-semibold text-muted-foreground">
              Articles with URL issues ({results.length})
            </h4>
            {results.map((r, i) => (
              <div key={i} className="border rounded p-2 flex items-center justify-between">
                <span className="text-xs font-medium truncate max-w-[60%]">{r.postSlug}</span>
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {r.fixed} rewrites
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Restoration section */}
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Link Restoration</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={scanForStrippedLinks}
              disabled={isRestoring}
              size="sm"
              variant="outline"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Check Link Health
            </Button>
            {restoreResult && restoreResult.needsRestore > 0 && (
              <Button
                onClick={startRestore}
                disabled={isRestoring}
                size="sm"
                variant="default"
              >
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Restore {restoreResult.needsRestore} Articles
              </Button>
            )}
            <Button
              onClick={reconcileCounters}
              disabled={isReconciling}
              size="sm"
              variant="ghost"
            >
              {isReconciling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync Counters
            </Button>
          </div>

          {restoreResult && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{restoreResult.totalChecked}</p>
                <p className="text-[10px] text-muted-foreground">Checked</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-amber-500">{restoreResult.needsRestore}</p>
                <p className="text-[10px] text-muted-foreground">Need Links</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-500">{restoreResult.totalChecked - restoreResult.needsRestore}</p>
                <p className="text-[10px] text-muted-foreground">Healthy</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
