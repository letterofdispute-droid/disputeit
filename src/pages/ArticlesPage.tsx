import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { blogPosts as staticBlogPosts, blogCategories } from '@/data/blogPosts';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, BookOpen, Eye, Sparkles } from 'lucide-react';
import { getAuthorByName } from '@/data/authors';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const POSTS_PER_PAGE = 12;

const LEAN_SELECT = 'slug, title, excerpt, category, category_slug, author, published_at, read_time, featured_image_url, featured, views';

interface BlogPostCard {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  category_slug: string;
  author: string;
  published_at: string | null;
  read_time: string | null;
  featured_image_url: string | null;
  featured: boolean;
  views: number;
}

const formatDate = (dateStr: string | null, style: 'short' | 'long' = 'short') => {
  if (!dateStr) return '';
  const opts: Intl.DateTimeFormatOptions = style === 'long'
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', opts);
};

/* ─── Article Card (shared for grid) ─── */
const ArticleCard = ({ post, getCategoryName, size = 'default' }: { post: BlogPostCard; getCategoryName: (p: BlogPostCard) => string; size?: 'large' | 'default' }) => (
  <Link
    to={`/articles/${post.category_slug}/${post.slug}`}
    className="group flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-elevated hover:border-primary/30 transition-all duration-300"
  >
    {/* Image */}
    <div className="relative aspect-video overflow-hidden bg-muted">
      {post.featured_image_url ? (
        <img
          src={post.featured_image_url}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-20" />
        </div>
      )}
      {/* Gradient overlay for badge */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
      <Badge variant="secondary" className="absolute top-3 left-3 text-xs backdrop-blur-sm bg-secondary/80">
        {getCategoryName(post)}
      </Badge>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-5">
      <h3 className={`font-serif font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2 ${size === 'large' ? 'text-xl' : 'text-base'}`}>
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
          {post.excerpt}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
        {(() => {
          const author = getAuthorByName(post.author);
          return (
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              {author && <img src={author.avatar} alt={author.name} className="h-4 w-4 rounded-full object-cover" />}
              {author?.name || post.author || 'LoD Editorial Team'}
            </span>
          );
        })()}
        <span className="text-border">·</span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(post.published_at)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.read_time || '5 min read'}
        </span>
      </div>
    </div>
  </Link>
);

const ArticlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Hero post - only fetched on page 1
  const { data: heroPost, isLoading: heroLoading, isError: heroError } = useQuery({
    queryKey: ['blog-hero-post'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(LEAN_SELECT)
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as BlogPostCard;
    },
    retry: 2,
    retryDelay: 1000,
    enabled: currentPage === 1,
  });

  // Grid posts - server-side paginated
  // On page 1 we offset by 1 to skip the hero post
  const gridOffset = currentPage === 1 ? 1 : (currentPage - 1) * POSTS_PER_PAGE + 1;
  const { data: gridData, isLoading: gridLoading, isError: gridError } = useQuery({
    queryKey: ['blog-posts-page', currentPage],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select(LEAN_SELECT, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(gridOffset, gridOffset + POSTS_PER_PAGE - 1);
      if (error) throw error;
      return { posts: (data || []) as BlogPostCard[], totalCount: count || 0 };
    },
    retry: 2,
    retryDelay: 1000,
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
    retry: 2,
    retryDelay: 1000,
  });

  // Determine if we use DB data or static fallback
  const useStaticFallback = (heroError && gridError) || (!heroLoading && !gridLoading && heroError && gridError);

  const staticPosts: BlogPostCard[] = staticBlogPosts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    category_slug: p.categorySlug,
    author: p.author,
    published_at: p.publishedAt,
    read_time: p.readTime,
    featured_image_url: p.image || null,
    featured: p.featured || false,
    views: 0,
  }));

  const latestPost = useStaticFallback ? staticPosts[0] : heroPost;
  const paginatedPosts = useStaticFallback
    ? staticPosts.slice(1, 1 + POSTS_PER_PAGE)
    : (gridData?.posts || []);
  // Total count excludes the hero post
  const totalGridPosts = useStaticFallback
    ? Math.max(0, staticPosts.length - 1)
    : Math.max(0, (gridData?.totalCount || 0) - 1);
  const totalPages = Math.ceil(totalGridPosts / POSTS_PER_PAGE);

  const categories = dbCategories && dbCategories.length > 0 ? dbCategories : blogCategories;

  const getCategoryName = (post: BlogPostCard) => {
    const cat = categories.find(c => c.slug === post.category_slug);
    return cat?.name || post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const isLoading = (heroLoading && currentPage === 1) || gridLoading;
  const isError = heroError && gridError;

  // Split paginated posts: first 2 are "large", rest are compact grid
  const largePosts = paginatedPosts.slice(0, 2);
  const compactPosts = paginatedPosts.slice(2);

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

      {/* Sticky Category Filter Bar */}
      <section className="sticky top-0 z-30 py-4 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container-wide">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Link to="/articles">
              <Badge variant="default" className="cursor-pointer whitespace-nowrap">All Articles</Badge>
            </Link>
            {categories.map((category) => (
              <Link key={category.slug} to={`/articles/${category.slug}`}>
                <Badge variant="outline" className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State - skip if errored so fallback renders immediately */}
      {isLoading && !isError && (
        <section className="py-12 bg-background">
          <div className="container-wide">
            <Skeleton className="w-full h-[400px] rounded-lg mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[300px] rounded-lg" />
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          </div>
        </section>
      )}

      {/* Featured Article Hero (page 1 only) */}
      {(!isLoading || isError) && latestPost && currentPage === 1 && (
        <section className="py-10 md:py-14 bg-background">
          <div className="container-wide">
            <Link
              to={`/articles/${latestPost.category_slug}/${latestPost.slug}`}
              className="group relative block rounded-lg overflow-hidden h-[320px] md:h-[400px]"
            >
              {/* Background image */}
              {latestPost.featured_image_url ? (
                <img
                  src={latestPost.featured_image_url}
                  alt={latestPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <BookOpen className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

              {/* Badges top-left */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="secondary" className="backdrop-blur-sm bg-secondary/80">
                  {getCategoryName(latestPost)}
                </Badge>
                <Badge className="bg-accent/90 text-accent-foreground backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Recent
                </Badge>
              </div>

              {/* Content at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <h2 className="font-serif text-2xl md:text-4xl font-bold text-white mb-3 leading-tight max-w-3xl group-hover:text-primary-foreground/90 transition-colors">
                  {latestPost.title}
                </h2>
                {latestPost.excerpt && (
                  <p className="text-white/70 text-base md:text-lg line-clamp-2 max-w-2xl mb-4">
                    {latestPost.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-white/60">
                  {(() => {
                    const author = getAuthorByName(latestPost.author);
                    return (
                      <span className="flex items-center gap-1.5 font-medium text-white/80">
                        {author && <img src={author.avatar} alt={author.name} className="h-5 w-5 rounded-full object-cover" />}
                        {author?.name || latestPost.author || 'LoD Editorial Team'}
                      </span>
                    );
                  })()}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(latestPost.published_at, 'long')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {latestPost.read_time || '5 min read'}
                  </span>
                  {latestPost.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {latestPost.views.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      {(!isLoading || isError) && paginatedPosts.length > 0 && (
        <section className="py-10 md:py-14 bg-muted/30">
          <div className="container-wide">
            {/* Subtle divider instead of heading */}
            {currentPage === 1 && (
              <div className="border-t border-border mb-10" />
            )}

            {/* First row: 2 large cards */}
            {largePosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {largePosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} getCategoryName={getCategoryName} size="large" />
                ))}
              </div>
            )}

            {/* Remaining rows: 3-column compact grid */}
            {compactPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compactPosts.map((post) => (
                  <ArticleCard key={post.slug} post={post} getCategoryName={getCategoryName} />
                ))}
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

      {(!isLoading || isError) && paginatedPosts.length === 0 && !latestPost && (
        <section className="py-16 bg-background">
          <div className="container-wide text-center">
            <p className="text-muted-foreground">No articles published yet. Check back soon!</p>
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