import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Eye, Lock, Sparkles, AlertTriangle, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LetterTemplate } from '@/data/letterTemplates';
import { US_STATES } from '@/data/stateSpecificLaws';
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
import ResolutionPlanPanel from './ResolutionPlanPanel';
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

const CHARGEBACK_CATEGORIES = new Set([
  'Financial & Banking', 'Refunds & Retail', 'E-commerce & Online Shopping',
  'Travel & Hospitality', 'Damaged Goods & Products'
]);

interface LetterGeneratorProps {
  template: LetterTemplate;
}

const LetterGenerator = ({ template }: LetterGeneratorProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTone, setSelectedTone] = useState<'neutral' | 'firm' | 'final'>('neutral');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(template.jurisdictions[0].code);
  const [selectedState, setSelectedState] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showResolutionPlan, setShowResolutionPlan] = useState(false);
  const [showGeneratingOverlay, setShowGeneratingOverlay] = useState(false);
  const [showEvidenceChecklist, setShowEvidenceChecklist] = useState(false);
  const [evidenceChecked, setEvidenceChecked] = useState<Record<string, boolean>>({});
  const [uploadedEvidencePaths, setUploadedEvidencePaths] = useState<{ storagePath: string; description: string }[]>([]);
  const formStartedRef = useRef(false);
  const intakePrefilledRef = useRef(false);

  const { suggestions, isLoading, requestSuggestionDebounced } = useFormAssistant();
  const { generateLetter, isGenerating, generatedContent } = useGenerateLegalLetter();
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string | null>(null);
  const evidenceUpload = useEvidenceUpload();
  const { user } = useAuth();
  const { trackFormStarted, trackFormCompleted } = useAnalytics();
  const totalSteps = 3;
  const [showIntakePrefillBanner, setShowIntakePrefillBanner] = useState(false);

  // Pre-fill form fields from intake answers stored in sessionStorage
  useEffect(() => {
    if (intakePrefilledRef.current) return;
    const raw = sessionStorage.getItem('dispute_intake_answers');
    if (!raw) return;
    try {
      const intake = JSON.parse(raw) as { incidentDate?: string; disputeType?: string; description?: string };
      let didPrefill = false;

      setFormData(prev => {
        const next = { ...prev };

        // Pre-fill date fields
        if (intake.incidentDate) {
          const dateFields = ['incidentDate', 'date', 'purchaseDate', 'serviceDate', 'eventDate'];
          const matchingDateField = template.fields.find(f => dateFields.includes(f.id));
          if (matchingDateField && !next[matchingDateField.id]) {
            next[matchingDateField.id] = intake.incidentDate!;
            didPrefill = true;
          }
        }

        // Pre-fill description/issue fields
        if (intake.description) {
          const descFields = ['issueDescription', 'description', 'details', 'whatHappened', 'complaintDetails', 'disputeDetails', 'problemDescription'];
          const matchingDescField = template.fields.find(f => descFields.includes(f.id));
          if (matchingDescField && !next[matchingDescField.id]) {
            next[matchingDescField.id] = intake.description;
            didPrefill = true;
          }
        }

        return next;
      });

      if (didPrefill) {
        intakePrefilledRef.current = true;
        setShowIntakePrefillBanner(true);
      }
    } catch {
      // ignore malformed data
    }
  }, [template.fields]);

  // Chargeback alert: show in step 2 when category + jurisdiction is US
  const showChargebackAlert = selectedJurisdiction === 'US' && CHARGEBACK_CATEGORIES.has(template.category);

  // Check if within chargeback window based on date fields
  const incidentDate = formData.incidentDate || formData.date || formData.purchaseDate || formData.serviceDate || '';
  const daysSinceIncident = incidentDate
    ? Math.floor((Date.now() - new Date(incidentDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const withinChargebackWindow = daysSinceIncident !== null && daysSinceIncident <= 60;

  // Generate fallback letter content (for preview only)
  const fallbackLetterContent = useMemo(() => {
    const result = generateFullLetter(template, formData, selectedJurisdiction, selectedTone);
    return result.fullContent;
  }, [template, formData, selectedJurisdiction, selectedTone]);

  // Use AI-generated content if available, otherwise fallback
  const generatedLetterContent = aiGeneratedContent || fallbackLetterContent;

  // Calculate letter strength
  const letterStrength = useMemo(() => {
    return assessLetterStrength(formData, template.fields);
  }, [formData, template.fields]);

  const handleInputChange = useCallback((fieldId: string, value: string) => {
    if (!formStartedRef.current && value.length > 0) {
      formStartedRef.current = true;
      trackLetterFormStart(template.slug);
      trackFormStarted(template.slug);
    }
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, [template.slug]);

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

  const handleEvidenceToggle = useCallback((item: string) => {
    setEvidenceChecked(prev => ({ ...prev, [item]: !prev[item] }));
  }, []);

  const handleGenerationComplete = useCallback(() => {
    setShowGeneratingOverlay(false);
    setShowResolutionPlan(true);
    // Store category + state so success page can reconstruct the plan
    sessionStorage.setItem('resolution_category', template.category);
    if (selectedState) sessionStorage.setItem('resolution_state', selectedState);
    else sessionStorage.removeItem('resolution_state');
  }, [template.category, selectedState]);

  const requiredFields = template.fields.filter(f => f.required);
  const optionalFields = template.fields.filter(f => !f.required);
  const hasAiEnhancedFields = template.fields.some(f => f.aiEnhanced);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {showResolutionPlan ? 'Letter Generated ✓' : `Step ${step} of ${totalSteps}`}
          </span>
          <div className="flex items-center gap-3">
            {hasAiEnhancedFields && (
              <Badge variant="outline" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                AI-Enhanced
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {showResolutionPlan
                ? 'Your Resolution Plan'
                : step === 1 ? 'Basic Information'
                : step === 2 ? 'Customize'
                : 'Review & Generate'}
            </span>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: showResolutionPlan ? '100%' : `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <div className="mt-4">
          <HumanCraftedBadge />
        </div>
      </div>

      {/* ── POST-GENERATION: Resolution Plan replaces the form ── */}
      {showResolutionPlan ? (
        <div className="space-y-6 animate-fade-in">
          {/* Success banner */}
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Your letter is ready</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Follow the steps below, then unlock your letter to send it.
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              className="flex-shrink-0 gap-1.5"
              onClick={() => setShowPricing(true)}
            >
              Unlock Letter
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Resolution Plan Panel — full width */}
          <ResolutionPlanPanel
            templateCategory={template.category}
            selectedState={selectedState || undefined}
          />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                trackLetterPreviewView(template.slug);
                setShowPreview(true);
              }}
            >
              <Eye className="h-4 w-4" />
              Preview Letter
            </Button>
            <Button
              variant="hero"
              className="flex-1 gap-2"
              onClick={() => setShowPricing(true)}
            >
              <ArrowRight className="h-4 w-4" />
              Unlock &amp; Download Letter
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Not satisfied?{' '}
            <button
              onClick={() => { setShowResolutionPlan(false); setStep(1); setAiGeneratedContent(null); }}
              className="underline hover:text-foreground transition-colors"
            >
              Start over
            </button>
          </p>
        </div>
      ) : (
        /* ── FORM FLOW ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
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

                  {/* Intake pre-fill banner */}
                  {showIntakePrefillBanner && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent">
                      <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>We've pre-filled some details from your dispute intake.</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {requiredFields.map(field => (
                      <SmartField
                        key={field.id}
                        field={field}
                        value={formData[field.id] || ''}
                        onChange={value => handleInputChange(field.id, value)}
                        aiSuggestion={suggestions[field.id]}
                        isValidating={isLoading[field.id]}
                        onRequestAiSuggestion={handleRequestAiSuggestion}
                      />
                    ))}
                  </div>

                  {optionalFields.length > 0 && (
                    <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">
                        Optional Information (strengthens your case)
                      </h4>
                      <div className="space-y-5">
                        {optionalFields.map(field => (
                          <SmartField
                            key={field.id}
                            field={field}
                            value={formData[field.id] || ''}
                            onChange={value => handleInputChange(field.id, value)}
                            aiSuggestion={suggestions[field.id]}
                            isValidating={isLoading[field.id]}
                            onRequestAiSuggestion={handleRequestAiSuggestion}
                          />
                        ))}
                      </div>
                    </div>
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

                  <LetterStrengthMeter strength={letterStrength} showDetails={true} />

                  {/* Chargeback alert — prominent when within window */}
                  {showChargebackAlert && withinChargebackWindow && (
                    <div className="rounded-xl border-2 border-warning/50 bg-warning/10 p-4 shadow-soft">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-warning" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-warning-foreground text-sm">
                              ⚡ You may still be within your chargeback window!
                            </p>
                            <span className="text-xs font-medium bg-warning/25 text-warning-foreground px-2 py-0.5 rounded-full">
                              {daysSinceIncident} days ago
                            </span>
                          </div>
                          <p className="text-warning-foreground/80 text-xs mt-1.5 leading-relaxed">
                            Under the <strong>Fair Credit Billing Act (FCBA)</strong>, you have up to 60 days to dispute a credit card charge directly with your bank — often faster than sending a letter. A demand letter can still help strengthen your case.
                          </p>
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <a
                              href="https://consumer.ftc.gov/articles/disputing-credit-card-charges"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning underline underline-offset-2 hover:opacity-80 transition-opacity"
                            >
                              <ArrowRight className="h-3 w-3" />
                              How to file a chargeback (FTC guide)
                            </a>
                            <span className="text-warning/40 text-xs hidden sm:inline">·</span>
                            <span className="text-xs text-warning-foreground/60">Sends directly to your bank — no lawyer needed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {showChargebackAlert && !withinChargebackWindow && incidentDate && (
                    <Alert className="border-warning/30 bg-warning/5">
                      <CreditCard className="h-4 w-4 text-warning" />
                      <AlertTitle className="text-warning text-sm">Consider a credit card chargeback</AlertTitle>
                      <AlertDescription className="text-muted-foreground text-xs mt-1">
                        If you paid by credit card, your bank may still be able to help even beyond the standard 60-day window. A demand letter strengthens your position.{' '}
                        <a href="https://consumer.ftc.gov/articles/disputing-credit-card-charges" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:opacity-80">
                          Learn how chargebacks work →
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Tone Selection */}
                  <div className="space-y-3">
                    <Label>Letter Tone</Label>
                    <RadioGroup
                      value={selectedTone}
                      onValueChange={v => {
                        setSelectedTone(v as typeof selectedTone);
                        trackToneSelected(template.slug, v);
                      }}
                    >
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
                    <Select
                      value={selectedJurisdiction}
                      onValueChange={v => {
                        setSelectedJurisdiction(v);
                        trackJurisdictionSelected(template.slug, v);
                        if (v !== 'US') setSelectedState('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {template.jurisdictions.map(j => (
                          <SelectItem key={j.code} value={j.code}>{j.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This helps us include appropriate legal references (available in paid tiers).
                    </p>
                  </div>

                  {/* US State Selection */}
                  {selectedJurisdiction === 'US' && (
                    <div className="space-y-3">
                      <Label>Your State</Label>
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(s => (
                            <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Selecting your state adds specific state statute citations to strengthen your letter.
                      </p>
                      {selectedState && (() => {
                        const stateInfo = US_STATES.find(s => s.code === selectedState);
                        if (!stateInfo) return null;
                        const stateSlug = stateInfo.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        const CATEGORY_TO_SLUG: Record<string, string> = {
                          'Vehicle': 'vehicle', 'Housing & Tenant Rights': 'housing',
                          'Insurance': 'insurance', 'Financial & Banking': 'financial',
                          'Contractors & Home Services': 'contractors',
                          'Damaged Goods & Products': 'damaged-goods', 'Refunds & Retail': 'refunds',
                          'Travel & Hospitality': 'travel', 'Utilities & Telecoms': 'utilities',
                          'Employment': 'employment', 'E-commerce & Online Shopping': 'ecommerce',
                          'HOA & Neighbors': 'hoa', 'Healthcare': 'healthcare',
                        };
                        const categorySlug = CATEGORY_TO_SLUG[template.category] || template.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        return (
                          <a
                            href={`/state-rights/${stateSlug}/${categorySlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            📋 View your {stateInfo.name} {template.category} consumer rights →
                          </a>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                      Review &amp; Generate
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Preview your letter before generating the final version.
                    </p>
                  </div>

                  <LetterStrengthMeter strength={letterStrength} showDetails={false} />

                  {/* Preview Card */}
                  <div
                    className="relative border border-border rounded-lg p-6 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => {
                      trackLetterPreviewView(template.slug);
                      setShowPreview(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-foreground">Letter Preview</h4>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Preview
                      </Button>
                    </div>
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
                        <span className={
                          letterStrength.level === 'strong' ? 'text-success'
                          : letterStrength.level === 'moderate' ? 'text-warning'
                          : 'text-destructive'
                        }>
                          {letterStrength.overallScore}% — {letterStrength.level}
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
                ) : <div />}

                {step < totalSteps ? (
                  <Button
                    variant="accent"
                    onClick={() => {
                      trackLetterFormStep(template.slug, step);
                      setStep(step + 1);
                    }}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    disabled={isGenerating || showGeneratingOverlay || evidenceUpload.isUploading}
                    onClick={async () => {
                      trackGenerateLetterClick(template.slug);
                      trackFormCompleted(template.slug);
                      setShowGeneratingOverlay(true);

                      if (evidenceUpload.hasPhotos && user) {
                        try {
                          const paths = await evidenceUpload.uploadAllPhotos(user.id);
                          setUploadedEvidencePaths(paths);
                        } catch (err) {
                          console.error('Failed to upload evidence photos:', err);
                          toast.error('Failed to upload some evidence photos, but continuing with letter generation');
                        }
                      }

                      const aiContent = await generateLetter({
                        templateCategory: template.category,
                        templateName: template.title,
                        templateSlug: template.slug,
                        formData,
                        jurisdiction: selectedJurisdiction as 'US' | 'UK' | 'EU' | 'generic',
                        tone: selectedTone,
                        usState: selectedState || undefined,
                      });

                      if (aiContent) {
                        setAiGeneratedContent(aiContent);
                      }
                    }}
                  >
                    Generate Letter
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <EvidenceUploader
              photos={evidenceUpload.photos}
              canAddMore={evidenceUpload.canAddMore}
              maxPhotos={evidenceUpload.maxPhotos}
              onAddPhotos={evidenceUpload.addPhotos}
              onRemovePhoto={evidenceUpload.removePhoto}
              onUpdateDescription={evidenceUpload.updateDescription}
            />

            <Button
              variant="outline"
              className="w-full justify-between lg:hidden"
              onClick={() => setShowEvidenceChecklist(!showEvidenceChecklist)}
            >
              <span>Evidence Checklist</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showEvidenceChecklist ? 'rotate-90' : ''}`} />
            </Button>

            <div className={`${showEvidenceChecklist ? 'block' : 'hidden'} lg:block`}>
              <EvidenceChecklist category={template.category} checkedItems={evidenceChecked} onItemToggle={handleEvidenceToggle} />
            </div>

            {step === 1 && (
              <div className="hidden lg:block">
                <LetterStrengthMeter strength={letterStrength} showDetails={false} />
              </div>
            )}
          </div>
        </div>
      )}

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
          evidencePhotoPaths={uploadedEvidencePaths}
          onClose={() => setShowPricing(false)}
        />
      )}

      {/* Generating Overlay */}
      <GeneratingOverlay
        isOpen={showGeneratingOverlay}
        isGenerating={isGenerating}
        onComplete={handleGenerationComplete}
      />
    </div>
  );
};

export default LetterGenerator;
