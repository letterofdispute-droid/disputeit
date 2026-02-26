import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle2, Search, RefreshCw, ShieldAlert, Wrench, Square, Info, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrokenLink {
  href: string;
  linkType: 'article' | 'template' | 'guide' | 'state-rights' | 'static' | 'unknown';
  reason: string;
}

interface BrokenLinkResult {
  postSlug: string;
  broken: number;
  fixed: number;
  brokenLinks?: BrokenLink[];
  saved?: boolean;
  fuzzyFixed?: number;
  stripped?: number;
}

interface ScanSummary {
  postsScanned: number;
  postsWithIssues: number;
  totalBrokenLinks: number;
  totalFixed: number;
  totalSaved?: number;
  totalFuzzyFixed?: number;
  totalStripped?: number;
}

interface HealthCheckResult {
  totalPosts: number;
  needsRestore: number;
  healthy: number;
}

const LINK_TYPE_COLORS: Record<string, string> = {
  article: 'bg-destructive/10 text-destructive border-destructive/20',
  template: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  guide: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'state-rights': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  static: 'bg-muted text-muted-foreground border-border',
  unknown: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export default function BrokenLinkScanner() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isDeepFixing, setIsDeepFixing] = useState(false);
  const [results, setResults] = useState<BrokenLinkResult[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [progress, setProgress] = useState({ offset: 0, total: 0 });
  const [targetsLoaded, setTargetsLoaded] = useState(0);
  const stopRef = useRef(false);

  const [isChecking, setIsChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [healthProgress, setHealthProgress] = useState({ checked: 0, total: 0 });
  const [isRestoring, setIsRestoring] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const runBatch = async (mode: 'scan' | 'fix' | 'deep-fix') => {
    const isFix = mode === 'fix';
    const isDeepFix = mode === 'deep-fix';
    if (isDeepFix) setIsDeepFixing(true);
    else if (isFix) setIsFixing(true);
    else setIsRunning(true);
    setResults([]);
    setSummary(null);
    setTargetsLoaded(0);
    stopRef.current = false;

    let offset = 0;
    let allResults: BrokenLinkResult[] = [];
    let totalSummary: ScanSummary = {
      postsScanned: 0, postsWithIssues: 0,
      totalBrokenLinks: 0, totalFixed: 0, totalSaved: 0,
      totalFuzzyFixed: 0, totalStripped: 0,
    };
    let totalPosts = 1;
    const batchSize = 200;

    try {
      while (offset < totalPosts && !stopRef.current) {
        setProgress({ offset, total: totalPosts });

        const { data, error } = await supabase.functions.invoke('fix-broken-links', {
          body: { mode, limit: batchSize, offset },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        totalPosts = data.pagination.totalPosts;
        if (data.slugsLoaded) setTargetsLoaded(data.slugsLoaded);

        totalSummary.postsScanned += data.summary.postsScanned;
        totalSummary.postsWithIssues += data.summary.postsWithIssues;
        totalSummary.totalBrokenLinks += data.summary.totalBrokenLinks;
        totalSummary.totalFixed += data.summary.totalFixed;
        if (data.summary.totalSaved) totalSummary.totalSaved! += data.summary.totalSaved;
        if (data.summary.totalFuzzyFixed) totalSummary.totalFuzzyFixed! += data.summary.totalFuzzyFixed;
        if (data.summary.totalStripped) totalSummary.totalStripped! += data.summary.totalStripped;

        const issueResults = data.results.filter((r: BrokenLinkResult) => r.broken > 0 || r.fixed > 0 || (r.fuzzyFixed || 0) > 0 || (r.stripped || 0) > 0);
        allResults = [...allResults, ...issueResults];
        setResults([...allResults]);
        setSummary({ ...totalSummary });

        offset += batchSize;
      }

      if (stopRef.current) {
        toast.info(`${isDeepFix ? 'Deep Fix' : isFix ? 'Fix' : 'Scan'} stopped. Processed ${totalSummary.postsScanned} of ~${totalPosts} posts.`);
      } else if (isDeepFix) {
        toast.success(`Deep Fix complete! Fuzzy-matched ${totalSummary.totalFuzzyFixed} links, stripped ${totalSummary.totalStripped} dead links. ${totalSummary.totalBrokenLinks} remain.`);
      } else if (isFix) {
        toast.success(`Fixed ${totalSummary.totalFixed} links across ${totalSummary.totalSaved} articles. ${totalSummary.totalBrokenLinks} unfixable links remain.`);
      } else if (totalSummary.totalBrokenLinks === 0 && totalSummary.totalFixed === 0) {
        toast.success('No broken links found!');
      } else {
        toast.info(`Found ${totalSummary.totalBrokenLinks} broken + ${totalSummary.totalFixed} fixable links across ${totalSummary.postsWithIssues} articles.`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      if (isDeepFix) setIsDeepFixing(false);
      else if (isFix) setIsFixing(false);
      else setIsRunning(false);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  const runHealthCheck = async () => {
    setIsChecking(true);
    setHealthResult(null);
    setHealthProgress({ checked: 0, total: 0 });

    let offset = 0;
    let totalPosts = 1;
    let totalNeedsRestore = 0;
    let totalHealthy = 0;
    const batchSize = 1000;

    try {
      while (offset < totalPosts) {
        setHealthProgress({ checked: offset, total: totalPosts });

        const { data, error } = await supabase.functions.invoke('restore-stripped-links', {
          body: { mode: 'scan', batchSize, offset, threshold: 2 },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        totalPosts = data.totalPosts;
        totalNeedsRestore += data.needsRestore;
        totalHealthy += data.healthy;

        offset += batchSize;
      }

      setHealthProgress({ checked: totalPosts, total: totalPosts });
      setHealthResult({ totalPosts, needsRestore: totalNeedsRestore, healthy: totalHealthy });

      if (totalNeedsRestore === 0) {
        toast.success('All articles have healthy link density!');
      } else {
        toast.info(`Found ${totalNeedsRestore} of ${totalPosts} articles with low link density.`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const startRestore = async () => {
    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('restore-stripped-links', {
        body: { mode: 'restore', threshold: 2 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      toast.success(
        `Done! ${data.affectedPosts} posts flagged for re-scanning. Now go to the Links panel and run "Scan All" to restore links.`,
        { duration: 10000 }
      );
      setHealthResult(null);
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

  // Count broken links by type across all results
  const brokenByType = results.reduce((acc, r) => {
    for (const bl of r.brokenLinks || []) {
      acc[bl.linkType] = (acc[bl.linkType] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalBrokenValidation = Object.values(brokenByType).reduce((a, b) => a + b, 0);

  const isBusy = isRunning || isFixing || isDeepFixing;
  const progressPercent = progress.total > 0 ? Math.min(100, Math.round((progress.offset / progress.total) * 100)) : 0;
  const healthPercent = healthProgress.total > 0 ? Math.min(100, Math.round((healthProgress.checked / healthProgress.total) * 100)) : 0;

  // Show deep fix button when scan/fix completed with remaining broken links
  const showDeepFix = !isBusy && summary && totalBrokenValidation > 0;

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
              Scans all internal links (articles, templates, guides, state rights, static pages).
              {targetsLoaded > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground font-medium cursor-help inline-flex items-center gap-0.5"> · {targetsLoaded.toLocaleString()} targets loaded <Info className="h-3 w-3 text-muted-foreground" /></span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-xs">
                      <p><strong>Targets loaded</strong> = total valid link destinations (articles + templates + guides) used to verify links.</p>
                      <p className="mt-1"><strong>Articles scanned</strong> = number of published articles whose content is checked for broken links.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isBusy && (
              <Button onClick={handleStop} size="sm" variant="destructive">
                <Square className="h-4 w-4 mr-1" /> Stop
              </Button>
            )}
            <Button onClick={() => runBatch('scan')} disabled={isBusy} size="sm" variant="outline">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {isRunning ? `Scanning... ${progressPercent}%` : 'Scan All Links'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Scanner validates articles, templates, guides & static pages. Use <strong>Fix</strong> to auto-rewrite fixable links.</span>
        </div>

        {isBusy && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.offset} of ~{progress.total} articles {isDeepFixing ? 'deep-fixing' : isFixing ? 'fixing' : 'scanned'}
            </p>
          </div>
        )}

        {summary && (
          <>
            <div className={`grid gap-2 ${(summary.totalFuzzyFixed || 0) > 0 || (summary.totalStripped || 0) > 0 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-4'}`}>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{summary.postsScanned}</p>
                <p className="text-[10px] text-muted-foreground">Scanned</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-destructive">{summary.postsWithIssues}</p>
                <p className="text-[10px] text-muted-foreground">With Issues</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-amber-500">{totalBrokenValidation}</p>
                <p className="text-[10px] text-muted-foreground">Broken Links</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-500">{summary.totalFixed}</p>
                <p className="text-[10px] text-muted-foreground">{summary.totalSaved ? `${summary.totalSaved} Saved` : 'Fixable'}</p>
              </div>
              {((summary.totalFuzzyFixed || 0) > 0 || (summary.totalStripped || 0) > 0) && (
                <>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-500">{summary.totalFuzzyFixed}</p>
                    <p className="text-[10px] text-muted-foreground">Fuzzy Matched</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-orange-500">{summary.totalStripped}</p>
                    <p className="text-[10px] text-muted-foreground">Stripped</p>
                  </div>
                </>
              )}
            </div>

            {/* Fix button — appears when there are fixable rewrites */}
            {!isBusy && summary.totalFixed > 0 && !summary.totalSaved && (
              <Button onClick={() => runBatch('fix')} size="sm" className="w-full" variant="default">
                <Wrench className="h-4 w-4 mr-2" />
                Fix {summary.totalFixed} Broken Links
              </Button>
            )}
          </>
        )}

        {/* Deep Fix button and warning */}
        {showDeepFix && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span><strong>Deep Fix</strong> uses fuzzy matching to resolve unknown slugs, resolves template routing, and <strong>strips</strong> truly dead links (removes &lt;a&gt; tags, keeps text). This is destructive.</span>
            </div>
            <Button onClick={() => runBatch('deep-fix')} size="sm" className="w-full" variant="secondary">
              <Zap className="h-4 w-4 mr-2" />
              Deep Fix {totalBrokenValidation} Remaining Broken Links
            </Button>
          </div>
        )}

        {/* Broken links by type */}
        {totalBrokenValidation > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(brokenByType).map(([type, count]) => (
              <Badge key={type} variant="outline" className={`text-[10px] px-1.5 py-0 ${LINK_TYPE_COLORS[type] || ''}`}>
                {type}: {count}
              </Badge>
            ))}
          </div>
        )}

        {summary && summary.totalBrokenLinks === 0 && summary.totalFixed === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            All internal links are valid. No issues found.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <h4 className="text-xs font-semibold text-muted-foreground">Articles with link issues ({results.length})</h4>
            {results.map((r, i) => (
              <div key={i} className="border rounded p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate max-w-[60%]">{r.postSlug}</span>
                  <div className="flex gap-1">
                    {(r.fuzzyFixed || 0) > 0 && (
                      <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] px-1.5 py-0">
                        <Zap className="h-2.5 w-2.5 mr-0.5" /> {r.fuzzyFixed} fuzzy
                      </Badge>
                    )}
                    {(r.stripped || 0) > 0 && (
                      <Badge variant="default" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0">
                        {r.stripped} stripped
                      </Badge>
                    )}
                    {r.fixed > 0 && (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {r.fixed} {r.saved ? 'saved' : 'fixable'}
                      </Badge>
                    )}
                    {(r.brokenLinks?.length || 0) > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {r.brokenLinks!.length} broken
                      </Badge>
                    )}
                  </div>
                </div>
                {r.brokenLinks && r.brokenLinks.length > 0 && (
                  <div className="space-y-0.5 pl-2 border-l-2 border-destructive/20">
                    {r.brokenLinks.map((bl, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-[10px]">
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${LINK_TYPE_COLORS[bl.linkType] || ''}`}>
                          {bl.linkType}
                        </Badge>
                        <code className="text-destructive truncate max-w-[200px]">{bl.href}</code>
                        <span className="text-muted-foreground truncate">{bl.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Link Health & Restoration */}
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Link Health & Restoration</h4>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runHealthCheck} disabled={isChecking || isRestoring} size="sm" variant="outline">
              {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {isChecking ? `Checking... ${healthPercent}%` : 'Check Link Health'}
            </Button>
            {healthResult && healthResult.needsRestore > 0 && (
              <Button onClick={startRestore} disabled={isRestoring || isChecking} size="sm" variant="default">
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {isRestoring ? 'Restoring...' : `Restore ${healthResult.needsRestore} Articles`}
              </Button>
            )}
            <Button onClick={reconcileCounters} disabled={isReconciling} size="sm" variant="ghost">
              {isReconciling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync Counters
            </Button>
          </div>

          {isChecking && healthProgress.total > 0 && (
            <div className="space-y-1">
              <Progress value={healthPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">{healthProgress.checked.toLocaleString()} of {healthProgress.total.toLocaleString()} articles checked</p>
            </div>
          )}

          {healthResult && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{healthResult.totalPosts.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Articles</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-amber-500">{healthResult.needsRestore.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Need Links (≤2)</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-500">{healthResult.healthy.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Healthy (3+)</p>
              </div>
            </div>
          )}

          {healthResult && healthResult.needsRestore > 0 && (
            <p className="text-xs text-muted-foreground">
              Click <strong>Restore</strong> to reconcile counters and flag affected posts. Then run <strong>Scan All</strong> from the Links panel to re-add links via the semantic pipeline.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
