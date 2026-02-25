import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Clock, AlertTriangle, CheckCircle2, CalendarIcon, 
  ArrowRight, FileText, Info, Scale, AlertCircle, BookOpen, Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays } from 'date-fns';
import { consumerRightsGuides } from '@/data/consumerRightsContent';
import { US_STATES } from '@/data/stateSpecificLaws';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

function extractDays(deadlineStr: string): number | null {
  const patterns = [
    { regex: /(\d+)\s*business\s*day/i, mult: 1 },
    { regex: /(\d+)\s*day/i, mult: 1 },
    { regex: /(\d+)\s*month/i, mult: 30 },
    { regex: /(\d+)\s*year/i, mult: 365 },
  ];
  for (const { regex, mult } of patterns) {
    const m = deadlineStr.match(regex);
    if (m) return parseInt(m[1]) * mult;
  }
  return null;
}

function getUrgencyLevel(daysRemaining: number | null): 'expired' | 'urgent' | 'warning' | 'safe' {
  if (daysRemaining === null) return 'safe';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 7) return 'urgent';
  if (daysRemaining <= 30) return 'warning';
  return 'safe';
}

const URGENCY_CONFIG = {
  expired: { color: 'border-destructive bg-destructive/5', badge: 'bg-destructive text-destructive-foreground', label: 'Deadline Passed', icon: AlertTriangle, iconColor: 'text-destructive', ringColor: '#ef4444' },
  urgent:  { color: 'border-destructive bg-destructive/5', badge: 'bg-destructive text-destructive-foreground', label: 'Act Immediately', icon: AlertTriangle, iconColor: 'text-destructive', ringColor: '#ef4444' },
  warning: { color: 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10', badge: 'bg-yellow-500 text-white', label: 'Act Soon', icon: Clock, iconColor: 'text-yellow-600', ringColor: '#eab308' },
  safe:    { color: 'border-green-500 bg-green-50/50 dark:bg-green-950/10', badge: 'bg-green-500 text-white', label: 'Time Remaining', icon: CheckCircle2, iconColor: 'text-green-600', ringColor: '#22c55e' },
};

const CATEGORY_LABELS: Record<string, string> = {
  refunds: 'Refunds & Returns',
  housing: 'Housing & Tenant Rights',
  vehicle: 'Vehicle (Lemon Law)',
  financial: 'Financial & Credit',
  insurance: 'Insurance Claims',
  employment: 'Employment',
  ecommerce: 'E-Commerce',
  utilities: 'Utilities',
  contractors: 'Contractors',
  'damaged-goods': 'Damaged Goods',
  travel: 'Travel',
  hoa: 'HOA Disputes',
  healthcare: 'Healthcare',
};

const COMMON_DEADLINES = [
  { law: 'Fair Credit Billing Act (FCBA)', deadline: '60 days', description: 'Dispute a credit card charge after receiving statement', category: 'financial' },
  { law: 'FTC Mail Order Rule', deadline: '30 days', description: 'Seller must ship or offer cancellation within 30 days', category: 'ecommerce' },
  { law: 'Fair Debt Collection Practices Act', deadline: '30 days', description: 'Dispute a debt after receiving validation notice', category: 'financial' },
  { law: 'Magnuson-Moss Warranty Act', deadline: '4 years', description: 'Warranty breach claims (federal statute of limitations)', category: 'vehicle' },
  { law: 'FTC Cooling-Off Rule', deadline: '3 business days', description: 'Cancel door-to-door or off-premises sales', category: 'refunds' },
  { law: 'HUD / Fair Housing Act', deadline: '1 year', description: 'File a housing discrimination complaint with HUD', category: 'housing' },
  { law: 'Equal Credit Opportunity Act (ECOA)', deadline: '2 years', description: 'File a credit discrimination lawsuit', category: 'financial' },
  { law: 'Truth in Lending Act (TILA)', deadline: '3 years', description: 'Right of rescission for certain mortgage transactions', category: 'financial' },
];

const FAQ_ITEMS = [
  {
    q: 'Can I dispute a charge after 60 days?',
    a: 'Under the Fair Credit Billing Act, the 60-day window is a hard federal deadline for written disputes. After 60 days, the card issuer is under no obligation to investigate. However, you may still have recourse through your state\'s consumer protection laws or through the card network\'s own chargeback rules (which can extend up to 120 days in some cases). Act as soon as possible.'
  },
  {
    q: 'What is the "discovery rule" and how does it affect my deadline?',
    a: 'The discovery rule is a legal doctrine that "tolls" (pauses) the statute of limitations from the date you discovered—or reasonably should have discovered—the harm, rather than the date the harm occurred. It applies most often to fraud, concealed defects, and latent injuries. State courts apply this doctrine differently; some states have codified it in their consumer protection statutes.'
  },
  {
    q: 'Does the deadline reset if the company promises to fix the problem?',
    a: 'Promises to fix a problem do NOT automatically reset federal deadlines. However, certain actions by the company—like acknowledging liability in writing, making a partial payment, or entering a written agreement to resolve the issue—may constitute a waiver or create a new cause of action under state contract law. Get any promises in writing and act on your federal rights immediately regardless.'
  },
  {
    q: 'How do I find my state\'s statute of limitations?',
    a: 'Use our State Rights Lookup tool to find your state\'s specific consumer protection statutes and limitations periods. State SOLs for consumer protection claims typically range from 2–6 years. Your state Attorney General\'s website is also a reliable source. For complex situations, a consumer protection attorney can advise on which SOL applies to your specific facts.'
  },
  {
    q: 'What if the company has gone out of business?',
    a: 'You still have options. First, check if the company filed for bankruptcy—creditors (including consumers) can file claims in bankruptcy proceedings. Second, check if the company had insurance that might cover your claim. Third, your credit card issuer may still process a chargeback. Finally, your state AG\'s consumer protection division sometimes maintains restitution funds from enforcement actions.'
  },
  {
    q: 'Does sending a letter pause the clock?',
    a: 'Sending a letter does NOT pause (toll) the statute of limitations. The clock keeps running regardless of whether you\'re negotiating with the company. Tolling is a legal doctrine applied by courts and only occurs in specific circumstances (fraud concealment, minority, incapacity, etc.). Always take formal action—filing a complaint or lawsuit—before the deadline expires, even if you\'re still in talks.'
  },
];

// Animated countdown ring SVG for each deadline card
function CountdownRing({ pctRemaining, urgencyColor }: { pctRemaining: number; urgencyColor: string }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, pctRemaining)));
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={urgencyColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
}

// Hero hourglass illustration
function DeadlineHeroIllustration() {
  return (
    <svg viewBox="0 0 220 260" className="w-full max-w-[200px] mx-auto" aria-hidden="true">
      <defs>
        <linearGradient id="dlSand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(38 92% 60%)" />
          <stop offset="100%" stopColor="hsl(32 95% 44%)" />
        </linearGradient>
        <linearGradient id="dlGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(210 40% 98%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(222 47% 20%)" stopOpacity="0.08" />
        </linearGradient>
        <clipPath id="dlTopClip"><path d="M55 20 L165 20 L145 120 L75 120 Z" /></clipPath>
        <clipPath id="dlBotClip"><path d="M75 140 L145 140 L165 240 L55 240 Z" /></clipPath>
      </defs>

      {/* Frame */}
      <rect x="48" y="12" width="124" height="12" rx="6" fill="hsl(222 47% 20%)" />
      <rect x="48" y="236" width="124" height="12" rx="6" fill="hsl(222 47% 20%)" />
      <rect x="50" y="12" width="10" height="236" rx="5" fill="hsl(222 47% 20%)" />
      <rect x="160" y="12" width="10" height="236" rx="5" fill="hsl(222 47% 20%)" />

      {/* Top glass */}
      <path d="M58 24 L162 24 L142 118 L78 118 Z" fill="url(#dlGlass)" stroke="hsl(222 47% 30%)" strokeWidth="1.5" />
      {/* Sand in top (animated draining) */}
      <g clipPath="url(#dlTopClip)">
        <rect x="55" y="70" width="110" height="50" fill="url(#dlSand)" opacity="0.9">
          <animate attributeName="y" values="70;90;70" dur="4s" repeatCount="indefinite" />
          <animate attributeName="height" values="50;30;50" dur="4s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Neck */}
      <path d="M78 118 L100 128 L120 128 L142 118" fill="none" stroke="hsl(222 47% 30%)" strokeWidth="1.5" />
      <path d="M100 128 L100 140 L120 140 L120 128" fill="hsl(38 92% 50%)" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* Bottom glass */}
      <path d="M78 142 L142 142 L162 236 L58 236 Z" fill="url(#dlGlass)" stroke="hsl(222 47% 30%)" strokeWidth="1.5" />
      {/* Sand in bottom (accumulating) */}
      <g clipPath="url(#dlBotClip)">
        <rect x="58" y="190" width="104" height="46" fill="url(#dlSand)" opacity="0.85">
          <animate attributeName="y" values="190;178;190" dur="4s" repeatCount="indefinite" />
          <animate attributeName="height" values="46;58;46" dur="4s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Floating badges */}
      <g transform="translate(170, 48)">
        <rect x="0" y="0" width="42" height="20" rx="10" fill="hsl(222 47% 20%)" />
        <text x="21" y="14" textAnchor="middle" fontSize="8" fill="hsl(210 40% 98%)" fontWeight="600">60 Days</text>
      </g>
      <g transform="translate(-10, 120)">
        <rect x="0" y="0" width="42" height="20" rx="10" fill="hsl(38 92% 50%)" />
        <text x="21" y="14" textAnchor="middle" fontSize="8" fill="hsl(222 47% 11%)" fontWeight="600">3 Years</text>
      </g>
      <g transform="translate(165, 190)">
        <rect x="0" y="0" width="46" height="20" rx="10" fill="hsl(0 84% 60%)" />
        <text x="23" y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="700">Act Now</text>
        <animate attributeName="opacity" values="1;0.6;1" dur="1.8s" repeatCount="indefinite" />
      </g>
    </svg>
  );
}

const STEPS = ['Select Dispute Type', 'Choose Your State', 'Enter Incident Date'];

const DeadlinesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

  const currentStep = !selectedCategory ? 0 : !selectedState ? 1 : !incidentDate ? 2 : 3;

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory) params.category = selectedCategory;
    if (selectedState) params.state = selectedState;
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedState]);

  const guide = selectedCategory ? consumerRightsGuides.find(g => g.categoryId === selectedCategory) : null;
  const deadlines = guide?.importantDeadlines || [];

  // Compute soonest deadline for the summary badge
  const soonestDays = incidentDate && deadlines.length > 0
    ? deadlines.reduce((min: number | null, d) => {
        const days = extractDays(d);
        if (days === null) return min;
        return min === null ? days : Math.min(min, days);
      }, null)
    : null;
  const soonestRemaining = soonestDays !== null && incidentDate
    ? differenceInDays(addDays(incidentDate, soonestDays), new Date())
    : null;

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Deadlines Calculator', url: 'https://letterofdispute.com/deadlines' },
  ];

  const faqSchema = [
    { question: 'How long do I have to dispute a credit card charge?', answer: 'Under the Fair Credit Billing Act (FCBA), you have 60 days from the date of the billing statement containing the charge to file a written dispute with your card issuer.' },
    { question: 'What is the statute of limitations for consumer protection claims?', answer: 'It varies by state and claim type. Federal claims under the FTC Act typically have a 3-year limitation. State consumer protection statutes range from 1-6 years. Always act as soon as possible.' },
    { question: 'What is the discovery rule?', answer: 'The discovery rule tolls the statute of limitations from the date you discovered—or reasonably should have discovered—the harm, rather than when it occurred.' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Statute of Limitations & Dispute Deadlines Calculator | Letter of Dispute"
        description="Find out how long you have to dispute charges, file complaints, or take legal action. Free interactive tool showing real federal deadlines by dispute type and state."
        canonicalPath="/deadlines"
        faqItems={faqSchema}
        breadcrumbs={breadcrumbs}
      />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Deadlines Calculator</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero — split layout */}
      <section className="relative bg-primary py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-primary/90" />
        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-5">
                <Clock className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-sm text-primary-foreground/80">Free Tool — Real Federal Deadlines</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-5 leading-tight">
                Don't Let the Clock Run Out on Your Rights
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-6 leading-relaxed">
                Every consumer dispute has a legal deadline. Miss it and you may lose your right to act—permanently. Enter your incident date to see a live countdown for every applicable deadline.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { stat: '60 days', label: 'Credit card dispute (FCBA)' },
                  { stat: '30 days', label: 'FTC mail order rule' },
                  { stat: '3 years', label: 'Typical FTC statute of limitations' },
                ].map((s) => (
                  <div key={s.stat} className="bg-primary-foreground/10 rounded-lg px-3 py-2 text-center">
                    <div className="text-lg font-bold text-accent">{s.stat}</div>
                    <div className="text-xs text-primary-foreground/70">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <DeadlineHeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Step indicator + Calculator */}
      <section className="py-10 bg-card border-b">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            {/* Step progress */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors',
                    i < currentStep ? 'bg-green-500 text-white' :
                    i === currentStep ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn('text-xs font-medium hidden sm:block', i === currentStep ? 'text-foreground' : 'text-muted-foreground')}>
                    {step}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={cn('flex-1 h-0.5 mx-1', i < currentStep ? 'bg-green-500' : 'bg-muted')} />
                  )}
                </div>
              ))}
            </div>

            <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Clock className="h-5 w-5 text-primary" />
                  Calculate Your Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Dispute Type</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                          <SelectItem key={id} value={id}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Your State <span className="text-muted-foreground text-xs">(optional)</span></label>
                    <Select value={selectedState || 'all'} onValueChange={v => setSelectedState(v === 'all' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States (Federal)</SelectItem>
                        {US_STATES.map((s) => (
                          <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Incident Date <span className="text-muted-foreground text-xs">(optional)</span></label>
                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !incidentDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {incidentDate ? format(incidentDate, 'PPP') : 'When did it happen?'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={incidentDate}
                          onSelect={(d) => { setIncidentDate(d); setCalOpen(false); }}
                          disabled={(d) => d > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Live summary badge */}
                {incidentDate && selectedCategory && soonestRemaining !== null && (
                  <div className={cn(
                    'mt-4 p-3 rounded-lg flex items-center gap-3 text-sm font-medium',
                    soonestRemaining < 0 ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                    soonestRemaining <= 30 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300' :
                    'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-300'
                  )}>
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    {soonestRemaining < 0
                      ? `Your soonest deadline expired ${Math.abs(soonestRemaining)} days ago. Consult an attorney immediately.`
                      : `You have ${soonestRemaining} days from today to meet your soonest deadline.`
                    }
                  </div>
                )}

                {incidentDate && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Counting from {format(incidentDate, 'MMMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            {!selectedCategory ? (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Select a dispute type to see deadlines</h2>
                <p className="text-muted-foreground">We show real federal deadlines from statutes like the FCBA, FDCPA, and more.</p>
              </div>
            ) : deadlines.length === 0 ? (
              <div className="text-center py-16">
                <Info className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No specific deadline data for this category yet. Contact your state AG or consult an attorney.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      {CATEGORY_LABELS[selectedCategory]} Deadlines
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Federal law deadlines — real citations from consumer protection statutes
                    </p>
                  </div>
                  {incidentDate && (
                    <Badge variant="outline">From {format(incidentDate, 'MMM d, yyyy')}</Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {deadlines.map((deadline, index) => {
                    const days = extractDays(deadline);
                    const deadlineDate = incidentDate && days ? addDays(incidentDate, days) : null;
                    const daysRemaining = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null;
                    const urgency = incidentDate ? getUrgencyLevel(daysRemaining) : 'safe';
                    const config = URGENCY_CONFIG[urgency];
                    const UrgencyIcon = config.icon;

                    // Percentage of time elapsed
                    const pctRemaining = (incidentDate && days && daysRemaining !== null)
                      ? Math.max(0, daysRemaining) / days
                      : 1;

                    return (
                      <Card key={index} className={cn('border-l-4 transition-all hover:shadow-md', config.color)}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-3">
                            {incidentDate && days ? (
                              <CountdownRing pctRemaining={pctRemaining} urgencyColor={config.ringColor} />
                            ) : (
                              <div className="flex-shrink-0 mt-0.5">
                                <UrgencyIcon className={cn('h-5 w-5', config.iconColor)} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-relaxed">{deadline}</p>
                              {incidentDate && days && deadlineDate && (
                                <div className="mt-2 flex items-center gap-3 flex-wrap">
                                  <Badge className={cn('text-xs', config.badge)}>
                                    {urgency === 'expired' ? 'Expired' : `${daysRemaining} days left`}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Deadline: {format(deadlineDate, 'MMMM d, yyyy')}
                                  </span>
                                  {(urgency === 'urgent' || urgency === 'expired') && (
                                    <span className="text-xs text-destructive font-medium">
                                      ⚠ {urgency === 'expired' ? 'You may have lost this right. Consult an attorney.' : 'Act immediately!'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedState && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-foreground">
                        <Scale className="h-4 w-4 inline mr-2 text-primary" />
                        Your state may have different deadlines.{' '}
                        <Link to={`/state-rights?state=${selectedState}&category=${selectedCategory}`} className="text-primary hover:underline font-medium">
                          See {US_STATES.find(s => s.code === selectedState)?.name} specific statutes →
                        </Link>
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Don't let your deadline pass</h3>
                        <p className="text-sm text-muted-foreground">
                          Our letters reference the exact deadlines above, creating urgency that gets responses.
                        </p>
                      </div>
                      <Button asChild variant="accent" className="gap-2 flex-shrink-0">
                        <Link to={selectedCategory ? `/templates/${selectedCategory}` : '/templates'}>
                          <FileText className="h-4 w-4" />
                          Write Your Letter Now
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Disclaimer:</strong> These deadlines are based on federal statutes and are for informational purposes only. State laws, specific circumstances, and equitable tolling may affect your actual deadline. Always consult a licensed attorney in your jurisdiction for legal advice.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What Happens If I Miss It */}
      <section className="py-12 bg-muted/30 border-t border-b">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">What Happens If I Miss My Deadline?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Gavel,
                  title: 'Federal Claims: Generally Barred',
                  body: 'For federal consumer protection claims, missing the statutory deadline typically bars your rights permanently. Courts do not make exceptions for ignorance of the law. The FCBA 60-day window, for example, is strictly enforced.',
                  severity: 'destructive',
                },
                {
                  icon: Scale,
                  title: 'State Claims: Tolling May Apply',
                  body: '"Tolling" doctrines under state law can pause the clock in limited circumstances: active fraud concealment by the defendant, the discovery rule (you only recently learned of the harm), or your legal incapacity at the time.',
                  severity: 'warning',
                },
                {
                  icon: BookOpen,
                  title: 'When to Consult an Attorney Immediately',
                  body: 'If your deadline is within 30 days or has passed, contact a consumer protection attorney now. Many offer free consultations. Your state bar association can provide referrals.',
                  severity: 'primary',
                },
              ].map((item) => (
                <Card key={item.title} className={cn(
                  'border-t-4',
                  item.severity === 'destructive' ? 'border-t-destructive' :
                  item.severity === 'warning' ? 'border-t-yellow-500' : 'border-t-primary'
                )}>
                  <CardContent className="pt-5">
                    <div className={cn(
                      'inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3',
                      item.severity === 'destructive' ? 'bg-destructive/10' :
                      item.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-950/20' : 'bg-primary/10'
                    )}>
                      <item.icon className={cn(
                        'h-5 w-5',
                        item.severity === 'destructive' ? 'text-destructive' :
                        item.severity === 'warning' ? 'text-yellow-600' : 'text-primary'
                      )} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Common Deadlines at a Glance */}
      <section className="py-12">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Common Deadlines at a Glance</h2>
                <p className="text-sm text-muted-foreground mt-0.5">The 8 most critical federal consumer protection deadlines</p>
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Federal Law</th>
                      <th className="text-left px-4 py-3 font-semibold">Deadline</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">What It Covers</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMMON_DEADLINES.map((row, i) => (
                      <tr key={row.law} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                        <td className="px-4 py-3 font-medium text-foreground text-xs">{row.law}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap">{row.deadline}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{row.description}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Link to={`/templates/${row.category}`} className="text-primary hover:underline text-xs">
                            {CATEGORY_LABELS[row.category]} →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-muted/30 border-t">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2 text-center">Frequently Asked Questions</h2>
            <p className="text-center text-muted-foreground mb-8 text-sm">Real questions from consumers about dispute deadlines</p>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium text-foreground text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10 text-center">
              <p className="text-sm text-muted-foreground mb-4">Ready to act before your deadline expires?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="accent" className="gap-2">
                  <Link to="/templates">
                    <FileText className="h-4 w-4" />
                    Browse Letter Templates
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/state-rights">
                    <Scale className="h-4 w-4" />
                    Check State-Specific Laws
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DeadlinesPage;
