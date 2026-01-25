import { LetterTemplate } from '../letterTemplates';
import { telecomBillingTemplates } from './utilities/telecomBillingTemplates';
import { telecomServiceTemplates } from './utilities/telecomServiceTemplates';
import { telecomContractTemplates } from './utilities/telecomContractTemplates';
import { energyBillingTemplates } from './utilities/energyBillingTemplates';
import { waterComplaintTemplates } from './utilities/waterComplaintTemplates';

// Combine all utilities templates
export const utilitiesTemplates: LetterTemplate[] = [
  ...telecomBillingTemplates,
  ...telecomServiceTemplates,
  ...telecomContractTemplates,
  ...energyBillingTemplates,
  ...waterComplaintTemplates,
];
