export interface QuizOption {
  label: string;
  value: string;
  points: number;
  next?: string; // next question id, or 'result' for final
}

export interface QuizQuestion {
  id: string;
  question: string;
  helpText?: string;
  options: QuizOption[];
}

export interface QuizResult {
  minScore: number;
  maxScore: number;
  strength: 'strong' | 'moderate' | 'weak';
  title: string;
  description: string;
  color: string;
  recommendations: string[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'dispute-type',
    question: 'What type of dispute are you dealing with?',
    helpText: 'Select the category that best matches your situation.',
    options: [
      { label: 'Defective product or damaged goods', value: 'product', points: 3, next: 'evidence' },
      { label: 'Service not provided or poorly done', value: 'service', points: 3, next: 'evidence' },
      { label: 'Billing error or unauthorized charge', value: 'billing', points: 4, next: 'evidence' },
      { label: 'Landlord/housing issue', value: 'housing', points: 3, next: 'evidence' },
      { label: 'Insurance claim denied', value: 'insurance', points: 3, next: 'evidence' },
      { label: 'Vehicle purchase or repair', value: 'vehicle', points: 3, next: 'evidence' },
      { label: 'Employment/workplace issue', value: 'employment', points: 2, next: 'evidence' },
      { label: 'HOA dispute', value: 'hoa', points: 2, next: 'evidence' },
      { label: 'Other / Not sure', value: 'other', points: 1, next: 'evidence' },
    ],
  },
  {
    id: 'evidence',
    question: 'What evidence do you have?',
    helpText: 'Evidence significantly strengthens your case.',
    options: [
      { label: 'Written contract, receipt, or agreement', value: 'contract', points: 5, next: 'amount' },
      { label: 'Photos, videos, or screenshots', value: 'photos', points: 4, next: 'amount' },
      { label: 'Emails, texts, or written correspondence', value: 'correspondence', points: 4, next: 'amount' },
      { label: 'Witness statements', value: 'witnesses', points: 3, next: 'amount' },
      { label: 'No evidence yet', value: 'none', points: 0, next: 'amount' },
    ],
  },
  {
    id: 'amount',
    question: 'How much money is involved?',
    helpText: 'The amount affects which resolution path is best for you.',
    options: [
      { label: 'Under $500', value: 'under-500', points: 2, next: 'timeline' },
      { label: '$500 – $2,500', value: '500-2500', points: 3, next: 'timeline' },
      { label: '$2,500 – $10,000', value: '2500-10000', points: 4, next: 'timeline' },
      { label: 'Over $10,000', value: 'over-10000', points: 5, next: 'timeline' },
    ],
  },
  {
    id: 'timeline',
    question: 'When did the issue occur?',
    helpText: 'Statutes of limitations may affect your options.',
    options: [
      { label: 'Within the last 30 days', value: '30-days', points: 5, next: 'prior-contact' },
      { label: '1 – 6 months ago', value: '1-6-months', points: 4, next: 'prior-contact' },
      { label: '6 – 12 months ago', value: '6-12-months', points: 3, next: 'prior-contact' },
      { label: 'Over a year ago', value: 'over-year', points: 1, next: 'prior-contact' },
    ],
  },
  {
    id: 'prior-contact',
    question: 'Have you already contacted the other party?',
    helpText: 'Prior attempts to resolve show good faith.',
    options: [
      { label: 'Yes, and they refused to help', value: 'refused', points: 4, next: 'result' },
      { label: 'Yes, but no response', value: 'no-response', points: 3, next: 'result' },
      { label: 'No, I haven\'t reached out yet', value: 'not-yet', points: 2, next: 'result' },
      { label: 'Yes, and we\'re still negotiating', value: 'negotiating', points: 3, next: 'result' },
    ],
  },
];

export const quizResults: QuizResult[] = [
  {
    minScore: 18,
    maxScore: 100,
    strength: 'strong',
    title: 'Strong Case',
    color: 'hsl(var(--success))',
    description: 'Based on your answers, you appear to have a strong basis for your dispute. You have key elements that typically lead to successful resolutions: clear evidence, a reasonable timeline, and a well-defined grievance.',
    recommendations: [
      'Send a formal demand letter — this resolves most disputes without court',
      'Document everything and keep copies of all correspondence',
      'Set a clear deadline (14-30 days) for a response',
      'If no resolution, consider small claims court for amounts under your state\'s limit',
    ],
  },
  {
    minScore: 10,
    maxScore: 17,
    strength: 'moderate',
    title: 'Moderate Case',
    color: 'hsl(var(--warning))',
    description: 'Your situation has some merit, but there are areas that could be strengthened. A well-crafted demand letter can still be very effective — many disputes are resolved at this stage regardless of case strength.',
    recommendations: [
      'Gather additional evidence before taking action',
      'A formal demand letter can strengthen your position significantly',
      'Check your state\'s consumer protection laws for additional leverage',
      'Consider consulting your state attorney general\'s consumer complaint process',
    ],
  },
  {
    minScore: 0,
    maxScore: 9,
    strength: 'weak',
    title: 'Needs Strengthening',
    color: 'hsl(var(--destructive))',
    description: 'Your case may need more preparation before taking formal action. Don\'t worry — many successful disputes started here. Focus on building your evidence and understanding your rights first.',
    recommendations: [
      'Research your state\'s consumer protection statutes',
      'Start documenting everything from today forward',
      'Look into free resources from your state attorney general',
      'A demand letter can still be a useful first step to open dialogue',
    ],
  },
];

// Map dispute types to template category slugs
export const disputeTypeToCategory: Record<string, { categoryId: string; label: string }> = {
  product: { categoryId: 'damaged-goods', label: 'Damaged Goods & Defective Products' },
  service: { categoryId: 'contractors', label: 'Contractor & Service Disputes' },
  billing: { categoryId: 'refunds', label: 'Refund & Billing Disputes' },
  housing: { categoryId: 'housing', label: 'Housing & Landlord Disputes' },
  insurance: { categoryId: 'insurance', label: 'Insurance Disputes' },
  vehicle: { categoryId: 'vehicle', label: 'Vehicle Disputes' },
  employment: { categoryId: 'employment', label: 'Employment Disputes' },
  hoa: { categoryId: 'hoa', label: 'HOA Disputes' },
  other: { categoryId: 'refunds', label: 'General Consumer Disputes' },
};
