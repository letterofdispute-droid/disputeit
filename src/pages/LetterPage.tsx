import { useParams, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getTemplateBySlug } from '@/data/letterTemplates';
import LetterGenerator from '@/components/letter/LetterGenerator';
import SEOContent from '@/components/letter/SEOContent';
import SEOHead from '@/components/SEOHead';
import { Separator } from '@/components/ui/separator';

const LetterPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getTemplateBySlug(slug) : undefined;

  if (!template) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Layout>
      <SEOHead 
        title={template.seoTitle}
        description={template.seoDescription}
        canonicalPath={`/complaint-letter/${template.slug}`}
      />
      {/* SEO-Optimized Header */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1 text-xs font-medium bg-primary-foreground/10 text-primary-foreground rounded-full mb-4">
              {template.category}
            </div>
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
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
              Create Your {template.title}
            </h2>
            <p className="text-muted-foreground">
              Fill in your details below to generate a professionally structured letter.
            </p>
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
            {['refund', 'landlord-repairs', 'damaged-goods']
              .filter(s => s !== slug)
              .map(s => {
                const t = getTemplateBySlug(s);
                if (!t) return null;
                return (
                  <a
                    key={s}
                    href={`/complaint-letter/${s}`}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {t.title}
                  </a>
                );
              })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LetterPage;
