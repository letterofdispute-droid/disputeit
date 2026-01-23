import { 
  Receipt, Home, Package, Plane, Wifi, CreditCard, Shield, Car, 
  Stethoscope, Briefcase, ShoppingCart, Building2
} from 'lucide-react';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Receipt;
  templateCount: number;
  color: string;
  popular?: boolean;
}

export const templateCategories: TemplateCategory[] = [
  {
    id: 'refunds',
    name: 'Refunds & Purchases',
    description: 'Get your money back for products or services that did not meet expectations.',
    icon: Receipt,
    templateCount: 15,
    color: 'hsl(var(--chart-1))',
    popular: true,
  },
  {
    id: 'housing',
    name: 'Landlord & Housing',
    description: 'Request repairs, address deposit disputes, or document housing issues.',
    icon: Home,
    templateCount: 14,
    color: 'hsl(var(--chart-2))',
    popular: true,
  },
  {
    id: 'travel',
    name: 'Travel & Transportation',
    description: 'Claim compensation for flight delays, lost baggage, or booking issues.',
    icon: Plane,
    templateCount: 12,
    color: 'hsl(var(--chart-3))',
    popular: true,
  },
  {
    id: 'damaged-goods',
    name: 'Damaged & Defective Goods',
    description: 'File complaints for items that arrived broken, defective, or not as described.',
    icon: Package,
    templateCount: 8,
    color: 'hsl(var(--chart-4))',
  },
  {
    id: 'utilities',
    name: 'Utilities & Telecommunications',
    description: 'Dispute billing errors, service quality issues, or contract problems.',
    icon: Wifi,
    templateCount: 10,
    color: 'hsl(var(--chart-5))',
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Challenge bank fees, credit report errors, or debt collection issues.',
    icon: CreditCard,
    templateCount: 10,
    color: 'hsl(var(--chart-1))',
  },
  {
    id: 'insurance',
    name: 'Insurance Claims',
    description: 'Appeal denied claims, dispute settlements, or challenge cancellations.',
    icon: Shield,
    templateCount: 8,
    color: 'hsl(var(--chart-2))',
  },
  {
    id: 'vehicle',
    name: 'Vehicle & Auto',
    description: 'Address dealer complaints, warranty disputes, or repair issues.',
    icon: Car,
    templateCount: 8,
    color: 'hsl(var(--chart-3))',
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical Billing',
    description: 'Dispute medical bills, insurance denials, coding errors, debt collection, or provider complaints.',
    icon: Stethoscope,
    templateCount: 50,
    color: 'hsl(var(--chart-4))',
    popular: true,
  },
  {
    id: 'employment',
    name: 'Employment & Workplace',
    description: 'Address wage issues, workplace problems, or termination disputes.',
    icon: Briefcase,
    templateCount: 6,
    color: 'hsl(var(--chart-5))',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Online Services',
    description: 'Report seller issues, account problems, or data privacy requests.',
    icon: ShoppingCart,
    templateCount: 5,
    color: 'hsl(var(--chart-1))',
  },
  {
    id: 'hoa',
    name: 'Neighbor & HOA Disputes',
    description: 'Address community issues, fee disputes, or neighbor conflicts.',
    icon: Building2,
    templateCount: 3,
    color: 'hsl(var(--chart-2))',
  },
];

export function getCategoryById(id: string): TemplateCategory | undefined {
  return templateCategories.find(c => c.id === id);
}

export function getTotalTemplateCount(): number {
  return templateCategories.reduce((sum, cat) => sum + cat.templateCount, 0);
}
