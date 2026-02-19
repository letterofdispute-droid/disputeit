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
import { 
  Clock, AlertTriangle, CheckCircle2, CalendarIcon, 
  ArrowRight, FileText, Info, Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, isPast } from 'date-fns';
import { consumerRightsGuides } from '@/data/consumerRightsContent';
import { US_STATES } from '@/data/stateSpecificLaws';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// Parse deadline strings to extract days
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
  expired: { color: 'border-destructive bg-destructive/5', badge: 'bg-destructive text-destructive-foreground', label: 'Deadline Passed', icon: AlertTriangle, iconColor: 'text-destructive' },
  urgent:  { color: 'border-destructive bg-destructive/5', badge: 'bg-destructive text-destructive-foreground', label: 'Act Immediately', icon: AlertTriangle, iconColor: 'text-destructive' },
  warning: { color: 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10', badge: 'bg-yellow-500 text-white', label: 'Act Soon', icon: Clock, iconColor: 'text-yellow-600' },
  safe:    { color: 'border-green-500 bg-green-50/50 dark:bg-green-950/10', badge: 'bg-green-500 text-white', label: 'Time Remaining', icon: CheckCircle2, iconColor: 'text-green-600' },
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

const DeadlinesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory) params.category = selectedCategory;
    if (selectedState) params.state = selectedState;
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedState]);

  const guide = selectedCategory
    ? consumerRightsGuides.find(g => g.categoryId === selectedCategory)
    : null;

  const deadlines = guide?.importantDeadlines || [];

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Deadlines Calculator', url: 'https://letterofdispute.com/deadlines' },
  ];

  const faqSchema = [
    { question: 'How long do I have to dispute a credit card charge?', answer: 'Under the Fair Credit Billing Act (FCBA), you have 60 days from the date of the billing statement containing the charge to file a written dispute with your card issuer.' },
    { question: 'What is the statute of limitations for consumer protection claims?', answer: 'It varies by state and claim type. Federal claims under the FTC Act typically have a 3-year limitation. State consumer protection statutes range from 1-6 years. Always act as soon as possible.' },
    { question: 'How long does a landlord have to return a security deposit?', answer: 'It varies by state — typically 14 to 60 days after lease termination. California requires 21 days, New York 14 days, Texas 30 days, and Florida 15-60 days depending on deductions.' },
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

      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Clock className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">Free Tool — Real Federal Deadlines</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Dispute Deadlines Calculator
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Find out exactly how long you have to dispute charges, file complaints, or take legal action. Enter the incident date to see a countdown for each deadline.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 bg-card border-b">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20">
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
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All States (Federal)</SelectItem>
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
                    <Badge variant="outline">
                      From {format(incidentDate, 'MMM d, yyyy')}
                    </Badge>
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

                    return (
                      <Card key={index} className={cn('border-l-4 transition-colors', config.color)}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <UrgencyIcon className={cn('h-5 w-5', config.iconColor)} />
                            </div>
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

                {/* Cross-link to state rights */}
                {selectedState && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-foreground">
                        <Scale className="h-4 w-4 inline mr-2 text-primary" />
                        Your state may have different deadlines.{' '}
                        <Link
                          to={`/state-rights?state=${selectedState}&category=${selectedCategory}`}
                          className="text-primary hover:underline font-medium"
                        >
                          See {US_STATES.find(s => s.code === selectedState)?.name} specific statutes →
                        </Link>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* CTA */}
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
    </Layout>
  );
};

export default DeadlinesPage;
