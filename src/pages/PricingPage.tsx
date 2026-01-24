import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, FileText, FileEdit } from 'lucide-react';

const options = [
  {
    name: 'PDF Only',
    price: '$5.99',
    description: 'Download your letter as a professional PDF',
    icon: FileText,
    features: [
      'Professional letter formatting',
      'PDF download',
      'Ready to send immediately',
      'Email support',
    ],
    cta: 'Get PDF',
    href: '/#letters',
  },
  {
    name: 'PDF + Editable',
    price: '$9.99',
    description: 'PDF plus an editable Word document',
    icon: FileEdit,
    features: [
      'Everything in PDF Only',
      'Editable Word document',
      'Make changes anytime',
      'Perfect for multiple disputes',
    ],
    cta: 'Get PDF + Editable',
    href: '/#letters',
    popular: true,
  },
];

const PricingPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="Pricing | DisputeLetters"
        description="Simple, transparent per-letter pricing. Pay only for what you need — no subscriptions."
        canonicalPath="/pricing"
      />

      {/* Hero */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Simple, Per-Letter Pricing
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Pay only for what you need. No subscriptions, no hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {options.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={index} 
                  className={`relative ${option.popular ? 'border-accent shadow-lg scale-105' : ''}`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground">Best Value</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="font-serif text-xl">{option.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">{option.price}</span>
                      <span className="text-muted-foreground"> / letter</span>
                    </div>
                    <CardDescription className="mt-2">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {option.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-success flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={option.popular ? 'accent' : 'outline'}
                      asChild
                    >
                      <Link to={option.href}>
                        {option.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Value Explanation */}
          <div className="mt-12 max-w-2xl mx-auto text-center">
            <div className="inline-block px-6 py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">What you're paying for:</span> Pre-validated letter builders, legal-safe phrasing, and the certainty that your letter won't hurt your case.
              </p>
            </div>
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
                What's the difference between PDF and Editable?
              </h3>
              <p className="text-muted-foreground">
                The PDF option gives you a ready-to-send professional letter. The PDF + Editable 
                option includes a Word document so you can make additional changes before sending.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Can I get a refund if I'm not satisfied?
              </h3>
              <p className="text-muted-foreground">
                Yes! We offer a 30-day money-back guarantee. If you're not satisfied 
                with your letter, contact us for a full refund.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Can I use the same letter for multiple disputes?
              </h3>
              <p className="text-muted-foreground">
                With the PDF + Editable option, you can modify the document as many times 
                as you need for similar disputes.
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-muted-foreground">
                Absolutely. We use Stripe for payment processing, and your payment information 
                is never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PricingPage;
