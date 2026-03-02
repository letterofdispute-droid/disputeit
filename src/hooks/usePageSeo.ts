import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsePageSeoOptions {
  slug: string;
  fallbackTitle: string;
  fallbackDescription: string;
}

export function usePageSeo({ slug, fallbackTitle, fallbackDescription }: UsePageSeoOptions) {
  const { data, isLoading } = useQuery({
    queryKey: ['page-seo', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('meta_title, meta_description')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.warn('Failed to fetch page SEO:', error.message);
        return null;
      }
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  return {
    title: data?.meta_title || fallbackTitle,
    description: data?.meta_description || fallbackDescription,
    isLoaded: !isLoading,
  };
}
