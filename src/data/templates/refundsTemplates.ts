import { LetterTemplate } from '../letterTemplates';
import { retailComplaintTemplates } from './refunds/retailComplaintTemplates';
import { digitalPurchaseTemplates } from './refunds/digitalPurchaseTemplates';
import { serviceRefundTemplates } from './refunds/serviceRefundTemplates';
import { billingDisputeTemplates } from './refunds/billingDisputeTemplates';
import { specialPurchaseTemplates } from './refunds/specialPurchaseTemplates';
import { warrantyTemplates } from './refunds/warrantyTemplates';
import { deliveryIssueTemplates } from './refunds/deliveryIssueTemplates';


const standardJurisdictions = [
  {
    code: 'US',
    name: 'United States',
    legalReference: 'FTC Act, State Consumer Protection Laws',
    approvedPhrases: ['Under applicable consumer protection laws', 'In accordance with my consumer rights'],
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    legalReference: 'Consumer Rights Act 2015',
    approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with UK consumer law'],
  },
  {
    code: 'EU',
    name: 'European Union',
    legalReference: 'Consumer Rights Directive',
    approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'],
  },
  {
    code: 'INTL',
    name: 'International / Other',
    approvedPhrases: ['In accordance with applicable consumer protection standards'],
  },
];

const coreRefundsTemplates: LetterTemplate[] = [
  {
    id: 'refund-general',
    slug: 'refund-general',
    category: 'Refunds & Purchases',
    title: 'General Refund Request Letter',
    shortDescription: 'Request a refund for products or services that did not meet your expectations.',
    longDescription: `A general refund request letter is a formal written document sent to a business requesting the return of money paid for goods or services. This letter creates an official record of your complaint and demonstrates your seriousness in seeking resolution.

When to use this letter:
• Product arrived damaged or defective
• Service was not delivered as promised
• Item does not match the description
• Quality significantly below expectations
• Subscription charged after cancellation

This template helps you communicate professionally and increases your chances of a successful resolution.`,
    seoTitle: 'Refund Request Letter Template – Free Generator',
    seoDescription: 'Create a professional refund request letter in minutes. Free template for damaged goods, wrong items, or unsatisfactory services.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Currys, Argos', required: true },
      { id: 'manufacturerName', label: 'Manufacturer Name', type: 'text', placeholder: 'e.g., Samsung, Apple', required: false },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address of the company', required: true },
      { id: 'orderNumber', label: 'Order/Reference Number', type: 'text', placeholder: 'e.g., ORD-123456', required: false, helpText: 'If applicable' },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Headphones', required: true },
      { id: 'productModel', label: 'Model Number', type: 'text', placeholder: 'e.g., WH-1000XM5', required: false },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'e.g., €99.99', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash', 'Other'], required: true },
      { id: 'issueDescription', label: 'Describe the Issue', type: 'textarea', placeholder: 'Explain what went wrong', required: true },
      { id: 'previousContact', label: 'Previous Contact Attempts', type: 'textarea', placeholder: 'Any previous emails, calls, or visits', required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally request a refund for {productName}{productModel}, purchased on {purchaseDate} for {amountPaid}.', placeholders: ['productName', 'productModel', 'purchaseDate', 'amountPaid'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Retailer: {retailerName}\nManufacturer: {manufacturerName}\n\n{issueDescription}', placeholders: ['retailerName', 'manufacturerName', 'issueDescription'] },
      { id: 'request', name: 'Request', template: 'I am requesting a full refund of {amountPaid} to my original payment method ({paymentMethod}).', placeholders: ['amountPaid', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'I kindly request a response within 14 days of receipt of this letter.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I trust this matter can be resolved amicably. I look forward to your prompt response.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-online-purchase',
    slug: 'refund-online-purchase',
    category: 'Refunds & Purchases',
    title: 'Online Purchase Refund Request',
    shortDescription: 'Request a refund for online orders that arrived wrong, damaged, or never arrived.',
    longDescription: `This letter template is designed specifically for e-commerce purchases. Whether you bought from a major retailer or a small online shop, this letter helps you formally request a refund for online orders.

Common scenarios:
• Item never arrived
• Wrong item delivered
• Product significantly different from listing photos
• Item arrived damaged in shipping
• Counterfeit or fake product received

Online purchases often have additional protections, including cooling-off periods for EU/UK consumers.`,
    seoTitle: 'Online Purchase Refund Letter – E-commerce Template',
    seoDescription: 'Get your money back for online orders gone wrong. Professional letter template for items not received, wrong items, or damaged deliveries.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Online Retailer Name', type: 'text', placeholder: 'e.g., Amazon, eBay', required: true },
      { id: 'sellerName', label: 'Seller Name', type: 'text', placeholder: 'e.g., Third-party seller name', required: false, helpText: 'If different from retailer' },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address or head office', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., 123-4567890-1234567', required: true },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'e.g., 1Z999AA10123456784', required: false },
      { id: 'purchaseDate', label: 'Order Date', type: 'date', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: false, helpText: 'If delivered' },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Bluetooth Speaker', required: true },
      { id: 'productModel', label: 'Model/SKU', type: 'text', placeholder: 'e.g., JBL-FLIP6-BLK', required: false },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'Including shipping', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Apple Pay', 'Google Pay', 'Klarna', 'Other'], required: true },
      { id: 'issueDescription', label: 'What Went Wrong', type: 'textarea', placeholder: 'Describe the issue in detail', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding order number {orderNumber}, placed on {purchaseDate} for {amountPaid}.', placeholders: ['orderNumber', 'purchaseDate', 'amountPaid'] },
      { id: 'facts', name: 'Order Details', template: 'Retailer: {retailerName}\nSeller: {sellerName}\nProduct: {productName} (Model: {productModel})\nTracking: {trackingNumber}\n\nThe following issue occurred: {issueDescription}', placeholders: ['retailerName', 'sellerName', 'productName', 'productModel', 'trackingNumber', 'issueDescription'] },
      { id: 'request', name: 'Request', template: 'I am requesting a full refund of {amountPaid} to my original payment method ({paymentMethod}).', placeholders: ['amountPaid', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days confirming how this will be resolved.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have retained all packaging and evidence related to this order.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-subscription',
    slug: 'refund-subscription',
    category: 'Refunds & Purchases',
    title: 'Subscription Cancellation Refund',
    shortDescription: 'Cancel a subscription and request a refund for unwanted charges.',
    longDescription: `This template helps you formally cancel subscriptions and request refunds for unauthorized or unwanted recurring charges. Many subscription services make cancellation difficult—a formal letter creates a paper trail.

Use this when:
• Subscription continued after you cancelled
• Free trial converted to paid without consent
• Annual subscription auto-renewed unexpectedly
• Price increased without proper notice
• Service quality declined significantly

Document all cancellation attempts before sending this letter.`,
    seoTitle: 'Subscription Cancellation Refund Letter Template',
    seoDescription: 'Cancel subscriptions and get refunds for unwanted recurring charges. Template for gym memberships, streaming services, and more.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'serviceName', label: 'Subscription Service Name', type: 'text', placeholder: 'e.g., Netflix, Spotify', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Head office or billing address', required: true },
      { id: 'accountNumber', label: 'Account/Member Number', type: 'text', placeholder: 'Your account identifier', required: false },
      { id: 'accountEmail', label: 'Account Email', type: 'text', placeholder: 'Email linked to subscription', required: true },
      { id: 'subscriptionType', label: 'Subscription Type', type: 'text', placeholder: 'e.g., Premium Monthly', required: true },
      { id: 'monthlyAmount', label: 'Amount Charged', type: 'text', placeholder: 'e.g., €12.99/month', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Direct Debit', 'Apple Pay', 'Google Pay', 'Other'], required: true },
      { id: 'startDate', label: 'Subscription Start Date', type: 'date', required: false },
      { id: 'cancellationDate', label: 'Date You Tried to Cancel', type: 'date', required: true },
      { id: 'refundAmount', label: 'Total Refund Requested', type: 'text', placeholder: 'Total of unwanted charges', required: true },
      { id: 'issueDescription', label: 'Describe the Problem', type: 'textarea', placeholder: 'Why you want a refund', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally cancel my {subscriptionType} subscription with {serviceName} and request a refund of {refundAmount}.', placeholders: ['subscriptionType', 'serviceName', 'refundAmount'] },
      { id: 'facts', name: 'Background', template: 'Account email: {accountEmail}\nAccount number: {accountNumber}\n\n{issueDescription}\n\nI attempted to cancel on {cancellationDate}.', placeholders: ['accountEmail', 'accountNumber', 'issueDescription', 'cancellationDate'] },
      { id: 'request', name: 'Request', template: 'Please confirm cancellation immediately and refund {refundAmount} to my original payment method ({paymentMethod}).', placeholders: ['refundAmount', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please confirm cancellation and refund within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please also confirm that no further charges will be made to my account.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-after-return',
    slug: 'refund-after-return',
    category: 'Refunds & Purchases',
    title: 'Refund After Return – Money Not Received',
    shortDescription: 'Chase a refund when you returned an item but never received your money back.',
    longDescription: `You returned the product as requested, but weeks later you still haven't received your refund. This letter formally chases the outstanding refund and creates pressure for resolution.

Common situations:
• Item returned via post but refund not processed
• Store accepted return but refund never appeared
• Exchange processed but price difference not refunded
• Return tracking shows delivered but company claims not received

Always include tracking numbers and proof of return.`,
    seoTitle: 'Refund Not Received After Return – Chase Letter',
    seoDescription: 'Item returned but no refund? Use this letter to chase companies for outstanding refunds after you returned their products.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', placeholder: 'Retailer name', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Original Order Number', type: 'text', placeholder: 'Original order reference', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Winter Jacket', required: true },
      { id: 'productModel', label: 'Model/SKU', type: 'text', placeholder: 'e.g., WJ-2024-BLK-L', required: false },
      { id: 'returnDate', label: 'Date Item Was Returned', type: 'date', required: true },
      { id: 'returnMethod', label: 'How Was It Returned?', type: 'select', options: ['Post with tracking', 'In-store return', 'Courier collection', 'Drop-off point'], required: true },
      { id: 'trackingNumber', label: 'Return Tracking Number', type: 'text', placeholder: 'If applicable', required: false },
      { id: 'refundAmount', label: 'Refund Amount Owed', type: 'text', placeholder: 'e.g., €149.99', required: true },
      { id: 'originalPaymentMethod', label: 'Original Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Klarna', 'Other'], required: true },
      { id: 'daysSinceReturn', label: 'Days Since Return', type: 'number', placeholder: 'e.g., 21', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding an outstanding refund of {refundAmount} for order {orderNumber}.', placeholders: ['refundAmount', 'orderNumber'] },
      { id: 'facts', name: 'Return Details', template: 'Retailer: {retailerName}\nProduct: {productName} (Model: {productModel})\n\nI returned the item on {returnDate} via {returnMethod}. Tracking number: {trackingNumber}\n\nIt has now been {daysSinceReturn} days and I have not received my refund.', placeholders: ['retailerName', 'productName', 'productModel', 'returnDate', 'returnMethod', 'trackingNumber', 'daysSinceReturn'] },
      { id: 'request', name: 'Request', template: 'Please process the refund of {refundAmount} to my original payment method ({originalPaymentMethod}) immediately.', placeholders: ['refundAmount', 'originalPaymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'I expect the refund to be processed within 7 days of this letter.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have proof of return and will escalate this matter if not resolved promptly.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-service-not-rendered',
    slug: 'refund-service-not-rendered',
    category: 'Refunds & Purchases',
    title: 'Service Not Rendered – Refund Request',
    shortDescription: 'Request a refund when you paid for a service that was never delivered.',
    longDescription: `This letter is for situations where you paid for a service that was never provided. Unlike product returns, service disputes require clear documentation of what was promised versus what was delivered.

Examples:
• Contractor took deposit but never started work
• Event/course cancelled but no refund offered
• Professional services not completed
• Appointment cancelled but still charged
• Work completed poorly or incompletely

Document all agreements, invoices, and communications.`,
    seoTitle: 'Service Not Provided Refund Letter Template',
    seoDescription: 'Get your money back when services are not delivered as promised. Professional letter for contractors, events, and service providers.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'providerName', label: 'Service Provider Name', type: 'text', placeholder: 'Business or individual name', required: true },
      { id: 'providerType', label: 'Provider Type', type: 'select', options: ['Contractor', 'Freelancer', 'Agency', 'Company', 'Individual', 'Other'], required: true },
      { id: 'companyAddress', label: 'Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'invoiceNumber', label: 'Invoice/Quote Number', type: 'text', placeholder: 'Reference number if any', required: false },
      { id: 'serviceName', label: 'Service Name', type: 'text', placeholder: 'e.g., Kitchen Renovation', required: true },
      { id: 'serviceDetails', label: 'Service Details', type: 'textarea', placeholder: 'Describe what was supposed to be provided', required: true },
      { id: 'agreedDate', label: 'Agreed Service Date', type: 'date', required: true },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'Deposit or full amount', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'Debit Card', 'PayPal', 'Other'], required: true },
      { id: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
      { id: 'issueDescription', label: 'What Happened', type: 'textarea', placeholder: 'Explain what was not delivered', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a refund of {amountPaid} paid on {paymentDate} for services not rendered.', placeholders: ['amountPaid', 'paymentDate'] },
      { id: 'facts', name: 'Background', template: 'Provider: {providerName} ({providerType})\nService: {serviceName}\n\nI paid for: {serviceDetails}\n\nThe service was scheduled for {agreedDate}.\n\n{issueDescription}', placeholders: ['providerName', 'providerType', 'serviceName', 'serviceDetails', 'agreedDate', 'issueDescription'] },
      { id: 'request', name: 'Request', template: 'As the service was not provided, I am entitled to a full refund of {amountPaid} via {paymentMethod}.', placeholders: ['amountPaid', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please process this refund within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have retained copies of all agreements and payment records.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-overcharge',
    slug: 'refund-overcharge',
    category: 'Refunds & Purchases',
    title: 'Overcharge Refund Request',
    shortDescription: 'Request a refund when charged more than the quoted or advertised price.',
    longDescription: `This template addresses situations where you were charged more than expected. Price discrepancies can occur due to errors, hidden fees, or misleading advertising.

Use when:
• Charged more than the displayed price
• Hidden fees added at checkout
• Price increased after quote was given
• Promotional price not applied
• Tax calculated incorrectly

Keep screenshots of advertised prices and written quotes.`,
    seoTitle: 'Overcharge Refund Letter – Wrong Price Charged',
    seoDescription: 'Charged more than advertised? Request a refund for overcharges with this professional letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'orderNumber', label: 'Order/Invoice Number', type: 'text', required: false },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Laptop Stand', required: true },
      { id: 'productModel', label: 'Model/SKU', type: 'text', placeholder: 'e.g., LS-PRO-2024', required: false },
      { id: 'advertisedPrice', label: 'Advertised/Quoted Price', type: 'text', placeholder: 'The price you expected', required: true },
      { id: 'chargedPrice', label: 'Amount Actually Charged', type: 'text', placeholder: 'What appeared on your statement', required: true },
      { id: 'overchargeAmount', label: 'Overcharge Amount', type: 'text', placeholder: 'Difference between the two', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash', 'Other'], required: true },
      { id: 'hasEvidence', label: 'Do You Have Evidence of Original Price?', type: 'select', options: ['Yes - screenshot', 'Yes - written quote', 'Yes - receipt', 'No'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a refund of {overchargeAmount} due to being overcharged for my purchase.', placeholders: ['overchargeAmount'] },
      { id: 'facts', name: 'Price Discrepancy', template: 'Retailer: {retailerName}\n\nOn {purchaseDate}, I purchased {productName} (Model: {productModel}).\n\nThe advertised price was {advertisedPrice}, but I was charged {chargedPrice}.', placeholders: ['retailerName', 'purchaseDate', 'productName', 'productModel', 'advertisedPrice', 'chargedPrice'] },
      { id: 'request', name: 'Request', template: 'Please refund the overcharge amount of {overchargeAmount} to my {paymentMethod} immediately.', placeholders: ['overchargeAmount', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'I request a response within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have retained evidence of the original advertised price.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-double-charge',
    slug: 'refund-double-charge',
    category: 'Refunds & Purchases',
    title: 'Double Charge Refund Request',
    shortDescription: 'Request a refund when you were charged twice for the same purchase.',
    longDescription: `Duplicate billing is a common problem, especially with online purchases. This letter formally requests return of the duplicate charge.

Common causes:
• Transaction processed twice
• System error during payment
• Charged by both store and online
• Multiple hold charges not released
• Subscription billed twice in one period

Check your bank statement carefully and document both charges.`,
    seoTitle: 'Double Charge Refund Letter – Duplicate Billing',
    seoDescription: 'Charged twice for one purchase? Use this letter template to get your duplicate charge refunded.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', required: true },
      { id: 'firstChargeDate', label: 'Date of First Charge', type: 'date', required: true },
      { id: 'secondChargeDate', label: 'Date of Second Charge', type: 'date', required: true },
      { id: 'chargeAmount', label: 'Amount of Each Charge', type: 'text', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Other'], required: true },
      { id: 'lastFourDigits', label: 'Last 4 Digits of Card', type: 'text', placeholder: 'e.g., 1234', required: false },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Mouse', required: true },
      { id: 'productModel', label: 'Model/SKU', type: 'text', required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a refund for a duplicate charge of {chargeAmount} on my account.', placeholders: ['chargeAmount'] },
      { id: 'facts', name: 'Charge Details', template: 'Retailer: {retailerName}\nOrder number: {orderNumber}\nPayment method: {paymentMethod} ending in {lastFourDigits}\n\nFirst charge: {firstChargeDate} - {chargeAmount}\nSecond charge: {secondChargeDate} - {chargeAmount}\n\nI only made one purchase of {productName} (Model: {productModel}).', placeholders: ['retailerName', 'orderNumber', 'paymentMethod', 'lastFourDigits', 'firstChargeDate', 'chargeAmount', 'secondChargeDate', 'productName', 'productModel'] },
      { id: 'request', name: 'Request', template: 'Please refund the duplicate charge of {chargeAmount} to my {paymentMethod} immediately.', placeholders: ['chargeAmount', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'I expect the refund within 7 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached bank statements showing both charges.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-gym-membership',
    slug: 'refund-gym-membership',
    category: 'Refunds & Purchases',
    title: 'Gym Membership Refund Request',
    shortDescription: 'Cancel your gym membership and request a refund for unused months.',
    longDescription: `Gym memberships can be notoriously difficult to cancel. This letter formally requests cancellation and any applicable refunds.

Valid reasons for refund:
• Moving to an area without branches
• Medical condition preventing exercise
• Facility closure or reduced services
• Significant changes to terms
• Cooling-off period (within 14 days of signing)

Check your contract terms and local consumer laws.`,
    seoTitle: 'Gym Membership Cancellation & Refund Letter',
    seoDescription: 'Cancel your gym membership and request a refund. Professional letter template for fitness club disputes.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'gymName', label: 'Gym Name', type: 'text', placeholder: 'e.g., PureGym, Anytime Fitness', required: true },
      { id: 'gymBranch', label: 'Branch/Location', type: 'text', placeholder: 'e.g., Manchester City Centre', required: false },
      { id: 'gymAddress', label: 'Gym Address', type: 'textarea', required: true },
      { id: 'membershipNumber', label: 'Membership Number', type: 'text', required: true },
      { id: 'memberName', label: 'Member Name', type: 'text', placeholder: 'Name on membership', required: true },
      { id: 'membershipType', label: 'Membership Type', type: 'text', placeholder: 'e.g., Annual, Monthly', required: true },
      { id: 'joinDate', label: 'Date Joined', type: 'date', required: true },
      { id: 'monthlyFee', label: 'Monthly Fee', type: 'text', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Direct Debit', 'Credit Card', 'Debit Card', 'Cash', 'Other'], required: true },
      { id: 'cancellationReason', label: 'Reason for Cancellation', type: 'select', options: ['Moving away', 'Medical reasons', 'Facility issues', 'Financial hardship', 'Cooling-off period', 'Other'], required: true },
      { id: 'refundAmount', label: 'Refund Requested', type: 'text', placeholder: 'Total refund expected', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to cancel my {membershipType} membership (number: {membershipNumber}) at {gymName} {gymBranch} and request a refund of {refundAmount}.', placeholders: ['membershipType', 'membershipNumber', 'gymName', 'gymBranch', 'refundAmount'] },
      { id: 'facts', name: 'Background', template: 'Member name: {memberName}\nI joined on {joinDate}, paying {monthlyFee} per month via {paymentMethod}.\n\nReason for cancellation: {cancellationReason}', placeholders: ['memberName', 'joinDate', 'monthlyFee', 'paymentMethod', 'cancellationReason'] },
      { id: 'request', name: 'Request', template: 'Please process the cancellation immediately and refund {refundAmount} to my {paymentMethod}.', placeholders: ['refundAmount', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please confirm within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please confirm in writing that no further payments will be taken.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-event-cancelled',
    slug: 'refund-event-cancelled',
    category: 'Refunds & Purchases',
    title: 'Cancelled Event Refund Request',
    shortDescription: 'Request a refund for a concert, show, sports event, or other event that was cancelled.',
    longDescription: `When events are cancelled, you are typically entitled to a refund. This letter helps you formally request your money back.

Covered events:
• Concerts and music festivals
• Theatre and shows
• Sports matches
• Conferences and seminars
• Weddings and private events
• Classes and courses

Refund rights vary by jurisdiction and ticket terms.`,
    seoTitle: 'Cancelled Event Refund Letter – Concert & Ticket Template',
    seoDescription: 'Get your money back for cancelled events. Professional refund letter for concerts, shows, sports, and more.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'ticketSellerName', label: 'Ticket Seller/Venue', type: 'text', required: true },
      { id: 'sellerAddress', label: 'Address', type: 'textarea', required: true },
      { id: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { id: 'eventName', label: 'Event Name', type: 'text', placeholder: 'e.g., Artist Name Live Tour', required: true },
      { id: 'originalDate', label: 'Original Event Date', type: 'date', required: true },
      { id: 'ticketQuantity', label: 'Number of Tickets', type: 'number', required: true },
      { id: 'ticketPrice', label: 'Price Per Ticket', type: 'text', required: true },
      { id: 'totalPaid', label: 'Total Amount Paid', type: 'text', required: true },
      { id: 'cancellationDate', label: 'When Was It Cancelled?', type: 'date', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a refund for {eventName} (booking ref: {bookingReference}), which was cancelled.', placeholders: ['eventName', 'bookingReference'] },
      { id: 'facts', name: 'Booking Details', template: 'Original date: {originalDate}\nTickets: {ticketQuantity} at {ticketPrice} each\nTotal paid: {totalPaid}\n\nThe event was cancelled on {cancellationDate}.', placeholders: ['originalDate', 'ticketQuantity', 'ticketPrice', 'totalPaid', 'cancellationDate'] },
      { id: 'request', name: 'Request', template: 'Please refund the full amount of {totalPaid} to my original payment method.', placeholders: ['totalPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'I expect the refund within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I do not wish to accept vouchers or rescheduled tickets as an alternative to refund.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-course-training',
    slug: 'refund-course-training',
    category: 'Refunds & Purchases',
    title: 'Course/Training Refund Request',
    shortDescription: 'Request a refund for online courses, training programs, or educational materials.',
    longDescription: `Online courses and training programs should deliver what they promise. This letter helps you request a refund when educational products fall short.

Use when:
• Course content differs significantly from description
• Quality is unacceptably poor
• Platform issues prevent access
• Instructor/support unresponsive
• Within money-back guarantee period
• Course discontinued or incomplete

Many courses offer satisfaction guarantees—check the terms.`,
    seoTitle: 'Online Course Refund Letter – Training Program Template',
    seoDescription: 'Request a refund for online courses and training that did not deliver. Template for educational product disputes.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'providerName', label: 'Course Provider', type: 'text', required: true },
      { id: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
      { id: 'courseName', label: 'Course Name', type: 'text', required: true },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true },
      { id: 'enrollmentReference', label: 'Enrollment/Order Number', type: 'text', required: false },
      { id: 'completionStatus', label: 'Course Progress', type: 'select', options: ['Not started', 'Less than 25%', '25-50%', 'More than 50%'], required: true },
      { id: 'issueDescription', label: 'Reason for Refund', type: 'textarea', placeholder: 'Why does this course not meet expectations?', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a refund of {amountPaid} for the course "{courseName}" purchased on {purchaseDate}.', placeholders: ['amountPaid', 'courseName', 'purchaseDate'] },
      { id: 'facts', name: 'Background', template: 'Course progress: {completionStatus}\n\n{issueDescription}', placeholders: ['completionStatus', 'issueDescription'] },
      { id: 'request', name: 'Request', template: 'Please process a full refund of {amountPaid}.', placeholders: ['amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'I request a response within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'The course has not delivered the value promised in the sales materials.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-deposit',
    slug: 'refund-deposit',
    category: 'Refunds & Purchases',
    title: 'Deposit Return Request',
    shortDescription: 'Request the return of a deposit paid for goods, services, or rentals.',
    longDescription: `This letter formally requests the return of a deposit. Deposits should be returned when the underlying agreement ends or is not fulfilled.

Common deposit types:
• Product pre-order deposits
• Service booking deposits
• Equipment rental deposits
• Venue or event deposits
• Custom order deposits

Terms for deposit return vary—review your agreement carefully.`,
    seoTitle: 'Deposit Refund Request Letter – Get Your Deposit Back',
    seoDescription: 'Formally request the return of deposits for services, products, or rentals. Professional letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'depositAmount', label: 'Deposit Amount', type: 'text', required: true },
      { id: 'depositDate', label: 'Date Paid', type: 'date', required: true },
      { id: 'paymentMethod', label: 'How Deposit Was Paid', type: 'select', options: ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'Debit Card', 'PayPal', 'Other'], required: true },
      { id: 'depositType', label: 'Deposit Type', type: 'select', options: ['Pre-order deposit', 'Service booking deposit', 'Equipment rental deposit', 'Venue deposit', 'Custom order deposit', 'Other'], required: true },
      { id: 'depositPurpose', label: 'What Was the Deposit For?', type: 'textarea', required: true },
      { id: 'agreementReference', label: 'Agreement/Invoice Number', type: 'text', required: false },
      { id: 'reasonForReturn', label: 'Why Should Deposit Be Returned?', type: 'textarea', placeholder: 'e.g., Service completed, order cancelled, agreement ended', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request the return of my {depositType} deposit of {depositAmount}, paid on {depositDate}.', placeholders: ['depositType', 'depositAmount', 'depositDate'] },
      { id: 'facts', name: 'Deposit Details', template: 'The deposit was paid via {paymentMethod} for: {depositPurpose}\n\nReference: {agreementReference}\n\n{reasonForReturn}', placeholders: ['paymentMethod', 'depositPurpose', 'agreementReference', 'reasonForReturn'] },
      { id: 'request', name: 'Request', template: 'Please return the full deposit amount of {depositAmount} to my {paymentMethod}.', placeholders: ['depositAmount', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'I request the deposit within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please confirm receipt and expected refund date.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-cooling-off',
    slug: 'refund-cooling-off',
    category: 'Refunds & Purchases',
    title: 'Cooling-Off Period Cancellation (EU/UK)',
    shortDescription: 'Exercise your 14-day cooling-off right for distance purchases.',
    longDescription: `EU and UK consumers have a 14-day right to cancel most distance purchases (online, phone, doorstep sales) without giving a reason. This letter formally exercises that right.

Covered purchases:
• Online orders
• Phone/mail order purchases
• Doorstep sales
• Contracts signed away from business premises

Exceptions include custom-made items, perishables, sealed hygiene products, and some services.`,
    seoTitle: 'Cooling-Off Period Cancellation Letter – 14 Day Right',
    seoDescription: 'Exercise your 14-day cooling-off right for online purchases. EU and UK consumer rights letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', required: true },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'deliveryDate', label: 'Delivery/Receipt Date', type: 'date', required: false },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Office Chair', required: true },
      { id: 'productModel', label: 'Model/SKU', type: 'text', required: false },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Other'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to exercise my right to cancel within the cooling-off period for order {orderNumber} from {retailerName}.', placeholders: ['orderNumber', 'retailerName'] },
      { id: 'facts', name: 'Order Details', template: 'Order date: {orderDate}\nProduct: {productName} (Model: {productModel})\nAmount paid: {amountPaid}\nPayment method: {paymentMethod}', placeholders: ['orderDate', 'productName', 'productModel', 'amountPaid', 'paymentMethod'] },
      { id: 'request', name: 'Request', template: 'Please process a full refund of {amountPaid} to my {paymentMethod} and provide return instructions.', placeholders: ['amountPaid', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'The refund should be processed within 14 days of cancellation.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'This cancellation is within the statutory 14-day period.', placeholders: [] },
    ],
    jurisdictions: [
      { code: 'UK', name: 'United Kingdom', legalReference: 'Consumer Contracts Regulations 2013', approvedPhrases: ['Under the Consumer Contracts Regulations 2013, I have 14 days to cancel this contract'] },
      { code: 'EU', name: 'European Union', legalReference: 'Consumer Rights Directive 2011/83/EU', approvedPhrases: ['Under the Consumer Rights Directive, I have 14 days to withdraw from this contract'] },
    ],
  },
  {
    id: 'refund-gift-card',
    slug: 'refund-gift-card',
    category: 'Refunds & Purchases',
    title: 'Gift Card Refund Request',
    shortDescription: 'Request a refund or cash value for unused or expired gift cards.',
    longDescription: `Gift card refund rights vary by jurisdiction and company policy. Some places require cash back for low balances; others may refund unused cards in certain circumstances.

When you may have refund rights:
• Card has never been used
• Small remaining balance (varies by jurisdiction)
• Business closed down
• Card was purchased in error
• Card was a gift but you prefer refund

Check local laws and company policies.`,
    seoTitle: 'Gift Card Refund Letter – Cash Back Template',
    seoDescription: 'Request a refund or cash value for gift cards. Letter template for unused or low-balance gift cards.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer/Issuer Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Address', type: 'textarea', required: true },
      { id: 'giftCardNumber', label: 'Gift Card Number', type: 'text', placeholder: 'Last 4 digits only for security', required: true },
      { id: 'originalValue', label: 'Original Card Value', type: 'text', required: true },
      { id: 'currentBalance', label: 'Current Balance', type: 'text', required: true },
      { id: 'purchaseDate', label: 'Purchase Date (if known)', type: 'date', required: false },
      { id: 'refundReason', label: 'Reason for Request', type: 'textarea', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a cash refund for a gift card with current balance of {currentBalance}.', placeholders: ['currentBalance'] },
      { id: 'facts', name: 'Gift Card Details', template: 'Gift card ending in: {giftCardNumber}\nOriginal value: {originalValue}\nCurrent balance: {currentBalance}\n\n{refundReason}', placeholders: ['giftCardNumber', 'originalValue', 'currentBalance', 'refundReason'] },
      { id: 'request', name: 'Request', template: 'Please issue a cash refund for the balance of {currentBalance}.', placeholders: ['currentBalance'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I am happy to return the physical card if required.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-pre-order',
    slug: 'refund-pre-order',
    category: 'Refunds & Purchases',
    title: 'Pre-Order Cancellation & Refund',
    shortDescription: 'Cancel a pre-order and request a refund before the product ships.',
    longDescription: `Pre-orders can usually be cancelled before the product ships. This letter formally requests cancellation and return of any payments made.

Reasons to cancel:
• Product delayed significantly
• Specifications changed from original listing
• Found a better price elsewhere
• Financial circumstances changed
• Changed your mind

Act quickly before the item ships.`,
    seoTitle: 'Pre-Order Cancellation Letter – Refund Template',
    seoDescription: 'Cancel pre-orders and get your money back before shipping. Professional letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Address', type: 'textarea', required: true },
      { id: 'orderNumber', label: 'Pre-Order Number', type: 'text', required: true },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', required: true },
      { id: 'productModel', label: 'Model/Edition', type: 'text', placeholder: 'e.g., Limited Edition', required: false },
      { id: 'manufacturerName', label: 'Manufacturer', type: 'text', placeholder: 'e.g., Sony, Apple', required: false },
      { id: 'expectedDate', label: 'Expected Release Date', type: 'date', required: false },
      { id: 'amountPaid', label: 'Amount Paid/Deposited', type: 'text', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Store Credit', 'Other'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to cancel my pre-order (order number: {orderNumber}) for {productName} from {retailerName}.', placeholders: ['orderNumber', 'productName', 'retailerName'] },
      { id: 'facts', name: 'Order Details', template: 'Retailer: {retailerName}\nManufacturer: {manufacturerName}\nOrder date: {orderDate}\nProduct: {productName} ({productModel})\nExpected release: {expectedDate}\nAmount paid: {amountPaid}', placeholders: ['retailerName', 'manufacturerName', 'orderDate', 'productName', 'productModel', 'expectedDate', 'amountPaid'] },
      { id: 'request', name: 'Request', template: 'Please cancel this pre-order and refund {amountPaid} to my {paymentMethod}.', placeholders: ['amountPaid', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please confirm cancellation within 7 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please ensure no shipment is made and process the refund promptly.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'refund-trial-conversion',
    slug: 'refund-trial-conversion',
    category: 'Refunds & Purchases',
    title: 'Free Trial Conversion Dispute',
    shortDescription: 'Dispute charges when a free trial converted to paid without proper consent.',
    longDescription: `Many free trials automatically convert to paid subscriptions. If you were charged without clear consent or proper notice, you may be entitled to a refund.

Common issues:
• Trial converted without reminder
• Cancellation process was unclear or broken
• Credit card charged without authorization
• Terms were buried in fine print
• Unable to cancel before conversion

Document any attempts to cancel before the trial ended.`,
    seoTitle: 'Free Trial Charge Dispute Letter – Unauthorized Conversion',
    seoDescription: 'Dispute charges from free trials that converted without consent. Template for trial subscription disputes.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'serviceName', label: 'Service Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'trialStartDate', label: 'Trial Start Date', type: 'date', required: true },
      { id: 'trialEndDate', label: 'Trial End Date', type: 'date', required: true },
      { id: 'chargeDate', label: 'Date of Unauthorized Charge', type: 'date', required: true },
      { id: 'chargeAmount', label: 'Amount Charged', type: 'text', required: true },
      { id: 'paymentMethod', label: 'Payment Method Charged', type: 'select', options: ['Credit Card', 'Debit Card', 'PayPal', 'Direct Debit', 'Other'], required: true },
      { id: 'lastFourDigits', label: 'Last 4 Digits of Card', type: 'text', placeholder: 'e.g., 1234', required: false },
      { id: 'cancellationAttempts', label: 'Did You Try to Cancel?', type: 'textarea', placeholder: 'Describe any attempts', required: false },
      { id: 'accountEmail', label: 'Account Email', type: 'text', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute a charge of {chargeAmount} made on {chargeDate} by {serviceName} following a free trial.', placeholders: ['chargeAmount', 'chargeDate', 'serviceName'] },
      { id: 'facts', name: 'Background', template: 'Account email: {accountEmail}\nPayment method: {paymentMethod} ending in {lastFourDigits}\n\nI signed up for a free trial on {trialStartDate}, which was supposed to end on {trialEndDate}.\n\nI did not consent to conversion to a paid subscription. {cancellationAttempts}', placeholders: ['accountEmail', 'paymentMethod', 'lastFourDigits', 'trialStartDate', 'trialEndDate', 'cancellationAttempts'] },
      { id: 'request', name: 'Request', template: 'Please refund {chargeAmount} to my {paymentMethod} and cancel any subscription immediately.', placeholders: ['chargeAmount', 'paymentMethod'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'If not resolved, I will dispute this charge with my bank.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
    
  },
];

// Combine all refunds templates
export const refundsTemplates: LetterTemplate[] = [
  ...coreRefundsTemplates,
  ...retailComplaintTemplates,
  ...digitalPurchaseTemplates,
  ...serviceRefundTemplates,
  ...billingDisputeTemplates,
  ...specialPurchaseTemplates,
  ...warrantyTemplates,
  ...deliveryIssueTemplates,
];
