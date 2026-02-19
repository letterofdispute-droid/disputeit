import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { getTemplateBySlug, getTemplatesByCategory, getCategoryIdFromName } from '@/data/allTemplates';
import { getCategoryById } from '@/data/templateCategories';
import { inferSubcategory } from '@/data/subcategoryMappings';
import LetterGenerator from '@/components/letter/LetterGenerator';
import SEOContent from '@/components/letter/SEOContent';
import RelatedTemplates from '@/components/letter/RelatedTemplates';
import RelatedArticles from '@/components/letter/RelatedArticles';
import TemplateFAQ from '@/components/letter/TemplateFAQ';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MethodologyBadge } from '@/components/letter/MethodologyBadge';
import TemplateSocialProof from '@/components/letter/TemplateSocialProof';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useCategoryImage } from '@/hooks/useCategoryImage';
import { trackTemplateView } from '@/hooks/useGTM';
import { useAnalytics } from '@/hooks/useAnalytics';

const LetterPage = () => {
  const { categoryId, subcategorySlug, templateSlug } = useParams<{ 
    categoryId: string; 
    subcategorySlug: string; 
    templateSlug: string; 
  }>();
  
  const template = templateSlug ? getTemplateBySlug(templateSlug) : undefined;
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const [imageLoaded, setImageLoaded] = useState(false);
  const { trackTemplateView: trackDbTemplateView } = useAnalytics();

  // Get category image for hero background
  const { largeUrl } = useCategoryImage(
    category?.id,
    category?.imageKeywords?.[0],
    'letter-hero'
  );

  useEffect(() => {
    if (largeUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = largeUrl;
    }
  }, [largeUrl]);

  // Track template view (GTM + DB analytics)
  useEffect(() => {
    if (template && category) {
      trackTemplateView(template.slug, category.id, template.title);
      trackDbTemplateView(template.slug, category.id);
    }
  }, [template?.slug, category?.id, template?.title]);

  // Fetch SEO override from DB
  const { data: seoOverride } = useQuery({
    queryKey: ['template-seo-override', template?.slug],
    queryFn: async () => {
      if (!template) return null;
      const { data } = await supabase
        .from('template_seo_overrides')
        .select('meta_title, meta_description')
        .eq('slug', template.slug)
        .maybeSingle();
      return data;
    },
    enabled: !!template,
    staleTime: 5 * 60 * 1000,
  });

  if (!template || !category) {
    return <Navigate to="/404" replace />;
  }

  // Get subcategory info
  const subcategoryInfo = inferSubcategory(template.id, template.category);
  const subcategoryName = subcategoryInfo?.name || 'General';

  // Canonical URL with hierarchical structure
  const canonicalPath = `/templates/${categoryId}/${subcategorySlug}/${template.slug}`;

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
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://letterofdispute.com/templates/${categoryId}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: subcategoryName,
        item: `https://letterofdispute.com/templates/${categoryId}/${subcategorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: template.title,
        item: `https://letterofdispute.com${canonicalPath}`,
      },
    ],
  };

  // HowTo schema for template usage
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Write a ${template.title}`,
    description: template.seoDescription,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Gather Information',
        text: 'Collect relevant dates, reference numbers, and documentation for your dispute.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Fill Out the Template',
        text: 'Enter your specific details into our guided form below.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Choose Your Tone',
        text: 'Select the appropriate tone (neutral, firm, or final notice) for your situation.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Download Your Letter',
        text: 'Get your professionally formatted letter in PDF or DOCX format.',
      },
    ],
  };

  return (
    <Layout>
      <SEOHead 
        title={seoOverride?.meta_title || template.seoTitle}
        description={seoOverride?.meta_description || template.seoDescription}
        canonicalPath={canonicalPath}
        type="website"
        templateName={template.title}
        templateCategory={category.name}
      />

      {/* Inject structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* SEO-Optimized Header with Background Image */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        {/* Background Image */}
        {largeUrl && (
          <div 
            className={`absolute inset-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-25' : 'opacity-0'}`}
            style={{
              backgroundImage: `url(${largeUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90" />

        <div className="container-wide relative z-10">
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
                  <Link to={`/templates/${categoryId}`} className="text-primary-foreground/70 hover:text-primary-foreground">
                    {category.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-primary-foreground/50" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/templates/${categoryId}/${subcategorySlug}`} className="text-primary-foreground/70 hover:text-primary-foreground">
                    {subcategoryName}
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
              {seoOverride?.meta_title || template.seoTitle}
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-4">
              {seoOverride?.meta_description || template.seoDescription}
            </p>
            <div className="mb-6">
              <TemplateSocialProof templateSlug={template.slug} variant="dark" />
            </div>
            <Button
              variant="accent"
              size="lg"
              onClick={() => document.getElementById('create-letter')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Create Your Letter
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Letter Generator Section - Primary conversion point */}
      <section id="create-letter" className="py-12 md:py-16 bg-secondary/20">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-6">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
              Create Your {template.title}
            </h2>
            <p className="text-muted-foreground">
              Fill in your details below to generate a professionally structured letter.
            </p>
          </div>
          
          {/* Template Validation Callout */}
          <div className="max-w-5xl mx-auto mb-10">
            <MethodologyBadge 
              category={template.category}
              subcategory={subcategoryInfo?.name}
              jurisdiction="US"
            />
          </div>
          
          <LetterGenerator template={template} />

          {/* Deadline cross-link CTA */}
          <div className="max-w-5xl mx-auto mt-6">
            <p className="text-sm text-muted-foreground text-center">
              ⏱ <strong>Not sure how long you have to act?</strong>{' '}
              <Link to={`/deadlines?category=${categoryId}`} className="text-primary hover:underline font-medium">
                Check your deadline →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* SEO Content Section - Crawlable, informational */}
      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SEOContent template={template} />
        </div>
      </section>

      {/* Category-Specific FAQ Section with FAQPage Schema */}
      <TemplateFAQ template={template} categoryName={category.name} />

      {/* Related Articles from Blog - Bidirectional SEO Linking */}
      <RelatedArticles 
        templateSlug={template.slug}
        categorySlug={categoryId!}
        maxItems={4}
      />

      {/* Related Templates - Enhanced Component */}
      <RelatedTemplates
        currentTemplate={template}
        categoryId={categoryId!}
        subcategorySlug={subcategorySlug!}
        maxItems={6}
      />
    </Layout>
  );
};

export default LetterPage;
