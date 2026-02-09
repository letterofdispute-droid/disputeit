import { Check, FileText, Edit, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { trackCTAClick } from '@/hooks/useGTM';

const options = [
  {
    name: 'PDF Only',
    price: '$9.99',
    description: 'Download your letter as a PDF',
    icon: FileText,
    features: [
      'Professional letter with legal-safe phrasing',
      'PDF download, ready to send',
      'Attach up to 10 evidence photos in PDF',
      'Cites relevant US federal law',
      '500+ dispute-specific templates',
    ],
    popular: false,
  },
  {
    name: 'PDF + Edit Access',
    price: '$14.99',
    description: 'PDF plus 30 days of in-app editing',
    icon: Edit,
    features: [
      'Everything in PDF Only',
      '30 days of in-app editing',
      'Export updated PDF anytime',
      'AI-powered form assistance',
      'Make unlimited changes',
    ],
    popular: true,
  },
];

const Pricing = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Per-Letter Pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Pay only for what you need. No hidden fees.
          </p>
          <div className="inline-block px-4 py-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">What you're paying for:</span> Pre-validated letter templates, legal-safe phrasing, and the certainty that your letter won't hurt your case.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.name}
                className={`relative p-6 ${
                  option.popular 
                    ? 'border-2 border-accent shadow-elevated md:scale-105' 
                    : 'border border-border'
                }`}
              >
                {/* Popular Badge */}
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                    Best Value
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{option.name}</h3>
                  <div className="font-serif text-4xl font-bold text-foreground mb-1">
                    {option.price}
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={option.popular ? 'accent' : 'outline'}
                  className="w-full"
                  asChild
                  onClick={() => trackCTAClick(`pricing_${option.name.toLowerCase().replace(/\s+/g, '_')}`, 'pricing_section')}
                >
                  <Link to="/#letters">
                    Create Letter
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Re-edit info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need to edit after 30 days? Unlock editing access again for just <span className="font-semibold text-foreground">$5.99</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
