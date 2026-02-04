import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { blogPosts as staticBlogPosts, blogCategories, getFeaturedPosts as getStaticFeaturedPosts } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const POSTS_PER_PAGE = 12;

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
}

const ArticlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch blog posts from database
  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Fetch categories from database
  const { data: dbCategories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Use database posts if available, otherwise fall back to static
  const posts = dbPosts && dbPosts.length > 0 
    ? dbPosts 
    : staticBlogPosts.map(p => ({
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
      }));

  const categories = dbCategories && dbCategories.length > 0 ? dbCategories : blogCategories;
  
  // Helper to get category display name from slug
  const getCategoryName = (post: BlogPost) => {
    const cat = categories.find(c => c.slug === post.category_slug);
    return cat?.name || post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const featuredPosts = posts.filter(post => post.featured);
  const allRegularPosts = posts.filter(post => !post.featured);
  
  // Pagination
  const totalPages = Math.ceil(allRegularPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const regularPosts = allRegularPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate reading time if not provided
  const getReadTime = (post: BlogPost) => {
    if (post.read_time) return post.read_time;
    const words = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <Layout>
      <SEOHead 
        title="Blog | DisputeLetters - Consumer Rights & Dispute Resolution"
        description="Expert guides on consumer rights, landlord-tenant disputes, travel compensation, and more. Learn how to protect your rights and resolve disputes effectively."
        canonicalPath="/articles"
      />

      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              <span>Knowledge Center</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Consumer Rights & Dispute Resolution Blog
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Expert guides, legal insights, and practical tips to help you navigate disputes 
              and protect your consumer rights.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border bg-card">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Link to="/articles">
              <Badge variant="default" className="cursor-pointer">
                All Articles
              </Badge>
            </Link>
            {categories.map((category) => (
              <Link key={category.slug} to={`/articles/${category.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container-wide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Posts */}
      {!isLoading && featuredPosts.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container-wide">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.featured_image_url} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{getCategoryName(post)}</Badge>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">
                      <Link to={`/articles/${post.category_slug}/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {getReadTime(post)}
                        </span>
                        {post.views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Link 
                        to={`/articles/${post.category_slug}/${post.slug}`}
                        className="text-primary font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Read more <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      {!isLoading && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container-wide">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.featured_image_url} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {getCategoryName(post)}
                    </Badge>
                    <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                      <Link to={`/articles/${post.category_slug}/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {getReadTime(post)}
                      </span>
                      {post.views > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {regularPosts.length === 0 && featuredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles published yet. Check back soon!</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and adjacent pages
                    const showPage = page === 1 || page === totalPages || 
                      Math.abs(page - currentPage) <= 1;
                    
                    if (!showPage) {
                      // Show ellipsis only once between gaps
                      if (page === 2 && currentPage > 3) {
                        return <PaginationItem key={page}><span className="px-2">...</span></PaginationItem>;
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 2) {
                        return <PaginationItem key={page}><span className="px-2">...</span></PaginationItem>;
                      }
                      return null;
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary">
        <div className="container-wide text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Resolve Your Dispute?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Use our pre-validated templates to create professional complaint letters in minutes.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/#letters">
              Create Your Letter <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ArticlesPage;
