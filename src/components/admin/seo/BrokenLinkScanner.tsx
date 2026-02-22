import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Wrench, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrokenLinkResult {
  postSlug: string;
  broken: number;
  fixed: number;
  unfixable: Array<{ url: string; reason: string }>;
}

interface ScanSummary {
  postsScanned: number;
  postsWithIssues: number;
  totalBrokenLinks: number;
  totalFixed: number;
  totalUnfixable: number;
}

export default function BrokenLinkScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<BrokenLinkResult[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [progress, setProgress] = useState({ offset: 0, total: 0 });

  const runBatch = async (mode: 'scan' | 'fix', batchSize = 200) => {
    const setter = mode === 'scan' ? setIsScanning : setIsFixing;
    setter(true);
    setResults([]);
    setSummary(null);

    let offset = 0;
    let allResults: BrokenLinkResult[] = [];
    let totalSummary: ScanSummary = {
      postsScanned: 0, postsWithIssues: 0,
      totalBrokenLinks: 0, totalFixed: 0, totalUnfixable: 0,
    };
    let totalPosts = 1; // will be updated

    try {
      while (offset < totalPosts) {
        setProgress({ offset, total: totalPosts });

        const { data, error } = await supabase.functions.invoke('fix-broken-links', {
          body: { mode, limit: batchSize, offset },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        totalPosts = data.pagination.totalPosts;
        totalSummary.postsScanned += data.summary.postsScanned;
        totalSummary.postsWithIssues += data.summary.postsWithIssues;
        totalSummary.totalBrokenLinks += data.summary.totalBrokenLinks;
        totalSummary.totalFixed += data.summary.totalFixed;
        totalSummary.totalUnfixable += data.summary.totalUnfixable;

        const issueResults = data.results.filter((r: BrokenLinkResult) => r.broken > 0);
        allResults = [...allResults, ...issueResults];
        setResults([...allResults]);
        setSummary({ ...totalSummary });

        offset += batchSize;

        // If this batch had 0 results, we've likely processed all affected posts
        if (data.summary.postsWithIssues === 0 && offset > totalPosts * 0.5) {
          break;
        }
      }

      toast.success(
        mode === 'fix'
          ? `Fixed ${totalSummary.totalFixed} broken links across ${totalSummary.postsWithIssues} articles`
          : `Found ${totalSummary.totalBrokenLinks} broken links in ${totalSummary.postsWithIssues} articles`
      );
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setter(false);
    }
  };

  const isRunning = isScanning || isFixing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Broken Link Scanner
        </CardTitle>
        <CardDescription>
          Detect and fix broken internal links across all published articles. 
          Handles old /blog/ URLs, category-path URLs, and bare slug links.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => runBatch('scan')}
            disabled={isRunning}
            variant="outline"
          >
            {isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            {isScanning ? 'Scanning...' : 'Scan for Broken Links'}
          </Button>
          <Button
            onClick={() => runBatch('fix')}
            disabled={isRunning}
            variant="default"
          >
            {isFixing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
            {isFixing ? 'Fixing...' : 'Scan & Fix All'}
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Processing batch {Math.floor(progress.offset / 200) + 1}... 
              ({progress.offset} of ~{progress.total} posts checked)
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{summary.postsScanned}</p>
              <p className="text-xs text-muted-foreground">Posts Scanned</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{summary.postsWithIssues}</p>
              <p className="text-xs text-muted-foreground">With Issues</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{summary.totalBrokenLinks}</p>
              <p className="text-xs text-muted-foreground">Broken Links</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{summary.totalFixed}</p>
              <p className="text-xs text-muted-foreground">Fixed</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{summary.totalUnfixable}</p>
              <p className="text-xs text-muted-foreground">Unfixable</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Articles with broken links ({results.length})
            </h3>
            {results.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[60%]">{r.postSlug}</span>
                  <div className="flex gap-2">
                    {r.fixed > 0 && (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {r.fixed} fixed
                      </Badge>
                    )}
                    {r.unfixable.length > 0 && (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                        <AlertTriangle className="h-3 w-3 mr-1" /> {r.unfixable.length} unfixable
                      </Badge>
                    )}
                  </div>
                </div>
                {r.unfixable.length > 0 && (
                  <div className="pl-3 border-l-2 border-destructive/20 space-y-1">
                    {r.unfixable.slice(0, 3).map((u, j) => (
                      <p key={j} className="text-xs text-muted-foreground">
                        <code className="bg-muted px-1 rounded">{u.url}</code>
                        <span className="ml-1">— {u.reason}</span>
                      </p>
                    ))}
                    {r.unfixable.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{r.unfixable.length - 3} more...
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
