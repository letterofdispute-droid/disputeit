import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { getBlogPostBySlug, getBlogPostsByCategory, blogPosts } from '@/data/blogPosts';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ArticlePage = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  
  const post = slug ? getBlogPostBySlug(slug) : undefined;
  const relatedPosts = category 
    ? getBlogPostsByCategory(category).filter(p => p.slug !== slug).slice(0, 3)
    : [];

  if (!post) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <Layout>
      <SEOHead 
        title={`${post.title} | DisputeLetters Blog`}
        description={post.excerpt}
        canonicalPath={`/articles/${post.categorySlug}/${post.slug}`}
      />

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
            <Link to={`/articles/${post.categorySlug}`} className="text-muted-foreground hover:text-foreground">
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
              {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/### /g, '<h3>').replace(/# /g, '<h1>').replace(/<br><h/g, '<h').replace(/<\/h1><br>/g, '</h1>').replace(/<\/h2><br>/g, '</h2>').replace(/<\/h3><br>/g, '</h3>') }} />
          </article>

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
                <Card key={relatedPost.slug} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {relatedPost.category}
                    </Badge>
                    <CardTitle className="font-serif text-lg group-hover:text-primary transition-colors">
                      <Link to={`/articles/${relatedPost.categorySlug}/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {relatedPost.readTime}
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
