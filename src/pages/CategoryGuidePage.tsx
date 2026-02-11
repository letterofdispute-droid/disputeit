import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { getCategoryById } from '@/data/templateCategories';
import { getGuideByCategory } from '@/data/consumerRightsContent';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Clock, FileText, Scale, HelpCircle, ShieldAlert, Lightbulb, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import NotFound from './NotFound';

const CategoryGuidePage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  
  const category = getCategoryById(categoryId || '');
  const guide = getGuideByCategory(categoryId || '');
  
  if (!category || !guide) {
    return <NotFound />;
  }

  const Icon = category.icon;

  // Build table of contents entries
  const tocItems = [
    { id: 'key-rights', label: 'Your Key Rights' },
    { id: 'common-issues', label: 'Common Issues' },
    { id: 'action-steps', label: 'Action Steps' },
    ...(guide.importantDeadlines?.length ? [{ id: 'deadlines', label: 'Important Deadlines' }] : []),
    ...(guide.federalLaws?.length ? [{ id: 'federal-laws', label: 'Federal Laws' }] : []),
    ...(guide.warningSigns?.length ? [{ id: 'warning-signs', label: 'Warning Signs' }] : []),
    ...(guide.proTips?.length ? [{ id: 'pro-tips', label: 'Expert Tips' }] : []),
    ...(guide.faqItems?.length ? [{ id: 'faq', label: 'FAQ' }] : []),
  ];

  // Build breadcrumbs for schema
  const breadcrumbs = [
    { name: 'Home', url: 'https://disputeletters.com/' },
    { name: 'Consumer Rights Guides', url: 'https://disputeletters.com/guides' },
    { name: guide.title, url: `https://disputeletters.com/guides/${categoryId}` },
  ];

  return (
    <Layout>
      <SEOHead
        title={`${guide.title} | Consumer Rights Guide`}
        description={guide.introduction.slice(0, 155) + '...'}
        canonicalPath={`/guides/${categoryId}`}
        faqItems={guide.faqItems}
        breadcrumbs={breadcrumbs}
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/guides">Guides</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <Link 
              to="/guides" 
              className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Guides
            </Link>
            
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                  {guide.title}
                </h1>
                <p className="text-lg text-primary-foreground/80">
                  {guide.subtitle}
                </p>
                {guide.lastUpdated && (
                  <p className="text-sm text-primary-foreground/60 mt-2">
                    Last reviewed: {new Date(guide.lastUpdated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content with TOC sidebar */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-6xl mx-auto flex gap-8">
            {/* Sticky TOC sidebar - desktop only */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <nav className="sticky top-24">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  On this page
                </h3>
                <ul className="space-y-2 border-l border-border pl-4">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 max-w-4xl">
              {/* Introduction */}
              <div className="prose prose-lg max-w-none mb-12">
                {guide.introduction.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Key Rights */}
              <Card className="mb-8" id="key-rights">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Your Key Rights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {guide.keyRights.map((right, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-semibold text-green-700">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{right.title}</h3>
                          <p className="text-muted-foreground text-sm">{right.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Two Column Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Common Issues */}
                <Card id="common-issues">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Common Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {guide.commonIssues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Action Steps */}
                <Card id="action-steps">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Action Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {guide.actionSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>

              {/* Important Deadlines */}
              {guide.importantDeadlines && guide.importantDeadlines.length > 0 && (
                <Card className="mb-8 border-amber-200 bg-amber-50/50 dark:bg-amber-950/10" id="deadlines">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                      Important Deadlines to Know
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {guide.importantDeadlines.map((deadline, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{deadline}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Federal Laws */}
              {guide.federalLaws && guide.federalLaws.length > 0 && (
                <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:bg-blue-950/10" id="federal-laws">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Scale className="h-5 w-5 text-blue-700" />
                      Federal Laws That Protect You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {guide.federalLaws.map((law, index) => (
                        <div key={index} className="border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">{law.name}</h4>
                            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{law.citation}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{law.description}</p>
                          {law.url && (
                            <a href={law.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                              Learn more →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warning Signs */}
              {guide.warningSigns && guide.warningSigns.length > 0 && (
                <Card className="mb-8 border-red-200 bg-red-50/50 dark:bg-red-950/10" id="warning-signs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                      Warning Signs to Watch For
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {guide.warningSigns.map((sign, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{sign}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Pro Tips */}
              {guide.proTips && guide.proTips.length > 0 && (
                <Card className="mb-8 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10" id="pro-tips">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <Lightbulb className="h-5 w-5 text-emerald-600" />
                      Expert Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {guide.proTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* FAQ Accordion */}
              {guide.faqItems && guide.faqItems.length > 0 && (
                <div className="mb-8" id="faq">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-bold">Frequently Asked Questions</h2>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {guide.faqItems.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left font-medium text-sm">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* CTA */}
              <div className="bg-primary/5 rounded-xl p-8 text-center">
                <h2 className="font-serif text-xl font-bold mb-3">
                  Ready to Assert Your Rights?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Use our professionally crafted letter templates to communicate your rights 
                  effectively and get results.
                </p>
                <Link
                  to={`/templates/${categoryId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Browse {category.name} Templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-12 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-xl font-bold mb-6">
              Explore Other Guides
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/guides"
                className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm hover:border-primary transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                View All Guides
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CategoryGuidePage;
