import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wrench, AlertTriangle, CheckCircle2, Scissors, Search, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrokenLinkResult {
  postSlug: string;
  broken: number;
  fixed: number;
  replaced: number;
  stripped: number;
}

interface ScanSummary {
  postsScanned: number;
  postsWithIssues: number;
  totalBrokenLinks: number;
  totalFixed: number;
  totalReplaced: number;
  totalStripped: number;
}

export default function BrokenLinkScanner() {
  const [isRunning, setIsRunning] = useState(false);
  const [scanMode, setScanMode] = useState<'idle' | 'scanned' | 'fixing'>('idle');
  const [results, setResults] = useState<BrokenLinkResult[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [progress, setProgress] = useState({ offset: 0, total: 0 });
  const [slugsLoaded, setSlugsLoaded] = useState(0);

  const runBatch = async (mode: 'scan' | 'fix') => {
    setIsRunning(true);
    if (mode === 'scan') {
      setResults([]);
      setSummary(null);
      setSlugsLoaded(0);
    }
    if (mode === 'fix') setScanMode('fixing');

    let offset = 0;
    let allResults: BrokenLinkResult[] = mode === 'fix' ? [] : [];
    let totalSummary: ScanSummary = {
      postsScanned: 0, postsWithIssues: 0,
      totalBrokenLinks: 0, totalFixed: 0, totalReplaced: 0, totalStripped: 0,
    };
    let totalPosts = 1;
    const batchSize = 200;

    try {
      while (offset < totalPosts) {
        setProgress({ offset, total: totalPosts });

        const { data, error } = await supabase.functions.invoke('fix-broken-links', {
          body: { mode, limit: batchSize, offset },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        totalPosts = data.pagination.totalPosts;
        if (data.slugsLoaded) setSlugsLoaded(data.slugsLoaded);

        totalSummary.postsScanned += data.summary.postsScanned;
        totalSummary.postsWithIssues += data.summary.postsWithIssues;
        totalSummary.totalBrokenLinks += data.summary.totalBrokenLinks;
        totalSummary.totalFixed += data.summary.totalFixed;
        totalSummary.totalReplaced += data.summary.totalReplaced;
        totalSummary.totalStripped += data.summary.totalStripped;

        const issueResults = data.results.filter((r: BrokenLinkResult) => r.broken > 0);
        allResults = [...allResults, ...issueResults];
        setResults([...allResults]);
        setSummary({ ...totalSummary });

        offset += batchSize;
      }

      if (mode === 'scan') {
        setScanMode('scanned');
        const total = totalSummary.totalFixed + totalSummary.totalReplaced + totalSummary.totalStripped;
        if (total === 0) {
          toast.success('No broken links found!');
        } else {
          toast.info(`Found ${total} issues across ${totalSummary.postsWithIssues} articles. Review below, then click "Apply Fixes".`);
        }
      } else {
        setScanMode('idle');
        toast.success(`Fixed ${totalSummary.totalFixed} links, replaced ${totalSummary.totalReplaced}, stripped ${totalSummary.totalStripped} across ${totalSummary.postsWithIssues} articles`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const progressPercent = progress.total > 0 ? Math.min(100, Math.round((progress.offset / progress.total) * 100)) : 0;
  const hasIssues = summary && (summary.totalFixed + summary.totalReplaced + summary.totalStripped) > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Broken Link Scanner
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Detect broken internal links, rewrite fixable ones, smart-replace orphans, and strip dead links
              {slugsLoaded > 0 && <span className="text-foreground font-medium"> · {slugsLoaded.toLocaleString()} slugs loaded</span>}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {scanMode === 'scanned' && hasIssues && (
              <Button
                onClick={() => runBatch('fix')}
                disabled={isRunning}
                size="sm"
                variant="destructive"
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                {isRunning ? `Fixing... ${progressPercent}%` : 'Apply Fixes'}
              </Button>
            )}
            <Button
              onClick={() => runBatch('scan')}
              disabled={isRunning}
              size="sm"
              variant={scanMode === 'scanned' ? 'outline' : 'default'}
            >
              {isRunning && scanMode !== 'fixing' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              {isRunning && scanMode !== 'fixing' ? `Scanning... ${progressPercent}%` : 'Scan (Preview)'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isRunning && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.offset} of ~{progress.total} posts processed
            </p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-5 gap-2">
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
              <p className="text-[10px] text-muted-foreground">Rewritten</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-500">{summary.totalReplaced}</p>
              <p className="text-[10px] text-muted-foreground">Replaced</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-500">{summary.totalStripped}</p>
              <p className="text-[10px] text-muted-foreground">Stripped</p>
            </div>
          </div>
        )}

        {scanMode === 'scanned' && !hasIssues && summary && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            All internal links are valid. No action needed.
          </div>
        )}

        {scanMode === 'scanned' && hasIssues && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            Preview only — no changes saved yet. Click "Apply Fixes" to commit.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <h4 className="text-xs font-semibold text-muted-foreground">
              Articles with issues ({results.length})
            </h4>
            {results.map((r, i) => (
              <div key={i} className="border rounded p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate max-w-[45%]">{r.postSlug}</span>
                  <div className="flex gap-1.5">
                    {r.fixed > 0 && (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {r.fixed}
                      </Badge>
                    )}
                    {r.replaced > 0 && (
                      <Badge variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] px-1.5 py-0">
                        <ArrowRightLeft className="h-2.5 w-2.5 mr-0.5" /> {r.replaced}
                      </Badge>
                    )}
                    {r.stripped > 0 && (
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0">
                        <Scissors className="h-2.5 w-2.5 mr-0.5" /> {r.stripped}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
