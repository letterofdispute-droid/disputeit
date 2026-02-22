import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wrench, AlertTriangle, CheckCircle2, Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrokenLinkResult {
  postSlug: string;
  broken: number;
  fixed: number;
  stripped: number;
}

interface ScanSummary {
  postsScanned: number;
  postsWithIssues: number;
  totalBrokenLinks: number;
  totalFixed: number;
  totalStripped: number;
}

export default function BrokenLinkScanner() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<BrokenLinkResult[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [progress, setProgress] = useState({ offset: 0, total: 0 });

  const runBatch = async () => {
    setIsFixing(true);
    setResults([]);
    setSummary(null);

    let offset = 0;
    let allResults: BrokenLinkResult[] = [];
    let totalSummary: ScanSummary = {
      postsScanned: 0, postsWithIssues: 0,
      totalBrokenLinks: 0, totalFixed: 0, totalStripped: 0,
    };
    let totalPosts = 1;
    const batchSize = 200;

    try {
      while (offset < totalPosts) {
        setProgress({ offset, total: totalPosts });

        const { data, error } = await supabase.functions.invoke('fix-broken-links', {
          body: { mode: 'fix', limit: batchSize, offset },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        totalPosts = data.pagination.totalPosts;
        totalSummary.postsScanned += data.summary.postsScanned;
        totalSummary.postsWithIssues += data.summary.postsWithIssues;
        totalSummary.totalBrokenLinks += data.summary.totalBrokenLinks;
        totalSummary.totalFixed += data.summary.totalFixed;
        totalSummary.totalStripped += data.summary.totalStripped;

        const issueResults = data.results.filter((r: BrokenLinkResult) => r.broken > 0);
        allResults = [...allResults, ...issueResults];
        setResults([...allResults]);
        setSummary({ ...totalSummary });

        offset += batchSize;
      }

      toast.success(`Fixed ${totalSummary.totalFixed} links, stripped ${totalSummary.totalStripped} dead links across ${totalSummary.postsWithIssues} articles`);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsFixing(false);
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
              Broken Link Scanner
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Detect broken internal links, rewrite fixable ones, and strip dead links (keeping visible text)
            </CardDescription>
          </div>
          <Button
            onClick={runBatch}
            disabled={isFixing}
            size="sm"
          >
            {isFixing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
            {isFixing ? `Fixing... ${progressPercent}%` : 'Scan & Fix All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isFixing && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.offset} of ~{progress.total} posts processed
            </p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-4 gap-2">
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
              <p className="text-lg font-bold text-orange-500">{summary.totalStripped}</p>
              <p className="text-[10px] text-muted-foreground">Stripped</p>
            </div>
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
                  <span className="text-xs font-medium truncate max-w-[55%]">{r.postSlug}</span>
                  <div className="flex gap-1.5">
                    {r.fixed > 0 && (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {r.fixed}
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
