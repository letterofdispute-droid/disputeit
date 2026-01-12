import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Single Letter',
    price: '$4.99',
    description: 'Perfect for a one-time dispute',
    features: [
      'One professional letter',
      'Customized to your situation',
      'PDF & Word formats',
      'Email support',
    ],
    cta: 'Create Letter',
    href: '/#letters',
  },
  {
    name: 'Letter Pack',
    price: '$12.99',
    description: 'Best value for multiple disputes',
    features: [
      '5 professional letters',
      'All template categories',
      'PDF & Word formats',
      'Priority email support',
      'Follow-up letter templates',
    ],
    cta: 'Get Started',
    href: '/#letters',
    popular: true,
  },
  {
    name: 'Unlimited',
    price: '$29.99',
    period: '/month',
    description: 'For power users and businesses',
    features: [
      'Unlimited letters',
      'All premium templates',
      'Team sharing',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
  },
];

const PricingPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="Pricing | DisputeLetters"
        description="Simple, transparent pricing for professional dispute letters. Pay per letter or subscribe for unlimited access."
      />

      {/* Hero */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-accent shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="font-serif text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-success flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'accent' : 'outline'}
                    asChild
                  >
                    <Link to={plan.href}>
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Can I get a refund if I'm not satisfied?
              </h3>
              <p className="text-muted-foreground">
                Yes! We offer a 30-day money-back guarantee on all plans. If you're not satisfied 
                with our service, contact us for a full refund.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Do letter credits expire?
              </h3>
              <p className="text-muted-foreground">
                No, your letter credits never expire. Use them whenever you need them.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-muted-foreground">
                Absolutely. You can cancel your subscription at any time. You'll continue to have 
                access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PricingPage;
