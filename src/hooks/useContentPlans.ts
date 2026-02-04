import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ValueTier } from '@/config/articleTypes';

export interface ContentPlan {
  id: string;
  template_slug: string;
  template_name: string;
  category_id: string;
  subcategory_slug: string | null;
  value_tier: string;
  target_article_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentQueueItem {
  id: string;
  plan_id: string;
  article_type: string;
  suggested_title: string;
  suggested_keywords: string[];
  priority: number;
  status: string;
  blog_post_id: string | null;
  generated_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function useContentPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all content plans
  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['content-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContentPlan[];
    },
  });

  // Generate a new content plan
  const generatePlanMutation = useMutation({
    mutationFn: async (params: {
      templateSlug: string;
      templateName: string;
      categoryId: string;
      subcategorySlug?: string;
      valueTier: ValueTier;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-content-plan', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate plan');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-plans'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      toast({
        title: 'Content plan created!',
        description: `Generated ${data.queuedArticles?.length || 0} article ideas`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create plan',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Delete a content plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('content_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-plans'] });
      queryClient.invalidateQueries({ queryKey: ['content-queue'] });
      toast({ title: 'Plan deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete plan',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Get plan by template slug
  const getPlanByTemplate = useCallback((templateSlug: string) => {
    return plans?.find(p => p.template_slug === templateSlug);
  }, [plans]);

  // Get coverage stats
  const getCoverageStats = useCallback(() => {
    if (!plans) return { total: 0, byCategory: {} as Record<string, number> };
    
    const byCategory: Record<string, number> = {};
    plans.forEach(plan => {
      byCategory[plan.category_id] = (byCategory[plan.category_id] || 0) + 1;
    });

    return { total: plans.length, byCategory };
  }, [plans]);

  return {
    plans,
    plansLoading,
    plansError,
    generatePlan: generatePlanMutation.mutate,
    isGeneratingPlan: generatePlanMutation.isPending,
    deletePlan: deletePlanMutation.mutate,
    isDeletingPlan: deletePlanMutation.isPending,
    getPlanByTemplate,
    getCoverageStats,
  };
}
