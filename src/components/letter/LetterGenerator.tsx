import { useState, useMemo, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, Eye, Lock, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LetterTemplate } from '@/data/letterTemplates';
import { generateFullLetter } from '@/lib/letterGeneration';
import { assessLetterStrength } from '@/lib/fieldValidators';
import LetterPreview from './LetterPreview';
import PricingModal from './PricingModal';
import SmartField from './SmartField';
import LetterStrengthMeter from './LetterStrengthMeter';
import EvidenceChecklist from './EvidenceChecklist';
import EvidenceUploader from './EvidenceUploader';
import HumanCraftedBadge from './HumanCraftedBadge';
import GeneratingOverlay from './GeneratingOverlay';
import { useFormAssistant } from '@/hooks/useFormAssistant';
import { useGenerateLegalLetter } from '@/hooks/useGenerateLegalLetter';
import { useEvidenceUpload } from '@/hooks/useEvidenceUpload';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';
import {
  trackLetterFormStart, 
  trackLetterFormStep, 
  trackLetterPreviewView, 
  trackToneSelected,
  trackJurisdictionSelected,
  trackGenerateLetterClick 
} from '@/hooks/useGTM';

interface LetterGeneratorProps {
  template: LetterTemplate;
}
const LetterGenerator = ({
  template
}: LetterGeneratorProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTone, setSelectedTone] = useState<'neutral' | 'firm' | 'final'>('neutral');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(template.jurisdictions[0].code);
  const [showPreview, setShowPreview] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showGeneratingOverlay, setShowGeneratingOverlay] = useState(false);
  const [showEvidenceChecklist, setShowEvidenceChecklist] = useState(false);
  const [evidenceChecked, setEvidenceChecked] = useState<Record<string, boolean>>({});
  const [uploadedEvidencePaths, setUploadedEvidencePaths] = useState<{ storagePath: string; description: string }[]>([]);
  const formStartedRef = useRef(false);
  const {
    suggestions,
    isLoading,
    requestSuggestionDebounced
  } = useFormAssistant();
  const { generateLetter, isGenerating, generatedContent } = useGenerateLegalLetter();
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string | null>(null);
  const evidenceUpload = useEvidenceUpload();
  const { user } = useAuth();
  const { trackFormStarted, trackFormCompleted } = useAnalytics();
  const totalSteps = 3;

  // Generate fallback letter content (for preview only)
  const fallbackLetterContent = useMemo(() => {
    const result = generateFullLetter(template, formData, selectedJurisdiction, selectedTone);
    return result.fullContent;
  }, [template, formData, selectedJurisdiction, selectedTone]);

  // Use AI-generated content if available, otherwise fallback
  const generatedLetterContent = aiGeneratedContent || fallbackLetterContent;

  // Calculate letter strength - correct parameter order: (fieldValues, fields)
  const letterStrength = useMemo(() => {
    return assessLetterStrength(formData, template.fields);
  }, [formData, template.fields]);

  const handleInputChange = useCallback((fieldId: string, value: string) => {
    // Track form start on first interaction
    if (!formStartedRef.current && value.length > 0) {
      formStartedRef.current = true;
      trackLetterFormStart(template.slug);
      trackFormStarted(template.slug);
    }
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, [template.slug]);

  // Handle AI suggestion request
  const handleRequestAiSuggestion = useCallback((fieldId: string, fieldValue: string) => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field) return;
    requestSuggestionDebounced({
      fieldId,
      fieldLabel: field.label,
      fieldValue,
      category: template.category,
      templateTitle: template.title,
      allFieldValues: formData
    });
  }, [template.fields, template.category, template.title, formData, requestSuggestionDebounced]);

  // Handle evidence checklist toggle
  const handleEvidenceToggle = useCallback((item: string) => {
    setEvidenceChecked(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  }, []);
  const requiredFields = template.fields.filter(f => f.required);
  const optionalFields = template.fields.filter(f => !f.required);

  // Check if any field has AI enhancement
  const hasAiEnhancedFields = template.fields.some(f => f.aiEnhanced);
  return <div className="max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Step {step} of {totalSteps}</span>
          <div className="flex items-center gap-3">
            {hasAiEnhancedFields && <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                AI-Enhanced
              </Badge>}
            <span className="text-sm text-muted-foreground">
              {step === 1 ? 'Basic Information' : step === 2 ? 'Customize' : 'Review & Generate'}
            </span>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300" style={{
          width: `${step / totalSteps * 100}%`
        }} />
        </div>
        
        {/* Human-Crafted Trust Badge */}
        <div className="mt-4">
          <HumanCraftedBadge />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8">
            {/* Step 1: Basic Information */}
            {step === 1 && <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Tell us about your situation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fill in the required information below. This will be used to generate your letter.
                  </p>
                </div>

                <div className="space-y-5">
                  {requiredFields.map(field => <SmartField key={field.id} field={field} value={formData[field.id] || ''} onChange={value => handleInputChange(field.id, value)} aiSuggestion={suggestions[field.id]} isValidating={isLoading[field.id]} onRequestAiSuggestion={handleRequestAiSuggestion} />)}
                </div>

                {optionalFields.length > 0 && <div className="border-t border-border pt-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      Optional Information (strengthens your case)
                    </h4>
                    <div className="space-y-5">
                      {optionalFields.map(field => <SmartField key={field.id} field={field} value={formData[field.id] || ''} onChange={value => handleInputChange(field.id, value)} aiSuggestion={suggestions[field.id]} isValidating={isLoading[field.id]} onRequestAiSuggestion={handleRequestAiSuggestion} />)}
                    </div>
                  </div>}
              </div>}

            {/* Step 2: Customize */}
            {step === 2 && <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Customize Your Letter
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the tone and jurisdiction for your letter.
                  </p>
                </div>

                {/* Letter Strength Summary */}
                <LetterStrengthMeter strength={letterStrength} showDetails={true} />

                {/* Tone Selection */}
                <div className="space-y-3">
                  <Label>Letter Tone</Label>
                  <RadioGroup value={selectedTone} onValueChange={v => {
                    setSelectedTone(v as typeof selectedTone);
                    trackToneSelected(template.slug, v);
                  }}>
                    <div className="grid gap-3">
                      {template.tones.includes('neutral') && <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                          <RadioGroupItem value="neutral" className="mt-0.5" />
                          <div>
                            <div className="font-medium">Neutral</div>
                            <p className="text-sm text-muted-foreground">Professional and factual. Good for initial contact.</p>
                          </div>
                        </label>}
                      {template.tones.includes('firm') && <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                          <RadioGroupItem value="firm" className="mt-0.5" />
                          <div>
                            <div className="font-medium">Firm</div>
                            <p className="text-sm text-muted-foreground">Assertive but polite. Good for follow-ups.</p>
                          </div>
                        </label>}
                      {template.tones.includes('final') && <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                          <RadioGroupItem value="final" className="mt-0.5" />
                          <div>
                            <div className="font-medium">Final Notice</div>
                            <p className="text-sm text-muted-foreground">Strong language for unresolved issues.</p>
                          </div>
                        </label>}
                    </div>
                  </RadioGroup>
                </div>

                {/* Jurisdiction Selection */}
                <div className="space-y-3">
                  <Label>Your Location</Label>
                  <Select value={selectedJurisdiction} onValueChange={(v) => {
                    setSelectedJurisdiction(v);
                    trackJurisdictionSelected(template.slug, v);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {template.jurisdictions.map(j => <SelectItem key={j.code} value={j.code}>
                          {j.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This helps us include appropriate legal references (available in paid tiers).
                  </p>
                </div>
              </div>}

            {/* Step 3: Review */}
            {step === 3 && <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Review & Generate
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preview your letter before generating the final version.
                  </p>
                </div>

                {/* Strength Meter Summary */}
                <LetterStrengthMeter strength={letterStrength} showDetails={false} />

                {/* Preview Card */}
                <div className="relative border border-border rounded-lg p-6 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => {
                  trackLetterPreviewView(template.slug);
                  setShowPreview(true);
                }}>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Letter Strength</span>
                      <span className={letterStrength.level === 'strong' ? 'text-green-600' : letterStrength.level === 'moderate' ? 'text-yellow-600' : 'text-red-600'}>
                        {letterStrength.overallScore}% - {letterStrength.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button> : <div />}

              {step < totalSteps ? <Button variant="accent" onClick={() => {
                  trackLetterFormStep(template.slug, step);
                  setStep(step + 1);
                }}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button> : <Button 
                  variant="hero" 
                  disabled={isGenerating || showGeneratingOverlay || evidenceUpload.isUploading}
                  onClick={async () => {
                    trackGenerateLetterClick(template.slug);
                    trackFormCompleted(template.slug);
                    setShowGeneratingOverlay(true);
                    
                    // Upload evidence photos first if user is logged in and has photos
                    // Store paths directly from the returned value to avoid async state issues
                    if (evidenceUpload.hasPhotos && user) {
                      try {
                        const paths = await evidenceUpload.uploadAllPhotos(user.id);
                        setUploadedEvidencePaths(paths);
                      } catch (err) {
                        console.error('Failed to upload evidence photos:', err);
                        toast.error('Failed to upload some evidence photos, but continuing with letter generation');
                      }
                    }
                    
                    // Generate AI-powered legal letter
                    const aiContent = await generateLetter({
                      templateCategory: template.category,
                      templateName: template.title,
                      templateSlug: template.slug,
                      formData,
                      jurisdiction: selectedJurisdiction as 'US' | 'UK' | 'EU' | 'generic',
                      tone: selectedTone,
                    });
                    
                    if (aiContent) {
                      setAiGeneratedContent(aiContent);
                    }
                  }}
                >
                  Generate Letter
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>}
            </div>
          </Card>
        </div>

        {/* Sidebar - Evidence Checklist, Photo Upload & Tips */}
        <div className="lg:col-span-1 space-y-4">
          {/* Evidence Photos Upload */}
          <EvidenceUploader
            photos={evidenceUpload.photos}
            canAddMore={evidenceUpload.canAddMore}
            maxPhotos={evidenceUpload.maxPhotos}
            onAddPhotos={evidenceUpload.addPhotos}
            onRemovePhoto={evidenceUpload.removePhoto}
            onUpdateDescription={evidenceUpload.updateDescription}
          />

          {/* Evidence Checklist Toggle */}
          <Button variant="outline" className="w-full justify-between lg:hidden" onClick={() => setShowEvidenceChecklist(!showEvidenceChecklist)}>
            <span>Evidence Checklist</span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showEvidenceChecklist ? 'rotate-90' : ''}`} />
          </Button>

          {/* Evidence Checklist - Always visible on desktop */}
          <div className={`${showEvidenceChecklist ? 'block' : 'hidden'} lg:block`}>
            <EvidenceChecklist category={template.category} checkedItems={evidenceChecked} onItemToggle={handleEvidenceToggle} />
          </div>

          {/* Compact Strength Meter for Step 1 */}
          {step === 1 && <div className="hidden lg:block">
              <LetterStrengthMeter strength={letterStrength} showDetails={false} />
            </div>}
        </div>
      </div>

      {/* Modals */}
      {showPreview && <LetterPreview template={template} formData={formData} tone={selectedTone} jurisdiction={selectedJurisdiction} onClose={() => setShowPreview(false)} />}

      {showPricing && <PricingModal 
        templateSlug={template.slug} 
        templateName={template.title} 
        letterContent={generatedLetterContent} 
        evidencePhotoPaths={uploadedEvidencePaths}
        onClose={() => setShowPricing(false)} 
      />}

      {/* Generating Overlay with Progress */}
      <GeneratingOverlay 
        isOpen={showGeneratingOverlay}
        isGenerating={isGenerating} 
        onComplete={useCallback(() => {
          setShowGeneratingOverlay(false);
          setShowPricing(true);
        }, [])} 
      />
    </div>;
};
export default LetterGenerator;