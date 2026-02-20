import { useState } from 'react';
import { 
  FileText, Building2, CreditCard, Scale, ChevronDown, ChevronUp, 
  ExternalLink, Clock, AlertTriangle, CheckCircle2, ArrowRight, Gavel
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { legalKnowledgeDatabase } from '@/data/legalKnowledge';
import { stateSpecificLaws, US_STATES } from '@/data/stateSpecificLaws';

// Small claims limits by state (2025 values)
const SMALL_CLAIMS_LIMITS: Record<string, number> = {
  AL: 6000, AK: 10000, AZ: 3500, AR: 5000, CA: 12500, CO: 7500,
  CT: 5000, DE: 25000, FL: 8000, GA: 15000, HI: 5000, ID: 5000,
  IL: 10000, IN: 8000, IA: 6500, KS: 4000, KY: 2500, LA: 5000,
  ME: 6000, MD: 5000, MA: 7000, MI: 7000, MN: 15000, MS: 3500,
  MO: 5000, MT: 7000, NE: 3600, NV: 10000, NH: 10000, NJ: 3000,
  NM: 10000, NY: 10000, NC: 10000, ND: 15000, OH: 6000, OK: 10000,
  OR: 10000, PA: 12000, RI: 2500, SC: 7500, SD: 12000, TN: 25000,
  TX: 20000, UT: 11000, VT: 5000, VA: 5000, WA: 10000, WV: 10000,
  WI: 10000, WY: 6000, DC: 10000,
};

// Category mapping from template category to legalKnowledge categoryId
const CATEGORY_TO_LEGAL_ID: Record<string, string> = {
  'Financial & Banking': 'financial',
  'Vehicle': 'vehicle',
  'Housing & Tenant Rights': 'housing',
  'Refunds & Retail': 'refunds',
  'Travel & Hospitality': 'travel',
  'Utilities & Telecoms': 'utilities',
  'Employment': 'employment',
  'E-commerce & Online Shopping': 'ecommerce',
  'Insurance': 'insurance',
  'Contractors & Home Services': 'contractors',
  'Damaged Goods & Products': 'damaged-goods',
  'HOA & Neighbors': 'hoa',
  'Healthcare': 'healthcare',
};

// Categories where chargeback is especially relevant
const CHARGEBACK_CATEGORIES = new Set([
  'financial', 'refunds', 'ecommerce', 'travel', 'damaged-goods',
]);

interface ResolutionStep {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  urgency?: 'high' | 'medium' | 'low';
  link?: string;
  linkLabel?: string;
  deadline?: string;
  done: boolean;
}

interface ResolutionPlanPanelProps {
  templateCategory: string;
  selectedState?: string;
  /** If true, renders in compact mode (e.g., on PurchaseSuccessPage) */
  compact?: boolean;
}

export function buildResolutionSteps(templateCategory: string, selectedState?: string): ResolutionStep[] {
  const categoryId = CATEGORY_TO_LEGAL_ID[templateCategory] || templateCategory.toLowerCase().replace(/\s+/g, '-');
  const legalInfo = legalKnowledgeDatabase.find(db => db.categoryId === categoryId);
  const usInfo = legalInfo?.jurisdictions.US;
  const stateLaw = selectedState ? stateSpecificLaws[selectedState] : null;
  const stateInfo = selectedState ? US_STATES.find(s => s.code === selectedState) : null;
  const smallClaimsLimit = selectedState ? SMALL_CLAIMS_LIMITS[selectedState] : null;

  const steps: ResolutionStep[] = [];

  // Step 1: Always — send the letter
  steps.push({
    step: 1,
    title: 'Send Your Demand Letter',
    description: 'Your generated letter is Step 1. Send via certified mail or email with read receipt to create a paper trail. Keep a copy for your records.',
    icon: FileText,
    urgency: 'high',
    done: false,
  });

  // Step 2: Chargeback — if category is eligible
  if (CHARGEBACK_CATEGORIES.has(categoryId)) {
    steps.push({
      step: 2,
      title: 'File a Credit Card Chargeback',
      description: 'If you paid by credit card, contact your bank NOW. Chargebacks are often faster than letters — your bank can reverse the charge directly. You typically have 60–120 days from the transaction date.',
      icon: CreditCard,
      urgency: 'high',
      deadline: 'Act within 60 days of transaction (FCBA)',
      done: false,
    });
  }

  // Step 3: Relevant agency complaint
  if (usInfo?.regulatoryAgencies && usInfo.regulatoryAgencies.length > 0) {
    const primaryAgency = usInfo.regulatoryAgencies[0];
    const agencyDeadline = usInfo.timeframes?.[0];
    steps.push({
      step: steps.length + 1,
      title: `File with ${primaryAgency.name}${primaryAgency.abbreviation ? ` (${primaryAgency.abbreviation})` : ''}`,
      description: `Formal agency complaints put companies on notice and create official records. ${primaryAgency.abbreviation === 'CFPB' ? 'Companies must respond to CFPB complaints within 15 days.' : primaryAgency.abbreviation === 'FTC' ? 'The FTC builds enforcement patterns from complaint data.' : 'Agency complaints can trigger investigations and mediation.'}`,
      icon: Building2,
      urgency: 'medium',
      link: primaryAgency.complaintUrl || primaryAgency.website,
      linkLabel: `File ${primaryAgency.abbreviation || primaryAgency.name} Complaint`,
      deadline: agencyDeadline ? `Response required within ${agencyDeadline.days} days per ${agencyDeadline.source}` : undefined,
      done: false,
    });
  }

  // Step 4: State AG if state selected
  if (stateLaw && stateInfo) {
    steps.push({
      step: steps.length + 1,
      title: `File with ${stateInfo.name} Attorney General`,
      description: `State AGs actively pursue consumer protection cases, especially repeat offenders. Your complaint adds to enforcement patterns in ${stateInfo.name}.`,
      icon: Gavel,
      urgency: 'medium',
      link: stateLaw.agWebsite,
      linkLabel: `${stateInfo.name} AG Office`,
      done: false,
    });
  }

  // Step 5: Small claims
  const limitText = smallClaimsLimit 
    ? `${stateInfo?.name || 'your state'} small claims limit is $${smallClaimsLimit.toLocaleString()}`
    : 'small claims limits vary by state — typically $2,500–$25,000';

  steps.push({
    step: steps.length + 1,
    title: 'Escalate to Small Claims Court',
    description: `If the company doesn't respond within 14–30 days, small claims court is your next escalation. ${limitText}. You don't need a lawyer. Filing fees are typically $30–$100.`,
    icon: Scale,
    urgency: 'low',
    link: 'https://www.uscourts.gov/court-locator',
    linkLabel: 'Find Your Local Court',
    done: false,
  });

  return steps;
}

const URGENCY_CONFIG = {
  high: { label: 'Act Now', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  medium: { label: 'Next Step', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400' },
  low: { label: 'If Needed', className: 'bg-muted text-muted-foreground border-border' },
};

interface StepCardProps {
  step: ResolutionStep;
  isFirst?: boolean;
}

function StepCard({ step, isFirst }: StepCardProps) {
  const [expanded, setExpanded] = useState(isFirst ?? false);
  const Icon = step.icon;
  const urgency = step.urgency ? URGENCY_CONFIG[step.urgency] : URGENCY_CONFIG.low;

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />

      <div className="flex gap-4">
        {/* Step number circle */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 text-sm font-bold text-primary">
          {step.done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : step.step}
        </div>

        <div className={cn(
          'flex-1 mb-4 rounded-xl border bg-card transition-shadow',
          expanded && 'shadow-soft'
        )}>
          {/* Header row */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between gap-3 p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/8 rounded-lg">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-foreground text-sm">{step.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {step.urgency && (
                <Badge className={cn('text-xs border', urgency.className)}>{urgency.label}</Badge>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expanded content */}
          {expanded && (
            <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              
              {step.deadline && (
                <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{step.deadline}</span>
                </div>
              )}

              {step.link && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={step.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {step.linkLabel || 'Open Link'}
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResolutionPlanPanel({ 
  templateCategory, 
  selectedState,
  compact = false 
}: ResolutionPlanPanelProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const steps = buildResolutionSteps(templateCategory, selectedState);
  const categoryId = CATEGORY_TO_LEGAL_ID[templateCategory] || templateCategory.toLowerCase().replace(/\s+/g, '-');
  const hasChargeback = CHARGEBACK_CATEGORIES.has(categoryId);

  return (
    <Card className={cn('border-primary/20 bg-primary/[0.02]', compact && 'border-border bg-card')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Your Resolution Plan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {steps.length} steps to resolve your dispute
              </p>
            </div>
          </div>
          {compact && (
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Chargeback urgent alert */}
        {hasChargeback && (
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Check your chargeback window first
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                If you paid by credit card, you may be able to reverse the charge directly with your bank — often faster than a letter. Most banks allow chargebacks within 60–120 days.
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="relative pb-2">
            {steps.map((step, i) => (
              <StepCard key={step.step} step={step} isFirst={i === 0} />
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50 mt-2">
            This is a general guide. Timelines and options vary by state and situation. Not legal advice.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
