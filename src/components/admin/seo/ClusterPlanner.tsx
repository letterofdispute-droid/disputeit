import { useState, useMemo } from 'react';
import { Loader2, Sparkles, RotateCcw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useContentPlans, ContentPlan } from '@/hooks/useContentPlans';
import { useContentQueue } from '@/hooks/useContentQueue';
import { ARTICLE_TYPES, VALUE_TIERS, ValueTier, getArticleTypesForTier } from '@/config/articleTypes';

interface ClusterPlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    slug: string;
    name: string;
    categoryId: string;
    subcategorySlug?: string;
  } | null;
  existingPlan?: ContentPlan;
}

export default function ClusterPlanner({
  open,
  onOpenChange,
  template,
  existingPlan,
}: ClusterPlannerProps) {
  const { generatePlan, isGeneratingPlan } = useContentPlans();
  const { queueItems, bulkGenerate, isBulkGenerating, retryFailed, isRetrying, getStaleGeneratingItems, resetStaleItems, isResettingStale } = useContentQueue(existingPlan?.id);
  
  const [valueTier, setValueTier] = useState<ValueTier>(
    (existingPlan?.value_tier as ValueTier) || 'medium'
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(getArticleTypesForTier(valueTier).map(t => t.id))
  );

  // Get queue items for this plan
  const planQueueItems = queueItems?.filter(q => q.plan_id === existingPlan?.id) || [];
  
  // Detect stale items (stuck in generating for >10 minutes)
  const staleItems = useMemo(() => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return planQueueItems.filter(item => {
      if (item.status !== 'generating') return false;
      return new Date(item.created_at) < tenMinutesAgo;
    });
  }, [planQueueItems]);

  const handleMarkStaleAsFailed = () => {
    const staleIds = staleItems.map(i => i.id);
    if (staleIds.length > 0) {
      resetStaleItems(staleIds);
    }
  };

  // Calculate stats
  const stats = {
    queued: planQueueItems.filter(i => i.status === 'queued').length,
    generating: planQueueItems.filter(i => i.status === 'generating').length,
    generated: planQueueItems.filter(i => i.status === 'generated' || i.status === 'published').length,
    failed: planQueueItems.filter(i => i.status === 'failed').length,
  };
  
  const failedItems = planQueueItems.filter(i => i.status === 'failed');
  const hasFailedItems = failedItems.length > 0;
  const hasQueuedItems = stats.queued > 0;
  const isAllComplete = planQueueItems.length > 0 && stats.queued === 0 && stats.generating === 0;

  const handleTierChange = (tier: ValueTier) => {
    setValueTier(tier);
    setSelectedTypes(new Set(getArticleTypesForTier(tier).map(t => t.id)));
  };

  const toggleArticleType = (typeId: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
    } else {
      newSelected.add(typeId);
    }
    setSelectedTypes(newSelected);
  };

  const handleCreatePlan = () => {
    if (!template) return;
    
    generatePlan({
      templateSlug: template.slug,
      templateName: template.name,
      categoryId: template.categoryId,
      subcategorySlug: template.subcategorySlug,
      valueTier,
    });
  };

  const handleGenerateAll = () => {
    if (!existingPlan) return;
    
    // Get IDs of all queued items for this plan
    const queuedIds = planQueueItems
      .filter(item => item.status === 'queued')
      .map(item => item.id);
    
    if (queuedIds.length === 0) return;
    
    bulkGenerate({
      planId: existingPlan.id,
      queueItemIds: queuedIds,
      batchSize: queuedIds.length,
    });
  };

  const handleRetryAll = () => {
    const failedIds = failedItems.map(i => i.id);
    if (failedIds.length > 0) {
      retryFailed(failedIds);
    }
  };

  const handleRetryItem = (itemId: string) => {
    retryFailed([itemId]);
  };

  if (!template) return null;

  const getStatusBadge = (item: typeof planQueueItems[0]) => {
    const status = item.status;
    
    if (status === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="cursor-help">
                failed
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{item.error_message || 'Unknown error'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (status === 'generated' || status === 'published') {
      return <Badge variant="default">{status}</Badge>;
    }
    
    if (status === 'generating') {
      return <Badge variant="secondary">generating...</Badge>;
    }
    
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Content Cluster: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Value Tier Selection */}
          <div className="space-y-2">
            <Label>Value Tier</Label>
            <Select 
              value={valueTier} 
              onValueChange={(v) => handleTierChange(v as ValueTier)}
              disabled={!!existingPlan}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VALUE_TIERS).map(tier => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-muted-foreground">
                        ({tier.articleCount} articles)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {VALUE_TIERS[valueTier].description}
            </p>
          </div>

          {/* Stats Bar - only show for existing plans with items */}
          {/* Stale Items Warning */}
          {staleItems.length > 0 && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {staleItems.length} article{staleItems.length > 1 ? 's appear' : ' appears'} stuck (generating for 10+ min)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkStaleAsFailed}
                  disabled={isResettingStale}
                  className="ml-4"
                >
                  {isResettingStale ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Resetting...</>
                  ) : (
                    'Mark as failed & retry'
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {existingPlan && planQueueItems.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
              {stats.generated > 0 && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{stats.generated} generated</span>
                </div>
              )}
              {stats.failed > 0 && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span>{stats.failed} failed</span>
                </div>
              )}
              {stats.queued > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{stats.queued} queued</span>
                </div>
              )}
              {stats.generating > 0 && (
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{stats.generating} generating</span>
                </div>
              )}
            </div>
          )}

          {/* Article Types */}
          <div className="space-y-3">
            <Label>Article Plan</Label>
            <div className="border rounded-lg divide-y">
              {existingPlan && planQueueItems.length > 0 ? (
                // Show actual queue items for existing plan
                planQueueItems.map(item => {
                  const typeInfo = ARTICLE_TYPES.find(t => t.id === item.article_type);
                  const isFailed = item.status === 'failed';
                  
                  return (
                    <div key={item.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Checkbox checked disabled />
                            <span className="font-medium text-sm">{typeInfo?.name || item.article_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 pl-6 truncate">
                            {item.suggested_title}
                          </p>
                          {item.suggested_keywords && item.suggested_keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pl-6">
                              {item.suggested_keywords.slice(0, 4).map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isFailed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryItem(item.id)}
                              disabled={isRetrying}
                              className="h-7 px-2"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {getStatusBadge(item)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show article type selection for new plan
                ARTICLE_TYPES.map(type => {
                  const isSelected = selectedTypes.has(type.id);
                  const isIncludedInTier = getArticleTypesForTier(valueTier).some(t => t.id === type.id);
                  
                  return (
                    <div 
                      key={type.id} 
                      className={`p-3 ${!isIncludedInTier ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={type.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleArticleType(type.id)}
                          disabled={!isIncludedInTier}
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={type.id} 
                            className="font-medium text-sm cursor-pointer"
                          >
                            {type.name}
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {type.displayHint}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {existingPlan ? (
              <>
                {/* For existing plans */}
                {isAllComplete && !hasFailedItems ? (
                  // All done successfully
                  <Button onClick={() => onOpenChange(false)}>
                    Done
                  </Button>
                ) : hasFailedItems && !hasQueuedItems ? (
                  // Has failures, nothing queued
                  <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Done
                    </Button>
                    <Button 
                      onClick={handleRetryAll}
                      disabled={isRetrying}
                      variant="destructive"
                    >
                      {isRetrying ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Retrying...</>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retry All Failed ({stats.failed})
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  // Has queued items
                  <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    {hasFailedItems && (
                      <Button 
                        onClick={handleRetryAll}
                        disabled={isRetrying || isBulkGenerating}
                        variant="secondary"
                      >
                        {isRetrying ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Retrying...</>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retry Failed ({stats.failed})
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      onClick={handleGenerateAll}
                      disabled={isBulkGenerating || isRetrying || !hasQueuedItems}
                    >
                      {isBulkGenerating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        `Generate All Queued (${stats.queued})`
                      )}
                    </Button>
                  </>
                )}
              </>
            ) : (
              // For new plans
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePlan}
                  disabled={isGeneratingPlan || selectedTypes.size === 0}
                >
                  {isGeneratingPlan ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    'Create Plan'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
