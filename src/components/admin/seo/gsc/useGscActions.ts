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

  return {
    appliedActions,
    addToQueue: addToQueueMutation,
    addKeyword: addKeywordMutation,
    applyMetaTags: applyMetaTagsMutation,
  };
}
