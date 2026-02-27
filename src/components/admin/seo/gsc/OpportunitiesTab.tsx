import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Plus, Tag, ExternalLink, Loader2, Rocket, Link2 } from 'lucide-react';
import { PositionBadge } from './GscBadges';
import type { Recommendation } from './types';
import { useGscActions } from './useGscActions';
import { supabase } from '@/integrations/supabase/client';
import CampaignFromQueryDialog from './CampaignFromQueryDialog';

interface ExistingPost { id: string; title: string; slug: string; category_slug: string; primary_keyword: string | null; }

export default function OpportunitiesTab({ recs }: { recs: Recommendation | undefined }) {
  const { appliedActions, addToQueue, addKeyword, attachToExisting } = useGscActions();
  const [existingPosts, setExistingPosts] = useState<ExistingPost[]>([]);
  const [campaignDialog, setCampaignDialog] = useState<{ open: boolean; idx: number }>({ open: false, idx: 0 });

  // Fetch published posts for pillar matching
  useEffect(() => {
    if (!recs?.uncoveredQueries?.length) return;
    supabase.from('blog_posts')
      .select('id, title, slug, category_slug, primary_keyword')
      .eq('status', 'published')
      .limit(500)
      .then(({ data }) => { if (data) setExistingPosts(data); });
  }, [recs?.uncoveredQueries]);

  // Match existing posts to queries
  const pillarMatches = useMemo(() => {
    if (!recs?.uncoveredQueries?.length) return {};
    const matches: Record<number, ExistingPost> = {};
    recs.uncoveredQueries.forEach((q, i) => {
      const queryWords = q.query.toLowerCase().split(/\s+/);
      const match = existingPosts.find(p => {
        const titleWords = p.title.toLowerCase();
        const kwMatch = p.primary_keyword?.toLowerCase().includes(q.query.toLowerCase());
        const wordOverlap = queryWords.filter(w => w.length > 3 && titleWords.includes(w)).length;
        return kwMatch || wordOverlap >= 2;
      });
      if (match) matches[i] = match;
    });
    return matches;
  }, [recs?.uncoveredQueries, existingPosts]);

  if (!recs) {
    return (
      <Card><CardContent className="py-8 text-center text-muted-foreground">
        Run "AI Analysis" to discover content opportunities from your GSC data.
      </CardContent></Card>
    );
  }

  const activeQuery = recs.uncoveredQueries?.[campaignDialog.idx];

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
              const campaignKey = `uncovered-campaign-${i}`;
              const attachKey = `uncovered-attach-${i}`;
              const matchedPillar = pillarMatches[i];

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
                  {q.suggestedClusters?.length ? (
                    <p className="text-xs text-muted-foreground">+ {q.suggestedClusters.length} cluster ideas available</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{q.rationale}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* Primary: Create Campaign */}
                    <Button
                      size="sm"
                      disabled={appliedActions.has(campaignKey)}
                      onClick={() => setCampaignDialog({ open: true, idx: i })}
                    >
                      <Rocket className="h-3 w-3 mr-1" />
                      {appliedActions.has(campaignKey) ? 'Campaign Created ✓' : 'Create Campaign'}
                    </Button>

                    {/* Conditional: Link to Existing */}
                    {matchedPillar && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={appliedActions.has(attachKey) || attachToExisting.isPending}
                        onClick={() => attachToExisting.mutate({
                          existingPostId: matchedPillar.id,
                          clusters: q.suggestedClusters?.length
                            ? q.suggestedClusters
                            : [{ title: q.suggestedTitle, articleType: q.suggestedArticleType, keyword: q.query }],
                          actionKey: attachKey,
                        })}
                      >
                        {attachToExisting.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                        {appliedActions.has(attachKey) ? 'Attached ✓' : `Link to "${matchedPillar.title.substring(0, 30)}…"`}
                      </Button>
                    )}

                    {/* Secondary: Add Single */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={appliedActions.has(queueKey) || addToQueue.isPending}
                      onClick={() => addToQueue.mutate({ title: q.suggestedTitle, articleType: q.suggestedArticleType, keyword: q.query, actionKey: queueKey })}
                    >
                      {addToQueue.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                      {appliedActions.has(queueKey) ? 'Queued ✓' : 'Add Single'}
                    </Button>

                    {/* Keyword */}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={appliedActions.has(kwKey) || addKeyword.isPending}
                      onClick={() => addKeyword.mutate({ keyword: q.query, vertical: q.suggestedVertical, actionKey: kwKey })}
                    >
                      {addKeyword.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Tag className="h-3 w-3 mr-1" />}
                      {appliedActions.has(kwKey) ? 'Added ✓' : 'Keyword'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Campaign Dialog */}
      {activeQuery && (
        <CampaignFromQueryDialog
          open={campaignDialog.open}
          onOpenChange={(open) => setCampaignDialog(prev => ({ ...prev, open }))}
          query={activeQuery.query}
          pillarTitle={activeQuery.suggestedTitle}
          pillarType={activeQuery.suggestedArticleType}
          vertical={activeQuery.suggestedVertical}
          suggestedClusters={activeQuery.suggestedClusters}
          actionKey={`uncovered-campaign-${campaignDialog.idx}`}
        />
      )}

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