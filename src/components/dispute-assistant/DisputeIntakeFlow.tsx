import { useState, useEffect } from 'react';
import { ArrowRight, CreditCard, Calendar, MessageCircle, AlertTriangle } from 'lucide-react';
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

const CREDIT_CARD_TYPES = new Set(['payment', 'product', 'travel', 'service']);

export default function DisputeIntakeFlow({ onComplete }: DisputeIntakeFlowProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<IntakeAnswers>>({});

  const showChargebackQuestion = CREDIT_CARD_TYPES.has(answers.disputeType || '');

  const handleTypeSelect = (type: string) => {
    setAnswers(prev => ({ ...prev, disputeType: type }));
    setStep(2);
  };

  const handleCreditCardAnswer = (answer: boolean) => {
    setAnswers(prev => ({ ...prev, paidByCreditCard: answer }));
    setStep(3);
  };

  const handleSkipCreditCard = () => {
    setAnswers(prev => ({ ...prev, paidByCreditCard: null }));
    setStep(3);
  };

  const handleStep3Continue = () => {
    setStep(4);
  };

  const handleFinish = (responded: 'yes' | 'no' | 'not_yet') => {
    const finalAnswers: IntakeAnswers = {
      disputeType: answers.disputeType || 'other',
      paidByCreditCard: answers.paidByCreditCard ?? null,
      incidentDate: answers.incidentDate || '',
      companyResponded: responded,
    };
    setAnswers(prev => ({ ...prev, companyResponded: responded }));
    onComplete(finalAnswers);
  };

  // Auto-advance step 2 if not a chargeback category
  useEffect(() => {
    if (step === 2 && !showChargebackQuestion) {
      setAnswers(prev => ({ ...prev, paidByCreditCard: null }));
      setStep(3);
    }
  }, [step, showChargebackQuestion]);

  // Calculate days since incident for urgency
  const daysSince = answers.incidentDate
    ? Math.floor((Date.now() - new Date(answers.incidentDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const withinChargebackWindow = daysSince !== null && daysSince <= 60;

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-border">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              s <= step ? 'bg-accent' : 'bg-muted'
            )}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1: Dispute type */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <div>
              <h3 className="font-semibold text-foreground text-base">
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
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/5 text-left transition-all group"
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Credit card (conditional) or skip to date */}
        {step === 2 && showChargebackQuestion && (
          <div className="animate-fade-in space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-base">
                  Did you pay by credit card?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                This affects your fastest resolution path — credit card chargebacks can be quicker than letters.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleCreditCardAnswer(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 text-left transition-all"
              >
                <div className="p-2 rounded-lg bg-success/10">
                  <CreditCard className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Yes, credit or debit card</p>
                  <p className="text-xs text-muted-foreground">I may be able to file a chargeback</p>
                </div>
              </button>
              <button
                onClick={() => handleCreditCardAnswer(false)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-muted-foreground hover:bg-muted/50 text-left transition-all"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">No, cash, check, or other</p>
                  <p className="text-xs text-muted-foreground">A formal letter is likely my best route</p>
                </div>
              </button>
            </div>
            <button
              onClick={handleSkipCreditCard}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Not sure — skip this question
            </button>
          </div>
        )}

        {/* Auto-advance step 2 for non-chargeback categories */}
        {step === 2 && !showChargebackQuestion && (() => {
          // Use effect-like logic: trigger via setTimeout to avoid render-time setState
          return null;
        })()}

        {/* Step 3: When did this happen? */}
        {step === 3 && (
          <div className="animate-fade-in space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-base">
                  When did this happen?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Knowing the date helps identify relevant deadlines for your case.
              </p>
            </div>

            <input
              type="date"
              value={answers.incidentDate || ''}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAnswers(prev => ({ ...prev, incidentDate: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />

            {/* Urgency signals based on date */}
            {answers.incidentDate && daysSince !== null && (
              <div className={cn(
                'flex items-start gap-2 p-3 rounded-lg text-xs border',
                answers.paidByCreditCard && withinChargebackWindow
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-muted text-muted-foreground border-border'
              )}>
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {answers.paidByCreditCard && withinChargebackWindow ? (
                  <span>
                    <strong>Good news:</strong> You're within the 60-day chargeback window. Your bank may be able to reverse this charge.
                  </span>
                ) : answers.paidByCreditCard && !withinChargebackWindow ? (
                  <span>
                    The standard 60-day chargeback window has likely passed ({daysSince} days ago), but a demand letter is still effective.
                  </span>
                ) : (
                  <span>
                    This occurred {daysSince} day{daysSince !== 1 ? 's' : ''} ago. I'll factor this into my recommendations.
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setAnswers(prev => ({ ...prev, incidentDate: '' }));
                  handleStep3Continue();
                }}
              >
                Not sure / Skip
              </Button>
              <Button
                variant="accent"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleStep3Continue}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Has the company responded? */}
        {step === 4 && (
          <div className="animate-fade-in space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-base">
                  Has the company responded to you?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                This helps me recommend the right tone and escalation level.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'not_yet' as const, label: "Not yet — haven't contacted them", sub: "I'll help you draft a formal first contact" },
                { id: 'no' as const, label: 'No response / being ignored', sub: 'Stronger tone + escalation guidance recommended' },
                { id: 'yes' as const, label: "Yes, but refused or unsatisfied", sub: "Time to escalate with formal documentation" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFinish(option.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 text-left transition-all group"
                >
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
