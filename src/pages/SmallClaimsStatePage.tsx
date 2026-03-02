import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { usePageSeo } from '@/hooks/usePageSeo';
import { getSmallClaimsStateBySlug, formatFilingLimit } from '@/data/smallClaimsData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DollarSign, Clock, Scale, ExternalLink, ArrowRight, MapPin, FileText, Shield, Gavel, CheckCircle } from 'lucide-react';
import NotFound from './NotFound';

const SmallClaimsStatePage = () => {
  const { state: stateSlug } = useParams<{ state: string }>();
  const stateData = stateSlug ? getSmallClaimsStateBySlug(stateSlug) : undefined;

  const fallbackTitle = stateData ? `${stateData.name} Small Claims Court Guide (2026) — Limits, Fees & Forms` : '';
  const fallbackDesc = stateData ? `File in ${stateData.name} small claims court: ${formatFilingLimit(stateData.filingLimit)} limit, ${stateData.filingFee} filing fee. Step-by-step guide with forms and rules for ${stateData.courtName}.` : '';

  const { title: seoTitle, description: seoDescription } = usePageSeo({
    slug: `small-claims/${stateSlug || ''}`,
    fallbackTitle,
    fallbackDescription: fallbackDesc,
  });

  if (!stateData) return <NotFound />;

  const siteUrl = 'https://letterofdispute.com';

  const faqItems = [
    {
      question: `What is the small claims court limit in ${stateData.name}?`,
      answer: `The maximum amount you can sue for in ${stateData.name} small claims court is ${formatFilingLimit(stateData.filingLimit)}.`,
    },
    {
      question: `How much does it cost to file in ${stateData.name}?`,
      answer: `Filing fees in ${stateData.name} range from ${stateData.filingFee}, depending on the amount of your claim.`,
    },
    {
      question: `Do I need a lawyer in ${stateData.name} small claims court?`,
      answer: stateData.lawyerAllowed
        ? `Lawyers are allowed in ${stateData.name} small claims court, but most people represent themselves successfully.`
        : `${stateData.name} does not allow lawyers in small claims court. The system is designed for self-representation.`,
    },
    {
      question: `Can I appeal a small claims decision in ${stateData.name}?`,
      answer: stateData.appealAllowed
        ? `Yes, ${stateData.name} allows appeals of small claims decisions, typically for a new trial in a higher court.`
        : `No, ${stateData.name} does not allow appeals of small claims court decisions. The judge's ruling is final.`,
    },
    {
      question: `How long does a small claims case take in ${stateData.name}?`,
      answer: `From filing to hearing, cases in ${stateData.name} typically take ${stateData.hearingTimeframe}. The hearing itself usually lasts 15–30 minutes.`,
    },
  ];

  const filingSteps = [
    {
      title: 'Send a demand letter',
      content: `Before filing, send a formal demand letter to the other party. This shows the ${stateData.courtName} that you attempted to resolve the dispute in good faith.`,
    },
    {
      title: `Get the forms from ${stateData.courtName}`,
      content: `Visit the ${stateData.courtName} website or courthouse to obtain the required complaint or petition forms. You'll need the defendant's full name and address.`,
    },
    {
      title: 'File your claim and pay the fee',
      content: `Submit your completed forms to the clerk of court and pay the filing fee (${stateData.filingFee}). The court will assign a hearing date.`,
    },
    {
      title: 'Serve the defendant',
      content: `The defendant must be officially notified. In ${stateData.name}, service is typically by certified mail, sheriff, or process server.`,
    },
    {
      title: 'Prepare and present your case',
      content: `Gather all evidence: contracts, receipts, photos, and correspondence. Present your case clearly to the judge at the hearing.`,
    },
  ];

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/small-claims/${stateData.slug}`}
        faqItems={faqItems}
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court', url: `${siteUrl}/small-claims` },
          { name: stateData.name, url: `${siteUrl}/small-claims/${stateData.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden text-primary-foreground py-16 md:py-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 text-sm">
              <Gavel className="h-4 w-4" /> {stateData.code} Small Claims Guide
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4 leading-tight">
              {stateData.name} Small Claims Court
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-6">
              File up to {formatFilingLimit(stateData.filingLimit)} in {stateData.courtName}. Filing fees start at {stateData.filingFee}.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge className="bg-white/20 text-primary-foreground border-0 text-sm px-4 py-2">
                Limit: {formatFilingLimit(stateData.filingLimit)}
              </Badge>
              <Badge className="bg-white/20 text-primary-foreground border-0 text-sm px-4 py-2">
                Fee: {stateData.filingFee}
              </Badge>
              <Badge className="bg-white/20 text-primary-foreground border-0 text-sm px-4 py-2">
                {stateData.lawyerAllowed ? 'Lawyers Allowed' : 'No Lawyers'}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts Grid */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="container-wide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: DollarSign, label: 'Maximum Claim', value: formatFilingLimit(stateData.filingLimit), color: 'text-success' },
              { icon: DollarSign, label: 'Filing Fee', value: stateData.filingFee, color: 'text-accent' },
              { icon: Clock, label: 'Hearing Timeframe', value: stateData.hearingTimeframe, color: 'text-warning' },
              { icon: Scale, label: 'Court', value: stateData.courtName, color: 'text-primary' },
            ].map((fact, i) => {
              const Icon = fact.icon;
              return (
                <Card key={i} className="border border-border">
                  <CardContent className="p-5 text-center">
                    <Icon className={`h-6 w-6 ${fact.color} mx-auto mb-2`} />
                    <p className="text-xs text-muted-foreground mb-1">{fact.label}</p>
                    <p className="font-bold text-foreground text-sm">{fact.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statute of Limitations */}
      <section className="py-12">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-6">
            {stateData.name} Statute of Limitations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Written Contract', years: stateData.statuteOfLimitations.writtenContract },
              { label: 'Oral Contract', years: stateData.statuteOfLimitations.oralContract },
              { label: 'Property Damage', years: stateData.statuteOfLimitations.propertyDamage },
              { label: 'Personal Injury', years: stateData.statuteOfLimitations.personalInjury },
            ].map((sol, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{sol.years}</p>
                  <p className="text-xs text-muted-foreground">years</p>
                  <p className="text-sm font-medium text-foreground mt-2">{sol.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Rules */}
      {stateData.specialNotes.length > 0 && (
        <section className="py-12 bg-secondary/30">
          <div className="container-wide max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-6">
              {stateData.name} Rules & Requirements
            </h2>
            <div className="space-y-3">
              {stateData.specialNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-3 bg-card rounded-lg p-4 border border-border">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-foreground">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filing Steps */}
      <section className="py-12">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-6">
            How to File in {stateData.name}
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {filingSteps.map((step, i) => (
              <AccordionItem key={i} value={`step-${i}`} className="border border-border rounded-xl px-5">
                <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-foreground">
                  {i + 1}. {step.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {step.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Court Forms & Links */}
      <section className="py-12 bg-secondary/30">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-6">
            {stateData.name} Court Forms & Resources
          </h2>
          <div className="space-y-3">
            {stateData.formLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">{link.label}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
              </a>
            ))}
            <a
              href={stateData.courtWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <Scale className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">{stateData.name} Official Court Website</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-6 text-center">
            {stateData.name} Small Claims FAQ
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5">
                <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Related Consumer Rights */}
      <section className="py-12">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-6">
            {stateData.name} Consumer Rights by Category
          </h2>
          <p className="text-muted-foreground mb-6">
            Small claims cases often involve these dispute types. Learn your specific rights under {stateData.name} law:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { slug: 'housing', icon: '🏠', label: 'Housing & Tenant' },
              { slug: 'vehicle', icon: '🚗', label: 'Vehicle & Lemon Law' },
              { slug: 'contractors', icon: '🔨', label: 'Contractors' },
              { slug: 'financial', icon: '💳', label: 'Financial' },
            ].map(cat => (
              <Link
                key={cat.slug}
                to={`/state-rights/${stateData.slug}/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all bg-card text-center group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container-wide text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold font-serif mb-4">Before You File, Send a Demand Letter</h2>
          <p className="text-primary-foreground/80 mb-6">
            A professional demand letter often resolves disputes without court — and strengthens your case if you do file in {stateData.name}.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/templates">
                <FileText className="mr-2 h-5 w-5" /> Browse Templates
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-primary-foreground hover:bg-white/10" asChild>
              <Link to={`/state-rights/${stateData.slug}`}>
                <MapPin className="mr-2 h-5 w-5" /> {stateData.name} Consumer Rights
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SmallClaimsStatePage;
