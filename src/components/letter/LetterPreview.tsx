import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LetterTemplate } from '@/data/letterTemplates';

interface LetterPreviewProps {
  template: LetterTemplate;
  formData: Record<string, string>;
  tone: 'neutral' | 'firm' | 'final';
  jurisdiction: string;
  onClose: () => void;
}

const LetterPreview = ({ template, formData, tone, jurisdiction, onClose }: LetterPreviewProps) => {
  const jurisdictionData = template.jurisdictions.find(j => j.code === jurisdiction);

  // Generate preview content with placeholders filled
  const generateSection = (section: typeof template.sections[0]) => {
    let content = section.template;
    section.placeholders.forEach(placeholder => {
      const value = formData[placeholder] || `[${placeholder}]`;
      content = content.replace(`{${placeholder}}`, value);
    });
    return content;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-card rounded-xl shadow-floating">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card">
          <h3 className="font-serif text-lg font-semibold">Letter Preview</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Letter Content */}
        <div className="p-6 md:p-8">
          <div className="bg-background border border-border rounded-lg p-6 md:p-8 font-serif">
            {/* Date */}
            <p className="text-right text-sm text-muted-foreground mb-8">
              {new Date().toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>

            {/* Recipient */}
            <div className="mb-6">
              <p className="font-medium">{formData.companyName || formData.landlordName || '[Recipient Name]'}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {formData.companyAddress || formData.landlordAddress || '[Recipient Address]'}
              </p>
            </div>

            {/* Subject */}
            <p className="font-semibold mb-4">
              Re: {template.title} - {formData.orderNumber || formData.propertyAddress || '[Reference]'}
            </p>

            {/* Salutation */}
            <p className="mb-4">Dear Sir/Madam,</p>

            {/* Preview Content - Partially Blurred */}
            <div className="space-y-4 relative">
              {/* Introduction - Visible */}
              <p className="text-sm leading-relaxed">
                {generateSection(template.sections.find(s => s.id === 'introduction')!)}
              </p>

              {/* Rest - Blurred */}
              <div className="relative">
                <div className="blur-sm select-none space-y-4">
                  {template.sections.slice(1).map((section) => (
                    <p key={section.id} className="text-sm leading-relaxed">
                      {generateSection(section)}
                    </p>
                  ))}
                  
                  {jurisdictionData?.legalReference && (
                    <p className="text-sm leading-relaxed">
                      {jurisdictionData.approvedPhrases[0]}, I expect this matter to be resolved.
                    </p>
                  )}

                  <p className="text-sm">Yours faithfully,</p>
                  <p className="text-sm">[Your Name]</p>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 rounded-lg">
                  <Lock className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-semibold text-foreground mb-1">Full Letter Locked</p>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Purchase to download the complete letter with all sections
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tone Indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Tone:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              tone === 'neutral' ? 'bg-secondary text-secondary-foreground' :
              tone === 'firm' ? 'bg-accent/20 text-accent' :
              'bg-destructive/20 text-destructive'
            }`}>
              {tone.charAt(0).toUpperCase() + tone.slice(1)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-border bg-card">
          <Button variant="accent" className="w-full" onClick={onClose}>
            Continue to Pricing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LetterPreview;
