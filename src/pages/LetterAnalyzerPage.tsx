import { useState } from 'react';
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
  AlertTriangle, Info, Loader2, BarChart3
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
  'Legal Citations': BarChart3,
  'Specific Deadlines': CheckCircle2,
  'Documentation Evidence': FileText,
  'Tone & Professionalism': Sparkles,
  'Clear Demand': ArrowRight,
};

function ScoreBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full transition-all duration-700 ease-out rounded-full', color)}
        style={{ width: `${pct}%` }}
      />
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

  const getLevelColor = (level: string) => {
    if (level === 'strong') return 'text-green-600';
    if (level === 'moderate') return 'text-yellow-600';
    return 'text-destructive';
  };

  const getScoreBarColor = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.75) return 'bg-green-500';
    if (pct >= 0.5) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const breadcrumbs = [
    { name: 'Home', url: 'https://letterofdispute.com/' },
    { name: 'Free Letter Analyzer', url: 'https://letterofdispute.com/analyze-letter' },
  ];

  return (
    <Layout>
      <SEOHead
        title="Free AI Dispute Letter Analyzer — Score Your Letter | Letter of Dispute"
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
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">Free AI Tool — 3 Analyses Per Day</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Free Dispute Letter Analyzer
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Paste your draft letter and get an instant AI score across 5 key dimensions. Know exactly what to improve before you send.
            </p>
          </div>
        </div>
      </section>

      {/* Analyzer */}
      <section className="py-10">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Input */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Paste Your Letter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Dispute Category <span className="text-muted-foreground">(optional — improves scoring accuracy)</span></label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispute type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">General Dispute Letter</SelectItem>
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-serif text-lg">Analysis Results</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-2xl font-bold', getLevelColor(result.level))}>
                          {result.overallScore}%
                        </span>
                        <Badge variant="outline" className={cn('capitalize', getLevelColor(result.level))}>
                          {result.level}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall bar */}
                    <div>
                      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full transition-all duration-700 ease-out rounded-full', {
                            'bg-green-500': result.level === 'strong',
                            'bg-yellow-500': result.level === 'moderate',
                            'bg-destructive': result.level === 'weak',
                          })}
                          style={{ width: `${result.overallScore}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground italic">{result.summary}</p>

                    {/* Dimension scores */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground text-sm">Breakdown by Dimension</h3>
                      {result.dimensions.map((dim) => {
                        const Icon = DIMENSION_ICONS[dim.dimension] || BarChart3;
                        const pct = Math.round((dim.score / dim.maxScore) * 100);
                        return (
                          <div key={dim.dimension} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{dim.dimension}</span>
                              </div>
                              <span className="text-sm font-semibold text-foreground">{dim.score}/{dim.maxScore}</span>
                            </div>
                            <ScoreBar score={dim.score} maxScore={dim.maxScore} color={getScoreBarColor(dim.score, dim.maxScore)} />
                            <p className="text-xs text-muted-foreground">{dim.feedback}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top suggestion */}
                    {result.topSuggestion && (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1">💡 Most impactful improvement:</p>
                        <p className="text-sm text-muted-foreground">{result.topSuggestion}</p>
                      </div>
                    )}

                    {/* CTA */}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">What We Analyze</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Legal Citations', desc: 'Does your letter cite specific laws and statutes?', score: '/20' },
                    { label: 'Specific Deadlines', desc: 'Do you set a clear response deadline?', score: '/20' },
                    { label: 'Documentation Evidence', desc: 'Do you reference supporting documents?', score: '/20' },
                    { label: 'Tone & Professionalism', desc: 'Is your tone firm but appropriate?', score: '/20' },
                    { label: 'Clear Demand', desc: 'Is your desired outcome explicitly stated?', score: '/20' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{item.score}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

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
                      <ArrowRight className="h-3 w-3" /> State Rights Lookup
                    </Link>
                    <Link to="/deadlines" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowRight className="h-3 w-3" /> Deadlines Calculator
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
