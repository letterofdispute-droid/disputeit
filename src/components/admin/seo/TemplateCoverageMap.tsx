import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Eye, 
  CheckCircle2,
  Loader2,
  FileText,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentPlans, ContentPlan } from '@/hooks/useContentPlans';
import { useTemplateProgress } from '@/hooks/useTemplateProgress';
import { useCategoryTierSettings } from '@/hooks/useCategoryTierSettings';
import { useBulkPlanningJob } from '@/hooks/useBulkPlanningJob';
import { allTemplates, getCategoryIdFromName } from '@/data/allTemplates';
import { templateCategories } from '@/data/templateCategories';
import { VALUE_TIERS, ValueTier } from '@/config/articleTypes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ClusterPlanner from './ClusterPlanner';
import BulkPlanConfirmDialog from './BulkPlanConfirmDialog';
import BulkPlanningProgress from './BulkPlanningProgress';

interface CategoryGroup {
  id: string;
  name: string;
  templates: Array<{
    slug: string;
    name: string;
    categoryId: string;
    subcategorySlug?: string;
  }>;
}

interface BulkPlanState {
  categoryId: string;
  categoryName: string;
  templates: CategoryGroup['templates'];
}

export default function TemplateCoverageMap() {
  const { plans, plansLoading, isGeneratingPlan } = useContentPlans();
  const { data: templateProgress, isLoading: progressLoading } = useTemplateProgress();
  const { getTierForCategory } = useCategoryTierSettings();
  const { allActiveJobs, startBulkPlan, isStarting, retryFailed, isRetrying, cancelJob, isCancelling, invalidateJobs } = useBulkPlanningJob();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bulk pillar creation mutation
  const createAllPillarsMutation = useMutation({
    mutationFn: async () => {
      // Find all content plans that don't have a pillar article in the queue
      const { data: allPlans } = await supabase.from('content_plans').select('id, template_slug, template_name, category_id');
      if (!allPlans || allPlans.length === 0) throw new Error('No content plans found');

      // Check which plans already have a pillar queued
      const { data: existingPillars } = await supabase
        .from('content_queue')
        .select('plan_id')
        .eq('article_type', 'pillar');

      const existingPillarPlanIds = new Set(existingPillars?.map(p => p.plan_id) || []);
      const plansWithoutPillar = allPlans.filter(p => !existingPillarPlanIds.has(p.id));

      if (plansWithoutPillar.length === 0) {
        return { queued: 0, message: 'All plans already have pillar articles' };
      }

      // Queue pillar articles for each plan
      const pillarItems = plansWithoutPillar.map(plan => ({
        plan_id: plan.id,
        article_type: 'pillar' as const,
        suggested_title: `The Complete Guide to ${plan.template_name}`,
        suggested_keywords: [
          plan.template_name.toLowerCase(),
          `${plan.template_name.toLowerCase()} guide`,
          'consumer rights',
          'dispute letter',
        ],
        priority: 200,
        status: 'queued' as const,
      }));

      const { error } = await supabase.from('content_queue').insert(pillarItems);
      if (error) throw error;

      return { queued: pillarItems.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-progress'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast({
        title: 'Pillar articles queued',
        description: data.queued > 0
          ? `${data.queued} pillar articles added to the generation queue`
          : data.message || 'All plans already have pillars',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to queue pillars',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    slug: string;
    name: string;
    categoryId: string;
    subcategorySlug?: string;
  } | null>(null);
  
  // Bulk plan confirmation dialog state
  const [bulkPlanState, setBulkPlanState] = useState<BulkPlanState | null>(null);
  
  // Track dismissed job IDs
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());
  
  // Get active job for a category
  const getActiveJobForCategory = (categoryId: string) => {
    return allActiveJobs?.find(j => j.category_id === categoryId && !dismissedJobs.has(j.id));
  };
  
  // Refresh data when jobs complete
  useEffect(() => {
    const completedJobs = allActiveJobs?.filter(j => j.status !== 'processing') || [];
    if (completedJobs.length > 0) {
      invalidateJobs();
    }
  }, [allActiveJobs, invalidateJobs]);

  // Group templates by category
  const categoryGroups = useMemo((): CategoryGroup[] => {
    const groups: Record<string, CategoryGroup> = {};
    
    allTemplates.forEach(template => {
      const categoryId = getCategoryIdFromName(template.category);
      if (!groups[categoryId]) {
        const category = templateCategories.find(c => c.id === categoryId);
        groups[categoryId] = {
          id: categoryId,
          name: category?.name || categoryId,
          templates: [],
        };
      }
      groups[categoryId].templates.push({
        slug: template.slug,
        name: template.title, // Use 'title' from LetterTemplate
        categoryId: template.category,
        subcategorySlug: template.subcategorySlug,
      });
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Get plan for a template
  const getPlanForTemplate = (templateSlug: string): ContentPlan | undefined => {
    return plans?.find(p => p.template_slug === templateSlug);
  };

  // Get article count for a template - uses aggregated data from useTemplateProgress
  const getArticleCount = (templateSlug: string): { generated: number; total: number } => {
    const plan = getPlanForTemplate(templateSlug);
    if (!plan) return { generated: 0, total: 0 };
    
    // Use pre-aggregated progress data instead of filtering queue items
    const progress = templateProgress?.[templateSlug];
    if (progress) {
      return { generated: progress.generated, total: progress.total };
    }
    
    // Fallback to target count if no queue items yet
    return { generated: 0, total: plan.target_article_count };
  };

  // Filter categories
  const filteredGroups = categoryFilter === 'all' 
    ? categoryGroups 
    : categoryGroups.filter(g => g.id === categoryFilter);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreatePlan = (template: typeof selectedTemplate) => {
    if (!template) return;
    setSelectedTemplate(template);
    setPlannerOpen(true);
  };

  // Open confirmation dialog for bulk planning
  const handlePlanAllCategory = (categoryId: string) => {
    const category = categoryGroups.find(g => g.id === categoryId);
    if (!category) return;

    // Get templates without plans
    const templatesWithoutPlans = category.templates.filter(
      t => !getPlanForTemplate(t.slug)
    );

    if (templatesWithoutPlans.length === 0) return;

    setBulkPlanState({
      categoryId,
      categoryName: category.name,
      templates: templatesWithoutPlans,
    });
  };

  // Execute bulk plan creation after confirmation (now async)
  const handleConfirmBulkPlan = () => {
    if (!bulkPlanState) return;
    
    const tier = getTierForCategory(bulkPlanState.categoryId);
    
    // Start async bulk planning job
    startBulkPlan({
      categoryId: bulkPlanState.categoryId,
      categoryName: bulkPlanState.categoryName,
      valueTier: tier,
      templates: bulkPlanState.templates.map(t => ({
        slug: t.slug,
        name: t.name,
        subcategorySlug: t.subcategorySlug,
      })),
    });
    
    // Close dialog immediately - progress shows inline
    setBulkPlanState(null);
  };
  
  // Dismiss a completed job from the UI
  const handleDismissJob = (jobId: string) => {
    setDismissedJobs(prev => new Set([...prev, jobId]));
    invalidateJobs();
  };

  if (plansLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Template Coverage</h3>
          <p className="text-sm text-muted-foreground">
            {plans?.length || 0} templates with content plans • {allTemplates.length} total templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => createAllPillarsMutation.mutate()}
            disabled={createAllPillarsMutation.isPending || !plans || plans.length === 0}
            size="sm"
            variant="outline"
          >
            {createAllPillarsMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Queuing...</>
            ) : (
              <><Crown className="h-4 w-4 mr-1.5" /> Create All Pillars</>
            )}
          </Button>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryGroups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {filteredGroups.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const templatesWithPlans = category.templates.filter(t => getPlanForTemplate(t.slug));
          const templatesWithoutPlans = category.templates.length - templatesWithPlans.length;
          const coveragePercent = Math.round((templatesWithPlans.length / category.templates.length) * 100);
          const categoryTier = getTierForCategory(category.id);
          const activeJob = getActiveJobForCategory(category.id);

          return (
            <Collapsible key={category.id} open={isExpanded}>
              <div className="rounded-lg border bg-card">
                {/* Show inline progress bar when job is active */}
                {activeJob && (
                  <div className="p-3 border-b">
                    <BulkPlanningProgress 
                      job={activeJob} 
                      onDismiss={activeJob.status !== 'processing' ? () => handleDismissJob(activeJob.id) : undefined}
                      onRetryFailed={activeJob.failed_templates > 0 ? () => retryFailed(activeJob) : undefined}
                      onCancelJob={() => cancelJob(activeJob.id)}
                      isRetrying={isRetrying}
                      isCancelling={isCancelling}
                    />
                  </div>
                )}
                <CollapsibleTrigger
                  onClick={() => toggleCategory(category.id)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full p-4 gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="text-left flex flex-wrap items-center gap-1">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({category.templates.length} templates)
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {VALUE_TIERS[categoryTier].name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-7 sm:pl-0">
                    <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-32">
                      <Progress value={coveragePercent} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">
                        {coveragePercent}%
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanAllCategory(category.id);
                      }}
                      disabled={isGeneratingPlan || isStarting || !!getActiveJobForCategory(category.id) || templatesWithoutPlans === 0}
                    >
                      {templatesWithoutPlans === 0 ? 'All Planned' : `Plan ${templatesWithoutPlans}`}
                    </Button>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t divide-y">
                    {category.templates.map(template => {
                      const plan = getPlanForTemplate(template.slug);
                      const { generated, total } = getArticleCount(template.slug);
                      const progress = total > 0 ? Math.round((generated / total) * 100) : 0;

                      return (
                        <div
                          key={template.slug}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 pl-7 sm:pl-11 gap-2 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate text-sm">{template.name}</span>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-4 justify-end">
                            {plan ? (
                              <>
                                <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-32">
                                  <Progress value={progress} className="h-2" />
                                  <span className="text-xs text-muted-foreground w-14 shrink-0">
                                    {generated}/{total}
                                  </span>
                                </div>
                                <Badge 
                                  variant={progress === 100 ? 'default' : 'secondary'}
                                  className="w-16 sm:w-20 justify-center text-xs shrink-0"
                                >
                                  {progress === 100 ? (
                                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Done</>
                                  ) : (
                                    VALUE_TIERS[plan.value_tier as ValueTier]?.name || plan.value_tier
                                  )}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="shrink-0"
                                  onClick={() => handleCreatePlan(template)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreatePlan(template)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create Plan
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Cluster Planner Modal */}
      <ClusterPlanner
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        template={selectedTemplate}
        existingPlan={selectedTemplate ? getPlanForTemplate(selectedTemplate.slug) : undefined}
      />

      {/* Bulk Plan Confirmation Dialog */}
      <BulkPlanConfirmDialog
        open={!!bulkPlanState}
        onOpenChange={(open) => !open && setBulkPlanState(null)}
        categoryName={bulkPlanState?.categoryName || ''}
        templateCount={bulkPlanState?.templates.length || 0}
        valueTier={bulkPlanState ? getTierForCategory(bulkPlanState.categoryId) : 'medium'}
        onConfirm={handleConfirmBulkPlan}
        isLoading={isStarting}
      />
    </div>
  );
}
