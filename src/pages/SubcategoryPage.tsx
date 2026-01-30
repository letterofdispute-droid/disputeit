import { useState, useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getCategoryById } from '@/data/templateCategories';
import { getTemplatesByCategory } from '@/data/allTemplates';
import { inferSubcategory, getSubcategoriesForCategory } from '@/data/subcategoryMappings';
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
import CategorySearch from '@/components/category/CategorySearch';
import TemplateCard from '@/components/category/TemplateCard';

const SubcategoryPage = () => {
  const { categoryId, subcategorySlug } = useParams<{ categoryId: string; subcategorySlug: string }>();
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const templates = categoryId ? getTemplatesByCategory(categoryId) : [];

  const [searchQuery, setSearchQuery] = useState('');

  // Find subcategory info
  const subcategories = category ? getSubcategoriesForCategory(category.name) : [];
  const subcategoryInfo = subcategories.find(s => s.slug === subcategorySlug);

  // Filter templates for this subcategory
  const subcategoryTemplates = useMemo(() => {
    if (!category || !subcategorySlug) return [];
    
    return templates
      .map(template => ({
        template,
        subcategoryInfo: inferSubcategory(template.id, category.name)
      }))
      .filter(({ subcategoryInfo }) => subcategoryInfo?.slug === subcategorySlug);
  }, [templates, category, subcategorySlug]);

  // Filter by search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return subcategoryTemplates;
    
    const query = searchQuery.toLowerCase();
    return subcategoryTemplates.filter(({ template }) =>
      template.title.toLowerCase().includes(query) ||
      template.shortDescription.toLowerCase().includes(query)
    );
  }, [subcategoryTemplates, searchQuery]);

  if (!category || !subcategoryInfo) {
    return <Navigate to="/404" replace />;
  }

  const IconComponent = category.icon;

  const seoTitle = `${subcategoryInfo.name} Letter Templates | ${category.name} | Dispute Letters`;
  const seoDescription = `Browse ${subcategoryTemplates.length} professional ${subcategoryInfo.name.toLowerCase()} letter templates. Create legally-referenced complaint letters for ${category.name.toLowerCase()} disputes.`;

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
        name: 'Templates',
        item: 'https://disputeletters.com/templates',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://disputeletters.com/templates/${category.id}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: subcategoryInfo.name,
        item: `https://disputeletters.com/templates/${category.id}/${subcategoryInfo.slug}`,
      },
    ],
  };

  // ItemList schema
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${subcategoryInfo.name} Letter Templates`,
    description: seoDescription,
    numberOfItems: subcategoryTemplates.length,
    itemListElement: subcategoryTemplates.map(({ template }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: template.title,
      url: `https://disputeletters.com/templates/${category.id}/${subcategoryInfo.slug}/${template.slug}`,
    })),
  };

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/templates/${category.id}/${subcategoryInfo.slug}`}
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
                <BreadcrumbLink asChild>
                  <Link to="/templates" className="text-primary-foreground/70 hover:text-primary-foreground">
                    Templates
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-primary-foreground/50" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/templates/${category.id}`} className="text-primary-foreground/70 hover:text-primary-foreground">
                    {category.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-primary-foreground/50" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary-foreground">
                  {subcategoryInfo.name}
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
                {subcategoryInfo.name} Letter Templates
              </h1>
              <p className="text-lg text-primary-foreground/80">
                Professional {subcategoryInfo.name.toLowerCase()} letter templates 
                in our {category.name.toLowerCase()} collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-6 border-b border-border bg-card sticky top-16 z-40">
        <div className="container-wide">
          <div className="max-w-md">
            <CategorySearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${subcategoryInfo.name.toLowerCase()} templates...`}
              resultCount={filteredTemplates.length}
              totalCount={subcategoryTemplates.length}
            />
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-10 md:py-14 bg-background">
        <div className="container-wide">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTemplates.map(({ template, subcategoryInfo: subInfo }) => (
                <TemplateCard
                  key={template.slug}
                  template={template}
                  subcategoryInfo={subInfo}
                  showSubcategory={false}
                  categoryId={category.id}
                  subcategorySlug={subcategoryInfo.slug}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No templates found matching your search.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Other Subcategories */}
      <section className="py-12 md:py-16 bg-secondary/20 border-t border-border">
        <div className="container-wide">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-6 text-center">
            Other {category.name} Subcategories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {subcategories
              .filter((s) => s.slug !== subcategoryInfo.slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  to={`/templates/${category.id}/${s.slug}`}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {s.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SubcategoryPage;
