import { LetterTemplate } from './letterTemplates';
import { refundsTemplates } from './templates/refundsTemplates';
import { housingTemplates } from './templates/housingTemplates';
import { travelTemplates } from './templates/travelTemplates';
import { damagedGoodsTemplates } from './templates/damagedGoodsTemplates';
import { utilitiesTemplates } from './templates/utilitiesTemplates';
import { financialTemplates } from './templates/financialTemplates';
import { insuranceTemplates } from './templates/insuranceTemplates';
import { vehicleTemplates } from './templates/vehicleTemplates';
import { healthcareTemplates } from './templates/healthcareTemplates';
import { employmentTemplates } from './templates/employmentTemplates';
import { ecommerceTemplates } from './templates/ecommerceTemplates';
import { hoaTemplates } from './templates/hoaTemplates';
import { contractorsTemplates } from './templates/contractorsTemplates';

// Map category IDs to display names used in templates
const categoryIdToName: Record<string, string> = {
  'refunds': 'Refunds & Purchases',
  'housing': 'Housing',
  'travel': 'Travel',
  'damaged-goods': 'Damaged Goods',
  'utilities': 'Utilities & Telecom',
  'financial': 'Financial',
  'insurance': 'Insurance',
  'vehicle': 'Vehicle',
  'healthcare': 'Healthcare',
  'employment': 'Employment',
  'ecommerce': 'E-commerce',
  'hoa': 'HOA & Property',
  'contractors': 'Contractors',
};

// Reverse mapping: display name to category ID
const categoryNameToId: Record<string, string> = Object.fromEntries(
  Object.entries(categoryIdToName).map(([id, name]) => [name, id])
);

export function getCategoryIdFromName(categoryName: string): string {
  return categoryNameToId[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
}

// Deduplicate by slug (later entries win) to prevent count mismatches
const rawTemplates: LetterTemplate[] = [
  ...refundsTemplates,
  ...housingTemplates,
  ...travelTemplates,
  ...damagedGoodsTemplates,
  ...utilitiesTemplates,
  ...financialTemplates,
  ...insuranceTemplates,
  ...vehicleTemplates,
  ...healthcareTemplates,
  ...employmentTemplates,
  ...ecommerceTemplates,
  ...hoaTemplates,
  ...contractorsTemplates,
];

export const allTemplates: LetterTemplate[] = [
  ...new Map(rawTemplates.map(t => [t.slug, t])).values(),
];

export function getTemplateBySlug(slug: string): LetterTemplate | undefined {
  return allTemplates.find(t => t.slug === slug);
}

export function getTemplatesByCategory(categoryId: string): LetterTemplate[] {
  const categoryName = categoryIdToName[categoryId] || categoryId;
  return allTemplates.filter(t => t.category === categoryName);
}

export function getAllCategories(): string[] {
  return [...new Set(allTemplates.map(t => t.category))];
}

export function getTotalTemplateCount(): number {
  return allTemplates.length;
}

export { letterTemplates } from './letterTemplates';
