

# AI Writing Guidelines: Human-Quality Content Generation

## Overview

This plan updates the AI prompts for blog generation to produce content that is indistinguishable from expert human writing - with academic rigor, natural flow, no AI patterns, and proper legal sourcing.

---

## Key Requirements to Implement

| Requirement | Implementation |
|-------------|----------------|
| No patterns | Add explicit anti-pattern rules to prompts |
| Natural flow | Instruct varied sentence structure, occasional imperfections |
| No AI jargon | Blacklist common AI phrases ("delve", "game-changer", etc.) |
| Standard characters only | Prohibit em dashes, en dashes, horizontal rules |
| Academic sourcing | Require citations to legal/authoritative sources |
| CTA integration | Include template recommendation in each article |
| Professional + sarcastic | Allow dry wit for absurd situations |
| Human imperfections | Permit minor stylistic quirks |

---

## Files to Modify

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/siteContext.ts` | Add new `WRITING_STYLE_GUIDELINES` export |
| `supabase/functions/generate-blog-content/index.ts` | Integrate new guidelines into prompts |
| `supabase/functions/bulk-generate-articles/index.ts` | Integrate same guidelines for bulk generation |

---

## Technical Implementation

### 1. New Writing Guidelines Module (siteContext.ts)

Add a comprehensive writing style constant that will be shared across all generation functions:

```typescript
export const WRITING_STYLE_GUIDELINES = `
CRITICAL WRITING RULES - FOLLOW EXACTLY:

=== FORBIDDEN PATTERNS ===
NEVER use these AI-typical phrases:
- "Delve", "delving", "dive into", "diving deep"
- "Game-changer", "groundbreaking", "revolutionary"
- "Navigate", "navigating", "landscape", "realm"
- "Crucial", "vital", "essential" (overused)
- "Unlock", "unleash", "empower"
- "Seamless", "seamlessly", "effortlessly"
- "Robust", "comprehensive", "cutting-edge"
- "It's important to note", "It's worth mentioning"
- "In today's world", "In this day and age"
- "At the end of the day"
- "Let's explore", "Let's take a look"
- Starting sentences with "So," or "Now,"

=== PUNCTUATION RESTRICTIONS ===
ONLY use characters available on a standard US keyboard:
- Use regular hyphens (-) NOT em dashes or en dashes
- Use regular quotation marks (" ") NOT smart quotes
- Use three periods (...) NOT ellipsis character
- NEVER use horizontal rules or decorative dividers
- NEVER use bullet point symbols - use HTML <ul><li> tags

=== ACADEMIC RIGOR ===
For legal and consumer rights content:
- Reference specific laws by full name (e.g., "the Fair Credit Reporting Act, 15 U.S.C. section 1681")
- Cite regulatory agencies with full context (e.g., "the Federal Trade Commission, which enforces consumer protection")
- Reference case law principles when discussing rights
- Mention specific statutory deadlines and requirements
- Source claims from: FTC.gov, CFPB.gov, state attorney general offices, established legal resources
- NEVER make unsourced legal claims - ground everything in actual statutes or regulations

=== NATURAL WRITING STYLE ===
Write like an experienced consumer rights attorney who blogs:
- Vary sentence length dramatically - mix 5-word punches with 30-word explanations
- Start some paragraphs with "And" or "But" - real writers do this
- Use contractions naturally (don't, won't, it's) - stiff writing sounds robotic
- Include an occasional fragment for emphasis. Like this.
- Allow minor imperfections - a slightly awkward phrase is more human than perfection
- Express genuine frustration at unfair business practices - you're allowed to be annoyed
- Use dry humor or light sarcasm when companies behave absurdly
- Address the reader directly ("You might be thinking..." or "Here's the thing...")

=== TONE CALIBRATION ===
Professional but not sterile:
- Skip corporate speak - write like you're explaining to a smart friend
- Show you understand the reader's frustration - they're dealing with companies that wronged them
- Be direct about what works and what doesn't - no hedging everything
- Express appropriate indignation when situations warrant it
- Occasional dry wit is welcome, especially for absurd corporate behavior

=== MANDATORY CTA ===
Every article MUST include:
- A natural mention of Letter Of Dispute's relevant letter templates
- Suggest the specific category that applies (e.g., "our Insurance Claims letter templates")
- Frame it as a helpful tool, not a sales pitch
- Example: "If you've documented these issues and need a formal complaint letter, Letter Of Dispute has templates specifically for this situation in our Insurance Claims category."

=== ANTI-PATTERN VERIFICATION ===
Before outputting, verify:
- No two consecutive sentences start with the same word
- No paragraph follows the exact pattern: statement, explanation, example
- Section transitions vary - don't always summarize then introduce
- Avoid predictable listicle structures - mix formats within the article
`;
```

### 2. Update generate-blog-content/index.ts

Integrate the new guidelines into the system prompt:

```typescript
import { BLOG_WRITER_CONTEXT, SITE_CONFIG, CATEGORIES, WRITING_STYLE_GUIDELINES } from "../_shared/siteContext.ts";

// In the systemPrompt:
const systemPrompt = `${BLOG_WRITER_CONTEXT}

${WRITING_STYLE_GUIDELINES}

CRITICAL OUTPUT REQUIREMENTS:
1. Output ONLY valid JSON - no markdown, no code blocks
2. The "content" field must contain semantic HTML (NOT markdown)
...
`;
```

### 3. Update bulk-generate-articles/index.ts

Same integration for the bulk generation system prompt:

```typescript
import { SITE_CONFIG, CATEGORIES, WRITING_STYLE_GUIDELINES } from "../_shared/siteContext.ts";

// In the systemPrompt inside the loop:
const systemPrompt = `You are an expert consumer rights writer for Letter Of Dispute (${SITE_CONFIG.url}).

${WRITING_STYLE_GUIDELINES}

ABOUT LETTER OF DISPUTE:
...
`;
```

---

## Example Output Comparison

### Before (AI-typical):
> "In today's world, navigating a healthcare billing dispute can feel overwhelming. It's crucial to understand your rights as a consumer. Let's delve into the essential steps you need to take to resolve this seamlessly."

### After (Human-quality):
> "Your hospital sent a bill for $4,200. You have insurance. Something doesn't add up - and you're not imagining it. Under the No Surprises Act, passed in 2022, you have specific protections against balance billing that many hospitals conveniently forget to mention."

---

## Deployment

After changes:
1. Deploy `generate-blog-content` edge function
2. Deploy `bulk-generate-articles` edge function
3. Test by generating a single article and reviewing for compliance

