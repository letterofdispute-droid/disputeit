import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { getBlogPostBySlug, getBlogPostsByCategory, blogPosts as staticBlogPosts } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight, ArrowRight, User, Share2, Eye, Twitter, Linkedin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import RelatedTemplatesCTA from '@/components/article/RelatedTemplatesCTA';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  category_slug: string;
  author: string;
  published_at: string | null;
  read_time: string | null;
  featured_image_url: string | null;
  featured: boolean;
  views: number;
  meta_title: string | null;
  meta_description: string | null;
  related_templates: string[] | null;
}

const ArticlePage = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const [copied, setCopied] = useState(false);

  // Fetch from database first, fall back to static data
  const { data: dbPost, isLoading: dbLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) throw error;
      return data as BlogPost | null;
    },
  });

  // Fetch related posts from database
  const { data: dbRelatedPosts } = useQuery({
    queryKey: ['related-posts', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('category_slug', category)
        .eq('status', 'published')
        .neq('slug', slug)
        .limit(3);
      
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!category,
  });

  // Fall back to static data if database is empty
  const staticPost = slug ? getBlogPostBySlug(slug) : undefined;
  const staticRelatedPosts = category 
    ? getBlogPostsByCategory(category).filter(p => p.slug !== slug).slice(0, 3)
    : [];

  // Use database post if available, otherwise static
  const post = dbPost || (staticPost ? {
    slug: staticPost.slug,
    title: staticPost.title,
    excerpt: staticPost.excerpt,
    content: staticPost.content,
    category: staticPost.category,
    category_slug: staticPost.categorySlug,
    author: staticPost.author,
    published_at: staticPost.publishedAt,
    read_time: staticPost.readTime,
    featured_image_url: staticPost.image || null,
    featured: staticPost.featured || false,
    views: 0,
    meta_title: null,
    meta_description: null,
    related_templates: null,
  } : null);

  const relatedPosts = dbRelatedPosts && dbRelatedPosts.length > 0 
    ? dbRelatedPosts 
    : staticRelatedPosts.map(p => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        category: p.category,
        category_slug: p.categorySlug,
        author: p.author,
        published_at: p.publishedAt,
        read_time: p.readTime,
        featured_image_url: p.image || null,
        featured: p.featured || false,
        views: 0,
        meta_title: null,
        meta_description: null,
      }));

  // Calculate reading time if not provided
  const calculatedReadTime = useMemo(() => {
    if (post?.read_time) return post.read_time;
    if (!post?.content) return '5 min read';
    const words = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  }, [post]);

  // Generate table of contents from headings
  const tableOfContents = useMemo(() => {
    if (!post?.content) return [];
    const headingRegex = /<h([23])[^>]*>([^<]+)<\/h[23]>|^##\s+(.+)$|^###\s+(.+)$/gm;
    const toc: { level: number; text: string; id: string }[] = [];
    
    // Also check for markdown-style headings
    const markdownH2 = post.content.match(/^## .+$/gm) || [];
    const markdownH3 = post.content.match(/^### .+$/gm) || [];
    
    markdownH2.forEach(h => {
      const text = h.replace(/^## /, '');
      toc.push({ level: 2, text, id: text.toLowerCase().replace(/\s+/g, '-') });
    });
    
    return toc;
  }, [post]);

  // Share functionality
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post?.title || '')}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  // Sanitize HTML content
  const sanitizedContent = useMemo(() => {
    if (!post?.content) return '';
    
    // Convert markdown-style headings to HTML
    let html = post.content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel', 'style', 'colspan', 'rowspan'],
    });
  }, [post?.content]);

  // Generate Article JSON-LD schema
  const articleSchema = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.meta_title || post.title,
    "description": post.meta_description || post.excerpt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "DisputeLetters",
      "url": "https://disputeletters.com"
    },
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "image": post.featured_image_url || undefined,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": shareUrl
    }
  } : null;

  if (dbLoading) {
    return (
      <Layout>
        <section className="bg-primary py-12 md:py-16">
          <div className="container-narrow">
            <Skeleton className="h-8 w-32 mb-4 bg-primary-foreground/20" />
            <Skeleton className="h-12 w-full mb-4 bg-primary-foreground/20" />
            <Skeleton className="h-6 w-64 bg-primary-foreground/20" />
          </div>
        </section>
      </Layout>
    );
  }

  if (!post) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <Layout>
      <SEOHead 
        title={post.meta_title || `${post.title} | DisputeLetters Blog`}
        description={post.meta_description || post.excerpt || ''}
        canonicalPath={`/articles/${post.category_slug}/${post.slug}`}
      />

      {/* JSON-LD Schema */}
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}

      {/* Breadcrumb */}
      <section className="bg-muted/50 py-4 border-b border-border">
        <div className="container-wide">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/articles" className="text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to={`/articles/${post.category_slug}`} className="text-muted-foreground hover:text-foreground">
              {post.category}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{post.title}</span>
          </nav>
        </div>
      </section>

      {/* Article Header */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-narrow">
          <Badge variant="secondary" className="mb-4">{post.category}</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-primary-foreground/70">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {calculatedReadTime}
            </span>
            {post.views > 0 && (
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {post.views.toLocaleString()} views
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image_url && (
        <section className="bg-background -mt-8">
          <div className="container-narrow">
            <img 
              src={post.featured_image_url} 
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl shadow-elevated"
            />
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <div className="flex gap-8">
            {/* Main Content */}
            <article className="flex-1 prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
              
              {/* Related Templates CTA - Embedded in content */}
              {post.related_templates && post.related_templates.length > 0 && (
                <RelatedTemplatesCTA 
                  templateSlugs={post.related_templates} 
                  categorySlug={post.category_slug}
                />
              )}
            </article>

            {/* Sidebar with TOC and Share */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Share Buttons */}
                <div className="p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share this article
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShareTwitter}>
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareLinkedIn}>
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Table of Contents */}
                {tableOfContents.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <h3 className="font-semibold text-sm text-foreground mb-3">Table of Contents</h3>
                    <nav className="space-y-2">
                      {tableOfContents.map((item, index) => (
                        <a 
                          key={index}
                          href={`#${item.id}`}
                          className={`block text-sm text-muted-foreground hover:text-primary transition-colors ${item.level === 3 ? 'pl-4' : ''}`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Mobile Share Buttons */}
          <div className="lg:hidden mt-8 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share this article
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareTwitter}>
                <Twitter className="h-4 w-4 mr-2" /> Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareLinkedIn}>
                <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 mr-2 text-accent" /> : <Copy className="h-4 w-4 mr-2" />} Copy Link
              </Button>
            </div>
          </div>

          {/* Article CTA */}
          <div className="mt-12 p-8 bg-accent/10 rounded-2xl border border-accent/20 text-center">
            <h3 className="font-serif text-xl font-bold text-foreground mb-3">
              Ready to Write Your Letter?
            </h3>
            <p className="text-muted-foreground mb-6">
              Use our pre-validated templates to create a professional complaint letter in minutes.
            </p>
            <Button variant="accent" size="lg" asChild>
              <Link to="/#letters">
                Create Your Letter <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container-wide">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.slug} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {relatedPost.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={relatedPost.featured_image_url} 
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {relatedPost.category}
                    </Badge>
                    <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                      <Link to={`/articles/${relatedPost.category_slug}/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {relatedPost.read_time || '5 min read'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ArticlePage;
