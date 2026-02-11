import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Check, 
  ArrowRight, 
  FileText, 
  Edit, 
  Shield, 
  Lock, 
  RefreshCw,
  AlertTriangle,
  Scale,
  Bot,
  X
} from 'lucide-react';

const getOptions = (pdfOnlyPrice: number, pdfEditablePrice: number, formatPrice: (p: number) => string) => [
  {
    name: 'PDF Only',
    price: formatPrice(pdfOnlyPrice),
    priceValue: pdfOnlyPrice,
    description: 'Download your letter as a professional PDF',
    icon: FileText,
    features: [
      'Professional letter with legal-safe phrasing',
      'PDF download, ready to send',
      'Attach up to 10 evidence photos embedded in PDF',
      'Cites relevant US federal law',
      '500+ dispute-specific templates',
    ],
    cta: 'Get PDF',
    href: '/#letters',
  },
  {
    name: 'PDF + Edit Access',
    price: formatPrice(pdfEditablePrice),
    priceValue: pdfEditablePrice,
    description: 'PDF plus 30 days of in-app editing',
    icon: Edit,
    features: [
      'Everything in PDF Only',
      '30 days of in-app editing',
      'Export updated PDF anytime',
      'AI-powered form assistance',
      'Make unlimited changes',
    ],
    cta: 'Get PDF + Edit Access',
    href: '/#letters',
    popular: true,
  },
];

const trustIndicators = [
  {
    icon: Shield,
    title: '500+ Templates',
    description: 'Dispute-specific templates across 13 categories.',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'Processed securely by Stripe. We never store your card.',
  },
  {
    icon: RefreshCw,
    title: 'Instant Delivery',
    description: 'Download your letter immediately after purchase.',
  },
];

const comparisons = [
  {
    icon: Bot,
    title: 'Why not just use ChatGPT?',
    problems: [
      'Generic output not optimized for disputes',
      'May include language that weakens your case',
      'No legal references or proper formatting',
      'Can\'t attach evidence photos to your letter',
      'Not trained on dispute-specific legal language',
    ],
    solution: 'Our purpose-built models produce legal-safe language with proper citations. Plus, embed up to 10 evidence photos directly in your PDF.',
  },
  {
    icon: Scale,
    title: 'Why not hire a lawyer?',
    problems: [
      'Consultation fees start at $150-300/hour',
      'Most disputes don\'t require legal representation',
      'Overkill for straightforward consumer issues',
      'Takes days to weeks to schedule',
    ],
    solution: 'For standard consumer disputes, a well-written demand letter is often all you need. Save the lawyer for complex cases.',
  },
  {
    icon: AlertTriangle,
    title: 'Why not ignore the issue?',
    problems: [
      'You lose money you\'re owed',
      'Bad actors face no consequences',
      'Problem may escalate or repeat',
      'Statute of limitations may expire',
    ],
    solution: 'A formal letter often gets results where casual complaints fail. Most issues resolve at this stage.',
  },
];

const faqs = [
  {
    question: 'What\'s the difference between PDF and PDF + Edit Access?',
    answer: 'The PDF option gives you a ready-to-send professional letter. The PDF + Edit Access option lets you edit your letter in our online editor for 30 days, making it easy to customize and update before sending.',
  },
  {
    question: 'What happens after 30 days of edit access?',
    answer: 'After 30 days, you can still download your last saved PDF. If you need to make more edits, you can unlock another 30 days for just $5.99.',
  },
  {
    question: 'Can I get a refund if I\'m not satisfied?',
    answer: 'If you experience a technical issue with your letter, please contact us at support@letterofdispute.com and we\'ll work to resolve it promptly.',
  },
  {
    question: 'Can I use the same letter for multiple disputes?',
    answer: 'With the PDF + Edit Access option, you can modify the document as many times as you need for similar disputes during your 30-day access period.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We use Stripe for payment processing, which is PCI-compliant and used by millions of businesses worldwide. Your payment information is never stored on our servers.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'For one-time purchases, no account is required. However, creating an account lets you access your purchase history and saved letters from your dashboard.',
  },
  {
    question: 'How quickly can I get my letter?',
    answer: 'Instantly! As soon as your payment is processed, you can download your letter immediately. There\'s no waiting—start your letter, fill in the details, pay, and download.',
  },
  {
    question: 'What if my dispute doesn\'t fit any template?',
    answer: 'With 500+ templates across 13 categories, we cover most consumer situations. Try our AI assistant to describe your issue, and it will recommend the closest match. The Edit Access option lets you customize any template to fit your specific needs.',
  },
];

// Product Schema
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Letter of Dispute - Professional Dispute Letter Templates",
  "description": "Create professional dispute and complaint letters in minutes. Pre-validated templates with correct legal tone and formatting.",
  "offers": [
    {
      "@type": "Offer",
      "name": "PDF Only",
      "price": "9.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "PDF + Edit Access",
      "price": "14.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  ]
};

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

const PricingPage = () => {
  const { pdfOnlyPrice, pdfEditablePrice, editUnlockPrice, formatPrice } = useSiteSettings();
  const options = getOptions(pdfOnlyPrice, pdfEditablePrice, formatPrice);

  return (
    <Layout>
      <SEOHead 
        title="Pricing - Simple Per-Letter Pricing | Letter of Dispute"
        description="Create professional dispute letters from $9.99. No hidden fees. Per-letter pricing with optional in-app editing."
        canonicalPath="/pricing"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-6">
              Pay per letter. No hidden fees, no surprises.
            </p>
            {/* Trust badges in hero */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                500+ Dispute Templates
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                Secure Payment via Stripe
              </span>
            </div>
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
                  className={`relative ${option.popular ? 'border-accent shadow-lg md:scale-105' : ''}`}
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
                      <Link to={option.href || '/#letters'}>
                        {option.cta}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Re-edit info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Need to edit after 30 days? Unlock editing access again for just <span className="font-semibold text-foreground">{formatPrice(editUnlockPrice)}</span>
            </p>
          </div>

          {/* Value Explanation */}
          <div className="mt-8 max-w-2xl mx-auto text-center">
            <div className="inline-block px-6 py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">What you're paying for:</span> Pre-validated letter templates, legal-safe phrasing, correct formatting, and the certainty that your letter won't hurt your case.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-muted/30">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {trustIndicators.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
              Why Letter of Dispute?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See how we compare to the alternatives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {comparisons.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-destructive" />
                      </div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {item.problems.map((problem, pIndex) => (
                        <li key={pIndex} className="flex items-start gap-2 text-sm">
                          <X className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{problem}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm">
                        <span className="font-medium text-success">Our solution: </span>
                        <span className="text-muted-foreground">{item.solution}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Resolve Your Dispute?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Create a professional letter in minutes. Most disputes are resolved at this stage.
            </p>
            <Button variant="accent" size="lg" asChild>
              <Link to="/#letters">
                Browse Letter Templates
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PricingPage;
