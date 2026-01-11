/**
 * LETTER GENERATION RULES (MANDATORY)
 * =====================================
 * 
 * This module enforces strict constraints on letter generation to ensure
 * legal safety and consistency. These rules are NON-NEGOTIABLE.
 * 
 * AI/Processing is ONLY allowed to:
 * ✅ Fill predefined placeholders with user-provided data
 * ✅ Select from pre-approved phrase blocks (approvedPhrases)
 * ✅ Adjust grammar/flow without changing meaning
 * 
 * AI/Processing MUST NOT:
 * ❌ Invent legal language or statutes
 * ❌ Add threats or consequences not in approved phrases
 * ❌ Add statutes not explicitly in jurisdictionPhrases
 * ❌ Escalate tone beyond the selected option
 * ❌ Generate any free-form legal content
 * ❌ Promise outcomes or enforcement
 * ❌ Mix jurisdictions
 */

import { LetterTemplate, JurisdictionConfig } from '@/data/letterTemplates';

export type Tone = 'neutral' | 'firm' | 'final';

/**
 * JURISDICTION PHRASE LIBRARIES
 * AI can ONLY select from these predefined phrases.
 * No reasoning about law is permitted.
 */
export const jurisdictionPhrases: Record<string, JurisdictionPhraseLibrary> = {
  UK: {
    legalReference: "Consumer Rights Act 2015",
    approvedPhrases: [
      "Under the Consumer Rights Act 2015",
      "In accordance with UK consumer law",
      "As provided by UK consumer protection regulations",
      "Pursuant to my statutory rights as a consumer"
    ],
    deadlinePhrases: {
      neutral: "I would appreciate a response within 14 days",
      firm: "I expect a response within 14 days of this letter",
      final: "Please respond within 7 days"
    }
  },
  EU: {
    legalReference: "consumer protection regulations",
    approvedPhrases: [
      "Under EU consumer protection regulations",
      "In accordance with applicable consumer rights",
      "As provided by consumer protection law"
    ],
    deadlinePhrases: {
      neutral: "I would appreciate a response within 14 days",
      firm: "I expect a response within 14 days of this letter",
      final: "Please respond within 7 days"
    }
  },
  US: {
    legalReference: null, // No specific statute - generic language only
    approvedPhrases: [
      "Under applicable consumer protection laws",
      "In accordance with consumer rights",
      "As a consumer, I am entitled to"
    ],
    deadlinePhrases: {
      neutral: "I would appreciate a response within 14 days",
      firm: "I expect a response within 14 days of this letter",
      final: "Please respond within 7 days"
    }
  },
  generic: {
    legalReference: null,
    approvedPhrases: [
      "Under applicable consumer protection laws",
      "In accordance with my consumer rights"
    ],
    deadlinePhrases: {
      neutral: "I would appreciate a response within 14 days",
      firm: "I expect a response within 14 days of this letter",
      final: "Please respond within 7 days"
    }
  }
};

interface JurisdictionPhraseLibrary {
  legalReference: string | null;
  approvedPhrases: string[];
  deadlinePhrases: Record<Tone, string>;
}

/**
 * TONE MODIFIERS
 * Defines exactly how tone affects letter language.
 * AI cannot add content beyond these definitions.
 */
export const toneModifiers: Record<Tone, ToneDefinition> = {
  neutral: {
    label: "Professional & Polite",
    closingPhrases: [
      "I trust this matter can be resolved amicably",
      "I look forward to hearing from you",
      "Thank you for your attention to this matter"
    ],
    escalationNote: null // No escalation language permitted
  },
  firm: {
    label: "Firm & Direct",
    closingPhrases: [
      "I look forward to your prompt resolution of this matter",
      "I expect this issue to be addressed without further delay",
      "I await your response"
    ],
    escalationNote: null // Still no threats
  },
  final: {
    label: "Final Notice",
    closingPhrases: [
      "I expect this matter to be resolved immediately",
      "Please treat this as a matter of urgency",
      "I await your immediate response"
    ],
    escalationNote: "If I do not receive a satisfactory response, I may need to consider my options for further action."
    // Note: "may need to consider" is deliberately vague - no specific threats
  }
};

interface ToneDefinition {
  label: string;
  closingPhrases: string[];
  escalationNote: string | null;
}

/**
 * PLACEHOLDER SUBSTITUTION
 * 
 * This is the ONLY transformation permitted on letter content.
 * Replaces {placeholder} with user-provided values.
 */
export function substitutePlaceholders(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(values)) {
    // Only substitute if value is provided and not empty
    if (value && value.trim()) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(placeholder, value.trim());
    }
  }
  
  return result;
}

/**
 * VALIDATION: Ensure no unauthorized legal content
 * 
 * Scans generated content to verify only approved phrases are used.
 * Returns false if any unauthorized legal language is detected.
 */
export function validateLegalContent(
  content: string,
  jurisdiction: string
): ValidationResult {
  const phrases = jurisdictionPhrases[jurisdiction] || jurisdictionPhrases.generic;
  
  // List of patterns that indicate unauthorized legal content
  const unauthorizedPatterns = [
    /I will sue/i,
    /legal action/i,
    /my lawyer/i,
    /court proceedings/i,
    /statutory damages/i,
    /criminal complaint/i,
    /report you to/i,
    /trading standards/i, // Only if not in approved list
    /breach of contract/i,
    /liable for/i,
    /negligence/i,
    /compensation for distress/i
  ];

  const violations: string[] = [];

  for (const pattern of unauthorizedPatterns) {
    if (pattern.test(content)) {
      // Check if this is part of an approved phrase
      const isApproved = phrases.approvedPhrases.some(
        approved => approved.toLowerCase().includes(pattern.source.toLowerCase().replace(/\\i$/, ''))
      );
      
      if (!isApproved) {
        violations.push(`Unauthorized legal content detected: ${pattern.source}`);
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

interface ValidationResult {
  isValid: boolean;
  violations: string[];
}

/**
 * GET DEADLINE PHRASE
 * Returns the appropriate deadline phrase for jurisdiction and tone.
 */
export function getDeadlinePhrase(jurisdiction: string, tone: Tone): string {
  const phrases = jurisdictionPhrases[jurisdiction] || jurisdictionPhrases.generic;
  return phrases.deadlinePhrases[tone];
}

/**
 * GET CLOSING PHRASE
 * Returns an appropriate closing phrase for the tone.
 */
export function getClosingPhrase(tone: Tone): string {
  const modifier = toneModifiers[tone];
  // Return the first (most appropriate) closing phrase
  return modifier.closingPhrases[0];
}

/**
 * GET LEGAL REFERENCE
 * Returns the approved legal reference for a jurisdiction, or null if none.
 */
export function getLegalReference(jurisdiction: string): string | null {
  const phrases = jurisdictionPhrases[jurisdiction] || jurisdictionPhrases.generic;
  return phrases.legalReference;
}

/**
 * GET ESCALATION NOTE
 * Returns escalation language if permitted for the tone, otherwise null.
 */
export function getEscalationNote(tone: Tone): string | null {
  return toneModifiers[tone].escalationNote;
}

/**
 * GENERATE LETTER SECTION
 * 
 * Generates a single section of the letter using ONLY:
 * - Template text from the predefined template
 * - User-provided placeholder values
 * - Approved jurisdiction phrases (if legal reference requested)
 * 
 * NO free-form generation is permitted.
 */
export function generateSection(
  sectionTemplate: string,
  formData: Record<string, string>,
  jurisdiction: string,
  tone: Tone
): string {
  // Step 1: Substitute placeholders with user data
  let content = substitutePlaceholders(sectionTemplate, formData);
  
  // Step 2: Replace jurisdiction placeholder if present
  const legalRef = getLegalReference(jurisdiction);
  if (legalRef) {
    content = content.replace(/{legalReference}/g, legalRef);
  } else {
    // Remove legal reference placeholder if no approved reference exists
    content = content.replace(/{legalReference}/g, 'consumer protection laws');
  }
  
  // Step 3: Replace deadline placeholder
  content = content.replace(/{deadline}/g, getDeadlinePhrase(jurisdiction, tone));
  
  // Step 4: Replace closing placeholder
  content = content.replace(/{closing}/g, getClosingPhrase(tone));
  
  // Step 5: Add escalation note if applicable (final notice only)
  const escalation = getEscalationNote(tone);
  if (escalation) {
    content = content.replace(/{escalationNote}/g, escalation);
  } else {
    content = content.replace(/{escalationNote}/g, '');
  }
  
  return content;
}

/**
 * FULL LETTER GENERATION
 * 
 * Orchestrates the complete letter generation process.
 * Enforces all constraints and validates output.
 */
export function generateFullLetter(
  template: LetterTemplate,
  formData: Record<string, string>,
  jurisdiction: string,
  tone: Tone
): GeneratedLetterResult {
  const sections: GeneratedSection[] = [];
  
  // Generate each section using template-only generation
  for (const section of template.sections) {
    const content = generateSection(
      section.template,
      formData,
      jurisdiction,
      tone
    );
    const sectionTitle = section.name;
    
    sections.push({
      title: sectionTitle,
      content
    });
  }
  
  // Combine all sections
  const fullContent = sections.map(s => s.content).join('\n\n');
  
  // Validate the generated content
  const validation = validateLegalContent(fullContent, jurisdiction);
  
  if (!validation.isValid) {
    console.warn('Letter validation failed:', validation.violations);
    // In production, this could throw an error or flag for review
  }
  
  return {
    sections,
    fullContent,
    validation,
    metadata: {
      templateId: template.id,
      jurisdiction,
      tone,
      generatedAt: new Date().toISOString()
    }
  };
}

interface GeneratedSection {
  title: string;
  content: string;
}

interface GeneratedLetterResult {
  sections: GeneratedSection[];
  fullContent: string;
  validation: ValidationResult;
  metadata: {
    templateId: string;
    jurisdiction: string;
    tone: Tone;
    generatedAt: string;
  };
}

/**
 * EXPORTS SUMMARY
 * 
 * Public API:
 * - substitutePlaceholders: Replace {placeholders} with values
 * - validateLegalContent: Check for unauthorized legal content
 * - generateSection: Generate a single letter section
 * - generateFullLetter: Generate complete letter with validation
 * - getDeadlinePhrase: Get appropriate deadline language
 * - getClosingPhrase: Get appropriate closing language
 * - getLegalReference: Get jurisdiction's legal reference (or null)
 * - jurisdictionPhrases: All approved phrases by jurisdiction
 * - toneModifiers: All tone definitions and phrases
 */
