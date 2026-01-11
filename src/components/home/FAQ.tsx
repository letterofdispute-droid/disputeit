import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
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
