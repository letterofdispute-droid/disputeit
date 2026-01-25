import { LetterTemplate } from '../letterTemplates';
import { dealerComplaintTemplates } from './vehicle/dealerComplaintTemplates';
import { parkingTrafficTemplates } from './vehicle/parkingTrafficTemplates';
import { garageRepairTemplates } from './vehicle/garageRepairTemplates';
import { warrantyLemonLawTemplates } from './vehicle/warrantyLemonLawTemplates';
import { financeLeaseTemplates } from './vehicle/financeLeaseTemplates';
import { additionalVehicleTemplates } from './vehicle/additionalVehicleTemplates';

export const vehicleTemplates: LetterTemplate[] = [
  ...dealerComplaintTemplates,
  ...parkingTrafficTemplates,
  ...garageRepairTemplates,
  ...warrantyLemonLawTemplates,
  ...financeLeaseTemplates,
  ...additionalVehicleTemplates,
];
