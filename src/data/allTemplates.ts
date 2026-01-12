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

export const allTemplates: LetterTemplate[] = [
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
];

export function getTemplateBySlug(slug: string): LetterTemplate | undefined {
  return allTemplates.find(t => t.slug === slug);
}

export function getTemplatesByCategory(category: string): LetterTemplate[] {
  return allTemplates.filter(t => t.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(allTemplates.map(t => t.category))];
}

export function getTotalTemplateCount(): number {
  return allTemplates.length;
}

export { letterTemplates } from './letterTemplates';
