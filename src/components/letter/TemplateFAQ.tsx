import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LetterTemplate } from '@/data/letterTemplates';

interface TemplateFAQProps {
  template: LetterTemplate;
  categoryName: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// Category-specific FAQs
const getCategoryFAQs = (categoryId: string, templateTitle: string): FAQ[] => {
  const baseFAQs: FAQ[] = [
    {
      question: `How long should I wait before sending a ${templateTitle.toLowerCase()}?`,
      answer: 'We recommend attempting informal resolution first (phone call or email). If you don\'t receive a satisfactory response within 7-14 days, it\'s appropriate to send a formal dispute letter. For time-sensitive matters like insurance claims or travel compensation, send your letter as soon as possible while keeping records of all communication.',
    },
    {
      question: 'Should I send my letter by email or post?',
      answer: 'For disputes under €500, email is usually acceptable and faster. For larger amounts or situations where you may need court evidence, we recommend certified mail with delivery confirmation. This creates an official paper trail proving the recipient received your complaint.',
    },
  ];

  const categoryFAQs: Record<string, FAQ[]> = {
    housing: [
      {
        question: 'Can my landlord ignore my dispute letter?',
        answer: 'While landlords can choose not to respond, a formal letter creates legal documentation that you attempted resolution. Many jurisdictions require this before escalating to housing tribunals. If ignored, you can file with your local housing authority or tenant advocacy organization.',
      },
      {
        question: 'What if my landlord retaliates after I send a complaint?',
        answer: 'Retaliation (like eviction threats or refusing repairs) is illegal in most jurisdictions. Document everything and report to your local housing authority. Your dispute letter serves as evidence that any retaliatory action followed your legitimate complaint.',
      },
      {
        question: 'How much notice should I give for repair requests?',
        answer: 'For non-emergency repairs, give your landlord reasonable notice (typically 14-30 days depending on jurisdiction). For emergencies like heating failure or water leaks, immediate action is expected. Our letter templates include appropriate deadline language for each situation.',
      },
    ],
    travel: [
      {
        question: 'Am I entitled to compensation for a delayed flight?',
        answer: 'Under EU Regulation 261/2004, you may be entitled to €250-€600 for delays over 3 hours on EU flights or flights departing from the EU. The US has fewer protections, but airlines often offer vouchers. Our templates include the relevant legal references for your jurisdiction.',
      },
      {
        question: 'How long do airlines have to respond to compensation claims?',
        answer: 'Airlines typically respond within 30-60 days. If you don\'t hear back, send a follow-up letter (our Final Notice tier includes escalation language). After 8 weeks without resolution, you can escalate to national enforcement bodies or alternative dispute resolution services.',
      },
      {
        question: 'Can I claim for hotel and meal costs during a delay?',
        answer: 'Yes, airlines are generally required to provide care (meals, refreshments, accommodation) during long delays. If they didn\'t, you can claim reimbursement for reasonable expenses. Keep all receipts and include them with your dispute letter.',
      },
    ],
    insurance: [
      {
        question: 'What should I do if my insurance claim is denied?',
        answer: 'First, request a written explanation for the denial. Review your policy carefully to understand coverage. Our dispute letters help you formally challenge the decision, citing specific policy terms. If still denied, you can escalate to your insurance ombudsman or regulator.',
      },
      {
        question: 'How long do insurance companies have to process claims?',
        answer: 'Most jurisdictions require insurers to acknowledge claims within 15 days and make a decision within 30-45 days. If they\'re taking longer, our letters include language demanding timely processing and referencing regulatory requirements.',
      },
      {
        question: 'Can I dispute a claim settlement amount?',
        answer: 'Absolutely. If you believe the settlement is too low, you can challenge it with documentation (repair quotes, valuations, receipts). Our templates help you present a clear case for why you deserve more, including relevant policy language.',
      },
    ],
    contractors: [
      {
        question: 'What if my contractor won\'t fix their poor work?',
        answer: 'Document the defects with photos and any expert opinions. Our letters formally demand remediation within a reasonable timeframe (typically 14-30 days). If they refuse, you may have grounds for small claims court or licensing board complaints.',
      },
      {
        question: 'Can I withhold payment for incomplete work?',
        answer: 'You may be able to withhold a proportionate amount for incomplete or defective work, but check your contract terms. Our dispute letters help you communicate this clearly while protecting your legal position.',
      },
      {
        question: 'Should I report a contractor to their licensing board?',
        answer: 'For serious issues (unsafe work, fraud, abandonment), reporting to the licensing board is appropriate. Our Final Notice tier includes language referencing this escalation option, which often motivates contractors to resolve issues.',
      },
    ],
    'damaged-goods': [
      {
        question: 'How do I prove an item was damaged on delivery?',
        answer: 'Take photos immediately upon receipt, before unpacking fully. Note any damage on the delivery receipt if possible. Report to the seller within 48 hours. Our templates guide you through presenting this evidence effectively.',
      },
      {
        question: 'Am I entitled to a replacement or refund?',
        answer: 'Under consumer protection laws, you\'re generally entitled to a repair, replacement, or refund for faulty goods. The seller cannot force you to accept a repair if you prefer a refund for significantly defective items.',
      },
      {
        question: 'What if the seller blames the courier?',
        answer: 'Your contract is with the seller, not the courier. The seller is responsible for getting items to you in good condition. Our letters make this clear and demand resolution from the party you paid.',
      },
    ],
    refunds: [
      {
        question: 'How long do companies have to process refunds?',
        answer: 'Most consumer protection laws require refunds within 14 days of the return being received. For digital purchases or services, refunds should be processed within 14 days of the cancellation request.',
      },
      {
        question: 'Can a company refuse a refund?',
        answer: 'Companies cannot refuse refunds for faulty goods or services not delivered as described. For change-of-mind returns, policies vary by retailer and jurisdiction. Our templates cite the relevant consumer protection laws for your situation.',
      },
      {
        question: 'What if my refund was promised but never arrived?',
        answer: 'Document the refund promise (emails, chat logs, reference numbers). Our letters formally demand the refund with a deadline and reference the original commitment. Include your payment method details to facilitate processing.',
      },
    ],
    utilities: [
      {
        question: 'Can I dispute an unusually high utility bill?',
        answer: 'Yes, billing errors are common. Request a meter reading verification and compare with previous usage. Our templates help you formally challenge the bill and request a detailed breakdown of charges.',
      },
      {
        question: 'What if my utility company cuts service unfairly?',
        answer: 'Utility companies must follow specific procedures before disconnection, including notice periods and payment plan offers. Our letters help you challenge improper disconnection and demand service restoration.',
      },
      {
        question: 'How do I switch providers if I\'m in a dispute?',
        answer: 'You can usually switch providers even during a dispute, but the outstanding balance may follow you. Resolve billing disputes before switching when possible, or ensure the new provider won\'t inherit the disputed charges.',
      },
    ],
    vehicle: [
      {
        question: 'What is a lemon law and does it apply to my car?',
        answer: 'Lemon laws protect buyers of vehicles with substantial defects that can\'t be repaired after reasonable attempts. Coverage varies by jurisdiction but typically applies to new cars with repeated issues. Our templates include jurisdiction-specific lemon law references.',
      },
      {
        question: 'Can I dispute a garage repair bill?',
        answer: 'Yes, if the work was unauthorized, overcharged, or defective. Request an itemized invoice and compare with original estimates. Our letters help you challenge unreasonable charges and demand proper repairs.',
      },
      {
        question: 'What if a dealership misrepresented the vehicle?',
        answer: 'Misrepresentation (hiding accidents, mileage fraud, undisclosed defects) is grounds for rescission or compensation. Document the misrepresentation with evidence and use our templates to demand resolution.',
      },
    ],
    ecommerce: [
      {
        question: 'How do I get a refund from an online marketplace?',
        answer: 'Start by contacting the seller through the platform. If unresolved, escalate to the marketplace\'s buyer protection program. Our letters help you document the dispute for both the seller and platform.',
      },
      {
        question: 'What are my rights for digital purchases?',
        answer: 'Digital goods and services have specific consumer protections. You may have 14 days to cancel (cooling-off period), and faulty digital content must be repaired or refunded. Our templates cover digital-specific scenarios.',
      },
      {
        question: 'Can I do a credit card chargeback?',
        answer: 'Yes, if you\'ve tried resolving with the merchant first. Chargebacks are typically available for 120 days from purchase. Our Final Notice tier includes language warning sellers of this escalation option.',
      },
    ],
    employment: [
      {
        question: 'Can I dispute unpaid wages?',
        answer: 'Absolutely. Employers are legally required to pay agreed wages on time. Document hours worked and payments received. Our letters formally demand payment and reference wage theft protections in your jurisdiction.',
      },
      {
        question: 'What if I was wrongfully terminated?',
        answer: 'Document everything: termination notice, performance reviews, any discriminatory comments. Our templates help you formally challenge the termination and request proper severance or reinstatement.',
      },
      {
        question: 'How do I request my personnel file?',
        answer: 'Many jurisdictions give employees the right to access their personnel files. Our letters formally request this access, which can be crucial for wrongful termination or discrimination claims.',
      },
    ],
    financial: [
      {
        question: 'How do I dispute an error on my credit report?',
        answer: 'You have the legal right to dispute inaccurate information. Credit bureaus must investigate within 30 days. Our templates are designed to meet the formal requirements for credit bureau disputes.',
      },
      {
        question: 'What if a debt collector is harassing me?',
        answer: 'Debt collectors must follow strict rules about contact times, truthfulness, and harassment. Our letters assert your rights and demand they cease improper collection practices.',
      },
      {
        question: 'Can I dispute bank fees?',
        answer: 'Yes, many fees are negotiable or disputable, especially if caused by bank error. Our templates help you formally request fee reversals and cite consumer banking regulations.',
      },
    ],
    healthcare: [
      {
        question: 'How do I dispute a medical bill?',
        answer: 'Request an itemized bill and compare with your insurance explanation of benefits. Errors are common. Our templates help you formally challenge incorrect charges and request proper billing codes.',
      },
      {
        question: 'What if my insurance denied a medical claim?',
        answer: 'You have the right to appeal. Request the denial in writing with specific reasons. Our letters help you formally appeal, citing medical necessity and relevant policy coverage.',
      },
      {
        question: 'Can I negotiate medical debt?',
        answer: 'Yes, many providers offer payment plans or discounts for financial hardship. Our templates help you formally request reduced payments or settlements while documenting your efforts.',
      },
    ],
    hoa: [
      {
        question: 'Can I dispute an HOA fine?',
        answer: 'Yes, most HOAs have formal appeal processes. Review your CC&Rs and request a hearing. Our letters help you formally challenge fines, especially if notice was improper or the rule wasn\'t clearly communicated.',
      },
      {
        question: 'What if my HOA isn\'t maintaining common areas?',
        answer: 'Document the maintenance issues and review your HOA\'s obligations in the governing documents. Our templates formally demand action and reference the board\'s fiduciary duties.',
      },
      {
        question: 'Can I access HOA financial records?',
        answer: 'Most states give homeowners the right to inspect HOA financial records. Our letters formally request access, which is important for challenging assessments or questioning board decisions.',
      },
    ],
  };

  const specificFAQs = categoryFAQs[categoryId] || [];
  
  return [...specificFAQs, ...baseFAQs];
};

// Generate FAQ Schema for SEO
const generateFAQSchema = (faqs: FAQ[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

const TemplateFAQ = ({ template, categoryName }: TemplateFAQProps) => {
  const categoryId = template.category.toLowerCase().replace(/\s+/g, '-');
  const faqs = getCategoryFAQs(categoryId, template.title);
  const faqSchema = generateFAQSchema(faqs);

  return (
    <section className="py-12 md:py-16 bg-secondary/30">
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container-narrow">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Common questions about {categoryName.toLowerCase()} dispute letters and the resolution process.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default TemplateFAQ;
