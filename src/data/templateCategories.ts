import { 
  Receipt, Home, Package, Plane, Wifi, CreditCard, Shield, Car, 
  Stethoscope, Briefcase, ShoppingCart, Building2, Hammer
} from 'lucide-react';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Receipt;
  templateCount: number;
  color: string;
  popular?: boolean;
  imageKeywords: string[];
}

export const templateCategories: TemplateCategory[] = [
  {
    id: 'refunds',
    name: 'Refunds & Purchases',
    description: 'Get your money back for products or services that did not meet expectations.',
    icon: Receipt,
    templateCount: 50,
    color: 'hsl(var(--chart-1))',
    popular: true,
    imageKeywords: ['shopping receipt', 'customer service desk', 'retail refund'],
  },
  {
    id: 'housing',
    name: 'Landlord & Housing',
    description: 'Request repairs, address deposit disputes, or document housing issues.',
    icon: Home,
    templateCount: 50,
    color: 'hsl(var(--chart-2))',
    popular: true,
    imageKeywords: ['apartment keys', 'rental property', 'house keys handover'],
  },
  {
    id: 'travel',
    name: 'Travel & Transportation',
    description: 'Claim compensation for flight delays, lost baggage, or booking issues.',
    icon: Plane,
    templateCount: 20,
    color: 'hsl(var(--chart-3))',
    popular: true,
    imageKeywords: ['airport terminal', 'flight delay', 'airplane travel'],
  },
  {
    id: 'damaged-goods',
    name: 'Damaged & Defective Goods',
    description: 'File complaints for items that arrived broken, defective, or not as described.',
    icon: Package,
    templateCount: 50,
    color: 'hsl(var(--chart-4))',
    popular: true,
    imageKeywords: ['damaged package delivery', 'broken product', 'cardboard box'],
  },
  {
    id: 'utilities',
    name: 'Utilities & Telecommunications',
    description: 'Dispute billing errors, service quality issues, or contract problems.',
    icon: Wifi,
    templateCount: 50,
    color: 'hsl(var(--chart-5))',
    popular: true,
    imageKeywords: ['utility bills', 'telecommunications tower', 'power lines'],
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Challenge bank fees, credit report errors, identity theft, debt collection, or data access requests.',
    icon: CreditCard,
    templateCount: 76,
    color: 'hsl(var(--chart-1))',
    popular: true,
    imageKeywords: ['credit card statement', 'bank documents', 'financial papers'],
  },
  {
    id: 'insurance',
    name: 'Insurance Claims',
    description: 'Appeal denied claims, dispute settlements, or challenge cancellations.',
    icon: Shield,
    templateCount: 50,
    color: 'hsl(var(--chart-2))',
    popular: true,
    imageKeywords: ['insurance claim form', 'insurance documents', 'protection shield'],
  },
  {
    id: 'vehicle',
    name: 'Vehicle & Auto',
    description: 'Address dealer complaints, warranty disputes, lemon law claims, or repair issues.',
    icon: Car,
    templateCount: 50,
    color: 'hsl(var(--chart-3))',
    popular: true,
    imageKeywords: ['car dealership', 'auto repair garage', 'mechanic workshop'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical Billing',
    description: 'Dispute medical bills, insurance denials, coding errors, debt collection, or provider complaints.',
    icon: Stethoscope,
    templateCount: 50,
    color: 'hsl(var(--chart-4))',
    popular: true,
    imageKeywords: ['medical billing', 'doctor office', 'healthcare professional'],
  },
  {
    id: 'employment',
    name: 'Employment & Workplace',
    description: 'Address wage issues, workplace discrimination, or termination disputes.',
    icon: Briefcase,
    templateCount: 50,
    color: 'hsl(var(--chart-5))',
    popular: true,
    imageKeywords: ['office workplace', 'business meeting', 'employment contract'],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Online Services',
    description: 'Report seller issues, account problems, or data privacy requests.',
    icon: ShoppingCart,
    templateCount: 50,
    color: 'hsl(var(--chart-1))',
    popular: true,
    imageKeywords: ['online shopping', 'delivery package', 'ecommerce laptop'],
  },
  {
    id: 'hoa',
    name: 'Neighbor & HOA Disputes',
    description: 'Address community issues, fee disputes, or neighbor conflicts.',
    icon: Building2,
    templateCount: 50,
    color: 'hsl(var(--chart-2))',
    popular: true,
    imageKeywords: ['suburban neighborhood', 'community houses', 'residential street'],
  },
  {
    id: 'contractors',
    name: 'Contractors & Home Improvement',
    description: 'Dispute poor workmanship, project abandonment, cost overruns, or service issues.',
    icon: Hammer,
    templateCount: 61,
    color: 'hsl(var(--chart-3))',
    popular: true,
    imageKeywords: ['home renovation', 'construction site', 'contractor tools'],
  },
];

export function getCategoryById(id: string): TemplateCategory | undefined {
  return templateCategories.find(c => c.id === id);
}

export function getTotalTemplateCount(): number {
  return templateCategories.reduce((sum, cat) => sum + cat.templateCount, 0);
}
