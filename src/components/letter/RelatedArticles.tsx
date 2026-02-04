import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedArticlesProps {
  templateSlug: string;
  categorySlug: string;
  maxItems?: number;
}

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  category_slug: string;
  read_time: string | null;
  featured_image_url: string | null;
  article_type: string | null;
  published_at: string | null;
}

export function RelatedArticles({ templateSlug, categorySlug, maxItems = 4 }: RelatedArticlesProps) {
  // Fetch articles that have this template in their related_templates array
  const { data: articles, isLoading } = useQuery({
    queryKey: ['related-articles', templateSlug],
    queryFn: async () => {
      // First try to find articles with this template in related_templates
      const { data: linkedArticles, error: linkedError } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category, category_slug, read_time, featured_image_url, article_type, published_at')
        .contains('related_templates', [templateSlug])
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(maxItems);

      if (linkedError) throw linkedError;
      
      // If we have enough linked articles, return them
      if (linkedArticles && linkedArticles.length >= maxItems) {
        return linkedArticles as BlogPost[];
      }

      // Otherwise, supplement with category articles
      const existingSlugs = linkedArticles?.map(a => a.slug) || [];
      const remaining = maxItems - (linkedArticles?.length || 0);
      
      const { data: categoryArticles, error: categoryError } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category, category_slug, read_time, featured_image_url, article_type, published_at')
        .eq('category_slug', categorySlug)
        .eq('status', 'published')
        .not('slug', 'in', existingSlugs.length > 0 ? `(${existingSlugs.join(',')})` : '()')
        .order('published_at', { ascending: false })
        .limit(remaining);

      if (categoryError) throw categoryError;

      return [...(linkedArticles || []), ...(categoryArticles || [])] as BlogPost[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container-wide">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  const getArticleTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      'how-to': 'How-To Guide',
      'mistakes': 'Avoid Mistakes',
      'rights': 'Know Your Rights',
      'sample': 'Examples',
      'faq': 'FAQ',
      'case-study': 'Case Study',
      'comparison': 'Comparison',
      'checklist': 'Checklist',
    };
    return type ? labels[type] || type : null;
  };

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container-wide">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Related Articles
            </h2>
          </div>
          <Link 
            to={`/articles/${categorySlug}`}
            className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <Card 
              key={article.slug} 
              className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50"
            >
              {article.featured_image_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img 
                    src={article.featured_image_url} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  {article.article_type && (
                    <Badge variant="secondary" className="text-xs">
                      {getArticleTypeLabel(article.article_type)}
                    </Badge>
                  )}
                </div>
                <CardTitle className="font-serif text-base leading-tight group-hover:text-primary transition-colors">
                  <Link to={`/articles/${article.category_slug}/${article.slug}`}>
                    {article.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.read_time || '5 min read'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedArticles;

