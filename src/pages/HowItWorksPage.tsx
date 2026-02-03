import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Search, 
  FileEdit, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Shield,
  Scale,
  FileCheck,
  AlertCircle,
  Gavel,
  CreditCard,
  Phone
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Choose Your Letter Type',
    icon: Search,
    description: 'Browse our library of 400+ professionally crafted dispute letter templates. Each template is designed for a specific situation—from refund requests to landlord disputes.',
    tips: [
      'Use our category filters to narrow down options',
      'Each template includes a description of when to use it',
      'Not sure? Try our AI assistant to find the right match',
    ],
  },
  {
    number: '02',
    title: 'Fill in Your Details',
    icon: FileEdit,
    description: 'Answer simple questions about your situation. Our smart forms guide you through exactly what information you need—no legal knowledge required.',
    tips: [
      'Have your receipts, contracts, or order numbers ready',
      'Include specific dates and amounts when asked',
      'Be factual—we\'ll handle the professional tone',
    ],
  },
  {
    number: '03',
    title: 'Generate Your Letter',
    icon: FileText,
    description: 'Your personalized dispute letter is created instantly. Preview it, make any final adjustments, then download as PDF or editable Word document.',
    tips: [
      'Review the letter preview before purchasing',
      'PDF is ready to send immediately',
      'Word format lets you make additional edits',
    ],
  },
  {
    number: '04',
    title: 'Send and Get Results',
    icon: Send,
    description: 'Send your letter via email or certified mail. Most businesses respond within 7-14 days. Your professional letter creates an official paper trail.',
    tips: [
      'Certified mail provides proof of delivery',
      'Email is faster but keep a copy for records',
      'Follow up if you don\'t hear back within 14 days',
    ],
  },
];

const effectiveness = [
  {
    icon: Shield,
    title: 'Pre-Validated Templates',
    description: 'Unlike generic AI output, our templates are researched and validated for each specific dispute type. We include the right legal references and consumer protection citations.',
  },
  {
    icon: Scale,
    title: 'Correct Legal Tone',
    description: 'Our letters strike the perfect balance—assertive but not threatening, professional but not weak. This tone is proven to get better response rates.',
  },
  {
    icon: Clock,
    title: 'Strategic Deadlines',
    description: 'Each letter includes appropriate response deadlines based on the type of dispute and relevant regulations. This creates urgency without being unreasonable.',
  },
  {
    icon: FileCheck,
    title: 'Documentation Trail',
    description: 'Your letter creates an official record of your complaint. This becomes crucial evidence if you need to escalate to chargebacks, regulatory complaints, or small claims court.',
  },
];

const afterSending = [
  {
    icon: Clock,
    title: 'Typical Response Times',
    description: 'Most businesses respond within 7-14 business days. Larger companies may take up to 30 days. If your letter includes a specific deadline, expect a response before that date.',
  },
  {
    icon: CheckCircle2,
    title: 'If They Respond Positively',
    description: 'Great! Most disputes are resolved at this stage. Make sure to get any agreement in writing, keep copies of all correspondence, and verify refunds or credits actually appear.',
  },
  {
    icon: AlertCircle,
    title: 'If They Don\'t Respond',
    description: 'Send a follow-up letter referencing your original. If still no response, you have strong documentation to escalate further.',
  },
];

const escalationOptions = [
  {
    icon: CreditCard,
    title: 'Credit Card Chargeback',
    description: 'If you paid by card, your dispute letter serves as documentation for a chargeback claim with your bank.',
  },
  {
    icon: Phone,
    title: 'Regulatory Complaints',
    description: 'File complaints with the FTC, CFPB, or your state attorney general. Your letter proves you attempted to resolve directly.',
  },
  {
    icon: Gavel,
    title: 'Small Claims Court',
    description: 'For amounts under $10,000 (varies by state), small claims is affordable and doesn\'t require a lawyer. Your letter trail is key evidence.',
  },
];

const faqs = [
  {
    question: 'How long does it take to create a letter?',
    answer: 'Most letters take 5-10 minutes to complete. Simply choose your template, fill in the details about your situation, and your letter is generated instantly. You can preview it before purchasing.',
  },
  {
    question: 'Do I need to mail the letter, or can I email it?',
    answer: 'Both work! Email is faster and creates a digital paper trail. Certified mail provides proof of delivery, which can be important for legal escalation. For serious disputes over significant amounts, we recommend certified mail.',
  },
  {
    question: 'What if my situation isn\'t covered by a template?',
    answer: 'With 400+ templates across 13 categories, we cover most consumer disputes. Try our AI assistant to describe your situation—it will recommend the closest match. If nothing fits, our PDF + Editable option lets you customize any template.',
  },
  {
    question: 'Can I customize the letter after generating it?',
    answer: 'Yes! The PDF + Editable ($9.99) option includes a Word document you can modify. This is perfect if you need to add specific details or adjust the language for your situation.',
  },
  {
    question: 'Are these letters legally binding?',
    answer: 'Our letters are formal demand letters, not legal contracts. They document your complaint professionally and establish a paper trail. While they carry weight, they don\'t compel a response—but they significantly increase your chances of resolution.',
  },
  {
    question: 'What makes these better than writing my own letter?',
    answer: 'Our templates include correct legal references, proper formatting, strategic deadlines, and professional language that gets results. They\'re designed to be taken seriously without sounding aggressive or making legal missteps that could hurt your case.',
  },
];

// JSON-LD Schema for HowTo
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Create a Professional Dispute Letter",
  "description": "Create legally-sound dispute letters in minutes with DisputeLetters. Our step-by-step process guides you from selecting the right template to sending your letter.",
  "totalTime": "PT10M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "5.99"
  },
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Choose Your Letter Type",
      "text": "Browse 400+ professionally crafted dispute letter templates organized by category. Use filters or the AI assistant to find the perfect match for your situation."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Fill in Your Details",
      "text": "Answer simple questions about your situation. Our smart forms guide you through exactly what information you need—no legal knowledge required."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Generate Your Letter",
      "text": "Your personalized dispute letter is created instantly. Preview it, then download as PDF or editable Word document."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Send and Get Results",
      "text": "Send your letter via email or certified mail. Most businesses respond within 7-14 days."
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

const HowItWorksPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="How It Works - Create Dispute Letters in Minutes | DisputeLetters"
        description="Learn how DisputeLetters helps you create professional dispute letters in minutes. Our 4-step process guides you from choosing a template to sending your letter and getting results."
        canonicalPath="/how-it-works"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              How DisputeLetters Works
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
              Create professional dispute letters in minutes—not hours. No legal expertise needed. 
              Our guided process helps you write letters that businesses take seriously.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="accent" size="lg" asChild>
                <Link to="/#letters">
                  Start Your Letter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Four Simple Steps to Your Letter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process gets you from dispute to resolution as quickly as possible.
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 1;
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className={`p-0 flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                    {/* Content Side */}
                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-foreground mb-3">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {step.description}
                      </p>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium text-foreground mb-2">Pro Tips:</p>
                        <ul className="space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Makes Letters Effective */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Makes Our Letters Effective
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlike generic templates or AI-generated letters, ours are specifically designed to get results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {effectiveness.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* After You Send */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              After You Send Your Letter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              What to expect and how to handle different outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {afterSending.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Escalation Options */}
          <div className="bg-muted/50 rounded-xl p-6 md:p-8">
            <h3 className="font-serif text-xl font-bold text-foreground mb-6 text-center">
              Need to Escalate? Your Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {escalationOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{option.title}</h4>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

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
      <section className="py-16 md:py-24 bg-primary">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Create Your Letter?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of consumers who've successfully resolved disputes with our professional letters.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="accent" size="lg" asChild>
                <Link to="/#letters">
                  Browse Letter Templates
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorksPage;
