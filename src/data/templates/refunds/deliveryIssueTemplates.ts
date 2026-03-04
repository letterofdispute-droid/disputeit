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
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Amazon, FedEx, DHL', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address of retailer or shipping company', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., ORD-2024-123456', required: true, impactLevel: 'important' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'e.g., 1Z999AA10123456784', required: false },
      { id: 'productName', label: 'Item(s) Ordered', type: 'text', placeholder: 'e.g., Birthday gift set, Office supplies', required: true },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'promisedDeliveryDate', label: 'Promised Delivery Date', type: 'date', required: true, impactLevel: 'important' as const },
      { id: 'actualDeliveryDate', label: 'Actual Delivery Date', type: 'date', required: false, impactLevel: 'important' as const },
      { id: 'shippingMethod', label: 'Shipping Method Paid For', type: 'select', options: ['Standard Shipping', 'Expedited/Express', 'Next-Day/Overnight', 'Same-Day', '2-Day Shipping', 'Scheduled Delivery'], required: true },
      { id: 'shippingCost', label: 'Shipping Cost Paid', type: 'text', placeholder: 'e.g., $24.99', required: true, impactLevel: 'important' as const },
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
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Wayfair, IKEA, Target', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., WF-20240301-9876', required: true, impactLevel: 'important' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Shipping tracking number', required: false },
      { id: 'carrierName', label: 'Shipping Carrier', type: 'select', options: ['UPS', 'FedEx', 'USPS', 'DHL', 'Royal Mail', 'DPD', 'Hermes/Evri', 'Amazon Logistics', 'Other'], required: true },
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Glass Coffee Table', required: true, impactLevel: 'important' as const },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'e.g., $459.99', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'damageDescription', label: 'Describe the Damage', type: 'textarea', placeholder: 'What specifically is damaged? How severe is it?', required: true, impactLevel: 'important' as const, aiEnhanced: true },
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
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Amazon, Zara, Nike', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., 114-5678901-2345678', required: true, impactLevel: 'important' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Full tracking number', required: true },
      { id: 'carrierName', label: 'Shipping Carrier', type: 'select', options: ['UPS', 'FedEx', 'USPS', 'DHL', 'Royal Mail', 'DPD', 'Hermes/Evri', 'Amazon Logistics', 'Other'], required: true },
      { id: 'productName', label: 'Item(s) Ordered', type: 'text', placeholder: 'e.g., Winter jacket, Electronics bundle', required: true },
      { id: 'amountPaid', label: 'Order Total', type: 'text', placeholder: 'e.g., $189.99', required: true, impactLevel: 'important' as const },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: 'date', required: true },
      { id: 'trackingStatus', label: 'Current Tracking Status', type: 'select', options: ['Shows "Delivered" but not received', 'Stuck "In Transit" for over a week', 'No tracking updates at all', 'Delivered to wrong address', 'Left at unsecured location'], required: true, impactLevel: 'important' as const },
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
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Nordstrom, Best Buy', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., NRD-2024-567890', required: true },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Tracking number showing actual shipping method', required: true, evidenceHint: 'The tracking details will show what carrier service was actually used' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'shippingMethodPaid', label: 'Shipping Method You Paid For', type: 'select', options: ['Next-Day/Overnight', 'Two-Day Express', 'Express/Priority', 'Expedited (3-5 days)', 'White Glove/Special Delivery'], required: true, impactLevel: 'important' as const },
      { id: 'shippingMethodReceived', label: 'Shipping Method Actually Used', type: 'select', options: ['Standard Ground (5-10 days)', 'Economy/Basic', 'Standard Post', 'Same as free shipping option', 'Unknown/Not specified'], required: true, impactLevel: 'important' as const },
      { id: 'shippingAmountPaid', label: 'Shipping Amount Charged', type: 'text', placeholder: 'e.g., $29.99', required: true, impactLevel: 'important' as const },
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
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Target, Costco, ASOS', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., TGT-2024-543210', required: true, impactLevel: 'important' as const },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'totalOrderAmount', label: 'Total Order Amount', type: 'text', placeholder: 'e.g., $234.97', required: true },
      { id: 'itemsReceived', label: 'Items Received', type: 'textarea', placeholder: 'List the items that WERE included in the delivery', required: true },
      { id: 'itemsMissing', label: 'Items Missing', type: 'textarea', placeholder: 'List the items that were NOT included', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'missingItemsValue', label: 'Value of Missing Items', type: 'text', placeholder: 'e.g., $89.99', required: true, impactLevel: 'important' as const },
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
  {
    id: 'delivery-wrong-item-sent',
    slug: 'delivery-wrong-item-sent',
    category: 'Refunds & Purchases',
    title: 'Wrong Item Delivered – Correction Request',
    shortDescription: 'Demand the correct item or a refund when you received the wrong product in your delivery.',
    longDescription: `Receiving the wrong item is a fulfillment error that the retailer must correct at their own expense. You are under no obligation to return the wrong item at your own cost, and the company must send the correct product or issue a refund.

When to use this letter:
• You received a completely different product than what you ordered
• The correct product was listed on the order but the wrong variant (size, color, model) was shipped
• You received someone else's order entirely
• The product received doesn't match the listing photos or description
• The retailer wants you to pay return shipping for their mistake

Under US law (FTC rules), you may be entitled to keep unordered merchandise. Under UK/EU law, the seller bears the cost of correcting delivery errors.`,
    seoTitle: 'Wrong Item Delivered Letter – Get the Right Product or Refund',
    seoDescription: 'Received the wrong item? Demand a correction at no cost with this professional letter. Free template for wrong product deliveries.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Amazon, Zara, B&H Photo', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., ORD-2024-789012', required: true, impactLevel: 'important' as const },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'itemOrdered', label: 'Item You Ordered', type: 'textarea', placeholder: 'Exact product name, size, color, variant you ordered', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'itemReceived', label: 'Item You Actually Received', type: 'textarea', placeholder: 'What was actually in the package?', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'e.g., $129.99', required: true },
      { id: 'hasPhotos', label: 'Do You Have Photos?', type: 'select', options: ['Yes - photos of wrong item received', 'Yes - photos of item and packaging', 'No'], required: true },
      { id: 'preferredResolution', label: 'Preferred Resolution', type: 'select', options: ['Send the correct item', 'Full refund', 'Either correct item or refund'], required: true },
      { id: 'previousContact', label: 'Previous Contact Attempts', type: 'textarea', placeholder: 'Have you already contacted customer service?', required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding order {orderNumber}, placed on {orderDate}, which was delivered on {deliveryDate} containing the wrong item.', placeholders: ['orderNumber', 'orderDate', 'deliveryDate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'What I ordered: {itemOrdered}\n\nWhat I received: {itemReceived}\n\nAmount paid: {amountPaid}\n\nPhotographic evidence: {hasPhotos}\n\nThis is a fulfillment error on your part. I should not incur any cost to correct this mistake.', placeholders: ['itemOrdered', 'itemReceived', 'amountPaid', 'hasPhotos'] },
      { id: 'request', name: 'Request', template: 'I am requesting that you {preferredResolution}. If a return of the incorrect item is needed, please provide a prepaid return label at your expense.', placeholders: ['preferredResolution'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 7 days with a resolution. If the correct item is being sent, please provide a new tracking number.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have retained the incorrect item and all packaging. If this is not resolved promptly, I will dispute the charge with my payment provider.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-signature-dispute',
    slug: 'delivery-signature-dispute',
    category: 'Refunds & Purchases',
    title: 'Delivery Signature Dispute – Package Not Received',
    shortDescription: 'Dispute a delivery that was signed for by an unauthorized person or where the signature was forged.',
    longDescription: `Sometimes carriers mark packages as "signed for and delivered" when you never actually signed for or received the package. A forged, unauthorized, or fabricated signature does not constitute valid proof of delivery.

When to use this letter:
• The carrier claims someone signed for the package but you don't recognize the name
• A signature was captured but you were not home at the time of delivery
• The signature appears forged or is just a scribble
• A neighbor or building manager signed but never passed the package to you
• The carrier's proof of delivery shows a signature that is not yours
• GPS data or delivery photo doesn't match your address

This letter disputes the validity of the claimed signature and demands resolution.`,
    seoTitle: 'Delivery Signature Dispute Letter – Unauthorized or Forged',
    seoDescription: 'Package signed for but never received? Dispute an unauthorized or forged delivery signature. Professional letter for carrier and retailer disputes.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer/Carrier Name', type: 'text', placeholder: 'e.g., FedEx, UPS, or the retailer', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order/Package Number', type: 'text', placeholder: 'Order number or shipment reference', required: true, impactLevel: 'important' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Full tracking number', required: true },
      { id: 'claimedDeliveryDate', label: 'Claimed Delivery Date', type: 'date', required: true },
      { id: 'claimedSignatory', label: 'Name on the Signature (if visible)', type: 'text', placeholder: 'e.g., "J. SMITH" or illegible', required: false },
      { id: 'amountPaid', label: 'Package Value', type: 'text', placeholder: 'e.g., $499.99', required: true, impactLevel: 'important' as const },
      { id: 'productName', label: 'Contents of Package', type: 'text', placeholder: 'e.g., Laptop, Camera equipment', required: true },
      { id: 'whyNotYou', label: 'Why the Signature Is Not Valid', type: 'textarea', placeholder: 'e.g., I was at work, name doesn\'t match anyone in household, signature looks nothing like mine', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'alibiEvidence', label: 'Evidence You Were Not Present', type: 'textarea', placeholder: 'e.g., work records, security camera footage, travel records', required: false, evidenceHint: 'Work schedules, building security logs, or Ring/doorbell camera footage strengthen your case' },
      { id: 'previousContact', label: 'Previous Contact Attempts', type: 'textarea', placeholder: 'Who have you spoken to?', required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute the claimed delivery of tracking number {trackingNumber}, which your records indicate was signed for on {claimedDeliveryDate}. I did not receive this package and did not sign for it.', placeholders: ['trackingNumber', 'claimedDeliveryDate'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Package contents: {productName}\nValue: {amountPaid}\nOrder reference: {orderNumber}\nClaimed signatory name: {claimedSignatory}\n\nWhy this signature is not valid: {whyNotYou}\n\nEvidence supporting my position: {alibiEvidence}\n\nThe signature on file does not represent a valid delivery to me or any authorized recipient at my address.', placeholders: ['productName', 'amountPaid', 'orderNumber', 'claimedSignatory', 'whyNotYou', 'alibiEvidence'] },
      { id: 'request', name: 'Request', template: 'I am requesting either: (1) reshipment of {productName}, or (2) a full refund of {amountPaid}. The purported signature does not constitute proof that I received this package.', placeholders: ['productName', 'amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 10 days. If this is not resolved, I will file a chargeback with my payment provider and a complaint with the relevant postal or carrier regulatory body.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'A signature from an unverified or unauthorized person does not release you from your obligation to deliver the package to the intended recipient.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-left-unsafe-location',
    slug: 'delivery-left-unsafe-location',
    category: 'Refunds & Purchases',
    title: 'Package Left in Unsafe Location – Complaint',
    shortDescription: 'Complain when a carrier left your package in an unsecured, unsafe, or unauthorized location resulting in loss or damage.',
    longDescription: `Carriers sometimes leave packages in exposed, unsecured, or inappropriate locations—leading to theft, water damage, or loss. If you provided delivery instructions that were ignored, or if the carrier left a high-value package unattended without authorization, you may be entitled to a replacement or refund.

When to use this letter:
• A package was left on an unsecured porch or doorstep and was stolen
• The carrier ignored "safe place" or delivery instructions
• A package was left in the rain, resulting in water damage
• A high-value item was left without requiring a signature
• The package was left at a communal area, loading dock, or with an unauthorized person
• Delivery photo shows the package in a clearly inappropriate location

Carriers and retailers have a duty of care for packages until they are securely delivered.`,
    seoTitle: 'Package Left Unsafe Location – Complaint Letter Template',
    seoDescription: 'Package left in an unsafe spot and stolen or damaged? File a complaint and demand compensation. Free letter template for negligent deliveries.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer or Carrier Name', type: 'text', placeholder: 'e.g., Amazon, UPS, Royal Mail', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'Order or shipment reference', required: true },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Full tracking number', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'productName', label: 'Package Contents', type: 'text', placeholder: 'e.g., AirPods Pro, Winter Coat', required: true },
      { id: 'amountPaid', label: 'Package Value', type: 'text', placeholder: 'e.g., $249.99', required: true, impactLevel: 'important' as const },
      { id: 'whereLeft', label: 'Where the Package Was Left', type: 'textarea', placeholder: 'e.g., Front porch in plain view, next to garbage bins, in the rain', required: true, impactLevel: 'important' as const, aiEnhanced: true },
      { id: 'deliveryInstructions', label: 'Your Delivery Instructions (if provided)', type: 'textarea', placeholder: 'e.g., "Leave with concierge", "Do not leave unattended"', required: false },
      { id: 'whatHappened', label: 'What Happened to the Package', type: 'select', options: ['Stolen/missing when I got home', 'Damaged by weather (rain, snow, heat)', 'Found opened/tampered with', 'Left with unauthorized person', 'Other'], required: true, impactLevel: 'important' as const },
      { id: 'hasDeliveryPhoto', label: 'Is There a Delivery Photo?', type: 'select', options: ['Yes - shows package in unsafe location', 'Yes - but doesn\'t match my address', 'No delivery photo available'], required: true, evidenceHint: 'Check your carrier app or delivery notification for a proof-of-delivery photo' },
      { id: 'hasSecurityFootage', label: 'Do You Have Security Camera Footage?', type: 'select', options: ['Yes - shows package being stolen', 'Yes - shows carrier leaving in unsafe spot', 'Yes - shows no delivery at all', 'No security camera'], required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to complain about the negligent delivery of tracking number {trackingNumber} on {deliveryDate}. The package containing {productName} (value: {amountPaid}) was left in an unsafe location, resulting in {whatHappened}.', placeholders: ['trackingNumber', 'deliveryDate', 'productName', 'amountPaid', 'whatHappened'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Order reference: {orderNumber}\n\nThe package was left: {whereLeft}\n\nMy delivery instructions stated: {deliveryInstructions}\n\nDelivery photo available: {hasDeliveryPhoto}\nSecurity footage: {hasSecurityFootage}\n\nThe carrier failed to exercise reasonable care in delivering this package. Leaving a {amountPaid} package unattended in an exposed location is negligent.', placeholders: ['orderNumber', 'whereLeft', 'deliveryInstructions', 'hasDeliveryPhoto', 'hasSecurityFootage', 'amountPaid'] },
      { id: 'request', name: 'Request', template: 'I am requesting a full replacement or refund of {amountPaid} for {productName}. The loss/damage was a direct result of the carrier\'s failure to follow delivery instructions and exercise due care.', placeholders: ['amountPaid', 'productName'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days with a resolution. If the carrier is responsible, that is a matter between you and the carrier—not the customer.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have retained all available evidence including delivery photos, security footage, and tracking records. If this matter is not resolved, I will pursue a chargeback and file a complaint with the relevant consumer protection authority.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-refused-return-to-sender',
    slug: 'delivery-refused-return-to-sender',
    category: 'Refunds & Purchases',
    title: 'Delivery Refused / Returned to Sender – Refund Request',
    shortDescription: 'Request a refund when you refused delivery or the package was returned to sender but no refund was issued.',
    longDescription: `When you refuse a delivery or a package is returned to the sender (due to failed delivery attempts, incorrect address on their end, or customs rejection), the retailer should process a refund. However, many companies drag their feet or charge restocking fees for packages that were never accepted.

When to use this letter:
• You refused delivery but no refund has been issued
• The carrier returned the package after failed delivery attempts
• The package was sent to the wrong address and returned
• Customs rejected an international shipment and sent it back
• The company is charging a restocking fee for a refused/returned package
• Weeks have passed since the return and no refund has appeared

You should not be charged for goods you never accepted or received.`,
    seoTitle: 'Refused Delivery Refund Letter – Package Returned to Sender',
    seoDescription: 'Refused delivery or package returned to sender but no refund? Demand your money back with this professional refund request letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., Wish, Shein, eBay seller', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., WS-2024-98765', required: true, impactLevel: 'important' as const },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Tracking showing return to sender', required: true, evidenceHint: 'The tracking history will show the return journey' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'amountPaid', label: 'Total Amount Paid', type: 'text', placeholder: 'e.g., $67.99', required: true, impactLevel: 'important' as const },
      { id: 'returnReason', label: 'Why Was Delivery Refused/Returned?', type: 'select', options: ['I refused delivery at the door', 'Carrier returned after failed delivery attempts', 'Wrong address (seller\'s error)', 'Customs rejected the shipment', 'I requested cancellation before delivery', 'Package was undeliverable'], required: true, impactLevel: 'important' as const },
      { id: 'returnConfirmationDate', label: 'Date Package Was Returned/Confirmed Received by Seller', type: 'date', required: false },
      { id: 'daysSinceReturn', label: 'Days Since Package Was Returned', type: 'number', placeholder: 'e.g., 30', required: true },
      { id: 'previousContact', label: 'Previous Contact Attempts', type: 'textarea', placeholder: 'What did the company say when you asked for a refund?', required: false },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to demand a refund of {amountPaid} for order {orderNumber}, placed on {orderDate}. The package was {returnReason} and tracking ({trackingNumber}) confirms it has been returned to sender.', placeholders: ['amountPaid', 'orderNumber', 'orderDate', 'returnReason', 'trackingNumber'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Reason for return: {returnReason}\nTracking: {trackingNumber}\nDate returned: {returnConfirmationDate}\n\nIt has been {daysSinceReturn} days since the package was returned and I have not received a refund.\n\nPrevious contact: {previousContact}\n\nI never accepted or used the goods. There is no justification for withholding my refund.', placeholders: ['returnReason', 'trackingNumber', 'returnConfirmationDate', 'daysSinceReturn', 'previousContact'] },
      { id: 'request', name: 'Request', template: 'I am requesting an immediate full refund of {amountPaid}, including any shipping charges. No restocking fee should apply to goods that were never accepted by the customer.', placeholders: ['amountPaid'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please process the refund within 7 days. If the refund is not issued, I will initiate a chargeback with my payment provider.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Tracking records clearly confirm the package was returned. Retaining payment for undelivered goods is not permissible and I expect a prompt resolution.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-international-customs-issue',
    slug: 'delivery-international-customs-issue',
    category: 'Refunds & Purchases',
    title: 'International Delivery Customs Issue – Complaint',
    shortDescription: 'Complain about unexpected customs charges, seized shipments, or misleading international shipping terms.',
    longDescription: `International online shopping can result in unexpected customs duties, import taxes, or even seized shipments. When retailers fail to disclose these costs upfront—or misrepresent shipping terms like DDP (Delivered Duty Paid)—consumers end up paying far more than expected.

When to use this letter:
• You were charged unexpected customs duties or import taxes on delivery
• The retailer advertised "free shipping" but customs charges were not disclosed
• The product was seized by customs due to the seller's improper documentation
• Customs fees exceeded the value of the product itself
• The retailer claimed DDP (Delivered Duty Paid) shipping but you were still charged duties
• The item was returned to sender by customs and no refund was issued
• The retailer under-declared the value on customs forms, creating legal risk for you

Retailers selling internationally must clearly disclose all potential customs and import charges.`,
    seoTitle: 'International Delivery Customs Complaint – Hidden Charges Letter',
    seoDescription: 'Hit with unexpected customs charges on an online order? Complain about undisclosed fees or seized shipments with this professional letter template.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Retailer Name', type: 'text', placeholder: 'e.g., AliExpress, ASOS, iHerb', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Retailer Address', type: 'textarea', placeholder: 'Full address (or country of origin)', required: true },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'Order reference', required: true, impactLevel: 'important' as const },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'itemDescription', label: 'Item(s) Ordered', type: 'textarea', placeholder: 'What did you order?', required: true },
      { id: 'amountPaid', label: 'Order Amount Paid (product + shipping)', type: 'text', placeholder: 'e.g., $89.99', required: true, impactLevel: 'important' as const },
      { id: 'customsCharges', label: 'Customs/Import Charges Incurred', type: 'text', placeholder: 'e.g., $45.00', required: true, impactLevel: 'important' as const },
      { id: 'shippingTermsAdvertised', label: 'Shipping Terms Advertised', type: 'select', options: ['Free international shipping', 'DDP (Delivered Duty Paid)', 'Flat rate shipping (no mention of duties)', 'No customs information provided', 'Stated "no additional fees"', 'Other'], required: true },
      { id: 'customsIssue', label: 'Specific Customs Issue', type: 'select', options: ['Unexpected duties/taxes charged on delivery', 'Package seized by customs', 'Seller under-declared value on customs form', 'Package returned to sender by customs', 'Customs broker fees charged', 'Prohibited item not disclosed by seller'], required: true, impactLevel: 'important' as const },
      { id: 'disclosureEvidence', label: 'What Was Disclosed at Checkout', type: 'textarea', placeholder: 'What did the checkout page say about duties/customs? Was there any warning?', required: true, aiEnhanced: true, evidenceHint: 'Screenshot the checkout page, shipping policy, or terms of sale' },
      { id: 'preferredResolution', label: 'Preferred Resolution', type: 'select', options: ['Refund of customs charges', 'Full refund (product + shipping + customs)', 'Reship with proper DDP terms', 'Partial refund for undisclosed costs'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to complain about undisclosed customs and import charges associated with order {orderNumber}, placed on {orderDate} for {amountPaid}. I was subsequently charged an additional {customsCharges} in customs/import fees that were not disclosed at the time of purchase.', placeholders: ['orderNumber', 'orderDate', 'amountPaid', 'customsCharges'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Item(s): {itemDescription}\nShipping terms advertised: {shippingTermsAdvertised}\nCustoms issue encountered: {customsIssue}\n\nAt checkout, the following was disclosed about customs/duties: {disclosureEvidence}\n\nThe total cost of this order has effectively increased from {amountPaid} to a significantly higher amount due to the undisclosed {customsCharges} in customs charges. This was not communicated before purchase.', placeholders: ['itemDescription', 'shippingTermsAdvertised', 'customsIssue', 'disclosureEvidence', 'amountPaid', 'customsCharges'] },
      { id: 'request', name: 'Request', template: 'I am requesting: {preferredResolution}. The failure to disclose these costs before purchase constitutes a misleading pricing practice.', placeholders: ['preferredResolution'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 14 days with a proposed resolution. If you are unable to reimburse the customs charges, I will pursue a chargeback for the full order amount.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Retailers selling internationally have an obligation to clearly disclose all potential costs to the consumer before purchase. Failure to do so is a deceptive practice and I will escalate this matter if necessary.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
  {
    id: 'delivery-subscription-box-missing',
    slug: 'delivery-subscription-box-missing',
    category: 'Refunds & Purchases',
    title: 'Subscription Box Not Delivered – Complaint',
    shortDescription: 'Complain about a subscription box or recurring delivery that was never received or arrived incomplete.',
    longDescription: `Subscription boxes—whether for food, beauty products, clothing, or other goods—are recurring commitments. When a box goes missing, arrives incomplete, or contains spoiled/expired products, subscribers deserve a replacement or credit.

When to use this letter:
• Your monthly subscription box was never delivered
• The box arrived but was missing advertised items
• Perishable subscription items arrived spoiled or expired
• The contents were significantly different from what was advertised for that month
• You've been charged for a box during a month you paused or cancelled
• Multiple boxes in a row have had issues with no resolution from the company

Subscription services must deliver what they promise each billing cycle.`,
    seoTitle: 'Subscription Box Missing Letter – Complaint & Refund Request',
    seoDescription: 'Subscription box never arrived or was incomplete? Demand a replacement or refund. Professional complaint letter for recurring delivery issues.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Subscription Service Name', type: 'text', placeholder: 'e.g., HelloFresh, Birchbox, Stitch Fix', required: true, impactLevel: 'important' as const },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true },
      { id: 'subscriptionPlan', label: 'Subscription Plan', type: 'text', placeholder: 'e.g., Premium Monthly, Family Plan', required: true },
      { id: 'monthlyCharge', label: 'Monthly Charge', type: 'text', placeholder: 'e.g., $49.99/month', required: true, impactLevel: 'important' as const },
      { id: 'affectedMonth', label: 'Month/Period Affected', type: 'text', placeholder: 'e.g., February 2024', required: true },
      { id: 'orderNumber', label: 'Order/Shipment Number', type: 'text', placeholder: 'If available', required: false },
      { id: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'If provided', required: false },
      { id: 'issueType', label: 'What Happened?', type: 'select', options: ['Box never arrived', 'Box arrived incomplete/missing items', 'Contents spoiled or expired', 'Contents different from advertised', 'Charged for paused/cancelled subscription', 'Box arrived damaged'], required: true, impactLevel: 'important' as const },
      { id: 'issueDetails', label: 'Describe the Issue in Detail', type: 'textarea', placeholder: 'What specifically was wrong?', required: true, aiEnhanced: true },
      { id: 'previousIssues', label: 'Have Previous Boxes Had Issues?', type: 'textarea', placeholder: 'Is this a recurring problem?', required: false },
      { id: 'preferredResolution', label: 'Preferred Resolution', type: 'select', options: ['Reship the box', 'Credit for next month', 'Full refund for this month', 'Cancel subscription and refund'], required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing regarding my {subscriptionPlan} subscription with {companyName}. The {affectedMonth} delivery (charged at {monthlyCharge}) has the following unresolved issue: {issueType}.', placeholders: ['subscriptionPlan', 'companyName', 'affectedMonth', 'monthlyCharge', 'issueType'] },
      { id: 'facts', name: 'Facts of the Matter', template: 'Order/shipment reference: {orderNumber}\nTracking: {trackingNumber}\n\nDetails: {issueDetails}\n\nPrevious issues with this subscription: {previousIssues}\n\nAs a paying subscriber, I expect to receive the full contents as advertised each billing cycle.', placeholders: ['orderNumber', 'trackingNumber', 'issueDetails', 'previousIssues'] },
      { id: 'request', name: 'Request', template: 'I am requesting: {preferredResolution}. I was charged {monthlyCharge} for a delivery that did not meet the subscription terms.', placeholders: ['preferredResolution', 'monthlyCharge'] },
      { id: 'deadline', name: 'Response Expected', template: 'Please respond within 7 days with confirmation of the resolution. Recurring delivery failures may prompt me to cancel the subscription entirely and seek refunds for prior affected months.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Subscription services are built on trust and consistency. Repeated delivery failures erode that trust and I expect immediate corrective action.', placeholders: [] },
    ],
    jurisdictions: deliveryJurisdictions,
  },
];
