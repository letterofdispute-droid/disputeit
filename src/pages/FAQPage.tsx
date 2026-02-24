import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowRight, HelpCircle, FileText, CreditCard, Send, Shield, Wrench } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const FAQPage = () => {
  const { pdfOnlyPrice, pdfEditablePrice, editUnlockPrice, formatPrice } = useSiteSettings();

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: FileText,
      faqs: [
        {
          question: 'What is a dispute letter?',
          answer: 'A dispute letter is a formal, written communication that documents your complaint, states what went wrong, and requests a specific resolution. Unlike phone calls or casual emails, it creates an official record that companies take more seriously.',
        },
        {
          question: 'When do I need a dispute letter?',
          answer: "Any time informal attempts haven't worked. If you've called, emailed, or spoken to someone and nothing changed, a formal letter signals you're serious. They're especially important for security deposit disputes, medical billing errors, insurance claim denials, refund requests, and any situation where you might need proof later.",
        },
        {
          question: 'How do I know which letter template to use?',
          answer: 'Browse our categories to find your situation, or use the AI Dispute Assistant to describe your problem and get a personalized recommendation. We have 550+ templates across 13 categories covering housing, insurance, employment, vehicles, financial disputes, and more.',
        },
        {
          question: 'What is the AI Dispute Assistant?',
          answer: 'Our AI Dispute Assistant walks you through a simple 4-step intake: select your category, describe the context, provide key dates, and explain what happened. It then recommends the best matching template from our 550+ library and pre-fills the letter form with your details, so you can generate your letter in minutes.',
        },
        {
          question: "What if my situation isn't covered by a template?",
          answer: `With 550+ templates across 13 categories, we cover most consumer disputes. Try our AI Dispute Assistant to describe your situation and it will recommend the closest match. The PDF + Edit Access option (${formatPrice(pdfEditablePrice)}) lets you customize any template with 30 days of in-app editing.`,
        },
      ],
    },
    {
      id: 'free-tools',
      title: 'Free Tools',
      icon: Wrench,
      faqs: [
        {
          question: 'What free tools do you offer?',
          answer: 'We provide a full suite of free consumer tools: the AI Dispute Assistant (guided intake that recommends the right letter), State Consumer Rights Lookup (statutes and attorney general contacts for every US state), Statute of Limitations Calculator, Small Claims Court Guide (with filing cost calculator, demand letter cost breakdown, and escalation flowchart), AI Letter Strength Analyzer (scores your draft with improvement tips), and a Consumer News Hub with updates from the FTC, CFPB, and NHTSA.',
        },
        {
          question: 'What is the Small Claims Court Guide?',
          answer: 'Our Small Claims Court Guide is a free, interactive resource covering all 50 US states. It includes filing limits, court fees, and step-by-step filing instructions. You also get a Cost Calculator to estimate total expenses, a Demand Letter Cost breakdown, and an Escalation Flowchart showing when and how to escalate from a dispute letter to formal legal action.',
        },
        {
          question: 'How does the State Consumer Rights Lookup work?',
          answer: 'Select any US state to see its consumer protection statutes, filing deadlines, and direct contact information for the state attorney general and consumer protection office. All data is sourced from verified legal databases and updated regularly.',
        },
        {
          question: 'What is the Letter Strength Analyzer?',
          answer: 'The Letter Strength Analyzer is a free tool that scores your dispute letter draft on tone, completeness, legal references, and persuasiveness. It provides specific improvement suggestions to make your letter more effective before you send it. You can analyze up to 3 letters per day.',
        },
      ],
    },
    {
      id: 'creating-letters',
      title: 'Creating Letters',
      icon: HelpCircle,
      faqs: [
        {
          question: 'How long does it take to create a letter?',
          answer: 'Most letters take under 5 minutes to complete. You can start with the AI Dispute Assistant for a guided experience, or browse templates directly. Fill in the details about your situation, and your letter is generated instantly. You can preview it before purchasing.',
        },
        {
          question: 'Can I edit the letter after generating it?',
          answer: `With the PDF + Edit Access option (${formatPrice(pdfEditablePrice)}), you get 30 days of in-app editing. Make unlimited changes, export updated PDFs anytime, and use our AI-powered form assistance. If your editing window expires, you can unlock it again for ${formatPrice(editUnlockPrice)}.`,
        },
        {
          question: 'What formats do I receive?',
          answer: `The PDF Only option (${formatPrice(pdfOnlyPrice)}) gives you a professionally formatted PDF ready to send or email. The PDF + Edit Access option (${formatPrice(pdfEditablePrice)}) adds 30 days of in-app editing so you can refine your letter and export updated PDFs anytime.`,
        },
        {
          question: 'What makes these better than writing my own letter?',
          answer: "Our templates include correct legal references, proper formatting, strategic deadlines, and professional language that gets results. They're designed to be taken seriously without sounding aggressive or making legal missteps that could hurt your case.",
        },
      ],
    },
    {
      id: 'sending-letters',
      title: 'Sending Your Letter',
      icon: Send,
      faqs: [
        {
          question: 'Do I need to mail the letter, or can I email it?',
          answer: 'Both work! Email is faster and creates a digital paper trail. Certified mail provides proof of delivery, which can be important for legal escalation. For serious disputes over $500, we recommend certified mail.',
        },
        {
          question: 'What happens after I send a dispute letter?',
          answer: "Most recipients respond within 7-30 days. A well-structured letter often resolves issues faster than informal complaints because it shows you understand the process. If the issue isn't resolved, your letter serves as evidence that you attempted to resolve it, which is often required before taking further action.",
        },
        {
          question: 'What if the company ignores my letter?',
          answer: 'Your letter creates a paper trail for escalation. Next steps typically include filing with consumer protection agencies, credit card chargebacks (if applicable), small claims court, or regulatory complaints. Our free Small Claims Court Guide walks you through filing limits, fees, and the escalation process for every US state.',
        },
        {
          question: "Can't I just call or email instead?",
          answer: "You can, but calls leave no record and casual emails often go to the wrong department or get ignored. A formal letter is taken more seriously because it's documented, structured, and signals that you may escalate if ignored. Many consumer protection processes specifically require a written complaint.",
        },
      ],
    },
    {
      id: 'pricing-payment',
      title: 'Pricing & Payment',
      icon: CreditCard,
      faqs: [
        {
          question: 'How much does it cost?',
          answer: `Our AI Dispute Assistant and all research tools are completely free. Professional letters start at ${formatPrice(pdfOnlyPrice)} for a PDF download, ready to send. For ${formatPrice(pdfEditablePrice)}, you get PDF plus 30 days of in-app editing so you can refine your letter anytime.`,
        },
        {
          question: "What's the difference between PDF Only and PDF + Edit Access?",
          answer: `PDF Only (${formatPrice(pdfOnlyPrice)}) gives you a ready-to-send professional letter as a PDF download with evidence photos attached. PDF + Edit Access (${formatPrice(pdfEditablePrice)}) adds 30 days of in-app editing, unlimited changes, AI-powered form assistance, and the ability to export updated PDFs anytime.`,
        },
        {
          question: "Can I get a refund if I'm not satisfied?",
          answer: "If you experience a technical issue with your letter, please contact us at support@letterofdispute.com and we'll work to resolve it promptly.",
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely. We use Stripe for payment processing, which is PCI-compliant and used by millions of businesses worldwide. Your payment information is never stored on our servers.',
        },
        {
          question: 'How quickly can I get my letter?',
          answer: "Instantly! As soon as your payment is processed, you can download your letter immediately. There's no waiting. Start your letter, fill in the details, pay, and download.",
        },
      ],
    },
    {
      id: 'legal-privacy',
      title: 'Legal & Privacy',
      icon: Shield,
      faqs: [
        {
          question: 'Are these letters legally binding?',
          answer: "Our letters are formal demand letters, not legal contracts. They document your complaint professionally and establish a paper trail. While they carry weight, they don't compel a response, but they significantly increase your chances of resolution.",
        },
        {
          question: 'Is this legal advice?',
          answer: 'No. Letter of Dispute provides AI-generated letter templates with editorial oversight. We are not a law firm, do not provide legal advice, and have no affiliation with any government agency or regulatory body (including the FTC, CFPB, or state attorneys general). Our templates are starting points that you customize for your situation. For complex legal matters, we recommend consulting a qualified attorney in your jurisdiction.',
        },
        {
          question: 'Can I use this for court or legal proceedings?',
          answer: "Our letters can serve as evidence that you attempted to resolve a dispute before escalating. However, they are not legal filings. If you're preparing for court, consult a lawyer. Our letters are designed for the pre-legal resolution phase where most disputes are actually settled.",
        },
        {
          question: 'Are the templates updated for current laws?',
          answer: 'Yes. Our templates are reviewed regularly to reflect current US consumer protection regulations. We include jurisdiction-specific legal references citing relevant federal and state statutes.',
        },
        {
          question: 'Is my information secure?',
          answer: 'Yes. Your data is processed by AI systems only to generate your letter. We do not use your information to train AI models. Uploaded evidence files are encrypted and automatically deleted after 90 days.',
        },
        {
          question: 'Will my letter guarantee results?',
          answer: 'No document can guarantee a specific outcome. However, professionally structured letters often receive faster and more serious responses from companies and individuals. Clear, well-documented communication is always more effective than informal complaints.',
        },
      ],
    },
    {
      id: 'alternatives',
      title: 'Comparing Alternatives',
      icon: HelpCircle,
      faqs: [
        {
          question: 'Why should I use this instead of ChatGPT?',
          answer: "Generic AI tools are powerful but not built for formal disputes. They often use the wrong legal tone, mix jurisdictions, omit required elements like reference numbers or deadlines, and can generate misleading statements that weaken your claim. Our 550+ letter templates are pre-validated for specific dispute types with controlled language, consistent structure, and appropriate escalation wording. You get predictable, professional results every time.",
        },
        {
          question: 'Why not hire a lawyer instead?',
          answer: "Lawyer consultation fees typically start at $150-300 per hour, and most straightforward consumer disputes don't require legal representation. For standard refund requests, landlord issues, or billing disputes, a well-written demand letter is often all you need. Save the lawyer for complex cases where legal expertise is truly necessary.",
        },
        {
          question: 'What if I just ignore the issue?',
          answer: "Ignoring issues means losing money you're owed, allowing bad actors to face no consequences, and potentially letting the problem escalate or repeat. Statutes of limitations may also expire. A formal letter often gets results where casual complaints fail. Most issues are resolved at this stage.",
        },
      ],
    },
  ];

  // Flatten all FAQs for schema
  const allFaqs = faqCategories.flatMap(cat => cat.faqs);

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Layout>
      <SEOHead 
        title="FAQ - Frequently Asked Questions | Letter of Dispute"
        description="Find answers to common questions about creating AI-powered dispute letters, pricing, free tools, the AI Dispute Assistant, and more. Get help with your consumer disputes."
        canonicalPath="/faq"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80">
              Everything you need to know about creating and sending dispute letters.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 bg-muted/30 border-b">
        <div className="container-wide">
          <div className="flex flex-wrap justify-center gap-3">
            {faqCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="px-4 py-2 text-sm font-medium rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
              >
                {category.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-wide max-w-4xl">
          <div className="space-y-16">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} id={category.id} className="scroll-mt-24">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      {category.title}
                    </h2>
                  </div>

                  {/* FAQ Accordion */}
                  <Accordion type="single" collapsible className="space-y-3">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.id}-${index}`}
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="default" asChild>
                <Link to="/contact">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/how-it-works">
                  Learn How It Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Create Your Letter?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Browse 550+ templates and resolve your dispute today.
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

export default FAQPage;
