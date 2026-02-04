// Article type definitions for the SEO Content Command Center

export interface ArticleType {
  id: string;
  name: string;
  purpose: string;
  displayHint: string; // Human-readable description shown in UI
  titleVariations: string[]; // Hidden patterns passed to AI as inspiration
  keywordSuffixes: string[];
  priority: number; // Higher = generate first
}

export const ARTICLE_TYPES: ArticleType[] = [
  {
    id: 'how-to',
    name: 'How-To Guide',
    purpose: 'Step-by-step instructions',
    displayHint: 'Actionable guide helping readers take immediate action',
    titleVariations: [
      'How to {action} {topic}',
      '{topic}: A Complete Guide',
      'The Smart Way to Handle {topic}',
      'Getting Results: {topic} That Works',
      '{topic} Done Right',
      'What to Do When {scenario}',
      'Your Step-by-Step {topic} Roadmap',
    ],
    keywordSuffixes: ['how to', 'guide', 'step by step', 'tutorial'],
    priority: 100,
  },
  {
    id: 'mistakes',
    name: 'Mistakes to Avoid',
    purpose: 'Prevent common errors',
    displayHint: 'Warning-focused content that prevents costly missteps',
    titleVariations: [
      '{number} Costly {topic} Mistakes You\'re Probably Making',
      'The {topic} Errors That Cost Consumers Thousands',
      'Why Your {topic} Keeps Getting Rejected',
      'Stop Making These {topic} Blunders',
      '{topic} Pitfalls: What Nobody Tells You',
      'The Hidden Traps in {topic} Claims',
    ],
    keywordSuffixes: ['mistakes', 'errors', 'avoid', 'rejected', 'common mistakes'],
    priority: 95,
  },
  {
    id: 'rights',
    name: 'Rights Explainer',
    purpose: 'Educational authority',
    displayHint: 'Empowering content about consumer protections and legal standing',
    titleVariations: [
      'What {entity} Won\'t Tell You About {topic}',
      'Your {topic} Rights: The Complete Guide',
      'Know Your Rights: {topic} in {year}',
      'The Consumer Rights {entity} Hopes You Don\'t Know',
      '{topic} Laws: What Actually Protects You',
      'UK {topic} Rights Explained Simply',
    ],
    keywordSuffixes: ['rights', 'legal rights', 'consumer rights', 'know your rights'],
    priority: 90,
  },
  {
    id: 'sample',
    name: 'Sample/Example',
    purpose: 'Show real scenarios',
    displayHint: 'Real-world examples and templates that actually work',
    titleVariations: [
      'Real {topic} Letters That Got Results',
      '{topic} Example: What Actually Worked',
      'Successful {topic} Templates (With Proof)',
      'Copy This: A {topic} Letter That Worked',
      '{topic} Wording That Gets Responses',
      'Before & After: {topic} Letters Compared',
    ],
    keywordSuffixes: ['example', 'sample', 'template', 'letter example'],
    priority: 85,
  },
  {
    id: 'faq',
    name: 'FAQ/Q&A',
    purpose: 'Capture question keywords',
    displayHint: 'Answer-focused content targeting common search queries',
    titleVariations: [
      '{topic} Questions Everyone Asks (Answered)',
      'Your {topic} Questions, Sorted',
      '{number} Things People Ask About {topic}',
      'The {topic} FAQ You Actually Need',
      'Got {topic} Questions? Here Are Answers',
      'Everything You\'ve Been Wondering About {topic}',
    ],
    keywordSuffixes: ['faq', 'questions', 'answers', 'q&a'],
    priority: 80,
  },
  {
    id: 'case-study',
    name: 'Case Study',
    purpose: 'Social proof/scenarios',
    displayHint: 'Real success stories that build trust and credibility',
    titleVariations: [
      'How {name} Won Their {topic} Battle',
      'From Rejected to Refunded: A {topic} Story',
      'This {topic} Success Story Will Surprise You',
      '{amount} Recovered: One Customer\'s {topic} Journey',
      'The {topic} Fight That Actually Paid Off',
      'Real People, Real Results: {topic} Case Study',
    ],
    keywordSuffixes: ['case study', 'success story', 'real example', 'worked'],
    priority: 75,
  },
  {
    id: 'comparison',
    name: 'Comparison',
    purpose: 'Decision support',
    displayHint: 'Side-by-side analysis helping readers choose the right approach',
    titleVariations: [
      '{option1} vs {option2}: Which Works for {topic}?',
      'Comparing Your {topic} Options',
      '{option1} or {option2}? Making the Right {topic} Choice',
      'The {topic} Approach That Wins More Often',
      'Weighing Up {topic}: Your Options Explained',
      '{topic} Methods: What Actually Gets Results',
    ],
    keywordSuffixes: ['vs', 'versus', 'comparison', 'difference', 'which'],
    priority: 70,
  },
  {
    id: 'checklist',
    name: 'Checklist',
    purpose: 'Actionable resource',
    displayHint: 'Practical checklist ensuring nothing gets missed',
    titleVariations: [
      'Before You File: {topic} Checklist',
      'The Complete {topic} Preparation List',
      '{number} Things to Check Before Your {topic}',
      'Don\'t Submit Until You\'ve Checked This: {topic}',
      'Your Pre-{topic} Checklist',
      '{topic} Ready? Use This Checklist First',
    ],
    keywordSuffixes: ['checklist', 'list', 'before you', 'preparation'],
    priority: 65,
  },
];

export const VALUE_TIERS = {
  high: {
    id: 'high',
    name: 'High Value',
    articleCount: 10,
    description: 'High-traffic categories (Travel, Insurance, Financial)',
    articleTypes: ARTICLE_TYPES.map(t => t.id), // All types
  },
  medium: {
    id: 'medium',
    name: 'Medium Value',
    articleCount: 7,
    description: 'Standard coverage (Housing, Vehicle, Healthcare)',
    articleTypes: ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'checklist', 'case-study'],
  },
  longtail: {
    id: 'longtail',
    name: 'Long-Tail',
    articleCount: 5,
    description: 'Basic focused coverage (HOA, Contractors subsections)',
    articleTypes: ['how-to', 'mistakes', 'rights', 'sample', 'checklist'],
  },
} as const;

export type ValueTier = keyof typeof VALUE_TIERS;

export const getArticleTypesForTier = (tier: ValueTier): ArticleType[] => {
  const tierConfig = VALUE_TIERS[tier];
  return ARTICLE_TYPES.filter(t => (tierConfig.articleTypes as readonly string[]).includes(t.id))
    .sort((a, b) => b.priority - a.priority);
};

export const getArticleTypeById = (id: string): ArticleType | undefined => {
  return ARTICLE_TYPES.find(t => t.id === id);
};

// Category-specific terminology for more natural language generation
export const CATEGORY_LANGUAGE: Record<string, { terms: string[]; tone: string }> = {
  contractors: {
    terms: ['builder', 'tradesman', 'workmanship', 'job', 'quote', 'deposit'],
    tone: 'practical and no-nonsense, like advice from a trusted neighbor',
  },
  financial: {
    terms: ['bank', 'lender', 'charges', 'account', 'statement', 'fees'],
    tone: 'authoritative but accessible, demystifying financial jargon',
  },
  travel: {
    terms: ['airline', 'carrier', 'booking', 'flight', 'delay', 'compensation'],
    tone: 'empathetic and action-oriented, understanding travel frustrations',
  },
  insurance: {
    terms: ['claim', 'policy', 'adjuster', 'denial', 'coverage', 'premium'],
    tone: 'confident and reassuring, cutting through insurance complexity',
  },
  housing: {
    terms: ['landlord', 'tenant', 'letting agent', 'deposit', 'repairs', 'lease'],
    tone: 'supportive and empowering, helping renters stand their ground',
  },
  vehicle: {
    terms: ['dealer', 'garage', 'warranty', 'repair', 'defect', 'lemon'],
    tone: 'straightforward and fair, advocating for car owners',
  },
  utilities: {
    terms: ['provider', 'bill', 'meter', 'overcharge', 'tariff', 'service'],
    tone: 'matter-of-fact and helpful, tackling everyday billing issues',
  },
  ecommerce: {
    terms: ['seller', 'order', 'refund', 'delivery', 'faulty', 'return'],
    tone: 'consumer-focused and practical, navigating online shopping issues',
  },
  employment: {
    terms: ['employer', 'workplace', 'contract', 'wages', 'dismissal', 'rights'],
    tone: 'professional and supportive, empowering workers',
  },
  healthcare: {
    terms: ['NHS', 'treatment', 'appointment', 'referral', 'complaint', 'care'],
    tone: 'compassionate and clear, helping navigate healthcare challenges',
  },
};
