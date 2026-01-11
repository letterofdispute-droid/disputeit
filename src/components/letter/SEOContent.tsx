import { LetterTemplate } from '@/data/letterTemplates';

interface SEOContentProps {
  template: LetterTemplate;
}

const SEOContent = ({ template }: SEOContentProps) => {
  // Static, crawlable content for SEO purposes
  const seoSections = getSEOSections(template.slug);

  return (
    <article className="prose prose-slate max-w-none">
      {/* Main Description */}
      <div className="mb-8">
        <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
          {template.longDescription}
        </p>
      </div>

      {/* Additional SEO Content */}
      {seoSections.map((section, index) => (
        <section key={index} className="mb-8">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            {section.heading}
          </h2>
          <div className="text-muted-foreground space-y-4">
            {section.paragraphs.map((para, pIndex) => (
              <p key={pIndex}>{para}</p>
            ))}
          </div>
          {section.list && (
            <ul className="mt-4 space-y-2">
              {section.list.map((item, lIndex) => (
                <li key={lIndex} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-accent font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>Important:</strong> This service provides document templates and does not constitute legal advice. 
          The letters generated are professionally structured but are not reviewed by legal professionals. 
          For complex legal matters, we recommend consulting a qualified attorney in your jurisdiction.
        </p>
      </div>
    </article>
  );
};

// SEO content for each template type
function getSEOSections(slug: string): Array<{
  heading: string;
  paragraphs: string[];
  list?: string[];
}> {
  switch (slug) {
    case 'refund':
      return [
        {
          heading: 'What Information Do You Need?',
          paragraphs: [
            'To create an effective refund request letter, you\'ll need to gather some key information before you begin. Having these details ready will make the process faster and ensure your letter is complete.',
          ],
          list: [
            'Order number or receipt reference',
            'Date of purchase',
            'Description of the product or service',
            'Amount paid',
            'Clear description of the problem',
            'Any previous communication with the seller',
          ],
        },
        {
          heading: 'What Happens After You Send Your Letter?',
          paragraphs: [
            'After sending your refund request letter, most businesses will respond within 14 days. The response may include an offer to refund, a request for more information, or an explanation of why they cannot process your refund.',
            'If you don\'t receive a response within a reasonable time, you may need to follow up with a firmer letter or consider alternative dispute resolution methods such as contacting your credit card company or a consumer protection agency.',
          ],
        },
        {
          heading: 'Tips for a Successful Refund Request',
          paragraphs: [
            'A well-structured letter significantly increases your chances of getting a positive response. Here are some tips to maximize your success:',
          ],
          list: [
            'Be clear and concise — stick to the facts',
            'Include all relevant documentation',
            'Set a reasonable deadline for response',
            'Keep a copy of everything you send',
            'Send via trackable mail when possible',
            'Follow up if you don\'t hear back',
          ],
        },
      ];
    case 'landlord-repairs':
      return [
        {
          heading: 'Your Rights as a Tenant',
          paragraphs: [
            'As a tenant, you have the right to live in a property that meets basic health and safety standards. Landlords are generally responsible for maintaining the structure and exterior of the property, as well as keeping installations for water, gas, electricity, and heating in working order.',
            'Documenting repair requests in writing creates an important paper trail that protects your rights and may be necessary if the situation escalates.',
          ],
        },
        {
          heading: 'What Information to Include',
          paragraphs: [
            'When requesting repairs from your landlord, it\'s important to be specific and thorough. Your letter should clearly describe the issue and its impact on your living conditions.',
          ],
          list: [
            'Your rental property address',
            'Specific description of the repair needed',
            'When the problem first started',
            'How the issue affects your daily life',
            'Any previous reports of this issue',
            'Photographs or evidence of the problem',
          ],
        },
        {
          heading: 'Timeline for Landlord Repairs',
          paragraphs: [
            'The urgency of the repair often determines how quickly your landlord should respond. Emergency repairs such as heating failures in winter or water leaks typically require immediate attention within 24-48 hours.',
            'For non-urgent repairs, landlords usually have a reasonable time to respond, typically 14-30 days depending on your jurisdiction and the nature of the repair.',
          ],
        },
      ];
    case 'damaged-goods':
      return [
        {
          heading: 'Documenting Damaged Deliveries',
          paragraphs: [
            'When you receive a damaged package, proper documentation is crucial for a successful complaint. Before contacting the seller, take clear photographs of the damage from multiple angles, including the packaging.',
            'If possible, photograph the package before opening it to show any visible damage during transit. Keep all packaging materials as evidence.',
          ],
        },
        {
          heading: 'What to Include in Your Complaint',
          paragraphs: [
            'A successful damaged goods complaint should be factual, clear, and include all relevant details that help the company understand and resolve your issue.',
          ],
          list: [
            'Order number and date of purchase',
            'Date the package was received',
            'Description of the items ordered',
            'Detailed description of the damage',
            'Photographs attached as evidence',
            'Your preferred resolution (refund or replacement)',
          ],
        },
        {
          heading: 'Understanding Your Options',
          paragraphs: [
            'When goods arrive damaged, you typically have several options for resolution. You may request a full refund, a replacement item, or in some cases, a partial refund if the damage is minor and you wish to keep the item.',
            'Consider which option best suits your situation when completing your complaint letter. If the item was a gift or time-sensitive, a refund might be preferable to waiting for a replacement.',
          ],
        },
      ];
    default:
      return [];
  }
}

export default SEOContent;
