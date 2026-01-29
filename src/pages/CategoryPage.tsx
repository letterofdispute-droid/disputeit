import { useParams, Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getCategoryById, templateCategories } from '@/data/templateCategories';
import { getTemplatesByCategory, allTemplates } from '@/data/allTemplates';
import SEOHead from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { ArrowRight, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const templates = categoryId ? getTemplatesByCategory(categoryId) : [];

  if (!category) {
    return <Navigate to="/404" replace />;
  }

  const IconComponent = category.icon;

  // Generate smart SEO metadata
  const seoTitle = `${category.name} Letter Templates - Free Professional Complaint Letters | Dispute Letters`;
  const seoDescription = `Browse ${templates.length} professional ${category.name.toLowerCase()} letter templates. ${category.description} Generate legally-referenced complaint letters in minutes.`;

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
        name: category.name,
        item: `https://disputeletters.com/category/${category.id}`,
      },
    ],
  };

  // ItemList schema for category page
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} Letter Templates`,
    description: seoDescription,
    numberOfItems: templates.length,
    itemListElement: templates.map((template, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: template.title,
      url: `https://disputeletters.com/complaint-letter/${template.slug}`,
    })),
  };

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/category/${category.id}`}
        type="website"
      />

      {/* Inject structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero Section */}
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
                <BreadcrumbPage className="text-primary-foreground">
                  {category.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-start gap-6">
            <div
              className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'hsl(var(--primary-foreground) / 0.15)',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              <IconComponent className="h-8 w-8" />
            </div>
            <div className="flex-1 max-w-3xl">
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
                {category.name} Letter Templates
              </h1>
              <p className="text-lg text-primary-foreground/80">
                {category.description} Browse {templates.length} professionally crafted letter templates with legal references included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-wide">
          {/* Trust Message */}
          <div className="mb-8 p-4 bg-success/5 border border-success/20 rounded-lg">
            <p className="text-sm text-foreground">
              <span className="font-medium">All letter templates in this category</span> use pre-validated language with proper legal references. No guessing, no prompt engineering—just predictable, professional results.
            </p>
          </div>

          <div className="mb-6">
            <p className="text-muted-foreground">
              {templates.length} letter templates available
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Link
                key={template.slug}
                to={`/complaint-letter/${template.slug}`}
                className="group"
              >
                <Card className="h-full p-6 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {template.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.seoDescription}
                  </p>
                  <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Build Your Letter
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-12 md:py-16 bg-secondary/20 border-t border-border">
        <div className="container-wide">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-6 text-center">
            Browse Other Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {templateCategories
              .filter((c) => c.id !== category.id)
              .map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.id}`}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CategoryPage;
