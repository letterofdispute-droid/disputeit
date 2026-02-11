import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  fromEmail: string;
  supportEmail: string;
  pdfOnlyPrice: number;
  pdfEditablePrice: number;
  editUnlockPrice: number;
}

const defaults: SiteSettings = {
  siteName: 'Letter of Dispute',
  siteUrl: 'https://letterofdispute.com',
  siteDescription: 'Professional AI-powered dispute letters',
  fromEmail: 'noreply@letterofdispute.com',
  supportEmail: 'support@letterofdispute.com',
  pdfOnlyPrice: 9.99,
  pdfEditablePrice: 14.99,
  editUnlockPrice: 5.99,
};

export const useSiteSettings = () => {
  const { data: settings = defaults, isLoading } = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) {
        console.error('Failed to fetch site settings:', error);
        return defaults;
      }

      const map: Record<string, string> = {};
      data?.forEach(item => { map[item.key] = item.value || ''; });

      return {
        siteName: map.site_name || defaults.siteName,
        siteUrl: map.site_url || defaults.siteUrl,
        siteDescription: map.site_description || defaults.siteDescription,
        fromEmail: map.from_email || defaults.fromEmail,
        supportEmail: map.support_email || defaults.supportEmail,
        pdfOnlyPrice: parseFloat(map.pdf_only_price) || defaults.pdfOnlyPrice,
        pdfEditablePrice: parseFloat(map.pdf_editable_price) || defaults.pdfEditablePrice,
        editUnlockPrice: parseFloat(map.edit_unlock_price) || defaults.editUnlockPrice,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return { ...settings, formatPrice, isLoading };
};
