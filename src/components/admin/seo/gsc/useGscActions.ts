import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const VALID_ARTICLE_TYPES = ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist'];

function normalizeArticleType(type: string): string {
  const lower = type.toLowerCase().replace(/\s+/g, '-');
  if (VALID_ARTICLE_TYPES.includes(lower)) return lower;
  return 'how-to'; // safe default
}

function extractSlugFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

export function useGscActions() {
  const queryClient = useQueryClient();
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  const markApplied = (key: string) => {
    setAppliedActions(prev => new Set(prev).add(key));
  };

  const addToQueueMutation = useMutation({
    mutationFn: async ({ title, articleType, keyword }: { title: string; articleType: string; keyword: string; actionKey: string }) => {
      const { error } = await supabase.from('content_queue').insert({
        suggested_title: title,
        article_type: normalizeArticleType(articleType),
        primary_keyword: keyword,
        status: 'queued',
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      markApplied(vars.actionKey);
      toast({ title: 'Added to Queue', description: `"${vars.title}" queued for generation.` });
      queryClient.invalidateQueries({ queryKey: ['seo-content-queue'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const addKeywordMutation = useMutation({
    mutationFn: async ({ keyword, vertical }: { keyword: string; vertical: string; actionKey: string }) => {
      const { error } = await supabase.from('keyword_targets').insert({
        keyword,
        vertical,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      markApplied(vars.actionKey);
      toast({ title: 'Keyword Added', description: `"${vars.keyword}" added to targets.` });
      queryClient.invalidateQueries({ queryKey: ['keyword-targets'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const applyMetaTagsMutation = useMutation({
    mutationFn: async ({ pageUrl, metaTitle, metaDescription }: { pageUrl: string; metaTitle: string; metaDescription: string; actionKey: string }) => {
      const slug = extractSlugFromUrl(pageUrl);
      if (!slug) throw new Error('Could not extract slug from URL');
      const { error } = await supabase.from('blog_posts')
        .update({ meta_title: metaTitle, meta_description: metaDescription })
        .eq('slug', slug);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      markApplied(vars.actionKey);
      toast({ title: 'Meta Tags Applied', description: 'Blog post meta tags updated.' });
      queryClient.invalidateQueries({ queryKey: ['seo-metrics'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const createCampaignMutation = useMutation({
    mutationFn: async ({ pillarTitle, pillarType, pillarKeyword, vertical, clusters, actionKey }: {
      pillarTitle: string; pillarType: string; pillarKeyword: string; vertical: string;
      clusters: Array<{ title: string; articleType: string; keyword: string }>;
      actionKey: string;
    }) => {
      // 1. Create content plan
      const planSlug = `gsc-campaign-${vertical}-${Date.now()}`;
      const { data: plan, error: planErr } = await supabase.from('content_plans').insert({
        template_slug: planSlug,
        template_name: `GSC: ${pillarTitle.substring(0, 60)}`,
        category_id: vertical,
        target_article_count: 1 + clusters.length,
        value_tier: 'high',
      }).select('id').single();
      if (planErr) throw planErr;

      // 2. Create pillar queue item (priority 100)
      const { data: pillar, error: pillarErr } = await supabase.from('content_queue').insert({
        plan_id: plan.id,
        suggested_title: pillarTitle,
        article_type: normalizeArticleType(pillarType),
        primary_keyword: pillarKeyword,
        priority: 100,
        status: 'queued',
      }).select('id').single();
      if (pillarErr) throw pillarErr;

      // 3. Create cluster queue items linked to pillar
      if (clusters.length > 0) {
        const clusterRows = clusters.map(c => ({
          plan_id: plan.id,
          parent_queue_id: pillar.id,
          suggested_title: c.title,
          article_type: normalizeArticleType(c.articleType),
          primary_keyword: c.keyword,
          priority: 50,
          status: 'queued',
        }));
        const { error: clusterErr } = await supabase.from('content_queue').insert(clusterRows);
        if (clusterErr) throw clusterErr;
      }
    },
    onSuccess: (_, vars) => {
      markApplied(vars.actionKey);
      toast({ title: 'Campaign Created', description: `Pillar + ${vars.clusters.length} clusters queued.` });
      queryClient.invalidateQueries({ queryKey: ['seo-content-queue'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const attachToExistingMutation = useMutation({
    mutationFn: async ({ existingPostId, clusters, actionKey }: {
      existingPostId: string; clusters: Array<{ title: string; articleType: string; keyword: string }>;
      actionKey: string;
    }) => {
      // Find the queue item for existing post (if any) to use as parent
      const { data: existingQueue } = await supabase.from('content_queue')
        .select('id').eq('blog_post_id', existingPostId).limit(1).single();

      const parentId = existingQueue?.id ?? null;

      const clusterRows = clusters.map(c => ({
        parent_queue_id: parentId,
        suggested_title: c.title,
        article_type: normalizeArticleType(c.articleType),
        primary_keyword: c.keyword,
        priority: 50,
        status: 'queued',
      }));
      const { error } = await supabase.from('content_queue').insert(clusterRows);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      markApplied(vars.actionKey);
      toast({ title: 'Clusters Queued', description: `${vars.clusters.length} cluster articles linked to existing pillar.` });
      queryClient.invalidateQueries({ queryKey: ['seo-content-queue'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  return {
    appliedActions,
    addToQueue: addToQueueMutation,
    addKeyword: addKeywordMutation,
    applyMetaTags: applyMetaTagsMutation,
    createCampaign: createCampaignMutation,
    attachToExisting: attachToExistingMutation,
  };
}
