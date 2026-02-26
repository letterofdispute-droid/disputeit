import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, ArrowRight, FileText, CheckCircle2, 
  AlertTriangle, Info, Loader2, Scale, Shield, BookOpen, Clock, Gavel
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface AnalysisResult {
  overallScore: number;
  level: 'strong' | 'moderate' | 'weak';
  summary: string;
  dimensions: DimensionScore[];
  topSuggestion: string;
  templateCategory?: string;
}

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

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  'Legal Citations': Scale,
  'Specific Deadlines': Clock,
  'Documentation Evidence': FileText,
  'Tone & Professionalism': Sparkles,
  'Clear Demand': Gavel,
};

// Weak vs strong examples by category
const WEAK_STRONG_EXAMPLES: Record<string, { weak: string; strong: string; statute: string }> = {
  financial: {
    weak: '"I am writing to complain about a charge on my account."',
    strong: '"Pursuant to the Fair Credit Billing Act (15 U.S.C. § 1666), I hereby formally dispute the charge of $X appearing on my statement dated [date]. You are required to acknowledge this dispute within 30 days and resolve it within two billing cycles."',
    statute: 'FCBA, 15 U.S.C. § 1666',
  },
  vehicle: {
    weak: '"My car has been in the shop many times and I want a refund."',
    strong: '"Under [State] Lemon Law [Citation] and the Magnuson-Moss Warranty Act (15 U.S.C. § 2310), this vehicle qualifies as a lemon having been subject to [N] repair attempts for the same defect within the warranty period. I demand a full replacement or refund within 10 business days."',
    statute: 'Magnuson-Moss Warranty Act, 15 U.S.C. § 2310',
  },
  housing: {
    weak: '"I want my security deposit back. My landlord is not returning it."',
    strong: '"Pursuant to [State] Residential Landlord-Tenant Act [Citation], you are required to return my security deposit of $X within [N] days of tenancy termination. You have failed to do so. I demand full return within 5 days or I will file a complaint with the [State] AG and pursue treble damages as provided by statute."',
    statute: 'State Residential Tenancy Act',
  },
  refunds: {
    weak: '"I bought a product and want to return it for a refund."',
    strong: '"Pursuant to the FTC Mail Order Rule (16 C.F.R. Part 435) and your stated return policy, I am entitled to a full refund for this purchase. I have made [N] attempts to resolve this. If I do not receive confirmation of a full refund within 10 days, I will file a complaint with the FTC and my state AG."',
    statute: 'FTC Mail Order Rule, 16 C.F.R. § 435',
  },
  ecommerce: {
    weak: '"I never got my order and I want my money back."',
    strong: '"Under the FTC\'s Mail Order Rule (16 C.F.R. Part 435), you were required to ship my order within 30 days or provide an option to cancel. Neither occurred. I am exercising my right to cancel this order and demand a full refund of $X within 10 business days."',
    statute: 'FTC Mail Order Rule, 16 C.F.R. § 435',
  },
  insurance: {
    weak: '"My insurance company denied my claim unfairly and I want to appeal."',
    strong: '"Pursuant to [State] Insurance Code § [N] and the terms of Policy No. [X], this denial is improper. The denial letter failed to cite the specific policy provision relied upon, as required under [State] Ins. Code § [N]. I formally appeal this decision and demand reconsideration within 30 days."',
    statute: 'State Insurance Unfair Claims Settlement Act',
  },
  general: {
    weak: '"I am writing to complain about the product/service I purchased."',
    strong: '"Pursuant to [Applicable Law, Citation], I formally dispute [specific issue]. I have documented evidence of [specific facts]. I demand [specific remedy] within [N] days. Failure to respond will result in a formal complaint with [regulatory body]."',
    statute: 'Applicable consumer protection statute',
  },
};

// Animated SVG score ring component
function ScoreRing({ score, level }: { score: number; level: 'strong' | 'moderate' | 'weak' }) {
  const [animated, setAnimated] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  const r = 52;
  const circumference = 2 * Math.PI * r;
  const color = level === 'strong' ? '#22c55e' : level === 'moderate' ? '#eab308' : '#ef4444';
  const textColor = level === 'strong' ? 'text-green-600' : level === 'moderate' ? 'text-yellow-600' : 'text-destructive';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, [score]);

  const offset = animated ? circumference * (1 - score / 100) : circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(215 25% 88%)" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          ref={ringRef}
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        {/* Score text */}
        <text x="70" y="64" textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>
          {score}
        </text>
        <text x="70" y="83" textAnchor="middle" fontSize="13" fill={color} opacity="0.8">
          / 100
        </text>
      </svg>
      <Badge variant="outline" className={cn('text-sm capitalize px-3 py-1', textColor)}>
        {level} Letter
      </Badge>
    </div>
  );
}

export default function LetterAnalyzerPage() {
  const [letterText, setLetterText] = useState('');
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (letterText.trim().length < 100) {
      toast({ title: 'Letter too short', description: 'Please paste at least 100 characters of your letter.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-letter-strength', {
        body: { letterText, category }
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          setRateLimited(true);
          toast({ title: 'Daily limit reached', description: 'You\'ve used your 3 free analyses for today. Check back tomorrow.', variant: 'destructive' });
        } else {
          toast({ title: 'Analysis failed', description: error.message || 'Please try again.', variant: 'destructive' });
        }
        return;
      }

      if (data?.error) {
        toast({ title: 'Analysis failed', description: data.error, variant: 'destructive' });
        return;
      }

      setResult(data as AnalysisResult);
    } catch (err) {
      toast({ title: 'Something went wrong', description: 'Please try again in a moment.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreBarColor = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.75) return 'bg-green-500';
    if (pct >= 0.5) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const exampleKey = (category in WEAK_STRONG_EXAMPLES) ? category : 'general';
  const example = WEAK_STRONG_EXAMPLES[exampleKey];

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Free Letter Analyzer', url: 'https://letterofdispute.com/analyze-letter' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Free AI Dispute Letter Analyzer | Score Your Letter | Letter of Dispute"
        description="Paste your draft dispute letter and get a free AI score across 5 key dimensions: legal citations, deadlines, evidence, tone, and clarity. No signup required."
        canonicalPath="/analyze-letter"
        breadcrumbs={breadcrumbs}
      />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container-wide py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Free Letter Analyzer</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-14 md:py-18">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-5">
                <Sparkles className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-sm text-primary-foreground/80">Free AI Tool - 3 Analyses Per Day</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4 leading-tight">
                Is Your Dispute Letter Strong Enough?
              </h1>
              <p className="text-lg text-primary-foreground/80 leading-relaxed">
                Paste your draft and get an instant AI score across 5 key dimensions. Know exactly what to improve before you send, for free.
              </p>
            </div>
            {/* Score ring preview */}
            <div className="hidden md:flex flex-col items-center justify-center gap-4">
              <div className="bg-primary-foreground/10 rounded-2xl p-8 flex flex-col items-center gap-3">
                <svg width="120" height="120" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="52" fill="none" stroke="hsl(210 20% 80%)" strokeWidth="10" opacity="0.3" />
                  <circle cx="70" cy="70" r="52" fill="none" stroke="hsl(38 92% 50%)" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${2*Math.PI*52*0.74} ${2*Math.PI*52*0.26}`}
                    transform="rotate(-90 70 70)" />
                  <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill="hsl(38 92% 50%)">74</text>
                  <text x="70" y="83" textAnchor="middle" fontSize="12" fill="hsl(38 92% 50%)" opacity="0.8">/ 100</text>
                </svg>
                <p className="text-primary-foreground/80 text-sm font-medium">Sample score for a "Good" letter</p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Strong ≥ 75</span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">Moderate 50–74</span>
                  <span className="bg-destructive/20 text-red-300 px-2 py-0.5 rounded-full">Weak &lt; 50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analyzer */}
      <section className="py-10">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Input */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Paste Your Letter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Dispute Category <span className="text-muted-foreground">(optional - improves scoring accuracy)</span></label>
                    <Select value={category || 'general'} onValueChange={v => setCategory(v === 'general' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispute type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Dispute Letter</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                          <SelectItem key={id} value={id}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Your Letter Text</label>
                    <Textarea
                      value={letterText}
                      onChange={(e) => setLetterText(e.target.value)}
                      placeholder="Paste your dispute letter here... (minimum 100 characters)"
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{letterText.length} characters</span>
                      <span className={letterText.length < 100 ? 'text-destructive' : 'text-green-600'}>
                        {letterText.length < 100 ? `Need ${100 - letterText.length} more characters` : '✓ Minimum met'}
                      </span>
                    </div>
                  </div>

                  {rateLimited ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      You've used your 3 free analyses for today. Come back tomorrow, or{' '}
                      <Link to="/templates" className="underline font-medium">use a professional template</Link>.
                    </div>
                  ) : (
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || letterText.trim().length < 100}
                      variant="accent"
                      size="lg"
                      className="w-full gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Analyzing your letter...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Analyze My Letter (Free)
                        </>
                      )}
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    <Info className="h-3 w-3 inline mr-1" />
                    3 free analyses per day per device. Your letter text is not stored.
                  </p>
                </CardContent>
              </Card>

              {/* Results */}
              {result && (
                <Card className={cn('border-2', {
                  'border-green-300': result.level === 'strong',
                  'border-yellow-300': result.level === 'moderate',
                  'border-destructive/30': result.level === 'weak',
                })}>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Animated score ring */}
                    <div className="flex justify-center py-2">
                      <ScoreRing score={result.overallScore} level={result.level} />
                    </div>

                    <p className="text-sm text-muted-foreground italic text-center">{result.summary}</p>

                    {/* Dimension scores */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground text-sm">Breakdown by Dimension</h3>
                      {result.dimensions.map((dim) => {
                        const Icon = DIMENSION_ICONS[dim.dimension] || BookOpen;
                        const pct = Math.round((dim.score / dim.maxScore) * 100);
                        return (
                          <div key={dim.dimension} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{dim.dimension}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                                <span className="text-sm font-semibold text-foreground">{dim.score}/{dim.maxScore}</span>
                              </div>
                            </div>
                            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full transition-all duration-700 ease-out rounded-full', getScoreBarColor(dim.score, dim.maxScore))}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{dim.feedback}</p>
                          </div>
                        );
                      })}
                    </div>

                    {result.topSuggestion && (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1">💡 Most impactful improvement:</p>
                        <p className="text-sm text-muted-foreground">{result.topSuggestion}</p>
                      </div>
                    )}

                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium text-foreground mb-2">
                          See a professionally crafted example for{' '}
                          {category && CATEGORY_LABELS[category] ? CATEGORY_LABELS[category] : 'your issue'}:
                        </p>
                        <Button asChild variant="accent" size="sm" className="gap-2">
                          <Link to={category ? `/templates/${category}` : '/templates'}>
                            <FileText className="h-4 w-4" />
                            View Professional Templates
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* What We Analyze */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">What We Analyze</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Legal Citations', icon: Scale, desc: 'Does your letter cite specific laws and statutes?', score: '/20' },
                    { label: 'Specific Deadlines', icon: Clock, desc: 'Do you set a clear response deadline?', score: '/20' },
                    { label: 'Documentation Evidence', icon: FileText, desc: 'Do you reference supporting documents?', score: '/20' },
                    { label: 'Tone & Professionalism', icon: Sparkles, desc: 'Is your tone firm but appropriate?', score: '/20' },
                    { label: 'Clear Demand', icon: Gavel, desc: 'Is your desired outcome explicitly stated?', score: '/20' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <item.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{item.score}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weak vs Strong Example */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Weak vs. Strong Example
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                      <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Weak</span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-destructive/5 rounded-lg p-3 border border-destructive/10 italic leading-relaxed">
                      {example.weak}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Strong</span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-900 italic leading-relaxed">
                      {example.strong}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                    Key law: <span className="font-medium text-foreground">{example.statute}</span>
                  </p>
                  {category && (
                    <p className="text-xs text-muted-foreground">
                      Showing example for: <span className="font-medium">{CATEGORY_LABELS[category] || 'General'}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-foreground mb-2">Want a guaranteed strong letter?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our AI-generated letters are pre-optimized to score 80%+ with real statute citations, clear demands, and professional tone.
                  </p>
                  <Button asChild variant="accent" size="sm" className="w-full gap-2">
                    <Link to="/templates">
                      Browse Templates
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Other Free Tools</h3>
                  <div className="space-y-2">
                    <Link to="/state-rights" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Shield className="h-3.5 w-3.5 text-primary" /> State Rights Lookup
                    </Link>
                    <Link to="/deadlines" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Deadlines Calculator
                    </Link>
                    <Link to="/consumer-news" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowRight className="h-3 w-3" /> Consumer News Hub
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
