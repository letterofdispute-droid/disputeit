import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { templateCategories } from '@/data/templateCategories';
import { allTemplates } from '@/data/allTemplates';
import SEOHead from '@/components/SEOHead';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';

const AllTemplatesPage = () => {
  const totalCount = allTemplates.length;

  const seoTitle = `All Letter Templates - ${totalCount}+ Free Professional Complaint Letters | Dispute Letters`;
  const seoDescription = `Browse our complete library of ${totalCount}+ professional letter templates across ${templateCategories.length} categories. Generate legally-referenced complaint letters for any situation.`;

  // BreadcrumbList schema for SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://letterofdispute.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Templates',
        item: 'https://letterofdispute.com/templates',
      },
    ],
  };

  // CollectionPage schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Letter Template Library',
    description: seoDescription,
    numberOfItems: totalCount,
    hasPart: templateCategories.map(category => ({
      '@type': 'ItemList',
      name: category.name,
      numberOfItems: category.templateCount,
      url: `https://letterofdispute.com/templates/${category.id}`,
    })),
  };

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/templates"
        type="website"
      />

      {/* Inject structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
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
                  All Templates
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-primary-foreground/15 text-primary-foreground border-0">
              🇺🇸 {totalCount}+ US-Based Templates
            </Badge>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Professional Letter Template Library
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Browse our complete collection of pre-validated letter templates. Every template includes 
              proper legal references and controlled language for professional dispute resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templateCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/templates/${category.id}`}
                  className="group p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                      }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    <span>Browse templates</span>
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 bg-secondary/20 border-t border-border">
        <div className="container-wide text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            Why Choose Our Letter Templates?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-8">
            <div className="p-4">
              <div className="text-3xl mb-2">⚖️</div>
              <h3 className="font-semibold text-foreground mb-2">Legally Referenced</h3>
              <p className="text-sm text-muted-foreground">
                Every template includes appropriate legal citations and controlled language.
              </p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-foreground mb-2">Purpose-Built</h3>
              <p className="text-sm text-muted-foreground">
                Templates designed for specific disputes, not generic one-size-fits-all documents.
              </p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-semibold text-foreground mb-2">Pre-Validated</h3>
              <p className="text-sm text-muted-foreground">
                Professional language vetted for effectiveness and appropriate tone.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AllTemplatesPage;
