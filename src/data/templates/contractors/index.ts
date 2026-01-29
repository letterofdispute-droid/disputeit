import { LetterTemplate } from '../../letterTemplates';
import { generalContractorTemplates } from './generalContractorTemplates';
import { plumbingTemplates } from './plumbingTemplates';
import { electricalTemplates } from './electricalTemplates';
import { roofingTemplates } from './roofingTemplates';

// Combine all contractor templates
export const contractorsTemplates: LetterTemplate[] = [
  ...generalContractorTemplates,
  ...plumbingTemplates,
  ...electricalTemplates,
  ...roofingTemplates,
];

// Re-export individual template arrays for granular imports
export { generalContractorTemplates } from './generalContractorTemplates';
export { plumbingTemplates } from './plumbingTemplates';
export { electricalTemplates } from './electricalTemplates';
export { roofingTemplates } from './roofingTemplates';
