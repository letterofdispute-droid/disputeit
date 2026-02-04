import { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const { queueItems, bulkGenerate, isBulkGenerating } = useContentQueue(existingPlan?.id);
  
  const [valueTier, setValueTier] = useState<ValueTier>(
    (existingPlan?.value_tier as ValueTier) || 'medium'
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(getArticleTypesForTier(valueTier).map(t => t.id))
  );

  // Get queue items for this plan
  const planQueueItems = queueItems?.filter(q => q.plan_id === existingPlan?.id) || [];

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
    
    bulkGenerate({
      planId: existingPlan.id,
      batchSize: 10,
    });
  };

  if (!template) return null;

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

          {/* Article Types */}
          <div className="space-y-3">
            <Label>Article Plan</Label>
            <div className="border rounded-lg divide-y">
              {existingPlan && planQueueItems.length > 0 ? (
                // Show actual queue items for existing plan
                planQueueItems.map(item => {
                  const typeInfo = ARTICLE_TYPES.find(t => t.id === item.article_type);
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
                        <Badge 
                          variant={
                            item.status === 'generated' || item.status === 'published' 
                              ? 'default' 
                              : item.status === 'failed' 
                                ? 'destructive' 
                                : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
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
                            {type.purpose}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Template: {type.titleTemplate}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {existingPlan ? (
              <Button 
                onClick={handleGenerateAll}
                disabled={isBulkGenerating || planQueueItems.filter(q => q.status === 'queued').length === 0}
              >
                {isBulkGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  'Generate All Queued'
                )}
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
