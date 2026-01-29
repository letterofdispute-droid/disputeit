import { LetterTemplate } from '../../letterTemplates';
import { generalContractorTemplates } from './generalContractorTemplates';
import { plumbingTemplates } from './plumbingTemplates';

// Combine all contractor templates
export const contractorsTemplates: LetterTemplate[] = [
  ...generalContractorTemplates,
  ...plumbingTemplates,
];

// Re-export individual template arrays for granular imports
export { generalContractorTemplates } from './generalContractorTemplates';
export { plumbingTemplates } from './plumbingTemplates';
