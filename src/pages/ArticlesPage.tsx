import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { blogPosts as staticBlogPosts, blogCategories } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, BookOpen, Eye, Sparkles } from 'lucide-react';
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

const getReadTime = (post: BlogPost) => {
  if (post.read_time) return post.read_time;
  const words = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
};

const ArticlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

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

  const getCategoryName = (post: BlogPost) => {
    const cat = categories.find(c => c.slug === post.category_slug);
    return cat?.name || post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Latest post is the hero (page 1 only), rest go into the grid
  const latestPost = posts[0] ?? null;
  const gridPosts = currentPage === 1 ? posts.slice(1) : posts;
  const totalGridPosts = posts.length > 1 ? posts.length - 1 : 0;
  const totalPages = Math.ceil(totalGridPosts / POSTS_PER_PAGE);
  const startIndex = currentPage === 1 ? 0 : (currentPage - 1) * POSTS_PER_PAGE - (POSTS_PER_PAGE); // offset for hero on page 1
  // Simpler: for page 1 we show posts[1..12], page 2 posts[13..24], etc.
  const pageStartIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = gridPosts.slice(pageStartIndex, pageStartIndex + POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <SEOHead
        title="Blog | DisputeLetters - Consumer Rights & Dispute Resolution"
        description="Expert guides on consumer rights, landlord-tenant disputes, travel compensation, and more. Learn how to protect your rights and resolve disputes effectively."
        canonicalPath="/articles"
      />

      {/* Hero Section */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-5">
              <BookOpen className="h-4 w-4" />
              <span>Knowledge Center</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
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
      <section className="py-6 border-b border-border bg-card">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Link to="/articles">
              <Badge variant="default" className="cursor-pointer">All Articles</Badge>
            </Link>
            {categories.map((category) => (
              <Link key={category.slug} to={`/articles/${category.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">{category.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="py-12 bg-background">
          <div className="container-wide">
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <Skeleton className="aspect-[4/3] md:aspect-auto md:min-h-[320px]" />
                <div className="p-8 space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Latest Article Hero Card (page 1 only) */}
      {!isLoading && latestPost && currentPage === 1 && (
        <section className="py-10 md:py-14 bg-background">
          <div className="container-wide">
            <Card className="group overflow-hidden border-2 hover:border-primary/40 hover:shadow-elevated transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="relative overflow-hidden bg-muted h-[180px] md:h-[260px]">
                  {latestPost.featured_image_url ? (
                    <img
                      src={latestPost.featured_image_url}
                      alt={latestPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <BookOpen className="h-16 w-16 opacity-30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center p-6 md:p-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{getCategoryName(latestPost)}</Badge>
                    <Badge className="bg-accent/15 text-accent border-accent/25 hover:bg-accent/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Recent
                    </Badge>
                    {latestPost.featured && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Featured</Badge>
                    )}
                  </div>

                  <CardTitle className="font-serif text-2xl md:text-3xl mb-3 group-hover:text-primary transition-colors leading-tight">
                    <Link to={`/articles/${latestPost.category_slug}/${latestPost.slug}`}>
                      {latestPost.title}
                    </Link>
                  </CardTitle>

                  {latestPost.excerpt && (
                    <p className="text-muted-foreground mb-5 line-clamp-3 text-base leading-relaxed">
                      {latestPost.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="font-medium text-foreground">{latestPost.author}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {latestPost.published_at && new Date(latestPost.published_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {getReadTime(latestPost)}
                    </span>
                    {latestPost.views > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {latestPost.views.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <Button asChild className="w-fit">
                    <Link to={`/articles/${latestPost.category_slug}/${latestPost.slug}`}>
                      Read Article <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      {!isLoading && (
        <section className="py-10 md:py-14 bg-muted/30">
          <div className="container-wide">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              {currentPage === 1 ? 'More Articles' : 'Latest Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <Card key={post.slug} className="group flex flex-col hover:shadow-elevated hover:border-primary/30 transition-all duration-300 overflow-hidden">
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
                  <CardHeader className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="w-fit">{getCategoryName(post)}</Badge>
                      {post.featured && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">Featured</Badge>
                      )}
                    </div>
                    <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      <Link to={`/articles/${post.category_slug}/${post.slug}`}>{post.title}</Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/80">{post.author}</span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {getReadTime(post)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {paginatedPosts.length === 0 && !latestPost && (
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
                      <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className="cursor-pointer" />
                    </PaginationItem>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    if (!showPage) {
                      if (page === 2 && currentPage > 3) return <PaginationItem key={page}><span className="px-2">...</span></PaginationItem>;
                      if (page === totalPages - 1 && currentPage < totalPages - 2) return <PaginationItem key={page}><span className="px-2">...</span></PaginationItem>;
                      return null;
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink onClick={() => handlePageChange(page)} isActive={page === currentPage} className="cursor-pointer">{page}</PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className="cursor-pointer" />
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
            <Link to="/#letters">Create Your Letter <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ArticlesPage;
