import { LetterTemplate } from '../../letterTemplates';
import { generalContractorTemplates } from './generalContractorTemplates';
import { plumbingTemplates } from './plumbingTemplates';
import { electricalTemplates } from './electricalTemplates';
import { roofingTemplates } from './roofingTemplates';
import { hvacTemplates } from './hvacTemplates';
import { landscapingTemplates } from './landscapingTemplates';
import { flooringPaintingTemplates } from './flooringPaintingTemplates';
import { kitchenBathTemplates } from './kitchenBathTemplates';
import { windowDoorTemplates } from './windowDoorTemplates';
import { specialtyServicesTemplates } from './specialtyServicesTemplates';

// Combine all contractor templates
export const contractorsTemplates: LetterTemplate[] = [
  ...generalContractorTemplates,
  ...plumbingTemplates,
  ...electricalTemplates,
  ...roofingTemplates,
  ...hvacTemplates,
  ...landscapingTemplates,
  ...flooringPaintingTemplates,
  ...kitchenBathTemplates,
  ...windowDoorTemplates,
  ...specialtyServicesTemplates,
];

// Re-export individual template arrays for granular imports
export { generalContractorTemplates } from './generalContractorTemplates';
export { plumbingTemplates } from './plumbingTemplates';
export { electricalTemplates } from './electricalTemplates';
export { roofingTemplates } from './roofingTemplates';
export { hvacTemplates } from './hvacTemplates';
export { landscapingTemplates } from './landscapingTemplates';
export { flooringPaintingTemplates } from './flooringPaintingTemplates';
export { kitchenBathTemplates } from './kitchenBathTemplates';
export { windowDoorTemplates } from './windowDoorTemplates';
export { specialtyServicesTemplates } from './specialtyServicesTemplates';
