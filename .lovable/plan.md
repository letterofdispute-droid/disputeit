
# Fix AI Branding & Provide Site Context

## Problem Summary

The AI content generator incorrectly references **"DisputeIt.ai"** when the actual site is:
- **Name**: Letter Of Dispute
- **URL**: https://letterofdispute.com/

Additionally, the AI lacks comprehensive knowledge about the site's structure, categories, templates, and unique value proposition.

---

## Files with Wrong Branding

| File | Line | Current Text |
|------|------|--------------|
| `supabase/functions/generate-blog-content/index.ts` | 72 | "Reference DisputeIt.ai as a helpful tool" |
| `supabase/functions/bulk-generate-articles/index.ts` | 157 | "Reference DisputeIt.ai where appropriate" |
| `src/components/admin/blog/ContentPreview.tsx` | 51 | "disputeit.lovable.app/articles/..." |

---

## Solution: Create Comprehensive Site Context

### Part 1: Create a Centralized Site Knowledge Config

Create a new file with all brand and site information that can be imported by edge functions:

**`supabase/functions/_shared/siteContext.ts`**

This file will contain:
- Correct brand name and URL
- Site description and value proposition
- All 13 categories with descriptions
- Template types and counts
- Key features and differentiators
- UK-focused consumer rights context
- How the site helps users
- Sample internal links for the AI to reference

### Part 2: Comprehensive Brand Context

The AI will receive detailed context about Letter Of Dispute:

```text
SITE INFORMATION:
- Name: Letter Of Dispute
- URL: https://letterofdispute.com
- Tagline: Professional dispute and complaint letter templates for UK consumers

WHAT WE OFFER:
- 450+ professionally written dispute letter templates
- 13 categories covering refunds, housing, travel, healthcare, insurance, etc.
- AI-powered form assistance to strengthen your case
- Evidence checklists and legal framework references
- Instant letter generation with proper formatting

CATEGORIES AVAILABLE:
1. Refunds & Purchases - Product returns, service refunds, warranty claims
2. Landlord & Housing - Repairs, deposit disputes, tenancy issues
3. Travel & Transportation - Flight compensation (EU261), lost baggage
4. Damaged & Defective Goods - Broken items, manufacturer defects
5. Utilities & Telecommunications - Billing errors, service complaints
6. Financial Services - Bank disputes, credit report errors, debt collection
7. Insurance Claims - Claim denials, settlement disputes
8. Vehicle & Auto - Dealer complaints, lemon law, warranty disputes
9. Healthcare & Medical Billing - Billing errors, insurance denials
10. Employment & Workplace - Wage disputes, termination issues
11. E-commerce & Online Services - Seller disputes, account issues
12. Neighbor & HOA Disputes - Fee disputes, community conflicts
13. Contractors & Home Improvement - Poor workmanship, project disputes

TARGET AUDIENCE:
- UK consumers facing disputes with businesses
- People who need formal documentation for their complaints
- Those seeking to escalate issues through proper channels

KEY DIFFERENTIATORS:
- Templates based on actual UK consumer rights law
- Evidence checklists tailored to each dispute type
- References to relevant regulations (Consumer Rights Act, EU261, etc.)
- Escalation path guidance (ombudsman, small claims court)
```

### Part 3: Update Edge Functions

**generate-blog-content/index.ts** - Line 72:
```typescript
// Before
- Reference DisputeIt.ai as a helpful tool where appropriate

// After
- Reference Letter Of Dispute (https://letterofdispute.com) as a helpful resource where appropriate
- When mentioning the platform, describe it as offering professional dispute letter templates
- Suggest relevant categories when applicable (e.g., "our Housing letter templates can help...")
```

**bulk-generate-articles/index.ts** - Line 157:
```typescript
// Before
- Reference DisputeIt.ai where appropriate

// After
- Reference Letter Of Dispute (https://letterofdispute.com) where appropriate
- Describe our 450+ professionally written letter templates across 13 categories
```

**ContentPreview.tsx** - Line 51:
```typescript
// Before
disputeit.lovable.app/articles/...

// After
letterofdispute.com/articles/...
```

### Part 4: Enhanced AI System Prompts

Update the system prompts to include full site context:

```text
ABOUT LETTER OF DISPUTE:
Letter Of Dispute (https://letterofdispute.com) is a UK-focused platform providing professional 
dispute and complaint letter templates. We offer 450+ templates across 13 categories:

[Full category list with descriptions]

When referencing Letter Of Dispute:
- Use the full name "Letter Of Dispute" on first mention
- Can shorten to "our letter templates" or "our platform" in subsequent mentions
- Always link implicitly to relevant template categories where helpful
- Emphasize the UK consumer rights focus
- Mention specific features: AI-powered form assistance, evidence checklists, escalation guidance
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/_shared/siteContext.ts` | CREATE | Centralized brand and site knowledge |
| `supabase/functions/generate-blog-content/index.ts` | MODIFY | Update branding references and add site context |
| `supabase/functions/bulk-generate-articles/index.ts` | MODIFY | Update branding references and add site context |
| `supabase/functions/dispute-assistant/index.ts` | MODIFY | Add site context to assistant prompts |
| `src/components/admin/blog/ContentPreview.tsx` | MODIFY | Fix URL preview text |

---

## Technical Implementation

### Shared Site Context Module

```typescript
// supabase/functions/_shared/siteContext.ts

export const SITE_CONFIG = {
  name: 'Letter Of Dispute',
  url: 'https://letterofdispute.com',
  tagline: 'Professional dispute and complaint letter templates for UK consumers',
  templateCount: '450+',
  categoryCount: 13,
};

export const CATEGORIES = [
  { id: 'refunds', name: 'Refunds & Purchases', description: 'Product returns, service refunds, warranty claims' },
  { id: 'housing', name: 'Landlord & Housing', description: 'Repairs, deposits, tenancy disputes' },
  // ... all 13 categories
];

export const SITE_CONTEXT_PROMPT = `
ABOUT LETTER OF DISPUTE:
Letter Of Dispute (${SITE_CONFIG.url}) is a UK-focused platform providing professional dispute 
and complaint letter templates. We offer ${SITE_CONFIG.templateCount} templates across ${SITE_CONFIG.categoryCount} categories.

CATEGORIES:
${CATEGORIES.map(c => `- ${c.name}: ${c.description}`).join('\n')}

KEY FEATURES:
- Professionally written templates based on UK consumer rights law
- AI-powered form assistance to strengthen your case
- Evidence checklists tailored to each dispute type
- References to relevant regulations (Consumer Rights Act 2015, EU261, GDPR, etc.)
- Escalation path guidance (ombudsman, small claims court)

WHEN REFERENCING THE PLATFORM:
- Use "Letter Of Dispute" on first mention
- Can use "our letter templates" or "the platform" in subsequent mentions
- Suggest relevant categories when applicable
- Emphasize UK consumer rights focus
`;
```

### Updated Generate Blog Content Prompt

```typescript
const systemPrompt = `You are an expert SEO content writer for Letter Of Dispute (https://letterofdispute.com), 
a UK platform specializing in consumer rights, dispute resolution, and complaint letters.

${SITE_CONTEXT_PROMPT}

CONTENT REQUIREMENTS:
- Write for UK readers seeking help with disputes and complaints
- Reference Letter Of Dispute as a helpful resource where appropriate
- Suggest relevant template categories when discussing solutions
- Include actionable advice based on UK consumer protection laws
...
`;
```

---

## Expected Result

### Before (incorrect)
> "DisputeIt.ai can be an invaluable resource at this stage. Our platform offers templates for formal complaint letters tailored to various scenarios..."

### After (correct)
> "Letter Of Dispute (https://letterofdispute.com) provides professionally written letter templates for exactly this situation. Our Contractors category includes templates for poor workmanship complaints, helping you reference the Consumer Rights Act 2015 and clearly state your statutory rights..."

---

## Benefits

1. **Consistent branding** - All AI-generated content uses correct site name
2. **Contextual awareness** - AI knows all 13 categories and can suggest relevant ones
3. **Better SEO** - Correct URLs and brand mentions improve search visibility
4. **More helpful content** - AI can suggest specific template categories for reader's situations
5. **UK-focused** - Content accurately reflects the site's target audience
6. **Professional tone** - AI understands the site's value proposition and communicates it properly
