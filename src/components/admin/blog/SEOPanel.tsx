import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SEOPanelProps {
  metaTitle: string;
  metaDescription: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onTagsSuggested?: (tags: string[]) => void;
  onExcerptSuggested?: (excerpt: string) => void;
  title: string;
  content: string;
  excerpt: string;
}

const SEOPanel = ({
  metaTitle,
  metaDescription,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onTagsSuggested,
  onExcerptSuggested,
  title,
  content,
  excerpt,
}: SEOPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateSEO = async () => {
    if (!title && !content) {
      toast({
        title: 'Content required',
        description: 'Please add a title or content before generating SEO.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo', {
        body: { title, content, excerpt },
      });

      if (error) throw error;

      if (data.metaTitle) {
        onMetaTitleChange(data.metaTitle);
      }
      if (data.metaDescription) {
        onMetaDescriptionChange(data.metaDescription);
      }
      if (data.suggestedTags && onTagsSuggested) {
        onTagsSuggested(data.suggestedTags);
      }
      if (data.suggestedExcerpt && onExcerptSuggested) {
        onExcerptSuggested(data.suggestedExcerpt);
      }

      toast({
        title: 'SEO generated',
        description: 'SEO metadata has been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating SEO:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate SEO. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">SEO Settings</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSEO}
            disabled={isGenerating}
            className="h-7 text-xs"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Generate with AI
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaTitle" className="text-xs">Meta Title</Label>
            <span className={`text-xs ${metaTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {metaTitle.length}/60
            </span>
          </div>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder="SEO title for search engines..."
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription" className="text-xs">Meta Description</Label>
            <span className={`text-xs ${metaDescription.length > 155 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {metaDescription.length}/155
            </span>
          </div>
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="SEO description for search engines..."
            className="text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Google Preview */}
        <div className="pt-3 border-t border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Google Preview</Label>
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <div className="text-primary text-sm font-medium truncate">
              {metaTitle || title || 'Page Title'}
            </div>
            <div className="text-xs text-green-600 truncate">
              yoursite.com/articles/{title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'page-url'}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {metaDescription || 'No meta description set. Add a compelling description to improve click-through rates.'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SEOPanel;
