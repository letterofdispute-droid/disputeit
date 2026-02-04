import { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Eye, 
  CheckCircle2,
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentPlans, ContentPlan } from '@/hooks/useContentPlans';
import { useContentQueue } from '@/hooks/useContentQueue';
import { allTemplates } from '@/data/allTemplates';
import { templateCategories } from '@/data/templateCategories';
import { VALUE_TIERS, ValueTier } from '@/config/articleTypes';
import ClusterPlanner from './ClusterPlanner';

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

export default function TemplateCoverageMap() {
  const { plans, plansLoading, generatePlan, isGeneratingPlan } = useContentPlans();
  const { queueItems } = useContentQueue();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    slug: string;
    name: string;
    categoryId: string;
    subcategorySlug?: string;
  } | null>(null);

  // Group templates by category
  const categoryGroups = useMemo((): CategoryGroup[] => {
    const groups: Record<string, CategoryGroup> = {};
    
    allTemplates.forEach(template => {
      const categoryId = template.category;
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

  // Get article count for a template
  const getArticleCount = (templateSlug: string): { generated: number; total: number } => {
    const plan = getPlanForTemplate(templateSlug);
    if (!plan) return { generated: 0, total: 0 };
    
    const templateQueueItems = queueItems?.filter(q => q.plan_id === plan.id) || [];
    const generated = templateQueueItems.filter(q => 
      q.status === 'generated' || q.status === 'published'
    ).length;
    
    return { generated, total: plan.target_article_count };
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

  const handlePlanAllCategory = async (categoryId: string, tier: ValueTier = 'medium') => {
    const category = categoryGroups.find(g => g.id === categoryId);
    if (!category) return;

    // Get templates without plans
    const templatesWithoutPlans = category.templates.filter(
      t => !getPlanForTemplate(t.slug)
    );

    for (const template of templatesWithoutPlans.slice(0, 5)) { // Limit to 5 at a time
      generatePlan({
        templateSlug: template.slug,
        templateName: template.name,
        categoryId: template.categoryId,
        subcategorySlug: template.subcategorySlug,
        valueTier: tier,
      });
    }
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Template Coverage</h3>
          <p className="text-sm text-muted-foreground">
            {plans?.length || 0} templates with content plans • {allTemplates.length} total templates
          </p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
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

      {/* Category list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {filteredGroups.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const templatesWithPlans = category.templates.filter(t => getPlanForTemplate(t.slug));
          const coveragePercent = Math.round((templatesWithPlans.length / category.templates.length) * 100);

          return (
            <Collapsible key={category.id} open={isExpanded}>
              <div className="rounded-lg border bg-card">
                <CollapsibleTrigger
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({category.templates.length} templates)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
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
                      disabled={isGeneratingPlan}
                    >
                      Plan All
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
                          className="flex items-center justify-between px-4 py-3 pl-11 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate text-sm">{template.name}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            {plan ? (
                              <>
                                <div className="flex items-center gap-2 w-32">
                                  <Progress value={progress} className="h-2" />
                                  <span className="text-xs text-muted-foreground w-14">
                                    {generated}/{total}
                                  </span>
                                </div>
                                <Badge 
                                  variant={progress === 100 ? 'default' : 'secondary'}
                                  className="w-20 justify-center"
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
                                  onClick={() => handleCreatePlan(template)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="w-32" />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreatePlan(template)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Create Plan
                                </Button>
                              </>
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
    </div>
  );
}
