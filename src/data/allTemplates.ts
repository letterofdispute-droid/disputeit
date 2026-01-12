/**
 * Master Template Index
 * 
 * This file exports all 105 letter templates organized by category.
 * Templates are split into separate files for maintainability.
 */

import { LetterTemplate } from './letterTemplates';
import { refundsTemplates } from './templates/refundsTemplates';

// Re-export the refunds templates (15 templates)
// Additional template files will be added:
// - housingTemplates (14 templates)
// - travelTemplates (12 templates)
// - damagedGoodsTemplates (8 templates)
// - utilitiesTemplates (10 templates)
// - financialTemplates (10 templates)
// - insuranceTemplates (8 templates)
// - vehicleTemplates (8 templates)
// - healthcareTemplates (6 templates)
// - employmentTemplates (6 templates)
// - ecommerceTemplates (5 templates)
// - hoaTemplates (3 templates)

export const allTemplates: LetterTemplate[] = [
  ...refundsTemplates,
  // Additional templates will be added here as files are created
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

// For backwards compatibility, also export from letterTemplates
export { letterTemplates } from './letterTemplates';
