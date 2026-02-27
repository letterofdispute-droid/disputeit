import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Copy, Check, Loader2 } from 'lucide-react';
import { CtrIndicator } from './GscBadges';
import { toast } from '@/hooks/use-toast';
import type { Recommendation } from './types';
import { useGscActions } from './useGscActions';

export default function QuickWinsTab({ recs }: { recs: Recommendation | undefined }) {
  const { appliedActions, applyMetaTags } = useGscActions();

  if (!recs?.quickWins?.length) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">
        {recs ? 'No quick wins found.' : 'Run "AI Analysis" to find quick wins.'}
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />Quick Wins — Improve Meta Tags</CardTitle>
        <CardDescription>Pages with high impressions but low CTR. Better titles can drive immediate traffic gains.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recs.quickWins.map((q, i) => {
          const applyKey = `quickwin-apply-${i}`;
          return (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">"{q.query}"</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{q.page}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{q.impressions.toLocaleString()} imp.</p>
                  <CtrIndicator ctr={q.ctr} />
                </div>
              </div>
              <div className="bg-muted/50 rounded p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Title</Badge>
                  <span className="text-sm font-medium">{q.suggestedMetaTitle}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                    navigator.clipboard.writeText(q.suggestedMetaTitle);
                    toast({ title: 'Copied!' });
                  }}><Copy className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Desc</Badge>
                  <span className="text-sm">{q.suggestedMetaDescription}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                    navigator.clipboard.writeText(q.suggestedMetaDescription);
                    toast({ title: 'Copied!' });
                  }}><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{q.rationale}</p>
              <Button
                size="sm"
                disabled={appliedActions.has(applyKey) || applyMetaTags.isPending}
                onClick={() => applyMetaTags.mutate({
                  pageUrl: q.page,
                  metaTitle: q.suggestedMetaTitle,
                  metaDescription: q.suggestedMetaDescription,
                  actionKey: applyKey,
                })}
              >
                {applyMetaTags.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : appliedActions.has(applyKey) ? <Check className="h-3 w-3 mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                {appliedActions.has(applyKey) ? 'Applied ✓' : 'Apply Meta Tags'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
