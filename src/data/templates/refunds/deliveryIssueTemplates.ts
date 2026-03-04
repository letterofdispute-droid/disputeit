import { LetterTemplate } from '../../letterTemplates';

const deliveryJurisdictions = [
  {
    code: 'US',
    name: 'United States',
    legalReference: 'FTC Mail Order Rule (16 CFR Part 435), UCC Article 2',
    approvedPhrases: ['Under the FTC Mail Order Rule', 'Pursuant to my rights under the Uniform Commercial Code'],
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    legalReference: 'Consumer Rights Act 2015, Consumer Contracts Regulations 2013',
    approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with the Consumer Contracts Regulations 2013'],
  },
  {
    code: 'EU',
    name: 'European Union',
    legalReference: 'Consumer Rights Directive 2011/83/EU, EU Consumer Sales Directive',
    approvedPhrases: ['Under EU consumer protection regulations', 'As provided by the Consumer Rights Directive'],
  },
  {
    code: 'INTL',
    name: 'International / Other',
    approvedPhrases: ['In accordance with applicable consumer protection standards'],
  },
];

export const deliveryIssueTemplates: LetterTemplate[] = [
  {
    id: 'late-delivery-compensation',
    slug: 'late-delivery-compensation',
    category: 'Refunds & Purchases',
    title: 'Late Delivery Compensation Request',
    shortDescription: 'Claim compensation when a delivery missed the promised or guaranteed delivery date.',
    longDescription: `When a company fails to deliver by the date they promised—especially when you paid extra for expedited shipping—you have the right to seek compensation. A missed delivery date can be more than an inconvenience, particularly for time-sensitive purchases.

When to use this letter:
• A guaranteed delivery date was missed (e.g., next-day, 2-day shipping)
• You paid for premium/expedited shipping that wasn't honored
• The delivery was for a specific event and arrived too late to be useful
• The company's own tracking shows a delivery failure on their end
• You suffered financial loss due to the late delivery (e.g., had to buy a replacement locally)

Under UK/EU law, if you specified a delivery date as essential, late delivery may entitle you to cancel and receive a full refund.`,
    seoTitle: 'Late Delivery Compensation Letter – Claim Your Rights',
    seoDescription: 'Delivery missed the promised date? Claim a refund on shipping costs or full compensation. Professional letter template for late deliveries.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Amazon, FedEx, DHL', required: true, impactLevel: 'high' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address of retailer or shipping company', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., ORD-2024-123456', required: true, impactLevel: 'high' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'e.g., 1Z999AA10123456784', required: false },
      { id: 'productName', label: 'Item(s) Ordered', type: 'text', placeholder: 'e.g., Birthday gift set, Office supplies', required: true },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'promisedDeliveryDate', label: 'Promised Delivery Date', type: 'date', required: true, impactLevel: 'high' as const },
      { id: 'actualDeliveryDate', label: 'Actual Delivery Date', type: 'date', required: false, impactLevel: 'high' as const },
      { id: 'shippingMethod', label: 'Shipping Method Paid For', type: 'select', options: ['Standard Shipping', 'Expedited/Express', 'Next-Day/Overnight', 'Same-Day', '2-Day Shipping', 'Scheduled Delivery'], required: true },
      { id: 'shippingCost', label: 'Shipping Cost Paid', type: 'text', placeholder: 'e.g., $24.99', required: true, impactLevel: 'high' as const },
      { id: 'totalOrderAmount', label: 'Total Order Amount', type: 'text', placeholder: 'e.g., $149.99', required: true },
      { id: 'impactDescription', label: 'Impact of Late Delivery', type: 'textarea', placeholder: 'How did the late delivery affect you? Was it for an event?', required: true, aiEnhanced: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding order {orderNumber}, placed on {orderDate}, for which delivery was guaranteed by {promisedDeliveryDate}. The order was not delivered until {actualDeliveryDate}, violating the delivery commitment.', placeholders: ['orderNumber', 'orderDate', 'promisedDeliveryDate', 'actualDeliveryDate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Item(s): {productName}\nShipping method selected and paid for: {shippingMethod} ({shippingCost})\nTracking number: {trackingNumber}\n\nThe delivery was late by multiple days despite paying for {shippingMethod}.\n\nImpact: {impactDescription}', placeholders: ['productName', 'shippingMethod', 'shippingCost', 'trackingNumber', 'impactDescription'] },
      { id: 'request', name: 'Request', template: 'I am requesting a full refund of the shipping charges ({shippingCost}) and appropriate compensation for the failed delivery commitment. The total order value was {totalOrderAmount}.', placeholders: ['shippingCost', 'totalOrderAmount'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days with confirmation of the refund and any additional compensation offered.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I trust this can be resolved promptly. If not, I will pursue a chargeback with my payment provider and file a complaint with the relevant consumer protection authority.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-damage-complaint',
    slug: 'delivery-damage-complaint',
    category: 'Refunds & Purchases',
    title: 'Item Damaged During Delivery – Complaint Letter',
    shortDescription: 'Demand a replacement or refund for a product that arrived damaged during shipping.',
    longDescription: `Receiving a damaged product is frustrating, especially when the retailer and shipping carrier point fingers at each other. Under consumer law, the retailer is responsible for ensuring goods arrive in satisfactory condition—regardless of who handled shipping.

When to use this letter:
• A product arrived with visible physical damage
• Packaging was crushed, torn, or waterlogged
• The item inside was broken, scratched, or non-functional due to transit damage
• The retailer claims it's the carrier's fault and refuses responsibility
• You documented the damage with photos upon delivery

Always photograph damaged packaging BEFORE opening and the damaged item immediately after.`,
    seoTitle: 'Damaged Delivery Complaint Letter – Get Replacement or Refund',
    seoDescription: 'Item arrived damaged in shipping? Demand a replacement or refund with this complaint letter template. The retailer is responsible, not you.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Wayfair, IKEA, Target', required: true, impactLevel: 'high' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., WF-20240301-9876', required: true, impactLevel: 'high' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Shipping tracking number', required: false },
      { id: 'carrierName', label: 'Shipping Carrier', type: 'select', options: ['UPS', 'FedEx', 'USPS', 'DHL', 'Royal Mail', 'DPD', 'Hermes/Evri', 'Amazon Logistics', 'Other'], required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Glass Coffee Table', required: true, impactLevel: 'high' as const },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'e.g., $459.99', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'damageDescription', label: 'Describe the Damage', type: 'textarea', placeholder: 'What specifically is damaged? How severe is it?', required: true, impactLevel: 'high' as const, aiEnhanced: true },
      { id: 'packagingCondition', label: 'Condition of Packaging on Arrival', type: 'textarea', placeholder: 'Was the box crushed, wet, torn, etc.?', required: true, evidenceHint: 'Photograph the packaging before and during opening' },
      { id: 'hasPhotos', label: 'Do You Have Photos of the Damage?', type: 'select', options: ['Yes - photos of packaging and item', 'Yes - photos of item only', 'Yes - photos of packaging only', 'No photos taken'], required: true },
      { id: 'preferredResolution', label: 'Preferred Resolution', type: 'select', options: ['Full replacement', 'Full refund', 'Partial refund / discount', 'Either replacement or refund'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to report that {productName}, ordered under reference {orderNumber} and delivered on {deliveryDate}, arrived in a damaged condition.', placeholders: ['productName', 'orderNumber', 'deliveryDate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Retailer: {companyName}\nCarrier: {carrierName}\nTracking: {trackingNumber}\n\nCondition of packaging upon delivery: {packagingCondition}\n\nDamage to the product: {damageDescription}\n\nPhotographic evidence: {hasPhotos}', placeholders: ['companyName', 'carrierName', 'trackingNumber', 'packagingCondition', 'damageDescription', 'hasPhotos'] },
      { id: 'request', name: 'Request', template: 'As the retailer, you are responsible for ensuring goods arrive in satisfactory condition. I am requesting a {preferredResolution}. The item cost {amountPaid} and is not usable in its current state.', placeholders: ['preferredResolution', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days with instructions for return (at your expense) and confirmation of the {preferredResolution}.', placeholders: ['preferredResolution'] },
      { id: 'closing', name: 'Closing', template: 'I have retained the damaged item and all packaging as evidence. Please arrange collection or provide a prepaid return label—I should not bear any cost for returning a product that arrived damaged.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-never-arrived',
    slug: 'delivery-never-arrived',
    category: 'Refunds & Purchases',
    title: 'Package Never Arrived – Refund Demand',
    shortDescription: 'Demand a refund or reshipment when your package was marked delivered but never received.',
    longDescription: `One of the most frustrating e-commerce problems: your tracking says "delivered" but you never received the package. Whether it was stolen, misdelivered, or lost by the carrier, the retailer is obligated to ensure you receive what you paid for.

When to use this letter:
• Tracking shows "delivered" but you never received the package
• Package was left in an unsecured location without your consent
• Delivery was made to a wrong address
• Package has been "in transit" for weeks with no updates
• The carrier claims delivery but no signature was obtained
• You've already contacted customer service without resolution

Under the FTC Mail Order Rule, sellers must deliver within the promised timeframe or offer a full refund. Under UK/EU law, goods are at the seller's risk until they reach you.`,
    seoTitle: 'Package Never Arrived Letter – Demand Refund or Reshipment',
    seoDescription: 'Package marked delivered but never received? Demand a refund or reshipment. Free professional letter template for lost or stolen deliveries.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Amazon, Zara, Nike', required: true, impactLevel: 'high' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., 114-5678901-2345678', required: true, impactLevel: 'high' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Full tracking number', required: true },
      { id: 'carrierName', label: 'Shipping Carrier', type: 'select', options: ['UPS', 'FedEx', 'USPS', 'DHL', 'Royal Mail', 'DPD', 'Hermes/Evri', 'Amazon Logistics', 'Other'], required: true },
      { id: 'productName', label: 'Item(s) Ordered', type: 'text', placeholder: 'e.g., Winter jacket, Electronics bundle', required: true },
      { id: 'amountPaid', label: 'Order Total', type: 'text', placeholder: 'e.g., $189.99', required: true, impactLevel: 'high' as const },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: 'date', required: true },
      { id: 'trackingStatus', label: 'Current Tracking Status', type: 'select', options: ['Shows "Delivered" but not received', 'Stuck "In Transit" for over a week', 'No tracking updates at all', 'Delivered to wrong address', 'Left at unsecured location'], required: true, impactLevel: 'high' as const },
      { id: 'deliveryLocation', label: 'Where Does Tracking Say It Was Left?', type: 'text', placeholder: 'e.g., "Front door", "Mailbox", no info given', required: false },
      { id: 'previousContact', label: 'Previous Contact with Company', type: 'textarea', placeholder: 'Dates and outcomes of previous attempts to resolve', required: false, evidenceHint: 'Include chat transcripts, email dates, case numbers' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding order {orderNumber}, placed on {orderDate} for {amountPaid}, which I have not received despite the tracking ({trackingNumber}) indicating the status: {trackingStatus}.', placeholders: ['orderNumber', 'orderDate', 'amountPaid', 'trackingNumber', 'trackingStatus'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Item(s): {productName}\nCarrier: {carrierName}\nExpected delivery: {expectedDeliveryDate}\nTracking status: {trackingStatus}\nDelivery location noted: {deliveryLocation}\n\nI have checked thoroughly and the package was not received. No signature was required or obtained.\n\nPrevious contact attempts: {previousContact}', placeholders: ['productName', 'carrierName', 'expectedDeliveryDate', 'trackingStatus', 'deliveryLocation', 'previousContact'] },
      { id: 'request', name: 'Request', template: 'I am requesting either: (1) immediate reshipment of {productName}, or (2) a full refund of {amountPaid}. As the seller, you bear the risk of delivery until goods are in the buyer\'s possession.', placeholders: ['productName', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 10 days with confirmation of a reshipment or refund. If I do not hear back, I will initiate a chargeback with my payment provider.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I am a paying customer who did not receive the goods I paid for. I expect this to be resolved without further delay.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'shipping-overcharge-complaint',
    slug: 'shipping-overcharge-complaint',
    category: 'Refunds & Purchases',
    title: 'Shipping Overcharge – Refund Request',
    shortDescription: 'Request a refund when you were charged for premium shipping but received standard delivery.',
    longDescription: `If you paid for expedited or premium shipping but your order was actually shipped via standard delivery, you've been overcharged. This is a straightforward billing dispute—you paid for a service level that wasn't provided.

When to use this letter:
• You paid for next-day shipping but the item shipped via ground/standard
• Express shipping was charged but delivery took the same time as free shipping would have
• The shipping method on the tracking doesn't match what you paid for
• A "shipping and handling" surcharge was applied but the item shipped in a standard envelope
• The company charged separate shipping on items that shipped together

This letter requests a refund of the shipping cost difference between what you paid and what was actually provided.`,
    seoTitle: 'Shipping Overcharge Refund Letter – Claim the Difference',
    seoDescription: 'Paid for express shipping but got standard delivery? Demand a refund for the overcharge with this professional complaint letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Nordstrom, Best Buy', required: true, impactLevel: 'high' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., NRD-2024-567890', required: true },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Tracking number showing actual shipping method', required: true, evidenceHint: 'The tracking details will show what carrier service was actually used' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'shippingMethodPaid', label: 'Shipping Method You Paid For', type: 'select', options: ['Next-Day/Overnight', 'Two-Day Express', 'Express/Priority', 'Expedited (3-5 days)', 'White Glove/Special Delivery'], required: true, impactLevel: 'high' as const },
      { id: 'shippingMethodReceived', label: 'Shipping Method Actually Used', type: 'select', options: ['Standard Ground (5-10 days)', 'Economy/Basic', 'Standard Post', 'Same as free shipping option', 'Unknown/Not specified'], required: true, impactLevel: 'high' as const },
      { id: 'shippingAmountPaid', label: 'Shipping Amount Charged', type: 'text', placeholder: 'e.g., $29.99', required: true, impactLevel: 'high' as const },
      { id: 'standardShippingCost', label: 'Standard Shipping Cost (what it should have been)', type: 'text', placeholder: 'e.g., $5.99 or Free', required: true },
      { id: 'totalOrderAmount', label: 'Total Order Amount', type: 'text', placeholder: 'e.g., $199.99', required: true },
      { id: 'productName', label: 'Item(s) Ordered', type: 'text', placeholder: 'e.g., Running shoes', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request a refund of shipping charges for order {orderNumber}. I paid {shippingAmountPaid} for {shippingMethodPaid}, but my order was shipped via {shippingMethodReceived}.', placeholders: ['orderNumber', 'shippingAmountPaid', 'shippingMethodPaid', 'shippingMethodReceived'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Order date: {orderDate}\nItem(s): {productName}\nShipping selected and paid: {shippingMethodPaid} — {shippingAmountPaid}\nActual shipping method per tracking ({trackingNumber}): {shippingMethodReceived}\nStandard shipping would have cost: {standardShippingCost}\n\nI paid a premium for faster shipping that was not provided. This constitutes an overcharge.', placeholders: ['orderDate', 'productName', 'shippingMethodPaid', 'shippingAmountPaid', 'trackingNumber', 'shippingMethodReceived', 'standardShippingCost'] },
      { id: 'request', name: 'Request', template: 'I am requesting a refund of the difference between what I paid ({shippingAmountPaid}) and the standard shipping cost ({standardShippingCost}), as I did not receive the shipping service I purchased.', placeholders: ['shippingAmountPaid', 'standardShippingCost'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please process this refund within 14 days and confirm via email.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Charging for a service not rendered is a billing error that should be corrected promptly. I appreciate your attention to this matter.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-partial-order-complaint',
    slug: 'delivery-partial-order-complaint',
    category: 'Refunds & Purchases',
    title: 'Partial Order Received – Missing Items Complaint',
    shortDescription: 'Demand the missing items or a partial refund when only part of your order was delivered.',
    longDescription: `Receiving only part of your order—without explanation or notification—is a common e-commerce problem. Whether items were shipped separately and lost, or simply omitted from your package, you're entitled to receive everything you paid for.

When to use this letter:
• You received some items from your order but not all
• A multi-item package was missing one or more products
• The company shipped partial items with no communication about the rest
• A bundle or set arrived incomplete
• The packing slip lists items that weren't in the box
• You were charged for items that were never included

Check the packing slip against received items and take photos of what was received.`,
    seoTitle: 'Partial Order Complaint Letter – Missing Items Template',
    seoDescription: 'Only received part of your order? Demand the missing items or a refund with this complaint letter template. Document what\'s missing and get resolution.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Target, Costco, ASOS', required: true, impactLevel: 'high' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., TGT-2024-543210', required: true, impactLevel: 'high' as const },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'totalOrderAmount', label: 'Total Order Amount', type: 'text', placeholder: 'e.g., $234.97', required: true },
      { id: 'itemsReceived', label: 'Items Received', type: 'textarea', placeholder: 'List the items that WERE included in the delivery', required: true },
      { id: 'itemsMissing', label: 'Items Missing', type: 'textarea', placeholder: 'List the items that were NOT included', required: true, impactLevel: 'high' as const, aiEnhanced: true },
      { id: 'missingItemsValue', label: 'Value of Missing Items', type: 'text', placeholder: 'e.g., $89.99', required: true, impactLevel: 'high' as const },
      { id: 'packingSlipStatus', label: 'Does the Packing Slip List the Missing Items?', type: 'select', options: ['Yes - packing slip lists them but they\'re not in the box', 'No - packing slip only shows received items', 'No packing slip was included', 'Items listed as "shipped separately" but never arrived'], required: true, evidenceHint: 'Photograph the packing slip alongside received items' },
      { id: 'preferredResolution', label: 'Preferred Resolution', type: 'select', options: ['Ship the missing items immediately', 'Refund for missing items', 'Either ship items or refund'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding order {orderNumber}, placed on {orderDate} for a total of {totalOrderAmount}. The delivery received on {deliveryDate} was incomplete—several items I paid for were not included.', placeholders: ['orderNumber', 'orderDate', 'totalOrderAmount', 'deliveryDate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Items received:\n{itemsReceived}\n\nItems MISSING from the delivery:\n{itemsMissing}\n\nValue of missing items: {missingItemsValue}\n\nPacking slip status: {packingSlipStatus}\n\nI was charged the full order amount of {totalOrderAmount} but did not receive all items.', placeholders: ['itemsReceived', 'itemsMissing', 'missingItemsValue', 'packingSlipStatus', 'totalOrderAmount'] },
      { id: 'request', name: 'Request', template: 'I am requesting that you {preferredResolution}. The missing items are valued at {missingItemsValue} and I expect this to be resolved without further delay.', placeholders: ['preferredResolution', 'missingItemsValue'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 10 days with confirmation that the missing items have been shipped or a refund has been processed.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have documented the received items and packaging with photographs. If this is not resolved promptly, I will dispute the charge for the missing items with my payment provider.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
];
