import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const FAQ = () => {
  const { pdfOnlyPrice, pdfEditablePrice, editUnlockPrice, formatPrice } = useSiteSettings();

  const faqs = [
    {
      question: 'What is a dispute letter?',
      answer: 'A dispute letter is a formal, written communication that documents your complaint, states what went wrong, and requests a specific resolution. Unlike phone calls or casual emails, it creates an official record that companies take more seriously.',
    },
    {
      question: 'When do I need a dispute letter?',
      answer: "Any time informal attempts haven't worked. If you've called, emailed, or spoken to someone and nothing changed, a formal letter signals you're serious. They're especially important for security deposit disputes, medical billing errors, insurance claim denials, refund requests, and any situation where you might need proof later.",
    },
    {
      question: 'How much does it cost?',
      answer: `Our AI Dispute Assistant and research tools are completely free. Professional letters start at ${formatPrice(pdfOnlyPrice)} for a PDF download, ready to send. For ${formatPrice(pdfEditablePrice)}, you get PDF plus 30 days of in-app editing so you can refine your letter anytime. If your editing window expires, you can unlock it again for ${formatPrice(editUnlockPrice)}.`,
    },
    {
      question: 'What free tools do you offer?',
      answer: 'We provide a full suite of free consumer tools: the AI Dispute Assistant (guided intake that recommends the right letter), State Consumer Rights Lookup (statutes and attorney general contacts for every US state), Statute of Limitations Calculator, Small Claims Court Guide (with filing cost calculator, demand letter cost breakdown, and escalation flowchart), AI Letter Strength Analyzer (scores your draft with improvement tips), and a Consumer News Hub with updates from the FTC, CFPB, and NHTSA.',
    },
    {
      question: 'What is the AI Dispute Assistant?',
      answer: 'Our AI Dispute Assistant walks you through a simple 4-step intake: select your category, describe the context, provide key dates, and explain what happened. It then recommends the best matching template from our 550+ library and pre-fills the letter form with your details, so you can generate your letter in minutes.',
    },
    {
      question: 'Can I edit the letter after generating it?',
      answer: `With the PDF + Edit Access option (${formatPrice(pdfEditablePrice)}), you get 30 days of in-app editing. Make unlimited changes, export updated PDFs anytime, and use our AI-powered form assistance. The PDF Only option (${formatPrice(pdfOnlyPrice)}) provides a ready-to-send PDF download.`,
    },
    {
      question: 'How quickly can I create a letter?',
      answer: 'Most users complete their letter in under 5 minutes. You can start with the AI Dispute Assistant for a guided experience, or browse templates directly. Answer a few questions about your situation, and your professionally formatted letter is ready to download.',
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
      question: 'Do I need to print and mail the letter?',
      answer: 'It depends on the situation. For most consumer complaints, email is acceptable. However, for legal notices (like landlord disputes or formal demands), certified mail creates a stronger record. We recommend certified mail for disputes over $500 or where you may need court evidence.',
    },
    {
      question: 'Why should I use this instead of ChatGPT?',
      answer: "Generic AI tools are powerful but not built for formal disputes. They often use the wrong legal tone, mix jurisdictions, omit required elements like reference numbers or deadlines, and can generate misleading statements that weaken your claim. Our 550+ letter templates are pre-validated for specific dispute types with controlled language, consistent structure, and appropriate escalation wording. You get predictable, professional results every time.",
    },
    {
      question: 'Is this legal advice?',
      answer: 'No. Letter of Dispute provides AI-generated letter templates with editorial oversight. We are not a law firm, do not provide legal advice, and have no affiliation with any government agency or regulatory body (including the FTC, CFPB, or state attorneys general). Our templates are starting points that you customize for your situation. For complex legal matters, we recommend consulting a qualified attorney in your jurisdiction.',
    },
  ];

  // Generate FAQ Schema for SEO
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

  return (
    <section id="faq" className="py-16 md:py-24 bg-secondary/30">
      {/* JSON-LD Schema for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div className="container-narrow">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about creating your dispute letter.
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} id={`faq-${index}`}>
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
