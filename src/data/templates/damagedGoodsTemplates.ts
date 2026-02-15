import { LetterTemplate } from '../letterTemplates';
import { deliveryDamageTemplates } from './damagedGoods/deliveryDamageTemplates';
import { defectiveProductTemplates } from './damagedGoods/defectiveProductTemplates';
import { warrantyRepairTemplates } from './damagedGoods/warrantyRepairTemplates';
import { misrepresentationTemplates } from './damagedGoods/misrepresentationTemplates';
import { returnRefundTemplates } from './damagedGoods/returnRefundTemplates';


const standardJurisdictions = [
  { code: 'US', name: 'United States', legalReference: 'Magnuson-Moss Warranty Act', approvedPhrases: ['Under applicable consumer protection laws', 'In accordance with my consumer rights'] },
  { code: 'UK', name: 'United Kingdom', legalReference: 'Consumer Rights Act 2015', approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with UK consumer law'] },
  { code: 'EU', name: 'European Union', legalReference: 'Consumer Rights Directive', approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable consumer protection standards'] },
];

// Core damaged goods templates (from original file)
const coreDamagedGoodsTemplates: LetterTemplate[] = [
  {
    id: 'damaged-goods-delivery',
    slug: 'damaged-goods-delivery',
    category: 'Damaged Goods',
    title: 'Damaged Goods on Delivery Letter',
    shortDescription: 'Complain about items that arrived damaged during delivery.',
    longDescription: 'Use this template when products you ordered arrived broken, damaged, or in poor condition due to shipping or handling.',
    seoTitle: 'Damaged Goods Complaint Letter | Delivery Damage Template',
    seoDescription: 'Generate a damaged goods complaint letter. Claim refund or replacement for items damaged in delivery.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', required: true, placeholder: 'Where you purchased the item' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', required: true, placeholder: 'Enter order reference' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'Name of the item' },
      { id: 'brandName', label: 'Brand', type: 'text', required: false, placeholder: 'Manufacturer/brand name' },
      { id: 'productDescription', label: 'Product Description', type: 'textarea', required: true, placeholder: 'Describe the item ordered' },
      { id: 'damageDescription', label: 'Damage Description', type: 'textarea', required: true, placeholder: 'Describe the damage in detail' },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true, placeholder: 'e.g., £150' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to report that goods I ordered arrived damaged.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Order number: {orderNumber}, placed on {orderDate} and delivered on {deliveryDate}. Product: {productName} by {brandName}. Description: {productDescription}. I paid {amountPaid}. Upon delivery, I found the following damage: {damageDescription}', placeholders: ['orderNumber', 'orderDate', 'deliveryDate', 'productName', 'brandName', 'productDescription', 'amountPaid', 'damageDescription'] },
      { id: 'request', name: 'Request', template: 'I request a full refund or replacement for the damaged item.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate this matter.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached photos of the damage and packaging.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'defective-product',
    slug: 'defective-product-complaint',
    category: 'Damaged Goods',
    title: 'Defective Product Complaint Letter',
    shortDescription: 'Complain about a product that is faulty or does not work properly.',
    longDescription: 'Use this template when a product you purchased has defects, malfunctions, or does not work as advertised.',
    seoTitle: 'Defective Product Complaint Letter | Free Template',
    seoDescription: 'Generate a defective product complaint letter. Claim refund or repair for faulty items.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'retailerName', label: 'Retailer Name', type: 'text', required: true, placeholder: 'Where you purchased the item' },
      { id: 'manufacturerName', label: 'Manufacturer Name', type: 'text', required: false, placeholder: 'Brand/manufacturer if different' },
      { id: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
      { id: 'modelNumber', label: 'Model Number', type: 'text', required: false, placeholder: 'Model or SKU if known' },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { id: 'defectDescription', label: 'Defect Description', type: 'textarea', required: true, placeholder: 'Describe the defect in detail' },
      { id: 'receiptNumber', label: 'Receipt/Order Number', type: 'text', required: true, placeholder: 'Enter receipt number' },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true, placeholder: 'e.g., £200' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to complain about a defective product I purchased.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'I purchased {productName} (Model: {modelNumber}) from {retailerName} on {purchaseDate} (receipt: {receiptNumber}) for {amountPaid}. The product has the following defect: {defectDescription}', placeholders: ['productName', 'modelNumber', 'retailerName', 'purchaseDate', 'receiptNumber', 'amountPaid', 'defectDescription'] },
      { id: 'request', name: 'Request', template: 'Under consumer protection law, I am entitled to a repair, replacement, or refund. I request a full refund.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days with your proposed resolution.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I look forward to a prompt resolution of this matter.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
    
  },
];

// Combine all damaged goods templates
export const damagedGoodsTemplates: LetterTemplate[] = [
  ...coreDamagedGoodsTemplates,
  ...deliveryDamageTemplates,
  ...defectiveProductTemplates,
  ...warrantyRepairTemplates,
  ...misrepresentationTemplates,
  ...returnRefundTemplates,
];
