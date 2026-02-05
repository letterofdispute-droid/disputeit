// Post-generation content validator to catch AI-typical phrases

// === TITLE VALIDATION ===

// Banned title starters - emotional hooks and generic phrases AI defaults to
export const BANNED_TITLE_STARTERS = [
  'fed up',
  'tired of',
  'sick of',
  'frustrated with',
  'had enough',
  'enough is enough',
  'stop letting',
  "don't let",
  'the ultimate',
  'the complete',
  'everything you need',
  'all you need to know',
  'a comprehensive',
  'the definitive',
  'your complete',
  'the only guide',
  'finally',
  'at last',
  'once and for all',
  'say goodbye to',
  'never again',
  'are you tired',
  'have you ever',
  'what if i told you',
  'imagine if',
  'picture this',
  'let me tell you',
  'here is why',
  "here's why",
  "here's how",
  'here is how',
  'discover how',
  'learn how',
  'find out how',
  'see how',
  'watch how',
];

export interface TitleValidation {
  isValid: boolean;
  reason?: string;
}

export function validateTitle(
  title: string,
  existingTitles: string[]
): TitleValidation {
  const lowerTitle = title.toLowerCase().trim();
  
  // Check banned starters
  for (const banned of BANNED_TITLE_STARTERS) {
    if (lowerTitle.startsWith(banned)) {
      return { 
        isValid: false, 
        reason: `Title starts with banned phrase: "${banned}"` 
      };
    }
  }
  
  // Check first 2 words against existing titles to prevent patterns
  const titleWords = lowerTitle.split(/\s+/).filter(w => w.length > 0);
  const firstTwoWords = titleWords.slice(0, 2).join(' ');
  
  for (const existing of existingTitles) {
    const existingLower = existing.toLowerCase().trim();
    const existingWords = existingLower.split(/\s+/).filter(w => w.length > 0);
    const existingFirstTwo = existingWords.slice(0, 2).join(' ');
    
    if (firstTwoWords === existingFirstTwo && firstTwoWords.length > 3) {
      return { 
        isValid: false, 
        reason: `Title starts same as existing: "${existing.substring(0, 50)}..."` 
      };
    }
  }
  
  return { isValid: true };
}

// Validate a batch of titles for diversity
export function validateTitleBatch(
  titles: string[],
  existingTitles: string[]
): { valid: string[]; rejected: Array<{ title: string; reason: string }> } {
  const valid: string[] = [];
  const rejected: Array<{ title: string; reason: string }> = [];
  const seenFirstWords = new Set<string>();
  
  // Build set of first words from existing titles
  for (const existing of existingTitles) {
    const words = existing.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      seenFirstWords.add(words.slice(0, 2).join(' '));
    }
  }
  
  for (const title of titles) {
    const validation = validateTitle(title, existingTitles);
    
    if (!validation.isValid) {
      rejected.push({ title, reason: validation.reason! });
      continue;
    }
    
    // Also check against already-validated titles in this batch
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const firstTwo = titleWords.slice(0, 2).join(' ');
    
    if (seenFirstWords.has(firstTwo) && firstTwo.length > 3) {
      rejected.push({ title, reason: `Duplicate pattern in batch: "${firstTwo}"` });
      continue;
    }
    
    seenFirstWords.add(firstTwo);
    valid.push(title);
  }
  
  return { valid, rejected };
}

export const FORBIDDEN_PHRASES = [
  // AI jargon
  'delve', 'delving', 'dive into', 'diving deep', 'deep dive',
  'game-changer', 'game changer', 'groundbreaking', 'revolutionary',
  'navigate', 'navigating', 'landscape', 'realm',
  'crucial', 'vital', 'essential',
  'unlock', 'unleash', 'empower', 'empowering',
  'seamless', 'seamlessly', 'effortlessly',
  'robust', 'comprehensive', 'cutting-edge', 'cutting edge',
  'leverage', 'leveraging', 'utilize', 'utilizing',
  'paradigm', 'synergy', 'holistic',
  'streamline', 'streamlining', 'optimize', 'optimizing',
  'elevate', 'elevating', 'enhance', 'enhancing',
  'foster', 'fostering', 'facilitate', 'facilitating',
  'spearhead', 'spearheading', 'champion', 'championing',
  'pivotal', 'paramount', 'instrumental',
  
  // Filler phrases
  "it's important to note", "it's worth mentioning", "it's worth noting",
  "in today's world", "in this day and age", "in the modern era",
  "at the end of the day", "when all is said and done",
  "let's explore", "let's take a look", "let's dive",
  "first and foremost", "last but not least",
  "without further ado", "moving forward",
  "it goes without saying", "needless to say",
  "as we all know", "as you may know",
  "the fact of the matter is", "truth be told",
  "in conclusion", "to summarize", "in summary",
  "all in all", "by and large",
];

// Patterns that indicate AI writing (regex-based)
export const FORBIDDEN_PATTERNS = [
  /^so,?\s/i,  // Starting with "So,"
  /^now,?\s/i, // Starting with "Now,"
  /\u2014/g,   // Em dash
  /\u2013/g,   // En dash
  /\u2018|\u2019/g, // Smart single quotes
  /\u201C|\u201D/g, // Smart double quotes
  /\u2026/g,   // Ellipsis character
  /\u2022/g,   // Bullet point
  /^#{1,6}\s/gm, // Markdown headers
];

export interface ContentViolation {
  phrase: string;
  count: number;
  type: 'phrase' | 'pattern';
  severity: 'warning' | 'error';
}

export interface ValidationResult {
  isClean: boolean;
  violations: ContentViolation[];
  score: number; // 0-100, 100 is clean
}

export function validateContent(content: string): ValidationResult {
  const violations: ContentViolation[] = [];
  const lowerContent = content.toLowerCase();
  
  // Check for forbidden phrases
  for (const phrase of FORBIDDEN_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      violations.push({
        phrase: phrase,
        count: matches.length,
        type: 'phrase',
        severity: matches.length > 2 ? 'error' : 'warning',
      });
    }
  }
  
  // Check for forbidden patterns
  const patternDescriptions: Record<number, string> = {
    0: 'Sentence starting with "So,"',
    1: 'Sentence starting with "Now,"',
    2: 'Em dash character',
    3: 'En dash character',
    4: 'Smart single quotes',
    5: 'Smart double quotes',
    6: 'Ellipsis character',
    7: 'Bullet point character',
    8: 'Markdown headers',
  };
  
  FORBIDDEN_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      violations.push({
        phrase: patternDescriptions[index] || `Pattern ${index}`,
        count: matches.length,
        type: 'pattern',
        severity: 'warning',
      });
    }
  });
  
  // Calculate score (100 = clean, deduct points for violations)
  const totalViolations = violations.reduce((sum, v) => sum + v.count, 0);
  const score = Math.max(0, 100 - (totalViolations * 5));
  
  return {
    isClean: violations.length === 0,
    violations,
    score,
  };
}

// Quick check that returns just true/false
export function isContentClean(content: string): boolean {
  return validateContent(content).isClean;
}

// Get a summary string for logging
export function getViolationSummary(result: ValidationResult): string {
  if (result.isClean) {
    return 'Content passed validation (no AI-typical phrases detected)';
  }
  
  const phrases = result.violations
    .filter(v => v.type === 'phrase')
    .map(v => `"${v.phrase}" (${v.count}x)`)
    .join(', ');
    
  const patterns = result.violations
    .filter(v => v.type === 'pattern')
    .map(v => `${v.phrase} (${v.count}x)`)
    .join(', ');
  
  let summary = `Content score: ${result.score}/100. `;
  if (phrases) summary += `Flagged phrases: ${phrases}. `;
  if (patterns) summary += `Flagged patterns: ${patterns}.`;
  
  return summary;
}
