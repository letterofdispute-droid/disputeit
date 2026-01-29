import { useState, useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getCategoryById, templateCategories } from '@/data/templateCategories';
import { getTemplatesByCategory } from '@/data/allTemplates';
import { inferSubcategory, getSubcategoriesForCategory, SubcategoryInfo } from '@/data/subcategoryMappings';
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
import SubcategoryFilter from '@/components/category/SubcategoryFilter';
import TemplateCard from '@/components/category/TemplateCard';

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const templates = categoryId ? getTemplatesByCategory(categoryId) : [];

  // State for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  if (!category) {
    return <Navigate to="/404" replace />;
  }

  const IconComponent = category.icon;

  // Get subcategories for this category
  const subcategories = useMemo(() => 
    getSubcategoriesForCategory(category.name), 
    [category.name]
  );

  // Compute template subcategory info and counts
  const { templatesWithSubcategory, subcategoryCounts } = useMemo(() => {
    const withSubcategory = templates.map(template => ({
      template,
      subcategoryInfo: inferSubcategory(template.id, category.name)
    }));

    const counts: Record<string, number> = {};
    withSubcategory.forEach(({ subcategoryInfo }) => {
      if (subcategoryInfo) {
        counts[subcategoryInfo.slug] = (counts[subcategoryInfo.slug] || 0) + 1;
      }
    });

    return { templatesWithSubcategory: withSubcategory, subcategoryCounts: counts };
  }, [templates, category.name]);

  // Filter templates based on search and subcategory
  const filteredTemplates = useMemo(() => {
    return templatesWithSubcategory.filter(({ template, subcategoryInfo }) => {
      // Filter by subcategory
      if (activeSubcategory && subcategoryInfo?.slug !== activeSubcategory) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          template.title.toLowerCase().includes(query) ||
          template.shortDescription.toLowerCase().includes(query) ||
          template.seoDescription.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [templatesWithSubcategory, searchQuery, activeSubcategory]);

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
        name: 'Templates',
        item: 'https://disputeletters.com/templates',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://disputeletters.com/templates/${category.id}`,
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
    itemListElement: templates.map((template, index) => {
      const subInfo = inferSubcategory(template.id, category.name);
      const subSlug = subInfo?.slug || 'general';
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: template.title,
        url: `https://disputeletters.com/templates/${category.id}/${subSlug}/${template.slug}`,
      };
    }),
  };

  const showSubcategoryInCards = !activeSubcategory && subcategories.length > 0;

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/templates/${category.id}`}
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

      {/* Subcategory Quick Links */}
      {subcategories.length > 0 && (
        <section className="py-4 bg-secondary/30 border-b border-border">
          <div className="container-wide">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Browse by type:</span>
              {subcategories.map(sub => (
                <Link
                  key={sub.slug}
                  to={`/templates/${category.id}/${sub.slug}`}
                  className="text-sm px-3 py-1 bg-background border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <section className="py-6 border-b border-border bg-card sticky top-16 z-40">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="lg:w-80">
              <CategorySearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${category.name.toLowerCase()} templates...`}
                resultCount={filteredTemplates.length}
                totalCount={templates.length}
              />
            </div>

            {/* Subcategory Filter */}
            {subcategories.length > 0 && (
              <div className="flex-1 overflow-x-auto">
                <SubcategoryFilter
                  subcategories={subcategories}
                  activeSubcategory={activeSubcategory}
                  onSubcategoryChange={setActiveSubcategory}
                  templateCounts={subcategoryCounts}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-10 md:py-14 bg-background">
        <div className="container-wide">
          {/* Trust Message */}
          <div className="mb-8 p-4 bg-success/5 border border-success/20 rounded-lg">
            <p className="text-sm text-foreground">
              <span className="font-medium">All letter templates in this category</span> use pre-validated language with proper legal references. No guessing, no prompt engineering—just predictable, professional results.
            </p>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTemplates.map(({ template, subcategoryInfo }) => (
                <TemplateCard
                  key={template.slug}
                  template={template}
                  subcategoryInfo={subcategoryInfo}
                  showSubcategory={showSubcategoryInCards}
                  categoryId={category.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No templates found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveSubcategory(null);
                }}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
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
                  to={`/templates/${c.id}`}
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
