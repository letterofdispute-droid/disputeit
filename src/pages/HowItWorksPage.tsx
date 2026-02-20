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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  ClipboardList, 
  FileText, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Shield,
  Scale,
  FileCheck,
  AlertCircle,
  Gavel,
  CreditCard,
  Phone,
  AlertTriangle,
  Info,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Describe Your Dispute',
    icon: MessageSquare,
    description: 'Tell our AI what happened. Answer a few guided questions — no legal jargon required. The AI identifies the right dispute type and recommended approach in seconds.',
    tips: [
      'Have key dates and amounts ready before starting',
      'Be factual — describe what happened, not what you want',
      'You can type freely; the AI will extract what matters',
    ],
  },
  {
    number: '02',
    title: 'Get Your Resolution Plan',
    icon: ClipboardList,
    description: 'Receive a structured plan: the right letter type, relevant agency links (CFPB, FTC, State AG), chargeback guidance if you paid by card, and statutory deadlines for your dispute category.',
    tips: [
      'The plan is informational — not legal advice',
      'Agency links are suggestions; we are not affiliated with any government body',
      'Escalation paths shown are options, not guarantees',
    ],
  },
  {
    number: '03',
    title: 'Generate Your Letter',
    icon: FileText,
    description: 'Your letter is assembled with appropriate formal language, relevant consumer law references for your state, and a professional tone designed to be taken seriously. Review it carefully before sending.',
    tips: [
      'Review all details carefully before downloading',
      'Customize any field that doesn\'t match your situation',
      'We are not a law firm — for complex matters, consult a licensed attorney',
    ],
  },
  {
    number: '04',
    title: 'Track Until Resolved',
    icon: BarChart2,
    description: 'Log your dispute in the tracker. Check off steps as you go. If the letter doesn\'t resolve the issue, your documented record supports escalation to agencies or small claims court.',
    tips: [
      'Outcomes are not guaranteed',
      'Track your correspondence dates carefully',
      'Update the tracker if you need to escalate',
    ],
  },
];

const whatWeProvide = [
  {
    icon: Shield,
    title: 'Structured Templates',
    description: 'Our templates are designed for specific dispute types and include relevant consumer law references. They provide a starting framework — you are responsible for reviewing and customising for your situation.',
  },
  {
    icon: Scale,
    title: 'Professional Tone',
    description: 'Our letters use formal language designed to communicate professionally. Tone alone does not guarantee any response or outcome from the recipient.',
  },
  {
    icon: Clock,
    title: 'Statutory References',
    description: 'Each letter may include reference to applicable response deadlines based on common dispute frameworks. These are informational — not legal determinations.',
  },
  {
    icon: FileCheck,
    title: 'Documentation Record',
    description: 'Your letter creates a written record of your complaint. This may support escalation to chargebacks, regulatory complaints, or small claims court — but outcomes depend on many factors beyond our control.',
  },
];

const afterSending = [
  {
    icon: Clock,
    title: 'Typical Response Times',
    description: 'Many businesses respond within 7–14 business days. Larger companies may take up to 30 days. We cannot predict or guarantee any response.',
  },
  {
    icon: CheckCircle2,
    title: 'If They Respond Positively',
    description: 'Get any agreement in writing, keep copies of all correspondence, and verify that refunds or credits actually appear. We are not a party to any resolution.',
  },
  {
    icon: AlertCircle,
    title: 'If They Don\'t Respond',
    description: 'Send a follow-up letter referencing your original. If still no response, you have written documentation to support escalation. We are not responsible for recipient actions or inaction.',
  },
];

const escalationOptions = [
  {
    icon: CreditCard,
    title: 'Credit Card Chargeback',
    description: 'If you paid by card, your dispute letter may serve as supporting documentation for a chargeback claim with your bank. Contact your card issuer directly.',
  },
  {
    icon: Phone,
    title: 'Regulatory Complaints',
    description: 'You may file complaints with the FTC, CFPB, or your state attorney general. We are not affiliated with these bodies. Your letter shows you attempted direct resolution.',
  },
  {
    icon: Gavel,
    title: 'Small Claims Court',
    description: 'For eligible amounts (varies by state), small claims is an option that does not require a lawyer. Your written record may serve as evidence — consult your local court for requirements.',
  },
];

const faqs = [
  {
    question: 'How long does it take to create a letter?',
    answer: 'Most letters take 5–10 minutes to complete. Describe your dispute in the AI intake, receive your Resolution Plan, fill in the letter form, and your letter is generated instantly. You can preview it before purchasing.',
  },
  {
    question: 'Do I need to mail the letter, or can I email it?',
    answer: 'Both options are available. Email is faster and creates a digital record. Certified mail provides proof of delivery, which may be useful if you need to escalate. For significant disputes, we suggest certified mail — but this is your decision.',
  },
  {
    question: 'What if my situation isn\'t covered by a template?',
    answer: 'With 500+ templates across 13 categories, we cover most common consumer disputes. Use the AI assistant to describe your situation — it will recommend the closest match. If nothing fits well, the PDF + Edit Access option lets you customise any template in our online editor for 30 days.',
  },
  {
    question: 'Can I customise the letter after generating it?',
    answer: 'Yes. The PDF + Edit Access option includes 30 days of in-app editing. Make changes at any time, then export to PDF when you\'re ready. You are responsible for reviewing the final content before sending.',
  },
  {
    question: 'Do you guarantee my dispute will be resolved?',
    answer: 'No. We make no guarantees about the outcome of any dispute. Whether a recipient responds, offers a refund, or takes any action depends on factors entirely outside our control — including their policies, applicable law, and the specific facts of your situation. Our service provides a communication tool, not a legal remedy.',
  },
  {
    question: 'Are these letters legally binding?',
    answer: 'Our letters are formal written communications — not legal contracts and not attorney-drafted documents. They are not reviewed by licensed attorneys. While a professional written letter may carry more weight than an informal complaint, we cannot guarantee any legal effect or recipient response. For matters with significant legal implications, consult a licensed attorney in your jurisdiction.',
  },
  {
    question: 'What makes these better than writing my own letter?',
    answer: 'Our templates provide a structured starting point with consumer law references, professional formatting, and appropriate tone for common dispute types. They may help you communicate more effectively — but we cannot guarantee they will produce better outcomes than a letter you write yourself. Results vary by situation.',
  },
  {
    question: 'What if the company ignores my letter?',
    answer: 'We are not responsible for how recipients respond to your letter. If there is no response, your written record may support escalation to a credit card chargeback, a regulatory complaint (FTC, CFPB, State AG), or small claims court — but outcomes depend on the specifics of your case. We recommend consulting a licensed attorney if significant amounts are at stake.',
  },
];

// JSON-LD Schema for HowTo — matches Dispute OS flow
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Create a Professional Dispute Letter with Letter of Dispute",
  "description": "Use Letter of Dispute's AI-guided Dispute OS flow to describe your issue, receive a resolution plan, generate a professional letter, and track your dispute to resolution.",
  "totalTime": "PT10M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "9.99"
  },
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Describe Your Dispute",
      "text": "Answer a few guided questions about your situation using our AI intake flow. No legal jargon required. The AI identifies the right dispute type and recommended approach."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Get Your Resolution Plan",
      "text": "Receive a structured resolution plan including the right letter type, relevant agency links (CFPB, FTC, State AG), chargeback guidance, and statutory deadlines for your dispute category. The plan is informational only."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Generate Your Letter",
      "text": "Your letter is assembled with formal language and consumer law references for your state. Review all details carefully before downloading. Not attorney-reviewed."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Track Until Resolved",
      "text": "Log your dispute in the tracker and check off resolution steps. Your documented record supports escalation if needed. Outcomes are not guaranteed."
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
        title="How It Works - AI Dispute Assistant | Letter of Dispute"
        description="Learn how Letter of Dispute's AI-guided Dispute OS flow helps you describe your issue, get a resolution plan, generate a professional letter, and track your dispute. Not legal advice."
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
              How Letter of Dispute Works
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
              Our AI-guided Dispute OS takes you from describing your issue to a professional dispute letter — in minutes. 
              No legal expertise needed.
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
              Four Steps to Your Dispute Letter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined Dispute OS guides you from describing your issue to a written record — as efficiently as possible.
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 1;
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className={`p-0 flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
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
                        <p className="text-sm font-medium text-foreground mb-2">Tips:</p>
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

      {/* What Our Service Provides */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Service Provides
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our letters are designed to help you communicate professionally. They are not attorney-reviewed and do not constitute legal advice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {whatWeProvide.map((item, index) => {
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

          {/* Important Limitations Card */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <h3 className="font-semibold text-xl text-foreground">Important Limitations</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span><strong className="text-foreground">Not a law firm.</strong> We do not provide legal advice or representation.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span><strong className="text-foreground">No attorney review.</strong> Letters are AI-generated and not reviewed by licensed attorneys.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span><strong className="text-foreground">No guaranteed outcomes.</strong> We cannot predict or control how any recipient will respond.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-destructive font-bold mt-0.5">✕</span>
                  <span><strong className="text-foreground">Used at your own risk.</strong> You are solely responsible for the content you send.</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
              What to expect and how to handle different outcomes. We are not a party to your dispute.
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
            <h3 className="font-serif text-xl font-bold text-foreground mb-2 text-center">
              Need to Escalate? Your Options
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">These are independent options — Letter of Dispute is not affiliated with any of these bodies or processes.</p>
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

      {/* Legal Disclaimer Strip */}
      <section className="py-8 bg-muted border-y border-border">
        <div className="container-wide">
          <Alert className="border-border bg-background">
            <Info className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-sm text-muted-foreground ml-2">
              <strong className="text-foreground">Legal Notice:</strong> Letter of Dispute is not a law firm and does not provide legal advice. 
              All letters are AI-generated and are not reviewed by licensed attorneys. Use of this service does not create an attorney-client relationship. 
              We make no guarantees about dispute outcomes. Use at your own risk. For legal matters, consult a licensed attorney in your jurisdiction.
            </AlertDescription>
          </Alert>
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
              Used by thousands of consumers to communicate their disputes professionally. Start your intake — it only takes a few minutes.
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
