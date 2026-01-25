import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LetterTemplate, TemplateField } from '@/data/letterTemplates';
import { generateFullLetter } from '@/lib/letterGeneration';
import LetterPreview from './LetterPreview';
import PricingModal from './PricingModal';

interface LetterGeneratorProps {
  template: LetterTemplate;
}

const LetterGenerator = ({ template }: LetterGeneratorProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTone, setSelectedTone] = useState<'neutral' | 'firm' | 'final'>('neutral');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(template.jurisdictions[0].code);
  const [showPreview, setShowPreview] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const totalSteps = 3;

  // Generate letter content for checkout
  const generatedLetterContent = useMemo(() => {
    const result = generateFullLetter(template, formData, selectedJurisdiction, selectedTone);
    return result.fullContent;
  }, [template, formData, selectedJurisdiction, selectedTone]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[100px]"
          />
        );
      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => handleInputChange(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            id={field.id}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const requiredFields = template.fields.filter(f => f.required);
  const optionalFields = template.fields.filter(f => !f.required);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Step {step} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">
            {step === 1 ? 'Basic Information' : step === 2 ? 'Customize' : 'Review & Generate'}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6 md:p-8">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Tell us about your situation
              </h3>
              <p className="text-sm text-muted-foreground">
                Fill in the required information below. This will be used to generate your letter.
              </p>
            </div>

            <div className="space-y-4">
              {requiredFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  {renderField(field)}
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            {optionalFields.length > 0 && (
              <>
                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">
                    Optional Information
                  </h4>
                  <div className="space-y-4">
                    {optionalFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        {renderField(field)}
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Customize */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Customize Your Letter
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose the tone and jurisdiction for your letter.
              </p>
            </div>

            {/* Tone Selection */}
            <div className="space-y-3">
              <Label>Letter Tone</Label>
              <RadioGroup value={selectedTone} onValueChange={(v) => setSelectedTone(v as typeof selectedTone)}>
                <div className="grid gap-3">
                  {template.tones.includes('neutral') && (
                    <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <RadioGroupItem value="neutral" className="mt-0.5" />
                      <div>
                        <div className="font-medium">Neutral</div>
                        <p className="text-sm text-muted-foreground">Professional and factual. Good for initial contact.</p>
                      </div>
                    </label>
                  )}
                  {template.tones.includes('firm') && (
                    <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <RadioGroupItem value="firm" className="mt-0.5" />
                      <div>
                        <div className="font-medium">Firm</div>
                        <p className="text-sm text-muted-foreground">Assertive but polite. Good for follow-ups.</p>
                      </div>
                    </label>
                  )}
                  {template.tones.includes('final') && (
                    <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <RadioGroupItem value="final" className="mt-0.5" />
                      <div>
                        <div className="font-medium">Final Notice</div>
                        <p className="text-sm text-muted-foreground">Strong language for unresolved issues.</p>
                      </div>
                    </label>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Jurisdiction Selection */}
            <div className="space-y-3">
              <Label>Your Location</Label>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {template.jurisdictions.map((j) => (
                    <SelectItem key={j.code} value={j.code}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This helps us include appropriate legal references (available in paid tiers).
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Review & Generate
              </h3>
              <p className="text-sm text-muted-foreground">
                Preview your letter before generating the final version.
              </p>
            </div>

            {/* Preview Card */}
            <div 
              className="relative border border-border rounded-lg p-6 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors"
              onClick={() => setShowPreview(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-foreground">Letter Preview</h4>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Preview
                </Button>
              </div>
              
              {/* Blurred preview */}
              <div className="relative">
                <div className="text-sm text-muted-foreground space-y-2 blur-sm select-none">
                  <p>Dear {formData.companyName || formData.landlordName || '[Recipient]'},</p>
                  <p>I am writing to formally...</p>
                  <p>The issue occurred on...</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded">
                  <div className="text-center">
                    <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Full letter unlocked after purchase</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Letter Type</span>
                  <span className="text-foreground">{template.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tone</span>
                  <span className="text-foreground capitalize">{selectedTone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jurisdiction</span>
                  <span className="text-foreground">
                    {template.jurisdictions.find(j => j.code === selectedJurisdiction)?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button variant="accent" onClick={() => setStep(step + 1)}>
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="hero" onClick={() => setShowPricing(true)}>
              Generate Letter
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* Modals */}
      {showPreview && (
        <LetterPreview
          template={template}
          formData={formData}
          tone={selectedTone}
          jurisdiction={selectedJurisdiction}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showPricing && (
        <PricingModal
          templateSlug={template.slug}
          templateName={template.title}
          letterContent={generatedLetterContent}
          onClose={() => setShowPricing(false)}
        />
      )}
    </div>
  );
};

export default LetterGenerator;
