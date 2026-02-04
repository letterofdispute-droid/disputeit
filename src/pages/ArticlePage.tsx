import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { getBlogPostBySlug, getBlogPostsByCategory } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight, ArrowRight, User, Share2, Eye, Twitter, Linkedin, Copy, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useMemo, useEffect } from 'react';
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
  middle_image_1_url?: string | null;
  middle_image_2_url?: string | null;
}

const ArticlePage = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const [copied, setCopied] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setReadProgress(Math.min((scrolled / total) * 100, 100));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const toc: { level: number; text: string; id: string }[] = [];
    
    // Check for markdown-style headings
    const markdownH2 = post.content.match(/^## .+$/gm) || [];
    
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

  // Sanitize HTML content with smart middle image injection
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
    
    // Replace middle image placeholders with actual images
    const hasPlaceholder1 = html.includes('{{MIDDLE_IMAGE_1}}');
    const hasPlaceholder2 = html.includes('{{MIDDLE_IMAGE_2}}');

    if (post.middle_image_1_url) {
      if (hasPlaceholder1) {
        html = html.replace(
          /{{MIDDLE_IMAGE_1}}/g,
          `<figure class="article-middle-image"><img src="${post.middle_image_1_url}" alt="" loading="lazy" /></figure>`
        );
      } else {
        // Smart injection: insert image approximately 45% through the content
        const paragraphs = html.split('</p>');
        const midPoint = Math.floor(paragraphs.length * 0.45);
        if (midPoint > 0 && paragraphs.length > 3) {
          paragraphs.splice(midPoint, 0, 
            `</p><figure class="article-middle-image"><img src="${post.middle_image_1_url}" alt="" loading="lazy" /></figure><p>`
          );
          html = paragraphs.join('</p>');
        }
      }
    } else {
      html = html.replace(/{{MIDDLE_IMAGE_1}}/g, '');
    }

    if (post.middle_image_2_url) {
      if (hasPlaceholder2) {
        html = html.replace(
          /{{MIDDLE_IMAGE_2}}/g,
          `<figure class="article-middle-image"><img src="${post.middle_image_2_url}" alt="" loading="lazy" /></figure>`
        );
      } else if (post.middle_image_1_url) {
        // Smart injection: insert second image approximately 75% through
        const paragraphs = html.split('</p>');
        const insertPoint = Math.floor(paragraphs.length * 0.75);
        if (insertPoint > 0 && paragraphs.length > 5) {
          paragraphs.splice(insertPoint, 0, 
            `</p><figure class="article-middle-image"><img src="${post.middle_image_2_url}" alt="" loading="lazy" /></figure><p>`
          );
          html = paragraphs.join('</p>');
        }
      }
    } else {
      html = html.replace(/{{MIDDLE_IMAGE_2}}/g, '');
    }

    // Handle legacy {{MIDDLE_IMAGE}} placeholder
    html = html.replace(/{{MIDDLE_IMAGE}}/g, '');
    
    // Wrap in paragraph if not already
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel', 'style', 'colspan', 'rowspan', 'loading'],
    });
  }, [post?.content, post?.middle_image_1_url, post?.middle_image_2_url]);

  // Branded author display - always use LoD Contributor
  const displayAuthor = "LoD Contributor";
  const authorInitials = "LoD";

  // Generate Article JSON-LD schema with correct branding
  const articleSchema = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.meta_title || post.title,
    "description": post.meta_description || post.excerpt,
    "author": {
      "@type": "Person",
      "name": "LoD Contributor"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Letter Of Dispute",
      "url": "https://letterofdispute.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://letterofdispute.com/ld-logo.svg"
      }
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
        <section className="bg-primary py-16 md:py-20">
          <div className="container-narrow">
            <Skeleton className="h-8 w-32 mb-6 bg-primary-foreground/20" />
            <Skeleton className="h-14 w-full mb-4 bg-primary-foreground/20" />
            <Skeleton className="h-14 w-3/4 mb-6 bg-primary-foreground/20" />
            <Skeleton className="h-6 w-80 bg-primary-foreground/20" />
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
        title={post.meta_title || `${post.title} | Letter Of Dispute`}
        description={post.meta_description || post.excerpt || ''}
        canonicalPath={`/articles/${post.category_slug}/${post.slug}`}
      />

      {/* JSON-LD Schema */}
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}

      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-accent z-50 transition-all duration-150"
        style={{ width: `${readProgress}%` }}
      />

      {/* Breadcrumb */}
      <section className="bg-muted/50 py-4 border-b border-border">
        <div className="container-wide">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/articles" className="text-muted-foreground hover:text-foreground transition-colors">
              Articles
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to={`/articles/${post.category_slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
              {post.category}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{post.title}</span>
          </nav>
        </div>
      </section>

      {/* Article Hero - Linearity-inspired split layout */}
      <section className="bg-gradient-to-br from-[hsl(165,30%,14%)] via-[hsl(165,35%,9%)] to-[hsl(165,40%,5%)]">
        <div className="container-wide py-12 md:py-16 lg:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Left: Text Content */}
            <div className="order-2 md:order-1">
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-white/70 text-lg md:text-xl mb-8 leading-relaxed max-w-lg">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {displayAuthor}
                </span>
                <span className="hidden sm:inline text-white/40">|</span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {post.published_at && new Date(post.published_at).toLocaleDateString('en-GB', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="hidden sm:inline text-white/40">|</span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {calculatedReadTime}
                </span>
                {post.views > 0 && (
                  <>
                    <span className="hidden sm:inline text-white/40">|</span>
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {post.views.toLocaleString()} views
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Right: Featured Image Card */}
            <div className="order-1 md:order-2">
              {post.featured_image_url ? (
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-white">
                      {post.category}
                    </Badge>
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-snug line-clamp-3">
                      {post.title}
                    </h2>
                  </div>
                  {/* Featured Image */}
                  <img 
                    src={post.featured_image_url} 
                    alt={post.title}
                    className="w-full h-48 md:h-64 object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-2xl">
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-white">
                    {post.category}
                  </Badge>
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    {post.title}
                  </h2>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-wide">
          <div className="flex gap-12">
            {/* Main Content */}
            <article className="flex-1 max-w-3xl mx-auto lg:mx-0">
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
              />
              
              {/* Related Templates CTA - Embedded in content */}
              {post.related_templates && post.related_templates.length > 0 && (
                <div className="mt-12">
                  <RelatedTemplatesCTA 
                    templateSlugs={post.related_templates} 
                    categorySlug={post.category_slug}
                  />
                </div>
              )}

              {/* Author Bio Section */}
              <div className="mt-12 p-8 bg-muted/50 rounded-2xl border border-border">
                <div className="flex items-start gap-5">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Written by</p>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">{displayAuthor}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our team of consumer rights specialists at Letter Of Dispute (LoD) help UK consumers 
                      navigate disputes with clear, actionable guidance backed by knowledge of the 
                      Consumer Rights Act 2015 and related regulations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Share Buttons */}
              <div className="lg:hidden mt-8 p-6 bg-muted/50 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share this article
                </h3>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={handleShareTwitter} className="flex-1">
                    <Twitter className="h-4 w-4 mr-2" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareLinkedIn} className="flex-1">
                    <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1">
                    {copied ? <Check className="h-4 w-4 mr-2 text-accent" /> : <Copy className="h-4 w-4 mr-2" />} 
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </article>

            {/* Sidebar with TOC and Share */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20 space-y-6">
                {/* Share Buttons */}
                <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Share this article
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShareTwitter}
                      className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShareLinkedIn}
                      className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyLink}
                      className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Table of Contents */}
                {tableOfContents.length > 0 && (
                  <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      In this article
                    </h3>
                    <nav className="space-y-2">
                      {tableOfContents.map((item, index) => (
                        <a 
                          key={index}
                          href={`#${item.id}`}
                          className={`block text-sm text-muted-foreground hover:text-primary transition-colors leading-relaxed ${item.level === 3 ? 'pl-4' : ''}`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

                {/* CTA Card */}
                <div className="p-5 bg-accent/10 rounded-xl border border-accent/20">
                  <h3 className="font-serif font-bold text-foreground mb-2">
                    Need a Letter Template?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a professional dispute letter in minutes with our templates.
                  </p>
                  <Button variant="accent" size="sm" asChild className="w-full">
                    <Link to="/#letters">
                      Browse Templates
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>

          {/* Article CTA - Premium Design */}
          <div className="mt-16 max-w-3xl mx-auto lg:mx-0 p-8 md:p-10 bg-gradient-to-br from-primary to-primary/90 rounded-2xl text-center">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Write Your Letter?
            </h3>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
              Use our professionally written templates to create a formal complaint letter backed by UK consumer rights law.
            </p>
            <Button 
              size="lg" 
              asChild 
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
            >
              <Link to="/#letters">
                Create Your Letter <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container-wide">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Related Articles
              </h2>
              <Button variant="outline" asChild className="hidden sm:flex">
                <Link to={`/articles/${post.category_slug}`}>
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.slug} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border">
                  {relatedPost.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={relatedPost.featured_image_url} 
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <Badge variant="secondary" className="w-fit mb-2 text-xs">
                      {relatedPost.category}
                    </Badge>
                    <Link 
                      to={`/articles/${relatedPost.category_slug}/${relatedPost.slug}`}
                      className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                    >
                      {relatedPost.title}
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>LoD Contributor</span>
                      <span>•</span>
                      <span>{relatedPost.read_time || '5 min read'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" asChild>
                <Link to={`/articles/${post.category_slug}`}>
                  View All Articles <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ArticlePage;
