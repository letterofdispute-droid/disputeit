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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// Acronyms that should be uppercased
const ACRONYMS = new Set(['atm', 'hoa', 'mot', 'sms', 'pcp', 'fscs', 'hvac', 'hr', 'nhs', 'fca', 'dpa', 'gdpr', 'ccpa', 'ftc', 'p45', 'p60', 'gap']);

function cleanTemplateName(name: string): string {
  let cleaned = name
    // Only strip "Letter", "Template", and compound suffixes - keep Dispute/Complaint/Claim
    .replace(/\s*(Complaint Letter|Dispute Letter|Claim Letter|Letter|Template)(\s*\(.*?\))?\s*$/i, '')
    // Convert slashes to "and"
    .replace(/\//g, ' and ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Fix acronym casing: "Atm" → "ATM", "Hoa" → "HOA"
  cleaned = cleaned.replace(/\b\w+\b/g, (word) => {
    if (ACRONYMS.has(word.toLowerCase())) return word.toUpperCase();
    return word;
  });

  return cleaned;
}

const PILLAR_TITLE_PATTERNS: Array<(topic: string) => string> = [
  (t) => `The Complete Guide to ${t}`,
  (t) => `${t}: What You Need to Know`,
  (t) => `Understanding ${t}: A Consumer's Guide`,
  (t) => `${t} Explained: Your Rights and Options`,
  (t) => `How to Handle a ${t}`,
  (t) => `${t}: A Step-by-Step Guide`,
  (t) => `Everything You Need to Know About ${t}`,
  (t) => `Your Complete Rights and Options for ${t}`,
  (t) => `${t}: What Consumers Should Know`,
  (t) => `A Consumer's Guide to ${t}`,
  (t) => `${t}: Know Your Rights`,
  (t) => `What to Do About ${t}`,
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPillarTitle(templateName: string, templateSlug: string): string {
  const cleaned = cleanTemplateName(templateName);
  const idx = simpleHash(templateSlug) % PILLAR_TITLE_PATTERNS.length;
  return PILLAR_TITLE_PATTERNS[idx](cleaned);
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

  // Count plans missing pillar articles in the queue
  const { data: missingPillarCount } = useQuery({
    queryKey: ['missing-pillar-count'],
    queryFn: async () => {
      const { count: totalPlans } = await supabase
        .from('content_plans')
        .select('id', { count: 'exact', head: true });
      const { count: pillarCount } = await supabase
        .from('content_queue')
        .select('id', { count: 'exact', head: true })
        .eq('article_type', 'pillar');
      return Math.max(0, (totalPlans || 0) - (pillarCount || 0));
    },
  });

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
        suggested_title: getPillarTitle(plan.template_name, plan.template_slug),
        suggested_keywords: [
          cleanTemplateName(plan.template_name).toLowerCase(),
          `${cleanTemplateName(plan.template_name).toLowerCase()} guide`,
          'consumer rights',
          'dispute letter',
        ],
        priority: 1,
        status: 'queued' as const,
      }));

      const { error } = await supabase.from('content_queue').insert(pillarItems);
      if (error) throw error;

      return { queued: pillarItems.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-progress'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['missing-pillar-count'] });
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
  
  // Create missing plans mutation
  const createMissingPlansMutation = useMutation({
    mutationFn: async () => {
      // Get all existing plan slugs from DB
      const { data: existingPlans } = await supabase
        .from('content_plans')
        .select('template_slug');
      
      const existingSlugs = new Set(existingPlans?.map(p => p.template_slug) || []);
      
      // Find templates without plans
      const missing = allTemplates.filter(t => !existingSlugs.has(t.slug));
      if (missing.length === 0) return { created: 0 };

      // Build insert rows
      const rows = missing.map(t => {
        const categoryId = getCategoryIdFromName(t.category);
        const tier = getTierForCategory(categoryId);
        const tierConfig = VALUE_TIERS[tier];
        return {
          template_slug: t.slug,
          template_name: t.title,
          category_id: categoryId,
          subcategory_slug: t.subcategorySlug || null,
          value_tier: tier,
          target_article_count: tierConfig.articleCount,
        };
      });

      const { error } = await supabase.from('content_plans').insert(rows);
      if (error) throw error;
      return { created: rows.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-plans'] });
      queryClient.invalidateQueries({ queryKey: ['template-progress'] });
      toast({
        title: 'Missing plans created',
        description: `${data.created} content plans added`,
      });
    },
    onError: (error) => {
      toast({ title: 'Failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
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
            {plans?.length || 0} of {allTemplates.length} templates with content plans
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {plans && plans.length < allTemplates.length && (
            <Button
              onClick={() => createMissingPlansMutation.mutate()}
              disabled={createMissingPlansMutation.isPending}
              size="sm"
              variant="default"
            >
              {createMissingPlansMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="h-4 w-4 mr-1.5" /> Create {allTemplates.length - plans.length} Missing Plans</>
              )}
            </Button>
          )}
          {(missingPillarCount ?? 0) > 0 && (
            <Button
              onClick={() => createAllPillarsMutation.mutate()}
              disabled={createAllPillarsMutation.isPending || !plans || plans.length === 0}
              size="sm"
              variant="outline"
            >
              {createAllPillarsMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Queuing...</>
              ) : (
                <><Crown className="h-4 w-4 mr-1.5" /> Create {missingPillarCount} Missing Pillars</>
              )}
            </Button>
          )}
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
