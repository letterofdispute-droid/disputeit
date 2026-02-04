import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';
import type { GeneratedContent } from '@/hooks/useGenerateBlogContent';

interface ContentPreviewProps {
  content: GeneratedContent;
}

export function ContentPreview({ content }: ContentPreviewProps) {
  const sanitizedContent = DOMPurify.sanitize(content.content, {
    ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Preview</CardTitle>
          <Badge variant="outline">{content.word_count} words</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            {content.title}
          </h2>
        </div>

        {/* Excerpt */}
        <p className="text-muted-foreground text-sm italic border-l-2 border-primary pl-3">
          {content.excerpt}
        </p>

        {/* Content */}
        <div 
          className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* SEO Info */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="font-semibold text-sm text-foreground">SEO Preview</h4>
          <div className="bg-muted rounded-lg p-3 space-y-1">
            <p className="text-primary text-sm font-medium line-clamp-1">
              {content.seo_title}
            </p>
            <p className="text-xs text-green-600">
              letterofdispute.com/articles/...
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {content.seo_description}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {content.suggested_tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* LSI Keywords */}
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-2">LSI Keywords</h4>
          <div className="flex flex-wrap gap-1">
            {content.lsi_keywords.map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
