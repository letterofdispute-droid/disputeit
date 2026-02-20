import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Stethoscope,
  Shield,
  Package,
  Plane,
  ChevronDown,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  icon: React.ElementType;
  headline: string;
  situation: string;
  whyLetterWorks: string[];
  typicalOutcome: string;
  letterSlug: string;
  letterTitle: string;
  category: string;
}

const scenarios: Scenario[] = [
  {
    id: 'security-deposit',
    icon: Home,
    headline: 'My landlord won\'t return my security deposit',
    situation:
      'You moved out two months ago, left the apartment clean, and your landlord keeps promising to send your deposit but hasn\'t. Calls go unanswered.',
    whyLetterWorks: [
      'Creates dated, documented proof of your request',
      'References the legal deadline (varies by state)',
      'Shows you\'re serious about pursuing the matter',
      'Often triggers a response within 7-10 days',
    ],
    typicalOutcome:
      'Landlords often respond quickly when they see a formal, dated letter that references their legal obligations.',
    letterSlug: '/templates/housing/tenancy-dispute/housing-kw-security-deposit-dispute',
    letterTitle: 'Security Deposit Return Request',
    category: 'housing',
  },
  {
    id: 'medical-billing',
    icon: Stethoscope,
    headline: 'The hospital is charging me for services I didn\'t receive',
    situation:
      'You got a bill for $3,400, but $1,200 is for a procedure you never had. The billing department keeps putting you on hold and nothing changes.',
    whyLetterWorks: [
      'Formal dispute halts collection attempts',
      'Forces itemized review of your charges',
      'Creates paper trail for your records',
      'Documents your good-faith effort to resolve',
    ],
    typicalOutcome:
      'Billing departments are required to investigate formal disputes, and errors are often corrected once documented.',
    letterSlug: '/templates/healthcare/billing-coding/healthcare-kw-medical-bill-dispute',
    letterTitle: 'Medical Bill Error Dispute',
    category: 'healthcare',
  },
  {
    id: 'insurance-denial',
    icon: Shield,
    headline: 'My health insurance denied my claim without explanation',
    situation:
      'Your insurance denied coverage for a procedure your doctor said was necessary. The denial letter was vague and you don\'t know why it was rejected.',
    whyLetterWorks: [
      'Documents your appeal properly',
      'References your policy terms',
      'Protects your appeal rights and deadlines',
      'Creates record for external review if needed',
    ],
    typicalOutcome:
      'Many denied claims are overturned on appeal when properly documented - the denial rate drops significantly after first appeal.',
    letterSlug: '/templates/insurance/health-insurance/insurance-kw-health-insurance-appeal',
    letterTitle: 'Insurance Claim Appeal',
    category: 'insurance',
  },
  {
    id: 'defective-product',
    icon: Package,
    headline: 'The company won\'t refund my defective product',
    situation:
      'You bought a $300 appliance that stopped working after two weeks. Customer service keeps saying they\'ll "escalate" but nothing happens.',
    whyLetterWorks: [
      'Escalates to formal complaint level',
      'Mentions consumer protection rights',
      'Creates evidence for chargeback if needed',
      'Shows you mean business',
    ],
    typicalOutcome:
      'Companies often resolve issues faster when they see a formal complaint that could become a credit card dispute or regulatory complaint.',
    letterSlug: '/templates/damaged-goods/defective-product/damaged-goods-kw-defective-product',
    letterTitle: 'Defective Product Refund Request',
    category: 'damaged-goods',
  },
  {
    id: 'flight-compensation',
    icon: Plane,
    headline: 'The airline won\'t compensate me for my cancelled flight',
    situation:
      'Your flight was cancelled with 4 hours notice, and the airline is claiming "weather" even though other flights departed. They\'re ignoring your compensation request.',
    whyLetterWorks: [
      'References EU261 regulations (or equivalent)',
      'Documents your attempt formally',
      'Creates evidence for chargeback or regulator complaint',
      'Airlines track and prioritize formal complaints',
    ],
    typicalOutcome:
      'Airlines have legal obligations for delays/cancellations - a formal letter citing regulations often triggers a proper review.',
    letterSlug: '/templates/travel/flight-compensation/travel-kw-flight-delay-compensation',
    letterTitle: 'Flight Delay/Cancellation Compensation',
    category: 'travel',
  },
];

const RealWorldScenarios = () => {
  const [expandedId, setExpandedId] = useState<string | null>('security-deposit');

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="scenarios" className="py-16 md:py-24 bg-secondary/30">
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            When Do You Need a Dispute Letter?
          </h2>
          <p className="text-lg text-muted-foreground">
            Real situations where a formal letter makes the difference. Click any scenario to see
            how a letter helps.
          </p>
        </motion.div>

        {/* Scenario Cards */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {scenarios.map((scenario, index) => {
            const isExpanded = expandedId === scenario.id;
            const Icon = scenario.icon;

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                layout
                className={cn(
                  'relative bg-card rounded-xl shadow-soft overflow-hidden',
                  isExpanded && 'shadow-elevated'
                )}
              >
                
                {/* Header - Always Visible */}
                <motion.button
                  onClick={() => toggleExpanded(scenario.id)}
                  className="relative w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors z-10"
                  whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
                  whileTap={{ scale: 0.995 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"
                    animate={{ 
                      scale: isExpanded ? 1.05 : 1,
                      backgroundColor: isExpanded ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--primary) / 0.1)'
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  <span className="font-medium text-foreground text-lg flex-1">
                    "{scenario.headline}"
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </motion.button>

                {/* Expanded Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden relative z-10"
                    >
                      <div className="px-5 pb-5 pt-0 border-t border-border bg-card/80 backdrop-blur-sm">
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="pt-5 space-y-5"
                        >
                          {/* The Situation */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              The Situation
                            </h4>
                            <p className="text-foreground">{scenario.situation}</p>
                          </div>

                          {/* Why a Letter Works */}
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Why a Letter Works
                            </h4>
                            <ul className="space-y-2">
                              {scenario.whyLetterWorks.map((point, pointIndex) => (
                                <motion.li
                                  key={pointIndex}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2, delay: 0.15 + pointIndex * 0.05 }}
                                  className="flex items-start gap-2 text-foreground"
                                >
                                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                  <span>{point}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* Typical Outcome */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.3 }}
                            className="bg-primary/5 rounded-lg p-4"
                          >
                            <h4 className="text-sm font-semibold text-primary mb-1">
                              What Usually Happens
                            </h4>
                            <p className="text-foreground text-sm">{scenario.typicalOutcome}</p>
                          </motion.div>

                          {/* CTA */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: 0.35 }}
                          >
                            <Button asChild className="w-full sm:w-auto">
                              <Link to={scenario.letterSlug}>
                                Build This Letter
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RealWorldScenarios;
