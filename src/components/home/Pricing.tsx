import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const plans = [
  {
    name: 'Basic Letter',
    price: '€9.99',
    description: 'Perfect for straightforward disputes',
    features: [
      'Professional formatting',
      'Editable document',
      'PDF download',
      'Email-ready format',
    ],
    popular: false,
  },
  {
    name: 'With Legal References',
    price: '€19.99',
    description: 'Adds legal weight to your letter',
    features: [
      'Everything in Basic',
      'Jurisdiction-specific references',
      'Stronger legal standing',
      'Recommended phrasing',
    ],
    popular: true,
  },
  {
    name: 'Final Notice',
    price: '€29.99',
    description: 'For unresolved disputes',
    features: [
      'Everything in Legal',
      'Escalation language',
      'Deadline enforcement',
      'Follow-up template included',
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Pay only for what you need. No subscriptions, no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-6 ${
                plan.popular 
                  ? 'border-2 border-accent shadow-elevated' 
                  : 'border border-border'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="font-serif text-4xl font-bold text-foreground mb-2">
                  {plan.price}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'accent' : 'outline'}
                className="w-full"
              >
                Select Plan
              </Button>
            </Card>
          ))}
        </div>

        {/* Bundle Offer */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="p-6 bg-primary text-primary-foreground text-center">
            <h3 className="font-semibold mb-2">Need Multiple Letters?</h3>
            <p className="text-primary-foreground/80 mb-4">
              Get 3 letters for €39.99 — Save over 30%
            </p>
            <Button variant="hero" size="lg">
              Get the Bundle
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
