import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  DollarSign, Clock, CheckCircle, XCircle, FileText,
  ArrowRight, TrendingDown, Scale, Zap, Users, BookOpen,
  Sparkles, PenTool, Briefcase
} from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

interface ComparisonRow {
  label: string;
  diy: { text: string; good: boolean };
  lawyer: { text: string; good: boolean };
  ours: { text: string; good: boolean };
}

const comparisonRows: ComparisonRow[] = [
  {
    label: 'Cost',
    diy: { text: 'Free (your time)', good: true },
    lawyer: { text: '$300–$1,500', good: false },
    ours: { text: 'From $9.99', good: true },
  },
  {
    label: 'Time to Complete',
    diy: { text: '2–4 hours', good: false },
    lawyer: { text: '1–2 weeks', good: false },
    ours: { text: 'Under 5 minutes', good: true },
  },
  {
    label: 'Legal Citations',
    diy: { text: 'None', good: false },
    lawyer: { text: 'Yes, state-specific', good: true },
    ours: { text: 'Yes, auto-selected', good: true },
  },
  {
    label: 'Professional Formatting',
    diy: { text: 'DIY', good: false },
    lawyer: { text: 'Yes', good: true },
    ours: { text: 'Yes', good: true },
  },
  {
    label: 'State-Specific Language',
    diy: { text: 'Manual research', good: false },
    lawyer: { text: 'Yes', good: true },
    ours: { text: 'Yes, automatic', good: true },
  },
  {
    label: 'Customizable',
    diy: { text: 'Full control', good: true },
    lawyer: { text: 'Attorney handles', good: false },
    ours: { text: 'Guided wizard + editing', good: true },
  },
  {
    label: 'Court-Ready',
    diy: { text: 'Unlikely', good: false },
    lawyer: { text: 'Yes', good: true },
    ours: { text: 'Yes, PDF + DOCX export', good: true },
  },
];

const DemandLetterCostCalculator = () => {
  const [claimAmount, setClaimAmount] = useState<string>('');
  const amount = parseFloat(claimAmount.replace(/[^0-9.]/g, '')) || 0;

  const lawyerCostMin = 300;
  const lawyerCostMax = 1500;
  const ourCost = 9.99;

  const savingsMin = lawyerCostMin - ourCost;
  const savingsMax = lawyerCostMax - ourCost;
  const lawyerPctMin = amount > 0 ? (lawyerCostMin / amount) * 100 : 0;
  const lawyerPctMax = amount > 0 ? (lawyerCostMax / amount) * 100 : 0;
  const ourPct = amount > 0 ? (ourCost / amount) * 100 : 0;

  return (
    <section id="demand-letter-cost" className="py-16 bg-secondary/30">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">
              <Scale className="h-3.5 w-3.5 mr-1" /> Cost Comparison
            </Badge>
            <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
              Demand Letter: DIY vs. Lawyer vs. Letter of Dispute
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Before filing in small claims court, you should send a demand letter. Here's how your options compare.
            </p>
          </div>

          {/* Three Column Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* DIY */}
            <Card className="border-border relative">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <PenTool className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground">Write It Yourself</h3>
                  <p className="text-2xl font-bold text-foreground mt-2">Free</p>
                  <p className="text-xs text-muted-foreground">(your time only)</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">2–4 hours research + writing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">No legal citations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Often ignored by recipients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">May miss key legal language</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Lawyer */}
            <Card className="border-border relative">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground">Hire a Lawyer</h3>
                  <p className="text-2xl font-bold text-foreground mt-2">$300–$1,500</p>
                  <p className="text-xs text-muted-foreground">($150–$500/hr typical)</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">1–2 weeks for draft</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">State-specific citations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Professional authority</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Often costs more than the claim</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Ours */}
            <Card className="border-accent/40 bg-accent/5 relative ring-2 ring-accent/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground shadow-sm">
                  <Sparkles className="h-3 w-3 mr-1" /> Best Value
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground">Letter of Dispute</h3>
                  <p className="text-2xl font-bold text-accent mt-2">From $9.99</p>
                  <p className="text-xs text-muted-foreground">one-time, no subscription</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Ready in under 5 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Real statute citations, auto-selected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Professional formatting + PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Fully editable with guided wizard</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table (desktop) */}
          <div className="hidden md:block mb-8">
            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-semibold text-foreground">Feature</th>
                      <th className="text-center p-3 font-semibold text-foreground">DIY</th>
                      <th className="text-center p-3 font-semibold text-foreground">Lawyer</th>
                      <th className="text-center p-3 font-semibold text-accent">Letter of Dispute</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                        <td className="p-3 font-medium text-foreground">{row.label}</td>
                        <td className="p-3 text-center">
                          <span className={row.diy.good ? 'text-foreground' : 'text-muted-foreground'}>
                            {row.diy.text}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={row.lawyer.good ? 'text-foreground' : 'text-muted-foreground'}>
                            {row.lawyer.text}
                          </span>
                        </td>
                        <td className="p-3 text-center font-medium text-accent">
                          {row.ours.text}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Dynamic Savings Calculator */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-accent" />
                Calculate Your Savings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="savings-amount">Enter Your Claim Amount</Label>
                  <div className="relative max-w-xs">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="savings-amount"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 5,000"
                      className="pl-9"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                  </div>
                </div>

                {amount > 0 && (
                  <div className="space-y-4 animate-fade-up">
                    {/* Visual bars */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Lawyer Cost</span>
                          <span className="font-medium text-foreground">{formatCurrency(lawyerCostMin)}–{formatCurrency(lawyerCostMax)}</span>
                        </div>
                        <div className="h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400/70 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.min((lawyerCostMax / amount) * 100, 100)}%`, minWidth: '60px' }}
                          >
                            <span className="text-xs font-bold text-white">{lawyerPctMax.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Letter of Dispute</span>
                          <span className="font-medium text-accent">{formatCurrency(ourCost)}</span>
                        </div>
                        <div className="h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max((ourCost / amount) * 100, 3)}%`, minWidth: '60px' }}
                          >
                            <span className="text-xs font-bold text-accent-foreground">{ourPct.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Your Claim Value</span>
                          <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-6 bg-primary/20 rounded-full">
                          <div className="h-full bg-primary rounded-full w-full" />
                        </div>
                      </div>
                    </div>

                    {/* Savings Summary */}
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-center">
                      <p className="text-lg font-bold text-foreground">
                        Save up to <span className="text-accent">{formatCurrency(savingsMax)}</span> by using Letter of Dispute
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        A lawyer would cost {lawyerPctMin.toFixed(1)}%–{lawyerPctMax.toFixed(1)}% of your claim.
                        We cost just {ourPct.toFixed(2)}%.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border text-center">
                <Button variant="default" size="lg" asChild>
                  <Link to="/templates">
                    <FileText className="mr-2 h-5 w-5" /> Browse Demand Letter Templates
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DemandLetterCostCalculator;
