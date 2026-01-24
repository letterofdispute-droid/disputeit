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
    answer: 'Any time informal attempts haven\'t worked. If you\'ve called, emailed, or spoken to someone and nothing changed, a formal letter signals you\'re serious. They\'re especially important for: security deposit disputes, medical billing errors, insurance claim denials, refund requests, and any situation where you might need proof later.',
  },
  {
    question: 'What happens after I send a dispute letter?',
    answer: 'Most recipients respond within 7-30 days. A well-structured letter often resolves issues faster than informal complaints because it shows you understand the process. If the issue isn\'t resolved, your letter serves as evidence that you attempted to resolve it - which is often required before taking further action.',
  },
  {
    question: 'Can\'t I just call or email instead?',
    answer: 'You can, but calls leave no record and casual emails often go to the wrong department or get ignored. A formal letter is taken more seriously because it\'s documented, structured, and signals that you may escalate if ignored. Many consumer protection processes specifically require a written complaint.',
  },
  {
    question: 'Why should I use this instead of ChatGPT?',
    answer: 'Generic AI tools are powerful but not built for formal disputes. They often use the wrong legal tone, mix jurisdictions, omit required elements like reference numbers or deadlines, and can generate misleading statements that weaken your claim. Results are inconsistent and require trial and error. Our letter builders remove those risks: each letter is pre-validated for a specific dispute type with controlled language, consistent structure, and appropriate escalation wording. You get predictable, professional results every time.',
  },
  {
    question: 'Is this legal advice?',
    answer: 'No. DisputeLetters provides document templates only and does not constitute legal advice. Our letters are professionally structured but are not reviewed by legal professionals. For complex legal matters, we recommend consulting a qualified attorney in your jurisdiction.',
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

const FAQ = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
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
            <AccordionItem key={index} value={`item-${index}`}>
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
