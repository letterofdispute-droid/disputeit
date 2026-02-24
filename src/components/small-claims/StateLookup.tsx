import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Clock, Scale, ExternalLink, ArrowRight } from 'lucide-react';
import { smallClaimsData, formatFilingLimit, type SmallClaimsStateData } from '@/data/smallClaimsData';

const StateLookup = () => {
  const [selectedState, setSelectedState] = useState<SmallClaimsStateData | null>(null);

  const handleStateChange = (slug: string) => {
    const state = smallClaimsData.find(s => s.slug === slug);
    setSelectedState(state || null);
  };

  return (
    <section id="state-lookup" className="py-16 bg-secondary/30">
      <div className="container-wide">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
            Find Your State's Small Claims Rules
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your state to instantly see filing limits, fees, court names, and statute of limitations.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Select onValueChange={handleStateChange}>
            <SelectTrigger className="w-full h-14 text-base bg-card border-2 border-primary/20 focus:border-primary">
              <SelectValue placeholder="Select your state..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {smallClaimsData.map(state => (
                <SelectItem key={state.code} value={state.slug}>
                  {state.name} ({state.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedState && (
            <Card className="mt-8 border-2 border-primary/10 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold font-serif text-foreground">
                    {selectedState.name} Small Claims Court
                  </h3>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {selectedState.code}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Maximum Claim Amount</p>
                      <p className="text-xl font-bold text-foreground">{formatFilingLimit(selectedState.filingLimit)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <DollarSign className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Filing Fee</p>
                      <p className="text-xl font-bold text-foreground">{selectedState.filingFee}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Scale className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Court Name</p>
                      <p className="text-base font-semibold text-foreground">{selectedState.courtName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Typical Hearing Timeframe</p>
                      <p className="text-base font-semibold text-foreground">{selectedState.hearingTimeframe}</p>
                    </div>
                  </div>
                </div>

                {/* Statute of Limitations */}
                <div className="bg-muted/50 rounded-lg p-5 mb-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Statute of Limitations
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Written Contract</p>
                      <p className="font-bold text-foreground">{selectedState.statuteOfLimitations.writtenContract} years</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Oral Contract</p>
                      <p className="font-bold text-foreground">{selectedState.statuteOfLimitations.oralContract} years</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Property Damage</p>
                      <p className="font-bold text-foreground">{selectedState.statuteOfLimitations.propertyDamage} years</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Personal Injury</p>
                      <p className="font-bold text-foreground">{selectedState.statuteOfLimitations.personalInjury} years</p>
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                {selectedState.specialNotes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-2">Important Rules</h4>
                    <ul className="space-y-1.5">
                      {selectedState.specialNotes.map((note, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span> {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Facts */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge variant={selectedState.lawyerAllowed ? 'default' : 'secondary'}>
                    {selectedState.lawyerAllowed ? '✓ Lawyers Allowed' : '✗ No Lawyers'}
                  </Badge>
                  <Badge variant={selectedState.appealAllowed ? 'default' : 'secondary'}>
                    {selectedState.appealAllowed ? '✓ Appeal Available' : '✗ No Appeal'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to={`/small-claims/${selectedState.slug}`}>
                      Full {selectedState.name} Guide <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={selectedState.courtWebsite} target="_blank" rel="noopener noreferrer">
                      Official Court Website <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/state-rights/${selectedState.slug}`}>
                      <MapPin className="mr-1 h-4 w-4" /> {selectedState.name} Consumer Rights
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default StateLookup;
