import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { smallClaimsData, formatFilingLimit, getSmallClaimsStateByCode } from '@/data/smallClaimsData';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Copy, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const disputeTypes = [
  { value: 'unpaid-debt', label: 'Unpaid Debt / Money Owed' },
  { value: 'property-damage', label: 'Property Damage' },
  { value: 'contract-breach', label: 'Breach of Contract' },
  { value: 'security-deposit', label: 'Security Deposit Dispute' },
  { value: 'defective-goods', label: 'Defective Product / Goods' },
  { value: 'services-not-rendered', label: 'Services Not Rendered' },
  { value: 'auto-repair', label: 'Auto Repair Dispute' },
  { value: 'landlord-tenant', label: 'Landlord-Tenant Dispute' },
];

const SmallClaimsGeneratorPage = () => {
  const { toast } = useToast();
  const [stateCode, setStateCode] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [disputeType, setDisputeType] = useState('');
  const [description, setDescription] = useState('');
  const [remedy, setRemedy] = useState('');
  const [defendantName, setDefendantName] = useState('');
  const [plaintiffName, setPlaintiffName] = useState('');
  const [generatedStatement, setGeneratedStatement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedState = stateCode ? getSmallClaimsStateByCode(stateCode) : null;
  const amountNum = parseInt(claimAmount) || 0;
  const overLimit = selectedState && amountNum > selectedState.filingLimit;

  const canSubmit = stateCode && claimAmount && disputeType && description.trim().length > 20 && defendantName.trim() && plaintiffName.trim() && !overLimit;

  const handleGenerate = async () => {
    if (!canSubmit || !selectedState) return;
    setIsGenerating(true);
    setGeneratedStatement('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-small-claims-statement', {
        body: {
          stateCode,
          stateName: selectedState.name,
          courtName: selectedState.courtName,
          claimAmount: amountNum,
          disputeType,
          description: description.trim(),
          remedy: remedy.trim() || `Payment of ${formatFilingLimit(amountNum)} plus court costs and filing fees.`,
          defendantName: defendantName.trim(),
          plaintiffName: plaintiffName.trim(),
        },
      });

      if (error) throw error;
      setGeneratedStatement(data.statement);
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedStatement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const siteUrl = 'https://letterofdispute.com';

  return (
    <Layout>
      <SEOHead
        title="Free Small Claims Statement Generator — Create Your Court Filing"
        description="Generate a professional small claims court statement of claim for free. State-specific court headers, legal citations, and proper formatting."
        canonicalPath="/small-claims/statement-generator"
        breadcrumbs={[
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Small Claims Court', url: `${siteUrl}/small-claims` },
          { name: 'Statement Generator', url: `${siteUrl}/small-claims/statement-generator` },
        ]}
      />

      <section className="bg-[var(--gradient-hero)] text-primary-foreground py-14">
        <div className="container-wide text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-3">
            Small Claims Statement Generator
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Create a professional statement of claim for your small claims case — free, with state-specific formatting and legal references.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide max-w-3xl mx-auto">
          <Card className="border-2 border-border">
            <CardContent className="p-8 space-y-6">
              {/* State & Amount Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="state" className="font-semibold">Your State *</Label>
                  <Select onValueChange={setStateCode}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select state..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {smallClaimsData.map(s => (
                        <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedState && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedState.courtName} — Limit: {formatFilingLimit(selectedState.filingLimit)}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount" className="font-semibold">Claim Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g. 3500"
                    value={claimAmount}
                    onChange={e => setClaimAmount(e.target.value)}
                    className="mt-1.5"
                  />
                  {overLimit && (
                    <p className="text-xs text-destructive mt-1">
                      Exceeds {selectedState?.name}'s {formatFilingLimit(selectedState!.filingLimit)} limit
                    </p>
                  )}
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="font-semibold">Your Name (Plaintiff) *</Label>
                  <Input
                    placeholder="John Smith"
                    value={plaintiffName}
                    onChange={e => setPlaintiffName(e.target.value)}
                    className="mt-1.5"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="font-semibold">Defendant's Name *</Label>
                  <Input
                    placeholder="Jane Doe or ABC Company LLC"
                    value={defendantName}
                    onChange={e => setDefendantName(e.target.value)}
                    className="mt-1.5"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Dispute Type */}
              <div>
                <Label className="font-semibold">Nature of Dispute *</Label>
                <Select onValueChange={setDisputeType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select dispute type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeTypes.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label className="font-semibold">What Happened? *</Label>
                <Textarea
                  placeholder="Describe the facts of your dispute clearly and chronologically. Include dates, amounts, and what the other party did or failed to do..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="mt-1.5 min-h-[140px]"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">{description.length}/2000 characters</p>
              </div>

              {/* Remedy */}
              <div>
                <Label className="font-semibold">What Do You Want? (Remedy)</Label>
                <Textarea
                  placeholder="e.g. Payment of $3,500 for breach of contract plus filing fees and court costs"
                  value={remedy}
                  onChange={e => setRemedy(e.target.value)}
                  className="mt-1.5 min-h-[80px]"
                  maxLength={500}
                />
              </div>

              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={!canSubmit || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Statement...</>
                ) : (
                  <><FileText className="mr-2 h-5 w-5" /> Generate Statement of Claim</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Output */}
          {generatedStatement && (
            <Card className="mt-8 border-2 border-primary/20 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold font-serif text-foreground">Your Statement of Claim</h2>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <><CheckCircle className="mr-1 h-4 w-4" /> Copied</> : <><Copy className="mr-1 h-4 w-4" /> Copy</>}
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed border border-border">
                  {generatedStatement}
                </div>
                <div className="mt-6 bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Next step:</strong> Print this statement, review it carefully, and attach it to your court filing forms. 
                    You may also want to <Link to="/templates" className="text-primary hover:underline font-medium">send a demand letter first</Link> — courts look favorably on good-faith attempts to resolve disputes.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="mt-8 bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">
              <strong>Disclaimer:</strong> This tool generates a draft statement for informational purposes only. 
              It is not legal advice. Review your statement carefully and verify all facts before filing. 
              Consult a licensed attorney for complex legal matters.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SmallClaimsGeneratorPage;
