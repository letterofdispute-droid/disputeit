import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { blogPosts, blogCategories, getFeaturedPosts } from '@/data/blogPosts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArticlesPage = () => {
  const featuredPosts = getFeaturedPosts();
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <Layout>
      <SEOHead 
        title="Blog | DisputeLetters - Consumer Rights & Dispute Resolution"
        description="Expert guides on consumer rights, landlord-tenant disputes, travel compensation, and more. Learn how to protect your rights and resolve disputes effectively."
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
            {blogCategories.map((category) => (
              <Link key={category.slug} to={`/articles/${category.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container-wide">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">
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
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <Link 
                        to={`/articles/${post.categorySlug}/${post.slug}`}
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
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container-wide">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
            Latest Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
