import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Plus, Tag, ExternalLink, Loader2 } from 'lucide-react';
import { PositionBadge } from './GscBadges';
import type { Recommendation } from './types';
import { useGscActions } from './useGscActions';

export default function OpportunitiesTab({ recs }: { recs: Recommendation | undefined }) {
  const { appliedActions, addToQueue, addKeyword } = useGscActions();

  if (!recs) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">
        Run "AI Analysis" to discover content opportunities from your GSC data.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {recs.uncoveredQueries?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" />Uncovered Queries</CardTitle>
            <CardDescription>Queries getting impressions but you have no dedicated content for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.uncoveredQueries.map((q, i) => {
              const queueKey = `uncovered-queue-${i}`;
              const kwKey = `uncovered-kw-${i}`;
              return (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">"{q.query}"</p>
                      <p className="text-sm text-muted-foreground">{q.impressions.toLocaleString()} impressions · Position {q.position.toFixed(1)}</p>
                    </div>
                    <Badge variant="outline">{q.suggestedVertical}</Badge>
                  </div>
                  <p className="text-sm"><strong>Suggested:</strong> {q.suggestedTitle}</p>
                  <p className="text-sm text-muted-foreground">{q.rationale}</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={appliedActions.has(queueKey) || addToQueue.isPending}
                      onClick={() => addToQueue.mutate({ title: q.suggestedTitle, articleType: q.suggestedArticleType, keyword: q.query, actionKey: queueKey })}
                    >
                      {addToQueue.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                      {appliedActions.has(queueKey) ? 'Queued ✓' : 'Add to Queue'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={appliedActions.has(kwKey) || addKeyword.isPending}
                      onClick={() => addKeyword.mutate({ keyword: q.query, vertical: q.suggestedVertical, actionKey: kwKey })}
                    >
                      {addKeyword.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Tag className="h-3 w-3 mr-1" />}
                      {appliedActions.has(kwKey) ? 'Added ✓' : 'Add as Keyword'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {recs.positionOpportunities?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" />Position Opportunities</CardTitle>
            <CardDescription>Queries close to page 1 that could rank higher with more content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.positionOpportunities.map((q, i) => {
              const queueKey = `position-queue-${i}`;
              return (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">"{q.query}" <PositionBadge position={q.position} /></p>
                    <span className="text-sm text-muted-foreground">{q.impressions.toLocaleString()} imp.</span>
                  </div>
                  <p className="text-sm"><strong>Action:</strong> {q.action}</p>
                  <p className="text-sm text-muted-foreground">{q.rationale}</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={appliedActions.has(queueKey) || addToQueue.isPending}
                      onClick={() => addToQueue.mutate({ title: `${q.query} — Optimization`, articleType: 'how-to', keyword: q.query, actionKey: queueKey })}
                    >
                      {addToQueue.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                      {appliedActions.has(queueKey) ? 'Queued ✓' : 'Add to Queue'}
                    </Button>
                    {q.page && (
                      <Button size="sm" variant="outline" onClick={() => window.open(q.page, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-1" />View Page
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
