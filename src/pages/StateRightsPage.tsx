import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Scale, MapPin, ExternalLink, Shield, BookOpen, 
  ArrowRight, CheckCircle2, FileText, AlertCircle
} from 'lucide-react';
import { US_STATES, stateSpecificLaws, getStateStatutesForCategory } from '@/data/stateSpecificLaws';
import { templateCategories } from '@/data/templateCategories';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const CATEGORY_LABELS: Record<string, string> = {
  vehicle: 'Vehicle (Lemon Law)',
  housing: 'Housing & Tenant Rights',
  insurance: 'Insurance Claims',
  financial: 'Financial & Debt',
  contractors: 'Contractors & Home Improvement',
  'damaged-goods': 'Damaged Goods',
  refunds: 'Refunds & Returns',
  travel: 'Travel',
  utilities: 'Utilities',
  employment: 'Employment',
  ecommerce: 'E-Commerce',
  hoa: 'HOA',
  healthcare: 'Healthcare',
};

const StateRightsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedState) params.state = selectedState;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [selectedState, selectedCategory]);

  const stateData = selectedState ? stateSpecificLaws[selectedState] : null;
  const statutes = selectedState && selectedCategory
    ? getStateStatutesForCategory(selectedState, selectedCategory)
    : selectedState && stateData
    ? [stateData.consumerProtection]
    : [];

  const selectedStateName = US_STATES.find(s => s.code === selectedState)?.name || '';

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Free Tools', url: 'https://letterofdispute.com/state-rights' },
    { name: 'State Consumer Rights Lookup', url: 'https://letterofdispute.com/state-rights' },
  ];

  const faqItems = [
    { question: 'What consumer protection laws apply in my state?', answer: 'Every US state has its own consumer protection statute that works alongside federal laws like the FTC Act. Use this tool to find the specific statute, citation, and your state Attorney General\'s contact information.' },
    { question: 'What is a state Attorney General?', answer: 'The Attorney General (AG) is the chief law enforcement officer of a state. Their consumer protection division handles complaints about deceptive business practices, unfair trade, and consumer fraud.' },
    { question: 'Can I sue under both state and federal consumer protection laws?', answer: 'Yes. Federal laws like the FTC Act, FCBA, and FDCPA set minimum standards, but state laws can provide stronger protections and additional remedies like treble damages or attorney fees.' },
  ];

  return (
    <Layout>
      <SEOHead
        title="State Consumer Rights Lookup — Find Your State's Laws | Letter of Dispute"
        description="Find consumer protection laws, statutes, and Attorney General contacts for all 50 US states. Free interactive tool for refund rights, lemon laws, tenant rights, and more."
        canonicalPath="/state-rights"
        faqItems={faqItems}
        breadcrumbs={breadcrumbs}
      />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>State Consumer Rights Lookup</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Shield className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">Free Tool — No Login Required</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              State Consumer Rights Lookup
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Find the exact consumer protection laws, statute citations, and Attorney General contact for any US state and dispute type. Real statutes from real legal codes.
            </p>
          </div>
        </div>
      </section>

      {/* Lookup Tool */}
      <section className="py-10 bg-card border-b">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <MapPin className="h-5 w-5 text-primary" />
                  Select Your State & Dispute Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Your State</label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state..." />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Dispute Type <span className="text-muted-foreground">(optional)</span></label>
                    <Select value={selectedCategory || 'all'} onValueChange={v => setSelectedCategory(v === 'all' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All consumer protection..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Consumer Protection</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                          <SelectItem key={id} value={id}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            {!selectedState ? (
              <div className="text-center py-16">
                <Scale className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Select a state to see your rights</h2>
                <p className="text-muted-foreground">We have real statute data for all 50 states and DC.</p>
              </div>
            ) : stateData ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      {selectedStateName} Consumer Rights
                    </h2>
                    {selectedCategory && (
                      <p className="text-muted-foreground mt-1">
                        Showing laws relevant to: <span className="font-medium text-foreground">{CATEGORY_LABELS[selectedCategory]}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Last reviewed: February 2026</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Real Statute Citations
                  </Badge>
                </div>

                {/* Statutes */}
                <div className="space-y-4">
                  {statutes.map((statute, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                          <h3 className="font-semibold text-foreground">{statute.name}</h3>
                          <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap">
                            {statute.citation}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{statute.summary}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* AG Office */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">File a Complaint: {stateData.agOffice}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          If a business violates your consumer rights, you can file a formal complaint with your state Attorney General's consumer protection division.
                        </p>
                        <a
                          href={stateData.agWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Visit {stateData.agOffice} →
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* CTA */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          Ready to assert your {selectedStateName} rights?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Our AI-powered letters cite the exact statutes shown above, citing both federal and {selectedStateName} law.
                        </p>
                      </div>
                      <Button asChild variant="accent" className="gap-2 flex-shrink-0">
                        <Link to={selectedCategory ? `/templates/${selectedCategory}` : '/templates'}>
                          <FileText className="h-4 w-4" />
                          Write a Letter
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Cross-link: Deadlines */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Also check:{' '}
                    <Link
                      to={`/deadlines${selectedCategory ? `?category=${selectedCategory}&state=${selectedState}` : `?state=${selectedState}`}`}
                      className="text-primary hover:underline font-medium"
                    >
                      How long do you have to act in {selectedStateName}? →
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No data found for that state.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Strip */}
      <section className="py-10 bg-muted/30 border-t">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-xl font-bold text-foreground mb-6 text-center">
              Why State Laws Matter for Your Dispute
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Scale,
                  title: 'State Law Can Be Stronger',
                  desc: 'Many states offer treble (3x) damages, attorney fee recovery, and shorter deadlines that favor consumers more than federal baseline laws.'
                },
                {
                  icon: CheckCircle2,
                  title: 'Cite the Right Citation',
                  desc: 'Businesses take disputes more seriously when you cite the exact statute — Cal. Civ. Code § 1750 carries more weight than a vague reference to "consumer protection law."'
                },
                {
                  icon: BookOpen,
                  title: 'AG Complaint Triggers Response',
                  desc: 'Mentioning that you have filed or will file a complaint with your state AG can accelerate resolution. Many businesses settle rather than face regulatory scrutiny.'
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default StateRightsPage;
