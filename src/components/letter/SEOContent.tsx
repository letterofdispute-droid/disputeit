import { LetterTemplate } from '@/data/letterTemplates';
import { CheckCircle2, Clock, FileText, AlertCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SEOContentProps {
  template: LetterTemplate;
}

const SEOContent = ({ template }: SEOContentProps) => {
  const sections = getSEOSections(template);

  return (
    <article className="prose prose-slate max-w-none">
      {/* Main Description */}
      <div className="mb-10">
        <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
          {template.longDescription}
        </p>
      </div>

      {/* Three-Column Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12 not-prose">
        {/* When to Use */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-accent/10 rounded-full mb-3">
                <Lightbulb className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg font-semibold">
                When to Use This Letter
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-none space-y-2 m-0 p-0">
              {sections.whenToUse.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* What You'll Need */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-accent/10 rounded-full mb-3">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg font-semibold">
                What You'll Need
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-none space-y-2 m-0 p-0">
              {sections.whatYouNeed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* What Happens After */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-accent/10 rounded-full mb-3">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg font-semibold">
                What Happens Next
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-none space-y-2 m-0 p-0">
              {sections.whatHappensAfter.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center justify-center w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Steps */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-6 text-center">
          How to Create Your Letter
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 not-prose">
          {[
            { step: '1', title: 'Gather Info', desc: 'Collect dates, reference numbers, and documentation' },
            { step: '2', title: 'Fill the Form', desc: 'Enter your specific details in our guided template' },
            { step: '3', title: 'Choose Tone', desc: 'Select neutral, firm, or final notice as needed' },
            { step: '4', title: 'Download', desc: 'Get your letter in PDF or Word format' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center p-5 bg-secondary/50 rounded-lg">
              <span className="flex items-center justify-center w-10 h-10 bg-accent text-accent-foreground rounded-full text-lg font-bold mb-3">
                {item.step}
              </span>
              <h3 className="font-medium text-foreground text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Guidance */}
      {sections.additionalGuidance.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            Tips for Success
          </h2>
          <div className="space-y-4 text-muted-foreground">
            {sections.additionalGuidance.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Important Notice */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border flex gap-3 not-prose">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong>Important:</strong> This service provides document templates and does not constitute legal advice. 
          The letters generated are professionally structured but are not reviewed by legal professionals. 
          For complex legal matters, we recommend consulting a qualified attorney in your jurisdiction.
        </p>
      </div>
    </article>
  );
};

// Dynamic SEO content based on template category and type
interface SEOSections {
  whenToUse: string[];
  whatYouNeed: string[];
  whatHappensAfter: string[];
  additionalGuidance: string[];
}

function getSEOSections(template: LetterTemplate): SEOSections {
  const category = template.category.toLowerCase();
  const slug = template.slug.toLowerCase();
  const id = template.id.toLowerCase();

  // Category-specific content with template-level customization
  const categoryContent = getCategoryContent(category);
  const templateSpecificContent = getTemplateSpecificContent(slug, id, category);

  return {
    whenToUse: templateSpecificContent.whenToUse || categoryContent.whenToUse,
    whatYouNeed: mergeUnique(categoryContent.whatYouNeed, templateSpecificContent.whatYouNeed || []),
    whatHappensAfter: categoryContent.whatHappensAfter,
    additionalGuidance: templateSpecificContent.additionalGuidance || categoryContent.additionalGuidance,
  };
}

function mergeUnique(base: string[], additional: string[]): string[] {
  const result = [...base];
  additional.forEach(item => {
    if (!result.includes(item)) {
      result.push(item);
    }
  });
  return result.slice(0, 6); // Limit to 6 items
}

function getCategoryContent(category: string): SEOSections {
  switch (category) {
    case 'refunds & purchases':
      return {
        whenToUse: [
          'Product or service did not meet expectations',
          'Business refuses to honor their refund policy',
          'You received a faulty or defective item',
          'Service was not delivered as promised',
        ],
        whatYouNeed: [
          'Order number or receipt',
          'Date of purchase',
          'Description of the issue',
          'Any previous communication records',
        ],
        whatHappensAfter: [
          'Send your letter via email or post',
          'Business typically responds within 14 days',
          'Follow up if no response received',
          'Escalate to consumer protection if needed',
        ],
        additionalGuidance: [
          'Keep copies of all correspondence and documentation. A well-documented dispute is more likely to result in a favorable outcome.',
          'If you paid by credit card, you may also have chargeback rights through your card issuer as an additional recourse.',
        ],
      };

    case 'housing':
      return {
        whenToUse: [
          'Landlord has not completed necessary repairs',
          'Issues affecting your health or safety',
          'Breach of tenancy agreement terms',
          'Problems with property management',
        ],
        whatYouNeed: [
          'Your tenancy agreement reference',
          'Property address and landlord details',
          'Dates when issues were first reported',
          'Photos or evidence of the problem',
        ],
        whatHappensAfter: [
          'Landlord must respond within reasonable time',
          'Keep records of all communications',
          'Document any repairs or lack thereof',
          'Contact housing authority if unresolved',
        ],
        additionalGuidance: [
          'Many jurisdictions require landlords to maintain habitable conditions. Know your local tenant rights before sending your letter.',
          'Consider sending via certified mail to create a legal record of your communication.',
        ],
      };

    case 'travel':
      return {
        whenToUse: [
          'Flight was cancelled or significantly delayed',
          'Baggage was lost, damaged, or delayed',
          'Hotel did not match description or booking',
          'Tour or service was not as advertised',
        ],
        whatYouNeed: [
          'Booking confirmation and reference numbers',
          'Flight or reservation details',
          'Receipts for additional expenses incurred',
          'Photos documenting any issues',
        ],
        whatHappensAfter: [
          'Airline or provider reviews your claim',
          'Response typically within 30-60 days',
          'May receive compensation or vouchers',
          'Escalate to aviation authority if needed',
        ],
        additionalGuidance: [
          'Under many regulations, you may be entitled to compensation for delays over 3 hours or cancellations with short notice.',
          'Keep all boarding passes, receipts, and documentation until your claim is fully resolved.',
        ],
      };

    case 'contractors':
      return {
        whenToUse: [
          'Work was not completed as agreed',
          'Quality of work is substandard',
          'Contractor has abandoned the project',
          'Damage occurred during the work',
        ],
        whatYouNeed: [
          'Contract or written agreement',
          'Invoices and payment records',
          'Photos of the work (before and after)',
          'Written timeline of events',
        ],
        whatHappensAfter: [
          'Contractor should respond to your concerns',
          'May offer to remediate the issues',
          'Negotiate resolution or next steps',
          'Consider small claims court if needed',
        ],
        additionalGuidance: [
          'Document everything with dated photos and keep all written communications. This creates a clear timeline for any dispute.',
          'Check if the contractor is licensed and bonded - this may provide additional avenues for compensation.',
        ],
      };

    case 'insurance':
      return {
        whenToUse: [
          'Claim was denied or underpaid',
          'Unreasonable delays in claim processing',
          'Policy terms are being misinterpreted',
          'Need to appeal a coverage decision',
        ],
        whatYouNeed: [
          'Policy number and claim reference',
          'Denial letter or correspondence',
          'Supporting documentation for your claim',
          'Copy of your insurance policy',
        ],
        whatHappensAfter: [
          'Insurer reviews your appeal',
          'May request additional documentation',
          'Decision typically within 30-45 days',
          'Contact insurance commissioner if denied',
        ],
        additionalGuidance: [
          'Always request denials in writing and ask for specific policy language supporting their decision.',
          'Insurance companies must act in good faith - document any unreasonable delays or communication issues.',
        ],
      };

    case 'utilities & telecom':
      return {
        whenToUse: [
          'Billing errors or overcharges',
          'Service not meeting advertised standards',
          'Contract terms not being honored',
          'Issues with service cancellation',
        ],
        whatYouNeed: [
          'Account number and billing statements',
          'Contract or service agreement',
          'Records of service issues',
          'Previous complaint references',
        ],
        whatHappensAfter: [
          'Provider investigates your complaint',
          'Response typically within 10-14 days',
          'May receive credits or adjustments',
          'Escalate to regulator if unresolved',
        ],
        additionalGuidance: [
          'Utility companies are often regulated - check if there is an ombudsman or regulatory body you can escalate to.',
          'Keep detailed records of service outages or quality issues with dates and times.',
        ],
      };

    case 'financial':
      return {
        whenToUse: [
          'Unauthorized charges or transactions',
          'Errors on your credit report',
          'Unfair fees or interest charges',
          'Problems with loan servicing',
        ],
        whatYouNeed: [
          'Account numbers and statements',
          'Transaction details and dates',
          'Supporting documentation',
          'Any previous correspondence',
        ],
        whatHappensAfter: [
          'Institution investigates your dispute',
          'Response required within 30-60 days',
          'May receive refunds or corrections',
          'File with CFPB if unresolved',
        ],
        additionalGuidance: [
          'Financial institutions are heavily regulated. Know your rights under consumer protection laws.',
          'For credit report errors, you have the right to a free investigation within 30 days under the FCRA.',
        ],
      };

    case 'vehicle':
      return {
        whenToUse: [
          'Repair was inadequate or caused damage',
          'Dealer misrepresented vehicle condition',
          'Warranty claim was wrongly denied',
          'Unfair charges or billing disputes',
        ],
        whatYouNeed: [
          'Vehicle details (make, model, VIN)',
          'Repair orders and invoices',
          'Warranty documentation',
          'Photos of any damage or issues',
        ],
        whatHappensAfter: [
          'Dealer or garage reviews your complaint',
          'May offer remediation or refund',
          'Document all responses received',
          'Contact automotive authority if needed',
        ],
        additionalGuidance: [
          'Lemon laws may apply if you have recurring issues with a new vehicle. Check your state\'s specific requirements.',
          'Always get repair estimates in writing and approve work before it begins.',
        ],
      };

    case 'employment':
      return {
        whenToUse: [
          'Wages or overtime not properly paid',
          'Discrimination or harassment issues',
          'Wrongful termination concerns',
          'Benefits not provided as promised',
        ],
        whatYouNeed: [
          'Employment contract or offer letter',
          'Pay stubs and time records',
          'Written policies and handbooks',
          'Documentation of incidents',
        ],
        whatHappensAfter: [
          'Employer reviews your concerns',
          'May trigger internal investigation',
          'Document all responses and actions',
          'File with labor board if unresolved',
        ],
        additionalGuidance: [
          'Employment disputes often have strict time limits for filing complaints. Act promptly to preserve your rights.',
          'Consider consulting with an employment attorney for complex discrimination or wrongful termination matters.',
        ],
      };

    case 'healthcare':
      return {
        whenToUse: [
          'Medical billing errors or disputes',
          'Insurance coverage was wrongly denied',
          'Quality of care concerns',
          'Patient rights violations',
        ],
        whatYouNeed: [
          'Medical records and bills',
          'Insurance policy details',
          'Explanation of Benefits (EOB)',
          'Timeline of treatments',
        ],
        whatHappensAfter: [
          'Provider or insurer reviews complaint',
          'May receive billing adjustments',
          'Appeal rights if claim denied',
          'File with health department if needed',
        ],
        additionalGuidance: [
          'Request itemized bills and compare with your EOB. Billing errors are common and often resolved when documented.',
          'You have the right to access your medical records and dispute inaccurate information.',
        ],
      };

    case 'hoa & property':
      return {
        whenToUse: [
          'HOA fees or assessments in dispute',
          'Enforcement actions seem unfair',
          'Common area maintenance issues',
          'Violation notices you disagree with',
        ],
        whatYouNeed: [
          'HOA governing documents (CC&Rs)',
          'Your member ID or lot number',
          'Correspondence with HOA',
          'Photos or documentation of issues',
        ],
        whatHappensAfter: [
          'Board reviews your complaint',
          'May request hearing or meeting',
          'Decision communicated in writing',
          'Mediation available in many states',
        ],
        additionalGuidance: [
          'Review your CC&Rs and bylaws carefully - they govern what the HOA can and cannot do.',
          'Many states have HOA dispute resolution programs or ombudsmen to help mediate conflicts.',
        ],
      };

    case 'damaged goods':
      return {
        whenToUse: [
          'Product arrived damaged in shipping',
          'Item is defective or not as described',
          'Seller refuses refund or replacement',
          'Warranty claim was denied',
        ],
        whatYouNeed: [
          'Order confirmation and receipts',
          'Photos of damage or defects',
          'Shipping and delivery records',
          'Previous communication with seller',
        ],
        whatHappensAfter: [
          'Seller investigates your claim',
          'May offer refund or replacement',
          'Keep damaged items as evidence',
          'Dispute with payment provider if needed',
        ],
        additionalGuidance: [
          'Photograph damaged packaging before opening and keep all materials until your claim is resolved.',
          'Credit card chargebacks are often available if the seller refuses to cooperate.',
        ],
      };

    case 'e-commerce':
      return {
        whenToUse: [
          'Order never arrived or was lost',
          'Product significantly different from listing',
          'Subscription charges you did not authorize',
          'Seller not responding to messages',
        ],
        whatYouNeed: [
          'Order number and confirmation',
          'Screenshots of product listing',
          'Tracking information if available',
          'Payment records',
        ],
        whatHappensAfter: [
          'Platform or seller reviews dispute',
          'May offer refund or resolution',
          'Platform buyer protection may apply',
          'Credit card dispute as last resort',
        ],
        additionalGuidance: [
          'Most e-commerce platforms have buyer protection programs with time limits - file disputes promptly.',
          'Keep screenshots of product listings as sellers may change them after purchase.',
        ],
      };

    default:
      return {
        whenToUse: [
          'You have a legitimate dispute or complaint',
          'Verbal communication has not resolved the issue',
          'You need a formal record of your complaint',
          'You want to escalate the matter professionally',
        ],
        whatYouNeed: [
          'Relevant account or reference numbers',
          'Dates and timeline of events',
          'Supporting documentation',
          'Previous correspondence',
        ],
        whatHappensAfter: [
          'Recipient reviews your complaint',
          'Response typically within 14-30 days',
          'May resolve or request more information',
          'Escalate to relevant authority if needed',
        ],
        additionalGuidance: [
          'A well-structured letter with clear facts and reasonable requests is more likely to get a positive response.',
          'Always keep copies of everything you send and receive.',
        ],
      };
  }
}

function getTemplateSpecificContent(slug: string, id: string, category: string): Partial<SEOSections> {
  // Refund-specific
  if (slug.includes('refund') || id.includes('refund')) {
    return {
      whatYouNeed: ['Original payment method details', 'Store return policy reference'],
    };
  }

  // Repair-specific
  if (slug.includes('repair') || id.includes('repair')) {
    return {
      whenToUse: [
        'Repair work was not completed properly',
        'Same issue keeps recurring after repairs',
        'Repair caused additional damage',
        'Work does not match the quoted price',
      ],
    };
  }

  // Cancellation-specific
  if (slug.includes('cancel') || id.includes('cancel')) {
    return {
      whatYouNeed: ['Cancellation policy details', 'Notice period requirements'],
      additionalGuidance: [
        'Check your contract for specific cancellation terms and any notice periods required.',
        'Send cancellation notices via trackable methods to prove delivery.',
      ],
    };
  }

  // Complaint-specific
  if (slug.includes('complaint') || id.includes('complaint')) {
    return {
      additionalGuidance: [
        'Be factual and avoid emotional language. Focus on what happened, when, and what resolution you want.',
        'Include a reasonable deadline for response to encourage prompt action.',
      ],
    };
  }

  // Insurance claim-specific
  if (slug.includes('claim') || id.includes('claim')) {
    return {
      whatYouNeed: ['Claim number and date submitted', 'Denial letter if applicable', 'Policy declarations page'],
    };
  }

  // Billing-specific
  if (slug.includes('billing') || slug.includes('bill') || id.includes('billing')) {
    return {
      whatYouNeed: ['Copies of disputed bills', 'Correct billing information', 'Payment history'],
    };
  }

  return {};
}

export default SEOContent;
