
# AI-Powered Template Enhancement Plan

## Executive Summary

This plan transforms all 450+ static letter templates into intelligent, adaptive forms powered by AI. Each template will have:
- Dynamic field validation with real-time feedback
- Smart suggestions based on the user's specific situation  
- Evidence requirement checklists tailored to their case
- Real-time completeness scoring
- Credibility messaging throughout the experience

---

## Current State Analysis

### What Exists Now
- 450+ templates with static fields defined in TypeScript files
- Fields include basic validation (required/optional) but no smart logic
- Letter generation uses simple placeholder substitution
- No AI integration in the form-filling process itself
- Dispute Assistant exists but only for template discovery, not form enhancement

### Key Gaps
1. **Static fields** - Same questions for everyone regardless of their specific situation
2. **No validation intelligence** - Missing industry-specific format validation (PIR numbers, IATA codes)
3. **No guidance** - Users don't know what evidence to gather or how to describe their issue effectively
4. **No completeness feedback** - No indication of letter strength before purchase

---

## Architecture Overview

```text
+------------------+      +----------------------+      +-------------------+
|  Template Page   | ---> |  Smart Form Engine   | ---> |  Letter Generator |
|  (LetterPage)    |      |  (AI-Enhanced)       |      |  (Existing)       |
+------------------+      +----------------------+      +-------------------+
        |                         |                            |
        v                         v                            v
+------------------+      +----------------------+      +-------------------+
|  Field Renderer  |      |  Edge Function:      |      |  Generated Letter |
|  with AI Hints   |      |  form-assistant      |      |  (PDF/DOCX)       |
+------------------+      +----------------------+      +-------------------+
```

---

## Phase 1: Smart Field Enhancement System

### 1.1 Enhanced Field Interface

**File: `src/data/letterTemplates.ts`**

Add new optional properties to `TemplateField`:

```typescript
export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number';
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: string[];
  
  // NEW: Smart enhancement properties
  validation?: FieldValidation;
  aiEnhanced?: boolean;           // Enable AI suggestions for this field
  evidenceHint?: string;          // "Have your boarding pass handy"
  formatHint?: string;            // "Format: ABC123 (6 characters)"
  commonMistakes?: string[];      // ["Don't include spaces", "Use capitals"]
  impactLevel?: 'critical' | 'important' | 'helpful';
}

export interface FieldValidation {
  pattern?: string;               // Regex pattern
  patternMessage?: string;        // "Must be 6 letters/numbers"
  minLength?: number;
  maxLength?: number;
  format?: 'email' | 'phone' | 'date' | 'currency' | 'pir' | 'pnr' | 'iata';
  customValidator?: string;       // Named validator function
}
```

### 1.2 Field Validation Library

**File: `src/lib/fieldValidators.ts`**

```typescript
// Industry-specific validation patterns
export const validationPatterns = {
  // Travel
  pnr: /^[A-Z0-9]{6}$/,           // Booking reference
  iata: /^[A-Z]{3}$/,             // Airport code
  flightNumber: /^[A-Z]{2}\d{1,4}$/, // e.g., BA123
  pirReference: /^[A-Z]{5}\d{5}$/, // Property Irregularity Report
  worldTracer: /^[A-Z]{3}\d{5}$/,  // WorldTracer number
  bagTag: /^\d{10}$/,              // 10-digit bag tag
  
  // Insurance
  policyNumber: /^[A-Z]{2,4}\d{6,10}$/,
  claimNumber: /^CLM-?\d{6,12}$/,
  
  // Vehicle
  vin: /^[A-HJ-NPR-Z0-9]{17}$/,
  licensePlate: /^[A-Z0-9]{2,8}$/,
  
  // Financial
  accountLast4: /^\d{4}$/,
  sortCode: /^\d{2}-?\d{2}-?\d{2}$/,
  
  // Housing
  tenancyRef: /^[A-Z0-9]{4,12}$/,
  
  // Healthcare
  npiNumber: /^\d{10}$/,           // Provider NPI
  rxNumber: /^RX\d{6,10}$/,        // Prescription number
  
  // Contractors
  licenseNumber: /^[A-Z]{2,3}\d{6,10}$/,
  permitNumber: /^[A-Z0-9]{8,15}$/,
};

export function validateField(value: string, validation: FieldValidation): ValidationResult {
  // Implementation for each validation type
}
```

### 1.3 Template Field Updates

Update all 450+ templates with enhanced field metadata. Example for Lost Baggage:

```typescript
fields: [
  {
    id: 'pirReference',
    label: 'PIR Reference Number',
    type: 'text',
    required: true,
    placeholder: 'e.g., LHRBA12345',
    helpText: 'From the report you filed at the airport',
    validation: {
      format: 'pir',
      patternMessage: 'PIR format: 5 letters + 5 numbers (e.g., LHRBA12345)'
    },
    evidenceHint: 'Find this on the Property Irregularity Report from the airport',
    formatHint: 'First 3 letters are airport code, next 2 are airline code',
    impactLevel: 'critical',
    aiEnhanced: true
  },
  {
    id: 'bagTag',
    label: 'Bag Tag Number',
    type: 'text',
    required: true,
    placeholder: 'e.g., 1234567890',
    validation: {
      format: 'bagTag',
      patternMessage: 'Bag tag should be 10 digits'
    },
    evidenceHint: 'Usually on the sticky label attached to your boarding pass stub',
    impactLevel: 'critical'
  },
  {
    id: 'contentsDescription',
    label: 'Bag Contents',
    type: 'textarea',
    required: true,
    aiEnhanced: true,  // AI will help structure this
    evidenceHint: 'List each item with approximate value. Keep receipts/photos if available.',
    impactLevel: 'critical'
  }
]
```

---

## Phase 2: Real-Time AI Form Assistant

### 2.1 Edge Function: Form Assistant

**File: `supabase/functions/form-assistant/index.ts`**

A new edge function that provides real-time AI assistance during form filling:

```typescript
// Capabilities:
// 1. Validate user input contextually
// 2. Suggest better descriptions
// 3. Identify missing critical information
// 4. Score letter strength

const systemPrompt = `You are a form assistant helping users fill out dispute letters.

Your job is to:
1. VALIDATE: Check if the user's input is appropriate for a formal complaint letter
2. SUGGEST: Offer specific improvements to make their case stronger
3. IDENTIFY: Point out missing information that could weaken their claim
4. SCORE: Rate the completeness and strength of their letter (1-100)

CATEGORY EXPERTISE:
You understand the requirements for each dispute type:
- TRAVEL: EU261 compensation tiers, Montreal Convention limits, airline procedures
- INSURANCE: Documentation requirements, policy terms, claims processes
- CONTRACTORS: Building codes, licensing requirements, warranty terms
- HOUSING: Landlord obligations, habitability standards, notice requirements
- FINANCIAL: FCRA, FDCPA, banking regulations
- HEALTHCARE: HIPAA, billing regulations, insurance mandates

IMPORTANT CONSTRAINTS:
- Never provide legal advice
- Focus on practical improvements
- Be encouraging while being specific
- Suggest evidence they should gather
`;
```

### 2.2 Frontend Component: Smart Field

**File: `src/components/letter/SmartField.tsx`**

A new field component that provides:
- Real-time format validation with helpful messages
- AI suggestions on blur/after typing
- Evidence requirement hints
- Visual feedback on field importance

```typescript
interface SmartFieldProps {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
  aiSuggestion?: string;
  isValidating?: boolean;
  validationError?: string;
  strength?: 'weak' | 'moderate' | 'strong';
}
```

Features:
- Shows validation state (green check, yellow warning, red error)
- Displays AI suggestions in a tooltip/popover
- Highlights critical vs optional fields
- Shows "Tip" badges for evidence hints

### 2.3 Letter Strength Meter

**File: `src/components/letter/LetterStrengthMeter.tsx`**

Visual indicator showing:
- Overall letter completeness (%)
- Field-by-field strength analysis
- Missing critical information warnings
- "Your letter could be stronger" suggestions

---

## Phase 3: Category-Specific Intelligence

### 3.1 Knowledge Base Structure

**File: `src/data/categoryKnowledge.ts`**

Centralized intelligence for each category:

```typescript
export const categoryKnowledge = {
  travel: {
    flights: {
      regulations: {
        EU261: {
          description: 'EU Regulation 261/2004 for flight delays/cancellations',
          compensationTiers: {
            short: { distance: 'Under 1,500km', amount: 250 },
            medium: { distance: '1,500-3,500km', amount: 400 },
            long: { distance: 'Over 3,500km', amount: 600 }
          },
          eligibility: [
            'Flight departed from EU airport (any airline)',
            'Flight to EU on EU-based airline',
            'Delay of 3+ hours at final destination',
            'Not caused by extraordinary circumstances'
          ],
          extraordinaryCircumstances: [
            'Severe weather', 'Political instability', 'Security threats',
            'Air traffic control strikes', 'Hidden manufacturing defects'
          ],
          notExtraordinary: [
            'Technical faults (most)', 'Crew illness', 'Operational decisions',
            'Bird strikes', 'Refueling issues'
          ]
        },
        montrealConvention: {
          baggageLiability: 1288,  // SDR limit
          delayLiability: 5346,
          description: 'International air carriage liability limits'
        }
      },
      requiredEvidence: {
        delay: ['Boarding pass', 'Booking confirmation', 'Delay notification', 'Expense receipts'],
        cancellation: ['Booking confirmation', 'Cancellation notification', 'Alternative flight details'],
        baggage: ['PIR report', 'Bag tags', 'Contents list with values', 'Receipts for essentials purchased']
      }
    }
  },
  
  insurance: {
    claims: {
      requiredDocuments: {
        auto: ['Policy document', 'Police report', 'Photos of damage', 'Repair estimates'],
        home: ['Policy document', 'Photos', 'Contractor estimates', 'Inventory list'],
        health: ['EOB statement', 'Medical records', 'Itemized bills', 'Prescription records']
      },
      commonDenialReasons: {
        auto: ['Pre-existing damage', 'Excluded driver', 'Lapsed coverage', 'Fraud suspicion'],
        health: ['Not medically necessary', 'Out of network', 'Prior authorization required']
      }
    }
  },
  
  contractors: {
    licensing: {
      checkPoints: [
        'Verify license with state/local board',
        'Confirm insurance coverage',
        'Check for complaints/disciplinary actions'
      ],
      commonViolations: [
        'Work without permits', 'Unlicensed work', 'Code violations',
        'Abandonment', 'Failure to complete'
      ]
    },
    documentation: {
      required: ['Written contract', 'Change orders', 'Payment receipts', 'Photos of defects'],
      helpful: ['Text/email communications', 'Witness statements', 'Expert assessments']
    }
  }
  // ... more categories
};
```

### 3.2 Dynamic Help Content

For each template, show contextual help based on the category knowledge:
- "What you'll need" checklist
- "Common pitfalls to avoid"
- "This letter typically works because..."

---

## Phase 4: Enhanced User Experience

### 4.1 Updated LetterGenerator Component

**File: `src/components/letter/LetterGenerator.tsx`**

Enhance the existing 3-step flow:

**Step 1 (Enhanced):**
- Smart fields with real-time validation
- AI suggestions in sidebar
- Evidence checklist toggle
- "Tip" badges on critical fields

**Step 2 (Enhanced):**  
- Letter strength meter
- AI analysis of case strength
- Missing information warnings
- Suggested improvements panel

**Step 3 (Enhanced):**
- Preview with highlighted improvements
- Comparison of weak vs strong version
- Final AI review summary

### 4.2 Credibility Messaging

Add trust indicators throughout the form experience:

**Header Badge:**
```tsx
<div className="flex items-center gap-2 text-sm">
  <Sparkles className="h-4 w-4 text-accent" />
  <span>AI-Enhanced Template</span>
</div>
```

**Field-level:**
```tsx
{field.aiEnhanced && (
  <Badge variant="outline" className="text-xs">
    <Sparkles className="h-3 w-3 mr-1" />
    AI-Assisted
  </Badge>
)}
```

**Methodology section (footer of each template):**
```tsx
<Card className="mt-8 p-4 bg-muted/50">
  <h4 className="font-medium flex items-center gap-2">
    <Shield className="h-4 w-4" />
    How This Template Was Built
  </h4>
  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
    <li>✓ Based on {regulation} requirements</li>
    <li>✓ Validated against industry standards</li>
    <li>✓ Enhanced with AI-powered field validation</li>
    <li>✓ Tested for real-world effectiveness</li>
  </ul>
</Card>
```

---

## Phase 5: Template Data Migration

### 5.1 Migration Script

Create a script to systematically enhance all 450+ templates:

**File: `scripts/enhance-templates.ts`**

The script will:
1. Read each template file
2. Apply category-specific field enhancements
3. Add validation patterns based on field ID patterns
4. Insert evidence hints from categoryKnowledge
5. Set impactLevel based on required status

### 5.2 Category-Specific Field Mappings

Define which fields get which enhancements:

```typescript
const fieldEnhancements = {
  // Travel fields
  pirReference: { format: 'pir', impactLevel: 'critical', evidenceHint: '...' },
  bookingReference: { format: 'pnr', impactLevel: 'critical', evidenceHint: '...' },
  flightNumber: { format: 'flightNumber', impactLevel: 'critical' },
  
  // Insurance fields
  policyNumber: { format: 'policyNumber', impactLevel: 'critical' },
  claimNumber: { format: 'claimNumber', impactLevel: 'critical' },
  
  // Vehicle fields
  vin: { format: 'vin', impactLevel: 'important' },
  licensePlate: { format: 'licensePlate', impactLevel: 'important' },
  
  // Common across categories
  amountPaid: { format: 'currency', impactLevel: 'critical' },
  email: { format: 'email', impactLevel: 'important' },
  phone: { format: 'phone', impactLevel: 'helpful' }
};
```

---

## Implementation Order

### Week 1: Foundation
1. Extend `TemplateField` interface with new properties
2. Create `fieldValidators.ts` with validation patterns
3. Create `categoryKnowledge.ts` with domain expertise
4. Build `SmartField.tsx` component

### Week 2: AI Integration
5. Create `form-assistant` edge function
6. Build `LetterStrengthMeter.tsx` component
7. Update `LetterGenerator.tsx` to use new components
8. Add credibility messaging UI

### Week 3: Template Migration (Batch 1)
9. Enhance Travel templates (12 templates)
10. Enhance Insurance templates (8 templates)
11. Enhance Healthcare templates (50 templates)

### Week 4: Template Migration (Batch 2)
12. Enhance Contractors templates (~50 templates)
13. Enhance Housing templates (14 templates)
14. Enhance Vehicle templates (8 templates)

### Week 5: Template Migration (Batch 3)
15. Enhance Financial templates (10 templates)
16. Enhance Utilities templates (10 templates)
17. Enhance E-commerce templates (5 templates)
18. Enhance remaining categories

### Week 6: Polish
19. End-to-end testing
20. Performance optimization
21. A/B testing framework
22. Analytics for AI suggestions

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/fieldValidators.ts` | Validation patterns and functions |
| `src/data/categoryKnowledge.ts` | Domain expertise by category |
| `src/components/letter/SmartField.tsx` | AI-enhanced form field |
| `src/components/letter/LetterStrengthMeter.tsx` | Visual strength indicator |
| `src/components/letter/EvidenceChecklist.tsx` | Required documents checklist |
| `src/components/letter/MethodologyBadge.tsx` | Credibility messaging |
| `src/hooks/useFormAssistant.ts` | Hook for AI form assistance |
| `supabase/functions/form-assistant/index.ts` | AI form assistance API |
| `scripts/enhance-templates.ts` | Template migration script |

### Files to Modify
| File | Changes |
|------|---------|
| `src/data/letterTemplates.ts` | Extended TemplateField interface |
| `src/components/letter/LetterGenerator.tsx` | Use SmartField, add strength meter |
| All template files in `src/data/templates/` | Add field enhancements |
| `src/pages/LetterPage.tsx` | Add methodology section |
| `supabase/config.toml` | Add form-assistant function |

### Performance Considerations
- AI suggestions are debounced (500ms after typing stops)
- Validation runs client-side first, AI only for complex fields
- Strength meter updates on blur, not keystroke
- Edge function responses cached for identical inputs

---

## Success Metrics

1. **Completion Rate**: % of users who complete all required fields
2. **AI Suggestion Acceptance**: % of AI suggestions users apply
3. **Letter Strength**: Average strength score at submission
4. **Time to Complete**: Average form completion time
5. **Conversion Rate**: % of form completions that convert to purchase

---

## User Experience Flow

1. User lands on template page
2. Sees "AI-Enhanced Template" badge and methodology section
3. Starts filling form with smart validation feedback
4. Gets AI suggestions for description fields
5. Sees evidence checklist for their case type
6. Watches strength meter improve as they add details
7. Reviews AI analysis before purchase
8. Feels confident their letter will be effective
