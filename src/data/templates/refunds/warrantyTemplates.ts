import { LetterTemplate } from '../../letterTemplates';

const warrantyJurisdictions = [
  {
    code: 'US',
    name: 'United States',
    legalReference: 'Magnuson-Moss Warranty Act, UCC Article 2 Implied Warranties',
    approvedPhrases: ['Under the Magnuson-Moss Warranty Act', 'Pursuant to UCC implied warranty of merchantability'],
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    legalReference: 'Consumer Rights Act 2015, Sale of Goods Act 1979',
    approvedPhrases: ['Under the Consumer Rights Act 2015', 'Goods must be of satisfactory quality under UK law'],
  },
  {
    code: 'EU',
    name: 'European Union',
    legalReference: 'EU Consumer Sales Directive 1999/44/EC, Directive (EU) 2019/771',
    approvedPhrases: ['Under EU consumer protection law', 'As provided by the EU legal guarantee of conformity'],
  },
  {
    code: 'INTL',
    name: 'International / Other',
    approvedPhrases: ['In accordance with applicable consumer warranty protections'],
  },
];

export const warrantyTemplates: LetterTemplate[] = [
  {
    id: 'warranty-claim-denied',
    slug: 'warranty-claim-denied',
    category: 'Refunds & Purchases',
    title: 'Warranty Claim Denied – Appeal Letter',
    shortDescription: 'Challenge a manufacturer or retailer who refused to honor a valid product warranty.',
    longDescription: `When a manufacturer or retailer denies your warranty claim, you have the right to formally challenge that decision. Many warranty denials are based on technicalities, misinterpretations of warranty terms, or unfounded claims of misuse.

When to use this letter:
• Your warranty claim was denied despite the product being within the warranty period
• The company claims "user damage" or "misuse" without evidence
• You were told the warranty doesn't cover the specific defect
• The retailer redirects you to the manufacturer (or vice versa) without resolution
• A third-party repair was cited as voiding the warranty despite right-to-repair protections

This letter formally disputes the denial and demands reconsideration, citing the specific warranty terms and applicable consumer protection laws.`,
    seoTitle: 'Warranty Claim Denied? Appeal Letter Template – Free',
    seoDescription: 'Fight a denied warranty claim with a professional appeal letter. Free template citing Magnuson-Moss Act, Consumer Rights Act & EU law.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Samsung, LG, Dyson', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address of warranty department', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., 65" OLED Television', required: true, impactLevel: 'important' as const },
      { id: 'productModel', label: 'Model/Serial Number', type: 'text', placeholder: 'e.g., OLED65C1PUB / SN: ABC123', required: true },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true, impactLevel: 'important' as const },
      { id: 'warrantyExpiry', label: 'Warranty Expiry Date', type: 'date', required: true, impactLevel: 'important' as const },
      { id: 'claimDate', label: 'Date Claim Was Filed', type: 'date', required: true },
      { id: 'claimReference', label: 'Claim/Case Reference Number', type: 'text', placeholder: 'e.g., WC-2024-78901', required: false },
      { id: 'denialReason', label: 'Reason Given for Denial', type: 'textarea', placeholder: 'Describe the exact reason the company gave for denying your claim', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'defectDescription', label: 'Describe the Defect', type: 'textarea', placeholder: 'What is wrong with the product? When did it start?', required: true, aiEnhanced: true },
      { id: 'amountPaid', label: 'Purchase Price', type: 'text', placeholder: 'e.g., $1,299.99', required: true },
      { id: 'previousContact', label: 'Previous Contact Attempts', type: 'textarea', placeholder: 'List dates and methods of previous communications', required: false, evidenceHint: 'Include call reference numbers, email dates, chat transcripts' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally appeal your denial of my warranty claim (Reference: {claimReference}) for {productName} (Model: {productModel}), purchased on {purchaseDate} for {amountPaid}.', placeholders: ['claimReference', 'productName', 'productModel', 'purchaseDate', 'amountPaid'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'The product developed the following defect: {defectDescription}\n\nI filed a warranty claim on {claimDate}. Your company denied this claim, stating: {denialReason}\n\nThe product remains within the warranty period, which does not expire until {warrantyExpiry}. The denial reason is not supported by the warranty terms.', placeholders: ['defectDescription', 'claimDate', 'denialReason', 'warrantyExpiry'] },
      { id: 'request', name: 'Request', template: 'I am requesting that you reverse the denial and honor the warranty by repairing or replacing the {productName}, or issuing a full refund of {amountPaid}.', placeholders: ['productName', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'I require a written response within 14 days of receipt of this letter, confirming how you intend to resolve this matter.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Should you fail to respond or continue to deny this claim without lawful basis, I will file complaints with the relevant consumer protection authorities and pursue all available legal remedies.', placeholders: [] },
    ],
    jurisdictions: warrantyJurisdictions,
  },
  {
    id: 'warranty-repair-unreasonable-delay',
    slug: 'warranty-repair-unreasonable-delay',
    category: 'Refunds & Purchases',
    title: 'Warranty Repair Taking Too Long – Demand Letter',
    shortDescription: 'Demand resolution when a warranty repair has been delayed for weeks or months.',
    longDescription: `Companies sometimes accept warranty claims but then take an unreasonably long time to complete repairs, leaving you without your product for weeks or even months. You have the right to demand timely resolution.

When to use this letter:
• Your product has been "in repair" for more than 30 days
• The company keeps extending the estimated repair timeline
• Replacement parts are "on backorder" with no end date
• You've been given a loaner or temporary replacement that is inadequate
• The company is unresponsive about repair status updates

Under many consumer protection frameworks, unreasonable repair delays entitle you to a replacement or full refund instead.`,
    seoTitle: 'Warranty Repair Delay Letter – Demand Faster Resolution',
    seoDescription: 'Warranty repair taking too long? Demand a replacement or refund with this professional letter template. Covers US, UK & EU consumer rights.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Apple, Dell, Whirlpool', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full company or service center address', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., MacBook Pro 16"', required: true, impactLevel: 'important' as const },
      { id: 'productModel', label: 'Model/Serial Number', type: 'text', placeholder: 'e.g., A2485 / SN: C02X1234', required: true },
      { id: 'repairReference', label: 'Repair/Service Order Number', type: 'text', placeholder: 'e.g., RO-2024-56789', required: true, impactLevel: 'important' as const },
      { id: 'dropOffDate', label: 'Date Product Was Submitted for Repair', type: 'date', required: true, impactLevel: 'important' as const },
      { id: 'originalEstimate', label: 'Original Estimated Repair Time', type: 'text', placeholder: 'e.g., 5-7 business days', required: true },
      { id: 'daysSinceDropOff', label: 'Days Since Submitted', type: 'number', placeholder: 'e.g., 45', required: true, impactLevel: 'important' as const },
      { id: 'defectDescription', label: 'Original Defect', type: 'textarea', placeholder: 'What was wrong with the product?', required: true, aiEnhanced: true },
      { id: 'statusUpdates', label: 'Status Updates Received', type: 'textarea', placeholder: 'List any updates or excuses given', required: false, evidenceHint: 'Include dates and who you spoke with' },
      { id: 'amountPaid', label: 'Product Purchase Price', type: 'text', placeholder: 'e.g., $2,499.00', required: true },
      { id: 'inconvenienceDetails', label: 'Impact of Not Having the Product', type: 'textarea', placeholder: 'How has the delay affected you? (work, daily life)', required: false, aiEnhanced: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding repair order {repairReference} for {productName} (Model: {productModel}), which has been in your possession for {daysSinceDropOff} days—far exceeding the original estimate of {originalEstimate}.', placeholders: ['repairReference', 'productName', 'productModel', 'daysSinceDropOff', 'originalEstimate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'I submitted the product for warranty repair on {dropOffDate} for the following issue: {defectDescription}\n\nI was told the repair would take {originalEstimate}. It has now been {daysSinceDropOff} days with no resolution.\n\nStatus updates received: {statusUpdates}\n\nThis delay has caused significant inconvenience: {inconvenienceDetails}', placeholders: ['dropOffDate', 'defectDescription', 'originalEstimate', 'daysSinceDropOff', 'statusUpdates', 'inconvenienceDetails'] },
      { id: 'request', name: 'Request', template: 'Given the unreasonable delay, I am requesting either: (1) an immediate replacement with a new or equivalent product, or (2) a full refund of {amountPaid}. The repair option is no longer acceptable.', placeholders: ['amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'I require a definitive resolution within 7 days of this letter. If the product cannot be returned in fully working condition by that date, I expect a replacement or refund.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have documented all communications and will escalate this matter to consumer protection authorities if a satisfactory resolution is not provided promptly.', placeholders: [] },
    ],
    jurisdictions: warrantyJurisdictions,
  },
  {
    id: 'warranty-terms-misrepresentation',
    slug: 'warranty-terms-misrepresentation',
    category: 'Refunds & Purchases',
    title: 'Warranty Coverage Misrepresented at Sale',
    shortDescription: 'Challenge a company that sold you a product with misleading warranty promises.',
    longDescription: `If a salesperson or product listing promised specific warranty coverage that the company is now refusing to honor, you may have been a victim of warranty misrepresentation. This is a violation of consumer protection laws in most jurisdictions.

When to use this letter:
• The salesperson verbally promised extended warranty coverage that isn't in writing
• Marketing materials advertised a "comprehensive warranty" but the fine print excludes your issue
• You purchased an extended warranty that doesn't cover what you were told it would
• The warranty terms were changed after purchase without notice
• Online product listing stated warranty coverage that differs from the actual warranty document

This template demands the company honor the warranty as it was represented at the time of sale.`,
    seoTitle: 'Warranty Misrepresentation Letter – Challenge False Promises',
    seoDescription: 'Were you misled about warranty coverage? Formal complaint letter for misrepresented warranty terms. Covers US, UK & EU consumer law.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Best Buy, John Lewis', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Samsung Refrigerator', required: true, impactLevel: 'important' as const },
      { id: 'productModel', label: 'Model Number', type: 'text', placeholder: 'e.g., RF28R7351SR', required: true },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'e.g., $2,199.99', required: true },
      { id: 'warrantyAmountPaid', label: 'Extended Warranty Price (if applicable)', type: 'text', placeholder: 'e.g., $299.99', required: false },
      { id: 'whatWasPromised', label: 'What Was Promised', type: 'textarea', placeholder: 'Describe exactly what warranty coverage you were told you would receive', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'whatIsActual', label: 'What the Company Now Says', type: 'textarea', placeholder: 'What the company is now telling you about coverage', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'evidenceOfPromise', label: 'Evidence of the Promise', type: 'textarea', placeholder: 'e.g., Sales receipt notes, email confirmation, screenshot of product listing, name of salesperson', required: true, evidenceHint: 'Screenshots, emails, receipts, witness names all strengthen your case' },
      { id: 'currentIssue', label: 'Current Product Issue', type: 'textarea', placeholder: 'What is wrong with the product now?', required: true, aiEnhanced: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute {companyName}\'s refusal to honor warranty coverage for {productName} (Model: {productModel}) as it was represented to me at the time of purchase on {purchaseDate}.', placeholders: ['companyName', 'productName', 'productModel', 'purchaseDate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'At the time of sale, I was assured the following warranty coverage: {whatWasPromised}\n\nHowever, when I filed a claim for the following issue—{currentIssue}—your company stated: {whatIsActual}\n\nI have the following evidence supporting what was promised: {evidenceOfPromise}', placeholders: ['whatWasPromised', 'currentIssue', 'whatIsActual', 'evidenceOfPromise'] },
      { id: 'request', name: 'Request', template: 'I am requesting that {companyName} honor the warranty coverage as it was represented at the point of sale, and repair, replace, or refund the {productName} (purchase price: {amountPaid}).', placeholders: ['companyName', 'productName', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'I require a written response within 14 days detailing how you will resolve this matter in accordance with the warranty representations made at the time of sale.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Misrepresenting warranty terms constitutes an unfair trade practice. If this matter is not resolved, I will file complaints with the appropriate consumer protection agencies and consider further legal action.', placeholders: [] },
    ],
    jurisdictions: warrantyJurisdictions,
  },
  {
    id: 'implied-warranty-rights-letter',
    slug: 'implied-warranty-rights-letter',
    category: 'Refunds & Purchases',
    title: 'Implied Warranty Rights – Legal Demand',
    shortDescription: 'Assert your implied warranty rights when a product fails prematurely, even without an express warranty.',
    longDescription: `Even when an express warranty has expired—or none was ever provided—consumers are protected by implied warranties under law. The implied warranty of merchantability means a product must work as reasonably expected for a reasonable duration.

When to use this letter:
• A product failed shortly after the express warranty expired
• An expensive product broke far sooner than its expected lifespan
• The seller says "warranty expired, nothing we can do"
• The product was sold "as is" but you are in a jurisdiction that doesn't allow waiving implied warranties
• A major appliance or electronic failed within 2-4 years despite a 1-year warranty

In the US, the Magnuson-Moss Warranty Act and UCC provide implied warranty protections. In the UK, the Consumer Rights Act 2015 provides up to 6 years of protection. The EU guarantees a minimum 2-year legal guarantee.`,
    seoTitle: 'Implied Warranty Rights Letter – Beyond Express Warranty',
    seoDescription: 'Product broke after warranty expired? Assert your implied warranty rights under Magnuson-Moss Act, Consumer Rights Act & EU law. Free template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Manufacturer or Retailer Name', type: 'text', placeholder: 'e.g., Bosch, Home Depot', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Dishwasher, Laptop', required: true, impactLevel: 'important' as const },
      { id: 'productModel', label: 'Model/Serial Number', type: 'text', placeholder: 'e.g., SHPM88Z75N / SN: FD123456', required: true },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true, impactLevel: 'important' as const },
      { id: 'amountPaid', label: 'Purchase Price', type: 'text', placeholder: 'e.g., $849.00', required: true, impactLevel: 'important' as const },
      { id: 'expressWarrantyLength', label: 'Express Warranty Length', type: 'text', placeholder: 'e.g., 1 year', required: true },
      { id: 'productAge', label: 'Product Age When It Failed', type: 'text', placeholder: 'e.g., 18 months, 2.5 years', required: true, impactLevel: 'important' as const },
      { id: 'expectedLifespan', label: 'Reasonable Expected Lifespan', type: 'text', placeholder: 'e.g., 8-10 years for a dishwasher', required: true, aiEnhanced: true },
      { id: 'defectDescription', label: 'Describe the Failure', type: 'textarea', placeholder: 'What happened? How did the product fail?', required: true, aiEnhanced: true },
      { id: 'repairEstimate', label: 'Repair Cost Estimate (if obtained)', type: 'text', placeholder: 'e.g., $450', required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to assert my implied warranty rights regarding {productName} (Model: {productModel}), purchased on {purchaseDate} for {amountPaid}. The product failed after only {productAge}, well short of its reasonable expected lifespan of {expectedLifespan}.', placeholders: ['productName', 'productModel', 'purchaseDate', 'amountPaid', 'productAge', 'expectedLifespan'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'The product developed the following failure: {defectDescription}\n\nWhile the {expressWarrantyLength} express warranty has expired, the law provides additional protections through implied warranties. A {productName} purchased for {amountPaid} should reasonably last {expectedLifespan}. Failure at {productAge} indicates a latent defect or lack of merchantability.', placeholders: ['defectDescription', 'expressWarrantyLength', 'productName', 'amountPaid', 'expectedLifespan', 'productAge'] },
      { id: 'request', name: 'Request', template: 'I am requesting that {companyName} provide a repair, replacement, or pro-rated refund for {productName}. The premature failure of this product at {productAge} is not consistent with the reasonable expectations of a consumer paying {amountPaid}.', placeholders: ['companyName', 'productName', 'productAge', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days with a proposed resolution. I am prepared to pursue all available remedies if this matter is not addressed.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I reserve all rights under applicable implied warranty statutes and consumer protection laws, and will escalate this matter if necessary.', placeholders: [] },
    ],
    jurisdictions: warrantyJurisdictions,
  },
  {
    id: 'lifetime-guarantee-dispute',
    slug: 'lifetime-guarantee-dispute',
    category: 'Refunds & Purchases',
    title: 'Lifetime Guarantee Not Honored – Complaint Letter',
    shortDescription: 'Challenge a company refusing to honor its "lifetime guarantee" on a product.',
    longDescription: `Many companies market products with a "lifetime guarantee" or "lifetime warranty" to justify premium pricing—then refuse to honor that promise when the product fails. This letter holds them accountable.

When to use this letter:
• A company refuses to replace or repair a product sold with a "lifetime guarantee"
• The company redefines "lifetime" to mean something shorter than you expected
• They claim the guarantee only covers specific parts, not the whole product
• The company no longer manufactures the product and refuses alternatives
• They require you to pay shipping, handling, or "processing fees" that effectively void the guarantee

A "lifetime guarantee" is a contractual promise, and companies cannot unilaterally revoke it.`,
    seoTitle: 'Lifetime Guarantee Dispute Letter – Hold Companies Accountable',
    seoDescription: 'Company won\'t honor a lifetime guarantee? Professional dispute letter template demanding they stand behind their promise. Free to use.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Craftsman, Zippo, LL Bean', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address or warranty department', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Stainless Steel Cookware Set', required: true, impactLevel: 'important' as const },
      { id: 'productModel', label: 'Model/Item Number', type: 'text', placeholder: 'e.g., SS-PRO-10PC', required: false },
      { id: 'purchaseDate', label: 'Approximate Purchase Date', type: 'date', required: true },
      { id: 'amountPaid', label: 'Purchase Price', type: 'text', placeholder: 'e.g., $349.99', required: true },
      { id: 'guaranteeLanguage', label: 'Exact Guarantee Language Used', type: 'textarea', placeholder: 'Quote the guarantee as stated on packaging, website, or marketing materials', required: true, impactLevel: 'important' as const, evidenceHint: 'Take a photo or screenshot of the guarantee statement' },
      { id: 'claimDate', label: 'Date You Contacted the Company', type: 'date', required: true },
      { id: 'companyResponse', label: 'Company\'s Response', type: 'textarea', placeholder: 'What did they say when you tried to use the guarantee?', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'defectDescription', label: 'What Went Wrong', type: 'textarea', placeholder: 'Describe the product failure or defect', required: true, aiEnhanced: true },
      { id: 'proofOfPurchase', label: 'Proof of Purchase Available?', type: 'select', options: ['Original receipt', 'Credit card statement', 'Gift receipt', 'Online order confirmation', 'No proof available'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally demand that {companyName} honor its lifetime guarantee on {productName}, purchased for {amountPaid}.', placeholders: ['companyName', 'productName', 'amountPaid'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Your product was marketed and sold with the following guarantee: {guaranteeLanguage}\n\nThe product has failed as follows: {defectDescription}\n\nWhen I contacted your company on {claimDate}, I was told: {companyResponse}\n\nThis response is inconsistent with the lifetime guarantee under which the product was sold.', placeholders: ['guaranteeLanguage', 'defectDescription', 'claimDate', 'companyResponse'] },
      { id: 'request', name: 'Request', template: 'I am requesting that {companyName} honor its lifetime guarantee by providing a replacement product or full refund of {amountPaid}. The guarantee was a material factor in my purchasing decision.', placeholders: ['companyName', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'I require a response within 14 days. If the guarantee is not honored, I will file complaints with the FTC (or equivalent authority) for deceptive advertising and pursue other remedies.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'A lifetime guarantee is a binding commitment. Refusing to honor it constitutes a deceptive trade practice and I will not hesitate to escalate this matter.', placeholders: [] },
    ],
    jurisdictions: warrantyJurisdictions,
  },
  {
    id: 'defective-product-replacement',
    slug: 'defective-product-replacement',
    category: 'Refunds & Purchases',
    title: 'Defective Product – Warranty Replacement Demand',
    shortDescription: 'Demand a replacement or refund for a product that arrived defective or developed a manufacturing defect.',
    longDescription: `When a product has a manufacturing defect—whether apparent on arrival or developing within the warranty period—you are entitled to a remedy. This letter demands the company provide a replacement or refund for the defective item.

When to use this letter:
• A brand-new product arrived broken or non-functional
• A product developed a defect within weeks or months of purchase
• The same defect has recurred after a previous repair attempt
• Multiple units of the same product have failed (pattern defect)
• The product poses a safety risk due to a manufacturing flaw

Under most consumer laws, you have the right to reject defective goods within 30 days for a full refund, or request repair/replacement within the warranty period.`,
    seoTitle: 'Defective Product Replacement Letter – Free Warranty Template',
    seoDescription: 'Product arrived defective or broke early? Demand a replacement or refund with this warranty letter template. Covers manufacturing defects.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Manufacturer/Retailer Name', type: 'text', placeholder: 'e.g., Sony, Walmart', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Noise-Cancelling Headphones', required: true, impactLevel: 'important' as const },
      { id: 'productModel', label: 'Model/Serial Number', type: 'text', placeholder: 'e.g., WH-1000XM5 / SN: 12345', required: true },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true, impactLevel: 'important' as const },
      { id: 'amountPaid', label: 'Purchase Price', type: 'text', placeholder: 'e.g., $349.99', required: true },
      { id: 'orderNumber', label: 'Order/Receipt Number', type: 'text', placeholder: 'e.g., ORD-20240215-7890', required: false },
      { id: 'defectDescription', label: 'Describe the Defect', type: 'textarea', placeholder: 'What is wrong? When did you first notice? Is it a safety concern?', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'defectTimeline', label: 'When Did the Defect Appear?', type: 'select', options: ['On arrival / out of the box', 'Within the first week', 'Within the first month', 'Within 1-6 months', 'Within 6-12 months', 'After 12 months but within warranty'], required: true, impactLevel: 'important' as const },
      { id: 'previousRepairAttempts', label: 'Previous Repair Attempts', type: 'textarea', placeholder: 'Has the product already been repaired? Did the same issue return?', required: false, evidenceHint: 'Include repair dates, service order numbers' },
      { id: 'preferredResolution', label: 'Preferred Resolution', type: 'select', options: ['Replacement with new unit', 'Full refund', 'Either replacement or refund'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to report a manufacturing defect in {productName} (Model: {productModel}), purchased on {purchaseDate} for {amountPaid}, and to request a {preferredResolution}.', placeholders: ['productName', 'productModel', 'purchaseDate', 'amountPaid', 'preferredResolution'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'The defect manifested {defectTimeline}: {defectDescription}\n\nOrder reference: {orderNumber}\n\nPrevious repair attempts: {previousRepairAttempts}\n\nThis defect renders the product unfit for its intended purpose and constitutes a breach of the warranty and implied standards of quality.', placeholders: ['defectTimeline', 'defectDescription', 'orderNumber', 'previousRepairAttempts'] },
      { id: 'request', name: 'Request', template: 'I am requesting a {preferredResolution} for {productName}. The product is clearly defective and I should not bear the cost of a manufacturing failure.', placeholders: ['preferredResolution', 'productName'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days with confirmation of how this will be resolved. If a replacement is provided, it must be a new unit, not a refurbished one.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have retained the defective product and all original packaging as evidence. If this matter is not resolved promptly, I will pursue all available consumer remedies.', placeholders: [] },
    ],
    jurisdictions: warrantyJurisdictions,
  },
];
