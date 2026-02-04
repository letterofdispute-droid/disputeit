// Article type definitions for the SEO Content Command Center

export interface ArticleType {
  id: string;
  name: string;
  purpose: string;
  titleTemplate: string;
  keywordSuffixes: string[];
  priority: number; // Higher = generate first
}

export const ARTICLE_TYPES: ArticleType[] = [
  {
    id: 'how-to',
    name: 'How-To Guide',
    purpose: 'Step-by-step instructions',
    titleTemplate: 'How to {action} {topic} Step-by-Step',
    keywordSuffixes: ['how to', 'guide', 'step by step', 'tutorial'],
    priority: 100,
  },
  {
    id: 'mistakes',
    name: 'Mistakes to Avoid',
    purpose: 'Prevent common errors',
    titleTemplate: '{number} Mistakes That Get Your {topic} Rejected',
    keywordSuffixes: ['mistakes', 'errors', 'avoid', 'rejected', 'common mistakes'],
    priority: 95,
  },
  {
    id: 'rights',
    name: 'Rights Explainer',
    purpose: 'Educational authority',
    titleTemplate: 'Your Rights: {topic} - What {entity} Won\'t Tell You',
    keywordSuffixes: ['rights', 'legal rights', 'consumer rights', 'know your rights'],
    priority: 90,
  },
  {
    id: 'sample',
    name: 'Sample/Example',
    purpose: 'Show real scenarios',
    titleTemplate: '{topic} Letter Examples That Actually Worked',
    keywordSuffixes: ['example', 'sample', 'template', 'letter example'],
    priority: 85,
  },
  {
    id: 'faq',
    name: 'FAQ/Q&A',
    purpose: 'Capture question keywords',
    titleTemplate: '{topic} FAQ: {number} Questions Answered',
    keywordSuffixes: ['faq', 'questions', 'answers', 'q&a'],
    priority: 80,
  },
  {
    id: 'case-study',
    name: 'Case Study',
    purpose: 'Social proof/scenarios',
    titleTemplate: 'How {name} Successfully {outcome} - A Case Study',
    keywordSuffixes: ['case study', 'success story', 'real example', 'worked'],
    priority: 75,
  },
  {
    id: 'comparison',
    name: 'Comparison',
    purpose: 'Decision support',
    titleTemplate: '{option1} vs {option2}: Which Applies to Your {topic}?',
    keywordSuffixes: ['vs', 'versus', 'comparison', 'difference', 'which'],
    priority: 70,
  },
  {
    id: 'checklist',
    name: 'Checklist',
    purpose: 'Actionable resource',
    titleTemplate: 'Complete Checklist Before Filing Your {topic}',
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
