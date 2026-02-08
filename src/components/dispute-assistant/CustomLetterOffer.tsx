import { Scale, ArrowRight, FileText, Shield, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomLetterOfferProps {
  reason: string;
  suggestedApproach: string;
  onStartCustomLetter: () => void;
}

const CustomLetterOffer = ({ reason, suggestedApproach, onStartCustomLetter }: CustomLetterOfferProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">Legal Correspondence Expert</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your situation requires a custom approach. Our specialized AI can draft a tailored letter for you.
        </p>
      </div>

      {/* Reason */}
      <div className="bg-muted/50 p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Why custom:</span> {reason}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">Approach:</span> {suggestedApproach}
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3 text-primary" />
          <span>Federal & State Law Expertise</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3 w-3 text-primary" />
          <span>Formal Legal Formatting</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3 text-primary" />
          <span>Statutory Citations</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Scale className="h-3 w-3 text-primary" />
          <span>Not a Generic Chatbot</span>
        </div>
      </div>

      {/* CTA */}
      <Button 
        onClick={onStartCustomLetter}
        className="w-full bg-primary hover:bg-primary/90"
      >
        Start Custom Letter
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Our Legal Correspondence Expert will gather details and draft a professional letter with proper legal citations.
      </p>
    </div>
  );
};

export default CustomLetterOffer;
