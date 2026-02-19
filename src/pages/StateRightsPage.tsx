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
  ArrowRight, CheckCircle2, FileText, AlertCircle, Gavel, Users, Clock
} from 'lucide-react';
import { US_STATES, stateSpecificLaws, getStateStatutesForCategory, getStateSlug } from '@/data/stateSpecificLaws';
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

// Simplified US map — 10-state regional overview SVG
function USMapIllustration({ selectedState }: { selectedState: string }) {
  // Simplified rectangular state blocks arranged geographically
  const states: { code: string; x: number; y: number; w: number; h: number; label: string }[] = [
    // Pacific
    { code: 'WA', x: 30, y: 20, w: 55, h: 40, label: 'WA' },
    { code: 'OR', x: 30, y: 62, w: 55, h: 40, label: 'OR' },
    { code: 'CA', x: 20, y: 104, w: 55, h: 80, label: 'CA' },
    // Mountain
    { code: 'MT', x: 90, y: 20, w: 65, h: 40, label: 'MT' },
    { code: 'ID', x: 90, y: 62, w: 40, h: 60, label: 'ID' },
    { code: 'WY', x: 132, y: 62, w: 55, h: 45, label: 'WY' },
    { code: 'NV', x: 78, y: 104, w: 50, h: 60, label: 'NV' },
    { code: 'UT', x: 130, y: 109, w: 55, h: 50, label: 'UT' },
    { code: 'CO', x: 132, y: 109, w: 55, h: 45, label: 'CO' },
    { code: 'AZ', x: 80, y: 166, w: 55, h: 60, label: 'AZ' },
    { code: 'NM', x: 137, y: 157, w: 55, h: 60, label: 'NM' },
    // Central/Plains
    { code: 'ND', x: 192, y: 20, w: 55, h: 35, label: 'ND' },
    { code: 'SD', x: 192, y: 57, w: 55, h: 35, label: 'SD' },
    { code: 'NE', x: 192, y: 94, w: 60, h: 35, label: 'NE' },
    { code: 'KS', x: 192, y: 131, w: 60, h: 35, label: 'KS' },
    { code: 'MN', x: 250, y: 20, w: 50, h: 55, label: 'MN' },
    { code: 'IA', x: 255, y: 77, w: 50, h: 35, label: 'IA' },
    { code: 'MO', x: 255, y: 114, w: 50, h: 42, label: 'MO' },
    { code: 'AR', x: 255, y: 158, w: 50, h: 38, label: 'AR' },
    { code: 'OK', x: 192, y: 168, w: 70, h: 35, label: 'OK' },
    { code: 'TX', x: 192, y: 205, w: 80, h: 70, label: 'TX' },
    // Great Lakes
    { code: 'WI', x: 308, y: 34, w: 45, h: 48, label: 'WI' },
    { code: 'MI', x: 355, y: 20, w: 55, h: 55, label: 'MI' },
    { code: 'IL', x: 308, y: 84, w: 40, h: 60, label: 'IL' },
    { code: 'IN', x: 350, y: 77, w: 38, h: 52, label: 'IN' },
    { code: 'OH', x: 390, y: 60, w: 50, h: 55, label: 'OH' },
    { code: 'KY', x: 350, y: 131, w: 70, h: 35, label: 'KY' },
    { code: 'TN', x: 310, y: 167, w: 90, h: 32, label: 'TN' },
    { code: 'MS', x: 295, y: 198, w: 42, h: 55, label: 'MS' },
    { code: 'AL', x: 339, y: 198, w: 42, h: 55, label: 'AL' },
    { code: 'LA', x: 268, y: 220, w: 55, h: 50, label: 'LA' },
    // Northeast
    { code: 'PA', x: 443, y: 57, w: 58, h: 40, label: 'PA' },
    { code: 'NY', x: 443, y: 15, w: 68, h: 42, label: 'NY' },
    { code: 'WV', x: 430, y: 99, w: 42, h: 40, label: 'WV' },
    { code: 'VA', x: 440, y: 100, w: 60, h: 38, label: 'VA' },
    { code: 'NC', x: 400, y: 140, w: 75, h: 32, label: 'NC' },
    { code: 'SC', x: 420, y: 174, w: 55, h: 38, label: 'SC' },
    { code: 'GA', x: 383, y: 196, w: 55, h: 55, label: 'GA' },
    { code: 'FL', x: 390, y: 230, w: 70, h: 50, label: 'FL' },
    { code: 'MD', x: 502, y: 95, w: 35, h: 20, label: 'MD' },
    { code: 'DE', x: 504, y: 75, w: 20, h: 18, label: 'DE' },
    { code: 'NJ', x: 510, y: 55, w: 20, h: 30, label: 'NJ' },
    { code: 'CT', x: 515, y: 38, w: 22, h: 18, label: 'CT' },
    { code: 'RI', x: 538, y: 38, w: 16, h: 16, label: 'RI' },
    { code: 'MA', x: 514, y: 20, w: 40, h: 18, label: 'MA' },
    { code: 'VT', x: 505, y: 15, w: 20, h: 18, label: 'VT' },
    { code: 'NH', x: 525, y: 10, w: 20, h: 22, label: 'NH' },
    { code: 'ME', x: 532, y: 8, w: 24, h: 28, label: 'ME' },
  ];

  return (
    <svg viewBox="0 0 580 290" className="w-full" aria-label="US state map">
      <rect width="580" height="290" fill="hsl(210 20% 98%)" rx="8" />
      {states.map((s) => {
        const isSelected = s.code === selectedState;
        return (
          <g key={s.code}>
            <rect
              x={s.x} y={s.y} width={s.w} height={s.h} rx="2"
              fill={isSelected ? 'hsl(222 47% 20%)' : 'hsl(215 25% 88%)'}
              stroke="hsl(210 20% 98%)"
              strokeWidth="1.5"
              style={{ transition: 'fill 0.3s ease' }}
            />
            {s.w > 35 && s.h > 30 && (
              <text
                x={s.x + s.w / 2} y={s.y + s.h / 2 + 4}
                textAnchor="middle"
                fontSize={s.w > 55 ? '9' : '7'}
                fill={isSelected ? 'hsl(210 40% 98%)' : 'hsl(222 47% 30%)'}
                fontWeight={isSelected ? '700' : '500'}
                style={{ transition: 'fill 0.3s ease' }}
              >
                {s.label}
              </text>
            )}
          </g>
        );
      })}
      {!selectedState && (
        <text x="290" y="270" textAnchor="middle" fontSize="10" fill="hsl(215 16% 60%)">
          Select a state to highlight it
        </text>
      )}
    </svg>
  );
}

const NOTABLE_STATES = [
  {
    code: 'CA',
    name: 'California',
    statute: 'Cal. Civ. Code § 1750 (CLRA)',
    highlight: 'Treble damages + mandatory attorney fees. Among the strongest consumer laws in the country.',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
    labelColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    code: 'NY',
    name: 'New York',
    statute: 'N.Y. Gen. Bus. Law § 349',
    highlight: 'Minimum $50 statutory damages even without actual harm. AG can seek civil penalties per violation.',
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900',
    labelColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    code: 'MA',
    name: 'Massachusetts',
    statute: 'Mass. Gen. Laws ch. 93A',
    highlight: 'Mandatory double or triple damages for willful violations. One of the broadest "unfair acts" definitions.',
    color: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
    labelColor: 'text-green-700 dark:text-green-300',
  },
  {
    code: 'IL',
    name: 'Illinois',
    statute: 'Illinois Consumer Fraud Act (ICFA)',
    highlight: 'No requirement to prove intent or reliance. AG can file class actions on behalf of consumers.',
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900',
    labelColor: 'text-orange-700 dark:text-orange-300',
  },
  {
    code: 'TX',
    name: 'Texas',
    statute: 'Tex. Bus. & Com. Code § 17.46 (DTPA)',
    highlight: 'Laundry list of 27 enumerated deceptive practices. Up to 3× damages for knowing violations.',
    color: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
    labelColor: 'text-red-700 dark:text-red-300',
  },
];

const AG_STEPS = [
  {
    step: 1,
    title: 'Gather Documentation',
    desc: 'Collect your receipt, correspondence, contract, photos, and any other evidence. Note exact dates and dollar amounts.',
  },
  {
    step: 2,
    title: 'Write a Demand Letter First',
    desc: 'Many state AG offices require proof you contacted the business. Send a formal dispute letter and wait 14–30 days for a response.',
  },
  {
    step: 3,
    title: 'File the Complaint Online',
    desc: 'Visit your state AG\'s consumer complaint portal. Submit details about the business, the violation, and the resolution you seek. Attach your documentation.',
  },
  {
    step: 4,
    title: 'What to Expect',
    desc: 'The AG office will typically acknowledge your complaint within 1–2 weeks. They may mediate with the business, refer your case, or take enforcement action if a pattern exists.',
  },
];

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

      {/* Hero — split layout with map */}
      <section className="bg-primary py-14 md:py-20 overflow-hidden">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-5">
                <Shield className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-sm text-primary-foreground/80">Free Tool — No Login Required</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-5 leading-tight">
                Know Your State's Consumer Protection Laws
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-6 leading-relaxed">
                State laws can be dramatically stronger than federal law — offering treble damages, mandatory attorney fees, and broader definitions of unfair practices. Find the exact statute for your state and dispute type.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { stat: '50+', label: 'States covered' },
                  { stat: '13', label: 'Dispute categories' },
                  { stat: '3×', label: 'Max damages (some states)' },
                ].map((s) => (
                  <div key={s.stat} className="bg-primary-foreground/10 rounded-lg px-3 py-2 text-center">
                    <div className="text-lg font-bold text-accent">{s.stat}</div>
                    <div className="text-xs text-primary-foreground/70">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block rounded-xl overflow-hidden border border-primary-foreground/10 bg-primary-foreground/5 p-3">
              <USMapIllustration selectedState={selectedState} />
            </div>
          </div>
        </div>
      </section>

      {/* Lookup Tool */}
      <section className="py-10 bg-card border-b">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20 shadow-md">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">Real Statute Citations</Badge>
                    <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
                      <Link to={`/state-rights/${getStateSlug(selectedState)}${selectedCategory ? `/${selectedCategory}` : ''}`}>
                        <ArrowRight className="h-3 w-3" />
                        View dedicated page →
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {statutes.map((statute, index) => (
                    <Card key={index} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
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
                        <a href={stateData.agWebsite} target="_blank" rel="noopener noreferrer"
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

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Ready to assert your {selectedStateName} rights?</h3>
                        <p className="text-sm text-muted-foreground">
                          Our AI-powered letters cite the exact statutes shown above, referencing both federal and {selectedStateName} law.
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

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Also check:{' '}
                    <Link to={`/deadlines${selectedCategory ? `?category=${selectedCategory}&state=${selectedState}` : `?state=${selectedState}`}`}
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

      {/* Federal vs State Comparison */}
      <section className="py-12 bg-muted/30 border-t border-b">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Federal vs. State: What's Different?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">State laws set the floor above the federal minimum</p>
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="text-left px-5 py-3 font-semibold">Protection Area</th>
                      <th className="text-left px-5 py-3 font-semibold">Federal Floor</th>
                      <th className="text-left px-5 py-3 font-semibold">State Can Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { area: 'Damages', fed: 'Actual damages only', state: 'Treble (3×) damages, statutory minimums' },
                      { area: 'Attorney Fees', fed: 'Sometimes available', state: 'Often mandatory if consumer wins' },
                      { area: 'Deadline to Sue', fed: '3–4 years typical', state: 'Can be shorter or longer' },
                      { area: 'Who Enforces', fed: 'FTC, CFPB, federal courts', state: 'State AG + private right of action' },
                      { area: 'Scope of "Unfair Acts"', fed: 'Defined by federal statute', state: 'Often broader—can include more conduct' },
                    ].map((row, i) => (
                      <tr key={row.area} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                        <td className="px-5 py-3 font-medium text-foreground">{row.area}</td>
                        <td className="px-5 py-3 text-muted-foreground">{row.fed}</td>
                        <td className="px-5 py-3 text-accent font-medium">{row.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why State Laws Matter */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6 text-center">3 Reasons State Law Matters for Your Dispute</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Scale,
                  title: 'Stronger Remedies',
                  desc: 'Many states offer treble (3×) damages, attorney fee recovery, and shorter deadlines that favor consumers more than federal baseline laws.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Cite the Right Citation',
                  desc: 'Businesses take disputes more seriously when you cite the exact statute — Cal. Civ. Code § 1750 carries more weight than a vague reference to "consumer protection law."',
                },
                {
                  icon: BookOpen,
                  title: 'AG Complaint Triggers Response',
                  desc: 'Mentioning that you have filed or will file a complaint with your state AG can accelerate resolution. Many businesses settle rather than face regulatory scrutiny.',
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

      {/* Notable States Strip */}
      <section className="py-12 bg-muted/30 border-t border-b">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">States with the Strongest Consumer Laws</h2>
                <p className="text-sm text-muted-foreground mt-0.5">These 5 states are frequently cited as having protections well above the federal floor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {NOTABLE_STATES.map((s) => (
                <div key={s.code} className={`p-4 rounded-xl border ${s.color}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-bold text-foreground">{s.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs font-mono">{s.code}</Badge>
                    </div>
                  </div>
                  <p className={`text-xs font-mono mb-2 ${s.labelColor}`}>{s.statute}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.highlight}</p>
                  <Button asChild variant="ghost" size="sm" className="mt-3 h-7 text-xs px-2">
                    <Link to={`/state-rights/${getStateSlug(s.code)}`}>
                      View {s.name} laws →
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Static crawlable state directory — all 51 state hubs as real <a> links for Google */}
      <section className="py-12 bg-card border-t">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">Browse Consumer Rights by State</h2>
            <p className="text-sm text-muted-foreground mb-6">Select your state to see its specific consumer protection statutes, AG contact, and filing deadlines.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {US_STATES.map((state) => (
                <Link
                  key={state.code}
                  to={`/state-rights/${getStateSlug(state.code)}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0">{state.code}</span>
                  <span className="truncate">{state.name}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to File an AG Complaint */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gavel className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">How to File an AG Complaint</h2>
                <p className="text-sm text-muted-foreground mt-0.5">A step-by-step guide to filing with your state Attorney General</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AG_STEPS.map((step) => (
                <Card key={step.step} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Pro tip:</strong> A formal dispute letter is often required before filing an AG complaint. Our letter templates are formatted to meet this requirement and reference the exact state statutes that matter to your AG's office.{' '}
                <Link to="/templates" className="text-primary hover:underline font-medium">Browse templates →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default StateRightsPage;
