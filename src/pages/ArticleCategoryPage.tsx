import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { getBlogCategoryBySlug, getBlogPostsByCategory, blogCategories } from '@/data/blogPosts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArticleCategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  
  const categoryData = category ? getBlogCategoryBySlug(category) : undefined;
  const posts = category ? getBlogPostsByCategory(category) : [];

  if (!categoryData) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <Layout>
      <SEOHead 
        title={`${categoryData.name} | DisputeLetters Blog`}
        description={categoryData.description}
        canonicalPath={`/articles/${category}`}
      />

      {/* Breadcrumb */}
      <section className="bg-muted/50 py-4 border-b border-border">
        <div className="container-wide">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/articles" className="text-muted-foreground hover:text-foreground">
              Blog
            </Link>
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
            <p className="text-lg text-primary-foreground/80">
              {categoryData.description}
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 border-b border-border bg-card">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/articles">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                All Articles
              </Badge>
            </Link>
            {blogCategories.map((cat) => (
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
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {post.category}
                    </Badge>
                    <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                      <Link to={`/articles/${post.categorySlug}/${post.slug}`}>
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
                          {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No articles in this category yet.</p>
              <Button variant="outline" asChild>
                <Link to="/articles">View All Articles</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container-wide text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
            Need Help With a Dispute?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our pre-validated letter templates make it easy to create professional complaint letters.
          </p>
          <Button variant="accent" size="lg" asChild>
            <Link to="/#letters">
              Create Your Letter <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ArticleCategoryPage;
