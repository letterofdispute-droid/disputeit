import { useParams, Link, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Scale, MapPin, ExternalLink, Shield, ArrowRight,
  FileText, Gavel, ChevronRight, BookOpen, AlertCircle,
} from 'lucide-react';
import {
  US_STATES, stateSpecificLaws, getStateFromSlug, CATEGORY_LABELS,
  getStateStatutesForCategory,
} from '@/data/stateSpecificLaws';
import { getSmallClaimsStateBySlug, formatFilingLimit } from '@/data/smallClaimsData';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CATEGORY_ICONS: Record<string, string> = {
  vehicle: '🚗', housing: '🏠', insurance: '🛡️', financial: '💳',
  contractors: '🔨', 'damaged-goods': '📦', refunds: '↩️', travel: '✈️',
  utilities: '⚡', employment: '💼', ecommerce: '🛒', hoa: '🏘️', healthcare: '🏥',
};

export default function StateRightsStatePage() {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const stateCode = stateSlug ? getStateFromSlug(stateSlug) : null;

  if (!stateCode || !stateSpecificLaws[stateCode]) {
    return <Navigate to="/state-rights" replace />;
  }

  const stateData = stateSpecificLaws[stateCode];
  const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
  const primaryStatute = stateData.consumerProtection;

  const title = `${stateName} Consumer Rights Laws | All Statutes & AG Contact | Letter of Dispute`;
  const description = `Find ${stateName}'s consumer protection law (${primaryStatute.citation}), lemon law, tenant rights, and more. Includes ${stateData.agOffice} contact details.`;

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'State Consumer Rights', url: 'https://letterofdispute.com/state-rights' },
    { name: stateName, url: `https://letterofdispute.com/state-rights/${stateSlug}` },
  ];

  const faqItems = [
    {
      question: `What is ${stateName}'s main consumer protection law?`,
      answer: `${stateName}'s primary consumer protection statute is ${primaryStatute.name} (${primaryStatute.citation}). ${primaryStatute.summary}`,
    },
    {
      question: `How do I file a consumer complaint in ${stateName}?`,
      answer: `You can file a formal consumer complaint with the ${stateData.agOffice} through their official website at ${stateData.agWebsite}. Filing a complaint often triggers faster business responses and is free for consumers.`,
    },
    {
      question: `Does ${stateName} have a lemon law for vehicles?`,
      answer: stateData.lemonLaw
        ? `Yes. ${stateName} has a lemon law: ${stateData.lemonLaw.name} (${stateData.lemonLaw.citation}). ${stateData.lemonLaw.summary}`
        : `${stateName} consumers are protected by the federal Magnuson-Moss Warranty Act for defective vehicles. Check with the ${stateData.agOffice} for state-specific remedies.`,
    },
  ];

  // Collect all available specific statutes for this state
  const specificStatutes = [
    stateData.lemonLaw ? { key: 'vehicle', statute: stateData.lemonLaw } : null,
    stateData.landlordTenant ? { key: 'housing', statute: stateData.landlordTenant } : null,
    stateData.insurance ? { key: 'insurance', statute: stateData.insurance } : null,
    stateData.debtCollection ? { key: 'financial', statute: stateData.debtCollection } : null,
    stateData.homeImprovement ? { key: 'contractors', statute: stateData.homeImprovement } : null,
  ].filter(Boolean) as { key: string; statute: { name: string; citation: string; summary: string } }[];

  return (
    <Layout>
      <SEOHead
        title={title}
        description={description}
        canonicalPath={`/state-rights/${stateSlug}`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
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
              <BreadcrumbItem><BreadcrumbPage>{stateName}</BreadcrumbPage></BreadcrumbItem>
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
              <span className="text-sm text-primary-foreground/80">{stateCode} · All Consumer Statutes</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
              {stateName} Consumer Protection Laws
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-6 leading-relaxed max-w-2xl">
              Your complete guide to {stateName}'s consumer protection statutes: primary law, lemon law, tenant rights, and your Attorney General's contact.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary-foreground/10 rounded-lg px-3 py-2 text-center">
                <div className="text-base font-bold text-accent">{primaryStatute.citation}</div>
                <div className="text-xs text-primary-foreground/70">Primary statute</div>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg px-3 py-2 text-center">
                <div className="text-base font-bold text-accent">{specificStatutes.length + 1}</div>
                <div className="text-xs text-primary-foreground/70">Statutes available</div>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg px-3 py-2 text-center">
                <div className="text-base font-bold text-accent">13</div>
                <div className="text-xs text-primary-foreground/70">Dispute categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Primary Consumer Protection Statute */}
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Primary Consumer Protection Law
              </h2>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                    <h3 className="font-semibold text-foreground">{primaryStatute.name}</h3>
                    <Badge variant="secondary" className="font-mono text-xs">{primaryStatute.citation}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{primaryStatute.summary}</p>
                </CardContent>
              </Card>
            </div>

            {/* Specific Statutes */}
            {specificStatutes.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Specific {stateName} Statutes
                </h2>
                <div className="space-y-4">
                  {specificStatutes.map(({ key, statute }) => (
                    <Card key={key} className="border-l-4 border-l-accent/60 hover:shadow-md transition-shadow">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{CATEGORY_ICONS[key]}</span>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{statute.name}</h3>
                              <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[key]}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">{statute.citation}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed ml-8">{statute.summary}</p>
                        <div className="ml-8 mt-3">
                          <Link
                            to={`/state-rights/${stateSlug}/${key}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                          >
                            Full {CATEGORY_LABELS[key]} rights for {stateName} <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* AG Office */}
            <Card className="bg-muted/30">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Gavel className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">File a Complaint: {stateData.agOffice}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The {stateData.agOffice} handles consumer complaints about deceptive business practices, fraud, and unfair trade. Filing a formal complaint often triggers a faster resolution.
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
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Browse by category */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  Browse {stateName} Rights by Category
                </h3>
                <ul className="space-y-1">
                  {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                    <li key={slug}>
                      <Link
                        to={`/state-rights/${stateSlug}/${slug}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors group"
                      >
                        <span className="flex items-center gap-2 text-foreground">
                          <span>{CATEGORY_ICONS[slug]}</span>
                          {label}
                        </span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Small Claims Court Card */}
            {(() => {
              const scData = stateSlug ? getSmallClaimsStateBySlug(stateSlug) : null;
              if (!scData) return null;
              return (
                <Card className="border-accent/30 bg-accent/5">
                  <CardContent className="pt-5">
                    <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-accent" />
                      Small Claims Court in {stateName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      File up to <strong className="text-foreground">{formatFilingLimit(scData.filingLimit)}</strong> in {scData.courtName}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Filing fee: {scData.filingFee} · {scData.hearingTimeframe}
                    </p>
                    <Button asChild variant="default" size="sm" className="w-full gap-2">
                      <Link to={`/small-claims/${scData.slug}`}>
                        <Scale className="h-4 w-4" />
                        View Filing Guide
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}

            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground mb-2">Ready to use {stateName} law?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our letters cite {primaryStatute.citation} and relevant federal law automatically.
                </p>
                <Button asChild variant="default" className="w-full gap-2">
                  <Link to="/templates">
                    <FileText className="h-4 w-4" />
                    Write a Letter
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Other states */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Browse Other States</h3>
                <div className="grid grid-cols-3 gap-1">
                  {US_STATES.slice(0, 18).filter(s => s.code !== stateCode).slice(0, 15).map(s => (
                    <Link
                      key={s.code}
                      to={`/state-rights/${s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                      className="text-center py-1.5 px-1 rounded text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                      {s.code}
                    </Link>
                  ))}
                </div>
                <Link to="/state-rights" className="text-xs text-primary hover:underline mt-2 inline-block">
                  View all 50 states →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-10" />

        {/* All 13 Category Cards */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
            {stateName} Consumer Rights: All 13 Categories
          </h2>
          <p className="text-muted-foreground mb-6">
            Each category page shows the specific statutes, deadlines, and a direct link to write a dispute letter.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => {
              const statutes = getStateStatutesForCategory(stateCode, slug);
              const hasSpecific = statutes.length > 1;
              return (
                <Link
                  key={slug}
                  to={`/state-rights/${stateSlug}/${slug}`}
                  className="p-4 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all bg-card group text-center"
                >
                  <div className="text-2xl mb-2">{CATEGORY_ICONS[slug]}</div>
                  <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{label}</div>
                  {hasSpecific && (
                    <Badge variant="outline" className="mt-2 text-xs px-1.5 py-0">
                      State-specific law
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
