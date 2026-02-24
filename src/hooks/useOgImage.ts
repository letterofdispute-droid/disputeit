import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OgImageRow {
  page_key: string;
  image_url: string;
}

// Fetch all OG images (small table, <50 rows) and cache for the session
function useOgImages() {
  return useQuery({
    queryKey: ['og-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('og_images')
        .select('page_key, image_url');
      if (error) throw error;
      const map = new Map<string, string>();
      (data as OgImageRow[])?.forEach(r => map.set(r.page_key, r.image_url));
      return map;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2,
  });
}

/**
 * Derive the OG image page key from a canonical path.
 * Returns the most specific key, falling back to category inheritance.
 */
export function derivePageKey(canonicalPath: string): string {
  const p = canonicalPath.replace(/\/+$/, '') || '/';

  // Homepage
  if (p === '/') return 'homepage';

  // Static pages (exact match)
  const staticMap: Record<string, string> = {
    '/pricing': 'pricing',
    '/faq': 'faq',
    '/about': 'about',
    '/contact': 'contact',
    '/how-it-works': 'how-it-works',
    '/deadlines': 'deadlines',
    '/analyze-letter': 'analyze-letter',
    '/consumer-news': 'consumer-news',
    '/do-i-have-a-case': 'do-i-have-a-case',
    '/state-rights': 'state-rights',
    '/small-claims': 'small-claims-hub',
    '/small-claims/cost-calculator': 'small-claims-cost-calculator',
    '/small-claims/demand-letter-cost': 'small-claims-demand-letter',
    '/small-claims/escalation-guide': 'small-claims-escalation',
    '/small-claims/statement-generator': 'small-claims-hub',
  };
  if (staticMap[p]) return staticMap[p];

  // State rights pages → inherit state-rights image
  if (p.startsWith('/state-rights/')) return 'state-rights';

  // Small claims state pages → inherit small-claims-hub
  if (p.startsWith('/small-claims/')) return 'small-claims-hub';

  // Template / subcategory / guide pages → inherit category image
  const categoryMatch = p.match(/^\/(templates|guides)\/([a-z0-9-]+)/);
  if (categoryMatch) {
    return `category-${categoryMatch[2]}`;
  }

  // Fallback
  return 'homepage';
}

/**
 * Hook to get the OG image URL for a given canonical path.
 * Falls back through: specific page → category → homepage → undefined.
 */
export function useOgImage(canonicalPath: string): string | undefined {
  const { data: ogMap } = useOgImages();
  if (!ogMap) return undefined;

  const key = derivePageKey(canonicalPath);

  // Direct match
  if (ogMap.has(key)) return ogMap.get(key);

  // If it's a category key, fallback to homepage
  if (key.startsWith('category-') && ogMap.has('homepage')) return ogMap.get('homepage');

  // Final fallback
  return ogMap.get('homepage');
}
