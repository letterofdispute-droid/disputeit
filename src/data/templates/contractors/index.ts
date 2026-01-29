import { LetterTemplate } from '../../letterTemplates';
import { generalContractorTemplates } from './generalContractorTemplates';
import { plumbingTemplates } from './plumbingTemplates';
import { electricalTemplates } from './electricalTemplates';
import { roofingTemplates } from './roofingTemplates';
import { hvacTemplates } from './hvacTemplates';
import { landscapingTemplates } from './landscapingTemplates';

// Combine all contractor templates
export const contractorsTemplates: LetterTemplate[] = [
  ...generalContractorTemplates,
  ...plumbingTemplates,
  ...electricalTemplates,
  ...roofingTemplates,
  ...hvacTemplates,
  ...landscapingTemplates,
];

// Re-export individual template arrays for granular imports
export { generalContractorTemplates } from './generalContractorTemplates';
export { plumbingTemplates } from './plumbingTemplates';
export { electricalTemplates } from './electricalTemplates';
export { roofingTemplates } from './roofingTemplates';
export { hvacTemplates } from './hvacTemplates';
export { landscapingTemplates } from './landscapingTemplates';
