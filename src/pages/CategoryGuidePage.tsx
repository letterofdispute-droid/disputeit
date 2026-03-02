import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { usePageSeo } from '@/hooks/usePageSeo';
import { getCategoryById, templateCategories } from '@/data/templateCategories';
import { getGuideByCategory } from '@/data/consumerRightsContent';
import { getTemplatesByCategory, getCategoryIdFromName } from '@/data/allTemplates';
import { inferSubcategory } from '@/data/subcategoryMappings';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Clock, FileText, Scale, HelpCircle, ShieldAlert, Lightbulb, BookOpen, ExternalLink, Phone, BarChart3, MapPin, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NotFound from './NotFound';
import { useState } from 'react';

const CategoryGuidePage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [stateVarOpen, setStateVarOpen] = useState(false);
  
  const category = getCategoryById(categoryId || '');
  const guide = getGuideByCategory(categoryId || '');

  const fallbackTitle = guide ? `${guide.title} | Consumer Rights Guide | Letter of Dispute` : '';
  const fallbackDesc = guide ? guide.introduction.slice(0, 155) + '...' : '';

  const { title: seoTitle, description: seoDescription } = usePageSeo({
    slug: `guides/${categoryId || ''}`,
    fallbackTitle,
    fallbackDescription: fallbackDesc,
  });
  
  if (!category || !guide) {
    return <NotFound />;
  }

  const Icon = category.icon;
  const templates = getTemplatesByCategory(categoryId || '');
  const templateCount = templates.length || category.templateCount;

  // Fetch related blog articles
  const { data: relatedArticles } = useQuery({
    queryKey: ['guide-related-articles', categoryId],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, category_slug')
        .eq('status', 'published')
        .eq('category_slug', categoryId || '')
        .order('published_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  // Get a few popular template names for the CTA
  const popularTemplates = templates.slice(0, 3);

  // Build table of contents entries
  const tocItems = [
    ...(guide.statSnapshot?.length ? [{ id: 'stats', label: 'Key Statistics' }] : []),
    { id: 'key-rights', label: 'Your Key Rights' },
    { id: 'common-issues', label: 'Common Issues' },
    { id: 'action-steps', label: 'Action Steps' },
    ...(guide.importantDeadlines?.length ? [{ id: 'deadlines', label: 'Important Deadlines' }] : []),
    ...(guide.stateVariations?.length ? [{ id: 'state-variations', label: 'State Variations' }] : []),
    ...(guide.federalLaws?.length ? [{ id: 'federal-laws', label: 'Federal Laws' }] : []),
    ...(guide.regulatoryContacts?.length ? [{ id: 'file-complaints', label: 'Where to File' }] : []),
    ...(guide.warningSigns?.length ? [{ id: 'warning-signs', label: 'Warning Signs' }] : []),
    ...(guide.proTips?.length ? [{ id: 'pro-tips', label: 'Expert Tips' }] : []),
    ...(guide.faqItems?.length ? [{ id: 'faq', label: 'FAQ' }] : []),
    ...(relatedArticles && relatedArticles.length > 0 ? [{ id: 'related-articles', label: 'Related Articles' }] : []),
  ];

  // Build breadcrumbs for schema
  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Consumer Rights Guides', url: 'https://letterofdispute.com/guides' },
    { name: guide.title, url: `https://letterofdispute.com/guides/${categoryId}` },
  ];

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
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

              {/* Key Statistics Strip */}
              {guide.statSnapshot && guide.statSnapshot.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10" id="stats">
                  {guide.statSnapshot.map((stat, index) => (
                    <div key={index} className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-center">
                      <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                      {stat.source && (
                        <div className="text-[10px] text-muted-foreground/60 mt-2">{stat.source}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

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

              {/* State Rights cross-link CTA — deep links to targeted state+category pages */}
              <div className="mb-8 p-4 bg-primary/5 border border-primary/15 rounded-xl">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Check your state's specific {category.name.toLowerCase()} laws</p>
                    <p className="text-xs text-muted-foreground mt-0.5">State protections may be stronger than federal minimums for {category.name.toLowerCase()} disputes.</p>
                  </div>
                  <Link
                    to={`/state-rights`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                  >
                    All 50 states <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { code: 'CA', name: 'California', slug: 'california' },
                    { code: 'TX', name: 'Texas', slug: 'texas' },
                    { code: 'NY', name: 'New York', slug: 'new-york' },
                    { code: 'FL', name: 'Florida', slug: 'florida' },
                    { code: 'IL', name: 'Illinois', slug: 'illinois' },
                    { code: 'MA', name: 'Massachusetts', slug: 'massachusetts' },
                  ].map((state) => (
                    <Link
                      key={state.code}
                      to={`/state-rights/${state.slug}/${categoryId}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {state.name}
                      <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                    </Link>
                  ))}
                </div>
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

              {/* State Variations */}
              {guide.stateVariations && guide.stateVariations.length > 0 && (
                <Card className="mb-8 border-amber-200 bg-amber-50/30 dark:bg-amber-950/10" id="state-variations">
                  <CardHeader>
                    <Collapsible open={stateVarOpen} onOpenChange={setStateVarOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg">
                          <MapPin className="h-5 w-5 text-amber-600" />
                          State-Specific Variations
                        </CardTitle>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${stateVarOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-4 space-y-4">
                          {guide.stateVariations.map((sv, index) => (
                            <div key={index} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{sv.state}</Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">{sv.detail}</p>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground/60 italic">
                            These are examples - always check your specific state's consumer protection statutes for the most current rules.
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardHeader>
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

              {/* Where to File Complaints */}
              {guide.regulatoryContacts && guide.regulatoryContacts.length > 0 && (
                <Card className="mb-8 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/10" id="file-complaints">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif text-lg">
                      <ExternalLink className="h-5 w-5 text-indigo-600" />
                      Where to File Complaints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guide.regulatoryContacts.map((contact, index) => (
                        <div key={index} className="flex items-start gap-3 border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <a 
                              href={contact.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-semibold text-sm text-indigo-700 dark:text-indigo-400 hover:underline"
                            >
                              {contact.name} →
                            </a>
                            <p className="text-sm text-muted-foreground mt-0.5">{contact.description}</p>
                            {contact.phone && (
                              <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {contact.phone}
                              </p>
                            )}
                          </div>
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
              <div className="bg-primary/5 rounded-xl p-8 text-center mb-8">
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
                  Browse {templateCount} {category.name} Templates
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* Popular template links */}
                {popularTemplates.length > 0 && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <span className="text-xs text-muted-foreground">Popular:</span>
                  {popularTemplates.map((t) => {
                      const sub = inferSubcategory(t.id, t.category);
                      const subSlug = sub?.slug || 'general';
                      const catId = getCategoryIdFromName(t.category);
                      return (
                        <Link
                          key={t.slug}
                          to={`/templates/${catId}/${subSlug}/${t.slug}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {t.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Related Articles */}
              {relatedArticles && relatedArticles.length > 0 && (
                <div className="mb-8" id="related-articles">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl font-bold">Related Articles</h2>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article.slug}
                        to={`/articles/${article.category_slug}/${article.slug}`}
                        className="group border border-border rounded-lg p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{article.excerpt}</p>
                        )}
                        <span className="text-xs text-primary mt-2 inline-block">Read more →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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