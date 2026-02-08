import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ValueTier } from '@/config/articleTypes';

export type CategoryTierDefaults = Record<string, ValueTier>;

// Default tier recommendations based on typical traffic patterns
const DEFAULT_CATEGORY_TIERS: CategoryTierDefaults = {
  travel: 'high',
  insurance: 'high',
  financial: 'high',
  housing: 'medium',
  vehicle: 'medium',
  healthcare: 'medium',
  refunds: 'medium',
  utilities: 'medium',
  ecommerce: 'medium',
  employment: 'medium',
  'damaged-goods': 'medium',
  hoa: 'longtail',
  contractors: 'longtail',
};

const SETTINGS_KEY = 'category_seo_tiers';

export function useCategoryTierSettings() {
  const queryClient = useQueryClient();

  const { data: tierSettings, isLoading } = useQuery({
    queryKey: ['category-tier-settings'],
    queryFn: async (): Promise<CategoryTierDefaults> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .single();

      if (error) {
        // If not found, return defaults (first-time setup)
        if (error.code === 'PGRST116') {
          return DEFAULT_CATEGORY_TIERS;
        }
        throw error;
      }

      try {
        const parsed = JSON.parse(data.value || '{}');
        // Merge with defaults to ensure all categories have a tier
        return { ...DEFAULT_CATEGORY_TIERS, ...parsed };
      } catch {
        return DEFAULT_CATEGORY_TIERS;
      }
    },
    // Override global staleTime - admin settings should always be fresh
    staleTime: 0,
    refetchOnMount: true,
  });

  const updateTierSettings = useMutation({
    mutationFn: async (newSettings: CategoryTierDefaults) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', SETTINGS_KEY)
        .single();

      const settingsValue = JSON.stringify(newSettings);

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: settingsValue, updated_at: new Date().toISOString() })
          .eq('key', SETTINGS_KEY);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key: SETTINGS_KEY, value: settingsValue });
        
        if (error) throw error;
      }

      return newSettings;
    },
    onSuccess: (newSettings) => {
      // Update cache immediately for optimistic UI
      queryClient.setQueryData(['category-tier-settings'], newSettings);
      // Also invalidate to ensure other components get fresh data
      queryClient.invalidateQueries({ queryKey: ['category-tier-settings'] });
      toast.success('Category tier settings saved');
    },
    onError: (error) => {
      console.error('Failed to save tier settings:', error);
      toast.error('Failed to save settings');
    },
  });

  const updateCategoryTier = (categoryId: string, tier: ValueTier) => {
    const current = tierSettings || DEFAULT_CATEGORY_TIERS;
    updateTierSettings.mutate({ ...current, [categoryId]: tier });
  };

  const getTierForCategory = (categoryId: string): ValueTier => {
    return tierSettings?.[categoryId] || DEFAULT_CATEGORY_TIERS[categoryId] || 'medium';
  };

  return {
    tierSettings: tierSettings || DEFAULT_CATEGORY_TIERS,
    isLoading,
    updateCategoryTier,
    updateTierSettings: updateTierSettings.mutate,
    isUpdating: updateTierSettings.isPending,
    getTierForCategory,
    defaultTiers: DEFAULT_CATEGORY_TIERS,
  };
}
