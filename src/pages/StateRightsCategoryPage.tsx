import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Scale, MapPin, ExternalLink, Shield, ArrowRight,
  FileText, Gavel, ChevronRight, CheckCircle2, Clock,
} from 'lucide-react';
import {
  US_STATES, stateSpecificLaws, getStateFromSlug, CATEGORY_LABELS,
  getStateStatutesForCategory,
} from '@/data/stateSpecificLaws';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Map category to matching template route
const CATEGORY_TEMPLATE_MAP: Record<string, string> = {
  vehicle: 'vehicle', housing: 'housing', insurance: 'insurance',
  financial: 'financial', contractors: 'contractors', 'damaged-goods': 'damaged-goods',
  refunds: 'refunds', travel: 'travel', utilities: 'utilities',
  employment: 'employment', ecommerce: 'ecommerce', hoa: 'hoa', healthcare: 'healthcare',
};

// Category-specific federal fallback context
const FEDERAL_CONTEXT: Record<string, { law: string; citation: string; agency: string }> = {
  vehicle: { law: 'Magnuson-Moss Warranty Act', citation: '15 U.S.C. § 2301', agency: 'FTC' },
  housing: { law: 'Fair Housing Act', citation: '42 U.S.C. § 3601', agency: 'HUD' },
  insurance: { law: 'McCarran-Ferguson Act', citation: '15 U.S.C. § 1011', agency: 'State DOI' },
  financial: { law: 'Fair Debt Collection Practices Act', citation: '15 U.S.C. § 1692', agency: 'CFPB' },
  contractors: { law: 'FTC Home Solicitation Sales Rule', citation: '16 C.F.R. Part 429', agency: 'FTC' },
  'damaged-goods': { law: 'Magnuson-Moss Warranty Act', citation: '15 U.S.C. § 2301', agency: 'FTC' },
  refunds: { law: 'FTC Mail/Telephone Order Rule', citation: '16 C.F.R. Part 435', agency: 'FTC' },
  travel: { law: 'FTC Consumer Protection Rules', citation: '15 U.S.C. § 45', agency: 'FTC' },
  utilities: { law: 'Public Utility Regulatory Policies Act', citation: '16 U.S.C. § 2601', agency: 'FERC' },
  employment: { law: 'Fair Labor Standards Act', citation: '29 U.S.C. § 201', agency: 'DOL' },
  ecommerce: { law: 'FTC Act — Unfair or Deceptive Acts', citation: '15 U.S.C. § 45', agency: 'FTC' },
  hoa: { law: 'Fair Housing Act', citation: '42 U.S.C. § 3604', agency: 'HUD' },
  healthcare: { law: 'Affordable Care Act — Consumer Protections', citation: '42 U.S.C. § 300gg', agency: 'HHS' },
};

function generateFAQItems(stateName: string, categoryLabel: string, statutes: { name: string; citation: string; summary: string }[], agOffice: string) {
  const primaryStatute = statutes[0];
  return [
    {
      q: `What is the main ${stateName} ${categoryLabel} consumer protection law?`,
      a: `The primary law governing ${categoryLabel.toLowerCase()} disputes in ${stateName} is the ${primaryStatute.name} (${primaryStatute.citation}). ${primaryStatute.summary}.`,
    },
    {
      q: `How do I file a ${categoryLabel.toLowerCase()} complaint in ${stateName}?`,
      a: `You can file a complaint with the ${agOffice} through their official consumer complaint portal. Before filing, it is recommended to send a formal dispute letter to the business citing ${primaryStatute.citation}, giving them an opportunity to resolve the matter. The AG office typically responds within 1–2 weeks.`,
    },
    {
      q: `Can I sue under both ${stateName} and federal law for ${categoryLabel.toLowerCase()} issues?`,
      a: `Yes. ${stateName} law and federal consumer protection laws are complementary, not exclusive. You may be able to assert claims under both, potentially increasing available remedies such as damages, attorney fees, and injunctive relief. Many ${stateName} courts allow plaintiffs to plead both state and federal claims simultaneously.`,
    },
  ];
}

export default function StateRightsCategoryPage() {
  const { stateSlug, categorySlug } = useParams<{ stateSlug: string; categorySlug: string }>();

  const stateCode = stateSlug ? getStateFromSlug(stateSlug) : null;
  const categoryLabel = categorySlug ? CATEGORY_LABELS[categorySlug] : null;

  if (!stateCode || !stateSpecificLaws[stateCode] || !categoryLabel) {
    return <Navigate to="/state-rights" replace />;
  }

  const stateData = stateSpecificLaws[stateCode];
  const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
  const statutes = getStateStatutesForCategory(stateCode, categorySlug!);
  const primaryStatute = statutes[0];
  const federalContext = FEDERAL_CONTEXT[categorySlug!];

  const title = `${stateName} ${categoryLabel} Rights — ${primaryStatute.citation} | Letter of Dispute`;
  const description = `${stateName} ${categoryLabel.toLowerCase()} consumer protection under ${primaryStatute.citation}. Find your rights, filing deadlines, and how to dispute with the ${stateData.agOffice}.`;

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'State Consumer Rights', url: 'https://letterofdispute.com/state-rights' },
    { name: stateName, url: `https://letterofdispute.com/state-rights/${stateSlug}` },
    { name: categoryLabel, url: `https://letterofdispute.com/state-rights/${stateSlug}/${categorySlug}` },
  ];

  const faqItems = generateFAQItems(stateName, categoryLabel, statutes, stateData.agOffice);

  // JSON-LD FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const templateRoute = CATEGORY_TEMPLATE_MAP[categorySlug!] || 'templates';

  return (
    <Layout>
      <SEOHead
        title={title}
        description={description}
        canonicalPath={`/state-rights/${stateSlug}/${categorySlug}`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems.map(f => ({ question: f.q, answer: f.a }))}
      />

      {/* Inject FAQ schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/state-rights">State Rights</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/state-rights/${stateSlug}`}>{stateName}</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{categoryLabel}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-5">
              <MapPin className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">{stateCode} · {categoryLabel}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
              {stateName} {categoryLabel} Consumer Rights
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-6 leading-relaxed max-w-2xl">
              Your rights under <strong className="text-accent">{primaryStatute.citation}</strong> — with statute text, deadlines, and how to file a complaint with the {stateData.agOffice}.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
                {primaryStatute.citation}
              </Badge>
              {federalContext && (
                <Badge className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20">
                  {federalContext.citation} (Federal)
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">

            {/* Statutes */}
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {stateName} {categoryLabel} Statutes
              </h2>
              <div className="space-y-4">
                {statutes.map((statute, i) => (
                  <Card key={i} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <h3 className="font-semibold text-foreground">{statute.name}</h3>
                        <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap">{statute.citation}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{statute.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Federal vs State */}
            {federalContext && (
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Federal vs. {stateName} {categoryLabel} Law
                </h2>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="text-left px-4 py-3 font-semibold">Protection Area</th>
                          <th className="text-left px-4 py-3 font-semibold">Federal ({federalContext.agency})</th>
                          <th className="text-left px-4 py-3 font-semibold">{stateName} ({stateCode})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            area: 'Governing Law',
                            fed: `${federalContext.law} (${federalContext.citation})`,
                            state: `${primaryStatute.name} (${primaryStatute.citation})`,
                          },
                          {
                            area: 'Damages',
                            fed: 'Actual damages',
                            state: 'Actual + potentially treble (3×) or statutory minimum',
                          },
                          {
                            area: 'Attorney Fees',
                            fed: 'Sometimes available',
                            state: 'Often mandatory if consumer prevails',
                          },
                          {
                            area: 'Who Enforces',
                            fed: federalContext.agency,
                            state: stateData.agOffice,
                          },
                        ].map((row, i) => (
                          <tr key={row.area} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                            <td className="px-4 py-3 font-medium text-foreground">{row.area}</td>
                            <td className="px-4 py-3 text-muted-foreground">{row.fed}</td>
                            <td className="px-4 py-3 text-accent font-medium">{row.state}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* AG office */}
            <Card className="bg-muted/30">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Gavel className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">File a {categoryLabel} Complaint</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The {stateData.agOffice} handles {categoryLabel.toLowerCase()} complaints against businesses operating in {stateName}. Filing a formal complaint often prompts faster resolution and can trigger regulatory action if a pattern exists.
                    </p>
                    <a href={stateData.agWebsite} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Visit {stateData.agOffice} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {faqItems.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground mb-2">Write a {categoryLabel} Letter</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our AI cites <strong>{primaryStatute.citation}</strong> and relevant federal law automatically.
                </p>
                <Button asChild variant="default" className="w-full gap-2">
                  <Link to={`/templates/${templateRoute}`}>
                    <FileText className="h-4 w-4" />
                    Browse {categoryLabel} Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Other categories for this state */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  Other {stateName} Categories
                </h3>
                <ul className="space-y-1">
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([slug]) => slug !== categorySlug)
                    .map(([slug, label]) => (
                      <li key={slug}>
                        <Link
                          to={`/state-rights/${stateSlug}/${slug}`}
                          className="flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors group"
                        >
                          <span className="text-foreground text-xs">{label}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>

            {/* Key facts */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Key Facts
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Act promptly — state statutes of limitations typically range from 1 to 4 years</span>
                  </li>
                  <li className="flex gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>A formal demand letter citing {primaryStatute.citation} often resolves disputes before AG filing</span>
                  </li>
                  <li className="flex gap-2">
                    <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>You can pursue claims under both state and federal law simultaneously</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Back to state hub */}
            <Link
              to={`/state-rights/${stateSlug}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              ← All {stateName} consumer rights
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
