import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { blogCategories } from '@/data/blogPosts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const POSTS_PER_PAGE = 12;
const LEAN_SELECT = 'slug, title, excerpt, category, category_slug, author, published_at, read_time, featured_image_url';

const ArticleCategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  // Fetch categories from DB with static fallback
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

  const categories = dbCategories && dbCategories.length > 0 ? dbCategories : blogCategories;
  const categoryData = category ? categories.find(c => c.slug === category) : undefined;

  // Fetch posts with server-side pagination
  const { data: queryResult, isLoading, isError } = useQuery({
    queryKey: ['blog-posts-category', category, currentPage],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select(LEAN_SELECT, { count: 'exact' })
        .eq('status', 'published')
        .eq('category_slug', category)
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);
      
      if (error) throw error;
      return { posts: data || [], totalCount: count || 0 };
    },
    enabled: !!category,
    retry: 2,
    retryDelay: 1000,
  });

  const posts = queryResult?.posts || [];
  const totalCount = queryResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (!categoryData) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <Layout>
      <SEOHead 
        title={`${categoryData.name} | Letter of Dispute Blog`}
        description={categoryData.description}
        canonicalPath={`/articles/${category}`}
      />

      {/* Breadcrumb */}
      <section className="bg-muted/50 py-4 border-b border-border">
        <div className="container-wide">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/articles" className="text-muted-foreground hover:text-foreground">Knowledge Center</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{categoryData.name}</span>
          </nav>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">Category</Badge>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              {categoryData.name}
            </h1>
            <p className="text-lg text-primary-foreground/80">{categoryData.description}</p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 border-b border-border bg-card">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/articles">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">All Articles</Badge>
            </Link>
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/articles/${cat.slug}`}>
                <Badge 
                  variant={cat.slug === category ? 'default' : 'outline'} 
                  className="cursor-pointer hover:bg-muted"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-wide">
          {isLoading && !isError ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {post.featured_image_url && (
                      <Link to={`/articles/${post.category_slug}/${post.slug}`} className="block">
                        <div className="aspect-[16/9] overflow-hidden">
                          <img 
                            src={post.featured_image_url} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      </Link>
                    )}
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
                      <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                        <Link to={`/articles/${post.category_slug}/${post.slug}`}>{post.title}</Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Draft'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.read_time || '5 min read'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className="cursor-pointer" />
                        </PaginationItem>
                      )}
                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className="cursor-pointer" />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-foreground mb-2">No articles in this category yet</h3>
                <p className="text-muted-foreground mb-6">
                  We're working on adding more content to the {categoryData.name} category. Check back soon or explore our other articles.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/articles">View All Articles</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container-wide text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">Need Help With a Dispute?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our pre-validated letter templates make it easy to create professional complaint letters.
          </p>
          <Button variant="accent" size="lg" asChild>
            <Link to="/#letters">Create Your Letter <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ArticleCategoryPage;