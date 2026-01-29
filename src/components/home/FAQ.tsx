import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is a dispute letter?',
    answer: 'A dispute letter is a formal, written communication that documents your complaint, states what went wrong, and requests a specific resolution. Unlike phone calls or casual emails, it creates an official record that companies take more seriously.',
  },
  {
    question: 'When do I need a dispute letter?',
    answer: "Any time informal attempts haven't worked. If you've called, emailed, or spoken to someone and nothing changed, a formal letter signals you're serious. They're especially important for: security deposit disputes, medical billing errors, insurance claim denials, refund requests, and any situation where you might need proof later.",
  },
  {
    question: 'How much does it cost?',
    answer: 'Our letters start at €9.99 for the basic version with professional formatting. For €19.99, you get jurisdiction-specific legal references that strengthen your case. The €29.99 Final Notice option includes escalation language and deadline enforcement. Each letter includes both PDF and editable DOCX formats.',
  },
  {
    question: 'How do I know which letter template to use?',
    answer: 'Browse our categories to find your situation. We have templates for housing disputes, travel compensation, refunds, medical billing, insurance claims, and more. Each template includes a description of when to use it. If you\'re unsure, our AI assistant can recommend the right template based on your situation.',
  },
  {
    question: 'Can I edit the letter after generating it?',
    answer: 'Yes! Every letter comes in an editable DOCX format that you can open in Microsoft Word, Google Docs, or any word processor. You can customize any part of the letter before sending it. We also provide a PDF version for your records.',
  },
  {
    question: 'What happens after I send a dispute letter?',
    answer: 'Most recipients respond within 7-30 days. A well-structured letter often resolves issues faster than informal complaints because it shows you understand the process. If the issue isn\'t resolved, your letter serves as evidence that you attempted to resolve it - which is often required before taking further action.',
  },
  {
    question: 'What if the company ignores my letter?',
    answer: 'Your letter creates a paper trail for escalation. Next steps typically include: filing with consumer protection agencies, credit card chargebacks (if applicable), small claims court, or regulatory complaints. Our Final Notice tier includes escalation language that references these options.',
  },
  {
    question: 'Do I need to print and mail the letter?',
    answer: 'It depends on the situation. For most consumer complaints, email is acceptable. However, for legal notices (like landlord disputes or formal demands), certified mail creates a stronger record. We recommend certified mail for disputes over €500 or where you may need court evidence.',
  },
  {
    question: "Can't I just call or email instead?",
    answer: 'You can, but calls leave no record and casual emails often go to the wrong department or get ignored. A formal letter is taken more seriously because it\'s documented, structured, and signals that you may escalate if ignored. Many consumer protection processes specifically require a written complaint.',
  },
  {
    question: 'Why should I use this instead of ChatGPT?',
    answer: "Generic AI tools are powerful but not built for formal disputes. They often use the wrong legal tone, mix jurisdictions, omit required elements like reference numbers or deadlines, and can generate misleading statements that weaken your claim. Results are inconsistent and require trial and error. Our letter templates remove those risks: each letter is pre-validated for a specific dispute type with controlled language, consistent structure, and appropriate escalation wording. You get predictable, professional results every time.",
  },
  {
    question: 'Is this legal advice?',
    answer: 'No. DisputeLetters provides document templates only and does not constitute legal advice. Our letters are professionally structured but are not reviewed by legal professionals. For complex legal matters, we recommend consulting a qualified attorney in your jurisdiction.',
  },
  {
    question: 'Can I use this for court or legal proceedings?',
    answer: 'Our letters can serve as evidence that you attempted to resolve a dispute before escalating. However, they are not legal filings. If you\'re preparing for court, consult a lawyer. Our letters are designed for the pre-legal resolution phase where most disputes are actually settled.',
  },
  {
    question: 'How quickly can I create a letter?',
    answer: 'Most users complete their letter in under 5 minutes. Simply select your letter type, answer a few questions about your situation, and your professionally formatted letter is ready to download.',
  },
  {
    question: 'What formats do I receive?',
    answer: 'You receive your letter as an editable document (DOCX format) and a PDF. This allows you to make any final adjustments before sending. You can also copy the text directly for email.',
  },
  {
    question: 'Are the templates updated for current laws?',
    answer: 'Yes. Our templates are reviewed regularly to reflect current consumer protection regulations. We include jurisdiction-specific legal references for the UK, EU, and US in our upgraded tiers.',
  },
  {
    question: 'Will my letter guarantee results?',
    answer: 'No document can guarantee a specific outcome. However, professionally structured letters often receive faster and more serious responses from companies and individuals. Clear, well-documented communication is always more effective than informal complaints.',
  },
  {
    question: 'Can I use this for any country?',
    answer: 'Our templates are designed to be jurisdiction-agnostic at their core, but we offer optional legal reference add-ons for EU, UK, and US contexts. The upgraded versions include region-specific phrasing approved by our content team.',
  },
  {
    question: 'Is my information secure?',
    answer: 'Yes. We do not store your personal information after your letter is generated. Your data is used only to populate the letter template and is not retained on our servers.',
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

const FAQ = () => {
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
