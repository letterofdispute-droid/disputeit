import { useState, useEffect } from 'react';
import { ArrowRight, CreditCard, Calendar, MessageCircle, AlertTriangle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface IntakeAnswers {
  disputeType: string;
  paidByCreditCard: boolean | null;
  incidentDate: string;
  companyResponded: 'yes' | 'no' | 'not_yet';
}

interface DisputeIntakeFlowProps {
  onComplete: (answers: IntakeAnswers) => void;
}

const DISPUTE_TYPES = [
  { id: 'payment', label: 'Payment / Charge', emoji: '💳' },
  { id: 'product', label: 'Product / Item', emoji: '📦' },
  { id: 'service', label: 'Service Issue', emoji: '🔧' },
  { id: 'housing', label: 'Housing / Rental', emoji: '🏠' },
  { id: 'employment', label: 'Employment', emoji: '💼' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'financial', label: 'Financial / Credit', emoji: '🏦' },
  { id: 'other', label: 'Something Else', emoji: '❓' },
];

// Dispute types where a chargeback is relevant
const CREDIT_CARD_TYPES = new Set(['payment', 'product', 'travel', 'service']);

export default function DisputeIntakeFlow({ onComplete }: DisputeIntakeFlowProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<IntakeAnswers>>({});

  const showChargebackQuestion = CREDIT_CARD_TYPES.has(answers.disputeType || '');

  // Calculate days since incident
  const daysSince = answers.incidentDate
    ? Math.floor((Date.now() - new Date(answers.incidentDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const withinChargebackWindow = daysSince !== null && daysSince <= 60;

  // Auto-advance step 2 if not a chargeback-relevant category
  useEffect(() => {
    if (step === 2 && !showChargebackQuestion) {
      setAnswers(prev => ({ ...prev, paidByCreditCard: null }));
      setStep(3);
    }
  }, [step, showChargebackQuestion]);

  const handleTypeSelect = (type: string) => {
    setAnswers(prev => ({ ...prev, disputeType: type }));
    setStep(2);
  };

  const handleCreditCardAnswer = (answer: boolean) => {
    setAnswers(prev => ({ ...prev, paidByCreditCard: answer }));
    setStep(3);
  };

  const handleFinish = (responded: 'yes' | 'no' | 'not_yet') => {
    onComplete({
      disputeType: answers.disputeType || 'other',
      paidByCreditCard: answers.paidByCreditCard ?? null,
      incidentDate: answers.incidentDate || '',
      companyResponded: responded,
    });
  };

  const goBack = () => {
    if (step === 3) {
      // Go back to step 2 only if chargeback question was shown; else go to step 1
      setStep(showChargebackQuestion ? 2 : 1);
    } else if (step === 2) {
      setStep(1);
    }
  };

  // Render step indicator dots
  const totalSteps = 3;
  const effectiveStep = step === 4 ? 3 : step; // step 4 is just the final question inside step 3 UI

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border bg-muted/20">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i + 1 <= effectiveStep ? 'bg-accent' : 'bg-muted'
            )}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground font-medium tabular-nums">
          {effectiveStep}/{totalSteps}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {/* ── Step 1: Dispute type ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="font-semibold text-foreground text-base leading-snug">
                What type of dispute is this?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                I'll tailor my advice to your specific situation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DISPUTE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border border-border',
                    'hover:border-accent hover:bg-accent/5 text-left transition-all group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
                  )}
                >
                  <span className="text-xl leading-none">{type.emoji}</span>
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors leading-tight">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Credit card question (conditional) ── */}
        {step === 2 && showChargebackQuestion && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-base">
                  Did you pay by credit or debit card?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                This affects your fastest resolution path — chargebacks can be quicker than letters.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleCreditCardAnswer(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="p-2 rounded-lg bg-success/10 flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Yes — credit or debit card</p>
                  <p className="text-xs text-muted-foreground mt-0.5">I may be able to file a chargeback</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
              <button
                onClick={() => handleCreditCardAnswer(false)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-muted-foreground/50 hover:bg-muted/50 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">No — cash, bank transfer, or other</p>
                  <p className="text-xs text-muted-foreground mt-0.5">A formal letter is likely my best route</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
            </div>
            <button
              onClick={() => { setAnswers(prev => ({ ...prev, paidByCreditCard: null })); setStep(3); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Not sure — skip this
            </button>
          </div>
        )}

        {/* ── Step 3: Date + Company response ── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </button>

            {/* Date section */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-accent" />
                  <h3 className="font-semibold text-foreground text-base">
                    When did this happen?
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Helps identify relevant deadlines for your case.
                </p>
              </div>

              <input
                type="date"
                value={answers.incidentDate || ''}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAnswers(prev => ({ ...prev, incidentDate: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
              />

              {/* Urgency banner based on date + payment method */}
              {answers.incidentDate && daysSince !== null && (
                <div className={cn(
                  'flex items-start gap-2 p-3 rounded-lg text-xs border',
                  answers.paidByCreditCard && withinChargebackWindow
                    ? 'bg-warning/10 text-warning border-warning/30'
                    : answers.paidByCreditCard && !withinChargebackWindow
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {answers.paidByCreditCard && withinChargebackWindow ? (
                    <span>
                      <strong>You're within the 60-day chargeback window.</strong> Your bank may be able to reverse this charge directly — I'll mention this in my recommendation.
                    </span>
                  ) : answers.paidByCreditCard && !withinChargebackWindow ? (
                    <span>
                      The standard 60-day chargeback window has passed ({daysSince} days ago). A formal demand letter is still your strongest option.
                    </span>
                  ) : (
                    <span>
                      This occurred {daysSince} day{daysSince !== 1 ? 's' : ''} ago — I'll factor any relevant deadlines into my recommendation.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Company response section */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-accent" />
                  <h3 className="font-semibold text-foreground text-base">
                    Has the company responded to you?
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This determines the right tone and escalation level.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'not_yet' as const,
                    label: "Not yet — haven't contacted them",
                    sub: "I'll help you draft a strong first contact",
                    emoji: '📝',
                  },
                  {
                    id: 'no' as const,
                    label: 'No response / being ignored',
                    sub: 'Stronger tone + escalation options recommended',
                    emoji: '🔔',
                  },
                  {
                    id: 'yes' as const,
                    label: 'Yes, but refused or unsatisfied',
                    sub: 'Time to escalate with formal documentation',
                    emoji: '⚡',
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleFinish(option.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3.5 rounded-xl border border-border',
                      'hover:border-accent hover:bg-accent/5 text-left transition-all group',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
                    )}
                  >
                    <span className="text-lg leading-none">{option.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm leading-snug">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.sub}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Skip date option (only show if date not entered yet) */}
              {!answers.incidentDate && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  You can select a response option above without entering a date.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
