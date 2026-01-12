import { useParams, Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getTemplateBySlug, getTemplatesByCategory, getCategoryIdFromName } from '@/data/allTemplates';
import LetterGenerator from '@/components/letter/LetterGenerator';
import SEOContent from '@/components/letter/SEOContent';
import SEOHead from '@/components/SEOHead';
import { Separator } from '@/components/ui/separator';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const LetterPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getTemplateBySlug(slug) : undefined;

  if (!template) {
    return <Navigate to="/404" replace />;
  }

  const categoryId = getCategoryIdFromName(template.category);

  // BreadcrumbList schema for SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://disputeletters.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: template.category,
        item: `https://disputeletters.com/category/${categoryId}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: template.title,
        item: `https://disputeletters.com/complaint-letter/${template.slug}`,
      },
    ],
  };

  return (
    <Layout>
      <SEOHead 
        title={template.seoTitle}
        description={template.seoDescription}
        canonicalPath={`/complaint-letter/${template.slug}`}
      />

      {/* Inject structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* SEO-Optimized Header */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          {/* Breadcrumb Navigation */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-primary-foreground/50" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/category/${categoryId}`} className="text-primary-foreground/70 hover:text-primary-foreground">
                    {template.category}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-primary-foreground/50" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary-foreground">
                  {template.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              {template.seoTitle}
            </h1>
            <p className="text-lg text-primary-foreground/80">
              {template.seoDescription}
            </p>
          </div>
        </div>
      </section>

      {/* SEO Content Section - Crawlable, above the fold */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <SEOContent template={template} />
        </div>
      </section>

      <Separator />

      {/* Letter Generator Section */}
      <section className="py-12 md:py-16 bg-secondary/20">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
              Create Your {template.title}
            </h2>
            <p className="text-muted-foreground">
              Fill in your details below to generate a professionally structured letter.
            </p>
          </div>
          
          {/* Template Validation Callout */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-center">
              <p className="text-sm text-foreground">
                <span className="font-medium">Why this template?</span> Pre-validated for {template.category.toLowerCase()} disputes with controlled language and proper escalation structure. No guessing required.
              </p>
            </div>
          </div>
          
          <LetterGenerator template={template} />
        </div>
      </section>

      {/* Related Letters */}
      <section className="py-12 md:py-16 bg-background border-t border-border">
        <div className="container-wide">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-6 text-center">
            Other Letter Types You Might Need
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {getTemplatesByCategory(categoryId)
              .filter(t => t.slug !== slug)
              .slice(0, 5)
              .map(t => (
                <Link
                  key={t.slug}
                  to={`/complaint-letter/${t.slug}`}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {t.title}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LetterPage;
