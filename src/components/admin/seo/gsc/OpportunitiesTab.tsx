import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Plus, Tag, ExternalLink, Loader2, Rocket, Link2, Info } from 'lucide-react';
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

  // Match existing posts to queries with coverage counting
  const coverageData = useMemo(() => {
    if (!recs?.uncoveredQueries?.length) return {};
    const data: Record<number, { count: number; bestMatch: ExistingPost | null }> = {};
    recs.uncoveredQueries.forEach((q, i) => {
      const queryWords = q.query.toLowerCase().split(/\s+/);
      const matches = existingPosts.filter(p => {
        const titleWords = p.title.toLowerCase();
        const kwMatch = p.primary_keyword?.toLowerCase().includes(q.query.toLowerCase());
        const wordOverlap = queryWords.filter(w => w.length > 3 && titleWords.includes(w)).length;
        return kwMatch || wordOverlap >= 2;
      });
      data[i] = { count: matches.length, bestMatch: matches[0] ?? null };
    });
    return data;
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
              const coverage = coverageData[i];
              const matchedPillar = coverage?.bestMatch;
              const count = coverage?.count ?? 0;
              const highCoverage = count >= 5;

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

                  {/* Smart coverage badge */}
                  {highCoverage && (
                    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-500/10 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                      <Info className="h-4 w-4 shrink-0" />
                      You already have {count} articles covering this topic — consider adding as cluster to existing pillar
                    </div>
                  )}
                  {count >= 1 && count < 5 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />{count} related article{count > 1 ? 's' : ''} exist{count === 1 ? 's' : ''}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {highCoverage ? (
                      <>
                        {/* High coverage: Link to Existing is primary */}
                        {matchedPillar && (
                          <Button
                            size="sm"
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={appliedActions.has(queueKey) || addToQueue.isPending}
                          onClick={() => addToQueue.mutate({ title: q.suggestedTitle, articleType: q.suggestedArticleType, keyword: q.query, actionKey: queueKey })}
                        >
                          {addToQueue.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                          {appliedActions.has(queueKey) ? 'Queued ✓' : 'Add Single'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={appliedActions.has(campaignKey)}
                          onClick={() => setCampaignDialog({ open: true, idx: i })}
                        >
                          <Rocket className="h-3 w-3 mr-1" />
                          {appliedActions.has(campaignKey) ? 'Campaign Created ✓' : 'Create Campaign'}
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Low/no coverage: Campaign is primary */}
                        <Button
                          size="sm"
                          disabled={appliedActions.has(campaignKey)}
                          onClick={() => setCampaignDialog({ open: true, idx: i })}
                        >
                          <Rocket className="h-3 w-3 mr-1" />
                          {appliedActions.has(campaignKey) ? 'Campaign Created ✓' : 'Create Campaign'}
                        </Button>
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={appliedActions.has(queueKey) || addToQueue.isPending}
                          onClick={() => addToQueue.mutate({ title: q.suggestedTitle, articleType: q.suggestedArticleType, keyword: q.query, actionKey: queueKey })}
                        >
                          {addToQueue.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                          {appliedActions.has(queueKey) ? 'Queued ✓' : 'Add Single'}
                        </Button>
                      </>
                    )}
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