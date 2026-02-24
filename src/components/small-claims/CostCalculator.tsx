import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { smallClaimsData, type SmallClaimsStateData } from '@/data/smallClaimsData';
import { Link } from 'react-router-dom';
import {
  Calculator, DollarSign, Clock, Scale, AlertTriangle,
  CheckCircle, XCircle, ExternalLink, FileText, ArrowRight,
  Info, TrendingUp, Gavel, Shield
} from 'lucide-react';

const disputeTypes = [
  { value: 'writtenContract', label: 'Breach of Written Contract', solField: 'writtenContract' as const },
  { value: 'oralContract', label: 'Breach of Verbal/Oral Agreement', solField: 'oralContract' as const },
  { value: 'propertyDamage', label: 'Property Damage', solField: 'propertyDamage' as const },
  { value: 'personalInjury', label: 'Personal Injury', solField: 'personalInjury' as const },
  { value: 'securityDeposit', label: 'Security Deposit Dispute', solField: 'writtenContract' as const },
  { value: 'defectiveProduct', label: 'Defective Product', solField: 'propertyDamage' as const },
  { value: 'unpaidDebt', label: 'Unpaid Debt / Money Owed', solField: 'writtenContract' as const },
  { value: 'autoRepair', label: 'Auto Repair Dispute', solField: 'oralContract' as const },
  { value: 'contractor', label: 'Contractor / Home Improvement', solField: 'writtenContract' as const },
  { value: 'other', label: 'Other Dispute', solField: 'propertyDamage' as const },
];

function parseFeeRange(fee: string): { min: number; max: number } {
  const nums = fee.match(/\d+/g);
  if (!nums || nums.length === 0) return { min: 50, max: 100 };
  if (nums.length === 1) return { min: parseInt(nums[0]), max: parseInt(nums[0]) };
  return { min: parseInt(nums[0]), max: parseInt(nums[1]) };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

const CostCalculator = () => {
  const [selectedState, setSelectedState] = useState<string>('');
  const [disputeType, setDisputeType] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  const stateData = smallClaimsData.find(s => s.code === selectedState);
  const dispute = disputeTypes.find(d => d.value === disputeType);
  const amount = parseFloat(claimAmount.replace(/[^0-9.]/g, '')) || 0;

  const canCalculate = selectedState && disputeType && amount > 0;

  const handleCalculate = () => {
    if (canCalculate) setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setSelectedState('');
    setDisputeType('');
    setClaimAmount('');
  };

  const renderResults = () => {
    if (!stateData || !dispute) return null;

    const fees = parseFeeRange(stateData.filingFee);
    const serviceMin = 20;
    const serviceMax = 75;
    const totalMin = fees.min + serviceMin;
    const totalMax = fees.max + serviceMax;
    const isEligible = amount <= stateData.filingLimit;
    const roiMin = (totalMin / amount) * 100;
    const roiMax = (totalMax / amount) * 100;
    const sol = stateData.statuteOfLimitations[dispute.solField];

    return (
      <div className="mt-8 space-y-6 animate-fade-up">
        {/* Eligibility Banner */}
        {isEligible ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Your claim is eligible for small claims court in {stateData.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your claim of {formatCurrency(amount)} is within the {formatCurrency(stateData.filingLimit)} filing limit.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Your claim exceeds {stateData.name}'s small claims limit</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stateData.name}'s limit is {formatCurrency(stateData.filingLimit)}, but your claim is {formatCurrency(amount)}.
                You can either reduce your claim to {formatCurrency(stateData.filingLimit)} (waiving the difference) or file in regular civil court.
              </p>
            </div>
          </div>
        )}

        {/* Cost Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Filing Fee</p>
              <p className="text-lg font-bold text-foreground mt-1">{stateData.filingFee}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <FileText className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Service of Process</p>
              <p className="text-lg font-bold text-foreground mt-1">$20–$75</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Calculator className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Est. Cost</p>
              <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(totalMin)}–{formatCurrency(totalMax)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Time to Hearing</p>
              <p className="text-lg font-bold text-foreground mt-1">{stateData.hearingTimeframe}</p>
            </CardContent>
          </Card>
        </div>

        {/* Court Details Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              Court Details: {stateData.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Court Name</p>
                <p className="text-sm font-medium text-foreground">{stateData.courtName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Filing Limit</p>
                <p className="text-sm font-medium text-foreground">{formatCurrency(stateData.filingLimit)}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Lawyers Allowed</p>
                {stateData.lawyerAllowed ? (
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Appeals Allowed</p>
                {stateData.appealAllowed ? (
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </Badge>
                )}
              </div>
            </div>

            {/* Statute of Limitations */}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Statute of Limitations for Your Dispute Type</p>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{sol} year{sol !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted-foreground">
                    for {dispute.label.toLowerCase()} claims in {stateData.name}
                  </p>
                </div>
              </div>
            </div>

            {/* State-specific Notes */}
            {stateData.specialNotes.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Important Notes for {stateData.name}</p>
                <ul className="space-y-2">
                  {stateData.specialNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROI Analysis */}
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Return on Investment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your estimated costs of {formatCurrency(totalMin)}–{formatCurrency(totalMax)} represent just{' '}
                  <strong className="text-foreground">{roiMin.toFixed(1)}%–{roiMax.toFixed(1)}%</strong> of your {formatCurrency(amount)} claim.
                  {roiMax < 5 && " That's an excellent return, well worth filing."}
                  {roiMax >= 5 && roiMax < 15 && " That's a reasonable cost for pursuing your claim."}
                  {roiMax >= 15 && " Consider whether the cost justifies pursuing this claim, or try resolving it with a demand letter first."}
                </p>
                {isEligible && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Tip:</strong> If you win, most states allow you to recover your filing fees as part of the judgment.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button variant="default" asChild>
            <Link to={`/small-claims/${stateData.slug}`}>
              <Scale className="mr-2 h-4 w-4" /> View {stateData.name} Filing Guide
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/templates">
              <Shield className="mr-2 h-4 w-4" /> Send a Demand Letter First
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={stateData.courtWebsite} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Visit Court Website
            </a>
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            Start Over
          </Button>
        </div>
      </div>
    );
  };

  return (
    <section id="cost-calculator" className="py-16">
      <div className="container-wide">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">
              <Calculator className="h-3.5 w-3.5 mr-1" /> Interactive Tool
            </Badge>
            <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
              Small Claims Court Cost Calculator
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enter your state, dispute type, and claim amount to get a personalized cost estimate, including filing fees, service costs, and whether your claim is eligible.
            </p>
          </div>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              {/* State Select */}
              <div className="space-y-2">
                <Label htmlFor="state-select">Your State</Label>
                <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setShowResults(false); }}>
                  <SelectTrigger id="state-select">
                    <SelectValue placeholder="Select your state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {smallClaimsData.map(s => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dispute Type */}
              <div className="space-y-2">
                <Label htmlFor="dispute-select">Type of Dispute</Label>
                <Select value={disputeType} onValueChange={(v) => { setDisputeType(v); setShowResults(false); }}>
                  <SelectTrigger id="dispute-select">
                    <SelectValue placeholder="What is your dispute about?" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeTypes.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Claim Amount */}
              <div className="space-y-2">
                <Label htmlFor="claim-amount">Claim Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="claim-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 3,500"
                    className="pl-9"
                    value={claimAmount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      setClaimAmount(raw);
                      setShowResults(false);
                    }}
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={!canCalculate}
                onClick={handleCalculate}
              >
                <Calculator className="mr-2 h-5 w-5" /> Calculate My Costs
              </Button>
            </CardContent>
          </Card>

          {showResults && renderResults()}
        </div>
      </div>
    </section>
  );
};

export default CostCalculator;
