import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ALL_PAGE_KEYS = [
  'homepage', 'pricing', 'faq', 'about', 'contact', 'how-it-works',
  'deadlines', 'analyze-letter', 'consumer-news', 'do-i-have-a-case',
  'small-claims-hub', 'small-claims-cost-calculator', 'small-claims-demand-letter', 'small-claims-escalation',
  'state-rights',
  'category-refunds', 'category-housing', 'category-travel', 'category-damaged-goods',
  'category-utilities', 'category-financial', 'category-insurance', 'category-vehicle',
  'category-healthcare', 'category-employment', 'category-ecommerce', 'category-hoa', 'category-contractors',
];

export default function OgImageManager() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

  const { data: ogImages, isLoading } = useQuery({
    queryKey: ['admin-og-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('og_images')
        .select('*')
        .order('page_key');
      if (error) throw error;
      return data as Array<{ id: string; page_key: string; image_url: string; prompt_used: string; created_at: string; updated_at: string }>;
    },
  });

  const existingKeys = new Set(ogImages?.map(i => i.page_key) || []);
  const missingKeys = ALL_PAGE_KEYS.filter(k => !existingKeys.has(k));
  const existingCount = existingKeys.size;
  const totalCount = ALL_PAGE_KEYS.length;

  const generateAll = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-og-images', {
        body: { pages: missingKeys.length > 0 ? missingKeys : undefined, regenerate: missingKeys.length === 0 },
      });
      if (error) throw error;
      toast.success(data.message || 'OG images generated');
      queryClient.invalidateQueries({ queryKey: ['admin-og-images'] });
      queryClient.invalidateQueries({ queryKey: ['og-images'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate OG images');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateOne = async (key: string) => {
    setRegeneratingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke('generate-og-images', {
        body: { pages: [key], regenerate: true },
      });
      if (error) throw error;
      toast.success(`Regenerated ${key}`);
      queryClient.invalidateQueries({ queryKey: ['admin-og-images'] });
      queryClient.invalidateQueries({ queryKey: ['og-images'] });
    } catch (err: any) {
      toast.error(err.message || `Failed to regenerate ${key}`);
    } finally {
      setRegeneratingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">OG Social Images</CardTitle>
          <Badge variant={missingKeys.length === 0 ? 'default' : 'secondary'}>
            {existingCount}/{totalCount}
          </Badge>
        </div>
        <Button
          onClick={generateAll}
          disabled={isGenerating}
          size="sm"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
          ) : missingKeys.length > 0 ? (
            `Generate ${missingKeys.length} Missing`
          ) : (
            'Regenerate All'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_PAGE_KEYS.map(key => {
              const image = ogImages?.find(i => i.page_key === key);
              return (
                <div
                  key={key}
                  className="border border-border rounded-lg p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{key}</span>
                    {image ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {image ? (
                    <>
                      <img
                        src={image.image_url}
                        alt={`OG image for ${key}`}
                        className="w-full aspect-[1200/630] object-cover rounded bg-muted"
                        loading="lazy"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => regenerateOne(key)}
                        disabled={regeneratingKey === key}
                      >
                        {regeneratingKey === key ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Regenerate
                      </Button>
                    </>
                  ) : (
                    <div className="w-full aspect-[1200/630] bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      Not generated
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
